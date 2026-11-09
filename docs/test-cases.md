# Pengujian CareProbe Health — 26 Oktober 2026

Lingkungan aktual: macOS, Node 24.4.1, pnpm 10.13.1, Docker Engine 28.3.2; API Linux Node 22 dalam container lokal. Semua data fiktif. Tidak ada shell injection yang dieksekusi pada host.

## Pengujian Injection melalui URL dan Query Parameter — hasil terbaru

Baseline sebelum enhancement URL dijalankan ulang: **85 API/unit +17 UI =102 lulus**, check0/0, **39 Docker checks lulus**. Branch awal `codex/careprobe-health-refactor` bersih, HEAD `817b5bba12c7f63c710fa6859cbd40911ee89811`. Angka di bagian refactor sebelumnya di bawah adalah historis.

| Pemeriksaan baru | Hasil aktual |
| --- | --- |
| NODE_ENV=test pnpm test | **116 API/unit +20 UI =136 lulus**, delapan file suite |
| pnpm check | **0 error /0 warning** |
| pnpm build | Berhasil, API tsc dan SvelteKit adapter-node |
| pnpm test:docker | **53 pemeriksaan lulus**, inspect/gate sebelum command, termasuk GET/POST setara |
| pnpm test:smoke dengan preview aktif | **13 pemeriksaan lulus**, lima halaman/redirect/proxy/persist + dua URL layanan SSR-safe |
| Browser direct API URL | SQL normal count1, payload vulnerable6, secure0; keyword terdecode satu kali |
| Browser direct /services?keyword=... | gigi terisi dan1 record, Settings vulnerable6 /secure0; form setelah URL tetap menghasilkan1 saat cari gigi |
| Browser secure command URL | JSON VALIDATION_ERROR teramati; HTTP400/no attachment juga diverifikasi HTTP Docker |
| Browser GET attachment normal | **BLOCKED** ERR_BLOCKED_BY_CLIENT pada Chrome alat; tidak dilewati, tidak ada file browser yang diklaim berhasil |
| HTTP GET attachment normal/marker | **PASS**, TXT recordID2 Bima Demo dan marker baris tambahan benar, nama file tetap; salinan HTTP disimpan |
| Review source/tests | Tidak ada temuan actionable; review read-only, tidak menjalankan ulang suite |

Regresi fokus: URL SQL literal encoded normal/tautologi kedua mode, missing/invalidmode, duplicate keyword, length121, titik koma, percent encoded dua kali tidak didecode ulang; seed tetap. GET export: ID invalid/missingrecord, judul kosong/41/81/newline/duplicate/field ekstra, suffix selain printf tetap, encoded dua kali ditolak; normal dua mode/missingtitle/invalidmode, record cocok, GET=POST, filename tetap, cache no-store. GET host label normal dan marker vulnerable503 SANDBOX_REQUIRED. Tidak ada child process command yang dieksekusi pada host. UI mengirim tepat satu request awal dan satu per submit; homepage compact mengabaikan query.

Sumber non-form lain yang sudah ada: POST JSON membaca `req.body.documentTitle`; pemeriksaan Docker membandingkan TXT GET dan POST untuk record2 serta mode normal, dan memeriksa marker POST. JSON body bukan query URL. ID path masuk validasi/lookup terparameter saja dan tidak diklaim rentan. Validasi frontend dan URL encoding bukan kontrol pengganti di backend.

Verifikasi curl langsung terhadap API Docker dilakukan setelah `pnpm test:docker` memastikan `commandSandbox:true`: POST JSON judul normal → HTTP200/TXT record2 Bima Demo; POST JSON marker Vulnerable → HTTP200/TXT record2 dengan baris tambahan `LAB_MARKER`; input sama pada Secure → HTTP400 `VALIDATION_ERROR` tanpa TXT. Salinan isi respons curl ada di `evidence/http-post-normal.txt` dan `evidence/http-post-vulnerable.txt` (bukan unduhan browser). Header dan status diperiksa di terminal; Bruno belum dijalankan.

RED yang diamati: 21 GET host tests gagal404 sebelum route tersedia; dua UI tests gagal keyword kosong sebelum membaca URL; Docker GET gagal404 terhadap image baseline. Sesudah handler bersama dan onMount kecil serta rebuild, seluruh pemeriksaan di atas lulus. SQL direct URL sudah tersedia, jadi tes sumber encoded SQL mengarakterisasi perilaku existing tanpa mengubah SQL helper.

Bukti tambahan:

- `evidence/url-http.json`: enam request URL lengkap, waktu aktual, status, header dan body dari fetch HTTP ke API Docker setelah commandSandbox:true.
- `evidence/url-summary-normal.txt`, `url-summary-vulnerable.txt`: **salinan respons HTTP**, bukan unduhan browser. Normal tanpa marker, vulnerable `Judul: clinic-demo` lalu LAB_MARKER; kedua TXT cocok dengan record2.
- `evidence/url-sql-vulnerable.png`, `url-sql-secure.png`: konten tab API browser count6/0.
- `evidence/url-command-secure.png`: konten tab error validasi.
- `evidence/url-services-page.png`: UI katalog dari URL encoded pada mode rentan.

Screenshot tab ini tidak mencakup address bar/DevTools. Checklist capture lengkap dan URL copy-paste ada di README. Jangan menyebut bukti HTTP sebagai screenshot/download browser. Bruno collection diperbarui tetapi **tidak dijalankan melalui Bruno**. DOCX mahasiswa tidak disentuh.

Tidak ada perubahan command.ts, sandbox.ts, database.ts, Dockerfile, Compose, networking, dependency atau lockfile. Egress bridge tetap belum diblokir. Timeout/stress/destructive test tetap tidak dijalankan. Tidak ada deployment atau akses ReallySick.

## Hasil refactor sebelumnya (historis)

## Baseline yang diperiksa ulang

Sebelum perubahan perilaku: **49 backend + 12 frontend = 61 tes lulus**, check **0 error / 0 warning**, dan **24 Docker checks lulus**. Build juga lulus pada awal refactor (halaman Settings awal sudah ditambahkan saat build tersebut). Angka ini adalah baseline, bukan hasil final refactor.

## Hasil refactor

| Pemeriksaan | Hasil aktual |
| --- | --- |
| `NODE_ENV=test pnpm test` | 85 API/unit + 17 UI = 102 tes lulus |
| `pnpm check` | TypeScript dan Svelte: 0 error, 0 warning |
| `pnpm build` | API tsc dan SvelteKit adapter-node berhasil |
| `docker compose up --build -d --force-recreate --wait` | API sehat; konfigurasi isolasi tetap |
| `pnpm test:docker` | 39 pemeriksaan lulus: 24 lama + 15 alur produk |
| `pnpm preview` lalu `pnpm test:smoke` | 11 pemeriksaan HTTP lulus, termasuk lima halaman, tiga redirect, SQL via proxy dan persistensi konsultasi |
| Browser desktop 1280 px | Navigasi, default Secure, konfirmasi rentan, refresh preference, SQL 6/0, submit dan Riwayat, ekspor normal/marker/penolakan secure teramati |
| Browser mobile 390 × 844 | Lima halaman terbaca, nav dapat digunakan, form dan kartu menyesuaikan lebar; halaman yang diukur memiliki scrollWidth = clientWidth 390; penolakan ekspor tampil pada kartu |
| File unduhan Chrome | TXT normal dan marker benar-benar tersimpan, dibaca ulang, cocok dengan record ID 5 Nadia Browser Demo |
| Shutdown dan offline | Docker Compose down berhasil; browser katalog menampilkan panduan Docker tanpa data palsu; preview dihentikan |
| Review independen | Inspeksi read-only source/tests; tidak menemukan temuan yang perlu diperbaiki; reviewer tidak menjalankan tes sendiri |

## Matriks regresi

| Kasus | Ekspektasi dan observasi | Verifikasi |
| --- | --- | --- |
| Health dan seed | 200, DB ready, enam layanan | API/unit + Docker |
| Search normal kedua mode | gigi satu record, kosong enam | API + Docker/browser katalog |
| Services tautologi | `' OR 1=1 -- `: vulnerable 6, secure 0, tanpa query internal di respons produk | API + Docker + proxy + browser |
| Legacy SQL | Binding/template, UNION ALL ID duplikat, sintaks rusak 400, stacked write ditolak | API; duplicate rows/escaping UI |
| Mode produk invalid/hilang | Secure fallback | API + Docker ekspor |
| Mode legacy invalid | 400 | API + Docker |
| Konsultasi create/list | POST 201 dan GET memuat record yang benar | API + Docker + proxy + browser |
| Required fields/length/type/ID/service | 400 atau service tidak ada 404, tanpa insert palsu | API |
| Karakter quote/HTML pada konsultasi | Disimpan sebagai data terikat, UI escape teks | API + UI |
| Query-only setelah insert | Insert sah selesai, query rentan tetap tidak dapat menulis, seed utuh | API + database unit + Docker |
| Export normal kedua mode | TXT UTF-8, filename server-controlled, record terpilih | Docker + UI Blob + Chrome file nyata |
| Export marker vulnerable | Baris ekstra LAB_MARKER, record tetap sesuai | Docker + Chrome file nyata |
| Export marker secure/default/invalid mode | 400 VALIDATION_ERROR, tanpa attachment/output | API + Docker + browser secure |
| Export unknown/invalid ID | 404 / 400 terkontrol | API |
| Judul invalid/40/41/path/command lain | 40 normal diterima, lainnya ditolak sesuai grammar | API + Docker |
| Host command dan export | Kedua mode normal 503 SANDBOX_REQUIRED; marker vulnerable juga diblokir | API host, tanpa eksekusi child process |
| Sandbox facts hilang | Fail closed | Sembilan unit policy |
| Body/JSON/Origin/unknownroute | 413 / 400 / 403 / 404 JSON | API |
| UI loading/empty/offline/proxy error | Status/alert, tanpa hasil palsu | Testing Library |
| Pending POST | Tombol disabled, satu request, tidak retry | Testing Library |
| Settings | Default secure, persist, invalid storage safe, confirm/cancel | Testing Library + browser refresh |
| Ekspor error lokasi | Alert berada pada kartu record yang ditekan | UI regression + browser mobile |
| Docker controls | UID10001, read-only, cap_drop ALL, no-new-privileges, no mounts, 48 PID/256MiB/0.5CPU, localhost3100 | Inspect sebelum payload + runtime gate |

## RED → GREEN dan kegagalan yang dicatat

- Settings/store, propagasi mode layanan, persistensi konsultasi, export host guard, dan komponen konsultasi diuji gagal sebelum implementasi, kemudian lulus.
- Skrip Docker baru terhadap image baseline gagal HTTP400 pada mode services; setelah rebuild endpoint produk tersedia. Tes header awal terlalu mengasumsikan filename berpetik; Express mengirim nama token valid tanpa petik. Assertion sekarang menerima kedua bentuk legal dengan nama tetap yang sama.
- Browser menemukan feedback ekspor di atas halaman dapat berada di luar layar. Tes penempatan alert pada article gagal, lalu lulus setelah feedback dipindahkan ke kartu terkait.
- Supertest dalam sandbox alat sempat gagal `listen EPERM 127.0.0.1`. Pengulangan dengan izin loopback berhasil; ini bukan kegagalan fitur dan guard host tidak diubah.
- Event download pada alat browser timeout, termasuk saat Chrome berhasil menyimpan berkas. File Chrome dibaca langsung dari nama unduhan yang dibuat test dan isinya diverifikasi. Keberhasilan IAB menulis file ke disk tidak diklaim.

## Bukti yang disimpan

- `evidence/health-home-desktop.png`, `health-home-mobile.png`: produk dan navigasi.
- `evidence/health-services-vulnerable.png`, `health-services-secure.png`: input tautologi pada katalog biasa.
- `evidence/health-export-secure.png`: error mitigasi pada kartu mobile.
- `evidence/health-summary-secure.txt`, `health-summary-vulnerable.txt`: salinan unduhan Chrome aktual, record ID5 yang dibuat melalui UI. Tanggal/ID adalah bukti sesi, bukan seed yang selalu sama.
- `evidence/command-vulnerable.png`: bukti historis MVP dashboard awal; jangan digunakan sebagai screenshot UI refactor.

## Kontrak API

| Endpoint | Input | Sukses / efek |
| --- | --- | --- |
| GET /api/health | Tanpa input | 200 status/database/commandSandbox, baca saja |
| GET /api/services | keyword string <=120, tanpa titik koma; mode secure/vulnerable, invalid/hilang secure | 200 mode/keyword/count/services; query-only, tanpa query/parameters |
| GET /api/consultations | Tanpa input | 200 consultations, join serviceName, terbaru dahulu |
| POST /api/consultations | serviceId number positif <=999999999; nama trim2–60; alasan trim3–500; strict object | 201 consultation, satu insert bound ke DB memori; service tak ada404 |
| GET atau POST /api/consultations/:id/export | GET query / POST body; ID positif 1–9digit tanpa leadingzero; body documentTitle default ringkasan-konsultasi, mode invalid/hilang secure | 200 text/plain UTF-8 attachment careprobe-konsultasi-ID.txt; tanpa write filesystem; record tidak ada404 |
| GET /api/labs/sql | Legacy mode defaultsecure, invalid400; keyword seperti services | 200 hasil + query/parameters untuk regresi internal |
| POST /api/labs/command | Legacy label, mode defaultsecure invalid400 | 200 formatter output/shell/timeout/limit; helper sama seperti ekspor |

Judul/label normal 1–40 ASCII huruf/angka/underscore/hyphen. Vulnerable hanya menambah suffix literal `; printf LAB_MARKER`. Semua body <=2KiB; field ekstra ditolak untuk input strict. Error `{error:{code,message}}`: 400 validasi/JSON/SQL, 413 body, 503 sandbox, 429 busy, 504 command limit. Tidak ada stacktrace. Origin luar daftar localhost403. Tidak ada auth; seluruh record hanya fiktif. POST tidak idempotent: cek Riwayat sebelum mengulang setelah timeout.

## Batas yang belum atau tidak diuji

- Dedicated bridge **tidak memblokir egress**. Baseline internal:true membuat health internal berhasil tetapi published port hilang pada Docker Desktop. Konfigurasi bridge dipertahankan. Tidak ada uji koneksi keluar atau klaim isolasi jaringan lengkap.
- Timeout1s/output4KiB/concurrency1 tetap pada helper yang tidak diubah; konfigurasi resource diperiksa. Tidak dilakukan stress, timeout exhaustion, arbitrary shell, destructive test, atau pembacaan secret.
- Bruno CLI/aplikasi tidak dijalankan; collection diperbarui untuk request yang ekuivalen dengan tes API/Docker. Ini bukan klaim collection telah lulus melalui Bruno.
- Pemeriksaan responsif terbatas desktop1280 dan mobile390, bukan seluruh perangkat/browser atau audit aksesibilitas menyeluruh.
- Data reset pada restart; tidak ada auth, persistence disk, layanan medis, atau deployment publik.

## Materi 9 — Client Side Security: XSS dan CSRF (2 November 2026)

Baseline aktual sebelum perubahan: branch codex/careprobe-health-refactor bersih, HEAD146283001a0b026ea22ce354f358a9ede5f84dee; 116 API/unit +20 UI =136 lulus. Angka 26 Oktober di atas merupakan bukti historis.

- NODE_ENV=test pnpm test:117 API/unit +25 UI =142 lulus. Satu skenario integrasi CSRF mencakup cookie, inisialisasi, token missing/invalid/session lain, request sah, GET nonmutating, mode sync terlindungi, origin rentan tepat, origin lain ditolak, dan sesi wajib. Tes UI memeriksa exact gate HTML, teks Secure, input aktif lain escaped, keyword normal kedua mode, persistensi mode, dan consultation reason tetap escaped.
- pnpm check:0 error/0 warning. pnpm build:berhasil, API tsc + frontend adapter-node.
- pnpm test:docker:53 pemeriksaan lulus, termasuk guard sebelum marker shell, SQL0/6, GET/POST export serta record nyata. Tidak ada perubahan sandbox/database/command helper.
- pnpm test:smoke:13 pemeriksaan lulus pada preview lokal dan API Docker, lima menu tetap.
- RED diamati: endpoint sesi404 sebelum implementasi. Fragmen SVG percobaan tidak menghasilkan event pada browser; tidak diklaim berhasil dan diganti dengan exact tombol onclick user-triggered.
- Browser Chrome: URL exact tombol + mode Vulnerable, klik Uji marker mengisi span data-xss-marker menjadi XSS_MARKER (DOM aktif benar-benar teramati). Retest Secure input identik: escaped text, tidak ada tombol aktif atau span marker. Ini bukan sekadar pemformatan HTML.
- Browser CSRF: sesi dibuat lewat Settings; pengingat Nonaktif. Form biasa origin4180 tanpa cookie/token eksplisit mengirim POST ke4173; response JSON vulnerable/reminder:true, reload Settings menjadi Aktif. Cookie otomatis dibuktikan oleh penerimaan request melalui lookup sesi wajib dan state sesi korban yang sama; nilai cookie tidak dibaca/disimpan dalam bukti. Screenshot header cookie DevTools dengan nilai ditutup masih perlu ditangkap mahasiswa.
- Browser Secure: kontrol sah mengembalikan Nonaktif; form4180 yang sama menghasilkan CSRF_REJECTED, reload tetap Nonaktif; kontrol sah dengan token kemudian berhasil Aktif. Status200/403 tepat juga diverifikasi integrasi API. Screenshot tab tidak mencakup Network/status/header, jadi jangan klaim screenshot Network telah tersedia.

Bukti konten tab aktual: evidence/m9-xss-vulnerable.png, m9-xss-secure.png, m9-csrf-vulnerable.png, m9-csrf-secure.png. Tidak berisi cookie/token. Checklist address bar, source dan DevTools lengkap ada di README; tidak ada screenshot yang direkayasa. Browser ditinggalkan dalam mode Secure sebelum shutdown.

Batas: XSS adalah refleksi URL ke DOM klien dengan klik, bukan server-reflected HTML atau stored XSS. Handler hanya tepat fragmen allowlisted; arbitrary HTML tetap escaped. Tidak ada CSP global sebelumnya; tidak ada CSP global dinonaktifkan. CSRF lintas port adalah cross-origin tetapi same-site; tidak menguji arbitrary cross-site Lax POST. Cookie Secure flag tidak digunakan pada HTTP loopback; HttpOnly/Lax/path sempit/max-age aktif. Map maksimal100 sesi/1jam/reset startup, bukan sistem login. Tidak ada brute-force/stress/expiry browser panjang yang dijalankan. Egress Docker tetap belum diblokir. Tidak ada akun/pasien nyata, token theft, DOCX changes, deploy atau akses ReallySick.

## Materi 10 — Authorization: Access Control dan Privilege Management (9 November 2026)

Baseline lokal: branch feat/careprobe-client-side-security, working tree bersih, HEAD0a71f8e83da6a85a63d8a5f25ef85380b23122c0. NODE_ENV=test pnpm test sebelum perubahan:117 API/unit +25 UI =142 lulus. Seluruh angka Materi8/9 di atas adalah historis.

| Verifikasi aktual | Hasil |
| --- | --- |
| NODE_ENV=test pnpm test |130 API/unit +29 UI =159 lulus,11 file suite |
| pnpm check |0 error/0 warning |
| pnpm build |Berhasil API tsc dan SvelteKit adapter-node |
| pnpm lab:up |Build/start/health Docker standar berhasil; image metadata sempat lambat |
| pnpm test:docker |53 checks lulus; guard, SQL0/6, marker shell, GET/POST export dan state legacy |
| pnpm test:smoke |13 checks lulus pada preview4173; lima menu, redirect, proxy, persistensi konsultasi |
| HTTP otorisasi Docker |22 observasi status/state diverifikasi; evidence/m10-http.json tanpa credential/token/cookie |
| git diff --check |Bersih |

RED: protected endpoint404 sebelum implementasi. Tes baru login/ownership kemudian lulus; matriks13 skenario API menguji dua pasien, assigned/unassigned doctor, Admin least privilege, ownership detail/summary, create owner dari sesi, strict spoof fields, role live, segregation of duties setelah role switch, workflow state, CSRF seluruh mutasi, anonymous/invalid cookie, login salah, rotasi account/logout, expired session dengan spy Date.now, deterministic reset dan legacy isolation. Kegagalan resolver $lib pada tes Settings diperbaiki memakai relative import sesuai pola existing; suite penuh diulang dan lulus.

| Request/state awal | Vulnerable aktual | Secure aktual |
| --- | --- | --- |
| Alya own1001 |200/PENDING |200/PENDING |
| Alya detail/summary1002 |200 record Bima, tanpa mutasi |403 OWNER_DENIED, tanpa mutasi |
| Alya POST review1001/PENDING |200/IN_REVIEW |403 ROLE_DENIED/tetap PENDING |
| Alya complete atau review1002 |403 |403 |
| Raka review/complete assigned1002 |200/IN_REVIEW lalu200/COMPLETED |200/IN_REVIEW lalu200/COMPLETED |
| Raka view/review1003 (unassigned) |403 |403 |
| Raka complete1001 langsung/PENDING |200/COMPLETED |409 WORKFLOW_DENIED/tetap PENDING |
| Reopen/recomplete COMPLETED |409/tetap COMPLETED |409/tetap COMPLETED |
| Pasien assign ADMIN/reset |403/tidak berubah |403/tidak berubah |
| Admin read fixture content |403 |403 |
| Admin revoke Raka DOCTOR→PATIENT, sesi dokter lama |200 role live PATIENT, review1002 lama403 |200 role live PATIENT, review1002 lama403 |
| Creator Raka (saat PATIENT) kemudian DOCTOR mereview own record |403 DUTY_CONFLICT |403 DUTY_CONFLICT |
| Anonymous/invalid/expired identity |401 |401 |
| POST auth tanpa token atau Origin4180 |403/tidak berubah |403/tidak berubah |

Bukti browser aktual Chrome: login Alya via Settings, own list1001 tanpa tombol dokter; direct GET1002 Secure menampilkan OWNER_DENIED, sesudah mode Vulnerable via Settings menampilkan record Bima. Login Raka merotasi identity dan UI dokter menampilkan fixture assigned1001/1002; klik review1001 kemudian complete menghasilkan COMPLETED; direct1003 menampilkan ASSIGNMENT_DENIED. Login Admin menampilkan role/audit tanpa isi fixture; klik revoke Raka menjadi PATIENT, reset mengembalikan role/fixture, logout menghapus identity. Reminder Secure sesudah rotasi login tetap berhasil (callback me-refresh token parent). Status numerik tepat dan penolakan state diperiksa API/HTTP, bukan ditebak dari screenshot.

Screenshot konten tab: evidence/m10-patient.png, m10-idor-secure.png, m10-idor-vulnerable.png, m10-doctor-completed.png, m10-admin-revocation.png. Tidak mencakup address bar atau Network lengkap; mahasiswa masih perlu capture sesuai checklist README. Tidak menyimpan cookie, password atau token. Browser dua profil untuk revokasi sesi paralel belum dijalankan; revokasi sesi lama dibuktikan melalui dua cookie jar nyata HTTP dan integration test. New authorization summary200/403 diuji API; browser download TXT auth belum diverifikasi. Tidak ada klaim screenshot/download yang tidak dijalankan.

Regresi Materi8:53 checks Docker memastikan sink command tetap container-only, fixed marker/allowlist/limits tidak berubah. Materi9: existing XSS exact gate/escaped output, ordinary consultation escaping, Settings confirmation/persistence dan CSRF vulnerable/secure/token/session cases tetap lulus suite; event XSS dan forged form cookie browser Materi9 tidak diulang pada sesi ini (bukti browser2Nov tetap historis). Pengingat Secure browser diuji kembali setelah login. Tidak ada perubahan database.ts, command.ts, sandbox.ts, Compose/Dockerfile, dependency, lockfile atau lima navigasi.

Batas scope: fixture otorisasi Map terpisah dari SQLite; legacy consultation tetap tidak diautentikasi dan tidak mengekspos fixture Map. Identitas demo/hash credential publik bukan auth produksi, tanpa brute-force/load/recovery testing. Privilege creep dicegah dengan role live pada kedua mode; stale-role exploit tidak dibuat. Audit100 keputusan hanya mencatat timestamp/actor/action/resource/allowed/reason, bukan event infrastructure lengkap. GET audit menambahkan log keputusan read, tetapi tidak memutasi fixture/role/preferensi. Sesi satu jam/max100, recordmax100, data reset startup. Egress Docker tetap belum diblokir. Tidak ada deployment, akses ReallySick, DOCX edit atau command injection host.

## Login/logout website — 9 November 2026

Baseline pada awal tahap UX: working tree Materi10 belum di-commit dan dipertahankan, branch feat/careprobe-client-side-security. Suite baseline130 API/unit +29 UI =159 lulus. Implementasi backend authorization/demo-session Materi10 tidak diubah pada tahap login website ini; kontrak API, scrypt, cookie, expiry dan rotasi digunakan kembali.

| Pemeriksaan aktual | Hasil |
| --- | --- |
| NODE_ENV=test pnpm test |130 API/unit +47 UI =177 lulus,14 file suite |
| pnpm check |0 error/0 warning |
| pnpm build |Berhasil API tsc dan SvelteKit adapter-node |
| pnpm test:docker |53 checks lulus; SQL, command marker, sandbox, GET/POST export |
| pnpm test:smoke |14 checks lulus; tambahan login SSR-safe, lima navigasi tetap |
| Targeted Settings setelah perbaikan fixture tes |3 lulus, termasuk401 expiry reminder membersihkan identitas |
| git diff --check |Bersih |

RED: tes helper login gagal resolve karena auth.ts belum dibuat. Dua suite komponen awal gagal resolve $app/navigation; ditambahkan mapping Vitest ke modul SvelteKit existing agar navigasi bisa di-mock. Feedback penolakan AuthorizationPanel tetap memuat status403 setelah reuse API helper. Setelah perbaikan, seluruh suite dan gate di atas benar-benar dijalankan dan lulus.

| Acceptance | Bukti aktual |
| --- | --- |
| AUTH01/02 | Backend login/hash valid/invalid existing tests; helper memakai endpoint existing dan mengirim account/password tanpa role; browser credential salah memberi pesan generik lalu login Alya berhasil |
| AUTH03/04 | Header komponen memakai nama/role backend; refresh browser Riwayat mempertahankan Alya/Pasien dan own fixture |
| AUTH05/06 | Logout POST existing, old session invalid pada API tests; browser header menjadi Masuk dan direct protected GET kembali LOGIN_REQUIRED |
| AUTH07 | Expiry backend dengan spy Date.now existing; helper restore401 membersihkan store, Settings reminder401 juga membersihkan store; tidak menunggu satu jam di browser |
| AUTH08/09 | Backend account switching merotasi cookie; browser logout Alya→login Raka→logout→login Admin menampilkan masing-masing role/action yang benar, tanpa identity sebelumnya |
| AUTH10/11 | Browser Settings Vulnerable setelah login membuka IDOR1002; kembali Secure berhasil; reminder update dan dokter review1001 memakai token sesudah rotasi, berhasil |
| AUTH12/13 | localStorage user palsu tidak mengubah hasil restore401; backend role/query/body spoof tetap diuji; seluruh13 skenario otorisasi dua mode lulus |
| AUTH14 | Katalog publik dan query SQL tetap lulus UI/API/Docker/smoke |
| AUTH15 | Helper/login komponen menampilkan API_OFFLINE yang berbeda dari credential invalid; failed logout mempertahankan identitas dan tidak navigasi/sukses palsu pada tes fetch failure |

Tes form tambahan: field wajib, tidak mengirim credential kosong, tombol disabled selama pending dan submit kedua tidak terkirim, password field dikosongkan setelah submit, next path eksternal ditolak, already-authenticated redirect. Header memulihkan identity lewat API; tidak ada password/token/cookie di localStorage. Perubahan mode lewat Settings tetap satu selector; identitas selalu dari sesi backend.

Bukti browser Chrome: evidence/login-page.png (form kosong desktop), login-restored-header.png (identitas sesudah refresh), login-mobile.png (390x844; scrollWidth390, tidak ada overflow horizontal). Screenshot tidak mengandung password/token/cookie; hanya konten tab. Form Settings lama tidak terlihat; lima nav produk tetap. Already-authenticated /login kembali ke /history teramati. Setelah pengujian, mode Secure dan akun logout.

Batas bukti: offline/failed logout dan expiry diuji dengan API/component mocks + existing backend tests, bukan kegagalan jaringan/penantian1jam browser nyata. Browser login/refresh/logout dan role actions nyata diverifikasi terpisah; tes mock tidak diklaim sebagai bukti browser. Event XSS dan forged CSRF form tidak diulang browser pada tahap ini; existing exact gate, escaping dan sesi/CSRF cases lulus regresi, serta reminder browser setelah login berhasil. Egress Docker tetap belum diblokir. Legacy consultation/injection tetap publik dan terpisah dari protected fixture. Tidak ada broad route guard, cookie tambahan, backend auth baru, dependency, deployment, ReallySick atau DOCX edit.

## Materi 10 — Bab 2: Privilege Management (9 November 2026, lanjutan)

Baseline aktual tahap ini: working tree Materi10/login belum di-commit, branch feat/careprobe-client-side-security;130 API/unit +47 UI =177 lulus. Pernyataan revocation kedua mode403 pada tahap sebelumnya adalah **hasil historis sebelum** scoped stale-review ditambahkan, bukan perilaku terkini review1002.

| Pemeriksaan benar-benar dijalankan | Hasil terbaru |
| --- | --- |
| NODE_ENV=test pnpm test |139 API/unit +51 UI =190 lulus;14 file suite |
| pnpm check |0 error,0 warning |
| pnpm build |API tsc dan frontend production berhasil |
| pnpm lab:up |Docker build/start/health berhasil |
| pnpm test:docker |53 checks lulus; isolasi, SQL0/6, command marker, GET/POST export, state legacy |
| pnpm test:smoke |14 production-preview HTTP checks lulus; lima nav, login SSR, proxy/persistensi |
| HTTP aktual Docker |26 observasi tersimpan pada evidence/privilege-http.json, tanpa password/cookie/token |
| Browser aktual |Dua sesi terpisah Chrome Raka dan IAB Admin; request/approve/reject/use/review/revoke dan stale-review V/S |
| Targeted authorization integration |22/22 lulus; percobaan dalam sandbox gagal listener EPERM, ulang dengan izin loopback berhasil tanpa perubahan source |
| git diff --check |Bersih setelah perubahan dokumentasi dan manifest |

Target perilaku baru: lifecycle /privilege serta scoped stale-review yang sebelumnya tidak tersedia. Implementasi memakai router/Map/session yang sama; sembilan kasus API tambahan (termasuk parameterisasi) mempertahankan13 kasus lama. UI memakai privilege response fixture; run awal menemukan3 stub lama mengembalikan object kosong; fixture diperbaiki, bukan melemahkan kontrak produk. Empat UI cases baru memeriksa request/approve/reject/revoke, body/action/token dan state. Tidak ada dependency atau command test host.

| Skenario / state awal | Hasil aktual Vulnerable | Hasil aktual Secure | Bukti |
| --- | --- | --- | --- |
| Raka PATIENT request |201 REQUESTED/inactive, tetap PATIENT |Sama |API, HTTP, browser |
| Raka approve sendiri |403, tetap REQUESTED |Sama |API dan HTTP |
| Admin approve/review |200 ACTIVE/effective DOCTOR/base PATIENT, expiresAt tepat5menit |Sama |API; HTTP/browser Secure |
| Review1001 ketika grant aktif |200/IN_REVIEW |200/IN_REVIEW |API expiry-1ms, HTTP/browser Secure |
| Admin reject/re-request |REJECTED/PATIENT; request berikut201 |Sama |API, browser Secure |
| Admin revoke grant |REVOKED/inactive/identity PATIENT |Sama |API, HTTP; browser Secure |
| Login DOCTOR, Admin revoke role, sesi lama review1002 |200/IN_REVIEW, audit STALE_DOCTOR_SNAPSHOT |403/PENDING |API, HTTP dua cookie jar, dua browser nyata |
| Login saat grant aktif, kemudian revoke, sesi lama review1002 |200/IN_REVIEW |403/PENDING |HTTP Docker |
| Tepat expiry, sesi belum expired |EXPIRED/PATIENT; review1002 stale200/IN_REVIEW |EXPIRED/PATIENT; review1002 403/PENDING |Vitest spy Date.now, bukan penantian browser |
| Role revoked: review1001/1003, complete1002, roles/accounts |403 |403 |API; snapshot hanya review1002 |
| Login ulang PATIENT setelah revoke |Review1002 403, snapshot lama tidak diwarisi |Sama |API |
| Logout/account switch/session expired |Sesi lama401; identity lain tidak mendapat snapshot Raka |Sama |API; tidak memperpanjang expiry sesi |
| Alya create201 lalu review record response ID |200/IN_REVIEW oleh creator |403/tetap PENDING |API actual create, bukan sekadar seed |
| Raka creator saat PATIENT lalu DOCTOR |403 DUTY_CONFLICT |403 DUTY_CONFLICT |Regresi existing API |
| IDOR/vertical/forced browsing/workflow |Omission existing tetap200 sesuai matriks historis |403 ownership/role,409 skipped workflow; state tetap |Seluruh suite API existing |
| Invalid action/duration/role, konflik lifecycle, unauthorized review |400/409/403 sesuai kontrak |Sama |API strict schema/actor guards |
| POST /privilege tanpa token/Origin tepercaya |403, tidak mengubah grant |Sama |CSRF loop existing diperluas |

Expiry memakai server Date.now: aktif pada deadline-1ms, invalid tepat deadline; expiry tercermin pada review Admin dan event EXPIRED hanya sekali. Tidak ada sleep5menit, perubahan jam OS atau klaim screenshot browser expiry. APPROVED adalah event audit yang langsung mengaktifkan grant, bukan state tersimpan terpisah.

Bukti browser aktual:
- privilege-requested.png: Raka PATIENT, REQUESTED/inactive.
- privilege-active.png: basePATIENT/effectiveDOCTOR, ACTIVE, expiry UTC dan approver admin; review1001 kemudian berhasil.
- privilege-revoked.png dan privilege-rejected.png: Raka tetap login PATIENT dengan state terminal/inactive.
- privilege-creep-vulnerable.png: aksi lama diterima, setelah reload identity PATIENT. privilege-creep-audit.png: audit Admin STALE_DOCTOR_SNAPSHOT untuk1002.
- privilege-creep-secure.png:403 dan daftar lama1002/PENDING; label dokter masih cached sebelum reload. Reload sesudahnya benar-benar menunjukkan PATIENT. Screenshot ini sendiri tidak membuktikan role live; HTTP identity/state dan observasi reload melengkapinya.

Screenshot hanya konten tab, tanpa address bar/DevTools/cookie/token/password. Mahasiswa masih perlu capture request/status/time/state sesuai README Bab2; actual HTTP JSON26 observasi melengkapi status dan state. Browser expiry5menit, protected TXT download dan replay XSS/forged CSRF browser tidak diulang pada tahap ini; regresi API/UI,53Docker checks dan bukti browser tahap sebelumnya tidak disamakan dengan verifikasi browser baru.

Review keamanan: single snapshot bukan role global; hanya Raka review1002, normal assignment/creator/PENDING tetap berlaku; complete/admin/unassigned ditolak. IDOR pasien Vulnerable adalah sink lama terpisah. Login/logout/rotation/expiry dan semua mutasi privilege tetap CSRF-protected; body tidak dapat memilih mode/user/role/duration. Admin /roles juga mencabut grant pending/active, reset membersihkan grant/fixture dan mengembalikan baseDOCTOR. Legacy SQLite/command terpisah dari Map otorisasi.

Batas: satu grant5menit memori, satu Admin, audit100, sesi1jam/max100; expiry dicatat saat pertama diamati request, UI memerlukan reload untuk tampilan terkini. Tidak ada persistent audit/approval multipihak. Egress Docker tetap belum diblokir; sandbox/command allowlist tidak diubah. Setelah browser test fixture direset, kedua akun logout. Tidak mengakses ReallySick, mengubah DOCX, commit, push atau deploy.

## Pengalaman website terautentikasi — 9 November 2026

Baseline aktual sebelum tahap ini:139 API/unit +51 UI =190 lulus; branch feat/careprobe-client-side-security dengan working tree Authorization/login/privilege belum di-commit. Semua hasil bagian sebelumnya historis.

| Check benar-benar dijalankan | Hasil |
| --- | --- |
| NODE_ENV=test pnpm test |144 API/unit +64 UI =208 lulus,16 file suite |
| pnpm check |0 error/0 warning |
| pnpm build |Berhasil API tsc + SvelteKit adapter-node |
| pnpm lab:up |Backend terbaru build/healthy dengan batas Docker existing |
| pnpm test:docker |53 checks lulus; SQL0/6, command marker, GET/POST export, sandbox, state legacy |
| pnpm test:smoke |14 HTTP preview checks lulus; public-only SSR nav, protected loading shell, login, redirects, legacy proxy |
| HTTP aktual |16 observasi terhadap proxy4173→Docker, evidence/ux-http.json; TXT terpilih evidence/ux-summary.txt |
| git diff --check |Bersih |

Red/Green: lima kasus API baru awalnya gagal (scope personal masih mengembalikan fixture, serviceId belum diterima, reminder terbawa antar akun), kemudian27/27 authorization tests lulus tanpa menghapus22 kasus lama. AuthGate/CarePanel tests diawali missing implementation; kemudian gate8 cases dan care4 cases lulus. Tes race auth tambahan membuktikan response restore lama mengembalikan identity sesudah clear/logout; identityRevision memperbaikinya,11 auth helper tests lulus. Tidak mengubah command sink, SQLite schema, Docker, dependencies atau cookie scope.

| Acceptance | Bukti actual |
| --- | --- |
| Anonymous empat route protected |AuthGate tests redirect safe path; SSR smoke memuat hanya shell tanpa private fields; browser direct /history→/login?next=%2Fhistory |
| No flash/offline/expiry |Gate tidak memasang snippet sampai check selesai; expired identity menghapus konten; offline memberi retry, bukan empty/redirect. API session expiry existing tetap lulus |
| Patient create/service/owner |POST serviceId+reason201; backend serviceName gigi dari katalog, owner Alya sesi; forged patientName/owner/serviceName ditolak400; missing service404 |
| Own history |Backend scoped list Alya own, Bima tidak menerima Alya; default lab list tidak menyisipkan personal records |
| Personal record di sesi Vulnerable |Bima detail/summary403, patient own-review403, Admin content403, doctor skipped-complete409. State denial tetap PENDING |
| Doctor |Assigned normal record review200→complete200; setelah role revoked normal list kosong dan action403; unassigned fixture existing403 kedua mode |
| Summary |Owner200 text/plain attachment filename server, layanan/status sesuai Map; Bima403; CLI menyimpan actual TXT. Tidak ada command untuk personal summary |
| Legacy isolation |Public SQLite list tidak mengandung reason protected; legacy export IDprotected404. SQL read-only/marker allowlist/sandbox existing53 checks lulus |
| Account switching |Browser Alya logout→Bima History kosong→Raka assigned→Admin overview; frontend key identity/role dan revision guard mencegah previous data/late identity |
| Settings |Identitas sesi, reminder aktual berhasil, mode confirmation existing; reminder reset pada akun baru. Role/grant UI dipindah utuh ke Settings |
| Role/grant/lab |Seluruh27 auth cases mencakup Bab2, server5menit/current role/snapshot1002 tetap; normal record tidak menggunakan omission lab |

Browser aktual Chrome:
- Alya login melalui redirect History; katalog enam layanan; klik gigi membawa serviceId2 dan field terpilih; submit menghasilkan record1004/owner Alya/PENDING. Dashboard benar-benar1/pending1, refresh masih login.
- Bima History kosong tanpa record1004. Raka melihat assigned1004, klik review lalu complete →COMPLETED. Admin History tidak menampilkan patient content, Home overview akun/grant/audit dari API, Settings menampilkan izin/audit lama.
- Klik ringkasan normal menampilkan feedback; pemantauan event download sebelumnya timeout dan mereset sesi automation. **Tidak diklaim file browser tersimpan.** HTTP kemudian membuktikan TXT/headers/owner/record/status dan menyimpan ux-summary.txt.
- XSS exact URL dalam Vulnerable menampilkan tombol aktif; klik menghasilkan adjacent XSS_MARKER. Secure input sama menjadi teks tanpa tombol/marker execution. Vulnerable SQL error dari fragment HTML terpisah dari efek XSS.
- CSRF fixture4180 form browser mengubah reminder sesi login yang sama false→true pada Vulnerable tanpa token eksplisit; Secure form identik menampilkan CSRF_REJECTED dan Settings tetap Nonaktif setelah reload. Legitimate control juga berhasil. Cookie otomatis dibuktikan melalui session-required target/state yang sama; nilai cookie tidak disimpan.
- Dashboard di1380x950,768x1024,390x844: document.scrollWidth sama dengan innerWidth. Screenshot mobile390 disimpan; ini bukan klaim semua halaman/breakpoint diuji.
- Logout kembali ke header Beranda/Masuk dan Home publik, mode Secure. Script HTTP terakhir mereset Map/role dan logout cookie jars.

Berkas screenshot actual: ux-public-home.png, ux-login-redirect.png, ux-alya-dashboard.png, ux-bima-history.png, ux-doctor-completed.png, ux-admin-dashboard.png, ux-settings.png, ux-mobile.png, ux-xss-vulnerable.png, ux-xss-secure.png, ux-csrf-vulnerable.png, ux-csrf-secure.png. Screenshot konten tab, bukan address bar/Network. Tidak ada password/token/cookie di evidence.

Batas verifikasi: expiry1jam/offline/restore-race/component denial bukan browser wait/network outage. Grant expiry/rejection/revoke dan privilege creep dipertahankan lewat API tests; interaksi browser Bab2 lengkap dari tahap sebelumnya tidak diulang seluruhnya, hanya lokasi panel/Admin review saat ini diperiksa. SQL/Command aktual diverifikasi Docker/HTTP, bukan diklaim klik browser exploit baru. Reset Admin menghapus semua Map termasuk personal records. No production auth, persistent preferences, scheduling atau realtime role push. Egress Docker belum diblokir; tanpa shell injection host, ReallySick, DOCX edit, commit/push/PR/deploy.

Review independen tahap UX menemukan focus revalidation memasang ulang form sehingga draft hilang. Tes baru benar-benar gagal ketika input menghilang, lalu lulus setelah checkedPath tidak dikosongkan pada revalidasi halaman yang sama. Initial/new routes tetap menunggu check; user/role/401/error tetap mengganti konten. Seluruh208 tests/check/build diulang sesudah perbaikan. Reviewer mengonfirmasi temuan selesai, tanpa temuan authorization tambahan; reviewer tidak menjalankan suite sendiri. Perilaku draft/focus diperiksa component test, bukan klaim replay browser baru.
