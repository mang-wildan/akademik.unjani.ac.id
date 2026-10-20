# Verifikasi fase F2 — 19 Oktober 2026

## Lingkup

- F2-01: menu mengikuti SPEC §5, termasuk Kategori, Lembaga Akreditasi, dan Akun
  Pengguna. Tes membaca registrasi router dan guard sebenarnya agar modul baru
  yang tidak masuk menu atau salah batas peran membuat tes gagal. Pencarian
  modul memakai menu yang sudah disaring menurut peran, mendukung `/`, Enter,
  Escape, dan hasil kosong.
- F2-02: dasbor memakai layout v2. Query akreditasi dibatasi sampai akhir hari
  ke-90 WIB, statistik kedaluwarsa memakai awal hari WIB. Pengumuman tersemat
  berusia >30 hari ditentukan dari `createdAt`, lalu lima draf terbaru digabung
  dari Berita/Pengumuman. Urutan: perhatian, buat cepat, draf, statistik,
  aktivitas. Pemeriksaan lama tetap tersedia; tautan pengaturan hanya untuk
  superadmin.
- F2-03: Berita memakai komponen v2 bersama Pengumuman. Bulk terbit tetap
  mewajibkan gambar sampul; baris tanpa sampul dilaporkan gagal. Hapus tunggal
  dan massal membersihkan PDF, sampul, dan thumbnail.
- F2-04: Buku tetap slide-over: judul, tahun opsional, PDF, dan sampul. Upload
  multipart, validasi 422, penggantian berkas setelah simpan, dan bulk hapus
  dengan pembersihan PDF/sampul diuji.
- Perbaikan regresi: `change` yang muncul saat penutupan panel mengembalikan
  fokus tidak lagi menandai panel yang sudah disimpan sebagai kotor. Ini diuji
  lewat `Ctrl+S`, penyegaran daftar, lalu navigasi ke modul lain.

## Verifikasi lokal

- `npm test -- --test-concurrency=1`: **183 lulus, 0 gagal**.
- `npm run build`: lulus; pembatasan thread sementara mengikuti verifikasi F1
  karena memori mesin lokal terbatas. Tidak mengubah konfigurasi proyek.
- `admin.css`: **40.159 byte**, di bawah batas 60 KB.
- `app.css`: **75.238 byte**, turun dari 80.380 byte pada rilis F1. Sumber v2
  dikecualikan dari pemindaian bundel publik; template publik tidak diubah.
- Chrome 375px/1440px, terang/gelap: dasbor, pencarian, daftar/form Berita,
  daftar/panel Buku lulus; tidak ada overflow horizontal.
- Keyboard: pencarian → Enter, bulk, form, validasi 422, upload, simpan,
  penyegaran daftar, ubah. Kontrol pemilihan file native diisi lewat CDP.
- Tanpa JavaScript: lihat, tambah dengan upload, ubah, hapus pada Berita/Buku
  lulus. Console bersih selain respons 422 yang sengaja diuji.
- Regresi Kategori F1: dua ukuran/tema, keyboard, dirty guard, URL panel, dan
  CRUD tanpa JavaScript diulang dan lulus.

Browser memakai route, middleware, template, Alpine, CSS, dan POST asli dengan
model basis data tiruan. Tes unit upload memakai file sementara dan konversi
gambar sebenarnya. Skenario dapat diulang dari skrip lokal di
`backups/f2-20261019-215050/`; skrip tersebut tidak masuk arsip rilis.

## Deploy

Status: **terdeploy dan terverifikasi**, 19 Oktober 2026.

- Rilis: `f2-20261019-215050`, snapshot working tree.
- Target: `/www/wwwroot/dev-akademik.unjani.ac.id`, PM2 `dev-akademik`.
- Upload bersama: `/www/wwwroot/.dev-akademik-shared/uploads`.
- `.env` dan dependensi server dipertahankan; tidak ada migrasi skema/data.
- Staging diuji sebelum pertukaran direktori atomik. Rilis F1 disimpan di
  `/www/wwwroot/.dev-akademik-f2-20261019-215050` setelah aktivasi untuk rollback.
- Pemeriksaan server memakai MongoDB sebenarnya dan akun aktif yang sudah ada;
  hanya baca, validasi form invalid, dan penolakan bulk invalid. Tidak membuat
  atau menghapus data aplikasi.

Arsip rilis SHA-256:
`abdb7cc95d1ebd0df349857f1fcbc6904b4dfb61d32b5226f3602a9166feda23`.

Pada server Node 24.12.0 sebagai user `www`, seluruh **183 tes lulus**.
Staging, HTTP lokal setelah aktivasi, dan HTTPS publik semuanya lulus untuk
dasbor, menu/pencarian, Berita/Buku v2, Pengumuman/Kategori, form partial,
validasi 422, penolakan bulk invalid, dan hash seluruh aset pada manifest.
Jumlah record sebelum/sesudah pemeriksaan tetap sama. PM2 `dev-akademik`
kembali online dan tidak ada tambahan byte pada log error.

Server tidak memiliki akun editor aktif untuk pemeriksaan autentikasi langsung.
Pembatasan editor tetap diuji pada guard/menu dan browser dengan model tiruan;
pengujian server memakai akun superadmin aktif yang sudah ada.

## Rollback

Rilis F1 dipertahankan di `/www/wwwroot/.dev-akademik-f2-20261019-215050`.
Jika perlu, dari SSH root:

```sh
python3 /root/deployments/dev-akademik/f2-20261019-215050/atomic-swap.py /www/wwwroot/dev-akademik.unjani.ac.id /www/wwwroot/.dev-akademik-f2-20261019-215050
pm2 restart dev-akademik
curl --fail --silent --output /dev/null https://dev-akademik.unjani.ac.id/login
```

Pertukaran atomik telah diuji pada filesystem yang sama sebelum aktivasi.
Rollback setelah aktivasi tidak dijalankan karena seluruh pemeriksaan lulus.

Uji penerimaan staf setelah deploy belum dilakukan.
