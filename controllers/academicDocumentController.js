// Admin CRUD untuk Dokumen Akademik (FR-M-06). `cover` di skema lama tidak
// dipakai desain F3 (lihat views/landing/dokumen-akademik.ejs) jadi tidak
// lagi diminta di form ini; kategori (dipakai untuk filter publik, FR-D-02)
// sebelumnya tidak pernah bisa diisi admin sama sekali -- celah itu ditutup di sini.
const fs = require('fs/promises');
const path = require('path');
const AcademicDocument = require('../models/AcademicDocument');
const Kategori = require('../models/Kategori');
const { removeUploadFiles } = require('../utils/upload');
const { validate, schemas } = require('../validators');
const ADMIN_LAYOUT = 'layouts/admin-v2';

const PIN_LIMIT = 4;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const file = req.files?.file?.[0];
  if (file) await fs.unlink(file.path).catch(() => {});
};
const kategoriList = () => Kategori.find({ jenis: 'dokumen', isActive: true }).sort({ urutan: 1 }).lean();

const admin = require('../utils/academicAdmin')({ Model: AcademicDocument, basePath: 'academic-documents', title: 'Dokumen Akademik', query: {sortable:['name','updatedAt'],defaultSort:{pinned:-1,createdAt:-1},searchFields:['name','keterangan'],filters:{pinned:[true,false]}}, populate:['kategori'], files:i=>[i.file,i.cover] });
exports.list = admin.list;
exports.bulk = admin.bulk;

exports.showCreate = async (req, res) => {
  res.renderPage('admin/academic-documents/form', { title: 'Tambah Dokumen Akademik', mode: 'create', values: {}, errors: {}, kategoriList: await kategoriList() }, ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.academicDocument, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.file?.[0];
  if (!file) fieldErrors.file = 'File PDF wajib diisi.';
  if (!ok || fieldErrors.file) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/academic-documents/form', { title: 'Tambah Dokumen Akademik', mode: 'create', values: req.body, errors: fieldErrors, kategoriList: await kategoriList() }, ADMIN_LAYOUT);
  }
  if (data.pinned) {
    const pinnedCount = await AcademicDocument.countDocuments({ pinned: true });
    if (pinnedCount >= PIN_LIMIT) {
      await removeUploaded(req);
      return res.status(422).renderPage(
        'admin/academic-documents/form',
        { title: 'Tambah Dokumen Akademik', mode: 'create', values: req.body, errors: { _form: `Maksimal ${PIN_LIMIT} dokumen disematkan. Lepas sematan lain terlebih dahulu.` }, kategoriList: await kategoriList() },
        ADMIN_LAYOUT
      );
    }
  }
  try { await AcademicDocument.create({ ...data, file: toPublicUrl(file.path), fileSize: file.size, mimeType: file.mimetype, createdBy: req.user._id, updatedBy: req.user._id }); } catch (err) { await removeUploaded(req); throw err; }
  admin.success(req, res, 'Dokumen akademik berhasil ditambahkan.');
};

const findOrThrow = async id => {
  const item = await AcademicDocument.findById(id);
  if (!item) {
    const err = new Error('Dokumen akademik tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  res.renderPage('admin/academic-documents/form', { title: 'Ubah Dokumen Akademik', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, kategoriList: await kategoriList() }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const { data, errors, ok } = validate(schemas.academicDocument, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/academic-documents/form', { title: 'Ubah Dokumen Akademik', mode: 'edit', item: item.toObject(), values: req.body, errors, kategoriList: await kategoriList() }, ADMIN_LAYOUT);
  }
  if (data.pinned && !item.pinned) {
    const pinnedCount = await AcademicDocument.countDocuments({ pinned: true, _id: { $ne: item._id } });
    if (pinnedCount >= PIN_LIMIT) {
      await removeUploaded(req);
      return res.status(422).renderPage(
        'admin/academic-documents/form',
        { title: 'Ubah Dokumen Akademik', mode: 'edit', item: item.toObject(), values: req.body, errors: { _form: `Maksimal ${PIN_LIMIT} dokumen disematkan. Lepas sematan lain terlebih dahulu.` }, kategoriList: await kategoriList() },
        ADMIN_LAYOUT
      );
    }
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
  await removeUploadFiles('academic-documents', previousFiles.filter(url => url && ![item.file].includes(url)));
  admin.success(req, res, 'Dokumen akademik berhasil diperbarui.');
};

exports.togglePin = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const pin = !item.pinned;
  if (pin) {
    const pinnedCount = await AcademicDocument.countDocuments({ pinned: true, _id: { $ne: item._id } });
    if (pinnedCount >= PIN_LIMIT) {
      return res.redirect(`/admin/academic-documents?error=${encodeURIComponent(`Maksimal ${PIN_LIMIT} dokumen disematkan.`)}`);
    }
  }
  item.pinned = pin;
  item.updatedBy = req.user._id;
  await item.save();
  admin.success(req, res, pin ? 'Disematkan.' : 'Sematan dilepas.');
};

exports.destroy = admin.destroy;
