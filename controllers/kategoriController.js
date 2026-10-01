// Admin CRUD untuk Kategori (FR-M-11) -- dipakai Pengumuman, Berita, dan
// Dokumen Akademik untuk filter publik. `jenis` mengunci kategori ke salah
// satu dari ketiganya; satu halaman dengan tab jenis, bukan tiga menu
// terpisah. Slug dibuat otomatis dari nama (utils/slug.js), unik per jenis
// (lihat index unik di models/Kategori.js: { jenis, slug }).
const Kategori = require('../models/Kategori');
const { validate, schemas } = require('../validators');
const { uniqueSlug } = require('../utils/slug');

const JENIS_LABEL = { pengumuman: 'Pengumuman', dokumen: 'Dokumen Akademik', berita: 'Berita' };

exports.list = async (req, res) => {
  const jenis = ['pengumuman', 'dokumen', 'berita'].includes(req.query.jenis) ? req.query.jenis : 'pengumuman';
  const items = await Kategori.find({ jenis }).sort({ urutan: 1, nama: 1 }).lean();
  res.renderPage('admin/kategori/list', { title: 'Kategori', items, jenis, jenisLabel: JENIS_LABEL }, 'layouts/admin');
};

exports.showCreate = (req, res) => {
  const jenis = ['pengumuman', 'dokumen', 'berita'].includes(req.query.jenis) ? req.query.jenis : 'pengumuman';
  res.renderPage('admin/kategori/form', { title: 'Tambah Kategori', mode: 'create', values: { jenis, isActive: true }, errors: {}, jenisLabel: JENIS_LABEL }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.kategori, req.body);
  if (!ok) {
    return res.renderPage('admin/kategori/form', { title: 'Tambah Kategori', mode: 'create', values: req.body, errors, jenisLabel: JENIS_LABEL }, 'layouts/admin');
  }
  await Kategori.create({ ...data, slug: await uniqueSlug(Kategori, data.nama), createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/kategori?jenis=${data.jenis}&success=${encodeURIComponent('Kategori berhasil ditambahkan.')}`);
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
  res.renderPage('admin/kategori/form', { title: 'Ubah Kategori', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, jenisLabel: JENIS_LABEL }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.kategori, req.body);
  if (!ok) {
    return res.renderPage('admin/kategori/form', { title: 'Ubah Kategori', mode: 'edit', item: item.toObject(), values: req.body, errors, jenisLabel: JENIS_LABEL }, 'layouts/admin');
  }
  if (data.nama !== item.nama) item.slug = await uniqueSlug(Kategori, data.nama, item._id);
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/kategori?jenis=${data.jenis}&success=${encodeURIComponent('Kategori berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  const item = await Kategori.findById(req.params.id);
  await Kategori.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/kategori?jenis=${item?.jenis || 'pengumuman'}&success=${encodeURIComponent('Kategori berhasil dihapus.')}`);
};
