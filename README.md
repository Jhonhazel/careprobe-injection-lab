# CareProbe Health

**Telekonsultasi simulasi lokal** untuk TIG13 Secure Application Development, Material 8: Injection Testing. Pengguna dapat mencari layanan, mengajukan konsultasi fiktif, melihat riwayat, dan mengunduh ringkasan TXT. Ini bukan layanan medis nyata.

SvelteKit + TypeScript → proxy `/api` localhost → Express + TypeScript → SQLite sungguhan (`sql.js`, di memori). Dua aplikasi pnpm, tanpa database eksternal, autentikasi, atau layanan cloud. Ekspor judul ringkasan benar-benar memakai proses Linux, **hanya di Docker sandbox**. SQL dan command helper MVP digunakan kembali; tidak ada dependency baru.

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
2. Di **Konsultasi**, pilih layanan, isi `Nadia Demo` dan alasan fiktif, lalu kirim. Respons 201 disimpan di SQLite dan muncul di **Riwayat**. Dua konsultasi fiktif juga tersedia setelah startup.
3. Di **Riwayat**, gunakan judul `ringkasan-konsultasi`, lalu **Unduh Ringkasan**. File `careprobe-konsultasi-ID.txt` berisi layanan, tanggal, nama demo, alasan, dan status record terpilih. Judul normal menerima 1–40 huruf ASCII, angka, `-`, atau `_`. Kedua mode normal bekerja di Docker.
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
- `POST /api/consultations/:id/export`: `{documentTitle,mode}` → TXT attachment UTF-8. ID bilangan positif maksimal sembilan digit; title default `ringkasan-konsultasi`, mode hilang/invalid secure. Hanya suffix marker tetap diperbolehkan di vulnerable.
- Error berbentuk `{error:{code,message}}`; validasi 400, record/layanan tidak ada 404, sandbox tidak siap 503, sibuk 429, batas command 504. Body dibatasi 2 KiB, termasuk karakter multibyte.

Tidak ada autentikasi: seluruh konsultasi simulasi dapat dilihat setiap pengguna lokal. Database di memori reset saat restart. Aplikasi tidak menyediakan penanganan medis, video call, pembayaran, atau penyimpanan rekam medis. Batas detail dan bukti aktual: [test-cases.md](docs/test-cases.md).
