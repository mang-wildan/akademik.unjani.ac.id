# TODO — Desain Ulang Situs Bidang Akademik UNJANI

Checklist turunan dari [PLAN.md](PLAN.md). Kolom referensi menunjuk ke [SRS.md](SRS.md) (FR/NFR) dan [AUDIT-UIUX.md](AUDIT-UIUX.md) (nomor temuan).

Label di setiap kelompok tugas: `[Model · effort]`. Kelompok tugas yang labelnya berbeda dari fasenya ditandai tersendiri.

---

## Sebelum mulai

- [x] K-01 diputuskan: **"Bidang Akademik"**
- [ ] Jawab keputusan terbuka K-02 sampai K-07 (SRS §10)
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

### Konten `[manual oleh admin BAA]`
- [ ] Hapus atau draf-kan berita uji (rgwegewrg, test, pm, edtbed, ghrdb, fasfaf, gjgjgj, dst.) — Audit 05
- [ ] Hapus pengumuman Lorem ipsum, "gnfn", "threhre", dan "Pengumuman Baru"
- [ ] Hapus buku "test" dan "dgsge", serta buku wisuda "Tahun 2027"
- [ ] Ganti staf "Test, S.Test." dengan data asli
- [ ] Hapus file `uploads/news/…TERRA_INFINITA_MAP_15K…jpg` (128 MB)
- [ ] Nonaktifkan atau tandai 4 akreditasi yang kedaluwarsa — Audit 06

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
- [ ] `git init`, `.gitignore` (`node_modules`, `.env`, `public/uploads`), dan commit kondisi awal
- [ ] Branch `redesign`
- [ ] `.env.example` diperbarui; database dev, staging, dan produksi terpisah — NFR-M-04
- [ ] Hapus `tempk.ejs` dan `temp_cal.ejs` di root

### Design system
- [ ] Pasang Tailwind CLI; `tailwind.config.js` hanya berisi token inti dari DESIGN.md (tanpa palet Material otomatis) — SRS §7.2
- [ ] Skrip `npm run build:css` dan `npm run dev` (watch CSS + nodemon)
- [ ] Self-host Plus Jakarta Sans dan subset Material Symbols
- [ ] Pasang Alpine.js (self-host)
- [ ] Siapkan aset lambang UNJANI resmi dalam format SVG atau PNG teroptimasi

### Layout & komponen
- [ ] `views/layouts/public.ejs`: header, menu HP, breadcrumb slot, footer — FR-G-01..04, FR-G-07
- [ ] `views/layouts/admin.ejs`: sidebar berkelompok, topbar — FR-AD-02, FR-AD-03
- [ ] Partial komponen: `button`, `badge`, `card`, `table`, `form-field`, `file-upload`, `empty-state`, `pagination`, `date-block`, `alert`, `stat-tile`, `confirm-dialog`, `toast`
- [ ] Gaya `:focus-visible` global dan target sentuh 44 px — NFR-A-02, NFR-A-03
- [ ] Halaman `/dev/komponen` (khusus dev) yang menampilkan semua komponen

### Infrastruktur
- [ ] Error handler terpusat, plus halaman 404/500 dengan layout baru — FR-G-05
- [ ] Helmet + CSP, CSRF (`csrf-sync` atau sejenisnya), rate limit login — NFR-S-05
- [ ] Helper format: `formatTanggal()` dan `formatAngka()` dengan `id-ID` — NFR-C-02

### Bersih-bersih `[Sonnet 5.5 · low]`
- [ ] Hapus `public/assets/vendor`, `public/assets/landing-page` (template), `public/assets/json` (demo), dan `public/assets/js/app-*`, `cards-*`, `charts-*`, dll.
- [ ] Hapus `views/partials/template-customizer.ejs`, `settings.ejs`, dan bagian bahasa/shortcuts di `navbar.ejs`

---

## F2 — Model data, migrasi, aturan bisnis `[Opus 5.5 · xhigh]`

### Skema — SRS §5
- [ ] `User`: role `superadmin`/`editor`, `isActive`, `lastLoginAt`
- [ ] `Accreditation`: `peringkat` enum, `lembaga` ref, `nomorSK`, `unitRef`, `catatanPerpanjangan`; hapus `tahun` dan `isActive`
- [ ] `AcademicCalendar`: `nomorSK`, `events[]`
- [ ] `AcademicDocument`/`RplDocument`: `kategori`, `fileSize`, `mimeType`
- [ ] `Pengumuman`/`News`: `kategori`, `excerpt`, `attachments[]`
- [ ] `Kurikulum.programStudi` menjadi ref
- [ ] `GraduationBook.periode` menjadi enum
- [ ] `Staff`: `kelompok`, `gelar`, `email`, `tampilkanNip`
- [ ] `SiteSetting`: `jamLayanan`, `socialInstagram`, `heroImage`
- [ ] Master baru: `KategoriPengumuman`, `KategoriDokumen`, `LembagaAkreditasi`
- [ ] `AuditLog` (Sebaiknya)

### Aturan bisnis + tes
- [ ] `accreditationStatus(berlakuSampai, today)` menghasilkan Aktif, Segera berakhir (≤ 90 hari), atau Kedaluwarsa — FR-A-03
- [ ] `calendarEventStatus(mulai, selesai, today)` menghasilkan Selesai, Berlangsung, atau Akan datang — FR-K-02
- [ ] `makeExcerpt(html, length)` membuang tag dan men-decode entity — FR-P-05
- [ ] Sanitasi HTML rich text (`sanitize-html`) — NFR-S-06
- [ ] Tes unit `node:test` untuk ketiga fungsi di atas, termasuk kasus batas (hari ini = tanggal berakhir, zona waktu WIB)

### Validasi & unggah `[Sonnet 5.5 · high]`
- [ ] Skema `zod` per form admin
- [ ] Pipeline `sharp`: WebP dengan lebar maks 1600 px + thumbnail 400 px, simpan `fileSize` — NFR-P-04
- [ ] Validasi MIME + ekstensi, sanitasi nama file — NFR-S-04

### Migrasi
- [ ] `scripts/migrate/001-accreditation.js`: teks peringkat → enum, unit → ref; `--dry-run` menghasilkan laporan CSV
- [ ] `002-kurikulum-prodi.js`: teks prodi → ref Program Studi
- [ ] `003-content-excerpt.js`: buat `excerpt` dari `body`
- [ ] `004-users-role.js`: `admin` → `superadmin`
- [ ] Jalankan semua migrasi dengan `--dry-run` pada salinan database produksi, lalu minta BAA meninjau laporannya
- [ ] Seed dev: master data + konten contoh yang realistis (tanpa "test" atau "lorem")

---

## F3 — Situs publik `[Sonnet 5.5 · medium]`

Referensi visual tiap halaman ada di `docs/Design/<nama_layar>/screen.png`. Terapkan koreksi dari SRS §7.2.

- [ ] Header, menu HP layar penuh, footer, dan breadcrumb — FR-G-01..04, FR-G-07
- [ ] **Kalender Akademik** `[Sonnet 5.5 · high]`: tabel per semester, kartu Sedang berlangsung/Berikutnya, pemilih tahun ajaran, Unduh PDF, timeline di HP — FR-K-01..05 · `kalender_akademik_*`
- [ ] **Akreditasi** `[Sonnet 5.5 · high]`: kartu institusi, tabel + filter + paginasi, riwayat yang bisa dibuka, kartu di HP — FR-A-01..07 · `akreditasi_*`
- [ ] Dokumen Akademik: daftar, filter kategori dengan jumlah, pencarian, tampilan kosong — FR-D-01..02 · `dokumen_akademik_*`
- [ ] RPL: teks penjelasan + daftar dokumen — FR-D-03
- [ ] Kurikulum: tabel per fakultas, filter — FR-KU-01..03 · `kurikulum_*`
- [ ] Pengumuman: daftar dengan blok tanggal, chip kategori, item disematkan, label "Baru" — FR-P-01..02 · `pengumuman_akademik_*`
- [ ] Detail pengumuman: kolom baca 720 px, lampiran, "Pengumuman lainnya" — FR-P-03 · `detail_pengumuman_*`
- [ ] Berita: kartu dengan gambar di atas, detail berita, hapus sidebar — FR-P-04, FR-P-06
- [ ] **Beranda**: hero, Informasi Penting, Agenda Terdekat, Pengumuman Terbaru, Status Mutu, Kegiatan, Statistik — FR-B-01..08 · `beranda_*`
- [ ] Buku dan Buku Wisuda: grid cover, filter tahun dan periode — FR-L-01 · `buku_wisuda_*`
- [ ] Pimpinan & Staf — FR-L-03 · `pimpinan_dan_staf_*`
- [ ] Profil — FR-L-02
- [ ] Struktur Organisasi + versi teks — FR-L-04
- [ ] Pencarian global — FR-G-06 (Sebaiknya)
- [ ] Bottom tab bar HP — FR-G-09 (Bisa)
- [ ] Tombol "+ Kalender" (.ics) — FR-K-06 (Bisa)
- [ ] **Review fase** `[Opus 5.5 · high]`: jalankan probe audit di 360/390/1440 px untuk semua rute publik

---

## F4 — Panel admin `[Sonnet 5.5 · medium]`

### Autentikasi `[Opus 5.5 · xhigh]`
- [ ] `/admin/login` dengan reCAPTCHA, rate limit, dan cookie `httpOnly; secure; sameSite=lax` — FR-AD-01
- [ ] Middleware role (`superadmin`, `editor`); rute pengaturan dan akun khusus `superadmin`
- [ ] Logout, ubah password, dan reset password oleh Super Admin

### Pola acuan `[Sonnet 5.5 · high]`
- [ ] **Pengumuman** (lengkap): daftar dengan tab status, filter, pencarian, thumbnail, tombol "Edit" berlabel, menu "⋯ → Hapus" dengan konfirmasi; form dengan validasi inline, rich text tersanitasi, lampiran, sematkan, dan toast — FR-M-01, FR-AD-05, FR-AD-06 · `kelola_pengumuman_*`
- [ ] Dokumentasikan pola ini di `docs/POLA-ADMIN.md` sebagai acuan modul berikutnya

### Modul (salin pola)
- [ ] Dasbor: kartu angka, Perlu Perhatian (otomatis), aksi cepat, aktivitas terbaru — FR-DS-01..04 · `dasbor_admin_*`
- [ ] Berita — FR-M-02
- [ ] Kalender Akademik + **impor CSV** + template unduhan `[Sonnet 5.5 · high]` — FR-M-03
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
