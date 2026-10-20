# Verifikasi F5-01–F5-02 — 20 Oktober 2026

Status: **selesai dan terdeploy**; hasil deploy terbaru ada pada
[F5-DEPLOY.md](F5-DEPLOY.md).

- Layout admin lama, view contoh admin lama, komponen rich text lama yang
  tidak dipakai, dan aturan `.admin-nav-link` di CSS publik dihapus.
- Factory konten langsung memakai layout v2; opsi layout dan konstanta pada
  kedua pemanggil yang kini berlebihan dihapus. `/dev/admin` mengalihkan ke
  `/dev/admin-v2` agar URL contoh lama tetap dapat dibuka.
- Seluruh komponen `views/components/` yang tersisa masih memiliki pemanggil
  dari halaman publik atau katalog development. Komponen tersebut serta
  aturan tabel publik dipertahankan. Semua static include EJS masih valid.
- Pemindaian Tailwind publik mengecualikan seluruh `views/admin`, menggantikan
  pengecualian per direktori selama migrasi. CSS admin tetap terpisah.
- `strictCsp` dipasang sekali di `server.js` untuk `/admin`, `/dashboard`,
  dan `/profile`, sebelum static/handler lainnya. Seluruh pemasangan per router
  admin/akun dihapus. Router development mempertahankan CSP untuk `/dev`.
- CSP mencakup redirect, penolakan akses, error, 404 dan modul admin baru.
  Profil dan alias dashboard tetap terlindungi; halaman publik tidak ikut
  mendapat kebijakan ini. Guard autentikasi/peran tetap pada masing-masing router.
- Fixture route diperbarui mengikuti pemasangan CSP terpusat. Tes layout dan
  factory diperbarui; tes regresi baru memeriksa include, penghapusan view,
  serta header CSP pada respons normal maupun gagal.

## Hasil

- `npm run build`: lulus.
- `npm test -- --test-concurrency=1`: **232 lulus, 0 gagal**.
- CSS publik turun dari **74.320** menjadi **69.181 byte**; CSS admin tetap
  **38.762 byte**. Manifest aset diperbarui.
- Pencarian referensi runtime pada controller/router/view/CSS tidak menemukan
  layout lama, class sidebar lama, maupun komponen rich text yang dihapus.
- Chrome 375/1440 px: katalog publik dan pengalihan contoh admin ke v2 lulus
  tanpa overflow. Admin terang/gelap diperiksa; console bersih. Screenshot
  publik HP diperiksa secara visual.
- `git diff --check` untuk perubahan terkait lulus.

Skrip browser lokal: `backups/f5/check-browser.cjs`. Screenshot:
`C:/Users/unjani2/AppData/Local/Temp/f5-chrome-Lxn3gj`.

Audit F5-03 dan pembaruan arsitektur F5-04 telah selesai sesudah pemeriksaan
awal di atas. Belum dilakukan: uji penerimaan staf dan commit/push.
