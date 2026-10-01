---
name: Sistem Informasi Akademik UNJANI
colors:
  surface: '#FFFFFF'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#3f493f'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7a6e'
  outline-variant: '#becabc'
  surface-tint: '#006d30'
  primary: '#00652c'
  on-primary: '#ffffff'
  primary-container: '#15803d'
  on-primary-container: '#d3ffd5'
  inverse-primary: '#79db8d'
  secondary: '#2e6a41'
  on-secondary: '#ffffff'
  secondary-container: '#b1f2be'
  on-secondary-container: '#347047'
  tertiary: '#774f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#976600'
  on-tertiary-container: '#fff2e5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#95f8a7'
  primary-fixed-dim: '#79db8d'
  on-primary-fixed: '#00210a'
  on-primary-fixed-variant: '#005323'
  secondary-fixed: '#b1f2be'
  secondary-fixed-dim: '#96d5a3'
  on-secondary-fixed: '#00210d'
  on-secondary-fixed-variant: '#12512c'
  tertiary-fixed: '#ffddb0'
  tertiary-fixed-dim: '#ffba46'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#614000'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
  bg-canvas: '#F8FAF9'
  border-subtle: '#E2E8F0'
  text-primary: '#0F172A'
  text-muted: '#475569'
  status-danger: '#B91C1C'
  status-warning: '#B45309'
  status-success: '#15803D'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 25.6px
  body-lg-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 25.6px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  body-sm-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 21px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.025em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes an authoritative, dependable, and calm digital experience for the academic administration of Universitas Jenderal Achmad Yani (UNJANI). Designed to serve students, lecturers, parents, prospective applicants, and national accreditation assessors, the visual tone prioritizes institutional legitimacy, high scannability, clarity, and rapid retrieval of critical academic data.

The system adopts a structured **Corporate / Institutional Modern** design style:
- **Clarity over ornamentation:** Eliminate visual noise, auto-advancing carousels, decorative stock imagery, translucent glassmorphic surfaces, and low-contrast text overlays.
- **Hierarchical precision:** Clear tabular alignments, structured metadata ribbons, explicit status indicators, and clean separation between transactional forms and contextual notices.
- **Institutional dignity:** Grounded green tones derived from institutional heritage, balanced with clean slate neutrals and subtle gold accents for milestones, honors, and accredited credentials.
- **Language consistency:** All primary user interfaces, semantic status tags, validation prompts, and empty states must be rendered in precise, formal, and courteous Bahasa Indonesia (e.g., *Unduh Transkrip Nilai*, *Jadwal KRS*, *Status Verifikasi Berkas*).

## Colors

The color palette reinforces trust, readability, and WCAG AA accessibility across all administrative workflows.

- **Primary (`#15803D` / Green 700):** Applied to primary actions, interactive breadcrumb active states, table header active sort icons, and validated process links. Must meet at least 4.5:1 contrast against pure white and canvas backgrounds.
- **Secondary (`#14532D` / Green 900):** The institutional anchor reserved for persistent top-level navigation, official portals, hero status bars, and global footer wrappers. Provides high visual permanence.
- **Accent (`#CA8A04` / Gold):** Used strictly for institutional insignia elements, academic accreditation badges (e.g., *Akreditasi Unggul*), subtle milestone icons, and 1px horizontal dividers. Never use gold as small body copy or running links on light surfaces due to contrast limitations.
- **Functional Semantics:**
  - **Danger / Expired (`#B91C1C`):** Missed deadlines, payment delinquencies, course drops, and rejection notices.
  - **Warning (`#B45309`):** Approaching KRS deadlines, pending supervisor approvals, and quota warnings.
  - **Success / Active (`#15803D`):** Approved study plans, confirmed tuition payments, and active academic semesters.
- **Neutrals:** Canvas base sits on a pale cool-tinted `#F8FAF9`, card surfaces use pure `#FFFFFF`, structural lines use `#E2E8F0`, and text employs `#0F172A` (primary headings and data) paired with `#475569` (supporting labels and column descriptions). Lime, neon, or hyper-saturated hues are strictly prohibited.

## Typography

The typographic hierarchy uses **Plus Jakarta Sans** uniformly across all functional tiers, ensuring exceptional legibility on desktop displays, low-spec laptop screens, and mobile devices used by students on campus.

- **Scale & Contrast:** Headlines employ semibold and bold weights with tight letter spacing for formal distinction, while running paragraphs maintain a comfortable `1.6` line-height (`25.6px` on `16px` base) to reduce eye fatigue during long reading sessions (e.g., student handbooks, thesis regulations, curriculum matrices).
- **Tabular Data:** When rendering academic scores, SKS counts, student registration numbers (NIM), or monetary values (UKT), set `font-variant-numeric: tabular-nums` to ensure strict vertical alignment across dense data grids.
- **Content Hierarchy:** Headings must never sit directly atop imagery. All section titles, table names, and instructional banners are anchored over pure canvas (`#F8FAF9`) or white card tiles.

## Layout & Spacing

This design system uses an **8px linear grid system** to preserve spatial order, tabular predictability, and rapid data assimilation.

- **Grid Architecture:** 
  - **Desktop (≥ 1024px):** 12-column layout with a maximum container width of `1280px`, `1.5rem` (`24px`) gutters, and `2rem` (`32px`) safe margins. Content is structured into clear 2-to-3 column layouts for dashboards and 1-column layouts for reading regulations.
  - **Tablet (768px – 1023px):** 8-column layout with `1.5rem` gutters and `1.5rem` margins. Side panels collapse into top-level horizontal tabs or expandable accordions.
  - **Mobile (< 768px):** 4-column layout with `1rem` (`16px`) gutters and `1rem` margins. Dense data tables switch to stacked card structures with explicit key-value rows.
- **Vertical Spacing Rhythm:** Component padding scales systematically: `space-xs` (4px) for tight pill metadata, `space-sm` (8px) for icon-label gaps, `space-md` (16px) for inner card padding and input fields, `space-lg` (24px) for card body clusters, and `space-xl` (32px) to `space-2xl` (48px) for distinct content section breaks.
- **Ergonomics:** All actionable elements—such as pagination buttons, form triggers, document links, and menu entries—maintain a strict minimum tap target dimension of **44px × 44px**.

## Elevation & Depth

To preserve institutional trust and clean readability, elevation relies on subtle tonal containment and controlled micro-shadows rather than layered blurs or dramatic drops.

- **Baseline Level (Level 0):** Canvas `#F8FAF9`. Used for the global page background and secondary auxiliary regions.
- **Resting Surface (Level 1):** Main dashboard panels, course cards, schedule blocks, and official data tables sit on `#FFFFFF`, bounded by a crisp `1px solid #E2E8F0` border and an ultra-soft ambient shadow: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Interactive / Focus Surface (Level 2):** Elevated interactive elements upon hover or dropdown menus and popovers: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`, with border transitioning to `#CBD5E1`.
- **Modal / High Dialog (Level 3):** Administrative modal dialogs (e.g., *Konfirmasi Pembatalan KRS*, *Unggah Dokumen Yudisium*): `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)`. Accompanied by a non-blurry, neutral backdrop overlay: `rgba(15, 23, 42, 0.5)`.
- **Prohibitions:** Heavy skeuomorphic bevels, glow borders, neon highlight rings, and frosted glass/backdrop-filter treatments are disallowed across all academic interfaces.

## Shapes

The interface embraces a balanced, disciplined shape profile that conveys modern reliability without feeling playful or casual.

- **Cards & Data Panels:** Formatted with an exact corner radius of `12px` (`0.75rem`) to frame structured information neatly.
- **Form Controls & Buttons:** Set with `8px` (`0.5rem`) corner radius, maintaining a precise, structured, and utilitarian profile.
- **Badges & Status Chips:** Fully pill-shaped (`9999px`) or `6px` (`0.375rem`) tags to distinguish state indicators clearly from clickable rectangular buttons.
- **Avatars & Academic Seals:** Circular (`50%`) for lecturer and student profile photos, square with `8px` smoothing for faculty and department insignia.

## Components

### Buttons (*Tombol Operasional*)
- **Primary:** Background `#15803D`, text `#FFFFFF`, radius `8px`, minimum height `44px`, padding `10px 20px`. Hover: `#166534`. Active: `#14532D`. Focus: `2px solid #15803D` with `2px` offset.
- **Secondary / Outlined:** Background `transparent`, border `1px solid #E2E8F0`, text `#0F172A`. Hover: Background `#F1F5F9`, border `#CBD5E1`.
- **Tertiary / Text:** Background `transparent`, text `#15803D`, font weight `600`. Hover: Background `#F0FDF4`.
- **Destructive:** Background `#B91C1C`, text `#FFFFFF`. Hover: `#991B1B`.

### Status Badges & Chips (*Label Status*)
- Compact chips (`font-size: 12px`, `font-weight: 600`, padding `4px 10px`, radius `9999px`).
- **Aktif / Terverifikasi:** Background `#DCFCE7`, text `#15803D`.
- **Menunggu Persetujuan / Dalam Proses:** Background `#FEF3C7`, text `#B45309`.
- **Ditolak / Kadaluwarsa / Tidak Aktif:** Background `#FEE2E2`, text `#B91C1C`.
- **Akreditasi / Unggul (Accent):** Background `#FEF9C3`, text `#854D0E`, border `1px solid #CA8A04`.

### Input Fields & Controls (*Kolom Isian & Formulir*)
- Minimum height `44px`, border `1px solid #E2E8F0`, background `#FFFFFF`, text `#0F172A`, placeholder `#94A3B8`, border-radius `8px`, internal padding `10px 14px`.
- **Focus State:** Border `#15803D`, box-shadow `0 0 0 3px rgba(21, 128, 61, 0.15)`, outline `none`.
- **Error State:** Border `#B91C1C`, error helper text in `#B91C1C` (`12px`, regular).
- **Checkboxes & Radios:** `20px × 20px` footprint. Checked state fills `#15803D` with crisp white checkmark/dot. Touch target padded to minimum `44px`.

### Academic Data Tables (*Tabel Akademik & Nilai*)
- Encapsulated within a white card container with `1px solid #E2E8F0` and `12px` rounded corners.
- Header row: Background `#F8FAF9`, border-bottom `1px solid #E2E8F0`, text `#475569`, uppercase `12px`, weight `600`, letter-spacing `0.05em`.
- Data rows: Padding `14px 16px`, border-bottom `1px solid #F1F5F9`, zebra striping optional on dense lists using alternating `#FFFFFF` and `#FAFAFA`.
- Numeric columns (NIM, Nilai Angka, Bobot, SKS) must be right-aligned with tabular figures.

### Cards & Information Containers (*Kartu Informasi*)
- Container: Surface `#FFFFFF`, border `1px solid #E2E8F0`, radius `12px`, padding `20px`.
- Card Header: Features clear title (`headline-sm`), optional badge right-aligned, and an optional bottom divider `1px solid #F1F5F9`.

### Notice Banners (*Pengumuman Akademik*)
- Flat callout containers with a solid 4px left accent stripe.
- Info: Background `#EFF6FF`, border left `#2563EB`, text `#1E3A8A`.
- Warning/Peringatan Akademik: Background `#FFFBEB`, border left `#B45309`, text `#78350F`.
- Strictly avoid generic placeholder text (*Lorem Ipsum*). All mocked or instructional states must feature real context such as *"Batas Pengisian KRS Semester Genap 2024/2025"* or *"Pengambilan Ijazah Gelombang I"*.