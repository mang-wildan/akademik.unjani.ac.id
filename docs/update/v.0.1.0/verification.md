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

## Task 8: sistem, akun dan profil

- Tes markup baru gagal dulu (heading serif profil/settings, panel form akun, dialog nonaktif via POST existing, state filter dibawa). Akhir: `node --test test/adminUsers.test.js test/adminSettingsProfile.test.js`: **17 lulus, 0 gagal**; `npm test`: **306 lulus, 0 gagal**. Build CSS sukses; tidak ada kelas baru sehingga `public/css/admin.css` tidak berubah.
- Nonaktif dan atur ulang password dibedakan: nonaktif memakai `confirm-dialog` bersama (field hidden baru opsional) yang POST ke `/admin/users/bulk` `action=deactivate` existing, hanya untuk akun aktif selain diri sendiri, membawa filter daftar; konsekuensi "tidak bisa masuk ... konten tetap ada". Atur ulang password tetap route terpisah `/:id/reset-password`, teks "Password lama langsung tidak berlaku; status akun tidak berubah". Tanpa tombol undo. Editor tetap 403 di semua route akun/settings (server).
- Password gagal (profil dan reset admin): summary `role="alert"` menaut ke field, `aria-invalid`/`aria-describedby` ke pesan inline, semua input password `value=""`; hash/password tidak pernah dirender.
- Browser Chromium: route/middleware/CSP/EJS nyata, DB fixture in-memory, akun fiktif sekali pakai (`disposable@example.org`); bukan login/DB produksi. Semua route (akun daftar/tambah/ubah/reset, settings, profil ringkasan/ubah/password) pada 1440/1024/820/768/390/320 tanpa overflow, 404 atau page error. Dialog nonaktif diklik sampai submit: hanya akun target nonaktif, akun sendiri tetap aktif. Reset gagal lalu sukses; password profil gagal 1440/390.
- Review independen: tanpa Critical/Important. Minor ditutup: state filter dibawa dialog per-baris + tes POST `ids` tunggal. Minor ditunda: judul tab/toast controller masih "Reset Password"/"direset" (di luar view); trigger Nonaktifkan bergaya danger sama dengan Hapus.
- Adaptasi acuan: peran tetap select native (bukan segmented), checkbox `isActive` tetap di form ubah, tanpa toggle "Tampilkan" password, tanpa baris "Password diubah"/panel samping settings atau editor tautan inline (butuh model/route baru). Minimal 8 karakter mengikuti validasi existing, bukan 12 pada PNG.
- Bukti: `screenshots/task-8-users-{1440,390}-{list,new,edit,reset}.png`, `task-8-users-1440-{confirm-deactivate,reset-error}.png`, `task-8-settings-{1440,390}-edit.png`, `task-8-profile-{1440,390}-{summary,edit,password,password-error}.png`.

## Task 9: audit akhir — 17 November 2026

### Hasil dan batas bukti

- Awal: `npm run build:css:admin` sukses; `npm test` **306 lulus, 0 gagal, 0 skip**. Akhir setelah fix: build sukses, **307 lulus, 0 gagal, 0 skip**; `git diff --check` bersih. Tidak mengubah publik/login, route, model, role, dependency atau kontrak POST.
- Chromium headless lokal, middleware/CSP/EJS dan route admin nyata, DB **fixture in-memory**, akun/data fiktif. Tidak memakai sesi login, MongoDB, hashing hook atau DB produksi. Assertion “tersimpan” di bawah berarti mutasi `Model.docs`, bukan persistensi MongoDB. Tidak ada operasi destruktif terhadap data produksi.
- Runner Task 4–8 dijalankan ulang pada HEAD Task 8: **69 state matriks tercakup kembali** (68 mengikuti pola; Fakultas gagal hapus berbeda). Dashboard memakai view/layout fixture, modul lain memakai route fixture. Semua runner selesai exit 0; screenshot ulang ditaruh di temp agar bukti Task 4–8 tidak tertimpa. Matriks di bawah tetap menunjuk bukti visual Task pemilik, bukan klaim pemeriksaan pixel-identical baru.
- Audit tambahan Pengumuman/Berita/Buku: daftar, tambah, ubah, bulk dan dialog hapus pada **1440/1024/820/768/390/320px**, judul tanpa spasi 490+ karakter. Assert `document.documentElement.scrollWidth <= innerWidth`, tidak ada page error maupun respons file/font ≥400 (422 validasi dipisahkan). Route admin lainnya pada 390px tercakup rerun Task 6–8; dashboard rerun Task 4.
- Pratinjau publik `/:id/preview` **belum terverifikasi** oleh audit tambahan: fixture tidak menyediakan seluruh locals layout publik sehingga HTTP 500; tidak diubah karena publik di luar cakupan redesign admin. Tidak menganggap kegagalan fixture ini sebagai bukti regresi produksi atau route lulus.

### Cacat ditemukan dan diperbaiki

- Pointer coarse pada desktop: tombol **Pilih semua … hasil filter** hanya 40px, sementara aksi bulk lain 44px. Browser mereproduksi 1440px; tes baru `bulk select-all only shrinks to 40px for fine pointers` gagal sebelum fix, lulus setelahnya.
- `views/admin/_ui/bulk-bar.ejs`: `lg:min-h-10` menjadi `lg:pointer-fine:min-h-10`. Tanpa perubahan semantik/POST; fine pointer tetap 40px desktop, coarse tetap 44px. Build `public/css/admin.css` disertakan. Browser ulang seluruh tiga modul/enam viewport: kontrol bulk ≥44px dan tombol terakhir tidak melewati tinggi viewport 1000px.
- Bukti terpilih: `screenshots/task-9-{pengumuman,news,books}-{390,320}-long-list.png`. Gambar full-page menangkap shell fixed di tengah halaman panjang; ini artefak capture. Menu aksi tetap terbuka setelah Escape dialog, fokus kembali ke pemicu Hapus di menu.

### Keyboard, preferensi dan fallback

- Ketiga modul publikasi: Tab pertama ke skip link; Tab/Enter membuka drawer, Escape menutup dan fokus kembali ke Buka menu. Ctrl+K dan Meta+K memfokuskan `#cari-modul`; Escape menutup. Menu akun dibuka, Escape mengembalikan fokus ke pemicu.
- Light/dark/system × emulasi OS terang/gelap: computed `color-scheme` sesuai; collapse persisten setelah reload, sidebar 64px lalu bisa dibuka lagi. Reduced motion diemulasi selama cek preferensi; **belum mengukur seluruh durasi animasi secara runtime**.
- Ctrl+S dan Meta+S memicu submit form tiap modul (listener mencegah POST untuk isolasi shortcut); POST/data diuji terpisah di bawah. Buku slide-over: ubah judul, Batal membuka dirty guard, Lanjut mengedit mempertahankan nilai, Escape lalu Buang perubahan menutup panel.
- JS nonaktif: tombol Hapus tersedia dalam form konfirmasi terbuka, Batal tidak menghapus record; form tambah tetap POST/full-page. Rerun Task 5–8 juga memeriksa fallback form/link. **Audit semua target touch, semua menu/dialog melalui Tab, seluruh kontrol vs sticky bar dan dirty guard full-page Batal belum lengkap**; tidak diberi PASS menyeluruh.

### Alur disposable (HTTP/fixture, bukan toast)

- Pengumuman: create status published, update judul/pinned, delete; assert 303 dan record berubah/hilang. Retensi lampiran existing diperiksa; multipart PDF baru mengganti lampiran lama, file baru benar-benar ada di `public/uploads/pengumuman`, delete menghapus record dan file baru. File uji baru dibersihkan melalui delete controller.
- Filter draft dirender; sort title asc mulai `Urut 01`, desc mulai `Urut 30`; halaman 2 mulai `Urut 26` (25 baris/halaman). Bulk delete dua ID berulang mengurangi 30 menjadi 28 record dan kedua ID tidak tersisa.
- Impor prodi CSV invalid menghasilkan `Baris 2` tanpa menambah record; valid menambah Teknik Sipil/TS dengan referensi Fakultas fixture. Rerun kalender/lulusan memeriksa invalid CSV dan retensi data.
- Nonaktif akun target: hanya target menjadi `isActive=false`, akun sendiri tetap aktif. Reset mismatch 422 tidak mengubah password; valid 303 mengubah nilai fixture. Profil: nama/email berubah; password lama salah 422 tidak mengubah nilai; benar 303 mengubahnya. Ini tidak menguji hashing Mongoose karena metode `save` di-stub.
- Settings: alamat/kontakEmail berubah; quick link bertambah lalu terhapus. `namaSitus` bukan field form existing dan tidak diklaim berubah.
- **Blocker pre-existing:** gagal hapus Fakultas berelasi hanya diuji dengan failure injection (record tetap, redirect error tanpa success). Guard relasi nyata tidak ada; Step 5 tidak dapat dinyatakan lengkap tanpa pekerjaan backend terpisah. Tidak menambah guard dalam audit UI yang melarang perubahan route/model/kontrak.

### Audit visual baru — Task 9 Step 2, 2026-11-17

- **69/69 pasangan acuan/runtime dibaca visual pada 1440px**: publikasi 18, akademik 24, organisasi 17, dasbor/sistem/profil 10. Kelima runner Task 4–8 dijalankan ulang, seluruhnya exit 0; pemeriksaan source melengkapi field yang tidak tergambar. [Indeks dan laporan terperinci](audit/task-9-step-2/README.md) memuat route/state, file acuan/runtime dan temuan per frame. Tidak mengubah aplikasi untuk memaksa hasil menyerupai mock.
- Hasil **bukan PASS desain menyeluruh**. Matriks lama “sesuai pola” diganti hasil konservatif “beda (audit fixture)” beserta alasan: tabel shared memberi kolom judul/nama terlalu dominan sehingga header/tanggal/email/kategori membungkus; form pendek lebih lebar/stack; metadata, back-link dan aksi inline acuan tidak seluruhnya direproduksi. Buku full-page tetap dua kolom, bukan Data buku/Berkas satu kolom. Detail per frame berada di empat laporan, bukan disamarkan sebagai data dinamis.
- Adaptasi resmi: **Inter** menggantikan Swis721; data/count/tanggal fiktif bukan data pribadi atau jam palsu; **toast tanpa undo**; trigger **Cari menu** mempertahankan pencarian modul; **dark** memakai token existing, bukan inversi mock; **slide-over** 560px/fullscreen HP tetap stacked, bukan layout full-page yang dipersempit. Native select/checkbox/upload tidak menjanjikan drag-and-drop. Field tambahan seperti keepAttachment, status aktif akun, foto profil, deskripsi dan fakultas manual tetap ada.
- Dialog hapus **bulk tiga item** Berita/Pengumuman dicapture ulang (bukan single-delete); Batal/Escape tidak menghapus. Toast sukses dicapture sesudah POST publish fixture 303; redirect membersihkan seleksi, berbeda komposit acuan. Kategori fixture dipopulasikan untuk membedakan label kosong fixture dari wrap kolom nyata.
- State gagal publikasi: title/body menghasilkan summary dua error. Lampiran DOCX invalid ditolak multipart HTTP 400 **sebelum** controller, sehingga summary gabungan tiga error acuan tidak direproduksi. Dua screenshot `invalid-upload` menampilkan handler stack **fixture**, bukan bukti kebocoran stack produksi; handler pusat `server.js` hanya diperiksa sumber, bukan dieksekusi runner tersebut. Fakultas gagal hapus tetap failure injection + toast, bukan panel relasi atau bukti guard backend.
- Klarifikasi capture: viewport scrolled Profil/Staf/Unit, Akreditasi tambah/ubah dan Buku Wisuda ubah memperlihatkan kontrol terakhir di atas bar; sidebar Kategori/Pengaturan dapat digulir dan diakses. Pengaturan top/video/upload/quick-link expanded tidak tertutup; password baru pendek menghasilkan 422 min8, semua nilai password kosong. Persilangan fixed bar pada full-page bukan bug occlusion terkonfirmasi. Ini tidak menggantikan audit seluruh kontrol/enam viewport Step 3.
- Verifikasi regresi sesi ini: `npm test` **307 lulus, 0 gagal, 0 skip**; `npm run build:css:admin` sukses. Tidak ada perubahan source aplikasi, route/model/role/dependency. Laporan/screenshot/matriks adalah hasil audit, bukan perbaikan seluruh selisih.

### Status checklist

- Step 1 dan 6 terverifikasi; Step 7 commit hanya bukti/fix task sebelumnya.
- Step 2: audit visual 69 pasangan selesai pada fixture, deviasi dan batas bukti dicatat; bukan penerimaan pixel-identical atau bukti MongoDB/produksi. Step 3: overflow/error coverage lulus, audit occlusion semua kontrol belum lengkap. Step 4: sebagian sebagaimana rincian di atas. Step 5: HTTP/fixture lulus untuk alur tercatat, guard relasi/MongoDB belum terverifikasi. Step 3–5 tetap kosong, bukan PASS terselubung.
- Akses browser lokal tersedia. Akun uji aplikasi dengan MongoDB disposable belum digunakan/tersedia dalam audit ini; login/end-to-end persistensi DB tetap perlu verifikasi sebelum klaim selesai penuh.

## Matriks frame

Status audit Step 2: **beda (audit fixture)** berarti pasangan sudah dibaca visual, tetapi masih memiliki selisih desain/kontrak/data yang dirinci; bukan PASS maupun klaim 69 cacat runtime. Seluruh 69 pasangan diperiksa pada 1440px. Laporan per kelompok memuat route/state, nama PNG acuan/runtime tepat, field existing dan koreksi capture. Bukti baseline Task 4–8 di `screenshots/`; tambahan memakai prefix `task-9-step2-`.

| # | Frame | Status | Catatan |
|---|---|---|---|
| 1 | Akreditasi _ Daftar | beda (audit fixture) | 1440px visual; Tiga panel; nama unit/catatan existing tetap. Aktif pada acuan tidak ada sejak parent, bukan regresi; metadata/filter berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 2 | Akreditasi _ Tambah | beda (audit fixture) | 1440px visual; Tiga panel; nama unit/catatan existing tetap. Aktif pada acuan tidak ada sejak parent, bukan regresi; metadata/filter berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 3 | Akreditasi _ Ubah | beda (audit fixture) | 1440px visual; Tiga panel; nama unit/catatan existing tetap. Aktif pada acuan tidak ada sejak parent, bukan regresi; metadata/filter berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 4 | Akun Pengguna _ Atur ulang password | beda (audit fixture) | 1440px visual; Kolom email/role/tanggal sempit dan wrap; form 880px vs acuan 640px, pengelompokan/aksi berbeda. Role native/min8 existing tetap. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 5 | Akun Pengguna _ Daftar | beda (audit fixture) | 1440px visual; Kolom email/role/tanggal sempit dan wrap; form 880px vs acuan 640px, pengelompokan/aksi berbeda. Role native/min8 existing tetap. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 6 | Akun Pengguna _ Konfirmasi nonaktif | beda (audit fixture) | 1440px visual; Kolom email/role/tanggal sempit dan wrap; form 880px vs acuan 640px, pengelompokan/aksi berbeda. Role native/min8 existing tetap. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 7 | Akun Pengguna _ Tambah | beda (audit fixture) | 1440px visual; Kolom email/role/tanggal sempit dan wrap; form 880px vs acuan 640px, pengelompokan/aksi berbeda. Role native/min8 existing tetap. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 8 | Akun Pengguna _ Ubah | beda (audit fixture) | 1440px visual; Kolom email/role/tanggal sempit dan wrap; form 880px vs acuan 640px, pengelompokan/aksi berbeda. Role native/min8 existing tetap. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 9 | Berita _ Daftar | beda (audit fixture) | 1440px visual; Grid 720/336; panel lampiran/sampul digabung, footer aksi; metadata/date/category wrap berbeda. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 10 | Berita _ Hasil kosong | beda (audit fixture) | 1440px visual; Grid 720/336; panel lampiran/sampul digabung, footer aksi; metadata/date/category wrap berbeda. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 11 | Berita _ Konfirmasi hapus | beda (audit fixture) | 1440px visual; Dialog bulk 3 item dicapture ulang; Batal/Escape tanpa delete. Posisi/copy berbeda; lihat addendum A1/A2. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 12 | Berita _ Pilih massal | beda (audit fixture) | 1440px visual; Seleksi + POST publish/toast aktif diuji; tanpa undo. Redirect menghapus seleksi, berbeda komposit acuan; addendum A3/A4. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 13 | Berita _ Tambah — gagal validasi | beda (audit fixture) | 1440px visual; EJS dua error title/body; upload invalid ditolak multipart HTTP 400 sebelum controller. Summary tiga error acuan tidak tercapai; handler stack hanya fixture. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 14 | Berita _ Tambah | beda (audit fixture) | 1440px visual; Grid 720/336; panel lampiran/sampul digabung, footer aksi; metadata/date/category wrap berbeda. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 15 | Berita _ Ubah | beda (audit fixture) | 1440px visual; Grid 720/336; panel lampiran/sampul digabung, footer aksi; metadata/date/category wrap berbeda. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 16 | Buku _ Daftar | beda (audit fixture) | 1440px visual; Form full-page dua kolom, bukan Data buku/Berkas satu kolom; year opsional/cover wajib sesuai kontrak existing. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 17 | Buku _ Konfirmasi hapus | beda (audit fixture) | 1440px visual; Form full-page dua kolom, bukan Data buku/Berkas satu kolom; year opsional/cover wajib sesuai kontrak existing. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 18 | Buku _ Tambah | beda (audit fixture) | 1440px visual; Form full-page dua kolom, bukan Data buku/Berkas satu kolom; year opsional/cover wajib sesuai kontrak existing. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 19 | Buku _ Ubah | beda (audit fixture) | 1440px visual; Form full-page dua kolom, bukan Data buku/Berkas satu kolom; year opsional/cover wajib sesuai kontrak existing. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 20 | Buku Wisuda _ Daftar | beda (audit fixture) | 1440px visual; Data/Berkas tetap; metadata/thumbnail/filter daftar berbeda; file/sampul existing tetap. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 21 | Buku Wisuda _ Tambah | beda (audit fixture) | 1440px visual; Data/Berkas tetap; metadata/thumbnail/filter daftar berbeda; file/sampul existing tetap. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 22 | Buku Wisuda _ Ubah | beda (audit fixture) | 1440px visual; Data/Berkas tetap; metadata/thumbnail/filter daftar berbeda; file/sampul existing tetap. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 23 | Dasbor _ Desktop 1440 | beda (audit fixture) | 1440px visual; Komposisi band + 660/396 sesuai; ritme vertikal/aktivitas/warna angka berbeda. Salam/data fixture tanpa jam palsu. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 24 | Data Lulusan _ Daftar | beda (audit fixture) | 1440px visual; Fakultas terpisah dan nilai 0 tetap; CSV disclosure; filter/field stack berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 25 | Data Lulusan _ Tambah | beda (audit fixture) | 1440px visual; Fakultas terpisah dan nilai 0 tetap; CSV disclosure; filter/field stack berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 26 | Data Lulusan _ Ubah | beda (audit fixture) | 1440px visual; Fakultas terpisah dan nilai 0 tetap; CSV disclosure; filter/field stack berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 27 | Dokumen Akademik _ Daftar | beda (audit fixture) | 1440px visual; Data/Berkas tetap; pinned/keterangan existing tetap. Metadata file/filter kategori acuan tidak lengkap. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 28 | Dokumen Akademik _ Tambah | beda (audit fixture) | 1440px visual; Data/Berkas tetap; pinned/keterangan existing tetap. Metadata file/filter kategori acuan tidak lengkap. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 29 | Dokumen Akademik _ Ubah | beda (audit fixture) | 1440px visual; Data/Berkas tetap; pinned/keterangan existing tetap. Metadata file/filter kategori acuan tidak lengkap. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 30 | Dokumen RPL _ Daftar | beda (audit fixture) | 1440px visual; Data/Berkas tetap; deskripsi/aktif existing tetap. Metadata file/kolom Diperbarui acuan berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 31 | Dokumen RPL _ Tambah | beda (audit fixture) | 1440px visual; Data/Berkas tetap; deskripsi/aktif existing tetap. Metadata file/kolom Diperbarui acuan berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 32 | Dokumen RPL _ Ubah | beda (audit fixture) | 1440px visual; Data/Berkas tetap; deskripsi/aktif existing tetap. Metadata file/kolom Diperbarui acuan berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 33 | Fakultas _ Daftar | beda (audit fixture) | 1440px visual; Nama/singkatan tetap; Urutan/count prodi acuan tidak didukung existing; field stack. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 34 | Fakultas _ Gagal hapus | beda (audit fixture) | 1440px visual; Failure injection: toast error, bukan panel relasi. Guard relasi tidak ada; tidak membuktikan proteksi hapus. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 35 | Fakultas _ Tambah | beda (audit fixture) | 1440px visual; Nama/singkatan tetap; Urutan/count prodi acuan tidak didukung existing; field stack. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 36 | Fakultas _ Ubah | beda (audit fixture) | 1440px visual; Nama/singkatan tetap; Urutan/count prodi acuan tidak didukung existing; field stack. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 37 | Kalender Akademik _ Daftar | beda (audit fixture) | 1440px visual; Kelola memakai empat panel terbuka + anchor, bukan tab eksklusif; aksi Ubah dan metadata daftar berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 38 | Kalender Akademik _ Kelola 2026-2027 | beda (audit fixture) | 1440px visual; Kelola memakai empat panel terbuka + anchor, bukan tab eksklusif; aksi Ubah dan metadata daftar berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 39 | Kalender Akademik _ Tambah | beda (audit fixture) | 1440px visual; Kelola memakai empat panel terbuka + anchor, bukan tab eksklusif; aksi Ubah dan metadata daftar berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 40 | Kategori _ Daftar | beda (audit fixture) | 1440px visual; Jenis memakai tab/select native, status/filter/urutan berbeda; field existing tetap. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 41 | Kategori _ Tambah | beda (audit fixture) | 1440px visual; Jenis memakai tab/select native, status/filter/urutan berbeda; field existing tetap. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 42 | Kategori _ Ubah | beda (audit fixture) | 1440px visual; Jenis memakai tab/select native, status/filter/urutan berbeda; field existing tetap. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 43 | Kurikulum _ Daftar | beda (audit fixture) | 1440px visual; Data/Berkas tetap; tahun teks existing tetap. Filter prodi mengganti fakultas; metadata berkas berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 44 | Kurikulum _ Tambah | beda (audit fixture) | 1440px visual; Data/Berkas tetap; tahun teks existing tetap. Filter prodi mengganti fakultas; metadata berkas berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 45 | Kurikulum _ Ubah | beda (audit fixture) | 1440px visual; Data/Berkas tetap; tahun teks existing tetap. Filter prodi mengganti fakultas; metadata berkas berbeda. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 46 | Lembaga Akreditasi _ Daftar | beda (audit fixture) | 1440px visual; Panel pendek lebih lebar; field stack, judul disingkat, footer terpisah. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 47 | Lembaga Akreditasi _ Tambah | beda (audit fixture) | 1440px visual; Panel pendek lebih lebar; field stack, judul disingkat, footer terpisah. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 48 | Lembaga Akreditasi _ Ubah | beda (audit fixture) | 1440px visual; Panel pendek lebih lebar; field stack, judul disingkat, footer terpisah. [Rincian/bukti](audit/task-9-step-2/academic.md). |
| 49 | Pengaturan Situs _ Ubah | beda (audit fixture) | 1440px visual; Panel/grouping dan quick links berbeda; tanpa editor inline. Viewport top/video/upload/quick-link expanded terverifikasi; shell bergeser pada fullPage hanya artefak capture. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 50 | Pengumuman _ Daftar | beda (audit fixture) | 1440px visual; Grid 720/336; panel lampiran/sampul digabung, footer aksi; metadata/date/category wrap berbeda. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 51 | Pengumuman _ Hasil kosong | beda (audit fixture) | 1440px visual; Grid 720/336; panel lampiran/sampul digabung, footer aksi; metadata/date/category wrap berbeda. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 52 | Pengumuman _ Konfirmasi hapus | beda (audit fixture) | 1440px visual; Dialog bulk 3 item dicapture ulang; Batal/Escape tanpa delete. Posisi/copy berbeda; lihat addendum A1/A2. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 53 | Pengumuman _ Pilih massal | beda (audit fixture) | 1440px visual; Seleksi + POST publish/toast aktif diuji; tanpa undo. Redirect menghapus seleksi, berbeda komposit acuan; addendum A3/A4. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 54 | Pengumuman _ Tambah — gagal validasi | beda (audit fixture) | 1440px visual; EJS dua error title/body; upload invalid ditolak multipart HTTP 400 sebelum controller. Summary tiga error acuan tidak tercapai; handler stack hanya fixture. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 55 | Pengumuman _ Tambah | beda (audit fixture) | 1440px visual; Grid 720/336; panel lampiran/sampul digabung, footer aksi; metadata/date/category wrap berbeda. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 56 | Pengumuman _ Ubah | beda (audit fixture) | 1440px visual; Grid 720/336; panel lampiran/sampul digabung, footer aksi; metadata/date/category wrap berbeda. [Rincian/bukti](audit/task-9-step-2/publication.md). |
| 57 | Pimpinan & Staf _ Daftar | beda (audit fixture) | 1440px visual; Tingkat native/field stack; avatar/NIP daftar dan metadata berbeda; upload/nomorUrut existing tetap. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 58 | Pimpinan & Staf _ Tambah | beda (audit fixture) | 1440px visual; Tingkat native/field stack; avatar/NIP daftar dan metadata berbeda; upload/nomorUrut existing tetap. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 59 | Pimpinan & Staf _ Ubah | beda (audit fixture) | 1440px visual; Tingkat native/field stack; avatar/NIP daftar dan metadata berbeda; upload/nomorUrut existing tetap. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 60 | Profil Bidang _ Ubah | beda (audit fixture) | 1440px visual; Empat grup tetap; textarea baris mengganti editor berulang, field kontak stack; footer/back-link berbeda. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 61 | Profil Saya _ Ringkasan | beda (audit fixture) | 1440px visual; Ringkasan/tanggal/aksi berbeda; form lebih lebar, upload foto existing tetap. Password tanpa echo/min8 existing. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 62 | Profil Saya _ Ubah password | beda (audit fixture) | 1440px visual; Ringkasan/tanggal/aksi berbeda; form lebih lebar, upload foto existing tetap. Password tanpa echo/min8 existing. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 63 | Profil Saya _ Ubah profil | beda (audit fixture) | 1440px visual; Ringkasan/tanggal/aksi berbeda; form lebih lebar, upload foto existing tetap. Password tanpa echo/min8 existing. [Rincian/bukti](audit/task-9-step-2/system.md). |
| 64 | Program Studi _ Daftar | beda (audit fixture) | 1440px visual; Nama/singkatan/fakultas tetap; CSV disclosure, filter dan field stack berbeda. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 65 | Program Studi _ Tambah | beda (audit fixture) | 1440px visual; Nama/singkatan/fakultas tetap; CSV disclosure, filter dan field stack berbeda. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 66 | Program Studi _ Ubah | beda (audit fixture) | 1440px visual; Nama/singkatan/fakultas tetap; CSV disclosure, filter dan field stack berbeda. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 67 | Unit _ Daftar | beda (audit fixture) | 1440px visual; Data/gambar tetap; metadata gambar/URL daftar dan current-file card berbeda; form lebih lebar. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 68 | Unit _ Tambah | beda (audit fixture) | 1440px visual; Data/gambar tetap; metadata gambar/URL daftar dan current-file card berbeda; form lebih lebar. [Rincian/bukti](audit/task-9-step-2/organization.md). |
| 69 | Unit _ Ubah | beda (audit fixture) | 1440px visual; Data/gambar tetap; metadata gambar/URL daftar dan current-file card berbeda; form lebih lebar. [Rincian/bukti](audit/task-9-step-2/organization.md). |
