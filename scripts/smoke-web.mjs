// Production-preview HTTP smoke test. Fixed loopback target; no command payloads.
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:4173';
let passed = 0;
function verify(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
async function get(path) { return fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(5000) }); }
const pages = ['/', '/services', '/consultations', '/history', '/settings'];
for (const path of pages) {
  const response = await get(path);
  const html = await response.text();
  verify(`page ${path} and five product navigation links`, () => {
    assert.equal(response.status, 200);
    assert.ok(html.includes('CareProbe Health'));
    const nav = html.match(/<nav[^>]*aria-label="Navigasi utama"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav);
    assert.equal((nav.match(/<a\b/g) ?? []).length, 5);
    for (const href of pages) assert.ok(nav.includes(`href="${href}"`));
    assert.ok(!/SQL Lab|Command Lab|Laporan|SQL Injection|Command Injection/.test(nav));
    if (path !== '/settings') assert.ok(!html.includes('name="security-mode"'));
    if (path === '/') assert.ok(!/LAB_MARKER|SQL Injection|Command Injection|SELECT|Vulnerable/.test(html));
  });
}
for (const [path, target] of [['/labs/sql-injection', '/services'], ['/labs/command-injection', '/history'], ['/report', '/settings']]) {
  const response = await get(path);
  verify(`legacy ${path} redirects to ${target}`, () => { assert.equal(response.status, 307); assert.equal(response.headers.get('location'), target); });
}
for (const [mode, count] of [['secure', 0], ['vulnerable', 6]]) {
  const response = await get(`/api/services?${new URLSearchParams({ mode, keyword: "' OR 1=1 -- " })}`);
  const body = await response.json();
  verify(`ordinary services via frontend proxy: ${mode}`, () => { assert.equal(response.status, 200); assert.equal(body.count, count); });
}
const response = await fetch(`${base}/api/consultations`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ serviceId: 1, patientName: 'Preview Demo', reason: 'Simulasi melalui frontend proxy.' }),
  signal: AbortSignal.timeout(5000)
});
const created = await response.json();
const history = await (await get('/api/consultations')).json();
verify('consultation persists through frontend proxy', () => {
  assert.equal(response.status, 201);
  assert.deepEqual(history.consultations.find(row => row.id === created.consultation.id), created.consultation);
});
console.log(`\n${passed} production-preview HTTP checks passed. Browser interactions require separate verification.`);
