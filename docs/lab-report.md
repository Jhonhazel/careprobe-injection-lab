# Laporan lab dan template mahasiswa

Mata kuliah: TIG13 — Secure Application Development. Materi: 8 — Injection Testing.

Nama/NIM: **isi sendiri**. Tanggal presentasi: **isi sendiri**. Lingkungan: Node/pnpm/Docker/browser **catat versi Anda**.

## Ruang lingkup

Target hanya CareProbe Health pribadi di localhost. SQLite berisi enam layanan dan konsultasi dengan nama demo fiktif. Command memformat judul ringkasan memakai `printf`; payload selain label normal atau satu suffix marker ditolak. Kedua mode command hanya boleh berjalan pada API Linux Docker yang memenuhi guard.

## Skenario SQL Injection

- **Tujuan:** membuktikan perbedaan pencarian dengan konkatenasi dan binding pada engine SQLite sungguhan.
- **Source:** input pencarian layanan pada halaman Layanan (`keyword`).
- **Flow:** Layanan → `/api/services?keyword=...&mode=...` → validasi Zod → `searchServices()` → SQLite. Mode berasal dari Pengaturan.
- **Sink rentan:** string SELECT dengan input disisipkan langsung, lalu SQLite `prepare()`/`step()`. Memanggil prepare saja belum aman jika query sudah dikonkatenasi.
- **Control:** database query-only, satu statement, tanpa titik koma, input maksimal 120 karakter. Mode secure menggunakan placeholder `?` dan `statement.bind()`.
- **Input normal:** `gigi`. Ekspektasi satu layanan pada kedua mode.
- **Input uji:** `' OR 1=1 -- ` (termasuk spasi setelah `--`). Ekspektasi rentan enam baris, secure nol.
- **Observasi aktual pengembang:** Supertest dan API container telah menghasilkan enam/nol sesuai tes; browser juga menampilkan hasil itu. Bukti bukan hasil tes pada mesin mahasiswa; ulangi dan catat sendiri.
- **Confidentiality:** bypass filter berpotensi mengungkap record yang tidak semestinya pada aplikasi nyata. Lab hanya memiliki layanan dan konsultasi fiktif; SELECT rentan berpotensi membaca keduanya.
- **Integrity/availability:** tergantung hak DB pada sistem nyata. Dalam lab, perubahan database dibatasi query-only dan input multi-statement ditolak; serangan write/DoS tidak didemonstrasikan.
- **Mitigasi:** parameter binding server-side, hak DB minimum, validasi sebagai lapisan tambahan. Frontend tidak dapat menjadi kontrol utama karena request dapat dikirim langsung.
- **Retest:** bandingkan input normal dan payload yang sama pada kedua mode. Catat pengaturan mode, input, count, status HTTP dan waktu. Struktur query/binding diperiksa di kode atau tes legacy, tidak ditampilkan pada UI produk.

## Skenario Command Injection

- **Tujuan:** mengamati interpretasi metakarakter shell yang benar-benar menghasilkan command kedua tanpa merusak sistem.
- **Source:** input judul dokumen pada kartu Riwayat (`body.documentTitle`).
- **Flow:** Riwayat → POST `/api/consultations/:id/export` → record SQLite terpilih → `runCommand(mode, documentTitle)` → allowlist khusus mode → sandbox gate → pembatasan concurrency → `execFile()`. Output judul digabung dengan record menjadi TXT.
- **Sink rentan:** `/bin/sh -c` dengan string `/usr/bin/printf 'diagnostic: %s\n' LABEL`.
- **Control lab:** Linux Docker non-root/read-only/capabilities nol/no-new-privileges/seccomp, timeout 1 s, output 4 KiB, resource limit. Allowlist rentan sengaja hanya mengizinkan label dan suffix `; printf LAB_MARKER`.
- **Input normal:** `clinic-demo`. Ekspektasi TXT berisi `Judul: clinic-demo` dan layanan/nama/alasan/tanggal/status dari record terpilih, pada kedua mode dalam container. Nama file tetap `careprobe-konsultasi-ID.txt`.
- **Input uji:** `clinic-demo; printf LAB_MARKER`. Ekspektasi vulnerable mencetak marker pada baris kedua, secure HTTP 400 tanpa proses/output.
- **Observasi aktual pengembang:** skrip Docker/API dan browser menghasilkan marker ekstra di vulnerable, dan secure menolak. Host-side Supertest membuktikan label normal kedua mode mendapat 503. Tidak ada untrusted shell command yang dijalankan pada Mac.
- **Confidentiality:** command bebas pada sistem nyata dapat membaca data sesuai hak proses. Akses data tidak diuji.
- **Integrity/availability:** command bebas dapat mengubah state atau mengganggu proses. Lab sengaja tidak menyediakan payload tersebut.
- **Mitigasi:** executable tetap, argumen terpisah, `shell:false`, allowlist dan least privilege. Shell tidak diperlukan untuk operasi normal.
- **Retest:** jalankan input normal kedua mode; marker kedua mode; pastikan guard host menolak eksekusi. Pemeriksaan resource/config dilakukan sebelum payload.
- **Batas penting:** dedicated bridge masih mengizinkan egress. `internal:true` diuji tetapi menghilangkan published localhost port pada Docker Desktop ini. Tidak dilakukan tes koneksi keluar atau klaim isolasi egress. Container bukan pengganti VM untuk shell bebas.

## Hasil mahasiswa — isi setelah benar-benar diuji

| Skenario / mode | Input | HTTP/count/output aktual | Bukti dan waktu | Retest / kesimpulan |
| --- | --- | --- | --- | --- |
| SQL normal / secure | gigi | **belum diisi** | **screenshot/terminal** | **isi** |
| SQL normal / vulnerable | gigi | **belum diisi** | **screenshot/terminal** | **isi** |
| SQL tautologi / vulnerable | payload SQL di atas | **belum diisi** | **screenshot/terminal** | **isi** |
| SQL tautologi / secure | payload SQL yang sama | **belum diisi** | **screenshot/terminal** | **isi** |
| Command normal / kedua mode | clinic-demo | **belum diisi** | **screenshot/terminal** | **isi** |
| Command marker / vulnerable | payload marker | **belum diisi** | **screenshot/terminal** | **isi** |
| Command marker / secure | payload marker yang sama | **belum diisi** | **screenshot/terminal** | **isi** |
| Command host / kedua mode | clinic-demo | **belum diisi** | **tes otomatis** | **isi** |

Preferensi localStorage dapat diubah pengguna dan bukan kontrol keamanan. Bukti berada di screenshot, TXT unduhan, dan keluaran tes; tidak ada halaman laporan atau pencatat sessionStorage pada UI baru. Hasil pengembang dapat dilihat pada `test-cases.md`; bedakan dari pengujian ulang mahasiswa.

## Checklist screenshot presentasi

- [ ] Homepage dengan disclaimer dan branding asli.
- [ ] Katalog: enam layanan dan pencarian gigi.
- [ ] Settings Vulnerable terkonfirmasi, lalu Layanan dengan payload dan count 6.
- [ ] Settings Secure, lalu Layanan dengan payload sama dan count 0; tunjukkan binding di kode.
- [ ] Konsultasi berhasil disimpan dan muncul pada Riwayat; TXT normal cocok dengan record.
- [ ] Riwayat Vulnerable: judul marker dan TXT berisi LAB_MARKER pada baris tambahan.
- [ ] Riwayat Secure: judul sama dan validasi 400 pada kartu, tanpa file.
- [ ] Catat waktu, ID konsultasi, dan lokasi screenshot/TXT dalam tabel laporan.
- [ ] Terminal suite, typecheck, build, serta 39 pemeriksaan Docker.
- [ ] Konfigurasi aktual non-root/read-only/caps/resource/port; jelaskan batas bridge.

Gunakan hanya screenshot aplikasi dummy. Periksa tidak ada secret, tab privat, atau data orang lain sebelum membagikan berkas.

## Bukti refactor dan batas observasi

Baseline diperiksa ulang: 61 tes, check 0/0, 24 Docker checks. Refactor: 85 tes API/unit dan 17 tes UI; 39 Docker checks termasuk ekspor TXT record aktual; 11 HTTP smoke checks pada production preview. Lihat test-cases.md untuk hasil final dan batas pengujian browser. Screenshot `evidence/command-vulnerable.png` adalah bukti MVP lama, bukan UI CareProbe Health.

Saat menulis analisis CIA, bedakan dampak potensial sistem nyata dari tindakan lab yang benar-benar dilakukan. Tidak ada pembacaan secret, perubahan file, koneksi keluar, atau perintah bebas. Read-only search tidak menjamin pembatasan baris: semua data harus tetap fiktif.

## Pengujian Injection melalui URL dan Query Parameter

**Objective:** buktikan input URL, tanpa submit form, mencapai sink yang sama. Gunakan URL copy-paste di README; jangan melakukan double decoding.

- **SQL source/flow/sink:** URL keyword → req.query.keyword → GET /api/services → Zod → searchServices → SQLite prepare/step. **Control:** prepared statement dan binding di Secure; read-only, panjang120 dan satu statement tetap. **Evidence:** HTTP/browser normal1, rentan6, secure0. **Impact:** filter dapat dilewati sehingga data dapat terbuka; write/DoS tidak didemonstrasikan. **Mitigation/retest:** input encoded yang sama pada Secure menghasilkan0, input gigi tetap1.
- **Command source/flow/sink:** URL documentTitle → req.query.documentTitle → GET export handler bersama POST → consultation record → runCommand → shell rentan. **Control:** allowlist tetap, Docker guard, batas1s/4KiB, secure fixed executable/args tanpa shell. **Evidence:** HTTP GET normal dan marker200, TXT Bima Demo ID2; marker pada baris tambahan hanya vulnerable. Secure400 tanpa attachment; host503. **Impact:** command bebas dapat membahayakan CIA pada sistem nyata; lab tidak menguji akses data/perusakan/availability. **Mitigation/retest:** judul marker sama ditolak Secure; judul normal tetap menghasilkan TXT.
- **Command dari HTTP JSON:** `POST /api/consultations/:id/export` membaca `req.body.documentTitle`, lalu memakai handler, record, sink, kontrol, dan format TXT yang sama. Ini input tanpa form tetapi bukan URL query. Request Bruno 09–11 atau curl pada README dapat menjadi bukti terpisah. `req.params.id` hanya menentukan record melalui validasi dan lookup terparameter; tidak mencapai sink shell.

URL encoding bukan mitigasi; Settings bukan autentikasi/otorisasi server. Direct URL dapat menetapkan mode dalam lab lokal. GET dapat dipanggil ulang/link preview; jangan publish/link otomatis URL rentan. Egress bridge tetap tidak diblokir.

**Batas observasi:** Chrome alat memblokir GET attachment normal (ERR_BLOCKED_BY_CLIENT). File URL yang disimpan pengembang adalah respons HTTP container, bukan unduhan browser. Jangan klaim screenshot/download browser berhasil tanpa mengulangnya sendiri. Screenshot tab tidak mencakup address bar/DevTools; gunakan checklist README untuk bukti mahasiswa. DOCX yang sudah diserahkan tidak diubah.

| Skenario URL | Hasil aktual mahasiswa | Screenshot/Network/TXT dan waktu | Retest |
| --- | --- | --- | --- |
| SQL rentan / Secure, input encoded sama | **belum diisi** | **isi setelah diuji** | **isi** |
| GET TXT normal dan marker rentan | **belum diisi** | **catat sumber HTTP atau browser** | **isi** |
| GET marker Secure | **belum diisi** | **400 dan tanpa attachment** | **isi** |
