# Node.js + Express + MongoDB + EJS Auth Starter

Starter template dengan Express, MongoDB (Mongoose), EJS, JWT, dan bcrypt. Layout EJS dibagi ke partial `_layout-start` dan `_layout-end` sehingga header/footer/alert dapat dipakai ulang di setiap halaman. Token JWT diset ke HTTP-only cookie **dan** dikembalikan di body JSON saat klien meminta `Accept: application/json`.

## Prasyarat

- Node.js 18+ dan npm
- MongoDB yang dapat diakses dari `MONGO_URI`

## Cara instalasi

1. Install dependency:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env` dan isi nilai yang sesuai:
   ```bash
   cp .env.example .env
   # ubah MONGO_URI, JWT_SECRET, dsb.
   ```
3. Siapkan kredensial reCAPTCHA v2 (Checkbox) dan isi `RECAPTCHA_SITE_KEY` serta `RECAPTCHA_SECRET_KEY` di `.env`.

## Menjalankan aplikasi

- Development: `npm run dev`, dan di terminal lain `npm run dev:css` (Tailwind mode watch)
- Production: `npm start`
- Tes: `npm test`

Server akan mem-baca `PORT` dari `.env` (default 3000).

### Kompres PDF Buku Wisuda (ADM-10)

PDF Buku Wisuda (maksimal 200 MB) dikompres setelah validasi upload, sebelum simpan DB. Hanya hasil valid dengan jumlah halaman sama dan ukuran lebih kecil yang mengganti file asli. Teks/vektor tidak dirasterisasi; gambar di atas 200 dpi diturunkan ke 150 dpi, kualitas JPEG 75. Timeout 600000 ms; Python hilang, error, atau timeout tetap menyimpan file asli. Ukuran sebelum/sesudah dan kegagalan masuk log server. Modul PDF lain tidak berubah.

**Lisensi:** PyMuPDF memakai AGPL-3.0 atau lisensi komersial. Konfirmasi kepatuhan/lisensi sebelum mengaktifkan di produksi.

CentOS Stream 9 x86_64, jalankan dari root repo (tanpa pip global):

```bash
sudo dnf install -y python3.11
sudo python3.11 -m venv /opt/akademik-pdf/venv
sudo /opt/akademik-pdf/venv/bin/pip install --upgrade pip
sudo /opt/akademik-pdf/venv/bin/pip install -r requirements-pdf.txt
/opt/akademik-pdf/venv/bin/python -c "import pymupdf; print(pymupdf.__version__)"
/opt/akademik-pdf/venv/bin/python scripts/compress-pdf.py contoh.pdf /tmp/contoh-kecil.pdf
```

Versi harus `1.28.0`. Bila wheel tidak tersedia, cek `uname -m` harus `x86_64`; jangan build source tanpa keputusan baru. CLI membutuhkan path output baru, berbeda dari input. Wrapper Node membuat file sementara unik di folder upload dan membersihkannya setelah proses.

Set `PDF_PYTHON=/opt/akademik-pdf/venv/bin/python` pada environment service aplikasi, lalu restart melalui pengelola service yang dipakai. Tanpa env ini executable default `python3`. Pastikan user service boleh menjalankan Python serta menulis/rename di folder upload. Proxy harus mengizinkan body **lebih dari 200 MB** untuk overhead multipart dan waktu request lebih dari 10 menit; sesuaikan juga timeout service/load balancer. Proses sinkron terhadap request; beberapa upload bersamaan menambah kebutuhan RAM/CPU.

Verifikasi deployment dengan data disposable: unggah PDF bergambar sekitar 150 MB melalui tambah dan ubah, buka hasil, bandingkan halaman, cek ukuran sebelum/sesudah pada log, durasi dan puncak RAM. Uji Python tidak tersedia untuk memastikan fallback menyimpan asli. Jangan menganggap tes lokal sebagai bukti server produksi.

Bukti lokal 2026-11-17: Windows, Python 3.14.3, PyMuPDF 1.28.0; PDF sintetis bergambar 12003905 byte menjadi 736682 byte, 1 halaman tetap dan teks dapat diekstrak. CentOS Python 3.11, upload produksi 150 MB, durasi/RAM belum diverifikasi karena akses server tidak tersedia.

### Aset frontend (design system baru)

Hasil build **di-commit**, sehingga server produksi tidak perlu menjalankan build atau menginstal devDependencies.

| Perintah | Hasil |
|---|---|
| `npm run build:css` | `assets/css/app.css` → `public/css/app.css` |
| `npm run build:assets` | font Plus Jakarta Sans → `public/fonts/`, Alpine (build CSP) → `public/js/vendor/`, ikon → `utils/icons.json` |
| `npm run build` | keduanya |

Jalankan `npm run build:css` sebelum commit jika mengubah view atau `assets/css/app.css`. Untuk menambah ikon, tambahkan namanya di `scripts/build-assets.js` lalu jalankan `npm run build:assets`.

Halaman baru memakai `res.renderPage(view, locals, 'layouts/public' | 'layouts/admin')` dan komponen di `views/components/`. Di mode development, katalog komponen tersedia di `/dev/komponen` dan `/dev/admin`.

## Struktur folder

```
project-root
|-- server.js              # entry point Express
|-- package.json
|-- .env.example
|-- config/
|   `-- db.js              # koneksi MongoDB
|-- models/
|   `-- User.js            # schema user + hash password + comparePassword
|-- controllers/
|   |-- authController.js  # register, login, logout
|   `-- homeController.js  # home + dashboard
|-- routes/
|   |-- authRoutes.js
|   `-- indexRoutes.js
|-- middleware/
|   `-- authMiddleware.js  # verifikasi JWT (Bearer header atau cookie)
|-- views/
|   |-- auth/
|   |   |-- login.ejs
|   |   `-- register.ejs
|   |-- admin/
|   |   `-- index.ejs
|   `-- landing/
|       `-- index.ejs
|-- public/
|   `-- css/style.css
`-- README.md
```

## Konfigurasi & keamanan

- `helmet` diaktifkan (CSP sederhana nonaktif untuk memudahkan starter).
- `cors` diaktifkan dengan `origin: true` dan `credentials: true`.
- Password di-hash di hook `pre('save')` Mongoose menggunakan bcrypt (saltRounds=10).
- JWT dibuat dengan `JWT_SECRET` dan `JWT_EXPIRES_IN` dari `.env`.
- Middleware `requireAuth` membaca token dari header `Authorization: Bearer <token>` atau cookie `token`.
- Google reCAPTCHA v2 dipasang di halaman register & login. Server memverifikasi token `g-recaptcha-response` memakai `RECAPTCHA_SECRET_KEY` sebelum memproses autentikasi.

## Alur autentikasi

- **Register** `POST /register`  
  Input: `name?`, `email`, `password`, `confirmPassword`, `role?` (default `user`), `g-recaptcha-response`.  
  Output: redirect ke `/dashboard` (browser) atau JSON `{ token, user }` (jika `Accept: application/json`).
- **Login** `POST /login`  
  Input: `email`, `password`, `g-recaptcha-response`. Respons sama seperti register.
- **Logout** `POST /logout`  
  Menghapus cookie dan redirect ke `/login` (atau JSON).
- **Dashboard** `GET /dashboard`  
  Dilindungi `requireAuth`; token boleh di header bearer atau cookie.

## Modul admin (role: admin)

- **Books**: CRUD PDF + cover di `/admin/books`.
- **Graduation Books**: CRUD buku kelulusan (periode I/II/III) di `/admin/graduation-books`.
- **Akreditasi**: CRUD data akreditasi (institusi, unit, tahun, nilai, sertifikat PDF) di `/admin/accreditations`.
- **Kalender Akademik**: CRUD kalender akademik (tahun ajaran + gambar kalender JPG/PNG) di `/admin/academic-calendars`.
- **Dokumen Akademik**: CRUD dokumen akademik (nama, keterangan, cover gambar, file PDF) di `/admin/academic-documents`.

## Contoh request (JSON client)

```bash
# Login dengan JSON dan dapatkan token di response body
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"you@example.com","password":"yourpass"}'

# Gunakan token ke route terlindungi (Bearer)
curl http://localhost:3000/dashboard \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <token-dari-login>"
```

## Catatan pengembangan

- Jangan pernah commit `.env` yang berisi secret.
- Semua halaman memakai `res.renderPage` dengan `layouts/public` atau `layouts/admin`. Template lama (`views/partials/`, `public/assets/`) sudah dihapus di F7 R5; yang tersisa di `public/assets/landing-page/images/` hanya `favicon.ico` dan `logo.png` (masih dirujuk layout dan halaman error).
- Proteksi CSRF: semua POST/PUT/DELETE dari origin lain ditolak (`middleware/verifyOrigin.js`). Di belakang reverse proxy, isi `APP_ORIGIN`.
- Halaman baru dilindungi CSP ketat (`middleware/strictCsp.js`): tanpa skrip/gaya inline; perilaku UI ada di `public/js/app.js` (komponen Alpine).
- Registrasi publik sudah dihapus; akun admin dibuat oleh Super Admin. reCAPTCHA diminta setelah 2× login gagal per email dalam 15 menit; kegagalan email lain di jaringan yang sama tidak memicu CAPTCHA. Halaman login awal tidak menampilkan CAPTCHA, tetapi server tetap mewajibkannya saat email dengan riwayat gagal dikirim kembali. Setelah 10× gagal per IP atau email, login diblokir selama 1 jam sejak kegagalan ke-10 (HTTP 429 + `Retry-After`). CAPTCHA kosong/gagal juga dihitung. Pencatatan masih di memori satu proses, sehingga restart aplikasi mereset hitungan dan blokir.
