// Admin CRUD untuk Dokumen Akademik (FR-M-06). `cover` di skema lama tidak
// dipakai desain F3 (lihat views/landing/dokumen-akademik.ejs) jadi tidak
// lagi diminta di form ini; kategori (dipakai untuk filter publik, FR-D-02)
// sebelumnya tidak pernah bisa diisi admin sama sekali -- celah itu ditutup di sini.
const fs = require('fs/promises');
const path = require('path');
const AcademicDocument = require('../models/AcademicDocument');
const Kategori = require('../models/Kategori');
const { validate, schemas } = require('../validators');

const PIN_LIMIT = 4;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const file = req.files?.file?.[0];
  if (file) await fs.unlink(file.path).catch(() => {});
};
const kategoriList = () => Kategori.find({ jenis: 'dokumen', isActive: true }).sort({ urutan: 1 }).lean();

exports.list = async (req, res) => {
  const items = await AcademicDocument.find().populate('kategori', 'nama').sort({ pinned: -1, createdAt: -1 }).lean();
  res.renderPage(
    'admin/academic-documents/list',
    { title: 'Dokumen Akademik', items, counts: { total: items.length, totalPinned: items.filter(d => d.pinned).length } },
    'layouts/admin'
  );
};

exports.showCreate = async (req, res) => {
  res.renderPage('admin/academic-documents/form', { title: 'Tambah Dokumen Akademik', mode: 'create', values: {}, errors: {}, kategoriList: await kategoriList() }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.academicDocument, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.file?.[0];
  if (!file) fieldErrors.file = 'File PDF wajib diisi.';
  if (!ok || fieldErrors.file) {
    await removeUploaded(req);
    return res.renderPage('admin/academic-documents/form', { title: 'Tambah Dokumen Akademik', mode: 'create', values: req.body, errors: fieldErrors, kategoriList: await kategoriList() }, 'layouts/admin');
  }
  if (data.pinned) {
    const pinnedCount = await AcademicDocument.countDocuments({ pinned: true });
    if (pinnedCount >= PIN_LIMIT) {
      await removeUploaded(req);
      return res.renderPage(
        'admin/academic-documents/form',
        { title: 'Tambah Dokumen Akademik', mode: 'create', values: req.body, errors: { _form: `Maksimal ${PIN_LIMIT} dokumen disematkan. Lepas sematan lain terlebih dahulu.` }, kategoriList: await kategoriList() },
        'layouts/admin'
      );
    }
  }
  await AcademicDocument.create({ ...data, file: toPublicUrl(file.path), fileSize: file.size, mimeType: file.mimetype, createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/academic-documents?success=${encodeURIComponent('Dokumen akademik berhasil ditambahkan.')}`);
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
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/academic-documents/form', { title: 'Ubah Dokumen Akademik', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, kategoriList: await kategoriList() }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.academicDocument, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.renderPage('admin/academic-documents/form', { title: 'Ubah Dokumen Akademik', mode: 'edit', item: item.toObject(), values: req.body, errors, kategoriList: await kategoriList() }, 'layouts/admin');
  }
  if (data.pinned && !item.pinned) {
    const pinnedCount = await AcademicDocument.countDocuments({ pinned: true, _id: { $ne: item._id } });
    if (pinnedCount >= PIN_LIMIT) {
      await removeUploaded(req);
      return res.renderPage(
        'admin/academic-documents/form',
        { title: 'Ubah Dokumen Akademik', mode: 'edit', item: item.toObject(), values: req.body, errors: { _form: `Maksimal ${PIN_LIMIT} dokumen disematkan. Lepas sematan lain terlebih dahulu.` }, kategoriList: await kategoriList() },
        'layouts/admin'
      );
    }
  }
  const file = req.files?.file?.[0];
  if (file) {
    item.file = toPublicUrl(file.path);
    item.fileSize = file.size;
    item.mimeType = file.mimetype;
  }
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/academic-documents?success=${encodeURIComponent('Dokumen akademik berhasil diperbarui.')}`);
};

exports.togglePin = async (req, res) => {
  const item = await findOrThrow(req.params.id);
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
  res.redirect(`/admin/academic-documents?success=${encodeURIComponent(pin ? 'Disematkan.' : 'Sematan dilepas.')}`);
};

exports.destroy = async (req, res) => {
  await AcademicDocument.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/academic-documents?success=${encodeURIComponent('Dokumen akademik berhasil dihapus.')}`);
};
