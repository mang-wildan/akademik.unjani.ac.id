# Redesain Panel Admin v0.1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Terapkan seluruh 69 frame admin ke aplikasi EJS tanpa mengubah kontrak bisnis.

**Architecture:** Token-first pada CSS admin, kemudian shell dan partial bersama, lalu penyesuaian tiap keluarga modul. Gunakan route, locals, formatter, Alpine CSP dan test harness existing; tidak membuat shell paralel atau backend baru. Font web mengikuti aset lokal landing, bukan font desktop FigCraft yang tidak tersedia.

**Tech Stack:** Express, EJS, Mongoose, Tailwind CSS v4, Alpine CSP, `node:test` dan `node:assert/strict`.

**Spec:** [SPEC.md](SPEC.md), [DESIGN.md](DESIGN.md), [cakupan 69 frame](preview/README.md).

## Global Constraints

- Stack tetap Express + EJS + Mongoose + Tailwind CSS v4 + Alpine CSP; tanpa dependensi Node baru. Pengecualian runtime: Python 3.11 + PyMuPDF untuk ADM-10.
- Tidak mengubah route, skema DB, role/otorisasi, aturan validasi, atau kontrak POST/CSV/upload. Pengecualian: batas dan kompres PDF Buku Wisuda (ADM-09, ADM-10).
- Server CentOS Stream 9 x86_64: Python 3.11 di venv `/opt/akademik-pdf/venv`, `PyMuPDF==1.28.0`, env `PDF_PYTHON`; tanpa pip global.
- PyMuPDF berlisensi AGPL-3.0 atau komersial; lisensi wajib dikonfirmasi sebelum produksi.
- CSP ketat tetap: tanpa inline script/style atau handler onclick; interaksi memakai Alpine CSP dan berkas JS eksternal.
- Admin CSS tetap terpisah dari publik; jangan mengubah landing/login.
- Pakai font lokal Crimson Text, Inter, Ubuntu Mono; tanpa CDN/font baru.
- Teks normal ≥4.5:1, teks besar ≥3:1, batas kontrol/fokus ≥3:1; target sentuh ≥44px pada layar sentuh.
- Verifikasi viewport 1440, 1024, 820, 768, 390, dan 320px; tidak ada overflow horizontal halaman.
- Jalankan `npm run build:css:admin` setelah mengubah CSS/view; commit hasil `public/css/admin.css`.
- Jalankan `npm test`; jangan melemahkan assertion keamanan, kontras, atau fungsi demi meluluskan perubahan visual.

## Review Focus

1. Judul/nama/file sangat panjang atau mengandung HTML: tetap escaped, membungkus aman, tidak membuat halaman melebar. Tes Task 2/3/5; cek browser Task 9.
2. Nilai 0, hasil filter kosong dan referensi opsional null: tidak hilang, tidak crash, CTA sesuai keadaan. Tes Task 3/4/6.
3. Gagal validasi saat ubah dengan file lama: nilai dan pilihan lampiran tidak hilang; file baru dipilih ulang, error menunjuk field benar. Tes Task 5/6.
4. Role terbatas atau JS mati: tidak ada tautan/aksi terlarang dan masih ada jalur halaman penuh/POST yang aman. Tes Task 2/3/7/8, browser Task 9.
5. Dark/system, mode ciut, drawer/bulk/form sticky pada 320px: fokus dan tombol terakhir tetap terjangkau. Tes token/shell Task 1/2, browser keyboard Task 9.

---

## Peta file dan batas tanggung jawab

| Unit | File | Tanggung jawab |
|---|---|---|
| Fondasi | `assets/css/admin.css`, `public/css/admin.css` | Token, font, ukuran, komponen, responsive dan dark |
| Shell | `views/layouts/admin-v2.ejs`, `views/admin/_ui/shell-{nav,account,bottom-nav}.ejs`, `views/admin/_ui/module-search.ejs` | Navigasi dan frame aplikasi |
| Daftar | `views/admin/_ui/{page-header,data-table,filter-bar,bulk-bar,pagination,badge,empty-state,confirm-dialog,toast}.ejs` | Shared list/state visual; kontrak locals existing |
| Form | `views/admin/_ui/{field,upload-field,richtext-field,error-summary,content-form,slide-over}.ejs` | Field, file, error, layout publikasi dan panel |
| Modul | View yang tercantum SPEC §2, partial list/actions terkait | Komposisi dan field khusus, bukan sistem baru |
| Interaksi | `public/js/admin.js` | Hanya penyesuaian yang tidak bisa ditangani HTML/CSS/komponen existing |
| Bukti | `test/admin*.test.js`, `test/dashboard.test.js`, `docs/update/v.0.1.0/verification.md`, `docs/update/v.0.1.0/baseline/`, `docs/update/v.0.1.0/screenshots/` | Regresi otomatis dan hasil visual runtime |

`{a,b}` pada tabel berarti file a dan b, bukan nama file literal. Periksa seluruh caller sebelum mengubah partial. Pertahankan parameter default dan data attributes existing; tambah parameter opsional hanya bila pemakai nyata memerlukannya. Test bukan snapshot seluruh HTML: assert nilai, relasi ID, link, POST dan state yang relevan.

## Task 1: Fondasi token dan font

**Files:**
- Modify: `assets/css/admin.css`, `public/css/admin.css`
- Test: `test/adminTokens.test.js`
- Create: `docs/update/v.0.1.0/verification.md` (baseline dan daftar 69 frame)

**Interfaces:**
- Consumes: token existing `@theme static`, override `@variant dark`, font di `public/fonts/{crimson-text,inter,ubuntu-mono}/`.
- Produces: token DESIGN §2, `--font-serif`, `--font-sans`, `--font-mono`, radius control 4px/card 6px; kontrak utilitas warna existing tetap tersedia.

- [x] **Step 1: Rekam baseline tanpa mengubah aplikasi.** Jalankan `git status --short`, `npm test`, dan `npm run build:css:admin`; catat hasil dan diff hasil build. Jangan stage pekerjaan lain. Buat matriks `verification.md` dari 69 nama PNG, masing-masing status belum diuji; screenshot baseline dasbor, daftar dan form saat app/akun uji tersedia. Jangan mencatat kredensial atau data pribadi.
- [x] **Step 2: Tulis tes gagal di `test/adminTokens.test.js`.** Pakai parser/contrast helper existing. Assert light `canvas === '#F4F1EA'`, `primary === '#14532D'`, `ink === '#16181A'` (normalisasi case), radius control/card 4/6px, tiga keluarga font lokal. Assert rasio muted/surface ≥4.5, on-primary/brand ≥4.5, control/surface ≥3, sidebar-label/brand ≥4.5, fokus di surface dan sidebar ≥3; pertahankan seluruh tes dark existing. Placeholder final harus ≥4.5 terhadap surface.
- [x] **Step 3: Jalankan `node --test test/adminTokens.test.js`.** Harus FAIL pada nilai lama, bukan error parser atau setup.
- [x] **Step 4: Ubah hanya fondasi CSS.** Ikuti DESIGN §2/3; gunakan nama file font lokal yang benar. Sidebar memakai brand tetap gelap, bukan primary dark. Placeholder web memakai muted. Pertahankan alias yang masih dipakai dan override dark; jangan menghapus font lama sebelum caller tidak memakainya.
- [x] **Step 5: Jalankan `npm run build:css:admin` dan `node --test test/adminTokens.test.js`.** Harus PASS; verifikasi font bukan 404 saat baseline browser berikutnya.
- [x] **Step 6: Commit.** Stage hanya file task: `git add assets/css/admin.css public/css/admin.css test/adminTokens.test.js docs/update/v.0.1.0/verification.md`, lalu `git commit -m "style(admin): align tokens with institutional redesign"`.

## Task 2: Shell editorial dan navigasi

**Files:**
- Modify: `views/layouts/admin-v2.ejs`
- Modify: `views/admin/_ui/shell-nav.ejs`, `shell-account.ejs`, `shell-bottom-nav.ejs`, `module-search.ejs`
- Modify: `assets/css/admin.css`, `public/css/admin.css`
- Test: `test/adminLayout.test.js`, `test/adminShell.test.js`, `test/navigation.test.js`, `test/adminPrefs.test.js`

**Interfaces:**
- Consumes: Task 1 token/font; `adminNav`, `canSee(item,user)`, `isActive(href,path)` dari `utils/navigation.js`.
- Produces: shell yang tetap menerima `title`, `breadcrumb`, `user`, `adminTheme`, `adminSidebar`, `alertSuccess`, `alertError`; nama Alpine `adminShell`, refs drawer dan event existing tidak berubah.

- [x] **Step 1: Tambah tes gagal pada test shell/layout existing.** Assert sidebar memakai brand dan lebar desktop 264px, topbar 64px, link aktif tetap `aria-current="page"` dengan accent 3px. Render subpath ubah dan role editor: hanya modul berizin tampil. Render nama `'<script>'` dan breadcrumb panjang: escaped. Assert Ctrl/Cmd+K dan copy “Cari menu”, link situs, skip link, drawer, bottom nav dan atribut dark/collapsed tetap ada.
- [x] **Step 2: Jalankan `node --test test/adminLayout.test.js test/adminShell.test.js test/navigation.test.js test/adminPrefs.test.js`.** Tes baru harus FAIL pada shell lama; catat baseline kegagalan unrelated terpisah.
- [x] **Step 3: Restyle shell dan partial tersebut.** Terapkan DESIGN §4, gutter 48px pada 1440px/24px desktop sempit/16px HP; hindari fixed content width. Pertahankan collapse 64px, pengaturan tema, modal search dan role filtering. Gunakan CSS untuk layout, bukan JS pengukur viewport.
- [x] **Step 4: Build dan ulangi perintah Step 2.** Harus PASS; periksa browser 1440/1024/390px untuk alignment, sidebar scroll, menu buka/tutup dan fokus kembali. Catat hasil pada matriks.
- [x] **Step 5: Commit hanya file task beserta test dan hasil CSS.** `git commit -m "style(admin): apply green sidebar and editorial shell"`.

## Task 3: Shared list, bulk, dialog dan toast

**Files:**
- Modify: `views/admin/_ui/page-header.ejs`, `data-table.ejs`, `filter-bar.ejs`, `bulk-bar.ejs`, `pagination.ejs`, `badge.ejs`, `empty-state.ejs`, `confirm-dialog.ejs`, `toast.ejs`, `button.ejs`
- Modify: `assets/css/admin.css`, `public/css/admin.css`; `public/js/admin.js` hanya bila state existing tidak cukup
- Test: `test/adminUi.test.js`, `test/adminTable.test.js`, `test/adminBulkBar.test.js`

**Interfaces:**
- Consumes: Task 1/2; API partial existing di komentar masing-masing file.
- Produces: API kompatibel: `page-header({heading,count?,actions?})`, `badge({text,tone?,badgeIcon?})`, `empty-state({text,action?,emptyIcon?})`, `toast({success?,error?})`; `data-table` tetap menerima `columns`, `items`, `state`, callback `rowHref/actions` dan `bulkForm`. Callback HTML tetap wajib meng-escape data.

- [x] **Step 1: Tambah tes gagal komposisi di test existing.** Render heading dengan `count:0`; assert H1 serif dan 0 tetap ada. Render badge: dot `aria-hidden="true"` + status teks, bukan dot saja. Render toast sukses/error berisi HTML: escaped, role status/alert, timer 5000ms/pause/tutup tetap, tidak ada “Urungkan”. Dialog maksimum 480px dengan bar status, method POST/action unchanged, Batal autofocus. Tambah baris tabel judul panjang/HTML dan metadata null; assert escaping, caption, scope, sort query dan label checkbox. Bulk select-all tetap hanya ID halaman saat ini; pagination mempertahankan q/status/sort.
- [x] **Step 2: Jalankan `node --test test/adminUi.test.js test/adminTable.test.js test/adminBulkBar.test.js`.** Tes baru visual/markup harus FAIL; tes keamanan/perilaku lama tidak dihapus.
- [x] **Step 3: Restyle shared partial dan CSS sesuai DESIGN §5.** Row minimum 60px, header mono, desktop button 40px/touch 44px. Pakai menu/disclosure native bila perlu pada task modul, bukan framework baru. Pertahankan dialog no-JS dan timer toast; jangan menambah undo endpoint atau tautan placeholder.
- [x] **Step 4: Build lalu ulangi Step 2.** Harus PASS; browser cek dialog keyboard (Escape/fokus kembali), bulk aktif, empty/filter-empty, toast hover/focus pause pada 1440/390px.
- [x] **Step 5: Commit hanya file task.** `git commit -m "style(admin): restyle shared lists and feedback states"`.

## Task 4: Dasbor sesuai frame

**Files:**
- Modify: `views/admin/dashboard.ejs`, `assets/css/admin.css`, `public/css/admin.css`
- Test: `test/dashboard.test.js`

**Interfaces:**
- Consumes: locals existing `stats.{beritaTerbit,pengumumanAktif,dokCount,akreditasiKedaluwarsa}`, `issues`, `drafts`, `recentActivities`, `user` dan formatter existing.
- Produces: hanya HTML view baru; tidak menambah field wajib, query, audit log atau perubahan controller.

- [x] **Step 1: Tambah tes render gagal di `test/dashboard.test.js` memakai setup existing.** Fixture semua stats 0 dan array kosong harus menampilkan 0, pesan kosong, semua link statistik benar dan satu H1. Fixture user/judul HTML harus escaped. Assert band statistik mendahului panel perhatian dalam DOM; band memakai brand, panel memakai serif; link aktivitas berasal fixture, bukan contoh PNG.
- [x] **Step 2: Jalankan `node --test test/dashboard.test.js`.** Harus FAIL pada urutan/komposisi lama.
- [x] **Step 3: Susun ulang `dashboard.ejs`.** Salam “Selamat datang, {nama}” menggunakan nama field user existing dan fallback “Selamat datang”; band empat stats, grid perhatian/draf kiri dan buat cepat/aktivitas kanan. Gunakan CSS grid, stack mobile; jangan membuat copy angka/waktu yang tidak punya sumber.
- [x] **Step 4: Build, ulangi Step 2 dan bandingkan `preview/Dasbor _ Desktop 1440.png`.** PASS otomatis; bukti visual 1440/390 dan dark dicatat, terutama band empat statistik dan alignment panel.
- [x] **Step 5: Commit hanya file task.** `git commit -m "style(admin): match dashboard editorial composition"`.

## Task 5: Form bersama dan modul publikasi

**Files:**
- Modify: `views/admin/_ui/field.ejs`, `upload-field.ejs`, `richtext-field.ejs`, `error-summary.ejs`, `content-form.ejs`, `content-list.ejs`, `content-actions.ejs`, `content-title.ejs`, `book-actions.ejs`, `book-title.ejs`, `slide-over.ejs`
- Modify: `views/admin/pengumuman/list.ejs`, `form.ejs`; `views/admin/news/list.ejs`, `form.ejs`; `views/admin/books/list.ejs`, `form.ejs`
- Modify: `assets/css/admin.css`, `public/css/admin.css`; `public/js/admin.js` hanya jika perlu menu keyboard
- Test: `test/adminUi.test.js`, `test/adminPengumuman.test.js`, `test/adminNewsBooks.test.js`, `test/slideOver.test.js`

**Interfaces:**
- Consumes: shared list Task 3; `content-form` locals existing `mode`, `basePath`, `singularLabel`, `item`, `values`, `errors`, `kategoriList`, `partial`.
- Produces: form full-page dua kolom dan panel stacked, `upload-field` tetap menerima field locals plus `current?:{href,label}` dan `limitText?`; action/name/intent/attachment IDs existing tidak berubah.

- [x] **Step 1: Tambah tes gagal render form/list.** Assert full-page punya main dan publication panel terpisah; `partial:true` tidak merender shell/H1 ganda dan tetap berisi field. Fixture gagal ubah harus mempertahankan title/status/kategori/pinned dan keepAttachment, current file punya URL benar, input file tidak memiliki `value`, help menyebut pilih ulang. Summary links cocok ID editor dan field. List published/draft/filtered-empty punya query dan CTA yang benar; aksi Ubah ber-URL nyata, menu lanjut punya nama aksesibel dan POST existing.
- [x] **Step 2: Jalankan `node --test test/adminUi.test.js test/adminPengumuman.test.js test/adminNewsBooks.test.js test/slideOver.test.js`.** Tes baru struktur harus FAIL, bukan mengganti assertion keamanan.
- [x] **Step 3: Terapkan DESIGN §5/6 pada shared form dan tiga modul.** Grid main fleksibel + kanan 336px hanya saat cukup; stack dalam slide-over. File native diberi dashed wrapper, bukan uploader JS. Pertahankan intent publish, editor, dirty guard, preview, hapus lampiran dan fallback full-page; tab status hanya query existing. Menu lanjut gunakan native details/summary bila tidak ada primitive existing.
- [x] **Step 4: Build dan ulangi Step 2.** Harus PASS. Browser verifikasi seluruh frame Pengumuman/Berita/Buku (18 state), termasuk gagal validasi/bulk/dialog, pada 1440px; cek form panjang/slide-over di 390px. Simpan screenshot tanpa data pribadi.
- [x] **Step 5: Commit hanya file task.** `git commit -m "style(admin): apply publication lists and split forms"`.

## Task 6: Akademik, akreditasi dan wisuda

**Files:**
- Modify: `views/admin/_ui/academic-list.ejs`, `academic-actions.ejs`, `calendar-delete.ejs`, `calendar-file.ejs`
- Modify: `views/admin/academic-calendars/list.ejs`, `create.ejs`, `edit.ejs`
- Modify: `views/admin/kurikulum/list.ejs`, `form.ejs`; `views/admin/academic-documents/list.ejs`, `form.ejs`; `views/admin/rpl-documents/list.ejs`, `form.ejs`
- Modify: `views/admin/accreditations/list.ejs`, `form.ejs`; `views/admin/lembaga-akreditasi/list.ejs`, `form.ejs`; `views/admin/graduation-books/list.ejs`, `form.ejs`; `views/admin/lulusan/list.ejs`, `form.ejs`
- Modify: `assets/css/admin.css`, `public/css/admin.css` hanya untuk pola reusable yang belum tercakup
- Test: `test/adminAcademic.test.js`

**Interfaces:**
- Consumes: shared component Task 3/5 dan locals tiap view existing.
- Produces: HTML modul sesuai 24 frame prefix terkait; kontrak controller/model/CSV tetap, segmented control hanya navigasi panel atau input dengan name/value existing.

- [x] **Step 1: Tambah tes gagal pada `test/adminAcademic.test.js`.** Kalender edit harus memiliki grouping data/kegiatan/impor/lampiran yang bisa dituju tanpa JS; form impor tetap method/enctype/action existing. Fixture relasi null/file kosong tidak crash, current-file link valid bila tersedia, failed form mempertahankan nilai. Lulusan impor invalid tetap menampilkan error baris; status akreditasi ada teks, bukan warna saja. Assert satu H1 dan heading panel serif pada setiap modul.
- [x] **Step 2: Jalankan `node --test test/adminAcademic.test.js`.** Assertion markup baru harus FAIL. Jangan mengubah expected aturan impor agar cocok mockup.
- [x] **Step 3: Sesuaikan view terdaftar dengan frame masing-masing.** Reuse list/upload/error-summary; form pendek tidak diberi sidebar kosong. Kalender tetap empat kelompok kerja; jangan menghilangkan operasi baris atau data CSV yang tidak tergambar.
- [x] **Step 4: Build dan ulangi Step 2.** Harus PASS; browser bandingkan semua 24 frame pada 1440px dan semua route view pada 390px. Kalender Kelola dan lulusan impor error juga dicek di 768/320px.
- [x] **Step 5: Commit hanya file task.** `git commit -m "style(admin): align academic and graduation modules"`.

## Task 7: Organisasi dan data master

**Files:**
- Modify: `views/admin/profil-akademik/edit.ejs`; `views/admin/staff/list.ejs`, `form.ejs`; `views/admin/unit/list.ejs`, `form.ejs`
- Modify: `views/admin/faculties/list.ejs`, `form.ejs`; `views/admin/program-studi/list.ejs`, `form.ejs`; `views/admin/kategori/list.ejs`, `form.ejs`; `views/admin/_ui/kategori-actions.ejs`
- Modify: `assets/css/admin.css`, `public/css/admin.css` hanya bila diperlukan pola reusable
- Test: `test/adminOrganization.test.js`, `test/adminProgramStudi.test.js`, `test/adminKategori.test.js`

**Interfaces:**
- Consumes: Task 3/5 components dan locals existing; izin tetap server-side.
- Produces: 17 state prefix Profil Bidang, Pimpinan & Staf, Unit, Fakultas, Program Studi, Kategori dengan action/query/field unchanged.

- [x] **Step 1: Tambah tes gagal pada test modul existing.** Assert panel heading serif dan aksi Ubah bernama. Fixture nama unit/prodi panjang + HTML tetap escaped, relasi opsional null aman. Hapus fakultas yang direferensikan tetap error, tanpa toast sukses; impor prodi invalid tetap error per baris. Role non-superadmin tidak mendapat aksi master terlarang; path form penuh tetap tersedia tanpa JS.
- [x] **Step 2: Jalankan `node --test test/adminOrganization.test.js test/adminProgramStudi.test.js test/adminKategori.test.js`.** Tes markup baru harus FAIL; assertion larangan hapus/otorisasi tetap dipertahankan.
- [x] **Step 3: Restyle view sesuai prefix PNG.** Pertahankan foto staf/preview, editor profil, opsi relasi, urutan staff/unit dan operasi CSV; jangan mengganti model organisasi demi layout.
- [x] **Step 4: Build dan ulangi Step 2.** Harus PASS; bandingkan semua 17 state desktop, setiap route view 390px, dan gagal hapus Fakultas dengan akun uji/data disposable.
- [x] **Step 5: Commit hanya file task.** `git commit -m "style(admin): align organization and master data screens"`.

Catatan verifikasi: guard hapus Fakultas berelasi belum ada pada backend existing. Task 7 tidak mengubah backend; failure injection hanya membuktikan jalur error, bukan proteksi relasi. Lihat `verification.md` Task 7.

## Task 8: Sistem, akun dan profil

**Files:**
- Modify: `views/admin/users/list.ejs`, `form.ejs`; `views/admin/settings/edit.ejs`; `views/admin/profile/index.ejs`, `edit.ejs`, `password.ejs`
- Modify: `assets/css/admin.css`, `public/css/admin.css` hanya bila diperlukan pola reusable
- Test: `test/adminUsers.test.js`, `test/adminSettingsProfile.test.js`

**Interfaces:**
- Consumes: Task 2/3/5 shell, dialog, field dan feedback.
- Produces: 9 state Akun Pengguna/Pengaturan Situs/Profil Saya; kontrak reset/nonaktif/update profile/password existing tetap.

- [x] **Step 1: Tambah tes gagal struktur pada test existing.** Ringkasan profil punya heading serif dan link edit/password nyata; password gagal punya summary/inline error terhubung, tanpa mengisi ulang password input. Nonaktif dan reset memiliki konsekuensi/label berbeda dengan POST existing; tidak ada tombol undo. Field pengaturan existing tidak hilang. Role terbatas tetap ditolak server, bukan hanya menyembunyikan tombol.
- [x] **Step 2: Jalankan `node --test test/adminUsers.test.js test/adminSettingsProfile.test.js`.** Tes markup baru harus FAIL; tes auth/security existing tetap.
- [x] **Step 3: Sesuaikan sembilan state dengan frame.** Tetap pisahkan route ringkasan/edit/password, jangan menambah API reset atau menampilkan password tersimpan. Gunakan partial bersama untuk konfirmasi dan error.
- [x] **Step 4: Build dan ulangi Step 2.** Harus PASS; bandingkan sembilan state 1440px dan seluruh route view 390px; uji nonaktif/reset hanya dengan akun disposable, bukan akun produksi.
- [x] **Step 5: Commit hanya file task.** `git commit -m "style(admin): align account settings and profile screens"`.

## Task 9: Audit 69 frame, responsif dan regresi akhir

**Files:**
- Modify: `docs/update/v.0.1.0/verification.md`
- Create: `docs/update/v.0.1.0/screenshots/` (bukti screenshot terpilih dan state bermasalah)
- Modify: file view/CSS/test task pemilik hanya bila audit menemukan cacat

**Interfaces:**
- Consumes: Task 1–8; 69 nama frame dari folder preview, routes dan akun uji berizin.
- Produces: matriks terisi dengan route/state, viewport, hasil, screenshot dan pengecualian; status yang belum diuji tidak boleh disebut PASS.

- [x] **Step 1: Jalankan `npm run build:css:admin` lalu `npm test`.** Catat jumlah pass/fail dan tanggal. Jika gagal, isolasi penyebab, tambah tes regresi pada task pemilik, perbaiki minimal; jangan skip/delete tes atau menurunkan threshold.
- [x] **Step 2: Buka aplikasi nyata dan cocokkan 69 frame pada 1440px.** Verifikasi seluruh state tambah/ubah/kosong/gagal/bulk/dialog termasuk field tidak tergambar. Screenshot dan matriks harus memakai data uji, bukan data pribadi. Catat deviasi Inter, data dinamis, toast tanpa undo, search menu, dark dan slide-over.
- [ ] **Step 3: Verifikasi setiap route view pada 390px.** Shell, tabel judul panjang, form publikasi, kalender, dialog dan bulk juga diuji pada 1024/820/768/320px. Assert di browser `document.documentElement.scrollWidth <= window.innerWidth`; tidak ada kontrol tertutup sticky bar, file/font 404 atau page error. Atur kasus panjang nyata di fixture, bukan memperkecil font agar muat.
- [ ] **Step 4: Uji keyboard dan preferensi.** Tab mulai skip link; buka/tutup drawer/search/dialog/menu, Escape, fokus kembali, Ctrl/Cmd+K dan Ctrl/Cmd+S, dirty guard Batal. Ulangi light/dark/system (emulasi OS terang/gelap), collapsed/open, reduced motion dan JS nonaktif. Pastikan form/link fallback aman, no-JS confirm tidak menghapus tanpa persetujuan, dan target touch ≥44px.
- [ ] **Step 5: Uji alur nyata dengan data disposable.** CRUD publikasi + lampiran, filter/sort/page/bulk, unggah/ganti file, impor CSV valid/invalid, gagal hapus fakultas berelasi, nonaktif/reset akun, pengaturan dan ubah profil/password. Keberhasilan harus dibuktikan respons/data tersimpan; screenshot toast bukan bukti. Jangan menjalankan operasi destruktif pada data produksi.
- [x] **Step 6: Review diff dan jalankan ulang build/test setelah fix terakhir.** `git diff --check`, `npm run build:css:admin`, `npm test`; hasil harus bersih/lulus. Pastikan publik/login, route/model/role dan dependency tidak berubah. Review visual manual memakai DESIGN, bukan gate marketing yang memaksa hero/section penuh pada admin.
- [x] **Step 7: Commit bukti dan fix terverifikasi.** Stage path eksplisit, bukan `git add .`; `git commit -m "test(admin): verify redesign coverage and responsive states"`. Tandai checkbox selesai hanya untuk langkah yang punya bukti; laporkan blocker akses browser/akun bila ada.

## Task 10: Batas PDF Buku Wisuda 200 MB

Task ini tidak bergantung pada redesain dan boleh dikerjakan lebih dulu.

**Files:**
- Modify: `utils/upload.js`, `routes/graduationBookRoutes.js`, `views/admin/graduation-books/form.ejs`
- Test: `test/upload.test.js`, `test/adminAcademic.test.js`

**Interfaces:**
- Consumes: `checkUploads`, `fileError`, `DOCUMENT_LIMITS`, `IMAGE_LIMITS` existing.
- Produces: `GRADUATION_BOOK_LIMITS = { fileSize: 200 * 1024 * 1024 }` dari `utils/upload.js`. Route Buku Wisuda memakai nilai ini; route lain tetap `DOCUMENT_LIMITS` 10 MB.

- [x] **Step 1: Tulis tes gagal.** `test/upload.test.js`: `GRADUATION_BOOK_LIMITS.fileSize === 209715200` dan `DOCUMENT_LIMITS.fileSize === 10485760`. `checkUploads` dengan file PNG valid berukuran `5 * 1024 * 1024 + 1` tetap menghasilkan `LIMIT_FILE_SIZE`. `test/adminAcademic.test.js`: form tambah/ubah Buku Wisuda memuat “PDF, maks. 200 MB.”. Error ukuran di route ini memakai pesan ADM-09; route lain tetap memakai pesan lama.
- [x] **Step 2: Jalankan `node --test test/upload.test.js test/adminAcademic.test.js`.** Tes baru harus FAIL karena konstanta dan teks belum ada.
- [x] **Step 3: Terapkan perubahan.** Ekspor konstanta dan pakai di `graduationBookRoutes.js`. Bungkus `uploadFields` di route ini: ubah `LIMIT_FILE_SIZE` menjadi `fileError(<pesan ADM-09>)` dengan `status: 413`. Error lain diteruskan apa adanya. Ganti `limitText` PDF di form. Jangan menaikkan `DOCUMENT_LIMITS` global.
- [x] **Step 4: Jalankan ulang tes Step 2, lalu `npm test`.** Semua harus PASS. Di lingkungan dev, uji unggah PDF sekitar 150 MB lewat form. File baru harus tersimpan dan file lama dihapus saat diganti. Ulangi uji pada server produksi bila memakai reverse proxy, karena batas body proxy di luar repo.
- [x] **Step 5: Commit hanya file task.** `git commit -m "feat(admin): allow 200 MB graduation book PDFs"`.

## Task 11: Kompres otomatis PDF Buku Wisuda

Kerjakan setelah Task 10.

**Files:**
- Create: `scripts/compress-pdf.py`, `requirements-pdf.txt`, `utils/pdfCompress.js`
- Modify: `controllers/graduationBookController.js`, `README.md`
- Test: `test/pdfCompress.test.js`, `test/adminAcademic.test.js`

**Interfaces:**
- Consumes: path file upload multer `req.files.file[0].path`.
- Produces: `compressPdf(filePath: string): Promise<{ compressed: boolean, before: number, after: number }>` di `utils/pdfCompress.js`. CLI: `python scripts/compress-pdf.py <input.pdf> <output.pdf>`; exit 0 bila output valid ditulis, exit non-zero bila gagal.

- [x] **Step 1: Tulis tes gagal di `test/pdfCompress.test.js`.** Stub `execFile` lewat dependency kecil di modul. Kasus: output lebih kecil mengganti file dan `compressed: true`; output lebih besar dibuang dan file asli tetap; exit error, timeout, atau `PDF_PYTHON` tidak ada mengembalikan `compressed: false` tanpa menghapus file asli. Assert `execFile` dipanggil dengan argumen array (bukan string shell) dan `timeout: 600000`. `test/adminAcademic.test.js`: create/update dengan PDF memanggil `compressPdf` sekali; gagal kompres tetap menyimpan data.
- [x] **Step 2: Jalankan `node --test test/pdfCompress.test.js test/adminAcademic.test.js`.** Harus FAIL karena modul belum ada.
- [x] **Step 3: Buat script Python.** Buka input dengan `pymupdf.open`, jalankan `doc.rewrite_images(dpi_threshold=200, dpi_target=150, quality=75)`, simpan dengan `garbage=4, deflate=True, clean=True`. Buka ulang output dan bandingkan jumlah halaman; bila beda, hapus output dan exit 2. Tulis ke file sementara di folder yang sama, bukan ke input langsung.
- [x] **Step 4: Buat `compressPdf` dan panggil di controller.** Pakai `child_process.execFile(process.env.PDF_PYTHON || 'python3', [script, input, temp], { timeout: 600000 })`. Ganti file asli dengan `fs.promises.rename` hanya jika output lebih kecil; selalu hapus temp. Panggil sebelum `create`/`save` di controller Buku Wisuda; catat ukuran sebelum/sesudah di log. Isi `requirements-pdf.txt` dengan `PyMuPDF==1.28.0`.
- [x] **Step 5: Jalankan ulang tes Step 2, lalu `npm test`.** Semua harus PASS. Uji lokal dengan PDF contoh berisi gambar besar: hasil terbuka, halaman sama, ukuran turun.
- [x] **Step 6: Siapkan dan uji di CentOS Stream 9 x86_64.** Jalankan berurutan:
  ```bash
  sudo dnf install -y python3.11
  sudo python3.11 -m venv /opt/akademik-pdf/venv
  sudo /opt/akademik-pdf/venv/bin/pip install --upgrade pip
  sudo /opt/akademik-pdf/venv/bin/pip install -r requirements-pdf.txt
  /opt/akademik-pdf/venv/bin/python -c "import pymupdf; print(pymupdf.__version__)"
  /opt/akademik-pdf/venv/bin/python scripts/compress-pdf.py contoh.pdf /tmp/contoh-kecil.pdf
  ```
  Output import harus `1.28.0`. Set `PDF_PYTHON=/opt/akademik-pdf/venv/bin/python` di service aplikasi, restart, lalu unggah PDF sekitar 150 MB. Catat ukuran sebelum/sesudah, durasi, dan RAM. Bila `pip` tidak menemukan wheel, cek `uname -m` harus `x86_64`; jangan build dari source tanpa keputusan baru.
- [x] **Step 7: Dokumentasikan setup di `README.md` lalu commit hanya file task.** `git commit -m "feat(admin): compress graduation book PDFs on upload"`.

## Task 12: Loader create, update, dan delete

Kerjakan setelah Task 3; file Buku Wisuda setelah Task 11.

**Files:**
- Modify: `public/js/admin.js`, `views/admin/_ui/confirm-dialog.ejs`, `bulk-bar.ejs`, `views/admin/graduation-books/form.ejs`
- Modify: view yang punya POST tambah/ubah/hapus/bulk/nonaktif/reset/impor bila belum memakai mekanisme bersama
- Test: `test/adminUi.test.js`, `test/slideOver.test.js`, `test/adminBulkBar.test.js`

**Interfaces:**
- Consumes: penanda sibuk global `submit` di `public/js/admin.js`, `slideOver.submit`, spinner `.spinner`.
- Produces: atribut opsional `data-busy-label="<teks>"` pada tombol submit. Tanpa atribut, label dipilih: `intent=delete` atau action berakhiran `/delete` menjadi “Menghapus…”, form tambah/ubah “Menyimpan…”, lainnya “Memproses…”.

- [x] **Step 1: Tambah tes gagal.** Runtime test di `test/adminUi.test.js`: submit form tambah/ubah, delete, bulk, dan impor memasang `aria-busy`, disable tombol pemicu, spinner, dan label ADM-11; submit kedua dicegah. Form Buku Wisuda dengan PDF dipilih memakai “Mengunggah dan mengompres PDF…”. `test/slideOver.test.js`: submit panel memberi spinner yang sama, lalu tombol pulih saat respons 422 atau fetch gagal. Pertahankan tes bfcache.
- [x] **Step 2: Jalankan `node --test test/adminUi.test.js test/slideOver.test.js test/adminBulkBar.test.js`.** Tes baru harus FAIL.
- [x] **Step 3: Perluas mekanisme yang sudah ada, bukan membuat loader kedua.** Tambahkan pilihan label ke handler global dan pakai fungsi yang sama di `slideOver.submit`. Simpan dan pulihkan isi tombol lewat `data-busy-original`. Dialog konfirmasi dan bulk bar memakai tombol submit biasa agar ikut handler ini. Jangan menghapus `data-no-busy` yang sudah sengaja dipakai.
- [x] **Step 4: Jalankan ulang tes Step 2, lalu `npm test`.** Harus PASS. Di browser, dengan network throttling, uji tambah/ubah/hapus satu modul halaman penuh, satu modul slide-over, bulk hapus, dan unggah Buku Wisuda. Spinner harus muncul saat klik pertama, dan klik ganda tidak mengirim dua request.
- [x] **Step 5: Commit hanya file task.** `git commit -m "feat(admin): show loaders for create update and delete"`.

## Cakupan silang dan hasil self-review rencana

| Persyaratan | Task |
|---|---|
| ADM-01 shell, izin, tema | 1, 2, 9 |
| ADM-02 dasbor | 4, 9 |
| ADM-03 daftar/pagination | 3, 5, 6, 7, 8, 9 |
| ADM-04 bulk | 3, 5, 9 |
| ADM-05 form/error | 5, 6, 7, 8, 9 |
| ADM-06 file/CSV/kalender | 5, 6, 7, 9 |
| ADM-07 konfirmasi/status | 3, 7, 8, 9 |
| ADM-08 sistem/akun | 2, 8, 9 |
| ADM-09 PDF Buku Wisuda 200 MB | 10 |
| ADM-10 kompres PDF di CentOS 9 | 11 |
| ADM-11 loader create/update/delete | 12, 9 |

Hitungan frame: 1 dasbor + 18 publikasi + 24 akademik/wisuda + 17 organisasi/master + 9 sistem/profil = 69. Token/partial didahulukan agar modul tidak menduplikasi gaya. Kontrak locals/POST tidak diganti; tidak ada fungsi baru lintas task yang belum didefinisikan. Lima Review Focus dipasangkan dengan tes task pemilik dan uji browser akhir. Semua checkbox masih kosong karena dokumen ini rencana, bukan laporan implementasi.

## Handoff

Tinjau SPEC/DESIGN sebelum eksekusi. Rekomendasi **Native**: perubahan berurutan banyak berbagi CSS/partial, sehingga tidak cocok diedit paralel; satu review independen di akhir. Pilihan **Subagent-driven** memberi konteks baru dan review per task, dengan biaya lebih tinggi. Tidak memulai perubahan aplikasi sebelum pengguna menyetujui rencana dan memilih cara eksekusi.
