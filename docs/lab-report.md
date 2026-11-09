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

## Materi 9 — Client Side Security: XSS dan CSRF

Gunakan prosedur README dan hasil aktual test-cases.md sebagai referensi; bukti mahasiswa tetap diisi setelah capture sendiri.

| Urutan analisis | XSS | CSRF |
| --- | --- | --- |
| SOURCE | keyword URL, fragmen tombol HTML exact | Form user-triggered origin4180 |
| FLOW | URL → ServiceCatalog → ringkasan | Browser cookie → proxy → Express session |
| SINK | @html / DOM button onclick | assignment session.reminder |
| CONTROL | Interpolasi teks Secure, exact gate pada lab | CSRF token sesi + Origin; cookie Lax/HttpOnly |
| EVIDENCE | isi span marker Vulnerable vs teks Secure |200/state berubah vs403/state tetap; cookie otomatis harus diamati browser |
| DAMPAK | Potensi manipulasi konten browser; lab hanya marker | Potensi perubahan state tanpa niat pengguna; lab preferensi fiktif |
| MITIGASI | Output handling konteks tepat, CSP defense in depth | Token, Origin, cookie policy, metode POST |
| RETEST | URL identik Secure, tanpa tombol HTML aktif | Form identik Secure ditolak, kontrol sah berhasil |

Catat waktu, URL, mode, status, nilai preferensi sebelum/sesudah dan screenshot. Tutup nilai cookie/token/ID sesi. XSS secara teknis DOM-reflected; tidak ada stored XSS. Tidak ada klaim session hijacking atau pasien nyata. DOCX tidak otomatis diperbarui.

## Materi 10 — Authorization: Access Control dan Privilege Management

| Kasus | SOURCE → FLOW → SINK | CONTROL | DAMPAK potensial / RETEST |
| --- | --- | --- | --- |
| A IDOR horizontal | Alya mengubah URL1001→1002 → login/session → role/policy → read/download fixture Bima | PATIENT ownership Secure | Confidentiality; Vulnerable200 vs Secure403, GET tidak memutasi |
| B escalation/forced browsing | Pasien POST actionreview ke1001 → sesi + CSRF → policy → status fixture | Role DOCTOR + assignment/duties/state | Integrity/workflow availability; Vulnerable200/IN_REVIEW vs Secure403/PENDING |
| C workflow bypass | Raka POST complete dariPENDING → sesi + CSRF → policy → status | IN_REVIEW sebelum complete | Integrity/workflow; Vulnerable200/COMPLETED vs Secure409/PENDING, urutan sah200 |
| D privilege creep | Admin revoke → sesi lama Raka → POST review1002 | Secure membaca role/grant terkini; Vulnerable memakai snapshot DOCTOR login hanya untuk aksi ini | Vulnerable200/IN_REVIEW, Secure403/PENDING; identity PATIENT pada keduanya |

EVIDENCE pengembang ada di test-cases.md; bukti mahasiswa harus diisi setelah capture sendiri. Untuk tiap screenshot cantumkan timestamp, actor/role/mode/ID, HTTP status dan state sebelum/sesudah. Tutup password/token/cookie. Capture permission mapping, ownership/assignment/workflow, login/session rotation, role revocation, branch rentan dan tes. Admin tidak membaca isi fixture pasien. Fixture Map memori1001–1003 terpisah dari database legacy; tidak ada pasien nyata. Semua mutasi otorisasi tetap memerlukan CSRF di Vulnerable. Tidak ada klaim production authentication. Prosedur rinci README; DOCX tidak dimodifikasi.

## Pembaruan alur pengambilan bukti login

Untuk capture Materi10, login sekarang melalui `/login` atau Masuk di header; form akun di Pengaturan telah diganti. Ambil identity/role di header setelah refresh, lalu lanjutkan IDOR/RBAC/ABAC pada panel Riwayat yang sama. Logout header memanggil endpoint backend lama dan protected fixture kembali401. Uji token/Origin dan role server tetap sama. Screenshot sesi/password/token tetap harus ditutup. Analisis dan batas fixture otorisasi dibanding legacy tidak berubah.

## Materi 10 — Bab 2: Privilege Management

Pemetaan2.1–2.8 dan prosedur/screenshot rinci ada pada README Bab2 dan assignment-mapping. Tidak diperlukan delapan sink baru: vertical review yang sama mencakup least privilege, creator/reviewer, escalation dan forced browsing. Delta hanya grant Raka dan stale-review1002.

| Konsep | Objek/operasi dan kontrol | Hasil aktual / retest |
| --- | --- | --- |
| 2.1 Management | Raka request; Admin approve/reject/review/revoke; backend identity+CSRF |Request201 tidak aktif; self-approve403; Admin200; audit meaningful |
| 2.2 Lifecycle | Satu grant REQUESTED→approval event→ACTIVE atau REJECTED, lalu EXPIRED/REVOKED |Aktif5menit server; tepat expiry rolePATIENT. Jam tes deterministik, belum wait5menit browser |
| 2.3 Least privilege | Permission map dan assignment existing |Admin content403, unassigned doctor403; pasien reviewV200/S403 |
| 2.4 Segregation | Owner dari create session, creator bukan reviewer; requester bukan approver |Alya create nyata lalu review V200/S403; Raka self-approve403; own record setelah gantiDOCTOR tetap DUTY_CONFLICT |
| 2.5 Escalation | Horizontal ownership vs vertical doctor-action |Alya Bima1002 V200/S403; reviewown1001 V200/S403; bukan promosiADMIN |
| 2.6 Forced browsing | Direct POST transition, UI pasien tanpa tombol dokter |Login+CSRF tetap wajib; V200, S403 dan statePENDING |
| 2.7 Workflow | Dokter assigned, PENDING→IN_REVIEW→COMPLETED |Skip review V200/S409; jalur sah200, completed tidak reopen |
| 2.8 Creep | Sesi Raka DOCTOR lama, livePATIENT, hanya review1002 |V200/IN_REVIEW, S403/PENDING tanpa logout; audit STALE_DOCTOR_SNAPSHOT |

### Analisis skenario

- **SOURCE:** ID/action dari request Alya/Raka terautentikasi; creep memakai request sesi Raka yang sama setelah Admin browser lain mencabut role/grant.
- **FLOW:** HTTP → cookie lookup/expiry → verified identity → CSRF untuk POST → role/grant live → policy atribut/status; hanya creep Vulnerable mengganti policyUser menjadi DOCTOR dari snapshot untuk review1002.
- **SINK:** read/summary fixture pada horizontal IDOR; status assignment IN_REVIEW pada vertical/SoD/creep; COMPLETED pada workflow. Grant management mengubah satu record memori, bukan role yang dikirim client.
- **CONTROL:** ownership, role, assignment, creator separation, workflow, effective grant sebelum deadline, Admin-only approval/revoke. Same-session CSRF/Origin tetap aktif kedua mode.
- **EVIDENCE:**139API+51UI, HTTP Docker26 observasi, browser dua sesi: request/pending/approve/active/use/review/revoke/reject, V stale-review diterima dan S ditolak. State denial diperiksa API/owner, bukan disimpulkan hanya dari tombol. Expiry teruji deadline-1ms/exact dengan spy, bukan browser wait.
- **DAMPAK potensial:** IDOR mengekspos data pengguna lain (confidentiality); review/status dengan izin lama/lebih tinggi merusak integrity dan dapat mengganggu availability workflow. Tidak menguji pasien nyata, takeoverADMIN, host, atau akses di luar fixture.
- **MITIGASI:** baca role/grant authoritative setiap request, jangan otorisasi memakai snapshot login; permission deny-by-default + atribut/SoD/workflow + CSRF. Audit dan review/revoke melengkapi kontrol.
- **RETEST:** reset fixture, ulang actor/ID/action identik dalam Secure; harus403/409 tanpa mutasi, identity PATIENT segera setelah revoke/expiry tanpa logout. Lalu approve grant sah dan jalankan review assigned yang diizinkan; harus200. Logout/login PATIENT tidak membawa snapshot lama.

### Lembar evidence mahasiswa

Untuk setiap subbab isi: tanggal/jam/zona, actor/current role/login-time role bila creep, mode, resource ID, method/path/body action, expected status/state, observed status/state, audit reason, filename screenshot. Tutup password/cookie/session/token. Capture:
1. Permission mapping, pasien own record, Admin tanpa isi pasien dan assignment1003 ditolak.
2. Raka DOCTOR sebelum revoke; PATIENT setelahnya tetapi sesi masih login.
3. REQUESTED/inactive, Admin approve/reject, ACTIVE/basePATIENT/effectiveDOCTOR/expiryUTC/approver, review1001 sah, Admin review dan REVOKED.
4. Creep dua profile: Admin revoke; request lama1002 V200/IN_REVIEW+audit, S403/PENDING+fresh identityPATIENT.
5. Expiry manual opsional (belum screenshot pengembang), EXPIRED/inactive dan denial Secure tanpa logout.
6. IDOR horizontal, vertical/forced browsing, actual creator/reviewer, workflow skip dan jalur sah; request/response Network serta state before/after.
7. Source currentUser/expireGrant, strict privilege action/Admin guard, snapshot login dan authorize narrow branch, policy attrs/workflow dan tests.

Bukti pengembang ada di evidence/privilege-*.png dan privilege-http.json; bukan screenshot mahasiswa yang belum dikumpulkan. APPROVED adalah event langsung ke ACTIVE; satu Admin bukan approval multipihak. Batas memori/audit100/session1jam/legacy publik serta egress Docker belum diblokir tetap berlaku. Source sesi, CSRF dan auth tidak dilemahkan; DOCX tidak dimodifikasi.

## Batas aplikasi pribadi dan laboratorium setelah penyempurnaan UX

**Sebelum:** lima menu publik; halaman History menggabungkan legacy global dan fixture auth. **Sekarang:** Home/Login publik; empat route produk lain memakai session gate. Home login menampilkan data berizin per role. History/Konsultasi hanya scope=personal; Authorization dan legacy command fixture ada di Settings.

SOURCE → FLOW → SINK → CONTROL aplikasi pribadi: patient serviceId+reason → cookie/session+CSRF+role create → lookup service katalog SQLite → record Map owner sesi → scoped list/detail/summary/transition → permission/owner/assignment/duty/workflow/grant live. Record pribadi ditandai metadata serviceId yang hanya ditetapkan server sesudah service valid. Policy Secure selalu dipakai pada record ini; mode Vulnerable tidak membuka IDOR atau workflow bypass untuk data pribadi.

Fixture1001–1003/reason-only records tetap lab dengan omission lama; default list lab terpisah dari scope=personal. API legacy publik lokal /api/consultations tetap SQLite terpisah dan tidak mengetahui Map. Hiding menu/gate client bukan backend authorization. Cookie scope tetap /api/demo sehingga SSR mengembalikan loading shell HTTP200; redirect login terjadi setelah check browser. Semua private API menolak anonymous401 dan membatasi role/object sebelum response.

EVIDENCE aktual tahap ini: browser anonymous /history→login; Alya memilih service2 dan create1004; dashboard own1/pending1, refresh login tetap; Bima History kosong tanpa Alya; Raka review→complete1004; Admin hanya role/privilege/audit; XSS marker V vs escaped S, forged reminder V berubah/S ditolak. HTTP16 observasi membuktikan normal creation/service/owner, cross-account403 bahkan Vulnerable, Admin403, normal skipped-workflow409, valid doctor transitions, TXT owner200 dan legacy tidak membaca protected ID. Nama/ID dalam evidence hanya fiktif.

Retest akademis sekarang dimulai dengan login untuk UI, mode di Settings, dan target **fixture lab**. Direct legacy URL API tetap publik lokal. Privilege lifecycle/snapshot source dan sink tidak dipindahkan; hanya panel ke Settings. Screenshot Bab2 lama menggambarkan lokasi UI historis.

DAMPAK yang dicegah: kebocoran daftar antar pasien, tindakan dokter tanpa assignment, penggunaan role/grant lama dan workflow pribadi tanpa tahap. MITIGASI: scope server, identity-owned create, data dari service backend, policy Secure personal, auth/CSRF lama. RETEST: patient lain dan Admin detail/summary403; denial mempertahankan PENDING; doctor sah berhasil; logout401; mode lab tidak memperluas data pribadi.

Batas: memori/reset startup dan Admin reset juga menghapus private records; tanpa auth produksi, realtime role push, scheduling atau persistent account preferences. API lama sengaja publik dengan data fiktif terisolasi, bukan seluruh backend privat. Dashboard diperiksa390/768/1380px tanpa overflow horizontal; bukan setiap halaman/device. Download browser hanya feedback tombol, pemantauan file timeout; actual TXT/headers dibuktikan HTTP. Offline/expiry/race adalah API/component tests. Tidak ada DOCX, ReallySick, tunnel atau deployment; Docker egress belum diblokir.
