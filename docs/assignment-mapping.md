# Pemetaan tugas — TIG13, Material 8

Pemetaan ini mengikuti persyaratan yang diberikan pengguna. PDF privat/slides asli tidak tersedia dalam proyek dan tidak dibaca; jangan menganggap dokumen ini kutipan atau verifikasi halaman PDF.

| Persyaratan | Implementasi | Bukti / pengujian |
| --- | --- | --- |
| Aplikasi/server lab pribadi | SvelteKit + Express, localhost, Docker Compose | Health dan pemeriksaan port dalam `scripts/test-docker.mjs` |
| Identifikasi SQL Injection | `/labs/sql-injection`, `database.ts` | Konkatenasi keyword ditandai sengaja rentan |
| Source → flow → sink SQL | input keyword → GET → Zod → searchServices → prepare/step | Query aktual dan parameter ditampilkan di hasil |
| Eksploitasi SQL terbatas | Payload tautologi, SELECT-only pada enam layanan fiktif | Supertest: vulnerable 6, secure 0; tes Docker via HTTP |
| Mitigasi dan retest SQL | Parameter binding + database query-only | Input normal sama; payload sama diperlakukan sebagai data |
| Identifikasi Command Injection | `/labs/command-injection`, `command.ts` | String input masuk ke `/bin/sh -c` pada vulnerable |
| Source → flow → sink command | body.label → Zod/allowlist → runtime gate → execFile | Penjelasan halaman dan kode helper langsung |
| Eksploitasi command terbatas | Hanya `clinic-demo; printf LAB_MARKER` | Tes marker nyata hanya ke API container |
| Mitigasi dan retest command | execFile executable tetap, argumen terpisah, shell:false, allowlist | Normal kedua mode; secure menolak marker; host 503 |
| Isolasi | UID non-root, read-only, capabilities nol, no-new-privileges, seccomp, batas resource | Inspeksi Docker + runtime gate sebelum tes |
| Batas jaringan jujur | Localhost port, dedicated bridge | Internal network tidak kompatibel port pada Docker Desktop yang diuji; egress tidak diblokir |
| Evidence dan laporan | `/report`, `sessionStorage`, dokumentasi dan screenshot dummy | Hanya respons aktual sesi; ekspektasi dipisahkan dari observasi |
| Analisis dampak | SQL bypass filtering dan potensi risiko command pada aplikasi nyata | CIA di laporan; tidak melakukan tindakan berbahaya |
| Pengujian frontend | Form, panel, katalog, mode, loading/offline/empty, escaping teks | Vitest + Testing Library; browser terhubung API nyata |

Tidak ada pasien nyata, transaksi, telemedicine, auth, layanan eksternal, Prisma, NestJS, Redis, migration, atau kode proprietary. ReallySick tidak disentuh.
