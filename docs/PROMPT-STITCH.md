# Prompt Google Stitch — Referensi Desain BAA UNJANI

Cara pakai:
1. Buat project baru di Stitch. Pilih **Web** untuk prompt desktop, **Mobile** untuk prompt HP.
2. Tempel **Prompt 0 (Design System)** lebih dulu, lalu tempel prompt halaman satu per satu di project yang sama, agar gaya visualnya konsisten.
3. Instruksi ditulis dalam bahasa Inggris (Stitch paling akurat dengan bahasa Inggris), sedangkan teks UI ditulis dalam Bahasa Indonesia.
4. Jika hasilnya melenceng, perbaiki dengan prompt lanjutan yang pendek, misalnya: *"Remove text overlay on images, put title below the image."*

Data contoh di dalam prompt terdiri dari dua jenis. Sebagian diambil dari situs saat ini ([AUDIT-UIUX.md](AUDIT-UIUX.md)), yaitu akreditasi Institusi/Perpustakaan/Teknik Elektro/Teknik Sipil, jadwal Semester Genap 2025/2026, angka lulusan, dan kontak. Sebagian lain **hanya ilustrasi** agar tata letak teruji dengan isi yang cukup banyak, misalnya prodi Informatika dan nama lembaga akreditasi per unit, jumlah dokumen dan pengumuman, nama staf, dan kategori dokumen. Jangan jadikan data ilustrasi sebagai acuan isi.

---

## Prompt 0 — Design System (tempel pertama)

```
Design system for "Bidang Akademik UNJANI" — the official academic administration website of Universitas Jenderal Achmad Yani, Cimahi, Indonesia. Audience: students, parents, lecturers, prospective students, accreditation assessors. Tone: official, trustworthy, calm, easy to scan. NOT a marketing or lifestyle site.

All UI copy in Bahasa Indonesia.

Colors (from the university crest: green, gold, red):
- Primary: #15803D (green-700) for buttons and links; white text on it.
- Primary dark: #14532D for header/footer backgrounds.
- Accent: #CA8A04 (gold) used only as small highlights, badges, or thin rules — never as text on white.
- Danger/expired: #B91C1C. Success/active: #15803D. Warning: #B45309.
- Neutrals: background #F8FAF9, surface #FFFFFF, border #E2E8F0, text #0F172A, muted text #475569.
All text must meet WCAG AA contrast (4.5:1).

Typography: "Plus Jakarta Sans". Body 16px/1.6, H1 40px bold, H2 28px semibold, H3 20px semibold, small 14px. Use sentence case. Never put body text over photos.

Shape & spacing: 8px spacing grid, 12px card radius, 1px border cards with very soft shadow, 44px minimum tap targets, visible 2px focus ring in primary color.

Components: top navigation with crest logo + "Bidang Akademik UNJANI", dropdown menus, breadcrumb, page header (title + one-line description, no big photo banner on inner pages), data table with sticky header and filters, list rows with file icon and download button, status badges (Aktif / Kedaluwarsa / Baru), date block (large day number + month), stat tiles, empty states with an action, footer with contact info.

Avoid: lime/neon colors, glassmorphism, dark photo overlays behind content, text over images, stock photos as decoration, carousels, Lorem ipsum.
```

---

## Prompt 1 — Beranda (Web)

```
Homepage for "Bidang Akademik UNJANI", using the design system above. Desktop 1440px.

1. Header: crest logo + "Bidang Akademik UNJANI", nav: Beranda, Profil ▾, Akademik ▾ (Kalender Akademik, Kurikulum, Dokumen Akademik, RPL), Akreditasi, Publikasi ▾ (Berita, Pengumuman, Buku, Buku Wisuda), and a search icon. No login button in the public header.

2. Hero (compact, max 420px tall): left side H1 "Layanan Akademik Universitas Jenderal Achmad Yani", subtitle "Kalender, kurikulum, dokumen, dan informasi akademik resmi dalam satu tempat." Right side: a clean campus photo with rounded corners (no text on it). Below the H1, 4 quick-access tiles with icons: Kalender Akademik, Dokumen & Formulir, Kurikulum, Akreditasi.

3. "Penting" strip: a bordered panel with 3 text rows, each with a category badge, title and date:
   - [Pengumuman] Pendaftaran Wisuda Periode I Tahun 2026 dibuka — 3 Feb 2026
   - [Dokumen] Formulir Pembuatan Ijazah — 3 Feb 2026
   - [Kalender] Batas akhir pengumuman nilai Semester Genap — 17 Jul 2026

4. "Agenda Akademik Terdekat": horizontal timeline of 4 upcoming events with date blocks: "Ujian Akhir Semester (UAS) 29 Jun–10 Jul 2026", "Pendaftaran Semester Pendek 13–17 Jul 2026", "Semester Pendek 20 Jul–21 Agu 2026", "Batas Akhir Nilai Semester Pendek 28 Agu 2026". Link "Lihat kalender lengkap".

5. Two columns: left "Pengumuman Terbaru" as a text list with date blocks (5 rows, no images); right "Akreditasi Institusi" highlight card: big badge "UNGGUL", text "Akreditasi Institusi · BAN-PT · berlaku s.d. 11 Feb 2026", plus small stat chips "Unggul 1 · A 1 · B 2" and link "Lihat semua akreditasi".

6. "Kegiatan Akademik": 3 news cards, image on top, title + date + 2-line excerpt BELOW the image.

7. Stat row: "6.289 lulusan tahun 2025", "11.769 lulusan 2024–2025", "+14,8% dibanding 2024".

8. Footer (dark green #14532D): address "Jl. Terusan Jend. Sudirman, Cibeber, Cimahi Selatan, Kota Cimahi, Jawa Barat", phone "+62 (022) 6656190", email "akademik@unjani.ac.id", jam layanan "Senin–Jumat, 08.00–15.30 WIB", quick links (UNJANI, Perpustakaan UNJANI, Pusat Bahasa), social icons.
```

## Prompt 1M — Beranda (Mobile)

```
Mobile version (390px) of the same homepage. Sticky top bar with crest logo and a hamburger that opens a full-screen menu with the same Indonesian navigation items. Hero becomes stacked: H1, subtitle, then the 4 quick-access tiles as a 2×2 grid (each at least 44px tall). "Penting" strip as stacked rows. Agenda as a vertical list with date blocks. Pengumuman list, then the Akreditasi highlight card, then news cards in a single column. No horizontal scrolling. Bottom area: footer with tappable phone and email.
```

---

## Prompt 2 — Kalender Akademik (Web)

```
"Kalender Akademik" page. Page header: breadcrumb "Beranda / Akademik / Kalender Akademik", H1 "Kalender Akademik", subtitle "Tahun Ajaran 2025/2026 · Ditetapkan dengan SK Rektor No. Skep/179/Unjani/VI/2025". A select "Tahun Ajaran: 2025/2026 ▾" and a secondary button "Unduh PDF resmi".

Top: a highlight card "Sedang berlangsung: Ujian Akhir Semester (UAS) · 29 Jun – 10 Jul 2026" and "Berikutnya: Pendaftaran Semester Pendek · 13–17 Jul 2026".

Tabs: "Semester Ganjil" | "Semester Genap" | "Semester Pendek". Inside, a real HTML table with columns: No · Kegiatan Akademik · Waktu · Status. Rows for Semester Genap:
1 Masa Pembimbingan Akademik/Perwalian dan Heregistrasi — 9–13 Feb 2026 — Selesai
2 Awal Perkuliahan Semester Genap — 23 Feb 2026 — Selesai
3 Perkuliahan Semester Genap — 23 Feb – 26 Jun 2026 — Selesai
4 Perubahan Rencana Studi (PRS) — 2–6 Mar 2026 — Selesai
5 Wisuda Periode I 2026 — 15–16 Apr 2026 — Selesai
6 Ujian Tengah Semester (UTS) — 27 Apr – 8 Mei 2026 — Selesai
7 Ujian Akhir Semester (UAS) — 29 Jun – 10 Jul 2026 — Berlangsung
8 Batas Akhir Pengumuman Nilai Semester Genap — 17 Jul 2026 — Akan datang
Status shown as small badges (Selesai grey, Berlangsung green, Akan datang gold-outlined). Current row highlighted with a light green background. A toggle "Tampilan: Tabel | Timeline".
```

## Prompt 2M — Kalender Akademik (Mobile)

```
Mobile (390px) version of the Kalender Akademik page. The table becomes a vertical timeline: each item has a date block on the left (e.g. "29 JUN") and the activity name + date range + status badge on the right. Semester tabs become a horizontally scrollable segmented control. "Unduh PDF resmi" as a full-width secondary button at the bottom.
```

---

## Prompt 3 — Akreditasi (Web)

```
"Akreditasi" page. Header: H1 "Akreditasi Institusi & Program Studi", subtitle "Status dihitung otomatis dari tanggal berlaku sertifikat."

Top row: a large highlight card "Akreditasi Institusi: UNGGUL — BAN-PT — Berlaku 11 Feb 2021 s.d. 11 Feb 2026" with a red badge "Kedaluwarsa" and a note "Perpanjangan sedang diproses", plus 3 stat tiles: "Unggul 1", "A 1", "B 2".

Filter bar: search "Cari unit atau program studi…", select "Fakultas: Semua ▾", select "Status: Semua ▾".

One data table with sticky header, columns: Unit / Program Studi · Fakultas · Peringkat · Lembaga · Berlaku s.d. · Status · Sertifikat.
Rows:
- Universitas Jenderal Achmad Yani · — · Unggul · BAN-PT · 11 Feb 2026 · Kedaluwarsa · [Lihat PDF]
- Perpustakaan Universitas · — · A · Perpusnas · 28 Jul 2026 · Kedaluwarsa · [Lihat PDF]
- Teknik Elektro (S1) · Fakultas Teknik · B · LAM Teknik · 22 Apr 2026 · Kedaluwarsa · [Lihat PDF]
- Teknik Sipil (S1) · Fakultas Teknik · B · LAM Teknik · 13 Mar 2026 · Kedaluwarsa · [Lihat PDF]
- Informatika (S1) · Fakultas Sains & Informatika · Baik Sekali · LAM INFOKOM · 5 Mei 2029 · Aktif · [Lihat PDF]
Each row expandable ("Riwayat") to show previous certificates. Peringkat shown as a neutral pill; Status as colored badge (Aktif green, Kedaluwarsa red, Segera berakhir amber).
```

## Prompt 3M — Akreditasi (Mobile)

```
Mobile (390px) version of the Akreditasi page. Institution highlight card on top, stat tiles in a horizontal row. Filters collapse into a "Filter" button that opens a bottom sheet. Each table row becomes a compact card: unit name (bold), faculty (muted), then a 2-column grid of label/value pairs (Peringkat, Berlaku s.d., Status badge), and a full-width "Lihat sertifikat (PDF)" link. No horizontal scroll.
```

---

## Prompt 4 — Dokumen Akademik (Web)

```
"Dokumen Akademik" page. Header: H1 "Dokumen & Formulir Akademik", subtitle "Unduh formulir, pedoman, dan peraturan akademik resmi."

Left: category filter list with counts: Semua (24), Formulir (9), Pedoman (6), Peraturan (5), Surat Keputusan (4). Top: search input "Cari judul dokumen…" and sort "Terbaru ▾".

Main: a document LIST (not cards). Each row: PDF file icon, title in bold, one-line description in muted text, meta line "Formulir · Diperbarui 10 Feb 2026 · PDF 245 KB", and a primary "Unduh" button on the right plus an icon button "Pratinjau".
Rows:
- Formulir Pembuatan Ijazah — "Diserahkan setelah yudisium sebagai syarat pembuatan ijazah."
- Pedoman Penyelenggaraan Rekognisi Pembelajaran Lampau (RPL)
- Peraturan Rekognisi Publikasi Karya Ilmiah & Prestasi Mahasiswa sebagai Pengganti Tugas Akhir/Skripsi/Tesis
- Formulir Cuti Akademik
- Formulir Pindah Program Studi
Pagination at the bottom. Include an empty state design for a search with no results: "Dokumen tidak ditemukan" with a button "Hapus pencarian".
```

---

## Prompt 5 — Kurikulum (Web)

```
"Kurikulum" page. Header: H1 "Kurikulum Program Studi", subtitle "Dokumen kurikulum berlaku untuk setiap program studi."
Filters: "Fakultas ▾", "Jenjang: S1 / S2 / D3 / Profesi", search "Cari program studi…".
Content: tables grouped by faculty with a group heading (e.g. "Fakultas Teknik — 6 program studi"). Columns: Program Studi · Jenjang · Kurikulum (tahun) · Diperbarui · Dokumen.
Rows under Fakultas Teknik: Teknik Kimia · S1 · Kurikulum 2021 · 3 Feb 2026 · [Unduh PDF]; Teknik Sipil · S1 · Kurikulum 2021; Teknik Elektro · S1 · Kurikulum 2021; Teknik Industri · S1 · Kurikulum 2022; Teknik Mesin · S1 · Kurikulum 2021; Teknik Metalurgi · S1 · Kurikulum 2022.
Second group "Fakultas Sains & Informatika" with 3 rows. No images.
```

---

## Prompt 6 — Pengumuman (Web)

```
"Pengumuman" list page. Header: H1 "Pengumuman Akademik". Filters as chips: Semua, Wisuda, Perkuliahan, Ujian, Administrasi. Search on the right.
Content: a vertical list (no images). Each item: a date block on the left (day number large, month + year small), then category badge, title (bold, 1–2 lines), 2-line excerpt in muted text, and "Baru" badge for items under 7 days old. The first item is pinned with a "Disematkan" label and a light gold left border.
Items:
- 3 Feb 2026 · Wisuda · Pendaftaran Wisuda Periode I Tahun 2026
- 28 Jan 2026 · Perkuliahan · Jadwal Perwalian dan Heregistrasi Semester Genap 2025/2026
- 20 Jan 2026 · Ujian · Batas Akhir Pengumuman Nilai Semester Ganjil
- 12 Jan 2026 · Administrasi · Perubahan Jam Layanan BAA Selama Libur Semester
Pagination "Menampilkan 1–10 dari 48 pengumuman".
Also design the detail page: title, date, category, body text in a readable 720px column, attachments list with PDF icons, and "Pengumuman lainnya" list below.
```

---

## Prompt 7 — Buku Wisuda (Web)

```
"Buku Wisuda" page. Header: H1 "Buku Wisuda", subtitle "Arsip buku wisuda per periode." Filter chips: Semua tahun, 2026, 2025, 2021, 2020; select "Periode ▾".
Content: left-aligned grid of book covers, 5 per row, portrait 3:4 covers with rounded corners. Below each cover (not over it): title "Buku Wisuda Periode II", meta "Tahun 2021 · Periode II", and a text button "Buka PDF". Sort newest first. Use year as a small inline heading above each row group. Include an empty state.
```

---

## Prompt 8 — Pimpinan & Staf (Web)

```
"Pimpinan & Staf" page. H1 "Pimpinan dan Staf Bidang Akademik".
Section 1 "Pimpinan": 2 larger horizontal cards with portrait photo on the left, name, title, and email: "Kepala Bidang Akademik", "Kepala Urusan Administrasi Akademik".
Section 2 "Staf": grid of 4 per row smaller cards, square photo on top, name, position (e.g. "Staf Administrasi Akademik", "Staf Kurikulum", "Staf Kalender & Jadwal"). No numbering badges. Use realistic Indonesian names and academic titles (e.g. "Dr. Ir. Rina Kartika, M.T.").
```

---

## Prompt 9 — Admin: Dashboard (Web)

```
Admin dashboard for the same website, same design system but denser (14px base). Left sidebar with crest + "Admin Akademik", groups: Ringkasan (Dasbor); Konten (Berita, Pengumuman); Akademik (Kalender Akademik, Kurikulum, Dokumen Akademik, RPL, Akreditasi); Publikasi (Buku, Buku Wisuda, Data Lulusan); Organisasi (Pimpinan & Staf, Unit, Profil Bidang); Pengaturan (Pengaturan Situs, Master Data). Top bar: page title, global search, notifications, user menu. No language switcher.

Main: greeting "Selamat datang, Admin BAA". A row of 4 compact stat tiles with white background: "13 Berita terbit", "8 Pengumuman aktif", "4 Akreditasi kedaluwarsa" (red accent, with link "Perbarui"), "24 Dokumen".
"Perlu perhatian" panel listing issues: "4 sertifikat akreditasi sudah kedaluwarsa", "2 berita tanpa gambar", "Video profil tidak dapat diputar".
"Aktivitas terbaru" list with icon, action, item, user, relative time. Quick actions: "+ Pengumuman", "+ Berita", "+ Dokumen".
```

## Prompt 10 — Admin: Tabel Daftar + Form (Web)

```
Two admin screens, same admin layout.

Screen A — "Pengumuman" list: header with title, count "48 pengumuman", primary button "+ Tambah Pengumuman". Filter bar: search, Status (Semua/Terbit/Draf/Terjadwal), Kategori. Table columns: checkbox · Judul (with small thumbnail if any) · Kategori · Status badge (Terbit green, Draf grey) · Disematkan (pin icon toggle) · Diperbarui · Aksi (labeled "Edit" button and a "⋯" menu containing "Hapus" in red). Pagination in Bahasa Indonesia: "Menampilkan 1–10 dari 48".

Screen B — "Tambah Akreditasi" form in a single card, 2-column layout: Unit / Program Studi (searchable select), Fakultas (auto-filled), Peringkat (select: Unggul, Baik Sekali, Baik, A, B, C), Lembaga Akreditasi (select: BAN-PT, LAM Teknik, LAM INFOKOM, LAMEMBA…), Nomor SK, Tanggal Berlaku, Berlaku Sampai, Sertifikat (drag-and-drop PDF upload, "Maks. 5 MB"). Helper text: "Status Aktif/Kedaluwarsa dihitung otomatis dari tanggal." Required fields marked with *. Footer buttons: "Batal" (secondary) and "Simpan" (primary). Show one inline validation error example: "Tanggal berlaku sampai harus setelah tanggal berlaku."
```
