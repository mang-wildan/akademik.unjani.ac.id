// Single source for the public and admin menus (SRS FR-G-01, FR-AD-02).
// `roles` limits an admin item to those roles; without it every admin sees it.

exports.publicNav = [
  { label: 'Beranda', href: '/' },
  {
    label: 'Profil',
    children: [
      { label: 'Profil Bidang Akademik', href: '/profil' },
      { label: 'Struktur Organisasi', href: '/struktur-organisasi' },
      { label: 'Pimpinan & Staf', href: '/pimpinan-dan-staff' },
    ],
  },
  {
    label: 'Akademik',
    children: [
      { label: 'Kalender Akademik', href: '/kalender-akademik' },
      { label: 'Kurikulum', href: '/kurikulum' },
      { label: 'Dokumen Akademik', href: '/dokumen-akademik' },
      { label: 'Rekognisi Pembelajaran Lampau (RPL)', href: '/rpl' },
    ],
  },
  { label: 'Akreditasi', href: '/akreditasi' },
  {
    label: 'Publikasi',
    children: [
      { label: 'Berita', href: '/berita' },
      { label: 'Pengumuman', href: '/pengumuman' },
      { label: 'Buku', href: '/buku' },
      { label: 'Buku Wisuda', href: '/buku-wisuda' },
    ],
  },
];

// The one call-to-action button in the public navbar (F7 R1).
exports.publicCta = { label: 'Dokumen & Formulir', href: '/dokumen-akademik', icon: 'download' };

const SUPERADMIN = ['superadmin', 'admin']; // 'admin' = role lama sebelum migrasi F2

exports.adminNav = [
  { group: 'Ringkasan', items: [{ label: 'Dasbor', href: '/admin/dashboard', icon: 'dashboard' }] },
  {
    group: 'Konten',
    items: [
      { label: 'Berita', href: '/admin/news', icon: 'newspaper' },
      { label: 'Pengumuman', href: '/admin/pengumuman', icon: 'campaign' },
    ],
  },
  {
    group: 'Akademik',
    items: [
      { label: 'Kalender Akademik', href: '/admin/academic-calendars', icon: 'event' },
      { label: 'Kurikulum', href: '/admin/kurikulum', icon: 'menu_book' },
      { label: 'Dokumen Akademik', href: '/admin/academic-documents', icon: 'description' },
      { label: 'RPL', href: '/admin/rpl-documents', icon: 'verified' },
      { label: 'Akreditasi', href: '/admin/accreditations', icon: 'workspace_premium' },
    ],
  },
  {
    group: 'Publikasi',
    items: [
      { label: 'Buku', href: '/admin/books', icon: 'library_books' },
      { label: 'Buku Wisuda', href: '/admin/graduation-books', icon: 'school' },
      { label: 'Data Lulusan', href: '/admin/lulusan', icon: 'groups' },
    ],
  },
  {
    group: 'Organisasi',
    items: [
      { label: 'Pimpinan & Staf', href: '/admin/staff', icon: 'person' },
      { label: 'Unit', href: '/admin/unit', icon: 'apartment' },
      { label: 'Profil Bidang', href: '/admin/profil-akademik', icon: 'info' },
    ],
  },
  {
    group: 'Pengaturan',
    items: [
      { label: 'Pengaturan Situs', href: '/admin/settings', icon: 'settings', roles: SUPERADMIN },
      { label: 'Fakultas', href: '/admin/faculties', icon: 'apartment', roles: SUPERADMIN },
      { label: 'Program Studi', href: '/admin/program-studi', icon: 'school', roles: SUPERADMIN },
    ],
  },
];

exports.canSee = (item, user) => !item.roles || Boolean(user && item.roles.includes(user.role));

// '/' only matches itself; other links also match their sub-pages.
exports.isActive = (href, path) =>
  href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
