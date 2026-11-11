# DESIGN — Redesain Situs Publik v0.0.1

Mengikat untuk situs publik + login. Admin punya sistemnya sendiri (`docs/DESIGN.md`).
Dokumen terkait: [SPEC.md](SPEC.md) · [TODO.md](TODO.md) · mockup di `preview/`.

## 1. Karakter

**Editorial institusional.** Seperti terbitan resmi universitas: tenang, tegas, percaya diri.
Bukan brosur startup, bukan galeri efek.

- Tipografi adalah dekorasi utama. Judul serif besar; ornamen lain minimal.
- Hijau UNJANI dipakai sebagai **blok** (pita seksi, panel, tombol), bukan gradien atau glow.
- Pemisah = garis tipis dan ruang kosong, bukan kartu ber-shadow.
- Ikon hanya saat memberi makna (jenis file, panah aksi), tidak sebagai hiasan per item.
- Satu tema terang untuk seluruh halaman; tidak ada seksi yang berganti mode.

## 2. Pendekatan (diputuskan)

Tiga pendekatan dipertimbangkan:

1. **Token-first & component refactor** — perbarui fondasi `app.css` + layout + komponen, lalu halaman per halaman. Konsisten, diff terkecil, tanpa duplikasi. **← dipilih user.**
2. Halaman per halaman dengan styling lokal — ditolak: rawan inkonsistensi, diff panjang.
3. Fork `public-v2.ejs` paralel — ditolak: duplikasi sementara, beban rawat ganda.

## 3. Warna

Semua di `@theme` `app.css`; view hanya memakai nama token. Nilai final dikalibrasi saat implementasi dengan uji kontras (AA: teks ≥4.5:1, UI ≥3:1).

| Token | Arah nilai | Pemakaian |
|---|---|---|
| `canvas` | ivory hangat (≈ `#faf8f3`) | Latar halaman — pengganti putih kebiruan sekarang |
| `surface` | putih | Panel, tabel, form |
| `ink` | hijau-hitam gelap (≈ `#1a2e22`) | Teks utama — near-black hangat, bukan slate |
| `muted` | abu kehijauan | Teks sekunder; tetap ≥4.5:1 di canvas |
| `line` | abu hangat tipis | Garis pemisah |
| `brand` | hijau tua UNJANI `#14532d` (tetap) | Blok seksi gelap, panel login; footer memakai token `black` sesuai mockup |
| `primary` | hijau `#15803d` (tetap) | Tautan, tombol utama, fokus |
| `accent` / gold | emas (tetap, dipersempit) | Hanya aksen kecil di atas blok hijau (garis, label "Unggul") |

Dihapus/dipersempit dari sistem lama: `info`/`info-soft`, `gold-soft`, `brand-tint` dan
badge warna-warni per jenis — status disampaikan lewat teks, bukan warna per kategori.

## 4. Tipografi

Font tetap: **Source Serif 4** (display) + **Plus Jakarta Sans** (teks/UI). Tidak menambah font.

| Peran | Font | Gaya |
|---|---|---|
| H1 halaman / hero | Serif 700 | Besar (`text-4xl`–`text-6xl`), `tracking-tight`, maksimal 2 baris |
| H2 seksi | Serif 600–700 | `text-2xl`–`text-3xl` |
| Label kecil (eyebrow) | Sans 600 uppercase tracking lebar | **Dijatah: maksimal 1 per 3 seksi**; selebihnya judul tanpa label |
| Body | Sans 400 | 16px, `leading-relaxed`, lebar baca ≤ `--container-reading` |
| Meta (tanggal, kategori) | Sans 500 kecil | Satu pemisah per baris, tanpa deretan titik tengah |

## 5. Bentuk & Permukaan

- **Radius:** satu sistem, tajam-lembut: panel/gambar `0.5rem`, tombol/input `0.375rem`. Tidak ada pil penuh dan tidak ada kartu `rounded-2xl`.
- **Shadow:** hilang dari kartu; hanya untuk lapisan nyata (dropdown, modal, toast).
- **Kartu:** hanya bila elevasi bermakna. Daftar memakai `divide-y`/`border-t` + ruang; grid memakai garis atau latar `surface` di atas canvas.
- **Glassmorphism, backdrop-blur, overlay gradien dekoratif: dihapus.**

## 6. Layout per Halaman (arah dari mockup)

Variasi keluarga layout antar halaman adalah kuncinya — tidak semua halaman = "page header + grid kartu".

- **Beranda:** hero blok hijau dengan judul serif besar + foto kampus; kartu agenda menjorok ke hero; seksi selang-seling canvas/hijau-muda/blok hijau mengikuti mockup; akses cepat sebagai baris tautan bergaris, bukan ubin kaca.
- **Berita & Pengumuman:** daftar editorial — item unggulan besar di atas, sisanya baris bergaris (thumbnail kecil + judul + tanggal), bukan grid kartu seragam.
- **Profil / RPL / Kurikulum:** halaman baca — kolom teks lebar-terbatas, subjudul serif, daftar bergaris.
- **Pimpinan & Staf:** grid foto rapi dengan nama/jabatan di bawah foto, tanpa kartu ber-shadow.
- **Struktur Organisasi / Kalender Akademik:** panel gambar besar di atas surface + keterangan; unduhan sebagai tombol teks.
- **Akreditasi:** pita status institusi (blok hijau, label emas "Unggul"), tabel/baris akreditasi prodi bergaris.
- **Dokumen Akademik / Buku / Buku Wisuda:** grid cover (dokumen fisik sebagai visual utama) + meta ringkas; aksi unduh/baca sebagai tautan-teks dengan ikon kecil.
- **Login:** split dua panel — kiri blok hijau identitas, kanan form di surface; error sebagai alert inline di atas form (state "Gagal masuk" di mockup); CAPTCHA & alur keamanan tidak berubah.
- **Berita/Pengumuman detail, Cari, Error** (tanpa mockup): mengikuti pola halaman baca.

## 7. Komponen Terdampak

| Komponen | Nasib |
|---|---|
| `section-heading` | Disederhanakan: judul serif + tautan "lihat semua"; eyebrow jadi opsional dan jarang |
| `badge` | Dipersempit: hanya status yang butuh (mis. "Unggul", "Berlangsung"); bukan per kategori konten |
| `page-header` | Jadi blok judul serif di canvas, tanpa pita berwarna |
| `date-block` | Didesain ulang: tanggal tipografis, bukan kotak solid |
| `pagination`, `empty-state`, `toast`, `alert`, `form-field`, `confirm-dialog`, `chat-widget`, `content-sidebar`, `stat-tile` | Restyle token baru, perilaku tetap |

## 8. Gerak

Minimal dan fungsional: transisi hover/focus pendek (token durasi yang ada), reveal halus yang sudah ada boleh tetap. Tidak ada parallax, scroll-hijack, atau loop dekoratif. `prefers-reduced-motion` tetap dihormati.

## 9. Aksesibilitas & Kinerja (tidak boleh turun)

- Kontras AA di semua pasangan baru; fokus terlihat di terang & di atas blok hijau.
- Skip link, `aria-current`, target 44px, label ikon — dipertahankan.
- Hero tetap LCP-aware: gambar di-preload, `fetchpriority="high"`, srcset.
- CSP ketat: semua gaya lewat `app.css`, perilaku lewat `app.js`.

## 10. Diserahkan ke Builder

- Nilai hex final token ivory/ink (dikunci lewat uji kontras).
- Skala spacing detail per seksi (ikuti ritme mockup, bukan piksel).
- Penyesuaian ikon mana yang bertahan per halaman.
- Copy mikro yang perlu dirapikan saat restyle (tanpa mengubah makna).
