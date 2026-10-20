# Verifikasi F4-05 — 20 Oktober 2026

Status: **Program Studi selesai dan terverifikasi lokal**. Deploy tetap
bagian F4-09.

- Daftar memakai layout v2, komponen `_ui`, pencarian literal nama/singkatan,
  filter fakultas, sorting yang diizinkan, paginasi, dan bulk hapus.
- Form tambah/ubah memakai slide-over, ringkasan error, dirty guard, Ctrl+S,
  validasi 422, dan JSON saat simpan partial. Tautan biasa tetap berfungsi
  tanpa JavaScript. Fakultas yang tidak ada ditolak saat tambah/ubah.
- Router memakai CSP ketat dan tetap khusus superadmin, termasuk impor dan
  bulk. `/import` serta `/bulk` terdaftar sebelum `/:id`.
- Impor CSV tetap mencocokkan nama/singkatan fakultas dan melaporkan masalah
  per baris. Error impor merender daftar v2 dengan filter yang sama. Pencocokan
  duplikat meng-escape karakter regex; duplikat dalam file yang sama, input
  melebihi batas skema, fakultas tak dikenal, dan file tanpa baris data ditolak
  sebelum insert. File CSV sementara dibersihkan.
- `npm run build`: lulus. `npm test -- --test-concurrency=1`: **217 lulus,
  0 gagal**, termasuk lima tes integrasi Program Studi dengan route,
  middleware, template, dan upload nyata serta database tiruan.
- Pengujian penuh sempat gagal karena memori Windows habis. Pengulangan
  berurutan dengan pembatasan thread/heap sementara lulus; konfigurasi
  aplikasi tidak diubah.
- Chrome 375/1440 px, terang/gelap: daftar dan panel lulus tanpa overflow;
  panel selebar viewport di HP dan 560 px di desktop.
- Keyboard: seleksi, konfirmasi bulk hapus, form, error 422, Ctrl+S,
  penyegaran daftar, ubah, dan dirty guard sesudah simpan lulus.
- Tanpa JS: lihat/tambah/ubah/hapus, impor CSV, dan penolakan impor duplikat
  lulus. Console bersih selain 422 yang sengaja diuji.
- `admin.css`: **39.117 byte**; `app.css`: **74.879 byte**. CSS publik tidak
  bertambah. Pemeriksaan whitespace diff modul lulus.

Skrip browser lokal: `backups/f4-05/check-browser.cjs`. Screenshot:
`C:/Users/unjani2/AppData/Local/Temp/f4-05-chrome-1qW81w`.

Belum dilakukan: F4-06–F4-09, deploy server, uji penerimaan staf, commit/push.
Server dev tidak diubah oleh pekerjaan ini.
