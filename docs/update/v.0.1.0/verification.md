# Verifikasi redesign admin v0.1.0

## Baseline (sebelum Task 1, HEAD `cebd626`)

- `npm test`: 253 lulus, 0 gagal.
- `npm run build:css:admin`: sukses; `public/css/admin.css` tanpa diff (build sinkron dengan sumber).
- Screenshot baseline browser: belum diambil (app/akun uji belum tersedia pada sesi ini).

## Task 1: token dan font

- `node --test test/adminTokens.test.js`: gagal sebelum ubah CSS (canvas `#fafafa`), lulus sesudahnya.
- `npm test`: 254 lulus, 0 gagal.
- Koreksi AA: `sidebar-label` FigCraft `#9DBBA7` = 4.38:1 di brand; dipakai `#A8C4AE` (4.9:1, nilai landing).
- Placeholder web = `muted` `#5B5E57` (referensi FigCraft `#8A8C84` gagal 4.5:1).
- Font 404: belum dicek di browser.

## Task 2: shell dan navigasi

- Tes baru gagal dulu (sidebar/topbar, Cari menu + Ctrl/Cmd+K), lalu lulus; `npm test`: 258 lulus, 0 gagal.
- Browser (Chromium headless, `/dev/admin-v2`, data fiktif):
  - 1440 & 1024: sidebar 264px, topbar 64px, tanpa overflow horizontal; font Inter/Crimson Text/Ubuntu Mono termuat, tanpa 404/page error.
  - 390: tanpa overflow; laci hijau terbuka dari "Menu", Escape menutup dan fokus kembali ke tombol Menu.
  - Ctrl+K fokus ke `#cari-modul`; menu akun Escape mengembalikan fokus ke pemicu.
  - Ciut + gelap: sidebar 64px tetap brand `#14532D`, item aktif terbaca.
- Deviasi: ikon menu disembunyikan saat sidebar terbuka (frame tanpa ikon), tetap tampil saat ciut. Pintasan `/` lama tetap aktif.

## Task 3: daftar, bulk, dialog, toast

- 5 tes baru gagal dulu (H1 serif, badge titik+teks, dialog 480px bar danger, toast ink, tabel mono/60px/bungkus, pagination "Menampilkan", bulk band brand), lalu lulus; verifikasi akhir `npm test`: 266 lulus, 0 gagal. Target kontrol list pada pointer coarse desktop diberi minimum 44px (tes regresi gagal→lulus).
- Browser (Chromium headless, `/dev/admin-v2`, data fiktif), 1440 & 390:
  - Tanpa overflow horizontal (daftar, bulk aktif, hasil kosong `?q=zzzzzz`); tanpa 404/page error. H1 Crimson Text, header tabel Ubuntu Mono, baris 60px desktop.
  - Toast `?success=<b>…</b>` tampil escaped; hover 5,5 dtk tetap tampil (pause).
  - Dialog hapus: fokus awal Batal, Escape menutup dan fokus kembali ke pemicu.
  - Bulk: 2 baris dipilih → "2 pengumuman dipilih"; HP lewat tombol Pilih.
  - Gelap: band bulk tetap brand `#14532D` teks putih; toast memakai token ink (terang di gelap), kontras tetap tinggi.
- Review callback nyata: hapus `truncate` di content-title/book-title agar judul Pengumuman/Berita/Buku ikut membungkus; tes komposisi HTML panjang gagal→lulus.
- Fix audit HP: toast berpindah ke atas saat bulk aktif agar tidak menutup aksi terakhir; tes regresi gagal→lulus. Browser 390: toast y=80–136, bulk y=660–836; focus pause 5,5 dtk lulus di 1440/390.
- Deviasi: tanpa tombol Urungkan (tidak ada endpoint undo).

## Task 4: dasbor editorial

- `node --test test/dashboard.test.js`: 3 gagal sebelum implementasi (salam, urutan band/panel), lalu 3 lulus. Tes controller/aturan 90 hari tetap.
- Regresi nama tanpa spasi: browser menemukan H1 shared melebar; tambah `min-w-0 max-w-full` pada H1, tes `adminUi` gagal→lulus.
- `npm run build:css:admin`: sukses. `npm test`: 269 lulus, 0 gagal.
- Browser Chromium, route fixture lokal sementara (view dashboard + shell nyata, CSP self, data fiktif; tanpa DB/akun produksi), 1440/1024/820/768/390/320px:
  - Light, dark, seluruh statistik 0/daftar kosong, nama/judul HTML tanpa spasi panjang: tanpa overflow horizontal, 404 atau page error.
  - 1440: band x=312 lebar 1080px; panel kiri 660px, kanan 396px; tepi atas sejajar; gutter/gap 24px. Brand tetap `#14532D` light/dark, teks putih; font lokal termuat.
  - 390: band dan kedua kolom stack; pesan kosong dan 0 tetap tampil.
- Dibanding PNG Dasbor: komposisi band + dua kolom sesuai; salam “Selamat datang” bukan waktu palsu, tanpa tanggal/jam/angka contoh PNG. Aktivitas memakai tanggal/label fixture dari kontrak existing; bukan audit log baru.
- Bukti: `screenshots/task-4-dashboard-1440-light.png`, `screenshots/task-4-dashboard-390-light.png`, `screenshots/task-4-dashboard-1440-dark.png`, `screenshots/task-4-dashboard-390-dark.png`.

## Task 5: form dan modul publikasi

- Empat tes baru gagal dulu: struktur form publikasi, upload dashed, CTA kosong awal, serta form Buku gagal ubah. Sesudah perubahan: targeted `adminUi/adminPengumuman/adminNewsBooks/slideOver` 51 lulus; `npm test` 274 lulus, 0 gagal. Assertion keamanan/upload existing tetap; multipart PDF/WebP, penghapusan file dan bulk tetap diuji.
- `npm run build:css:admin`: sukses; CSS hasil build disertakan.
- Browser Chromium memakai route, middleware, CSP dan EJS nyata dengan DB fixture in-memory (`test/helpers/adminContentFixture`), user/data fiktif. Bukan login/DB produksi.
  - Seluruh 18 frame publikasi pada 1440px: Pengumuman/Berita masing-masing daftar, kosong, bulk, hapus, tambah, gagal validasi, ubah; Buku daftar, hapus, tambah, ubah. Tab published/draft dan dialog melalui kontrol nyata; fokus awal Batal, Escape menutup.
  - Form 1440px: kolom 720/336px, gap 24px. Pada 1360px: 640/336px; 1024/390/320px stack. Tidak ada overflow horizontal, 404 atau page error.
  - POST gagal ubah pada 390px: title escaped, status, pinned dan keepAttachment tetap; PDF/sampul existing tetap. Nama lampiran tanpa spasi panjang tetap membungkus. File baru harus dipilih ulang.
  - Light/dark 1440/390; Buku slide-over 560px desktop/fullscreen HP selalu stacked, tanpa H1 ganda. Dirty Escape meminta buang perubahan. Tanpa JS, tautan Buku membuka full-page dan textarea isi tetap terlihat.
- Audit link summary menemukan target editor tertutup header fixed (y=0). Tes browser dan regresi render gagal→lulus setelah scroll margin; target kini y=80px dan mendapat fokus. Review independen: tanpa temuan actionable; 90 tes terkait/shared caller dan cek Buku 820/768px lulus (DB tetap fixture).
- Adaptasi acuan: status tetap select native (query/field existing), tidak membuat segmented state baru. Upload native tanpa klaim drag-and-drop; editor/preview/intent publish dan sticky action bar existing dipertahankan. Lampiran dalam panel utama, metadata/sampul di panel kanan. Tidak membuat lampiran kosong palsu atau aksi baru.
- Bukti PNG (semua relatif ke `screenshots/`):
  - `task-5-pengumuman-1440-list.png`, `task-5-pengumuman-1440-empty.png`, `task-5-pengumuman-1440-bulk.png`, `task-5-pengumuman-1440-delete.png`, `task-5-pengumuman-1440-new.png`, `task-5-pengumuman-1440-validation.png`, `task-5-pengumuman-1440-edit.png`, `task-5-pengumuman-1440-dark-edit.png`, `task-5-pengumuman-390-edit.png`, `task-5-pengumuman-390-failed-edit.png`, `task-5-pengumuman-390-dark-edit.png`.
  - `task-5-news-1440-list.png`, `task-5-news-1440-empty.png`, `task-5-news-1440-bulk.png`, `task-5-news-1440-delete.png`, `task-5-news-1440-new.png`, `task-5-news-1440-validation.png`, `task-5-news-1440-edit.png`, `task-5-news-1440-dark-edit.png`, `task-5-news-390-edit.png`, `task-5-news-390-failed-edit.png`, `task-5-news-390-dark-edit.png`.
  - `task-5-books-1440-list.png`, `task-5-books-1440-delete.png`, `task-5-books-1440-new.png`, `task-5-books-1440-edit.png`, `task-5-books-1440-dark-edit.png`, `task-5-books-1440-slide.png`, `task-5-books-390-edit.png`, `task-5-books-390-failed-edit.png`, `task-5-books-390-dark-edit.png`, `task-5-books-390-slide.png`.

## Task 6: akademik, akreditasi dan wisuda

- Tes baru `adminAcademic` gagal dulu: heading/panel, CTA kosong, anchor kalender dan retensi gagal ubah. Akhir: **36 lulus, 0 gagal**; `npm test`: **292 lulus, 0 gagal**. Kontrak/assertion upload/CSV/role existing tetap. Build CSS sukses, hasil disertakan.
- Browser Chromium: route/middleware/CSP/EJS nyata, DB fixture in-memory dan data fiktif; bukan login/DB produksi.
  - Delapan modul × daftar/tambah/ubah = **24 frame** pada 1440/390px; seluruh route juga 1024/820/768/320px. Tanpa overflow horizontal, 404 atau page error.
  - Kalender Kelola: empat section terbuka dengan anchor di bawah header. Kalender/lulusan impor invalid pada 1440/768/390/320: error tampil, kegiatan/jumlah 0 tetap; lulusan menampilkan **Baris 2**.
  - Teks HTML panjang, relasi null, light/dark, slide-over dan tanpa JS dicek. Retensi file lama/nilai escaped/pilihan saat gagal diuji route tests.
  - Regresi overflow: metadata nowrap dibatasi/dibungkus, link lampiran flex menjadi inline-block. Audit visual: minimum kolom metadata 96px menjaga tanggal/semester terbaca. Check permanen `scripts/check-academic-layout.cjs`: normal/panjang, enam viewport, Playwright/Chromium lingkungan tanpa dependency baru.
- Review independen: tanpa temuan Critical/Important/Minor. Seluruh PNG acuan dibanding screenshot runtime: sesuai pola, bukan pixel-identical.
- Adaptasi acuan: select/checkbox native, fakultas manual dan field existing tetap; tanpa segmented state/aktif baru. Upload native tanpa klaim drag-and-drop. PDF tetap 10 MB; Task 10/11 belum. Kurikulum memisahkan Berkas; kalender memisahkan impor dengan anchor tanpa JS. Lulusan impor tetap details (terbuka saat error); hapus lewat aksi daftar existing.
- Bukti: `screenshots/task-6-{academic-documents,rpl-documents,kurikulum,academic-calendars,accreditations,lembaga-akreditasi,graduation-books,lulusan}-{1440,390}-{list,new,edit}.png`; kalender/lulusan juga `{1440,768,390,320}-import-error.png`; kalender `320-long-edit.png`, akreditasi `390-dark-edit.png`.

## Task 7: organisasi dan data master

- Tes markup baru gagal dulu (panel serif, grouping Profil/Staf, error inline CSV). Akhir: `node --test test/adminOrganization.test.js test/adminProgramStudi.test.js test/adminKategori.test.js`: **30 lulus, 0 gagal**; `npm test`: **301 lulus, 0 gagal**. Assertion role, escaping, upload, validasi, null/0 dan kontrak POST/CSV existing tetap. Build CSS sukses, hasil disertakan.
- Browser Chromium: route/middleware/CSP/EJS nyata, DB fixture in-memory dan data fiktif; bukan login/DB produksi.
  - **17 state** acuan pada 1440/390px; seluruh route view juga 1024/820/768/320px. Tanpa overflow horizontal, 404 atau page error. Teks panjang/HTML, relasi null, light/dark, slide-over dan fallback tanpa JS dicek.
  - Impor prodi invalid pada 1440/768/390/320: error **Baris 2**, summary menuju file CSV, error inline dan data tidak bertambah. Foto staf/gambar unit existing tampil sebagai pratinjau dan tautan; nilai urutan 0 tetap.
  - Audit visual seluruh 17 acuan dan screenshot runtime: mengikuti pola shell/daftar/panel serif, bukan pixel-identical. Profil empat panel, Staf tiga panel, Unit memisahkan gambar. Sticky actions existing tetap; konten panjang dapat digulir melewati bar.
- **Konflik rencana/pre-existing gap:** `models/Faculty.js` dan `utils/academicAdmin.js` tidak memiliki guard hapus Fakultas berelasi. Task 7 melarang perubahan backend. Tes/browser menyuntik kegagalan `deleteOne`: menguji respons error, record tidak terhapus dan tanpa success; **tidak membuktikan proteksi relasi nyata**. Hapus satuan tetap HTTP 500 existing; bulk kembali ke daftar dengan toast error generik, bukan panel alasan relasi pada PNG. Guard backend perlu pekerjaan terpisah sebelum klaim Fakultas berelasi terlindungi.
- Review independen: tidak ada regresi Critical/Important pada diff UI. Konflik guard Fakultas dicatat di atas. Temuan Minor ditutup dengan assertion GET tujuan redirect bulk: toast error berisi `1 fakultas gagal dihapus`, tanpa toast sukses aktif (template inert dikecualikan). HTTP 500 fixture bukan bukti halaman error produksi.
- Adaptasi acuan: textarea profil existing (satu butir per baris), select/checkbox native, field/opsi/urutan existing dipertahankan; tidak menambah editor dinamis, segmented state, urutan Fakultas atau endpoint. Daftar dan aksi shared sudah memakai pola Task 3/5, tidak diduplikasi.
- Bukti: `screenshots/task-7-{profil-akademik,staff,unit,faculties,program-studi,kategori}-{1440,390}-{list,new,edit}.png` (Profil hanya edit); Fakultas `{1440,390}-delete-error.png` (injection); prodi `{1440,768,390,320}-import-error.png`; staf `390-dark-edit.png`.

## Matriks frame

Status: belum diuji / sesuai / beda (catat). Kolom catatan untuk lebar layar yang dicek dan selisih.

| # | Frame | Status | Catatan |
|---|---|---|---|
| 1 | Akreditasi _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 2 | Akreditasi _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 3 | Akreditasi _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 4 | Akun Pengguna _ Atur ulang password | belum diuji | |
| 5 | Akun Pengguna _ Daftar | belum diuji | |
| 6 | Akun Pengguna _ Konfirmasi nonaktif | belum diuji | |
| 7 | Akun Pengguna _ Tambah | belum diuji | |
| 8 | Akun Pengguna _ Ubah | belum diuji | |
| 9 | Berita _ Daftar | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 10 | Berita _ Hasil kosong | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 11 | Berita _ Konfirmasi hapus | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 12 | Berita _ Pilih massal | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 13 | Berita _ Tambah — gagal validasi | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 14 | Berita _ Tambah | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 15 | Berita _ Ubah | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 16 | Buku _ Daftar | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 17 | Buku _ Konfirmasi hapus | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 18 | Buku _ Tambah | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 19 | Buku _ Ubah | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 20 | Buku Wisuda _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 21 | Buku Wisuda _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 22 | Buku Wisuda _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 23 | Dasbor _ Desktop 1440 | sesuai komposisi (fixture) | 1440/390 light/dark; tambahan 1024/820/768/320 tanpa overflow. Data fiktif, tanpa jam/tanggal palsu; lihat Task 4. |
| 24 | Data Lulusan _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 25 | Data Lulusan _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 26 | Data Lulusan _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 27 | Dokumen Akademik _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 28 | Dokumen Akademik _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 29 | Dokumen Akademik _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 30 | Dokumen RPL _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 31 | Dokumen RPL _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 32 | Dokumen RPL _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 33 | Fakultas _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 34 | Fakultas _ Gagal hapus | beda; error path diuji (injection) | 1440/390; toast error existing, bukan panel relasi PNG. Guard relasi backend belum ada; lihat konflik Task 7. |
| 35 | Fakultas _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 36 | Fakultas _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 37 | Kalender Akademik _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 38 | Kalender Akademik _ Kelola 2026-2027 | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 39 | Kalender Akademik _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 40 | Kategori _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 41 | Kategori _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 42 | Kategori _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 43 | Kurikulum _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 44 | Kurikulum _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 45 | Kurikulum _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 46 | Lembaga Akreditasi _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 47 | Lembaga Akreditasi _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 48 | Lembaga Akreditasi _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 6. |
| 49 | Pengaturan Situs _ Ubah | belum diuji | |
| 50 | Pengumuman _ Daftar | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 51 | Pengumuman _ Hasil kosong | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 52 | Pengumuman _ Konfirmasi hapus | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 53 | Pengumuman _ Pilih massal | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 54 | Pengumuman _ Tambah — gagal validasi | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 55 | Pengumuman _ Tambah | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 56 | Pengumuman _ Ubah | sesuai pola (fixture) | 1440px; form juga 1360/1024/390/320px, dark dan slide-over Buku; lihat Task 5. |
| 57 | Pimpinan & Staf _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 58 | Pimpinan & Staf _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 59 | Pimpinan & Staf _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 60 | Profil Bidang _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 61 | Profil Saya _ Ringkasan | belum diuji | |
| 62 | Profil Saya _ Ubah password | belum diuji | |
| 63 | Profil Saya _ Ubah profil | belum diuji | |
| 64 | Program Studi _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 65 | Program Studi _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 66 | Program Studi _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 67 | Unit _ Daftar | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 68 | Unit _ Tambah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
| 69 | Unit _ Ubah | sesuai pola (fixture) | 1440/390; route juga 1024/820/768/320, long/null/dark/no-JS; adaptasi dan bukti Task 7. |
