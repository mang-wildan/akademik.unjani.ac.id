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
|   |-- partials/
|   |   |-- _footer.ejs
|   |   |-- _header.ejs
|   |   |-- _layout-end.ejs
|   |   `-- _layout-start.ejs
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
- Halaman lama (template) masih memakai `res.render` dan aset di `public/assets/`; keduanya diganti bertahap per halaman (lihat `docs/PLAN.md`).
- Proteksi CSRF: semua POST/PUT/DELETE dari origin lain ditolak (`middleware/verifyOrigin.js`). Di belakang reverse proxy, isi `APP_ORIGIN`.
- Halaman baru dilindungi CSP ketat (`middleware/strictCsp.js`): tanpa skrip/gaya inline; perilaku UI ada di `public/js/app.js` (komponen Alpine).
- Registrasi publik sudah dihapus; akun admin dibuat oleh Super Admin. reCAPTCHA hanya diminta setelah 3× login gagal.
