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

Mode frontend hanya dipilih di Pengaturan dengan konfirmasi eksplisit dan localStorage. Secure adalah default; server tetap memvalidasi dan memeriksa sandbox. Source browser bukan otorisasi untuk melewati guard. Satu layanan search memakai SQL helper lama; ekspor memakai command helper lama; tidak ada implementasi sink duplikat.

Tabel konsultasi memakai koneksi SQLite yang sama. Insert terparameter membuka query_only hanya secara sinkron dan mengembalikannya di finally. Uji memastikan search rentan tetap read-only setelah insert.

## Pengujian Injection melalui URL dan Query Parameter

| Jenis | Source | Flow / sink | Control / retest |
| --- | --- | --- | --- |
| SQL | req.query.keyword dari URL API | GET /api/services → searchServices → SQLite prepare/step | Binding: payload encoded sama menghasilkan0 pada Secure,6 pada Vulnerable |
| Command | req.query.documentTitle dari URL API | GET /api/consultations/:id/export → handler bersama POST → SQLite record → runCommand → shell | Secure fixed executable/separate args/allowlist menolak marker400; Docker gate tetap |
| Command dari JSON | req.body.documentTitle dari request POST langsung atau form Riwayat | POST /api/consultations/:id/export → handler ekspor yang sama → runCommand | Kontrol dan hasil retest sama; JSON body bukan URL query |

`req.params.id` adalah ID record yang divalidasi dan masuk lookup SQLite terparameter, bukan input yang mencapai sink shell. Tidak ada klaim injection melalui path. Validasi frontend saja tidak cukup: backend tetap memvalidasi kedua sumber HTTP.

URL encoding hanya transport; parameter HTTP selalu untrusted. Settings/localStorage bukan otorisasi: direct caller dapat menentukan mode, namun tidak melewati guard. UI tidak menambah menu/tombol lab. Halaman /services?keyword=... membaca URL saat mount lalu menjalankan search nyata sekali; form normal tetap bekerja.

Bukti HTTP aktual dan batas download browser ada di test-cases.md; panduan langkah/screenshot lengkap di README. Potensi CIA dan mitigasi/retest ada di lab-report.md. DOCX mahasiswa tidak dimodifikasi.

## Materi 9 — Client Side Security: XSS dan CSRF

| Topik | Source → flow → sink | Control / retest |
| --- | --- | --- |
| Reflected XSS melalui URL, rendering DOM klien | keyword → ServiceCatalog ringkasan → @html hanya exact tombol HTML marker | Interpolasi Svelte Secure; payload sama escaped; input aktif lain selalu teks |
| CSRF sesi | Form origin4180 → cookie otomatis → POST reminder → session.reminder | Token sesi + Origin Secure;403 dan state tetap; kontrol sah200 |
| Konteks sesi | Settings → POST session dengan Origin+header khusus | Mode disimpan server, target reminder menolak mode request; HttpOnly/Lax/path sempit/expiry |

SOURCE/FLOW/SINK/CONTROL/EVIDENCE/DAMPAK/MITIGASI/RETEST, prosedur dan checklist lengkap ada pada README bagian Materi9 dan hasil aktual di test-cases.md. Refleksi XSS terjadi pada DOM, bukan respons server. Origin berbeda port tetap same-site; tidak diklaim arbitrary cross-site cookie bypass. Tidak ada akun nyata, notifikasi, token theft atau perubahan DOCX.

## Materi 10 — Authorization: Access Control dan Privilege Management

Chapter1: Subject (identity/role server), Object (fixture owner/assignment/status), Action (view/download/create/review/complete), Policy terpusat di authorization.ts. RBAC membatasi PATIENT/DOCTOR/ADMIN, ABAC memeriksa ownership, assignment dan workflow. Chapter2 memakai kembali IDOR, forced browsing, workflow dan segregation of duties; dilengkapi grant dokter sementara dan satu stale-permission branch review1002. Pemetaan delapan subbab dan batasnya ada di bawah.

Fixture otorisasi Map terpisah dari SQLite legacy, tidak tersedia melalui endpoint lama. Cookie CSRF anonim diperluas dengan login scrypt dan rotasi session/token; mode tetap server-side, semua POST auth tetap CSRF-protected di kedua mode. Daftar endpoint, matriks, SOURCE/FLOW/SINK/CONTROL/EVIDENCE/IMPACT/MITIGATION/RETEST dan screenshot ada pada README bagian Materi10; hasil aktual di test-cases.md. Tidak ada klaim seluruh legacy API sudah terautentikasi.

## Integrasi login/logout website

Authentication Materi10 tetap backend/session yang sama; UI dipindah dari Settings ke `/login`. Header memperlihatkan identity/role hasil GETauth dan logout POST nyata. AuthorizationPanel tetap menjalankan policy Materi10 tanpa form credential. Satu store memori memulihkan sesi setelah refresh, membersihkan identity pada401 dan tidak memakai localStorage sebagai bukti login. Token terbaru dibaca sebelum mutasi agar CSRF Materi9 dan workflow Materi10 tetap berjalan setelah rotasi. Mode hanya Settings; public legacy data tidak diklaim terlindungi. Prosedur dan batas pada README bagian Login dan logout website.

## Materi 10 — Bab 2: Privilege Management

| Subbab / konsep | Implementasi minimum | Bukti dan batas |
| --- | --- | --- |
| 2.1 Mengelola penetapan/pembatasan/review/revoke izin | Mapping PATIENT/DOCTOR/ADMIN existing; satu grant Raka; Admin-only approve/reject/revoke | Request201, self-approve403, approve/review/revoke200; audit tanpa token. Satu Admin, bukan multi-person approval |
| 2.2 Lifecycle permintaan sampai expiry/revoke | REQUESTED → event APPROVED → ACTIVE atau REJECTED → EXPIRED/REVOKED | Server5menit, tes expiry-1ms/exact expiry. APPROVED event langsung diikuti ACTIVE; tanpa job/frontend timer |
| 2.3 Izin minimum per tugas | Admin tidak membaca isi pasien, dokter hanya assigned, pasien own | Admin content403/unassigned1003 403 kedua mode; existing patient-review omission V200/S403. Tidak membuat bypass baru |
| 2.4 Creator dan reviewer berbeda | Owner ditetapkan dari sesi create; Raka requester tidak bisa approve | Alya create nyata201 lalu review sendiri V200/S403 dan state diperiksa; Raka own record DUTY_CONFLICT kedua mode |
| 2.5 Horizontal vs vertical escalation | IDOR detail/summary1002 Alya; review own1001 oleh pasien | Horizontal V200/S403; vertical V200/S403; tidak memberi ADMIN |
| 2.6 Operasi langsung tanpa kontrol UI | POST transition action review sebagai Alya walau tombol dokter tidak ada | HTTP authenticated+CSRF V200/S403 dan PENDING tidak berubah; operasi sama dengan2.3/2.5 |
| 2.7 Tahap workflow wajib | PENDING → IN_REVIEW → COMPLETED | Direct complete V200/S409; jalur sah200; completed tidak dibuka ulang |
| 2.8 Izin lama berlebih setelah dicabut | doctorAtLogin hanya Raka, hanya review1002 Vulnerable setelah role/grant berakhir | Identity tetap live PATIENT; V200/IN_REVIEW + STALE_DOCTOR_SNAPSHOT, S403/PENDING. Bukan cache global; logout/expiry sesi tetap membatalkan akses |

Definisi dirangkum dari konsep dalam permintaan tugas, bukan kutipan PDF yang tidak tersedia. Implementasi/test utama: authorization.ts, demo-session.ts, authorization.integration.spec.ts dan AuthorizationPanel beserta tes. Prosedur, screenshot dan SOURCE/FLOW/SINK/CONTROL/EVIDENCE/DAMPAK/MITIGASI/RETEST tiap skenario ada pada README Bab2 dan lab-report. Hasil terbaru dan batas bukti browser/clock ada di test-cases; hasil lama tetap historis. Login/logout, lima nav dan SQL/Command/XSS/CSRF tidak diganti.

## Pengalaman website terautentikasi

| Requirement | Implementasi / kontrol |
| --- | --- |
| Publik vs aplikasi | Layout+AuthGate; hanya Home/Login publik. SSR protected hanya loading shell; redirect client sesudah verifikasi sesi Path=/api/demo. Bukan klaim SSR authorization |
| Dashboard nyata | CarePanel scope=personal untuk pasien/dokter; Admin accounts/privilege/audit, tanpa patient content. Counts berasal dari response |
| Konsultasi pribadi | POST auth existing dengan serviceId+reason; owner sesi, service lookup katalog SQLite startup. Tambahan metadata server pada Map lama |
| Data berizin | List scope=personal difilter backend; detail/summary/transition personal selalu policy Secure walau mode Vulnerable |
| Role/grant live | Role dan grant authoritative existing; navigation/focus/refresh/denial memperbarui UI; tanpa polling/server push |
| Session lifecycle | Store lama, restore deduplicated, identityRevision mencegah response lama setelah logout/login; reminder tidak terbawa antar akun |
| Lab independent | Default list scope=lab; reason-only create tetap lab; legacy SQLite tidak dapat mengakses Map. SQL/Command/XSS/CSRF dan Bab2 tidak dihapus |
| Bukti | UI/browser role flows, 16 observasi HTTP Docker, ux-summary.txt; screenshot tab ux-*.png. File browser download tidak diklaim tersimpan |

Navigasi lima route tetap ada setelah login. Panel Authorization/Privilege kini di Pengaturan; petunjuk lama yang menyebut Riwayat untuk panel lab mengikuti lokasi baru. Analisis source/sink akademis sebelumnya tetap berlaku **pada fixture lab**, bukan konsultasi pribadi dengan serviceId. Normal consultation tidak menjadi target bypass baru. Panduan/screenshots/batas lengkap README bagian pengalaman terautentikasi.
