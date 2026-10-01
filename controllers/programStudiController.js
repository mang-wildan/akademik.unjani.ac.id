// Admin CRUD + impor CSV untuk Program Studi (FR-M-11).
const fs = require('fs/promises');
const ProgramStudi = require('../models/ProgramStudi');
const Faculty = require('../models/Faculty');
const { validate, schemas } = require('../validators');

const facultyList = () => Faculty.find().sort({ nama: 1 }).lean();

exports.list = async (req, res) => {
  const items = await ProgramStudi.find().populate('fakultas', 'nama singkatan').sort({ nama: 1 }).lean();
  res.renderPage('admin/program-studi/list', { title: 'Program Studi', items, importErrors: null }, 'layouts/admin');
};

exports.showCreate = async (req, res) => {
  res.renderPage('admin/program-studi/form', { title: 'Tambah Program Studi', mode: 'create', values: {}, errors: {}, facultyList: await facultyList() }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.programStudi, req.body);
  if (!ok) {
    return res.renderPage('admin/program-studi/form', { title: 'Tambah Program Studi', mode: 'create', values: req.body, errors, facultyList: await facultyList() }, 'layouts/admin');
  }
  await ProgramStudi.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/program-studi?success=${encodeURIComponent('Program studi berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await ProgramStudi.findById(id);
  if (!item) {
    const err = new Error('Program studi tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/program-studi/form', { title: 'Ubah Program Studi', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, facultyList: await facultyList() }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.programStudi, req.body);
  if (!ok) {
    return res.renderPage('admin/program-studi/form', { title: 'Ubah Program Studi', mode: 'edit', item: item.toObject(), values: req.body, errors, facultyList: await facultyList() }, 'layouts/admin');
  }
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/program-studi?success=${encodeURIComponent('Program studi berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await ProgramStudi.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/program-studi?success=${encodeURIComponent('Program studi berhasil dihapus.')}`);
};

// Pencocokan fakultas lewat nama/singkatan (bukan ObjectId mentah); baris
// dengan fakultas tak dikenal atau duplikat (nama+fakultas) dilaporkan per
// baris, bukan cuma dihitung (lih. docs/POLA-ADMIN.md).
exports.importCsv = async (req, res) => {
  const file = req.files?.csv?.[0];
  const currentItems = () => ProgramStudi.find().populate('fakultas', 'nama singkatan').sort({ nama: 1 }).lean();
  const renderWithError = async importErrors =>
    res.renderPage('admin/program-studi/list', { title: 'Program Studi', items: await currentItems(), importErrors }, 'layouts/admin');

  if (!file) return renderWithError(['File CSV wajib diisi.']);
  const text = await fs.readFile(file.path, 'utf8');
  await fs.unlink(file.path).catch(() => {});

  const lines = text.replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return renderWithError(['File kosong.']);
  const header = lines[0].toLowerCase().replace(/\s+/g, '');
  const startIdx = header.includes('nama') && header.includes('singkatan') ? 1 : 0;

  const faculties = await facultyList();
  const findFaculty = key => {
    const norm = key.trim().toLowerCase();
    return faculties.find(f => f.nama.toLowerCase() === norm || f.singkatan.toLowerCase() === norm);
  };

  const errors = [];
  const toInsert = [];
  for (let i = startIdx; i < lines.length; i += 1) {
    const row = i + 1;
    const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    const [nama, singkatan, fakultasKey] = parts;
    if (!nama || !singkatan || !fakultasKey) {
      errors.push(`Baris ${row}: nama, singkatan, dan fakultas wajib diisi.`);
      continue;
    }
    const faculty = findFaculty(fakultasKey);
    if (!faculty) {
      errors.push(`Baris ${row}: fakultas "${fakultasKey}" tidak ditemukan di master data.`);
      continue;
    }
    const exists = await ProgramStudi.findOne({ nama: new RegExp(`^${nama}$`, 'i'), fakultas: faculty._id }).select('_id');
    if (exists) {
      errors.push(`Baris ${row}: program studi "${nama}" di fakultas ini sudah ada.`);
      continue;
    }
    toInsert.push({ nama, singkatan, fakultas: faculty._id, createdBy: req.user._id, updatedBy: req.user._id });
  }

  if (errors.length) return renderWithError(errors);
  await ProgramStudi.insertMany(toInsert);
  res.redirect(`/admin/program-studi?success=${encodeURIComponent(`${toInsert.length} program studi berhasil diimpor.`)}`);
};
