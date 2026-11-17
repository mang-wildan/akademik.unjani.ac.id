# DESIGN — Redesain Panel Admin v0.1.0

Jenis: workspace administrasi akademik, bukan landing pemasaran.
Arah: editorial institusional; menerapkan [69 frame](preview/README.md), bukan mengundi gaya baru.
Acuan: [SPEC.md](SPEC.md) · [TODO.md](TODO.md) · `preview/admin-panel.figcraft`.

## 1. Prinsip

Gunakan struktur yang sudah ada: token-first, `admin-v2.ejs`, partial `_ui`, lalu view modul. Tidak membuat shell paralel atau CSS per halaman yang mengulang komponen. Tepi konten sejajar; whitespace memberi hierarki; hijau menjadi blok institusi. Tanpa gradien, glow, glass, shadow pada panel biasa, ikon dekoratif berulang atau kartu bertingkat tanpa alasan.

Copy Indonesia singkat, aksi menyebut tujuan: Tambah pengumuman, Ubah, Simpan, Hapus filter. Data contoh PNG tidak masuk produksi. Ikon tetap dari helper proyek, bukan paket baru. Tidak mengganti kontak nyata institusi dengan `.example`.

## 2. Token warna

Definisikan pada `@theme static` di `assets/css/admin.css`; view memakai token semantik, bukan hex lokal.

| Token | Nilai light | Peran |
|---|---|---|
| `canvas` | `#F4F1EA` | Kanvas ivory |
| `surface` | `#FFFFFF` | Panel/form/input |
| `surface-subtle` | `#FBFAF6` | Permukaan pendamping |
| `sunken` | `#EDE8DC` | Header tabel, disabled |
| `ink` | `#16181A` | Teks utama |
| `muted` | `#5B5E57` | Teks sekunder |
| `line` | `#D8D3C5` | Pemisah dekoratif, bukan satu-satunya batas input |
| `line-strong`, `control` | `#8C8778` | Batas kontrol |
| `primary`, `brand` | `#14532D` | Tombol utama, sidebar, band statistik |
| `primary-hover` | `#103F23` | Hover tombol utama |
| `on-primary` | `#FFFFFF` | Teks pada hijau |
| `accent` | `#B8892B` | Garis aktif, bukan teks kecil pada ivory |
| `primary-soft`, `success-soft` | `#E3EDE4` | Status ringan |
| `success` | `#14532D` | Status berhasil |
| `danger`, `danger-solid` | `#9F1D1D` | Error dan tombol destruktif |
| `danger-soft` | `#FBEDEA` | Latar ringkasan error |
| `warning` | `#8A5A00` | Peringatan |
| `warning-soft` | `#F6EBD3` | Latar peringatan |
| `sidebar-text` | `#D9E5DC` | Menu sidebar |
| `sidebar-label` | `#A8C4AE` | Nama grup sidebar (FigCraft `#9DBBA7` = 4.38:1, dikoreksi ke nilai landing 4.9:1) |
| `placeholder` | `#8A8C84` | Referensi FigCraft saja; web memakai `muted` bila nilai ini gagal 4.5:1 |

`info`/`info-soft` tetap kompatibel untuk pemakai existing; jangan menghapus sebelum grep seluruh pemakai. Tidak menambah warna per kategori. Dot badge selalu disertai teks. Focus ring light memakai primary; pada hijau gunakan putih dengan offset, bukan hijau di atas hijau.

Token `line` bukan warna border input. Uji kontras sebelum menerima warna; koreksi yang perlu untuk AA dicatat. Dark tidak membalik hex secara otomatis: pertahankan override semantik gelap existing, tambahkan override `surface-subtle`/brand/sidebar bila perlu, dan uji seluruh pasangan. Sidebar tetap hijau tua dengan teks terang; token primary dark yang lebih terang tidak boleh menjadi latar sidebar.

## 3. Tipografi web

FigCraft: Crimson Bold / Swis721 BT / Ubuntu Mono. Web: **Crimson Text / Inter / Ubuntu Mono**, aset lokal yang sudah dipakai landing. Swis721 tidak tersedia sebagai aset web; Inter pengganti resmi untuk versi ini.

| Peran | Font/berat | Ukuran / line-height |
|---|---|---|
| Judul halaman | Crimson Text 700 | 40/44px desktop, 32/36px HP |
| Judul panel | Crimson Text 700 | 22/28px |
| Angka statistik band | Crimson Text 700 | 48/52px |
| UI/body | Inter 400/500 | 14/20px desktop, 15/22px HP |
| Tombol/nav/label field | Inter 600 | 14/20px |
| Header tabel/eyebrow/grup | Ubuntu Mono 400 | 11/16px uppercase, tracking 1.2px |
| Tanggal/metadata angka | Ubuntu Mono 400 | 12/16px, tabular numbers |

Gunakan `--font-serif`, `--font-sans`, `--font-mono`; `@font-face` menunjuk file nyata di `public/fonts/`. Jangan mengandalkan font OS atau memasukkan binary baru. Input HP minimal 16px agar iOS tidak autozoom. Satu H1 per halaman; heading panel H2; judul panjang boleh membungkus, tidak dipaksa satu baris.

## 4. Shell dan grid

Acuan: `preview/Dasbor _ Desktop 1440.png`.

- Desktop ≥1024px: sidebar fixed 264px; mode ciut existing 64px. Sidebar punya scroll sendiri agar semua grup terjangkau pada tinggi pendek.
- Topbar 64px, border bawah 1px; breadcrumb kiri, cari modul + Ctrl K, Lihat situs ↗, akun kanan. Search tetap modal pencarian modul existing.
- Pada viewport 1440px: konten x=312px, kanan x=1392px, lebar 1080px; gutter shell 48px. Lebar 1080px adalah hasil viewport ini, bukan fixed width yang menyebabkan overflow. Pada desktop lebih sempit gunakan gutter 24px; konten mengisi ruang tersedia.
- Jarak vertikal antarblok 24px; padding panel 24px; gap field 20px. Gunakan skala 4/8/12/16/20/24/32/48px.
- Sidebar aktif: ivory, teks primary, garis kiri emas 3px; tidak mengubah lebar item saat aktif. Grup tetap urutan `adminNav` dan difilter `canSee`.
- <1024px: drawer native existing dan bottom nav tetap. Drawer hijau, maksimal selebar layar; kontrol tutup terlihat. Konten 24px pada tablet, 16px pada HP. Topbar menyederhana, breadcrumb boleh truncate; Lihat situs tetap dapat diakses melalui menu.
- <768px: semua form/panel dua kolom ditumpuk, konten utama lebih dahulu. Tabel memakai pola kartu mobile existing; tidak menyembunyikan satu-satunya akses aksi/filter. Beri ruang bawah untuk bottom nav/bulk/action bar dan safe area.

## 5. Komponen bersama

| Komponen / file `_ui/` | Kontrak visual dan perilaku |
|---|---|
| `page-header.ejs` | H1 serif, count termasuk 0, aksi kanan; stack HP |
| `button.ejs` + `.btn` | Tinggi desktop 40px, radius 4px; primary hijau, secondary putih border control, danger merah. HP/touch ≥44px; disabled/busy tetap semantik |
| `field.ejs`, `richtext-field.ejs` | Label terlihat, input 40px desktop/44px HP, radius 4px, error inline terhubung ID; jangan mengubah `name`/`value` |
| `data-table.ejs` | Panel putih radius 6px, header sunken mono uppercase, separator 1px; row minimum 60px, dapat 76px dengan metadata; jangan memotong isi penting |
| `content-actions.ejs`, `book-actions.ejs`, `academic-actions.ejs`, `kategori-actions.ejs` | Ubah sebagai link, ⋯ untuk aksi lanjutan; gunakan menu/disclosure existing bila tersedia, selain itu native `details/summary` bernama. Escape/klik luar diuji bila menambah JS |
| `filter-bar.ejs`, `bulk-bar.ejs` | Filter dalam satu bar, wrap tablet; bulk jumlah nyata mengganti bar desktop, tidak menutup aksi HP |
| `pagination.ejs` | Nomor halaman, aktif primary, sebelumnya/berikutnya; query tetap, disabled bukan tautan yang aktif |
| `badge.ejs` | Dot kecil + teks, bukan pill besar atau warna per kategori. Ikon opsional existing tetap didukung bila bermakna |
| `empty-state.ejs` | Pesan spesifik: belum ada data vs tidak ada hasil. Tambah untuk kosong awal, Hapus filter untuk pencarian kosong; hindari panel di dalam panel |
| `error-summary.ejs` | Danger-soft, garis kiri danger 3px; `role=alert`, fokus dan tautan field tetap |
| `upload-field.ejs` | Label/input file native, pembungkus dashed, petunjuk ukuran/jenis nyata; current-file card berisi tautan valid. Tidak menjanjikan drop bila belum ada handler |
| `confirm-dialog.ejs` | Lebar maksimum 480px, radius 6px, bar atas danger/warning; title + konsekuensi + Batal/aksi. Dialog native, fokus Batal, Escape, return focus, fallback no-JS tetap |
| `toast.ejs` | Latar ink, teks putih, dot/ikon status + pesan + Tutup. Timer 5000ms existing, pause hover/fokus, role status/alert. Tanpa tombol undo palsu |
| `slide-over.ejs` | Lebar existing 560px dan fullscreen HP tetap; heading serif, isi mengikuti form, aksi sticky tidak menutup field terakhir |
| `shell-nav.ejs`, `shell-account.ejs`, `shell-bottom-nav.ejs`, `module-search.ejs` | Ikuti shell; pertahankan nama aksesibel, izin, shortcut, tema dan collapse |

Panel biasa: radius 6px, border line, tanpa shadow. Overlay boleh shadow existing. Dua tingkat kotak maksimum bila perlu (workspace → panel → field bukan kartu dekoratif). Tidak menambah partial yang hanya membungkus satu pemakai tanpa mengurangi duplikasi.

## 6. Pola layar

### Dasbor

Band hijau empat statistik lebih dahulu; divider vertikal tipis. Di bawahnya grid sekitar 660/396px dengan gap 24px pada 1440px: perhatian dan draf kiri, buat cepat dan aktivitas kanan. Mobile satu kolom; band menjadi 2 kolom lalu 1 kolom bila label tidak muat. Angka nol, panel kosong dan aktivitas bertanggal nyata tetap rapi.

### Daftar publikasi dan dokumen

Acuan `Pengumuman _ Daftar.png`, `Berita _ Pilih massal.png`, `Buku _ Daftar.png`. Header, tab status dari query existing, filter, tabel, footer pagination. Teks judul dominan; metadata lebih kecil. Tidak ada filter visual yang tidak mengubah hasil. Menu lanjut tidak memuat aksi tanpa izin. State kosong/konfirmasi/bulk menggunakan partial yang sama, bukan template salinan.

### Form konten

Acuan `Pengumuman _ Tambah.png`, `Pengumuman _ Tambah — gagal validasi.png`, `Berita _ Ubah.png`. Full-page: grid `minmax(0, 1fr) 336px`, gap 24px pada ruang cukup; kolom utama sekitar 720px pada konten 1080px. Kolom utama judul/editor/lampiran, kanan kategori/status/terbit/sampul mengikuti data dan frame. Bila tidak cukup untuk kolom utama 640px + gap + 336px, stack. Slide-over selalu stack. Tombol intent publish tetap mengirim nilai existing.

### Akademik, wisuda, organisasi, master

Frame prefix masing-masing mengikat urutan panel/field; field yang sudah ada tetapi tidak digambar tidak boleh dihapus. Kalender Kelola memakai grouping data, kegiatan, impor dan lampiran; segmented/tab navigasi boleh anchor ke panel yang tetap dapat diakses tanpa JS. Daftar lulusan/prodi mempertahankan unggah CSV; hasil error impor tidak hilang saat styling. Form pendek tidak dipaksa punya sidebar kosong.

### Sistem dan profil

Acuan `Akun Pengguna _ Konfirmasi nonaktif.png`, `Akun Pengguna _ Atur ulang password.png`, `Pengaturan Situs _ Ubah.png`, `Profil Saya _ Ubah password.png`. Ringkasan akun, profil dan password terpisah sesuai route existing; tindakan sensitif tetap konfirmasi dan aturan server existing. Error tidak hanya berupa toast.

## 7. Interaksi, aksesibilitas dan bukti

Hover warna/border dan press ringan 120ms; dialog/drawer ≤200ms. Tanpa intro hero, animasi scroll, angka palsu atau loop dekoratif. Reduced motion tidak menyembunyikan konten. Skip link pertama, fokus tidak tertutup sticky header/footer, semua kontrol bernama; status bukan warna saja. Native dialog menangani fokus dan Escape; no-JS tetap punya navigasi/form yang aman.

Target kontras dan viewport mengacu SPEC §5; batas kontrol yang diperlukan harus 3:1 walau garis dekoratif lebih ringan. Screenshot otomatis saja bukan bukti keyboard, POST atau upload berhasil. Catat tes fungsi dan visual secara terpisah dalam `verification.md`, dibuat saat eksekusi, dengan seluruh nama PNG asli. Pengecualian tetap: Inter untuk Swis721, tidak ada undo palsu, copy Cari menu, adaptasi dark/mobile/slide-over dan data nyata.
