import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
const origin = 'http://127.0.0.1:4173';
const forged = 'http://127.0.0.1:4180';
describe('session-bound reminder CSRF', () => {
  it('protects session mode and secure updates, permits only the bounded vulnerable origin', async () => {
    const app = await createApp();
    const victim = request.agent(app);
    const boot = await victim.post('/api/demo/session').set('Origin', origin).set('X-CareProbe-Settings', '1').send({ mode: 'secure' });
    expect(boot.status).toBe(200);
    expect(boot.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(boot.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
    expect(boot.headers['set-cookie'][0]).toMatch(/Path=\/api\/demo/);
    expect(boot.body.reminder).toBe(false);
    for (const token of [undefined, 'invalid']) {
      const r = await victim.post('/api/demo/reminder').set('Origin', origin).send({ enabled: 'true', csrfToken: token });
      expect(r.status).toBe(403);
    }
    const other = await request(app).post('/api/demo/session').set('Origin', origin).set('X-CareProbe-Settings', '1').send({ mode: 'secure' });
    expect((await victim.post('/api/demo/reminder').set('Origin', origin).send({ enabled: 'true', csrfToken: other.body.csrfToken })).status).toBe(403);
    expect((await victim.post('/api/demo/reminder').set('Origin', origin).send({ enabled: 'true', csrfToken: boot.body.csrfToken })).status).toBe(200);
    expect((await victim.get('/api/demo/session')).body.reminder).toBe(true);
    expect((await victim.get('/api/demo/reminder?enabled=false')).status).toBe(404);
    expect((await victim.post('/api/demo/reminder').set('Origin', forged).type('form').send({ enabled: 'false' })).status).toBe(403);
    expect((await victim.get('/api/demo/session')).body.reminder).toBe(true);
    expect((await victim.post('/api/demo/session').set('Origin', forged).send({ mode: 'vulnerable' })).status).toBe(403);
    expect((await victim.post('/api/demo/session').set('Origin', origin).send({ mode: 'vulnerable' })).status).toBe(403);
    await victim.post('/api/demo/session').set('Origin', origin).set('X-CareProbe-Settings', '1').send({ mode: 'vulnerable' });
    expect((await victim.post('/api/demo/reminder').set('Origin', forged).type('form').send({ enabled: 'false' })).status).toBe(200);
    expect((await victim.get('/api/demo/session')).body.reminder).toBe(false);
    expect((await victim.post('/api/demo/reminder').set('Origin', 'http://127.0.0.1:4181').type('form').send({ enabled: 'true' })).status).toBe(403);
    expect((await victim.post('/api/demo/reminder').set('Origin', forged).type('form').send({ enabled: 'true', mode: 'vulnerable' })).status).toBe(400);
    expect((await request(app).post('/api/demo/reminder').set('Origin', origin).send({ enabled: 'true' })).status).toBe(401);
    expect((await request(app).get('/api/demo/session')).status).toBe(401);
  });
});
