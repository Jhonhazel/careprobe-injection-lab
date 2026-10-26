# Pemetaan tugas — TIG13, Material 8

Pemetaan ini mengikuti persyaratan yang diberikan pengguna. PDF privat/slides asli tidak tersedia dalam proyek dan tidak dibaca; jangan menganggap dokumen ini kutipan atau verifikasi halaman PDF.

| Persyaratan | Implementasi | Bukti / pengujian |
| --- | --- | --- |
| Aplikasi/server lab pribadi | SvelteKit + Express, localhost, Docker Compose | Health dan pemeriksaan port dalam `scripts/test-docker.mjs` |
| Identifikasi SQL Injection | `/services`, `database.ts` | Konkatenasi keyword ditandai sengaja rentan |
| Source → flow → sink SQL | input pencarian layanan → GET /api/services → Zod → searchServices → prepare/step | Query tidak ditampilkan di UI produk; struktur/binding diverifikasi lewat tes dan kode |
| Eksploitasi SQL terbatas | Payload tautologi, SELECT-only pada enam layanan fiktif | Supertest: vulnerable 6, secure 0; tes Docker via HTTP |
| Mitigasi dan retest SQL | Parameter binding + database query-only | Input normal sama; payload sama diperlakukan sebagai data |
| Identifikasi Command Injection | `/history`, export route, `command.ts` | String input masuk ke `/bin/sh -c` pada vulnerable |
| Source → flow → sink command | body.documentTitle → POST /api/consultations/:id/export → runCommand → allowlist/runtime gate → execFile | Ringkasan TXT dari record tersimpan; penjelasan pada docs/lab-report.md |
| Eksploitasi command terbatas | Hanya `clinic-demo; printf LAB_MARKER` | Tes marker nyata hanya ke API container |
| Mitigasi dan retest command | execFile executable tetap, argumen terpisah, shell:false, allowlist | Normal kedua mode; secure menolak marker; host 503 |
| Isolasi | UID non-root, read-only, capabilities nol, no-new-privileges, seccomp, batas resource | Inspeksi Docker + runtime gate sebelum tes |
| Batas jaringan jujur | Localhost port, dedicated bridge | Internal network tidak kompatibel port pada Docker Desktop yang diuji; egress tidak diblokir |
| Evidence dan laporan | Dokumentasi repository, screenshot dan hasil TXT dummy | Hanya pengujian yang dijalankan dicatat; bukti MVP lama diberi label historis |
| Analisis dampak | SQL bypass filtering dan potensi risiko command pada aplikasi nyata | CIA di laporan; tidak melakukan tindakan berbahaya |
| Pengujian frontend | Katalog, konsultasi, riwayat, Settings, loading/offline/empty, escaping teks | Vitest + Testing Library; browser terhubung API nyata |

Permintaan konsultasi adalah simulasi persisten dalam memori; tidak ada pasien nyata, transaksi, telemedicine nyata, auth, layanan eksternal, Prisma, NestJS, Redis, migration, atau kode proprietary. ReallySick tidak disentuh.

Mode hanya dipilih di Pengaturan dengan konfirmasi eksplisit dan localStorage. Secure adalah default; server tetap memvalidasi dan memeriksa sandbox. Source browser bukan otorisasi untuk melewati guard. Satu layanan search memakai SQL helper lama; ekspor memakai command helper lama; tidak ada implementasi sink duplikat.

Tabel konsultasi memakai koneksi SQLite yang sama. Insert terparameter membuka query_only hanya secara sinkron dan mengembalikannya di finally. Uji memastikan search rentan tetap read-only setelah insert.
