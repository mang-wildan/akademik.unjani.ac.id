# Verifikasi fase F3 — 19 Oktober 2026

Status: **F3-01 sampai F3-09 selesai dan terdeploy** di
https://dev-akademik.unjani.ac.id.

## Perubahan

- Dokumen Akademik, RPL, Akreditasi, Lembaga Akreditasi, Buku Wisuda, dan Data
  Lulusan memakai slide-over. Buku Wisuda cukup ringkas (judul, periode, tahun,
  PDF, sampul), sehingga mengikuti pola Buku F2.
- Kurikulum dan Kalender Akademik memakai halaman penuh. Kalender tetap
  mengelola kegiatan, impor CSV pengganti seluruh kegiatan, serta lampiran
  PDF. Konfirmasi penggantian berupa checkbox wajib juga bekerja tanpa JS.
- Semua daftar memakai layout v2, komponen `_ui`, pencarian literal,
  paginasi, pengurutan yang diizinkan, dan bulk hapus. RPL memakai boolean
  `status` untuk aktif/arsip; akreditasi memakai `isActive` untuk aktif/nonaktif.
- Filter prodi/tahun Lulusan dan prodi Kurikulum disaring berdasarkan master.
  Pencarian nama referensi dan filter masa berlaku akreditasi memakai query
  yang sama pada daftar dan bulk seluruh hasil filter. Batas hari mengikuti WIB.
- Hapus tunggal/massal membersihkan PDF, sampul lama, dan lampiran Kalender.
  Penggantian file membersihkan file lama setelah penyimpanan berhasil;
  upload baru dibersihkan ketika validasi atau penyimpanan gagal.
- Form mengembalikan 422 saat validasi gagal dan JSON pada penyimpanan partial.
  Router menerapkan CSP ketat dan menempatkan `/bulk` sebelum `/:id`.
  Lembaga Akreditasi tetap khusus superadmin.
- Tanggal pada form ubah akreditasi dinormalisasi menurut WIB agar tanggal
  yang tersimpan pada tengah malam WIB tidak mundur satu hari karena UTC.

## Pemeriksaan

- `npm test -- --test-concurrency=1`: **201 lulus, 0 gagal**, termasuk 18 tes
  integrasi F3 dengan route, middleware, template, dan upload sebenarnya.
- `npm run build`: lulus. Pembatasan thread sementara hanya berlaku pada
  perintah lokal karena keterbatasan memori mesin.
- `admin.css`: **39.433 byte**, di bawah 60 KB. `app.css`: **74.981 byte**,
  turun dari 75.238 byte pada F2. Template publik tidak diubah.
- Chrome 375px/1440px, terang/gelap: delapan daftar, form/panel, dan halaman
  Kalender bertingkat lulus tanpa overflow horizontal.
- Keyboard: seleksi, bulk aktif/nonaktif, konfirmasi bulk hapus, buka form,
  validasi 422, pilih ulang file, Ctrl+S, penyegaran daftar. Bulk hapus nyata
  diperiksa untuk kedelapan modul.
- JS dimatikan: lihat/tambah/ubah/hapus kedelapan modul, upload PDF/sampul,
  tambah kegiatan/lampiran Kalender, impor pengganti kegiatan, dan impor
  Lulusan lulus. Console bersih selain respons 422 yang sengaja diuji.
- Tes mencakup batas empat sematan, duplikasi Kurikulum, status boolean,
  pencarian referensi, tanggal WIB, file pengganti, file terhapus, impor tidak
  valid tanpa perubahan data, serta penolakan akses Lembaga bagi editor.

Browser memakai database tiruan; route, EJS, CSS, Alpine, form POST dan file
benar-benar dijalankan. Pemilihan file native diisi melalui CDP. Skenario
lokal ada di `backups/f3-20261019-223300/check-browser.cjs`; screenshot di
`C:/Users/unjani2/AppData/Local/Temp/f3-chrome-3Zk5mT`.

## Deploy

- Rilis aktif: `f3-20261019-223300 working-tree HEAD 3caf4ea`.
- Node server 24.12.0: **201 tes lulus** sebagai user `www` di staging.
- SHA arsip diperiksa; dependensi sama dengan rilis sebelumnya. `.env`
  privat tetap mode 600; unggahan memakai direktori bersama yang sama.
- Aktivasi memakai atomic directory exchange dan restart hanya PM2
  `dev-akademik` (id 7), PID setelah deploy **3878550**.
- Pemeriksaan staging, HTTP lokal aktif, dan HTTPS publik lulus: halaman
  publik terkait, dasbor, semua daftar/form F3 dengan data dev nyata,
  partial, validasi 422, bulk tidak valid, hash aset, serta tanggal WIB pada
  form akreditasi. Jumlah record database sebelum/sesudah identik.
- Error log baru setelah aktivasi: **0 byte**.
- Rilis sebelumnya: `/www/wwwroot/.dev-akademik-f3-20261019-223300`.
  Salinan F2 tetap ada di `/www/wwwroot/.dev-akademik-f3-20261019-222800`.
  Helper swap disimpan di
  `/root/deployments/dev-akademik/f3-20261019-223300/atomic-swap.py`.
  Bila perlu rollback, tukar direktori live dengan direktori rilis sebelumnya
  memakai helper tersebut, lalu restart hanya `dev-akademik`.

Uji penerimaan staf belum dilakukan. Tidak ada akun editor aktif di database
dev untuk smoke test server; otorisasi editor diperiksa dengan fixture.
Commit dan push tidak dilakukan.
