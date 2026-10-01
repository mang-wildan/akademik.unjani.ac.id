const path = require('path');
const RplDocument = require('../models/RplDocument');

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = filePath => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

exports.list = async (req, res) => {
  const documents = await RplDocument.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ tahun: -1, createdAt: -1 });

  res.render('admin/rpl-documents/list', {
    title: 'Dokumen RPL',
    user: req.user,
    documents,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/rpl-documents/create', {
    title: 'Tambah Dokumen RPL',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { judul, tahun } = req.body;
  const coverFile = req.files && req.files.cover && req.files.cover[0];
  const pdfFile = req.files && req.files.file && req.files.file[0];
  const values = { judul, tahun };

  if (!judul || !tahun || !coverFile || !pdfFile) {
    return res.status(400).render('admin/rpl-documents/create', {
      title: 'Tambah Dokumen RPL',
      user: req.user,
      error: 'Judul, tahun, cover, dan file PDF wajib diisi.',
      values,
    });
  }

  const doc = new RplDocument({
    judul,
    tahun,
    cover: toPublicUrl(coverFile.path),
    file: toPublicUrl(pdfFile.path),
    status: false, // default nonaktif saat tambah
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await doc.save();
  return res.redirect('/admin/rpl-documents?success=Dokumen RPL berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const doc = await RplDocument.findById(req.params.id);
  if (!doc) return res.redirect('/admin/rpl-documents?error=Data tidak ditemukan');
  return res.render('admin/rpl-documents/edit', {
    title: 'Edit Dokumen RPL',
    user: req.user,
    values: doc,
  });
};

exports.update = async (req, res) => {
  const { judul, tahun, status } = req.body;
  const coverFile = req.files && req.files.cover && req.files.cover[0];
  const pdfFile = req.files && req.files.file && req.files.file[0];

  const doc = await RplDocument.findById(req.params.id);
  if (!doc) return res.redirect('/admin/rpl-documents?error=Data tidak ditemukan');

  if (!judul || !tahun) {
    return res.status(400).render('admin/rpl-documents/edit', {
      title: 'Edit Dokumen RPL',
      user: req.user,
      error: 'Judul dan tahun wajib diisi.',
      values: { ...doc.toObject(), judul, tahun, status },
    });
  }

  doc.judul = judul;
  doc.tahun = tahun;
  const newStatus = String(status) === 'true';
  doc.status = newStatus;
  if (coverFile) doc.cover = toPublicUrl(coverFile.path);
  if (pdfFile) doc.file = toPublicUrl(pdfFile.path);
  doc.updatedBy = req.user ? req.user._id : doc.updatedBy;
  if (newStatus) {
    await RplDocument.updateMany({ _id: { $ne: doc._id } }, { status: false });
  }
  await doc.save();
  return res.redirect('/admin/rpl-documents?success=Dokumen RPL berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await RplDocument.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/rpl-documents?success=Dokumen RPL berhasil dihapus');
};
