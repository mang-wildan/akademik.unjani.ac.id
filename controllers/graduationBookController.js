// Admin CRUD untuk Buku Wisuda (FR-M-07b). Sama seperti Buku, cover tetap
// wajib (grid publik), plus field periode (I/II/III) untuk filter publik.
const fs = require('fs/promises');
const path = require('path');
const GraduationBook = require('../models/GraduationBook');
const pdfCompress = require('../utils/pdfCompress');
const { removeUploadFiles } = require('../utils/upload');
const { validate, schemas } = require('../validators');
const ADMIN_LAYOUT = 'layouts/admin-v2';

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const files = [req.files?.file?.[0], req.files?.cover?.[0]].filter(Boolean);
  await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
};

const admin = require('../utils/academicAdmin')({ Model: GraduationBook, basePath: 'graduation-books', title: 'Buku Wisuda', query: {sortable:['title','year','periode','updatedAt'],defaultSort:{year:-1,periode:1,createdAt:-1},searchFields:['title'],filters:{periode:['I','II','III']}}, files:i=>[i.src,i.cover] });
exports.list = admin.list;
exports.bulk = admin.bulk;

exports.showCreate = (req, res) => {
  res.renderPage('admin/graduation-books/form', { title: 'Tambah Buku Wisuda', mode: 'create', values: {}, errors: {} }, ADMIN_LAYOUT);
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
    return res.status(422).renderPage('admin/graduation-books/form', { title: 'Tambah Buku Wisuda', mode: 'create', values: req.body, errors: fieldErrors }, ADMIN_LAYOUT);
  }
  await pdfCompress.compressPdf(file.path);
  try { await GraduationBook.create({ ...data, src: toPublicUrl(file.path), cover: toPublicUrl(cover.path), createdBy: req.user._id, updatedBy: req.user._id }); } catch (err) { await removeUploaded(req); throw err; }
  admin.success(req, res, 'Buku wisuda berhasil ditambahkan.');
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
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  res.renderPage('admin/graduation-books/form', { title: 'Ubah Buku Wisuda', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const { data, errors, ok } = validate(schemas.graduationBook, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/graduation-books/form', { title: 'Ubah Buku Wisuda', mode: 'edit', item: item.toObject(), values: req.body, errors }, ADMIN_LAYOUT);
  }
  const previousFiles = [item.src, item.cover];
  const file = req.files?.file?.[0];
  const cover = req.files?.cover?.[0];
  if (file) {
    await pdfCompress.compressPdf(file.path);
    item.src = toPublicUrl(file.path);
  }
  if (cover) item.cover = toPublicUrl(cover.path);
  Object.assign(item, data, { updatedBy: req.user._id });
  try { await item.save(); } catch (err) { await removeUploaded(req); throw err; }
  await removeUploadFiles('graduation-books', previousFiles.filter(url => url && ![item.src, item.cover].includes(url)));
  admin.success(req, res, 'Buku wisuda berhasil diperbarui.');
};

exports.destroy = admin.destroy;
