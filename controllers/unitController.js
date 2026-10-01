const path = require('path');
const Unit = require('../models/Unit');

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = (filePath) => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

exports.list = async (req, res) => {
  const units = await Unit.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 });

  res.render('admin/unit/list', {
    title: 'Unit',
    user: req.user,
    units,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/unit/create', {
    title: 'Tambah Unit',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { nama, deskripsi, link } = req.body;
  const imgFile = req.file;
  const values = { nama, deskripsi, link };

  if (!nama || !imgFile) {
    return res.status(400).render('admin/unit/create', {
      title: 'Tambah Unit',
      user: req.user,
      error: 'Nama dan gambar wajib diisi.',
      values,
    });
  }

  const unit = new Unit({
    nama,
    deskripsi,
    link,
    img: toPublicUrl(imgFile.path),
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await unit.save();
  return res.redirect('/admin/unit?success=Unit berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const unit = await Unit.findById(req.params.id);
  if (!unit) return res.redirect('/admin/unit?error=Data tidak ditemukan');
  return res.render('admin/unit/edit', {
    title: 'Edit Unit',
    user: req.user,
    values: unit,
  });
};

exports.update = async (req, res) => {
  const { nama, deskripsi, link } = req.body;
  const imgFile = req.file;

  const unit = await Unit.findById(req.params.id);
  if (!unit) return res.redirect('/admin/unit?error=Data tidak ditemukan');

  if (!nama) {
    return res.status(400).render('admin/unit/edit', {
      title: 'Edit Unit',
      user: req.user,
      error: 'Nama wajib diisi.',
      values: { ...unit.toObject(), nama, deskripsi, link },
    });
  }

  unit.nama = nama;
  unit.deskripsi = deskripsi;
  unit.link = link;
  if (imgFile) unit.img = toPublicUrl(imgFile.path);
  unit.updatedBy = req.user ? req.user._id : unit.updatedBy;
  await unit.save();
  return res.redirect('/admin/unit?success=Unit berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await Unit.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/unit?success=Unit berhasil dihapus');
};
