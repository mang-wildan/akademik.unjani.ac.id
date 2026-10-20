# Verifikasi F4-06 — 20 Oktober 2026

Status: **Akun Pengguna selesai dan terverifikasi lokal**. Deploy masuk F4-09.

- Daftar memakai layout v2, komponen `_ui`, pencarian literal nama/email,
  filter peran/status, sorting yang diizinkan, dan paginasi 25 akun.
- Tambah/ubah memakai slide-over dengan dirty guard, Ctrl+S, ringkasan error,
  respons validasi 422 dan JSON saat simpan partial; tanpa JS membuka form penuh.
- Bulk hanya Nonaktifkan. Server menolak aksi lain, membatasi 500 akun,
  memakai filter daftar yang sama, mengecualikan akun login pada scope selected
  maupun filter, dan melaporkan jumlah yang dilewati. Tidak ada bulk hapus.
- Reset password memakai halaman penuh v2, validasi konfirmasi, dirty guard,
  dan Ctrl+S. Password/hash tidak ditampilkan kembali. Penyimpanan tetap melalui
  `User.save()` dan hook bcrypt yang sudah ada.
- Penghapusan satuan tetap tersedia dengan konfirmasi; akun sendiri tidak
  dapat dihapus. Proteksi Super Admin terakhir tetap berlaku dan menghitung
  peran lama `admin`. Form memetakan peran lama ke Super Admin serta menjaga
  checkbox nonaktif setelah respons 422.
- Seluruh rute memakai guard Super Admin dan CSP ketat; editor ditolak,
  termasuk bulk dan reset password. `/bulk` terdaftar sebelum `/:id`.

## Hasil pemeriksaan

- `npm run build`: lulus.
- `npm test -- --test-concurrency=1`: **224 lulus, 0 gagal**, termasuk enam
  tes route/template akun dan regresi bulk pada `test/bulk.test.js`.
- Tes integrasi memakai route, middleware dan EJS nyata dengan database
  tiruan; belum menguji penyimpanan/hash password terhadap MongoDB nyata.
- Chrome 375/1440 px, terang/gelap: daftar dan panel tanpa overflow;
  panel selebar viewport HP dan 560 px pada desktop. Screenshot diperiksa.
- Keyboard: tambah/ubah melalui panel, error 422, Ctrl+S, refresh daftar,
  serta bulk yang melewati akun sendiri lulus.
- Reset password: konfirmasi berbeda ditolak, simpan valid lulus.
- Tanpa JS: tambah, ubah, reset password, dan hapus satuan lulus.
- Console pemeriksaan fungsional bersih selain 422 yang sengaja diuji.
- Browser sempat timeout/berhenti pada mesin yang memori bebasnya rendah;
  pemeriksaan visual dan fungsional diselesaikan dalam proses terpisah.
- `admin.css`: **38.884 byte**; `app.css`: **74.755 byte**. CSS publik mengecil.
- Pemeriksaan whitespace diff modul lulus.

Skrip lokal: `backups/f4-06/check-browser.cjs` (visual) dan
`backups/f4-06/check-functional.cjs` (fungsional). Screenshot visual:
`C:/Users/unjani2/AppData/Local/Temp/f4-06-chrome-VXpewy`.

Belum dilakukan: deploy, uji penerimaan staf, commit/push. Server dev tidak
diubah oleh pekerjaan ini.
