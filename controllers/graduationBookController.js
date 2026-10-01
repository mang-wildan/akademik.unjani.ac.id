const path = require('path');
const GraduationBook = require('../models/GraduationBook');

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = (filePath) => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

exports.list = async (req, res) => {
  const books = await GraduationBook.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ createdAt: -1 });

  res.render('admin/graduation-books/list', {
    title: 'Daftar Buku Kelulusan',
    user: req.user,
    books,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/graduation-books/create', {
    title: 'Tambah Buku Kelulusan',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { title, periode, year } = req.body;
  const pdfFile = req.files && req.files.pdf && req.files.pdf[0];
  const coverFile = req.files && req.files.cover && req.files.cover[0];
  const values = { title, periode, year };

  if (!title || !periode || !year || !pdfFile || !coverFile) {
    return res.status(400).render('admin/graduation-books/create', {
      title: 'Tambah Buku Kelulusan',
      user: req.user,
      error: 'Title, periode, tahun, PDF, dan cover wajib diisi.',
      values,
    });
  }

  const book = new GraduationBook({
    title,
    periode,
    year,
    src: toPublicUrl(pdfFile.path),
    cover: toPublicUrl(coverFile.path),
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await book.save();
  return res.redirect('/admin/graduation-books?success=Buku kelulusan berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const book = await GraduationBook.findById(req.params.id);
  if (!book) return res.redirect('/admin/graduation-books?error=Data tidak ditemukan');
  return res.render('admin/graduation-books/edit', {
    title: 'Edit Buku Kelulusan',
    user: req.user,
    values: book,
  });
};

exports.update = async (req, res) => {
  const { title, periode, year } = req.body;
  const pdfFile = req.files && req.files.pdf && req.files.pdf[0];
  const coverFile = req.files && req.files.cover && req.files.cover[0];

  const book = await GraduationBook.findById(req.params.id);
  if (!book) return res.redirect('/admin/graduation-books?error=Data tidak ditemukan');

  if (!title || !periode || !year) {
    return res.status(400).render('admin/graduation-books/edit', {
      title: 'Edit Buku Kelulusan',
      user: req.user,
      error: 'Title, periode, dan tahun wajib diisi.',
      values: { ...book.toObject(), title, periode, year },
    });
  }

  book.title = title;
  book.periode = periode;
  book.year = year;
  if (pdfFile) book.src = toPublicUrl(pdfFile.path);
  if (coverFile) book.cover = toPublicUrl(coverFile.path);
  book.updatedBy = req.user ? req.user._id : book.updatedBy;
  await book.save();
  return res.redirect('/admin/graduation-books?success=Buku kelulusan berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await GraduationBook.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/graduation-books?success=Buku kelulusan berhasil dihapus');
};
