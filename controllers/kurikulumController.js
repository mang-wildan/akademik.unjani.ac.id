const path = require('path');
const Kurikulum = require('../models/Kurikulum');

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = (filePath) => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

exports.list = async (req, res) => {
  const items = await Kurikulum.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ tahun: -1, createdAt: -1 });

  res.render('admin/kurikulum/list', {
    title: 'Kurikulum',
    user: req.user,
    items,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/kurikulum/create', {
    title: 'Tambah Kurikulum',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { nama, programStudi, fakultas, tahun } = req.body;
  const coverFile = req.files && req.files.cover && req.files.cover[0];
  const pdfFile = req.files && req.files.file && req.files.file[0];
  const values = { nama, programStudi, fakultas, tahun };

  if (!nama || !programStudi || !fakultas || !tahun || !coverFile || !pdfFile) {
    return res.status(400).render('admin/kurikulum/create', {
      title: 'Tambah Kurikulum',
      user: req.user,
      error: 'Nama, Program Studi, Fakultas, Tahun, Cover, dan PDF wajib diisi.',
      values,
    });
  }

  const kur = new Kurikulum({
    nama,
    programStudi,
    fakultas,
    tahun,
    cover: toPublicUrl(coverFile.path),
    file: toPublicUrl(pdfFile.path),
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await kur.save();
  return res.redirect('/admin/kurikulum?success=Kurikulum berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const item = await Kurikulum.findById(req.params.id);
  if (!item) return res.redirect('/admin/kurikulum?error=Data tidak ditemukan');
  return res.render('admin/kurikulum/edit', {
    title: 'Edit Kurikulum',
    user: req.user,
    values: item,
  });
};

exports.update = async (req, res) => {
  const { nama, programStudi, fakultas, tahun } = req.body;
  const coverFile = req.files && req.files.cover && req.files.cover[0];
  const pdfFile = req.files && req.files.file && req.files.file[0];

  const item = await Kurikulum.findById(req.params.id);
  if (!item) return res.redirect('/admin/kurikulum?error=Data tidak ditemukan');

  if (!nama || !programStudi || !fakultas || !tahun) {
    return res.status(400).render('admin/kurikulum/edit', {
      title: 'Edit Kurikulum',
      user: req.user,
      error: 'Nama, Program Studi, Fakultas, dan Tahun wajib diisi.',
      values: { ...item.toObject(), nama, programStudi, fakultas, tahun },
    });
  }

  item.nama = nama;
  item.programStudi = programStudi;
  item.fakultas = fakultas;
  item.tahun = tahun;
  if (coverFile) item.cover = toPublicUrl(coverFile.path);
  if (pdfFile) item.file = toPublicUrl(pdfFile.path);
  item.updatedBy = req.user ? req.user._id : item.updatedBy;
  await item.save();
  return res.redirect('/admin/kurikulum?success=Kurikulum berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await Kurikulum.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/kurikulum?success=Kurikulum berhasil dihapus');
};
