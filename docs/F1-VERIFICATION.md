# Verifikasi fase F1 — 19 Oktober 2026

## Hasil lokal

| Daftar periksa | Pengumuman | Kategori |
|---|---|---|
| Layout v2, parser daftar, validasi 422, sukses partial JSON | Lulus | Lulus |
| CSP ketat dan route bulk sebelum `/:id` | Lulus | Lulus |
| View memakai komponen `_ui` | Lulus | Lulus |
| Bulk sesuai FR-ADM-33 | Terbitkan, draf, hapus | Aktifkan, nonaktifkan, hapus |
| Batas 500 dan filter disaring ulang | Lulus | Lulus |
| Hapus file terkait | Lampiran, sampul, thumbnail diuji | Tidak memiliki upload |
| Chrome 375px/1440px, terang/gelap | Lulus | Lulus |
| Keyboard: pilih, bulk, form, error, simpan | Lulus | Lulus |
| JavaScript dimatikan: lihat, tambah, ubah, hapus | Lulus | Lulus |
| Console | Bersih, kecuali respons 422 yang sengaja diuji | Bersih, kecuali respons 422 yang sengaja diuji |

Kategori juga lulus pengujian URL panel langsung, jenis pada form tambah,
pemulihan fokus, pemuatan ulang daftar setelah simpan, dan buang perubahan.
Guard superadmin diuji pada daftar, form partial, seluruh mutasi, dan bulk.
Berita tetap memakai layout v1.

Tes browser lokal memakai Chrome headless dengan route, middleware, template,
Alpine, CSS, dan POST asli; hanya model basis data yang diganti. Tes penghapusan
upload memakai file sementara. Bukti otomatis terdapat pada
`test/adminPengumuman.test.js`, `test/adminKategori.test.js`, dan
`test/slideOver.test.js`, bersama tes fondasi admin lainnya.

- `npm test -- --test-concurrency=1`: **171 lulus, 0 gagal**.
- `npm run build`: **lulus**, dengan `RAYON_NUM_THREADS=1` dan `UV_THREADPOOL_SIZE=1`.
- Pembatasan proses/thread hanya untuk mengatasi kehabisan memori mesin lokal;
  konfigurasi proyek tidak diubah.
- CSS admin hasil build: **40.132 byte**, di bawah batas 60 KB.

## Deploy dev-akademik

Status: **terdeploy dan terverifikasi** pada 19 Oktober 2026.

- Target: `/www/wwwroot/dev-akademik.unjani.ac.id`, proses PM2 `dev-akademik`.
- Node server: 24.12.0. Hash lockfile server sama dengan lokal.
- Rilis: `f1-20261019-213016`, snapshot working tree dari HEAD `3caf4ea`.
- `.env` server dipertahankan; tidak masuk arsip rilis.
- Upload dipertahankan sebagai penyimpanan bersama di luar direktori rilis.
- Rilis lama disimpan saat pertukaran direktori atomik; jika pemeriksaan setelah
  aktivasi gagal, tukar kembali direktori dan restart hanya `dev-akademik`.
- Tidak ada migrasi skema atau perubahan data aplikasi dalam deploy ini.

Arsip rilis memiliki SHA-256:
`4e00523f763c1b5dd26207a51e1f6a2667031cc0b11ca141e0c24c8768fa31b7`.

`node --test --test-concurrency=1` pada Node 24.12.0 server, sebagai user `www`:
**171 lulus, 0 gagal**. Rilis baru diuji pada port sementara sebelum aktivasi,
lalu direktori ditukar atomik dan hanya proses PM2 `dev-akademik` di-restart.
Proses kembali online sebagai user `www`; tidak ada tambahan byte pada log error.

Pemeriksaan sebelum dan sesudah aktivasi: halaman publik/login, aset beserta
hashnya, daftar admin dengan autentikasi, form partial, validasi 422, dan
penolakan bulk invalid. Pengujian server tidak membuat atau menghapus data.

Semua pemeriksaan tersebut lulus pada rilis staging, rilis aktif melalui HTTP
lokal, dan rilis aktif melalui `https://dev-akademik.unjani.ac.id`. Pengujian
memakai MongoDB sebenarnya dan token singkat dari akun superadmin aktif yang
sudah ada; tidak mengubah akun atau menyimpan token dalam laporan/arsip.

## Pemulihan

Rilis sebelumnya berada di:
`/www/wwwroot/.dev-akademik-f1-20261019-213016`.

Rollback dari SSH root, jika diperlukan:

```sh
python3 /root/deployments/dev-akademik/f1-20261019-213016/atomic-swap.py /www/wwwroot/dev-akademik.unjani.ac.id /www/wwwroot/.dev-akademik-f1-20261019-213016
pm2 restart dev-akademik
curl --fail --silent --output /dev/null https://dev-akademik.unjani.ac.id/login
```

Pertukaran direktori atomik telah diuji pada filesystem yang sama. Folder
upload tetap `/www/wwwroot/.dev-akademik-shared/uploads` untuk kedua rilis.
Rollback tidak dijalankan setelah deploy karena seluruh pemeriksaan lulus.

Uji penerimaan oleh staf belum dilakukan. Fase F2 tetap menunggu staf mencoba
rilis ini sesuai urutan fase pada `TODO.md`.
