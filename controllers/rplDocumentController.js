// Admin CRUD untuk Dokumen RPL (FR-M-06b). `cover` di skema lama tidak
// dipakai desain F3 (lihat views/landing/rpl.ejs: hanya ikon PDF, bukan
// gambar sampul) jadi tidak lagi diminta di form ini. `status` boolean
// adalah Aktif/Arsip, bukan visibilitas publik -- dokumen arsip tetap
// tampil di halaman publik (badge berbeda), lihat getRplLanding.
const fs = require('fs/promises');
const path = require('path');
const RplDocument = require('../models/RplDocument');
const { validate, schemas } = require('../validators');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const file = req.files?.file?.[0];
  if (file) await fs.unlink(file.path).catch(() => {});
};

exports.list = async (req, res) => {
  const items = await RplDocument.find().sort({ tahun: -1, createdAt: -1 }).lean();
  res.renderPage('admin/rpl-documents/list', { title: 'Dokumen RPL', items }, 'layouts/admin');
};

exports.showCreate = (req, res) => {
  res.renderPage('admin/rpl-documents/form', { title: 'Tambah Dokumen RPL', mode: 'create', values: { status: true }, errors: {} }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.rplDocument, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.file?.[0];
  if (!file) fieldErrors.file = 'File PDF wajib diisi.';
  if (!ok || fieldErrors.file) {
    await removeUploaded(req);
    return res.renderPage('admin/rpl-documents/form', { title: 'Tambah Dokumen RPL', mode: 'create', values: req.body, errors: fieldErrors }, 'layouts/admin');
  }
  await RplDocument.create({ ...data, file: toPublicUrl(file.path), fileSize: file.size, mimeType: file.mimetype, createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/rpl-documents?success=${encodeURIComponent('Dokumen RPL berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await RplDocument.findById(id);
  if (!item) {
    const err = new Error('Dokumen RPL tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/rpl-documents/form', { title: 'Ubah Dokumen RPL', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.rplDocument, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.renderPage('admin/rpl-documents/form', { title: 'Ubah Dokumen RPL', mode: 'edit', item: item.toObject(), values: req.body, errors }, 'layouts/admin');
  }
  const file = req.files?.file?.[0];
  if (file) {
    item.file = toPublicUrl(file.path);
    item.fileSize = file.size;
    item.mimeType = file.mimetype;
  }
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/rpl-documents?success=${encodeURIComponent('Dokumen RPL berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await RplDocument.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/rpl-documents?success=${encodeURIComponent('Dokumen RPL berhasil dihapus.')}`);
};
