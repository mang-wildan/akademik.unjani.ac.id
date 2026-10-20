# Deploy F5 — 20 Oktober 2026

Status: **aktif** di https://dev-akademik.unjani.ac.id.
Rilis: `f5-20261020-01 working-tree HEAD 3caf4ea`.

- Rilis mencakup workspace F5 terkini, termasuk hasil audit F5-03 dan
  pembaruan arsitektur F5-04 yang sudah tercatat di TODO.
- Build terbaru lulus; **235 tes lulus, 0 gagal** secara lokal dan pada
  staging server sebagai user `www` dengan Node 24.12.0.
- SHA-256 arsip:
  `88a8929544758ef9cc6274f39894a5b6acea0f9296991243b7d4abf2c4984dcf`.
  Arsip tidak menyertakan `.env`, dependency lokal, upload, atau backup.
- Package-lock sesuai server; dependency yang ada dipakai kembali.
  `.env` tetap mode 600 milik `www`, dan upload tetap berada pada lokasi
  bersama `/www/wwwroot/.dev-akademik-shared/uploads`.
- Audit hanya-baca `scripts/audit/upload-paths.js` pada database dev:
  **0 record dengan lokasi berkas di luar cakupan modul** pada delapan model
  yang diperiksa.
- Smoke staging dan aktif melalui HTTP lokal serta HTTPS publik lulus:
  halaman publik, dashboard, daftar/form seluruh modul, CSP terpusat,
  partial, validasi 422, penolakan bulk invalid, dan pengecualian akun sendiri.
  CSP juga diperiksa pada redirect tanpa login, 404, dan penolakan Origin
  lintas situs (403). Layout/komponen lama sudah tidak ada.
- Hash seluruh aset sesuai manifest. CSS publik 69.181 byte; CSS admin
  38.762 byte. Jumlah record sebelum/sesudah smoke sama.
- Hanya PM2 `dev-akademik` (id 7, user `www`) yang direstart; PID setelah
  deploy `3918375`. **Tambahan log error: 0 byte**.
- Tidak ada akun editor aktif di server untuk smoke peran editor;
  pengujiannya tercakup dalam tes dengan database tiruan.

Rollback: versi F4 sebelumnya tersimpan di
`/www/wwwroot/.dev-akademik-f5-20261020-01`. Tukar direktori tersebut dengan
`/www/wwwroot/dev-akademik.unjani.ac.id` memakai
`/root/deployments/dev-akademik/f5-20261020-01/atomic-swap.py`, lalu
`pm2 restart dev-akademik`. Upload bersama tetap sama. Skrip aktivasi memakai
rollback otomatis jika smoke setelah aktivasi gagal; pada deploy ini semua
pemeriksaan lulus.

Belum dilakukan: uji penerimaan staf, perubahan akun/password nyata di
server, commit/push.
