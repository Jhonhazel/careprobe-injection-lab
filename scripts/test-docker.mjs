// Sends the only harmless shell payload over HTTP AFTER inspecting the real container.
// Never invokes a host shell or accepts a user-supplied command/URL.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 10000 }).trim();
let passed = 0;
function verify(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const id = docker('compose', 'ps', '-q', 'api');
assert.ok(id, 'Start the lab with pnpm lab:up first. No command test was executed.');
const [container] = JSON.parse(docker('inspect', id));
verify('non-root UID/GID', () => assert.equal(container.Config.User, '10001:10001'));
verify('read-only root filesystem', () => assert.equal(container.HostConfig.ReadonlyRootfs, true));
verify('not privileged', () => assert.equal(container.HostConfig.Privileged, false));
verify('all capabilities dropped', () => assert.deepEqual(container.HostConfig.CapDrop, ['ALL']));
verify('no-new-privileges', () => assert.ok(container.HostConfig.SecurityOpt.includes('no-new-privileges:true')));
verify('no mounts or Docker socket', () => assert.deepEqual(container.Mounts, []));
verify('PID, memory and CPU limits', () => {
  assert.equal(container.HostConfig.PidsLimit, 48);
  assert.equal(container.HostConfig.Memory, 268435456);
  assert.equal(container.HostConfig.NanoCpus, 500000000);
});
verify('only loopback port published', () => {
  assert.deepEqual(container.HostConfig.PortBindings, { '3100/tcp': [{ HostIp: '127.0.0.1', HostPort: '3100' }] });
});
const networks = Object.keys(container.NetworkSettings.Networks);
verify('one dedicated bridge network (egress NOT blocked)', () => {
  assert.equal(networks.length, 1);
  assert.equal(JSON.parse(docker('network', 'inspect', networks[0]))[0].Driver, 'bridge');
});
verify('Docker actually published port on loopback', () => {
  assert.deepEqual(container.NetworkSettings.Ports['3100/tcp'], [{ HostIp: '127.0.0.1', HostPort: '3100' }]);
});

async function call(path, body) {
  const response = await fetch(`http://127.0.0.1:3100${path}`, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000)
  } : { signal: AbortSignal.timeout(5000) });
  const isText = response.headers.get('content-type')?.startsWith('text/plain');
  return { status: response.status, headers: response.headers, body: isText ? await response.text() : await response.json() };
}
const health = await call('/api/health');
verify('real API and runtime sandbox gate', () => {
  assert.equal(health.status, 200);
  assert.equal(health.body.commandSandbox, true);
});
const services = await call('/api/services');
verify('six SQLite records over HTTP', () => assert.equal(services.body.count, 6));
const input = "' OR 1=1 -- ";
for (const [mode, count] of [['secure', 0], ['vulnerable', 6]]) {
  const result = await call(`/api/labs/sql?${new URLSearchParams({ mode, keyword: input })}`);
  verify(`SQL ${mode} tautology count = ${count}`, () => { assert.equal(result.status, 200); assert.equal(result.body.count, count); });
}
for (const mode of ['secure', 'vulnerable']) {
  const result = await call('/api/labs/command', { mode, label: 'clinic-demo' });
  verify(`normal command ${mode}`, () => { assert.equal(result.status, 200); assert.equal(result.body.output, 'diagnostic: clinic-demo\n'); });
}
const marker = await call('/api/labs/command', { mode: 'vulnerable', label: 'clinic-demo; printf LAB_MARKER' });
verify('real shell interprets the harmless marker suffix', () => {
  assert.equal(marker.status, 200);
  assert.equal(marker.body.shell, true);
  assert.equal(marker.body.output, 'diagnostic: clinic-demo\nLAB_MARKER');
  assert.ok(Buffer.byteLength(marker.body.output) <= 4096);
});
const secure = await call('/api/labs/command', { mode: 'secure', label: 'clinic-demo; printf LAB_MARKER' });
verify('secure command rejects injection with no output', () => {
  assert.equal(secure.status, 400); assert.equal(secure.body.error.code, 'VALIDATION_ERROR');
  assert.equal(secure.body.output, undefined);
});
const defaultMode = await call('/api/labs/command', { label: 'clinic-demo' });
verify('command defaults to no-shell secure mode', () => {
  assert.equal(defaultMode.status, 200); assert.equal(defaultMode.body.mode, 'secure'); assert.equal(defaultMode.body.shell, false);
});
const boundary = await call('/api/labs/command', { mode: 'secure', label: 'a'.repeat(40) });
verify('40-character label boundary', () => assert.equal(boundary.status, 200));
for (const body of [{ mode: 'wrong', label: 'clinic-demo' }, { label: 'a'.repeat(41) },
  { mode: 'vulnerable', label: 'clinic-demo; echo LAB_MARKER' }, { label: '' }]) {
  const result = await call('/api/labs/command', body);
  verify(`invalid command ${JSON.stringify(body)} rejected`, () => assert.equal(result.status, 400));
}
for (const [mode, count] of [['secure', 0], ['vulnerable', 6]]) {
  const result = await call(`/api/services?${new URLSearchParams({ mode, keyword: input })}`);
  verify(`ordinary services ${mode} injection count = ${count}`, () => {
    assert.equal(result.status, 200); assert.equal(result.body.count, count);
    assert.equal(result.body.query, undefined); assert.equal(result.body.parameters, undefined);
  });
}
const created = await call('/api/consultations', { serviceId: 2, patientName: 'Rani Docker Demo', reason: 'Simulasi pemeriksaan gigi.' });
verify('consultation is saved by SQLite', () => {
  assert.equal(created.status, 201); assert.equal(created.body.consultation.status, 'PENDING');
  assert.equal(created.body.consultation.serviceName, 'Pemeriksaan Gigi');
});
const record = created.body.consultation;
const history = await call('/api/consultations');
verify('saved consultation appears in history', () => {
  assert.deepEqual(history.body.consultations.find(row => row.id === record.id), record);
});
for (const mode of ['secure', 'vulnerable']) {
  const result = await call(`/api/consultations/${record.id}/export`, { mode, documentTitle: 'ringkasan-konsultasi' });
  verify(`normal ${mode} summary has actual selected record and safe download headers`, () => {
    assert.equal(result.status, 200);
    assert.match(result.headers.get('content-type'), /^text\/plain; charset=utf-8$/);
    assert.ok([
      `attachment; filename="careprobe-konsultasi-${record.id}.txt"`,
      `attachment; filename=careprobe-konsultasi-${record.id}.txt`
    ].includes(result.headers.get('content-disposition')));
    for (const value of [record.patientName, record.reason, record.serviceName, record.createdAt, `ID konsultasi: ${record.id}`, 'Judul: ringkasan-konsultasi']) assert.ok(result.body.includes(value));
    assert.ok(!result.body.includes('Alya Demo'));
    assert.ok(!result.body.includes('LAB_MARKER'));
    assert.ok(Buffer.byteLength(result.body) < 8192);
  });
}
const exportedMarker = await call(`/api/consultations/${record.id}/export`, { mode: 'vulnerable', documentTitle: 'clinic-demo; printf LAB_MARKER' });
verify('ordinary export interprets only the harmless marker in vulnerable mode', () => {
  assert.equal(exportedMarker.status, 200);
  assert.ok(exportedMarker.body.includes('Judul: clinic-demo\nLAB_MARKER\n'));
  assert.ok(exportedMarker.body.includes(record.patientName));
});
for (const mode of ['secure', undefined, 'invalid']) {
  const result = await call(`/api/consultations/${record.id}/export`, { mode, documentTitle: 'clinic-demo; printf LAB_MARKER' });
  verify(`summary marker rejected with secure fallback: ${mode}`, () => {
    assert.equal(result.status, 400); assert.equal(result.body.error.code, 'VALIDATION_ERROR');
    assert.equal(result.headers.get('content-disposition'), null);
  });
}
for (const [documentTitle, status] of [['a'.repeat(40), 200], ['a'.repeat(41), 400], ['../record', 400], ['clinic-demo; echo LAB_MARKER', 400]]) {
  const result = await call(`/api/consultations/${record.id}/export`, { mode: 'vulnerable', documentTitle });
  verify(`export title validation: ${documentTitle}`, () => assert.equal(result.status, status));
}
const finalServices = await call('/api/services');
const finalHistory = await call('/api/consultations');
verify('search and export do not modify stored services or consultations', () => {
  assert.deepEqual(finalServices.body.services, services.body.services);
  assert.deepEqual(finalHistory.body, history.body);
});
console.log(`\n${passed} Docker/API checks passed. No host command-injection execution.`);
