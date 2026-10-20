// Admin CRUD + impor CSV untuk Data Lulusan (FR-M-08).
const fs = require('fs/promises');
const Lulusan = require('../models/Lulusan');
const ProgramStudi = require('../models/ProgramStudi');
const Faculty = require('../models/Faculty');
const { validate, schemas } = require('../validators');
const ADMIN_LAYOUT = 'layouts/admin-v2';
const { parseLulusanCsv } = require('../utils/lulusanImport');

const refData = async () => {
  const [prodiList, fakultasList] = await Promise.all([
    ProgramStudi.find().populate('fakultas', 'nama').sort({ nama: 1 }).lean(),
    Faculty.find().sort({ nama: 1 }).lean(),
  ]);
  return { prodiList, fakultasList };
};

const resolveFilters = async (filter,state) => {
  if(!state.q) return;
  const rx=filter.$or[0].periode;
  const [prodi,fakultas] = await Promise.all([
    ProgramStudi.find({$or:[{nama:rx},{singkatan:rx}]}).lean(),
    Faculty.find({$or:[{nama:rx},{singkatan:rx}]}).lean(),
  ]);
  filter.$or.push({programStudi:{$in:prodi.map(p=>p._id)}},{fakultas:{$in:fakultas.map(f=>f._id)}});
};
const admin = require('../utils/academicAdmin')({ Model: Lulusan, basePath: 'lulusan', title: 'Data Lulusan', query: async()=>({sortable:['tahun','periode','jumlah'],defaultSort:{tahun:-1,periode:1,createdAt:-1},searchFields:['periode'],filters:{tahun:await Lulusan.distinct('tahun'),programStudi:(await ProgramStudi.find().lean()).map(p=>String(p._id))}}), populate:['programStudi','fakultas'],refs:async()=>({...await refData(),tahunList:(await Lulusan.distinct('tahun')).filter(Boolean).sort((a,b)=>b-a)}),resolve:resolveFilters });
exports.list = admin.list;
exports.bulk = admin.bulk;

exports.showCreate = async (req, res) => {
  res.renderPage('admin/lulusan/form', { title: 'Tambah Data Lulusan', mode: 'create', values: { tahun: new Date().getFullYear() }, errors: {}, ...(await refData()) }, ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.lulusan, req.body);
  if (!ok) {
    return res.status(422).renderPage('admin/lulusan/form', { title: 'Tambah Data Lulusan', mode: 'create', values: req.body, errors, ...(await refData()) }, ADMIN_LAYOUT);
  }
  await Lulusan.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
  admin.success(req, res, 'Data lulusan berhasil ditambahkan.');
};

const findOrThrow = async id => {
  const item = await Lulusan.findById(id);
  if (!item) {
    const err = new Error('Data lulusan tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/lulusan/form', { title: 'Ubah Data Lulusan', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, ...(await refData()) }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.lulusan, req.body);
  if (!ok) {
    return res.status(422).renderPage('admin/lulusan/form', { title: 'Ubah Data Lulusan', mode: 'edit', item: item.toObject(), values: req.body, errors, ...(await refData()) }, ADMIN_LAYOUT);
  }
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  admin.success(req, res, 'Data lulusan berhasil diperbarui.');
};

exports.destroy = admin.destroy;

exports.downloadTemplate = (_req, res) => {
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="template-data-lulusan.csv"');
  res.send('﻿' + 'programStudi,fakultas,periode,tahun,jumlah\r\nInformatika,Fakultas Teknik,I,2025,120\r\nSI,FT,II,2025,110\r\n');
};

// Setiap baris yang tidak cocok dengan master data (prodi/fakultas tidak
// ditemukan) dilaporkan per baris, bukan cuma dihitung -- supaya admin tahu
// persis baris mana yang perlu diperbaiki (lih. docs/POLA-ADMIN.md).
exports.importCsv = async (req, res) => {
  const file = req.files?.csv?.[0];
  const renderWithError = async importErrors => { res.status(422); return admin.list(req,res,{importErrors}); };

  if (!file) return renderWithError(['File CSV wajib diisi.']);
  const text = await fs.readFile(file.path, 'utf8');
  await fs.unlink(file.path).catch(() => {});

  const { rows, errors: parseErrors } = parseLulusanCsv(text);
  const { prodiList, fakultasList } = await refData();
  const findProdi = key => {
    const norm = key.trim().toLowerCase();
    return prodiList.find(p => p.nama.toLowerCase() === norm || p.singkatan.toLowerCase() === norm);
  };
  const findFakultas = key => {
    const norm = key.trim().toLowerCase();
    return fakultasList.find(f => f.nama.toLowerCase() === norm || f.singkatan.toLowerCase() === norm);
  };

  const matchErrors = [];
  const toInsert = [];
  rows.forEach(r => {
    const prodi = findProdi(r.prodiKey);
    const fakultas = findFakultas(r.fakultasKey);
    if (!prodi) matchErrors.push(`Baris ${r.row}: program studi "${r.prodiKey}" tidak ditemukan di master data.`);
    else if (!fakultas) matchErrors.push(`Baris ${r.row}: fakultas "${r.fakultasKey}" tidak ditemukan di master data.`);
    else toInsert.push({ programStudi: prodi._id, fakultas: fakultas._id, periode: r.periode, tahun: r.tahun, jumlah: r.jumlah, createdBy: req.user._id, updatedBy: req.user._id });
  });

  const errors = [...parseErrors, ...matchErrors];
  if (errors.length) return renderWithError(errors);

  await Lulusan.insertMany(toInsert);
  admin.success(req, res, `${toInsert.length} data lulusan berhasil diimpor.`);
};
