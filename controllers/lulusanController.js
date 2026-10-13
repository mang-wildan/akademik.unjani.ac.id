// Admin CRUD + impor CSV untuk Data Lulusan (FR-M-08).
const fs = require('fs/promises');
const Lulusan = require('../models/Lulusan');
const ProgramStudi = require('../models/ProgramStudi');
const Faculty = require('../models/Faculty');
const { validate, schemas } = require('../validators');
const { parseLulusanCsv } = require('../utils/lulusanImport');

const refData = async () => {
  const [prodiList, fakultasList] = await Promise.all([
    ProgramStudi.find().populate('fakultas', 'nama').sort({ nama: 1 }).lean(),
    Faculty.find().sort({ nama: 1 }).lean(),
  ]);
  return { prodiList, fakultasList };
};

exports.list = async (req, res) => {
  const tahun = parseInt(req.query.tahun, 10) || null;
  const filter = tahun ? { tahun } : {};
  const limit = 20;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const [tahunList, total] = await Promise.all([Lulusan.distinct('tahun'), Lulusan.countDocuments(filter)]);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const items = await Lulusan.find(filter)
    .populate('programStudi', 'nama singkatan')
    .populate('fakultas', 'nama singkatan')
    .sort({ tahun: -1, periode: 1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .lean();
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);
  res.renderPage('admin/lulusan/list', {
    title: 'Data Lulusan', items, importErrors: null, importSummary: null,
    tahunList: tahunList.filter(Boolean).sort((a, b) => b - a),
    filters: { tahun: tahun ? String(tahun) : '' },
    pagination: { page: currentPage, totalPages, total, from, to },
  }, 'layouts/admin');
};

exports.showCreate = async (req, res) => {
  res.renderPage('admin/lulusan/form', { title: 'Tambah Data Lulusan', mode: 'create', values: { tahun: new Date().getFullYear() }, errors: {}, ...(await refData()) }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.lulusan, req.body);
  if (!ok) {
    return res.renderPage('admin/lulusan/form', { title: 'Tambah Data Lulusan', mode: 'create', values: req.body, errors, ...(await refData()) }, 'layouts/admin');
  }
  await Lulusan.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/lulusan?success=${encodeURIComponent('Data lulusan berhasil ditambahkan.')}`);
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
  res.renderPage('admin/lulusan/form', { title: 'Ubah Data Lulusan', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, ...(await refData()) }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.lulusan, req.body);
  if (!ok) {
    return res.renderPage('admin/lulusan/form', { title: 'Ubah Data Lulusan', mode: 'edit', item: item.toObject(), values: req.body, errors, ...(await refData()) }, 'layouts/admin');
  }
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/lulusan?success=${encodeURIComponent('Data lulusan berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await Lulusan.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/lulusan?success=${encodeURIComponent('Data lulusan berhasil dihapus.')}`);
};

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
  const currentItems = async () => Lulusan.find().populate('programStudi', 'nama singkatan').populate('fakultas', 'nama singkatan').sort({ tahun: -1, periode: 1, createdAt: -1 }).lean();
  const renderWithError = async importErrors =>
    res.renderPage('admin/lulusan/list', { title: 'Data Lulusan', items: await currentItems(), importErrors, importSummary: null }, 'layouts/admin');

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
  res.redirect(`/admin/lulusan?success=${encodeURIComponent(`${toInsert.length} data lulusan berhasil diimpor.`)}`);
};
