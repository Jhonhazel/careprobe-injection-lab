import { scryptSync, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import type { Service } from './database.js';
import { LabError } from './errors.js';
import type { Session } from './demo-session.js';
type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';
type Action = 'view' | 'download' | 'create' | 'review' | 'complete' | 'roles' | 'audit' | 'reset';
interface User { id: string; name: string; role: Role }
type GrantStatus = 'REQUESTED' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
interface DoctorGrant { status: GrantStatus; requestedBy: 'raka'; requestedAt: string; approvedBy?: string; approvedAt?: string; expiresAt?: number }
const grantDurationMs = 5 * 60 * 1000;
interface Record { serviceId?: number; serviceName?: string; createdAt?: string; id: number; ownerPatientId: string; assignedDoctorId: string; status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED'; reason: string }
interface SessionAccess {
  lookup(cookie?: string): Session | undefined;
  rotate(req: express.Request, res: express.Response, userId?: string): Session;
  trusted(origin: string): boolean;
}
const permissions: { [R in Role]: readonly Action[] } = {
  PATIENT: ['view', 'download', 'create'], DOCTOR: ['view', 'download', 'review', 'complete'], ADMIN: ['roles', 'audit', 'reset']
};
// Public educational credential hash, NOT a production credential. No plaintext password in user storage.
const passwordHash = Buffer.from('2134cae3e6bcde552929c42cf70e3b8bf02500b72df1f55568af4333fc1ed98e2435900bd69d2ef95b4e39a8e71c75874ce306cbbbca68b5fc7950a00c0dbaa1', 'hex');
function policy(user: User, action: Action, record: Record | undefined, mode: Session['mode']): string | null {
  // DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB: omit only the doctor role check for review of the patient's own PENDING fixture.
  const patientReview = mode === 'vulnerable' && action === 'review' && user.role === 'PATIENT' && record?.ownerPatientId === user.id;
  if (!permissions[user.role].includes(action) && !patientReview) return 'ROLE_DENIED';
  if (!record) return null;
  if (action === 'view' || action === 'download') {
    // DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB: omit only patient ownership for a direct resource lookup.
    if (user.role === 'PATIENT' && mode === 'secure' && record.ownerPatientId !== user.id) return 'OWNER_DENIED';
    if (user.role === 'DOCTOR' && record.assignedDoctorId !== user.id) return 'ASSIGNMENT_DENIED';
  }
  if (action === 'review' || action === 'complete') {
    if (!patientReview && record.assignedDoctorId !== user.id) return 'ASSIGNMENT_DENIED';
    if (!patientReview && record.ownerPatientId === user.id) return 'DUTY_CONFLICT';
    if (action === 'review' && record.status !== 'PENDING') return 'WORKFLOW_DENIED';
    // DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB: omit only the intermediate-state requirement, never reopen completed records.
    if (action === 'complete' && record.status !== 'IN_REVIEW' && !(mode === 'vulnerable' && record.status === 'PENDING')) return 'WORKFLOW_DENIED';
  }
  return null;
}
export function authorizationRouter(access: SessionAccess, services: Service[]) {
  const router = express.Router();
  const users = new Map<string, User>([
    ['alya', { id: 'alya', name: 'Alya Demo', role: 'PATIENT' }], ['bima', { id: 'bima', name: 'Bima Demo', role: 'PATIENT' }],
    ['raka', { id: 'raka', name: 'Dokter Raka Demo', role: 'DOCTOR' }], ['admin', { id: 'admin', name: 'Admin Demo', role: 'ADMIN' }]
  ]);
  let grant: DoctorGrant | undefined;
  const records = new Map<number, Record>();
  const reset = () => {
    grant = undefined;
    records.clear();
    for (const record of [
      { id: 1001, ownerPatientId: 'alya', assignedDoctorId: 'raka', status: 'PENDING' as const, reason: 'AUTH-A: konsultasi fiktif Alya.' },
      { id: 1002, ownerPatientId: 'bima', assignedDoctorId: 'raka', status: 'PENDING' as const, reason: 'AUTH-B: konsultasi fiktif Bima.' },
      { id: 1003, ownerPatientId: 'bima', assignedDoctorId: 'dokter-lain', status: 'PENDING' as const, reason: 'AUTH-C: ditugaskan ke dokter lain (tanpa akun login).' }
    ]) records.set(record.id, record);
  };
  reset();
  const audit: { timestamp: string; actorId: string; action: string; resourceId: string; allowed: boolean; reason: string }[] = [];
  const log = (actorId: string, action: string, resourceId: string, reason: string | null, allowed = reason === null) => {
    audit.push({ timestamp: new Date(Date.now()).toISOString(), actorId, action, resourceId, allowed, reason: reason ?? 'ALLOWED' });
    if (audit.length > 100) audit.shift();
  };
  // Server time is authoritative; no timer, job, frontend clock or duration parameter.
  const expireGrant = () => {
    if (grant?.status === 'ACTIVE' && Date.now() >= grant.expiresAt!) {
      grant.status = 'EXPIRED';
      log('system', 'privilege-expired', 'raka', 'PRIVILEGE_EXPIRED', true);
    }
  };
  const currentUser = (id: string): User | undefined => {
    expireGrant();
    const base = users.get(id);
    return base ? { ...base, role: id === 'raka' && grant?.status === 'ACTIVE' ? 'DOCTOR' : base.role } : undefined;
  };
  const privilegeView = () => {
    const target = currentUser('raka')!;
    return { target: { ...target, baseRole: users.get('raka')!.role }, durationMinutes: 5,
      grant: grant ? { ...grant, active: grant.status === 'ACTIVE', expiresAt: grant.expiresAt ? new Date(grant.expiresAt).toISOString() : null } : null };
  };
  const session = (req: express.Request) => {
    const value = access.lookup(req.get('Cookie'));
    if (!value) throw new LabError(401, 'DEMO_SESSION_REQUIRED', 'Buka Pengaturan untuk memulai sesi.');
    return value;
  };
  const actor = (req: express.Request) => {
    const value = session(req); const user = value.userId ? currentUser(value.userId) : undefined;
    if (!user) { log('anonymous', req.method, req.path, 'LOGIN_REQUIRED'); throw new LabError(401, 'LOGIN_REQUIRED', 'Masuk dengan akun demo melalui Pengaturan.'); }
    return { user, session: value };
  };
  const authorize = (req: express.Request, action: Action, record?: Record) => {
    const subject = actor(req);
    // DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB: one stale login-time DOCTOR snapshot, ONLY Raka review1002.
    // The normal policy still enforces assignment, creator separation and PENDING; no read/complete/admin bypass.
    const staleReview = subject.session.mode === 'vulnerable' && subject.session.doctorAtLogin === true &&
      subject.user.id === 'raka' && subject.user.role === 'PATIENT' && action === 'review' && record?.id === 1002;
    const policyUser: User = staleReview ? { ...subject.user, role: 'DOCTOR' } : subject.user;
    // Personal application records always enforce the secure policy; lab omissions remain isolated.
    const reason = policy(policyUser, action, record, record?.serviceId === undefined ? subject.session.mode : 'secure');
    log(subject.user.id, action, String(record?.id ?? 'accounts'), reason ?? (staleReview ? 'STALE_DOCTOR_SNAPSHOT' : null), reason === null);
    if (reason) throw new LabError(reason === 'WORKFLOW_DENIED' ? 409 : 403, reason, 'Akses atau tahap konsultasi tidak diizinkan.');
    return subject;
  };
  const lookup = (req: express.Request) => {
    actor(req); // Identity is checked even for unknown IDs.
    z.strictObject({}).parse(req.query);
    const id = Number(z.string().regex(/^[1-9]\d{0,8}$/).parse(req.params.id));
    const value = records.get(id);
    if (!value) throw new LabError(404, 'AUTH_RECORD_NOT_FOUND', 'Record otorisasi tidak ditemukan.');
    return value;
  };
  // Every mutation keeps CSRF protection in BOTH authorization modes, including login/logout/reset.
  router.use((req, _res, next) => {
    if (req.method === 'POST') {
      const value = session(req);
      if (!access.trusted(req.get('Origin') ?? '') || req.get('X-CSRF-Token') !== value.csrfToken) {
        log(value.userId ?? 'anonymous', req.method, req.path, 'CSRF_REJECTED');
        throw new LabError(403, 'CSRF_REJECTED', 'Origin atau token sesi tidak valid.');
      }
    }
    next();
  });
  router.post('/login', (req, res) => {
    const input = z.strictObject({ account: z.enum(['alya', 'bima', 'raka', 'admin']), password: z.string().min(1).max(80) }).parse(req.body);
    if (!timingSafeEqual(scryptSync(input.password, 'careprobe-public-demo-v1', 64), passwordHash)) {
      log('anonymous', 'login', input.account, 'INVALID_CREDENTIALS'); throw new LabError(401, 'INVALID_CREDENTIALS', 'Kredensial demo tidak cocok.');
    }
    const value = access.rotate(req, res, input.account);
    const user = currentUser(input.account)!;
    value.doctorAtLogin = user.id === 'raka' && user.role === 'DOCTOR';
    log(input.account, 'login', input.account, null);
    res.json({ user, csrfToken: value.csrfToken });
  });
  router.post('/logout', (req, res) => {
    const { user } = actor(req); z.strictObject({}).parse(req.body);
    const value = access.rotate(req, res);
    log(user.id, 'logout', user.id, null); res.json({ user: null, csrfToken: value.csrfToken });
  });
  router.get('/', (req, res) => { const value = actor(req); res.json({ user: value.user, mode: value.session.mode }); });
  router.get('/consultations', (req, res) => {
    const { user, session: value } = actor(req);
    if (!permissions[user.role].includes('view')) { authorize(req, 'view'); return; }
    // Lists always use least privilege; IDOR comparison is deliberately limited to direct detail/download.
    const { scope } = z.strictObject({ scope: z.enum(['personal', 'lab']).default('lab') }).parse(req.query);
    const visible = [...records.values()].filter(r => (scope === 'personal' ? r.serviceId !== undefined : r.serviceId === undefined)).filter(r => user.role === 'PATIENT' ? r.ownerPatientId === user.id : r.assignedDoctorId === user.id && r.ownerPatientId !== user.id);
    log(user.id, 'list', 'consultations', null); res.json({ consultations: visible, mode: value.mode });
  });
  router.get('/consultations/:id', (req, res) => { const record = lookup(req); authorize(req, 'view', record); res.json({ consultation: record }); });
  router.get('/consultations/:id/summary', (req, res) => {
    const record = lookup(req); authorize(req, 'download', record);
    res.attachment(`careprobe-auth-${record.id}.txt`).type('text/plain').send(`CareProbe — Data otorisasi fiktif\nID: ${record.id}\nPemilik: ${record.ownerPatientId}\nStatus: ${record.status}\nLayanan: ${record.serviceName ?? 'Fixture laboratorium'}\nTanggal: ${record.createdAt ?? '-'}\nAlasan: ${record.reason}\n`);
  });
  router.post('/consultations', (req, res) => {
    const { user } = authorize(req, 'create');
    const { reason, serviceId } = z.strictObject({ reason: z.string().trim().min(3).max(200), serviceId: z.number().int().positive().optional() }).parse(req.body);
    const service = serviceId === undefined ? undefined : services.find(row => row.id === serviceId);
    if (serviceId !== undefined && !service) throw new LabError(404, 'SERVICE_NOT_FOUND', 'Layanan tidak ditemukan.');
    if (records.size >= 100) throw new LabError(429, 'RECORD_LIMIT', 'Reset fixture melalui Admin.');
    const record: Record = { id: Math.max(...records.keys()) + 1, ownerPatientId: user.id, assignedDoctorId: 'raka', status: 'PENDING', reason, ...(service ? { serviceId: service.id, serviceName: service.name, createdAt: new Date(Date.now()).toISOString() } : {}) };
    records.set(record.id, record); res.status(201).json({ consultation: record });
  });
  router.post('/consultations/:id/transition', (req, res) => {
    const record = lookup(req); const { action } = z.strictObject({ action: z.enum(['review', 'complete']) }).parse(req.body);
    authorize(req, action, record); record.status = action === 'review' ? 'IN_REVIEW' : 'COMPLETED'; res.json({ consultation: record });
  });
  router.get('/accounts', (req, res) => { authorize(req, 'roles'); res.json({ users: [...users.keys()].map(id => currentUser(id)!) }); });
  router.post('/roles', (req, res) => {
    const { user } = authorize(req, 'roles');
    // Only this fictional doctor's role may change. Never assign ADMIN or change the administrator itself.
    const { account, role } = z.strictObject({ account: z.literal('raka'), role: z.enum(['DOCTOR', 'PATIENT']) }).parse(req.body);
    if (grant?.status === 'ACTIVE' || grant?.status === 'REQUESTED') {
      grant.status = 'REVOKED'; log(user.id, 'privilege-revoked', account, 'PRIVILEGE_REVOKED', true);
    }
    users.get(account)!.role = role; log(user.id, 'role-change', account, null); res.json({ user: users.get(account) });
  });
  router.get('/privilege', (req, res) => {
    const { user } = actor(req);
    if (user.id !== 'raka' && user.role !== 'ADMIN') {
      log(user.id, 'privilege-review', 'raka', 'ROLE_DENIED');
      throw new LabError(403, 'ROLE_DENIED', 'Hanya Raka dan Admin dapat melihat grant ini.');
    }
    log(user.id, 'privilege-review', 'raka', null);
    res.json(privilegeView());
  });
  router.post('/privilege', (req, res) => {
    const { user } = actor(req);
    const { action } = z.strictObject({ action: z.enum(['request', 'approve', 'reject', 'revoke']) }).parse(req.body);
    const fail = (status: number, code: string, message: string): never => {
      log(user.id, `privilege-${action}`, 'raka', code); throw new LabError(status, code, message);
    };
    if (action === 'request') {
      if (user.id !== 'raka') fail(403, 'ROLE_DENIED', 'Permintaan ini hanya untuk Raka.');
      if (user.role !== 'PATIENT' || grant?.status === 'REQUESTED' || grant?.status === 'ACTIVE') fail(409, 'GRANT_CONFLICT', 'Hak dokter sudah tersedia atau permintaan masih diproses.');
      grant = { status: 'REQUESTED', requestedBy: 'raka', requestedAt: new Date(Date.now()).toISOString() };
      log(user.id, 'privilege-request', 'raka', 'PRIVILEGE_REQUESTED', true);
      res.status(201).json(privilegeView()); return;
    }
    authorize(req, 'roles'); // Only the current ADMIN may approve, reject or revoke. Never the requestor.
    if (!grant) return fail(409, 'GRANT_CONFLICT', 'Belum ada permintaan.');
    if (action === 'revoke') {
      if (grant.status !== 'ACTIVE') fail(409, 'GRANT_CONFLICT', 'Grant tidak aktif.');
      grant.status = 'REVOKED'; log(user.id, 'privilege-revoked', 'raka', 'PRIVILEGE_REVOKED', true);
    } else {
      if (grant.status !== 'REQUESTED') fail(409, 'GRANT_CONFLICT', 'Permintaan tidak sedang menunggu persetujuan.');
      if (action === 'reject') {
        grant.status = 'REJECTED'; log(user.id, 'privilege-rejected', 'raka', 'PRIVILEGE_REJECTED', true);
      } else {
        log(user.id, 'privilege-approved', 'raka', 'PRIVILEGE_APPROVED', true);
        grant.status = 'ACTIVE'; grant.approvedBy = user.id; grant.approvedAt = new Date(Date.now()).toISOString();
        grant.expiresAt = Date.now() + grantDurationMs;
        log(user.id, 'privilege-granted', 'raka', 'PRIVILEGE_GRANTED', true);
      }
    }
    res.json(privilegeView());
  });
  router.get('/audit', (req, res) => { authorize(req, 'audit'); res.json({ decisions: [...audit] }); });
  router.post('/reset', (req, res) => {
    const { user } = authorize(req, 'reset'); z.strictObject({}).parse(req.body);
    reset(); users.get('raka')!.role = 'DOCTOR'; log(user.id, 'reset', 'fixtures-and-raka-role', null);
    res.json({ reset: true });
  });
  return router;
}
