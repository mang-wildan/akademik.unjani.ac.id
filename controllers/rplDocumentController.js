// Admin CRUD untuk Dokumen RPL (FR-M-06b). `cover` di skema lama tidak
// dipakai desain F3 (lihat views/landing/rpl.ejs: hanya ikon PDF, bukan
// gambar sampul) jadi tidak lagi diminta di form ini. `status` boolean
// adalah Aktif/Arsip, bukan visibilitas publik -- dokumen arsip tetap
// tampil di halaman publik (badge berbeda), lihat getRplLanding.
const fs = require('fs/promises');
const path = require('path');
const RplDocument = require('../models/RplDocument');
const { removeUploadFiles } = require('../utils/upload');
const { validate, schemas } = require('../validators');
const ADMIN_LAYOUT = 'layouts/admin-v2';

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const file = req.files?.file?.[0];
  if (file) await fs.unlink(file.path).catch(() => {});
};

const admin = require('../utils/academicAdmin')({ Model: RplDocument, basePath: 'rpl-documents', title: 'Dokumen RPL', query: {sortable:['judul','tahun','updatedAt'],defaultSort:{tahun:-1,createdAt:-1},searchFields:['judul','deskripsi'],filters:{status:[true,false]}}, files:i=>[i.file,i.cover],actions:{activate:{label:'diaktifkan',update:{status:true}},deactivate:{label:'diarsipkan',update:{status:false}}} });
exports.list = admin.list;
exports.bulk = admin.bulk;

exports.showCreate = (req, res) => {
  res.renderPage('admin/rpl-documents/form', { title: 'Tambah Dokumen RPL', mode: 'create', values: { status: true }, errors: {} }, ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.rplDocument, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.file?.[0];
  if (!file) fieldErrors.file = 'File PDF wajib diisi.';
  if (!ok || fieldErrors.file) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/rpl-documents/form', { title: 'Tambah Dokumen RPL', mode: 'create', values: req.body, errors: fieldErrors }, ADMIN_LAYOUT);
  }
  try { await RplDocument.create({ ...data, file: toPublicUrl(file.path), fileSize: file.size, mimeType: file.mimetype, createdBy: req.user._id, updatedBy: req.user._id }); } catch (err) { await removeUploaded(req); throw err; }
  admin.success(req, res, 'Dokumen RPL berhasil ditambahkan.');
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
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  res.renderPage('admin/rpl-documents/form', { title: 'Ubah Dokumen RPL', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const { data, errors, ok } = validate(schemas.rplDocument, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/rpl-documents/form', { title: 'Ubah Dokumen RPL', mode: 'edit', item: item.toObject(), values: req.body, errors }, ADMIN_LAYOUT);
  }
  const previousFiles = [item.file];
  const file = req.files?.file?.[0];
  if (file) {
    item.file = toPublicUrl(file.path);
    item.fileSize = file.size;
    item.mimeType = file.mimetype;
  }
  Object.assign(item, data, { updatedBy: req.user._id });
  try { await item.save(); } catch (err) { await removeUploaded(req); throw err; }
  await removeUploadFiles('rpl-documents', previousFiles.filter(url => url && ![item.file].includes(url)));
  admin.success(req, res, 'Dokumen RPL berhasil diperbarui.');
};

exports.destroy = admin.destroy;
