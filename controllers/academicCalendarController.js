const path = require('path');
const AcademicCalendar = require('../models/AcademicCalendar');

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = (filePath) => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

exports.list = async (req, res) => {
  const calendars = await AcademicCalendar.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 });

  res.render('admin/academic-calendars/list', {
    title: 'Kalender Akademik',
    user: req.user,
    calendars,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/academic-calendars/create', {
    title: 'Tambah Kalender Akademik',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { tahunAjaran } = req.body;
  const imgFile = req.files && req.files.file && req.files.file[0];
  const values = { tahunAjaran };

  if (!tahunAjaran || !imgFile) {
    return res.status(400).render('admin/academic-calendars/create', {
      title: 'Tambah Kalender Akademik',
      user: req.user,
      error: 'Tahun ajaran dan file kalender (gambar) wajib diisi.',
      values,
    });
  }

  const calendar = new AcademicCalendar({
    tahunAjaran,
    file: toPublicUrl(imgFile.path),
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await calendar.save();
  return res.redirect('/admin/academic-calendars?success=Kalender akademik berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const calendar = await AcademicCalendar.findById(req.params.id);
  if (!calendar) return res.redirect('/admin/academic-calendars?error=Data tidak ditemukan');
  return res.render('admin/academic-calendars/edit', {
    title: 'Edit Kalender Akademik',
    user: req.user,
    values: calendar,
  });
};

exports.update = async (req, res) => {
  const { tahunAjaran } = req.body;
  const imgFile = req.files && req.files.file && req.files.file[0];

  const calendar = await AcademicCalendar.findById(req.params.id);
  if (!calendar) return res.redirect('/admin/academic-calendars?error=Data tidak ditemukan');

  if (!tahunAjaran) {
    return res.status(400).render('admin/academic-calendars/edit', {
      title: 'Edit Kalender Akademik',
      user: req.user,
      error: 'Tahun ajaran wajib diisi.',
      values: { ...calendar.toObject(), tahunAjaran },
    });
  }

  calendar.tahunAjaran = tahunAjaran;
  if (imgFile) calendar.file = toPublicUrl(imgFile.path);
  calendar.updatedBy = req.user ? req.user._id : calendar.updatedBy;
  await calendar.save();
  return res.redirect('/admin/academic-calendars?success=Kalender akademik berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await AcademicCalendar.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/academic-calendars?success=Kalender akademik berhasil dihapus');
};
