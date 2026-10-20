// Development-only pages for checking the design system. Mounted only when
// NODE_ENV is not "production" (see server.js).
const express = require('express');
const strictCsp = require('../middleware/strictCsp');
const adminPrefs = require('../middleware/adminPrefs');
const { parseListQuery } = require('../utils/listQuery');

// Data fiktif untuk tabel di /dev/admin-v2: 60 pengumuman, disaring di memori
// dengan parseListQuery yang sama seperti controller sungguhan.
const KATEGORI = [{ value: 'akademik', label: 'Akademik' }, { value: 'wisuda', label: 'Wisuda' }, { value: 'umum', label: 'Umum' }];
const CONTOH = Array.from({ length: 60 }, (_, i) => ({
  _id: `contoh${String(i + 1).padStart(2, '0')}`,
  title: `${['Jadwal registrasi semester ganjil 2026/2027', 'Perubahan kalender akademik', 'Pendaftaran wisuda periode II', 'Libur nasional dan cuti bersama'][i % 4]} #${i + 1}`,
  status: i % 3 ? 'published' : 'draft',
  kategori: KATEGORI[i % 3].value,
  updatedAt: new Date(Date.UTC(2026, 9, 19) - i * 36e5 * 20),
}));
const contohDaftar = query => {
  const list = parseListQuery(query, {
    sortable: ['title', 'updatedAt'],
    filters: { status: ['published', 'draft'], kategori: KATEGORI.map(k => k.value) },
    pageSize: 15,
  });
  const re = list.filter.$or ? new RegExp(list.filter.$or[0].title.$regex, 'i') : null;
  const [[field, dir]] = Object.entries(list.sort);
  const matched = CONTOH
    .filter(item => (!list.filter.status || item.status === list.filter.status) && (!list.filter.kategori || item.kategori === list.filter.kategori) && (!re || re.test(item.title)))
    .sort((a, b) => (a[field] > b[field] ? dir : a[field] < b[field] ? -dir : 0));
  const totalPages = Math.max(Math.ceil(matched.length / list.limit), 1);
  const page = Math.min(list.page, totalPages);
  return { ...list, page, items: matched.slice((page - 1) * list.limit, page * list.limit), total: matched.length, totalPages, kategoriOptions: KATEGORI };
};

const router = express.Router();
router.use(strictCsp);

router.get('/komponen', (req, res) =>
  res.renderPage('dev/komponen', { title: 'Katalog Komponen', description: 'Katalog komponen design system.' })
);

// Simulates a slow save so the busy-form spinner (public/js/app.js) is visible while testing.
router.post('/komponen', (req, res) => {
  setTimeout(() => res.redirect('/dev/komponen?success=Contoh%20tersimpan'), 1500);
});

router.get('/admin', (_req, res) => res.redirect('/dev/admin-v2'));

// Shell admin v2 tanpa login. Cookie preferensi berlaku di Path=/admin, jadi di
// sini tema/sidebar bisa dipaksa lewat ?theme=dark&sidebar=collapsed.
const shellLocals = (req, res) => ({
  path: '/admin/pengumuman',
  user: res.locals.user || { name: 'Admin Contoh', role: 'superadmin' },
  adminTheme: ['light', 'dark', 'system'].includes(req.query.theme) ? req.query.theme : res.locals.adminTheme,
  adminSidebar: ['open', 'collapsed'].includes(req.query.sidebar) ? req.query.sidebar : res.locals.adminSidebar,
});

router.get('/admin-v2', adminPrefs, (req, res) =>
  res.renderPage('dev/admin-v2', { ...shellLocals(req, res), title: 'Kelola Pengumuman', list: contohDaftar(req.query) }, 'layouts/admin-v2')
);

// Form contoh untuk slide-over (F1-13): halaman penuh tanpa JS, isi panel dengan ?partial=1.
// Sukses → JSON saat partial, redirect + ?success= tanpa JS; gagal validasi → 422 + form.
const formContoh = (req, res, { item, values = item, errors = {}, status = 200 }) =>
  res.status(status).renderPage(
    'dev/admin-v2-form',
    {
      ...shellLocals(req, res),
      title: item ? 'Ubah pengumuman contoh' : 'Tambah pengumuman contoh',
      isNew: !item,
      action: item ? `/dev/admin-v2/contoh/${item._id}` : '/dev/admin-v2/contoh',
      values: values || { title: '', status: 'draft', kategori: 'akademik' },
      errors,
      kategoriOptions: KATEGORI,
    },
    'layouts/admin-v2'
  );
const cariContoh = (req, res, next) => {
  req.contoh = CONTOH.find(item => item._id === req.params.id);
  return req.contoh ? next() : res.status(404).send('Pengumuman contoh tidak ditemukan.');
};
const simpanContoh = (req, res) => {
  const item = req.contoh;
  const values = {
    title: String(req.body.title || '').trim(),
    status: ['published', 'draft'].includes(req.body.status) ? req.body.status : 'draft',
    kategori: KATEGORI.some(k => k.value === req.body.kategori) ? req.body.kategori : 'akademik',
  };
  const errors = {};
  if (!values.title) errors.title = 'Judul wajib diisi.';
  else if (values.title.length > 120) errors.title = 'Judul maksimal 120 karakter.';
  if (Object.keys(errors).length) return formContoh(req, res, { item, values, errors, status: 422 });
  if (item) Object.assign(item, values, { updatedAt: new Date() });
  else CONTOH.unshift({ _id: `contoh${Date.now()}`, ...values, updatedAt: new Date() });
  const message = item ? 'Pengumuman contoh disimpan' : 'Pengumuman contoh ditambahkan';
  if (req.query.partial === '1') return res.json({ ok: true, message });
  return res.redirect(303, `/dev/admin-v2?success=${encodeURIComponent(message)}`);
};
router.get('/admin-v2/contoh/new', adminPrefs, (req, res) => formContoh(req, res, {}));
router.post('/admin-v2/contoh', adminPrefs, simpanContoh);
router.get('/admin-v2/contoh/:id/edit', adminPrefs, cariContoh, (req, res) => formContoh(req, res, { item: req.contoh }));
router.post('/admin-v2/contoh/:id', adminPrefs, cariContoh, simpanContoh);

module.exports = router;
