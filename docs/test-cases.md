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
