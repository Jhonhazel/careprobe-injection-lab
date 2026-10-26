# CareProbe Lab — desain dan rencana

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
