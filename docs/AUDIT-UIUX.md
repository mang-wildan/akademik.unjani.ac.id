# BAA UNJANI — Audit UI/UX

**Cakupan** situs publik (18 rute) + panel admin (37 rute) · **Lingkungan** lokal `http://localhost:8501`, database Atlas `sisfo-unjani` · **Akun** admin (login manual oleh pemilik) · **Viewport** 1440×900 (desktop), 390×844 (HP) · **Tanggal** 1 Oktober 2026 · **Mode** hanya-baca (GET), tidak ada form yang dikirim

Audit ini menjadi masukan untuk desain ulang dan untuk penyusunan `docs/SRS.md`. Setiap temuan disertai bukti berupa angka terukur, kutipan teks apa adanya, atau rujukan ke baris kode.

---

## Ringkasan

| Tingkat | Jumlah |
|---|---|
| Kritis | 7 |
| Mayor | 11 |
| Aksesibilitas | 6 |
| Catatan | 5 |
| Yang sudah baik | 6 |

Fondasi teknisnya cukup baik. Semua rute publik merespons 200 tanpa error di konsol, setiap gambar punya `alt`, dan panel admin konsisten serta form-nya rapi. Masalah situs ini terkumpul di tiga hal:

1. **Sisa template yang belum dibersihkan.** Situs publik dibangun dari template klub padel "Adelux". Hero beranda dan seluruh menu versi HP masih berisi konten padel.
2. **Konten uji coba yang terbit ke publik.** Berita, pengumuman, buku, dan data staf masih berisi "test", "rgwegewrg", dan Lorem ipsum.
3. **Data tidak divalidasi.** Contohnya, akreditasi yang sudah kedaluwarsa tetap berlabel "Aktif", dan tidak ada batas ukuran untuk file unggahan.

Ada juga tiga masalah **keamanan** (temuan 01, 02, dan K1–K2). Ketiganya di luar lingkup UI/UX, tetapi sebaiknya diperbaiki segera, tanpa menunggu desain ulang.

---

## Temuan

### 01 · Kritis · Keamanan · `/register`

**Siapa pun dapat mendaftar dan langsung menjadi admin.**

Form registrasi mengirim input tersembunyi `role`, dan server memakai nilai itu apa adanya saat membuat akun. Pengunjung cukup mengubah `user` menjadi `admin` di DevTools untuk mendapat akses penuh ke panel admin. Perilaku ini dipastikan dari kode dan **tidak** diuji coba.

```
views/auth/register.ejs:230   <input type="hidden" name="role" value="user">
controllers/authController.js:118   const { name, email, password, confirmPassword, role } = req.body;
controllers/authController.js:152   const user = new User({ name, email, password, role });
models/User.js:24                   enum: ['user', 'admin']
```

Halaman `/register` juga terbuka untuk umum dan memuat teks yang ditujukan untuk developer: *"Isi sesuai model user (nama opsional)."*

**Perbaikan:** abaikan `role` dari request dan selalu set `'user'`, atau tutup registrasi publik sama sekali karena situs ini tidak punya fitur untuk pengguna biasa. Setelah itu, periksa koleksi `users` untuk memastikan tidak ada admin yang tidak dikenal. Saat audit hanya ada satu akun.

---

### 02 · Kritis · Semua URL yang tidak dikenal

**Halaman 404 menampilkan stack trace server, termasuk path folder lengkap.**

Fallback 404 me-render `admin/index` tanpa variabel `recentActivities`, sehingga EJS melempar error. Akibatnya, setiap salah ketik URL menampilkan isi berkas server ke pengunjung. Template [views/landing/404.ejs](../views/landing/404.ejs) sebenarnya sudah ada, tetapi tidak dipakai.

```
GET /halaman-tidak-ada → 404
ReferenceError: C:\Users\unjani2\Documents\SISFO\Project\...\views\admin\index.ejs:94
  >> 94| <% if (recentActivities && recentActivities.length) { %>
recentActivities is not defined
    at ... server.js:232:7
```

Tombol **"Beranda"**, yang muncul di navbar publik untuk admin yang sudah login, juga mengarah ke halaman ini. Tombol itu menuju `/admin`, rute yang tidak terdaftar.

```
navbar CTA (login) → href="/admin"  →  GET /admin → 404 + stack trace
```

**Perbaikan:** render `landing/404` di fallback ([server.js:225](../server.js#L225)), set `NODE_ENV=production` agar stack trace tidak tampil, dan ubah CTA menjadi `/admin/dashboard` atau daftarkan redirect `/admin` → `/admin/dashboard`.

---

### 03 · Kritis · Semua halaman publik · HP

**Menu di HP membuka sidebar "Adelux Padel Club & Community", sedangkan menu BAA tertutup overlay.**

Tombol hamburger `.nav-btn` memicu dua hal sekaligus: collapse Bootstrap untuk menu BAA, dan `initSidebar()` dari template yang membuka sidebar padel. Akibatnya, pengunjung dari HP tidak bisa membuka halaman apa pun lewat menu.

```
klik .nav-btn @390px → .sidebar.active = true, #navbarNav.show = true (di bawah overlay)
isi sidebar: logo "Adelux Padel Club & Community"
  Home → ./index.html · About Us → ./about.html · Booking Court · Event · Membership
  Pages → Our Services · Coaching · Community · FAQ · Blog · Single Post · 404 Error
  Contact Us → ./contact.html          (semua tujuan .html tidak ada)
```

Sumber: [views/partials/landing-aside.ejs](../views/partials/landing-aside.ejs) dan `public/assets/landing-page/js/script.js:262`.

**Perbaikan:** hapus `landing-aside` dan `initSidebar()`, lalu pakai satu menu HP yang berisi navigasi BAA.

---

### 04 · Kritis · `/` (beranda)

**Hero beranda masih berisi copy dan gambar placeholder dari template klub padel.**

Bagian ini adalah layar pertama yang dilihat setiap pengunjung situs resmi universitas. Isinya ditulis langsung di [views/landing/index.ejs:64-117](../views/landing/index.ejs#L64-L117), bukan berasal dari database.

```
"Unlock Your Full Potential"
"With expert Padel tips, gear recommendations, and pro level training."
"25+  Padel Enthusiasts. One Club"
"Enjoy World-Class Facilities and a Thriving Community adipiscing elit ut elit."
"Active Members and Unlock Premium Padel Facilities"
"…a vibrant community at Adelux your premier padel destination. Lorem ipsum dolor sit amet…"
gambar: dummy-img-600x500.jpg (tampil sebagai kotak "600 x 500"), dummy-img-400x400.jpg ×7
tautan sosial hero: Facebook / Instagram / X Twitter / Tiktok → href="#"
```

Ada sisa template lain yang tidak tampil di layar tetapi masih ada di HTML: `index.ejs:617` *"Adelux Academy is officially recognized by 3 national-level padel…"*. Di sidebar berita, kotak "Ingin info terbaru?" memakai gambar placeholder `600x800`, dan tombol **Subscribe Now**-nya mengarah ke `javascript:void(0)` sehingga tidak melakukan apa-apa.

**Perbaikan:** ganti hero dengan informasi yang dicari pengunjung BAA, misalnya pengumuman terbaru, kalender akademik, dan layanan yang paling sering diakses. Hapus blok newsletter atau buat fiturnya benar-benar berfungsi. Ambil tautan sosial dari `SiteSetting`, karena datanya sudah ada.

---

### 05 · Kritis · `/berita`, `/pengumuman`, `/buku`, `/pimpinan-dan-staff`, `/`

**Konten uji coba tampil di situs publik dengan status "published".**

Data uji coba muncul di beranda, di halaman daftar, dan di sidebar "Recent Post". Ini dicek langsung di admin: ke-13 berita di daftar berstatus `published`, dan tidak ada satu pun yang berupa berita sungguhan.

```
Berita (13, semua published):  rgwegewrg · test · pm · edtbed · ghrdb · fasfaf · gjgjgj …
  isi: "bbsfjsaiajsbjfkasbjlfsnkcnaskncscsssadas&nbsp;"
Pengumuman:  "Informasi Pendaftaran Wisuda Periode I tahun 2026"
  isi: "What is Lorem Ipsum? Lorem Ipsum is simply dummy text…"  (slug: /pengumuman/da)
  judul lain: "gnfn", "threhre"   ·  tag: #test #gnfn #ggs #gdsg #ds
Buku:        "test" (2026), "dgsge" (2024)
Buku Wisuda: "Buku Kelulusan" — Tahun 2027 (tahun yang belum terjadi)
Staf:        "Ka. Ur. Test — Test, S.Test., M.Test." · "Staff AKademik — Dr. Test, S.Test"
```

Konten di beranda juga ikut tersemat (pinned): berita "rgwegewrg" dan pengumuman berisi Lorem ipsum ditampilkan sebagai **"Konten Prioritas"**.

**Perbaikan:** hapus atau ubah data uji coba ke status draft. Database yang diaudit adalah **salinan** dari database lama, jadi perlu dicek apakah data uji yang sama juga ada di database produksi. Ke depan, pisahkan database pengembangan, staging, dan produksi.

---

### 06 · Kritis · `/akreditasi`, `/` (grafik akreditasi)

**Keempat akreditasi yang sudah kedaluwarsa tetap berlabel "Aktif".**

Per 1 Oktober 2026, semua masa berlaku sudah lewat. Label "Aktif" berasal dari tombol `isActive` yang diatur manual, sedangkan tanggal `berlakuSampai` tidak pernah dibandingkan dengan tanggal hari ini. Untuk halaman yang dijadikan rujukan mutu, ini menyesatkan calon mahasiswa maupun asesor.

```
Institusi / Universitas      Aktif  Tahun 2025  Unggul  11/2/2021 – 11/2/2026   ✗ lewat
Perpustakaan Universitas     Aktif  Tahun 2024  A       28/7/2021 – 28/7/2026   ✗ lewat
Teknik Elektro S1            Aktif  Tahun 2021  B       22/4/2021 – 22/4/2026   ✗ lewat
Teknik Sipil S-1             Aktif  Tahun 2021  B       13/3/2021 – 13/3/2026   ✗ lewat

models/Accreditation.js:  tahun: Number · isActive: Boolean · tanggalBerlaku: Date · berlakuSampai: Date
```

Masalah kedua ada pada data: field **Tahun** terpisah dari tanggal berlaku. Akibatnya institusi tercatat "Tahun 2025" padahal berlaku sejak 2021. Field **Akreditasi** juga berupa teks bebas (placeholder admin: *"Contoh: A / Unggul / Baik Sekali"*), sehingga grafik beranda menghitung "A", "B", dan "Unggul" sebagai kategori yang sejajar.

**Perbaikan:** turunkan status dari tanggal (`berlakuSampai < hari ini` → "Kedaluwarsa"), dan pertahankan tombol manual hanya untuk menyembunyikan data. Ganti field Akreditasi dengan pilihan tetap sesuai peringkat BAN-PT/LAM, dan hapus field Tahun atau turunkan nilainya dari `tanggalBerlaku`.

---

### 07 · Kritis · Unggahan file (admin) → semua halaman publik

**Tidak ada batas ukuran untuk sebagian besar unggahan. Satu gambar berita berukuran 128 MB, dan beranda mengunduh 23,7 MB.**

Batas ukuran hanya ada pada unggahan profil, lulusan, program studi (2 MB), dan pengaturan (3 MB). Rute berita, pengumuman, staf, unit, buku, buku wisuda, kalender, dokumen, kurikulum, akreditasi, dan RPL memanggil `multer` **tanpa** `limits`. Gambar yang diunggah juga tidak dikompresi atau diubah ukurannya.

```
public/uploads/news/…TERRA_INFINITA_MAP_15K_(SFILE.MOBI).jpg    128.3 MB
public/uploads/staff/…favicon_sso.png                              5.6 MB
public/uploads/pengumuman/…OK_(4).png                              3.8 MB
public/assets/landing-page/images/logo.png (dimuat di semua halaman)  2.4 MB  → tampil 60×60 px

transfer per halaman (cold load, desktop):
  /                     23,761 KB · 52 request
  /pimpinan-dan-staff   10,767 KB
  /login                 8,314 KB
  /pengumuman            7,612 KB
  /admin/news          140,555 KB   ← gambar 128 MB dimuat utuh sebagai thumbnail tabel
```

Dengan paket data seluler, membuka beranda saja bisa memakan puluhan detik.

**Perbaikan:** tetapkan `limits.fileSize` di semua rute unggahan, ubah ukuran dan kompres gambar di server (misalnya ke WebP maksimal 1600 px), dan ganti logo dengan versi SVG atau PNG 120 px.

---

### 08 · Mayor · Semua halaman

**Respons server lambat: 2–5,5 detik sebelum byte pertama.**

Diukur berulang dengan `curl` setelah server siap (setiap angka = satu request):

```
/admin/dashboard   5.45s · 2.15s · 4.75s · 4.36s
/                  2.14s · 3.04s · 2.15s
/admin/news        2.01s · 1.92s
/admin/settings    9.82s (diukur oleh probe browser, satu kali)
```

Setiap request menjalankan middleware berurutan: verifikasi user, `SiteSetting.findOne()`, ditambah 4 query notifikasi di halaman admin, sebelum controller-nya sendiri berjalan. **Batasan pengukuran:** server lokal berkomunikasi dengan Atlas melalui internet, sehingga latensinya mungkin lebih tinggi daripada di server produksi. Meski begitu, jumlah query per request tetap menjadi faktor pengali.

**Perbaikan:** cache `SiteSetting` di memori dan muat ulang saat disimpan, jalankan query yang independen secara paralel, dan pakai `.lean()` serta proyeksi field.

---

### 09 · Mayor · Seluruh situs

**Bahasa situs bercampur: atribut `lang="en"` dipakai untuk konten berbahasa Indonesia, dan label UI setengah berbahasa Inggris.**

```
<html lang="en">  — semua halaman publik dan admin

Publik:  Home · Read More · Recent Post · Subscribe Now · Quick Links · Contact Info
         Phone Number · Email Address · Location · Map · Sign In · Previous / Next
Admin:   Books · Graduation Books · (sebelahnya) Lulusan · Kalender Akademik
         status "published" (huruf kecil, bahasa Inggris)
```

Nama untuk hal yang sama juga berbeda-beda:

```
menu "Kegiatan"          → halaman berjudul "Berita"
menu "Buku > Buku"       → judul "Buku Panduan", breadcrumb "Buku"
"Books" (admin)          ↔ "Buku" (publik)    ·  "Graduation" ↔ "Buku Wisuda" ↔ "Buku Kelulusan"
"Staff" / "staf"         dipakai bergantian
```

Ada juga salah ketik: **"Perpustkaan UNJANI"** (footer, semua halaman), **"yudidium"** (dokumen akademik), **"di kumpulkan"**, dan **"Staff AKademik"**.

**Perbaikan:** gunakan `lang="id"`, susun daftar istilah resmi (satu objek, satu nama), lalu terapkan ke semua label. Daftar istilah ini sebaiknya menjadi bagian dari SRS.

---

### 10 · Mayor · `/berita`, `/pengumuman`, `/`

**Ringkasan konten menampilkan kode HTML mentah.**

Isi berita disimpan sebagai HTML dari editor. Ringkasannya dibuat dengan regex penghapus tag, lalu di-escape lagi oleh EJS, sehingga entity dan tag yang sudah di-encode muncul sebagai teks.

```
"wdqwdqwfih rfgw&lt;a href:"unjani.ac.id"&gt;unjani&lt;/a&gt;…"
"bbsfjsaiajsbjfkasbjlfsnkcnaskncscsssadas&nbsp;"
"…Kepala Biro Kemahasiswaan &amp; Alumni UNJANI…"
```

**Perbaikan:** buat ringkasan dari teks hasil parsing HTML (decode entity sesudah tag dibuang), atau simpan field `excerpt` terpisah saat konten disimpan.

---

### 11 · Mayor · Semua halaman publik

**Konten utama hanya muncul setelah animasi scroll terpicu.**

Pada screenshot full-page tanpa scroll, seluruh area konten di `/akreditasi`, `/dokumen-akademik`, dan beranda terlihat kosong. Konten baru muncul setelah halaman digulir sampai ke tiap bagian. Bagi pengguna dengan perangkat lambat, fitur cetak, sebagian crawler, atau JavaScript yang gagal dimuat, halaman tampak kosong.

**Perbaikan:** biarkan konten terlihat secara default dan tambahkan animasi hanya sebagai peningkatan. Hormati preferensi `prefers-reduced-motion`.

---

### 12 · Mayor · `/` (beranda)

**Angka lulusan di beranda dan di admin tidak sejalan, dan label keduanya tidak menjelaskan apa yang dihitung.**

```
Beranda:   "Total lulusan: 11769 · Rentang Tahun: 2024 - 2025 · Periode Tertinggi: Periode II (8532)"
Admin:     kartu "Lulusan 172 — Statistik lulusan"
```

Angka 172 adalah jumlah *baris data*, sedangkan 11.769 adalah jumlah *orang*. Keduanya ditampilkan sebagai "lulusan" tanpa keterangan.

**Perbaikan:** beri label yang jelas, misalnya "172 entri data" di admin dan "11.769 lulusan (2024–2025)" di publik, serta format angka dengan pemisah ribuan sesuai `id-ID`.

---

### 13 · Mayor · `/buku-wisuda` · HP

**Halaman bisa digeser ke samping di HP.**

```
viewport 390px · scrollWidth 402px
elemen: body > main > div.row (right: 402px)
```

**Perbaikan:** baris grid Bootstrap di luar `.container` memakai margin negatif. Bungkus baris itu dengan `.container`, atau hilangkan margin negatifnya (`g-0`).

---

### 14 · Mayor · Panel admin (semua halaman)

**Topbar dan sebagian halaman admin masih memuat fitur demo dari template admin.**

```
Topbar › Bahasa:     English · French · Arabic · German      (tidak ada Bahasa Indonesia; href="javascript:void(0)")
Topbar › Shortcuts:  Calendar → app-calendar.html · Invoice App → app-invoice-list.html
                     User App · Role Management · Dashboard → index.html · Setting · FAQs   (semua .html tidak ada)
/admin/books, /admin/graduation-books (+ create/edit), /admin (index):
                     tombol gerigi mengambang "Template Customizer — Customize and preview in real time"
                     Theming · Skins · Semi Dark · Navbar Type · Direction: Right to Left (Ar)
```

Sumber: [views/partials/navbar.ejs:30-179](../views/partials/navbar.ejs#L30-L179) dan [views/partials/template-customizer.ejs](../views/partials/template-customizer.ejs). Setiap halaman admin juga melempar `TypeError: autocomplete is not a function` (lihat N4), dan dua aset template tidak ditemukan (lihat N5).

**Perbaikan:** hapus pemilih bahasa, menu shortcuts, dan template customizer. Pertahankan tombol tema terang/gelap kalau memang dipakai.

---

### 15 · Mayor · Tabel daftar di admin

**Tabel admin menampilkan detail teknis alih-alih informasi yang dibutuhkan admin.**

```
/admin/books
  JUDUL:  "dgsge"  +  "ID: 69843ca5a8944bc59603e783"      ← ObjectId MongoDB
  COVER:  "/uploads/books/1770273…"                     ← path file sebagai teks; thumbnail di kolom tanpa judul
  footer: "Showing 1 to 3 of 3 entries"                 ← bahasa Inggris (DataTables default)
  badge:  "Total: 3" dan "Total data: 3"                ← angka yang sama ditampilkan dua kali
/admin/news
  STATUS: "published"                                    ← nilai mentah enum, huruf kecil, bahasa Inggris
  FEATURED: gambar 128 MB dimuat utuh sebagai thumbnail → halaman mengunduh 140,555 KB
```

**Perbaikan:** tampilkan thumbnail di kolom "Cover" dan sembunyikan ID serta path. Pakai label status yang manusiawi (Terbit / Draf). Atur bahasa DataTables ke `id`. Buat thumbnail berukuran kecil saat file diunggah (lihat temuan 07).

---

### 16 · Mayor · Tabel daftar di admin · WCAG 4.1.2

**Tombol aksi (edit/hapus) hanya berupa ikon tanpa nama aksesibel, dan tombol hapus menempel di bawah tombol edit.**

```
/admin/news         25 kontrol tanpa nama
/admin/lulusan      25
/admin/program-studi 25 · /admin/faculties 25 · /admin/pengumuman 21
contoh: tombol ikon pensil / tempat sampah → accessibleName = ""
tombol topbar (bahasa, tema, shortcuts, notifikasi) juga tanpa nama
```

Pada screenshot, tombol pensil dan tempat sampah tersusun vertikal dan hampir menempel. Tekanan tombol yang meleset di HP dapat memicu aksi hapus. Apakah ada dialog konfirmasi sebelum menghapus **tidak diverifikasi**, karena audit tidak mengirim form apa pun.

**Perbaikan:** tambahkan `aria-label="Edit <judul>"` dan `aria-label="Hapus <judul>"`, beri jarak lebih lebar atau pindahkan aksi hapus ke menu "⋯", dan pastikan ada konfirmasi sebelum menghapus.

---

### 17 · Mayor · `/admin/dashboard`, `/dashboard` · HP

**Di HP, dashboard menampilkan 9 kartu statistik setinggi 5,6 layar sebelum isi yang bisa ditindaklanjuti.**

```
/admin/dashboard @390px: 5.6 layar scroll; kartu 1–9 (Books, Graduation, Lulusan, …) memenuhi layar pertama
kartu gradien terang (Graduation, Akreditasi, Staff): teks putih di atas biru/hijau muda — tidak lolos cek visual
```

Rute `/dashboard`, yaitu tujuan login untuk akun ber-role `user`, me-render tampilan yang sama ("Dashboard | Arsip Akademik") lengkap dengan tombol "Kelola" yang mengarah ke rute khusus admin. Situs ini tidak punya tampilan yang dirancang untuk pengguna non-admin.

**Perbaikan:** di HP, ringkas statistik menjadi satu baris yang bisa digeser atau satu daftar, lalu tampilkan "Update Terbaru" dan aksi cepat lebih dulu. Putuskan dalam SRS apakah role `user` memang dibutuhkan.

---

### 18 · Mayor · `/` (beranda, bagian Video Profil)

**Video profil yang tersemat di beranda berstatus privat, sehingga pengunjung tidak bisa memutarnya.**

```
Video Profil — "Saksikan video profil resmi untuk mengenal kampus…"
iframe YouTube → "This video is private. If the owner of this video has granted you access, please sign in."
sumber URL: SiteSetting.landingVideoUrl
```

**Perbaikan:** ubah status video menjadi *Public* atau *Unlisted* di YouTube, atau ganti URL-nya di Pengaturan Situs. Sembunyikan bagian ini secara otomatis bila `landingVideoUrl` kosong.

---

## Aksesibilitas

### A1 · WCAG 1.4.3 (Kontras) · global

**Warna utama gagal memenuhi rasio kontras minimum di banyak komponen.**

```
Label footer "Phone Number / Email Address / Location"  rgb(95,95,95) di atas hitam     3.29:1  (perlu 4.5)
Tombol & tag hijau (Sign In, #tag, Dashboard admin)     putih di atas #16A34A           3.30:1  (perlu 4.5)
Tautan hijau "Kembali ke Beranda", "Email"               #16A34A di atas putih           3.30:1
Menu aktif lime (Profil, Buku, Layanan Akademik)         #C6EF2E di atas putih           1.33:1
Badge akreditasi/buku wisuda (teal)                      #0D9394 di atas #E2F2F2         3.24:1  (12px)
Header "TABEL AKREDITASI"                                putih di atas #0D9394           3.74:1  (12px)
Placeholder password login                               #A8AAB4 di atas putih           2.31:1
Admin — tombol "Kelola" (outline)                        #72E128 / #FDB528 / #26C6F9     1.68–1.99:1
Admin — "Tambah", "Simpan", menu aktif sidebar           putih di atas #16A34A           3.30:1
Admin — "Kembali ke Situs" (55 kemunculan)               #16A34A di atas #F7F7F9         3.08:1
Admin — "Batal", "Kembali"                               #6D788D di atas #E8E9ED         3.67:1
Admin — badge "Total: 1"                                 #16A34A di atas #DAF0E2         2.75:1
```

Probe juga mencatat banyak hasil "putih di atas putih 1:1" pada navbar dan kartu bergradasi. Setelah dicek lewat screenshot, sebagian besar merupakan **false positive**, karena teksnya berada di atas foto atau gradien. Kartu statistik di dashboard admin (gradien hijau/biru muda dengan teks putih) tetap **tidak dapat diverifikasi** secara otomatis dan perlu dicek manual.

**Perbaikan:** gelapkan hijau utama untuk teks dan tombol (misalnya `#15803D`, sekitar 5:1 dengan putih). Pakai lime hanya sebagai latar dengan teks gelap, jangan sebagai warna teks di atas putih.

### A2 · WCAG 2.4.7 (Focus Visible) · `/login`, navbar

**Kolom email di halaman login tidak menampilkan indikator fokus.** Di navbar, indikator fokus hanya berupa bayangan biru 25% di atas foto.

```
/login  Tab → input email: outline none, box-shadow none → FAIL 2.4.7
navbar  Tab → "Home": outline none, box-shadow rgba(13,110,253,0.25) 0 0 0 4px  (di atas foto hero)
```

**Perbaikan:** tambahkan aturan `:focus-visible { outline: 2px solid <warna kontras ≥3:1>; outline-offset: 2px }` di stylesheet global.

### A3 · WCAG 2.5.8 (Ukuran target) · semua halaman publik

**Tautan menu utama hanya setinggi 16 px.** Setiap halaman memiliki 19–34 target sentuh di bawah 24 px.

```
navbar "Home" 66×16 · "Profil" · "Akreditasi" …   (desktop)
/berita: 34 target < 24px · /: 26 (desktop), 19 (HP)
```

### A4 · WCAG 3.1.1 (Bahasa halaman) · global

`<html lang="en">` dipakai untuk konten berbahasa Indonesia, sehingga pembaca layar mengeja kata Indonesia dengan pelafalan Inggris. Lihat temuan 09.

### A5 · WCAG 1.3.1 (Struktur heading) · global

Level heading melompat di semua halaman, contohnya `h4 → h6` di footer pada 15 rute, `h1 → h3` di `/profil` dan `/berita`, serta `h1 → h4` di `/struktur-organisasi`.

### A6 · WCAG 4.1.2 (Nama elemen) · `/dokumen-akademik`, `/kurikulum`, `/berita`

Tautan ikon `a.service-btn` dan tautan gambar di kartu berita tidak memiliki nama yang dapat dibaca pembaca layar.

---

## Catatan

- **N1 · SEO.** 15 dari 18 halaman publik tidak punya `<meta name="description">`, dan tidak ada Open Graph. Akibatnya, tautan yang dibagikan ke WhatsApp tidak menampilkan pratinjau.
- **N2 · Format tanggal tidak konsisten.** Contohnya `08/02/2026`, `11/2/2021`, dan `8 Februari 2026` muncul di situs yang sama. Pilih satu format, misalnya `8 Feb 2026` lewat `Intl.DateTimeFormat('id-ID')`.
- **N3 · Peta di footer tampak kosong** saat screenshot otomatis diambil. Iframe Google Maps-nya ada di kode, tetapi pemuatannya **tidak terverifikasi** dalam audit ini.
- **N4 · JavaScript template di admin melempar error** di setiap halaman: `TypeError: autocomplete is not a function (main.js:481)`. Kotak pencarian bawaan template tidak terpakai, tetapi skripnya tetap dimuat.
- **N5 · Aset yang hilang di admin.** Dua aset tidak ditemukan: `404 /assets/img/illustrations/placeholder-light.png` membuat pratinjau gambar di form Tambah Berita/Pengumuman rusak, dan `404 /admin/kurikulum/nulljson/search-vertical.json` muncul karena path template tidak terisi.

---

## Keamanan lain (di luar lingkup UI/UX)

- **K1.** Kunci reCAPTCHA (site key **dan secret**) ditulis sebagai nilai cadangan di [controllers/authController.js:5-8](../controllers/authController.js#L5-L8). Pindahkan ke `.env` saja, lalu buat kunci baru (rotasi) karena kunci yang lama sudah tersimpan di kode sumber.
- **K2.** Password admin baru saja diatur ulang ke nilai sederhana selama sesi audit ini. Ganti password tersebut setelah audit selesai.

---

## Yang sudah baik

Bagian ini diukur langsung, bukan diasumsikan. Hal-hal di bawah ini layak dipertahankan saat desain ulang.

- **Semua rute publik sehat.** 17 rute merespons 200 tanpa error JavaScript di konsol (selain 404 di temuan 02).
- **Semua gambar punya `alt`.** Dari 23 gambar di beranda, 0 tanpa `alt`. Pola yang sama berlaku di semua halaman.
- **Skip link dan landmark lengkap.** Setiap halaman memiliki `main`, `nav`, `header`, dan `footer`.
- **Form admin jelas.** Tanda wajib isi (`*`) dan keterangan "Wajib diisi" ada, teks bantuan menjelaskan batasan (*"Rentang: 5 tahun ke belakang s/d 1 tahun ke depan."*), dan contoh isian tersedia di placeholder.
- **Struktur navigasi admin konsisten.** Sidebar tetap, judul dan subjudul halaman jelas, dan tombol "Tambah" utama selalu berada di posisi yang sama.
- **Fitur pencarian dan filter langsung** tersedia di Berita, Buku, dan Dokumen Akademik, dan halaman akreditasi menyembunyikan riwayat yang nonaktif. Pola-pola ini sudah tepat untuk kebutuhan pengunjung.

---

## Mulai dari mana

Diurutkan berdasarkan dampak ÷ usaha.

| # | Tindakan | Temuan | Alasan |
|---|---|---|---|
| 1 | Paksa `role = 'user'` di registrasi atau tutup `/register` | 01 | Satu baris kode, menutup celah ambil-alih admin |
| 2 | Render `landing/404`, set `NODE_ENV=production`, perbaiki CTA `/admin` | 02 | Dua sampai tiga baris, menghentikan kebocoran informasi server |
| 3 | Hapus `landing-aside` dan `initSidebar()` | 03 | Mengembalikan navigasi untuk seluruh pengunjung dari HP |
| 4 | Bersihkan data uji coba, pisahkan database pengembangan | 05 | Tanpa kode; langsung memulihkan kredibilitas |
| 5 | Ganti hero beranda | 04 | Kesan pertama setiap pengunjung |
| 6 | Status akreditasi berbasis tanggal | 06 | Logika kecil, menghilangkan klaim yang tidak benar |
| 7 | Batasi dan kompres unggahan, ganti logo | 07 | Memangkas transfer beranda dari 23 MB ke kisaran ratusan KB |
| 8 | `lang="id"`, daftar istilah, perbaikan salah ketik | 09 | Murah; menjadi dasar copy di desain ulang |
| 9 | Perbaikan kontras dan fokus (warna utama) | A1–A2 | Satu perubahan token warna memperbaiki puluhan elemen |
| 10 | Cache `SiteSetting` dan paralelkan query | 08 | Mempercepat setiap halaman |
| 11 | Buang sisa template admin, tambahkan `aria-label` pada tombol ikon | 14, 16 | Hapus partial dan tambah atribut, tanpa desain baru |

---

## Metode dan batasan

Audit dilakukan di browser Chrome otomatis (Playwright) terhadap server lokal yang terhubung ke database Atlas `sisfo-unjani`, yaitu salinan dari database lama (bukan database live). Bukti diambil dari DOM, computed style, konsol, jaringan, kode sumber, dan dokumen database pada saat audit. Kontras dihitung dengan rumus luminans relatif WCAG 2.x. Temuan aksesibilitas merujuk WCAG 2.2, sedangkan temuan usability berpijak pada heuristik Nielsen. Tingkat keparahan dan urutan perbaikan merupakan penilaian auditor.

Rute publik diaudit di kedua viewport. Rute admin diaudit penuh di desktop (37 rute). Di HP, rute admin diaudit sampai modul Dokumen Akademik (19 rute), lalu proses dihentikan karena `/admin/news` memuat 140 MB (temuan 15). Rute admin yang tersisa memakai layout yang sama. Halaman edit dengan ID tertentu (`/:id/edit`) tidak diaudit terpisah karena memakai form yang sama dengan halaman tambah.

Tidak dicakup dalam audit ini: pengujian pembaca layar dari awal sampai akhir, zoom 200%/400%, mode kontras tinggi Windows, alur yang mengirim form (create/update/delete), serta perilaku di server produksi.
