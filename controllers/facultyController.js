const Faculty = require('../models/Faculty');

exports.list = async (req, res) => {
  const faculties = await Faculty.find()
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ nama: 1 });

  res.render('admin/faculties/list', {
    title: 'Fakultas',
    user: req.user,
    faculties,
  });
};

exports.showCreate = (req, res) =>
  res.render('admin/faculties/create', {
    title: 'Tambah Fakultas',
    user: req.user,
    values: {},
  });

exports.create = async (req, res) => {
  const { nama, singkatan } = req.body;
  const values = { nama, singkatan };

  if (!nama || !singkatan) {
    return res.status(400).render('admin/faculties/create', {
      title: 'Tambah Fakultas',
      user: req.user,
      error: 'Nama dan singkatan wajib diisi.',
      values,
    });
  }

  const faculty = new Faculty({
    nama,
    singkatan,
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await faculty.save();
  return res.redirect('/admin/faculties?success=Fakultas berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) return res.redirect('/admin/faculties?error=Data tidak ditemukan');
  return res.render('admin/faculties/edit', {
    title: 'Edit Fakultas',
    user: req.user,
    values: faculty,
  });
};

exports.update = async (req, res) => {
  const { nama, singkatan } = req.body;
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) return res.redirect('/admin/faculties?error=Data tidak ditemukan');

  if (!nama || !singkatan) {
    return res.status(400).render('admin/faculties/edit', {
      title: 'Edit Fakultas',
      user: req.user,
      error: 'Nama dan singkatan wajib diisi.',
      values: { ...faculty.toObject(), nama, singkatan },
    });
  }

  faculty.nama = nama;
  faculty.singkatan = singkatan;
  faculty.updatedBy = req.user ? req.user._id : faculty.updatedBy;
  await faculty.save();
  return res.redirect('/admin/faculties?success=Fakultas berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await Faculty.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/faculties?success=Fakultas berhasil dihapus');
};
