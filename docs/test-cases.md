# Matriks pengujian dan bukti aktual

Verifikasi pengembang: 26 Oktober 2026, Mac host Node 24.4.1, pnpm 10.13.1, Docker Engine 28.3.2. API Linux Node 22 dalam container pribadi. Tes nyata dicatat di bawah; ekspektasi tidak dianggap bukti keberhasilan.

| Kasus | Ekspektasi | Cara uji | Hasil aktual |
| --- | --- | --- | --- |
| Health | 200, DB ready | Supertest + Docker HTTP | PASS |
| Seed | Enam layanan fiktif | Supertest + Docker HTTP + browser | PASS |
| Cari gigi / tidak ada | 1 / 0 layanan | Supertest, komponen, browser gigi | PASS |
| SQL normal kedua mode | Result identik, 1 baris | Supertest | PASS |
| SQL tautologi vulnerable | 6 baris | Supertest + Docker HTTP + browser | PASS |
| SQL tautologi secure | 0 baris, query placeholder tetap | Supertest + Docker HTTP + browser | PASS |
| Multi-statement | Ditolak, seed utuh | Supertest | PASS |
| SQL sintaks rusak | 400 tanpa stack/SQL error detail | Supertest | PASS |
| Mode/type/length/array invalid | 400 JSON | Supertest | PASS |
| Command label normal | Output diagnostik kedua mode | Docker HTTP + browser secure | PASS |
| Command marker vulnerable | Output ekstra LAB_MARKER | Docker HTTP + browser | PASS |
| Command marker secure | 400, tanpa output | Docker HTTP + browser | PASS |
| Command default mode | secure, shell:false | Docker HTTP + komponen | PASS |
| Label tepat 40 karakter | 200 dalam Docker | Docker HTTP | PASS |
| Label 41/81, kosong, invalid | 400 | Docker HTTP / Supertest | PASS |
| Payload selain marker tetap | 400 | Docker HTTP / Supertest | PASS |
| Kedua mode command pada host | 503 SANDBOX_REQUIRED, tanpa output | Supertest, tanpa child process | PASS |
| Setiap sandbox fact hilang | fail closed | Pure unit, tanpa proses | PASS |
| Malformed JSON / body >2 KB | 400 / 413 | Supertest | PASS |
| Foreign Origin / unknown route | 403 / 404 JSON | Supertest | PASS |
| Loading, offline, empty, success | Status/alert/result aktual, submit disabled saat pending | Testing Library | PASS |
| Output HTML-like | Ditampilkan teks, bukan elemen HTML | Testing Library | PASS |
| Docker konfigurasi aktual | UID, read-only, cap_drop, security_opt, no mounts, resource, port | Docker inspect + gate health | PASS |
| Jaringan internal & published port | Akses localhost harus bisa | Docker Desktop: internal health 200, port kosong, ECONNREFUSED | FAILED pada konfigurasi awal; diganti dedicated bridge dan localhost lulus |
| Egress blocking | Tidak diklaim | Tidak melakukan koneksi keluar | NOT RUN; bridge tidak memblokir egress |
| Uji destructive / stress / arbitrary shell | Di luar scope | Tidak dijalankan | NOT RUN |

## Perintah dan ringkasan

```sh
NODE_ENV=test pnpm test
pnpm check
pnpm build
pnpm test:docker
```

Suite final: **49 backend + 12 frontend = 61 tes lulus** (exit 0). Regresi duplicate ID terbukti gagal dengan `each_key_duplicate` sebelum perbaikan, lalu lulus setelah loop kartu tidak lagi mengasumsikan ID unik. Sepuluh tes batas newline/line-separator juga lulus tanpa mengubah grammar yang sudah benar. Tes proxy offline gagal dengan INVALID_RESPONSE sebelum perbaikan, kemudian lulus dengan panduan API_OFFLINE / Docker Compose.

| Verifikasi akhir pada sumber final | Hasil |
| --- | --- |
| `NODE_ENV=test pnpm test` | PASS: 49 backend + 12 frontend, 5 file suite |
| `pnpm check` | PASS: TypeScript dan svelte-check; 0 error / 0 warning |
| `pnpm build` | PASS: API tsc dan SvelteKit adapter-node; exit 0 |
| `docker compose up --build -d --force-recreate --wait` | PASS: image final, container sehat |
| `pnpm test:docker` pada container final | PASS: 24 pemeriksaan |
| `pnpm preview`, HTTP smoke test route `/`, `/services`, kedua lab, `/report` | PASS: lima HTTP 200 |
| Preview `/api/services?keyword=gigi` | PASS: HTTP 200, satu record nyata |
| Browser pada production preview | PASS: homepage menampilkan layanan API nyata |
| Browser setelah `docker compose down` | PASS: katalog menunjukkan panduan API offline / Docker Compose, tanpa data palsu |
| Shutdown | PASS: container/jaringan CareProbe dihapus; frontend dev/preview dihentikan |

Tidak ada kegagalan tes fitur yang tersisa. Hasil jaringan internal yang gagal dan pemeriksaan yang tidak dijalankan tetap dicatat, bukan disembunyikan.

## Urutan RED → GREEN yang diamati

1. Health: HTTP 404 sebelum route dibuat → HTTP 200 setelah implementasi dan database nyata.
2. Katalog/SQL: 11 tes gagal karena route belum ada → 12 tes lulus setelah seed, binding, konkatenasi lab dan validasi.
3. Sandbox/command: 14 kegagalan policy/route/origin → 38 tes backend lulus setelah kontrol diimplementasikan. Tidak ada payload shell host.
4. Frontend: loading awal gagal, disusul tujuh tes form/panel gagal → delapan tes lulus. Katalog dua tes gagal sebelum implementasi → total sepuluh lulus.
5. Docker: sepuluh inspeksi awal lulus tetapi fetch host ECONNREFUSED pada jaringan internal. Evidence menunjukkan internal health siap dan published port hilang. Setelah beralih dedicated bridge, 24 pemeriksaan lulus.
6. Review: SQL SELECT UNION ALL menghasilkan 12 row dengan ID berulang. Regresi UI gagal `each_key_duplicate` → loop unkeyed → semua 11 tes frontend dan 49 tes backend lulus.

Kegagalan infrastruktur awal lainnya: npm DNS sandbox (instalasi berizin berhasil), Supertest EPERM port loopback (tes berizin berhasil), Svelte config belum dihasilkan (sync/template dibuat sebelum RED perilaku). Ini tidak dilaporkan sebagai tes fitur yang lulus.

## Pengujian browser

IAB lokal pada lebar sekitar 742 px: navigasi kelima halaman; katalog enam dan pencarian gigi satu; SQL payload secure nol dan vulnerable enam; normal command secure berhasil; marker secure 400 dan vulnerable mencetak LAB_MARKER. Halaman laporan menampilkan empat bukti aktual yang sesuai (SQL secure/vulnerable dan command secure/vulnerable), input, HTTP, waktu dan respons. Form menggunakan API Docker nyata melalui proxy. Screenshot dummy: [command-vulnerable.png](evidence/command-vulnerable.png). Lebar mobile lebih kecil dan browser lain tidak otomatis dianggap telah diuji.

Collection Bruno disediakan sebagai request terdokumentasi. Aplikasi/CLI Bruno tidak tersedia sehingga collection **NOT RUN** melalui Bruno; endpoint dan hasil ekuivalennya sudah diuji dengan Supertest, skrip HTTP Docker, serta browser. Tidak ada klaim semua contoh Bruno dieksekusi.

## API contract

| Endpoint | Input / validasi | Sukses | Error / side effect |
| --- | --- | --- | --- |
| GET /api/health | tanpa input | 200 `{status,database,commandSandbox}` | Tidak mengubah data |
| GET /api/services | keyword opsional string <=120, tanpa `;`; parameter lain ditolak | 200 `{mode:'secure',keyword,count,services}` | 400 validation; baca saja |
| GET /api/labs/sql | mode secure/vulnerable (default secure), keyword seperti services | 200 `{mode,keyword,count,services,query,parameters}` | 400 validation / INVALID_SQL; query-only; hasil nyata |
| POST /api/labs/command | JSON, mode default secure; label 1–80 kemudian grammar 1–40 (+suffix marker vulnerable) | 200 `{mode,label,output,shell,timeoutMs,outputLimitBytes}` | 400 validation / INVALID_JSON, 413 BODY_TOO_LARGE, 503 SANDBOX_REQUIRED, 429 LAB_BUSY, 504 COMMAND_LIMIT |

Semua error API: `{ "error": { "code": "...", "message": "..." } }`. Origin luar daftar lokal mendapat 403; route tidak dikenal 404. Respons tidak menyertakan stack trace. HTTP request tidak memiliki operasi tulis DB; pengulangan tidak mengubah seed, tetapi setiap command valid mengeksekusi formatter lagi. Penolakan 400 pada mode secure adalah hasil mitigasi yang benar.

Validasi frontend hanya kenyamanan UI. Kontrol utama berada di server; Bruno/Supertest/HTTP langsung dapat melewati frontend. Jangan menonaktifkan kontrol server demi demo.
