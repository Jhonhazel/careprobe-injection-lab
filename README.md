# CareProbe Health

**Telekonsultasi simulasi lokal** untuk TIG13 Secure Application Development, Material 8: Injection Testing. Pengguna dapat mencari layanan, mengajukan konsultasi fiktif, melihat riwayat, dan mengunduh ringkasan TXT. Ini bukan layanan medis nyata.

**Alur terkini:** Beranda dan Login publik; Layanan, Konsultasi, Riwayat dan Pengaturan memerlukan login. Riwayat normal hanya memakai konsultasi pribadi berizin. Fixture akademis tersedia terpisah di Pengaturan; lihat bagian “Pengalaman website terautentikasi” di akhir dokumen.

SvelteKit + TypeScript → proxy `/api` localhost → Express + TypeScript → SQLite sungguhan (`sql.js`, di memori). Dua aplikasi pnpm, tanpa database eksternal, akun nyata, atau layanan cloud; sesi demo memori untuk preferensi pengingat dan identitas fixture otorisasi. Ekspor judul pada fixture legacy memakai proses Linux, **hanya di Docker sandbox**. Ringkasan pribadi memakai endpoint otorisasi tanpa command. SQL dan command helper MVP digunakan kembali; tidak ada dependency baru.

## Peringatan keamanan

Aplikasi sengaja mengandung query rentan dan contoh shell injection yang ditandai `DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB`. Jangan gunakan pola tersebut dalam aplikasi nyata. Jangan deploy, expose melalui tunnel, atau publish lab ke internet. Gunakan hanya data dummy dan payload contoh pada lab pribadi ini.

Kedua mode command menolak eksekusi di luar sandbox. Jangan menghapus guard atau mengubah allowlist menjadi shell bebas. Tidak ada fallback eksekusi command pada Mac. Proyek ReallySick tidak dipakai, diubah, atau disalin; tidak ada secret atau data pasien.

## Prasyarat

- Node.js 22.12+ (verifikasi pengembangan: Node 24.4.1); pnpm **10.13.1**.
- Docker Desktop / Docker Engine dan Compose v2 aktif. Docker Engine 28.3.2 dipakai saat verifikasi.
- Port lokal 5173 dan 3100 tersedia; 4173 untuk preview build.
- Internet untuk instalasi paket/image pertama. Aplikasi yang sudah terpasang berjalan tanpa layanan eksternal; tidak mengunduh font, gambar, atau script saat runtime.

Jika pnpm belum ada: `npm install -g pnpm@10.13.1`.

## Instalasi dan menjalankan

Dari root proyek ini:

```sh
pnpm install --frozen-lockfile
pnpm lab:up
pnpm dev:web
```

`lab:up` menjalankan `docker compose up --build -d --wait`. Build pertama mengunduh image/paket; healthcheck hanya berhasil jika database dan runtime sandbox siap. Frontend tetap berjalan pada terminal, berhenti dengan Ctrl+C.

| Lokasi | URL |
| --- | --- |
| Beranda | http://127.0.0.1:5173/ |
| Katalog | http://127.0.0.1:5173/services |
| Konsultasi | http://127.0.0.1:5173/consultations |
| Riwayat | http://127.0.0.1:5173/history |
| Pengaturan | http://127.0.0.1:5173/settings |
| API health | http://127.0.0.1:3100/api/health |

Frontend mengakses URL relatif `/api`, diproxy Vite ke alamat tetap `http://127.0.0.1:3100`. Tidak ada URL API publik atau konfigurasi secret.

```sh
# Pemeriksaan API tanpa mengirim payload
curl http://127.0.0.1:3100/api/health
```

Respons sandbox yang siap: `{"status":"ok","database":"ready","commandSandbox":true}`. Jika `false`, jangan jalankan command lab di luar container; perbaiki setup Compose.

## Alur produk dan demonstrasi yang aman

Mode awal **Secure**. Hanya **Pengaturan → Mode Keamanan** yang menyediakan pilihan mode. Mengaktifkan Vulnerable memerlukan tombol konfirmasi; preferensi disimpan di localStorage browser. Dev (5173) dan preview (4173) memiliki penyimpanan masing-masing. Jika storage tidak tersedia, halaman fitur yang dimuat berikutnya kembali ke secure.

1. Di **Layanan**, cari `gigi`: satu layanan. Pencarian kosong memuat enam layanan SQLite. Tidak ada selector mode atau query SQL pada katalog.
2. Login sebagai pasien. Di **Layanan**, pilih layanan lalu isi alasan fiktif di **Konsultasi**. Backend mengikat owner dari sesi dan menyimpan record pribadi dalam Map otorisasi, terpisah dari SQLite legacy. **Riwayat** hanya menampilkan record berizin. Awalnya riwayat pribadi kosong.
3. Untuk latihan command, buka **Pengaturan → Fixture legacy untuk latihan ekspor**, gunakan judul `ringkasan-konsultasi`, lalu **Unduh Ringkasan**. File `careprobe-konsultasi-ID.txt` berisi layanan, tanggal, nama demo, alasan, dan status record terpilih. Judul normal menerima 1–40 huruf ASCII, angka, `-`, atau `_`. Kedua mode normal bekerja di Docker.
4. Untuk SQL, pilih **Vulnerable** di Pengaturan, konfirmasi, kembali ke Layanan dan cari input berikut (spasi terakhir ikut disertakan):

```text
' OR 1=1 -- 
```

Hasil yang telah diverifikasi: vulnerable enam layanan. Kembali ke Pengaturan, pilih Secure, ulangi input yang sama: nol layanan. `LIKE ?` dan binding memperlakukan input sebagai data. `%` dan `_` tetap wildcard LIKE. Frontend bukan batas keamanan: request langsung tetap divalidasi server.

5. Untuk command, pilih Vulnerable di Pengaturan lalu buka Riwayat. Ubah judul salah satu konsultasi menjadi:

```text
clinic-demo; printf LAB_MARKER
```

Unduh dan buka TXT. Pada vulnerable, judul menjadi `clinic-demo` dengan `LAB_MARKER` pada baris berikutnya: shell benar-benar mengeksekusi printf kedua dalam container. Isi konsultasi tetap berasal dari record yang dipilih. Nama file tidak memakai input judul.

6. Pilih Secure di Pengaturan, kembali ke Riwayat, ulangi judul marker: HTTP 400 `VALIDATION_ERROR`, tidak ada file atau proses yang dibuat. Ulangi judul normal untuk memastikan ekspor tetap berfungsi. Selesai demo, kembalikan Secure.

Laporan ada di repository, bukan menu website. Simpan screenshot Settings, katalog dan error, serta TXT hasil unduhan sebagai bukti. Route lama `/labs/sql-injection`, `/labs/command-injection`, `/report` redirect ke `/services`, `/history`, `/settings`. Endpoint lab lama tetap tersedia untuk regresi, tetapi tidak digunakan oleh UI produk.

## Tes dan build

```sh
# Tes host: API Supertest/SQLite, policy sandbox, komponen frontend.
# Tidak menjalankan payload command injection di host.
NODE_ENV=test pnpm test

# TypeScript API dan svelte-check
pnpm check

# TypeScript API + SvelteKit production build
pnpm build

# Tes integrasi nyata di Docker; API harus sudah berjalan via Compose
pnpm test:docker

# Preview aset hasil build, tetap lokal dan menggunakan proxy API yang sama
pnpm preview

# Terminal lain, saat preview dan Docker aktif: halaman, redirect, API proxy
pnpm test:smoke
```

Preview tersedia di `http://127.0.0.1:4173`. Jangan jalankan build bersamaan dengan dev server ketika memverifikasi hasil build; keduanya memakai direktori `.svelte-kit`. `pnpm preview` adalah cara preview MVP yang didukung. Menjalankan adapter Node secara langsung membutuhkan konfigurasi proxy tambahan dan tidak dibutuhkan untuk presentasi lokal.

Tes spesifik: `pnpm --filter @careprobe/api test` atau `pnpm --filter @careprobe/web test`.

Supertest perlu izin membuka port loopback sementara. Jika lingkungan agent/CI memblokir `listen` dengan EPERM, jalankan tes dari terminal lokal dengan izin loopback. Jangan mengganti sandbox gate agar tes command bisa berjalan pada host. Tes frontend menggunakan stub hanya pada batas HTTP; demo browser dan skrip Docker memeriksa integrasi API sungguhan secara terpisah.

Hasil verifikasi aktual dan keterbatasan dicatat pada [docs/test-cases.md](docs/test-cases.md). Template laporan tersedia pada [docs/lab-report.md](docs/lab-report.md).

## Reset dan shutdown

```sh
# Reset SQLite: enam layanan dan dua konsultasi seed; permintaan baru hilang
docker compose restart api

# Berhenti: Ctrl+C di terminal frontend, kemudian
pnpm lab:down
```

`lab:down` menghapus container dan jaringan proyek ini; tidak menghapus image/dependensi proyek lain. Data tidak persisten dan tidak memerlukan migration atau volume. Preferensi browser tetap tersimpan setelah restart API; ubah kembali melalui Pengaturan. POST konsultasi adalah operasi tulis; frontend menonaktifkan submit saat pending dan tidak retry otomatis. Tidak ada idempotency key: setelah timeout, cek Riwayat sebelum mengirim ulang. Tidak ada booking/payment nyata.

Untuk memeriksa fail-closed host secara manual, hentikan Docker API lebih dulu, lalu jalankan `pnpm dev:api`. Endpoint services/SQL tetap dapat dipakai secara lokal, tetapi kedua mode command dengan label normal mengembalikan HTTP 503 `SANDBOX_REQUIRED`. Hentikan dengan Ctrl+C lalu jalankan kembali `pnpm lab:up` untuk command lab.

## Batas Docker dan model ancaman

- UID/GID `10001:10001`, non-root; root filesystem read-only; tanpa volume, host mount, Docker socket, privileged mode, atau secret env file.
- `cap_drop: ALL`, `no-new-privileges:true`, seccomp default Docker; runtime gate memverifikasi Linux, marker Docker, UID/GID, root mount read-only, effective capabilities nol, no-new-privileges, dan seccomp aktif. Env flag saja tidak cukup.
- Batas 256 MiB, 0.5 CPU, 48 PID, satu diagnostik aktif, timeout 1000 ms, output maksimal 4096 byte, JSON body maksimal 2 KiB. Tidak perlu tmpfs.
- Port dipublikasikan **hanya** `127.0.0.1:3100`; Express boleh bind `0.0.0.0` di dalam container. Frontend dev/preview bind `127.0.0.1` dengan strictPort.
- **Keterbatasan jaringan aktual:** `internal:true` dicoba dan diverifikasi: health internal berhasil tetapi Docker Desktop menghilangkan published port (`NetworkSettings.Ports` kosong; localhost ECONNREFUSED). Compose akhirnya menggunakan dedicated bridge agar localhost berfungsi. **Egress tidak diblokir dan tidak diklaim terisolasi.** Tidak ada tes koneksi keluar; allowlist hanya mengizinkan label atau satu printf marker, sehingga contoh command tidak membuka jaringan. Jangan memperluas payload.
- API menolak Origin browser selain daftar localhost development/preview. Ini bukan autentikasi; proses lokal yang dipercaya tetap dapat memanggil API. Docker bukan jaminan keamanan kernel/host dan tidak menggantikan VM untuk pengujian command bebas.
- SQL search tetap query-only, statement tunggal, input maksimal 120 karakter, tanpa titik koma. Satu koneksi SQLite memuat layanan dan konsultasi fiktif. Hanya insert konsultasi terparameter yang membuka query_only secara sinkron dalam try/finally; tidak ada await dalam jendela tulis. SELECT rentan dapat membaca data fiktif lain melalui UNION; jangan masukkan data nyata. Lab bukan target fuzzing berat atau demonstrasi write/destruction.
- Tidak ada klaim uji destructive, stress, timeout exhaustion, atau semua kombinasi platform. Compose yang tidak memenuhi guard menolak command daripada menjalankannya tanpa perlindungan.

Konfigurasi mengacu pada [referensi service Compose](https://docs.docker.com/reference/compose-file/services/) dan [jaringan Compose](https://docs.docker.com/reference/compose-file/networks/); binding memakai [API statement sql.js](https://sql.js.org/documentation/Statement.html).

## Berkas penting

- `apps/api/src/app.ts`: validasi Zod, routes, Origin policy, JSON error handling.
- `database.ts`: enam layanan, dua konsultasi seed, SELECT rentan/binding, insert konsultasi terparameter dan pemulihan query-only.
- `command.ts`, `sandbox.ts`: allowlist, sink shell/no-shell, pembatasan dan fail-closed.
- `apps/web/src/routes/`: lima halaman produk dan tiga redirect kompatibilitas; komponen katalog/kartu/konsultasi dipakai ulang. `src/lib/security-mode.ts`: preferensi kecil; `src/lib/api.ts`: HTTP JSON/TXT.
- `apps/api/Dockerfile`, `docker-compose.yml`, `scripts/test-docker.mjs`: sandbox dan pemeriksaan integrasi aktual.
- `bruno/`: request lokal yang dapat dibuka dengan Bruno; respons dan matriks tes dalam dokumentasi.
- [docs/assignment-mapping.md](docs/assignment-mapping.md): pemetaan persyaratan tugas.
- [docs/file-manifest.md](docs/file-manifest.md): manifest dan daftar perubahan refactor beserta alasannya.

Referensi PDF, konfigurasi `.env*`, dependensi, hasil build, dan screenshot di luar bukti dummy yang dipilih tidak disertakan Git. Tidak ada remote push atau perubahan pada ReallySick.

## Kontrak produk singkat

- `GET /api/services?keyword=...&mode=secure|vulnerable`: `{mode,keyword,count,services}`; query/parameter internal tidak ditampilkan. Mode hilang atau invalid menjadi secure.
- `GET /api/consultations`: `{consultations:[...]}` dengan serviceName dan record tersimpan.
- `POST /api/consultations`: `{serviceId:number,patientName:string,reason:string}` → 201 `{consultation}`. ID layanan positif dan harus ada, nama trim 2–60, alasan trim 3–500; field ekstra ditolak.
- `GET /api/consultations/:id/export?documentTitle=...&mode=...` atau `POST /api/consultations/:id/export` dengan `{documentTitle,mode}` → TXT attachment UTF-8. ID bilangan positif maksimal sembilan digit; title default `ringkasan-konsultasi`, mode hilang/invalid secure. Hanya suffix marker tetap diperbolehkan di vulnerable.
- Error berbentuk `{error:{code,message}}`; validasi 400, record/layanan tidak ada 404, sandbox tidak siap 503, sibuk 429, batas command 504. Body dibatasi 2 KiB, termasuk karakter multibyte.

Konsultasi SQLite legacy tetap terbuka bagi pengguna lokal. Autentikasi akun demo Materi10 hanya melindungi fixture otorisasi yang terpisah. Database di memori reset saat restart. Aplikasi tidak menyediakan penanganan medis, video call, pembayaran, atau penyimpanan rekam medis. Batas detail dan bukti aktual: [test-cases.md](docs/test-cases.md).

## Pengujian Injection melalui URL dan Query Parameter

Query URL tetap input tidak tepercaya meskipun pengguna tidak mengisi form. URL encoding (`%27`, `%3B`, `%20`) hanya cara mengirim karakter, **bukan mitigasi**. Express membaca dan mendekode query satu kali; aplikasi tidak melakukan decodeURIComponent tambahan.

localStorage Settings hanya preferensi frontend, bukan autentikasi atau otorisasi server. Pemanggil API langsung dapat mengirim mode secara eksplisit dalam lab lokal ini. Mode hilang/invalid tetap secure; guard Docker berlaku pada GET maupun POST. Jangan memasukkan judul/data pribadi ke URL: URL dapat tersimpan pada history atau log. Semua data harus fiktif.

### SQL: langkah manual tanpa form

1. Jalankan `pnpm lab:up`, lalu `pnpm dev:web`. Buka URL normal berikut di address bar (tanpa menekan tombol pencarian):

```text
http://127.0.0.1:3100/api/services?keyword=gigi&mode=secure
```

2. Buka URL rentan:

```text
http://127.0.0.1:3100/api/services?keyword=%27%20OR%201%3D1%20--%20&mode=vulnerable
```

3. Ulangi input identik pada Secure:

```text
http://127.0.0.1:3100/api/services?keyword=%27%20OR%201%3D1%20--%20&mode=secure
```

Ekspektasi dan hasil HTTP/browser yang teramati: 200 dengan count **1 / 6 / 0**. `req.query.keyword` langsung masuk validasi dan `searchServices()`, bukan perantara form. Query SQL rentan menggabungkan keyword; Secure memakai `LIKE ?` dan binding. Length120, penolakan titik koma, dan query-only tetap berlaku; jalur tulis konsultasi tidak berubah.

4. Untuk tampilan produk, pilih mode melalui Pengaturan lalu buka langsung:

```text
http://127.0.0.1:5173/services?keyword=gigi
http://127.0.0.1:5173/services?keyword=%27%20OR%201%3D1%20--%20
```

Input terisi dan satu pencarian otomatis dijalankan saat halaman dibuka, menggunakan mode Settings. Parameter mode pada URL halaman tidak mengganti Settings. Form tetap dapat dipakai; submit form tidak menyinkronkan address bar. Untuk menguji URL baru, buka melalui address bar/refresh. Preview memakai port4173, dengan preferensi browser terpisah dari5173.

### Command: langkah manual download dari URL

1. Buka `http://127.0.0.1:3100/api/health` dan pastikan **commandSandbox:true**. Jika tidak siap, jalankan Compose; jangan mematikan guard.
2. Buka `http://127.0.0.1:3100/api/consultations`. Seed ID **2** adalah Bima Demo / Pemeriksaan Gigi. Gunakan ID yang benar jika data Anda berbeda.
3. Buka URL normal, lalu buka file `careprobe-konsultasi-2.txt` yang diunduh:

```text
http://127.0.0.1:3100/api/consultations/2/export?documentTitle=ringkasan-konsultasi&mode=secure
```

4. Buka URL marker rentan berikut hanya pada lab pribadi:

```text
http://127.0.0.1:3100/api/consultations/2/export?documentTitle=clinic-demo%3B%20printf%20LAB_MARKER&mode=vulnerable
```

5. Periksa file TXT terbaru (browser bisa menambahkan `(1)` pada nama). Ekspektasi HTTP200 text/plain attachment, record2 Bima Demo tetap sesuai, dan judul:

```text
Judul: clinic-demo
LAB_MARKER
```

6. Buka retest dengan input yang sama:

```text
http://127.0.0.1:3100/api/consultations/2/export?documentTitle=clinic-demo%3B%20printf%20LAB_MARKER&mode=secure
```

Ekspektasi HTTP400 JSON `VALIDATION_ERROR`, tanpa Content-Disposition/download. Record tak ada404; ID/title malformed400; mode hilang/invalid secure. GET dan POST memakai handler yang sama; sumber GET adalah `req.query.documentTitle`, sumber POST tetap `req.body.documentTitle`. Nama file selalu dari ID tervalidasi, tanpa filesystem write.

**Observasi aktual:** normal GET200 dan marker GET200 dengan TXT record2 telah diperiksa melalui HTTP ke container, termasuk kesamaan dengan POST. Secure GET400 juga teramati di browser. Chrome yang dikontrol alat memblokir unduhan GET normal dengan ERR_BLOCKED_BY_CLIENT; unduhan GET browser ke disk belum terverifikasi, dan blokir tidak dilewati. Bukti `docs/evidence/url-summary-*.txt` berasal dari respons HTTP, bukan unduhan browser. Jika browser Anda memblokir, catat hasil itu; gunakan tes Docker untuk bukti server dan jangan menyebut browser berhasil mengunduh.

### Sumber HTTP selain form: JSON body dan path

Endpoint POST yang sudah ada menerima `req.body.documentTitle` dari JSON. Ini juga dapat diuji langsung tanpa form, tetapi **bukan** parameter URL. Setelah `commandSandbox:true` dan ID konsultasi 2 terverifikasi, jalankan hanya terhadap API Docker lokal:

```sh
curl -sS -D /tmp/careprobe-post-normal.headers -o /tmp/careprobe-post-normal.txt \
  -H 'Content-Type: application/json' \
  --data '{"mode":"secure","documentTitle":"ringkasan-konsultasi"}' \
  http://127.0.0.1:3100/api/consultations/2/export
curl -sS -D /tmp/careprobe-post-marker.headers -o /tmp/careprobe-post-marker.txt \
  -H 'Content-Type: application/json' \
  --data '{"mode":"vulnerable","documentTitle":"clinic-demo; printf LAB_MARKER"}' \
  http://127.0.0.1:3100/api/consultations/2/export
curl -i -H 'Content-Type: application/json' \
  --data '{"mode":"secure","documentTitle":"clinic-demo; printf LAB_MARKER"}' \
  http://127.0.0.1:3100/api/consultations/2/export
```

Periksa header 200 dan isi TXT dengan `cat /tmp/careprobe-post-normal.txt /tmp/careprobe-post-marker.txt`; request Secure terakhir seharusnya 400 tanpa attachment. Bruno request 09–11 menyediakan alur POST yang sama. `:id` berasal dari `req.params.id`, divalidasi sebagai ID positif lalu dipakai pada lookup SQLite terparameter; ID bukan sink injection. Input form Riwayat hanya cara lain mengirim POST JSON. Validasi frontend tidak menggantikan validasi Zod, allowlist, dan sandbox di backend.

GET dapat diulang atau dipicu preview link. Karena itu jangan masukkan URL rentan ke navigasi, metadata, sitemap, preload atau pemuatan otomatis. Hanya label biasa atau suffix marker tetap yang diterima; kedua mode tetap Docker-only. Egress bridge belum diblokir. Hentikan frontend dengan Ctrl+C, lalu `pnpm lab:down`.

### Source → flow → sink → control

```text
SQL: URL keyword → req.query.keyword → Zod → searchServices → SQLite prepare/step
     Secure: SQL template tetap + statement.bind(parameter).
Command: URL documentTitle → req.query → exportSummary → record SQLite → runCommand
         Rentan: /bin/sh -c menafsirkan string; Secure: executable tetap + argumen terpisah,
         shell:false, allowlist; kedua mode: sandbox gate + timeout/output/concurrency limits.
POST JSON documentTitle → req.body → exportSummary → runCommand (sink dan control sama).
Path :id → req.params.id → validasi ID → lookup SQLite terparameter (bukan sink injection).
```

Dampak potensial SQL mencakup terbukanya record di luar filter (confidentiality); integrity/availability pada sistem nyata bergantung hak DB. Lab mempertahankan read-only search. Shell bebas pada sistem nyata dapat membaca/mengubah data atau mengganggu proses; lab hanya memperlihatkan marker dan tidak menguji dampak tersebut. Mitigasi yang diterapkan adalah binding, eksekusi tanpa shell dan hak minimum; validasi frontend/URL encoding tidak menggantikannya. Retest memakai input encoded yang sama dan mode Secure.

### Checklist screenshot untuk laporan mahasiswa

- [ ] Address bar dengan URL SQL encoded dan JSON vulnerable count6.
- [ ] Address bar dengan payload SQL sama, Secure count0.
- [ ] DevTools Network (Preserve log): GET URL, query parameters, status, response JSON/TXT, Content-Type dan Content-Disposition. Catat actual response, termasuk jika browser memblokir.
- [ ] Address bar URL command encoded; jika download membuat halaman tetap sebelumnya, gunakan address bar dan Network request yang benar-benar tercatat.
- [ ] Bruno atau terminal curl: POST JSON normal, marker Vulnerable, dan penolakan Secure; tampilkan request body, status, dan header tanpa data nyata.
- [ ] TXT hasil unduhan aktual terbuka, recordID2 dan LAB_MARKER; jangan mengganti bukti browser dengan file HTTP tanpa memberi label sumber.
- [ ] URL Secure command menghasilkan VALIDATION_ERROR400 dan tidak ada attachment.
- [ ] Kode `req.query`/handler bersama di app.ts, parameter binding di database.ts, serta shell/no-shell/allowlist/gate di command.ts.
- [ ] Health commandSandbox:true dan terminal `pnpm test:docker` yang memeriksa konfigurasi sandbox sebelum payload.
- [ ] Catat tanggal, mode, ID dan sumber bukti; hasil yang belum dijalankan tetap ditulis belum diuji.

Screenshot pengembang dalam docs/evidence menampilkan konten tab; address bar dan DevTools lengkap tetap perlu ditangkap mahasiswa. Laporan DOCX yang sudah diserahkan tidak diubah.

## Materi 9 — Client Side Security: XSS dan CSRF

Dua demonstrasi ini memakai lima halaman produk yang sama. Tidak ada akun nyata. SQL/command helper dan pembatas Docker tidak berubah. Cookie sesi demo hanya untuk preferensi pengingat, bukan autentikasi konsultasi atau otorisasi SQL/command.

### XSS: refleksi keyword URL pada DOM

SOURCE → `keyword` URL atau pencarian → FLOW `ServiceCatalog`/ringkasan → SINK Svelte `{@html submittedKeyword}` → CONTROL Secure memakai interpolasi teks Svelte. Dalam istilah materi ini contoh reflected XSS melalui URL; secara teknis refleksi terjadi di DOM klien setelah mount, bukan HTML respons Express. Tidak ada stored XSS.

Fragmen aktif yang diizinkan harus persis (tanpa spasi tambahan):

```html
<button onclick="this.nextElementSibling.textContent='XSS_MARKER'">Uji marker</button>
```

Handler tombol HTML yang benar-benar dijalankan browser hanya mengubah span marker tepat sesudah tombol HTML. `XSS_MARKER` pada teks payload Secure bukan bukti eksekusi: bukti adalah span `[data-xss-marker]` yang terisi, dan tombol HTML aktif hanya pada cabang rentan. Semua input aktif lain tetap escaped bahkan dalam Vulnerable; tidak ada script bebas, fetch, redirect atau pembacaan cookie. Efek juga terlihat bila query SQL rentan menolak keyword: ringkasan independen dari hasil SQL.

1. Jalankan `pnpm lab:up`, `pnpm build`, lalu `pnpm preview` (:4173).
2. Buka Pengaturan pada `http://127.0.0.1:4173/settings`, pilih Vulnerable dan konfirmasi. Tunggu sesi aktif.
3. Buka URL berikut langsung:

```text
http://127.0.0.1:4173/services?keyword=%3Cbutton%20onclick%3D%22this.nextElementSibling.textContent%3D%27XSS_MARKER%27%22%3EUji%20marker%3C%2Fbutton%3E
```

4. Klik Uji marker yang muncul pada ringkasan; periksa efek marker; buka DevTools Elements untuk melihat span marker terisi.
5. Pilih Secure di Pengaturan lalu buka URL identik. Fragmen muncul sebagai teks, tanpa tombol HTML aktif/span marker.
6. Cari `gigi` pada kedua mode: katalog tetap satu layanan. Mode tersimpan saat refresh.

DAMPAK potensial rendering aktif pada aplikasi nyata: manipulasi tampilan dan tindakan browser dengan hak halaman. Lab hanya mengubah marker. MITIGASI: output encoding sesuai konteks dan safe framework rendering; validasi frontend bukan pengganti. CSP merupakan defense in depth; aplikasi sebelumnya tidak menetapkan CSP global, dan perubahan ini tidak menonaktifkan atau melonggarkannya. Jangan menyalin `@html` untuk input umum. RETEST menggunakan input identik pada Secure.

### CSRF: sesi cookie dan preferensi pengingat

SOURCE halaman `http://127.0.0.1:4180` → FLOW form POST ke preview `/api/demo/reminder` → proxy Express → cookie/session lookup → SINK `session.reminder` → CONTROL token session-bound dan Origin pada Secure. State hanya preferensi fiktif, tidak mengirim notifikasi.

- POST `/api/demo/session` membuat/sinkronisasi mode dengan Origin lokal tepercaya dan header `X-CareProbe-Settings: 1`; form eksternal tidak dapat menetapkan mode. Settings menyimpan localStorage setelah server menerima mode. API offline menampilkan error dan tidak mengonfirmasi perubahan mode.
- Cookie `careprobe_demo`: random 32 byte, HttpOnly, SameSite=Lax, host-only, Path=/api/demo, Max-Age satu jam. Secure flag tidak digunakan karena demonstrasi HTTP loopback; ini bukan konfigurasi produksi. Map memori maksimal100 sesi, kedaluwarsa satu jam; restart mereset semuanya.
- GET `/api/demo/session` hanya membaca, tidak membuat sesi atau mengubah preferensi. POST `/api/demo/reminder` menerima `enabled` string true/false dan token opsional, menolak field mode/field ekstra. Secure memerlukan token sesi yang benar DAN Origin tepercaya. Vulnerable mengabaikan token hanya untuk origin aplikasi atau tepat origin4180; origin lain tetap ditolak. Pengecualian global Origin hanya POST endpoint itu dari4180, lalu keputusan mode tetap di server. Tidak ada permissive credentialed CORS.
- Port4173 dan4180 berbeda origin tetapi same-site (scheme/host sama). Lax dapat mengirim cookie pada form POST same-site ini; tidak berarti Lax mengizinkan arbitrary cross-site POST. Cookie diperlukan agar request palsu menarget preferensi sesi korban yang sudah ada. Curl dengan cookie buatan saja tidak membuktikan perilaku browser.

Demonstrasi manual (gunakan 127.0.0.1 pada kedua tab, bukan mencampur localhost):

1. Dengan Docker dan preview4173 aktif, jalankan `node scripts/serve-csrf.mjs` pada terminal lain (fixture hanya bind127.0.0.1:4180).
2. Buka Pengaturan, pastikan sesi aktif, pilih Vulnerable/konfirmasi, dan set pengingat Nonaktif menggunakan kontrol sah.
3. Buka tab `http://127.0.0.1:4180`. Buka DevTools Network Preserve log; klik tombol form satu kali. Tidak ada aksi otomatis.
4. Periksa POST ke `http://127.0.0.1:4173/api/demo/reminder`, Origin4180, cookie terkirim otomatis (sembunyikan nilainya), dan respons200 reminder:true.
5. Kembali ke tab Settings, klik **Muat ulang preferensi**; pengingat sekarang Aktif.
6. Pilih Secure, set pengingat Nonaktif secara sah. Kembali ke halaman4180 dan klik tombol yang sama:403 CSRF_REJECTED. Muat ulang preferensi: tetap Nonaktif.
7. Klik **Aktifkan pengingat** pada Settings Secure: berhasil dengan token sesi. Jangan menyalin token ke fixture.
8. Kembalikan Secure; Ctrl+C preview/fixture, `pnpm lab:down` untuk berhenti.

DAMPAK potensial CSRF: perubahan state tanpa persetujuan pengguna dalam sesi yang sudah ada. Tidak ada klaim takeover, pencurian token atau kompromi pasien. MITIGASI/RETEST: token terikat sesi + Origin + cookie policy + POST; ulangi request palsu dan periksa403/state tidak berubah, lalu buktikan kontrol sah tetap berhasil. XSS marker tidak membaca token atau memanggil endpoint ini.

### Screenshot mahasiswa (sembunyikan cookie, ID sesi, token)

- Layanan normal `gigi` dan satu hasil; tanggal/waktu, mode dan URL.
- Settings Vulnerable terkonfirmasi; URL XSS encoded; efek span XSS_MARKER dan Elements yang menunjukkan handler/marker.
- Settings Secure; input identik tampil escaped, tidak ada tombol HTML aktif/marker span.
- Source keyword → exact fragment gate → @html vs interpolasi Svelte.
- Settings: sesi aktif, pengingat Nonaktif; halaman simulasi4180 sebelum klik.
- DevTools POST form: Origin4180, method/status, presence cookie dengan nilai ditutup; jangan publikasikan header cookie mentah.
- Settings sesudah forged Vulnerable: Aktif. Retest Secure: respons403 dan state tetap Nonaktif.
- Request sah Secure:200, token presence (nilai ditutup) dan state berubah.
- Source random cookie/session map, proteksi sinkronisasi mode, token/Origin check dan assignment reminder.

Hasil aktual pengembang dan batas verifikasi dicatat di docs/test-cases.md. DOCX universitas tidak diubah.

## Materi 10 — Authorization: Access Control dan Privilege Management

**Lokasi UI terkini:** panel Pengujian Hak Akses/privilege sekarang berada di **Pengaturan**, sedangkan Riwayat hanya untuk konsultasi pribadi. Petunjuk lama yang menyebut panel di Riwayat harus mengikuti lokasi baru ini; endpoint dan analisis fixture tetap berlaku.

Record Materi10 adalah fixture memori terpisah di `/api/demo/auth`; bukan konsultasi SQLite legacy. Endpoint lama tetap terbuka untuk data fiktif Materi8/9, tetapi tidak memiliki akses ke Map fixture otorisasi. Jangan menganggap seluruh aplikasi sudah memiliki autentikasi produksi. Tidak ada perubahan pada query-only SQLite, command sink atau sandbox Docker.

### Identitas, sesi, RBAC dan ABAC

Masuk melalui **Masuk di header → /login**. Empat akun lokal: `alya`, `bima`, `raka`, `admin`. Kata sandi publik untuk semuanya: `CareProbeDemo!2026` (khusus lab, jangan dipakai di sistem lain dan jangan tampilkan pada screenshot). Backend membandingkan scrypt hash; storage user tidak menyimpan plaintext. Login/account switching/logout merotasi ID sesi acak dan token CSRF, menghapus sesi sebelumnya. Cookie HttpOnly/Lax host-only Path=/api/demo dan masa berlaku satu jam memakai infrastruktur sesi Materi9; cookie anonim tidak dianggap login. Identitas memakai role efektif terkini dari Map user/grant saat request, bukan header role atau localStorage. Pengecualian policy snapshot review1002 Vulnerable dijelaskan pada Bab2.

| Role | Izin backend | Batas objek/konteks Secure |
| --- | --- | --- |
| PATIENT | list, view, download, create | list/detail/summary hanya pemilik; owner create ditetapkan dari sesi |
| DOCTOR | list, view, download, review, complete | hanya assignment sendiri; creator tidak boleh mereview sendiri; status sesuai workflow |
| ADMIN | accounts, roles, audit, reset | tidak dapat membaca isi konsultasi; hanya role Raka boleh DOCTOR/PATIENT, tidak dapat menetapkan ADMIN |

Subject = userId + role terkini; Object = ID + ownerPatientId + assignedDoctorId + status; Action = view/download/create/review/complete; Policy = permission mapping + atribut + konteks sesi/mode/workflow. Deny by default. `PENDING → IN_REVIEW → COMPLETED` adalah urutan sah; completed tidak dapat dibuka ulang.

Fixture:1001 milik Alya/dokter Raka;1002 milik Bima/dokter Raka;1003 milik Bima/dokter-lain (ID assignment tanpa akun login). Ketiganya awal PENDING. Pengajuan fixture baru dilakukan pasien pada bagian **Riwayat → Pengujian Hak Akses**, owner berasal dari login. Semua state memori reset saat API restart. Admin dapat reset ketiga fixture dan role Raka ke DOCTOR; akun/pengingat/mode/sesi tidak direset. Maksimal100 record dan100 audit decisions, tanpa password/token/cookie pada audit.

### Perbandingan terbatas dan revokasi

Mode hanya berasal dari sesi server yang disinkronkan melalui Pengaturan yang sudah ada; target otorisasi tidak menerima mode/role/owner dari client. Semua POST auth termasuk login/logout/reset/roles **selalu** memerlukan Origin lokal tepercaya + `X-CSRF-Token` sesi, termasuk ketika mode Vulnerable. Pengecualian CSRF Materi9 untuk reminder4180 tidak berlaku pada auth.

| Skenario | Endpoint / request | Vulnerable | Secure dan state |
| --- | --- | --- | --- |
| A: horizontal IDOR | Alya GET `/api/demo/auth/consultations/1002` atau `/summary` | ownership pasien dilewati;200 record Bima |403 OWNER_DENIED; tidak ada mutasi;1001 sendiri tetap200 |
| B: vertical/forced browsing | Alya POST `/api/demo/auth/consultations/1001/transition` body `{"action":"review"}` | hanya role dokter pada own PENDING dilewati;200/IN_REVIEW |403 ROLE_DENIED; tetap PENDING; action tidak ditampilkan untuk pasien |
| C: workflow bypass | Raka POST path1001/transition body `{"action":"complete"}` pada PENDING | hanya prasyarat IN_REVIEW dilewati;200/COMPLETED |409 WORKFLOW_DENIED; tetap PENDING; review kemudian complete berhasil |
| D: privilege creep | Admin mencabut DOCTOR, sesi lama Raka POST review1002 | snapshot DOCTOR saat login mengizinkan hanya review1002;200 | role terkini PATIENT;403 dan1002 tetap PENDING |

Assignment dokter selalu diperiksa di kedua mode; Raka ditolak pada1003. Pasien tidak boleh complete; review pasien lain hanya memiliki pengecualian privilege-creep Raka/1002 yang dijelaskan pada Bab2 di bawah. Role Admin tidak dapat diambil alih. Tidak ada `allowEverything`. Setiap pengecualian ditandai DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB. Identitas dan daftar izin tetap memakai role terkini; satu keputusan review1002 Vulnerable sengaja memakai snapshot login. Segregation of duties juga melarang Raka mereview record yang ia buat saat sebelumnya berperan PATIENT setelah role dokter dipulihkan.

### Kontrak HTTP dan demonstrasi langsung

Semua URL berikut relatif ke `http://127.0.0.1:4173` (preview) atau `http://127.0.0.1:3100` (API). Gunakan host127.0.0.1 konsisten agar cookie sesuai. GET tidak meminta mutasi fixture atau grant; evaluasi expiry dan pencatatan audit internal tetap dapat terjadi.

| Metode/path `/api/demo/auth` | Input/output |
| --- | --- |
| POST `/login` | `{account,password}`, token sesi anonim →200 user + token baru + cookie baru; salah password401 |
| POST `/logout` | `{}`, token sesi login →200 identitas dihapus + token/cookie baru |
| GET `/` | current identity + mode; anonim/expired401 |
| GET `/consultations` | list sesuai identity/assignment; Admin403 |
| GET `/consultations/:id` | resource lookup + policy; unknown404, invalidID400 |
| GET `/consultations/:id/summary` | policy yang sama, TXT dengan filename server; tanpa command sink |
| POST `/consultations` | `{reason}` panjang3–200, owner sesi;201 |
| POST `/consultations/:id/transition` | `{action:"review"|"complete"}`;200/403/409 |
| GET `/accounts`, GET `/audit` | Admin saja; tidak mengekspos credential/isi konsultasi |
| POST `/roles` | hanya `{account:"raka",role:"DOCTOR"|"PATIENT"}`; role live |
| POST `/reset` | `{}`, Admin + CSRF; deterministic reset fixture dan role Raka |

Panduan curl (jangan screenshot nilai token/cookie). Pengujian ini tidak menjalankan shell injection:

```sh
# Bootstrap sesi anonim, sama seperti Settings. File ini berisi token: simpan lokal saja.
curl -sS -c /tmp/cp-auth.cookies -H 'Origin: http://127.0.0.1:4173' \
 -H 'X-CareProbe-Settings: 1' -H 'Content-Type: application/json' \
 --data '{"mode":"secure"}' http://127.0.0.1:3100/api/demo/session > /tmp/cp-auth-session.json
# Ambil csrfToken dari file lokal, isi placeholder SESSION_TOKEN di bawah.
curl -sS -b /tmp/cp-auth.cookies -c /tmp/cp-auth.cookies \
 -H 'Origin: http://127.0.0.1:4173' -H 'X-CSRF-Token: SESSION_TOKEN' \
 -H 'Content-Type: application/json' --data '{"account":"alya","password":"CareProbeDemo!2026"}' \
 http://127.0.0.1:3100/api/demo/auth/login > /tmp/cp-auth-login.json
# Gunakan csrfToken BARU dari response login untuk seluruh POST berikutnya.
curl -i -b /tmp/cp-auth.cookies http://127.0.0.1:3100/api/demo/auth/consultations/1001
curl -i -b /tmp/cp-auth.cookies http://127.0.0.1:3100/api/demo/auth/consultations/1002
curl -i -b /tmp/cp-auth.cookies -H 'Origin: http://127.0.0.1:4173' \
 -H 'X-CSRF-Token: LOGIN_TOKEN' -H 'Content-Type: application/json' \
 --data '{"action":"review"}' http://127.0.0.1:3100/api/demo/auth/consultations/1001/transition
```

Mode untuk curl dapat disinkronkan dengan POST `/api/demo/session` seperti bootstrap (cookie jar yang sama, Origin tepercaya + header Settings), atau pakai request browser setelah memilih di Pengaturan. Jangan menambahkan mode ke target consultation. Ulangi dengan account Raka/Admin dan cookie jar terpisah agar sesi lama bisa diamati saat revokasi. Token dari sesi lain ditolak. Setelah login/logout selalu gunakan token baru. LocalStorage hanya preferensi UI, tidak memberi identity atau permission.

### Urutan browser dan screenshot mahasiswa

1. Jalankan `pnpm lab:up`, `pnpm build`, `pnpm preview`. Buka Settings4173, pilih Secure, lalu gunakan Masuk di header untuk login Alya. Capture nama/role dan mode tanpa nilai password.
2. Di Riwayat, capture fixture1001/owner Alya dan tidak ada tombol dokter. Buka langsung `http://127.0.0.1:4173/api/demo/auth/consultations/1001` (200), ubah ID ke1002 (403 Secure). Pada mode Vulnerable,1002 menampilkan record Bima. Capture address bar/status/JSON kedua mode.
3. Dari DevTools Network, salin request sah untuk format POST/token; jangan publikasikan token. Kirim action review sebagai Alya ke1001. Secure403/PENDING, Vulnerable200/IN_REVIEW. Capture request role pasien, response dan state sebelum/sesudah. Reset via Admin sebelum ulang.
4. Login Raka. Capture UI review1001, detail1003 ditolak403 (unassigned). Direct complete1001 dari PENDING:Secure409/tetap PENDING, Vulnerable200/COMPLETED. Capture status awal, request identik, state akhir. Secure review kemudian complete harus200/COMPLETED. Completed review/complete ulang409.
5. Untuk revokasi sesi aktif, pakai dua browser/profile terpisah: Raka pada browser1, Admin pada browser2. Capture role DOCTOR sebelum, Admin mencabut role Raka, identity browser1 menjadi PATIENT. Review1002 sesi lama: Secure403, Vulnerable200; prosedur Bab2 di bawah. Jangan menggunakan dua tab satu profil untuk dua identity: cookie host dibagi dan login baru merotasi identitas.
6. Admin hanya melihat daftar role dan keputusan akses; capture role change, audit alasan denial, reset. Bukti creator/reviewer:ubah Raka kePATIENT, buat fixture, kembalikan DOCTOR, review own fixture403 DUTY_CONFLICT.
7. Capture snippet kecil: credential hash verification/rotation, permission mapping, ownership, assignment/duty/status, tiga branch rentan, role live dan tes. Tutup cookie, password, token; beri caption konsep, timestamp, mode, actor, ID, HTTP status dan state.
8. Kembalikan Secure, logout, Ctrl+C frontend dan `pnpm lab:down`.

SOURCE → request ID/action langsung dari pasien/dokter → FLOW cookie login → session identity → role live → policy → SINK read/download/transition fixture → CONTROL permission + ownership + assignment + status + segregation. EVIDENCE berupa status dan state di atas; hasil aktual di docs/test-cases.md. DAMPAK potensial IDOR pada confidentiality, review/complete tanpa izin pada integrity, dan gangguan workflow pada availability; tidak ada dampak pasien nyata yang diuji. MITIGASI server-side deny-by-default dan revalidasi role terkini; RETEST input/action/ID identik pada Secure, dilanjutkan happy path sah.

Batas: credential publik, HTTP loopback tanpa Secure cookie flag, satu jam/sesi memori, tanpa produksi auth/rate-limit/recovery; fixtures terpisah dan audit bukan sistem medis/audit lengkap. Snapshot rentan hanya untuk demonstrasi review1002. Tidak ada dependency atau migrasi baru; DOCX tidak diubah. Egress Docker tetap belum diblokir.

## Login dan logout website

Halaman `http://127.0.0.1:4173/login` (preview) atau `http://127.0.0.1:5173/login` (dev) memakai username/password akun fiktif Materi10 di atas. Password tidak ditampilkan pada halaman login. Tidak ada signup atau sistem autentikasi baru.

- Form login membaca sesi `/api/demo/session`; bila tidak ada, melakukan bootstrap melalui POST endpoint yang sama dengan header Settings yang sudah ada. Password dikirim hanya ke POST `/api/demo/auth/login` dengan token sesi. Backend scrypt, cookie HttpOnly/Lax dan rotasi tetap memakai implementasi lama.
- Identitas header berasal dari GET `/api/demo/auth`; setelah login pengguna menuju `/history`. Nama dan role dari server ditampilkan di luar lima link navigasi produk.
- Store auth hanya memori. Password, cookie, dan token tidak disimpan di localStorage. Refresh memulihkan identitas dari server; pemeriksaan juga dilakukan pada navigasi SvelteKit tanpa timer polling. GET401 atau protected request401 menghapus identitas UI; halaman login/tautan Masuk tersedia kembali.
- Header **Keluar** memanggil POST logout backend dengan token sesi terbaru, membersihkan identitas UI setelah sukses, lalu menuju `/login`. Jika API gagal dihubungi saat logout, tampilkan error dan jangan mengklaim sesi server telah dibatalkan. Akun lain masuk melalui logout lalu login kembali; backend account-switching API juga tetap tersedia untuk regresi.
- Token tidak di-cache oleh helper auth: setiap POST mengambil token dari cookie sesi terkini. Pengingat Settings juga mengambil token baru sebelum POST sehingga rotasi login/logout tidak meninggalkan token lama.
- `next` hanya menerima path persis `/`, `/history`, `/consultations`, `/settings`, atau `/services`; URL eksternal dan path lain kembali ke `/history`. Jika sudah login, membuka `/login` menuju tujuan internal tersebut.
- History tetap memisahkan data legacy publik dan fixture otorisasi. Saat belum login, panel fixture memberi tautan `/login?next=/history`; legacy history, katalog, SQL/Command/XSS/CSRF tetap dapat dipakai sesuai batas lab. Login tidak membuat endpoint legacy menjadi terlindungi.

Pengujian manual:

1. Jalankan `pnpm lab:up`, lalu `pnpm dev:web`; atau `pnpm build` dan `pnpm preview` untuk port4173. Backend tetap3100.
2. Buka `/login`; coba field kosong dan credential salah. Kedua field wajib; credential salah memberi pesan generik. Jika Docker/API tidak aktif, pesan koneksi harus berbeda dari credential invalid.
3. Login `alya` dengan credential lokal pada bagian Materi10. Periksa redirect Riwayat, header Alya/Pasien dan fixture own1001. Refresh: identitas tetap. Tidak ada kontrol password di Settings/AuthorizationPanel.
4. Pilih Vulnerable di Settings/konfirmasi, uji detail1002; pilih Secure dan retest. Pengingat Settings tetap dapat diperbarui setelah login. Tidak ada selector mode di login/header.
5. Klik Keluar. Header menjadi Masuk, halaman login terbuka, direct GET `/api/demo/auth/consultations/1001` ditolak401. Legacy services tetap terbuka.
6. Login `raka`: header Dokter dan action review assigned; login `admin` setelah logout: header Admin, role/audit tanpa isi fixture pasien. Tidak ada identity atau permission Alya yang diwarisi.
7. Sesi berakhir satu jam atau saat API restart: refresh/navigasi/request terlindungi mengenali401 dan meminta masuk kembali. Tidak ada polling expiry atau klaim logout otomatis ketika halaman dibiarkan idle tanpa request.
8. Untuk screenshot, capture login kosong, identitas header sesudah refresh, role-specific panel, dan state sesudah logout; jangan tampilkan password/token/cookie. Uji viewport ponsel.

Hentikan frontend dengan Ctrl+C dan backend dengan `pnpm lab:down`. Hasil aktual serta batas browser tercatat di docs/test-cases.md. DOCX tidak diubah.

## Materi 10 — Bab 2: Privilege Management

Tahap ini melanjutkan working tree login/logout yang belum di-commit. Tidak menambah akun, role, cookie, halaman navigasi, dependency, tabel atau command sink. Definisi di bawah merangkum konsep pada permintaan tugas; bukan kutipan langsung PDF kuliah yang tidak disertakan.

| Subbab / definisi | Implementasi, subjek dan izin | Perbandingan / bukti aktual |
| --- | --- | --- |
| 2.1 Privilege Management: menetapkan, membatasi, meninjau dan mencabut izin | Permission mapping lama; Raka meminta DOCTOR sementara, Admin menyetujui/menolak, meninjau dan mencabut; audit bounded | Request201 belum memberi DOCTOR; self-approve403; Admin200; review sah200. API, HTTP Docker dan browser diverifikasi |
| 2.2 Privilege Lifecycle: tahapan permintaan sampai penghentian akses | Satu grant Raka: REQUESTED → persetujuan Admin → ACTIVE, atau REJECTED; ACTIVE → EXPIRED/REVOKED | Persetujuan adalah event PRIVILEGE_APPROVED langsung diikuti PRIVILEGE_GRANTED/ACTIVE, bukan state APPROVED terpisah. Server memberi tepat5menit; tes jam deterministik memeriksa expiry-1ms dan tepat expiry |
| 2.3 Least Privilege: hanya izin yang diperlukan | Pasien own record; dokter assigned record; Admin role/grant/audit tanpa isi pasien | Pasien review own PENDING:V200/S403; Admin content403 dan Raka unassigned1003 ditolak kedua mode; memakai policy lama |
| 2.4 Segregation of Duties: pembuat dan pemeriksa berbeda | Owner create berasal dari sesi; pasien pembuat mencoba review fixture yang benar-benar baru dibuat; Raka tidak boleh approve grant sendiri | Creator Alya review:V200/IN_REVIEW, S403/PENDING. Raka sesudah menjadi DOCTOR tetap DUTY_CONFLICT pada own record. Self-approve403 kedua mode |
| 2.5 Privilege Escalation: akses milik orang lain atau aksi peran lebih tinggi | Horizontal:Alya detail/summary Bima1002; vertical:Alya review own1001 | Horizontal V200/S403 OWNER_DENIED; vertical V200/S403 ROLE_DENIED. Tidak ada promosi ADMIN |
| 2.6 Forced Browsing: memanggil operasi yang tidak ditawarkan UI | Pasien tanpa tombol dokter POST /consultations/1001/transition dengan action review | HTTP langsung wajib login/CSRF. V200/IN_REVIEW, S403/PENDING; operasi sama dengan2.3/2.5 |
| 2.7 Workflow Bypass: melewati tahap wajib | Raka assigned1001 mencoba complete dari PENDING | V200/COMPLETED; S409/PENDING; urutan sah review→complete200, completed tidak dibuka ulang |
| 2.8 Privilege Creep: izin lama masih efektif setelah tidak berhak | Snapshot DOCTOR login Raka, hanya review1002 lewat sesi lama setelah role/grant dicabut atau expired | Identitas terkini PATIENT kedua mode. V200/IN_REVIEW dengan audit STALE_DOCTOR_SNAPSHOT; S403/PENDING tanpa logout. Browser revoke dan HTTP dibuktikan; expiry dengan jam tes |

### Grant kecil dengan waktu server

GET /api/demo/auth/privilege hanya untuk Raka/Admin. Respons menampilkan target, baseRole, role efektif, durationMinutes:5 dan grant (null atau status/requestedBy/requestedAt/approvedBy/approvedAt/expiresAt/active). expiresAt berupa ISO UTC. UI menampilkan waktu itu dan tombol **Muat ulang hak akses**, tanpa timer sebagai otoritas izin.

POST /api/demo/auth/privilege memakai JSON strict **hanya** {"action":"request"}, approve, reject, atau revoke. Raka harus efektif PATIENT untuk request; Admin aktif untuk tiga keputusan lainnya. Tidak menerima role, userId, durasi, mode atau isAdmin. Semua POST tetap memerlukan cookie sesi, Origin tepercaya dan X-CSRF-Token sesi terbaru.

- Request201/REQUESTED; keputusan200; belum login401; salah aktor/CSRF403; konflik409 GRANT_CONFLICT; field tambahan/action invalid400 VALIDATION_ERROR.
- Approve memberi effective DOCTOR sampai Date.now() >= expiresAt. Expiry dievaluasi saat lookup identity/policy/review; Secure menolak operasi lewat batas waktu tanpa menunggu reload browser/job. Event EXPIRED dicatat sekali saat pertama kali teramati server.
- Grant tidak mengubah base role PATIENT. Revoke/expiry mengembalikannya. Explicit Admin /roles juga mencabut grant REQUESTED/ACTIVE agar grant tidak menimpa revokasi role.
- Admin meninjau target/peran/status/expiry/active/approver dan audit di panel Riwayat yang sama. Satu Admin fiktif, bukan multi-person approval.
- Satu grant dapat diminta ulang setelah terminal state; audit100 keputusan menyimpan jejak terbatas. Reset Admin menghapus grant/record tambahan, mengembalikan1001–1003 PENDING dan base role Raka DOCTOR; sesi tidak ikut dihapus.

### Batas snapshot rentan

doctorAtLogin diisi **hanya setelah password diverifikasi dan sesi dirotasi** ketika Raka efektif DOCTOR. Memilih mode, reload, request atau approval tidak menciptakan snapshot baru. Login ketika grant aktif juga memenuhi syarat. Logout/account switching menghapus sesi lama; login ulang mengevaluasi role terkini; sesi expired tidak dapat memakai snapshot. Mode tetap berasal dari sesi server melalui Pengaturan.

Pengecualian DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB hanya berlaku untuk sesi lama Raka dengan snapshot DOCTOR, role live PATIENT, mode Vulnerable, action review dan ID tepat1002. Policy tetap memeriksa assignment/creator/PENDING. Tidak memberi complete, review1001/1003, role management atau ADMIN. Identitas/list memakai role live. IDOR pasien Vulnerable yang sudah ada merupakan skenario terpisah; akses baca itu tidak berasal dari snapshot. Tidak ada cache izin umum atau bypass login/CSRF.

### Demonstrasi dan screenshot mahasiswa

Start lokal: jalankan pnpm lab:up, pnpm build, lalu pnpm preview. Frontend http://127.0.0.1:4173 ; API http://127.0.0.1:3100 . Selesai: Ctrl+C preview lalu pnpm lab:down.

Gunakan **dua browser/profile cookie terpisah**, host127.0.0.1 konsisten: Raka di browserA, Admin di browserB. Dua tab profil yang sama berbagi cookie. Login /login memakai akun fiktif yang sudah didokumentasikan. Pilih mode hanya di Pengaturan; mode Raka tidak mengubah mode sesi Admin.

1. **Peran awal:** Admin Riwayat → Pengujian Hak Akses → Reset fixture dan peran Raka. Login Raka ketika DOCTOR. Capture identitas, assigned1001/1002 PENDING, tombol review dan mode Pengaturan.
2. **Request:** Admin Cabut peran dokter Raka. Raka Muat ulang hak akses →PATIENT, Ajukan akses dokter sementara →REQUESTED/inactive. Admin reload melihat permintaan. Self-approve POST /privilege action approve sebagai Raka harus403 (bukan tombol Raka).
3. **Keputusan:** Admin Tolak permintaan →REJECTED; Raka reload dan ajukan ulang. Admin Setujui akses dokter5menit →ACTIVE. Capture approver, expiry UTC, basePATIENT/effectiveDOCTOR dan audit PRIVILEGE_APPROVED/GRANTED. Raka reload, Mulai review1001 →IN_REVIEW. Admin review lalu Cabut akses sementara; Raka reload →REVOKED/inactive/PATIENT, tetap login.
4. **Expiry manual opsional:** BasePATIENT, request/approve lagi; login ulang Raka **selama grant aktif** untuk snapshot. Tunggu melewati expiry5menit tanpa restart API; reload →EXPIRED/PATIENT. Secure POST review1002 harus403/PENDING. Tes otomatis sudah membuktikan batas waktu; screenshot penantian browser belum dibuat pengembang.
5. **Creep Vulnerable:** Reset Admin; login ulang Raka ketika DOCTOR, pilih Vulnerable/konfirmasi. Siapkan POST /api/demo/auth/consultations/1002/transition body {"action":"review"} dengan cookie/token sesi Raka, tanpa mengirim dahulu. Admin profile lain cabut role Raka. **Tanpa logout/login ulang**, kirim request tersebut melalui Bruno/curl atau replay DevTools dengan sesi yang sama. V menerima perubahan; identity terkini PATIENT tetapi tetap login. Admin audit menunjukkan STALE_DOCTOR_SNAPSHOT/1002; Bima owner1002 memverifikasi IN_REVIEW. UI produk kini memperbarui role saat fokus sehingga tombol dokter dapat hilang; request HTTP langsung diperlukan untuk menguji stale permission, bukan untuk penggunaan normal.
6. **Retest Secure:** Reset, login Raka saat DOCTOR, pilih Secure. Admin revoke, kirim POST review1002 identik melalui sesi Raka lama →403. Muat ulang hak akses →PATIENT; Bima own1002 tetap PENDING. Sebelum reload, label dokter dapat masih cached; GET identity terbaru membuktikan role. Review1001/1003, complete dan admin actions tetap ditolak setelah revoke. Tidak perlu logout agar revokasi Secure efektif.
7. **2.3–2.6:** Reset per skenario. Alya GET1002 vs1001 (horizontal); POST review1001 (vertical/forced browsing); buat fixture baru sebagai Alya, gunakan ID response untuk POST review (SoD creator nyata). Capture method/path/body action, actor, mode, response dan state sebelum/sesudah. Secure menolak tanpa mutasi.
8. **2.7:** Raka assigned1001 PENDING POST complete →V200/S409. Reset, Secure review lalu complete →200/COMPLETED; reopen409. Admin content dan dokter unassigned403 kedua mode. Capture permission mapping dan assignment/creator/status guards.
9. **Source:** capture authorization.ts permission mapping, currentUser/expireGrant, guard Admin/requestor, login snapshot, branch review1002 dan transition; demo-session.ts rotation; tes expiry/SoD/stale. DevTools capture URL, method, status, timestamp, body action dan state response. **Tutup nilai cookie/session/token/password**; caption memuat actor/current role/mode/ID dan browserA/B.
10. Kembalikan Secure, reset Admin, logout keduanya. Screenshot konten tab pengembang ada di docs/evidence/privilege-*.png; address bar/Network masih perlu capture mahasiswa.

### Analisis dan retest

| Demonstrasi | SOURCE → FLOW → SINK → CONTROL |
| --- | --- |
| IDOR horizontal | Alya URL ID1002 → cookie/session → policy view/download → read fixture Bima → ownership Secure |
| Vertical / forced browsing / SoD | Pasien creator POST review HTTP langsung → identity+CSRF → policy → status IN_REVIEW → role, assignment dan pemisahan creator/reviewer Secure |
| Workflow | Raka assigned POST complete → identity/CSRF/policy → status COMPLETED → prasyarat IN_REVIEW Secure |
| Privilege creep | Request review1002 sesi Raka lama → snapshot login+role/grant live → scoped policy → status IN_REVIEW → Secure selalu memakai role/grant terkini |

**EVIDENCE:** matriks di atas, status/state API, audit dan screenshot; hasil lengkap docs/test-cases.md. **DAMPAK potensial:** confidentiality pada IDOR; integrity review/status oleh izin berlebih; availability proses konsultasi dapat terganggu. Lab hanya mengubah fixture memori, bukan pasien/host nyata. **MITIGASI:** deny-by-default backend, cek owner/assignment/duties/workflow, revalidasi role/expiry setiap operasi, approval Admin+CSRF; tombol tersembunyi/cache sesi bukan kontrol. **RETEST:** ulang ID/action sama di Secure, pastikan denial tidak mengubah state, lalu operasi sah tetap berhasil. Grant request/approve terlindungi identik kedua mode.

Batas: satu grant Raka5menit, memori/reset startup, audit100, sesi1jam/max100; tanpa persistent audit, multi-admin approval atau job expiry. Screenshot expiry browser/Network lengkap masih perlu dikumpulkan. Legacy/injection publik terpisah dari fixture terlindungi. Docker egress belum diblokir; sandbox command tidak berubah.


## Pengalaman website terautentikasi

### Batas halaman dan data

| Sebelum login | Setelah login |
| --- | --- |
| Beranda publik, preview layanan umum dan CTA Masuk; header Beranda/Masuk | Beranda menjadi dashboard berdasarkan identitas backend dan data berizin; lima navigasi produk tetap tersedia |
| /login publik | /services, /consultations, /history, /settings memerlukan identitas valid |
| Direct /history tidak memasang konten privat | Gate memeriksa sesi sebelum komponen fitur dipasang; anonim diarahkan ke /login?next=%2Fhistory |

Cookie tetap HttpOnly/Lax/Path=/api/demo; scope tidak diperlebar. SvelteKit SSR tidak dapat membaca cookie ini, sehingga halaman terlindungi mula-mula hanya menghasilkan loading shell, HTTP200. Redirect terjadi setelah pemeriksaan client; bukan server redirect302. AuthGate di layout memeriksa pada navigasi/fokus browser dan menggunakan store auth yang sama. Error API ditampilkan dengan Coba lagi, bukan dianggap sebagai riwayat kosong atau kredensial salah. Tidak ada polling. Pemeriksaan fokus pada path yang sama mempertahankan draf form; initial/new path tetap menunggu verifikasi. Perubahan user/role memasang ulang konten untuk menghapus data akun lama. Respons restore lama diabaikan setelah identityRevision berubah akibat logout/login. Path next tetap whitelist internal existing, tanpa external redirect.

Gate frontend adalah UX, **bukan batas authorization**. API /api/demo/auth tetap memeriksa identity/expiry/role/ownership/assignment/CSRF. Role yang dicabut ditinjau pada navigasi, fokus, refresh atau request berikutnya; tidak ada server push real-time.

### Alur per peran

- **PATIENT:** dashboard jumlah/menunggu/terbaru dari list pribadi; katalog bersama; Pilih layanan meneruskan serviceId ke form; reason3–200 karakter; backend menetapkan owner dari sesi. Nama pasien tidak diketik sebagai bukti identity. History hanya own record; ringkasan TXT melewati policy yang sama.
- **DOCTOR:** list assigned saja; tombol review PENDING lalu complete IN_REVIEW. Konsultasi pribadi selalu menolak skipped workflow walaupun Settings Vulnerable. Role/grant terkini berlaku; dokter tidak dapat melihat fixture unassigned1003.
- **ADMIN:** dashboard menghitung akun, pending grant dan keputusan audit dari endpoint Admin. Tidak mendapat isi konsultasi pasien; halaman konsultasi/riwayat memberi penjelasan izin dan tautan ke Settings. Role/grant/audit lama dipakai kembali di Pengaturan, tanpa portal baru.
- **Pengaturan:** account identity, pengingat sesi, lalu Laboratorium keamanan. Pengingat direset ketika logout/berganti akun agar nilai akun lama tidak terbawa. Ini preferensi sesi, bukan pengingat persisten atau notifikasi nyata. Mode lab tetap preferensi browser/sesi dan memerlukan konfirmasi Vulnerable; bukan bukti identity.

### Kontrak pribadi pada API existing

- GET /api/demo/auth/consultations?scope=personal: list pribadi difilter server sebelum dikirim;401 bila anonim,403 bila Admin. scope=lab adalah default kompatibilitas untuk panel akademis. Scope lain400.
- POST /api/demo/auth/consultations body {"serviceId":2,"reason":"Simulasi pemeriksaan gigi."}: pasien+CSRF+Origin;201 dengan owner sesi, serviceId/serviceName dari katalog SQLite startup, createdAt dan PENDING. Layanan tidak ada404; metadata patientName/owner/role/serviceName tambahan400. Katalog shared tidak berubah setelah startup.
- Detail, summary dan transition tetap memakai path existing /consultations/:id, /:id/summary, /:id/transition. ID baru dipakai dari response, bukan diasumsikan1004. Filename TXT server careprobe-auth-ID.txt; tidak memakai judul bebas atau shell.
- Record yang memiliki serviceId adalah konsultasi pribadi dan selalu menggunakan policy Secure, termasuk direct request dalam sesi Vulnerable. Ini juga berlaku pada detail/summary lama: tidak ada jalur IDOR alternatif untuk data pribadi.
- POST reason-only lama tetap membuat **fixture lab**, bukan konsultasi pribadi, demi SoD/forced-browsing yang sudah diuji. Seed1001–1003 tetap fixture lab. UI normal selalu mengirim serviceId dan tidak menampilkan list lab.

Tidak ada endpoint baru atau database kedua: Map, policy, sesi dan router authorization yang sama diperluas. Legacy /api/consultations (SQLite), /api/services dan endpoint injection tetap publik lokal untuk kompatibilitas, tetapi **tidak dapat membaca Map pribadi/authorization**. Jangan mengklaim semua API kini privat. SQLite SQL read-only search, command allowlist/sandbox, XSS exact fragment dan CSRF reminder tetap terpisah.

### Mengulang demo akademis

1. Login dahulu untuk halaman produk, pilih mode di Pengaturan. SQL direct API URL tetap tersedia tanpa UI; halaman /services?keyword=... sekarang memerlukan sesi login.
2. SQL dan XSS tetap di Layanan; fragment XSS exact harus diklik untuk efek marker. SQL error pada mode Vulnerable untuk fragment HTML tidak berarti XSS gagal: sink HTML dan SQLite berbeda.
3. Command export memakai **Pengaturan → Fixture legacy untuk latihan ekspor** atau GET/POST API legacy existing. Bukan tombol ringkasan pribadi.
4. CSRF: node scripts/serve-csrf.mjs pada4180, korban login di4173/Settings. Awali pengingat Nonaktif; form4180 mengirim request browser otomatis. Vulnerable berubah Aktif; Secure ditolak dan tetap Nonaktif. Port berbeda berarti cross-origin tetapi same-site.
5. IDOR/vertical/forced browsing/SoD/workflow/temporary grant/creep tetap memakai **Pengaturan → Pengujian Hak Akses**, fixture lab dan endpoint existing. Gunakan dua profile terpisah untuk Admin/Raka. Semua mutasi auth tetap wajib token/Origin kedua mode. Konsultasi pribadi tidak bisa digunakan sebagai target bypass lab.
6. Reset Admin menghapus grant serta seluruh Map, termasuk konsultasi pribadi; restart API juga mereset state. Capture bukti sebelum reset.

### Panduan manual dan screenshot terkini

Jalankan pnpm lab:up, pnpm build, pnpm preview (4173; dev memakai pnpm dev:web/5173). Akun fiktif existing didokumentasikan pada Materi10. Selesai Ctrl+C frontend/fixture4180 dan pnpm lab:down.

1. Logout, buka /: capture landing+header Beranda/Masuk. Buka /history langsung: capture /login?next=%2Fhistory, tanpa konten privat.
2. Login Alya; pilih layanan gigi, capture URL serviceId dan form tanpa field owner/nama pasien. Kirim alasan fiktif. Capture sukses/ID, History own, dashboard jumlah nyata dan refresh identity. Klik ringkasan dan periksa TXT; jangan memakai filename sebagai satu-satunya bukti isi.
3. Logout, login Bima: capture dashboard/History tanpa record Alya. Secure direct detail/summary ID Alya harus403. Ulangi pada sesi Vulnerable untuk record pribadi: tetap403. Catat request/status/state.
4. Login Raka: capture assigned consultation, review lalu complete. Direct unassigned1003 ditolak; normal skipped complete ditolak409. Capture state sebelum/sesudah.
5. Login Admin: capture dashboard counts, pesan tanpa patient content, Settings account/reminder, role/grant approval/revoke dan audit. Tidak ada halaman CRUD layanan.
6. Capture Settings mode dan fixture legacy terpisah; capture ulang SQL/Command/XSS/CSRF dan fixture Authorization sesuai panduan sebelumnya dengan lokasi baru.
7. Capture mobile390, tablet768 dan desktop1380: nav, form, status badge, controls tidak terpotong. Developer telah mengukur dashboard tanpa horizontal overflow pada tiga lebar tersebut; tidak mengklaim setiap halaman/breakpoint diuji.
8. Source: auth.ts restoration/revision/logout, AuthGate.svelte+layout guard, authorization.ts scoped list/owner create/service lookup/policy Secure pada personal records, assignment/expiry, CarePanel API paths dan legacy Map/SQLite separation.
9. Semua caption: waktu, origin, actor/current role, mode, ID/scope, method/status, expected/observed state. Tutup password/cookie/session/token. Screenshot konten tab developer ada pada docs/evidence/ux-*.png; address bar/Network lengkap masih perlu mahasiswa capture.

Batas bukti: klik unduh browser menghasilkan feedback, tetapi pemantauan file download mengalami timeout; tidak diklaim file browser tersimpan. TXT nyata/headers/isi telah diverifikasi lewat HTTP dan disimpan sebagai ux-summary.txt. Sesi expiry/offline/race diuji API/component, bukan menunggu1jam atau memutus jaringan browser. Ini simulasi lokal, bukan production auth; memori bounded/reset, semua normal consultation assigned Raka, tanpa scheduling atau perawatan medis. Docker egress tetap belum diblokir; batas sandbox tidak berubah.
