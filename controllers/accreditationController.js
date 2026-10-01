const path = require('path');
const Accreditation = require('../models/Accreditation');

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = (filePath) => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

const parseBoolean = (value, fallback = false) => {
  let raw = value;
  if (Array.isArray(raw)) raw = raw[raw.length - 1];
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (['true', '1', 'on', 'yes', 'aktif'].includes(normalized)) return true;
    if (['false', '0', 'off', 'no', 'nonaktif'].includes(normalized)) return false;
  }
  return fallback;
};

exports.list = async (req, res) => {
  const accreditations = await Accreditation.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 });

  res.render('admin/accreditations/list', {
    title: 'Daftar Akreditasi',
    user: req.user,
    accreditations,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/accreditations/create', {
    title: 'Tambah Akreditasi',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { institusi, unit, tahun, akreditasi, tanggalBerlaku, berlakuSampai } = req.body;
  const isActive = parseBoolean(req.body.isActive, true);
  const pdfFile = req.files && req.files.sertifikat && req.files.sertifikat[0];
  const values = { institusi, unit, tahun, akreditasi, tanggalBerlaku, berlakuSampai, isActive };

  if (!institusi || !unit || !tahun || !akreditasi || !tanggalBerlaku || !berlakuSampai || !pdfFile) {
    return res.status(400).render('admin/accreditations/create', {
      title: 'Tambah Akreditasi',
      user: req.user,
      error: 'Institusi/Fakultas, Unit/Program Studi, tahun, akreditasi, tanggal berlaku, berlaku sampai, dan sertifikat wajib diisi.',
      values,
    });
  }

  const accreditation = new Accreditation({
    institusi,
    unit,
    tahun,
    akreditasi,
    isActive,
    tanggalBerlaku,
    berlakuSampai,
    sertifikat: toPublicUrl(pdfFile.path),
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await accreditation.save();
  return res.redirect('/admin/accreditations?success=Akreditasi berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const accreditation = await Accreditation.findById(req.params.id);
  if (!accreditation) return res.redirect('/admin/accreditations?error=Data tidak ditemukan');
  return res.render('admin/accreditations/edit', {
    title: 'Edit Akreditasi',
    user: req.user,
    values: accreditation,
  });
};

exports.update = async (req, res) => {
  const { institusi, unit, tahun, akreditasi, tanggalBerlaku, berlakuSampai } = req.body;
  const pdfFile = req.files && req.files.sertifikat && req.files.sertifikat[0];

  const accreditation = await Accreditation.findById(req.params.id);
  if (!accreditation) return res.redirect('/admin/accreditations?error=Data tidak ditemukan');

  const isActive = parseBoolean(req.body.isActive, accreditation.isActive !== false);

  if (!institusi || !unit || !tahun || !akreditasi || !tanggalBerlaku || !berlakuSampai) {
    return res.status(400).render('admin/accreditations/edit', {
      title: 'Edit Akreditasi',
      user: req.user,
      error: 'Institusi/Fakultas, Unit/Program Studi, tahun, akreditasi, tanggal berlaku, dan berlaku sampai wajib diisi.',
      values: { ...accreditation.toObject(), institusi, unit, tahun, akreditasi, tanggalBerlaku, berlakuSampai, isActive },
    });
  }

  accreditation.institusi = institusi;
  accreditation.unit = unit;
  accreditation.tahun = tahun;
  accreditation.akreditasi = akreditasi;
  accreditation.isActive = isActive;
  accreditation.tanggalBerlaku = tanggalBerlaku;
  accreditation.berlakuSampai = berlakuSampai;
  if (pdfFile) accreditation.sertifikat = toPublicUrl(pdfFile.path);
  accreditation.updatedBy = req.user ? req.user._id : accreditation.updatedBy;
  await accreditation.save();
  return res.redirect('/admin/accreditations?success=Akreditasi berhasil diperbarui');
};

exports.toggleActive = async (req, res) => {
  const accreditation = await Accreditation.findById(req.params.id);
  if (!accreditation) return res.redirect('/admin/accreditations?error=Data tidak ditemukan');

  const currentStatus = accreditation.isActive !== false;
  const hasInput = Object.prototype.hasOwnProperty.call(req.body || {}, 'isActive');
  const nextStatus = hasInput ? parseBoolean(req.body.isActive, currentStatus) : !currentStatus;

  accreditation.isActive = nextStatus;
  accreditation.updatedBy = req.user ? req.user._id : accreditation.updatedBy;
  await accreditation.save();

  const statusLabel = nextStatus ? 'diaktifkan' : 'dinonaktifkan';
  return res.redirect(`/admin/accreditations?success=Akreditasi berhasil ${statusLabel}`);
};

exports.destroy = async (req, res) => {
  await Accreditation.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/accreditations?success=Akreditasi berhasil dihapus');
};
