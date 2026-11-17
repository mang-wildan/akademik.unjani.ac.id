# Task 9 — Step 2: dashboard, system, profile visual comparison

Date: 2026-11-17. Scope: visual review only; no application code changes.

## Method and evidence

- Read `docs/update/v.0.1.0/DESIGN.md` in full. Also read relevant opening sections of `docs/DESIGN.md`; older neutral/Plus Jakarta Sans guidance conflicts with redesign. Version-specific DESIGN governs this review.
- Ran supplied `C:/Users/unjani2/AppData/Local/Temp/opencode/t9-re4.cjs` against current workspace. Exit 0; output: `.superpowers/sdd/TODO/task-9-step2-dash.log`.
- Ran supplied `C:/Users/unjani2/AppData/Local/Temp/opencode/t9-re8.cjs` against current workspace. Exit 0; output: `.superpowers/sdd/TODO/task-9-step2-sys.log`, ending `OK`.
- Individually opened and visually read all 10 reference PNGs and all 10 corresponding fresh runtime PNGs listed below. Reference directory: `docs/update/v.0.1.0/preview/`. Runtime directory: `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/`.
- Chromium headless, viewport 1440 × 1000, full-page screenshots. Full-page image heights differ from reference artboards; compare layout and hierarchy, not image-height equality.
- Dashboard script renders actual EJS shell/view with explicit fictional locals. System/profile script uses actual routes/views plus in-memory mocked models via `test/helpers/adminContentFixture.js`. Names, emails, counts and dates are fixtures, not real DB evidence. No production DB, session revocation, upload persistence or complete authorization claim follows from these screenshots.
- Both scripts also check other widths. Their logs show no horizontal overflow in checked cases; this report's visual comparison covers 1440 only. Dashboard log reports loaded Inter, Crimson Text and Ubuntu Mono. Screenshot review does not establish exact computed metrics on every system page, keyboard correctness or contrast compliance.

## Shared shell and typography

Ivory canvas, green 264px sidebar, approximately 64px topbar, serif page headings, white bordered panels and green primary buttons follow redesign direction. Dashboard measurements explicitly confirm content x=312, width=1080, right=1392; lower grid widths 660/396 and gap 24.

Runtime branding is `Admin Akademik`, without reference `Bidang Akademik` / `PANEL ADMIN` subtitle. Topbar uses `Cari menu...`, generic account icon rather than initials, different breadcrumb separators and white surface. These are visible differences; `Cari menu` is documented adaptation. Runtime navigation is taller/spaced differently, has bottom `Ciutkan` control, and lower groups fall below visible sidebar area. Dashboard/profile editor fixture also lacks Super Admin-only groups by role; do not treat those as removed routes. System screenshot sidebar does not display active system item in visible area; scrolling/navigation visibility was not separately exercised here.

Inter replaces reference Swis721 BT by explicit DESIGN §3 allowance, not font-loading defect. Crimson Text replaces reference Crimson. Stronger input borders and `(wajib)` labels differ from pale reference fields/asterisks while preserving readable control boundaries.

## 1. Dasbor _ Desktop 1440.png

Runtime: `task4-1440-light.png`.

- Preserved: four-column green statistics band, separators, list links; attention/drafts left; quick actions/activity right; aligned outer edges and 24px block gaps.
- Measured runtime band y=164, attention/quick y=348. Reference band starts around y=226 and lower grid around y=398. Runtime omits reference date eyebrow and supporting `Tiga hal... pukul 08.14` sentence; greeting becomes `Selamat datang, Admin Uji`. This removes fictional live-clock/latest-publication claims rather than copying mock clock.
- All counts/content here are fictional fixtures: 24/12/86/2 versus reference 51/36/64/4. Screenshot does not prove DB-driven dashboard. Fixture dates are explicit 16 Nov 2026, not a live clock.
- Reference fourth statistic is gold; runtime number/link are white. Runtime band is taller and dividers reach panel edges vertically rather than short inset dividers.
- Attention messages/actions differ with fixtures and current issue model. Runtime uses gold left rules for all three rows; reference uses red/gold/gray. Buttons are compact content-width instead of reference aligned wider action column.
- Drafts: three rows rather than four, no reference `Lihat semua draf` top-right link. Activity: four entries rather than five, stacked dates below metadata rather than right-aligned time/date column; no continuous timeline line. These are visible deviations, not evidence of data loss.
- No clipped panel text observed. Overall composition follows reference but vertical rhythm and information presentation are not equivalent.

## 2. Akun Pengguna _ Daftar.png

Runtime: `task-8-users-1440-list.png`.

- Preserved: serif heading, add-account action, white list panel, filters/search, selection boxes, role/status/last-login information, `Ubah` and overflow actions, footer result count.
- Runtime calls module `Akun Admin` and includes count `3`; reference `Akun Pengguna`. Runtime uses role/status native selects plus `Terapkan`, not `Semua/Aktif/Nonaktif` counted tabs. Adds explanation that current account is skipped by bulk actions.
- Three fictional rows versus seven pictured rows from nine accounts. No page numbers are rendered for this one-page fixture; not evidence pagination was removed.
- Material visual issue: name column takes most table width while separate email column is very narrow. Emails break into multiple short fragments; `Super Admin`, dates and `Belum pernah` wrap. `MASUK TERAKHIR` header even leaves final `R` alone. Runtime rows roughly 97px versus reference roughly 68px. No horizontal overflow does not mean table proportions are acceptable.
- Reference combines avatar/name/email in one identity cell; runtime has no row avatars and separates email. Actions stack vertically rather than compact inline row. Header sunken fill is stronger than reference.
- Needs table-column/proportion review in later implementation; no fix made in Step 2.

## 3. Akun Pengguna _ Tambah.png

Runtime: `task-8-users-1440-new.png`.

- Preserved required fields: name, email, role, initial password; Batal/save actions. No form field from reference missing.
- Runtime form width is 880px (x312–1192), reference approximately 640px (x312–952). No top back link. Heading and first panel start higher.
- Reference three panels `Identitas`, `Peran`, `Password awal`; runtime two panels `Identitas`, `Akses`, combining role/password. Reference role explanation and email login hint absent; blank inputs have no pictured placeholders.
- Role is native select, not segmented Editor/Super Admin buttons. This is explicit adaptation retaining same two role values, checked in source.
- No `Tampilkan` password toggle. Current helper renders password input without reveal control; not claimed implemented.
- Reference says minimum 12 characters with letters/numbers; runtime says minimum 8. `validators/index.js:236` confirms actual shared validator min 8 / max 128. Existing server rule retained, not silently upgraded to mock policy.
- Runtime action `Simpan` rather than `Buat akun`; actions sit on white footer strip. Visual hierarchy only partially matches reference.

## 4. Akun Pengguna _ Ubah.png

Runtime: `task-8-users-1440-edit.png`.

- Name/email/role remain populated from fixture. Same wider 880px form, missing top back link, native role select and two-panel grouping as create.
- Reference `Keamanan` panel with status, last-login/created dates and direct reset/deactivate buttons is not reproduced. Runtime has editable `isActive` checkbox plus text directing reset through account action menu. That checkbox is an existing editable field not shown in reference; retained rather than removed for visual matching.
- Reset/deactivate affordances exist through list actions, not inline in edit frame. Screenshot pair alone does not prove every edit security rule.
- Runtime helper text and `Simpan` copy differ from reference `Simpan perubahan`. No initial-password field on edit, correctly distinct from creation/reset route.

## 5. Akun Pengguna _ Konfirmasi nonaktif.png

Runtime: `task-8-users-1440-confirm-deactivate.png`.

- Preserved: darkened backdrop, white confirmation dialog, named target, login consequence/content-retention text, Batal and red destructive action.
- Runtime dialog approximately x480–960 (480px width), centered vertically near y398–603. Reference uses same approximate width but much higher y220–456. Runtime includes red top rule per DESIGN confirm-dialog contract.
- Runtime title/action use fixture `Editor Sekali Pakai` / `Nonaktifkan`; reference Budi / `Nonaktifkan akun`. Runtime message explains reactivation via Ubah.
- Overflow menu remains visibly open behind modal on right; reference background menu is closed. Flag as visual cleanup deviation, not evidence modal keyboard behavior is broken.
- Supplied script opened native dialog, submitted deactivation and asserted mocked target inactive/current account still active. This is fixture behavior only, not real DB persistence proof.

## 6. Akun Pengguna _ Atur ulang password.png

Runtime: `task-8-users-1440-reset.png`.

- Preserved: target name/email context, new password, confirmation, Batal/reset action and dedicated route.
- Runtime form 880px versus reference 640px; starts higher, context and buttons inside white panel rather than context above/buttons below. No top back link or show-password controls.
- Runtime explains old password becomes invalid and status unchanged; reference promises active sessions log out. Do not infer session revocation from either screenshot or fixture reset.
- Runtime retains actual min-8 rule, not reference min-12 letters/numbers wording. Both password fields remain password controls; no reveal toggle.
- Supplied script also submits mismatch then matching values, checks secret cleared on validation failure and mocked password changed. No real hash/storage assertion is warranted from fake model.

## 7. Pengaturan Situs _ Ubah.png

Runtime: `task-8-settings-1440-edit.png`.

- Core contact, footer description, video URL, six social links, favicon and organization-image uploads retained. Runtime groups most controls into one 880px panel; reference has separate contact/beranda/social/footer-links/image panels and right `Isi pengaturan` save summary. Runtime lacks right summary/save column.
- Contact layout differs: runtime address/service-hours share row; reference each spans width. Runtime image uploads share row; reference current-file cards stack vertically. Fixture has no current images, so absence of preview/file cards is expected for this dataset, not proof current-file branch missing.
- Runtime footer quick-links panel appears after image panel; reference before images. Existing links render read-only label/URL/target with Hapus, plus collapsed `Tambah tautan cepat` disclosure. No inline link editor, unlike reference. Source confirms add form retains `label`, `url`, `target` (`_self` / `_blank`); opening disclosure was not part of this visual pair.
- Favicon reference shows ICO; runtime explicitly accepts JPG/PNG/WEBP with 5MB help. This reflects actual upload contract, not mock ICO promise.
- Significant capture deviation: full-page runtime image has blank upper-left shell area and topbar/sidebar begin around y629, crossing form/video region. Video field label/control is obscured by horizontal shell strip in this capture. Reference shell stays at top and does not overlap controls. Treat this screenshot as failed visual parity and ambiguous fixed-position/full-page capture evidence; root cause not diagnosed, no assertion that ordinary viewport always overlaps. Source confirms video field remains present.
- Fictional `akademik@example.org` / `Jl. Uji` are script-only fixtures. No claim actual institution contacts changed.

## 8. Profil Saya _ Ringkasan.png

Runtime: `task-8-profile-1440-summary.png`.

- Preserved: user identity/avatar, role, account dates and separate links to profile/password editing. Profile panel width approximately 768px, close to reference 760px.
- Runtime pale avatar with small sans initials versus reference dark green avatar with large serif initials. Runtime name smaller; role appears under email with icon instead of reference table row.
- Runtime dates in three horizontal columns (`Akun dibuat`, `Terakhir diperbarui`, `Masuk terakhir`) versus reference five vertical rows including status/password-changed. Runtime does not display status or password-change timestamp; does not invent unsupported metadata. This remains visible frame divergence.
- Actions sit inside panel bottom, not page-header right; runtime panel much shorter. Fictional editor identity/role differs from reference Super Admin; permission-filtered sidebar expected.

## 9. Profil Saya _ Ubah profil.png

Runtime: `task-8-profile-1440-edit.png`.

- Name/email present and populated; native profile-photo upload retained although absent from reference. Source `views/admin/profile/edit.ejs` also retains conditional current-photo preview and `removeProfilePhoto` checkbox when photo exists. No-photo fixture does not exercise removal branch.
- Wider 880px panel versus reference 640px, explanatory lead above panel, no top back link. Reference email hint is replaced by page-level name/email explanation.
- Upload adds legitimate height; should not be deleted to force match. Runtime actions inside panel and labeled `Simpan`; reference actions below, `Simpan perubahan`.
- Photo upload success/validation was not exercised by these screenshots; retention is confirmed in template, not persistence test.

## 10. Profil Saya _ Ubah password.png

Runtime: `task-8-profile-1440-password-error.png`.

- Selected fresh error screenshot because reference itself is validation-error state. Both include current/new/confirmation fields and clear inline invalid styling.
- Error triggers differ: reference short new password (12-character policy); runtime wrong current password. Runtime shows focused error summary with field link plus inline current-password error, while reference only shows new-password inline error. Do not call these equivalent validation states.
- Runtime clears all three password values after failed POST (script asserts each empty and current field aria-invalid=true), unlike pictured retained bullets. This protects secrets from echoing; do not copy mock bullets into failed response.
- Runtime min-8 helper follows actual shared validator, no show-password toggles, 880px panel rather than 640px. Context does not claim logout on other devices; session invalidation unverified.
- Runtime Batal/Simpan inside panel, no top back link; reference external action row `Ubah password`. Form fields remain intact.

## Field-retention/source cross-check

Read `views/admin/users/form.ejs`, `views/admin/profile/edit.ejs`, `views/admin/settings/edit.ejs`, `controllers/siteSettingController.js`, `routes/siteSettingRoutes.js`, and relevant `validators/index.js` declarations.

- User create/edit retain `name`, `email`, `role`; create keeps `password`; edit keeps explicit `isActive` checkbox not drawn as editable control in PNG.
- Profile edit retains `profilePhoto`, conditional `removeProfilePhoto`, name/email. Conditional removal confirmed statically only.
- Settings retain `kontakEmail`, `kontakTelepon`, `alamat`, `jamLayanan`, `landingFooterDescription`, `landingVideoUrl`, six `social*` URL fields, `favicon`, `strukturOrganisasiImage`; quick-link add retains label/url/target, deletion separate confirmed endpoint. Existing link inline update absent.
- Controller explicitly does not offer unused model properties `namaSitus`, `tagline`, `heroImage`, `bannerRpl`, `siteLogo`, `slideshowImages`; this is documented pre-existing scope, not a missing pictured form regression. No historical exhaustive field-diff claim is made.
- Password creation/admin reset/self change share min-8/max-128 validator; confirmation matching remains. Password policy redesign was not performed.

## Result / next review targets

All 10 pairs read. Institutional palette/shell/hierarchy broadly present; no pixel-perfect claim. Outstanding visual differences most pronounced in user-list column widths/wrapping, settings full-page shell capture, wider/merged form panels, and profile-summary composition. Explicit adaptations recorded: fictional dashboard fixture/no fake clock, Inter, native role select, no password reveal toggle, actual 8-character minimum, no inline quick-link editor. Extra live form controls retained. No application code changed; implementation/approval belongs to later task steps.

## Addendum — targeted viewport/correct-error checks (2026-11-17)

Supersedes capture uncertainty in §7 and wrong-current-only comparison limitation in §10. No app/layout changes. Ran temporary `C:/Users/unjani2/AppData/Local/Temp/opencode/t9-system-extra.cjs`; exit 0, log `.superpowers/sdd/TODO/task-9-step2-system-extra.log`, ending `OK`. Same actual routes/templates and mocked models; no real DB claim. All five new PNGs individually opened and visually read. All are viewport-only 1440 × 1000, under `C:/Users/unjani2/AppData/Local/Temp/opencode/t9shots/`:

1. `task-9-step2-system-settings-top.png`: topbar correctly at y0–64, sidebar correctly at left. Contact/footer/video controls visible normally. Prior full-page displaced shell is known capture artifact, not demonstrated app layout defect; withdraw it as layout failure. Other reference differences (880px single main form, missing right summary, grouping/order) remain.
2. `task-9-step2-system-settings-sidebar-active.png`: independently scrolled sidebar reveals `SISTEM`, `Akun Pengguna`, and active ivory/gold `Pengaturan Situs`; main page stays at top. Active anchor has `aria-current="page"`. System menu exists and remains reachable; initial screenshot visibility is not missing navigation.
3. `task-9-step2-system-settings-video-focus.png`: scrolled/focused `#f-landingVideoUrl` at x329, y440, 846 × 40. Label, focus ring, input and help unobscured by topbar/sticky actions. DOM center hit-test clear, active element confirmed. No viewport overlap observed for target.
4. `task-9-step2-system-settings-upload-links-expanded.png`: expanded native quick-link disclosure shows Label, URL, Buka di and Tambah Tautan. Both native upload controls, labels/help, existing link/Hapus and save actions visible above. Upload controls y380–430; quick-link inputs y838–878. All five controls within viewport and center hit-tests clear. This runtime expansion supersedes earlier static-only add-field observation. No inline existing-link editor; no upload/add/delete submission performed. Sticky main-form actions no longer overlay lower form when form end is reached in this capture.
5. `task-9-step2-system-profile-password-short-new.png`: submitted current fixture password `OldSecret123!`, new password `Short1` (6 characters), matching confirmation `Short1`. POST returned HTTP 422. New field has `aria-invalid="true"`; current field is not marked invalid. Error summary and inline new-field error both say `Password minimal 8 karakter.` All password values cleared after response. This matches reference error category (NEW password too short), while preserving actual min8 rather than pictured min12 policy. Reference retained bullets, no summary, narrow panel and reveal toggles still differ. Matching confirmation produced no mismatch error. Schema validation can reject before current-password comparison, so this is not proof server compared current password on this invalid submission; supplied current value is correct by fixture definition.

Existing user-list column/wrapping finding unchanged; no layout fix attempted. Log includes existing missing reCAPTCHA environment-key warning, unrelated to these fixture form checks. Scoped checks complete; screenshots do not establish upload persistence, production authentication/session revocation, or pixel-perfect parity.

## Salinan bukti portabel

- [task-9-step2-system-profile-password-short-new.png](../../screenshots/task-9-step2-system-profile-password-short-new.png)
- [task-9-step2-system-settings-sidebar-active.png](../../screenshots/task-9-step2-system-settings-sidebar-active.png)
- [task-9-step2-system-settings-top.png](../../screenshots/task-9-step2-system-settings-top.png)
- [task-9-step2-system-settings-upload-links-expanded.png](../../screenshots/task-9-step2-system-settings-upload-links-expanded.png)
- [task-9-step2-system-settings-video-focus.png](../../screenshots/task-9-step2-system-settings-video-focus.png)
