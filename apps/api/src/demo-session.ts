import { randomBytes } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { LabError } from './errors.js';
export const forgedOrigin = 'http://127.0.0.1:4180';
export const settingsOrigins = new Set(['http://127.0.0.1:5173', 'http://127.0.0.1:4173', 'http://127.0.0.1:3100', 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:3100']);
const cookieName = 'careprobe_demo';
const lifetime = 60 * 60 * 1000;
interface Session { mode: 'secure' | 'vulnerable'; reminder: boolean; csrfToken: string; expires: number }
export function demoSessionRouter() {
  const router = express.Router();
  const sessions = new Map<string, Session>();
  const lookup = (cookie = '') => {
    const id = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    const session = id ? sessions.get(id) : undefined;
    return session && session.expires > Date.now() ? session : undefined;
  };
  router.post('/session', (req, res) => {
    if (!settingsOrigins.has(req.get('Origin') ?? '') || req.get('X-CareProbe-Settings') !== '1') throw new LabError(403, 'SETTINGS_ORIGIN_REQUIRED', 'Gunakan Pengaturan pada aplikasi lokal.');
    const { mode } = z.strictObject({ mode: z.enum(['secure', 'vulnerable']) }).parse(req.body);
    let session = lookup(req.get('Cookie'));
    if (!session) {
      for (const [id, value] of sessions) if (value.expires <= Date.now()) sessions.delete(id);
      if (sessions.size >= 100) throw new LabError(429, 'SESSION_LIMIT', 'Batas sesi demo tercapai. Restart API untuk reset.');
      const id = randomBytes(32).toString('hex');
      session = { mode: 'secure', reminder: false, csrfToken: randomBytes(32).toString('hex'), expires: Date.now() + lifetime };
      sessions.set(id, session);
      // HTTP loopback only: Secure cannot be required on this HTTP demonstration.
      res.cookie(cookieName, id, { httpOnly: true, sameSite: 'lax', path: '/api/demo', maxAge: lifetime });
    }
    session.mode = mode;
    res.json({ mode: session.mode, reminder: session.reminder, csrfToken: session.csrfToken });
  });
  router.get('/session', (req, res) => {
    const session = lookup(req.get('Cookie'));
    if (!session) throw new LabError(401, 'DEMO_SESSION_REQUIRED', 'Buka Pengaturan untuk memulai sesi demo.');
    res.json({ mode: session.mode, reminder: session.reminder, csrfToken: session.csrfToken });
  });
  router.post('/reminder', express.urlencoded({ extended: false, limit: '2kb' }), (req, res) => {
    const session = lookup(req.get('Cookie'));
    if (!session) throw new LabError(401, 'DEMO_SESSION_REQUIRED', 'Sesi demo diperlukan.');
    const input = z.strictObject({ enabled: z.enum(['true', 'false']), csrfToken: z.string().optional() }).parse(req.body);
    const origin = req.get('Origin') ?? '';
    const trusted = settingsOrigins.has(origin);
    if (session.mode === 'secure') {
      if (!trusted || input.csrfToken !== session.csrfToken) throw new LabError(403, 'CSRF_REJECTED', 'Origin atau token CSRF tidak valid.');
    } else if (!trusted && origin !== forgedOrigin) throw new LabError(403, 'CSRF_REJECTED', 'Origin simulasi tidak diizinkan.');
    // DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB: session mode alone permits this fixed-origin form without a token.
    session.reminder = input.enabled === 'true';
    res.json({ mode: session.mode, reminder: session.reminder });
  });
  return router;
}
