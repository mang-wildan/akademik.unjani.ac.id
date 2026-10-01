// Admin CRUD untuk Kurikulum (FR-M-05). `nama`/`programStudi`/`fakultas`
// (teks bebas) dan `cover` adalah field v1 yang tidak lagi dipakai desain F3
// (lihat views/landing/kurikulum.ejs: hanya prodi/tahun/file) -- form ini
// hanya menulis `prodi` (ref ke master Program Studi) dan `tahun`.
const fs = require('fs/promises');
const path = require('path');
const Kurikulum = require('../models/Kurikulum');
const ProgramStudi = require('../models/ProgramStudi');
const { validate, schemas } = require('../validators');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const file = req.files?.file?.[0];
  if (file) await fs.unlink(file.path).catch(() => {});
};
const prodiList = async () => {
  const list = await ProgramStudi.find().populate('fakultas', 'nama').sort({ nama: 1 }).lean();
  return list.map(p => ({ ...p, labelFakultas: p.fakultas ? `${p.nama} (${p.fakultas.nama})` : p.nama }));
};

exports.list = async (req, res) => {
  const items = await Kurikulum.find().populate({ path: 'prodi', select: 'nama fakultas', populate: { path: 'fakultas', select: 'nama' } }).sort({ tahun: -1, createdAt: -1 }).lean();
  res.renderPage('admin/kurikulum/list', { title: 'Kurikulum', items }, 'layouts/admin');
};

exports.showCreate = async (req, res) => {
  res.renderPage('admin/kurikulum/form', { title: 'Tambah Kurikulum', mode: 'create', values: {}, errors: {}, prodiList: await prodiList() }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.kurikulum, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.file?.[0];
  if (!file) fieldErrors.file = 'File PDF wajib diisi.';
  if (!ok || fieldErrors.file) {
    await removeUploaded(req);
    return res.renderPage('admin/kurikulum/form', { title: 'Tambah Kurikulum', mode: 'create', values: req.body, errors: fieldErrors, prodiList: await prodiList() }, 'layouts/admin');
  }
  const existing = await Kurikulum.findOne({ prodi: data.prodi, tahun: data.tahun });
  if (existing) {
    await removeUploaded(req);
    return res.renderPage(
      'admin/kurikulum/form',
      { title: 'Tambah Kurikulum', mode: 'create', values: req.body, errors: { tahun: `Kurikulum tahun ${data.tahun} untuk program studi ini sudah ada.` }, prodiList: await prodiList() },
      'layouts/admin'
    );
  }
  await Kurikulum.create({ ...data, file: toPublicUrl(file.path), fileSize: file.size, createdBy: req.user._id, updatedBy: req.user._id });
  res.redirect(`/admin/kurikulum?success=${encodeURIComponent('Kurikulum berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await Kurikulum.findById(id);
  if (!item) {
    const err = new Error('Kurikulum tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/kurikulum/form', { title: 'Ubah Kurikulum', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, prodiList: await prodiList() }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.kurikulum, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.renderPage('admin/kurikulum/form', { title: 'Ubah Kurikulum', mode: 'edit', item: item.toObject(), values: req.body, errors, prodiList: await prodiList() }, 'layouts/admin');
  }
  const dup = await Kurikulum.findOne({ prodi: data.prodi, tahun: data.tahun, _id: { $ne: item._id } });
  if (dup) {
    await removeUploaded(req);
    return res.renderPage(
      'admin/kurikulum/form',
      { title: 'Ubah Kurikulum', mode: 'edit', item: item.toObject(), values: req.body, errors: { tahun: `Kurikulum tahun ${data.tahun} untuk program studi ini sudah ada.` }, prodiList: await prodiList() },
      'layouts/admin'
    );
  }
  const file = req.files?.file?.[0];
  if (file) {
    item.file = toPublicUrl(file.path);
    item.fileSize = file.size;
  }
  Object.assign(item, data, { updatedBy: req.user._id });
  await item.save();
  res.redirect(`/admin/kurikulum?success=${encodeURIComponent('Kurikulum berhasil diperbarui.')}`);
};

exports.destroy = async (req, res) => {
  await Kurikulum.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/kurikulum?success=${encodeURIComponent('Kurikulum berhasil dihapus.')}`);
};
