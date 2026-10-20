// Admin CRUD untuk Buku (FR-M-07). Cover ditampilkan di grid publik (lihat
// views/landing/buku.ejs), jadi -- beda dari Dokumen Akademik/RPL -- tetap
// wajib di sini.
const fs = require('fs/promises');
const path = require('path');
const Book = require('../models/Book');
const { validate, schemas } = require('../validators');
const { parseListQuery } = require('../utils/listQuery');
const { bulkHandler } = require('../utils/bulk');
const { removeUploadFiles } = require('../utils/upload');

const ADMIN_LAYOUT = 'layouts/admin-v2';
const LIST_QUERY = { sortable: ['title', 'year', 'updatedAt'], defaultSort: { year: -1, updatedAt: -1 } };
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const files = [req.files?.file?.[0], req.files?.cover?.[0]].filter(Boolean);
  await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
};

exports.list = async (req, res) => {
  const { filter, sort, page, limit, state } = parseListQuery(req.query, LIST_QUERY);
  const total = await Book.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const items = await Book.find(filter).sort(sort).skip((currentPage - 1) * limit).limit(limit).lean();
  res.renderPage('admin/books/list', { title: 'Buku', items, state: { ...state, page: String(currentPage) }, pagination: { page: currentPage, totalPages, total, pageSize: limit } }, ADMIN_LAYOUT);
};

const success = (req, res, message) => req.query.partial === '1'
  ? res.json({ ok: true, message })
  : res.redirect(303, `/admin/books?success=${encodeURIComponent(message)}`);

exports.showCreate = (req, res) => {
  res.renderPage('admin/books/form', { title: 'Tambah Buku', mode: 'create', values: {}, errors: {} }, ADMIN_LAYOUT);
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
    return res.status(422).renderPage('admin/books/form', { title: 'Tambah Buku', mode: 'create', values: req.body, errors: fieldErrors }, ADMIN_LAYOUT);
  }
  try {
    await Book.create({ ...data, src: toPublicUrl(file.path), cover: toPublicUrl(cover.path), createdBy: req.user._id, updatedBy: req.user._id });
  } catch (err) { await removeUploaded(req); throw err; }
  success(req, res, 'Buku berhasil ditambahkan.');
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
  res.renderPage('admin/books/form', { title: 'Ubah Buku', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const { data, errors, ok } = validate(schemas.book, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/books/form', { title: 'Ubah Buku', mode: 'edit', item: item.toObject(), values: req.body, errors }, ADMIN_LAYOUT);
  }
  const file = req.files?.file?.[0];
  const cover = req.files?.cover?.[0];
  const removed = [];
  if (file) { removed.push(item.src); item.src = toPublicUrl(file.path); }
  if (cover) { removed.push(item.cover); item.cover = toPublicUrl(cover.path); }
  Object.assign(item, data, { updatedBy: req.user._id });
  try { await item.save(); }
  catch (err) { await removeUploaded(req); throw err; }
  await removeUploadFiles('books', removed);
  success(req, res, 'Buku berhasil diperbarui.');
};

const deleteItem = async id => {
  const item = await Book.findById(id).lean();
  if (!item) return 0;
  await removeUploadFiles('books', [item.src, item.cover]);
  await Book.deleteOne({ _id: id });
  return 1;
};
exports.destroy = async (req, res) => {
  await deleteItem(req.params.id);
  success(req, res, 'Buku berhasil dihapus.');
};

exports.bulk = bulkHandler({ Model: Book, basePath: 'books', noun: 'buku', listQuery: LIST_QUERY, actions: {
  delete: { label: 'dihapus', run: async ids => {
    let done = 0, failed = 0;
    for (const id of ids) {
      try { done += await deleteItem(id); }
      catch (err) { failed++; console.error('Gagal menghapus buku', id, err); }
    }
    return { done, failed };
  } },
} });
