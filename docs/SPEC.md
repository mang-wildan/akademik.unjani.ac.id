# SPEC — Rombak Panel Admin Bidang Akademik UNJANI

Status: disetujui (brainstorming 2026-10-19) · Pemilik: Tim SISFO BAA
Dokumen terkait: [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [TODO.md](TODO.md)

## 1. Tujuan

Panel admin (`/admin/*`) dirombak total supaya staf bisa mengelola konten situs
akademik dengan **cepat, padat, dan nyaman di desktop maupun HP**. Rombakan
mencakup tampilan, struktur menu, alur kerja, dan perubahan backend seperlunya
untuk mendukung UI baru.

Situs publik tidak ikut diubah. Admin mendapat gaya visual sendiri.

## 2. Latar belakang

- Admin saat ini memakai sidebar hijau penuh, satu berkas CSS bersama situs
  publik (`assets/css/app.css`), dan pola daftar/form yang seragam tetapi
  lambat dipakai: satu baris = satu aksi, tidak ada aksi massal, setiap edit
  pindah halaman.
- Tiga modul (Kategori, Lembaga Akreditasi, Akun Pengguna) punya route dan
  halaman tetapi tidak tercantum di menu, sehingga hanya bisa dibuka lewat URL.
- Dokumen lama di `docs/` (SRS, POLA-ADMIN, AUDIT-UIUX) sengaja dibuang.
  Dokumen ini menggantikannya untuk lingkup admin.

## 3. Pengguna dan peran

| Peran | Akses |
|---|---|
| `superadmin` (juga `admin` lama) | Semua modul, termasuk Data Master dan Sistem |
| `editor` | Semua modul konten; tanpa Data Master dan Sistem |

Peran **tidak berubah** dalam proyek ini. Tidak ada pembatasan per modul atau
per prodi.

Perangkat: campuran. Desktop untuk input data, HP untuk cek cepat dan
menerbitkan pengumuman. Keduanya harus nyaman.

## 4. Lingkup

### Termasuk

- Layout admin baru (`admin-v2`), sidebar bisa dilipat, navigasi bawah di HP.
- Design system admin sendiri: netral + aksen hijau UNJANI, mode terang dan gelap.
- Halaman daftar padat dengan pengurutan kolom, filter di query string, dan
  **bulk action**.
- Form di **slide-over** untuk modul berform pendek; halaman penuh untuk form
  panjang.
- Struktur menu baru berdasarkan pekerjaan, termasuk tiga modul yang
  sebelumnya tersembunyi.
- Dasbor baru: perlu perhatian, statistik, buat cepat, draf, aktivitas.
- Pencarian modul di header (filter daftar menu, bukan command palette).
- Endpoint backend baru yang dibutuhkan UI: bulk action, respons partial.
- Migrasi ke-21 modul, lalu penghapusan layout admin lama.

### Tidak termasuk

- Perubahan situs publik dan `layouts/public.ejs`.
- Peran baru, pembatasan akses per modul/prodi, alur review/persetujuan.
- Log audit, riwayat versi, undo.
- Command palette `Ctrl+K`, shortcut navigasi J/K, autosave.
- Penggantian stack (SPA, htmx, framework baru).
- Perubahan model data selain yang mutlak dibutuhkan endpoint baru.

## 5. Daftar modul (21)

| Grup menu | Modul | Route | Peran | Jenis form |
|---|---|---|---|---|
| — | Dasbor | `/admin/dashboard` | semua | — |
| Publikasi | Pengumuman | `/admin/pengumuman` | semua | halaman penuh |
| Publikasi | Berita | `/admin/news` | semua | halaman penuh |
| Publikasi | Buku | `/admin/books` | semua | slide-over |
| Akademik | Kalender Akademik | `/admin/academic-calendars` | semua | halaman penuh |
| Akademik | Kurikulum | `/admin/kurikulum` | semua | halaman penuh |
| Akademik | Dokumen Akademik | `/admin/academic-documents` | semua | slide-over |
| Akademik | RPL | `/admin/rpl-documents` | semua | slide-over |
| Akreditasi | Akreditasi Prodi | `/admin/accreditations` | semua | slide-over |
| Akreditasi | Lembaga Akreditasi | `/admin/lembaga-akreditasi` | superadmin | slide-over |
| Wisuda | Buku Wisuda | `/admin/graduation-books` | semua | slide-over |
| Wisuda | Data Lulusan | `/admin/lulusan` | semua | slide-over |
| Organisasi | Profil Bidang | `/admin/profil-akademik` | semua | halaman penuh |
| Organisasi | Pimpinan & Staf | `/admin/staff` | semua | slide-over |
| Organisasi | Unit | `/admin/unit` | semua | slide-over |
| Data Master | Fakultas | `/admin/faculties` | superadmin | slide-over |
| Data Master | Program Studi | `/admin/program-studi` | superadmin | slide-over |
| Data Master | Kategori | `/admin/kategori` | superadmin | slide-over |
| Sistem | Akun Pengguna | `/admin/users` | superadmin | slide-over |
| Sistem | Pengaturan Situs | `/admin/settings` | superadmin | halaman penuh |
| (menu akun) | Profil saya | `/profile` | semua | halaman penuh |

Buku dikonfirmasi tetap slide-over: judul, tahun, PDF, dan sampul. Jenis form
untuk Buku Wisuda dan RPL dikonfirmasi saat migrasi. Kalau
formnya ternyata panjang (banyak upload atau field bertingkat), pindahkan ke
halaman penuh dan catat di tabel ini.

## 6. Kebutuhan fungsional

### Shell dan tema

- **FR-ADM-01** Admin memakai layout `layouts/admin-v2.ejs` dan stylesheet
  `public/css/admin.css`; tidak memuat `public/css/app.css`.
- **FR-ADM-02** Sidebar desktop (≥1024px) lebar 240px, bisa dilipat ke 64px
  (ikon saja). Status lipat disimpan di cookie `admin_sidebar`.
- **FR-ADM-03** Di bawah 1024px, navigasi bawah berisi Dasbor, Pengumuman,
  Berita, Menu. "Menu" membuka laci berisi semua modul.
- **FR-ADM-04** Mode tema: terang, gelap, ikuti sistem. Pilihan disimpan di
  cookie `admin_theme`; server merender `data-theme` sehingga tidak ada kedipan.
  Default: ikuti sistem.
- **FR-ADM-05** Header berisi breadcrumb, pencarian modul (pintasan `/`), dan
  menu akun (Profil saya, Ubah password, Tema, Keluar).

### Navigasi

- **FR-ADM-10** Menu bersumber tunggal di `utils/navigation.js` (`adminNav`),
  dikelompokkan seperti tabel §5.
- **FR-ADM-11** Setiap item menu yang dibatasi peran memakai aturan yang sama
  dengan guard route-nya. Tes otomatis memastikan keduanya selaras.
- **FR-ADM-12** Setiap route admin yang punya halaman daftar wajib punya item
  menu. Tes otomatis memastikan tidak ada modul tersembunyi.
- **FR-ADM-13** Pencarian modul memfilter item menu di sisi klien; Enter membuka
  hasil teratas.

### Halaman daftar

- **FR-ADM-20** Bilah judul: nama modul, jumlah data, tombol Tambah (pintasan
  `N` saat fokus tidak di input).
- **FR-ADM-21** Filter (status, filter khusus modul, kata kunci) dan urutan
  (`sort`, `dir`) tersimpan di query string.
- **FR-ADM-22** Klik header kolom yang bisa diurutkan mengubah `sort`/`dir`.
  Kolom yang boleh diurutkan ditentukan per modul (daftar putih di server).
- **FR-ADM-23** Header tabel menempel saat di-scroll.
- **FR-ADM-24** Di bawah 768px tabel tampil sebagai daftar kartu ringkas.
- **FR-ADM-25** Tanpa JavaScript, tabel, filter, urutan, dan pagination tetap
  berfungsi.

### Bulk action

- **FR-ADM-30** Setiap baris punya checkbox; header punya checkbox "pilih semua
  di halaman ini" dengan keadaan sebagian (indeterminate).
- **FR-ADM-31** Saat ada pilihan, bilah bulk menggantikan bilah filter (desktop)
  atau menempel di bawah layar (HP): jumlah terpilih, aksi, Batal.
- **FR-ADM-32** Tautan "Pilih semua N hasil filter" memperluas pilihan ke semua
  data yang cocok dengan filter aktif, bukan hanya halaman ini.
- **FR-ADM-33** Aksi yang tersedia per modul:
  - semua modul: **Hapus**;
  - News, Pengumuman (`status`): **Terbitkan**, **Jadikan draf**;
  - Kategori, Accreditation (`isActive`), RplDocument (`status` boolean):
    **Aktifkan**, **Nonaktifkan**;
  - Users: **Nonaktifkan** saja (tidak bisa hapus massal); akun yang sedang
    login tidak ikut diproses.
- **FR-ADM-34** Hapus massal selalu dikonfirmasi lewat dialog yang menyebut
  jumlah dan jenis data.
- **FR-ADM-35** Hapus massal menghapus file upload terkait dengan logika yang
  sama seperti hapus tunggal.
- **FR-ADM-36** Setelah aksi, kembali ke daftar dengan filter yang sama dan
  toast "N <data> <aksi>". Kalau sebagian gagal, toast menyebut jumlah gagal.
- **FR-ADM-37** Batas satu permintaan: 500 data.

### Form dan slide-over

- **FR-ADM-40** Modul bertanda "slide-over" di §5 membuka form di panel kanan
  (560px; layar penuh di HP). Modul "halaman penuh" tetap pindah halaman.
- **FR-ADM-41** Tautan Tambah/Ubah tetap `href` biasa. Tanpa JS, halaman form
  penuh tetap berfungsi.
- **FR-ADM-42** Saat slide-over terbuka, URL berubah ke `?edit=<id>` atau
  `?new=1`. Tombol Back browser menutup panel. Membuka URL tersebut langsung
  memuat daftar dengan panel terbuka.
- **FR-ADM-43** Simpan dari slide-over: sukses menutup panel, memperbarui
  daftar, dan menampilkan toast. Validasi gagal menampilkan ulang form beserta
  pesan error di panel. Error jaringan/server mempertahankan isian dan
  menampilkan pesan.
- **FR-ADM-44** Form punya bilah aksi menempel di bawah: Simpan (`Ctrl+S` /
  `Cmd+S`), Simpan & Terbitkan (modul berstatus), Batal.
- **FR-ADM-45** Error validasi ditampilkan sebagai ringkasan di atas (tautan ke
  field) dan pesan per field.
- **FR-ADM-46** Menutup panel atau meninggalkan halaman dengan perubahan belum
  tersimpan memunculkan konfirmasi.

### Dasbor

- **FR-ADM-50** Seksi "Perlu perhatian": pemeriksaan yang ada sekarang, plus
  akreditasi yang kedaluwarsa dalam ≤90 hari dan pengumuman tersemat yang
  sudah lebih dari 30 hari.
- **FR-ADM-51** Empat statistik yang masing-masing menaut ke daftar dengan
  filter sesuai.
- **FR-ADM-52** Tombol buat cepat: Pengumuman, Berita, Dokumen.
- **FR-ADM-53** Lima draf terakhir (News + Pengumuman).
- **FR-ADM-54** Aktivitas terbaru.
- **FR-ADM-55** Urutan di HP: Perlu perhatian, Buat cepat, Draf, Statistik,
  Aktivitas.

## 7. Kebutuhan non-fungsional

- **NFR-ADM-01 Aksesibilitas:** WCAG 2.2 AA. Kontras teks ≥4.5:1 dan elemen UI
  ≥3:1 di **kedua tema**. Semua alur bisa dikerjakan dengan keyboard saja.
  Target sentuh ≥44px di HP, ≥24px di desktop.
- **NFR-ADM-02 Keamanan:** Endpoint baru melewati `requireAuth` + guard peran
  modul, `verifyOrigin` (CSRF), dan validasi Zod. Tidak ada skrip/gaya inline
  (CSP ketat, Alpine CSP build).
- **NFR-ADM-03 Kinerja:** `admin.css` ≤60 KB setelah minify. `public/css/app.css`
  tidak bertambah. JS admin tanpa dependensi baru.
- **NFR-ADM-04 Kompatibilitas:** Chrome, Edge, Firefox, Safari dua versi
  terakhir; Chrome Android dan Safari iOS.
- **NFR-ADM-05 Ketahanan:** Setiap modul tetap bisa dipakai tanpa JS untuk
  operasi dasar (lihat, tambah, ubah, hapus satu per satu).

## 8. Kriteria selesai

1. Ke-21 modul dirender oleh `layouts/admin-v2.ejs`; `layouts/admin.ejs` dan
   class khusus admin di `assets/css/app.css` sudah dihapus.
2. Bulk action berfungsi di setiap modul daftar dengan aksi sesuai FR-ADM-33.
3. Modul slide-over memenuhi FR-ADM-40 s.d. 46.
4. Tes `npm test` lulus, termasuk tes baru untuk bulk, kesesuaian menu–guard,
   dan "tidak ada modul tanpa menu".
5. Pemeriksaan browser per modul lulus: keyboard saja, 375px dan 1440px, mode
   terang dan gelap, console bersih, jalur tanpa JS.
6. NFR-ADM-03 terpenuhi (ukuran CSS diukur dari hasil `npm run build:css`).

## 9. Risiko

| Risiko | Mitigasi |
|---|---|
| Dua layout hidup berdampingan terlalu lama | Urutan fase tetap; F5 menghapus v1 |
| Slide-over merusak alur upload multer | `FormData` lewat `fetch`; diuji di modul percobaan F1 |
| Kontras mode gelap meleset | Token diverifikasi dengan checker di F1 sebelum modul lain dimigrasi |
| Hapus massal tidak sengaja | Dialog konfirmasi dengan jumlah; batas 500; Users tidak bisa dihapus massal |
| Pola modul berbeda-beda (Kalender bertingkat, Pengaturan) | Modul unik dimigrasi terakhir dalam grupnya, setelah pola stabil |
