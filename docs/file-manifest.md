# Manifest CareProbe Health

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

75 berkas sumber, konfigurasi, tes, dokumentasi dan bukti terpilih. Dependensi/build/secret/referensi privat dikecualikan.

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
- [docs/file-manifest.md](../docs/file-manifest.md)
- [docs/implementation-plan.md](../docs/implementation-plan.md)
- [docs/lab-report.md](../docs/lab-report.md)
- [docs/test-cases.md](../docs/test-cases.md)
- [package.json](../package.json)
- [pnpm-lock.yaml](../pnpm-lock.yaml)
- [pnpm-workspace.yaml](../pnpm-workspace.yaml)
- [scripts/smoke-web.mjs](../scripts/smoke-web.mjs)
- [scripts/test-docker.mjs](../scripts/test-docker.mjs)
