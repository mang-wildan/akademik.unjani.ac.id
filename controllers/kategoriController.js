// Admin CRUD untuk Kategori (FR-M-11) -- dipakai Pengumuman, Berita, dan
// Dokumen Akademik untuk filter publik. `jenis` mengunci kategori ke salah
// satu dari ketiganya; satu halaman dengan tab jenis, bukan tiga menu
// terpisah. Slug dibuat otomatis dari nama (utils/slug.js), unik per jenis
// (lihat index unik di models/Kategori.js: { jenis, slug }).
const Kategori = require('../models/Kategori');
const { validate, schemas } = require('../validators');
const { uniqueSlug } = require('../utils/slug');
const { parseListQuery } = require('../utils/listQuery');
const { bulkHandler } = require('../utils/bulk');

const ADMIN_LAYOUT = 'layouts/admin-v2';
const JENIS_LABEL = { pengumuman: 'Pengumuman', dokumen: 'Dokumen Akademik', berita: 'Berita' };
const LIST_QUERY = {
  sortable: ['nama', 'urutan', 'updatedAt'],
  defaultSort: { urutan: 1, nama: 1 },
  filters: { jenis: Object.keys(JENIS_LABEL), isActive: [true, false] },
  searchFields: ['nama'],
};
const withJenis = query => ({ ...query, jenis: Object.keys(JENIS_LABEL).includes(query.jenis) ? query.jenis : 'pengumuman' });
const success = (req, res, jenis, message) => req.query.partial === '1'
  ? res.json({ ok: true, message })
  : res.redirect(303, `/admin/kategori?jenis=${jenis}&success=${encodeURIComponent(message)}`);
const formLocals = (mode, values, errors = {}, item) => ({
  title: mode === 'edit' ? 'Ubah Kategori' : 'Tambah Kategori', mode, values, errors, item, jenisLabel: JENIS_LABEL,
});

exports.list = async (req, res) => {
  const { filter, sort, page, limit, state } = parseListQuery(withJenis(req.query), LIST_QUERY);
  const total = await Kategori.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const items = await Kategori.find(filter).sort(sort).skip((currentPage - 1) * limit).limit(limit).lean();
  res.renderPage('admin/kategori/list', {
    title: 'Kategori', items, jenisLabel: JENIS_LABEL, state: { ...state, page: String(currentPage) },
    pagination: { page: currentPage, totalPages, total, pageSize: limit },
  }, ADMIN_LAYOUT);
};

exports.showCreate = (req, res) => {
  const { jenis } = withJenis(req.query);
  res.renderPage('admin/kategori/form', formLocals('create', { jenis, isActive: true }), ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.kategori, req.body);
  if (!ok) {
    return res.status(422).renderPage('admin/kategori/form', formLocals('create', req.body, errors), ADMIN_LAYOUT);
  }
  await Kategori.create({ ...data, slug: await uniqueSlug(Kategori, data.nama), createdBy: req.user._id, updatedBy: req.user._id });
  success(req, res, data.jenis, 'Kategori berhasil ditambahkan.');
};

const findOrThrow = async id => {
  const item = await Kategori.findById(id);
  if (!item) {
    const err = new Error('Kategori tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/kategori/form', formLocals('edit', item.toObject(), {}, item.toObject()), ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.kategori, req.body);
  if (!ok) {
    return res.status(422).renderPage('admin/kategori/form', formLocals('edit', req.body, errors, item.toObject()), ADMIN_LAYOUT);
  }
  if (data.nama !== item.nama) item.slug = await uniqueSlug(Kategori, data.nama, item._id);
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  success(req, res, data.jenis, 'Kategori berhasil diperbarui.');
};

exports.destroy = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  await Kategori.findByIdAndDelete(req.params.id);
  success(req, res, item.jenis, 'Kategori berhasil dihapus.');
};

exports.bulk = (req, res) => bulkHandler({
  Model: Kategori, basePath: 'kategori', noun: 'kategori', listQuery: LIST_QUERY,
  baseFilter: { jenis: withJenis(req.body).jenis },
  actions: {
    activate: { label: 'diaktifkan', update: { isActive: true, updatedBy: req.user._id } },
    deactivate: { label: 'dinonaktifkan', update: { isActive: false, updatedBy: req.user._id } },
    delete: { label: 'dihapus', run: async ids => (await Kategori.deleteMany({ _id: { $in: ids } })).deletedCount },
  },
})(req, res);
