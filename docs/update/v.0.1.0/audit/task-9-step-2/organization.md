# Task 9 — Step 2: organization visual comparison

Date: 2026-11-17. Scope: organization only; no application code changes.

## Method and limits

- Read `docs/update/v.0.1.0/DESIGN.md` (organization field-retention rule, shell, components, official Inter substitution).
- Fresh command: `node C:/Users/unjani2/AppData/Local/Temp/opencode/t9-re7.cjs > .superpowers/sdd/TODO/task-9-step2-organization.log 2>&1`; exit 0.
- Chromium/Playwright fixture server, superadmin, viewport 1440×1000, full-page screenshots. Ephemeral localhost ports; exact route paths below remain stable. Fixture data, not production DB.
- Read all 17 reference/runtime pairs visually using PIL side-by-side sheets at `C:/Users/unjani2/AppData/Local/Temp/opencode/t9pairs/<original reference filename>`. Both complete images included, scaled to 720px each without crop. No image generation.
- Status: **pattern** means shared design vocabulary only; **adapted** means recognizable structure with explicit runtime adaptations; **diff** means material reference differences remain. No pixel-perfect claim. All 17 share pattern; final classification: 3 adapted, 14 diff.
- Log also covers narrower widths, long text, dark, slide-over, no-JS and invalid CSV checks. Those assertions are not visual equivalence, successful upload/save, keyboard audit, real persistence, or DB-integrity proof.

## Shared observations (apply to every frame)

Green 264px sidebar, ivory canvas, serif headings, white bordered panels, primary green actions and mono table headers recognize design pattern. Inter is documented replacement for Swis721, not defect. Runtime brand/account use `Admin Akademik` / `Admin Uji`, versus reference `Bidang Akademik` / named account. Runtime navigation spacing is taller: lower groups fall below 1000px viewport; Kategori active item is clipped near bottom behind sidebar footer in captured initial scroll. Sidebar scrolling is separate. Follow-up viewport check below confirms Kategori fully visible and focusable after sidebar scroll; initial clipping is not runtime obstruction. Search copy `Cari menu...` is intentional adaptation. Breadcrumb copy and title casing differ. Fixture one-row lists versus reference many rows are data adaptations; pagination appearance cannot be compared with this dataset. Runtime list name column consumes most width, crowding other columns and placing Ubah/ellipsis vertically rather than reference inline. Full-page capture does not extend fixed sidebar.

Forms generally omit reference back link, begin panels higher, use stacked full-width fields and wider panels, `(wajib)` labels instead of red asterisks, native upload/select controls and white sticky action bars. These are not exact reference reproduction. Sticky action bar crosses content in full-page captures (profile/staff/unit edit), but follow-up scrolled viewport screenshots confirm final controls remain visible, focusable and unobstructed above bar. Classify apparent crossing as full-page fixed-capture artifact, not demonstrated runtime defect. Edit forms lack reference inline Hapus action; list actions are separate, not verified here as substitute.

## Per-frame evidence

### 1. Profil Bidang — Ubah — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Profil Bidang _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-profil-akademik-1440-edit.png`
- Route/state: `GET /admin/profil-akademik`, populated profile edit.
- Same four groups: Ringkasan, Visi dan misi, Tugas dan fungsi, Kontak layanan. Runtime panel wider; contact email/phone stacked instead of paired. Misi/fungsi newline textareas replace numbered repeatable rows with Tambah/Hapus controls. Runtime lacks Lihat halaman action and reference intro; shows last-updated metadata. Full-page capture places fixed save bar across Misi; scrolled viewport confirms final Jam Layanan field unobstructed above bar (capture artifact, not runtime overlap defect). Character help and required wording add height. Fixture text differs.

### 2. Pimpinan & Staf — Daftar — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Pimpinan & Staf _ Daftar.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-staff-1440-list.png`
- Route/state: `GET /admin/staff`, one populated row.
- Runtime tingkat select + Terapkan replaces Semua/Pimpinan/Staf count tabs. No avatar/initial or NIP secondary metadata in name cell. Jabatan column narrow and wraps. Count beside H1, longer Tambah Pimpinan & Staf label; search aligned right. One row versus seven reference rows is fixture difference; pagination not exercised.

### 3. Pimpinan & Staf — Tambah — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Pimpinan & Staf _ Tambah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-staff-1440-new.png`
- Route/state: `GET /admin/staff/new`, empty create form.
- Same Identitas/Jabatan/Foto order. Identity paired fields become stacked; Tingkat native select defaults Anggota instead of two-option Pimpinan/Staf segment. Urutan remains in source but action bar crosses its area in screenshot. Native JPG/PNG 5MB chooser replaces reference JPG/PNG/WEBP 4MB ratio-3:4 drop-style panel; do not imply unimplemented drag support. Longer form, action bar before photo rather than below final panel.

### 4. Pimpinan & Staf — Ubah — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Pimpinan & Staf _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-staff-1440-edit.png`
- Route/state: `GET /admin/staff/000000000000000000000001/edit`, populated edit.
- Same stacked/segment/upload/action-bar differences as create. Current photo represented by current-file link plus standalone fixture thumbnail, not compact filename/size card with Lihat/Ganti file. Blank gelar/NIP/email are fixture values, not removed controls. No inline Hapus staf; save label Simpan rather than Simpan perubahan.

### 5. Unit — Daftar — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Unit _ Daftar.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-unit-1440-list.png`
- Route/state: `GET /admin/unit`, one populated row.
- Same name/description/updated column concepts. Runtime omits reference image and URL subline in name cell, moves search right. Description/date squeezed into narrow wrapping columns; action links stacked. Fixture row/count differ from reference five rows.

### 6. Unit — Tambah — adapted (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Unit _ Tambah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-unit-1440-new.png`
- Route/state: `GET /admin/unit/new`, empty create.
- Data unit then image then actions retained. Wider panel, earlier start, no back link. Description help says Opsional rather than reference 160-character hint. Native upload instead of drag-style presentation; Gambar unit heading and white action strip differ. Same basic field order; no exact geometry claim.

### 7. Unit — Ubah — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Unit _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-unit-1440-edit.png`
- Route/state: `GET /admin/unit/000000000000000000000001/edit`, populated edit.
- Same data groups. Current-file link plus separate fixture thumbnail replace compact image/filename card; apparent bar/thumbnail intersection in full-page capture is absent in scrolled viewport, where chooser and complete preview sit above bar. No inline Hapus unit, no Ganti file card action; Simpan instead of Simpan perubahan. Fixture URL/image/text differ, not production substitutions.

### 8. Fakultas — Daftar — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Fakultas _ Daftar.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-faculties-1440-list.png`
- Route/state: `GET /admin/faculties`, one populated row.
- Runtime lacks Program Studi count column. Singkatan header wraps awkwardly; search right and stacked action cell versus left search/inline reference actions. One fixture faculty versus eight reference faculties.

### 9. Fakultas — Gagal hapus — diff, missing relationship panel
- Reference: `docs/update/v.0.1.0/preview/Fakultas _ Gagal hapus.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-faculties-1440-delete-error.png`
- Route/state: `POST /admin/faculties/bulk` with `action=delete`, `ids=000000000000000000000001`; follow 303 Location error redirect to `GET /admin/faculties?...`.
- Reference dims page and shows centered `Fakultas Teknik masih dipakai` relationship panel, linked-prodi count, Lihat program studi and Mengerti. Runtime shows ordinary list plus bottom-right dark `1 fakultas gagal dihapus` alert toast; no backdrop, relationship panel, count or link.
- **Faculty relationship guard is missing. Script mocks `Faculty.deleteOne` to throw `Fakultas masih dipakai program studi.`. This proves only injected failure handling: 303 error redirect, no success parameter, fixture document retained, visible alert. It does NOT prove relationship-aware deletion protection or real DB integrity.** Expected injected stack trace in log is not failed run.

### 10. Fakultas — Tambah — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Fakultas _ Tambah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-faculties-1440-new.png`
- Route/state: `GET /admin/faculties/new`, empty create.
- Reference narrow panel and paired Singkatan/Urutan; runtime wider panel and stacked Nama/Singkatan only. Urutan absent at runtime: existing Faculty schema has no urutan; generic form renders it only when hasUrutan is true. Record design gap, not claim field removed by this review. White action strip, no back link.

### 11. Fakultas — Ubah — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Fakultas _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-faculties-1440-edit.png`
- Route/state: `GET /admin/faculties/000000000000000000000001/edit`, populated edit.
- Same width/stacked/absent Urutan gap as create. No inline Hapus fakultas; Simpan instead of Simpan perubahan. Fixture Nama/Singkatan differ.

### 12. Program Studi — Daftar — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Program Studi _ Daftar.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-program-studi-1440-list.png`
- Route/state: `GET /admin/program-studi`, one populated row, CSV disclosure closed.
- Same name/abbreviation/faculty concepts. Filter left + Terapkan and search right reverse reference arrangement. Singkatan wraps. CSV import present but collapsed into disclosure versus expanded reference upload/template/action panel. One row instead of eight; no pagination comparison. Additional fresh invalid CSV state exists in log/shots, not one of 17 reference pairs.

### 13. Program Studi — Tambah — adapted (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Program Studi _ Tambah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-program-studi-1440-new.png`
- Route/state: `GET /admin/program-studi/new`, empty create.
- Nama/Singkatan/Fakultas retained in same order. Wider panel and all stacked instead of paired Singkatan/Fakultas. No back link; native select, white action strip/check icon and casing differ.

### 14. Program Studi — Ubah — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Program Studi _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-program-studi-1440-edit.png`
- Route/state: `GET /admin/program-studi/000000000000000000000001/edit`, populated faculty selection.
- Same stack/width differences as create. No inline Hapus program studi; Simpan rather than Simpan perubahan. Fixture faculty resolves to Fakultas Uji rather than reference real example.

### 15. Kategori — Daftar — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Kategori _ Daftar.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-kategori-1440-list.png`
- Route/state: `GET /admin/kategori`, default Pengumuman tab, one row.
- Jenis select becomes Pengumuman/Dokumen Akademik/Berita tabs; status select, Terapkan, Hapus filter and right search alter filter composition. No Jenis table column because current type is tab-scoped. Urutan before Status instead of after; active dot/text retained. Kategori sidebar active item clipped at footer; one fixture row, no inactive example/pagination visual coverage.

### 16. Kategori — Tambah — adapted (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Kategori _ Tambah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-kategori-1440-new.png`
- Route/state: `GET /admin/kategori/new`, empty create, Pengumuman selected, active checked.
- Same Jenis/Nama/Urutan/Aktif order and single group. Native select replaces segment; wider panel, no back link, extra help, default order 0 versus reference 1, white save strip/check icon. Sidebar clipping as shared observation.

### 17. Kategori — Ubah — diff (pattern present)
- Reference: `docs/update/v.0.1.0/preview/Kategori _ Ubah.png`
- Runtime: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-7-kategori-1440-edit.png`
- Route/state: `GET /admin/kategori/000000000000000000000001/edit`, populated active category.
- Same select/width/help/action-strip differences as create. No inline Hapus kategori; Simpan instead of Simpan perubahan. Fixture name/order differ. Sidebar active item clipped.

## Source field retention check

Read current form templates, not screenshots alone. This review changes no source and makes no historical before/after retention claim.

| Source | Existing named fields retained in template |
|---|---|
| `views/admin/profil-akademik/edit.ejs:7-26` | `judulHalaman`, `ringkasan`, `visi`, `misi`, `tugas`, `fungsi`, `kontakEmail`, `kontakTelepon`, `alamatLayanan`, `jamLayanan`. Newline textareas retain collection input contracts, not reference repeatable-row UX. |
| `views/admin/staff/form.ejs:7-29` | `nama`, `gelar`, `nip`, `email`, `jabatan`, `tingkat`, `nomorUrut`, `foto`; current-photo link and preview retained. `nomorUrut` exists despite sticky-bar interference in shot. `models/Staff.js` confirms these business fields; audit/timestamp fields are not form inputs. |
| `views/admin/unit/form.ejs:7-17` | `nama`, `deskripsi`, `link`, `img`; current image link/preview retained. |
| `views/admin/faculties/form.ejs:7-10` | `nama`, `singkatan`; conditional `urutan` exists but disabled by configuration. `models/Faculty.js:5-8` contains only nama/singkatan and audit fields, no urutan. `controllers/masterDataController.js` defaults `hasUrutan=false`. PNG Urutan is an unmet design field, not existing Faculty field preservation proof. |
| `views/admin/program-studi/form.ejs:7-9` | `nama`, `singkatan`, `fakultas`; faculty object/ID normalization preserved. CSV UI remains on list; closed initially, not deleted. |
| `views/admin/kategori/form.ejs:9-12` | `jenis`, `nama`, `urutan`, `isActive`; native select/check input semantics retained. |

## Outcome

17/17 reference/runtime pairs inspected. Pattern recognized throughout, no pixel-equivalence acceptance. Material gaps remain: faculty relationship panel/guard, faculty prodi count and Urutan design gap, stacked/wider forms, omitted edit delete/back controls, simplified list metadata and collapsed CSV panel. Follow-up viewport checks exclude apparent sticky overlap and initial sidebar clipping from demonstrated runtime defects. Evidence limited to fixture browser rendering and stated assertions. No production DB, relationship integrity, successful upload/save, or deployment claims.

## Follow-up: scrolled viewport clarification

Requested narrow recheck only; no application code changes. Fresh runner `C:/Users/unjani2/AppData/Local/Temp/opencode/t9-org-viewport.cjs` exited 0. Same fixture content and 1440×1000 viewport. Screenshots use `fullPage:false`; all four read visually. Log: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-org-viewport.log`.

For profile/staff/unit edit, scroll final named input into view and focus it. Assert input entirely above action bar and below topbar, focused, with successful center-point hit test. No upload submission or persistence tested.

| Route/state | Exact viewport screenshot path | Observed geometry / result |
|---|---|---|
| `/admin/profil-akademik`, edit, scrolled to `jamLayanan` | `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-org-profil-akademik-viewport.png` | Input y=814–854; action bar y=903–968; scrollY=1111. Final field visible/focused/unobstructed. |
| `/admin/staff/000000000000000000000001/edit`, scrolled to `foto` | `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-org-staff-viewport.png` | Input y=559–609; bar y=903–968; scrollY=615. Native chooser and full current-photo preview visible above bar; focused and hit-test passes. |
| `/admin/unit/000000000000000000000001/edit`, scrolled to `img` | `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-org-unit-viewport.png` | Input y=559–609; bar y=903–968; scrollY=183. Native chooser and full image preview visible above bar; focused and hit-test passes. |
| `/admin/kategori`, sidebar nav scrolled to bottom | `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/task-9-step2-org-kategori-viewport.png` | Kategori link y=785–817 within nav y=64–943, above footer. Fully visible/focused; center hit-test passes. |

Correction takes precedence over initial full-page descriptions: apparent sticky-bar crossings are capture artifacts, not established runtime defects. Initial sidebar clipping reflects scroll position, not inaccessible Kategori or footer overlap after scroll. Per-frame comments about initial/full-page placement remain historical screenshot observations only; they must not be read as defect claims. Existing 3 adapted / 14 diff classification remains based on other recorded reference deviations, not these artifacts. No extra audit performed.

## Salinan bukti portabel

- [task-9-step2-org-kategori-viewport.png](../../screenshots/task-9-step2-org-kategori-viewport.png)
- [task-9-step2-org-profil-akademik-viewport.png](../../screenshots/task-9-step2-org-profil-akademik-viewport.png)
- [task-9-step2-org-staff-viewport.png](../../screenshots/task-9-step2-org-staff-viewport.png)
- [task-9-step2-org-unit-viewport.png](../../screenshots/task-9-step2-org-unit-viewport.png)
