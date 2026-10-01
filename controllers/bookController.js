// Admin CRUD untuk Buku (FR-M-07). Cover ditampilkan di grid publik (lihat
// views/landing/buku.ejs), jadi -- beda dari Dokumen Akademik/RPL -- tetap
// wajib di sini.
const fs = require('fs/promises');
const path = require('path');
const Book = require('../models/Book');
const { validate, schemas } = require('../validators');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const files = [req.files?.file?.[0], req.files?.cover?.[0]].filter(Boolean);
  await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
};

exports.list = async (req, res) => {
  const items = await Book.find().sort({ year: -1, createdAt: -1 }).lean();
  res.renderPage('admin/books/list', { title: 'Buku', items }, 'layouts/admin');
};

exports.showCreate = (req, res) => {
  res.renderPage('admin/books/form', { title: 'Tambah Buku', mode: 'create', values: {}, errors: {} }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.book, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.file?.[0];
  const cover = req.files?.cover?.[0];
  if (!file) fieldErrors.file = 'File PDF wajib diisi.';
  if (!cover) fieldErrors.cover = 'Gambar sampul wajib diisi.';
  if (!ok || fieldErrors.file || fieldErrors.cover) {
    await removeUploaded(req);
    return res.renderPage('admin/books/form', { title: 'Tambah Buku', mode: 'create', values: req.body, errors: fieldErrors }, 'layouts/admin');
  }
  await Book.create({ ...data, src: toPublicUrl(file.path), cover: toPublicUrl(cover.path), createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/books?success=${encodeURIComponent('Buku berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await Book.findById(id);
  if (!item) {
    const err = new Error('Buku tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/books/form', { title: 'Ubah Buku', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.book, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.renderPage('admin/books/form', { title: 'Ubah Buku', mode: 'edit', item: item.toObject(), values: req.body, errors }, 'layouts/admin');
  }
  const file = req.files?.file?.[0];
  const cover = req.files?.cover?.[0];
  if (file) item.src = toPublicUrl(file.path);
  if (cover) item.cover = toPublicUrl(cover.path);
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/books?success=${encodeURIComponent('Buku berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/books?success=${encodeURIComponent('Buku berhasil dihapus.')}`);
};
