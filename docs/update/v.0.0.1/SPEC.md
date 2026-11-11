# SPEC — Redesain Situs Publik v0.0.1

Status: menunggu persetujuan. Dokumen terkait: [design.md](design.md) · [TODO.md](TODO.md) · mockup di `preview/`.

## 1. Latar & Tujuan

Tampilan publik saat ini terasa "AI slop": generik, seragam, tanpa identitas (kartu rounded + ikon lingkaran + badge warna-warni + efek kaca di mana-mana). Redesain mengikuti arah visual mockup `preview/` — editorial institusional: kanvas ivory, judul serif besar, blok hijau UNJANI yang tegas, footer gelap, garis tipis sebagai pemisah.

Mockup adalah **arah, bukan target piksel**. Boleh dikritik dan disempurnakan selama hasilnya konsisten dan tidak kembali generik.

## 2. Cakupan

Semua tampilan yang ada di `preview/` (15 layar):

| Halaman | View |
|---|---|
| Beranda | `views/landing/index.ejs` |
| Berita (daftar) | `views/landing/berita.ejs` |
| Pengumuman (daftar) | `views/landing/pengumuman.ejs` |
| Profil | `views/landing/profil.ejs` |
| Pimpinan dan Staf | `views/landing/pimpinan-staff.ejs` |
| Struktur Organisasi | `views/landing/struktur-organisasi.ejs` |
| Akreditasi | `views/landing/akreditasi.ejs` |
| Kurikulum | `views/landing/kurikulum.ejs` |
| RPL | `views/landing/rpl.ejs` |
| Dokumen Akademik | `views/landing/dokumen-akademik.ejs` |
| Kalender Akademik | `views/landing/kalender-akademik.ejs` |
| Buku | `views/landing/buku.ejs` |
| Buku Wisuda | `views/landing/buku-wisuda.ejs` |
| Login (default + gagal) | `views/auth/login.ejs` |

Ikut berubah karena dipakai bersama (tanpa mockup sendiri, mengikuti sistem desain baru):

- `views/layouts/public.ejs` (top bar, header/nav, footer, band CTA)
- `views/components/*` yang dipakai halaman publik
- `views/landing/berita-show.ejs`, `pengumuman-show.ejs`, `cari.ejs`, `error.ejs`
- `assets/css/app.css` (fondasi token & komponen)

## 3. Di Luar Cakupan (Non-Goal)

- Panel admin (`layouts/admin-v2.ejs`, `assets/css/admin.css`, `views/admin/`) — tidak disentuh.
- Perubahan route/URL, controller, model, data, atau skema database.
- Perubahan label menu navigasi dan copy konten dari database.
- Fitur baru (tidak ada konten atau seksi yang tidak didukung data yang sudah ada).
- Mode gelap untuk situs publik (mockup satu tema terang; admin sudah punya mode gelapnya sendiri).

## 4. Anti-Goal

Gagal walau "jadi", bila hasilnya:

- Kembali generik: grid 3 kartu identik berulang, ikon-dalam-lingkaran di setiap item, badge warna di semua tempat, glassmorphism.
- Pola berulang tanpa variasi: setiap seksi punya eyebrow uppercase + judul + grid yang sama.
- Kontras di bawah WCAG AA, target sentuh < 44px, fokus keyboard hilang, atau CSP ketat dilanggar (skrip/gaya inline).
- Em dash (—) atau en dash (–) sebagai elemen visual di copy baru.

## 5. Batasan Teknis

- Stack tetap: Express + EJS + Tailwind v4 (`assets/css/app.css` → build ke `public/css/app.css`), Alpine CSP, ikon dari `utils/icons.json`.
- CSP ketat dipertahankan: tanpa inline script/style; perilaku UI di `public/js/app.js`.
- Font yang sudah ada: Plus Jakarta Sans (sans) + Source Serif 4 (serif display). Tidak menambah font baru.
- Setiap seksi tetap hilang rapi bila datanya kosong (pola `index.ejs` sekarang).
- Semua halaman tetap lewat `res.renderPage(view, locals, 'layouts/public')`.
- `npm run build:css` dijalankan setiap mengubah view/CSS; hasil build di-commit.
- `npm test` tetap hijau.

## 6. Kriteria Berhasil

1. 15 layar preview terwujud dengan sistem desain baru yang konsisten (token, tipografi, spacing, radius seragam).
2. Identitas UNJANI jelas: hijau tua sebagai warna institusi, serif untuk judul, bukan template bisa-untuk-siapa-saja.
3. Tidak ada regresi fungsi: navigasi, pencarian, login (termasuk alur CAPTCHA & pesan gagal), unduhan PDF, pagination, chat widget tetap bekerja.
4. Aksesibilitas minimal setara sekarang: skip link, `aria-current`, kontras AA, target sentuh 44px, fokus terlihat.
5. LCP hero tetap terjaga (preload gambar hero dipertahankan atau diganti setara).
