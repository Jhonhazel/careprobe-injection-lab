# CareProbe Lab

**Clinic Security Testing Laboratory** — MVP lokal untuk TIG13 Secure Application Development, Material 8: Injection Testing. Antarmuka berbahasa Indonesia; seluruh layanan, harga, dan deskripsi adalah fiktif. Ini bukan aplikasi layanan medis.

SvelteKit + TypeScript → proxy `/api` localhost → Express + TypeScript → SQLite sungguhan (`sql.js`, di memori). Dua aplikasi pnpm, tanpa database eksternal, autentikasi, atau layanan cloud. Command lab benar-benar memakai proses Linux, **hanya di Docker sandbox**.

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
| SQL Lab | http://127.0.0.1:5173/labs/sql-injection |
| Command Lab | http://127.0.0.1:5173/labs/command-injection |
| Laporan | http://127.0.0.1:5173/report |
| API health | http://127.0.0.1:3100/api/health |

Frontend mengakses URL relatif `/api`, diproxy Vite ke alamat tetap `http://127.0.0.1:3100`. Tidak ada URL API publik atau konfigurasi secret.

```sh
# Pemeriksaan API tanpa mengirim payload
curl http://127.0.0.1:3100/api/health
```

Respons sandbox yang siap: `{"status":"ok","database":"ready","commandSandbox":true}`. Jika `false`, jangan jalankan command lab di luar container; perbaiki setup Compose.

## Demonstrasi yang aman

1. Buka `/services`. Enam layanan berasal dari SQLite. Cari `gigi`: satu baris. Kata kunci yang tidak ada menghasilkan empty state. Katalog selalu secure.
2. Buka SQL Lab. Cari `gigi` pada Secure dan Vulnerable: keduanya satu baris.
3. Klik **Gunakan contoh ini** untuk memasukkan payload berikut. Jalankan pada kedua mode:

```text
' OR 1=1 -- 
```

Ekspektasi: Vulnerable mengembalikan enam baris; Secure nol. Panel menunjukkan query aktual dan parameter. Secure memakai `LIKE ?` dengan nilai keyword terikat, sehingga input tidak mengubah struktur query. `%` dan `_` tetap memiliki arti wildcard pencarian LIKE; binding mencegah injeksi sintaks, bukan menonaktifkan wildcard.

4. Buka Command Lab. Jalankan `clinic-demo` pada kedua mode: `diagnostic: clinic-demo`.
5. Gunakan hanya payload marker berikut:

```text
clinic-demo; printf LAB_MARKER
```

Vulnerable di Docker mengeluarkan:

```text
diagnostic: clinic-demo
LAB_MARKER
```

Secure menolak payload dengan HTTP 400 `VALIDATION_ERROR`, tanpa menjalankan proses. Secure memanggil `/usr/bin/printf` dengan argumen terpisah dan `shell:false`. Penolakan validasi merupakan hasil mitigasi yang diharapkan, bukan kegagalan aplikasi.

6. Buka `/report` pada tab yang sama. Hasil HTTP terakhir untuk setiap kombinasi lab/mode disimpan dalam `sessionStorage`, termasuk input, waktu, count/output, atau error. Bukti ini dapat diubah pengguna dan **bukan audit permanen**. Screenshot hasil sebelum mengganti tes; tidak ada klaim otomatis bahwa pengujian lulus.

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
```

Preview tersedia di `http://127.0.0.1:4173`. Jangan jalankan build bersamaan dengan dev server ketika memverifikasi hasil build; keduanya memakai direktori `.svelte-kit`. `pnpm preview` adalah cara preview MVP yang didukung. Menjalankan adapter Node secara langsung membutuhkan konfigurasi proxy tambahan dan tidak dibutuhkan untuk presentasi lokal.

Tes spesifik: `pnpm --filter @careprobe/api test` atau `pnpm --filter @careprobe/web test`.

Supertest perlu izin membuka port loopback sementara. Jika lingkungan agent/CI memblokir `listen` dengan EPERM, jalankan tes dari terminal lokal dengan izin loopback. Jangan mengganti sandbox gate agar tes command bisa berjalan pada host. Tes frontend menggunakan stub hanya pada batas HTTP; demo browser dan skrip Docker memeriksa integrasi API sungguhan secara terpisah.

Hasil verifikasi aktual dan keterbatasan dicatat pada [docs/test-cases.md](docs/test-cases.md). Template laporan tersedia pada [docs/lab-report.md](docs/lab-report.md).

## Reset dan shutdown

```sh
# Reset SQLite: membuat ulang enam record, karena seluruh DB di memori
docker compose restart api

# Berhenti: Ctrl+C di terminal frontend, kemudian
pnpm lab:down
```

`lab:down` menghapus container dan jaringan proyek ini; tidak menghapus image/dependensi proyek lain. Data tidak persisten dan tidak memerlukan migration atau volume. Tombol **Hapus bukti sesi** di laporan menghapus bukti browser secara terpisah. Tidak ada endpoint tulis data atau operasi booking/payment.

Untuk memeriksa fail-closed host secara manual, hentikan Docker API lebih dulu, lalu jalankan `pnpm dev:api`. Endpoint services/SQL tetap dapat dipakai secara lokal, tetapi kedua mode command dengan label normal mengembalikan HTTP 503 `SANDBOX_REQUIRED`. Hentikan dengan Ctrl+C lalu jalankan kembali `pnpm lab:up` untuk command lab.

## Batas Docker dan model ancaman

- UID/GID `10001:10001`, non-root; root filesystem read-only; tanpa volume, host mount, Docker socket, privileged mode, atau secret env file.
- `cap_drop: ALL`, `no-new-privileges:true`, seccomp default Docker; runtime gate memverifikasi Linux, marker Docker, UID/GID, root mount read-only, effective capabilities nol, no-new-privileges, dan seccomp aktif. Env flag saja tidak cukup.
- Batas 256 MiB, 0.5 CPU, 48 PID, satu diagnostik aktif, timeout 1000 ms, output maksimal 4096 byte, JSON body maksimal 2 KiB. Tidak perlu tmpfs.
- Port dipublikasikan **hanya** `127.0.0.1:3100`; Express boleh bind `0.0.0.0` di dalam container. Frontend dev/preview bind `127.0.0.1` dengan strictPort.
- **Keterbatasan jaringan aktual:** `internal:true` dicoba dan diverifikasi: health internal berhasil tetapi Docker Desktop menghilangkan published port (`NetworkSettings.Ports` kosong; localhost ECONNREFUSED). Compose akhirnya menggunakan dedicated bridge agar localhost berfungsi. **Egress tidak diblokir dan tidak diklaim terisolasi.** Tidak ada tes koneksi keluar; allowlist hanya mengizinkan label atau satu printf marker, sehingga contoh command tidak membuka jaringan. Jangan memperluas payload.
- API menolak Origin browser selain daftar localhost development/preview. Ini bukan autentikasi; proses lokal yang dipercaya tetap dapat memanggil API. Docker bukan jaminan keamanan kernel/host dan tidak menggantikan VM untuk pengujian command bebas.
- SQL runtime query-only, statement tunggal, input maksimal 120 karakter, tanpa titik koma. Hanya ada tabel layanan dummy; lab bukan target pentest umum, fuzzing berat, atau demonstrasi write/destruction.
- Tidak ada klaim uji destructive, stress, timeout exhaustion, atau semua kombinasi platform. Compose yang tidak memenuhi guard menolak command daripada menjalankannya tanpa perlindungan.

Konfigurasi mengacu pada [referensi service Compose](https://docs.docker.com/reference/compose-file/services/) dan [jaringan Compose](https://docs.docker.com/reference/compose-file/networks/); binding memakai [API statement sql.js](https://sql.js.org/documentation/Statement.html).

## Berkas penting

- `apps/api/src/app.ts`: validasi Zod, routes, Origin policy, JSON error handling.
- `database.ts`: enam seed record, SELECT rentan dan parameter binding, query-only.
- `command.ts`, `sandbox.ts`: allowlist, sink shell/no-shell, pembatasan dan fail-closed.
- `apps/web/src/routes/`: lima halaman; `src/lib/components/`: katalog, kartu, form lab, panel hasil; `src/lib/api.ts`: HTTP client dan bukti sesi.
- `apps/api/Dockerfile`, `docker-compose.yml`, `scripts/test-docker.mjs`: sandbox dan pemeriksaan integrasi aktual.
- `bruno/`: request lokal yang dapat dibuka dengan Bruno; respons dan matriks tes dalam dokumentasi.
- [docs/assignment-mapping.md](docs/assignment-mapping.md): pemetaan persyaratan tugas.
- [docs/file-manifest.md](docs/file-manifest.md): daftar lengkap berkas yang dibuat.

Referensi PDF, konfigurasi `.env*`, dependensi, hasil build, dan screenshot di luar bukti dummy yang dipilih tidak disertakan Git. Tidak ada remote push atau perubahan pada ReallySick.
