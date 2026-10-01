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
