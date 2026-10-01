const path = require('path');
const AcademicDocument = require('../models/AcademicDocument');

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = (filePath) => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

exports.list = async (req, res) => {
  const documents = await AcademicDocument.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ pinned: -1, createdAt: -1 });

  res.render('admin/academic-documents/list', {
    title: 'Dokumen Akademik',
    user: req.user,
    documents,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/academic-documents/create', {
    title: 'Tambah Dokumen Akademik',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { name, keterangan } = req.body;
  const pinned = req.body.pinned === 'on' || req.body.pinned === 'true';
  const pdfFile = req.files && req.files.file && req.files.file[0];
  const coverFile = req.files && req.files.cover && req.files.cover[0];
  const values = { name, keterangan, pinned };

  if (!name || !pdfFile || !coverFile) {
    return res.status(400).render('admin/academic-documents/create', {
      title: 'Tambah Dokumen Akademik',
      user: req.user,
      error: 'Nama, cover, dan file PDF wajib diisi.',
      values,
    });
  }

  if (pinned) {
    const pinnedCount = await AcademicDocument.countDocuments({ pinned: true });
    if (pinnedCount >= 4) {
      return res.status(400).render('admin/academic-documents/create', {
        title: 'Tambah Dokumen Akademik',
        user: req.user,
        error: 'Pin maksimal 4 dokumen. Unpin dokumen lain terlebih dahulu.',
        values,
      });
    }
  }

  const doc = new AcademicDocument({
    name,
    keterangan,
    cover: toPublicUrl(coverFile.path),
    file: toPublicUrl(pdfFile.path),
    pinned,
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await doc.save();
  return res.redirect('/admin/academic-documents?success=Dokumen akademik berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const doc = await AcademicDocument.findById(req.params.id);
  if (!doc) return res.redirect('/admin/academic-documents?error=Data tidak ditemukan');
  return res.render('admin/academic-documents/edit', {
    title: 'Edit Dokumen Akademik',
    user: req.user,
    values: doc,
  });
};

exports.update = async (req, res) => {
  const { name, keterangan } = req.body;
  const pinned = req.body.pinned === 'on' || req.body.pinned === 'true';
  const pdfFile = req.files && req.files.file && req.files.file[0];
  const coverFile = req.files && req.files.cover && req.files.cover[0];

  const doc = await AcademicDocument.findById(req.params.id);
  if (!doc) return res.redirect('/admin/academic-documents?error=Data tidak ditemukan');

  if (!name) {
    return res.status(400).render('admin/academic-documents/edit', {
      title: 'Edit Dokumen Akademik',
      user: req.user,
      error: 'Nama wajib diisi.',
      values: { ...doc.toObject(), name, keterangan, pinned },
    });
  }

  if (pinned && !doc.pinned) {
    const pinnedCount = await AcademicDocument.countDocuments({ pinned: true, _id: { $ne: doc._id } });
    if (pinnedCount >= 4) {
      return res.status(400).render('admin/academic-documents/edit', {
        title: 'Edit Dokumen Akademik',
        user: req.user,
        error: 'Pin maksimal 4 dokumen. Unpin dokumen lain terlebih dahulu.',
        values: { ...doc.toObject(), name, keterangan, pinned },
      });
    }
  }

  doc.name = name;
  doc.keterangan = keterangan;
  if (pdfFile) doc.file = toPublicUrl(pdfFile.path);
  if (coverFile) doc.cover = toPublicUrl(coverFile.path);
  doc.pinned = pinned;
  doc.updatedBy = req.user ? req.user._id : doc.updatedBy;
  await doc.save();
  return res.redirect('/admin/academic-documents?success=Dokumen akademik berhasil diperbarui');
};

exports.togglePin = async (req, res) => {
  try {
    const doc = await AcademicDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const pinned = req.body.pinned === true || req.body.pinned === 'true' || req.body.pinned === 'on';
    if (pinned && !doc.pinned) {
      const pinnedCount = await AcademicDocument.countDocuments({ pinned: true, _id: { $ne: doc._id } });
      if (pinnedCount >= 4) {
        return res.status(400).json({
          success: false,
          message: 'Pin maksimal 4 dokumen. Unpin dokumen lain terlebih dahulu.',
        });
      }
    }

    doc.pinned = pinned;
    doc.updatedBy = req.user ? req.user._id : doc.updatedBy;
    await doc.save();

    return res.json({
      success: true,
      pinned: doc.pinned,
      message: pinned ? 'Dokumen berhasil di-pin.' : 'Pin dokumen dilepas.',
    });
  } catch (err) {
    console.error('Toggle pin dokumen error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pin dokumen.' });
  }
};

exports.destroy = async (req, res) => {
  await AcademicDocument.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/academic-documents?success=Dokumen akademik berhasil dihapus');
};
