import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
const origin = 'http://127.0.0.1:4173';
describe('authorization authentication', () => {
  it('requires a verified identity, token and rotated session', async () => {
    const app = await createApp(); const agent = request.agent(app);
    const boot = await agent.post('/api/demo/session').set('Origin', origin).set('X-CareProbe-Settings', '1').send({mode:'secure'});
    expect((await agent.get('/api/demo/auth/consultations/1001')).status).toBe(401);
    const login = await agent.post('/api/demo/auth/login').set('Origin', origin).set('X-CSRF-Token',boot.body.csrfToken).send({account:'alya',password:'CareProbeDemo!2026'});
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie'][0]).not.toBe(boot.headers['set-cookie'][0]);
    expect(login.body.user.role).toBe('PATIENT');
    expect((await agent.get('/api/demo/auth/consultations/1001')).status).toBe(200);
    expect((await agent.get('/api/demo/auth/consultations/1002')).status).toBe(403);
  });
});

async function browser(app: Awaited<ReturnType<typeof createApp>>, account: 'alya'|'bima'|'raka'|'admin', mode: 'secure'|'vulnerable' = 'secure') {
  const agent = request.agent(app);
  const boot = await agent.post('/api/demo/session').set('Origin', origin).set('X-CareProbe-Settings','1').send({mode});
  const login = await agent.post('/api/demo/auth/login').set('Origin',origin).set('X-CSRF-Token',boot.body.csrfToken).send({account,password:'CareProbeDemo!2026'});
  expect(login.status).toBe(200);
  const post = (path: string, body: object) => agent.post('/api/demo/auth'+path).set('Origin',origin).set('X-CSRF-Token',login.body.csrfToken).send(body);
  return {agent,post,token:login.body.csrfToken, cookie:login.headers['set-cookie'][0].split(';')[0]};
}
describe.each(['secure','vulnerable'] as const)('bounded authorization policy: %s', mode => {
  it('enforces identity and bounds IDOR to patient detail/download', async () => {
    const app=await createApp(); const a=await browser(app,'alya',mode); const b=await browser(app,'bima',mode);
    expect((await a.agent.get('/api/demo/auth/consultations')).body.consultations.map((r:{id:number})=>r.id)).toEqual([1001]);
    expect((await b.agent.get('/api/demo/auth/consultations/1002')).body.consultation.ownerPatientId).toBe('bima');
    const other=await a.agent.get('/api/demo/auth/consultations/1002');
    expect(other.status).toBe(mode==='secure'?403:200);
    if(mode==='vulnerable') expect(other.body.consultation.reason).toContain('AUTH-B');
    expect((await a.agent.get('/api/demo/auth/consultations/1002/summary')).status).toBe(mode==='secure'?403:200);
    expect((await a.agent.get('/api/demo/auth/consultations/9999')).status).toBe(404);
    expect((await a.agent.get('/api/demo/auth/consultations/1002?mode=vulnerable')).status).toBe(400);
    expect((await request(app).get('/api/demo/auth/consultations/1001')).status).toBe(401);
    expect((await request(app).get('/api/demo/auth/consultations/1001').set('Cookie','careprobe_demo=fake')).status).toBe(401);
    const legacy=await request(app).get('/api/consultations');
    expect(JSON.stringify(legacy.body)).not.toContain('AUTH-A');
    expect((await request(app).post('/api/consultations/1001/export').send({})).status).toBe(404);
  });
  it('limits forced browsing to review of own PENDING fixture', async () => {
    const app=await createApp();const a=await browser(app,'alya',mode);const d=await browser(app,'raka',mode);
    const action=await a.post('/consultations/1001/transition',{action:'review'});
    expect(action.status).toBe(mode==='secure'?403:200);
    expect((await a.agent.get('/api/demo/auth/consultations/1001')).body.consultation.status).toBe(mode==='secure'?'PENDING':'IN_REVIEW');
    expect((await a.post('/consultations/1001/transition',{action:'complete'})).status).toBe(403);
    expect((await a.post('/consultations/1002/transition',{action:'review'})).status).toBe(403);
    expect((await d.post('/consultations/1003/transition',{action:'review'})).status).toBe(403);
    expect((await d.agent.get('/api/demo/auth/consultations/1003')).status).toBe(403);
    expect((await d.post('/consultations/1002/transition',{action:'review'})).status).toBe(200);
    expect((await d.post('/consultations/1002/transition',{action:'complete'})).status).toBe(200);
    expect((await d.post('/consultations/1002/transition',{action:'review'})).status).toBe(409);
    expect((await d.agent.get('/api/demo/auth/consultations/1002')).body.consultation.status).toBe('COMPLETED');
  });
  it('compares skipping the intermediate state without reopening completed records', async () => {
    const app=await createApp();const d=await browser(app,'raka',mode);
    expect((await d.post('/consultations/1001/transition',{action:'complete'})).status).toBe(mode==='secure'?409:200);
    expect((await d.agent.get('/api/demo/auth/consultations/1001')).body.consultation.status).toBe(mode==='secure'?'PENDING':'COMPLETED');
    if(mode==='secure') {
      expect((await d.post('/consultations/1001/transition',{action:'review'})).status).toBe(200);
      expect((await d.post('/consultations/1001/transition',{action:'complete'})).status).toBe(200);
    }
    expect((await d.post('/consultations/1001/transition',{action:'complete'})).status).toBe(409);
  });
  it('keeps admin least privilege, live revocation and separation of duties', async () => {
    const app=await createApp();const a=await browser(app,'alya',mode);const d=await browser(app,'raka',mode);const admin=await browser(app,'admin',mode);
    expect((await a.post('/roles',{account:'alya',role:'ADMIN'})).status).toBe(403);
    expect((await a.post('/reset',{})).status).toBe(403);
    expect((await admin.agent.get('/api/demo/auth/consultations/1001')).status).toBe(403);
    expect((await admin.post('/roles',{account:'admin',role:'PATIENT'})).status).toBe(400);
    expect((await admin.post('/roles',{account:'raka',role:'ADMIN'})).status).toBe(400);
    expect((await admin.post('/roles',{account:'raka',role:'PATIENT'})).status).toBe(200);
    expect((await d.agent.get('/api/demo/auth')).body.user.role).toBe('PATIENT');
    expect((await d.post('/consultations/1001/transition',{action:'review'})).status).toBe(403);
    const created=await d.post('/consultations',{reason:'Demo setelah perubahan peran.'});
    expect(created.status).toBe(201);
    expect(created.body.consultation.ownerPatientId).toBe('raka');
    await admin.post('/roles',{account:'raka',role:'DOCTOR'});
    expect((await d.post(`/consultations/${created.body.consultation.id}/transition`,{action:'review'})).body.error.code).toBe('DUTY_CONFLICT');
    expect((await admin.post('/reset',{})).status).toBe(200);
    expect((await d.agent.get('/api/demo/auth/consultations/1001')).body.consultation.status).toBe('PENDING');
    const audit=await admin.agent.get('/api/demo/auth/audit');
    expect(audit.status).toBe(200);expect(audit.body.decisions.some((r:{reason:string})=>r.reason==='ROLE_DENIED')).toBe(true);
    expect(JSON.stringify(audit.body)).not.toMatch(/csrfToken|password|careprobe_demo/);
  });
  it('preserves CSRF on every mutation and rejects client role/ownership fields', async () => {
    const app=await createApp();const a=await browser(app,'alya',mode);
    for(const path of ['/consultations/1001/transition','/logout','/roles','/reset','/login','/consultations','/privilege']) {
      expect((await a.agent.post('/api/demo/auth'+path).set('Origin',origin).send({})).status).toBe(403);
      expect((await a.agent.post('/api/demo/auth'+path).set('Origin','http://127.0.0.1:4180').set('X-CSRF-Token',a.token).send({})).status).toBe(403);
    }
    expect((await a.post('/consultations',{reason:'Fiktif',ownerPatientId:'bima'})).status).toBe(400);
    expect((await a.post('/consultations',{reason:'Fiktif',role:'ADMIN'})).status).toBe(400);
    expect((await a.post('/consultations/1001/transition',{action:'review',mode:'vulnerable'})).status).toBe(400);
    expect((await a.agent.get('/api/demo/auth/consultations/1001')).body.consultation.status).toBe('PENDING');
    expect((await a.agent.get('/api/demo/auth/reset')).status).toBe(404);
  });
});

it('rotates identity on account switching/logout and expires the session', async () => {
  const app=await createApp();const a=await browser(app,'alya');
  const switched=await a.post('/login',{account:'bima',password:'CareProbeDemo!2026'});
  expect(switched.status).toBe(200);
  expect((await a.agent.get('/api/demo/auth')).body.user.id).toBe('bima');
  expect((await request(app).get('/api/demo/auth').set('Cookie',a.cookie)).status).toBe(401);
  expect((await a.agent.post('/api/demo/auth/logout').set('Origin',origin).set('X-CSRF-Token',switched.body.csrfToken).send({})).status).toBe(200);
  expect((await a.agent.get('/api/demo/auth')).status).toBe(401);
  const d=await browser(app,'raka'); const now=Date.now();
  const clock=vi.spyOn(Date,'now').mockReturnValue(now+3600001);
  try { expect((await d.agent.get('/api/demo/auth')).status).toBe(401); } finally { clock.mockRestore(); }
});
it('rejects wrong credentials and spoofed login fields', async () => {
  const app=await createApp();const a=await browser(app,'alya');
  expect((await a.post('/login',{account:'admin',password:'incorrect'})).status).toBe(401);
  expect((await a.post('/login',{account:'alya',password:'CareProbeDemo!2026',role:'ADMIN'})).status).toBe(400);
  expect((await a.agent.get('/api/demo/auth')).body.user.id).toBe('alya');
});

describe('temporary privilege lifecycle',()=>{
  it('requires Raka request and Admin approval before doctor privilege becomes active',async()=>{
    const app=await createApp();const d=await browser(app,'raka');const admin=await browser(app,'admin');const a=await browser(app,'alya');
    await admin.post('/roles',{account:'raka',role:'PATIENT'});
    expect((await a.post('/privilege',{action:'request'})).status).toBe(403);
    expect((await d.post('/privilege',{action:'request'})).status).toBe(201);
    expect((await d.agent.get('/api/demo/auth/privilege')).body.grant.status).toBe('REQUESTED');
    expect((await d.agent.get('/api/demo/auth')).body.user.role).toBe('PATIENT');
    expect((await d.post('/privilege',{action:'approve'})).status).toBe(403);
    const approved=await admin.post('/privilege',{action:'approve'});
    expect(approved.status).toBe(200);expect(approved.body.grant.status).toBe('ACTIVE');
    expect(approved.body.grant.approvedBy).toBe('admin');
    expect((await d.agent.get('/api/demo/auth')).body.user.role).toBe('DOCTOR');
    expect((await d.post('/consultations/1001/transition',{action:'review'})).status).toBe(200);
    expect((await admin.agent.get('/api/demo/auth/privilege')).body.grant.active).toBe(true);
    expect((await admin.post('/privilege',{action:'revoke'})).status).toBe(200);
    expect((await d.agent.get('/api/demo/auth')).body.user.role).toBe('PATIENT');
    expect((await d.post('/consultations/1002/transition',{action:'review'})).status).toBe(403);
    const audit=(await admin.agent.get('/api/demo/auth/audit')).body.decisions;
    for(const code of ['PRIVILEGE_REQUESTED','PRIVILEGE_APPROVED','PRIVILEGE_GRANTED','PRIVILEGE_REVOKED']) expect(audit.some((r:{reason:string})=>r.reason===code)).toBe(true);
  });
});

it.each(['secure','vulnerable'] as const)('stale doctor permission is confined to review1002 after revocation: %s',async mode=>{
  const app=await createApp();const d=await browser(app,'raka',mode);const admin=await browser(app,'admin');const b=await browser(app,'bima');
  await admin.post('/roles',{account:'raka',role:'PATIENT'});
  expect((await d.agent.get('/api/demo/auth')).body.user.role).toBe('PATIENT');
  expect((await d.post('/consultations/1003/transition',{action:'review'})).status).toBe(403);
  expect((await d.post('/consultations/1001/transition',{action:'review'})).status).toBe(403);
  expect((await d.post('/consultations/1002/transition',{action:'complete'})).status).toBe(403);
  expect((await d.post('/roles',{account:'raka',role:'DOCTOR'})).status).toBe(403);
  const result=await d.post('/consultations/1002/transition',{action:'review'});
  expect(result.status).toBe(mode==='secure'?403:200);
  expect((await b.agent.get('/api/demo/auth/consultations/1002')).body.consultation.status).toBe(mode==='secure'?'PENDING':'IN_REVIEW');
  expect((await d.agent.get('/api/demo/auth/accounts')).status).toBe(403);
  expect((await d.agent.get('/api/demo/auth/consultations/1002')).status).toBe(mode==='secure'?403:200); // Existing patient IDOR is separate; stale snapshot never grants reading.
  const adminReset=await admin.post('/reset',{});expect(adminReset.status).toBe(200);
  // Revoke again; a new login must not inherit the old snapshot.
  await admin.post('/roles',{account:'raka',role:'PATIENT'});
  const newLogin=await d.post('/login',{account:'raka',password:'CareProbeDemo!2026'});
  expect(newLogin.status).toBe(200);
  expect((await d.agent.post('/api/demo/auth/consultations/1002/transition').set('Origin',origin).set('X-CSRF-Token',newLogin.body.csrfToken).send({action:'review'})).status).toBe(403);
});

it.each(['secure','vulnerable'] as const)('expires grants on server time and bounds stale expiry permission: %s',async mode=>{
  const app=await createApp();const admin=await browser(app,'admin');const d=await browser(app,'raka',mode);const b=await browser(app,'bima');
  await admin.post('/roles',{account:'raka',role:'PATIENT'});
  await d.post('/privilege',{action:'request'});
  const approved=await admin.post('/privilege',{action:'approve'});
  const expiry=Date.parse(approved.body.grant.expiresAt);
  const active=await browser(app,'raka',mode); // Snapshot is taken only by actual login while DOCTOR is active.
  const clock=vi.spyOn(Date,'now').mockReturnValue(expiry-1);
  try {
    expect((await active.agent.get('/api/demo/auth')).body.user.role).toBe('DOCTOR');
    expect((await active.post('/consultations/1001/transition',{action:'review'})).status).toBe(200);
    clock.mockReturnValue(expiry);
    expect((await active.agent.get('/api/demo/auth')).body.user.role).toBe('PATIENT');
    const review=await admin.agent.get('/api/demo/auth/privilege');
    expect(review.body.grant).toMatchObject({status:'EXPIRED',active:false});
    expect(Date.parse(review.body.grant.expiresAt)).toBe(expiry);
    expect((await active.post('/consultations/1002/transition',{action:'review'})).status).toBe(mode==='secure'?403:200);
    expect((await b.agent.get('/api/demo/auth/consultations/1002')).body.consultation.status).toBe(mode==='secure'?'PENDING':'IN_REVIEW');
    expect((await active.post('/consultations/1001/transition',{action:'complete'})).status).toBe(403);
    const audit=(await admin.agent.get('/api/demo/auth/audit')).body.decisions;
    expect(audit.filter((r:{reason:string})=>r.reason==='PRIVILEGE_EXPIRED')).toHaveLength(1);
    if(mode==='vulnerable') expect(audit.some((r:{reason:string;allowed:boolean})=>r.reason==='STALE_DOCTOR_SNAPSHOT'&&r.allowed)).toBe(true);
  } finally { clock.mockRestore(); }
});
it('supports rejection, re-request and deterministic reset without arbitrary grants',async()=>{
  const app=await createApp();const admin=await browser(app,'admin');const d=await browser(app,'raka');const a=await browser(app,'alya');
  expect((await d.post('/privilege',{action:'request'})).status).toBe(409); // Already DOCTOR.
  await admin.post('/roles',{account:'raka',role:'PATIENT'});
  expect((await a.agent.get('/api/demo/auth/privilege')).status).toBe(403);
  expect((await d.post('/privilege',{action:'request',role:'ADMIN'})).status).toBe(400);
  expect((await d.post('/privilege',{action:'request',durationMinutes:999})).status).toBe(400);
  expect((await admin.post('/privilege',{action:'approve'})).status).toBe(409);
  await d.post('/privilege',{action:'request'});
  expect((await d.post('/privilege',{action:'request'})).status).toBe(409);
  expect((await admin.post('/privilege',{action:'reject'})).body.grant.status).toBe('REJECTED');
  expect((await d.agent.get('/api/demo/auth')).body.user.role).toBe('PATIENT');
  await d.post('/privilege',{action:'request'});
  await admin.post('/privilege',{action:'approve'});
  expect((await admin.post('/privilege',{action:'approve'})).status).toBe(409);
  expect((await admin.post('/roles',{account:'raka',role:'PATIENT'})).status).toBe(200);
  expect((await admin.agent.get('/api/demo/auth/privilege')).body.grant.status).toBe('REVOKED');
  await admin.post('/reset',{});
  expect((await admin.agent.get('/api/demo/auth/privilege')).body.grant).toBeNull();
  expect((await d.agent.get('/api/demo/auth')).body.user.role).toBe('DOCTOR');
});
it('removes the stale snapshot on logout, account switching and session expiration',async()=>{
  const app=await createApp();const admin=await browser(app,'admin');const d=await browser(app,'raka','vulnerable');
  await admin.post('/roles',{account:'raka',role:'PATIENT'});
  const out=await d.post('/logout',{});expect(out.status).toBe(200);
  expect((await request(app).post('/api/demo/auth/consultations/1002/transition').set('Origin',origin).set('Cookie',d.cookie).set('X-CSRF-Token',d.token).send({action:'review'})).status).toBe(401);
  expect((await d.agent.post('/api/demo/auth/consultations/1002/transition').set('Origin',origin).set('X-CSRF-Token',out.body.csrfToken).send({action:'review'})).status).toBe(401);
  await admin.post('/reset',{});
  const old=await browser(app,'raka','vulnerable');
  const switched=await old.post('/login',{account:'alya',password:'CareProbeDemo!2026'});
  await admin.post('/roles',{account:'raka',role:'PATIENT'});
  expect((await old.agent.post('/api/demo/auth/consultations/1002/transition').set('Origin',origin).set('X-CSRF-Token',switched.body.csrfToken).send({action:'review'})).status).toBe(403); // Alya cannot inherit Raka's old doctor snapshot for Bima's fixture.
  expect((await old.agent.get('/api/demo/auth')).body.user.id).toBe('alya');
  await admin.post('/reset',{});const expired=await browser(app,'raka','vulnerable');await admin.post('/roles',{account:'raka',role:'PATIENT'});
  const now=Date.now();const clock=vi.spyOn(Date,'now').mockReturnValue(now+3600001);
  try { expect((await expired.post('/consultations/1002/transition',{action:'review'})).status).toBe(401); } finally { clock.mockRestore(); }
});

it.each(['secure','vulnerable'] as const)('demonstrates creator/reviewer duties using a consultation actually created by Alya: %s',async mode=>{
  const app=await createApp();const a=await browser(app,'alya',mode);
  const created=await a.post('/consultations',{reason:'Fixture baru untuk pengujian pemisahan tugas.'});
  expect(created.status).toBe(201);expect(created.body.consultation.ownerPatientId).toBe('alya');
  const id=created.body.consultation.id;
  expect((await a.post(`/consultations/${id}/transition`,{action:'review'})).status).toBe(mode==='secure'?403:200);
  expect((await a.agent.get(`/api/demo/auth/consultations/${id}`)).body.consultation.status).toBe(mode==='secure'?'PENDING':'IN_REVIEW');
});

describe.each(['secure','vulnerable'] as const)('personal application boundary: %s', mode => {
  it('binds the SQLite service and owner, scopes lists and protects normal data even in lab mode', async () => {
    const app=await createApp();const a=await browser(app,'alya',mode);const b=await browser(app,'bima',mode);const d=await browser(app,'raka',mode);const admin=await browser(app,'admin',mode);
    expect((await request(app).get('/api/demo/auth/consultations?scope=personal')).status).toBe(401);
    expect((await a.agent.get('/api/demo/auth/consultations?scope=personal')).body.consultations).toEqual([]);
    const created=await a.post('/consultations',{serviceId:2,reason:'Permintaan pribadi fiktif untuk gigi.'});
    expect(created.status).toBe(201);const row=created.body.consultation;
    expect(row).toMatchObject({ownerPatientId:'alya',serviceId:2,serviceName:'Pemeriksaan Gigi',status:'PENDING'});
    expect(row.createdAt).toEqual(expect.any(String));
    expect((await a.agent.get('/api/demo/auth/consultations?scope=personal')).body.consultations.map((r:{id:number})=>r.id)).toEqual([row.id]);
    expect((await b.agent.get('/api/demo/auth/consultations?scope=personal')).body.consultations).toEqual([]);
    expect((await a.agent.get('/api/demo/auth/consultations')).body.consultations.map((r:{id:number})=>r.id)).toEqual([1001]);
    expect((await b.agent.get('/api/demo/auth/consultations/'+row.id)).status).toBe(403);
    expect((await b.agent.get('/api/demo/auth/consultations/'+row.id+'/summary')).status).toBe(403);
    expect((await a.post('/consultations/'+row.id+'/transition',{action:'review'})).status).toBe(403);
    expect((await admin.agent.get('/api/demo/auth/consultations?scope=personal')).status).toBe(403);
    expect((await admin.agent.get('/api/demo/auth/consultations/'+row.id)).status).toBe(403);
    expect((await d.post('/consultations/'+row.id+'/transition',{action:'complete'})).status).toBe(409);
    expect((await d.post('/consultations/'+row.id+'/transition',{action:'review'})).status).toBe(200);
    expect((await d.post('/consultations/'+row.id+'/transition',{action:'complete'})).status).toBe(200);
    const summary=await a.agent.get('/api/demo/auth/consultations/'+row.id+'/summary');
    expect(summary.status).toBe(200);expect(summary.text).toContain('Pemeriksaan Gigi');expect(summary.text).toContain('COMPLETED');
    expect(JSON.stringify((await request(app).get('/api/consultations')).body)).not.toContain(row.reason);
    expect((await request(app).get('/api/consultations/'+row.id+'/export')).status).toBe(404);
    await admin.post('/roles',{account:'raka',role:'PATIENT'});
    expect((await d.agent.get('/api/demo/auth/consultations?scope=personal')).body.consultations).toEqual([]);
    expect((await d.post('/consultations/'+row.id+'/transition',{action:'review'})).status).toBe(403);
  });
  it('rejects forged service/owner metadata and invalid scopes without storing a normal consultation', async () => {
    const app=await createApp();const a=await browser(app,'alya',mode);
    expect((await a.post('/consultations',{serviceId:999,reason:'Layanan tidak ada.'})).status).toBe(404);
    for (const input of [{serviceId:2,patientName:'Bima',reason:'Fiktif'}, {serviceId:2,ownerPatientId:'bima',reason:'Fiktif'}, {serviceId:2,serviceName:'Palsu',reason:'Fiktif'}, {serviceId:'2',reason:'Fiktif'}]) expect((await a.post('/consultations',input)).status).toBe(400);
    expect((await a.agent.get('/api/demo/auth/consultations?scope=all')).status).toBe(400);
    expect((await a.agent.get('/api/demo/auth/consultations?scope=personal')).body.consultations).toEqual([]);
  });
});
it('does not carry the previous account reminder into another login',async()=>{
  const app=await createApp();const a=await browser(app,'alya');
  await a.agent.post('/api/demo/reminder').set('Origin',origin).send({enabled:'true',csrfToken:a.token});
  expect((await a.agent.get('/api/demo/session')).body.reminder).toBe(true);
  await a.post('/login',{account:'bima',password:'CareProbeDemo!2026'});
  expect((await a.agent.get('/api/demo/session')).body.reminder).toBe(false);
});
