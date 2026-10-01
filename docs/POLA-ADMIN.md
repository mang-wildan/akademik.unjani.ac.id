# Pola Acuan Modul Admin (F4)

Modul **Pengumuman** adalah pola acuan untuk seluruh modul CRUD admin di F4 (lihat `docs/TODO.md`). Dokumen ini menjelaskan strukturnya dan jebakan-jebakan yang sudah ditemukan, supaya modul berikutnya (Berita, Kalender Akademik, Akreditasi, dst.) tidak mengulang penyelidikan yang sama.

## Struktur file per modul

```
controllers/adminContentController.js   ← factory bersama (lihat di bawah)
controllers/pengumumanController.js     ← delegasi tipis ke factory
routes/pengumumanRoutes.js              ← multer + checkUploads + requireAuth/requireAdmin
views/admin/pengumuman/list.ejs
views/admin/pengumuman/form.ejs
```

### Kapan pakai factory vs kontroler sendiri

`adminContentController.js` dibuat khusus untuk skema yang identik (Pengumuman & News berbagi `models/plugins/content.js`: `title`, `body`, `kategori`, `status`, `pinned`, `featuredImage`, `attachments[]`). Modul dengan skema berbeda (Akreditasi, Kalender, Kurikulum, dll.) **tidak** memakai factory ini — tulis kontroler sendiri, tapi ikuti pola view dan konvensi di bawah.

```js
// controllers/newsController.js — contoh replikasi ke modul berskema sama
module.exports = require('./adminContentController')({
  Model: require('../models/News'),
  jenis: 'berita',
  basePath: 'berita',
  listLabel: 'Berita',
  singularLabel: 'Berita',
});
```

## Konvensi list.ejs

- 3 `stat-tile` (Terbit/Draf/Disematkan) dalam `grid-cols-3`.
- Tab status (`role="tablist"`) + filter kategori (`onchange submit`) + pencarian — semua lewat `GET` querystring, **tanpa JS wajib**.
- `<table class="data-table data-table--stack">` — lihat jebakan CSS di bawah.
- Kolom "Aksi": tombol "Ubah" berlabel langsung terlihat; **Sematkan/Lepas sematan dan Hapus disembunyikan di belakang menu "⋯"** (`x-data="disclosure"`, `aria-haspopup="true"`, `aria-label="Aksi lain untuk <judul>"`). Hapus memakai `confirm-dialog` (`<dialog>` native + `data-dialog-open`).
- Setiap aksi mutasi (sematkan, hapus) adalah **POST + redirect biasa**, bukan fetch/AJAX — supaya tetap berfungsi tanpa JavaScript aktif (lihat komentar di `togglePin`).

## Konvensi form.ejs

- Grid 3 kolom: isi utama (judul + `richtext-field`) 2 kolom, metadata (kategori/status/sematkan/gambar/lampiran) 1 kolom.
- Validasi dua lapis, keduanya **wajib** diverifikasi saat menguji modul baru:
  1. **Klien**: atribut `required` native HTML pada `form-field.ejs` — mencegah submit sama sekali jika kosong (tidak ada request ke server). Ini **bukan bug** meski terlihat seperti "tidak ada pesan galat" saat diuji otomatis — cek dengan melepas `required` via `page.evaluate` sebelum submit untuk menguji lapisan server.
  2. **Server**: `validate(schemas.content, req.body)` dari `validators/index.js` (Zod) — lapisan pertahanan sesungguhnya untuk klien non-browser. Pesan galat dirender lewat `errors.<field>` ke `form-field.ejs`/`richtext-field.ejs` (`class="field-error"`, `id="f-<field>-error"`).
- Lampiran saat edit: checkbox "keep" per lampiran + **sentinel tersembunyi** `attachmentsEditable=1`. Tanpa sentinel ini, server tidak bisa membedakan "semua lampiran sengaja dihapus (tidak ada checkbox tercentang)" dari "form ini memang tidak replace lampiran" — keduanya sama-sama mengirim field `keepAttachment` kosong.
- Checkbox "Sematkan" harus `size-6` (24px), bukan `size-5` (20px) — WCAG 2.5.8 minimum tap target.

## Opsi factory untuk aturan khusus modul

`adminContentController.js` menerima opsi tambahan untuk aturan yang beda tipis antar-modul berskema sama, tanpa menduplikasi seluruh kontroler. Contoh nyata — Berita (FR-M-02: "seperti Pengumuman + gambar sampul wajib saat Terbit"):

```js
module.exports = require('./adminContentController')({
  Model: require('../models/News'), jenis: 'berita', basePath: 'news',
  listLabel: 'Berita', singularLabel: 'Berita',
  requireFeaturedImageOnPublish: true, // menolak status 'published' tanpa featuredImage (create & update)
});
```

Kalau modul berikutnya butuh aturan serupa yang tidak cocok sebagai boolean sederhana, tambahkan opsi baru dengan pola yang sama (default aman, eksplisit di-set oleh modul yang butuh) — jangan fork seluruh factory.

## Jebakan CSS yang sudah ditemukan (`assets/css/app.css`)

Dua kelas masalah terpisah, keduanya menyebabkan overflow horizontal di mobile (390px) pada tabel admin — jangan anggap satu fix menyelesaikan keduanya:

1. **`.data-table--stack thead`**: `width` adalah no-op pada `display: table-header-group/-row/-cell`, jadi teknik `sr-only` (yang mengandalkan `width: 1px`) tidak berlaku kecuali SETIAP elemen turunan dengan display tabel (`thead`, `thead tr`, `thead th` — bukan cuma `thead` saja) dipaksa `display: block`.
2. **Komponen flex/grid manapun yang menaruh teks di sebelah elemen `shrink-0`** (ikon, lencana) butuh `min-w-0` eksplisit pada wadah teksnya. `min-width: auto` adalah default flex/grid — tanpa `min-w-0`, teks tidak bisa menyusut di bawah lebar kontennya sendiri, sehingga mendorong saudara `shrink-0`-nya keluar viewport. Ini terjadi di `stat-tile.ejs` dan kemungkinan besar bisa terjadi lagi di komponen baru manapun dengan pola ikon+teks dalam flex row. **Periksa `min-w-0` di setiap komponen baru yang menggabungkan ikon tetap dengan teks yang bisa panjang.**

Setelah mengubah `assets/css/app.css`, **wajib** `npm run build:css` sebelum menguji — kelas baru tidak otomatis muncul di `public/css/app.css`.

## Modul dengan sub-koleksi bersarang (bukan skema datar)

Pengumuman/Berita punya skema datar dan cocok dengan factory `adminContentController.js`. Modul dengan array tersarang yang masing-masing punya identitas sendiri (mis. Kalender Akademik: `events[]` kegiatan dan `lampiran[]` surat edaran per tahun ajaran) **tidak cocok dengan factory** — tulis kontroler sendiri (lihat `controllers/academicCalendarController.js`), tapi tetap ikuti konvensi ini:

- Form utama (field datar milik dokumen induk) dan form sub-item dipisah: sub-item hanya bisa dikelola setelah dokumen induk tersimpan (halaman "ubah"), bukan dicoba digabung jadi satu submit raksasa.
- Tiap mutasi sub-item (tambah satu kegiatan, hapus satu kegiatan, tambah satu lampiran) adalah **POST + redirect terpisah**, bukan dikumpulkan dalam array dinamis sisi klien — konsisten dengan filosofi "tiap mutasi adalah form biasa, berfungsi tanpa JS" di seluruh admin.
- Gunakan `<details><summary>` native untuk menyembunyikan form "tambah" di balik satu baris judul yang bisa diklik — tidak perlu Alpine untuk sekadar show/hide non-kritis.
- Untuk aksi hapus baris yang jumlahnya bisa banyak (kegiatan dalam satu tahun ajaran), `window.confirm()` native via atribut `data-confirm` pada `<form>` (lihat handler di `public/js/app.js`) lebih ringan daripada satu `<dialog>` per baris — dipakai untuk hapus kegiatan, sementara hapus dokumen induk (seluruh tahun ajaran) tetap pakai `<dialog>` `confirm-dialog.ejs` karena dampaknya jauh lebih besar.
- Impor massal (CSV) yang **mengganti seluruh sub-koleksi** harus dinyatakan eksplisit di teks UI ("akan mengganti seluruh daftar...") dan tidak pernah menyimpan sebagian saat ada baris error — validasi seluruh file dulu, baru simpan semuanya sekaligus atau tidak sama sekali.

### Jebakan: `.lean()` tidak menerapkan default skema Mongoose

Dokumen lama di database (disalin dari skema sebelum field baru ditambahkan) bisa benar-benar tidak punya field itu sama sekali di MongoDB. Query dengan `.populate()`/hydrasi biasa menerapkan default skema (`events: { default: [] }`) saat dokumen di-instantiate, **tapi `.lean()` mengembalikan data mentah apa adanya** — field yang hilang di DB tetap `undefined`, bukan `[]`. Ini menyebabkan `item.events.length` di EJS melempar `TypeError` untuk dokumen lama, meski skema mendeklarasikan default. Perbaikan: normalisasi manual setelah `.lean()` untuk field array apa pun yang mungkin hilang pada data lama (`c.events || []`) — jangan andalkan default skema begitu saja saat memakai `.lean()`. `scripts/migrate/007-readiness.js` sudah mendeteksi kondisi ini sebelumnya tapi tidak memperbaikinya (read-only report), jadi kontroler tetap harus defensif.

### Jebakan: field lama `required: true` yang tidak pernah dilonggarkan

Modul yang skemanya sudah ditambah field baru di F2 tapi field LAMA-nya masih `required: true` di Mongoose (bukan cuma di Zod) akan gagal disimpan begitu form F4 berhenti mengisi field lama itu — error-nya `ValidationError` dari Mongoose, bukan dari `validate()` kita, jadi tidak tertangkap oleh pola render-ulang-dengan-errors biasa (muncul sebagai 500, bukan form dengan pesan galat). Ditemukan di `models/Accreditation.js`: `institusi`/`unit`/`tahun`/`akreditasi` v1 masih `required: true` padahal form F4 menulis `jenis`/`namaUnit`/`programStudi`/`peringkat`. **Sebelum menulis form F4 untuk modul lama, periksa field mana di skema Mongoose yang masih `required: true` tapi tidak lagi diisi oleh form baru — longgarkan ke optional (jangan hapus, data lama tetap butuh field itu).**

### Jebakan: `multer.memoryStorage()` membuat `checkUploads` diam-diam tidak berfungsi

`checkUploads`/`matchesSignature` (`utils/upload.js`) membaca isi file lewat `file.path` untuk verifikasi magic-byte. File yang diunggah dengan `multer.memoryStorage()` hanya punya `file.buffer`, tidak ada `.path` — `matchesSignature` mengembalikan `true` (lolos) untuk kasus ini tanpa memeriksa apa pun. Ditemukan di rute impor CSV Data Lulusan (v1 memakai `memoryStorage`). **Selalu pakai `multer.diskStorage()` untuk upload apa pun yang melewati `checkUploads`**, termasuk file sementara seperti CSV impor yang langsung dihapus setelah dibaca (lihat pola di `academicCalendarController.js`/`lulusanController.js`).

### Jebakan lain: checkbox butuh `shrink-0`, bukan cuma `min-w-0` di teks

Pola sebelumnya ("Jebakan CSS" di atas) menyebutkan teks di sebelah elemen `shrink-0` butuh `min-w-0`. Kebalikannya juga berlaku: elemen yang **harus tetap berukuran tetap** (checkbox `size-6`, ikon) butuh `shrink-0` eksplisit, bukan hanya mengandalkan class ukuran. Ditemukan pada checkbox "Aktif" di form Dokumen RPL (390px): labelnya cukup panjang ("Aktif (nonaktifkan untuk menandai sebagai arsip)") sehingga flexbox menyusutkan checkbox dari 24px ke 21px lebar sebelum menyusutkan teks. **Setiap checkbox/ikon berukuran tetap dalam flex row harus punya `shrink-0`**, diperbaiki sekaligus di keempat form yang memakai pola `flex items-center gap-2` + checkbox sematkan/status (Pengumuman, Berita, Dokumen Akademik, RPL).

## Bug kritis yang ditemukan saat menguji alur CRUD pertama kali (F4)

**`helmet()` tanpa konfigurasi `referrerPolicy` mematikan SEMUA form POST di seluruh situs, termasuk login.**

- Default Helmet menyetel header respons `Referrer-Policy: no-referrer`.
- Menurut spesifikasi Fetch, navigasi (termasuk submit `<form>`) dengan Referrer-Policy "no-referrer" membuat browser mengirim `Origin: null` pada request POST-nya (bukan cuma menghilangkan `Referer`).
- `middleware/verifyOrigin.js` (pertahanan CSRF berbasis Origin/Referer dari F1) menolak `Origin: null` karena tidak cocok dengan `req.hostname` — menghasilkan 403 pada **setiap** form POST, termasuk `/login`.
- **Diperbaiki** di `server.js`: `helmet({ ..., referrerPolicy: { policy: 'strict-origin-when-cross-origin' } })` — nilai default modern browser, tetap mengirim Origin asli pada navigasi sama-origin.
- **Pelajaran untuk modul berikutnya**: selalu uji submit form yang sesungguhnya (bukan cuma `GET` halaman) lewat browser asli sebelum menandai modul selesai — bug ini lolos dari pengujian page-load karena hanya muncul saat benar-benar mem-POST.

## Cara menguji modul baru (checklist)

1. `npm run build:css` jika ada perubahan `assets/css/app.css`.
2. Muat halaman list & form di 390px dan 1440px — cek `scrollWidth === clientWidth`.
3. Submit kosong → pastikan `required` klien mencegah request (tidak ada POST tercatat).
4. Lepas `required` via `page.evaluate` lalu submit kosong lagi → pastikan pesan galat server (`field-error`) muncul per kolom.
5. Submit valid → verifikasi redirect dengan `?success=`, item baru muncul di daftar.
6. Edit → verifikasi form terisi nilai lama, submit perubahan → verifikasi daftar ter-update.
7. Jika ada lampiran: uji keep/hapus lampiran saat edit.
8. Buka menu "⋯" → sematkan/lepas sematan → verifikasi batas 4 item (`PIN_LIMIT`) ditegakkan.
9. Buka menu "⋯" → Hapus → verifikasi `<dialog>` konfirmasi muncul → konfirmasi → item hilang dari daftar.
