# DESIGN — Design System Panel Admin

Berlaku hanya untuk admin (`layouts/admin-v2.ejs`, `assets/css/admin.css`,
`views/admin/_ui/`). Situs publik punya sistemnya sendiri di `assets/css/app.css`.

Dokumen terkait: [SPEC.md](SPEC.md) · [ARCHITECTURE.md](ARCHITECTURE.md)

## 1. Karakter

**Padat dan cepat**, seperti alat kerja, bukan brosur. Acuannya Linear dan
Vercel Dashboard.

- Data lebih penting daripada dekorasi. Permukaan netral, warna hanya untuk
  makna (aksi utama, status, fokus).
- Hijau UNJANI adalah **aksen**, bukan latar. Tidak ada blok hijau besar.
- Satu tampilan memuat sebanyak mungkin informasi yang berguna tanpa terasa
  sesak: jarak rapat, tipografi kecil tapi jelas, garis tipis.
- Tidak ada gradien, bayangan tebal, ilustrasi, atau animasi dekoratif.
- Desktop padat; HP tetap nyaman: target sentuh lebih besar, satu kolom.

## 2. Warna

Semua warna adalah variabel CSS di `@theme` `admin.css`. Komponen hanya memakai
nama token, tidak pernah heksadesimal langsung. Mode gelap menimpa variabel yang
sama, jadi komponen tidak perlu varian `dark:`.

Nilai kontras di bawah adalah target. **Verifikasi ulang dengan checker kontras
pada tugas F1-02 sebelum token dikunci.**

### Netral

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `canvas` | `#fafafa` | `#09090b` | Latar halaman |
| `surface` | `#ffffff` | `#18181b` | Kartu, tabel, panel, sidebar |
| `sunken` | `#f4f4f5` | `#27272a` | Hover baris, header tabel, input nonaktif |
| `line` | `#e4e4e7` | `#27272a` | Garis pemisah dekoratif |
| `line-strong` | `#d4d4d8` | `#3f3f46` | Batas kartu, pemisah penting |
| `control` | `#71717a` | `#71717a` | Batas input dan checkbox (≥3:1) |
| `ink` | `#18181b` | `#fafafa` | Teks utama |
| `muted` | `#52525b` | `#a1a1aa` | Teks sekunder, label kolom |
| `placeholder` | `#71717a` | `#8b8b94` | Placeholder (≥4.5:1 di `surface`) |

### Aksen dan status

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `primary` | `#15803d` | `#4ade80` | Tombol utama, tautan, item menu aktif, fokus |
| `primary-hover` | `#166534` | `#86efac` | Hover tombol utama |
| `on-primary` | `#ffffff` | `#052e16` | Teks di atas `primary` |
| `primary-soft` | `#f0fdf4` | `rgb(74 222 128 / 0.12)` | Latar item menu aktif, baris terpilih |
| `success` / `-soft` | `#166534` / `#dcfce7` | `#4ade80` / `rgb(74 222 128 / 0.12)` | Badge Terbit/Aktif |
| `warning` / `-soft` | `#92400e` / `#fef3c7` | `#fbbf24` / `rgb(251 191 36 / 0.12)` | Perlu perhatian |
| `danger` / `-soft` | `#991b1b` / `#fee2e2` | `#f87171` / `rgb(248 113 113 / 0.12)` | Error, aksi hapus |
| `danger-solid` | `#b91c1c` | `#dc2626` | Tombol hapus utama (teks putih) |
| `info` / `-soft` | `#1e3a8a` / `#eff6ff` | `#93c5fd` / `rgb(147 197 253 / 0.12)` | Info netral |

Aturan:

- Status tidak pernah disampaikan dengan warna saja. Badge selalu berteks
  ("Terbit", "Draf"), ikon peringatan selalu disertai kalimat.
- Baris terpilih: latar `primary-soft` + checkbox tercentang.
- Item menu aktif: latar `primary-soft`, teks `primary`, `aria-current="page"`.

## 3. Tipografi

Font: **Plus Jakarta Sans** (sudah ada di `public/fonts/`), berat 400/500/600/700.
Admin tidak memakai Source Serif 4.

| Nama | Ukuran / tinggi baris | Berat | Pemakaian |
|---|---|---|---|
| `text-xs` | 12 / 16 | 500 | Label kolom, badge, keterangan |
| `text-sm` | 13 / 20 | 400–500 | Isi tabel, menu, field |
| `text-base` | 14 / 20 | 400 | Teks bawaan admin |
| `text-md` | 16 / 24 | 600 | Judul kartu, judul slide-over |
| `text-lg` | 20 / 28 | 600 | Judul halaman |
| `text-xl` | 24 / 32 | 700 | Angka statistik dasbor |

- Di bawah 768px, `text-sm` dan `text-base` naik menjadi 15/22 supaya nyaman
  dibaca di HP, dan field form 16px supaya iOS tidak zoom otomatis.
- Angka di tabel dan statistik memakai `font-variant-numeric: tabular-nums`.
- Label kolom tabel: `text-xs`, `muted`, tanpa huruf kapital semua.

## 4. Ruang, ukuran, bentuk

- Satuan dasar 4px. Jarak umum: 4, 8, 12, 16, 24, 32.
- Radius: `control` 6px (tombol, input, badge), `card` 8px (kartu, panel,
  dialog). Tidak ada sudut membulat penuh kecuali avatar.
- Bayangan hanya untuk lapisan melayang (menu, dialog, slide-over, toast):
  satu token `shadow-overlay`. Kartu memakai garis, bukan bayangan.

| Elemen | Desktop | HP (<1024px) |
|---|---|---|
| Header | 48px | 56px |
| Sidebar | 240px / 64px dilipat | laci 280px |
| Navigasi bawah | — | 64px + safe area |
| Tinggi baris tabel | 40px | kartu, min 56px |
| Tombol / input | 32px | 44px |
| Target sentuh minimum | 24px | 44px |
| Slide-over | 560px | layar penuh |
| Lebar konten maksimum | tidak dibatasi untuk daftar; 880px untuk form halaman penuh |

## 5. Ikon

Material Symbols lewat helper `icon()` yang sudah ada. Ukuran 18px di tabel
dan tombol desktop, 20px di menu dan HP, 24px di navigasi bawah. Ikon baru
didaftarkan di `ICONS` pada `scripts/build-assets.js`, lalu `npm run build:assets`.

Ikon tambahan yang dibutuhkan: `dark_mode`, `light_mode`, `contrast`,
`left_panel_close`, `left_panel_open`, `check_box`, `check_box_outline_blank`,
`indeterminate_check_box`, `arrow_upward`, `arrow_downward`, `unfold_more`,
`more_horiz`, `toggle_on`, `toggle_off`.

## 6. Gerak

- Durasi: 120ms (hover, menu), 200ms (slide-over, laci, dialog).
- Easing: `cubic-bezier(0.2, 0, 0, 1)` untuk masuk, `ease-in` untuk keluar.
- Hanya `opacity` dan `transform`.
- `prefers-reduced-motion: reduce` mematikan semua transisi kecuali opacity.

## 7. Komponen

Setiap komponen adalah partial EJS di `views/admin/_ui/`. Parameternya
didokumentasikan di komentar baris pertama berkas.

### 7.1 Shell

- **Sidebar:** logo kecil + "Admin Akademik", grup menu (label grup `text-xs`
  `muted`), item 32px dengan ikon 20px. Tombol lipat di bawah. Saat dilipat,
  label grup disembunyikan, nama item muncul sebagai tooltip, dan item tetap
  punya `aria-label`.
- **Header:** tombol menu (HP), breadcrumb, pencarian modul, tombol akun
  (avatar 28px).
- **Navigasi bawah (HP):** 4 tombol berlabel ikon + teks, item aktif berwarna
  `primary`.

### 7.2 Bilah judul halaman

Judul `text-lg`, jumlah data `muted` di sebelahnya, tombol aksi di kanan.
Tombol utama hanya satu per halaman.

### 7.3 Tombol

| Varian | Tampilan | Pemakaian |
|---|---|---|
| `primary` | latar `primary`, teks `on-primary` | Satu aksi utama per tampilan |
| `secondary` | latar `surface`, garis `line-strong`, teks `ink` | Aksi lain |
| `ghost` | tanpa latar, hover `sunken` | Aksi di baris tabel, toolbar |
| `danger` | latar `danger-solid`, teks putih | Konfirmasi hapus di dialog |
| `icon` | persegi, `ghost` | Wajib `aria-label` |

Tombol yang sedang memproses menampilkan spinner dan `aria-busy="true"`, dan
tidak bisa diklik ulang.

### 7.4 Bilah filter

Satu baris di desktop: tab status (segmented control), filter pilihan, kotak
cari dengan ikon dan petunjuk `/`. Di HP, filter dilipat ke tombol "Filter"
yang membuka lembar bawah.

### 7.5 Tabel data

- Header menempel, latar `sunken`, label `text-xs` `muted`.
- Kolom yang bisa diurutkan: label berupa tombol dengan ikon `unfold_more`,
  atau panah sesuai arah aktif, dan `aria-sort`.
- Baris 40px, garis `line` di bawah, hover `sunken`.
- Kolom pertama checkbox (target 24px), kolom judul bisa diklik untuk membuka
  form, kolom terakhir aksi (`ghost`: Ubah, menu `more_horiz`).
- Teks panjang dipotong satu baris dengan judul lengkap di `title`.
- Di bawah 768px menjadi daftar kartu: judul, badge status, tanggal; checkbox
  muncul saat mode pilih aktif.

### 7.6 Bilah bulk

Desktop: menggantikan bilah filter di tempat yang sama, latar `primary-soft`.
Isi: "N dipilih", tautan "Pilih semua M hasil filter" (jika M > N), tombol
aksi `secondary`, Hapus bergaya teks `danger`, tombol Batal. HP: menempel di
atas navigasi bawah. Perubahan jumlah diumumkan lewat `aria-live="polite"`.

### 7.7 Slide-over

Panel kanan 560px, latar `surface`, `shadow-overlay`, overlay `canvas` 60%.
Struktur: header (judul + tutup), isi yang bisa di-scroll, bilah aksi
menempel di bawah. `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
Saat memuat: kerangka abu-abu (skeleton) 3 field, bukan spinner layar penuh.

### 7.8 Form

- Label di atas field, `text-sm` 500. Penanda wajib: teks "(wajib)" di label,
  bukan bintang saja.
- Teks bantuan di bawah field, `text-xs` `muted`.
- Error: garis field `danger`, pesan `text-xs` `danger` dengan ikon, dan
  `aria-invalid` + `aria-describedby`.
- Ringkasan error di atas form: kartu `danger-soft` berisi daftar tautan ke
  field yang salah; menerima fokus saat muncul.
- Seksi dipisahkan judul `text-md` dan garis `line`.
- Desktop: field pendek 2 kolom. HP: selalu 1 kolom.

### 7.9 Badge

Tinggi 20px, `text-xs` 500, radius `control`, latar `-soft` dan teks warna
statusnya. Teks selalu ada.

### 7.10 Dialog konfirmasi

Lebar 400px, judul berbentuk pertanyaan ("Hapus 12 berita?"), satu kalimat
akibat ("Tidak bisa dikembalikan."), tombol Batal (`secondary`) dan aksi
(`danger` untuk hapus). Fokus awal ada di Batal.

### 7.11 Toast

Pojok kanan bawah (desktop) atau di atas navigasi bawah (HP), hilang setelah
5 detik, berhenti saat di-hover atau difokus. `role="status"` untuk sukses,
`role="alert"` untuk error.

### 7.12 Status kosong

Ikon 24px `muted`, satu kalimat, satu tombol: "Tambah <data>" jika belum ada
data, "Hapus filter" jika filter tidak menemukan apa pun.

## 8. Pintasan keyboard

| Tombol | Aksi | Aktif saat |
|---|---|---|
| `/` | Fokus ke pencarian modul | Fokus tidak di input |
| `N` | Tambah data baru | Halaman daftar, fokus tidak di input |
| `Ctrl/Cmd + S` | Simpan form | Form terbuka |
| `Esc` | Tutup slide-over, dialog, menu | Lapisan terbuka |
| `Shift + klik` | Pilih rentang baris | Tabel |

Pintasan tercantum di `title` tombol terkait dan di bagian bawah menu akun.

## 9. Penulisan

- Bahasa Indonesia, kalimat pendek, kata kerja di tombol ("Simpan",
  "Terbitkan", bukan "OK").
- Toast menyebut jumlah dan objek: "12 berita diterbitkan".
- Pesan error menyebut cara memperbaiki: "Judul wajib diisi", bukan
  "Input tidak valid".
