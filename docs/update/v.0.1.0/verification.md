# Verifikasi redesign admin v0.1.0

## Baseline (sebelum Task 1, HEAD `cebd626`)

- `npm test`: 253 lulus, 0 gagal.
- `npm run build:css:admin`: sukses; `public/css/admin.css` tanpa diff (build sinkron dengan sumber).
- Screenshot baseline browser: belum diambil (app/akun uji belum tersedia pada sesi ini).

## Task 1: token dan font

- `node --test test/adminTokens.test.js`: gagal sebelum ubah CSS (canvas `#fafafa`), lulus sesudahnya.
- `npm test`: 254 lulus, 0 gagal.
- Koreksi AA: `sidebar-label` FigCraft `#9DBBA7` = 4.38:1 di brand; dipakai `#A8C4AE` (4.9:1, nilai landing).
- Placeholder web = `muted` `#5B5E57` (referensi FigCraft `#8A8C84` gagal 4.5:1).
- Font 404: belum dicek di browser.

## Task 2: shell dan navigasi

- Tes baru gagal dulu (sidebar/topbar, Cari menu + Ctrl/Cmd+K), lalu lulus; `npm test`: 258 lulus, 0 gagal.
- Browser (Chromium headless, `/dev/admin-v2`, data fiktif):
  - 1440 & 1024: sidebar 264px, topbar 64px, tanpa overflow horizontal; font Inter/Crimson Text/Ubuntu Mono termuat, tanpa 404/page error.
  - 390: tanpa overflow; laci hijau terbuka dari "Menu", Escape menutup dan fokus kembali ke tombol Menu.
  - Ctrl+K fokus ke `#cari-modul`; menu akun Escape mengembalikan fokus ke pemicu.
  - Ciut + gelap: sidebar 64px tetap brand `#14532D`, item aktif terbaca.
- Deviasi: ikon menu disembunyikan saat sidebar terbuka (frame tanpa ikon), tetap tampil saat ciut. Pintasan `/` lama tetap aktif.

## Task 3: daftar, bulk, dialog, toast

- 5 tes baru gagal dulu (H1 serif, badge titik+teks, dialog 480px bar danger, toast ink, tabel mono/60px/bungkus, pagination "Menampilkan", bulk band brand), lalu lulus; verifikasi akhir `npm test`: 266 lulus, 0 gagal. Target kontrol list pada pointer coarse desktop diberi minimum 44px (tes regresi gagal→lulus).
- Browser (Chromium headless, `/dev/admin-v2`, data fiktif), 1440 & 390:
  - Tanpa overflow horizontal (daftar, bulk aktif, hasil kosong `?q=zzzzzz`); tanpa 404/page error. H1 Crimson Text, header tabel Ubuntu Mono, baris 60px desktop.
  - Toast `?success=<b>…</b>` tampil escaped; hover 5,5 dtk tetap tampil (pause).
  - Dialog hapus: fokus awal Batal, Escape menutup dan fokus kembali ke pemicu.
  - Bulk: 2 baris dipilih → "2 pengumuman dipilih"; HP lewat tombol Pilih.
  - Gelap: band bulk tetap brand `#14532D` teks putih; toast memakai token ink (terang di gelap), kontras tetap tinggi.
- Review callback nyata: hapus `truncate` di content-title/book-title agar judul Pengumuman/Berita/Buku ikut membungkus; tes komposisi HTML panjang gagal→lulus.
- Fix audit HP: toast berpindah ke atas saat bulk aktif agar tidak menutup aksi terakhir; tes regresi gagal→lulus. Browser 390: toast y=80–136, bulk y=660–836; focus pause 5,5 dtk lulus di 1440/390.
- Deviasi: tanpa tombol Urungkan (tidak ada endpoint undo).

## Task 4: dasbor editorial

- `node --test test/dashboard.test.js`: 3 gagal sebelum implementasi (salam, urutan band/panel), lalu 3 lulus. Tes controller/aturan 90 hari tetap.
- Regresi nama tanpa spasi: browser menemukan H1 shared melebar; tambah `min-w-0 max-w-full` pada H1, tes `adminUi` gagal→lulus.
- `npm run build:css:admin`: sukses. `npm test`: 269 lulus, 0 gagal.
- Browser Chromium, route fixture lokal sementara (view dashboard + shell nyata, CSP self, data fiktif; tanpa DB/akun produksi), 1440/1024/820/768/390/320px:
  - Light, dark, seluruh statistik 0/daftar kosong, nama/judul HTML tanpa spasi panjang: tanpa overflow horizontal, 404 atau page error.
  - 1440: band x=312 lebar 1080px; panel kiri 660px, kanan 396px; tepi atas sejajar; gutter/gap 24px. Brand tetap `#14532D` light/dark, teks putih; font lokal termuat.
  - 390: band dan kedua kolom stack; pesan kosong dan 0 tetap tampil.
- Dibanding PNG Dasbor: komposisi band + dua kolom sesuai; salam “Selamat datang” bukan waktu palsu, tanpa tanggal/jam/angka contoh PNG. Aktivitas memakai tanggal/label fixture dari kontrak existing; bukan audit log baru.
- Bukti: `screenshots/task-4-dashboard-1440-light.png`, `screenshots/task-4-dashboard-390-light.png`, `screenshots/task-4-dashboard-1440-dark.png`, `screenshots/task-4-dashboard-390-dark.png`.

## Matriks frame

Status: belum diuji / sesuai / beda (catat). Kolom catatan untuk lebar layar yang dicek dan selisih.

| # | Frame | Status | Catatan |
|---|---|---|---|
| 1 | Akreditasi _ Daftar | belum diuji | |
| 2 | Akreditasi _ Tambah | belum diuji | |
| 3 | Akreditasi _ Ubah | belum diuji | |
| 4 | Akun Pengguna _ Atur ulang password | belum diuji | |
| 5 | Akun Pengguna _ Daftar | belum diuji | |
| 6 | Akun Pengguna _ Konfirmasi nonaktif | belum diuji | |
| 7 | Akun Pengguna _ Tambah | belum diuji | |
| 8 | Akun Pengguna _ Ubah | belum diuji | |
| 9 | Berita _ Daftar | belum diuji | |
| 10 | Berita _ Hasil kosong | belum diuji | |
| 11 | Berita _ Konfirmasi hapus | belum diuji | |
| 12 | Berita _ Pilih massal | belum diuji | |
| 13 | Berita _ Tambah — gagal validasi | belum diuji | |
| 14 | Berita _ Tambah | belum diuji | |
| 15 | Berita _ Ubah | belum diuji | |
| 16 | Buku _ Daftar | belum diuji | |
| 17 | Buku _ Konfirmasi hapus | belum diuji | |
| 18 | Buku _ Tambah | belum diuji | |
| 19 | Buku _ Ubah | belum diuji | |
| 20 | Buku Wisuda _ Daftar | belum diuji | |
| 21 | Buku Wisuda _ Tambah | belum diuji | |
| 22 | Buku Wisuda _ Ubah | belum diuji | |
| 23 | Dasbor _ Desktop 1440 | sesuai komposisi (fixture) | 1440/390 light/dark; tambahan 1024/820/768/320 tanpa overflow. Data fiktif, tanpa jam/tanggal palsu; lihat Task 4. |
| 24 | Data Lulusan _ Daftar | belum diuji | |
| 25 | Data Lulusan _ Tambah | belum diuji | |
| 26 | Data Lulusan _ Ubah | belum diuji | |
| 27 | Dokumen Akademik _ Daftar | belum diuji | |
| 28 | Dokumen Akademik _ Tambah | belum diuji | |
| 29 | Dokumen Akademik _ Ubah | belum diuji | |
| 30 | Dokumen RPL _ Daftar | belum diuji | |
| 31 | Dokumen RPL _ Tambah | belum diuji | |
| 32 | Dokumen RPL _ Ubah | belum diuji | |
| 33 | Fakultas _ Daftar | belum diuji | |
| 34 | Fakultas _ Gagal hapus | belum diuji | |
| 35 | Fakultas _ Tambah | belum diuji | |
| 36 | Fakultas _ Ubah | belum diuji | |
| 37 | Kalender Akademik _ Daftar | belum diuji | |
| 38 | Kalender Akademik _ Kelola 2026-2027 | belum diuji | |
| 39 | Kalender Akademik _ Tambah | belum diuji | |
| 40 | Kategori _ Daftar | belum diuji | |
| 41 | Kategori _ Tambah | belum diuji | |
| 42 | Kategori _ Ubah | belum diuji | |
| 43 | Kurikulum _ Daftar | belum diuji | |
| 44 | Kurikulum _ Tambah | belum diuji | |
| 45 | Kurikulum _ Ubah | belum diuji | |
| 46 | Lembaga Akreditasi _ Daftar | belum diuji | |
| 47 | Lembaga Akreditasi _ Tambah | belum diuji | |
| 48 | Lembaga Akreditasi _ Ubah | belum diuji | |
| 49 | Pengaturan Situs _ Ubah | belum diuji | |
| 50 | Pengumuman _ Daftar | belum diuji | |
| 51 | Pengumuman _ Hasil kosong | belum diuji | |
| 52 | Pengumuman _ Konfirmasi hapus | belum diuji | |
| 53 | Pengumuman _ Pilih massal | belum diuji | |
| 54 | Pengumuman _ Tambah — gagal validasi | belum diuji | |
| 55 | Pengumuman _ Tambah | belum diuji | |
| 56 | Pengumuman _ Ubah | belum diuji | |
| 57 | Pimpinan & Staf _ Daftar | belum diuji | |
| 58 | Pimpinan & Staf _ Tambah | belum diuji | |
| 59 | Pimpinan & Staf _ Ubah | belum diuji | |
| 60 | Profil Bidang _ Ubah | belum diuji | |
| 61 | Profil Saya _ Ringkasan | belum diuji | |
| 62 | Profil Saya _ Ubah password | belum diuji | |
| 63 | Profil Saya _ Ubah profil | belum diuji | |
| 64 | Program Studi _ Daftar | belum diuji | |
| 65 | Program Studi _ Tambah | belum diuji | |
| 66 | Program Studi _ Ubah | belum diuji | |
| 67 | Unit _ Daftar | belum diuji | |
| 68 | Unit _ Tambah | belum diuji | |
| 69 | Unit _ Ubah | belum diuji | |
