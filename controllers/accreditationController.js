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
const { removeUploadFiles } = require('../utils/upload');
const { validate, schemas } = require('../validators');
const ADMIN_LAYOUT = 'layouts/admin-v2';
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

const { dayKey } = require('../utils/dates');
const resolveFilters = async (filter, state) => {
  if (state.q) {
    const rx = filter.$or[0].namaUnit;
    const [prodi, lembaga] = await Promise.all([
      ProgramStudi.find({ nama: rx }).lean(), LembagaAkreditasi.find({ singkatan: rx }).lean(),
    ]);
    filter.$or.push({ programStudi: { $in: prodi.map(p=>p._id) } }, { lembaga: { $in: lembaga.map(l=>l._id) } });
  }
  const status = filter.status;
  delete filter.status;
  const start = new Date(dayKey(new Date())+'T00:00:00+07:00');
  const end = new Date(start.getTime()+91*86400000);
  if(status==='kedaluwarsa') filter.berlakuSampai = { $lt:start };
  if(status==='segera-berakhir') filter.berlakuSampai = { $gte:start,$lt:end };
  if(status==='berlaku') filter.berlakuSampai = { $gte:end };
  if(status==='tidak-diketahui') filter.berlakuSampai = null;
};
const admin = require('../utils/academicAdmin')({ Model: Accreditation, basePath: 'accreditations', title: 'Akreditasi', query: {sortable:['namaUnit','berlakuSampai','updatedAt'],defaultSort:{berlakuSampai:-1},searchFields:['namaUnit','peringkat'],filters:{jenis:['institusi','prodi','lainnya'],isActive:[true,false],status:['berlaku','segera-berakhir','kedaluwarsa','tidak-diketahui']}}, populate:['programStudi','lembaga'],files:i=>[i.sertifikat],resolve:resolveFilters,decorate:i=>({...i,status:accreditationStatus(i.berlakuSampai)}),actions:{activate:{label:'diaktifkan',update:{isActive:true}},deactivate:{label:'dinonaktifkan',update:{isActive:false}}} });
exports.list = admin.list;
exports.bulk = admin.bulk;

exports.showCreate = async (req, res) => {
  res.renderPage('admin/accreditations/form', { title: 'Tambah Akreditasi', mode: 'create', values: {}, errors: {}, ...(await refData()) }, ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.accreditation, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.sertifikat?.[0];
  if (!file) fieldErrors.sertifikat = 'File sertifikat (PDF) wajib diisi.';
  if (!ok || fieldErrors.sertifikat) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/accreditations/form', { title: 'Tambah Akreditasi', mode: 'create', values: req.body, errors: fieldErrors, ...(await refData()) }, ADMIN_LAYOUT);
  }
  try { await Accreditation.create({ ...data, sertifikat: toPublicUrl(file.path), createdBy: req.user._id, updatedBy: req.user._id }); } catch (err) { await removeUploaded(req); throw err; }
  admin.success(req, res, 'Akreditasi berhasil ditambahkan.');
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
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const values = item.toObject();
  values.tanggalBerlaku = item.tanggalBerlaku && dayKey(item.tanggalBerlaku);
  values.berlakuSampai = item.berlakuSampai && dayKey(item.berlakuSampai);
  res.renderPage('admin/accreditations/form', { title: 'Ubah Akreditasi', mode: 'edit', item: item.toObject(), values, errors: {}, ...(await refData()) }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const { data, errors, ok } = validate(schemas.accreditation, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/accreditations/form', { title: 'Ubah Akreditasi', mode: 'edit', item: item.toObject(), values: req.body, errors, ...(await refData()) }, ADMIN_LAYOUT);
  }
  const previousFiles = [item.sertifikat];
  const file = req.files?.sertifikat?.[0];
  if (file) item.sertifikat = toPublicUrl(file.path);
  Object.assign(item, data, { updatedBy: req.user._id });
  try { await item.save(); } catch (err) { await removeUploaded(req); throw err; }
  await removeUploadFiles('accreditations', previousFiles.filter(url => url && ![item.sertifikat].includes(url)));
  admin.success(req, res, 'Akreditasi berhasil diperbarui.');
};

exports.destroy = admin.destroy;
