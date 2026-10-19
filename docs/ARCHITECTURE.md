# ARCHITECTURE — Aplikasi Bidang Akademik UNJANI

Bagian 1 menjelaskan sistem yang berjalan sekarang. Bagian 2 menjelaskan
arsitektur panel admin baru (`admin-v2`) sesuai [SPEC.md](SPEC.md) dan
[DESIGN.md](DESIGN.md). Bagian 3 mencatat keputusan arsitektur.

## 1. Sistem saat ini

### 1.1 Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Node.js, Express 4, `express-async-errors` |
| Data | MongoDB lewat Mongoose 8 (`models/`, plugin di `models/plugins/`) |
| View | EJS, dirender di server |
| CSS | Tailwind CSS v4 CLI: `assets/css/app.css` → `public/css/app.css` |
| JS klien | Alpine.js **CSP build** (`public/js/vendor/alpine-csp.min.js`) + komponen di `public/js/app.js` |
| Validasi | Zod (`validators/index.js`, fungsi `validate(schema, body)`) |
| Upload | multer (disk) + sharp untuk gambar (`utils/upload.js`, `utils/image.js`) |
| Auth | JWT di cookie `token` (`sameSite: lax`), bcrypt |
| Tes | `node --test` (`test/*.test.js`), unit test logika murni |

### 1.2 Alur permintaan

```
request
  → express.static(public/)            aset, maxAge 1y immutable
  → verifyOrigin                        CSRF: tolak POST lintas situs (cek Origin/Referer)
  → renderPage                          menambah res.renderPage(view, locals, layout)
  → helmet (tanpa CSP global)
  → soft auth                           JWT cookie → req.user, res.locals.user
  → locals: path, canonicalUrl, siteSetting (cache), alert dari ?success / ?error
  → notifikasi header admin             hanya untuk /admin + staf
  → router modul                        /admin/<modul> → requireAuth + requireAdmin|requireSuperadmin
  → controller                          validate(Zod) → Model → res.renderPage(...) | redirect
```

- `res.renderPage(view, locals, layout)` merender `view` lebih dulu, lalu
  merender `layout` dengan hasilnya sebagai `body`. Admin memanggilnya dengan
  `'layouts/admin'`.
- Pesan sukses/error dibawa lewat redirect dengan query `?success=` / `?error=`
  dan ditampilkan oleh komponen toast di layout.
- `middleware/strictCsp.js` (CSP tanpa inline) baru dipasang per route. Saat
  ini hanya di `/dev`.

### 1.3 Struktur folder

```
server.js              rakit middleware + daftarkan router
routes/                satu router per modul; guard peran di router.use(...)
controllers/           list/new/create/edit/update/destroy per modul
                       adminContentController.js = pabrik CRUD bersama News + Pengumuman
models/                skema Mongoose
validators/index.js    skema Zod + validate()
middleware/            authMiddleware, renderPage, verifyOrigin, strictCsp
utils/                 navigation (menu publik + admin), roles, upload, image, format, ...
views/layouts/         public.ejs, admin.ejs
views/admin/<modul>/   list.ejs, form.ejs
views/components/      partial bersama publik + admin lama
assets/css/app.css     sumber Tailwind (token @theme + @layer components)
public/                hasil build + upload (public/uploads/<modul>/)
scripts/               build-assets, build-manifest, migrate
test/                  unit test
```

### 1.4 Build dan deploy

- `npm run build` = `build:assets` (font, ikon, vendor JS dari `node_modules`
  ke repo) → `build:css` → `build:manifest` (hash `?v=` untuk `app.css` dan
  `app.js`, dibaca helper `assetUrl()`).
- Hasil build di-commit, jadi server produksi tidak butuh devDependencies.
- Deploy ke server dev-akademik dengan atomic swap + pm2.

### 1.5 Peran

`utils/roles.js`: `superadmin` (dan `admin` lama) serta `editor`.
`requireAdmin` = semua staf; `requireSuperadmin` = superadmin saja. Menu admin
(`utils/navigation.js` → `adminNav`) menyaring item dengan `canSee(item, user)`
berdasarkan properti `roles`.

## 2. Arsitektur admin-v2

Prinsip: **stack tidak berubah.** EJS dirender di server, Alpine CSP untuk
interaksi, Tailwind v4 untuk gaya. Setiap fitur baru harus tetap berfungsi
dasar tanpa JS (progressive enhancement).

### 2.1 Berkas baru dan yang berubah

```
assets/css/admin.css            BARU  sumber Tailwind khusus admin (token DESIGN.md, mode gelap)
public/css/admin.css            BARU  hasil build
public/js/admin.js              BARU  komponen Alpine khusus admin
views/layouts/admin-v2.ejs      BARU  shell admin baru
views/admin/_ui/*.ejs           BARU  komponen admin (tabel, bulk-bar, slide-over, field, ...)
middleware/adminPrefs.js        BARU  baca cookie admin_theme + admin_sidebar → res.locals
utils/bulk.js                   BARU  bulkHandler + daftar aksi
utils/listQuery.js              BARU  parse filter/sort/page dari query string (daftar putih)
middleware/renderPage.js        UBAH  dukung mode partial
utils/navigation.js             UBAH  struktur menu baru
package.json                    UBAH  skrip build:css:admin, build ikut admin.css
scripts/build-manifest.js       UBAH  TARGETS + css/admin.css, js/admin.js
scripts/build-assets.js         UBAH  ikon baru
```

Dihapus di fase akhir (F5): `views/layouts/admin.ejs`, class `.admin-nav-link`
dan class lain yang hanya dipakai admin lama di `assets/css/app.css`.

### 2.2 CSS terpisah

`assets/css/admin.css` adalah entri Tailwind sendiri dengan `@theme` sendiri
(token netral + aksen). Hasilnya `public/css/admin.css`, dimuat hanya oleh
`admin-v2.ejs`. Situs publik tidak memuat CSS admin, dan sebaliknya.

Mode gelap memakai variabel CSS:

```css
@theme { --color-surface: #ffffff; /* ... token terang ... */ }

:root[data-theme="dark"] { --color-surface: #18181b; /* ... */ }

@media (prefers-color-scheme: dark) {
  :root[data-theme="system"] { --color-surface: #18181b; /* ... */ }
}
```

Komponen hanya memakai utilitas token (`bg-surface`, `text-ink`), jadi tidak
ada varian `dark:` di template.

### 2.3 Preferensi tampilan

`middleware/adminPrefs.js`, dipasang untuk `/admin`:

- `admin_theme` ∈ `light | dark | system` (default `system`) → `res.locals.adminTheme`
- `admin_sidebar` ∈ `open | collapsed` (default `open`) → `res.locals.adminSidebar`

Layout merender `<html data-theme="…" data-sidebar="…">` langsung dari server,
jadi tidak ada kedipan. Komponen Alpine yang mengganti tema atau melipat
sidebar menulis cookie (`path=/admin; max-age=1 tahun; SameSite=Lax`) lalu
mengubah atribut di `<html>`. Nilai di luar daftar diabaikan.

### 2.4 Layout dan partial

`res.renderPage` diperluas dengan mode partial:

```js
// middleware/renderPage.js (sketsa)
res.renderPage = (view, locals = {}, layout = 'layouts/public') => {
  if (req.query.partial === '1') return res.render(view, { ...locals, partial: true });
  return res.render(view, locals, (err, body) => (err ? next(err) : res.render(layout, { ...locals, body })));
};
```

- Controller tidak tahu-menahu soal slide-over. Template form yang sama
  dipakai untuk halaman penuh dan isi panel.
- Template bisa memeriksa `partial` untuk menyembunyikan breadcrumb atau judul
  halaman yang sudah ditangani header panel.
- Respons partial diberi `Cache-Control: no-store`.
- Selama migrasi, controller modul yang sudah pindah memakai konstanta
  `ADMIN_LAYOUT = 'layouts/admin-v2'`. Setelah F5, konstanta itu satu-satunya
  layout admin.

### 2.5 Protokol slide-over

```
Klik "Ubah" (href=/admin/x/:id/edit)
  └─ Alpine slideOver mencegat klik
       GET /admin/x/:id/edit?partial=1          → HTML form (tanpa layout)
       history.pushState(?edit=:id)
       panel terbuka, fokus ke field pertama

Simpan
  └─ fetch POST /admin/x/:id?partial=1  body=FormData (upload ikut)
       ├─ 200 JSON { ok: true, message }        → tutup panel, muat ulang daftar, toast
       ├─ 422 HTML form + error                 → ganti isi panel, fokus ke ringkasan error
       └─ error jaringan / 5xx                  → panel tetap, isian tetap, pesan error
```

- Tanpa `partial=1`, controller tetap berperilaku seperti sekarang: redirect
  saat sukses, render ulang halaman penuh saat gagal. Status gagal validasi
  diubah dari 200 menjadi **422** di semua modul (tidak mengubah perilaku
  browser untuk form biasa).
- "Muat ulang daftar" = `fetch(location.href dengan ?partial=1&fragment=list)`
  lalu mengganti isi `<tbody>` dan pagination. Kalau gagal, fallback ke
  `location.reload()`.
- Membuka URL `?edit=:id` langsung: server merender daftar biasa, lalu
  `slideOver` membuka panel saat `alpine:init`.
- `verifyOrigin` tetap melindungi POST lewat `fetch` karena browser selalu
  mengirim header `Origin`.

### 2.6 Daftar, filter, urutan

`utils/listQuery.js` mengubah query string menjadi objek aman:

```js
parseListQuery(req.query, {
  sortable: ['title', 'updatedAt', 'status'],   // daftar putih per modul
  defaultSort: { updatedAt: -1 },
  filters: { status: ['published', 'draft'] },  // nilai yang diizinkan
  pageSize: 25,
}) // → { filter, sort, page, limit, skip, state }
```

`state` dipakai template untuk membangun tautan filter, urutan, dan
pagination tanpa kehilangan parameter lain. Pencarian teks memakai regex yang
di-escape (`utils/regex.js`).

### 2.7 Bulk action

Satu route per modul:

```
POST /admin/<modul>/bulk
body: action=<aksi>&ids[]=<id>…                          (pilihan eksplisit)
   atau action=<aksi>&scope=filter&<query filter aktif>  ("pilih semua hasil filter")
```

`utils/bulk.js`:

```js
bulkHandler({
  Model,
  basePath: 'news',
  noun: 'berita',
  actions: {                                   // hanya aksi yang didaftarkan yang diterima
    publish:   { label: 'diterbitkan', update: { status: 'published' } },
    unpublish: { label: 'dijadikan draf', update: { status: 'draft' } },
    delete:    { label: 'dihapus', run: ids => deleteWithFiles(ids) },
  },
  listQuery: { /* opsi parseListQuery yang sama dengan halaman daftar */ },
  exclude: req => [],                          // mis. Users: kecualikan akun sendiri
})
```

Urutan kerja handler:

1. Validasi Zod: `action` ∈ kunci `actions`; `ids` berupa ObjectId valid,
   1–500 item; atau `scope=filter` dengan hasil ≤500.
2. Susun daftar ID (eksplisit, atau `find(filter).select('_id')` untuk
   `scope=filter`), lalu kurangi dengan `exclude(req)`.
3. Jalankan `update` lewat `updateMany`, atau `run(ids)` untuk aksi yang
   punya efek samping (hapus file upload).
4. Redirect `303` ke `/admin/<modul>?<filter sebelumnya>&success=<N noun label>`.

Hapus massal memakai fungsi hapus yang sama dengan hapus tunggal, yang
dipisah dari controller menjadi `deleteWithFiles(ids)` per modul supaya file
upload ikut terhapus. Route `/bulk` didaftarkan **sebelum** `/:id` supaya tidak
tertangkap sebagai ID.

Peta aksi per modul ada di SPEC FR-ADM-33.

### 2.8 Komponen Alpine (`public/js/admin.js`)

Dimuat oleh `admin-v2.ejs` sebelum `alpine-csp.min.js`, didaftarkan di
`alpine:init`. Alpine CSP build tidak bisa mengevaluasi ekspresi inline, jadi
semua logika ada di sini dan template hanya menyebut nama properti/metode.

| Komponen | Tanggung jawab |
|---|---|
| `adminShell` | Lipat sidebar, laci HP, ganti tema (tulis cookie) |
| `moduleSearch` | Filter item menu, pintasan `/`, Enter membuka hasil teratas |
| `dataTable` | Checkbox baris/header, indeterminate, Shift+klik, mode pilih HP, sinkron ke `bulkBar` |
| `bulkBar` | Tampilkan jumlah, "pilih semua hasil filter", kirim form bulk, buka dialog hapus |
| `slideOver` | Fetch partial, pushState/popstate, fokus terkunci, submit `FormData`, tangani 200/422/error |
| `dirtyGuard` | Lacak perubahan form, konfirmasi saat menutup/meninggalkan |
| `shortcuts` | `N`, `Ctrl/Cmd+S`, abaikan saat fokus di input |
| `toast`, `disclosure`, `richtext` | Dipakai ulang dari `app.js` (disalin atau dipindah ke modul bersama) |

Komponen `richtext` dan `disclosure` dipakai publik dan admin. Supaya tidak
ada dua salinan, keduanya dipindah ke berkas bersama `public/js/shared.js`
yang dimuat kedua layout. Atau, kalau ukurannya kecil, `admin.js` memuat
salinannya sendiri. Keputusan diambil di F1-05 berdasarkan ukuran.

### 2.9 Keamanan

- Setiap router modul yang sudah dimigrasi memasang `strictCsp`. Layout v2
  tidak memakai skrip atau gaya inline. Setelah F5, `strictCsp` dipasang
  sekali untuk seluruh `/admin`.
- Route `/bulk` berada di router modul, jadi otomatis melewati guard peran
  modul tersebut.
- Semua input bulk divalidasi Zod. `scope=filter` memakai parser filter yang
  sama dengan halaman daftar (daftar putih), sehingga query tidak bisa
  disuntik.
- Cookie preferensi tidak sensitif dan nilainya divalidasi dari daftar tetap.

### 2.10 Menu

`utils/navigation.js` → `adminNav` disusun ulang sesuai SPEC §5. Setiap item
punya `href`, `icon`, `label`, dan `roles` bila dibatasi. Dua tes baru:

- **Kesesuaian guard:** untuk setiap item, `roles` sama dengan guard router di
  `server.js` (`requireSuperadmin` ⇔ `roles: SUPERADMIN`).
- **Tidak ada modul tersembunyi:** setiap prefix `/admin/<modul>` yang
  didaftarkan di `server.js` punya item menu, kecuali daftar pengecualian
  eksplisit (mis. `/admin/dashboard` sudah ada sebagai item sendiri).

### 2.11 Strategi migrasi

Dua layout hidup berdampingan sampai F5. Per modul:

1. Controller: ganti `'layouts/admin'` → `ADMIN_LAYOUT`, pakai `parseListQuery`,
   status 422 saat validasi gagal, respons JSON untuk `partial=1` saat sukses.
2. Router: tambah `strictCsp`, route `POST /bulk`.
3. View: tulis ulang `list.ejs` dan `form.ejs` memakai `views/admin/_ui/`.
4. Tes unit untuk konfigurasi bulk modul.
5. Cek browser (daftar periksa di TODO.md).

Modul yang belum dimigrasi tetap memakai layout lama tanpa perubahan.

## 3. Catatan keputusan (ADR ringkas)

| # | Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|---|
| ADR-01 | Tetap EJS + Alpine CSP + Tailwind v4 | Controller, validator, tes, dan pipeline deploy tetap terpakai; semua kebutuhan UI bisa dipenuhi | SPA Vue/React (tulis ulang 21 controller + build baru); htmx (dependensi baru, dua paradigma) |
| ADR-02 | CSS admin terpisah dari publik | Admin punya gaya sendiri; perubahan admin tidak bisa merusak publik; ukuran CSS publik tidak naik | Satu `app.css` dengan scope `.admin` |
| ADR-03 | Mode gelap lewat variabel CSS + cookie | Tidak ada kedipan karena server merender `data-theme`; tanpa varian `dark:` di template | `localStorage` (butuh skrip inline sebelum render, melanggar CSP) |
| ADR-04 | Slide-over memuat partial HTML, bukan JSON | Satu template form untuk dua mode; validasi tetap di server | API JSON + render di klien |
| ADR-05 | Satu `bulkHandler` generik + konfigurasi per modul | Logika validasi, batas, dan redirect tidak ditulis 21 kali | Endpoint bulk tulisan tangan per modul |
| ADR-06 | Migrasi bertahap per modul dengan dua layout | Admin tetap bisa dipakai setiap saat; staf bisa mencoba per fase | Ganti semua sekaligus |
| ADR-07 | Peran tidak diubah | Di luar lingkup proyek | Izin per modul atau per prodi |
