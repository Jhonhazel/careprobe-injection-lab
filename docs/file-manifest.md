# Manifest CareProbe Health

## Pengalaman website terautentikasi (lanjutan working tree)

| Berkas tepat | Alasan perubahan tahap ini |
| --- | --- |
| apps/api/src/app.ts, apps/api/src/demo-session.ts | Meneruskan katalog SQLite existing ke router auth; reminder tidak terbawa saat akun berubah. Cookie scope/sistem sesi sama. |
| apps/api/src/authorization.ts | Metadata service/time untuk personal record, scope list personal/lab, policy Secure personal dan summary berizin, tanpa Map/database baru. |
| apps/api/src/authorization.integration.spec.ts | Lima kasus personal scope/service/owner/summary/workflow/legacy isolation/preference,22 kasus lama dipertahankan. |
| apps/web/src/lib/components/AuthGate.svelte (baru), apps/web/src/lib/components/AuthGate.spec.ts (baru) | Gate terpusat tanpa SSR cookie redesign; pending/anonymous/expired/error/retry tests. |
| apps/web/src/lib/components/CarePanel.svelte (baru), apps/web/src/lib/components/CarePanel.spec.ts (baru) | Satu UI shared dashboard/form/history normal dengan auth API; role/actions/actual records/error tests. |
| apps/web/src/lib/auth.ts, apps/web/src/lib/auth.spec.ts | Revision guard untuk response restore lama setelah logout/login. Store/auth/backend tetap sama. |
| apps/web/src/routes/+layout.svelte | Public header satu nav, lima nav sesudah login, pasang gate terpusat. |
| apps/web/src/routes/+page.svelte | Landing publik existing dengan CTA login, dashboard role dari response authorized. |
| apps/web/src/routes/login/+page.svelte | Copy/tautan publik sesuai gate baru; credential flow tidak diganti. |
| apps/web/src/routes/consultations/+page.svelte, apps/web/src/routes/history/+page.svelte | Pakai CarePanel pribadi, hapus global legacy dari normal History. |
| apps/web/src/lib/components/ServiceCards.svelte | Patient service selection memakai ID, resolve detail di backend. |
| apps/web/src/routes/settings/+page.svelte | Account/reminder/lab groups; reuse AuthorizationPanel dan legacy export on-demand. |
| apps/web/src/app.css | Dashboard, form, status badge dan mobile memakai design system existing. |
| scripts/smoke-web.mjs | Sesuaikan SSR assertions: nav publik satu, private loading shell tanpa data. Existing proxy tests dipertahankan. |
| README.md, docs/assignment-mapping.md, docs/lab-report.md, docs/test-cases.md, docs/file-manifest.md | Batas private/legacy/lab, alur role, test/evidence actual dan screenshot guide. |
| docs/evidence/ux-http.json, docs/evidence/ux-summary.txt |16 observasi HTTP Docker dan TXT asli; bukan klaim file download browser. |
| docs/evidence/ux-*.png |12 screenshot browser actual: public/redirect/patient/doctor/admin/settings/mobile dan XSS/CSRF. Daftar nama tepat pada inventory di bawah. |

Empat source/test files baru,14 evidence files baru, tanpa dependency, endpoint baru, file dihapus atau perubahan Docker/SQLite schema. Working tree sebelumnya tetap dipertahankan.

## Materi 10 — Bab 2: Privilege Management (lanjutan working tree)

Baseline tahap ini sudah memiliki Authorization dan login/logout yang belum di-commit. Tabel ini hanya delta privilege; perubahan lama di bawah tetap dipertahankan.

| Berkas tepat | Alasan perubahan tahap ini |
| --- | --- |
| apps/api/src/authorization.ts | Satu grant Raka5menit, request/approve/reject/review/revoke, expiry authoritative, audit, satu scoped stale-review1002; reuse policy/auth/CSRF. |
| apps/api/src/demo-session.ts | Satu field snapshot doctorAtLogin; rotation existing tidak menyalinnya ke sesi baru. |
| apps/api/src/authorization.integration.spec.ts | Tambah lifecycle, revoke/expiry, stale scope/session rotation, strict grant input dan creator nyata;13 kasus lama dipertahankan. |
| apps/web/src/lib/components/AuthorizationPanel.svelte | Section grant compact di panel lama; request/decision/review/revoke dan expiry UTC, tanpa nav/selector baru. |
| apps/web/src/lib/components/AuthorizationPanel.spec.ts | Empat cases grant UI/action/token, update stub response existing. |
| README.md, docs/assignment-mapping.md, docs/test-cases.md, docs/lab-report.md, docs/file-manifest.md | Mapping2.1–2.8, kontrak, manual/screenshot, evidence aktual dan batas. |
| docs/evidence/privilege-http.json |26 observasi HTTP Docker aktual dua sesi tanpa credential/token/cookie. |
| docs/evidence/privilege-requested.png, docs/evidence/privilege-active.png, docs/evidence/privilege-revoked.png, docs/evidence/privilege-rejected.png | Screenshot browser lifecycle nyata, tanpa screenshot expiry yang belum dijalankan. |
| docs/evidence/privilege-creep-vulnerable.png, docs/evidence/privilege-creep-secure.png, docs/evidence/privilege-creep-audit.png | Creep V/S dan audit nyata dua browser. Screenshot Secure sebelum reload masih menunjukkan UI role lama; HTTP/fresh reload membuktikan live PATIENT. |

Tidak ada source module/endpoint shell baru, dependency, Docker change, migration atau file dihapus. Delapan berkas evidence baru; source/test memakai lima berkas existing dari working tree sebelumnya.

## Integrasi login/logout website (lanjutan working tree Materi10)

Perubahan Materi10 yang belum di-commit dipertahankan. Tahap ini memakai backend dan session yang sama; tidak mengubah logic apps/api. Daftar berikut hanya perubahan tambahan untuk UX login.

| Berkas | Alasan |
| --- | --- |
| apps/web/src/lib/auth.ts | Satu store identity server, restore/login/logout, token sesi terbaru untuk mutation, return-path whitelist. |
| apps/web/src/routes/login/+page.svelte | Form username/password, feedback/loading, redirect aman, tanpa credential/role selector otomatis. |
| apps/web/src/lib/components/AuthControls.svelte | Identity/role dan Masuk/Keluar terpisah dari lima nav produk. |
| apps/web/src/routes/+layout.svelte | Pasang header account controls dan refresh identity pada navigasi. |
| apps/web/src/lib/api.ts | Optional POST headers untuk reuse token/Settings header dengan error handling existing. |
| apps/web/src/lib/components/AuthorizationPanel.svelte | Hapus embedded login, pakai shared auth dan existing role actions/summary. |
| apps/web/src/routes/settings/+page.svelte | Hapus account form, fresh token pada reminder, clear expired identity, refresh identity setelah mode sync. |
| apps/web/src/app.css | Styling login/header responsif mengikuti desain lama. |
| apps/web/src/lib/auth.spec.ts, apps/web/src/lib/login.spec.ts, apps/web/src/lib/components/AuthControls.spec.ts, apps/web/src/lib/settings.spec.ts | Tes identity/session/error/header/login form/redirect/logout/expiry/token. |
| apps/web/vitest.config.ts | Resolve modul navigasi SvelteKit existing untuk mock komponen. |
| scripts/smoke-web.mjs | Tambahkan login SSR/form smoke; nav produk tetap lima. |
| README.md, docs/assignment-mapping.md, docs/lab-report.md, docs/test-cases.md, docs/file-manifest.md | Alur baru, hasil verifikasi dan manifest; tidak menulis ulang analisis akademis. |
| docs/evidence/login-page.png, docs/evidence/login-restored-header.png, docs/evidence/login-mobile.png | Screenshot browser nyata tanpa password/token/cookie. |


## Materi 10 — Authorization: Access Control dan Privilege Management

Baseline HEAD0a71f8e83da6a85a63d8a5f25ef85380b23122c0, branch feat/careprobe-client-side-security bersih saat mulai. Perubahan lokal tanpa commit/push/deploy.

| Berkas | Alasan |
| --- | --- |
| apps/api/src/demo-session.ts | Perluas cookie/session lama dengan identity opsional dan rotasi login/logout; daftarkan router auth. |
| apps/api/src/authorization.ts | Hash login, fixture Map terpisah, policy RBAC/ABAC terpusat, tiga omission terbatas, role live, reset dan audit. |
| apps/api/src/authorization.integration.spec.ts | Matriks13 skenario API dua mode, sesi/CSRF/ownership/assignment/workflow/lifecycle/isolation. |
| apps/web/src/lib/components/AuthorizationPanel.svelte | UI akun Settings dan fixture Riwayat, role-aware actions dan error/HTTP/summary. |
| apps/web/src/lib/components/AuthorizationPanel.spec.ts | Kontrol role, token pada POST, output escaped dan feedback403 aktual. |
| apps/web/src/routes/settings/+page.svelte | Panel login dalam sesi siap; refresh token parent sesudah rotasi. |
| apps/web/src/routes/history/+page.svelte | Panel fixture otorisasi terpisah tanpa menu baru. |
| README.md, docs/assignment-mapping.md, docs/test-cases.md, docs/lab-report.md, docs/file-manifest.md | Panduan Materi10, endpoint, matriks, bukti, screenshot, CIA dan batas. |
| docs/evidence/m10-http.json |22 observasi HTTP nyata Docker tanpa cookie/password/token. |
| docs/evidence/m10-patient.png, docs/evidence/m10-idor-secure.png, docs/evidence/m10-idor-vulnerable.png, docs/evidence/m10-doctor-completed.png, docs/evidence/m10-admin-revocation.png | Screenshot konten tab nyata untuk role, IDOR, urutan sah dan lifecycle. |


## Materi 9 — Client Side Security: XSS dan CSRF

Perubahan lokal dibanding HEAD146283001a0b026ea22ce354f358a9ede5f84dee (baseline bersih). Tidak ada commit/push/deploy.

| Berkas | Tujuan |
| --- | --- |
| apps/api/src/app.ts | Pasang router sesi; pengecualian Origin hanya POST reminder dari4180, dengan mode gate di router. |
| apps/api/src/demo-session.ts | Sesi memori terbatas, random HttpOnly cookie, sinkronisasi mode tepercaya, token dan preferensi pengingat. |
| apps/api/src/demo-session.integration.spec.ts | Regresi sesi, cookie, token, Origin, state dan GET nonmutating. |
| apps/web/src/lib/xss-demo.ts | Satu fragmen handler marker exact, tanpa script bebas. |
| apps/web/src/lib/components/ServiceCatalog.svelte | Ringkasan keyword escaped; boundary aktif exact hanya mode Vulnerable. |
| apps/web/src/lib/components/ServiceCatalog.spec.ts | Normal kedua mode, boundary exact, Secure escaped dan input lain aman. |
| apps/web/src/routes/settings/+page.svelte | Sinkronisasi satu mode ke sesi, update/reload preferensi dengan token dan feedback. |
| apps/web/src/lib/settings.spec.ts | Pertahankan tes konfirmasi mode dengan API sesi. |
| scripts/serve-csrf.mjs, scripts/fixtures/csrf.html | Server statis loopback4180 dan form eksplisit ke preview4173. |
| README.md, docs/assignment-mapping.md, docs/lab-report.md, docs/test-cases.md, docs/file-manifest.md | Prosedur Materi9, source/flow/sink/control, hasil aktual, batas dan manifest. |
| docs/evidence/m9-xss-vulnerable.png, docs/evidence/m9-xss-secure.png, docs/evidence/m9-csrf-vulnerable.png, docs/evidence/m9-csrf-secure.png | Screenshot konten tab aktual tanpa secret; address bar/DevTools ditangkap terpisah mahasiswa. |


## Tambahan pengujian URL pada working tree saat ini

Bagian berikut mencatat perubahan setelah refactor produk di bawah, dibanding HEAD `817b5bba12c7f63c710fa6859cbd40911ee89811`. Semua perubahan lokal; belum di-commit, push, atau deploy. Tidak ada dependency, sink command baru, atau perubahan Docker.

| Status | Berkas | Alasan |
| --- | --- | --- |
| Diubah | [apps/api/src/app.ts](../apps/api/src/app.ts) | GET query dan POST JSON ekspor berbagi validasi, lookup record, command helper, dan format TXT. |
| Diubah | [apps/api/src/app.integration.spec.ts](../apps/api/src/app.integration.spec.ts), [apps/api/src/consultations.integration.spec.ts](../apps/api/src/consultations.integration.spec.ts) | Uji URL encoded SQL, validasi dan fail-closed GET pada host. |
| Diubah | [apps/web/src/lib/components/ServiceCatalog.svelte](../apps/web/src/lib/components/ServiceCatalog.svelte), [apps/web/src/lib/components/ServiceCatalog.spec.ts](../apps/web/src/lib/components/ServiceCatalog.spec.ts) | Kata kunci URL memicu satu pencarian nyata dengan mode Settings; form tetap bekerja. |
| Diubah | [scripts/test-docker.mjs](../scripts/test-docker.mjs), [scripts/smoke-web.mjs](../scripts/smoke-web.mjs) | Bukti GET/POST setara dalam sandbox dan halaman URL aman saat SSR. |
| Diubah | [README.md](../README.md), [docs/assignment-mapping.md](../docs/assignment-mapping.md), [docs/test-cases.md](../docs/test-cases.md), [docs/lab-report.md](../docs/lab-report.md), [bruno/02-services.bru](../bruno/02-services.bru) | Panduan HTTP langsung, source/flow/sink/control, hasil dan batas aktual. |
| Ditambah | [bruno/12-url-export-normal.bru](../bruno/12-url-export-normal.bru), [bruno/13-url-export-vulnerable.bru](../bruno/13-url-export-vulnerable.bru), [bruno/14-url-export-secure.bru](../bruno/14-url-export-secure.bru) | Contoh GET ekspor lokal yang dapat diuji manual, tanpa link otomatis di website. |
| Ditambah | [docs/evidence/url-http.json](../docs/evidence/url-http.json), [docs/evidence/url-summary-normal.txt](../docs/evidence/url-summary-normal.txt), [docs/evidence/url-summary-vulnerable.txt](../docs/evidence/url-summary-vulnerable.txt) | Respons HTTP/container aktual; TXT ini bukan unduhan browser. |
| Ditambah | [docs/evidence/http-post-normal.txt](../docs/evidence/http-post-normal.txt), [docs/evidence/http-post-vulnerable.txt](../docs/evidence/http-post-vulnerable.txt) | Salinan TXT dari POST JSON curl langsung terhadap API Docker. |
| Ditambah | [docs/evidence/url-sql-vulnerable.png](../docs/evidence/url-sql-vulnerable.png), [docs/evidence/url-sql-secure.png](../docs/evidence/url-sql-secure.png), [docs/evidence/url-services-page.png](../docs/evidence/url-services-page.png), [docs/evidence/url-command-secure.png](../docs/evidence/url-command-secure.png) | Screenshot konten tab; address bar/DevTools masih perlu ditangkap mahasiswa. |
| Diubah | [docs/file-manifest.md](../docs/file-manifest.md) | Daftar perubahan dan berkas bukti terbaru. |

## Refactor produk sebelumnya

Refactor lokal pada branch `codex/careprobe-health-refactor`, dibanding baseline `7810ee9ff41560434457e2d49e11fe076b6be974`. Tidak ada commit/push/deploy. Dependency/lockfile, Dockerfile, Compose, command helper dan sandbox guard tidak berubah.

## Berkas diubah, ditambah, atau dihapus

| Status | Berkas tepat | Alasan |
| --- | --- | --- |
| Diubah | [README.md](../README.md) | Panduan startup/shutdown, workflow produk, demo aman dan batas aktual. |
| Diubah | [apps/api/src/app.integration.spec.ts](../apps/api/src/app.integration.spec.ts) | Regresi mode, validasi, persistensi, read-only, host guard, atau UI nyata. |
| Diubah | [apps/api/src/app.ts](../apps/api/src/app.ts) | Mode layanan dan endpoint create/list/export dengan validasi; pakai helper yang sama. |
| Ditambah | [apps/api/src/consultations.integration.spec.ts](../apps/api/src/consultations.integration.spec.ts) | Regresi mode, validasi, persistensi, read-only, host guard, atau UI nyata. |
| Diubah | [apps/api/src/database.ts](../apps/api/src/database.ts) | Tabel/seed konsultasi pada koneksi lama; read JOIN dan insert binding dengan query_only dipulihkan. |
| Ditambah | [apps/api/src/database.unit.spec.ts](../apps/api/src/database.unit.spec.ts) | Regresi mode, validasi, persistensi, read-only, host guard, atau UI nyata. |
| Diubah | [apps/web/src/app.css](../apps/web/src/app.css) | Gaya form konsultasi, Settings dan ekspor responsif memakai design system lama. |
| Diubah | [apps/web/src/lib/api.ts](../apps/web/src/lib/api.ts) | HTTP client mendukung teks unduhan dan tipe konsultasi; hapus bukti sesi UI lama. |
| Ditambah | [apps/web/src/lib/components/ConsultationPanel.spec.ts](../apps/web/src/lib/components/ConsultationPanel.spec.ts) | Regresi mode, validasi, persistensi, read-only, host guard, atau UI nyata. |
| Ditambah | [apps/web/src/lib/components/ConsultationPanel.svelte](../apps/web/src/lib/components/ConsultationPanel.svelte) | Form/list konsultasi dan unduhan TXT aktual untuk halaman Konsultasi/Riwayat. |
| Dihapus | `apps/web/src/lib/components/LabForm.spec.ts` | Hapus UI dashboard lama dan tes khusus UI tersebut; regresi yang relevan dipindah ke fitur produk. |
| Dihapus | `apps/web/src/lib/components/LabForm.svelte` | Hapus UI dashboard lama dan tes khusus UI tersebut; regresi yang relevan dipindah ke fitur produk. |
| Dihapus | `apps/web/src/lib/components/ResultPanel.spec.ts` | Hapus UI dashboard lama dan tes khusus UI tersebut; regresi yang relevan dipindah ke fitur produk. |
| Dihapus | `apps/web/src/lib/components/ResultPanel.svelte` | Hapus UI dashboard lama dan tes khusus UI tersebut; regresi yang relevan dipindah ke fitur produk. |
| Diubah | [apps/web/src/lib/components/ServiceCatalog.spec.ts](../apps/web/src/lib/components/ServiceCatalog.spec.ts) | Regresi mode, validasi, persistensi, read-only, host guard, atau UI nyata. |
| Diubah | [apps/web/src/lib/components/ServiceCatalog.svelte](../apps/web/src/lib/components/ServiceCatalog.svelte) | Kirim mode Settings ke pencarian layanan tanpa selector atau query panel. |
| Ditambah | [apps/web/src/lib/security-mode.spec.ts](../apps/web/src/lib/security-mode.spec.ts) | Regresi mode, validasi, persistensi, read-only, host guard, atau UI nyata. |
| Ditambah | [apps/web/src/lib/security-mode.ts](../apps/web/src/lib/security-mode.ts) | Satu preferensi Svelte store dengan localStorage dan default secure, aman untuk SSR. |
| Ditambah | [apps/web/src/lib/settings.spec.ts](../apps/web/src/lib/settings.spec.ts) | Regresi mode, validasi, persistensi, read-only, host guard, atau UI nyata. |
| Diubah | [apps/web/src/routes/+layout.svelte](../apps/web/src/routes/+layout.svelte) | Lima bagian produk berbahasa Indonesia, branding, dan navigasi yang diminta. |
| Diubah | [apps/web/src/routes/+page.svelte](../apps/web/src/routes/+page.svelte) | Lima bagian produk berbahasa Indonesia, branding, dan navigasi yang diminta. |
| Ditambah | [apps/web/src/routes/consultations/+page.svelte](../apps/web/src/routes/consultations/+page.svelte) | Lima bagian produk berbahasa Indonesia, branding, dan navigasi yang diminta. |
| Ditambah | [apps/web/src/routes/history/+page.svelte](../apps/web/src/routes/history/+page.svelte) | Lima bagian produk berbahasa Indonesia, branding, dan navigasi yang diminta. |
| Dihapus | `apps/web/src/routes/labs/command-injection/+page.svelte` | Hapus UI dashboard lama dan tes khusus UI tersebut; regresi yang relevan dipindah ke fitur produk. |
| Ditambah | [apps/web/src/routes/labs/command-injection/+page.ts](../apps/web/src/routes/labs/command-injection/+page.ts) | Redirect kompatibilitas route lab/report lama ke fitur produk. |
| Dihapus | `apps/web/src/routes/labs/sql-injection/+page.svelte` | Hapus UI dashboard lama dan tes khusus UI tersebut; regresi yang relevan dipindah ke fitur produk. |
| Ditambah | [apps/web/src/routes/labs/sql-injection/+page.ts](../apps/web/src/routes/labs/sql-injection/+page.ts) | Redirect kompatibilitas route lab/report lama ke fitur produk. |
| Dihapus | `apps/web/src/routes/report/+page.svelte` | Hapus UI dashboard lama dan tes khusus UI tersebut; regresi yang relevan dipindah ke fitur produk. |
| Ditambah | [apps/web/src/routes/report/+page.ts](../apps/web/src/routes/report/+page.ts) | Redirect kompatibilitas route lab/report lama ke fitur produk. |
| Diubah | [apps/web/src/routes/services/+page.svelte](../apps/web/src/routes/services/+page.svelte) | Lima bagian produk berbahasa Indonesia, branding, dan navigasi yang diminta. |
| Ditambah | [apps/web/src/routes/settings/+page.svelte](../apps/web/src/routes/settings/+page.svelte) | Lima bagian produk berbahasa Indonesia, branding, dan navigasi yang diminta. |
| Diubah | [bruno/02-services.bru](../bruno/02-services.bru) | Dokumentasikan request layanan/konsultasi/ekspor dan retest melalui API lokal. |
| Diubah | [bruno/03-sql-vulnerable.bru](../bruno/03-sql-vulnerable.bru) | Dokumentasikan request layanan/konsultasi/ekspor dan retest melalui API lokal. |
| Diubah | [bruno/04-sql-secure.bru](../bruno/04-sql-secure.bru) | Dokumentasikan request layanan/konsultasi/ekspor dan retest melalui API lokal. |
| Ditambah | [bruno/07-consultations.bru](../bruno/07-consultations.bru) | Dokumentasikan request layanan/konsultasi/ekspor dan retest melalui API lokal. |
| Ditambah | [bruno/08-create-consultation.bru](../bruno/08-create-consultation.bru) | Dokumentasikan request layanan/konsultasi/ekspor dan retest melalui API lokal. |
| Ditambah | [bruno/09-export-secure.bru](../bruno/09-export-secure.bru) | Dokumentasikan request layanan/konsultasi/ekspor dan retest melalui API lokal. |
| Ditambah | [bruno/10-export-vulnerable.bru](../bruno/10-export-vulnerable.bru) | Dokumentasikan request layanan/konsultasi/ekspor dan retest melalui API lokal. |
| Ditambah | [bruno/11-export-secure-retest.bru](../bruno/11-export-secure-retest.bru) | Dokumentasikan request layanan/konsultasi/ekspor dan retest melalui API lokal. |
| Diubah | [docs/assignment-mapping.md](../docs/assignment-mapping.md) | Perbarui rencana, pemetaan tugas, bukti, kontrak atau manifest sesuai alur produk. |
| Ditambah | [docs/evidence/health-export-secure.png](../docs/evidence/health-export-secure.png) | Bukti screenshot atau TXT aktual dari verifikasi CareProbe Health. |
| Ditambah | [docs/evidence/health-home-desktop.png](../docs/evidence/health-home-desktop.png) | Bukti screenshot atau TXT aktual dari verifikasi CareProbe Health. |
| Ditambah | [docs/evidence/health-home-mobile.png](../docs/evidence/health-home-mobile.png) | Bukti screenshot atau TXT aktual dari verifikasi CareProbe Health. |
| Ditambah | [docs/evidence/health-services-secure.png](../docs/evidence/health-services-secure.png) | Bukti screenshot atau TXT aktual dari verifikasi CareProbe Health. |
| Ditambah | [docs/evidence/health-services-vulnerable.png](../docs/evidence/health-services-vulnerable.png) | Bukti screenshot atau TXT aktual dari verifikasi CareProbe Health. |
| Ditambah | [docs/evidence/health-summary-secure.txt](../docs/evidence/health-summary-secure.txt) | Bukti screenshot atau TXT aktual dari verifikasi CareProbe Health. |
| Ditambah | [docs/evidence/health-summary-vulnerable.txt](../docs/evidence/health-summary-vulnerable.txt) | Bukti screenshot atau TXT aktual dari verifikasi CareProbe Health. |
| Diubah | [docs/file-manifest.md](../docs/file-manifest.md) | Perbarui rencana, pemetaan tugas, bukti, kontrak atau manifest sesuai alur produk. |
| Diubah | [docs/implementation-plan.md](../docs/implementation-plan.md) | Perbarui rencana, pemetaan tugas, bukti, kontrak atau manifest sesuai alur produk. |
| Diubah | [docs/lab-report.md](../docs/lab-report.md) | Perbarui rencana, pemetaan tugas, bukti, kontrak atau manifest sesuai alur produk. |
| Diubah | [docs/test-cases.md](../docs/test-cases.md) | Perbarui rencana, pemetaan tugas, bukti, kontrak atau manifest sesuai alur produk. |
| Diubah | [package.json](../package.json) | Tambahkan perintah test:smoke, tanpa dependency baru. |
| Ditambah | [scripts/smoke-web.mjs](../scripts/smoke-web.mjs) | Verifikasi integrasi nyata, isolasi Docker atau production-preview/proxy. |
| Diubah | [scripts/test-docker.mjs](../scripts/test-docker.mjs) | Verifikasi integrasi nyata, isolasi Docker atau production-preview/proxy. |

## Semua berkas proyek

141 berkas sumber, konfigurasi, tes, dokumentasi dan bukti terpilih. Dependensi/build/secret/referensi privat dikecualikan.

- [.dockerignore](../.dockerignore)
- [.gitignore](../.gitignore)
- [README.md](../README.md)
- [apps/api/Dockerfile](../apps/api/Dockerfile)
- [apps/api/package.json](../apps/api/package.json)
- [apps/api/src/app.integration.spec.ts](../apps/api/src/app.integration.spec.ts)
- [apps/api/src/app.ts](../apps/api/src/app.ts)
- [apps/api/src/command.ts](../apps/api/src/command.ts)
- [apps/api/src/consultations.integration.spec.ts](../apps/api/src/consultations.integration.spec.ts)
- [apps/api/src/database.ts](../apps/api/src/database.ts)
- [apps/api/src/database.unit.spec.ts](../apps/api/src/database.unit.spec.ts)
- [apps/api/src/errors.ts](../apps/api/src/errors.ts)
- [apps/api/src/sandbox.ts](../apps/api/src/sandbox.ts)
- [apps/api/src/sandbox.unit.spec.ts](../apps/api/src/sandbox.unit.spec.ts)
- [apps/api/src/server.ts](../apps/api/src/server.ts)
- [apps/api/tsconfig.json](../apps/api/tsconfig.json)
- [apps/api/vitest.config.ts](../apps/api/vitest.config.ts)
- [apps/web/package.json](../apps/web/package.json)
- [apps/web/src/app.css](../apps/web/src/app.css)
- [apps/web/src/app.html](../apps/web/src/app.html)
- [apps/web/src/lib/api.ts](../apps/web/src/lib/api.ts)
- [apps/web/src/lib/components/ConsultationPanel.spec.ts](../apps/web/src/lib/components/ConsultationPanel.spec.ts)
- [apps/web/src/lib/components/ConsultationPanel.svelte](../apps/web/src/lib/components/ConsultationPanel.svelte)
- [apps/web/src/lib/components/ServiceCards.svelte](../apps/web/src/lib/components/ServiceCards.svelte)
- [apps/web/src/lib/components/ServiceCatalog.spec.ts](../apps/web/src/lib/components/ServiceCatalog.spec.ts)
- [apps/web/src/lib/components/ServiceCatalog.svelte](../apps/web/src/lib/components/ServiceCatalog.svelte)
- [apps/web/src/lib/security-mode.spec.ts](../apps/web/src/lib/security-mode.spec.ts)
- [apps/web/src/lib/security-mode.ts](../apps/web/src/lib/security-mode.ts)
- [apps/web/src/lib/settings.spec.ts](../apps/web/src/lib/settings.spec.ts)
- [apps/web/src/routes/+layout.svelte](../apps/web/src/routes/+layout.svelte)
- [apps/web/src/routes/+page.svelte](../apps/web/src/routes/+page.svelte)
- [apps/web/src/routes/consultations/+page.svelte](../apps/web/src/routes/consultations/+page.svelte)
- [apps/web/src/routes/history/+page.svelte](../apps/web/src/routes/history/+page.svelte)
- [apps/web/src/routes/labs/command-injection/+page.ts](../apps/web/src/routes/labs/command-injection/+page.ts)
- [apps/web/src/routes/labs/sql-injection/+page.ts](../apps/web/src/routes/labs/sql-injection/+page.ts)
- [apps/web/src/routes/report/+page.ts](../apps/web/src/routes/report/+page.ts)
- [apps/web/src/routes/services/+page.svelte](../apps/web/src/routes/services/+page.svelte)
- [apps/web/src/routes/settings/+page.svelte](../apps/web/src/routes/settings/+page.svelte)
- [apps/web/static/favicon.svg](../apps/web/static/favicon.svg)
- [apps/web/svelte.config.js](../apps/web/svelte.config.js)
- [apps/web/tsconfig.json](../apps/web/tsconfig.json)
- [apps/web/vite.config.ts](../apps/web/vite.config.ts)
- [apps/web/vitest.config.ts](../apps/web/vitest.config.ts)
- [bruno/01-health.bru](../bruno/01-health.bru)
- [bruno/02-services.bru](../bruno/02-services.bru)
- [bruno/03-sql-vulnerable.bru](../bruno/03-sql-vulnerable.bru)
- [bruno/04-sql-secure.bru](../bruno/04-sql-secure.bru)
- [bruno/05-command-vulnerable.bru](../bruno/05-command-vulnerable.bru)
- [bruno/06-command-secure.bru](../bruno/06-command-secure.bru)
- [bruno/07-consultations.bru](../bruno/07-consultations.bru)
- [bruno/08-create-consultation.bru](../bruno/08-create-consultation.bru)
- [bruno/09-export-secure.bru](../bruno/09-export-secure.bru)
- [bruno/10-export-vulnerable.bru](../bruno/10-export-vulnerable.bru)
- [bruno/11-export-secure-retest.bru](../bruno/11-export-secure-retest.bru)
- [bruno/12-url-export-normal.bru](../bruno/12-url-export-normal.bru)
- [bruno/13-url-export-vulnerable.bru](../bruno/13-url-export-vulnerable.bru)
- [bruno/14-url-export-secure.bru](../bruno/14-url-export-secure.bru)
- [bruno/bruno.json](../bruno/bruno.json)
- [bruno/environments/Local.bru](../bruno/environments/Local.bru)
- [docker-compose.yml](../docker-compose.yml)
- [docs/assignment-mapping.md](../docs/assignment-mapping.md)
- [docs/evidence/command-vulnerable.png](../docs/evidence/command-vulnerable.png)
- [docs/evidence/health-export-secure.png](../docs/evidence/health-export-secure.png)
- [docs/evidence/health-home-desktop.png](../docs/evidence/health-home-desktop.png)
- [docs/evidence/health-home-mobile.png](../docs/evidence/health-home-mobile.png)
- [docs/evidence/health-services-secure.png](../docs/evidence/health-services-secure.png)
- [docs/evidence/health-services-vulnerable.png](../docs/evidence/health-services-vulnerable.png)
- [docs/evidence/health-summary-secure.txt](../docs/evidence/health-summary-secure.txt)
- [docs/evidence/health-summary-vulnerable.txt](../docs/evidence/health-summary-vulnerable.txt)
- [docs/evidence/http-post-normal.txt](../docs/evidence/http-post-normal.txt)
- [docs/evidence/http-post-vulnerable.txt](../docs/evidence/http-post-vulnerable.txt)
- [docs/evidence/url-command-secure.png](../docs/evidence/url-command-secure.png)
- [docs/evidence/url-http.json](../docs/evidence/url-http.json)
- [docs/evidence/url-services-page.png](../docs/evidence/url-services-page.png)
- [docs/evidence/url-sql-secure.png](../docs/evidence/url-sql-secure.png)
- [docs/evidence/url-sql-vulnerable.png](../docs/evidence/url-sql-vulnerable.png)
- [docs/evidence/url-summary-normal.txt](../docs/evidence/url-summary-normal.txt)
- [docs/evidence/url-summary-vulnerable.txt](../docs/evidence/url-summary-vulnerable.txt)
- [docs/file-manifest.md](../docs/file-manifest.md)
- [docs/implementation-plan.md](../docs/implementation-plan.md)
- [docs/lab-report.md](../docs/lab-report.md)
- [docs/test-cases.md](../docs/test-cases.md)
- [package.json](../package.json)
- [pnpm-lock.yaml](../pnpm-lock.yaml)
- [pnpm-workspace.yaml](../pnpm-workspace.yaml)
- [scripts/smoke-web.mjs](../scripts/smoke-web.mjs)
- [scripts/test-docker.mjs](../scripts/test-docker.mjs)

- [apps/api/src/demo-session.integration.spec.ts](../apps/api/src/demo-session.integration.spec.ts)
- [apps/api/src/demo-session.ts](../apps/api/src/demo-session.ts)
- [apps/web/src/lib/xss-demo.ts](../apps/web/src/lib/xss-demo.ts)
- [docs/evidence/m9-csrf-secure.png](../docs/evidence/m9-csrf-secure.png)
- [docs/evidence/m9-csrf-vulnerable.png](../docs/evidence/m9-csrf-vulnerable.png)
- [docs/evidence/m9-xss-secure.png](../docs/evidence/m9-xss-secure.png)
- [docs/evidence/m9-xss-vulnerable.png](../docs/evidence/m9-xss-vulnerable.png)
- [scripts/fixtures/csrf.html](../scripts/fixtures/csrf.html)
- [scripts/serve-csrf.mjs](../scripts/serve-csrf.mjs)

- [apps/api/src/authorization.integration.spec.ts](../apps/api/src/authorization.integration.spec.ts)
- [apps/api/src/authorization.ts](../apps/api/src/authorization.ts)
- [apps/web/src/lib/components/AuthorizationPanel.spec.ts](../apps/web/src/lib/components/AuthorizationPanel.spec.ts)
- [apps/web/src/lib/components/AuthorizationPanel.svelte](../apps/web/src/lib/components/AuthorizationPanel.svelte)
- [docs/evidence/m10-admin-revocation.png](../docs/evidence/m10-admin-revocation.png)
- [docs/evidence/m10-doctor-completed.png](../docs/evidence/m10-doctor-completed.png)
- [docs/evidence/m10-http.json](../docs/evidence/m10-http.json)
- [docs/evidence/m10-idor-secure.png](../docs/evidence/m10-idor-secure.png)
- [docs/evidence/m10-idor-vulnerable.png](../docs/evidence/m10-idor-vulnerable.png)
- [docs/evidence/m10-patient.png](../docs/evidence/m10-patient.png)

- [apps/web/src/lib/auth.spec.ts](../apps/web/src/lib/auth.spec.ts)
- [apps/web/src/lib/auth.ts](../apps/web/src/lib/auth.ts)
- [apps/web/src/lib/components/AuthControls.spec.ts](../apps/web/src/lib/components/AuthControls.spec.ts)
- [apps/web/src/lib/components/AuthControls.svelte](../apps/web/src/lib/components/AuthControls.svelte)
- [apps/web/src/lib/login.spec.ts](../apps/web/src/lib/login.spec.ts)
- [apps/web/src/routes/login/+page.svelte](../apps/web/src/routes/login/+page.svelte)
- [docs/evidence/login-mobile.png](../docs/evidence/login-mobile.png)
- [docs/evidence/login-page.png](../docs/evidence/login-page.png)
- [docs/evidence/login-restored-header.png](../docs/evidence/login-restored-header.png)

- [docs/evidence/privilege-active.png](../docs/evidence/privilege-active.png)
- [docs/evidence/privilege-creep-audit.png](../docs/evidence/privilege-creep-audit.png)
- [docs/evidence/privilege-creep-secure.png](../docs/evidence/privilege-creep-secure.png)
- [docs/evidence/privilege-creep-vulnerable.png](../docs/evidence/privilege-creep-vulnerable.png)
- [docs/evidence/privilege-http.json](../docs/evidence/privilege-http.json)
- [docs/evidence/privilege-rejected.png](../docs/evidence/privilege-rejected.png)
- [docs/evidence/privilege-requested.png](../docs/evidence/privilege-requested.png)
- [docs/evidence/privilege-revoked.png](../docs/evidence/privilege-revoked.png)

- [docs/evidence/ux-admin-dashboard.png](../docs/evidence/ux-admin-dashboard.png)
- [docs/evidence/ux-alya-dashboard.png](../docs/evidence/ux-alya-dashboard.png)
- [docs/evidence/ux-bima-history.png](../docs/evidence/ux-bima-history.png)
- [docs/evidence/ux-csrf-secure.png](../docs/evidence/ux-csrf-secure.png)
- [docs/evidence/ux-csrf-vulnerable.png](../docs/evidence/ux-csrf-vulnerable.png)
- [docs/evidence/ux-doctor-completed.png](../docs/evidence/ux-doctor-completed.png)
- [docs/evidence/ux-http.json](../docs/evidence/ux-http.json)
- [docs/evidence/ux-login-redirect.png](../docs/evidence/ux-login-redirect.png)
- [docs/evidence/ux-mobile.png](../docs/evidence/ux-mobile.png)
- [docs/evidence/ux-public-home.png](../docs/evidence/ux-public-home.png)
- [docs/evidence/ux-settings.png](../docs/evidence/ux-settings.png)
- [docs/evidence/ux-summary.txt](../docs/evidence/ux-summary.txt)
- [docs/evidence/ux-xss-secure.png](../docs/evidence/ux-xss-secure.png)
- [docs/evidence/ux-xss-vulnerable.png](../docs/evidence/ux-xss-vulnerable.png)
- [apps/web/src/lib/components/AuthGate.svelte](../apps/web/src/lib/components/AuthGate.svelte)
- [apps/web/src/lib/components/AuthGate.spec.ts](../apps/web/src/lib/components/AuthGate.spec.ts)
- [apps/web/src/lib/components/CarePanel.svelte](../apps/web/src/lib/components/CarePanel.svelte)
- [apps/web/src/lib/components/CarePanel.spec.ts](../apps/web/src/lib/components/CarePanel.spec.ts)
