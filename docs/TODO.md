# TODO — Desain Ulang Situs Bidang Akademik UNJANI

Checklist turunan dari [PLAN.md](PLAN.md). Kolom referensi menunjuk ke [SRS.md](SRS.md) (FR/NFR) dan [AUDIT-UIUX.md](AUDIT-UIUX.md) (nomor temuan).

Label di setiap kelompok tugas: `[Model · effort]`. Kelompok tugas yang labelnya berbeda dari fasenya ditandai tersendiri.

---

## Sebelum mulai

- [x] K-01 diputuskan: **"Bidang Akademik"**
- [x] K-02: role Editor **dibutuhkan** · K-05: NIP/NID **tidak tampil** di publik (sudah dihapus dari halaman Pimpinan & Staf)
- [x] K-04: tim **sanggup** input kalender per kegiatan; tambah unggahan PDF surat edaran selain SK Rektor
- [x] K-03: tanpa persetujuan berjenjang · K-06: peringkat ditampilkan apa adanya · K-07: data lulusan resmi — **semua keputusan terbuka terjawab**
- [x] Database pengembangan = salinan database lama (bukan live)
- [x] `git init` dan push awal ke `github.com/mang-wildan/baa.unjani.ac.id`
- [ ] Ganti password admin sementara yang diatur saat audit

---

## F0 — Hotfix keamanan & kebersihan situs lama

### Keamanan `[Opus 5.5 · xhigh]`
- [x] Rute `GET/POST /register` dan view `register.ejs` dihapus — SRS NFR-S-01 · Audit 01
- [x] Periksa koleksi `users`: hanya 1 akun admin (database salinan)
- [x] Fallback 404 dan "berita/pengumuman tidak ditemukan" memakai `landing/error.ejs` (mandiri, tanpa sisa template padel) — Audit 02
- [x] Error handler terpusat tanpa stack trace; error unggahan di admin kembali ke form dengan alert — NFR-S-02
- [ ] Set `NODE_ENV=production` di `.env` server produksi (sudah didokumentasikan di `.env.example`)
- [x] Redirect `/admin` → `/admin/dashboard`, CTA navbar diperbaiki
- [x] Hapus nilai cadangan kunci reCAPTCHA (dilakukan sebelum commit awal) — NFR-S-03
- [ ] Rotasi kunci reCAPTCHA di Google Admin Console — K1 *(manual)*
- [x] **Tambahan:** reCAPTCHA login hanya diminta setelah 3× gagal per IP atau per email dalam 15 menit (`utils/loginAttempts.js`) + tes unit
- [x] **Tambahan:** email login dinormalisasi (huruf kecil), waktu respons akun tak dikenal disamakan (cegah enumerasi), `TRUST_PROXY` untuk IP di balik reverse proxy
- [x] **Tambahan:** unggahan gambar hanya JPG/PNG/WEBP/GIF (SVG ditolak: bisa berisi skrip)

### Perbaikan cepat `[Sonnet 5.5 · medium]`
- [x] Hapus `landing-aside.ejs` (15 include) dan `initSidebar()`; menu HP kini panel lipat berisi navigasi asli — Audit 03
- [x] Batas unggahan di 14 rute: gambar 5 MB, PDF 10 MB, form campuran dicek per file (`utils/upload.js`) — Audit 07
- [x] `logo.png` 2,4 MB → 25 KB (240 px, kedua salinan)
- [x] Bagian video profil disembunyikan bila URL kosong; video cadangan privat dihapus — Audit 18
- [x] `<html lang="id">` di 72 view — Audit 09 · A4

### Konten `[Opus 5.5 · high — skrip scripts/f0-cleanup-test-content.js]`
Dijalankan di database salinan pada 1 Okt 2026; backup di `backups/f0-cleanup-*.json`.
- [x] 13 berita uji (semua berita) → draft + lepas sematan — Audit 05
- [x] 8 pengumuman uji (Lorem ipsum ×5, "Test Pengumuman", "Pengumuman Baru", "threhre") → draft
- [x] Hapus buku "test" dan "dgsge", serta buku wisuda "Tahun 2027"
- [x] Hapus 2 staf "Test" — [ ] **isi data pimpinan & staf asli** *(manual, halaman kini kosong)*
- [x] Hapus file `TERRA_INFINITA_MAP_15K…jpg` (128 MB), rujukan di 3 berita draft dikosongkan
- [x] Status akreditasi publik dihitung dari tanggal: Berlaku / Segera berakhir (≤ 90 hari) / Kedaluwarsa — Audit 06
- [ ] **Jalankan skrip yang sama di database produksi** (`--dry-run` dulu, lalu `--apply`) *(manual)*
- [ ] **Tinjau 17 file unggahan yatim** (24,5 MB; tidak dirujuk database tapi bisa diunduh publik), termasuk dokumen pribadi: kartu akses pegawai dan lembar UAS mahasiswa. Daftar lengkap dicetak oleh skrip *(keputusan pemilik)*
- [ ] **Periksa data akreditasi institusi:** record "Unggul" (aktif) sudah kedaluwarsa 11 Feb 2026, sedangkan record "B" (nonaktif) berlaku sampai 28 Des 2026. Kemungkinan status tampil/sembunyi tertukar *(manual)*
- [ ] Berita "rgwegewrg" (draft) memakai gambar kartu akses berisi nama & NID dosen; hapus gambar atau beritanya

### Verifikasi `[Opus 5.5 · high]`
- [x] Uji: `POST /register` dengan `role=admin` → 404, tidak ada akun baru
- [x] Uji: `/halaman-acak`, `/register`, `/berita/tidak-ada` → 404 ramah tanpa stack trace; `/admin` → 302 ke dashboard/login
- [x] Uji: login gagal ke-1 & ke-2 tanpa reCAPTCHA, ke-3 menampilkan reCAPTCHA; setelahnya password benar tanpa/dengan token palsu tetap ditolak
- [x] Uji: menu HP di 390 px dan 1024 px membuka navigasi asli, target sentuh 44 px, tanpa geser horizontal
- [x] Uji: gambar 6 MB, SVG, PDF 12 MB, cover 6 MB di form campuran → ditolak sebelum controller, kembali ke form dengan pesan; tidak ada file tersisa
- [x] Smoke test: 14 rute publik 200 tanpa error JS; 5 halaman admin 200

---

## F1 — Fondasi `[Opus 5.5 · high]`

### Repo & lingkungan
- [x] `git init`, `.gitignore`, commit awal, push ke GitHub (dikerjakan di F0)
- [x] Branch `fase-1-fondasi` (satu branch per fase)
- [x] `.env.example`: `NODE_ENV`, `TRUST_PROXY`, `APP_ORIGIN`; database dev = salinan — NFR-M-04
- [x] Hapus `tempk.ejs` dan `temp_cal.ejs`

### Design system
- [x] Tailwind CSS v4 (CLI). Token inti DESIGN.md di `assets/css/app.css` (`@theme`, palet bawaan Tailwind dimatikan) — SRS §7.2
- [x] Koreksi kontras token: placeholder & border kolom isian `#64748B` (4,8:1)
- [x] Skrip `build:css`, `dev:css`, `build:assets`, `build`; hasil build di-commit (produksi tanpa build)
- [x] Self-host Plus Jakarta Sans (400–700) dan 47 ikon Material Symbols sebagai SVG inline (`icon()`)
- [x] Alpine.js **build CSP** (self-host), komponen di `public/js/app.js`
- [x] Lambang UNJANI teroptimasi `public/img/lambang-unjani.png` (25 KB)
- [ ] Ganti lambang dengan SVG resmi bila tersedia

### Layout & komponen
- [x] `views/layouts/public.ejs`: header, dropdown, menu HP layar penuh, footer dari Pengaturan Situs — FR-G-01..04
- [x] `views/layouts/admin.ejs`: sidebar berkelompok sesuai role, topbar + menu akun, tanpa sisa template — FR-AD-02, FR-AD-03
- [x] Komponen: `page-header` (breadcrumb), `badge`, `alert`, `stat-tile`, `date-block`, `empty-state`, `pagination`, `form-field`, `file-upload`, `confirm-dialog`, `toast`; kelas `.btn-*`, `.card`, `.data-table--stack` (tabel → kartu di HP)
- [x] `:focus-visible` global, target sentuh 44 px, `prefers-reduced-motion` — NFR-A-02, NFR-A-03, NFR-A-06
- [x] `/dev/komponen` dan `/dev/admin` (khusus development)
- [x] Verifikasi 390 & 1440 px: 0 error CSP/JS, 0 gagal kontras, 0 kontrol tanpa nama, tanpa overflow, 1 H1, fokus terlihat; tab (termasuk tombol panah), dialog, menu HP + Escape, dropdown, sidebar admin, toast berfungsi

### Infrastruktur
- [x] Error handler terpusat (F0) + `express-async-errors`: error async tidak lagi membuat server crash
- [x] `res.renderPage(view, locals, layout)` untuk halaman baru
- [x] CSRF: cek Origin/Referer untuk semua POST (`middleware/verifyOrigin.js`), melindungi juga form lama termasuk dari subdomain *.unjani.ac.id — NFR-S-05
- [x] CSP ketat untuk halaman baru (`middleware/strictCsp.js`); halaman lama menyusul saat dibangun ulang
- [x] Batas percobaan login: reCAPTCHA setelah 3× gagal (F0)
- [x] Helper `formatTanggal`, `formatRentangTanggal`, `tanggalBlok`, `formatAngka`, `formatUkuranFile` (WIB, `id-ID`) + 6 tes — NFR-C-02
- [ ] Halaman 404/500 memakai layout baru (sekarang mandiri; dipindah saat CSP diterapkan global di F5)

### Bersih-bersih template lama — **ditunda ke akhir F3/F4** `[Sonnet 5.5 · low]`
> Aset template lama (`public/assets/vendor`, `landing-page`, `json`, `js/app-*`) masih dipakai halaman yang berjalan. Hapus per halaman setelah halaman itu dibangun ulang, dan terakhir di F5 setelah tidak ada view yang merujuknya (cek dengan `grep`).
- [ ] (F3/F4) Setiap view yang selesai diganti: hapus aset yang hanya dipakai view itu
- [ ] (F5) Hapus sisa `public/assets/vendor`, `landing-page`, `json`, `js/app-*`, `cards-*`, `charts-*`
- [ ] (F4) Hapus `views/partials/template-customizer.ejs`, `settings.ejs`, dan bagian bahasa/shortcuts di `navbar.ejs`

---

## F2 — Model data, migrasi, aturan bisnis `[Opus 5.5 · xhigh]`

> Perubahan skema bersifat **menambah**: field lama tetap ada agar halaman & form lama berjalan sampai F3/F4; dibuang di akhir (F5).

### Skema — SRS §5
- [x] `User`: role `superadmin`/`editor` (+ `admin` lama selama transisi), `isActive`, `lastLoginAt`; login menolak akun nonaktif
- [x] `Accreditation`: `jenis`, `programStudi` (ref), `namaUnit`, `peringkat` (enum), `lembaga` (ref), `nomorSK`, `catatanPerpanjangan`
- [ ] (F5) `Accreditation`: hapus `institusi`, `unit`, `tahun`, `akreditasi`, `isActive` setelah form F4 dipakai
- [x] `AcademicCalendar`: `nomorSK`, `events[]` {semester, nama, mulai, selesai}, `lampiran[]` surat edaran (K-04)
- [x] `AcademicDocument`/`RplDocument`: `kategori`, `fileSize`, `mimeType`; `cover` tidak wajib lagi
- [x] `Pengumuman`/`News`: `kategori`, `excerpt` (otomatis lewat `save` **dan** `findByIdAndUpdate`), `attachments[]` — `models/plugins/content.js`
- [x] `Kurikulum.prodi` (ref Program Studi) di samping teks lama
- [x] `GraduationBook.periode` enum I/II/III
- [x] `Staff`: `kelompok`, `gelar`, `email`; `nip` tidak wajib dan tidak pernah tampil publik (K-05)
- [x] `SiteSetting`: `jamLayanan`, `socialInstagram`, `heroImage`
- [x] Master baru: `Kategori` (jenis pengumuman/dokumen) dan `LembagaAkreditasi`
- [ ] `AuditLog` (Sebaiknya) — **dipindah ke F4**. Catatan: database salinan sudah memuat koleksi kosong `auditlogs`, `fileassets`, `revisions`, `constraintlocks`, `fakultas` dari versi aplikasi sebelumnya; `auditlogs` punya indeks TTL 366 hari. Tidak disentuh.

### Role & akses
- [x] `utils/roles.js`; `requireAdmin` (Super Admin + Editor), `requireSuperadmin` untuk Pengaturan Situs, Fakultas, Program Studi
- [x] Pengecekan `role === 'admin'` di controller & view lama diganti `isStaff()` / `roleLabel()`
- [x] Middleware auth memuat user sekali per request (sebelumnya dua kali)

### Aturan bisnis + tes
- [x] `accreditationStatus()` — Berlaku / Segera berakhir (≤ 90 hari) / Kedaluwarsa, per hari WIB, masih berlaku di hari terakhir — FR-A-03; dipakai halaman `/akreditasi`
- [x] `calendarEventStatus()` + `currentAndNext()` — Selesai / Berlangsung / Akan datang — FR-K-02
- [x] `makeExcerpt()` — buang tag, decode entity sekali — FR-P-05
- [x] `sanitizeHtml()` — tanpa skrip/atribut event/`javascript:`; gambar hanya dari `/uploads/` — NFR-S-06
- [x] Impor kalender CSV (`utils/calendarImport.js`): pemisah `;` atau `,` (Excel Indonesia), BOM, sel berkutip, tanggal `DD/MM/YYYY` atau ISO, galat per baris; template unduhan

### Validasi & unggah
- [x] Skema `zod` (`validators/index.js`): akreditasi, kalender, kegiatan, lampiran, konten, dokumen, kurikulum, staf, akun, ubah password — galat per kolom berbahasa Indonesia, aturan lintas kolom tampil sekaligus
- [x] Pipeline `sharp` (`utils/image.js`): WebP maks 1600 px + thumbnail 400 px, orientasi EXIF — NFR-P-04 (dipasang ke form di F4)
- [x] **Celah path traversal** ditutup: nama file unggahan disanitasi (`safeFilename`) di 15 rute — NFR-S-04
- [x] Isi file dicek dari byte awal (PDF/PNG/JPEG/WEBP/GIF/CSV) di semua rute (`checkUploads`) — NFR-S-04
- [x] 42 tes otomatis lulus (`npm test`)

### Migrasi (`npm run migrate` = dry-run, `npm run migrate -- --apply`)
- [x] Runner dengan backup otomatis ke `backups/` dan catatan di koleksi `schemamigrations`
- [x] `001-users-role` · `002-master-seed` · `003-accreditation` · `004-kurikulum-prodi` · `005-content-excerpt` · `006-files-meta` · `007-readiness` (laporan)
- [x] Dry-run di database salinan: tanpa error; 25 hal perlu ditinjau — lihat `docs/MIGRASI-F2.md`
- [x] **Diterapkan** (`--apply`) di database salinan 1 Okt 2026, 14:38 WIB — backup `backups/migrate-2026-10-01T14-38-42-777Z.json`, dicatat di koleksi `schemamigrations`; diverifikasi: role `superadmin`, 10 kategori, 7 lembaga, 5/5 akreditasi terisi, 1/1 kurikulum tertaut, 13/13 berita punya excerpt, 42 tes tetap lulus
- [ ] 25 hal di `docs/MIGRASI-F2.md` masih perlu ditinjau manual (lihat F0 "Konten" dan daftar di bawah) — **tidak diubah otomatis**
- [ ] Jalankan di database produksi saat rilis (F6)
- [x] Seed dev: hanya data master (002). Konten contoh tidak dibuat — konten nyata diisi tim di F6

---

## F3 — Situs publik `[Sonnet 5.5 · medium]`

Referensi visual tiap halaman ada di `docs/Design/<nama_layar>/screen.png`. Koreksi SRS §7.2 diterapkan (palet token saja, logo asli, dll — lihat F1).

- [x] Header, dropdown, menu HP layar penuh, footer, breadcrumb — sudah dari F1 (`layouts/public.ejs`), dipakai semua halaman di bawah — FR-G-01..04, FR-G-07
- [x] **Kalender Akademik**: tabel per semester (tab + `data-table--stack`), kartu Sedang berlangsung/Berikutnya, pemilih tahun ajaran, Unduh PDF SK, **lampiran surat edaran** (K-04), tampilan kosong per semester — FR-K-01..05 · `utils/calendar.js`
- [x] **Akreditasi**: kartu status institusi (semua record ditampilkan apa adanya — data "Unggul" vs "B" yang kontradiktif dari F2 tidak disembunyikan, lihat `docs/MIGRASI-F2.md`), stat tile per peringkat, tabel + filter (cari/fakultas/status) + paginasi, riwayat via `<details>` native, kartu di HP — FR-A-01..07
- [x] Dokumen Akademik: daftar (bukan kartu), sidebar kategori dengan jumlah, pencarian, tampilan kosong — FR-D-01..02
- [x] RPL: teks penjelasan statis (FR-D-03 — *catatan: akan diedit admin saat kolom tersedia, F4*) + daftar dokumen format sama
- [x] Kurikulum: tabel dikelompokkan per fakultas, filter fakultas + jenjang (jenjang diturunkan dari nama prodi via `utils/prodi.js`, lihat catatan di bawah) — FR-KU-01..03
- [x] Pengumuman: daftar dengan blok tanggal, chip kategori (kategori `jenis=pengumuman`), disematkan di atas, label "Baru" (<7 hari) — FR-P-01..02
- [x] Detail pengumuman: kolom baca, lampiran, "Pengumuman lainnya"; `body` disanitasi saat dibaca (defense-in-depth, NFR-S-06) — FR-P-03
- [x] Berita: kartu gambar-di-atas (grid, bukan daftar blok tanggal seperti pengumuman), detail dengan sidebar kartu bergambar, **sidebar Tags/Recent Post/newsletter lama dihapus** — FR-P-04, FR-P-06
- [x] **Beranda**: hero foto asli (dikompres 1,1 MB→209 KB WebP) tanpa teks di atas foto, 4 akses cepat, Informasi Penting (gabungan 3 jenis konten disematkan), Agenda Terdekat (dari kalender terbaru), Pengumuman Terbaru, Status Mutu Institusi, Kegiatan, 3 angka lulusan ringkas, video kondisional — FR-B-01..08. Setiap bagian hilang bila datanya kosong (saat ini: tidak ada berita/pengumuman terbit, tidak ada kegiatan kalender)
- [x] Buku & Buku Wisuda: grid cover rata kiri, filter tahun (+ periode untuk wisuda) — FR-L-01
- [x] Pimpinan & Staf: pimpinan kartu besar terpisah dari staf grid kecil; **NIP tidak pernah di-query/dikirim ke view** (K-05, diverifikasi) — FR-L-03
- [x] Profil: dipindah ke layout baru, konten sama (sudah dinilai terbaik di audit)
- [x] Struktur Organisasi: gambar bagan + **versi teks** berupa daftar unit (reuse model `Unit`) — FR-L-04
- [x] Pencarian global `/cari`: pengumuman, berita, dokumen, kurikulum — FR-G-06
- [ ] Bottom tab bar HP — FR-G-09 (Bisa, ditunda — tidak kritis)
- [ ] Tombol "+ Kalender" (.ics) — FR-K-06 (Bisa, ditunda)
- [x] **Review fase**: probe kontras/fokus/tap-target/overflow/unnamed-control di 390 & 1440 px untuk **14 rute publik** (termasuk 2 halaman detail dengan konten nyata) — 0 error JS/CSP, 0 gagal kontras, 0 overflow, 1 H1 di semua halaman. 2 bug ditemukan & diperbaiki saat probe (lihat di bawah); 1 false-positive diverifikasi & didokumentasikan (bukan diperbaiki dengan cara yang salah)

### Bug ditemukan & diperbaiki selama verifikasi
- [x] CSS belum di-build ulang sejak F2 → kelas baru (`size-8`, `line-clamp-2`, dll.) tidak ter-generate, ikon PDF tampil raksasa. **Pelajaran: `npm run build:css` wajib sebelum setiap smoke test di fase berisi view baru.**
- [x] Komponen `pagination.ejs` mengharapkan field `from`/`to`, tapi controller awal mengirim `start`/`end` → "Menampilkan --- dari N". Diperbaiki di akreditasi & dokumen-akademik.
- [x] `models/LembagaAkreditasi.js` tidak pernah di-require di mana pun → `MissingSchemaError` saat `.populate('lembaga')`. **Perbaikan struktural:** `models/index.js` baru, meregistrasi semua model sekali di `server.js` sebelum rute mana pun berjalan — mencegah kelas bug ini terulang di F4.
- [x] Tombol ikon pencarian tanpa `aria-label` di pengumuman/berita
- [x] Tautan teks < 24px (WCAG 2.5.8) di akreditasi/dokumen/RPL/kurikulum → `min-h-6` atau `inline-block py-1.5`
- [x] Tautan gambar kartu (berita/buku/buku wisuda) tanpa teks saat sendirian di `<a>` → dibuat dekoratif (`aria-hidden` + `tabindex="-1"`), judul di bawahnya membawa tautan aksesibel — pola W3C untuk kartu bergambar
- [x] Model `Kategori` belum punya jenis `'berita'` (hanya pengumuman/dokumen) → ditambahkan, plus migrasi `008-berita-kategori-seed` (dry-run + apply, 5 kategori)

### Keputusan desain yang diambil (dicatat agar tidak dianggap celah)
- [x] `ProgramStudi` belum punya field `jenjang` terstruktur (di luar cakupan F2) → `utils/prodi.js` menurunkan jenjang dari nama ("Teknik Kimia **S1**"). Cukup untuk filter F3; jadikan field asli bila nama prodi suatu saat tidak konsisten.
- [x] Riwayat akreditasi (FR-A-06) dibangun dari pengelompokan ulang di `getAkreditasiLanding`, bukan field baru — data saat ini tidak punya riwayat berganda untuk didemonstrasikan, tapi logikanya teruji secara struktural (berfungsi untuk ≥1 record per grup).
- [x] Filter akreditasi: cari + fakultas + status diimplementasikan; **filter jenjang tidak dibuat terpisah** (jenjang prodi tidak relevan untuk akreditasi per-institusi/unit) — sesuai SRS yang sebenarnya hanya meminta fakultas/status/cari untuk akreditasi.

## F4 — Panel admin `[Sonnet 5.5 · medium]`

### Autentikasi `[Opus 5.5 · xhigh]`
- [x] `/admin/login` dengan reCAPTCHA (hanya setelah 3 kali gagal), rate limit, dan cookie `httpOnly; secure (prod); sameSite=lax` — FR-AD-01 (`middleware/authMiddleware.js`, `utils/loginAttempts.js`, `controllers/authController.js`); tampilan login dirombak total di F4 (`views/auth/login.ejs`)
- [x] Middleware role (`superadmin`, `editor`, legacy `admin`) — `requireAuth`/`requireAdmin`/`requireSuperadmin` di `middleware/authMiddleware.js`
- [x] Logout dan ubah password (pemilik akun sendiri) — rute pre-existing `/logout`, `/profile/password`
- [ ] Reset password akun lain oleh Super Admin — **belum dibangun**, dipindah ke item "Akun Admin" (FR-M-13) di bawah
- [x] **Bug kritis ditemukan & diperbaiki saat uji CRUD**: `helmet()` default menyetel header `Referrer-Policy: no-referrer` pada setiap respons; menurut spesifikasi Fetch, itu membuat browser mengirim `Origin: null` pada setiap navigasi POST form, lalu `verifyOrigin` (F1) menolaknya 403 — **ini mematikan login dan SEMUA form di seluruh situs**, bukan cuma modul admin baru. Diperbaiki dengan menyetel `referrerPolicy: { policy: 'strict-origin-when-cross-origin' }` secara eksplisit di `server.js`. Diverifikasi ulang: login dan form Pengumuman sama-sama 200/302 setelah perbaikan.

### Pola acuan `[Sonnet 5.5 · high]`
- [x] **Pengumuman** (lengkap): daftar dengan tab status, filter, pencarian, thumbnail, tombol "Edit" berlabel, menu "⋯ → Hapus" dengan konfirmasi; form dengan validasi inline (klien via `required` + server via Zod, keduanya diverifikasi), rich text tersanitasi, lampiran, sematkan, dan pesan sukses — FR-M-01, FR-AD-05, FR-AD-06. Alur CRUD penuh (buat/validasi/ubah/sematkan/hapus) diuji otomatis lewat Playwright dan lolos.
- [x] Dokumentasikan pola ini di `docs/POLA-ADMIN.md` sebagai acuan modul berikutnya

### Modul (salin pola)
- [x] Dasbor: kartu angka, Perlu Perhatian (otomatis), aksi cepat, aktivitas terbaru — FR-DS-01..04 (`controllers/homeController.js#getDashboard`, `views/admin/dashboard.ejs`)
- [x] Berita — FR-M-02 (`controllers/newsController.js` delegasi ke `adminContentController.js`; beda dari Pengumuman: `requireFeaturedImageOnPublish` menolak status Terbit tanpa gambar sampul, diuji otomatis untuk kasus ditolak **dan** diterima)
- [ ] Kalender Akademik + **impor CSV/Excel** + template unduhan + **lampiran PDF surat edaran** `[Sonnet 5.5 · high]` — FR-M-03
- [ ] Akreditasi: pilihan peringkat tetap, lembaga, validasi tanggal, riwayat — FR-M-04 · `tambah_akreditasi_*`
- [ ] Dokumen Akademik & RPL — FR-M-06
- [ ] Kurikulum — FR-M-05
- [ ] Buku & Buku Wisuda — FR-M-07
- [ ] Data Lulusan + impor CSV — FR-M-08
- [ ] Pimpinan & Staf — FR-M-09
- [ ] Unit & Profil Bidang — FR-M-10
- [ ] Master Data (Fakultas, Prodi, Kategori, Lembaga) — FR-M-11
- [ ] Pengaturan Situs — FR-M-12
- [ ] Akun Admin — FR-M-13
- [ ] Audit log — FR-AD-08 (Sebaiknya)
- [ ] Status Terjadwal — FR-M-14 (Bisa)

### Teks & label `[Haiku 4.5 · low]`
- [ ] Pastikan semua label, status, paginasi, dan pesan validasi sesuai Lampiran B SRS
- [ ] Tambahkan `aria-label` pada semua tombol ikon — NFR-A-05

---

## F5 — Performa, SEO, aksesibilitas `[Sonnet 5.5 · medium]`

- [ ] Cache `SiteSetting` di memori, invalidasi saat disimpan — NFR-P-05
- [ ] Paralelkan query di controller beranda dan dasbor; gunakan `.lean()` dan proyeksi field
- [ ] Header cache statis (`Cache-Control`, nama file dengan hash untuk CSS/JS)
- [ ] `<title>`, meta description, Open Graph, dan canonical per halaman — NFR-SEO-01
- [ ] `sitemap.xml` dan `robots.txt` — NFR-SEO-02
- [ ] `prefers-reduced-motion`, konten tetap tampil tanpa JS — NFR-A-06
- [ ] **Audit ulang** `[Opus 5.5 · high]`: jalankan skill `ux-ui-audit` (publik + admin, 390 dan 1440 px) dan tulis `docs/AUDIT-UIUX-v2.md`
- [ ] Lighthouse mobile untuk beranda, kalender, akreditasi, dan dokumen: Perf ≥ 85, A11y ≥ 95, SEO ≥ 95

---

## F6 — Konten, migrasi produksi, QA, rilis

### Rilis `[Opus 5.5 · xhigh]`
- [ ] Runbook rilis: backup → maintenance mode → migrasi → verifikasi → deploy → smoke test → rollback bila gagal
- [ ] Uji coba runbook lengkap di staging, termasuk rollback
- [ ] Eksekusi di produksi

### Konten `[manual oleh BAA, dibantu Sonnet 5.5 · low]`
- [ ] Foto kampus asli untuk hero dan berita (pengganti foto AI dari Stitch)
- [ ] Kalender 2026/2027 diinput per kegiatan (atau lewat impor CSV)
- [ ] Data akreditasi terbaru beserta sertifikatnya
- [ ] Data pimpinan dan staf asli
- [ ] Teks halaman RPL dan Profil

### Pemeriksaan teks `[Haiku 4.5 · low]`
- [ ] Cari "test", "lorem", "dummy", "Adelux", "padel", dan "TODO" di views dan database
- [ ] Cek salah ketik dan kesesuaian istilah dengan Lampiran B

### Penutupan `[Opus 5.5 · high]`
- [ ] Verifikasi semua kriteria penerimaan SRS §9
- [ ] Panduan singkat admin (cara menambah pengumuman, kalender, akreditasi)
- [ ] Ganti semua password admin dan matikan akun yang tidak dipakai
