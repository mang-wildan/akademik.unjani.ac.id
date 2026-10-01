const mongoose = require('mongoose');
const Lulusan = require('../models/Lulusan');
const ProgramStudi = require('../models/ProgramStudi');
const Faculty = require('../models/Faculty');

const loadPrograms = async () =>
  ProgramStudi.find().populate('fakultas', 'nama singkatan').sort({ nama: 1 });

const loadFaculties = async () => Faculty.find().sort({ nama: 1 });

exports.list = async (req, res) => {
  const lulusans = await Lulusan.find()
    .populate('programStudi', 'nama singkatan fakultas')
    .populate('fakultas', 'nama singkatan')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ tahun: -1, periode: -1, createdAt: -1 });

  res.render('admin/lulusan/list', {
    title: 'Data Lulusan',
    user: req.user,
    lulusans,
  });
};

exports.showCreate = async (req, res) => {
  const [programs, faculties] = await Promise.all([loadPrograms(), loadFaculties()]);
  res.render('admin/lulusan/create', {
    title: 'Tambah Data Lulusan',
    user: req.user,
    values: { tahun: new Date().getFullYear() },
    programs,
    faculties,
  });
};

exports.create = async (req, res) => {
  const { programStudi, fakultas, periode, tahun, jumlah } = req.body;
  const [programs, faculties] = await Promise.all([loadPrograms(), loadFaculties()]);

  const parsedTahun = parseInt(tahun, 10);
  const parsedJumlah = parseInt(jumlah, 10);
  const values = { programStudi, fakultas, periode, tahun, jumlah };

  if (
    !programStudi ||
    !fakultas ||
    !periode ||
    Number.isNaN(parsedTahun) ||
    Number.isNaN(parsedJumlah) ||
    parsedJumlah < 0 ||
    parsedTahun < 1900 ||
    parsedTahun > 2100
  ) {
    return res.status(400).render('admin/lulusan/create', {
      title: 'Tambah Data Lulusan',
      user: req.user,
      error: 'Program studi, fakultas, periode, tahun, dan jumlah wajib diisi.',
      values,
      programs,
      faculties,
    });
  }

  const prodi = await ProgramStudi.findById(programStudi).select('_id');
  const fakultasDoc = await Faculty.findById(fakultas).select('_id');
  if (!prodi || !fakultasDoc) {
    return res.status(404).render('admin/lulusan/create', {
      title: 'Tambah Data Lulusan',
      user: req.user,
      error: 'Program studi atau fakultas tidak ditemukan.',
      values,
      programs,
      faculties,
    });
  }

  const lulusan = new Lulusan({
    programStudi,
    fakultas,
    periode: periode.trim(),
    tahun: parsedTahun,
    jumlah: parsedJumlah,
    createdBy: req.user ? req.user._id : undefined,
    updatedBy: req.user ? req.user._id : undefined,
  });
  await lulusan.save();
  return res.redirect('/admin/lulusan?success=Data lulusan berhasil ditambahkan');
};

exports.showEdit = async (req, res) => {
  const lulusan = await Lulusan.findById(req.params.id);
  if (!lulusan) return res.redirect('/admin/lulusan?error=Data tidak ditemukan');
  const [programs, faculties] = await Promise.all([loadPrograms(), loadFaculties()]);

  return res.render('admin/lulusan/edit', {
    title: 'Edit Data Lulusan',
    user: req.user,
    values: lulusan,
    programs,
    faculties,
  });
};

exports.update = async (req, res) => {
  const { programStudi, fakultas, periode, tahun, jumlah } = req.body;
  const lulusan = await Lulusan.findById(req.params.id);
  if (!lulusan) return res.redirect('/admin/lulusan?error=Data tidak ditemukan');

  const [programs, faculties] = await Promise.all([loadPrograms(), loadFaculties()]);
  const parsedTahun = parseInt(tahun, 10);
  const parsedJumlah = parseInt(jumlah, 10);

  if (
    !programStudi ||
    !fakultas ||
    !periode ||
    Number.isNaN(parsedTahun) ||
    Number.isNaN(parsedJumlah) ||
    parsedJumlah < 0 ||
    parsedTahun < 1900 ||
    parsedTahun > 2100
  ) {
    return res.status(400).render('admin/lulusan/edit', {
      title: 'Edit Data Lulusan',
      user: req.user,
      error: 'Program studi, fakultas, periode, tahun, dan jumlah wajib diisi.',
      values: { ...lulusan.toObject(), programStudi, fakultas, periode, tahun, jumlah },
      programs,
      faculties,
    });
  }

  const prodi = await ProgramStudi.findById(programStudi).select('_id');
  const fakultasDoc = await Faculty.findById(fakultas).select('_id');
  if (!prodi || !fakultasDoc) {
    return res.status(404).render('admin/lulusan/edit', {
      title: 'Edit Data Lulusan',
      user: req.user,
      error: 'Program studi atau fakultas tidak ditemukan.',
      values: { ...lulusan.toObject(), programStudi, fakultas, periode, tahun, jumlah },
      programs,
      faculties,
    });
  }

  lulusan.programStudi = programStudi;
  lulusan.fakultas = fakultas;
  lulusan.periode = periode.trim();
  lulusan.tahun = parsedTahun;
  lulusan.jumlah = parsedJumlah;
  lulusan.updatedBy = req.user ? req.user._id : lulusan.updatedBy;
  await lulusan.save();
  return res.redirect('/admin/lulusan?success=Data lulusan berhasil diperbarui');
};

exports.destroy = async (req, res) => {
  await Lulusan.findByIdAndDelete(req.params.id);
  return res.redirect('/admin/lulusan?success=Data lulusan berhasil dihapus');
};

exports.importCsv = async (req, res) => {
  const file = req.file;
  if (!file) return res.redirect('/admin/lulusan?error=File CSV wajib diunggah');

  const text = file.buffer.toString('utf-8');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return res.redirect('/admin/lulusan?error=File CSV kosong');

  const header = lines[0].toLowerCase().replace(/\s+/g, '');
  const hasHeader = header.includes('program') && header.includes('fakultas');
  const startIdx = hasHeader ? 1 : 0;

  const rows = [];
  let imported = 0;
  let skipped = 0;

  const prodiCache = {};
  const fakultasCache = {};
  const normalizeKey = key => (key || '').toString().trim().toLowerCase();

  const findProdi = async key => {
    const norm = normalizeKey(key);
    if (!norm) return null;
    if (prodiCache[norm]) return prodiCache[norm];
    // match by ObjectId or by nama / singkatan
    const byId = mongoose.Types.ObjectId.isValid(key) ? await ProgramStudi.findById(key).select('_id fakultas') : null;
    if (byId) {
      prodiCache[norm] = byId;
      return byId;
    }
    const prodi = await ProgramStudi.findOne({
      $or: [
        { nama: new RegExp(`^${norm}$`, 'i') },
        { singkatan: new RegExp(`^${norm}$`, 'i') },
      ],
    }).select('_id fakultas');
    if (prodi) prodiCache[norm] = prodi;
    return prodi || null;
  };

  const findFakultas = async key => {
    const norm = normalizeKey(key);
    if (!norm) return null;
    if (fakultasCache[norm]) return fakultasCache[norm];
    const byId = mongoose.Types.ObjectId.isValid(key) ? await Faculty.findById(key).select('_id') : null;
    if (byId) {
      fakultasCache[norm] = byId;
      return byId;
    }
    const fakultas = await Faculty.findOne({
      $or: [
        { nama: new RegExp(`^${norm}$`, 'i') },
        { singkatan: new RegExp(`^${norm}$`, 'i') },
      ],
    }).select('_id');
    if (fakultas) fakultasCache[norm] = fakultas;
    return fakultas || null;
  };

  for (let i = startIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 5) {
      skipped++;
      continue;
    }
    const [prodiKey, fakultasKey, periode, tahunRaw, jumlahRaw] = parts;
    const tahun = parseInt(tahunRaw, 10);
    const jumlah = parseInt(jumlahRaw, 10);

    if (!prodiKey || !fakultasKey || !periode || Number.isNaN(tahun) || Number.isNaN(jumlah)) {
      skipped++;
      continue;
    }

    const prodi = await findProdi(prodiKey);
    const fakultas = await findFakultas(fakultasKey) || (prodi && prodi.fakultas ? await Faculty.findById(prodi.fakultas).select('_id') : null);

    if (!prodi || !fakultas) {
      skipped++;
      continue;
    }

    rows.push({
      programStudi: prodi._id,
      fakultas: fakultas._id || fakultas,
      periode,
      tahun,
      jumlah,
      createdBy: req.user ? req.user._id : undefined,
      updatedBy: req.user ? req.user._id : undefined,
    });
  }

  if (rows.length) {
    await Lulusan.insertMany(rows);
    imported = rows.length;
  }

  const msg = `Import selesai. Berhasil: ${imported}, dilewati: ${skipped}.`;
  return res.redirect(`/admin/lulusan?success=${encodeURIComponent(msg)}`);
};
