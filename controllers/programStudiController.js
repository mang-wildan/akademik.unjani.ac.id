const ProgramStudi = require('../models/ProgramStudi');
const Faculty = require('../models/Faculty');

const loadFaculties = async () => Faculty.find().sort({ nama: 1 });

exports.list = async (req, res) => {
  const programs = await ProgramStudi.find()
    .populate('fakultas', 'nama singkatan')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ nama: 1 });

  res.render('admin/program-studi/list', {
    title: 'Program Studi',
    user: req.user,
    programs,
  });
};

exports.showCreate = async (req, res) => {
  const faculties = await loadFaculties();
  res.render('admin/program-studi/create', {
    title: 'Tambah Program Studi',
    user: req.user,
    values: {},
    faculties,
  });
};

exports.create = async (req, res) => {
  const { nama, singkatan, fakultas } = req.body;
  const faculties = await loadFaculties();
  const values = { nama, singkatan, fakultas };

  if (!nama || !singkatan || !fakultas) {
    return res.status(400).render('admin/program-studi/create', {
      title: 'Tambah Program Studi',
      user: req.user,
      error: 'Nama, singkatan, dan fakultas wajib diisi.',
      values,
      faculties,
    });
  }

  const program = new ProgramStudi({
    nama,
    singkatan,
    fakultas,
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await program.save();
  return res.redirect('/admin/program-studi?success=Program Studi berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const program = await ProgramStudi.findById(req.params.id);
  if (!program) return res.redirect('/admin/program-studi?error=Data tidak ditemukan');
  const faculties = await loadFaculties();
  return res.render('admin/program-studi/edit', {
    title: 'Edit Program Studi',
    user: req.user,
    values: program,
    faculties,
  });
};

exports.update = async (req, res) => {
  const { nama, singkatan, fakultas } = req.body;
  const program = await ProgramStudi.findById(req.params.id);
  const faculties = await loadFaculties();
  if (!program) return res.redirect('/admin/program-studi?error=Data tidak ditemukan');

  if (!nama || !singkatan || !fakultas) {
    return res.status(400).render('admin/program-studi/edit', {
      title: 'Edit Program Studi',
      user: req.user,
      error: 'Nama, singkatan, dan fakultas wajib diisi.',
      values: { ...program.toObject(), nama, singkatan, fakultas },
      faculties,
    });
  }

  program.nama = nama;
  program.singkatan = singkatan;
  program.fakultas = fakultas;
  program.updatedBy = req.user ? req.user._id : program.updatedBy;
  await program.save();
  return res.redirect('/admin/program-studi?success=Program Studi berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await ProgramStudi.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/program-studi?success=Program Studi berhasil dihapus');
};

exports.importCsv = async (req, res) => {
  const file = req.file;
  if (!file) return res.redirect('/admin/program-studi?error=File CSV wajib diunggah');

  const text = file.buffer.toString('utf-8');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return res.redirect('/admin/program-studi?error=File CSV kosong');

  const rows = [];
  const facultyCache = {};
  const findFacultyId = async key => {
    if (!key) return null;
    const norm = key.toLowerCase();
    if (facultyCache[norm]) return facultyCache[norm];
    const f = await Faculty.findOne({
      $or: [{ singkatan: new RegExp(`^${norm}$`, 'i') }, { nama: new RegExp(`^${norm}$`, 'i') }],
    }).select('_id');
    if (f) facultyCache[norm] = f._id;
    return f ? f._id : null;
  };

  // detect header
  const header = lines[0].toLowerCase().replace(/\s+/g, '');
  const startIdx = header.includes('nama') && header.includes('singkatan') ? 1 : 0;

  let imported = 0;
  let skipped = 0;
  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 3) {
      skipped++;
      continue;
    }
    const [nama, singkatan, fakultasKey] = parts;
    if (!nama || !singkatan || !fakultasKey) {
      skipped++;
      continue;
    }
    const fakultasId = await findFacultyId(fakultasKey);
    if (!fakultasId) {
      skipped++;
      continue;
    }
    const exists = await ProgramStudi.findOne({
      nama: new RegExp(`^${nama}$`, 'i'),
      fakultas: fakultasId,
    }).select('_id');
    if (exists) {
      skipped++;
      continue;
    }
    rows.push({
      nama,
      singkatan,
      fakultas: fakultasId,
      createdBy: req.user ? req.user._id : undefined,
      updatedBy: req.user ? req.user._id : undefined,
    });
  }

  if (rows.length) {
    await ProgramStudi.insertMany(rows);
    imported = rows.length;
  }

  const msg = `Import selesai. Berhasil: ${imported}, dilewati: ${skipped}.`;
  return res.redirect(`/admin/program-studi?success=${encodeURIComponent(msg)}`);
};
