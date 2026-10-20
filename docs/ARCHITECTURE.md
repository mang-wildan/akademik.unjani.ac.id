# ARCHITECTURE — Aplikasi Bidang Akademik UNJANI

Bagian 1 menjelaskan sistem yang berjalan sekarang (setelah rombak admin F1–F5).
Bagian 2 merinci arsitektur panel admin (`admin-v2`) sesuai [SPEC.md](SPEC.md) dan
[DESIGN.md](DESIGN.md). Bagian 3 mencatat keputusan arsitektur.

## 1. Sistem saat ini

### 1.1 Stack

| Lapisan | Teknologi |
|---|---|
| Runtime | Node.js, Express 4, `express-async-errors` |
| Data | MongoDB lewat Mongoose 8 (`models/`, plugin di `models/plugins/`) |
| View | EJS, dirender di server; dua layout: `layouts/public.ejs` dan `layouts/admin-v2.ejs` |
| CSS | Tailwind CSS v4 CLI, dua entri terpisah: `assets/css/app.css` → `public/css/app.css` (publik), `assets/css/admin.css` → `public/css/admin.css` (admin) |
| JS klien | Alpine.js **CSP build** (`public/js/vendor/alpine-csp.min.js`); komponen bersama di `public/js/shared.js`, publik di `public/js/app.js`, admin di `public/js/admin.js` |
| Validasi | Zod (`validators/index.js`: `validate(schema, body)`, `bulkSchema`) |
| Upload | multer (disk) + sharp untuk gambar (`utils/upload.js`, `utils/image.js`) |
| Auth | JWT di cookie `token` (`sameSite: lax`), bcrypt |
| Tes | `node --test` (`test/*.test.js`): logika murni, render EJS, komponen Alpine di `vm`, dan rute modul dengan model tiruan |

### 1.2 Alur permintaan

```
request
  → express.static(public/)            aset, maxAge 1y immutable
  → body parser + cookieParser
  → adminPrefs                          /admin, /profile: cookie admin_theme, admin_sidebar → res.locals
  → strictCsp                           /admin, /dashboard, /profile: CSP tanpa inline
  → verifyOrigin                        CSRF: tolak POST lintas situs (cek Origin/Referer)
  → renderPage                          res.renderPage(view, locals, layout); ?partial=1 → view saja
  → helmet (CSP global dimatikan; CSP ketat dipasang per area di atas)
  → soft auth                           JWT cookie → req.user, res.locals.user
  → locals: path, canonicalUrl, siteSetting (cache), alert dari ?success / ?error
  → router modul                        /admin/<modul> → requireAuth + requireAdmin|requireSuperadmin
  → controller                          parseListQuery / validate(Zod) → Model → renderPage | redirect | JSON
```

- Halaman admin dirender dengan `res.renderPage(view, locals, 'layouts/admin-v2')`;
  halaman publik memakai `layouts/public` (default).
- Pesan sukses/error dibawa lewat redirect `?success=` / `?error=` dan
  ditampilkan oleh toast di layout. Permintaan panel (`?partial=1`) dijawab
  JSON `{ ok, message }` saat sukses dan 422 + HTML form saat validasi gagal.
- `app.locals` menyediakan helper view: `icon`, format tanggal/angka, menu
  (`adminNav`, `canSee`, `isActive`), `roleLabel`, `assetUrl`, `listHref`, `pageItems`.
- `/dev/*` (katalog komponen, `/dev/admin-v2`) hanya dipasang bila
  `NODE_ENV` bukan `production`.

### 1.3 Struktur folder

```
server.js              rakit middleware + daftarkan router
routes/                satu router per modul; guard peran di router.use(...); POST /bulk sebelum /:id
controllers/           list/new/create/edit/update/destroy/bulk per modul
                       adminContentController.js = pabrik CRUD Berita + Pengumuman
                       masterDataController.js   = pabrik Fakultas + Lembaga Akreditasi
models/                skema Mongoose
validators/index.js    skema Zod + validate() + bulkSchema()
middleware/            authMiddleware, renderPage, verifyOrigin, strictCsp, adminPrefs
utils/                 navigation (menu publik + admin), roles, listQuery, bulk, academicAdmin,
                       upload, image, format, ...
views/layouts/         public.ejs, admin-v2.ejs
views/admin/_ui/       komponen admin (shell, tabel, filter, bulk, slide-over, field, toast, ...)
views/admin/<modul>/   list.ejs, form.ejs (form dipakai halaman penuh dan isi panel)
views/components/      partial halaman publik (dan katalog /dev/komponen)
assets/css/            app.css (publik), admin.css (admin): sumber Tailwind
public/                hasil build + upload (public/uploads/<modul>/)
scripts/               build-assets, build-manifest, migrate, audit/upload-paths.js
test/                  tes node --test
docs/                  SPEC, DESIGN, ARCHITECTURE, TODO, catatan verifikasi per fase
```

### 1.4 Build dan deploy

- `npm run build` = `build:assets` (font, ikon, vendor JS dari `node_modules`
  ke repo) → `build:css` → `build:css:admin` → `build:manifest` (hash `?v=`
  untuk `app.css`, `app.js`, `admin.css`, `admin.js`, `shared.js`, dibaca
  helper `assetUrl()` saat server mulai; restart server setelah build).
- Hasil build di-commit, jadi server produksi tidak butuh devDependencies.
- Deploy ke server dev-akademik dengan atomic swap + pm2. Rilis aktif di dev
  per 20 Oktober 2026 adalah F5 (`f5-20261020-01`); verifikasi serta rollback:
  [F5-DEPLOY.md](F5-DEPLOY.md).
- Sebelum deploy produksi: `node scripts/audit/upload-paths.js "$PWD"` dengan
  `.env` produksi (lihat §2.7).

### 1.5 Peran

`utils/roles.js`: `superadmin` (dan `admin` lama) serta `editor`.
`requireAdmin` = semua staf; `requireSuperadmin` = superadmin saja. Menu admin
(`utils/navigation.js` → `adminNav`) menyaring item dengan `canSee(item, user)`
berdasarkan properti `roles`; tes memastikan `roles` setiap item sama dengan
guard router-nya.

## 2. Arsitektur admin-v2

Prinsip: **stack tidak berubah.** EJS dirender di server, Alpine CSP untuk
interaksi, Tailwind v4 untuk gaya. Setiap fitur baru harus tetap berfungsi
dasar tanpa JS (progressive enhancement).

### 2.1 Berkas yang ditambahkan dan diubah oleh rombak

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

Dihapus di F5: `views/layouts/admin.ejs`, view contoh admin lama, dan class
`.admin-nav-link` di `assets/css/app.css`. Komponen `views/components/` dan
aturan tabel publik (`.data-table--stack`) tetap karena dipakai halaman publik.

### 2.2 CSS terpisah

`assets/css/admin.css` adalah entri Tailwind sendiri dengan `@theme` sendiri
(token netral + aksen). Hasilnya `public/css/admin.css`, dimuat hanya oleh
`admin-v2.ejs`. Situs publik tidak memuat CSS admin, dan sebaliknya.

Mode gelap memakai variabel CSS. Varian `dark` didefinisikan sekali untuk dua
kondisi (dipilih eksplisit, atau "ikuti sistem" saat OS gelap), sehingga nilai
gelap hanya ditulis di satu blok:

```css
@custom-variant dark {
  &:where([data-theme="dark"], [data-theme="dark"] *) { @slot; }
  @media (prefers-color-scheme: dark) {
    &:where([data-theme="system"], [data-theme="system"] *) { @slot; }
  }
}

@theme static { --color-surface: #ffffff; /* ... token terang ... */ }

:root {
  color-scheme: light;
  @variant dark { color-scheme: dark; --color-surface: #18181b; /* ... */ }
}
```

- `@theme static` memastikan semua variabel token selalu dikeluarkan, termasuk
  yang belum dipakai utilitas mana pun.
- Blok `:root` gelap tidak berada di layer, jadi menang atas `@layer theme`.
- `color-scheme` ikut berganti, sehingga scrollbar dan kontrol bawaan browser
  ikut gelap.
- Komponen hanya memakai utilitas token (`bg-surface`, `text-ink`), jadi
  template tidak butuh kelas `dark:`.
- `test/adminTokens.test.js` membaca kedua blok dari sumber CSS dan menguji
  kontras semua pasangan token di kedua tema.

### 2.3 Preferensi tampilan

`middleware/adminPrefs.js`, dipasang untuk `/admin` dan `/profile` (keduanya layout admin-v2):

- `admin_theme` ∈ `light | dark | system` (default `system`) → `res.locals.adminTheme`
- `admin_sidebar` ∈ `open | collapsed` (default `open`) → `res.locals.adminSidebar`

Layout merender `<html data-theme="…" data-sidebar="…">` langsung dari server,
jadi tidak ada kedipan. Komponen Alpine yang mengganti tema atau melipat
sidebar menulis cookie dua kali, `Path=/admin` dan `Path=/profile`
(`Max-Age` 1 tahun, `SameSite=Lax`), lalu mengubah atribut di `<html>`.
Bukan `Path=/`: cookie lama ber-`Path=/admin` akan terkirim lebih dulu dan
menang di `/admin`, sehingga pilihan baru tidak tersimpan. Nilai di luar daftar
diabaikan.

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
- `layouts/admin-v2` adalah satu-satunya layout admin. Beberapa controller
  menyimpannya di konstanta lokal `ADMIN_LAYOUT`.

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
- "Muat ulang daftar" = `fetch(URL daftar saat ini + ?partial=1)`, lalu elemen
  `[data-list-region]` di halaman diganti dengan elemen yang sama dari respons.
  Region membungkus page-header + kartu daftar; `_ui/slide-over` harus berada
  di luarnya. Kalau region tidak ada atau fetch gagal: navigasi ulang ke daftar
  dengan `?success=`, jadi pesan tetap tampil lewat toast server.
- Membuka URL `?edit=:id` langsung: server merender daftar biasa, lalu
  `slideOver` membuka panel saat `alpine:init` tanpa menambah entri riwayat;
  menutupnya memakai `replaceState`.
- `verifyOrigin` tetap melindungi POST lewat `fetch` karena browser selalu
  mengirim header `Origin`.
- Permintaan panel memakai `Accept: application/json, text/html;q=0.9`, sehingga
  sesi yang berakhir dibalas 401 JSON oleh `requireAuth` (bukan redirect ke
  `/login` yang bisa disangka "tersimpan").
- Body dikirim seperti submit biasa: `FormData` (multipart) hanya bila form
  ber-`enctype="multipart/form-data"`, selain itu `URLSearchParams`, karena modul
  tanpa upload hanya mengurai `urlencoded`.
- Fallback untuk handler yang menjawab dengan redirect (bukan JSON): redirect
  ke daftar dengan `?success=` dianggap tersimpan; redirect tanpa `?success=`
  dianggap gagal.
- Setelah panel ditutup tanpa memuat ulang daftar, fokus dikembalikan ke tautan
  pemicu: kembali lewat `history.back()` bisa memfokuskan target `#fragmen`
  (mis. `#konten` setelah skip-link) sesudah dialog mengembalikan fokus.
- Escape ditangani di `keydown` (`preventDefault`), bukan hanya di event
  `cancel`: Chrome bisa mengirim `cancel` yang tidak bisa dibatalkan bila tidak
  ada aktivasi pengguna sejak dialog dibuka. Event `close` dari browser menjadi
  jaring pengaman: ada perubahan → panel dibuka lagi dengan konfirmasi.
- Perubahan belum tersimpan: tombol tutup, Escape, klik backdrop, dan Back
  memunculkan bilah "Buang perubahan / Lanjut mengedit" (Back memulihkan entri
  riwayat panel lebih dulu); meninggalkan halaman memicu `beforeunload`.
- Kontrak isi form panel: `[data-panel-title]` (judul panel), `[data-save-form]`
  (Ctrl/Cmd+S), `[data-slide-close]` (mis. tautan Batal menutup panel),
  `data-no-slide` (form dikirim biasa). Bilah aksi memakai kelas `.form-actions`.

### 2.6 Daftar, filter, urutan

`utils/listQuery.js` mengubah query string menjadi objek aman:

```js
parseListQuery(req.query, {
  sortable: ['title', 'updatedAt', 'status'],   // daftar putih per modul
  defaultSort: { updatedAt: -1 },
  filters: { status: ['published', 'draft'] },  // nilai yang diizinkan
  searchFields: ['title'],                    // default; q dicari lewat $or
  pageSize: 25,
}) // → { filter, sort, page, limit, skip, state }
```

`state` dipakai template untuk membangun tautan filter, urutan, dan
pagination tanpa kehilangan parameter lain. Pencarian teks memakai regex yang
di-escape (`utils/regex.js`).

Impor: `const { parseListQuery } = require('../utils/listQuery')`.
Konfigurasi berasal dari kode modul, bukan query pengguna. `filters` memetakan
nama field ke daftar nilai yang diizinkan; nilai boolean/angka dicocokkan
dengan string query lalu dikembalikan dalam tipe aslinya pada `filter`.
`q` dicari tanpa membedakan kapital pada `searchFields` (default `['title']`;
daftar kosong mematikan pencarian), tanpa menimpa filter field yang sama.

`sort` hanya menerima field dalam `sortable`, dengan `dir=asc|desc`.
Tanpa arah valid, arah field pada `defaultSort` dipakai, atau `asc`.
Tanpa field valid, seluruh `defaultSort` dipertahankan. `page` harus berupa
bilangan desimal positif dengan offset aman, selain itu kembali ke 1;
`pageSize` adalah bilangan bulat positif dari konfigurasi (default 25).
Pembatasan halaman terhadap jumlah hasil tetap dilakukan controller.

`state` adalah objek string: filter valid, `q` yang sudah di-trim, `sort`/`dir`
jika field sort dipilih, dan `page` yang dinormalisasi. Contoh tautan:
`new URLSearchParams({ ...state, page: 2 })`. Parameter sementara seperti
`partial`, `fragment`, `success`, `error`, atau `edit` tidak ikut diteruskan.
Array, objek, dan properti warisan dalam query diabaikan.

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
    delete:    { label: 'dihapus', run: async ids => ({ done, failed }) }, // hapus record + berkas
  },
  listQuery: { /* opsi parseListQuery yang sama dengan halaman daftar */ },
  exclude: req => [],                          // mis. Users: kecualikan akun sendiri
})
```

Urutan kerja handler:

1. Validasi Zod (`bulkSchema` di `validators/index.js`): `action` ∈ kunci
   `actions`; `ids` berupa ObjectId valid, 1–500 item; atau `scope=filter`
   dengan hasil ≤500 (dihitung dengan `countDocuments` sebelum apa pun diubah).
2. Cocokkan ID ke database: `find(filter).select('_id')`, dengan `filter` =
   `baseFilter` + ID eksplisit, atau `baseFilter` + filter daftar (daftar putih
   `parseListQuery`). ID yang tidak ada atau di luar cakupan modul gugur di sini.
   Lalu kurangi dengan `exclude(req)`; jumlahnya dilaporkan sebagai "dilewati".
3. Jalankan `update` lewat `updateMany`, atau `run(ids, req)` untuk aksi yang
   punya efek samping (hapus file upload). `run` boleh mengembalikan jumlah
   atau `{ done, failed }`.
4. Redirect `303` ke `/admin/<modul>?<filter sebelumnya>&success=<pesan>`,
   mis. "12 berita diterbitkan" atau "2 akun dinonaktifkan, 1 dilewati".
   Input tidak valid, hasil kosong, atau semua gagal → `&error=<pesan>`.
   Tujuan redirect selalu `/admin/<basePath>`; filter yang dibawa kembali
   disaring ulang dengan `parseListQuery`.

Kesalahan konfigurasi (aksi tanpa `update`/`run`, `basePath` bukan slug)
dilempar saat router dimuat, bukan saat permintaan masuk.

Hapus massal memakai fungsi hapus yang sama dengan hapus tunggal (mis.
`deleteItem` di `utils/academicAdmin.js`) supaya file upload ikut terhapus.
Berkas dihapus lebih dulu, baru record: `removeUploadFiles` menolak URL di luar
`/uploads/<basePath>/`, sehingga record dengan path tidak aman tetap tersimpan
dan dilaporkan sebagai gagal. `scripts/audit/upload-paths.js` menghitung record
seperti itu (hanya-baca). Route `/bulk` didaftarkan **sebelum** `/:id` supaya tidak
tertangkap sebagai ID.

Peta aksi per modul ada di SPEC FR-ADM-33.

Modul akademik, akreditasi, dan wisuda memakai `utils/academicAdmin.js` untuk
daftar berpaginasi serta penghapusan satuan/massal dengan pembersihan upload.
Validasi dan form bertingkat tetap di controller masing-masing. `parseQuery`
opsional pada `bulkHandler` menerima parser async yang sama dengan daftar:
filter nama referensi dan masa berlaku akreditasi (batas hari WIB) tetap identik
ketika admin memilih semua hasil filter. RPL memperbarui `status` boolean;
akreditasi memperbarui `isActive`, terpisah dari status masa berlaku.

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
| `toast`, `disclosure`, `richtext` | Didaftarkan sekali di `shared.js`, dipakai publik dan admin |

Keputusan F1-05: `toast`, `disclosure`, dan `richtext` dipindah tanpa perubahan
perilaku ke `public/js/shared.js` agar tidak ada dua salinan. Layout publik
publik memuat `shared.js` → `app.js` → Alpine CSP, semuanya `defer`.
Layout admin-v2 memuat `shared.js` → `admin.js` → Alpine CSP; `app.js` tidak
dimuat. Ketiga berkas aplikasi memakai `assetUrl()` dan hash manifest.

`adminShell.init()` membaca `data-theme` dan `data-sidebar` pada `<html>`
yang dirender server. `toggleSidebar()` mengganti `open`/`collapsed`;
`setTheme($event)` membaca `data-theme="light|dark|system"` dari tombol.
Keduanya memperbarui atribut `<html>` dan cookie sesuai §2.3. Mode `system`
mengikuti OS lewat CSS, tanpa listener JavaScript tambahan. Laci HP memakai
`<dialog x-ref="drawer">`: `openDrawer()` memanggil `showModal()`,
`closeDrawer()` memanggil `close()`. Browser menangani Escape, batas fokus,
dan pengembalian fokus ke pemicu.

Komponen dasar `_ui/` mendokumentasikan parameter di awal setiap partial.
`errorSummary` memfokuskan ringkasan error; `confirmDialog` memakai dialog
native dengan fokus awal pada Batal. Tanpa JavaScript, form konfirmasi
tetap terlihat. Tombol POST masuk keadaan sibuk dan dicegah dikirim ulang,
kecuali form memakai `data-no-busy` atau submit telah dicegah oleh handler.
Toast admin memakai `data-toast-duration="5000"` dan event hover/fokus untuk
menjeda sisa waktu; toast publik tetap memakai durasi bawaan 6 detik.

Pada halaman daftar, kartu menjadi pembungkus `data-bulk-list` dengan
`x-data="bulkBar"`, `x-on:table-selection="selection"`, dan
`x-bind:data-bulk-active="active"`. Urutan partial: `bulk-bar`, `filter-bar`,
`data-table`, `pagination`. Parameter `bulk-bar.id` dan `data-table.bulkForm`
harus sama; `bulk-bar` menerima `action` (URL POST), `noun`, `total`, `state`,
dan `actions: [{ value, label }]` sesuai aksi yang diizinkan modul.

Checkbox baris terikat ke form bulk dengan `form=`. Bilah menyertakan `state`
dan `scope=selected|filter`; tombol submit menyertakan `action`. Pilih semua
hasil mencentang seluruh halaman dan memakai `scope=filter`; mengubah checkbox
kembali ke cakupan ID eksplisit, karena protokol tidak mendukung pengecualian
pilihan individual dari hasil filter. Event `bulk-clear`/`bulk-select-all`
dibatasi ke pembungkus daftar asalnya. Batal mengembalikan fokus ke kontrol
pilihan tabel. Jumlah pilihan diumumkan melalui wilayah `aria-live` permanen.

Di desktop bilah menggantikan filter; di HP posisinya di atas navigasi bawah.
Pilihan di atas 500 diblokir dan memilih semua hasil di atas 500 dinonaktifkan;
backend tetap memvalidasi jumlah sebenarnya. Aksi `delete` memakai dialog
native yang menyebut jumlah dan jenis data dengan fokus awal Batal. Form baru
dikirim setelah tombol konfirmasi diklik. Bulk membutuhkan JavaScript; alur
CRUD halaman penuh tetap menjadi jalur tanpa JavaScript. Contoh katalog
`/dev/admin-v2` mengirim ke endpoint demo dan tidak mengubah data.

### 2.9 Keamanan

- `strictCsp` dipasang sekali di `server.js` untuk `/admin`, `/dashboard`, dan
  `/profile`. Layout admin-v2 tidak memakai skrip atau gaya inline; `frame-src`
  hanya mengizinkan YouTube dan Google.
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

### 2.11 Pola modul admin

Migrasi bertahap (dua layout berdampingan, F1–F4) selesai di F5. Modul baru
atau yang diubah mengikuti pola yang sama:

1. Controller: `res.renderPage(view, locals, 'layouts/admin-v2')`, daftar lewat
   `parseListQuery` (atau `utils/academicAdmin.js`), status 422 saat validasi
   gagal, JSON `{ ok, message }` untuk `?partial=1` saat sukses.
2. Router: guard peran di `router.use(...)`, `POST /bulk` sebelum `/:id`.
3. View: `list.ejs` dan `form.ejs` memakai `views/admin/_ui/`; modul slide-over
   memberi `slideOver: true` dan menyertakan `_ui/slide-over` di luar
   `[data-list-region]`.
4. Menu: item di `adminNav` dengan `roles` sesuai guard (tes menolak modul tanpa menu).
5. Tes unit/rute modul; cek browser memakai daftar periksa di TODO.md.

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
