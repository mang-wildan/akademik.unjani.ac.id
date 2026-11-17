# Audit visual Task 9 Step 2 — 2026-11-17

Audit membandingkan PNG acuan dengan browser Chromium 1440×1000, bukan pengujian pixel-identical. Data/akun fiktif; route, middleware, CSP dan EJS aplikasi dipakai dengan DB fixture in-memory. Tidak membuktikan login/persistensi MongoDB atau deployment produksi.

## Laporan

- [Publikasi — 18 frame](publication.md), termasuk addendum dialog bulk, toast pasca-POST dan penolakan upload.
- [Akademik — 24 frame](academic.md), termasuk klarifikasi viewport scrolled dan histori field Aktif.
- [Organisasi — 17 frame](organization.md), termasuk klarifikasi viewport scrolled dan sidebar.
- [Dasbor/sistem/profil — 10 frame](system.md), termasuk selisih kolom akun, grouping pengaturan dan ringkasan profil.

Laporan mempertahankan observasi run pertama sebagai histori; addendum/koreksi terakhir mengesampingkan observasi yang sudah diklarifikasi. Jalur temp/log adalah provenance sesi, bukan bukti portabel. Screenshot runtime Task 4–8 sudah tersedia di `../../screenshots/`; screenshot tambahan Step 2 disalin dengan prefix `task-9-step2-`. Matriks final berada di `../../verification.md`.

## Interpretasi

- **Adaptasi**: perubahan eksplisit mengikuti kontrak aplikasi/desain web, bukan klaim sama persis.
- **Beda**: selisih struktur, metadata, aksi atau hasil state masih ada; jangan dibaca PASS.
- Inter menggantikan Swis721; data, jumlah, tanggal dan opsi berasal fixture, bukan salinan contoh PNG.
- Toast tanpa undo, Cari menu, native select/upload, dark dan slide-over mempertahankan perilaku existing.
- Full-page capture dapat menggambar bar fixed melintasi konten. Cek viewport scrolled akademik/organisasi membuktikan field terakhir bisa terlihat di atas bar; bukan bug occlusion yang terkonfirmasi.
- Fakultas gagal hapus hanya failure injection. Guard relasi backend tidak ada; bukan bukti relasi terlindungi.
- Upload publikasi invalid ditolak multipart sebelum summary title/body. Halaman stack pada dua screenshot `invalid-upload` berasal error handler fixture, bukan produksi; summary tiga error pada acuan tidak direproduksi.
