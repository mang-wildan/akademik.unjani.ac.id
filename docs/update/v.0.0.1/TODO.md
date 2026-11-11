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

- [x] Ganti nilai token: `canvas` ivory, `ink`/`muted` hangat, `line` hangat; `brand`/`primary`/`accent` tetap.
- [x] Uji kontras pasangan baru (teks ≥4.5:1, UI ≥3:1) — catat hasilnya.
- [x] Satukan radius: panel `0.5rem`, kontrol `0.375rem`; hapus shadow kartu.
- [x] Restyle kelas komponen CSS: `btn-*`, `card` (→ panel bergaris), `eyebrow`, `section-*`, fokus di atas blok hijau.
- [x] Hapus token/kelas yang tidak dipakai lagi (`info`, `gold-soft`, `brand-tint`, kelas glass) — grep dulu pemakaiannya di views.
  - Catatan: token `info`, `gold-soft`, dan `brand-tint` sengaja dipertahankan sebagai alias kompatibilitas selama Tahap 2–4 agar views publik yang belum direfaktor tidak rusak saat build; penghapusan total dieksekusi di Tahap 5 setelah seluruh views selesai.
- [x] `npm run build:css` + `npm test` (238 lulus, 0 gagal).
  - Kontras diuji otomatis di `test/publicTokens.test.js` untuk teks, status, kontrol, dan fokus. `sunken` dikalibrasi ke `#f6f3ec` agar tautan primary tetap ≥4.5:1.
  - Review menemukan benturan warna judul di blok hijau; diperbaiki dan dikunci dengan tes regresi. Screenshot Beranda 1440 × 1000 diperiksa setelah build.

## Tahap 2 — Shell bersama

- [x] `views/layouts/public.ejs`: top bar, header/nav (1 baris, tinggi ≤72px), footer gelap + band CTA sesuai arah mockup.
- [x] Komponen publik: `section-heading`, `badge` (dipersempit), `page-header`, `date-block`, `pagination`, `empty-state`, `alert`, `toast`, `form-field`.
  - `section-heading` mengikuti fondasi Tahap 1; `form-field` dipertahankan karena label, bantuan, dan error sudah sesuai serta diuji regresi.
- [x] Cek menu HP, dropdown, fokus keyboard, skip link.
  - Skenario browser viewport 320px: skip link dan menu HP buka/tutup via Escape; desktop 1440px: dropdown buka/tutup via Escape. Tidak ada console/page error yang tertangkap.
  - Footer memakai `black` sesuai mockup; panduan desain disinkronkan. Screenshot shell diperiksa; audit responsif seluruh halaman tetap di Tahap 5.
  - `npm run build:css` minified dan `npm test`: 242 lulus, 0 gagal, termasuk batas ukuran CSS publik.

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
