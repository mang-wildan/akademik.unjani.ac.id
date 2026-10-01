# Rencana Implementasi — Desain Ulang Situs Bidang Akademik UNJANI

Rencana ini menjalankan [SRS.md](SRS.md). Rincian tugasnya ada di [TODO.md](TODO.md).

## Cara membaca rekomendasi model dan effort

Setiap fase mencantumkan model Claude dan tingkat *effort* (kedalaman penalaran) yang disarankan saat dikerjakan bersama Claude Code. Pilih modelnya lewat `/model` sebelum memulai fase.

| Model | Dipakai untuk |
|---|---|
| **Opus 5.5** (`claude-opus-5-5`) | Keputusan arsitektur, migrasi data, keamanan, dan review akhir. Pekerjaan yang kalau salah mahal diperbaiki |
| **Sonnet 5.5** (`claude-sonnet-5-5`) | Implementasi utama: halaman, komponen, CRUD, dan tes. Seimbang antara kualitas dan kecepatan |
| **Haiku 4.5** (`claude-haiku-4-5-20251001`) | Pekerjaan mekanis berulang yang polanya sudah jelas: penggantian teks, daftar istilah, dan pengecekan salah ketik |

| Effort | Kapan |
|---|---|
| **low** | Perubahan mekanis, polanya sudah ada contohnya |
| **medium** | Implementasi fitur standar mengikuti pola yang sudah ditetapkan |
| **high** | Merancang pola baru, logika bisnis, atau perubahan lintas banyak file |
| **xhigh** | Migrasi data produksi, keamanan, arsitektur. Kesalahan di sini sulit dibatalkan |

Aturan praktis: **rancang dengan Opus, kerjakan massal dengan Sonnet, rapikan dengan Haiku, dan review dengan Opus.**

---

## Ringkasan fase

| Fase | Nama | Model | Effort | Estimasi* | Bergantung pada |
|---|---|---|---|---|---|
| F0 | Hotfix keamanan & kebersihan situs lama | Opus 5.5 → Sonnet 5.5 | xhigh → medium | 1–2 hari | — |
| F1 | Fondasi: repo, lingkungan, design system, layout | Opus 5.5 | high | 3–4 hari | F0 |
| F2 | Model data, migrasi, aturan bisnis | Opus 5.5 | xhigh | 3–4 hari | F1 |
| F3 | Situs publik | Sonnet 5.5 | medium (high untuk Kalender & Akreditasi) | 6–8 hari | F1, F2 |
| F4 | Panel admin | Sonnet 5.5 | medium (high untuk pola CRUD pertama) | 7–9 hari | F1, F2 |
| F5 | Performa, SEO, aksesibilitas | Sonnet 5.5 + Opus 5.5 (audit) | medium / high | 2–3 hari | F3, F4 |
| F6 | Konten, migrasi produksi, QA, rilis | Opus 5.5 + Haiku 4.5 | xhigh / low | 3–4 hari | F5 |

\*Estimasi kasar untuk satu developer yang dibantu Claude Code. F3 dan F4 bisa berjalan paralel setelah F2 selesai.

---

## F0 — Hotfix keamanan & kebersihan situs lama

**Tujuan:** menutup celah yang bisa dieksploitasi **sekarang**, sebelum desain ulang dimulai, dan langsung di-deploy ke situs yang sedang berjalan.

| | |
|---|---|
| Model | **Opus 5.5 · xhigh** untuk analisis dan perbaikan keamanan (registrasi, error handler, rahasia). **Sonnet 5.5 · medium** untuk perbaikan sisanya |
| Alasan | Celah peran admin dan kebocoran stack trace berdampak langsung. Perbaikannya kecil, tetapi harus tepat dan tidak membuka celah baru |
| Keluaran | Registrasi ditutup, 404/500 ramah, `NODE_ENV=production`, menu HP padel dihapus, batas ukuran unggahan, rahasia hanya di `.env`, konten uji coba dibereskan |
| Audit | 01, 02, 03, 05, 07 (sebagian), K1 |
| Selesai bila | Uji manual: `POST /register` ditolak, `/halaman-acak` menampilkan 404 ramah, menu HP membuka navigasi BAA, unggahan 20 MB ditolak |

**Catatan:** database yang dipakai saat pengembangan adalah salinan dari database lama, jadi pembersihan konten uji di sini tidak memengaruhi situs live. Perbaikan kode F0 tetap bisa di-deploy ke situs lama, sedangkan pembersihan konten di produksi dilakukan terpisah oleh admin.

---

## F1 — Fondasi

**Tujuan:** menyiapkan kerangka bersih yang dipakai semua halaman.

| | |
|---|---|
| Model | **Opus 5.5 · high** |
| Alasan | Keputusan di fase ini (struktur folder, pola layout dan komponen, pipeline CSS, konfigurasi keamanan) akan diikuti oleh puluhan file berikutnya. Kesalahan di sini ikut tersalin ke semua halaman |
| Keluaran | `git init` dan branch kerja; `.env` per lingkungan (dev/staging/prod); Tailwind CLI dengan token dari DESIGN.md; layout `public.ejs` dan `admin.ejs`; library komponen partial (button, badge, card, table, form-field, empty-state, pagination, date-block, alert); Alpine.js; font dan ikon self-host; error handler terpusat; Helmet + CSP; CSRF; penghapusan `public/assets/vendor`, `landing-page` template, dan `assets/json` demo |
| Selesai bila | Halaman contoh "kitchen sink" (`/dev/komponen`, hanya di dev) menampilkan semua komponen dan lolos probe kontras serta fokus |

**Catatan:** proyek ini **belum menjadi repositori git**. Lakukan `git init` dan commit kondisi saat ini sebelum mengubah apa pun, agar setiap fase bisa dibatalkan.

---

## F2 — Model data, migrasi, aturan bisnis

**Tujuan:** data yang benar sebelum ada tampilan.

| | |
|---|---|
| Model | **Opus 5.5 · xhigh** |
| Alasan | Fase ini mengubah skema data produksi. Pemetaan akreditasi lama (teks bebas) ke enum, pengubahan teks prodi menjadi ref, serta pemisahan kalender PDF menjadi kegiatan per baris semuanya berisiko kehilangan data |
| Keluaran | Skema baru (SRS §5); skema `zod` per form; service `accreditationStatus()`, `calendarEventStatus()`, dan `makeExcerpt()`; master data (fakultas, prodi, kategori, lembaga); skrip migrasi idempoten dengan mode `--dry-run`; seed data dev **tanpa** konten "test"; pipeline unggah `sharp` (WebP 1600 px + thumbnail 400 px); tes unit untuk semua aturan bisnis |
| Selesai bila | Migrasi `--dry-run` pada salinan database produksi menghasilkan laporan tanpa error, dan tes unit lulus |

---

## F3 — Situs publik

**Tujuan:** semua halaman publik sesuai SRS §3 dan referensi `docs/Design/`.

| | |
|---|---|
| Model | **Sonnet 5.5 · medium** untuk sebagian besar halaman. **Sonnet 5.5 · high** untuk Kalender Akademik dan Akreditasi (tabel responsif menjadi timeline/kartu, status dinamis, riwayat yang bisa dibuka). **Opus 5.5 · high** untuk review di akhir fase |
| Alasan | Polanya sudah ditetapkan di F1, jadi sebagian besar pekerjaan adalah penerapan. Dua halaman yang punya logika dan perilaku responsif kompleks butuh penalaran lebih |
| Urutan | 1) Layout, header, footer, menu HP → 2) Kalender → 3) Akreditasi → 4) Dokumen & RPL → 5) Kurikulum → 6) Pengumuman (daftar + detail) → 7) Berita → 8) Beranda (mengambil data dari semua modul di atas) → 9) Buku, Buku Wisuda, Pimpinan & Staf, Profil, Struktur → 10) Pencarian |
| Selesai bila | Setiap halaman lolos probe audit (kontras, target sentuh, tanpa overflow di 360/390 px, satu H1, `lang="id"`) dan tampilannya sesuai referensi Stitch dengan koreksi di SRS §7.2 |

---

## F4 — Panel admin

**Tujuan:** admin bisa mengelola semua konten dengan pola yang konsisten.

| | |
|---|---|
| Model | **Sonnet 5.5 · high** untuk membangun **satu modul pertama secara lengkap** (Pengumuman), yang menjadi pola acuan: daftar, form, validasi, unggah, hapus dengan konfirmasi, dan toast. **Sonnet 5.5 · medium** untuk modul-modul berikutnya yang menyalin pola itu. **Opus 5.5 · xhigh** untuk login, manajemen akun, dan role |
| Alasan | Modul admin sangat mirip satu sama lain. Pola yang tepat di modul pertama membuat 13 modul berikutnya cepat dan konsisten. Autentikasi tetap butuh ketelitian maksimal |
| Urutan | 1) Login dan sesi → 2) Layout admin dan dasbor → 3) Pengumuman (pola acuan) → 4) Berita → 5) Kalender (dengan impor CSV) → 6) Akreditasi → 7) Dokumen, RPL, Kurikulum → 8) Buku, Buku Wisuda, Lulusan → 9) Staf, Unit, Profil → 10) Master data → 11) Pengaturan situs → 12) Akun admin → 13) Audit log (Sebaiknya) |
| Selesai bila | Semua modul CRUD lolos smoke test, semua label berbahasa Indonesia, tombol ikon punya `aria-label`, dan hapus selalu meminta konfirmasi |

---

## F5 — Performa, SEO, aksesibilitas

**Tujuan:** memenuhi target NFR-P, NFR-SEO, dan NFR-A.

| | |
|---|---|
| Model | **Sonnet 5.5 · medium** untuk implementasi (cache SiteSetting, query paralel, meta dan OG, sitemap). **Opus 5.5 · high** untuk audit ulang dengan skill `ux-ui-audit` di kedua viewport |
| Alasan | Implementasinya sederhana, sedangkan auditnya butuh penilaian, terutama untuk bagian yang tidak bisa diukur otomatis seperti pembacaan isi dan hierarki visual |
| Keluaran | Laporan audit kedua (`docs/AUDIT-UIUX-v2.md`) dan skor Lighthouse untuk 4 halaman utama |
| Selesai bila | Kriteria penerimaan SRS §9 butir 2 dan 3 terpenuhi |

---

## F6 — Konten, migrasi produksi, QA, rilis

**Tujuan:** memindahkan situs baru ke produksi dengan data yang bersih.

| | |
|---|---|
| Model | **Opus 5.5 · xhigh** untuk runbook migrasi produksi, eksekusi migrasi, dan rencana rollback. **Haiku 4.5 · low** untuk pemeriksaan teks massal (salah ketik, istilah sesuai Lampiran B, sisa "test" atau "lorem") |
| Alasan | Migrasi produksi tidak bisa diulang dengan aman tanpa rencana. Pemeriksaan teks bersifat mekanis dan volumenya besar |
| Keluaran | Backup, migrasi, verifikasi, dan DNS/deploy; konten nyata menggantikan data uji (foto kampus, kalender 2026/2027, akreditasi terbaru); serah terima dan panduan singkat untuk admin |
| Selesai bila | Seluruh kriteria penerimaan SRS §9 terpenuhi, dan rollback sudah diuji di staging |

---

## Risiko utama

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data uji di database salinan juga ada di produksi | Konten uji tetap tampil setelah rilis | Cek database produksi di F6 sebelum migrasi; database dev sudah terpisah (salinan) |
| Data akreditasi lama tidak bisa dipetakan otomatis | Status salah setelah migrasi | Laporan `--dry-run` ditinjau manual oleh BAA sebelum migrasi nyata |
| Tim BAA tidak sempat menginput kalender per kegiatan | Halaman kalender kosong | Impor CSV + template Excel. PDF tetap tersedia sebagai cadangan |
| Fitur tambahan dari desain Stitch ikut dibangun | Waktu membengkak | Patuhi daftar "Ditolak" di SRS §7.3 |
| Keputusan terbuka (SRS §10) belum dijawab | Pekerjaan diulang | Jawab K-01 sampai K-07 sebelum F2 dimulai |
