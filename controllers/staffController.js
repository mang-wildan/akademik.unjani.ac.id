const path = require('path');
const Staff = require('../models/Staff');

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = (filePath) => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

exports.list = async (req, res) => {
  const staffs = await Staff.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ nomorUrut: 1, createdAt: -1 });

  res.render('admin/staff/list', {
    title: 'Staff',
    user: req.user,
    staffs,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/staff/create', {
    title: 'Tambah Staff',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { nama, nip, jabatan, nomorUrut } = req.body;
  const fotoFile = req.file;
  const values = { nama, nip, jabatan, nomorUrut };

  if (!nama || !nip || !jabatan || !fotoFile) {
    return res.status(400).render('admin/staff/create', {
      title: 'Tambah Staff',
      user: req.user,
      error: 'Nama, NIP/NID, Jabatan, dan Foto wajib diisi.',
      values,
    });
  }

  const staff = new Staff({
    nama,
    nip,
    jabatan,
    nomorUrut: nomorUrut || 0,
    foto: toPublicUrl(fotoFile.path),
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await staff.save();
  return res.redirect('/admin/staff?success=Staff berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) return res.redirect('/admin/staff?error=Data tidak ditemukan');
  return res.render('admin/staff/edit', {
    title: 'Edit Staff',
    user: req.user,
    values: staff,
  });
};

exports.update = async (req, res) => {
  const { nama, nip, jabatan, nomorUrut } = req.body;
  const fotoFile = req.file;

  const staff = await Staff.findById(req.params.id);
  if (!staff) return res.redirect('/admin/staff?error=Data tidak ditemukan');

  if (!nama || !nip || !jabatan) {
    return res.status(400).render('admin/staff/edit', {
      title: 'Edit Staff',
      user: req.user,
      error: 'Nama, NIP/NID, dan Jabatan wajib diisi.',
      values: { ...staff.toObject(), nama, nip, jabatan, nomorUrut },
    });
  }

  staff.nama = nama;
  staff.nip = nip;
  staff.jabatan = jabatan;
  staff.nomorUrut = nomorUrut || 0;
  if (fotoFile) staff.foto = toPublicUrl(fotoFile.path);
  staff.updatedBy = req.user ? req.user._id : staff.updatedBy;
  await staff.save();
  return res.redirect('/admin/staff?success=Staff berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/staff?success=Staff berhasil dihapus');
};
