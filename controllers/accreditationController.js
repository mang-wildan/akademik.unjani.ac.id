// Admin CRUD untuk Akreditasi (FR-M-04). Skema sudah dipakai sejak F2
// (jenis/programStudi/namaUnit/peringkat/lembaga), jadi modul ini hanya
// menulis form+list di atasnya -- bukan factory adminContentController.js
// karena field-nya sama sekali berbeda dari Pengumuman/Berita. Status
// (Berlaku/Segera berakhir/Kedaluwarsa) tidak pernah disimpan: selalu
// dihitung dari berlakuSampai lewat utils/accreditation.accreditationStatus().
const fs = require('fs/promises');
const path = require('path');
const Accreditation = require('../models/Accreditation');
const LembagaAkreditasi = require('../models/LembagaAkreditasi');
const ProgramStudi = require('../models/ProgramStudi');
const { validate, schemas } = require('../validators');
const { PERINGKAT, JENIS, accreditationStatus } = require('../utils/accreditation');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const file = req.files?.sertifikat?.[0];
  if (file) await fs.unlink(file.path).catch(() => {});
};

const refData = async () => {
  const [lembagaList, prodiList] = await Promise.all([
    LembagaAkreditasi.find().sort({ urutan: 1 }).lean(),
    ProgramStudi.find().populate('fakultas', 'singkatan').sort({ nama: 1 }).lean(),
  ]);
  return {
    lembagaList,
    prodiList: prodiList.map(p => ({ ...p, labelFakultas: p.fakultas ? `${p.nama} (${p.fakultas.singkatan})` : p.nama })),
    jenisOptions: [
      { value: JENIS.INSTITUSI, label: 'Institusi' },
      { value: JENIS.PRODI, label: 'Program Studi' },
      { value: JENIS.LAINNYA, label: 'Lainnya (unit/lembaga)' },
    ],
    peringkatOptions: PERINGKAT.map(p => ({ value: p, label: p })),
  };
};

exports.list = async (req, res) => {
  const statusFilter = String(req.query.status || '');
  const jenisFilter = String(req.query.jenis || '');
  const all = await Accreditation.find()
    .populate('lembaga', 'nama singkatan')
    .populate('programStudi', 'nama singkatan')
    .sort({ berlakuSampai: -1 })
    .lean();
  const withStatus = all.map(a => ({ ...a, status: accreditationStatus(a.berlakuSampai) }));
  const items = withStatus.filter(a => (!statusFilter || a.status.key === statusFilter) && (!jenisFilter || a.jenis === jenisFilter));

  res.renderPage(
    'admin/accreditations/list',
    {
      title: 'Akreditasi',
      items,
      filters: { status: statusFilter, jenis: jenisFilter },
      counts: {
        berlaku: withStatus.filter(a => a.status.key === 'berlaku').length,
        segera: withStatus.filter(a => a.status.key === 'segera-berakhir').length,
        kedaluwarsa: withStatus.filter(a => a.status.key === 'kedaluwarsa').length,
      },
    },
    'layouts/admin'
  );
};

exports.showCreate = async (req, res) => {
  res.renderPage('admin/accreditations/form', { title: 'Tambah Akreditasi', mode: 'create', values: {}, errors: {}, ...(await refData()) }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.accreditation, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.sertifikat?.[0];
  if (!file) fieldErrors.sertifikat = 'File sertifikat (PDF) wajib diisi.';
  if (!ok || fieldErrors.sertifikat) {
    await removeUploaded(req);
    return res.renderPage('admin/accreditations/form', { title: 'Tambah Akreditasi', mode: 'create', values: req.body, errors: fieldErrors, ...(await refData()) }, 'layouts/admin');
  }
  await Accreditation.create({ ...data, sertifikat: toPublicUrl(file.path), createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/accreditations?success=${encodeURIComponent('Akreditasi berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await Accreditation.findById(id);
  if (!item) {
    const err = new Error('Akreditasi tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/accreditations/form', { title: 'Ubah Akreditasi', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, ...(await refData()) }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.accreditation, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.renderPage('admin/accreditations/form', { title: 'Ubah Akreditasi', mode: 'edit', item: item.toObject(), values: req.body, errors, ...(await refData()) }, 'layouts/admin');
  }
  const file = req.files?.sertifikat?.[0];
  if (file) item.sertifikat = toPublicUrl(file.path);
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/accreditations?success=${encodeURIComponent('Akreditasi berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await Accreditation.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/accreditations?success=${encodeURIComponent('Akreditasi berhasil dihapus.')}`);
};
