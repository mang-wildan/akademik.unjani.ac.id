# Audit UI/UX v3 — setelah F7 "Tampilan lebih akademik"

Lingkup · 6 Okt 2026 · 390 px dan 1440 px · 20 rute di server dev (publik + detail + 404 + login + 2 halaman dev) + 4 halaman admin lewat harness ber-stub (lihat "Keterbatasan") · pembanding: [AUDIT-UIUX-v2.md](AUDIT-UIUX-v2.md) (F5).

## Ringkasan

- **Kontras: 0 kegagalan** dari ±2.900 node teks yang diukur (48 kombinasi halaman × lebar), termasuk seluruh pita hijau tua, banner halaman dalam, top bar, footer, band CTA, dan sidebar admin.
- **Overflow horizontal: 0.** **Tepat satu `h1`** di setiap halaman. Tidak ada gambar tanpa `alt`.
- **Lighthouse mobile: keempat halaman pembanding sekarang di atas skor F5**; Aksesibilitas dan SEO 100 di semua.
- 3 cacat nyata ditemukan dan diperbaiki dalam audit ini (lihat di bawah); sisanya false-positive probe yang sudah dikenal.

## Metode

1. `npm run build:css`.
2. **Probe struktural** `probe-core.js` (skill `ux-ui-audit`) dijalankan lewat Playwright headless (Chromium) di 390 × 844 dan 1440 × 900 — kontras, target sentuh, nama aksesibel, outline heading, overflow.
3. **Indikator fokus** `probe-focus.js` setelah 12 tekanan `Tab` sungguhan per halaman (1440 px).
4. **Lighthouse 13.5** mobile (emulasi + throttling bawaan) untuk 4 halaman yang sama dengan F5; Beranda dijalankan 3× dan diambil median karena TTFB ke database dev berubah-ubah (curl `/`: 0,49–1,66 s dalam satu menit).
5. Halaman admin tidak bisa dibuka dengan login sungguhan (database pengembangan = database produksi, tidak memakai kredensial asli). `/profile*` dan shell admin diuji lewat harness Express sementara yang memakai `routes/authRoutes.js` + view asli dengan model `User` di-stub (tanpa koneksi DB); `/dev/admin` memakai layout admin dengan user contoh.

## Lighthouse mobile

| Halaman | F5 (Perf / A11y / SEO) | F7 (Perf / A11y / SEO) | LCP F7 |
|---|---|---|---|
| Beranda | 76 / 100 / 100 | **80** (78·80·84) / 100 / 100 | 4,3 s |
| Kalender Akademik | 85 / 100 / 100 | **87** / 100 / 100 | 3,8 s |
| Akreditasi | 81 / 100 / 100 | **84** / 100 / 100 | 4,0 s |
| Dokumen Akademik | 84 / 100 / 100 | **87** / 100 / 100 | 3,8 s |

Catatan TTFB dari F5 tetap berlaku: sisa selisih ke target 85 di Beranda/Akreditasi didominasi latensi ke MongoDB Atlas, bukan kode — ukur ulang setelah topologi produksi final (F6).

## Cacat nyata yang ditemukan & diperbaiki

1. **Performa Beranda turun ke ±71 (median) setelah hero penuh lebar.** Dua sebab, keduanya diperbaiki:
   - Hero selebar layar mengunduh WebP 1600 px (210 KB) juga di HP, padahal di sana foto tertutup overlay 90%. Ditambahkan varian `public/img/hero-kampus-800.webp` (61 KB, dibuat dengan `sharp` dari file yang sama) + `srcset`/`sizes`, dan `imagesrcset`/`imagesizes` pada preload agar keduanya mengunduh file yang sama. Diverifikasi: 390 px memakai 800w, 1440 px memakai 1600w.
   - Hitungan distribusi prodi (F7 R2) memakai `.populate('programStudi')` — satu round-trip DB berurutan tambahan. Diganti `ProgramStudi.distinct('_id')` yang berjalan paralel dalam `Promise.all`.
2. **Aksesibilitas Kalender 97** (`color-contrast`): penghitung "(n)" di tab semester aktif memakai `opacity-75` → 3,54:1 di atas hijau `primary`. Opasitas dihapus (5,0:1). Masalah lama sejak F3; baru tampak karena tab aktif bergantung tanggal.
3. **Indikator fokus:**
   - `.btn` memakai `transition-colors`, yang di Tailwind v4 ikut menganimasikan `outline-color` — ring fokus memudar dari `currentColor` selama 150 ms (putih tak terlihat di `.btn-primary`, hijau tua tak terlihat di `.btn-accent` di atas hero). `.btn` kini hanya mentransisikan `color`, `background-color`, `border-color`.
   - `.field-control` mematikan outline dan memakai ring hijau 20% (±1,2:1 di atas putih), sehingga penanda fokus kolom isian praktis hanya perubahan warna border. Diganti ring hijau solid 2 px (5,0:1). Berlaku di semua form publik & admin.

## False-positive probe (tidak diubah)

- **`unnamed` di `/`, `/berita`, `/buku`, `/buku-wisuda`** — tautan gambar kartu sengaja `aria-hidden="true" tabindex="-1"`; judul di bawahnya membawa tautan beraksesibilitas (pola kartu W3C). Sama seperti v2.
- **`tap` kecil** — tautan *inline* dalam teks (isi pengumuman, catatan di halaman 404, contoh di `/dev/komponen`) yang dikecualikan WCAG 2.5.8; "Lihat" di tabel `/akreditasi` (390 px) sama seperti v2.
- **`focus` di `/login`** — `probe-focus.js` menganggap `box-shadow` yang diawali lapisan transparan sebagai "tanpa ring", padahal Tailwind v4 memang menyusun ring sebagai beberapa lapisan; nilai terukur `rgb(21, 128, 61) 0 0 0 2px` (ring 2 px, 5,0:1).

## Keterbatasan

- 19 halaman daftar modul admin tidak dibuka dengan data nyata (butuh login ke database produksi). Yang berubah di F7 untuk halaman-halaman itu hanya layout (sidebar, header, gaya tombol/kolom isian) — diverifikasi lewat `/dev/admin` dan harness; konten modul tidak disentuh F7.
- `public/assets/landing-page/images/favicon.ico` berukuran 240 KB (terunduh di setiap halaman). Bukan regresi F7; kandidat dikompres saat F6.
