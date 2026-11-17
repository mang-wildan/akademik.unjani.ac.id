# Task 9 Step 2 — publication visual comparison

> Pembaruan bukti tambahan tersedia di bagian **Addendum Step 2** paling bawah. Temuan awal dipertahankan sebagai history; status terkini untuk bulk confirmation, toast, kategori, dan invalid upload mengikuti addendum.

## Scope, method, limits

2026-11-17. Read `docs/update/v.0.1.0/DESIGN.md`, especially §§3–7. Compared ALL 18 publication PNGs: Berita 7, Pengumuman 7, Buku 4. `Buku Wisuda` belongs to separate module and is excluded deliberately. No application code changed.

Reran `C:/Users/unjani2/AppData/Local/Temp/opencode/t9-re5.cjs`; exit 0. Output: `.superpowers/sdd/TODO/task-9-step2-publication.log` (51 lines). Browser: headless Chromium, viewport 1440×1000; screenshots full-page, so some PNG heights exceed 1000. Actual application routes/middleware/EJS run against `test/helpers/adminContentFixture` in-memory fictional documents, mocked DB/auth context. NOT production DB, real account permission matrix, real media, or production deployment. Fixture PDF is stub content, not proof PDF opens correctly. No pixel-identical claim.

All 18 reference/runtime pairs were opened visually as side-by-side PIL compositions, not inferred from file existence or automated assertions. Review artifacts: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9compare/01.jpg` through `18.jpg`; exact mapping/sizes in `C:/Users/unjani2/AppData/Local/Temp/opencode/t9compare/manifest.json`. Compositions preserve whole frames at 75% display scale; gray below shorter images is comparison canvas, not application background.

Status vocabulary: **conforms pattern** = matching hierarchy/component pattern, not exact pixels; **adapted** = justified web/data/state adaptation; **diff** = visible mismatch or missing matched-state evidence, not silently accepted. Each frame can have multiple statuses. Overall result: recognizable institutional pattern; NOT blanket visual pass. Main residual diffs: content forms merge Lampiran and Gambar sampul into other panels, move actions to footer, omit return link/publication metadata/delete action; Buku full-page layout differs substantially; narrow date column splits heading/dates; fixture category renders empty badge; confirmation captures single-delete rather than reference bulk-delete.

## Shared observations applying to every frame

- **Conforms pattern:** fixed green sidebar, ivory canvas, white panels, serif H1/panel headings, mono uppercase table/group headings, green primary actions and ivory active navigation with gold left edge. Content edges align with intended desktop shell; runner measures full-page form columns 720px + 336px with 24px gap at 1440. No horizontal document overflow reported.
- **Adapted:** Inter replaces unavailable Swis721 per DESIGN §3. `Cari menu...` replaces misleading `Cari menu atau konten`, retaining Ctrl K indicator. Fictional `Admin Uji` account, `Admin Akademik` branding/breadcrumb wording and fixture titles/dates/images are not reference data. Sidebar groups use application ordering/spacing; later groups require its own scroll rather than every item fitting reference screenshot. Account icon replaces reference initials.
- **Diff:** reference form headers include `Kembali ke ...` above H1; runtime forms do not. Runtime list title has total count next to H1, not per-status tab counts. Native select/file controls visibly differ but satisfy existing-field/native-upload adaptation; no fake drag/drop promise.
- Lists are 3 fixture rows rather than 6–8 reference rows. Absent numeric pagination in this one-page fixture is expected, NOT proof multipage pagination has been visually checked. Runtime updated-date heading wraps `DIPERBARUI` across lines and dates wrap year onto next line in lists; reference keeps those single-line. Runtime category badge is only a dot because fixture document category is raw ID rather than populated name; not proof production categories are absent, but this run cannot visually validate category copy.

## Per-frame findings

### 01 — Berita / Daftar — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Berita _ Daftar.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-news-1440-list.png`
- Route/state: `GET /admin/news`, three fixture items, unselected, light.
- White bordered list panel contains tabs/filter/search, mono header, thumbnail/title/status/date/actions, count footer. Title and green Tambah Berita align to content edges.
- Adapted: heading count 3; extra truthful cover-required helper below H1; real filter submit `Terapkan`; search at far right, category select beside tabs instead of after search. Thumbnails use green SVG fixture, not reference campus photos. Native disclosure is horizontal ellipsis rather than vertical.
- Diff: no per-tab counts; reference secondary title metadata (pin/participants/gallery/unpublished) absent, runtime has pin icon only. Category dot and wrapped updated-date column limit fidelity. Row density/panel height differs, partly because shorter fixture text/three rows.

### 02 — Berita / Hasil kosong — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Berita _ Hasil kosong.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-news-1440-empty.png`
- Route/state: `GET /admin/news?q=tidakditemukan`, filtered empty, light.
- Centered icon, serif `Tidak ada berita yang cocok.` and Hapus filter preserve specific filtered-empty pattern; no misleading add-first-record CTA.
- Adapted search value differs from reference `wisuda 2019`; footer truthfully says 0 berita; reset also appears in filter row.
- Diff: reference table-column header remains above empty area; runtime omits header. Reference explanatory sentence about keywords/category/status omitted. Runtime empty panel shorter and icon newspaper rather than document. Helper below H1 remains.

### 03 — Berita / Konfirmasi hapus — conforms pattern + diff (state mismatch)
- Reference: `docs/update/v.0.1.0/preview/Berita _ Konfirmasi hapus.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-news-1440-delete.png`
- Route/state: `GET /admin/news`, first-row disclosure then single Hapus; native dialog open.
- White max-480px dialog, red top rule, serif heading, permanent deletion/attachments consequence, Batal and red Hapus conform component pattern. Runner asserts initial focus Batal and Escape closes.
- Diff: reference `Hapus 3 berita?` is BULK confirmation over selected rows; runner shows generic `Hapus konten?` for one named item. Cannot certify matching bulk-dialog count/copy from this capture. Runtime dialog vertically centered, reference positioned higher; row disclosure remains visibly open behind modal. Backdrop lighter than reference.

### 04 — Berita / Pilih massal — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Berita _ Pilih massal.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-news-1440-bulk.png`
- Route/state: `GET /admin/news`, first two row checkboxes selected, before bulk submission.
- Green count/action band, pale-green selected rows, Terbitkan/Jadikan draf/Hapus/Batalkan pilihan visible.
- Adapted: honest 2 selected, select-all-3-results link and indeterminate header checkbox. Bulk bar replaces filter row per DESIGN §5 rather than sitting below it as reference does. No fake Urungkan; reference success toast is post-publish, runner has not submitted bulk action, so no runtime success toast expected.
- Diff: action group aligned right instead of immediately after count; missing row metadata and wrapped dates remain. No visual evidence of actual post-bulk success toast in this run.

### 05 — Berita / Tambah — gagal validasi — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Berita _ Tambah — gagal validasi.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-news-1440-validation.png`
- Route/state: `POST /admin/news`, title `abc`, empty body, validation rerender (422 allowed by runner).
- Danger-soft summary and left danger rule; title/body errors visible near controls; entered title retained. Summary gets visible focus outline.
- Adapted: 2 errors rather than reference 3 because invalid attachment was NOT submitted. File picker explicitly requests reselection after error; no claim attachment error branch tested.
- Diff: summary spans entire grid rather than main column; right panel starts below summary. Status native select rather than segmented switch. Attachments inside main panel, cover inside Terbitkan, not separate Lampiran/Gambar sampul panels. Footer actions replace right-panel actions. Body error text visible but editor does not have reference's strong full red outline. No return link.

### 06 — Berita / Tambah — adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Berita _ Tambah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-news-1440-new.png`
- Route/state: `GET /admin/news/new`, blank draft, light.
- Conforms outer 720/336 grid and main-before-publishing hierarchy; visible title/body/category/status/pin/cover/attachments retained.
- Adapted native file pickers correctly state types/limits; no meaningless current-attachment upload area on new item. Rich-text toolbar uses existing icon controls and help, not reference textual H2/quote/Ctrl-S toolbar.
- Diff: shorter editor, no separate Lampiran/Gambar sampul panel headings, no return link; category precedes status. Simpan green and Simpan & Terbitkan secondary at wide footer versus reference green publish and secondary draft in sidebar. Full page shorter (1000 vs reference 1239px).

### 07 — Berita / Ubah — adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Berita _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-news-1440-edit.png`
- Route/state: `GET /admin/news/000000000000000000000001/edit`, published/pinned fixture with attachment and cover.
- Existing body/title, category, published selection, checked pin, cover preview, current attachment and preview link visible. Existing-attachment keep checkbox is meaningful web control absent from drawing; uncheck removes on save.
- Diff: reference publication summary rows Status/Terbit/Diperbarui absent. Separate Lampiran and Gambar sampul panels merged; file filename/size/type cards reduced to checkbox/link and plain cover preview. No Hapus berita in edit form (delete available from list). Preview/save actions moved to footer; `Simpan` rather than `Simpan perubahan`. No return link. Fixture cover and brief body explain content differences, not structural diffs.

### 08 — Buku / Daftar — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Buku _ Daftar.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-books-1440-list.png`
- Route/state: `GET /admin/books`, three fixture books, light.
- Serif H1, green Tambah Buku, thumbnail/title/year/date/Ubah/disclosure table and count footer conform pattern; no invented publication-status tabs.
- Adapted: 3 instead of 23 total and no multipage controls; synthetic covers, 2026 years and fixture dates.
- Diff: search right-aligned rather than left; PDF/size subtitle absent; portrait cover appears smaller/squarer in list; updated heading/year wrap. No visual pagination-state coverage.

### 09 — Buku / Konfirmasi hapus — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Buku _ Konfirmasi hapus.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-books-1440-delete.png`
- Route/state: `GET /admin/books`, first-row Hapus, native dialog open.
- Single-book state matches reference operation. Red top rule, Batal/Hapus and permanent PDF/cover deletion consequence visible; focus Batal/Escape asserted.
- Adapted: generic heading `Hapus buku?` with fixture title in body instead of title in heading; cover deletion explicitly mentioned.
- Diff: modal centered lower than reference, shorter body spacing, generic Hapus label rather than Hapus buku; disclosure left open behind modal. No deletion submitted, so no storage-removal claim.

### 10 — Buku / Tambah — diff + adapted
- Reference: `docs/update/v.0.1.0/preview/Buku _ Tambah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-books-1440-new.png`
- Route/state: `GET /admin/books/new`, full-page blank form, light.
- Fields title/year/PDF/cover and Batal/Simpan remain visible, native upload limits shown.
- Major diff: reference is narrower SINGLE-column Data buku then Berkas with year beside title vertically, PDF then cover in lower panel. Runtime imposes 720/336 two-column title+PDF versus Detail buku(year+cover), full-width white action footer. No Data buku/Berkas headings or back link. This is not merely mobile/slide-over adaptation.
- Semantics differ visibly: reference year required/current 2026, cover optional; runtime year optional/blank and cover required on create. These are current source contracts, not changed in this review; reference is not authority to silently change backend requirements.

### 11 — Buku / Ubah — diff + adapted
- Reference: `docs/update/v.0.1.0/preview/Buku _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-books-1440-edit.png`
- Route/state: `GET /admin/books/000000000000000000000001/edit`, existing PDF/cover, light.
- Current PDF link, year 2026, replacement pickers, cover preview and Batal/Simpan retained.
- Same major two-column regrouping vs single-column Data buku/Berkas reference. Current PDF lacks reference filename/size card; cover lacks filename/format/dimensions card and object-cover crops fixture landscape art into portrait preview. No Hapus buku on form (list remains access path), no back link; button says Simpan rather than Simpan perubahan. Year optional rather than reference required.

### 12 — Pengumuman / Daftar — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Pengumuman _ Daftar.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-pengumuman-1440-list.png`
- Route/state: `GET /admin/pengumuman`, three fixture items, light.
- Serif H1/green add, status tabs, category/search, title/status/date/actions table conform pattern.
- Adapted: honest count 3/one page, native Terapkan filter, fixture thumbnails. Runtime adds thumbnails to announcements unlike reference title-only rows.
- Diff: reference pin/attachment/unpublished subtitle metadata absent; pin icon alone. Per-tab counts absent, category dot empty, date header/value wrap. Filter order and smaller row/panel height differ. No multipage reference state validated.

### 13 — Pengumuman / Hasil kosong — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Pengumuman _ Hasil kosong.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-pengumuman-1440-empty.png`
- Route/state: `GET /admin/pengumuman?q=tidakditemukan`, filtered empty, light.
- Specific no-match heading and reset CTA centered in white list panel; 0 footer truthful. Native campaign icon differs from reference document icon.
- Diff: missing retained table header and keyword/filter explanatory sentence; shorter empty area. Additional Hapus filter in top filter row, different query fixture and filter order are adaptations rather than empty-data bugs.

### 14 — Pengumuman / Konfirmasi hapus — conforms pattern + diff (state mismatch)
- Reference: `docs/update/v.0.1.0/preview/Pengumuman _ Konfirmasi hapus.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-pengumuman-1440-delete.png`
- Route/state: `GET /admin/pengumuman`, first-row disclosure/Hapus, single native confirmation.
- Red top rule, permanent content/attachment consequence, Batal and red Hapus match component family; initial Batal focus and Escape verified by runner.
- Diff: reference is 3-selected bulk confirmation, runtime generic `Hapus konten?` single title. Bulk count/copy NOT visually matched. Lower vertical centering, lighter backdrop, disclosure open behind dialog. No deletion executed.

### 15 — Pengumuman / Pilih massal — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Pengumuman _ Pilih massal.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-pengumuman-1440-bulk.png`
- Route/state: `GET /admin/pengumuman`, first two rows selected, pre-submit.
- Green bulk band, highlighted rows, count and publish/draft/delete/cancel actions visible. Indeterminate header checkbox and select-all-results link reflect selection honestly.
- Adapted: 2 vs 3 selected; bulk replaces filter row per DESIGN, no fake Urungkan. Reference post-publish toast not recreated because no bulk action submitted.
- Diff: right-aligned action group, no reference metadata; date/category limitations persist. Post-action toast and matching bulk confirmation remain uncovered visually.

### 16 — Pengumuman / Tambah — gagal validasi — conforms pattern + adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Pengumuman _ Tambah — gagal validasi.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-pengumuman-1440-validation.png`
- Route/state: `POST /admin/pengumuman`, `abc` title and empty body, validation rerender.
- Summary alert/focus outline, title inline error and body error visible; rejected title retained.
- Adapted: 2 errors because no invalid PDF uploaded, not reference's 3. No validation test of file rejection in this capture.
- Diff: summary full-width rather than main-only; publishing panel pushed below it. Strong red body editor border absent; attachment-error styling not captured. Separate Lampiran/Gambar sampul panels and back link absent; footer actions replace sidebar actions, native status select replaces segmented control.

### 17 — Pengumuman / Tambah — adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Pengumuman _ Tambah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-pengumuman-1440-new.png`
- Route/state: `GET /admin/pengumuman/new`, blank draft, light.
- Correct 720/336 grid; title/editor/attachments left, category/status/pin/cover right. Upload types/limits remain explicit; native picker avoids unimplemented drop affordance.
- Diff: Lampiran and Gambar sampul no longer separate headed panels; editor notably shorter, category before status, footer save/publish rather than sidebar draft/publish, no return link. Reference new-page current-attachment placeholder omitted appropriately because none exists. Page 1000px versus reference 1239px.

### 18 — Pengumuman / Ubah — adapted + diff
- Reference: `docs/update/v.0.1.0/preview/Pengumuman _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-pengumuman-1440-edit.png`
- Route/state: `GET /admin/pengumuman/000000000000000000000001/edit`, published/pinned fixture, current attachment/cover.
- Populated title/body/category/status/pin and existing-media controls visible; current attachment keep checkbox/link explicit, preview saved version available.
- Diff: missing Status/Terbit/Diperbarui summary; merged attachment/cover panels; no reference filename/size media cards, no Hapus pengumuman edit action or return link. Footer Simpan/publish/preview instead of sidebar Simpan perubahan/preview/delete. Fixture text and green image not copied from reference by design.

## Source field audit — retained fields beyond drawn appearance

Read `views/admin/news/form.ejs` and `views/admin/pengumuman/form.ejs` (both include shared content form), `views/admin/_ui/content-form.ejs:3–40`, `views/admin/books/form.ejs:3–20`, and shared content list.

- News/Pengumuman POST multipart retain `title`, `body`, `kategori`, `status` (`draft`/`published`), `pinned`, `featuredImage`, multiple `attachments`. Existing attachments retain hidden `attachmentsEditable=1` and repeated `keepAttachment` checkbox IDs/values, which PNG does not draw as such. Keep checkboxes and explicit removal help must not be deleted to mimic static file cards. Error mapping body points to `f-body-field`; form-level error to `f-pinned`. `intent=publish` submit button retained, as are ordinary save, cancel and saved-preview route. No invented publication date input: reference edit metadata are display rows, not missing editable field.
- Buku multipart retains `title`, `file`, `year`, `cover`. `year` is native number with min 1950/max 2100 and optional per existing form; PDF and cover required only create, optional replacements on edit. `current` PDF link and existing cover image render conditionally. `data-slide-close`, `data-save-form`, dirtyGuard attributes retained. No body/category/status/pin fields exist in Buku form; not removed to fit drawing.
- Source audit establishes current fields present, not historical semantic parity or successful persistence/upload. Ordinary PNG review cannot establish field POST authorization or storage writes.

## Additional states outside 18 light references

- Log asserts at 1440 forms 720/336, 1360 forms 640/336, 1024/390/320 single-column (measured main widths 712/358/288); no horizontal overflow. These are runner checks, not 18-reference pixel comparisons.
- Validation failed-edit mobile cases preserve rejected title, and content status/pin/attachment keep choice; error summary links scroll/focus body to top 80px under 64px header, Buku year to top 388px. These checks do not certify every keyboard interaction.
- All three 1440 dark edit images visually opened: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-news-1440-dark-edit.png`, `task-5-pengumuman-1440-dark-edit.png`, `task-5-books-1440-dark-edit.png` in same folder. **Adapted:** dark canvas/panels, light text, bright green actions, green sidebar, borders/labels remain discernible. No matching dark reference PNG, no numerical contrast claim. Deliberately long escaped script-like title/attachment is fixture stress text, not executed script. Long attachment wraps within main panel. Content dark full-page screenshot shows sticky footer over lower upload area in captured scroll position; not proof last field is inaccessible, but full scroll/focus clearance not visually established here.
- Books desktop slide image visually opened: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-books-1440-slide.png`; route list with clicked `/admin/books/new` add link intercepted to partial dialog. **Adapted:** right native slide-over, dark theme inherited, stacked fields, one panel heading, sticky Batal/Simpan. Runner measures 559px main; no nested duplicate H1. Reference full-page Buku image is not a pixel oracle for slide-over. Screenshot appears x≈906 to right viewport edge (about 534 visible px); report measurement is inner main, not proof exact 560px outer geometry. Close icon and right edge are tight; inspect separately if exact drawer width/placement is acceptance criterion.
- Mobile slide `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-5-books-390-slide.png` visually opened in extras composition: fullscreen dark form, title/PDF/year/cover then sticky actions; full-page screenshot also captures dimmed underlying list below viewport, not extra form fields. Runner tests dirty Escape opens discard confirmation and Buang perubahan closes, but no separate dirty-dialog screenshot.
- Runner verifies no-JS new content textarea/full-page form fallback and Buku add navigation to `/admin/books/new`. These are functional assertions, not claims of production DB access.
- No undo support fabricated. No runtime post-success toast captured; cannot mark toast visual state compared. Search menu modal itself not opened by this runner; only corrected topbar trigger copy visually compared. No extra code or test changes made to fill evidence gaps.

## Handoff

18/18 reference and corresponding 1440 runtime images visually reviewed. Log rerun passes its own assertions, but visible layout diffs remain, especially Buku full-page and content panel/action grouping. Single-delete shots do not substitute for reference bulk-confirmation state; invalid-PDF and post-bulk-toast visuals remain unverified. Report distinguishes expected adaptations from unresolved diffs; no application edits in Step 2.

## Addendum Step 2 — bukti state yang sebelumnya belum lengkap

Tanggal 2026-11-17. Bagian awal tetap history run pertama, bukan status akhir kekurangan bukti. Tidak mengubah app, helper fixture, field, validator, atau kontrak server. Runner tambahan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9-step2-extra.cjs`. Log run sukses: `.superpowers/sdd/TODO/task-9-step2-publication-extra.log` (12 baris), exit 0. Percobaan pertama berhenti di assertion kategori karena selector menghitung option filter juga (4 vs 3); selector temp diperketat ke `td`, lalu run ulang sukses. Tidak mengubah aplikasi untuk melewati check.

Runner menggunakan fixture existing dan Chromium 1440×1000. Data kategori di dokumen temp diberikan sebagai objek `{ _id, nama: 'Perkuliahan', ... }`, bukan ID mentah. Fake aggregate tidak melakukan populate otomatis; objek ini hanya memperbaiki representasi fixture. Ketiga sel kategori pada setiap modul dicek berisi Perkuliahan. Semua gambar baru berikut dibuka dan dibaca langsung, ukuran penuh 1440×1000. Data tetap fiktif, bukan DB nyata.

### A1 — Berita bulk confirmation — state mismatch DITUTUP; diff visual tersisa

- Referensi: `docs/update/v.0.1.0/preview/Berita _ Konfirmasi hapus.png`.
- Runtime tambahan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-publication-news-1440-bulk-delete.png`.
- Route/state: `GET /admin/news`; tiga checkbox baris dicentang satu per satu, bulk Hapus dibuka. Heading tepat `Hapus 3 berita?`, band `3 berita dipilih`, semua baris terpilih dan checkbox header checked terlihat. Bukan lagi single-delete history frame 03.
- **Conforms pattern:** dialog putih lebar 480px, heading serif, garis atas merah, konsekuensi penghapusan permanen, Batal/Hapus. Fokus awal Batal terverifikasi. Batal menutup; buka ulang lalu Escape menutup; jumlah dokumen tetap 3. Tidak pernah submit delete.
- **Adapted/diff:** modal di tengah vertikal, bukan posisi tinggi referensi. Tombol konfirmasi `Hapus`, bukan `Hapus 3 berita`; konsekuensi generik tidak menyebut lampiran seperti referensi. Band mengganti filter row sesuai DESIGN. Tidak ada disclosure baris terbuka di belakang modal baru. Label kategori sekarang ada tetapi terpotong baris di tengah kata menjadi `Perkuliah` / `an`; ini diff lebar kolom nyata pada fixture berlabel, bukan lagi dot kosong. Wrap tanggal/header masih ada.

### A2 — Pengumuman bulk confirmation — state mismatch DITUTUP; diff visual tersisa

- Referensi: `docs/update/v.0.1.0/preview/Pengumuman _ Konfirmasi hapus.png`.
- Runtime tambahan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-publication-pengumuman-1440-bulk-delete.png`.
- Route/state: `GET /admin/pengumuman`; tiga checkbox dicentang, bulk Hapus dibuka. Heading `Hapus 3 pengumuman?` dan band hitungan 3 sesuai state referensi, menggantikan keterbatasan history frame 14.
- **Conforms pattern:** dialog/garis danger/aksi destruktif, highlight tiga baris. Fokus awal Batal, close lewat Batal dan Escape diuji; ketiga dokumen tetap ada, delete tidak dikirim.
- **Adapted/diff:** posisi tengah vertikal dan label tombol generik Hapus; konsekuensi generik tidak menyebut lampiran. Filter row diganti band, bukan tetap di atasnya. Kategori Perkuliahan kini terlihat, tetapi wrap tengah kata; wrap tanggal tetap. State mismatch selesai, bukan klaim pixel-identical.

### A3 — Berita bulk publish / toast sukses — kekurangan bukti toast DITUTUP

- Referensi: `docs/update/v.0.1.0/preview/Berita _ Pilih massal.png`, khusus toast `3 berita diterbitkan`.
- Runtime tambahan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-publication-news-1440-bulk-publish-toast.png`.
- Route/state: setelah menutup dialog tanpa delete, klik Terbitkan pada bulk form tiga baris; `POST /admin/news/bulk` merespons HTTP 303 ke `/admin/news?success=3+berita+diterbitkan`. Ketiga dokumen fixture berubah dari draft ke published; bukan query success yang ditambahkan manual.
- **Conforms pattern:** toast ink bawah kanan, teks terang `3 berita diterbitkan`, ikon sukses dan tombol tutup. Ketiga status tabel Terbit terlihat. Toast dipastikan visible lalu di-hover untuk pause timer sebelum capture; hanya satu tombol (tutup), tanpa Urungkan/Undo.
- **Adapted:** referensi masih menunjukkan selection band dan baris terpilih bersama toast; redirect aplikasi membersihkan selection dan menampilkan filter lagi. Ini state pasca-POST nyata, bukan replika komposit referensi. Tidak ada undo palsu sesuai DESIGN. Posisi toast fixed kanan bawah viewport, bukan menempel footer tabel. Kategori berlabel kini terbukti; wrap tengah kata tetap diff.

### A4 — Pengumuman bulk publish / toast sukses — kekurangan bukti toast DITUTUP

- Referensi: `docs/update/v.0.1.0/preview/Pengumuman _ Pilih massal.png`, khusus toast `3 pengumuman diterbitkan`.
- Runtime tambahan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-publication-pengumuman-1440-bulk-publish-toast.png`.
- Route/state: `POST /admin/pengumuman/bulk`, tiga selected, action publish; HTTP 303 ke `/admin/pengumuman?success=3+pengumuman+diterbitkan`. Ketiga dokumen fixture terbukti published; toast aktif di-hover sebelum capture.
- **Conforms pattern/adapted:** toast ink, pesan tepat, ikon dan tutup tanpa undo. Seleksi hilang setelah redirect, tidak seperti komposisi referensi. Label Perkuliahan tampil ketiga baris tetapi wrap; tanggal/header masih wrap. History frame 15 tetap bukti pre-submit, gambar tambahan bukti sukses pasca-submit.

### A5 — Berita invalid attachment + title/body invalid — early rejection TERBUKTI; summary tiga error TIDAK TERCAPAI

- Referensi: `docs/update/v.0.1.0/preview/Berita _ Tambah — gagal validasi.png`.
- Runtime tambahan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-publication-news-1440-invalid-upload.png`.
- Respons tersimpan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-publication-news-invalid-upload-response.html`.
- Route/state: dari `GET /admin/news/new`, POST multipart `/admin/news`, title `abc`, body kosong, file `jadwal-uts.docx`, MIME DOCX, isi `not a PDF`; browser constraint validation dinonaktifkan hanya di runner agar sampai middleware.
- HTTP 400, Content-Type `text/html; charset=utf-8`; `Lampiran harus berupa PDF.` dari `routes/newsRoutes.js:21`. Jumlah EJS error summary 0, dokumen tetap 3. Multer fileFilter menolak sebelum controller memvalidasi title/body. Dengan jalur existing ini, referensi summary tiga error sekaligus belum dapat diproduksi; bukan berarti validator body/title lulus.
- **Diff/evidence limit:** gambar putih berisi stack error fixture, bukan form/summary EJS. Stack berasal dari terminal error handler helper fixture (`test/helpers/adminContentFixture.js:133` mengirim `err.stack`), BUKAN bukti production membocorkan stack. `server.js:343–377` memakai central error handler berbeda: tidak mengirim stack, POST admin dengan same-origin referer valid diarahkan HTTP 303 kembali dengan query error, selain itu landing/error. Perilaku server bootstrap itu hanya dibaca sumber, tidak dieksekusi runner ini. Jangan menjadikan gambar fixture sebagai screenshot error produksi.

### A6 — Pengumuman invalid attachment + title/body invalid — early rejection TERBUKTI; summary tiga error TIDAK TERCAPAI

- Referensi: `docs/update/v.0.1.0/preview/Pengumuman _ Tambah — gagal validasi.png`.
- Runtime tambahan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-publication-pengumuman-1440-invalid-upload.png`.
- Respons tersimpan: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-publication-pengumuman-invalid-upload-response.html`.
- Route/state: dari `/admin/pengumuman/new`, POST multipart `/admin/pengumuman` dengan title `abc`, body kosong, DOCX menyamar sebagai lampiran yang semestinya PDF. HTTP 400 `Lampiran harus berupa PDF.` melalui `routes/pengumumanRoutes.js:21`; EJS summary 0, dokumen tetap 3.
- **Diff/evidence limit:** halaman stack putih hanya error handler fixture; batas central handler server sama seperti A5. Invalid upload sekarang diuji dan dicapture, tetapi referensi summary tiga error TIDAK cocok karena early-reject sebelum controller. History frame 16 tetap bukti EJS title/body dua error. Tidak mengubah field/validator demi meniru referensi.

### Status akhir addendum

- Bulk-delete single-vs-bulk mismatch frame 03/14: **ditutup** oleh A1/A2; count 3, Batal/Escape diuji tanpa delete.
- Post-bulk success toast frame 04/15: **ditutup** oleh A3/A4 melalui POST fixture nyata; tidak ada undo. Selection retention berbeda setelah redirect dan tetap dicatat sebagai adapted.
- Dot kategori kosong: **ditutup sebagai keterbatasan representasi fixture** pada gambar tambahan; label kini ada. Diff wrap kategori baru terlihat dan tetap terbuka; bukan perbaikan layout.
- Invalid-PDF missing evidence: **ditutup untuk jalur penolakan multipart** A5/A6. **Belum cocok** dengan reference EJS summary tiga error; production central-error redirect tidak dirender oleh helper fixture. Tidak memaksakan hasil gabungan yang kontrak server existing tidak hasilkan.
- Seluruh diff layout/form dari run awal tetap berlaku. Tidak ada polish/perubahan app, DB nyata, delete nyata, atau klaim pixel-identical. Enam PNG tambahan dibaca visual, dua respons HTML disimpan, log run tambahan sukses.


## Salinan bukti portabel

- [task-9-step2-publication-news-1440-bulk-delete.png](../../screenshots/task-9-step2-publication-news-1440-bulk-delete.png)
- [task-9-step2-publication-news-1440-bulk-publish-toast.png](../../screenshots/task-9-step2-publication-news-1440-bulk-publish-toast.png)
- [task-9-step2-publication-news-1440-invalid-upload.png](../../screenshots/task-9-step2-publication-news-1440-invalid-upload.png)
- [task-9-step2-publication-pengumuman-1440-bulk-delete.png](../../screenshots/task-9-step2-publication-pengumuman-1440-bulk-delete.png)
- [task-9-step2-publication-pengumuman-1440-bulk-publish-toast.png](../../screenshots/task-9-step2-publication-pengumuman-1440-bulk-publish-toast.png)
- [task-9-step2-publication-pengumuman-1440-invalid-upload.png](../../screenshots/task-9-step2-publication-pengumuman-1440-invalid-upload.png)
