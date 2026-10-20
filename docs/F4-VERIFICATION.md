# Verifikasi dan deploy F4 — 20 Oktober 2026

Status: **F4-01 sampai F4-09 selesai dan terdeploy** pada
https://dev-akademik.unjani.ac.id. Rilis: `f4-20261020-01 working-tree HEAD 3caf4ea`.

## F4-07 dan F4-08

- Pengaturan Situs memakai halaman penuh v2, komponen `_ui`, CSP ketat,
  dirty guard, ringkasan error 422, dan tombol Simpan/Batal yang tetap mudah
  dijangkau di HP. Field dan batas upload yang ada dipertahankan.
- Tautan cepat tetap dikelola lewat formulir terpisah. Galat membuka bagian
  formulirnya; hapus memakai dialog dengan fallback tanpa JavaScript.
  `siteSettingCache.invalidate()` tetap dijalankan setelah simpan pengaturan,
  tambah tautan, dan hapus tautan. Upload baru dibersihkan ketika validasi
  atau penyimpanan pengaturan gagal.
- Profil saya, ubah profil/foto, dan ubah password memakai layout v2 serta
  CSP ketat. Editor dapat mengelola profil sendiri tanpa mengubah peran/status.
  Upload tetap memeriksa tipe/ukuran/signature; password lama dan konfirmasi
  password baru tetap divalidasi. Password tidak dikirim balik saat galat.
- Ctrl+S mengirim formulir yang sedang difokuskan terlebih dahulu, sehingga
  formulir tautan cepat tidak mengirim pengaturan utama. Ditutup dengan tes
  regresi pintasan keyboard.

## Verifikasi

- `npm run build`: lulus; CSS publik **74.320 byte**, CSS admin **38.762 byte**
  (di bawah batas 60 KB). Public CSS mengecil dari tahap sebelumnya.
- `npm test -- --test-concurrency=1`: **230 lulus, 0 gagal** pada Windows lokal
  dan staging CentOS sebagai user `www`, Node 24.12.0.
- Enam tes route/template baru mencakup cache, guard superadmin, quick link,
  upload nyata/cleanup, profil editor, dan password. Database dalam tes ini
  memakai tiruan; hook bcrypt yang ada tidak diubah.
- Chrome 375/1440 px, terang/gelap: Pengaturan Situs, Profil saya, ubah profil,
  dan ubah password lulus pemeriksaan overflow; screenshot diperiksa.
- Keyboard: Ctrl+S pengaturan utama/tautan cepat, ringkasan error, dirty guard,
  ubah profil, penolakan password lama salah, dan simpan password valid lulus.
- Tanpa JS: simpan pengaturan, hapus tautan cepat, ubah profil dan password
  lulus. Console bersih selain 422 yang sengaja diuji.
- Verifikasi modul F4 sebelumnya tercatat pada
  [F4-01-04-VERIFICATION.md](F4-01-04-VERIFICATION.md),
  [F4-05-VERIFICATION.md](F4-05-VERIFICATION.md), dan
  [F4-06-VERIFICATION.md](F4-06-VERIFICATION.md).
- Pemeriksaan whitespace diff berkas yang diubah lulus.

Skrip lokal: `backups/f4-final/check-browser.cjs` dengan argumen `settings`
atau `profile`. Screenshot:
`C:/Users/unjani2/AppData/Local/Temp/f4-final-chrome-zTC9SY` dan
`C:/Users/unjani2/AppData/Local/Temp/f4-final-chrome-DHHN92`.

## Deploy dan rollback

- Paket mengecualikan `.env`, dependency lokal, upload, backup, dan alat AI.
  SHA-256 arsip: `fc74716930fbaf0580bfdb80ecfef28f81599ee2cdc92ad8859d89a60d4d94fe`.
- Staging memverifikasi hash dan package-lock, memakai dependency server yang
  sama, `.env` privat mode 600, serta symlink upload bersama.
- Smoke staging dan aktif (HTTP lokal + HTTPS publik) lulus menggunakan
  akun Super Admin yang sudah ada, JWT singkat dalam memori, dan MongoDB
  nyata. Halaman publik, dashboard, seluruh daftar/form modul migrasi,
  pengaturan, profil, reset password, CSP, partial, 422, bulk invalid,
  pengecualian akun sendiri dan hash aset diperiksa. Singleton dipastikan
  sudah ada sebelum GET agar smoke tidak membuat dokumen bawaan.
- Tidak ada record yang sengaja diubah oleh smoke; jumlah record sebelum
  dan sesudah sama. Tidak ada akun editor aktif di server, sehingga guard
  editor diverifikasi lewat tes lokal/staging dengan database tiruan.
- Aktivasi memakai pertukaran direktori atomik dan restart hanya PM2
  `dev-akademik` (id 7, user `www`). PID setelah deploy: `3908107`.
  Smoke aktif lulus; **tambahan log error: 0 byte**.
- Versi F3 sebelumnya tersimpan di
  `/www/wwwroot/.dev-akademik-f4-20261020-01`.
  Untuk rollback: tukar direktori tersebut dengan
  `/www/wwwroot/dev-akademik.unjani.ac.id` memakai
  `/root/deployments/dev-akademik/f4-20261020-01/atomic-swap.py`, lalu
  `pm2 restart dev-akademik`. Upload bersama tetap sama.

Belum dilakukan: uji penerimaan staf, perubahan akun/password nyata pada
server, commit/push. Pembersihan layout lama dan audit akhir tetap fase F5.
