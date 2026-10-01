# Laporan Migrasi Data F2

Hasil `npm run migrate` (dry-run) pada database salinan `dbBAAUnjani`, 1 Oktober 2026. **Belum ada data yang diubah.**

Migrasi hanya **mengisi field baru** dari data lama. Field lama tidak dihapus dan tanggal tidak pernah diubah. Sebelum setiap perubahan, data aslinya disimpan ke `backups/`. Migrasi aman dijalankan berulang dan tidak menimpa isian yang sudah diubah manual lewat admin.

## Yang akan diubah otomatis

| Migrasi | Perubahan |
|---|---|
| 001 | Akun `akademik@unjani.ac.id`: role `admin` → `superadmin` |
| 002 | Data master baru: 5 kategori pengumuman, 5 kategori dokumen, 7 lembaga akreditasi |
| 003 | 5 data akreditasi: peringkat dipilih dari daftar tetap, jenis (institusi/prodi/lainnya), tautan ke program studi; lembaga BAN-PT untuk 2 data institusi |
| 004 | Kurikulum "Teknik Kimia" ditautkan ke program studi Teknik Kimia S1 |
| 005 | Ringkasan teks untuk 13 berita dan 8 pengumuman (semuanya draft uji) |
| 006 | Ukuran file untuk 3 dokumen (518 KB, 1,9 MB, 134 KB). Tidak ada file yang hilang |

Data master yang ditambahkan:
- **Kategori pengumuman:** Akademik Umum, Perkuliahan, Ujian, Wisuda, Administrasi
- **Kategori dokumen:** Formulir, Pedoman, Peraturan, Surat Keputusan, Surat Edaran
- **Lembaga:** BAN-PT, LAM-PTKes, LAMEMBA, LAM INFOKOM, LAM Teknik, LAMDIK, Perpusnas

Lembaga lain (misalnya LAM untuk bidang sosial/hukum) bisa ditambahkan admin di menu Data Master (F4).

## Perlu ditinjau oleh tim Bidang Akademik

Hal-hal berikut **tidak diubah otomatis**, karena hanya dokumen aslinya yang bisa memastikan mana yang benar.

### 1. Akreditasi institusi kemungkinan tertukar (prioritas)

| Data | Peringkat | Tahun | Berlaku | Ditampilkan publik |
|---|---|---|---|---|
| Institusi / Universitas | Unggul | 2025 | 11 Feb 2021 – 11 Feb 2026 (**kedaluwarsa**) | Ya |
| Institusi / Universitas | B | 2021 | 28 Des 2021 – 28 Des 2026 (masih berlaku) | Tidak |

Kolom "Tahun 2025" pada data Unggul tidak cocok dengan tanggal berlakunya, yang dimulai 2021. Kemungkinan tanggal di data Unggul salah ketik dan seharusnya berlaku 2025–2030. **Cek sertifikat Unggul, lalu perbaiki tanggalnya di admin.**

### 2. Akreditasi lain

| Data | Masalah |
|---|---|
| Teknik Elektro S1 (B) | Kedaluwarsa sejak 22 Apr 2026 tetapi masih ditandai aktif; lembaga dan nomor SK kosong |
| Teknik Sipil S1 (B) | Kedaluwarsa sejak 13 Mar 2026 tetapi masih ditandai aktif; lembaga dan nomor SK kosong |
| Perpustakaan Universitas (A) | Kedaluwarsa sejak 28 Jul 2026; kolom tahun (2024) ≠ tahun mulai berlaku (2021); lembaga dan nomor SK kosong |
| Semua (5 data) | Nomor SK belum diisi |

Lembaga untuk prodi tidak ditebak, karena sertifikat 2021 bisa dari BAN-PT atau LAM, tergantung waktu dan bidangnya.

### 3. Konten yang harus disiapkan sebelum halaman baru dirilis (F3)

- [ ] **Kalender 2025/2026** belum punya kegiatan per baris. **Kalender 2026/2027** (tahun berjalan) belum ada sama sekali.
- [ ] **Pimpinan & Staf** kosong.
- [ ] **Belum ada berita dan pengumuman yang terbit**, karena semua konten lama adalah data uji.
- [ ] **Dokumen "Formulir Pembuatan Ijazah"** perlu diberi kategori (dipilih di form F4).
- [ ] **Jam layanan** di Pengaturan Situs belum diisi; footer memakai teks bawaan "Senin–Jumat, 08.00–15.30 WIB".

### 4. Catatan kecil

Tiga konten uji yang sudah berstatus draft menyimpan tag dalam format JSON mentah, misalnya `[{"value":"unjani"}`. Ini tidak perlu ditindaklanjuti, karena kontennya sendiri nanti dihapus.

## Langkah berikutnya

1. Tinjau bagian 1 dan 2 di atas.
2. Jalankan `npm run migrate -- --apply` di database salinan.
3. Saat rilis (F6), jalankan dry-run lalu `--apply` di database produksi; laporannya mungkin berbeda.
