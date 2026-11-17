# Graph Report - akademik.unjani.ac.id  (2026-10-19)

## Corpus Check
- Large corpus: 522 files · ~3,513,866 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2604 nodes · 4690 edges · 188 communities (131 shown, 57 thin omitted)
- Extraction: 90% EXTRACTED · 9% INFERRED · 1% AMBIGUOUS · INFERRED: 437 edges (avg confidence: 0.85)
- Token cost: 79,680 input · 9,940 output

## Community Hubs (Navigation)
- Admin & Landing Views
- Server Bootstrap & Routing
- Alpine.js CSP Bundle
- Bootstrap Dropdown (Referensi)
- Authentication & Profile
- AI Chat Assistant
- Role & Permission Middleware
- Input Validators
- Design Mockups: Pengumuman & Kalender
- Landing Page Controller
- jQuery Core (Referensi)
- Architecture Docs Overview
- jQuery 3.6 (Referensi)
- UI/UX Audit Findings
- Auth Routes & Upload Utils
- Bootstrap Tooltip (Referensi)
- Content Models (Book/News/ChatLog)
- Academic Calendar Controller
- Alpine Bundle Chunk 2
- Staff & Pimpinan Controller
- Chat Knowledge Base
- Alpine Bundle Chunk 3
- Bootstrap Modal & Backdrop (Referensi)
- Frontend UI Widgets
- Alpine Expression Parser
- Design Mockups: Shell & Pengumuman
- Alpine Reactivity Core
- Unit Routes & Asset Version
- Bootstrap Carousel (Referensi)
- Prettify Syntax Highlighter
- Bootstrap Scrollspy (Referensi)
- Kalender Utils & Tests
- Alpine Bundle Chunk 4
- Bootstrap Base Helpers (Referensi)
- Design Mockups: Akreditasi & Beranda
- Accreditation Model & Migration
- Package Metadata
- Content Utils (Excerpt & Sanitize)
- Site Settings & Cache
- Book Upload Routes
- Unit Tests: Utils
- Modernizr (Referensi)
- Academic Document Controller
- Accreditation Controller
- Calendar & Document Models
- Kurikulum Controller
- Program Studi Controller
- Master Data Models & Seeds
- RPL Document Model & Migration
- Bootstrap Tab Helper (Referensi)
- Lulusan Controller
- Unit Controller
- Runtime Dependencies
- Calendar Routes & Upload
- Qeducato Asset Placeholders
- Book Controller
- Graduation Book Controller
- Kategori Controller & Slug
- RPL Document Controller
- User Management Controller
- Icon Fonts & Doc Screenshots
- Bootstrap Collapse (Referensi)
- Blog Avatar Placeholders
- Academic Profile Singleton
- News Routes
- Pengumuman Routes
- Qeducato Brand & SVE Icons
- Lulusan Routes
- Image Processing (sharp)
- Portfolio Collage Placeholders
- Education Doodle Icons
- Bootstrap Alert Timer (Referensi)
- jQuery FX Internals (Referensi)
- Academic Document Routes
- Accreditation Routes
- Kurikulum Routes
- Program Studi Routes
- RPL Routes
- Alpine Bundle Chunk 5
- Alpine Evaluation Core
- Blog Inner Placeholders
- Class Thumbnail Placeholders
- Bootstrap Close Handlers (Referensi)
- Bootstrap Offcanvas (Referensi)
- Graduation Book Routes
- Site Settings Routes
- Staff Routes
- Build Assets Script
- Brand Logos & Class Photos
- Sizzle Selector Engine (Referensi)
- jQuery DOM Internals (Referensi)
- Team Section Placeholders
- Kurikulum & Prodi Models
- Alpine Bundle Chunk 6
- imagesLoaded Plugin (Referensi)
- Migration Runner
- 404 & Admission Illustrations
- Admin Content Controller
- NPM Scripts
- Pengumuman View Tests
- UNJANI Branding & Hero Assets
- Dev Dependencies
- Event Section Images
- Kawaii Doodle Assets
- Course Card Placeholders
- Bootstrap Animation Utils (Referensi)
- SEO Sitemap Controller
- Admin Sidebar Layout
- Login Attempt Limiter
- Public Layout Components
- Testimonial Placeholders
- Regex Utils & Tests
- Team Avatar Circles
- Lulusan CSV Import
- Testimonial Stars & Backgrounds
- Contact Utils & Tests
- Video Embed Utils & Tests
- Contact Icons
- Database Config
- Design Mockup: Akreditasi Admin
- Font Awesome Webfonts
- Contact Chip Icons
- jQuery CSS Utilities (Referensi)
- macOS AppleDouble Artifacts
- Footer & Feature Backgrounds
- Feature Icons (White)
- Slider Decorative Shapes
- How-It-Works Illustrations
- Docs Navigation Script
- CTA Section Backgrounds
- Blog Backgrounds
- Team Placeholders (06-08)
- jQuery Waypoints (Referensi)
- Template Main JS (Referensi)
- jQuery Async Helpers (Referensi)
- find-skills Notes
- Course Category Icons
- Blockquote Icons
- Video Play Buttons
- Lulusan Model
- Unit Model
- CTA Image Assets
- Frontend Build Pipeline
- Event & FAQ Images
- E-learning Icons
- jQuery Deferred (Referensi)
- Search Banner Asset
- Hero Sun Doodle
- Quote Section Background
- Blog Featured Image Asset
- Verified Account Icon
- Mail Inbox Icon
- Exam Sheet Icon
- Print Icon
- Send Mail Icon (Blank)
- Campus Building Icon
- Classroom Icon
- Design Monitor Icon
- Testimonial Quote Icon
- jQuery Ajax Inspect (Referensi)
- Qeducato Team & Teacher Pages
- Duotone Icon Style
- jQuery event.on Helper (Referensi)
- Qeducato Projects Page Doc
- Qeducato Thank You Page Doc

## God Nodes (most connected - your core abstractions)
1. `validate()` - 54 edges
2. `jt` - 37 edges
3. `wt` - 32 edges
4. `safeFilename()` - 32 edges
5. `fileError()` - 31 edges
6. `remove()` - 27 edges
7. `et` - 27 edges
8. `ft` - 27 edges
9. `forEach()` - 27 edges
10. `mongoose` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Qeducato Template: Event Details` --semantically_similar_to--> `Desain: Detail Pengumuman Wisuda Periode I 2026 (layout editorial 740px)`  [INFERRED] [semantically similar]
  Referensi/qeducato/single-event.html → docs/Design/detail_pengumuman_wisuda_periode_i_2026_unjani/code.html
- `j()` --indirect_call--> `T()`  [INFERRED]
  Referensi/qeducato/js/bootstrap.min.js → public/js/vendor/alpine-csp.min.js
- `create()` --calls--> `validate()`  [EXTRACTED]
  controllers/userAccountController.js → validators/index.js
- `sidebar` --indirect_call--> `me()`  [INFERRED]
  views/layouts/admin.ejs → public/js/vendor/alpine-csp.min.js
- `storage` --calls--> `safeFilename()`  [EXTRACTED]
  routes/academicCalendarRoutes.js → utils/upload.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Qeducato multi-variant template site (University / Kindergarten / High School + inner pages sharing one nav)** — referensi_qeducato_index_page, referensi_qeducato_index_2_page, referensi_qeducato_index_3_page, referensi_qeducato_about_page, referensi_qeducato_404_error_page [INFERRED 0.85]
- **Qeducato page shell pattern (header/menu + breadcrumb + searchform + shared CSS/JS)** — referensi_qeducato_header_menu_component, referensi_qeducato_breadcrumb_area, referensi_qeducato_searchform, referensi_qeducato_fontawesome_css, referensi_qeducato_main_js, referensi_qeducato_about_page [INFERRED 0.80]
- **Auth starter flow (register/login with JWT, bcrypt-hashed User model, reCAPTCHA guard)** — readme_express_mongodb_ejs_auth_starter, readme_jwt_authentication, readme_recaptcha_v2, readme_mongoose_user_model [EXTRACTED 1.00]
- **Bidang Akademik UNJANI Design System (Tailwind token + Plus Jakarta Sans + Material Symbols, diimplementasikan semua mockup)** — docs_design_bidang_akademik_unjani_design_language, docs_design_akreditasi_institusi_program_studi_bidang_akademik_unjani_code, docs_design_akreditasi_mobile_bidang_akademik_unjani_code, docs_design_beranda_layanan_akademik_unjani_code, docs_design_beranda_mobile_layanan_akademik_unjani_code, docs_design_buku_wisuda_bidang_akademik_unjani_code, docs_design_dasbor_admin_bidang_akademik_unjani_code, docs_design_detail_pengumuman_wisuda_periode_i_2026_unjani_code, docs_design_dokumen_akademik_bidang_akademik_unjani_code, docs_design_dokumen_akademik_mobile_bidang_akademik_unjani_code, docs_design_kalender_akademik_bidang_akademik_unjani_code [INFERRED 0.95]
- **Iterasi audit UI/UX v1→v2→v3→v4 (F0 situs lama → Fase 5 → F7 → F8 kode), wow saling sitasi** — docs_audit_uiux, docs_audit_uiux_v2, docs_audit_uiux_v3, docs_audit_uiux_v4, docs_audit_uiux_remediation_priority [EXTRACTED 1.00]
- **Shell template Qeducato: header sticky, offcanvas menu, footer widget, stack jQuery/Slick/WOW/meanmenu bersama** — referensi_qeducato_qeducato_template, referensi_qeducato_single_courses, referensi_qeducato_single_courses_2, referensi_qeducato_single_event, referensi_qeducato_single_projects, referensi_qeducato_single_service, referensi_qeducato_team, referensi_qeducato_team_single, referensi_qeducato_thank_you [EXTRACTED 1.00]
- **Rantai Dokumentasi Proyek (SRS → PLAN → TODO → MIGRASI → POLA)** — docs_srs_srs_situs_bidang_akademik_unjani, docs_plan_rencana_implementasi_f0_f9, docs_todo_checklist_implementasi_todo_md, docs_migrasi_f2_laporan_migrasi_data_f2, docs_pola_admin_pola_acuan_modul_admin_f4 [INFERRED 0.90]
- **Alur Desain Stitch (Prompt → Design System → Prototipe → Koreksi SRS)** — docs_prompt_stitch_prompt_google_stitch, docs_design_sistem_informasi_akademik_unjani_design_md_design_md_sistem_informasi_akademik_unjani, docs_srs_koreksi_wajib_desain_stitch_srs_7_2, docs_design_kalender_akademik_mobile_bidang_akademik_unjani_code_kalender_akademik_mobile, docs_design_kelola_pengumuman_admin_bidang_akademik_unjani_code_kelola_pengumuman_admin [INFERRED 0.85]
- **Alur Konten Pengumuman (Admin CRUD → Publikasi → Pola Acuan Modul)** — docs_design_kelola_pengumuman_admin_bidang_akademik_unjani_code_kelola_pengumuman_admin, docs_design_pengumuman_akademik_bidang_akademik_unjani_code_pengumuman_akademik_publik, docs_pola_admin_pola_acuan_modul_admin_f4, docs_pola_admin_admincontentcontroller_factory [INFERRED 0.80]
- **Font Awesome Pro 5 Webfont Set** — referensi_qeducato_fontawesome_webfonts_fontawesome_brands_webfont, referensi_qeducato_fontawesome_webfonts_fontawesome_duotone_webfont, referensi_qeducato_fontawesome_webfonts_fontawesome_light_webfont, referensi_qeducato_fontawesome_webfonts_fontawesome_regular_webfont, referensi_qeducato_fontawesome_webfonts_fontawesome_solid_webfont, referensi_qeducato_fontawesome_webfonts_font_awesome_pro_5_icon_library [EXTRACTED 1.00]
- **Animated background decoration set** — drum_animation_illustration, topographic_background_lines, school_building_outline, school_building_with_clock_icon, page_background_decoration [INFERRED 0.85]
- **Hand-Drawn Accent Doodle Ornament Set (Squiggle, Flask, Ring Arc, Half-Donut)** — referensi_qeducato_img_bg_an_img_11_squiggle_doodle, referensi_qeducato_img_bg_an_img_12_lab_flask_doodle, referensi_qeducato_img_bg_an_img_13_ring_arc_sketch, referensi_qeducato_img_bg_an_img_14_half_donut_shape [INFERRED 0.75]
- **Animated Doodle Decoration Asset Set** — referensi_qeducato_img_bg_an_img_15_yellow_squiggle_doodle, referensi_qeducato_img_bg_an_img_16_blue_car_doodle, referensi_qeducato_img_bg_an_img_17_pink_star_doodle, referensi_qeducato_img_bg_an_img_18_smiling_sun_doodle, referensi_qeducato_img_bg_an_img_19_star_shadow_doodle, referensi_qeducato_img_bg_an_img_20_blank_image, referensi_qeducato_img_bg_an_img_decorative_doodle_asset [INFERRED 0.95]
- **Contact Section Info Icon Trio (Phone / Email / Location)** — referensi_qeducato_img_bg_contact_icon01_phone_icon, referensi_qeducato_img_bg_contact_icon02_email_icon, referensi_qeducato_img_bg_contact_icon03_location_icon, referensi_qeducato_img_bg_contact_icon01_phone_icon_contact_information_channel [EXTRACTED 0.95]
- **Qeducato Template Background Asset Set** — referensi_qeducato_img_bg_cta_bg_cta_background, referensi_qeducato_img_bg_cta_bg02_cta_background_variant, referensi_qeducato_img_bg_evn_img_01_event_image_01, referensi_qeducato_img_bg_evn_img_02_event_image_02, referensi_qeducato_img_bg_evn_img_03_event_image_03, referensi_qeducato_img_bg_evn_img_04_event_image_04, referensi_qeducato_img_bg_evn_img_1_event_image_1, referensi_qeducato_img_bg_evn_img_2_event_image_2, referensi_qeducato_img_bg_evn_img_3_event_image_3, referensi_qeducato_img_bg_evn_img_4_event_image_4 [INFERRED 0.75]
- **QEducato background assets form the template's visual system** — referensi_qeducato_img_bg_feature_bg_feature_section_background, referensi_qeducato_img_bg_footer_bg_footer_background, referensi_qeducato_img_bg_quote_bg_quote_pattern_background, referensi_qeducato_img_bg_search_bg_page_header_banner, referensi_qeducato_img_bg_slider_shape01_hero_slider_decoration, referensi_qeducato_img_bg_play_button2_play_button_variant [INFERRED 0.75]
- **Testimonial Section Visual Assets** — referensi_qeducato_img_bg_testi_avatar_testimonial_avatar, referensi_qeducato_img_bg_testimonial_bg_testimonial_background, referensi_qeducato_img_bg_testimonial_bg2_testimonial_background, qeducato_testimonial_section [INFERRED 0.75]
- **Blog detail asset group: admin avatar + ad banner + four detail figures compose the blog post page assets** — referensi_qeducato_img_blog_admin_img_avatar, referensi_qeducato_img_blog_ad_banner_ad_slot, referensi_qeducato_img_blog_b_details01_blog_figure, referensi_qeducato_img_blog_b_details02_blog_figure, referensi_qeducato_img_blog_b_details03_blog_figure, referensi_qeducato_img_blog_b_details04_blog_figure [INFERRED 0.85]
- **qeducato blog placeholder asset group: six blank-rectangle thumbnails and four gray-circle avatars together fill the blog post grid and comment thread UI** — referensi_qeducato_img_blog_blog_img01_jpg_placeholder, referensi_qeducato_img_blog_blog_img02_jpg_placeholder, referensi_qeducato_img_blog_blog_img03_jpg_placeholder, referensi_qeducato_img_blog_comment_avatar_placeholder, referensi_qeducato_img_blog_comment_c_01_placeholder, referensi_qeducato_img_blog_comment_c_02_placeholder, referensi_qeducato_img_blog_comment_c_03_placeholder, blog_placeholder_thumbnail_concept, referensi_qeducato_img_blog_comment_avatar_placeholder_concept [EXTRACTED 1.00]
- **Qeducato Blog Image Asset Series** — referensi_qeducato_img_blog_inner_b1_gray_placeholder, referensi_qeducato_img_blog_inner_b2_gray_placeholder, referensi_qeducato_img_blog_inner_b3_gray_placeholder, referensi_qeducato_img_blog_inner_b4_gray_placeholder, referensi_qeducato_img_blog_inner_b5_gray_placeholder, referensi_qeducato_img_blog_inner_b6_gray_placeholder, referensi_qeducato_img_blog_inner_b7_gray_placeholder, referensi_qeducato_img_blog_inner_b8_gray_placeholder, referensi_qeducato_img_blog_inner_b9_gray_placeholder, referensi_qeducato_img_blog_s_blogimg_01_white_square, referensi_qeducato_img_blog_blog_thumbnail_asset_concept [INFERRED 0.85]
- **Qeducato Template Static Asset Set (brand logos, class photos, blog visual)** — referensi_qeducato_img_blog_s_blogimg_02_blog_image, referensi_qeducato_img_brand_b_logo1_brand_logo, referensi_qeducato_img_brand_b_logo2_brand_logo, referensi_qeducato_img_brand_b_logo3_brand_logo, referensi_qeducato_img_brand_b_logo4_brand_logo, referensi_qeducato_img_brand_b_logo5_brand_logo, referensi_qeducato_img_brand_b_logo7_brand_logo, referensi_qeducato_img_class_class_1_class_image, referensi_qeducato_img_class_class_10_class_image, referensi_qeducato_img_class_class_11_class_image, referensi_qeducato_img_brand_brand_logo_strip, referensi_qeducato_img_class_course_card_imagery, referensi_qeducato_img_blog_blog_post_visual [INFERRED 0.75]
- **Qeducato Lazy-Load Gray Placeholder Image Set** — referensi_qeducato_img_class_class_12_gray_placeholder, referensi_qeducato_img_class_class_2_gray_placeholder, referensi_qeducato_img_class_class_3_gray_placeholder, referensi_qeducato_img_class_class_4_gray_placeholder, referensi_qeducato_img_class_class_5_gray_placeholder, referensi_qeducato_img_class_class_6_gray_placeholder, referensi_qeducato_img_class_class_7_gray_placeholder, referensi_qeducato_img_class_class_8_gray_placeholder, referensi_qeducato_img_class_class_9_gray_placeholder, referensi_qeducato_img_features_about_img_gray_placeholder, referensi_qeducato_img_class_class_2_lazy_load_placeholder_pattern [INFERRED 0.75]
- **Qeducato Portfolio Gallery Placeholder Set** — referensi_qeducato_img_gallery_protfolio_img01_gallery_placeholder, referensi_qeducato_img_gallery_protfolio_img02_gallery_placeholder, referensi_qeducato_img_gallery_protfolio_img03_gallery_placeholder, referensi_qeducato_img_gallery_protfolio_img04_gallery_placeholder, referensi_qeducato_img_gallery_protfolio_img05_gallery_placeholder, referensi_qeducato_img_gallery_protfolio_img06_gallery_placeholder, referensi_qeducato_img_placeholder_asset_pattern [INFERRED 0.85]
- **qeducato Template Shared Icon Design Language (Flat Duo-Tone Teal/Coral, Circular-Motion Motifs)** — referensi_qeducato_img_icon_clock_icon_time_schedule_icon, referensi_qeducato_img_icon_phone_call_phone_contact_icon, referensi_qeducato_img_icon_mailing_email_contact_icon, referensi_qeducato_img_icon_c_d01_category_grid_icon, referensi_qeducato_img_icon_cou_icon_open_book_icon [INFERRED 0.75]
- **Service feature icon set of the qeducato education theme** — referensi_qeducato_img_icon_sve_icon1_online_learning_icon, referensi_qeducato_img_icon_sve_icon2_student_reading_icon, referensi_qeducato_img_icon_sve_icon3_creative_design_icon, referensi_qeducato_img_icon_sve_icon10_school_building_icon, referensi_qeducato_img_icon_sve_icon4_blank_icon [INFERRED 0.85]
- **Hero slider asset stack (backgrounds + slide artwork)** — referensi_qeducato_img_slider_slider_bg_slider_background, referensi_qeducato_img_slider_slider_bg_01_slider_background, referensi_qeducato_img_slider_slider_img02_slider_artwork [INFERRED 0.85]
- **Qeducato team-member placeholder card set** — referensi_qeducato_img_team_team01_placeholder, referensi_qeducato_img_team_team02_placeholder, referensi_qeducato_img_team_team03_placeholder, referensi_qeducato_img_team_team04_placeholder, referensi_qeducato_img_team_team05_placeholder_jpg, referensi_qeducato_img_team_team05_placeholder_png, team_member_section [INFERRED 0.85]
- **Team and testimonial avatar assets sharing circular placeholder style** — referensi_qeducato_img_team_team06_png, referensi_qeducato_img_team_team07_png, referensi_qeducato_img_team_team08_png, referensi_qeducato_img_team_team09_png, referensi_qeducato_img_team_team10_png, referensi_qeducato_img_team_team11_png, referensi_qeducato_img_team_team12_png, referensi_qeducato_img_testimonial_c_01_png, referensi_qeducato_img_testimonial_c_02_png, referensi_qeducato_img_testimonial_qt_icon_png, referensi_qeducato_img_circular_avatar_style [INFERRED 0.85]
- **Desktop and mobile screen pairs forming the responsive public site design set (Akreditasi + Beranda)** — docs_design_akreditasi_institusi_program_studi_bidang_akademik_unjani_screen, docs_design_akreditasi_mobile_bidang_akademik_unjani_screen, docs_design_beranda_layanan_akademik_unjani_screen, docs_design_beranda_mobile_layanan_akademik_unjani_screen, responsive_design_concept [INFERRED 0.95]
- **Responsive institutional design system: each public feature ships as matched desktop + mobile mockups sharing the green identity, header/footer shell and component vocabulary** — docs_design_dokumen_akademik_bidang_akademik_unjani_screen, docs_design_dokumen_akademik_mobile_bidang_akademik_unjani_screen, docs_design_kalender_akademik_bidang_akademik_unjani_screen, docs_design_kalender_akademik_mobile_bidang_akademik_unjani_screen, docs_design_kurikulum_program_studi_bidang_akademik_unjani_screen, docs_design_kurikulum_mobile_bidang_akademik_unjani_screen, concepts_public_site_shell, concepts_institutional_green_theme [INFERRED 0.85]
- **Accreditation admin form pattern: validated fields + PDF upload + auto expiry status** — docs_design_tambah_akreditasi_admin_bidang_akademik_unjani_screen_admin_accreditation_form, docs_design_tambah_akreditasi_admin_bidang_akademik_unjani_screen_form_field_validation, docs_design_tambah_akreditasi_admin_bidang_akademik_unjani_screen_drag_drop_pdf_upload, docs_design_tambah_akreditasi_admin_bidang_akademik_unjani_screen_accreditation_expiry_auto_status [EXTRACTED 1.00]

## Communities (188 total, 57 thin omitted)

### Community 0 - "Admin & Landing Views"
Cohesion: 0.06
Nodes (10): inisial, superadmin, icons, block, attrs, describedBy, crumbs, pages (+2 more)

### Community 1 - "Server Bootstrap & Routing"
Cohesion: 0.03
Nodes (54): SAFE_METHODS, AcademicCalendar, academicCalendarRoutes, AcademicDocument, academicDocumentRoutes, academicProfileRoutes, accreditationRoutes, { accreditationStatus } (+46 more)

### Community 2 - "Alpine.js CSP Bundle"
Cohesion: 0.05
Nodes (46): An(), Ar(), at(), Dt(), every(), fe(), filter(), findIndex() (+38 more)

### Community 3 - "Bootstrap Dropdown (Referensi)"
Cohesion: 0.08
Nodes (34): pt, a(), i(), h(), u(), n(), o(), r() (+26 more)

### Community 4 - "Authentication & Profile"
Cohesion: 0.05
Nodes (46): bcrypt, createToken(), discardUpload(), DUMMY_PASSWORD_HASH, expiryMsFromEnv(), fs, getChangePassword(), getEditProfile() (+38 more)

### Community 5 - "AI Chat Assistant"
Cohesion: 0.06
Nodes (47): ask(), ChatLog, { createLimiter, intFromEnv }, crypto, ERRORS, { generate }, { getItems }, hashIp() (+39 more)

### Community 6 - "Role & Permission Middleware"
Cohesion: 0.05
Nodes (43): extractToken(), forbidden(), { isStaff, isSuperadmin }, jwt, loadUser(), requireAdmin, requireAuth(), requireRole() (+35 more)

### Community 7 - "Input Validators"
Cohesion: 0.05
Nodes (51): parseTanggal(), academicDocument, academicProfile, accreditation, accreditationRules(), blankToUndefined(), book, calendar (+43 more)

### Community 8 - "Design Mockups: Pengumuman & Kalender"
Cohesion: 0.05
Nodes (44): Kalender Akademik Mobile, SK Rektor No. Skep/179/Unjani/VI/2025, Timeline Vertikal Kalender, Aksi Massal Pengumuman, Kelola Pengumuman Admin, Status Publikasi: Terbit/Draf/Terjadwal, Kurikulum Mobile, Kurikulum OBE & MBKM (+36 more)

### Community 9 - "Landing Page Controller"
Cohesion: 0.05
Nodes (39): AcademicCalendar, AcademicDocument, Accreditation, { accreditationStatus, JENIS, PERINGKAT }, Book, Faculty, getAkreditasiLanding(), getBeritaLanding() (+31 more)

### Community 10 - "jQuery Core (Referensi)"
Cohesion: 0.05
Nodes (14): values(), ajaxConvert(), ajaxHandleResponses(), buildParams(), clearFxNow(), createFxNow(), defaultDisplay(), doAnimation() (+6 more)

### Community 11 - "Architecture Docs Overview"
Cohesion: 0.10
Nodes (40): Admin CRUD Modules (Books, Graduation Books, Akreditasi, Kalender Akademik, Dokumen Akademik), Express + MongoDB + EJS Auth Starter, JWT Authentication (HTTP-only cookie + Bearer header), EJS layout partials (_layout-start / _layout-end), Mongoose User model (bcrypt pre-save hash + comparePassword), Google reCAPTCHA v2 (login/register guard), res.renderPage layout helper (layouts/public | layouts/admin), Documenter v2.0 documentation tool (+32 more)

### Community 12 - "jQuery 3.6 (Referensi)"
Cohesion: 0.06
Nodes (8): computeStyleTests(), createCache(), cache(), dataAttr(), finalPropName(), getData(), roundPixelMeasures(), vendorPropName()

### Community 13 - "UI/UX Audit Findings"
Cohesion: 0.07
Nodes (31): BAA UNJANI — Audit UI/UX v1 (situs lama, 1 Okt 2026), Temuan 02: 404 fallback membocorkan stack trace (landing/404.ejs tidak dipakai), Temuan 03/04/14: sisa template klub padel Adelux (hero, sidebar HP, customizer admin), Temuan A1: kegagalan kontras warna hijau/lime/teal global; rekomendasi hijau utama #15803D, Prioritas 'Mulai dari mana' (dampak ÷ usaha, 11 aksi), Temuan 01: /register memungkinkan eskalasi role ke admin, Temuan 05: konten uji coba ('test', Lorem ipsum) tampil publik berstatus published (13 berita), Temuan 07: unggahan tanpa limits.fileSize (gambar 128 MB, beranda 23,7 MB) (+23 more)

### Community 14 - "Auth Routes & Upload Utils"
Cohesion: 0.08
Nodes (31): authController, express, fs, multer, path, profilePhotoUpload(), { requireAuth }, router (+23 more)

### Community 16 - "Content Models (Book/News/ChatLog)"
Cohesion: 0.07
Nodes (25): BookSchema, mongoose, ChatLogSchema, mongoose, GraduationBookSchema, mongoose, mongoose, NewsSchema (+17 more)

### Community 17 - "Academic Calendar Controller"
Cohesion: 0.10
Nodes (28): AcademicCalendar, addEvent(), addLampiran(), create(), deleteEvent(), deleteLampiran(), downloadTemplate(), findOrThrow() (+20 more)

### Community 18 - "Alpine Bundle Chunk 2"
Cohesion: 0.10
Nodes (33): bi(), Ce(), Cn(), concat(), De(), Er(), Fn(), gn() (+25 more)

### Community 19 - "Staff & Pimpinan Controller"
Cohesion: 0.09
Nodes (26): getPimpinanStaffLanding(), create(), findOrThrow(), fs, list(), path, PUBLIC_DIR, { rank } (+18 more)

### Community 20 - "Chat Knowledge Base"
Cohesion: 0.10
Nodes (28): AcademicCalendar, AcademicDocument, AcademicProfile, Accreditation, { accreditationStatus, JENIS }, akreditasiItems(), build(), cache (+20 more)

### Community 21 - "Alpine Bundle Chunk 3"
Cohesion: 0.10
Nodes (31): bs(), ci(), di(), Dn(), $e(), en(), fi(), forEach() (+23 more)

### Community 23 - "Frontend UI Widgets"
Cohesion: 0.10
Nodes (17): applyLink(), ask(), closeAndFocus(), closeLink(), escapeIfOpen(), exec(), go(), init() (+9 more)

### Community 24 - "Alpine Expression Parser"
Cohesion: 0.22
Nodes (28): advance(), check(), checkIdentifierName(), checkType(), consume(), consumeIdentifierName(), current(), isAtEnd() (+20 more)

### Community 25 - "Design Mockups: Shell & Pengumuman"
Cohesion: 0.09
Nodes (26): Institutional visual identity: deep-green-on-light palette with a solid green footer (Kontak & Alamat, Jam Layanan, Tautan Cepat, copyright), green primary buttons, bookmark motifs, applied uniformly across all public pages and shared between desktop and mobile mockups, Public site shell layout: top logobar (Bidang Akademik UNJANI + Beranda/Profil/Akademik/Akreditasi/Publikasi), breadcrumb trail, page heading with description, content section, footer, reused across announcement/doc/calendar/curriculum pages; mobile variants use bottom tab nav instead, Announcement admin CRUD pattern: stats cards (Total Terbit 38, Draf Review 6, Terjadwal 4, Disematkan 1), status tab filters, select-all plus bulk action (Terapkan Aksi Massal), search by title/SK number, category and sort filters, table with thumbnail, author and timestamps, edit actions, pagination 10/page of 48, SK citation validation footer, Announcement index pattern: category filter chips with counts (Semua 48, Wisuda 8, Perkuliahan 18, Ujian 12, Administrasi 10), numbered date blocks, status badges (Disematkan/New), view counts y attachment counts, sidebar with Langganan Warta (email/Telegram subscription to unjani.com/student.google.com), Pusat Bantuan BAA (service hours, WhatsApp, official email), and directly downloadable academic PDF templates, Announcement lifecycle statuses: Terbit (published), Draf (draft, incl. awaiting WRC approval), Terjadwal (scheduled), Disematkan (pinned), each color-coded badge and counted in the admin statistics, Announcement detail page includes share buttons (WhatsApp, Telegram, Email, Copy link) and related-announcements cards at the bottom, BAA admin sidebar structure: Ringkasan (Dasbor), Konten (Berita, Pengumuman), Akademik (Kalender Akademik, Kurikulum, Dokumen Akademik, RPL, Akreditasi), Publikasi (Buku, Buku Wisuda, Data Lulusan), Organisasi (Pimpinan & Staf, Unit, Profil Bidang), Pengaturan (Pengaturan Situs, Master Data), Superadmin account footer, Promotional banner 'Digitalisasi Dokumen BAA 2026': Garuda electronic signature for faster document validity, ITE Tertifikasi BSI+ badge (+18 more)

### Community 26 - "Alpine Reactivity Core"
Cohesion: 0.10
Nodes (26): bn(), checkForDangerousValues(), deleteProperty(), dr(), ds(), ee(), Et(), get() (+18 more)

### Community 27 - "Unit Routes & Asset Version"
Cohesion: 0.09
Nodes (19): fs, path, express, fileFilter(), fs, multer, path, { requireAuth, requireAdmin } (+11 more)

### Community 29 - "Prettify Syntax Highlighter"
Cohesion: 0.14
Nodes (17): B(), C(), D(), e(), h(), b(), E(), L() (+9 more)

### Community 31 - "Kalender Utils & Tests"
Cohesion: 0.13
Nodes (19): list(), getKalenderLanding(), getLanding(), { accreditationStatus, normalizePeringkat, peringkatRank }, assert, { calendarEventStatus, currentAndNext }, { makeExcerpt, sanitizeHtml }, NOW (+11 more)

### Community 32 - "Alpine Bundle Chunk 4"
Cohesion: 0.12
Nodes (22): ai(), b(), Be(), constructor(), Cr(), Cs(), Fr(), Ge() (+14 more)

### Community 33 - "Bootstrap Base Helpers (Referensi)"
Cohesion: 0.16
Nodes (16): getDataAttributes(), H(), j(), K(), M(), off(), on(), one() (+8 more)

### Community 34 - "Design Mockups: Akreditasi & Beranda"
Cohesion: 0.13
Nodes (21): Academic agenda cards (UAS, registration, short semester, grade deadline) with status badges, Accreditation certificate expiry (Kedaluwarsa) tracking with extension-in-process status, Public accreditation information page (institution + program study ratings, certificates, legalisation service), Institution accreditation rating UNGGUL from BAN-PT (SK 108/SK/BAN-PT/Ak-PPJ/PT/II/2021, valid 11 Feb 2021 - 11 Feb 2026), Per-study-program accreditation history archive with signed SK documents (PDF), Recent activity / audit log feed with staff attribution and retention (148 entries, 12-month retention), Academic services gateway homepage (quick links, announcements, agenda, news, graduate statistics), Graduation book (Buku Wisuda) PDF archive grouped by year and period with download links (+13 more)

### Community 35 - "Accreditation Model & Migration"
Cohesion: 0.14
Nodes (18): AccreditationSchema, mongoose, { PERINGKAT, JENIS }, Accreditation, { formatTanggal }, isInstitution(), LembagaAkreditasi, norm() (+10 more)

### Community 36 - "Package Metadata"
Cohesion: 0.10
Nodes (20): description, keywords, license, main, name, version, @alpinejs/csp, cookie-parser (+12 more)

### Community 37 - "Content Utils (Excerpt & Sanitize)"
Cohesion: 0.14
Nodes (17): getBeritaDetail(), getPengumumanDetail(), kategoriSidebar(), { makeExcerpt }, mongoose, sanitize-html, looksLikeTagifyJson(), { makeExcerpt } (+9 more)

### Community 38 - "Site Settings & Cache"
Cohesion: 0.13
Nodes (15): addQuickLink(), deleteQuickLink(), editForm(), fs, getSingleton(), path, PUBLIC_DIR, SiteSetting (+7 more)

### Community 39 - "Book Upload Routes"
Cohesion: 0.13
Nodes (19): bookController, express, fileFilter(), fs, multer, path, { requireAuth, requireAdmin }, router (+11 more)

### Community 40 - "Unit Tests: Utils"
Cohesion: 0.12
Nodes (12): assert, f, test, assert, loginAttempts, test, assert, { groupByTingkat } (+4 more)

### Community 41 - "Modernizr (Referensi)"
Cohesion: 0.23
Nodes (18): a(), c(), d(), e(), f(), g(), h(), s() (+10 more)

### Community 42 - "Academic Document Controller"
Cohesion: 0.18
Nodes (15): AcademicDocument, create(), findOrThrow(), fs, Kategori, kategoriList(), path, PUBLIC_DIR (+7 more)

### Community 43 - "Accreditation Controller"
Cohesion: 0.18
Nodes (16): Accreditation, create(), findOrThrow(), fs, LembagaAkreditasi, path, { PERINGKAT, JENIS, accreditationStatus }, ProgramStudi (+8 more)

### Community 44 - "Calendar & Document Models"
Cohesion: 0.11
Nodes (14): AcademicCalendarSchema, KegiatanSchema, LampiranSchema, mongoose, { SEMESTER }, AcademicDocumentSchema, mongoose, AcademicCalendar (+6 more)

### Community 45 - "Kurikulum Controller"
Cohesion: 0.19
Nodes (14): create(), findOrThrow(), fs, Kurikulum, path, prodiList(), ProgramStudi, PUBLIC_DIR (+6 more)

### Community 46 - "Program Studi Controller"
Cohesion: 0.17
Nodes (13): create(), Faculty, facultyList(), findOrThrow(), fs, importCsv(), ProgramStudi, showCreate() (+5 more)

### Community 47 - "Master Data Models & Seeds"
Cohesion: 0.13
Nodes (13): KategoriSchema, mongoose, LembagaAkreditasiSchema, mongoose, Kategori, LEMBAGA, LembagaAkreditasi, run() (+5 more)

### Community 48 - "RPL Document Model & Migration"
Cohesion: 0.13
Nodes (15): mongoose, RplDocumentSchema, AcademicCalendar, AcademicDocument, Accreditation, { formatUkuranFile }, fs, Kurikulum (+7 more)

### Community 49 - "Bootstrap Tab Helper (Referensi)"
Cohesion: 0.13
Nodes (3): F, q, Ut

### Community 50 - "Lulusan Controller"
Cohesion: 0.17
Nodes (13): create(), { escapeRegex }, Faculty, findOrThrow(), fs, Lulusan, { parseLulusanCsv }, ProgramStudi (+5 more)

### Community 51 - "Unit Controller"
Cohesion: 0.17
Nodes (12): create(), findOrThrow(), fs, path, { processImage }, PUBLIC_DIR, removeUploaded(), showEdit() (+4 more)

### Community 52 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcrypt, cookie-parser, cors, dotenv, ejs, express, express-async-errors (+8 more)

### Community 53 - "Calendar Routes & Upload"
Cohesion: 0.12
Nodes (15): academicCalendarController, csvFilter(), express, fs, multer, path, pdfFilter(), { requireAuth, requireAdmin } (+7 more)

### Community 54 - "Qeducato Asset Placeholders"
Cohesion: 0.28
Nodes (15): Blog detail layout: article body figures, author avatar widget, and sidebar ad banner slot, Mobile sticky contact CTA: floating circular call icon for quick phone contact from any page, Placeholder asset convention: shipped template images are neutral gray placeholders or generic icons to be swapped with real institutional content, Qeducato education HTML template (visual reference source for akademik.unjani.ac.id), Video showcase section: template reserves multiple video/ media thumbnail slots (video-img variants), top-m-icon.png — red circular phone/call icon used as the sticky 'call now' button on mobile top bar, video-img2.png — blank gray placeholder image (video/media thumbnail slot variant 2), video-img3.png — blank gray placeholder image (video/media thumbnail slot variant 3) (+7 more)

### Community 55 - "Book Controller"
Cohesion: 0.19
Nodes (11): Book, create(), findOrThrow(), fs, path, PUBLIC_DIR, removeUploaded(), showEdit() (+3 more)

### Community 56 - "Graduation Book Controller"
Cohesion: 0.19
Nodes (11): create(), findOrThrow(), fs, GraduationBook, path, PUBLIC_DIR, removeUploaded(), showEdit() (+3 more)

### Community 57 - "Kategori Controller & Slug"
Cohesion: 0.19
Nodes (10): create(), findOrThrow(), JENIS_LABEL, Kategori, showEdit(), { uniqueSlug }, update(), { validate, schemas } (+2 more)

### Community 58 - "RPL Document Controller"
Cohesion: 0.19
Nodes (11): create(), findOrThrow(), fs, path, PUBLIC_DIR, removeUploaded(), RplDocument, showEdit() (+3 more)

### Community 59 - "User Management Controller"
Cohesion: 0.22
Nodes (12): countActiveSuperadmins(), create(), destroy(), findOrThrow(), { isSuperadmin }, resetPassword(), resetPasswordForm(), showEdit() (+4 more)

### Community 60 - "Icon Fonts & Doc Screenshots"
Cohesion: 0.15
Nodes (15): CSS Notice/Alert Icons (info & warning), Info Icon, Warning Icon, Template File Explorer Screenshot (mail.php highlighted), mail.php Code Screenshot, Qeducato Logo, PHP mail() Contact Form Handler, Qeducato Brand Identity (+7 more)

### Community 62 - "Blog Avatar Placeholders"
Cohesion: 0.24
Nodes (12): JPG/PNG dual-format asset pairing for large vs small renditions, qeducato blog template asset set (img/blog), blog_img01.jpg — blank gray rectangle placeholder image (approx 800x540) used as a blog post thumbnail/featured image in the qeducato template, blog_img01.png — blank gray rectangle placeholder image (approx 400x270), PNG duplicates of blog_img01 for smaller thumbnail rendering, blog_img02.jpg — blank gray rectangle placeholder image (approx 800x540) used as a blog post thumbnail/featured image in the qeducato template, blog_img02.png — blank gray rectangle placeholder image (approx 400x270), PNG duplicates of blog_img02 for smaller thumbnail rendering, blog_img03.jpg — blank gray rectangle placeholder image (approx 800x540) used as a blog post thumbnail/featured image in the qeducato template, blog_img03.png — blank gray rectangle placeholder image (approx 400x270), PNG duplicates of blog_img03 for smaller thumbnail rendering (+4 more)

### Community 63 - "Academic Profile Singleton"
Cohesion: 0.16
Nodes (9): AcademicProfile, DEFAULT_CONTENT, editForm(), getSingleton(), update(), { validate, schemas }, { validate, schemas }, AcademicProfileSchema (+1 more)

### Community 64 - "News Routes"
Cohesion: 0.14
Nodes (12): express, fs, multer, newsController, path, { requireAuth, requireAdmin }, router, { safeFilename, checkUploads, fileError, isAllowedImage, DOCUMENT_LIMITS } (+4 more)

### Community 65 - "Pengumuman Routes"
Cohesion: 0.14
Nodes (12): express, fs, multer, path, pengumumanController, { requireAuth, requireAdmin }, router, { safeFilename, checkUploads, fileError, isAllowedImage, DOCUMENT_LIMITS } (+4 more)

### Community 66 - "Qeducato Brand & SVE Icons"
Cohesion: 0.16
Nodes (8): Hero slider homepage pattern, Qeducato line-art icon system (SVE icons), sve-icon7.png — online learning icon, sve-icon8.png — open books icon, sve-icon9.png — gym fitness icon, f_logo.png (footer logo), Qeducato brand logo, Qeducato University HTML Template (shared shell: header, offcanvas, footer, jQuery/Slick/WOW stack)

### Community 67 - "Lulusan Routes"
Cohesion: 0.14
Nodes (13): multer, express, fileFilter(), fs, lulusanController, multer, path, { requireAuth, requireAdmin } (+5 more)

### Community 68 - "Image Processing (sharp)"
Cohesion: 0.18
Nodes (12): sharp, assert, fs, os, path, { processImage }, sharp, test (+4 more)

### Community 69 - "Portfolio Collage Placeholders"
Cohesion: 0.20
Nodes (14): About Section Collage Layout, Orange and Teal Duotone Accents, About Image 02 – Rounded Card Pair Placeholder, About Image 03 – Circle Collage Placeholder, About Image 04 – Square Card Placeholder, About Image 05 – Collage Grid Placeholder, Portfolio Gallery Image 01 Placeholder, Portfolio Gallery Image 02 Placeholder (+6 more)

### Community 70 - "Education Doodle Icons"
Cohesion: 0.16
Nodes (13): an-img-05: Atom Orbit Watermark Icon, Decorative Background Watermark Asset, an-img-06: Laptop with Graduation Cap Outline Icon, an-img-07: Campus Building Facade Outline, an-img-08: Open Book Outline Icon, an-img-09: School Building with Clock Outline Icon, Science Learning Motif, an-img-10: Atom Orbit Watermark Icon (Variant Crop) (+5 more)

### Community 72 - "jQuery FX Internals (Referensi)"
Cohesion: 0.15
Nodes (14): adoptValue(), ajaxConvert(), ajaxHandleResponses(), Animation(), camelCase(), createFxNow(), createTween(), defaultPrefilter() (+6 more)

### Community 73 - "Academic Document Routes"
Cohesion: 0.14
Nodes (13): academicDocumentController, express, fileFilter(), fs, multer, path, { requireAuth, requireAdmin }, router (+5 more)

### Community 74 - "Accreditation Routes"
Cohesion: 0.14
Nodes (13): accreditationController, express, fileFilter(), fs, multer, path, { requireAuth, requireAdmin }, router (+5 more)

### Community 75 - "Kurikulum Routes"
Cohesion: 0.14
Nodes (13): express, fileFilter(), fs, kurikulumController, multer, path, { requireAuth, requireAdmin }, router (+5 more)

### Community 76 - "Program Studi Routes"
Cohesion: 0.14
Nodes (12): express, fileFilter(), fs, multer, path, programStudiController, { requireAuth, requireSuperadmin }, router (+4 more)

### Community 77 - "RPL Routes"
Cohesion: 0.14
Nodes (13): express, fileFilter(), fs, multer, path, { requireAuth, requireAdmin }, router, rplDocumentController (+5 more)

### Community 78 - "Alpine Bundle Chunk 5"
Cohesion: 0.15
Nodes (13): ae(), C(), Ir(), jn(), Ln(), O(), ownKeys(), R() (+5 more)

### Community 79 - "Alpine Evaluation Core"
Cohesion: 0.15
Nodes (13): checkForDangerousKeywords(), effect(), evaluate(), F(), isDOMObject(), Jt(), Mt(), P() (+5 more)

### Community 80 - "Blog Inner Placeholders"
Cohesion: 0.19
Nodes (13): Blog Placeholder Image Pattern, Blog Thumbnail Asset Family, inner_b1.jpg - Gray Placeholder Image, inner_b2.jpg - Gray Placeholder Image, inner_b3.jpg - Gray Placeholder Image, inner_b4.jpg - Gray Placeholder Image, inner_b5.jpg - Light Gray Placeholder Image, inner_b6.jpg - Light Gray Placeholder Image (+5 more)

### Community 81 - "Class Thumbnail Placeholders"
Cohesion: 0.27
Nodes (13): class-12.jpg Gray Placeholder, Class Thumbnail Collection, class-2.jpg Gray Placeholder, Lazy-Load Gray Placeholder Pattern, class-3.jpg Gray Placeholder, class-4.jpg Gray Placeholder, class-5.jpg Gray Placeholder, class-6.jpg Gray Placeholder (+5 more)

### Community 84 - "Graduation Book Routes"
Cohesion: 0.15
Nodes (12): express, fs, graduationBookController, multer, path, { requireAuth, requireAdmin }, router, { safeFilename, checkUploads, fileError, isAllowedImage, DOCUMENT_LIMITS } (+4 more)

### Community 85 - "Site Settings Routes"
Cohesion: 0.15
Nodes (12): express, fs, multer, path, { requireAuth, requireSuperadmin }, router, { safeFilename, checkUploads, fileError, isAllowedImage, IMAGE_LIMITS }, siteSettingController (+4 more)

### Community 86 - "Staff Routes"
Cohesion: 0.15
Nodes (12): express, fileFilter(), fs, multer, path, { requireAuth, requireAdmin }, router, { safeFilename, checkUploads, fileError, IMAGE_LIMITS } (+4 more)

### Community 87 - "Build Assets Script"
Cohesion: 0.15
Nodes (11): BRAND_ICONS, brandDir, fontDir, fs, iconDir, ICONS, iconsOut, NM (+3 more)

### Community 88 - "Brand Logos & Class Photos"
Cohesion: 0.17
Nodes (12): Brand Logo 1 (b-logo1.png), Brand Logo 2 (b-logo2.png), Brand Logo 3 (b-logo3.png), Brand Logo 4 (b-logo4.png), Brand Logo 5 (b-logo5.png), Brand Logo 7 (b-logo7.png), Partner Brand Logo Strip Concept, Class Photo 10 (class-10.jpg) (+4 more)

### Community 89 - "Sizzle Selector Engine (Referensi)"
Cohesion: 0.20
Nodes (12): addCombinator(), condense(), createPositionalPseudo(), elementMatcher(), markFunction(), matcherFromGroupMatchers(), matcherFromTokens(), multipleContexts() (+4 more)

### Community 90 - "jQuery DOM Internals (Referensi)"
Cohesion: 0.20
Nodes (12): buildFragment(), buildParams(), cloneCopyEvent(), disableScript(), DOMEval(), domManip(), getAll(), isArrayLike() (+4 more)

### Community 91 - "Team Section Placeholders"
Cohesion: 0.29
Nodes (11): Hero slider curved divider design pattern, Gray placeholder portrait asset, qeducato HTML education template, slider_img03.png — curved-bottom shape graphic with orange accent line, team01.jpg — plain gray placeholder portrait tile, team02.jpg — plain gray placeholder portrait tile, team03.jpg — plain gray placeholder portrait tile, team04.jpg — plain gray placeholder portrait tile (+3 more)

### Community 92 - "Kurikulum & Prodi Models"
Cohesion: 0.20
Nodes (8): KurikulumSchema, mongoose, mongoose, ProgramStudiSchema, Kurikulum, norm(), ProgramStudi, run()

### Community 93 - "Alpine Bundle Chunk 6"
Cohesion: 0.27
Nodes (10): Bt(), Ei(), find(), Ft(), Mn(), ne(), Qr(), ti() (+2 more)

### Community 94 - "imagesLoaded Plugin (Referensi)"
Cohesion: 0.24
Nodes (4): i(), o(), r(), s()

### Community 95 - "Migration Runner"
Cohesion: 0.18
Nodes (9): APPLY, backupFile, backups, filter, fs, migrations, mongoose, path (+1 more)

### Community 96 - "404 & Admission Illustrations"
Cohesion: 0.27
Nodes (10): 404 error page design, 404 not found illustration, Admission page design, Admission section background, Drum animation illustration, Education visual identity, Page background decoration, School building outline (+2 more)

### Community 97 - "Admin Content Controller"
Cohesion: 0.20
Nodes (8): fs, Kategori, path, { processImage }, PUBLIC_DIR, { sanitizeHtml }, { uniqueSlug }, { validate, schemas }

### Community 98 - "NPM Scripts"
Cohesion: 0.20
Nodes (10): scripts, build, build:assets, build:css, build:manifest, dev, dev:css, migrate (+2 more)

### Community 99 - "Pengumuman View Tests"
Cohesion: 0.20
Nodes (7): ejs, assert, ejs, item, kategori, path, test

### Community 100 - "UNJANI Branding & Hero Assets"
Cohesion: 0.22
Nodes (4): public/design/pimpinan_dan_staf_bidang_akademik_unjani.png, Hubungi Biro Administrasi Akademik service contact block (WhatsApp Helpdesk, office hours, Gedung Rektorat L1 Kampus Cimahi), Filterable staff card grid with role category tabs, UNJANI Cimahi institutional brand identity (green military-heritage palette, pentagon coat-of-arms)

### Community 101 - "Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, @alpinejs/csp, @fontsource/plus-jakarta-sans, @fontsource/source-serif-4, @material-symbols/svg-400, nodemon, simple-icons, tailwindcss (+1 more)

### Community 102 - "Event Section Images"
Cohesion: 0.22
Nodes (9): Event Section Imagery, Event Image 01, Event Image 02, Event Image 03, Event Image 04, Event Image 1 JPG, Event Image 2 JPG, Event Image 3 JPG (+1 more)

### Community 103 - "Kawaii Doodle Assets"
Cohesion: 0.28
Nodes (9): Yellow Squiggle Doodle (an-img-15), Blue Outlined Car Doodle (an-img-16), Pink Star Scribble Doodle (an-img-17), Smiling Kawaii Sun Doodle (an-img-18), Star Doodle with Yellow Shadow (an-img-19), Blank/Transparent Animation Image (an-img-20), Decorative Animated Doodle Asset Pattern, Playful Kawaii Design Language (+1 more)

### Community 104 - "Course Card Placeholders"
Cohesion: 0.25
Nodes (9): Contact Section Gray Placeholder Image, Placeholder Graphics in QEducato Template Assets, Course Card Placeholder Image 1, Course Card Thumbnail Placeholder Pattern, Course Card Placeholder Image 2, Course Card Placeholder Image 3, Course Card Placeholder Image 4, Course Card Placeholder Image 5 (+1 more)

### Community 106 - "SEO Sitemap Controller"
Cohesion: 0.36
Nodes (7): News, originOf(), Pengumuman, robotsTxt(), sitemap(), STATIC_PATHS, xmlEscape()

### Community 107 - "Admin Sidebar Layout"
Cohesion: 0.25
Nodes (7): me(), On(), vi(), We(), X(), activeGroup, sidebar

### Community 108 - "Login Attempt Limiter"
Cohesion: 0.46
Nodes (7): attempts, captchaRequired(), countFor(), keysFor(), prune(), recordFailure(), reset()

### Community 109 - "Public Layout Components"
Cohesion: 0.25
Nodes (5): isError, jelajahi, phoneTo, quickLinksValid, socials

### Community 110 - "Testimonial Placeholders"
Cohesion: 0.48
Nodes (7): Neutral gray-circle avatar placeholder, Five-star review rating visual, Qeducato template testimonial widget asset set, Qeducato review icon (five gold stars), Qeducato testimonial avatar placeholder (gray circle), Qeducato testimonial avatar placeholder variant 02 (gray circle), Qeducato testimonial avatar placeholder variant 03 (gray circle)

### Community 111 - "Regex Utils & Tests"
Cohesion: 0.33
Nodes (5): list(), assert, { escapeRegex }, test, escapeRegex()

### Community 112 - "Team Avatar Circles"
Cohesion: 0.29
Nodes (7): Circular avatar crop style for team and testimonials, team09.png circular placeholder, team10.png circular placeholder, team11.png circular placeholder, team12.png circular placeholder, c_01.png avatar placeholder, c_02.png avatar placeholder

### Community 114 - "Lulusan CSV Import"
Cohesion: 0.47
Nodes (5): importCsv(), detectSeparator(), parseLulusanCsv(), splitLine(), TEMPLATE_HEADER

### Community 115 - "Testimonial Stars & Backgrounds"
Cohesion: 0.40
Nodes (6): Star Rating Indicator, Testimonial Section, Star Rating Icon (Four Gold Stars), Testimonial Avatar Placeholder (Circular), Testimonial Section Background Variant 2, Testimonial Section Background

### Community 116 - "Contact Utils & Tests"
Cohesion: 0.40
Nodes (4): assert, { phoneLink }, test, phoneLink()

### Community 117 - "Video Embed Utils & Tests"
Cohesion: 0.40
Nodes (4): assert, test, { videoEmbedUrl }, videoEmbedUrl()

### Community 118 - "Contact Icons"
Cohesion: 0.40
Nodes (5): Contact Information Iconography (Email and Phone), Schedule/Duration Indicator (Course Time Info), clock-icon.png - Teal Clock with Circular Arrows (Schedule/Duration), mailing.png - Coral Envelope with @ Symbol (Email Contact Icon), phone-call.png - Coral Phone Handset with Circular Arrows (Phone Contact Icon)

### Community 120 - "Design Mockup: Akreditasi Admin"
Cohesion: 0.40
Nodes (4): public/design/tambah_akreditasi_admin_bidang_akademik_unjani.png, Auto-calculated accreditation validity status with 6-month pre-expiry QA notification, Drag-and-drop certificate PDF upload zone (max 5MB, PDF/A check, quality-repository ingest), Inline date-range validation field pattern with invalid state styling

### Community 121 - "Font Awesome Webfonts"
Cohesion: 0.60
Nodes (5): Font Awesome brands icon font, Font Awesome regular icon font, Font Awesome solid icon font, Icon system, Dripicons v2 icon font

### Community 122 - "Contact Chip Icons"
Cohesion: 0.60
Nodes (4): Contact Phone Icon, Contact Information Channel (Phone/Email/Location), Contact Email Icon, Contact Location Icon

### Community 123 - "jQuery CSS Utilities (Referensi)"
Cohesion: 0.40
Nodes (5): boxModelAdjustment(), curCSS(), getWidthOrHeight(), manipulationTarget(), nodeName()

### Community 124 - "macOS AppleDouble Artifacts"
Cohesion: 0.50
Nodes (4): macOS AppleDouble metadata artifact in asset tree, ._team01.png — macOS AppleDouble resource-fork metadata, ._team02.png — macOS AppleDouble resource-fork metadata, ._team03.png — macOS AppleDouble resource-fork metadata

### Community 125 - "Footer & Feature Backgrounds"
Cohesion: 0.50
Nodes (4): Dark Navy Footer Theme, Solid Teal Section Backdrop, Feature Section Background (feature-bg), Footer Background (footer-bg)

### Community 126 - "Feature Icons (White)"
Cohesion: 0.50
Nodes (3): fea-icon01.png - Feature Icon 1 (Blank/White on Transparent), fea-icon02.png - Feature Icon 2 (Blank/White on Transparent), fea-icon03.png - Feature Icon 3 (Blank/White on Transparent)

### Community 127 - "Slider Decorative Shapes"
Cohesion: 0.50
Nodes (4): Hero Slider Decorative Shapes, Slider Shape 02 (White Decorative Shape), Slider Shape 03 (Pink Heart Balloon Illustration), Slider Shape 04 (White Decorative Shape)

### Community 128 - "How-It-Works Illustrations"
Cohesion: 0.50
Nodes (4): How-It-Works Steps Section, Steps Illustration Variant 2, Steps Illustration Variant 3, Steps Illustration (Step Image)

### Community 129 - "Docs Navigation Script"
Cohesion: 0.83
Nodes (3): activateNav(), goTo(), hashchange()

### Community 130 - "CTA Section Backgrounds"
Cohesion: 0.50
Nodes (4): School Building Branded Background (bdrc-bg), Call-To-Action Solid Navy Background (call-bg), Call-To-Action Section Design, School Building Brand Imagery for Academic Identity

### Community 131 - "Blog Backgrounds"
Cohesion: 0.67
Nodes (3): Blog Background — Faint Marble Texture (blog_bg2), Blog Background — Food Tablet Scene (blog_bg), Blog Section Visual Design

### Community 132 - "Team Placeholders (06-08)"
Cohesion: 0.50
Nodes (4): Team section gray placeholder image pattern, team06.png placeholder, team07.png placeholder, team08.png placeholder

### Community 135 - "jQuery Async Helpers (Referensi)"
Cohesion: 0.50
Nodes (4): expectSync(), leverageNative(), returnTrue(), safeActiveElement()

### Community 136 - "find-skills Notes"
Cohesion: 1.00
Nodes (3): find-skills Skill Instructions, Skills CLI (npx skills), skills.sh Leaderboard

### Community 137 - "Course Category Icons"
Cohesion: 0.67
Nodes (3): Course Category and Book Symbolism, c_d01.png - Teal Category Grid Icon in Light Circle, cou-icon.png - Light Pink Open Book (Course) Icon

### Community 138 - "Blockquote Icons"
Cohesion: 1.00
Nodes (3): Quote/Testimonial Accent Symbol, blockquote_d.png - Dark Navy Opening Quote Mark Icon, blockquote.png - Light Pink Opening Quote Mark Icon

### Community 139 - "Video Play Buttons"
Cohesion: 1.00
Nodes (3): Video Play Button Interaction, Play Button Variant (play-button2), Play Button (play-button)

### Community 142 - "CTA Image Assets"
Cohesion: 1.00
Nodes (3): Call To Action Section Background, CTA Background Variant Image, CTA Background Image

### Community 144 - "Event & FAQ Images"
Cohesion: 0.67
Nodes (3): Event Section Image (evn-img-5), Event Section Image (evn-img-6), FAQ Section Image (faq-img)

### Community 145 - "E-learning Icons"
Cohesion: 0.67
Nodes (3): Online learning / e-learning platform, sve-icon1 - coral line icon of a laptop with graduation cap and tassel (online education / e-learning icon), sve-icon4.png - blank/white image; no visible artwork, purpose unclear

### Community 146 - "jQuery Deferred (Referensi)"
Cohesion: 0.67
Nodes (3): Identity(), resolve(), Thrower()

## Ambiguous Edges - Review These
- `Kalender Akademik Mobile` → `Lambang UNJANI SVG (perisai generik)`  [AMBIGUOUS]
  docs/Design/kalender_akademik_mobile_bidang_akademik_unjani/code.html · relation: references
- `Blank/Transparent Animation Image (an-img-20)` → `Decorative Animated Doodle Asset Pattern`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/an-img-20.png · relation: conceptually_related_to
- `Contact Section Gray Placeholder Image` → `Course Card Placeholder Image 1`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/contact-img.png · relation: semantically_similar_to
- `CTA Background Image` → `Call To Action Section Background`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/cta_bg.png · relation: references
- `CTA Background Variant Image` → `Call To Action Section Background`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/cta_bg02.png · relation: references
- `Event Image 01` → `Event Section Imagery`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/evn-img-01.png · relation: references
- `Event Image 02` → `Event Section Imagery`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/evn-img-02.png · relation: references
- `Event Image 03` → `Event Section Imagery`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/evn-img-03.png · relation: references
- `Event Image 04` → `Event Section Imagery`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/evn-img-04.png · relation: references
- `Event Image 1 JPG` → `Event Section Imagery`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/evn-img-1.jpg · relation: references
- `Event Image 2 JPG` → `Event Section Imagery`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/evn-img-2.jpg · relation: references
- `Event Image 3 JPG` → `Event Section Imagery`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/evn-img-3.jpg · relation: references
- `Event Image 4 JPG` → `Event Section Imagery`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/evn-img-4.jpg · relation: references
- `Play Button (play-button)` → `Video Play Button Interaction`  [AMBIGUOUS]
  Referensi/qeducato/img/bg/play-button.png · relation: references
- `s-blogimg-01.png - Small White Square Image` → `Neutral Gray Fill Aesthetic`  [AMBIGUOUS]
  Referensi/qeducato/img/blog/s-blogimg-01.png · relation: conceptually_related_to
- `Brand Logo 2 (b-logo2.png)` → `Grayscale Placeholder Image`  [AMBIGUOUS]
  Referensi/qeducato/img/brand/b-logo2.png · relation: conceptually_related_to
- `Class Photo 10 (class-10.jpg)` → `Grayscale Placeholder Image`  [AMBIGUOUS]
  Referensi/qeducato/img/class/class-10.jpg · relation: conceptually_related_to
- `Class Thumbnail Collection` → `About Section Visual`  [AMBIGUOUS]
  Referensi/qeducato/img/features/about_img.png · relation: conceptually_related_to
- `Portfolio Gallery Image 01 Placeholder` → `Rounded Corner Card Style`  [AMBIGUOUS]
  Referensi/qeducato/img/gallery/protfolio-img01.jpg · relation: conceptually_related_to
- `send-mail.png - blank/white image; filename suggests a send-mail pictogram but no visible artwork` → `Outgoing mail (AMBIGUOUS - image renders blank)`  [AMBIGUOUS]
  Referensi/qeducato/img/icon/send-mail.png · relation: references
- `sve-icon1 - coral line icon of a laptop with graduation cap and tassel (online education / e-learning icon)` → `sve-icon4.png - blank/white image; no visible artwork, purpose unclear`  [AMBIGUOUS]
  Referensi/qeducato/img/icon/sve-icon4.png · relation: conceptually_related_to
- `sve-icon5.png` → `Qeducato line-art icon system (SVE icons)`  [AMBIGUOUS]
  Referensi/qeducato/img/icon/sve-icon5.png · relation: references
- `sve-icon6.png` → `Qeducato line-art icon system (SVE icons)`  [AMBIGUOUS]
  Referensi/qeducato/img/icon/sve-icon6.png · relation: references
- `slider_bg_01.png` → `Hero slider homepage pattern`  [AMBIGUOUS]
  Referensi/qeducato/img/slider/slider_bg_01.png · relation: references
- `slider_img02.png` → `Hero slider homepage pattern`  [AMBIGUOUS]
  Referensi/qeducato/img/slider/slider_img02.png · relation: references
- `team01.jpg — plain gray placeholder portrait tile` → `Gray placeholder portrait asset`  [AMBIGUOUS]
  Referensi/qeducato/img/team/team01.jpg · relation: conceptually_related_to
- `team02.jpg — plain gray placeholder portrait tile` → `Gray placeholder portrait asset`  [AMBIGUOUS]
  Referensi/qeducato/img/team/team02.jpg · relation: conceptually_related_to
- `team03.jpg — plain gray placeholder portrait tile` → `Gray placeholder portrait asset`  [AMBIGUOUS]
  Referensi/qeducato/img/team/team03.jpg · relation: conceptually_related_to
- `team04.jpg — plain gray placeholder portrait tile` → `Gray placeholder portrait asset`  [AMBIGUOUS]
  Referensi/qeducato/img/team/team04.jpg · relation: conceptually_related_to
- `team05.jpg — plain gray placeholder portrait tile` → `Gray placeholder portrait asset`  [AMBIGUOUS]
  Referensi/qeducato/img/team/team05.jpg · relation: conceptually_related_to
- `team05.png — plain gray placeholder portrait tile (PNG variant)` → `Gray placeholder portrait asset`  [AMBIGUOUS]
  Referensi/qeducato/img/team/team05.png · relation: conceptually_related_to

## Knowledge Gaps
- **199 isolated node(s):** `express-async-errors`, `@alpinejs/csp`, `@fontsource/plus-jakarta-sans`, `@fontsource/source-serif-4`, `@material-symbols/svg-400` (+194 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1178 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `tmp()` connect `jQuery Core (Referensi)` to `Auth Routes & Upload Utils`?**
  _High betweenness centrality (0.269) - this node is a cross-community bridge._
- **What connects `express-async-errors`, `@alpinejs/csp`, `@fontsource/plus-jakarta-sans` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin & Landing Views` be split into smaller, more focused modules?**
  _Cohesion score 0.06022408963585434 - nodes in this community are weakly interconnected._
- **Should `Server Bootstrap & Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.031746031746031744 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Kalender Akademik Mobile` and `Lambang UNJANI SVG (perisai generik)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Blank/Transparent Animation Image (an-img-20)` and `Decorative Animated Doodle Asset Pattern`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Contact Section Gray Placeholder Image` and `Course Card Placeholder Image 1`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._