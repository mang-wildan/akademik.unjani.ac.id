# Audit UI/UX v4 — tinjauan kode setelah F8

Lingkup · 13 Okt 2026 · seluruh view landing, auth, layout, komponen, dan 19 modul panel admin · pembanding: [AUDIT-UIUX-v3.md](AUDIT-UIUX-v3.md).

## Metode dan batas

Audit ini membaca kode (EJS, `assets/css/app.css`, `public/js/app.js`, `utils/html.js`); tidak ada pengukuran render, Lighthouse, atau probe Playwright. Kontras, overflow, dan skor Lighthouse tetap mengacu pada v3. Temuan di sini hanya hal yang belum tercatat di v3. Hasil pengukuran pasca-perbaikan dicatat di bagian "Hasil F9" (diisi di R4).

Tingkat: **S1** merusak fungsi atau aksesibilitas · **S2** inkonsistensi atau gesekan nyata · **S3** polish.

Tindak lanjut: [TODO.md](TODO.md) F9; persyaratan: [SRS.md](SRS.md) §6.7 dan FR-AD-09..13.

## A. Landing page

Kekuatan: pita warna Beranda berirama; akses cepat menumpuk di hero; banner halaman dalam seragam; carousel punya tombol jeda; empty state selalu memberi langkah berikutnya; tabel menjadi kartu di HP; pola kartu dengan tautan gambar `aria-hidden` benar.

| # | S | Temuan | Lokasi |
|---|---|---|---|
| L1 | S1 | `aria-label="Unduh"` identik di setiap baris, dan nama dokumen + tombol menaut ke file yang sama (dua tab stop) | `landing/dokumen-akademik.ejs`, `landing/rpl.ejs` |
| L2 | S1 | `utils/html.js` mengizinkan `img`, `table`, `blockquote`, tetapi `.prose-content` tidak menata ketiganya; tabel tempelan Word bisa meluap di HP | `assets/css/app.css` |
| L3 | S2 | URL video dipakai langsung sebagai `src` iframe; tautan YouTube biasa (`watch?v=`) ditolak di iframe, tanpa konversi ke `/embed/` | `landing/index.ejs`, `validators/index.js` |
| L4 | S2 | Pola filter tidak seragam (submit otomatis di Kalender, tombol "Terapkan" di tempat lain, chip di Berita/Pengumuman); submit otomatis melanggar WCAG 3.2.2 | `landing/kalender-akademik.ejs` |
| L5 | S2 | `/buku-wisuda` tanpa pagination | `landing/buku-wisuda.ejs` |
| L6 | S2 | Chip tahun `/buku` tanpa `aria-current`/centang; status aktif hanya warna | `landing/buku.ejs` |
| L7 | S2 | Di HP sidebar kategori Dokumen Akademik tampil di atas daftar | `landing/dokumen-akademik.ejs` |
| L8 | S2 | Footer "Jelajahi" hanya 6 tautan; Profil, Pimpinan, Struktur, RPL, Buku, Buku Wisuda tidak ada | `layouts/public.ejs` |
| L9 | S2 | Riwayat akreditasi berupa tabel bersarang di `<td colspan=7>`; di HP kartu di dalam kartu | `landing/akreditasi.ejs` |
| L10 | S3 | Tautan tab baru (buku, dokumen) tanpa petunjuk | `landing/buku.ejs`, `landing/dokumen-akademik.ejs` |
| L11 | S3 | `/cari` memakai `autofocus` (keyboard layar HP langsung muncul) | `landing/cari.ejs` |
| L12 | S3 | Halaman error memakai logo berbeda dari situs | `landing/error.ejs` |
| L13 | S3 | Angka peringkat Akreditasi sans, di Beranda serif | `landing/akreditasi.ejs` |
| L14 | S3 | Banner penuh untuk halaman utilitas `/cari` | `landing/cari.ejs` |

## B. Panel admin (termasuk login)

Kekuatan: login split-screen; sidebar berkelompok dengan penanda aktif non-warna; dialog hapus berfokus awal di "Batal"; daftar punya tab status, filter, empty state; form punya validasi per kolom dan teks bantuan.

| # | S | Temuan | Lokasi |
|---|---|---|---|
| P1 | S1 | Tidak ada pelindung kirim ganda; tombol "Simpan" aktif selama unggahan PDF 10 MB | semua form; `public/js/app.js` hanya menangani `data-confirm` |
| P2 | S1 | `role="tablist"` pada tautan biasa tanpa `role="tab"`/`aria-selected` — ARIA tidak valid | `admin/pengumuman/list.ejs`, `kategori/list.ejs`, `accreditations/list.ejs` |
| P3 | S1 | `<select onchange="this.form.submit()">` memicu submit di tengah pemilihan keyboard (WCAG 3.2.2) | `admin/pengumuman/list.ejs`, `news/list.ejs`, `accreditations/list.ejs` |
| P4 | S2 | `page-header` varian admin tidak dipakai satu pun view admin; ukuran h1 tidak seragam; breadcrumb diganti "Kembali ke…" | `components/page-header.ejs`, `admin/dashboard.ejs` |
| P5 | S2 | Judul muncul dua kali (header lengket `<p>` + `<h1>`) | `layouts/admin.ejs` |
| P6 | S2 | Hapus tidak konsisten: `window.confirm` (kegiatan kalender), tanpa konfirmasi (tautan cepat) | `academic-calendars/edit.ejs`, `settings/edit.ejs` |
| P7 | S2 | Impor CSV kalender menimpa seluruh kegiatan tanpa konfirmasi | `academic-calendars/edit.ejs` |
| P8 | S2 | "Tautan Cepat" adalah form terpisah; menambah tautan membuang perubahan form utama | `settings/edit.ejs` |
| P9 | S2 | Editor teks tanpa tombol tautan, ikon berupa huruf, `execCommand` usang; bantuan menjanjikan tautan | `components/richtext-field.ejs` |
| P10 | S2 | Tidak ada pratinjau draf sebelum terbit | `admin/pengumuman/form.ejs`, `news/form.ejs` |
| P11 | S2 | Unggah polos: tanpa pratinjau, tanpa pemeriksaan ukuran di klien, tanpa seret-lepas | `components/file-upload.ejs` |
| P12 | S2 | Akun Admin dan Data Lulusan tanpa pencarian/pagination | `admin/users/list.ejs`, `lulusan/list.ejs` |
| P13 | S3 | Aksi sekunder tidak seragam (Sematkan di ⋯; Hapus ikon langsung di sebagian modul, di ⋯ di lainnya) | daftar admin |
| P14 | S3 | `order-first` di Dasbor tidak berefek (induk bukan flex/grid) | `admin/dashboard.ejs` |
| P15 | S3 | Label tombol mata password statis; tidak ada petunjuk lupa password | `auth/login.ejs` |
| P16 | S3 | Profil Saya memakai eyebrow + h1 `text-3xl`, modul lain tidak | `admin/profile/index.ejs` |

## Prioritas

1. S1 dulu: P1, P2, P3, L1, L2 (R1).
2. S2 berdampak ke pengguna akhir: L3, L7, L5.
3. S2 berdampak ke editor: P6–P11.
4. S3 sambil menyentuh file terkait.

## Gerak yang ditambahkan (F9)

Prinsip dari panduan ui-ux-pro-max: gerak memberi tahu perubahan keadaan; durasi dan easing dari token bersama; paling banyak 1–2 elemen utama per layar; hanya `opacity`/`transform`; semua mati di `prefers-reduced-motion`; konten terlihat tanpa JS. Daftar lengkap di TODO F9 R2 dan R3, persyaratan di SRS NFR-U-01..07. GSAP tidak dipakai (stack CSS + Alpine cukup, CSP ketat, tanpa tambahan KB).

## Hasil F9

*(diisi di R4)*
