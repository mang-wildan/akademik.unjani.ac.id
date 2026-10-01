const path = require('path');
const Book = require('../models/Book');

const publicPath = path.join(__dirname, '..', 'public');

const toPublicUrl = (filePath) => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

exports.list = async (req, res) => {
  // Urutkan dari data terbaru ke terlama (berdasarkan tahun lalu createdAt)
  const books = await Book.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ year: -1, createdAt: -1 });

  res.render('admin/books/list', {
    title: 'Daftar Buku',
    user: req.user,
    books,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/books/create', {
    title: 'Tambah Buku',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { title, year } = req.body;
  const pdfFile = req.files && req.files.pdf && req.files.pdf[0];
  const coverFile = req.files && req.files.cover && req.files.cover[0];
  const values = { title, year, src: pdfFile?.originalname, cover: coverFile?.originalname };

  if (!title || !pdfFile || !coverFile) {
    return res.status(400).render('admin/books/create', {
      title: 'Tambah Buku',
      user: req.user,
      error: 'Title, file PDF, dan cover wajib diisi.',
      values,
    });
  }

  const srcPath = toPublicUrl(pdfFile.path);
  const coverPath = toPublicUrl(coverFile.path);

  const book = new Book({
    title,
    year,
    src: srcPath,
    cover: coverPath,
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await book.save();
  return res.redirect('/admin/books?success=Buku berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.redirect('/admin/books?error=Data tidak ditemukan');
  }
  return res.render('admin/books/edit', {
    title: 'Edit Buku',
    user: req.user,
    values: book,
  });
};

exports.update = async (req, res) => {
  const { title, year } = req.body;
  const pdfFile = req.files && req.files.pdf && req.files.pdf[0];
  const coverFile = req.files && req.files.cover && req.files.cover[0];

  const book = await Book.findById(req.params.id);
  if (!book) return res.redirect('/admin/books?error=Data tidak ditemukan');

  if (!title) {
    return res.status(400).render('admin/books/edit', {
      title: 'Edit Buku',
      user: req.user,
      error: 'Title wajib diisi.',
      values: { ...book.toObject(), title, year },
    });
  }

  book.title = title;
  book.year = year;
  if (pdfFile) book.src = toPublicUrl(pdfFile.path);
  if (coverFile) book.cover = toPublicUrl(coverFile.path);
  book.updatedBy = req.user ? req.user._id : book.updatedBy;
  await book.save();
  return res.redirect('/admin/books?success=Buku berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/books?success=Buku berhasil dihapus');
};
