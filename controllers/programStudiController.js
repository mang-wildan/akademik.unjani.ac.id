// Admin CRUD + impor CSV untuk Program Studi (FR-M-11).
const fs = require('fs/promises');
const ProgramStudi = require('../models/ProgramStudi');
const Faculty = require('../models/Faculty');
const { validate, schemas } = require('../validators');
const { escapeRegex } = require('../utils/regex');
const ADMIN_LAYOUT = 'layouts/admin-v2';

const facultyList = () => Faculty.find().sort({ nama: 1 }).lean();

const admin = require('../utils/academicAdmin')({
  Model: ProgramStudi, basePath: 'program-studi', title: 'Program Studi',
  query: async () => ({ sortable: ['nama','singkatan','updatedAt'], defaultSort: {nama:1}, searchFields: ['nama','singkatan'], filters: {fakultas:(await facultyList()).map(f=>String(f._id))} }),
  populate: ['fakultas'], refs: async () => ({facultyList:await facultyList()}),
});
exports.list = admin.list;
exports.bulk = admin.bulk;

const validateForm = async body => {
  const result = validate(schemas.programStudi, body);
  if (result.ok && !await Faculty.exists({_id:result.data.fakultas})) {
    return {ok:false,errors:{fakultas:'Fakultas tidak ditemukan. Pilih dari daftar.'}};
  }
  return result;
};

exports.showCreate = async (req, res) => {
  res.renderPage('admin/program-studi/form', { title: 'Tambah Program Studi', mode: 'create', values: {}, errors: {}, facultyList: await facultyList() }, ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = await validateForm(req.body);
  if (!ok) {
    return res.status(422).renderPage('admin/program-studi/form', { title: 'Tambah Program Studi', mode: 'create', values: req.body, errors, facultyList: await facultyList() }, ADMIN_LAYOUT);
  }
  await ProgramStudi.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
  admin.success(req,res,'Program studi berhasil ditambahkan.');
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
  res.renderPage('admin/program-studi/form', { title: 'Ubah Program Studi', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, facultyList: await facultyList() }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = await validateForm(req.body);
  if (!ok) {
    return res.status(422).renderPage('admin/program-studi/form', { title: 'Ubah Program Studi', mode: 'edit', item: item.toObject(), values: req.body, errors, facultyList: await facultyList() }, ADMIN_LAYOUT);
  }
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  admin.success(req,res,'Program studi berhasil diperbarui.');
};

exports.destroy = admin.destroy;

// Pencocokan fakultas lewat nama/singkatan (bukan ObjectId mentah); baris
// dengan fakultas tak dikenal atau duplikat (nama+fakultas) dilaporkan per
// baris, bukan cuma dihitung (lih. docs/POLA-ADMIN.md).
exports.importCsv = async (req, res) => {
  const file = req.files?.csv?.[0];
  const renderWithError = async importErrors => {
    res.status(422);
    return admin.list(req,res,{importErrors});
  };

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
  const seen = new Set();
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
    const result = validate(schemas.programStudi,{nama,singkatan,fakultas:String(faculty._id)});
    if (!result.ok) {
      errors.push(`Baris ${row}: ${Object.values(result.errors).join(' ')}`);
      continue;
    }
    const key = `${faculty._id}:${nama.toLowerCase()}`;
    const exists = await ProgramStudi.findOne({ nama: {$regex:`^${escapeRegex(nama)}$`,$options:'i'}, fakultas: faculty._id }).select('_id');
    if (exists || seen.has(key)) {
      errors.push(`Baris ${row}: program studi "${nama}" di fakultas ini sudah ada.`);
      continue;
    }
    seen.add(key);
    toInsert.push({ nama, singkatan, fakultas: faculty._id, createdBy: req.user._id, updatedBy: req.user._id });
  }

  if (!toInsert.length && !errors.length) errors.push('Tidak ada baris data untuk diimpor.');
  if (errors.length) return renderWithError(errors);
  await ProgramStudi.insertMany(toInsert);
  res.redirect(303, `/admin/program-studi?success=${encodeURIComponent(`${toInsert.length} program studi berhasil diimpor.`)}`);
};
