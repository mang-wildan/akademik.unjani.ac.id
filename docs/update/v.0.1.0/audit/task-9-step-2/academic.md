# Task 9 — Step 2: academic reference/runtime visual comparison

## Scope and fresh evidence

- Read `docs/update/v.0.1.0/DESIGN.md` in full; also read legacy `docs/DESIGN.md` sections 1–7. Versioned v0.1.0 design is comparison authority: ivory/green institutional shell, serif headings, Inter substitution, retain existing fields and real controls. Legacy document contains conflicting older neutral/Plus Jakarta styling; not used to override versioned brief.
- Ran `node C:/Users/unjani2/AppData/Local/Temp/opencode/t9-re6.cjs > .superpowers/sdd/TODO/task-9-step2-academic.log 2>&1` fresh for this review. Exit code 0; log has 214 state checks. All 24 baseline 1440 states report `overflow:false`, `h1:1`; form panel counts: accreditation 3, lembaga 1, documents/RPL/kurikulum/books 2, calendar create 1/edit 4, lulusan 1.
- Browser: headless Chromium, viewport 1440×1000, full-page screenshots; screenshot heights vary. Fixture runs project routes, EJS and selected real middleware (admin preferences, strict CSP, renderPage), with in-memory fictional model methods and injected Admin Uji identity. Not production authentication/session coverage; no real database evidence.
- Visually read all 24 reference PNGs and all 24 corresponding fresh runtime PNGs using 24 paired PIL contact sheets (reference left/runtime right, each rendered 960px wide, proportional full height). Sheets: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/pair-<module>-<list|new|edit>.png`. No image generation.
- Source review: all form/list EJS files in the eight `views/admin/<module>/` directories, calendar `create.ejs`/`edit.ejs`, shared `_ui/academic-list.ejs`, `_ui/academic-actions.ejs`, and `test/helpers/adminContentFixture.js`. This checks presence of fields/actions beyond reference crop, not a historical proof that every prior implementation field was preserved.

## Common observed deviations / interpretation

- Institutional green sidebar, ivory canvas, serif page/panel headings, white bordered panels and aligned main content track reference hierarchy. Runtime shell includes project navigation/permissions, icons, Admin Uji and operational controls rather than exact drawn menu/account content. Search copy is Cari menu; not fabricated global content search.
- Inter replaces Swis721 BT per DESIGN. Native select chevrons, number spinners, localized date formatting, checkbox rendering and file chooser text differ from vector/drawn controls. Uploads are dashed wrappers with real native input, not promised drag-and-drop. Existing file links are operational UI, not replicated reference file-size metadata.
- All lists use shared search/filter/table/selection/pagination/actions. Counts, row lengths, dates, status values, option sets and whitespace reflect one fictional seeded record, not reference sample data. Missing decorative tabs/filters must not be recreated unless backed by route/query behavior. No pixel-perfect claim.
- Full-page runtime exposes extra legitimate fields and calendar panels below reference crop. Longer pages or different row/field distribution are recorded below, not treated as deletion requests.

## Exact 24-image comparison ledger

### Akreditasi

#### Daftar
- Reference PNG: `docs/update/v.0.1.0/preview/Akreditasi _ Daftar.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-accreditations-1440-list.png`
- Route/state: `GET /admin/accreditations`; light, desktop, one fictional record, unfiltered.
- Observed comparison: Unit/program studi, peringkat, lembaga, expiry/status table retained. Runtime adds explicit Aktif column and actual filter/bulk controls; single fictional row replaces reference population, so table height/count/pagination differ.

#### Tambah
- Reference PNG: `docs/update/v.0.1.0/preview/Akreditasi _ Tambah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-accreditations-1440-new.png`
- Route/state: `GET /admin/accreditations/new`; light, desktop, new/unsaved form.
- Observed comparison: Unit terakreditasi → Hasil akreditasi → Sertifikat grouping retained. Extra Nama Unit and Catatan Perpanjangan remain visible; form extends vertically rather than hiding fields to fit PNG. Native select/date/file controls differ from drawn controls. New state has no current certificate.

#### Ubah
- Reference PNG: `docs/update/v.0.1.0/preview/Akreditasi _ Ubah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-accreditations-1440-edit.png`
- Route/state: `GET /admin/accreditations/000000000000000000000001/edit`; light, desktop, existing fictional record before long-content mutation.
- Observed comparison: Same three-panel sequence; selected Informatika Uji/Lembaga Uji, SK/UJI/2026, 2026–2030 dates replace reference values. Current certificate is link plus native replacement input, not decorative preview. Extra unit/renewal fields retained.

### Lembaga Akreditasi

#### Daftar
- Reference PNG: `docs/update/v.0.1.0/preview/Lembaga Akreditasi _ Daftar.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-lembaga-akreditasi-1440-list.png`
- Route/state: `GET /admin/lembaga-akreditasi`; light, desktop, one fictional record, unfiltered.
- Observed comparison: Name/abbreviation/order table retained; runtime one Lembaga Uji / LAM row and count 1 replace reference data. Search, selection, pagination and Ubah/overflow use shared table shell; row density/content length differ.

#### Tambah
- Reference PNG: `docs/update/v.0.1.0/preview/Lembaga Akreditasi _ Tambah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-lembaga-akreditasi-1440-new.png`
- Route/state: `GET /admin/lembaga-akreditasi/new`; light, desktop, new/unsaved form.
- Observed comparison: Short Data lembaga panel retained without empty side panel. Runtime heading is Tambah Lembaga (shorter than module name); Nama, Singkatan and Urutan Tampil are stacked, with native numeric control and separate Batal/Simpan footer.

#### Ubah
- Reference PNG: `docs/update/v.0.1.0/preview/Lembaga Akreditasi _ Ubah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-lembaga-akreditasi-1440-edit.png`
- Route/state: `GET /admin/lembaga-akreditasi/000000000000000000000001/edit`; light, desktop, existing fictional record before long-content mutation.
- Observed comparison: Same short panel/field sequence; Lembaga Uji / LAM / 0 replace reference values. Runtime heading Ubah Lembaga and shared action footer differ in copy/spacing from static frame. No upload expected.

### Dokumen Akademik

#### Daftar
- Reference PNG: `docs/update/v.0.1.0/preview/Dokumen Akademik _ Daftar.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-academic-documents-1440-list.png`
- Route/state: `GET /admin/academic-documents`; light, desktop, one fictional record, unfiltered.
- Observed comparison: Title/category/pin/update table retained. Pedoman akademik uji, Pedoman Uji, Disematkan and fixture date replace reference rows. Shared Sematan filter and actual selection/actions retained; one-row table/pagination shorter than reference.

#### Tambah
- Reference PNG: `docs/update/v.0.1.0/preview/Dokumen Akademik _ Tambah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-academic-documents-1440-new.png`
- Route/state: `GET /admin/academic-documents/new`; light, desktop, new/unsaved form.
- Observed comparison: Data dokumen and Berkas panels retained. Runtime includes Sematkan di Beranda (maks. 4) and Keterangan, not removed to match sparse frame. Native PDF chooser replaces illustrated upload; new state has no current-file card.

#### Ubah
- Reference PNG: `docs/update/v.0.1.0/preview/Dokumen Akademik _ Ubah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-academic-documents-1440-edit.png`
- Route/state: `GET /admin/academic-documents/000000000000000000000001/edit`; light, desktop, existing fictional record before long-content mutation.
- Observed comparison: Same panels with populated fixture title/category and checked pin. Current File saat ini link plus PDF replacement input remains visible. Optional Keterangan and pin control contribute height/spacing differences.

### Dokumen RPL

#### Daftar
- Reference PNG: `docs/update/v.0.1.0/preview/Dokumen RPL _ Daftar.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-rpl-documents-1440-list.png`
- Route/state: `GET /admin/rpl-documents`; light, desktop, one fictional record, unfiltered.
- Observed comparison: Title/year/status table retained; Pedoman RPL uji / 2026 / Aktif replace reference rows. Runtime has real Status filter, selection/bulk/actions and one-result footer rather than static sample count.

#### Tambah
- Reference PNG: `docs/update/v.0.1.0/preview/Dokumen RPL _ Tambah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-rpl-documents-1440-new.png`
- Route/state: `GET /admin/rpl-documents/new`; light, desktop, new/unsaved form.
- Observed comparison: Data dokumen RPL → Berkas retained. Title/year plus active checkbox and Deskripsi remain in source/runtime; native number/file inputs and extra optional description make layout differ from simplified frame. No current file in new state.

#### Ubah
- Reference PNG: `docs/update/v.0.1.0/preview/Dokumen RPL _ Ubah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-rpl-documents-1440-edit.png`
- Route/state: `GET /admin/rpl-documents/000000000000000000000001/edit`; light, desktop, existing fictional record before long-content mutation.
- Observed comparison: Fixture title/year and active checkbox replace reference content. Current File saat ini link and native replacement chooser replace static document depiction; Deskripsi retained, with shared Batal/Simpan footer.

### Kurikulum

#### Daftar
- Reference PNG: `docs/update/v.0.1.0/preview/Kurikulum _ Daftar.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-kurikulum-1440-list.png`
- Route/state: `GET /admin/kurikulum`; light, desktop, one fictional record, unfiltered.
- Observed comparison: Program Studi/year/update table retained. Informatika Uji / 2026 / fixture timestamp replace reference rows; Program Studi filter and actual search/pagination retained. One row changes whitespace and footer position.

#### Tambah
- Reference PNG: `docs/update/v.0.1.0/preview/Kurikulum _ Tambah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-kurikulum-1440-new.png`
- Route/state: `GET /admin/kurikulum/new`; light, desktop, new/unsaved form.
- Observed comparison: Data kurikulum → Berkas grouping retained. Program Studi selection, free-text Tahun Kurikulum (supports year or academic-year string), PDF native upload and Batal/Simpan present. Native select/file and explanatory copy differ from drawn controls.

#### Ubah
- Reference PNG: `docs/update/v.0.1.0/preview/Kurikulum _ Ubah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-kurikulum-1440-edit.png`
- Route/state: `GET /admin/kurikulum/000000000000000000000001/edit`; light, desktop, existing fictional record before long-content mutation.
- Observed comparison: Same grouping; selected fictional prodi and 2026 replace reference selection. Current File saat ini link plus replacement PDF chooser present; no fabricated file metadata/preview. Full-page route retained, not forced into slide-over.

### Kalender Akademik

#### Daftar
- Reference PNG: `docs/update/v.0.1.0/preview/Kalender Akademik _ Daftar.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-academic-calendars-1440-list.png`
- Route/state: `GET /admin/academic-calendars`; light, desktop, one fictional record, unfiltered.
- Observed comparison: Tahun Ajaran, Nomor SK, Kegiatan and Lampiran columns retained; runtime one 2026/2027 row with one event/one attachment replaces reference counts. Shared table shows Ubah rather than reference Kelola wording; edit destination still calendar management.

#### Tambah
- Reference PNG: `docs/update/v.0.1.0/preview/Kalender Akademik _ Tambah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-academic-calendars-1440-new.png`
- Route/state: `GET /admin/academic-calendars/new`; light, desktop, new/unsaved form.
- Observed comparison: Data tahun ajaran panel keeps Tahun Ajaran, Nomor SK Rektor and required PDF upload. Native file control and visible help replace drawn upload; Simpan & Lanjutkan retained. Short creation form does not fabricate event/import panels before record exists.

#### Kelola 2026-2027
- Reference PNG: `docs/update/v.0.1.0/preview/Kalender Akademik _ Kelola 2026-2027.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-academic-calendars-1440-edit.png`
- Route/state: `GET /admin/academic-calendars/000000000000000000000001/edit`; light, desktop, existing fictional record before long-content mutation.
- Observed comparison: Reference Kelola state maps to edit route, runtime heading Kalender 2026/2027. Four anchor buttons replace segmented/tab-like presentation; Data tahun ajaran, Kegiatan, Impor CSV and Lampiran all stay visible vertically, making full-page screenshot much taller than reference. One fictional event/attachment replaces sample rows. Native dates/uploads, inline add-event/add-attachment forms, destructive-import warning and required confirmation remain.

### Buku Wisuda

#### Daftar
- Reference PNG: `docs/update/v.0.1.0/preview/Buku Wisuda _ Daftar.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-graduation-books-1440-list.png`
- Route/state: `GET /admin/graduation-books`; light, desktop, one fictional record, unfiltered.
- Observed comparison: Judul/year/period table retained; runtime Buku wisuda uji / 2026 / I and one-row count replace reference entries. Shared text table rather than cover-led decoration; actual period filter/selection/Ubah/overflow retained.

#### Tambah
- Reference PNG: `docs/update/v.0.1.0/preview/Buku Wisuda _ Tambah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-graduation-books-1440-new.png`
- Route/state: `GET /admin/graduation-books/new`; light, desktop, new/unsaved form.
- Observed comparison: Data buku wisuda → Berkas retained. Title, period, year, PDF and Gambar Sampul upload remain. Native two file controls replace illustrated upload surfaces; no fake cover shown on create. Form stays single main column with separate action footer.

#### Ubah
- Reference PNG: `docs/update/v.0.1.0/preview/Buku Wisuda _ Ubah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-graduation-books-1440-edit.png`
- Route/state: `GET /admin/graduation-books/000000000000000000000001/edit`; light, desktop, existing fictional record before long-content mutation.
- Observed comparison: Fixture title/year/period replace reference data. Both current-file/current-cover links and replacement choosers retained; small green fictional SVG cover replaces real reference artwork. PDF and cover remain separate controls, extending form height.

### Data Lulusan

#### Daftar
- Reference PNG: `docs/update/v.0.1.0/preview/Data Lulusan _ Daftar.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-lulusan-1440-list.png`
- Route/state: `GET /admin/lulusan`; light, desktop, one fictional record, unfiltered.
- Observed comparison: Prodi/faculty/year/period/graduate-count table retained; Informatika Uji / FT / 2026 / I / 0 replace reference values. CSV import retained as collapsed native disclosure below table, not hidden/removed; reference population/filter presentation differs.

#### Tambah
- Reference PNG: `docs/update/v.0.1.0/preview/Data Lulusan _ Tambah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-lulusan-1440-new.png`
- Route/state: `GET /admin/lulusan/new`; light, desktop, new/unsaved form.
- Observed comparison: Data lulusan short panel retained. Prodi and Fakultas remain separate required selects, then Periode, Tahun and Jumlah Lulusan; fields stack rather than reproduce compact drawn row arrangement. Native selects/numbers and explicit faculty field retained, no upload on individual create form.

#### Ubah
- Reference PNG: `docs/update/v.0.1.0/preview/Data Lulusan _ Ubah.png`
- Fresh runtime PNG: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-6-lulusan-1440-edit.png`
- Route/state: `GET /admin/lulusan/000000000000000000000001/edit`; light, desktop, existing fictional record before long-content mutation.
- Observed comparison: Same field order, fixture prodi/faculty/year/period and valid 0 graduates replace reference values. Faculty still editable separately; native controls and shared Batal/Simpan footer differ from static depiction. CSV import remains on list, not duplicated into edit.

## Source retention and limitations

- Accreditation: `jenis`, `programStudi`, `namaUnit`, `peringkat`, `lembaga`, `nomorSK`, `tanggalBerlaku`, `berlakuSampai`, `catatanPerpanjangan`, certificate upload/current link retained; list active flag/filter/bulk activation retained. Form has three real panels, not forced into two.
- Lembaga: `nama`, `singkatan`, conditional `urutan` (`hasUrutan`) retained; short single-panel form. Academic documents: `name`, category, pinned checkbox, optional `keterangan`, PDF/current link and pin/unpin action retained. RPL: `judul`, `tahun`, active/archive, `deskripsi` and PDF/current link retained.
- Kurikulum: `prodi`, free-text `tahun`, PDF/current link retained. Books: title, period, numeric year, PDF source/current link, cover upload/current link and existing-cover preview retained. No invented file size or real cover content.
- Calendar: data form; sorted event table with delete and add-event form (semester/name/start/optional end); CSV template/upload, replacement warning/required confirmation and import errors; attachment table/link/delete and add form (title/number/date/PDF) all retained. Anchor navigation does not remove panels when JavaScript unavailable.
- Lulusan: separate required prodi/faculty, period/year/count (min 0) retained. List retains CSV template/upload and error summary in native disclosure. Shared search, actual filter options, bulk delete, edit links, confirm-delete and pagination retained across modules.
- Additional concrete deviations: reference form back-links above titles are absent on most runtime forms; edit footers say Simpan rather than Simpan perubahan and omit reference inline Hapus links (delete remains in list overflow/confirmation). Most runtime forms are wider than reference short forms. Full-page screenshots place fixed action bars across document content; this is not evidence of viewport occlusion. Follow-up 1440×1000 viewport screenshots after scrolling show final upload controls, current-file links and final panels fully above action bar in accreditation new/edit and book edit. Classify initial crossing as fullPage capture artifact for these tested states, not confirmed occlusion bug. Broader keyboard/mobile obstruction remains outside this focused check.
- Reference accreditation form includes Aktif checkbox; runtime form does not. Checked `git show HEAD:views/admin/accreditations/form.ejs` and pre-styling parent `git show 9ab4adb680d3e8fd4a591d002f9d8c70f0b52356^:views/admin/accreditations/form.ejs`: both lack active checkbox. Therefore reference-only design difference, not evidence of existing field removed by styling. Active state remains available through list filters/bulk activation. Reference Nomor SK required marker differs from runtime optional field; parent form also leaves it optional. No contract/backend change requested or made.
- Reference-only table details absent from current source: academic-document file metadata and category filter; RPL Diperbarui column/file metadata; kurikulum Berkas column/faculty subtitle and faculty filter (runtime has prodi filter); books cover thumbnails/lulusan/file metadata and year filter (runtime has period filter); calendar Tampil di situs/Arsip subtitle; lulusan period filter (runtime has prodi/year). Recorded as gaps/different supported controls, not assumed harmless data variation.
- Shell output initially rendered em dashes as replacement-looking glyphs in source text output. Direct UTF-8 Python check of calendar edit found zero U+FFFD and two em dashes; runtime calendar missing date values display em dashes. No encoding defect claimed.
- Runner also checks other widths, import error paths, long/null values, mobile dark, applicable slide-over opening and no-JS create form presence; these are separate automated checks, not extra reference-image comparisons. Invalid calendar CSV keeps original event; invalid lulusan CSV keeps original count. Runner exit 0 does not prove successful production upload/POST persistence, keyboard accessibility, all permissions, real DB integration or pixel identity.

## Focused viewport clarification

Supplemental runner: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9-scroll.cjs`, derived from same fixture runner; only accreditation new/edit and graduation-book edit. Runs real routes/EJS with fictional in-memory data. Calls final upload `scrollIntoViewIfNeeded()`, then scrolls to document bottom; screenshots use `fullPage:false`, viewport 1440×1000. Fresh rerun exit 0; JSON metrics saved in `.superpowers/sdd/TODO/task-9-step2-academic-scroll.log`. All three viewport images visually read.

| Route/state | Exact viewport PNG | Final input top–bottom | Final panel top–bottom | Action bar top–bottom | Finding |
|---|---|---|---|---|---|
| `/admin/accreditations/new` | `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-academic-accreditations-new-scrolled.png` | 765–815px | 649–879px | 903–968px | Certificate chooser/help fully visible above bar; renewal textarea also visible |
| `/admin/accreditations/000000000000000000000001/edit` | `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-academic-accreditations-edit-scrolled.png` | 707–757px | 591–879px | 903–968px | Certificate chooser/current link fully visible above bar; renewal textarea also visible |
| `/admin/graduation-books/000000000000000000000001/edit` | `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-academic-graduation-books-edit-scrolled.png` | 559–609px | 233–879px | 903–968px | Cover chooser/current link and full cover preview visible above bar |

Each last panel ends 24px above bar. No browser page errors captured. These findings correct original fullPage artifact interpretation; they do not certify all scroll positions, keyboard paths, mobile widths or overall design parity.

## Result

24/24 reference/runtime pairs visually reviewed, plus three focused scrolled viewport checks. No confirmed final-field occlusion in tested desktop states. Aktif checkbox is reference-only difference against checked pre-styling parent, not demonstrated regression. Design differences remain: table metadata/filters, form navigation/actions, native controls and field distribution. No blanket PASS, pixel-perfect or real-DB claim. No application code, contract or backend changed; Step 2 only.

## Salinan bukti portabel

- [task-9-step2-academic-accreditations-edit-scrolled.png](../../screenshots/task-9-step2-academic-accreditations-edit-scrolled.png)
- [task-9-step2-academic-accreditations-new-scrolled.png](../../screenshots/task-9-step2-academic-accreditations-new-scrolled.png)
- [task-9-step2-academic-graduation-books-edit-scrolled.png](../../screenshots/task-9-step2-academic-graduation-books-edit-scrolled.png)
