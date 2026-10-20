# Verifikasi F4-01 sampai F4-04 — 20 Oktober 2026

Status: **selesai dan terverifikasi lokal**. Deploy termasuk F4-09, di luar
empat tugas ini.

## Perubahan

- F4-01: Profil Bidang memakai layout v2 dan form halaman penuh, ringkasan
  kesalahan, dirty guard, Ctrl+S, serta bilah Simpan/Batal. Dokumen singleton
  dan konversi satu baris menjadi satu butir misi/tugas/fungsi dipertahankan.
  Validasi gagal mengembalikan 422; simpan partial mengembalikan JSON.
- F4-02: Pimpinan & Staf memakai daftar v2, filter tingkat, pencarian,
  pengurutan, paginasi, slide-over, dan bulk hapus. Urutan bawaan dihitung
  dari hierarki jabatan **sebelum** paginasi; tingkat lama yang kosong/tidak
  dikenal mengikuti anggota. NIP/NID tetap internal; controller publik
  beserta proyeksi datanya tidak diubah.
- F4-03: Unit memakai daftar v2, slide-over dan bulk hapus. Gambar tetap
  dikonversi ke WebP maksimal 900 px beserta thumbnail. Upload WebP kini
  diterima sesuai format yang ditawarkan form. File baru dibersihkan ketika
  penyimpanan gagal; penggantian, hapus tunggal, dan bulk membersihkan file
  terkait beserta thumbnail.
- F4-04: Fakultas memakai daftar v2, slide-over, dan bulk hapus melalui
  factory master yang sama dengan Lembaga Akreditasi. Sorting bawaan Fakultas
  menurut nama; Lembaga tetap menurut urutan. Validasi duplikasi singkatan
  dipertahankan. Akses tetap superadmin, termasuk endpoint bulk; alias peran
  lama `admin` tetap mengikuti kebijakan `utils/roles.js` yang sudah ada.
- Semua router terkait menerapkan CSP ketat. Endpoint bulk terdaftar sebelum
  `/:id`. Form upload tetap multipart dan tautan biasa tetap bekerja tanpa JS.

## Hasil pemeriksaan

- `npm test -- --test-concurrency=1`: **212 lulus, 0 gagal**, termasuk 11 tes
  integrasi baru untuk empat modul, dengan route/middleware/EJS sebenarnya
  serta database tiruan.
- `npm run build`: lulus. Pembatasan thread hanya digunakan pada perintah
  lokal; konfigurasi aplikasi tidak berubah.
- `admin.css`: **39.213 byte**, di bawah batas 60 KB.
- `app.css`: **74.879 byte**, turun dari 74.981 byte pada F3. View yang sudah
  dimigrasikan dikecualikan dari pemindaian CSS publik.
- Hierarki staf melintasi batas 25 baris, tingkat lama kosong, filter tingkat,
  sorting eksplisit, serta cakupan bulk diuji.
- Upload foto, retensi file saat edit tanpa file baru, penggantian, hapus
  satuan/massal, konversi Unit, thumbnail, kegagalan penyimpanan, dan input
  WebP diuji memakai berkas nyata. Tes membaca metadata gambar melalui buffer
  agar pemeriksaan tidak meninggalkan file terkunci di Windows.
- Editor ditolak pada daftar/form/create/delete/bulk Fakultas. Input bulk
  yang tidak diizinkan dan duplikasi singkatan ditolak.
- Chrome: 375 px/1440 px, terang/gelap, Profil serta tiga daftar dan panel
  lulus. Panel 560 px di desktop dan selebar viewport di HP, tanpa overflow.
- Keyboard: seleksi, konfirmasi bulk hapus, buka form, error 422, pilih ulang
  file, Ctrl+S, penyegaran daftar, ubah, dan pemeriksaan dirty guard setelah
  simpan lulus.
- Tanpa JS: CRUD tiga modul daftar beserta upload dan konfirmasi hapus
  lulus. Profil dapat disimpan dan daftar butir tetap dikonversi ke array.
- Console bersih selain respons 422 yang sengaja diuji. Diff modul tidak
  memiliki kesalahan whitespace.

Skenario browser memakai database tiruan; form POST, EJS, Alpine, CSS, dan
pengolahan gambar benar-benar dijalankan. Pemilihan file native diisi lewat
CDP. Skrip lokal: `backups/f4-01-04/check-browser.cjs`. Screenshot:
`C:/Users/unjani2/AppData/Local/Temp/f4-chrome-HwkNMm`.

F4-05 sampai F4-09, deploy server, uji penerimaan staf, serta commit/push belum
dilakukan. Server dev tidak diubah oleh pekerjaan ini.
