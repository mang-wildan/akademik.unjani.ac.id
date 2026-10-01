# Software Requirements Specification
## Situs Bidang Akademik UNJANI — Desain Ulang

| | |
|---|---|
| Versi | 1.0 (draf untuk ditinjau) |
| Tanggal | 1 Oktober 2026 |
| Status | Menunggu persetujuan pemilik produk |
| Dokumen terkait | [AUDIT-UIUX.md](AUDIT-UIUX.md) · [PROMPT-STITCH.md](PROMPT-STITCH.md) · [Design/](Design/) · [PLAN.md](PLAN.md) · [TODO.md](TODO.md) |

Kata kunci prioritas mengikuti MoSCoW: **Wajib** (Must), **Sebaiknya** (Should), **Bisa** (Could), dan **Tidak sekarang** (Won't). Setiap kebutuhan diberi ID agar bisa dilacak sampai ke TODO dan temuan audit.

---

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini menetapkan kebutuhan untuk desain ulang menyeluruh situs Bidang Akademik Universitas Jenderal Achmad Yani: situs publik dan panel admin. Dasarnya adalah audit UI/UX tanggal 1 Oktober 2026 dan referensi desain Google Stitch di `docs/Design/`.

### 1.2 Lingkup
Sistem ini adalah **portal informasi akademik satu arah**. Bidang Akademik menerbitkan kalender, kurikulum, dokumen, akreditasi, pengumuman, berita, dan publikasi, lalu publik membaca dan mengunduhnya.

Sistem ini **bukan** sistem transaksi akademik. Tidak ada KRS, nilai, pembayaran, layanan permohonan, maupun login mahasiswa (lihat §8).

### 1.3 Masalah yang diselesaikan
Diringkas dari audit:
- Situs publik masih membawa konten template klub padel. Menu di HP rusak, dan konten uji coba ikut terbit.
- Data yang disajikan tidak bisa dipercaya: akreditasi kedaluwarsa tetap "Aktif", dan kalender hanya berupa gambar scan.
- Halaman berat (beranda 23,7 MB) dan respons server lambat (2–5 detik).
- Ada celah keamanan: registrasi bisa langsung menjadi admin, dan stack trace server bocor ke publik.

### 1.4 Definisi
| Istilah | Arti |
|---|---|
| Bidang Akademik | Unit pengelola situs dan nama resmi yang dipakai di seluruh UI (K-01). Singkatan "BAA" hanya muncul di nama domain |
| Admin | Pengguna panel admin |
| Konten | Berita, pengumuman, dokumen, dan entitas lain yang diterbitkan |
| Terbit / Draf / Terjadwal | Status publikasi konten |
| Peringkat | Hasil akreditasi: Unggul, Baik Sekali, Baik (BAN-PT/LAM), atau A, B, C (skema lama) |

---

## 2. Deskripsi Umum

### 2.1 Pengguna

| Kelompok | Kebutuhan utama | Perangkat dominan |
|---|---|---|
| Mahasiswa | Kalender akademik, formulir, pengumuman | HP |
| Calon mahasiswa & orang tua | Akreditasi, kurikulum, profil | HP |
| Dosen & tendik | Kalender, dokumen, peraturan | Desktop |
| Asesor akreditasi | Akreditasi, kurikulum, dokumen mutu | Desktop |
| Admin BAA | Mengelola semua konten | Desktop |

### 2.2 Role sistem

| Role | Hak akses | Prioritas |
|---|---|---|
| **Super Admin** | Semua hak, termasuk mengelola akun admin, pengaturan situs, dan master data | Wajib |
| **Editor** | Membuat, mengubah, menerbitkan, dan menghapus konten (berita, pengumuman, dokumen, kalender, akreditasi, kurikulum, buku, staf). **Tidak bisa** mengelola akun admin, Pengaturan Situs, maupun Master Data | Wajib *(K-02, diputuskan 1 Okt 2026)* |

**Role `user` (pengguna umum) dan registrasi publik dihapus.** Akun admin hanya dibuat oleh Super Admin. *(Asumsi A-01; lihat §10.)*

### 2.3 Lingkungan dan batasan desain

| Aspek | Keputusan |
|---|---|
| Runtime | Node.js LTS + **Express** (dipertahankan) |
| Template | **EJS**, dengan satu layout publik dan satu layout admin, plus partial komponen |
| CSS | **Tailwind CSS** yang di-build lewat CLI ke satu file statis, memakai token dari `docs/Design/.../DESIGN.md`. **Tidak memakai CDN Tailwind** di produksi |
| Interaksi | **Alpine.js** untuk filter, tab, dropdown, dan konfirmasi. **Tanpa jQuery** dan tanpa plugin template |
| Ikon | Material Symbols, sesuai referensi Stitch, di-subset atau di-self-host. Selalu `aria-hidden="true"` |
| Font | Plus Jakarta Sans, di-self-host |
| Database | MongoDB + Mongoose (dipertahankan) |
| Validasi | `zod` di semua input form |
| Gambar | `sharp`: resize, konversi ke WebP, dan thumbnail saat unggah |
| Dihapus | Template landing "Adelux" dan template admin beserta seluruh JS/CSS/JSON demonya di `public/assets` |

### 2.4 Asumsi
- **A-01.** Tidak ada pengguna non-admin yang login.
- **A-02.** Konten diisi oleh 1–5 orang tanpa alur persetujuan berjenjang. Status Draf → Terbit sudah cukup.
- **A-03.** Kalender akademik diinput per kegiatan (±32 baris per tahun ajaran), dan PDF SK tetap diunggah.
- **A-04.** Database pengembangan adalah salinan dari database lama dan terpisah dari produksi.
- **A-05.** Hosting tetap pada server Node.js yang sekarang. Domain: `baa.unjani.ac.id`.

---

## 3. Kebutuhan Fungsional — Situs Publik

### 3.1 Global

| ID | Kebutuhan | Prio | Audit |
|---|---|---|---|
| FR-G-01 | Header berisi logo lambang UNJANI (aset resmi, bukan ikon perisai generik), nama unit, menu: Beranda · Profil ▾ · Akademik ▾ (Kalender, Kurikulum, Dokumen, RPL) · Akreditasi · Publikasi ▾ (Berita, Pengumuman, Buku, Buku Wisuda), dan tombol pencarian | Wajib | 03 |
| FR-G-02 | Di HP, menu dibuka lewat satu tombol hamburger menjadi menu layar penuh berisi navigasi yang sama. Tidak ada sidebar atau menu lain | Wajib | 03 |
| FR-G-03 | Header publik **tidak** menampilkan tombol login atau ikon akun. Admin masuk lewat `/admin/login` | Wajib | 02 |
| FR-G-04 | Footer berisi alamat, telepon (`tel:`), email (`mailto:`), jam layanan, tautan cepat, dan media sosial. Semuanya diambil dari Pengaturan Situs; tautan sosial yang kosong disembunyikan | Wajib | 04 |
| FR-G-05 | Halaman 404 dan 500 ramah pengguna dengan tautan kembali dan kotak pencarian, tanpa detail teknis | Wajib | 02 |
| FR-G-06 | Pencarian global atas berita, pengumuman, dokumen, dan kurikulum, dengan hasil dikelompokkan per jenis | Sebaiknya | — |
| FR-G-07 | Breadcrumb di semua halaman dalam | Wajib | — |
| FR-G-08 | Setiap daftar punya tampilan kosong yang menjelaskan keadaan dan memberi aksi (mis. "Hapus pencarian") | Wajib | — |
| FR-G-09 | Bottom tab bar di HP (Beranda, Kalender, Dokumen, Pengumuman, Akreditasi), mengikuti referensi `beranda_mobile` | Bisa | — |

### 3.2 Beranda (`/`)

| ID | Kebutuhan | Prio | Audit |
|---|---|---|---|
| FR-B-01 | Hero ringkas berisi judul, subjudul, satu foto kampus **asli**, dan 4 akses cepat (Kalender, Dokumen & Formulir, Kurikulum, Akreditasi). Tanpa teks di atas foto | Wajib | 04 |
| FR-B-02 | Panel "Informasi Penting" berisi maksimal 3 konten yang disematkan, berupa baris teks dengan label kategori dan tanggal | Wajib | — |
| FR-B-03 | "Agenda Akademik Terdekat" berisi 4 kegiatan kalender berikutnya, diambil otomatis dari data kalender (§3.3), dengan status Sedang berlangsung atau Akan datang | Wajib | — |
| FR-B-04 | "Pengumuman Terbaru": 5 item dalam bentuk daftar teks dengan tanggal | Wajib | — |
| FR-B-05 | Kartu "Status Mutu Institusi" berisi peringkat institusi, lembaga, dan tanggal berlaku, dengan status yang dihitung otomatis, plus jumlah prodi per peringkat | Wajib | 06 |
| FR-B-06 | "Kegiatan Akademik": 3 berita terbaru, gambar di atas dan teks di bawah | Wajib | — |
| FR-B-07 | Statistik lulusan berupa 2–3 angka ringkas dengan format `id-ID` (mis. 6.289) | Sebaiknya | 12 |
| FR-B-08 | Bagian video profil hanya tampil bila URL video diisi dan valid | Sebaiknya | 18 |

### 3.3 Kalender Akademik (`/kalender-akademik`)

| ID | Kebutuhan | Prio |
|---|---|---|
| FR-K-01 | Kalender ditampilkan sebagai **tabel HTML** per semester (Ganjil, Genap, Pendek) dengan kolom No · Kegiatan · Waktu · Status. Tidak boleh berupa gambar | Wajib |
| FR-K-02 | Status per kegiatan dihitung otomatis dari tanggal hari ini: Selesai, Berlangsung, atau Akan datang. Baris yang sedang berlangsung disorot | Wajib |
| FR-K-03 | Kartu "Sedang berlangsung" dan "Berikutnya" ditampilkan di atas tabel | Wajib |
| FR-K-04 | Pemilih tahun ajaran (arsip tahun sebelumnya), tombol "Unduh PDF resmi" (SK Rektor), dan daftar surat edaran terkait (judul, nomor, tanggal, unduh) | Wajib |
| FR-K-05 | Di HP, tabel berubah menjadi timeline vertikal dengan blok tanggal | Wajib |
| FR-K-06 | Tombol "+ Kalender" per kegiatan untuk mengunduh file `.ics` | Bisa |

### 3.4 Akreditasi (`/akreditasi`)

| ID | Kebutuhan | Prio | Audit |
|---|---|---|---|
| FR-A-01 | Kartu sorotan akreditasi institusi berisi peringkat, lembaga, nomor SK, masa berlaku, dan status | Wajib | 06 |
| FR-A-02 | Satu tabel untuk semua unit dan prodi dengan kolom Unit/Prodi · Fakultas · Peringkat · Lembaga · Berlaku s.d. · Status · Sertifikat | Wajib | 06 |
| FR-A-03 | **Status dihitung dari `berlakuSampai`:** Aktif (> 90 hari), Segera berakhir (≤ 90 hari), atau Kedaluwarsa (lewat) | Wajib | 06 |
| FR-A-04 | Admin bisa menambahkan catatan "Perpanjangan sedang diproses" pada data yang kedaluwarsa | Sebaiknya | — |
| FR-A-05 | Filter fakultas, jenjang, dan status, serta pencarian dan paginasi | Wajib | — |
| FR-A-06 | Baris bisa dibuka untuk melihat riwayat sertifikat sebelumnya (periode, peringkat, nomor SK, lembaga, PDF) | Sebaiknya | — |
| FR-A-07 | Di HP, setiap baris menjadi kartu berisi pasangan label dan nilai | Wajib | — |

### 3.5 Kurikulum (`/kurikulum`)

| ID | Kebutuhan | Prio |
|---|---|---|
| FR-KU-01 | Tabel dikelompokkan per fakultas dengan kolom Prodi · Jenjang · Tahun Kurikulum · Diperbarui · Unduh | Wajib |
| FR-KU-02 | Filter fakultas dan jenjang, serta pencarian prodi | Wajib |
| FR-KU-03 | Prodi diambil dari master data Program Studi, bukan teks bebas | Wajib |

### 3.6 Dokumen Akademik (`/dokumen-akademik`) dan RPL (`/rpl`)

| ID | Kebutuhan | Prio |
|---|---|---|
| FR-D-01 | Dokumen ditampilkan sebagai **daftar**: ikon tipe file, judul, deskripsi singkat, kategori, tanggal diperbarui, ukuran file, tombol Unduh dan Pratinjau | Wajib |
| FR-D-02 | Filter kategori (Formulir, Pedoman, Peraturan, Surat Keputusan) dengan jumlah per kategori, pencarian, dan urutan | Wajib |
| FR-D-03 | Halaman RPL berisi teks penjelasan (pengertian, syarat, alur) yang bisa diedit admin, ditambah daftar dokumen RPL dengan format FR-D-01 | Wajib |

### 3.7 Pengumuman (`/pengumuman`) dan Berita (`/berita`)

| ID | Kebutuhan | Prio |
|---|---|---|
| FR-P-01 | Daftar pengumuman tanpa gambar, berisi blok tanggal, kategori, judul, kutipan 2 baris, dan label "Baru" (< 7 hari). Item yang disematkan berada di atas | Wajib |
| FR-P-02 | Filter kategori dalam bentuk chip, pencarian, dan paginasi ("Menampilkan 1–10 dari N") | Wajib |
| FR-P-03 | Halaman detail berisi judul, tanggal, kategori, isi dengan lebar baca ±720 px, daftar lampiran, dan "Pengumuman lainnya" | Wajib |
| FR-P-04 | Berita ditampilkan sebagai kartu: gambar di atas, teks di bawah, gambar cadangan jika kosong | Wajib |
| FR-P-05 | Kutipan dibuat dari teks bersih: tag HTML dibuang dan entity di-decode, atau disimpan sebagai field `excerpt` | Wajib |
| FR-P-06 | Sidebar "Recent Post", "Tags", dan newsletter **dihapus** | Wajib |

### 3.8 Buku, Buku Wisuda, Profil, Pimpinan & Staf, Struktur Organisasi

| ID | Kebutuhan | Prio |
|---|---|---|
| FR-L-01 | Buku dan Buku Wisuda ditampilkan sebagai grid cover rata kiri (4–5 per baris di desktop, 2 di HP) dengan judul dan metadata **di bawah** cover. Filter tahun dan periode, diurutkan dari yang terbaru | Wajib |
| FR-L-02 | Profil: ringkasan, visi, misi, tugas, fungsi, unit, akses cepat layanan, dan kontak. Angka hitungan butir di hero dihapus | Wajib |
| FR-L-03 | Pimpinan ditampilkan sebagai kartu besar, staf dalam grid kecil. Diurutkan berdasarkan field urutan, tanpa badge nomor | Wajib |
| FR-L-04 | Struktur organisasi ditampilkan sebagai gambar yang bisa diperbesar, ditambah versi teks (daftar hierarki) untuk aksesibilitas | Sebaiknya |

---

## 4. Kebutuhan Fungsional — Panel Admin

### 4.1 Umum

| ID | Kebutuhan | Prio | Audit |
|---|---|---|---|
| FR-AD-01 | Login di `/admin/login` tanpa reCAPTCHA pada percobaan normal. reCAPTCHA wajib setelah **3 kali gagal** dari IP yang sama atau untuk email yang sama dalam 15 menit, lalu hitungan di-reset saat login berhasil (sudah diterapkan di F0). Sesi JWT di cookie `httpOnly; secure; sameSite=lax` | Wajib | 01 |
| FR-AD-02 | Sidebar dikelompokkan: Ringkasan · Konten · Akademik · Publikasi · Organisasi · Pengaturan, mengikuti referensi `dasbor_admin` | Wajib | 14 |
| FR-AD-03 | Topbar berisi judul halaman, notifikasi, dan menu akun. **Tidak ada** pemilih bahasa, shortcuts template, maupun template customizer | Wajib | 14 |
| FR-AD-04 | Semua label berbahasa Indonesia, termasuk status (Terbit, Draf) dan paginasi | Wajib | 09, 15 |
| FR-AD-05 | Pola tabel daftar: pencarian, filter, tab status dengan jumlah, kolom thumbnail (bukan path), tombol "Edit" berlabel, dan "Hapus" di dalam menu "⋯" dengan dialog konfirmasi | Wajib | 15, 16 |
| FR-AD-06 | Pola form: label dengan tanda `*` untuk wajib isi, teks bantuan, validasi inline (server dan klien), tombol Batal dan Simpan, serta pesan sukses dalam bentuk toast | Wajib | — |
| FR-AD-07 | Unggah file dengan drag-and-drop, menampilkan batas ukuran dan tipe file. Batas: PDF 10 MB, gambar 5 MB | Wajib | 07 |
| FR-AD-08 | Jejak perubahan (siapa, kapan, aksi apa) per konten, ditampilkan di "Aktivitas Terbaru" | Sebaiknya | — |

### 4.2 Dasbor

| ID | Kebutuhan | Prio |
|---|---|---|
| FR-DS-01 | Kartu angka: berita terbit, pengumuman aktif, akreditasi kedaluwarsa (merah, dengan tautan "Perbarui"), dan total dokumen | Wajib |
| FR-DS-02 | Panel "Perlu Perhatian" yang dibuat otomatis: akreditasi kedaluwarsa atau ≤ 90 hari, konten tanpa gambar, URL video tidak valid, kalender tahun ajaran berjalan yang belum diisi | Wajib |
| FR-DS-03 | Aksi cepat: "+ Pengumuman", "+ Berita", "+ Dokumen" | Wajib |
| FR-DS-04 | Di HP, angka diringkas menjadi satu baris, lalu "Perlu Perhatian" ditampilkan lebih dulu | Sebaiknya |

### 4.3 Modul konten

Semua modul memiliki fungsi daftar, tambah, ubah, dan hapus (CRUD) dengan pola FR-AD-05 dan FR-AD-06.

| ID | Modul | Field dan aturan khusus | Prio |
|---|---|---|---|
| FR-M-01 | Pengumuman | judul, slug (otomatis), kategori (master), isi (rich text), lampiran[], disematkan, status Draf/Terbit, tanggal terbit | Wajib |
| FR-M-02 | Berita | seperti pengumuman + gambar sampul (wajib saat Terbit) | Wajib |
| FR-M-03 | Kalender Akademik | tahun ajaran, PDF SK Rektor, nomor SK; **lampiran PDF tambahan** (surat edaran perubahan jadwal, dsb.: judul, nomor surat, tanggal, file) yang tampil di halaman publik; kegiatan[]: semester, nama, tanggal mulai, tanggal selesai (opsional). **Impor CSV/Excel** untuk mempercepat input | Wajib |
| FR-M-04 | Akreditasi | unit/prodi (pilih dari master), peringkat (**pilihan tetap**), lembaga (master), nomor SK, tanggal berlaku, berlaku sampai, sertifikat PDF, catatan perpanjangan. Validasi: `berlakuSampai > tanggalBerlaku`. Field "Tahun" dan tombol "Aktif" manual **dihapus** | Wajib |
| FR-M-05 | Kurikulum | prodi (master), tahun kurikulum, PDF | Wajib |
| FR-M-06 | Dokumen Akademik & RPL | judul, deskripsi, kategori, PDF, disematkan. Ukuran file disimpan otomatis | Wajib |
| FR-M-07 | Buku & Buku Wisuda | judul, tahun, periode (buku wisuda), cover, PDF | Wajib |
| FR-M-08 | Data Lulusan | tahun, periode (I/II/III), jumlah. Impor CSV | Wajib |
| FR-M-09 | Pimpinan & Staf | nama, gelar, jabatan, kelompok (Pimpinan/Staf), foto, email (opsional), urutan. NIP/NID boleh disimpan untuk keperluan internal, tetapi **tidak pernah ditampilkan di situs publik** *(K-05)* | Wajib |
| FR-M-10 | Unit, Profil Bidang | sesuai isi halaman Profil | Wajib |
| FR-M-11 | Master Data | Fakultas, Program Studi (dengan jenjang), Kategori Pengumuman, Kategori Dokumen, Lembaga Akreditasi | Wajib |
| FR-M-12 | Pengaturan Situs | identitas (nama, logo, favicon), kontak, jam layanan, media sosial, tautan cepat, URL video, foto hero | Wajib |
| FR-M-13 | Akun Admin | daftar admin, tambah atau nonaktifkan, reset password, ubah role (khusus Super Admin) | Wajib |
| FR-M-14 | Status "Terjadwal" (terbit otomatis pada waktu tertentu) | — | Bisa |

---

## 5. Kebutuhan Data

Perubahan model dibandingkan kondisi sekarang:

| Entitas | Perubahan |
|---|---|
| `User` | role: `superadmin` \| `editor`. Tambah `isActive`, `lastLoginAt`. Hapus role `user` |
| `Accreditation` | `peringkat` menjadi enum, ditambah `lembaga` (ref), `nomorSK`, `unitRef` (ref Prodi/Unit), dan `catatanPerpanjangan`. Hapus `tahun` dan `isActive`. Status **tidak disimpan**, melainkan dihitung |
| `AcademicCalendar` | tambah `nomorSK`, `events[]` {semester, nama, mulai, selesai}, dan `lampiran[]` {judul, nomorSurat, tanggal, file} untuk surat edaran |
| `AcademicDocument`, `RplDocument` | tambah `kategori` (ref), `fileSize`, `mimeType` |
| `Pengumuman`, `News` | tambah `kategori` (ref), `excerpt`, `attachments[]`. Status: `draft` \| `published` |
| `Kurikulum` | `programStudi` menjadi ref (bukan teks) |
| `GraduationBook` | `periode` menjadi enum I/II/III |
| `Staff` | tambah `kelompok`, `gelar`, `email` (NIP tidak pernah dirender di publik) |
| `SiteSetting` | tambah `jamLayanan`, `socialInstagram`, `heroImage`. Di-cache di memori |
| `AuditLog` *(baru, Sebaiknya)* | user, aksi, entitas, id, waktu |
| Master *(baru)* | `KategoriPengumuman`, `KategoriDokumen`, `LembagaAkreditasi` |

Setiap perubahan skema disertai **skrip migrasi** yang bisa dijalankan ulang tanpa efek samping (idempoten) untuk data yang sudah ada. Contohnya: memetakan teks akreditasi ("A", "Unggul") ke enum, dan mengubah teks prodi di kurikulum menjadi ref.

---

## 6. Kebutuhan Non-Fungsional

### 6.1 Keamanan
| ID | Kebutuhan | Audit |
|---|---|---|
| NFR-S-01 | Tidak ada registrasi publik, dan role tidak pernah diambil dari input request | 01 |
| NFR-S-02 | `NODE_ENV=production`. Error handler terpusat yang tidak pernah menampilkan stack trace | 02 |
| NFR-S-03 | Semua rahasia (JWT, reCAPTCHA, MongoDB) hanya ada di `.env`, tanpa nilai cadangan di kode. Kunci reCAPTCHA dirotasi | K1 |
| NFR-S-04 | Unggahan divalidasi berdasarkan tipe MIME dan ekstensi, dengan batas ukuran, dan nama file disanitasi | 07 |
| NFR-S-05 | Helmet dengan CSP aktif (sumber skrip dan font dibatasi), proteksi CSRF untuk form admin, dan rate limit pada login | — |
| NFR-S-06 | HTML dari editor rich text disanitasi sebelum disimpan dan sebelum dirender | 10 |

### 6.2 Performa
| ID | Target |
|---|---|
| NFR-P-01 | TTFB p75 < 600 ms di server produksi untuk halaman publik |
| NFR-P-02 | Total transfer beranda < 1,5 MB (cold load), halaman dalam < 1 MB |
| NFR-P-03 | LCP < 2,5 detik pada profil 4G (Lighthouse mobile) |
| NFR-P-04 | Gambar diubah otomatis ke WebP dengan lebar maksimal 1600 px, ditambah thumbnail 400 px. Logo maksimal 30 KB |
| NFR-P-05 | `SiteSetting` di-cache dan query independen dijalankan paralel. Daftar memakai `.lean()` dan proyeksi field |

### 6.3 Aksesibilitas (WCAG 2.2 AA)
| ID | Kebutuhan | Audit |
|---|---|---|
| NFR-A-01 | Kontras teks ≥ 4,5:1 dan komponen non-teks ≥ 3:1, mengikuti token warna di DESIGN.md | A1 |
| NFR-A-02 | Indikator fokus `:focus-visible` 2 px yang terlihat di semua elemen interaktif | A2 |
| NFR-A-03 | Target sentuh minimal 44×44 px | A3 |
| NFR-A-04 | `<html lang="id">`, hierarki heading berurutan, landmark lengkap, dan skip link | A4, A5 |
| NFR-A-05 | Tombol ikon memiliki `aria-label`, dan ikon dekoratif memakai `aria-hidden` | A6, 16 |
| NFR-A-06 | Konten terlihat tanpa JavaScript maupun animasi, dan `prefers-reduced-motion` dihormati | 11 |

### 6.4 SEO dan berbagi
- **NFR-SEO-01.** Setiap halaman memiliki `<title>` unik, meta description, Open Graph, dan URL kanonik.
- **NFR-SEO-02.** Tersedia `sitemap.xml` dan `robots.txt`.

### 6.5 Konten dan bahasa
- **NFR-C-01.** Semua teks UI berbahasa Indonesia baku, mengikuti **daftar istilah** (Lampiran B).
- **NFR-C-02.** Tanggal memakai `Intl.DateTimeFormat('id-ID')`, misalnya "3 Feb 2026", dan angka memakai pemisah ribuan titik.

### 6.6 Kompatibilitas dan pemeliharaan
- **NFR-M-01.** Dukungan dua versi terakhir Chrome, Edge, Firefox, dan Safari, termasuk Safari iOS dan Chrome Android. Lebar minimal 360 px.
- **NFR-M-02.** Komponen EJS dipakai ulang (kartu, tabel, form field, badge, empty state); tidak ada markup yang diduplikasi per halaman.
- **NFR-M-03.** Tersedia tes otomatis minimal untuk aturan bisnis (status akreditasi, status kalender, pembuatan excerpt) dan smoke test semua rute.
- **NFR-M-04.** Lingkungan development, staging, dan produksi memakai database terpisah.

---

## 7. Desain Antarmuka

Referensi visual: `docs/Design/` (Google Stitch, 18 layar) dan `docs/Design/sistem_informasi_akademik_unjani/DESIGN.md`.

### 7.1 Diadopsi
- Token warna inti (`#15803D`, `#14532D`, `#CA8A04`, netral slate, dan warna status), Plus Jakarta Sans, radius 12/8 px, dan aturan "tanpa teks di atas foto".
- Pola tata letak: beranda, kalender (tabel, kartu Sedang berlangsung/Berikutnya, tampilan HP berupa timeline), akreditasi (kartu institusi, tabel dengan riwayat yang bisa dibuka), daftar dokumen, pengumuman dengan blok tanggal, grid buku wisuda, sidebar admin berkelompok, tabel admin dengan tab status, dan form akreditasi.

### 7.2 Wajib dikoreksi saat implementasi
Hasil probe terhadap `code.html` Stitch:

| Masalah | Bukti | Tindakan |
|---|---|---|
| Palet Material otomatis (`#f8f9ff`, `#e6eeff`, `primary #00652c`) bercampur dengan palet inti | DESIGN.md baris 4–50 | Pakai hanya token inti di §7.1 |
| Teks abu-abu dengan opacity 60% gagal kontras | `chevron_right`, "Tuntas" 2,76–2,88:1 | Gunakan `#475569` tanpa opacity |
| Badge hijau di atas hijau muda | "Aktif" 3,9–4,4:1 | Teks `#166534` di atas `#DCFCE7` |
| Ikon emas di atas kuning muda | 2,74:1 | Ikon `#854D0E` |
| Ligature ikon terbaca oleh pembaca layar ("check_circle") | probe-core | `aria-hidden="true"` |
| Logo berupa perisai generik | `logo_lambang_unjani` | Pakai file lambang resmi |
| Foto buatan AI | beranda, berita | Ganti dengan foto kampus asli |
| Kolom Aksi tabel admin terpotong pada lebar < 1360 px | `kelola_pengumuman` | Kolom aksi sticky di kanan atau tabel bisa digulir |

### 7.3 Ditolak (di luar lingkup v1)
Elemen berikut muncul di desain Stitch tetapi **tidak** dibangun: sinkronisasi Feeder PDDikti, panel "Status Layanan" (uptime database SIAKAD), helpdesk dan tiket mahasiswa, alur persetujuan (Draf review, "Menunggu Persetujuan Wakil Rektor"), nomor surat per pengumuman, ekspor log XLSX, aksi massal, "Cetak SK Dekan", badge tahun ajaran di topbar admin, layanan legalisir, ikon akun di header publik, serta catatan KRS/UKT/transkrip.

---

## 8. Di Luar Lingkup

- Transaksi akademik: KRS, nilai, transkrip, pembayaran.
- Login mahasiswa atau dosen, dan integrasi SSO kampus.
- Integrasi SIAKAD dan PDDikti.
- Layanan permohonan online (legalisir, surat keterangan).
- Newsletter dan langganan email.
- Situs multibahasa (EN/AR).
- Aplikasi mobile native.

---

## 9. Kriteria Penerimaan Rilis

1. Kebutuhan berprioritas Wajib (§3–§6) seluruhnya terpenuhi.
2. Audit ulang dengan metode yang sama seperti `AUDIT-UIUX.md`: **0 temuan Kritis**, 0 kegagalan kontras pada teks, 0 halaman dengan overflow horizontal di 360/390 px, dan 0 error konsol.
3. Lighthouse (mobile) untuk beranda, kalender, akreditasi, dan dokumen: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
4. Tidak ada konten uji coba di database produksi. Semua teks bebas dari "test", "lorem", dan sisa template.
5. Skrip migrasi berhasil dijalankan pada salinan database produksi tanpa kehilangan data.
6. Uji keamanan dasar lulus: registrasi tidak tersedia, role tidak bisa disuntikkan lewat request, URL acak menghasilkan 404 ramah, unggahan di atas batas ditolak, dan CSRF aktif.

---

## 10. Keputusan Terbuka

| ID | Pertanyaan | Default bila tidak dijawab |
|---|---|---|
| K-01 | ~~Nama resmi yang dipakai~~ | **Diputuskan 1 Okt 2026: "Bidang Akademik".** Ganti "BAA", "Biro Administrasi Akademik", "Admin BAA", dan "Admin Akademik — Biro Administrasi Akademik" (desain Stitch) |
| K-02 | ~~Apakah role Editor dibutuhkan?~~ | **Diputuskan 1 Okt 2026: Editor dibutuhkan.** Hak akses Editor di §2.2 perlu dikonfirmasi pemilik produk |
| K-03 | ~~Apakah konten perlu disetujui pimpinan sebelum terbit?~~ | **Diputuskan 1 Okt 2026: tidak.** Status cukup Draf → Terbit (A-02) |
| K-04 | ~~Apakah tim sanggup menginput kalender per kegiatan?~~ | **Diputuskan 1 Okt 2026: sanggup.** Kegiatan diinput per baris (dengan impor CSV/Excel), **dan** tetap tersedia unggahan PDF untuk SK Rektor serta surat edaran terkait kalender (FR-M-03) |
| K-05 | ~~Apakah NIP/NID staf boleh tampil di publik?~~ | **Diputuskan 1 Okt 2026: tidak boleh.** Sudah dihapus dari halaman Pimpinan & Staf |
| K-06 | ~~Peringkat lama dan baru ditampilkan apa adanya?~~ | **Diputuskan 1 Okt 2026: ya**, sesuai sertifikat |
| K-07 | ~~Data lulusan sudah resmi untuk dipublikasikan?~~ | **Diputuskan 1 Okt 2026: ya** |

---

## Lampiran A — Ketertelusuran ke Audit

| Audit | Kebutuhan |
|---|---|
| 01 | NFR-S-01, FR-AD-01 |
| 02 | NFR-S-02, FR-G-03, FR-G-05 |
| 03 | FR-G-01, FR-G-02 |
| 04 | FR-B-01, FR-G-04 |
| 05 | Kriteria penerimaan 4, NFR-M-04 |
| 06 | FR-A-01..03, FR-M-04, FR-B-05 |
| 07 | FR-AD-07, NFR-S-04, NFR-P-02, NFR-P-04 |
| 08 | NFR-P-01, NFR-P-05 |
| 09 | NFR-C-01, NFR-A-04, FR-AD-04 |
| 10 | FR-P-05, NFR-S-06 |
| 11 | NFR-A-06 |
| 12 | FR-B-07, FR-DS-01 |
| 13 | NFR-M-01 |
| 14 | FR-AD-02, FR-AD-03 |
| 15 | FR-AD-04, FR-AD-05 |
| 16 | FR-AD-05, NFR-A-05 |
| 17 | FR-DS-04, §2.2 |
| 18 | FR-B-08, FR-DS-02 |
| A1–A6 | NFR-A-01..06 |

## Lampiran B — Daftar Istilah

| Pakai | Jangan pakai |
|---|---|
| Bidang Akademik | BAA, Biro Administrasi Akademik, Akademik UNJANI |
| Beranda | Home |
| Berita | Kegiatan (sebagai nama menu), Postingan |
| Pengumuman | Announcement |
| Buku Wisuda | Graduation Books, Buku Kelulusan |
| Buku | Books, Buku Panduan (sebagai nama menu) |
| Staf | Staff |
| Unduh | Download, Buka PDF |
| Selengkapnya | Read More |
| Masuk | Login, Sign In |
| Terbit / Draf | published / draft |
| Kedaluwarsa | Kadaluwarsa, Expired |
| Simpan / Batal | Save / Cancel |
| Perpustakaan | Perpustkaan |
| Yudisium | Yudidium |
