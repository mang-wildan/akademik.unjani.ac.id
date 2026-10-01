// Admin CRUD untuk Unit (FR-M-10), ditampilkan di halaman Profil publik.
const fs = require('fs/promises');
const path = require('path');
const Unit = require('../models/Unit');
const { validate, schemas } = require('../validators');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  if (req.file) await fs.unlink(req.file.path).catch(() => {});
};

exports.list = async (req, res) => {
  const items = await Unit.find().sort({ createdAt: -1 }).lean();
  res.renderPage('admin/unit/list', { title: 'Unit', items }, 'layouts/admin');
};

exports.showCreate = (req, res) => {
  res.renderPage('admin/unit/form', { title: 'Tambah Unit', mode: 'create', values: {}, errors: {} }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.unit, req.body);
  const fieldErrors = errors || {};
  if (!req.file) fieldErrors.img = 'Gambar wajib diisi.';
  if (!ok || fieldErrors.img) {
    await removeUploaded(req);
    return res.renderPage('admin/unit/form', { title: 'Tambah Unit', mode: 'create', values: req.body, errors: fieldErrors }, 'layouts/admin');
  }
  await Unit.create({ ...data, img: toPublicUrl(req.file.path), createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/unit?success=${encodeURIComponent('Unit berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await Unit.findById(id);
  if (!item) {
    const err = new Error('Unit tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/unit/form', { title: 'Ubah Unit', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.unit, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.renderPage('admin/unit/form', { title: 'Ubah Unit', mode: 'edit', item: item.toObject(), values: req.body, errors }, 'layouts/admin');
  }
  if (req.file) item.img = toPublicUrl(req.file.path);
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/unit?success=${encodeURIComponent('Unit berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await Unit.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/unit?success=${encodeURIComponent('Unit berhasil dihapus.')}`);
};
