# SPEC — Redesain Panel Admin v0.1.0

Status: draf untuk ditinjau; belum mengubah aplikasi.
Acuan: [DESIGN.md](DESIGN.md) · [TODO.md](TODO.md) · [69 frame](preview/README.md) · [sumber editable](preview/admin-panel.figcraft).

## 1. Tujuan dan sumber kebenaran

Terapkan desain admin yang sudah dibuat ke aplikasi nyata, bukan membuat konsep baru. Karakter mengikuti landing: editorial institusional, ivory, blok hijau UNJANI, judul serif, garis tipis, tanpa gradien/glow. PNG menjadi acuan komposisi desktop; DESIGN mengikat token, adaptasi responsif, dan pengecualian teknis. Data, izin, validasi, dan perilaku aplikasi mengalahkan data contoh pada PNG.

Urutan konflik: keamanan/aksesibilitas → kontrak fungsi yang sudah ada → SPEC/DESIGN → PNG. Penyimpangan visual harus dicatat beserta alasan, bukan dilakukan diam-diam.

## 2. Cakupan dan pemetaan

Semua 69 frame di `preview/README.md` wajib masuk matriks verifikasi. Nama prefix PNG berikut merujuk seluruh state modul, bukan hanya daftar.

| Prefix frame | View di `views/admin/` | Bukti regresi yang sudah ada |
|---|---|---|
| Dasbor | `dashboard.ejs` | `test/dashboard.test.js` |
| Pengumuman | `pengumuman/{list,form}.ejs` | `test/adminPengumuman.test.js` |
| Berita, Buku | `news/{list,form}.ejs`, `books/{list,form}.ejs` | `test/adminNewsBooks.test.js` |
| Kalender Akademik | `academic-calendars/{list,create,edit}.ejs` | `test/adminAcademic.test.js` |
| Kurikulum, Dokumen Akademik, Dokumen RPL, Akreditasi | `{kurikulum,academic-documents,rpl-documents,accreditations}/{list,form}.ejs` | `test/adminAcademic.test.js` |
| Buku Wisuda, Data Lulusan | `{graduation-books,lulusan}/{list,form}.ejs` | `test/adminAcademic.test.js` |
| Profil Bidang, Pimpinan & Staf, Unit | `profil-akademik/edit.ejs`, `{staff,unit}/{list,form}.ejs` | `test/adminOrganization.test.js` |
| Fakultas, Program Studi | `{faculties,program-studi}/{list,form}.ejs` | `test/adminProgramStudi.test.js` |
| Lembaga Akreditasi | `lembaga-akreditasi/{list,form}.ejs` | `test/adminAcademic.test.js` |
| Kategori | `kategori/{list,form}.ejs` | `test/adminKategori.test.js` |
| Akun Pengguna | `users/{list,form}.ejs` | `test/adminUsers.test.js` |
| Pengaturan Situs, Profil Saya | `settings/edit.ejs`, `profile/{index,edit,password}.ejs` | `test/adminSettingsProfile.test.js` |

Ikut berubah: `assets/css/admin.css`, hasil build `public/css/admin.css`, `views/layouts/admin-v2.ejs`, partial `views/admin/_ui/`, dan `public/js/admin.js` hanya bila interaksi perlu disesuaikan. `public/js/shared.js` tetap dipakai; jangan mengubah kontrak publiknya untuk styling admin. Font memakai aset lokal yang sudah tersedia.

## 3. Persyaratan fungsional

- **ADM-01 Shell:** sidebar hijau 264px, topbar 64px, konten desktop mengikuti grid DESIGN. `utils/navigation.js` tetap sumber tunggal grup/label/URL/izin. Active state memakai ivory dan garis emas; submenu ubah/tambah tetap menandai modul induk. Cari modul dengan Ctrl/Cmd+K, avatar, tautan situs, collapse, drawer dan bottom nav tetap berfungsi.
- **ADM-02 Dasbor:** salam berdasarkan pengguna yang masuk, statistik dalam satu band hijau, panel perhatian/draf di kiri dan buat cepat/aktivitas di kanan. Gunakan locals `stats`, `issues`, `drafts`, `recentActivities` yang sudah ada. Nol ditampilkan sebagai 0; daftar kosong punya pesan. Jangan menyalin nama, tanggal, jumlah, atau aktivitas dari mockup.
- **ADM-03 Daftar:** heading serif dan jumlah (termasuk 0), tab status bila filter tersebut sudah didukung, pencarian/filter, tabel, pagination bernomor, aksi Ubah dan menu lanjutan mengikuti mockup. URL query, sort, ukuran halaman, ekspor dan izin aksi tidak berubah. Kondisi belum ada data dibedakan dari hasil filter kosong.
- **ADM-04 Pilih massal:** checkbox per baris dan pilih semua hanya halaman aktif; bar aksi menampilkan jumlah sebenarnya. Filter/pagination tidak boleh menyebabkan operasi pada ID tersembunyi yang tidak dipilih. Pertahankan validasi bulk server dan state pending/gagal; toast muncul setelah hasil nyata.
- **ADM-05 Form:** tambah/ubah dan state gagal mengikuti frame. Form publikasi memakai kolom utama dan panel status/publikasi kanan. Nama field, method, action, enctype, intent tombol, editor, validasi, dirty guard dan shortcut simpan tetap. Setelah gagal, nilai teks/pilihan dipertahankan; file wajib dipilih ulang. Ringkasan error menaut ke field dan mengambil fokus.
- **ADM-06 File dan kalender:** input file native bergaya area bergaris putus-putus; kartu file saat ini, pratinjau, lampiran dan hapus lampiran tetap jujur pada data. Kalender mempertahankan edit data/kegiatan/impor CSV/lampiran; lulusan dan program studi mempertahankan impor CSV beserta error per baris. Tampilan segmented control tidak mengubah nilai yang dikirim.
- **ADM-07 Konfirmasi/status:** dialog 480px untuk hapus/nonaktif/reset sesuai aksi nyata; sebutkan objek dan konsekuensi, Batal mendapat fokus awal. Fakultas gagal dihapus karena relasi tetap tampil sebagai error, bukan sukses. Toast gelap punya status teks, tombol tutup dan timer yang berhenti saat hover/fokus.
- **ADM-08 Akun/pengaturan:** seluruh field yang sudah ada tetap tersedia; reset password bukan hapus akun. Jangan menampilkan password tersimpan, mengubah izin role, atau membuka aksi terlarang karena perubahan menu.
- **ADM-09 Batas PDF Buku Wisuda:** field `file` di `/admin/graduation-books` menerima PDF maksimal 200 MB (`200 * 1024 * 1024` byte), baik tambah maupun ubah. Sampul tetap maksimal 5 MB. Modul lain tetap PDF 10 MB. File >200 MB ditolak dengan pesan “Ukuran file terlalu besar. Batas maksimal: PDF Buku Wisuda 200 MB, gambar 5 MB.” dan tidak menyisakan file sementara. Cek isi PDF (`%PDF-`) tetap berlaku. Bila ada reverse proxy, batas body untuk route ini harus minimal 200 MB; bila tidak, aplikasi tidak menerima file walau batas Node sudah naik.
- **ADM-10 Kompres PDF Buku Wisuda:** setelah upload PDF Buku Wisuda lolos validasi, server menjalankan `scripts/compress-pdf.py` dengan PyMuPDF. Hasil dipakai hanya bila valid, jumlah halaman sama, dan ukurannya lebih kecil; selain itu file asli dipakai. Kompres gagal, timeout, atau Python tidak tersedia tidak boleh menggagalkan simpan atau menghapus file asli; catat error di log server. Gambar diturunkan ke 150 dpi dengan kualitas JPEG 75; teks dan vektor tidak dirasterisasi. Batas waktu 10 menit.
- **ADM-11 Loader create/update/delete:** setiap POST tambah, ubah, hapus, bulk, nonaktif, reset, dan impor di admin langsung menampilkan spinner dan teks status pada tombol pemicu, menonaktifkan tombol itu, dan mencegah kirim ganda. Teks status: “Menyimpan…” untuk tambah/ubah, “Menghapus…” untuk hapus, “Memproses…” untuk aksi lain, dan “Mengunggah dan mengompres PDF…” untuk Buku Wisuda yang memilih PDF baru. Berlaku di halaman penuh, slide-over, dialog konfirmasi, dan bulk bar. `aria-busy="true"` dipasang selama proses. Status dibersihkan saat kembali dari bfcache, saat slide-over menerima error, atau saat request fetch gagal; tombol Batal tetap bisa dipakai.

## 4. Keputusan batas desain

- **Font web:** Crimson Text 700 + Inter 400/500/600/700 + Ubuntu Mono 400 dari `public/fonts/`. Inter menggantikan Swis721 BT pada FigCraft karena aset web/lisensinya tidak tersedia; bukan alasan mengunduh font baru.
- **Tema:** light menjadi acuan PNG. Pilihan light/dark/system dan cookie yang sudah ada tetap bekerja. Dark mempertahankan token gelap yang lulus kontras, dengan tipografi/grid baru; jangan memaksa semua pengguna menjadi light.
- **Panel samping:** pertahankan slide-over untuk modul yang sudah menggunakannya dan fallback URL halaman penuh. Frame form menjadi acuan isi; panel publikasi ditumpuk saat lebar panel tidak cukup.
- **Urungkan:** tidak membuat backend undo baru. Jangan menampilkan “Urungkan” untuk hapus permanen atau aksi tanpa inverse yang aman. Gunakan toast hasil dan Tutup; penyimpangan ini wajib dicatat pada matriks frame Pilih massal.
- **Pencarian topbar:** tetap pencarian modul, bukan pencarian isi lintas database. Copy web “Cari menu” agar tidak menjanjikan fitur yang belum ada.
- **Dashboard:** tidak menambah audit log, metrik, atau query baru demi menyamai contoh. Copy salam boleh “Selamat datang, {nama}”; tanggal dinamis menggunakan formatter proyek, bukan tanggal desain.

## 5. Global Constraints

- Stack tetap Express + EJS + Mongoose + Tailwind CSS v4 + Alpine CSP; tanpa dependensi Node baru. Pengecualian runtime: Python 3.11 + PyMuPDF untuk ADM-10.
- Tidak mengubah route, skema DB, role/otorisasi, aturan validasi, atau kontrak POST/CSV/upload. Pengecualian: batas dan kompres PDF Buku Wisuda (ADM-09, ADM-10).
- Server CentOS Stream 9 x86_64: Python 3.11 dari AppStream di venv `/opt/akademik-pdf/venv`, `PyMuPDF==1.28.0` (versi yang diuji). Node memanggil path dari env `PDF_PYTHON`. Tidak memasang Python ke sistem secara global dengan pip.
- PyMuPDF berlisensi AGPL-3.0 atau komersial. Sebelum produksi, minta konfirmasi pemilik sistem bahwa lisensi ini boleh dipakai pada layanan web ini.
- CSP ketat tetap: tanpa inline script/style atau handler onclick; interaksi memakai Alpine CSP dan berkas JS eksternal.
- Admin CSS tetap terpisah dari publik; jangan mengubah landing/login.
- Pakai font lokal Crimson Text, Inter, Ubuntu Mono; tanpa CDN/font baru.
- Teks normal ≥4.5:1, teks besar ≥3:1, batas kontrol/fokus ≥3:1; target sentuh ≥44px pada layar sentuh.
- Verifikasi viewport 1440, 1024, 820, 768, 390, dan 320px; tidak ada overflow horizontal halaman.
- Jalankan `npm run build:css:admin` setelah mengubah CSS/view; commit hasil `public/css/admin.css`.
- Jalankan `npm test`; jangan melemahkan assertion keamanan, kontras, atau fungsi demi meluluskan perubahan visual.

## 6. Non-goal

Tidak ada SPA, framework baru, layout admin paralel, redesign publik/login, migrasi DB, global content search, drag-and-drop uploader baru, audit log baru, backend undo, atau animasi marketing. Prinsip design-taste dipakai untuk identitas, keselarasan tepi, copy nyata dan aksesibilitas; hero satu layar, foto dekoratif, WebGL, dan scroll pinning tidak berlaku pada workspace admin.

## 7. Kriteria penerimaan

1. ADM-01..11 terpenuhi dan 69 frame punya baris bukti pada `verification.md`: frame, route/state, viewport, screenshot, hasil, penyimpangan.
2. Light desktop mendekati komposisi PNG: sidebar/topbar, hierarki heading, band dasbor, tabel, form, dialog. Tidak cukup mengganti warna saja.
3. Semua halaman dan state pada tabel cakupan tetap berfungsi; state error/kosong/bulk diuji, bukan hanya happy path.
4. Light/dark/system, sidebar terbuka/ciut, drawer, keyboard, reduced motion dan tanpa JS tidak kehilangan konten atau jalan simpan/hapus yang aman.
5. Bukti browser: seluruh 69 state pada 1440px; seluruh route view pada 390px; shell, tabel panjang, form publikasi, kalender, dialog, dan bulk juga pada 1024/820/768/320px. Tidak ada page error; kegagalan aset/request dicatat dan ditangani.
6. `npm run build:css:admin` dan `npm test` lulus. Pemeriksaan browser belum dijalankan pada tahap penulisan dokumen ini.
