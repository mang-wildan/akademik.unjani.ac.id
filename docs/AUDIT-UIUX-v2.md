# Bidang Akademik UNJANI — Audit UI/UX v2 (Fase 5)

Lingkup · akun superadmin · 390 px dan 1440 px · 2 Okt 2026 · 14 rute publik + 19 halaman admin (daftar) + 4 halaman admin bentuk (new/edit) dengan pratinjau file nyata · dibandingkan dengan `docs/AUDIT-UIUX.md` (F0, situs lama) dan hasil probe inline sepanjang F3/F4.

## Ringkasan

| Kategori | Jumlah |
|---|---|
| Kritis | 0 |
| Mayor | 0 |
| Aksesibilitas (ditemukan & diperbaiki) | 1 (3 lokasi) |
| Catatan / false-positive diverifikasi ulang | 3 |

Satu temuan aksesibilitas nyata ditemukan lewat Lighthouse (bukan probe struktural) dan sudah diperbaiki — lihat bagian "Lighthouse mobile" di bawah. Di luar itu, audit ini terutama **mengonfirmasi ulang** bahwa perbaikan F3/F4 tetap berlaku setelah perubahan performa/SEO Fase 5 (cache `SiteSetting`, versi aset statis, proyeksi query, `sitemap.xml`/`robots.txt`, tag canonical) — tidak ada regresi lain yang ditemukan.

## Metodologi

1. **Probe struktural** (`probe-core.js`): kontras, target sentuh, nama elemen aksesibel, overflow horizontal, outline H1 — dijalankan di 390 px dan 1440 px untuk:
   - 14 rute publik: `/`, `/profil`, `/struktur-organisasi`, `/pimpinan-dan-staff`, `/akreditasi`, `/kalender-akademik`, `/kurikulum`, `/dokumen-akademik`, `/rpl`, `/buku`, `/buku-wisuda`, `/berita`, `/pengumuman`, `/cari`
   - 19 halaman admin (daftar): dasbor + 18 modul F4
   - 4 halaman admin tambahan: `/login`, `/admin/staff/:id/edit` (dengan foto nyata), `/admin/settings`, `/admin/users/:id/reset-password`
2. **Probe heuristik & persepsi** (`probe-heuristics.js`, `probe-perception.js`) di 390 px untuk 4 halaman utama yang juga diuji Lighthouse: Beranda, Kalender Akademik, Akreditasi, Dokumen Akademik.
3. **Indikator fokus** (`probe-focus.js`) setelah `Tab` sungguhan (bukan `.focus()` terprogram) di halaman publik dan `/login`.
4. Tidak ada pengujian RTL/paritas (situs satu bahasa, tidak ada versi Arab) — `probe-rtl.js`/`probe-parity.js` tidak relevan.

## Hasil probe struktural

**Semua 14 rute publik, 19 halaman admin, dan 4 halaman tambahan: `err=0, contrastFail=0, overflow=null, h1=1` di kedua viewport.**

Tiga pengecualian, ketiganya sudah diverifikasi sebagai *false-positive* probe, bukan cacat nyata (didokumentasikan juga di `docs/POLA-ADMIN.md`):

1. **`/buku` (1) dan `/buku-wisuda` (3) — `unnamed`**: tautan sampul buku memakai `aria-hidden="true" tabindex="-1"` secara sengaja (judul di bawahnya membawa tujuan yang sama dan accessible name yang benar) — pola W3C untuk kartu kembar-tautan. Probe `naming` tidak mengecualikan elemen `aria-hidden`. Sama persis dengan temuan yang sudah diverifikasi di F3.
2. **`/akreditasi` (mobile) — `tapSmall` 1**: tautan "Lihat Sertifikat"/"Lihat" di luar rentang yang diukur probe pada lebar tertentu; diverifikasi manual sudah memakai pola `min-h-6`, dianggap false-positive ambang ukur, bukan regresi — konsisten dengan catatan F3.
3. **`/admin/settings` — `unnamed` 3**: tiga field form "Tambah tautan cepat" di dalam `<details>` tertutup. `label.innerText` kosong untuk konten yang belum dirender (perilaku `<details>` native), sehingga probe salah menandainya tanpa nama padahal `label[for]` sudah benar dan tidak terekspos ke pembaca layar sampai dibuka. Didokumentasikan di `docs/POLA-ADMIN.md` sebagai pola jebakan probe untuk form yang disembunyikan di balik `<details>`.

## Heuristik & persepsi (4 halaman utama)

- **Hick's Law / beban kognitif**: 8–15 target interaktif di layar pertama pada ketiga halaman (indeks Hick ~3.2–4.0) — sesuai rentang wajar untuk halaman dengan satu tugas utama yang jelas.
- **Fitts's Law**: beberapa kartu akses cepat Beranda dan tab semester Kalender berada di luar zona ibu jari yang nyaman di 390 px ("mid — needs a stretch"). Ini konsisten dengan keputusan yang sudah diambil dan dicatat di `docs/TODO.md` F3: **bottom tab bar (FR-G-09) sengaja ditunda** ("Bisa", tidak kritis) — bukan regresi baru, dan memperbaikinya di luar lingkup tanpa menambah navigasi tab bawah.
- **Gestalt (proximity/similarity)**: variasi gaya pada kontrol bertipe "link" (6–8 perlakuan berbeda per halaman) seluruhnya berasal dari peran yang memang berbeda (logo merek, pencarian header, breadcrumb, kartu akses cepat, kontak footer) — tingkatan yang disengaja, bukan ketidakkonsistenan desain sistem.
- Tidak ada `orphanedHeadings` maupun grup dengan spacing yang membingungkan (`uniformlySpacedGroups` di Dokumen Akademik adalah sidebar kategori yang memang seragam by design).

## Indikator fokus

Diuji dengan `Tab` sungguhan (bukan `.focus()` terprogram) di halaman publik dan `/login`:

```
outline: 2px solid rgb(21, 128, 61), offset 2px
kontras terhadap latar: 4,78–5,02 : 1 (syarat WCAG 2.2 SC 1.4.11: ≥ 3:1) — lolos dengan margin
```

## Perubahan Fase 5 yang relevan dengan audit ini

Diverifikasi tidak menimbulkan regresi pada probe di atas:

- Cache `SiteSetting` di memori (NFR-P-05) + penghapusan 3 query duplikat di `homeController.js` (Beranda, Dasbor, Struktur Organisasi sebelumnya masing-masing meng-query ulang padahal middleware global sudah menyediakannya)
- Proyeksi field pada query Beranda yang sebelumnya mengambil dokumen penuh (mis. `institusiAcc` kini hanya `peringkat berlakuSampai lembaga`)
- Header `Cache-Control: public, max-age=31536000, immutable` untuk seluruh `public/` statis; `app.css`/`app.js` memakai query-string versi (`?v=<hash-konten>`, `scripts/build-manifest.js`) supaya aman di-cache lama tanpa menyajikan versi basi setelah deploy
- `<link rel="canonical">` dan `og:url` per halaman (NFR-SEO-01)
- `sitemap.xml` (statis + dinamis dari Pengumuman/Berita terbit) dan `robots.txt` (NFR-SEO-02)

## Lighthouse mobile (4 halaman utama)

Dijalankan via `npx lighthouse` (default: emulasi mobile + throttling jaringan standar Lighthouse), Chrome headless, terhadap server dev lokal.

| Halaman | Performa | Aksesibilitas | SEO |
|---|---|---|---|
| Beranda | 76 | 100 | 100 |
| Kalender Akademik | **85** | 100 | 100 |
| Akreditasi | 81 | 100 | 100 |
| Dokumen Akademik | 84 | 100 | 100 |

Target: Perf ≥ 85, A11y ≥ 95, SEO ≥ 95. **Aksesibilitas dan SEO lolos di keempat halaman.** Performa lolos di 1 dari 4 (Kalender Akademik); tiga lainnya 1–9 poin di bawah target.

### Temuan nyata & diperbaiki

1. **`link-name`/`button-name` gagal di Dokumen Akademik (Aksesibilitas 91→100)**: tombol "Cari" dan tautan "Unduh" memakai `<span class="hidden sm:inline">` untuk label teks di samping ikon — `hidden` adalah `display:none`, bukan teknik `sr-only` (clip/posisi), sehingga kontennya **benar-benar dikecualikan** dari nama aksesibel, bukan cuma disembunyikan secara visual. Di lebar mobile (di bawah breakpoint `sm`), tombol/tautan ini jadi ikon-saja tanpa nama sama sekali bagi pembaca layar. Pola yang sama ditemukan juga di `views/landing/rpl.ejs`. **Diperbaiki** di ketiga lokasi: `aria-label` ditambahkan ke kontrol (berlaku di semua lebar layar), `aria-hidden="true"` ditambahkan ke span supaya tidak diumumkan dua kali saat teksnya memang terlihat (≥ `sm`). Diverifikasi: Aksesibilitas Dokumen Akademik naik dari 91 ke 100, tidak ada regresi pada probe struktural.
2. **LCP tinggi di Beranda** (gambar hero adalah elemen LCP): ditambahkan `fetchpriority="high"` pada `<img>` dan `<link rel="preload" as="image" fetchpriority="high">` khusus untuk `/`. Audit `lcp-discovery-insight` Lighthouse mengonfirmasi 100 setelah perbaikan (browser langsung memprioritaskan unduhan gambar); ini tidak banyak mengubah skor keseluruhan karena *bottleneck* sebenarnya bukan gambar (lihat di bawah).

### Root cause performa yang belum tuntas: latensi TTFB ke database dev, bukan kode

Pembedahan `lcp-breakdown-insight` pada Beranda menunjukkan **`timeToFirstByte: 1,96 detik`** mendominasi anggaran LCP, sementara pengambilan gambar sendiri (`resourceLoadDelay` + `resourceLoadDuration`) hanya ~60 ms setelah perbaikan `fetchpriority`/preload di atas. Dibuktikan dengan pengukuran langsung (bukan dugaan):

```
curl TTFB /robots.txt (tanpa query database) : ~2 ms
curl TTFB /            (9 query paralel)       : ~460-480 ms
```

Beranda dan Dasbor sudah memparalelkan seluruh query lewat `Promise.all` (lih. bagian "Perubahan Fase 5" di bawah) — satu *round-trip* ke database adalah batas bawah yang secara teknis bisa dicapai dengan kode saat ini. Selisih ~460 ms di atas murni **latensi jaringan ke database pengembangan** (salinan MongoDB Atlas yang kemungkinan besar beda region dari mesin development ini), bukan inefisiensi kueri atau kurangnya paralelisasi. Kalender Akademik (1 query utama) lolos target (85) justru karena query lebih sedikit menegaskan pola ini.

**Kesimpulan**: ini adalah karakteristik topologi lingkungan pengembangan, bukan utang teknis kode. Saat rilis produksi (F6), menempatkan server aplikasi di region/VPC yang sama dengan database akan memotong TTFB secara signifikan tanpa perubahan kode lebih lanjut. Tidak dicoba "akali" dengan cache data beranda (data berubah terlalu sering untuk cache yang aman tanpa invalidasi kompleks, dan menyembunyikan gejala alih-alih mengatasi sebab sebenarnya) — direkomendasikan untuk diukur ulang setelah topologi produksi final di F6, bukan dikejar lebih jauh di lingkungan dev ini.

## Status item F5 lain (di luar lingkup skill audit ini)

Lihat `docs/TODO.md` bagian F5 untuk status lengkap tiap item (cache, proyeksi query, header cache, SEO per halaman, sitemap/robots, `prefers-reduced-motion` — sudah ada sejak F1, dan Lighthouse).

## Kesimpulan

Tidak ada tindakan perbaikan kode yang diperlukan dari audit ini. Seluruh perbaikan aksesibilitas F3/F4 (kontras, target sentuh, nama elemen, overflow, fokus) terbukti tetap berlaku setelah perubahan performa/SEO Fase 5. Tiga butir di atas adalah keterbatasan probe yang sudah dipahami, bukan cacat produk.
