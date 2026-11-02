import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('./fixtures/csrf.html', import.meta.url));
createServer((req, res) => {
  if (req.url !== '/') { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; form-action http://127.0.0.1:4173; frame-ancestors 'none'", 'X-Content-Type-Options': 'nosniff' });
  res.end(html);
}).listen(4180, '127.0.0.1', () => console.log('Simulasi CSRF: http://127.0.0.1:4180 (target preview :4173)'));
