# TODO — Rombak Panel Admin

Acuan: [SPEC.md](SPEC.md) · [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md)

Tandai `[x]` saat tugas selesai **dan** daftar periksanya lulus. Kerjakan
berurutan dalam satu fase. Fase berikutnya dimulai setelah fase sebelumnya
di-deploy ke dev-akademik dan dicoba staf.

## Panduan model dan effort

| Kelas | Anthropic | OpenAI (setara) | Dipakai untuk |
|---|---|---|---|
| **Berat** | Claude Opus 5.5 (`claude-opus-5-5`) | Model penalaran andalan (seri GPT-5.6 "Sol" / penerusnya) | Fondasi lintas modul, keamanan, interaksi rumit, keputusan desain |
| **Menengah** | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | Model serbaguna (GPT-5.6 "Terra" / penerusnya) | Migrasi modul mengikuti pola yang sudah ada, komponen, tes |
| **Ringan** | Claude Haiku 5.5 (`claude-haiku-5-5`) | Model hemat (GPT-5.6 "Luna" / penerusnya) | Perubahan mekanis: daftar ikon, konfigurasi, dokumentasi kecil |

Nama model OpenAI di atas belum terverifikasi dari sumber resmi. Cocokkan
dengan daftar model OpenAI yang berlaku sebelum dipakai.

Effort (tingkat penalaran): `low` → perubahan mekanis, `medium` → pola sudah
jelas, `high` → banyak kasus tepi atau lintas berkas, `xhigh` → interaksi
rumit dengan risiko regresi tinggi.

## Daftar periksa per modul

Dipakai untuk setiap tugas migrasi modul (F1-14 dan seterusnya):

- [ ] Controller memakai `ADMIN_LAYOUT`, `parseListQuery`, status 422 saat gagal validasi, JSON saat `partial=1` sukses
- [ ] Router: `strictCsp`, `POST /bulk` didaftarkan sebelum `/:id`
- [ ] `list.ejs` dan `form.ejs` hanya memakai komponen `views/admin/_ui/`
- [ ] Aksi bulk sesuai SPEC FR-ADM-33; hapus massal ikut menghapus file upload
- [ ] Tes unit konfigurasi bulk modul; `npm test` lulus
- [ ] Browser: keyboard saja (daftar → pilih → bulk → buka form → simpan → error)
- [ ] Browser: 375px dan 1440px, mode terang dan gelap, console bersih
- [ ] Browser: JS dimatikan → lihat, tambah, ubah, hapus tetap jalan

## F0 — Dokumen

| | ID | Tugas | Berkas utama | Bergantung | Model | Effort |
|---|---|---|---|---|---|---|
| [x] | F0-01 | Tulis SPEC, DESIGN, ARCHITECTURE, TODO | `docs/*.md` | — | Opus 5.5 / OpenAI berat | high |

## F1 — Fondasi + modul percobaan

| | ID | Tugas | Berkas utama | Bergantung | Model | Effort |
|---|---|---|---|---|---|---|
| [x] | F1-01 | Pipeline CSS admin: entri Tailwind baru, skrip `build:css:admin`, `build` ikut admin, `build-manifest` TARGETS + `css/admin.css`, `js/admin.js` | `assets/css/admin.css`, `package.json`, `scripts/build-manifest.js` | — | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F1-02 | Token warna terang + gelap sesuai DESIGN §2, tipografi, radius, bayangan, gerak. Tes yang menghitung rasio kontras WCAG semua pasangan token di kedua tema | `assets/css/admin.css`, `test/adminTokens.test.js` | F1-01 | Opus 5.5 / OpenAI berat | high |
| [x] | F1-03 | Middleware preferensi `admin_theme` + `admin_sidebar` dengan validasi nilai, dipasang di `/admin` | `middleware/adminPrefs.js`, `server.js`, `test/adminPrefs.test.js` | — | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F1-04 | Mode partial di `res.renderPage` (`?partial=1`, `Cache-Control: no-store`) | `middleware/renderPage.js`, `test/renderPage.test.js` | — | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F1-05 | `public/js/admin.js` + komponen `adminShell`; putuskan nasib `toast`/`disclosure`/`richtext` bersama (ARCHITECTURE §2.8) | `public/js/admin.js`, `public/js/app.js` | F1-03 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F1-06 | Layout `admin-v2.ejs`: sidebar 240/64px, header 48px, breadcrumb, menu akun + ganti tema, laci + navigasi bawah HP, skip-link | `views/layouts/admin-v2.ejs`, `views/admin/_ui/shell-*.ejs` | F1-02, F1-03, F1-05 | Opus 5.5 / OpenAI berat | high |
| [x] | F1-07 | Tambah ikon DESIGN §5 ke `ICONS`, jalankan `build:assets` | `scripts/build-assets.js`, `utils/icons.json` | — | Haiku 5.5 / OpenAI ringan | low |
| [x] | F1-08 | Komponen dasar `_ui`: button, badge, field, error-summary, empty-state, confirm-dialog, page-header; rapikan `_ui/toast.ejs` dari F1-06 (5 detik, berhenti saat hover/fokus, DESIGN §7.11) | `views/admin/_ui/*.ejs` | F1-02 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F1-09 | `parseListQuery`: filter daftar putih, sort, page, `state` untuk tautan; regex di-escape | `utils/listQuery.js`, `test/listQuery.test.js` | — | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F1-10 | Tabel data + bilah filter + pagination + tampilan kartu HP; Alpine `dataTable` (checkbox, indeterminate, Shift+klik, mode pilih HP) | `views/admin/_ui/data-table.ejs`, `filter-bar.ejs`, `pagination.ejs`, `public/js/admin.js` | F1-08, F1-09 | Opus 5.5 / OpenAI berat | high |
| [x] | F1-11 | `bulkHandler`: validasi Zod, `ids` atau `scope=filter`, batas 500, `exclude`, `updateMany`/`run`, redirect 303 + toast | `utils/bulk.js`, `validators/index.js`, `test/bulk.test.js` | F1-09 | Opus 5.5 / OpenAI berat | high |
| [x] | F1-12 | Bilah bulk + dialog hapus massal; Alpine `bulkBar`, `aria-live` jumlah terpilih | `views/admin/_ui/bulk-bar.ejs`, `public/js/admin.js` | F1-10, F1-11 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F1-13 | Slide-over: Alpine `slideOver` (fetch partial, pushState/popstate, fokus terkunci, submit `FormData`, 200/422/error), `dirtyGuard`, `shortcuts` | `views/admin/_ui/slide-over.ejs`, `public/js/admin.js` | F1-04, F1-08 | Opus 5.5 / OpenAI berat | xhigh |
| [x] | F1-14 | Modul percobaan **Pengumuman** (halaman penuh + bulk). `adminContentController` dipakai bersama News: tambah opsi `layout` di pabrik supaya News tetap di v1 sampai F2-03 | `controllers/adminContentController.js`, `controllers/pengumumanController.js`, `routes/pengumumanRoutes.js`, `views/admin/pengumuman/*` | F1-06, F1-12 | Opus 5.5 / OpenAI berat | high |
| [x] | F1-15 | Modul percobaan **Kategori** (slide-over + bulk aktif/nonaktif/hapus) | `controllers/kategoriController.js`, `routes/kategoriRoutes.js`, `views/admin/kategori/*` | F1-13, F1-14 | Sonnet 5.5 / OpenAI menengah | high |
| [x] | F1-16 | Verifikasi fase F1 (daftar periksa modul untuk dua modul percobaan), `npm run build`, deploy dev-akademik | — | F1-14, F1-15 | Sonnet 5.5 / OpenAI menengah | medium |

Verifikasi dan deploy F1 selesai 19 Oktober 2026. Hasil dan rollback:
[F1-VERIFICATION.md](F1-VERIFICATION.md). Fase F2 dilanjutkan atas instruksi pengguna.

## F2 — Menu, dasbor, publikasi

| | ID | Tugas | Berkas utama | Bergantung | Model | Effort |
|---|---|---|---|---|---|---|
| [x] | F2-01 | `adminNav` baru sesuai SPEC §5; tes kesesuaian menu ⇔ guard dan tes "tidak ada modul tanpa menu"; Alpine `moduleSearch` | `utils/navigation.js`, `test/navigation.test.js`, `public/js/admin.js` | F1-16 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F2-02 | Dasbor: query akreditasi ≤90 hari, sematan >30 hari, 5 draf terakhir; view baru dengan urutan HP sesuai FR-ADM-55 | controller dasbor, `views/admin/dashboard.ejs` | F2-01 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F2-03 | Berita (pakai pabrik dari F1-14, layout v2) | `controllers/newsController.js`, `routes/newsRoutes.js`, `views/admin/news/*` | F1-16 | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F2-04 | Buku (slide-over, upload sampul) | `controllers/bookController.js`, `routes/bookRoutes.js`, `views/admin/books/*` | F1-16 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F2-05 | Verifikasi fase F2 + deploy dev-akademik | — | F2-01–F2-04 | Sonnet 5.5 / OpenAI menengah | medium |

Verifikasi dan deploy F2 selesai 19 Oktober 2026. Hasil dan rollback:
[F2-VERIFICATION.md](F2-VERIFICATION.md). F3 dilanjutkan atas instruksi pengguna;
uji penerimaan staf tetap belum dilakukan.

## F3 — Akademik, akreditasi, wisuda

| | ID | Tugas | Berkas utama | Bergantung | Model | Effort |
|---|---|---|---|---|---|---|
| [x] | F3-01 | Dokumen Akademik (slide-over, upload) | `academicDocumentController.js`, `views/admin/academic-documents/*` | F2-05 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F3-02 | RPL (slide-over, bulk aktif/nonaktif via `status` boolean) | `rplDocumentController.js`, `views/admin/rpl-documents/*` | F2-05 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F3-03 | Kurikulum (halaman penuh) | `kurikulumController.js`, `views/admin/kurikulum/*` | F2-05 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F3-04 | Kalender Akademik (halaman penuh; acara + lampiran bertingkat, impor) | `academicCalendarController.js`, `views/admin/academic-calendars/*` | F3-03 | Opus 5.5 / OpenAI berat | high |
| [x] | F3-05 | Akreditasi Prodi (slide-over, bulk aktif/nonaktif) | `accreditationController.js`, `views/admin/accreditations/*` | F2-05 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F3-06 | Lembaga Akreditasi (slide-over, superadmin) | `lembagaAkreditasiController.js`, `views/admin/lembaga-akreditasi/*` | F3-05 | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F3-07 | Buku Wisuda (slide-over atau halaman penuh, putuskan sesuai SPEC §5) | `graduationBookController.js`, `views/admin/graduation-books/*` | F2-05 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F3-08 | Data Lulusan (slide-over, filter prodi/tahun, impor tetap jalan) | `lulusanController.js`, `views/admin/lulusan/*` | F2-05 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F3-09 | Verifikasi fase F3 + deploy dev-akademik | — | F3-01–F3-08 | Sonnet 5.5 / OpenAI menengah | medium |

F3 terdeploy dan terverifikasi pada dev-akademik; lihat
[F3-VERIFICATION.md](F3-VERIFICATION.md). Uji penerimaan staf belum dilakukan.

## F4 — Organisasi, data master, sistem

| | ID | Tugas | Berkas utama | Bergantung | Model | Effort |
|---|---|---|---|---|---|---|
| [x] | F4-01 | Profil Bidang (halaman penuh) | `academicProfileController.js`, `views/admin/profil-akademik/*` | F3-09 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F4-02 | Pimpinan & Staf (slide-over, upload foto) | `staffController.js`, `views/admin/staff/*` | F3-09 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F4-03 | Unit (slide-over) | `unitController.js`, `views/admin/unit/*` | F3-09 | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F4-04 | Fakultas (slide-over, superadmin) | `facultyController.js`, `views/admin/faculties/*` | F3-09 | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F4-05 | Program Studi (slide-over, superadmin) | `programStudiController.js`, `views/admin/program-studi/*` | F4-04 | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F4-06 | Akun Pengguna (slide-over; bulk hanya Nonaktifkan, akun sendiri dikecualikan; reset password) | `userAccountController.js`, `views/admin/users/*`, `test/bulk.test.js` | F3-09 | Opus 5.5 / OpenAI berat | high |
| [x] | F4-07 | Pengaturan Situs (halaman penuh, superadmin; cache `siteSettingCache` tetap dibersihkan setelah simpan) | `siteSettingController.js`, `views/admin/settings/*` | F3-09 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F4-08 | Profil saya + Ubah password ke layout v2 | `views/admin/profile/*`, controller terkait | F3-09 | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F4-09 | Verifikasi fase F4 + deploy dev-akademik | — | F4-01–F4-08 | Sonnet 5.5 / OpenAI menengah | medium |

F4-01–F4-04 selesai dan terverifikasi lokal; lihat
[F4-01-04-VERIFICATION.md](F4-01-04-VERIFICATION.md). Deploy tetap bagian F4-09.
F4-05 juga selesai dan terverifikasi lokal; lihat
[F4-05-VERIFICATION.md](F4-05-VERIFICATION.md).
F4-06 selesai dan terverifikasi lokal; lihat
[F4-06-VERIFICATION.md](F4-06-VERIFICATION.md). Deploy tetap pada F4-09.

Seluruh F4 kini terdeploy dan terverifikasi di dev-akademik; lihat
[F4-VERIFICATION.md](F4-VERIFICATION.md). Uji penerimaan staf belum dilakukan.

## F5 — Bersih-bersih dan audit

| | ID | Tugas | Berkas utama | Bergantung | Model | Effort |
|---|---|---|---|---|---|---|
| [x] | F5-01 | Hapus `layouts/admin.ejs`, class khusus admin di `app.css`, komponen `views/components/` yang tidak lagi dipakai; pastikan tidak ada referensi tersisa (grep) | `views/layouts/admin.ejs`, `assets/css/app.css`, `views/components/` | F4-09 | Sonnet 5.5 / OpenAI menengah | medium |
| [x] | F5-02 | Pasang `strictCsp` sekali untuk seluruh `/admin`, hapus pemasangan per router | `server.js`, `routes/*.js` | F5-01 | Sonnet 5.5 / OpenAI menengah | low |
| [x] | F5-03 | Audit akhir: kriteria selesai SPEC §8 (a11y dua tema, ukuran `admin.css` ≤60 KB, `app.css` tidak bertambah, `npm test`), review kode seluruh perubahan | — | F5-02 | Opus 5.5 / OpenAI berat | high |
| [x] | F5-04 | Perbarui ARCHITECTURE §1 agar menggambarkan kondisi baru; hapus catatan "selama migrasi" | `docs/ARCHITECTURE.md` | F5-03 | Haiku 5.5 / OpenAI ringan | low |

F5 selesai dan terdeploy di dev-akademik (`f5-20261020-01`); lihat
[F5-DEPLOY.md](F5-DEPLOY.md) dan
[F5-01-02-VERIFICATION.md](F5-01-02-VERIFICATION.md).

## Catatan audit F5-03 (2026-10-20)

- Kriteria SPEC §8 1–6 lolos. Browser: 23 halaman diperiksa (status, layout v2, CSP, label, nama
  aksesibel, ID unik, form tanpa JS, panel `?partial=1`), console bersih, tanpa overflow di 375px dan
  1440px (menu aksi dibuka), tema terang/gelap berganti. Alur keyboard penuh (skip-link → baris →
  panel → Esc → fokus kembali) diuji di modul Unit.
- Diperbaiki: preferensi tema/sidebar kini berlaku di `/profile`; menu ⋯ (Reset Password di Akun
  Pengguna) tidak lagi menjorok keluar kartu; fokus kembali ke baris setelah panel ditutup walau URL
  berisi `#konten`.
- [ ] Sebelum deploy produksi: jalankan `node scripts/audit/upload-paths.js "$PWD"` dengan `.env`
  produksi. Record yang berkasnya di luar `/uploads/<modul>/` tidak bisa dihapus (sengaja). Di DB dev: 0.
