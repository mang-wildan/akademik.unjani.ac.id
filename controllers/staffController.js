// Admin CRUD untuk Pimpinan & Staf (FR-M-09). `kelompok` dan `gelar`
// sebelumnya tidak pernah bisa diisi lewat form admin sama sekali, padahal
// keduanya dipakai halaman publik (kelompok menentukan bagian Pimpinan vs
// Staf, lihat getPimpinanStaffLanding; gelar ditampilkan di depan nama) --
// celah itu ditutup di sini. NIP/NID boleh diisi admin (dipakai internal)
// tapi tidak pernah dikirim ke halaman publik (K-05).
const fs = require('fs/promises');
const path = require('path');
const Staff = require('../models/Staff');
const { validate, schemas } = require('../validators');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  if (req.file) await fs.unlink(req.file.path).catch(() => {});
};

exports.list = async (req, res) => {
  const items = await Staff.find().sort({ kelompok: 1, nomorUrut: 1, createdAt: -1 }).lean();
  res.renderPage('admin/staff/list', { title: 'Pimpinan & Staf', items }, 'layouts/admin');
};

exports.showCreate = (req, res) => {
  res.renderPage('admin/staff/form', { title: 'Tambah Staf', mode: 'create', values: { kelompok: 'staf', nomorUrut: 0 }, errors: {} }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.staff, req.body);
  const fieldErrors = errors || {};
  if (!req.file) fieldErrors.foto = 'Foto wajib diisi.';
  if (!ok || fieldErrors.foto) {
    await removeUploaded(req);
    return res.renderPage('admin/staff/form', { title: 'Tambah Staf', mode: 'create', values: req.body, errors: fieldErrors }, 'layouts/admin');
  }
  await Staff.create({ ...data, foto: toPublicUrl(req.file.path), createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/staff?success=${encodeURIComponent('Staf berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await Staff.findById(id);
  if (!item) {
    const err = new Error('Staf tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/staff/form', { title: 'Ubah Staf', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.staff, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.renderPage('admin/staff/form', { title: 'Ubah Staf', mode: 'edit', item: item.toObject(), values: req.body, errors }, 'layouts/admin');
  }
  if (req.file) item.foto = toPublicUrl(req.file.path);
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/staff?success=${encodeURIComponent('Staf berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/staff?success=${encodeURIComponent('Staf berhasil dihapus.')}`);
};
