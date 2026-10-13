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
- [x] (F3/F4) Setiap view yang selesai diganti: hapus aset yang hanya dipakai view itu (dilakukan bertahap sepanjang F3/F4)
- [x] (F5) Hapus sisa yang **sudah** yatim, diverifikasi dengan `grep` sebelum hapus: `public/assets/json`, `public/assets/js/app-*.js`, `js/cards-*.js`, `js/charts-*.js`, 2 CSS `cards-*` yang menyertainya, dan 3 partial yang ternyata sudah tidak di-`include` di mana pun (`footer.ejs`, `landing-footer.ejs`, `landing-header.ejs`). **`public/assets/vendor` (26 MB) dan `public/assets/img` (28 MB) sengaja TIDAK dihapus** — masih dipakai 3 halaman profil admin lama (`views/admin/profile/{index,edit,password}.ejs`) yang belum dirombak ke desain baru (di luar lingkup F4: profil adalah swa-layani akun sendiri, bukan salah satu dari 14 modul admin). Menghapusnya akan merusak halaman yang masih hidup — ditunda sampai ketiga halaman itu dirombak (F6 atau fase terpisah). **Selesai di F7 R5:** setelah ketiga halaman pindah ke `layouts/admin.ejs`, `views/partials/` dan seluruh `public/assets/` dihapus (1.395 file, ±71 MB; diverifikasi grep + crawl 24 rute tanpa aset 404) — kecuali `public/assets/landing-page/images/favicon.ico` dan `logo.png` yang masih dirujuk.
- [x] (F4) Hapus `views/partials/template-customizer.ejs`, `settings.ejs` (keduanya ternyata sudah yatim, dihapus total) **dan** bagian bahasa/shortcuts di `navbar.ejs` (dropdown "Language" 4 opsi palsu dan dropdown "Shortcuts" berisi 10 tautan ke halaman demo template yang tidak ada di aplikasi ini, mis. `app-calendar.html` — bukan cuma dekorasi usang tapi tautan rusak di halaman admin yang masih live; dihapus, bukan cuma dirapikan). Diverifikasi: ketiga halaman profil (`/profile`, `/profile/edit`, `/profile/password`) tetap 200 setelah perubahan.

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
- [x] Reset password akun lain oleh Super Admin — dibangun di modul Akun Admin (FR-M-13) di bawah
- [x] **Bug kritis ditemukan & diperbaiki saat uji CRUD**: `helmet()` default menyetel header `Referrer-Policy: no-referrer` pada setiap respons; menurut spesifikasi Fetch, itu membuat browser mengirim `Origin: null` pada setiap navigasi POST form, lalu `verifyOrigin` (F1) menolaknya 403 — **ini mematikan login dan SEMUA form di seluruh situs**, bukan cuma modul admin baru. Diperbaiki dengan menyetel `referrerPolicy: { policy: 'strict-origin-when-cross-origin' }` secara eksplisit di `server.js`. Diverifikasi ulang: login dan form Pengumuman sama-sama 200/302 setelah perbaikan.

### Pola acuan `[Sonnet 5.5 · high]`
- [x] **Pengumuman** (lengkap): daftar dengan tab status, filter, pencarian, thumbnail, tombol "Edit" berlabel, menu "⋯ → Hapus" dengan konfirmasi; form dengan validasi inline (klien via `required` + server via Zod, keduanya diverifikasi), rich text tersanitasi, lampiran, sematkan, dan pesan sukses — FR-M-01, FR-AD-05, FR-AD-06. Alur CRUD penuh (buat/validasi/ubah/sematkan/hapus) diuji otomatis lewat Playwright dan lolos.
- [x] Dokumentasikan pola ini di `docs/POLA-ADMIN.md` sebagai acuan modul berikutnya

### Modul (salin pola)
- [x] Dasbor: kartu angka, Perlu Perhatian (otomatis), aksi cepat, aktivitas terbaru — FR-DS-01..04 (`controllers/homeController.js#getDashboard`, `views/admin/dashboard.ejs`)
- [x] Berita — FR-M-02 (`controllers/newsController.js` delegasi ke `adminContentController.js`; beda dari Pengumuman: `requireFeaturedImageOnPublish` menolak status Terbit tanpa gambar sampul, diuji otomatis untuk kasus ditolak **dan** diterima)
- [x] Kalender Akademik + **impor CSV/Excel** + template unduhan + **lampiran PDF surat edaran** `[Sonnet 5.5 · high]` — FR-M-03 (`controllers/academicCalendarController.js`, bukan factory Pengumuman karena punya dua sub-koleksi bersarang `events[]`/`lampiran[]`; kegiatan dikelola manual per-baris atau impor CSV yang mengganti seluruh daftar; diuji otomatis: buat tahun, tambah kegiatan manual, impor CSV sukses, impor CSV gagal tidak mengubah apa pun, tambah/hapus lampiran, hapus tahun)
- [x] Akreditasi: pilihan peringkat tetap, lembaga, validasi tanggal, riwayat — FR-M-04 · `tambah_akreditasi_*` (`controllers/accreditationController.js`, skema flat tapi beda total dari Pengumuman jadi tidak pakai factory; status Berlaku/Segera berakhir/Kedaluwarsa dihitung, tidak disimpan; riwayat otomatis lewat banyak baris per prodi/unit, tanpa UI khusus — sudah dibangun di `getAkreditasiLanding`)
- [x] Dokumen Akademik & RPL — FR-M-06 (`controllers/academicDocumentController.js`, `controllers/rplDocumentController.js`; `cover` dihapus dari kedua form karena tidak dipakai desain F3; kategori — yang dipakai filter publik — sebelumnya tidak pernah bisa diisi admin sama sekali, celah ditutup; RPL `status` adalah label Aktif/Arsip, bukan visibilitas, keduanya tetap tampil publik)
- [x] Kurikulum — FR-M-05 (`controllers/kurikulumController.js`; field v1 teks bebas `nama`/`programStudi`/`fakultas` dan `cover` dilonggarkan jadi optional di `models/Kurikulum.js` — tidak dipakai desain F3, form hanya menulis `prodi` (ref) + `tahun`; validasi duplikat prodi+tahun)
- [x] Buku & Buku Wisuda — FR-M-07 (`controllers/bookController.js`, `controllers/graduationBookController.js`; skema sudah bersih sejak awal, hanya perlu validasi Zod + `renderPage` + pola pesan galat konsisten; field upload PDF diseragamkan jadi `file` menggantikan `pdf`)
- [x] Data Lulusan + impor CSV — FR-M-08 (`controllers/lulusanController.js`, `utils/lulusanImport.js`; pelaporan error per-baris seperti impor Kalender; bug ditemukan: rute lama pakai `multer memoryStorage` untuk CSV sehingga `checkUploads` diam-diam dilewati — diganti `diskStorage`)
- [x] Pimpinan & Staf — FR-M-09 (`controllers/staffController.js`; `kelompok` dan `gelar` sebelumnya tidak pernah bisa diisi admin sama sekali meski dipakai halaman publik — celah ditutup; NIP tetap bisa diisi admin tapi tidak dikirim ke publik, K-05)
- [x] Unit & Profil Bidang — FR-M-10 (`controllers/unitController.js` CRUD biasa; `controllers/academicProfileController.js` dokumen singleton — satu halaman lihat+ubah, misi/tugas/fungsi diisi lewat satu textarea per kolom, satu baris = satu butir)
- [x] Master Data (Fakultas, Prodi, Kategori, Lembaga) — FR-M-11, superadmin-only (`requireSuperadmin`). Kategori dan Lembaga Akreditasi **sebelumnya tidak punya UI admin sama sekali** (hanya pernah diisi lewat skrip migrasi) — dibangun dari nol. `controllers/masterDataController.js`: factory untuk Fakultas/Lembaga (nama+singkatan[+urutan], termasuk tangani duplicate-key Mongo). `controllers/kategoriController.js`: satu halaman dengan tab per jenis + slug otomatis. `controllers/programStudiController.js`: ditulis ulang, termasuk perbaikan bug `memoryStorage` pada impor CSV (lih. docs/POLA-ADMIN.md)
- [x] Pengaturan Situs — FR-M-12, superadmin-only, dokumen singleton. Ternyata sebagian besar field skema (namaSitus, tagline, heroImage, bannerRpl, siteLogo, slideshowImages) **tidak dipakai tampilan publik mana pun di F3** — sengaja tidak ditawarkan di form baru (field yang nyata dipakai: kontak/alamat/jam layanan/sosial media/footer/video/favicon/struktur organisasi/tautan cepat). Tautan cepat dikelola per-item (tambah satu, hapus satu) seperti pola Kalender. Bug ditemukan lewat pengujian halaman *edit* sungguhan (bukan cuma *new*): komponen bersama `file-upload.ejs` — dipakai hampir semua form upload di F4 — punya tautan "File saat ini" tanpa `min-h-6`, baru ketahuan di sini karena pratinjau itu hanya muncul saat mode edit dengan file yang sudah ada; diperbaiki sekali di komponennya, otomatis membereskan semua form lain
- [x] Akun Admin — FR-M-13, superadmin-only. `controllers/userAccountController.js`: CRUD akun (Super Admin/Editor) + reset password oleh Super Admin untuk akun lain (`resetPasswordByAdmin`, beda dari `passwordChange` milik sendiri) + proteksi anti-kunci-diri (tidak bisa hapus diri sendiri, tidak bisa menurunkan peran/nonaktifkan diri sendiri jika itu akan membuat nol Super Admin aktif tersisa). Diuji otomatis termasuk **login sungguhan** memakai password hasil reset (bukan cuma cek redirect)
- [x] Audit log — FR-AD-08 (Sebaiknya). **Diputuskan bersama pengguna**: perkuat feed "Aktivitas Terbaru" yang sudah ada (bukan koleksi audit-log baru + instrumentasi 14 kontroler) — `getDashboard` sekarang menampilkan siapa (createdBy/updatedBy yang sudah dicatat tiap model, dipopulate), kapan, dan aksi (Dibuat/Diperbarui dibedakan dari selisih createdAt/updatedAt), diperluas dari 3 ke 7 jenis konten. Tidak menangkap penghapusan (item yang dihapus tidak lagi bisa di-query) — keterbatasan yang disengaja sesuai prioritas "Sebaiknya".
- [ ] Status Terjadwal — FR-M-14 (Bisa). **Diputuskan bersama pengguna: dilewati** — butuh mengubah filter `status: 'published'` di 13+ titik kode di seluruh halaman publik yang sudah teruji (Beranda, Pengumuman, Berita, Pencarian, Dasbor), risiko regresi tidak sepadan untuk fitur prioritas terendah di SRS.

### Teks & label `[Haiku 4.5 · low]`
- [x] Pastikan semua label, status, paginasi, dan pesan validasi sesuai Lampiran B SRS — audit penuh dijalankan; ditemukan & diperbaiki: "Login Terakhir"→"Masuk Terakhir" dan teks bantuan "...login" (modul Akun Admin baru), tiga sisa "login" di halaman profil lama (`views/admin/profile/*.ejs`, pre-F4), "BAA Akademik"→"Bidang Akademik" di `views/partials/menu.ejs`. Ditemukan juga 2 file mati (`views/admin/pengumuman/create.ejs`/`edit.ejs`, sisa dari pola lama yang belum terhapus, masih berisi "Published"/"Draft" berbahasa Inggris) — dihapus karena tidak lagi direferensikan kontroler mana pun.
- [x] Tambahkan `aria-label` pada semua tombol ikon — NFR-A-05 — diaudit lewat grep sistematis atas semua `btn-icon` dan tombol/tautan ikon-saja di seluruh `views/admin/`; semua sudah punya `aria-label` atau teks terlihat. Konsisten dengan `unnamed=0` di setiap probe F4 (kecuali satu false-positive label di dalam `<details>` tertutup, lihat docs/POLA-ADMIN.md).

---

## F5 — Performa, SEO, aksesibilitas `[Sonnet 5.5 · medium]`

- [x] Cache `SiteSetting` di memori, invalidasi saat disimpan — NFR-P-05 (`utils/siteSettingCache.js`; ditemukan sekaligus 3 query duplikat — Beranda, Dasbor, Struktur Organisasi masing-masing meng-query ulang padahal middleware global sudah menyediakannya di `res.locals.siteSetting` — dihapus, bukan cuma di-cache)
- [x] Paralelkan query di controller beranda dan dasbor; gunakan `.lean()` dan proyeksi field — kedua controller sudah memakai `Promise.all` + `.lean()` sejak F3/F4; ditambahkan proyeksi field pada 5 query Beranda yang sebelumnya mengambil dokumen penuh padahal hanya 2-3 field dipakai
- [x] Header cache statis (`Cache-Control`, nama file dengan hash untuk CSS/JS) — `express.static({ maxAge: '1y', immutable: true })` untuk seluruh `public/`; `app.css`/`app.js` (satu-satunya aset yang kontennya berubah di path yang sama tiap deploy) memakai query-string versi dari hash konten (`scripts/build-manifest.js` + `utils/assetVersion.js`, helper `assetUrl()`) supaya aman di-cache lama tanpa menyajikan versi basi
- [x] `<title>`, meta description, Open Graph, dan canonical per halaman — NFR-SEO-01 (title/description/OG sudah ada sejak F1; `<link rel="canonical">` dan `og:url` baru ditambahkan, dari `res.locals.canonicalUrl` yang menghormati `APP_ORIGIN`/`X-Forwarded-Proto`)
- [x] `sitemap.xml` dan `robots.txt` — NFR-SEO-02 (`controllers/seoController.js`: 13 rute statis + URL dinamis dari Pengumuman/Berita yang Terbit; diverifikasi dengan menandai satu item Terbit sementara dan mengembalikannya)
- [x] `prefers-reduced-motion`, konten tetap tampil tanpa JS — NFR-A-06 (sudah ada sejak F1, `assets/css/app.css`)
- [x] **Audit ulang** `[Opus 5.5 · high]`: jalankan skill `ux-ui-audit` (publik + admin, 390 dan 1440 px) dan tulis `docs/AUDIT-UIUX-v2.md` — 14 rute publik + 19 halaman admin + 4 halaman form/edit dengan data nyata, semua bersih; 1 bug aksesibilitas nyata ditemukan lewat Lighthouse (lihat item di bawah) dan diperbaiki; 3 false-positive probe diverifikasi ulang dan didokumentasikan
- [x] Lighthouse mobile untuk beranda, kalender, akreditasi, dan dokumen: Perf ≥ 85, A11y ≥ 95, SEO ≥ 95 — **A11y dan SEO lolos 100/100 di keempat halaman** (1 bug `button-name`/`link-name` ditemukan & diperbaiki di Dokumen Akademik + RPL: `<span class="hidden sm:inline">` untuk label ikon memakai `display:none`, bukan `sr-only`, sehingga tombol/tautan benar-benar tanpa nama di mobile — ditambahkan `aria-label`). **Performa lolos di 1 dari 4** (Kalender Akademik: 85); Beranda (76)/Akreditasi (81)/Dokumen (84) di bawah target. Dibuktikan dengan pengukuran langsung (`curl` TTFB `/robots.txt` ~2 ms vs `/` ~460-480 ms) bahwa selisihnya adalah latensi jaringan ke database pengembangan (MongoDB Atlas jarak jauh), bukan kode — kueri sudah paralel+lean+terproyeksi, satu round-trip DB adalah batas bawah yang bisa dicapai dari sisi kode. **Direkomendasikan diukur ulang di F6 setelah topologi produksi final** (app server & database co-located), bukan dikejar lebih jauh di lingkungan dev ini. Detail lengkap di `docs/AUDIT-UIUX-v2.md`.

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

---

## F7 — Tampilan "lebih akademik" `[Sonnet 5.5 · medium]`

Permintaan stakeholder (2026-10-06). Referensi struktur: template Qeducato di `Referensi/qeducato/` (lokal, **tidak di-commit**). Yang diambil hanya **pola layout**; CSS/JS/aset template tidak disalin (stack Bootstrap 4 + jQuery berbeda, lisensi ThemeForest). Palet tetap hijau/emas UNJANI. Berlaku untuk situs publik **dan** panel admin.

### R0 — Fondasi `[Opus 5.5 · high]`
- [x] Font judul serif **Source Serif 4** (self-hosted woff2, 2 ketebalan) untuk `h1`–`h3`; isi tetap Plus Jakarta Sans. Preload hanya bobot yang dipakai di atas lipatan — `@fontsource/source-serif-4` (devDependency) disalin `build:assets` ke `public/fonts/source-serif-4/` (600 + 700, ~21 KB/bobot); hanya 700 di-preload di layout publik. Berlaku global, termasuk admin dan login (disengaja: admin ikut F7). Semua heading di views memakai `font-semibold`/`font-bold`, jadi tidak ada bold sintetis
- [x] Token baru: emas terang untuk teks di latar hijau tua (emas `#ca8a04` di atas `#14532d` hanya ~3:1, cukup untuk ikon/garis, tidak untuk teks kecil), varian latar seksi (terang/hijau muda/hijau tua) — `on-dark-accent` `#facc15` (5,9:1 di brand), `brand-tint` `#ecf6ef` (tint terpekat yang masih menjaga `text-primary` 4,5:1; `primary-soft` lama 1,00:1 terhadap canvas, tak terlihat sebagai pita)
- [x] Komponen: `.eyebrow` (garis emas + label kecil di atas judul seksi — garis dipilih ganti ikon agar tidak perlu ikon per seksi), `.section-title`, `.section-dark` (on-dark), varian tombol untuk latar gelap — plus `.section`/`.section-surface`/`.section-soft`, `.section-lead`, `.section-link`, `.btn-accent`/`.btn-light`/`.btn-outline-light`, dan `components/section-heading.ejs`. Di dalam `.section-dark`: judul & tautan otomatis putih, tautan di dalam `<p>` bergaris bawah (WCAG 1.4.1), `.card` putih kembali ke warna terang termasuk ring fokus. **Aturan:** jangan pakai `text-muted`/`text-primary` pada teks langsung di `.section-dark` (utility menang atas komponen) — pakai `text-on-dark-muted`/`text-on-dark-accent`
- [x] Contoh semua komponen baru di `/dev/komponen` — 3 pita (terang/hijau muda/hijau tua + kartu di dalamnya). **Verifikasi** (workflow 3 lensa + skeptis per temuan): 7 temuan terkonfirmasi; 4 diperbaiki di R0 (ring fokus putih di kartu dalam pita gelap 1:1 → hijau, override gelap bocor ke kartu 1,5:1, tautan inline di pita gelap hanya beda warna, deskripsi eyebrow), 2 dipindah ke R3 (di bawah), 1 sudah dikoreksi di teks ini. 13 rute publik + `/login` + 404 bersih di 390 & 1440 px (tanpa overflow, serif 600/700 `loaded`)

### R1 — Header publik
- [x] Top bar hijau tua: telepon, email, jam layanan, sosmed (dari `SiteSetting`); disembunyikan di HP — `<aside aria-label="Kontak dan media sosial">` di atas `<header>`, tampil ≥1024 px (jam layanan ≥1280 px), tinggi 44 px; email & jam terpotong rapi (`truncate` + `title`) bila panjang. Ikon sosmed: logo brand dari `simple-icons` (CC0, devDependency) disalin `build:assets` ke `utils/icons.json` sebagai `brand-*` (`{ viewBox, d }`, didukung `utils/icons.js`); LinkedIn tidak ada di simple-icons → ikon `public` + `title`. Di HP/tablet kontak pindah ke bawah panel menu
- [x] Navbar putih: logo, menu, satu tombol CTA; hanya navbar yang sticky — wordmark serif, menu aktif bergaris emas (`.nav-active`), CTA dari `publicCta` di `utils/navigation.js` (sekarang "Dokumen & Formulir" → `/dokumen-akademik`, tampil ≥1280 px karena di 1024 px tidak muat; di HP jadi tombol penuh di panel menu). Panel menu HP pakai `100dvh`. **Verifikasi** (workflow 3 lensa + skeptis): 9 temuan low terkonfirmasi, 8 diperbaiki — termasuk **celah lama**: URL sosmed/tautan cepat/video di Pengaturan Situs menerima `javascript:`/`data:` (zod `z.url()` menerima skema apa pun, CSP mati) → validator kini hanya http/https + filter di layout untuk nilai lama di DB, tes ditambahkan (43/43 lulus)
- [x] Nomor telepon di Pengaturan Situs berlabel "(Chat Only)" tetapi dirender sebagai tautan `tel:` (top bar, menu HP, footer — footer sudah begitu sejak F1) — **diputuskan pemilik (2026-10-06): tautan WhatsApp.** `utils/contact.js#phoneLink`: nomor yang mengandung kata "chat"/"WhatsApp"/"WA" → `https://wa.me/62…` (tab baru, logo WhatsApp, `aria-label` memuat teks nomor), selain itu tetap `tel:`. Tes `test/contact.test.js`

### R2 — Beranda
- [x] Hero foto penuh lebar + overlay hijau + teks di atas foto; 4 kartu akses cepat menumpuk ke tepi bawah hero — overlay `bg-brand/90` di <1024 px, gradien `from-brand 45% → brand/90 65% → brand/30` di ≥1024 px; kontras diukur dari piksel foto sebenarnya di 390–1920 px, semua teks hero ≥ 4,5:1. Ring fokus kartu digambar **di dalam** kartu (`-outline-offset-4`) karena separuh kartu menumpuk di atas hero gelap. SRS FR-B-01 diperbarui ("tanpa teks di atas foto" dicabut, syarat kontras ditambahkan)
- [x] Latar seksi berselang-seling; Status Mutu + Statistik Lulusan di seksi hijau tua — urutan: hero (tua) → akses cepat/info/agenda (canvas) → pengumuman (muda) → mutu & lulusan (tua) → kegiatan (putih) → video (muda, atau putih bila tepat setelah pengumuman); diuji dengan 10+ variasi data, tidak pernah ada dua pita sama warna bersebelahan. Mutu & Lulusan = dua `<section>` berlabel di satu pita. Statistik lulusan: kolom mengikuti jumlah angka; di samping Mutu (≥1024 px) jadi baris label–nilai (3 sel sejajar terpotong); perubahan % pakai ikon arah + tanda minus asli, emas hanya bila naik. **Perbaikan data:** "distribusi prodi per peringkat" sebelumnya ikut menghitung unit non-prodi (Perpustakaan → "Unggul") dan sertifikat kedaluwarsa/riwayat — kini hanya sertifikat terbaru tiap prodi yang masih ada, yang berlaku (SRS FR-B-05 diperbarui). Data dev saat ini: kedua sertifikat prodi kedaluwarsa → baris distribusi tersembunyi (benar)
- [x] Agenda Terdekat memakai blok tanggal menonjol; semua judul seksi memakai eyebrow — `date-block` varian `dateTone: 'solid'` (contoh di `/dev/komponen`; data dev belum punya agenda); angka hari di semua blok tanggal kini serif
- [x] Tetap: setiap bagian hilang rapi bila datanya kosong (FR-B-01..08) — diverifikasi lewat render data palsu (kosong total, penuh, sebagian, data berbahaya). **Verifikasi R2:** 2 putaran workflow (3 lensa + skeptis, lalu re-cek terarah): 19 temuan terkonfirmasi, semua diperbaiki; termasuk bug lama `target="_blank"` di Informasi Penting yang ter-escape jadi atribut rusak, dan guard skema http(s) untuk `src` iframe video
- [ ] **Tindak lanjut (di luar R2):** tile "Peringkat …" di `/akreditasi` memakai hitungan longgar yang sama (semua sertifikat non-institusi termasuk riwayat & kedaluwarsa) — samakan dengan logika Beranda; hapus Program Studi di admin tidak dicegah bila masih punya sertifikat akreditasi (rujukan menggantung; Beranda kini mengabaikannya)

### R3 — Halaman dalam
- [x] `components/page-header.ejs` (publik) → banner hijau berisi judul + breadcrumb; mode `admin: true` tidak ikut berubah di sini. — Banner hijau tua selebar layar dengan kontainernya sendiri, garis emas bawah, watermark lambang putih samar (≥768 px), breadcrumb versi gelap, judul serif (`lg:text-5xl` hanya untuk judul ≤60 karakter), aksi dipetakan ke tombol latar gelap; berlaku otomatis untuk 15 halaman publik. Mode admin identik dengan sebelumnya (diverifikasi render-diff). Lead `/profil` (ringkasan 300–1200 karakter) dipindah ke badan halaman; banner diberi lead pendek. **Bug lama (sejak F1, ditemukan saat verifikasi R0):** di halaman publik `page-header` di-include langsung di `<main>` tanpa `.container-content`, sehingga breadcrumb/judul menempel ke tepi layar dan tidak sejajar dengan konten — banner baru wajib punya kontainer sendiri
- [x] `views/landing/error.ejs` (mandiri, CSS inline, tidak memuat `app.css`): judul masih sans sistem — samakan dengan serif/banner baru — `@font-face` inline (fallback Georgia, tetap mandiri tanpa DB/stylesheet), garis emas atas, kode status bergaya eyebrow
- [x] Detail berita & pengumuman: sidebar (terbaru, kategori) — `components/content-sidebar.ejs`: kartu "… Lainnya" + "Kategori" (hanya kategori aktif yang punya isi terbit, dengan jumlah; `kategoriSidebar()` di controller), judul `.sidebar-title` bergaris emas, sticky di ≥1024 px dengan tinggi terbatas + gulir sendiri. **Bug lama ikut diperbaiki:** `?kategori=` yang bukan ObjectId di `/pengumuman`, `/berita`, `/dokumen-akademik` menghasilkan HTTP 500 (CastError) → kini diabaikan (`kategoriParam`); chip/menu kategori aktif di ketiga halaman daftar kini punya `aria-current` (+ ikon centang di chip), sebelumnya hanya dibedakan warna. **Verifikasi R3:** workflow 3 lensa + skeptis — 3 temuan low terkonfirmasi, semua diperbaiki; 5 ditolak (pre-existing/tidak terbukti)

### R4 — Footer
- [x] Band CTA "Butuh layanan akademik?" di atas footer (bukan newsletter — fiturnya tidak ada) — pita hijau `primary` di **dalam** `<footer>` (tetap di landmark contentinfo), tombol "Chat WhatsApp"/"Telepon" (mengikuti `phoneLink`) + "Kirim Email"; margin atas footer (`mt-16`) dihapus sehingga tidak ada lagi celah canvas di bawah pita berwarna
- [x] Rapikan footer 4 kolom (judul kolom bergaris emas, ikon sosmed) — identitas + ikon sosmed bulat (44 px), "Jelajahi" (6 halaman utama), "Kontak & Jam Layanan", "Tautan Cepat" (disaring: hanya http(s)/path internal; cadangan "Portal UNJANI" bila tak ada yang valid); judul `.footer-title` serif bergaris emas. **Verifikasi R4:** workflow 3 lensa + skeptis — 4 temuan low terkonfirmasi, semua diperbaiki (kontras hover tombol garis di atas `primary` 4,2:1 → hover digelapkan; ritme baris kontak; titik ganda bila jam layanan diakhiri titik; kolom kosong bila semua tautan cepat lama tidak valid)

### R5 — Panel admin
- [x] Sidebar hijau tua, penanda menu aktif emas; header dan `page-header` admin memakai eyebrow — `.admin-nav-link` (aktif: latar putih 15% + bilah emas kiri + `aria-current`; kontras teks ≥6,1:1), header admin: eyebrow = grup menu aktif (cadangan "Panel admin") + judul serif, avatar foto profil bila ada; `page-header` admin menerima param `eyebrow` opsional. **Perbaikan aksesibilitas drawer HP (masalah lama):** sidebar tertutup tidak lagi masuk urutan Tab (`max-lg:invisible`), fokus pindah ke "Tutup menu" saat dibuka (`x-ref="focusOnOpen"`), tombol X & Escape mengembalikan fokus, Escape dari menu akun yang tertutup kini menutup drawer (`escapeIfOpen`), tombol menu akun punya nama aksesibel di <640 px
- [x] Halaman login split-screen (foto kampus + form) — ≥1024 px: panel hijau tua (foto kampus `loading="lazy"` di balik overlay ≥90%, tidak diunduh di HP) + form; <1024 px: form saja. Input password kini `type="password"` statis (sebelumnya hanya lewat Alpine — tanpa JS password terlihat); pesan galat login tidak lagi terduplikasi di bawah kolom email. Ternary `:type` terbukti didukung Alpine CSP 3.17.4
- [x] **Migrasi `/profile`, `/profile/edit`, `/profile/password`** ke `layouts/admin.ejs` — ketiganya masih memakai template admin lama (Materio/Bootstrap via `partials/menu` & `partials/navbar`); setelahnya hapus partial dan aset lama yang jadi yatim — `renderPage(..., 'layouts/admin')`, validasi Zod (`schemas.profileUpdate` baru + `schemas.passwordChange` yang sudah ada), galat per kolom, unggahan foto yang ditolak kini dihapus dari disk, metrik "skor kelengkapan" palsu dibuang. **Perubahan perilaku:** ubah password sendiri kini minimal **8** karakter (sebelumnya 6; sama dengan buat/reset akun). Partial & aset lama dihapus (lihat catatan F5 di atas). **Verifikasi R5:** workflow 3 lensa (keamanan, Playwright headless, uji alur POST pada harness ber-stub tanpa DB) + skeptis — 8 temuan low terkonfirmasi (5 masalah lama), semua diperbaiki dan diuji ulang

### R6 — Verifikasi `[Opus 5.5 · high]`
- [x] `npm run build:css`, lalu `ux-ui-audit` publik + admin di 390 dan 1440 px — probe skill dijalankan via Playwright headless untuk 20 rute + 4 halaman admin (harness ber-stub; login sungguhan tidak dipakai karena DB = produksi): 0 gagal kontras dari ±2.900 node teks, 0 overflow, 1 `h1` per halaman. Ditemukan & diperbaiki: ring fokus `.btn` memudar dari `currentColor` 150 ms (`transition-colors` TW4 ikut `outline-color`), ring fokus kolom isian 20% (±1,2:1) → hijau solid 2 px. Detail: [AUDIT-UIUX-v3.md](AUDIT-UIUX-v3.md)
- [x] Kontras teks di seksi gelap & banner; A11y dan SEO Lighthouse tetap 100 di 4 halaman F5 — 100/100 di keempatnya setelah memperbaiki penghitung tab semester `opacity-75` (3,54:1) di Kalender
- [x] Performa: ukuran font baru + hero penuh lebar tidak menurunkan skor dibanding F5 — awalnya Beranda turun (±71 vs 76): hero 1600 px ikut terunduh di HP dan `.populate` di hitungan prodi R2 menambah round-trip DB. Diperbaiki (`hero-kampus-800.webp` 61 KB + `srcset`/`imagesrcset`; `ProgramStudi.distinct` paralel). Hasil akhir Lighthouse mobile vs F5: Beranda 80 (median 3×) vs 76, Kalender 87 vs 85, Akreditasi 84 vs 81, Dokumen 87 vs 84

---

## F8 — Hierarki Pimpinan & Slideshow Unit Kerja `[Sonnet 5.5 · medium]`

Permintaan stakeholder (2026-10-12). Dua bagian, satu commit tiap bagian. Hierarki dikerjakan lebih dulu (lebih kecil). Hierarki = **tingkatan saja** (bukan pohon atasan–bawahan). Deploy ke dev-akademik hanya bila diminta.

### H1 — Hierarki Pimpinan & Staf
- [x] `utils/staffTingkat.js`: satu sumber daftar tingkat berurutan — `wakil-rektor`, `kepala-biro`, `kepala-bagian`, `kepala-urusan`, `anggota` (value + label)
- [x] `models/Staff.js`: field `kelompok` (pimpinan/staf) diganti `tingkat` (enum dari `utils/staffTingkat.js`, default `anggota`); `jabatan` tetap teks bebas
- [x] `validators/index.js` skema `staff`: `kelompok` → `tingkat`; update `test/validators.test.js`
- [x] Admin: select "Kelompok" → "Tingkat" di `views/admin/staff/form.ejs`; kolom + urutan daftar (`list.ejs`, `staffController.list`) mengikuti tingkat lalu `nomorUrut`; default form baru `anggota`
- [x] `homeController.getPimpinanStaffLanding`: kelompokkan per tingkat (fungsi murni + 1 tes); `views/landing/pimpinan-staff.ejs`: satu blok per tingkat dari atas ke bawah, kartu makin kecil ke bawah, garis penghubung vertikal tipis, tingkat kosong tidak ditampilkan
- [x] Skrip migrasi `scripts/migrate/009-staff-tingkat.js` — tingkat ditebak dari awal teks jabatan (cadangan: pimpinan→wakil-rektor, staf→anggota); `scripts/migrate/index.js` kini memakai `DNS_SERVERS`. Dry-run OK (2 data: Wakil Rektor, Kepala Biro), `--apply` dijalankan 2026-10-12 atas izin pemilik, backup di `backups/` — (dry-run dulu): `staf` → `anggota`, `pimpinan` → `wakil-rektor` (tebakan — koreksi per orang lewat form admin). **Atlas dev = produksi: jangan `--apply` tanpa konfirmasi pemilik**
- [ ] Verifikasi (sebagian: render data penuh/kosong + 1440 px di data dev OK; sisa: 390 px, Lighthouse): render dengan data palsu (semua tingkat, sebagian kosong, kosong total) di 390 & 1440 px; `npm test` hijau; Lighthouse A11y/SEO tetap 100

### H2 — Slideshow Unit Kerja di Beranda
- [x] `homeController`: tambah `Unit.find().sort({ createdAt: -1 }).lean()` ke `Promise.all` beranda; periksa apakah unggahan unit (maks. 5 MB) sudah dikecilkan — bila belum, `loading="lazy"` + `width`/`height` agar skor performa tidak turun — **hasil:** unggahan unit belum pernah dikecilkan (±500 KB/gambar) → `unitController` kini memproses gambar baru lewat `processImage` (WebP ≤900 px); gambar lama dibiarkan (`loading="lazy"`)
- [x] `views/landing/index.ejs`: section baru setelah "Kegiatan Akademik", sebelum video; hilang rapi bila tidak ada unit; kartu foto 4:3 + nama di atas gradien hijau + tombol "Kunjungi Unit" (hanya bila `link` terisi, tab baru `rel="noopener"`); 3 kartu ≥1024 px, 2 di tablet, 1 di HP; hover zoom foto halus. Tidak ada halaman detail unit — pita latar mengikuti pola F7 (hijau muda, putih bila tepat setelah Pengumuman; video menyesuaikan). Bila unit sedikit (tidak perlu gulir) kartu dipusatkan, tombol panah/jeda disembunyikan
- [x] Carousel tanpa library: CSS scroll-snap + `scrollBy({ behavior: 'smooth' })`, logika di `Alpine.data` pada `public/js/app.js` (Alpine CSP: tanpa ekspresi inline). Autoplay ±5 dtk, kembali ke awal setelah kartu terakhir; berhenti saat hover/fokus; mati total bila `prefers-reduced-motion`; tombol panah kiri/kanan + tombol jeda (WCAG 2.2.2) — komponen `carousel` di `public/js/app.js`; ikon `pause`/`play_arrow` ditambah ke `scripts/build-assets.js`
- [x] `npm run build:css` (sudah); verifikasi 390 & 1440 px (sebagian: Playwright — tanpa galat konsol/overflow, autoplay & geser di 390 px jalan; sisa: fokus keyboard, kontras, Lighthouse) (tanpa overflow, fokus keyboard terlihat, kontras teks di atas gradien ≥ 4,5:1); Lighthouse Beranda tidak turun dari 80

---

## F9 — Peningkatan UX & gerak (audit v4) `[Opus 5.5 · high → Sonnet 5.5 · medium]`

Permintaan stakeholder (2026-10-13): tingkatkan UX dan tambahkan animasi, berdasarkan [AUDIT-UIUX-v4.md](AUDIT-UIUX-v4.md) (L1–L14 landing, P1–P16 panel; S1 = merusak fungsi/aksesibilitas, S2 = gesekan nyata, S3 = polish). Persyaratan: SRS §6.7 (NFR-U-01..07) dan FR-AD-09..13. Tanpa library baru. Satu commit per rangkaian (R0–R4).

### R0 — Fondasi gerak & umpan balik `[Opus 5.5 · high]`
- [x] Token gerak di `assets/css/app.css` (`@theme`): `--ease-out`, `--ease-in`, `--dur-fast` 120 ms, `--dur-base` 200 ms, `--dur-slow` 400 ms — NFR-U-01 — `:root` di `@layer base` (nama `--ease-enter/--ease-exit`, bukan `--ease-out`, agar tidak menimpa utilitas `ease-out` Tailwind)
- [x] Satu blok `@media (prefers-reduced-motion: reduce)` yang mematikan semua gerak baru (animasi `none`, transisi `0.01ms`, `.reveal` langsung terlihat) — NFR-U-02 — blok lama `*{...!important}` sudah mematikan semua transisi/animasi; ditambah override `.reveal-pending`; JS reveal tidak berjalan sama sekali bila reduced-motion
- [x] Komponen Alpine `reveal` di `public/js/app.js`: `IntersectionObserver` memasang kelas `is-visible`; elemen disembunyikan **oleh JS**, bukan CSS bawaan, dan tidak untuk elemen di atas lipatan — NFR-U-03 — diimplementasikan sebagai fungsi biasa (`setupReveal`) di `public/js/app.js`, bukan komponen Alpine: atribut `data-reveal` / `data-reveal-group` (stagger 60 ms); kelas dilepas setelah `transitionend` agar tidak bentrok dengan `.lift`
- [x] Komponen Alpine `busyForm`: pada `submit` tombol kirim `disabled` + teks "Menyimpan…" + `aria-busy="true"` pada form; pulih bila halaman dimuat dari cache (`pageshow`) — FR-AD-09 · P1 — diimplementasikan sebagai pendengar `submit` global (tanpa ubah view): form POST, bukan di `<dialog>`, bukan `data-no-busy`; spinner + "Memproses…" (`data-busy-label` untuk label lain); dipulihkan lewat `pageshow`
- [x] Utilitas `.lift` (kartu terangkat tipis saat hover/fokus), `.press` (keadaan `active` tombol), `.fade-in-up` (masuk 8 px) — NFR-U-04 — plus `.menu-enter` dan animasi `<dialog>` (fade + skala 0,98, `@starting-style` + `allow-discrete`)
- [ ] Dokumentasi pola di `/dev/komponen`; tes unit untuk logika murni (bila ada); `npm run build:css`

### R1 — Perbaikan S1 `[Sonnet 5.5 · medium]`
- [x] **P1** Terapkan `busyForm` ke semua form admin dan login — semua `views/admin/**/form.ejs`, `views/auth/login.ejs`, form di `settings/edit.ejs` dan `academic-calendars/edit.ejs` — tercakup pendengar global; tidak ada perubahan view
- [x] **P2** Hapus `role="tablist"` pada tautan filter; ganti `<nav aria-label="Status">` + `aria-current="page"` — `pengumuman/list.ejs`, `news/list.ejs`, `kategori/list.ejs`, `accreditations/list.ejs` — 4 daftar admin → `<nav>` + `aria-current="page"`
- [x] **P3** Filter `<select>` di daftar admin dan Kalender: hapus `onchange` submit-otomatis, ganti tombol "Terapkan" (sembunyikan label di layar kecil dengan `sr-only`) — WCAG 3.2.2 — Berita, Pengumuman, Akreditasi (admin) dan Kalender (publik); tombol "Terapkan" terlihat
- [x] **L1** Tombol "Unduh" di Dokumen Akademik dan RPL: `aria-label="Unduh <nama>"`; tautan judul + tombol tidak lagi dua tab stop (tombol `tabindex` tetap, judul tautan ke file) — `aria-label="Unduh <nama>"`; tab stop ganda dipertahankan (judul = buka, tombol = unduh)
- [x] **L2** `.prose-content`: `img{max-w-full h-auto rounded}`, `table` dibungkus/diguling horizontal, gaya `blockquote`, `hr` — uji dengan isi berita yang ditempel dari Word — `img`, `blockquote`, `hr`, `table` (gulir sendiri), `th/td`
- [ ] Tes: `npm test` hijau; render ulang 5 halaman terdampak di 390 dan 1440 px

### R2 — Landing page `[Sonnet 5.5 · medium]`
**UX**
- [x] **L3** Video profil: konversi otomatis URL YouTube/Vimeo biasa ke URL embed (fungsi murni di `utils/` + tes); bantuan di Pengaturan Situs menyebut format yang diterima — `utils/videoEmbed.js` (+ 2 tes): watch/youtu.be/shorts/embed → `youtube-nocookie.com/embed/<id>` — yang diizinkan CSP `frame-src`; tautan non-YouTube tidak diubah; Vimeo sengaja tidak dikonversi karena CSP tidak mengizinkannya; bantuan di Pengaturan Situs diperbarui
- [x] **L4** Satukan pola filter: tombol "Terapkan" eksplisit di Kalender, Akreditasi, Kurikulum, Buku Wisuda — Kalender kini memakai tombol "Tampilkan" permanen; Akreditasi, Kurikulum, Buku Wisuda sudah memakai tombol "Terapkan"; Berita/Pengumuman/Dokumen tetap chip + kolom cari (pola berbeda, memang tombol/tautan eksplisit)
- [x] **L5** Pagination di `/buku-wisuda` — 15 buku per halaman, `homeController.getBukuWisudaLanding`
- [x] **L6** Chip tahun `/buku`: `aria-current` + ikon centang seperti chip kategori
- [x] **L7** Sidebar kategori Dokumen Akademik di <1024 px jadi `<select>`/baris chip yang bisa digulir; daftar dokumen tampil lebih dulu — chip yang bisa digulir horizontal di <1024 px; daftar tetap tampil tepat di bawahnya
- [x] **L8** Footer "Jelajahi": tambah Profil, Pimpinan & Staf, Struktur Organisasi, RPL, Buku, Buku Wisuda (dua kolom kecil bila perlu) — 12 tautan, dua kolom di HP
- [x] **L9** Riwayat akreditasi di HP: daftar sederhana, bukan tabel bersarang — daftar di HP, tabel di ≥768 px; sel `colspan` tidak lagi memakai kolom label kosong
- [x] **L10** Tautan ke tab baru (buku, dokumen): `sr-only "(tab baru)"` + ikon — buku, buku wisuda, dokumen, RPL
- [x] **L11** `/cari`: hapus `autofocus` pada layar sentuh — `autofocus` dihapus (tidak dibedakan sentuh/desktop agar sederhana)
- [x] **L12–L14** Logo halaman error, font serif angka peringkat, banner ringkas untuk `/cari` — S3, kerjakan sambil menyentuh file terkait — L12 dan L13 selesai; L14 (banner ringkas untuk `/cari`) sengaja dilewati — S3 opsional, banner seragam dipertahankan
**Gerak** *(NFR-U-04, maksimal 1–2 elemen utama per layar)*
- [x] Hero Beranda: teks masuk `fade-in-up` sekali saat dimuat (tidak menyentuh gambar LCP)
- [x] Reveal bertahap (stagger 60 ms) untuk kartu akses cepat, pengumuman, dan kegiatan di Beranda — hanya di bawah lipatan — agenda, pengumuman, kegiatan Beranda, dan grid Berita
- [x] `.lift` pada kartu berita, pengumuman, akses cepat; `.press` pada tombol — kartu akses cepat Beranda, kegiatan Beranda, dan grid Berita; `.press` lewat `.btn:active`
- [x] Menu HP dan dropdown navbar: fade + geser ≤ 8 px (masuk 200 ms, keluar 120 ms) — `.menu-enter` (masuk saja); keluar seketika karena `x-show` Alpine
- [x] Panel tab semester Kalender: memudar saat berganti — `.panel-enter` (hanya `opacity`, 200 ms)
- [ ] Verifikasi 390 & 1440 px; Lighthouse Beranda tidak turun dari 80; CLS < 0,1

### R3 — Panel admin `[Sonnet 5.5 · medium; high untuk P4, P8, P9, P11]`
**UX**
- [x] **P4** `[high]` Pakai `components/page-header` varian admin di semua view admin (breadcrumb + h1 seragam), hapus `<h1>` manual dan tautan "Kembali ke…" — 38 view admin (daftar, form, edit, reset password, profil) kini memakai `page-header` varian admin: breadcrumb + h1 `text-2xl md:text-3xl`; dasbor tetap h1 manual (satu-satunya halaman tanpa breadcrumb)
- [x] **P5** Header lengket admin: hapus judul ganda; cukup nama grup + tombol akun — judul `<p>` dihapus, tersisa eyebrow grup menu
- [x] **P6** Ganti `data-confirm`/`window.confirm` dan hapus tanpa konfirmasi (kegiatan kalender, tautan cepat, lampiran) dengan `confirm-dialog`; hapus `data-confirm` dari `public/js/app.js` bila tidak terpakai lagi — kegiatan kalender, lampiran kalender, tautan cepat; handler `data-confirm` dihapus dari `public/js/app.js`
- [x] **P7** Impor CSV kalender dan lulusan: dialog konfirmasi yang menyebut jumlah data yang akan diganti — hanya impor kegiatan kalender (menimpa seluruh daftar, dialog menyebut jumlah kegiatan yang ada). Impor lulusan menambah data, tidak menimpa, jadi tidak diberi dialog
- [x] **P8** `[high]` `dirtyForm`: peringatan sebelum meninggalkan halaman bila ada perubahan belum disimpan; terapkan di Pengaturan Situs dan form panjang — FR-AD-11 — diimplementasikan sebagai penjaga global `setupDirtyGuard` (`beforeunload`), bukan komponen Alpine `dirtyForm`: form POST yang diedit; kirim form A hanya membersihkan A; `data-no-dirty` untuk login
- [x] **P9** `[high]` Editor teks: tombol tautan, ikon bergambar menggantikan huruf, teks bantuan akurat — FR-AD-12 — ikon bergambar (+9 ikon ke `scripts/build-assets.js`), tombol tautan dengan kolom URL sebaris (bukan `window.prompt`) dan tombol hapus tautan; `execCommand` dipertahankan (belum ada pengganti tanpa dependensi)
- [x] **P10** Tombol "Pratinjau" (tab baru) untuk draf berita/pengumuman — rute baca-saja untuk admin — rute `GET /admin/{news,pengumuman}/:id/preview` memakai tampilan detail publik untuk draf, `noindex`, tombol di form mode ubah (membuka versi **tersimpan**, bukan isi form yang belum disimpan)
- [x] **P11** `[high]` `file-upload`: periksa tipe dan ukuran di klien, pratinjau gambar, seret-lepas — FR-AD-13 — pemeriksaan tipe + ukuran dan pratinjau gambar (via `data:` URL karena CSP tanpa `blob:`); seret-lepas belum
- [ ] **P12** Pencarian + pagination di Akun Admin dan Data Lulusan — Data Lulusan: filter tahun + pagination 20/halaman. Akun Admin sengaja tidak diberi pencarian/pagination (jumlah akun kecil). Pencarian teks Lulusan/Akreditasi belum
- [ ] **P13** Satu pola aksi: ⋯ untuk semua aksi destruktif/sekunder — ditunda (S3): perubahan memengaruhi 12 daftar dan perlu keputusan produk soal aksi Sematkan
- [x] **P14–P16** `order-first` mati di Dasbor, label tombol mata password dinamis + catatan reset password, eyebrow Profil — S3 — P14 `order-first` dihapus; P15 dinyatakan *bukan cacat*: tombol dengan `aria-pressed` justru harus berlabel tetap — diganti catatan "Lupa password?" di login; P16 profil memakai `page-header` + eyebrow
**Gerak**
- [x] Dialog: fade + skala 0,98→1 (masuk 200 ms, keluar 120 ms) lewat `@starting-style`/`allow-discrete`, cadangan tanpa animasi — tanpa pemeriksaan visual di browser — lihat catatan verifikasi
- [x] Dropdown ⋯ dan menu akun: fade + geser ≤ 8 px
- [x] Toast: masuk dari bawah, keluar memudar; tetap `role="status"`/`alert` — masuk saja (`fade-in-up`)
- [x] Tombol kirim: keadaan "Menyimpan…" dengan spinner (`linear`, bukan ease) — lewat pendengar global (R0)
- [ ] Baris tabel yang baru disimpan/diubah: sorotan hijau muda memudar 1,2 dtk (hanya saat `?success=`) — ditunda: redirect `?success=` tidak membawa id baris yang berubah
- [x] Sidebar HP: geser masuk (sudah ada) + latar memudar — latar gelap memudar (`.panel-enter`); sidebar sudah bergeser

> **Catatan status (2026-10-13):** R0, R1, R2, dan R3 (kecuali P12 sebagian, P13, sorotan baris, seret-lepas) selesai dan lolos `npm run build:css`, kompilasi EJS 7 view terdampak, `npm test` (47 lulus), serta render HTML Beranda/Dokumen/Kalender lewat server lokal (kelas baru ada, status 200). **Belum diverifikasi di browser** — Chrome tidak bisa menjangkau server lokal dari sandbox, jadi perilaku visual (reveal, dialog, spinner, hover) dan Lighthouse masuk R4. Server lokal juga tidak bisa dipakai untuk render halaman data nyata (MongoDB Atlas tidak terjangkau saat dites); render dicek lewat harness EJS dengan data tiruan.

### R4 — Verifikasi `[Opus 5.5 · high]`
- [ ] `npm run build:css`, `npm test`
- [ ] Probe audit (kontras, target sentuh, nama aksesibel, overflow) di 390 dan 1440 px: publik + `/dev/komponen` + `/dev/admin` + harness admin
- [ ] Uji `prefers-reduced-motion: reduce`: tidak ada animasi berjalan; JavaScript dimatikan: semua konten terbaca
- [ ] Lighthouse mobile 4 halaman: Performa tidak turun dari F7/F8, A11y/SEO tetap 100; CLS < 0,1
- [ ] Uji keyboard penuh: dialog (fokus masuk/kembali), dropdown, tab, peringatan perubahan belum tersimpan
- [ ] Tulis hasil ke `docs/AUDIT-UIUX-v4.md` (bagian "Hasil F9") dan centang NFR-U-01..07
