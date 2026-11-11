# TODO — Redesain Situs Publik v0.0.1

> Urutan Pendekatan 1 (token-first): fondasi → shell → Beranda & Login → halaman lain.
> Setiap tahap diakhiri `npm run build:css`, cek visual di browser, dan `npm test`.
> Acuan: [SPEC.md](SPEC.md) · [design.md](design.md) · mockup `preview/`.

## Tahap 0 — Persiapan

- [x] Commit bersih sebelum mulai (titik rollback).
- [x] Jalankan app + `npm run dev:css`, screenshot kondisi sekarang untuk pembanding.
  - Aplikasi berjalan di `http://localhost:8501` dan MongoDB tersambung.
  - Watcher dijalankan dengan `npm run dev:css -- --watch=always` agar tetap hidup tanpa stdin interaktif.
  - Screenshot baseline 14 halaman (13 publik + login default), viewport 1440 × 1000, tersimpan di `baseline/`. Login gagal belum direkam agar tidak menambah percobaan login pada akun.
  - Baseline `npm test`: 236 lulus, 0 gagal. Observasi browser Beranda dan Login: tidak ada console/page error yang tertangkap.

## Tahap 1 — Fondasi token (`assets/css/app.css`)

- [ ] Ganti nilai token: `canvas` ivory, `ink`/`muted` hangat, `line` hangat; `brand`/`primary`/`accent` tetap.
- [ ] Uji kontras pasangan baru (teks ≥4.5:1, UI ≥3:1) — catat hasilnya.
- [ ] Satukan radius: panel `0.5rem`, kontrol `0.375rem`; hapus shadow kartu.
- [ ] Restyle kelas komponen CSS: `btn-*`, `card` (→ panel bergaris), `eyebrow`, `section-*`, fokus di atas blok hijau.
- [ ] Hapus token/kelas yang tidak dipakai lagi (`info`, `gold-soft`, `brand-tint`, kelas glass) — grep dulu pemakaiannya di views.
- [ ] `npm run build:css` + `npm test`.

## Tahap 2 — Shell bersama

- [ ] `views/layouts/public.ejs`: top bar, header/nav (1 baris, tinggi ≤72px), footer gelap + band CTA sesuai arah mockup.
- [ ] Komponen publik: `section-heading`, `badge` (dipersempit), `page-header`, `date-block`, `pagination`, `empty-state`, `alert`, `toast`, `form-field`.
- [ ] Cek menu HP, dropdown, fokus keyboard, skip link.

## Tahap 3 — Beranda & Login

- [ ] `views/landing/index.ejs`: hero blok hijau + serif, agenda menjorok, akses cepat bergaris, seksi selang-seling; semua seksi tetap hilang rapi saat data kosong.
- [ ] Cek LCP: preload hero di layout masih cocok dengan markup baru.
- [ ] `views/auth/login.ejs`: split hijau/surface; state gagal (alert inline) dan alur CAPTCHA diverifikasi manual.

## Tahap 4 — Halaman daftar & baca

- [ ] `berita.ejs` + `berita-show.ejs` (unggulan besar + baris bergaris).
- [ ] `pengumuman.ejs` + `pengumuman-show.ejs`.
- [ ] `profil.ejs`, `rpl.ejs`, `kurikulum.ejs` (pola halaman baca).
- [ ] `pimpinan-staff.ejs` (grid foto), `struktur-organisasi.ejs`, `kalender-akademik.ejs` (panel gambar).
- [ ] `akreditasi.ejs` (pita institusi + baris prodi).
- [ ] `dokumen-akademik.ejs`, `buku.ejs`, `buku-wisuda.ejs` (grid cover).
- [ ] `cari.ejs`, `error.ejs` (pola baca).

## Tahap 5 — Penutup

- [ ] Sapu bersih: grep sisa kelas/token lama di `views/landing`, `views/auth`, `views/components`.
- [ ] Audit anti-slop (SPEC §4): hitung eyebrow (≤1 per 3 seksi), tanpa em dash, tanpa badge per kategori, variasi layout antar halaman.
- [ ] Audit aksesibilitas: kontras, fokus, target 44px, `aria-current`.
- [ ] Uji fungsi: navigasi, cari, login gagal/berhasil, unduh PDF, pagination, chat widget.
- [ ] `npm run build:css` final + `npm test` + commit.

## Tahap 6 — Update ARCHITECTURE.md

- [ ] Perbarui `ARCHITECTURE.md` sesuai hasil implementasi: fondasi token publik, layout, komponen bersama, dan alur build aset yang berubah.
- [ ] Cocokkan dokumentasi dengan kode final; pertahankan penjelasan arsitektur admin yang tidak berubah.
