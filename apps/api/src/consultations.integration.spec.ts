import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from './app.js';

describe('URL query summary export on the host', () => {
  let app: Express;
  beforeAll(async () => { app = await createApp(); });
  it.each(['secure', 'vulnerable'])('blocks normal GET %s outside the sandbox', async (mode) => {
    const response = await request(app).get(`/api/consultations/2/export?documentTitle=ringkasan-konsultasi&mode=${mode}`);
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SANDBOX_REQUIRED');
    expect(response.headers['content-disposition']).toBeUndefined();
  });
  it('keeps the decoded URL marker behind the Docker gate', async () => {
    const response = await request(app).get('/api/consultations/2/export?documentTitle=clinic-demo%3B%20printf%20LAB_MARKER&mode=vulnerable');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SANDBOX_REQUIRED');
  });
  it.each(['&mode=secure', '', '&mode=invalid', '&mode=secure&mode=vulnerable'])('rejects the marker with secure fallback: %s', async (suffix) => {
    const response = await request(app).get(`/api/consultations/2/export?documentTitle=clinic-demo%3B%20printf%20LAB_MARKER${suffix}`);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.headers['content-disposition']).toBeUndefined();
  });
  it.each(['0', '-1', 'abc', '1.5', '01'])('rejects invalid URL record ID %s', async (id) => {
    expect((await request(app).get(`/api/consultations/${id}/export`)).status).toBe(400);
  });
  it('returns a controlled 404 for a missing consultation', async () => {
    const response = await request(app).get('/api/consultations/999/export');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('CONSULTATION_NOT_FOUND');
  });
  it.each([
    'documentTitle=', `documentTitle=${'a'.repeat(81)}`, `documentTitle=${'a'.repeat(41)}`,
    'documentTitle=one&documentTitle=two', 'documentTitle=judul%0A',
    'documentTitle=clinic-demo%3B%20echo%20LAB_MARKER',
    'documentTitle=clinic-demo%253B%2520printf%2520LAB_MARKER',
    'documentTitle=normal&extra=ignored'
  ])('rejects malformed query input without executing: %s', async (query) => {
    const response = await request(app).get(`/api/consultations/2/export?mode=vulnerable&${query}`);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.headers['content-disposition']).toBeUndefined();
  });
});

describe('consultation persistence in the existing SQLite database', () => {
  let app: Express;
  beforeAll(async () => { app = await createApp(); });
  const valid = { serviceId: 2, patientName: 'Rani Demo', reason: 'Simulasi konsultasi gigi.' };

  it('lists seeded fictional consultations with their service names', async () => {
    const response = await request(app).get('/api/consultations');
    expect(response.status).toBe(200);
    expect(response.body.consultations).toHaveLength(2);
    expect(response.body.consultations[0]).toMatchObject({ serviceName: 'Pemeriksaan Gigi', status: 'PENDING' });
  });
  it('persists a submitted request and returns it in history', async () => {
    const response = await request(app).post('/api/consultations').send(valid);
    expect(response.status).toBe(201);
    expect(response.body.consultation).toMatchObject({ id: 3, ...valid, serviceName: 'Pemeriksaan Gigi', status: 'PENDING' });
    expect(new Date(response.body.consultation.createdAt).toISOString()).toBe(response.body.consultation.createdAt);
    const history = await request(app).get('/api/consultations');
    expect(history.body.consultations[0]).toEqual(response.body.consultation);
  });
  it('binds quotes and HTML-like reason as data without changing records or schema', async () => {
    const data = { ...valid, patientName: "Demo O'Rin", reason: '<img src=x> Contoh fiktif.' };
    const created = await request(app).post('/api/consultations').send(data);
    expect(created.status).toBe(201);
    expect(created.body.consultation).toMatchObject(data);
    expect((await request(app).get('/api/services')).body.count).toBe(6);
  });
  it.each([
    {}, { ...valid, serviceId: 0 }, { ...valid, serviceId: '2' },
    { ...valid, patientName: ' ' }, { ...valid, patientName: 'a'.repeat(61) },
    { ...valid, reason: ' ' }, { ...valid, reason: 'a'.repeat(501) },
    { ...valid, status: 'APPROVED' }
  ])('rejects invalid consultation fields: %j', async (data) => {
    const before = (await request(app).get('/api/consultations')).body.consultations;
    const response = await request(app).post('/api/consultations').send(data);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect((await request(app).get('/api/consultations')).body.consultations).toEqual(before);
  });
  it('rejects an unknown service instead of creating an orphaned consultation', async () => {
    const response = await request(app).post('/api/consultations').send({ ...valid, serviceId: 999 });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('SERVICE_NOT_FOUND');
  });
  it('keeps vulnerable search read-only after a legitimate consultation insert', async () => {
    const before = (await request(app).get('/api/consultations')).body.consultations;
    const response = await request(app).get('/api/services').query({ mode: 'vulnerable', keyword: "'; DELETE FROM consultations; -- " });
    expect(response.status).toBe(400);
    expect((await request(app).get('/api/consultations')).body.consultations).toEqual(before);
    expect((await request(app).get('/api/services').query({ mode: 'vulnerable', keyword: "' OR 1=1 -- " })).body.count).toBe(6);
    expect((await request(app).post('/api/consultations').send(valid)).status).toBe(201);
  });
});

describe('summary export refuses host execution', () => {
  let app: Express;
  beforeAll(async () => { app = await createApp(); });
  it.each(['secure', 'vulnerable'])('blocks normal %s export outside Docker', async (mode) => {
    const response = await request(app).post('/api/consultations/1/export').send({ mode, documentTitle: 'ringkasan-konsultasi' });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SANDBOX_REQUIRED');
    expect(response.headers['content-disposition']).toBeUndefined();
  });
  it('keeps a harmless vulnerable marker behind the same host guard', async () => {
    const response = await request(app).post('/api/consultations/1/export').send({ mode: 'vulnerable', documentTitle: 'clinic-demo; printf LAB_MARKER' });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SANDBOX_REQUIRED');
  });
  it.each(['secure', undefined, 'invalid'])('rejects injected title in secure/default mode: %j', async (mode) => {
    const response = await request(app).post('/api/consultations/1/export').send({ mode, documentTitle: 'clinic-demo; printf LAB_MARKER' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
  it.each(['0', '-1', 'abc', '1.5', '01'])('validates consultation ID %s', async (id) => {
    const response = await request(app).post(`/api/consultations/${id}/export`).send({ documentTitle: 'ringkasan-konsultasi' });
    expect(response.status).toBe(400);
  });
  it('returns a controlled error for a missing consultation', async () => {
    const response = await request(app).post('/api/consultations/999/export').send({ documentTitle: 'ringkasan-konsultasi' });
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('CONSULTATION_NOT_FOUND');
  });
  it.each(['', 'a'.repeat(41), '../record', 'judul\n', 'clinic-demo; echo LAB_MARKER'])('rejects invalid document title %j', async (documentTitle) => {
    const response = await request(app).post('/api/consultations/1/export').send({ mode: 'vulnerable', documentTitle });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
