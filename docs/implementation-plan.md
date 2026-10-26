# CareProbe Health — rencana refactor produk

Spesifikasi refactor: permintaan pengguna 26 Oktober 2026. Implementasi langsung secara lokal, tanpa commit/deploy/remote, tanpa mengakses ReallySick. Skill writing-plans dan TDD dipakai untuk langkah kecil RED → GREEN; tidak menambah dependency atau framework.

## Pemetaan perubahan

- [x] Baseline: 49 API + 12 frontend lulus; check 0 error/warning. Docker baseline24 lulus; build awal juga lulus setelah Settings awal ditambahkan.
- [x] Settings: `src/lib/security-mode.ts` (Svelte store, init browser-only, localStorage), `/settings` (konfirmasi eksplisit sebelum rentan). Tes default, persist/refresh, invalid storage, konfirmasi/cancel.
- [x] Services: `/api/services` memakai `searchServices` yang sama dengan lab; hanya mode baru secure/vulnerable, missing/invalid default secure. Katalog memakai store, tidak menampilkan query atau selector. Endpoint lab lama tetap untuk regresi.
- [x] Consultations: tabel SQLite kecil melalui createDatabase yang sama; list/insert terparameter dalam database.ts dan GET/POST Express. query_only hanya OFF selama insert sinkron dalam try/finally. Tes persist, validasi, service tidak ada, data berkarakter khusus, readonly sesudah insert/search.
- [x] History/export: `/history`, list shared dengan halaman konsultasi; title default `ringkasan-konsultasi`; POST export memakai `runCommand` tanpa memperluas grammar atau guard. File txt dari record aktual, filename tetap berdasarkan ID, tanpa write filesystem. Tes host fail-closed; tes marker dan normal export hanya dalam Docker.
- [x] Presentation: pertahankan layout/CSS/kartu; ubah copy homepage dan lima navigasi. Route lab/report lama redirect. Hapus UI lab yang tidak dipakai; pindahkan tes loading/error/escaping/duplicate rows ke fitur nyata.
- [x] Final: full suite/check/build/Docker + smoke API/browser, dokumentasi/mapping/evidence/Bruno/manifest/diff file. Review independen sebelum selesai.

## Kontrak dan risiko yang diuji

- Mode produk hilang/invalid menjadi secure; endpoint lab legacy tetap menolak invalid mode dengan 400. Preferensi browser bukan izin melewati sandbox.
- Konsultasi POST tidak di-retry otomatis; tombol dinonaktifkan saat pending. Database in-memory reset saat API restart; semua data wajib fiktif.
- Judul dokumen mengikuti grammar label existing: 1–40 ASCII huruf/angka/-/_, opsional suffix marker tetap hanya pada vulnerable. Tidak memperluas sink untuk judul bebas.
- Response export text/plain attachment, ID divalidasi, nama file server-controlled, output command tetap 1s/4KiB.
- Jaringan bridge dan keterbatasan egress tetap seperti baseline; Dockerfile, sandbox dan Compose tidak perlu diubah.

## Hasil refactor

102 tes lulus (85 API + 17 UI), check 0/0, build berhasil, 39 Docker checks, 11 HTTP smoke checks. Browser desktop1280/mobile390, persist Settings, SQL6/0, create/history dan TXT Chrome aktual diverifikasi. Error ekspor dipindah ke kartu setelah tes RED → GREEN. Review read-only tidak menemukan temuan yang perlu diperbaiki. Semua guard/Compose/helper command dan lockfile tetap. Bukti pada docs/evidence; container dan preview verifikasi dihentikan; mode browser dikembalikan Secure. Tidak ada commit/push/deploy atau akses ReallySick.

## Riwayat MVP awal (sebelum refactor)

Spesifikasi: permintaan pengguna 26 Oktober 2026, ditambah dokumen referensi MVP. Proyek mandiri; ReallySick tidak perlu dibaca atau disentuh. Implementasi langsung sesuai instruksi pengguna.

## Desain

- Dua aplikasi pnpm: SvelteKit + Express; sql.js menyimpan enam layanan fiktif di memori.
- Browser memakai `/api` melalui proxy localhost. API Docker dipublikasikan hanya pada `127.0.0.1:3100`; frontend pada `127.0.0.1:5173`.
- SQL: SELECT tunggal yang dikonkatenasi untuk mode vulnerable; parameter binding untuk secure dan katalog.
- Command: kedua mode ditutup di luar container Linux dengan UID non-root, root filesystem read-only, capabilities nol, dan no-new-privileges. Allowlist mode vulnerable hanya menerima label biasa atau satu suffix `; printf LAB_MARKER`. Shell benar-benar menafsirkan separator; bukan simulasi. Secure memakai executable dan argumen terpisah.
- Hasil UI berasal dari API; bukti sesi disimpan lokal pada tab untuk halaman laporan. Tidak ada layanan eksternal atau data nyata.
- Visual: tipografi bersih, teal/biru, putih, kartu layanan dan panel hasil teks yang responsif.

## Langkah / pemeriksaan

1. Scaffold konfigurasi; RED→GREEN health API dan homepage.
2. RED→GREEN seed, pencarian aman, perbedaan SQL injection dan validasi HTTP.
3. RED→GREEN fail-closed command; build container, uji marker hanya dalam sandbox; inspeksi Docker dan jaringan.
4. RED→GREEN komponen hasil, integrasi form, loading/error/empty; lima halaman dan laporan bukti sesi.
5. README, pemetaan tugas, laporan, matriks tes; jalankan suite, typecheck, build, tes Docker dan browser.

## Catatan progres

- Workspace kosong pada branch fitur yang sudah ada. Tidak ada AGENTS.md lokal; instruksi pengguna berlaku.
- Docker tersedia melalui eksekusi berizin; tidak ada host command injection.
- Health RED (404) → GREEN; SQLite 12 tes GREEN; command/validasi host 38 tes GREEN; frontend 10 tes GREEN; check 0 error/warning.
- Koreksi jaringan: Docker Desktop tidak menerbitkan port pada jaringan internal (NetworkSettings.Ports kosong; HTTP ECONNREFUSED; health internal berhasil). Gunakan dedicated bridge demi akses localhost; egress tidak diblokir/diklaim. Tidak menambah proxy/infrastruktur.
- Review independen: P2 duplicate ID pada hasil UNION ALL dibuktikan RED `each_key_duplicate`, diperbaiki dengan loop unkeyed, GREEN. Minor gap boundary newline ditutup dengan 10 kasus; regex sudah benar, tidak ada perubahan sink.
- Suite sesudah review: backend 49/49, frontend 11/11. Kelima halaman diuji browser dengan API Docker nyata; report menampilkan empat hasil sesi yang sesuai. Bukti marker screenshot tersimpan di docs/evidence.
- Perbaikan error proxy: tes RED (INVALID_RESPONSE saat proxy 500 tanpa JSON) → panduan API_OFFLINE/Docker → GREEN. Suite final 49 backend + 12 frontend; typecheck 0/0, build exit 0, 24 Docker checks dan 6 preview smoke checks PASS.
- Sumber sudah diformat agar mudah dibaca. Dokumentasi README, mapping, template laporan, matriks tes, manifest 56 berkas dan collection Bruno selesai. Bruno CLI tidak tersedia, sehingga collection tidak diklaim telah dijalankan.
- Shutdown Docker berhasil; browser production preview memverifikasi pesan backend offline nyata, tanpa hasil palsu. Layanan dev/preview dihentikan setelah pemeriksaan; jalankan perintah README untuk demonstrasi kembali. Tidak ada commit/push atau akses ke ReallySick.
