// Admin CRUD untuk Buku Wisuda (FR-M-07b). Sama seperti Buku, cover tetap
// wajib (grid publik), plus field periode (I/II/III) untuk filter publik.
const fs = require('fs/promises');
const path = require('path');
const GraduationBook = require('../models/GraduationBook');
const { validate, schemas } = require('../validators');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const files = [req.files?.file?.[0], req.files?.cover?.[0]].filter(Boolean);
  await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
};

exports.list = async (req, res) => {
  const items = await GraduationBook.find().sort({ year: -1, periode: 1, createdAt: -1 }).lean();
  res.renderPage('admin/graduation-books/list', { title: 'Buku Wisuda', items }, 'layouts/admin');
};

exports.showCreate = (req, res) => {
  res.renderPage('admin/graduation-books/form', { title: 'Tambah Buku Wisuda', mode: 'create', values: {}, errors: {} }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.graduationBook, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.file?.[0];
  const cover = req.files?.cover?.[0];
  if (!file) fieldErrors.file = 'File PDF wajib diisi.';
  if (!cover) fieldErrors.cover = 'Gambar sampul wajib diisi.';
  if (!ok || fieldErrors.file || fieldErrors.cover) {
    await removeUploaded(req);
    return res.renderPage('admin/graduation-books/form', { title: 'Tambah Buku Wisuda', mode: 'create', values: req.body, errors: fieldErrors }, 'layouts/admin');
  }
  await GraduationBook.create({ ...data, src: toPublicUrl(file.path), cover: toPublicUrl(cover.path), createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/graduation-books?success=${encodeURIComponent('Buku wisuda berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await GraduationBook.findById(id);
  if (!item) {
    const err = new Error('Buku wisuda tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/graduation-books/form', { title: 'Ubah Buku Wisuda', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.graduationBook, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.renderPage('admin/graduation-books/form', { title: 'Ubah Buku Wisuda', mode: 'edit', item: item.toObject(), values: req.body, errors }, 'layouts/admin');
  }
  const file = req.files?.file?.[0];
  const cover = req.files?.cover?.[0];
  if (file) item.src = toPublicUrl(file.path);
  if (cover) item.cover = toPublicUrl(cover.path);
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/graduation-books?success=${encodeURIComponent('Buku wisuda berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await GraduationBook.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/graduation-books?success=${encodeURIComponent('Buku wisuda berhasil dihapus.')}`);
};
