const mongoose = require('mongoose');
const Book = require('../models/Book');
const Accreditation = require('../models/Accreditation');
const AcademicCalendar = require('../models/AcademicCalendar');
const AcademicDocument = require('../models/AcademicDocument');
const Pengumuman = require('../models/Pengumuman');
const News = require('../models/News');
const GraduationBook = require('../models/GraduationBook');
const Kurikulum = require('../models/Kurikulum');
const RplDocument = require('../models/RplDocument');
const Lulusan = require('../models/Lulusan');
const Staff = require('../models/Staff');
const Unit = require('../models/Unit');
const { groupByTingkat } = require('../utils/staffTingkat');
const ProgramStudi = require('../models/ProgramStudi');
const { getProfileSingleton } = require('./academicProfileController');
const { normalizeTags } = require('../utils/tagNormalizer');
const Kategori = require('../models/Kategori');
const LembagaAkreditasi = require('../models/LembagaAkreditasi'); // eslint-disable-line no-unused-vars -- registers schema for .populate('lembaga')
const Faculty = require('../models/Faculty');
const { accreditationStatus, JENIS, PERINGKAT } = require('../utils/accreditation');
const { SEMESTER, calendarEventStatus, currentAndNext, byStart } = require('../utils/calendar');
const { jenjangFromNama } = require('../utils/prodi');
const { sanitizeHtml } = require('../utils/html');
const { dayKey } = require('../utils/dates');
const { isSuperadmin } = require('../utils/roles');
const ADMIN_LAYOUT = 'layouts/admin-v2';

// ?kategori= comes straight from the URL: a malformed id would make Mongoose throw a
// CastError (HTTP 500), so anything that is not an ObjectId is treated as "no filter".
const kategoriParam = value => (mongoose.isValidObjectId(String(value || '')) ? String(value) : '');

// Beranda (FR-B-01..08). Since F7 the hero puts text over the photo behind a
// near-opaque green overlay; every section degrades gracefully to nothing when
// its data is empty, rather than showing filler.
exports.getLanding = async (req, res) => {
  const now = new Date();
  const setting = res.locals.siteSetting;
  const [
    latestCalendar,
    pinnedPengumuman,
    pinnedDocs,
    pinnedNews,
    pengumumanTerbaru,
    institusiAcc,
    prodiPeringkat,
    prodiIds,
    kegiatanTerbaru,
    lulusanAgg,
    units,
  ] = await Promise.all([
    AcademicCalendar.findOne().sort({ tahunAjaran: -1 }).lean(),
    Pengumuman.find({ status: 'published', pinned: true }, 'title slug createdAt').sort({ createdAt: -1 }).limit(3).lean(),
    AcademicDocument.find({ pinned: true }, 'name file createdAt').sort({ createdAt: -1 }).limit(3).lean(),
    News.find({ status: 'published', pinned: true }, 'title slug createdAt').sort({ createdAt: -1 }).limit(3).lean(),
    Pengumuman.find({ status: 'published' }, 'title slug createdAt excerpt pinned kategori').populate('kategori', 'nama').sort({ pinned: -1, createdAt: -1 }).limit(5).lean(),
    Accreditation.find({ jenis: JENIS.INSTITUSI }, 'peringkat berlakuSampai lembaga').populate('lembaga', 'singkatan').sort({ berlakuSampai: -1 }).lean(),
    // Newest first, with deterministic tie-breaks. Existing prodi ids come from a parallel
    // query (not .populate, which would add a sequential round-trip) to skip links to deleted prodi.
    Accreditation.find({ jenis: JENIS.PRODI }, 'peringkat programStudi berlakuSampai')
      .sort({ berlakuSampai: -1, tanggalBerlaku: -1, _id: -1 }).lean(),
    ProgramStudi.distinct('_id'),
    News.find({ status: 'published' }, 'title slug createdAt featuredImage excerpt pinned kategori').populate('kategori', 'nama').sort({ pinned: -1, createdAt: -1 }).limit(3).lean(),
    Lulusan.aggregate([{ $group: { _id: '$tahun', total: { $sum: '$jumlah' } } }, { $sort: { _id: -1 } }]),
    Unit.find({}, 'nama img link').sort({ createdAt: -1 }).lean(),
  ]);

  // "Informasi Penting" (FR-B-02): newest 3 pinned items across the three content types.
  const informasiPenting = [
    ...pinnedPengumuman.map(d => ({ jenis: 'Pengumuman', judul: d.title, href: `/pengumuman/${d.slug}`, tanggal: d.createdAt })),
    ...pinnedDocs.map(d => ({ jenis: 'Dokumen', judul: d.name, href: d.file, tanggal: d.createdAt })),
    ...pinnedNews.map(d => ({ jenis: 'Berita', judul: d.title, href: `/berita/${d.slug}`, tanggal: d.createdAt })),
  ].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 3);

  // "Agenda Akademik Terdekat" (FR-B-03): from the newest academic year's calendar.
  const agenda = latestCalendar ? currentAndNext(latestCalendar.events, now, 4) : { berlangsung: [], berikutnya: [] };
  const agendaItems = [...agenda.berlangsung, ...agenda.berikutnya].slice(0, 4);

  // "Status Mutu Institusi" (FR-B-05): every institutional record shown as-is
  // (see getAkreditasiLanding for why none is picked as "the" status).
  institusiAcc.forEach(a => { a.status = accreditationStatus(a.berlakuSampai); });
  // Prodi distribution: only each existing program's newest certificate, and
  // only while it is valid — older, expired or undated ones would claim a grade
  // nobody can be shown to hold now. Rows arrive newest-first, so the first per prodi wins.
  const prodiAda = new Set(prodiIds.map(String));
  const terbaruPerProdi = new Map();
  prodiPeringkat.forEach(a => {
    const key = String(a.programStudi || '');
    if (!prodiAda.has(key)) return;
    if (!terbaruPerProdi.has(key)) terbaruPerProdi.set(key, a);
  });
  const peringkatCounts = {};
  terbaruPerProdi.forEach(a => {
    const { key } = accreditationStatus(a.berlakuSampai, now);
    if (!a.peringkat || (key !== 'berlaku' && key !== 'segera-berakhir')) return;
    peringkatCounts[a.peringkat] = (peringkatCounts[a.peringkat] || 0) + 1;
  });
  const peringkatStats = PERINGKAT.map(p => ({ peringkat: p, total: peringkatCounts[p] || 0 })).filter(p => p.total > 0);

  // Lulusan (FR-B-07): latest year vs the one before it.
  const [tahunTerbaru, tahunSebelumnya] = lulusanAgg;
  const totalSemua = lulusanAgg.reduce((sum, y) => sum + y.total, 0);
  const persenPerubahan = tahunTerbaru && tahunSebelumnya && tahunSebelumnya.total
    ? Math.round(((tahunTerbaru.total - tahunSebelumnya.total) / tahunSebelumnya.total) * 1000) / 10
    : null;

  res.renderPage('landing/index', {
    title: 'Beranda',
    description: 'Kalender, kurikulum, dokumen, dan informasi akademik resmi Universitas Jenderal Achmad Yani.',
    setting,
    informasiPenting,
    agendaItems,
    pengumumanTerbaru,
    institusiAcc,
    peringkatStats,
    kegiatanTerbaru,
    units,
    lulusan: tahunTerbaru ? { tahun: tahunTerbaru._id, total: tahunTerbaru.total, totalSemua, persenPerubahan } : null,
  });
};

exports.getStrukturLanding = async (req, res) => {
  const units = await Unit.find().sort({ createdAt: -1 }).lean();

  res.renderPage('landing/struktur-organisasi', {
    title: 'Struktur Organisasi',
    description: 'Struktur organisasi Bidang Akademik Universitas Jenderal Achmad Yani.',
    siteSetting: res.locals.siteSetting,
    units, // versi teks alternatif dari bagan (FR-L-04)
  });
};

exports.getProfil = async (req, res) => {
  const [profileContent, units] = await Promise.all([
    getProfileSingleton(req.user || res.locals.user),
    Unit.find().sort({ createdAt: -1 }).lean(),
  ]);

  res.renderPage('landing/profil', {
    title: 'Profil Bidang Akademik',
    description: profileContent.ringkasan.slice(0, 160),
    profileContent,
    units,
  });
};

exports.getBuku = async (req, res) => {
  const tahunFilter = parseInt(req.query.tahun, 10) || null;
  const filter = tahunFilter ? { year: tahunFilter } : {};
  const limit = 12;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const [tahunList, total] = await Promise.all([
    Book.distinct('year'),
    Book.countDocuments(filter),
  ]);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const books = await Book.find(filter)
    .sort({ year: -1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .lean();
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  res.renderPage('landing/buku', {
    title: 'Buku',
    description: 'Koleksi buku panduan dan referensi Universitas Jenderal Achmad Yani.',
    books,
    tahunList: tahunList.filter(Boolean).sort((a, b) => b - a),
    filters: { tahun: tahunFilter ? String(tahunFilter) : '' },
    pagination: { page: currentPage, totalPages, total, from, to },
  });
};

exports.getBukuWisudaLanding = async (req, res) => {
  const tahunFilter = parseInt(req.query.tahun, 10) || null;
  const periodeFilter = String(req.query.periode || '');
  const filter = {};
  if (tahunFilter) filter.year = tahunFilter;
  if (periodeFilter) filter.periode = periodeFilter;
  const limit = 15;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const [tahunList, total] = await Promise.all([
    GraduationBook.distinct('year'),
    GraduationBook.countDocuments(filter),
  ]);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const gradBooks = await GraduationBook.find(filter)
    .sort({ year: -1, periode: 1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .lean();
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  res.renderPage('landing/buku-wisuda', {
    title: 'Buku Wisuda',
    description: 'Arsip buku wisuda per periode Universitas Jenderal Achmad Yani.',
    gradBooks,
    tahunList: tahunList.filter(Boolean).sort((a, b) => b - a),
    filters: { tahun: tahunFilter ? String(tahunFilter) : '', periode: periodeFilter },
    pagination: { page: currentPage, totalPages, total, from, to },
  });
};

// Groups certificates for the same unit/prodi so the table shows the newest
// as the current row, with older ones available as expandable history
// (FR-A-06). Institutional-level rows are never merged with a program's.
const groupAccreditationHistory = docs => {
  const groups = new Map();
  docs.forEach(d => {
    const key = d.jenis === JENIS.PRODI && d.programStudi ? `prodi:${d.programStudi._id}` : `${d.jenis}:${(d.namaUnit || '').toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  });
  const rows = [];
  groups.forEach(list => {
    const [current, ...history] = [...list].sort((a, b) => new Date(b.berlakuSampai) - new Date(a.berlakuSampai));
    rows.push({ ...current, history });
  });
  return rows;
};

exports.getAkreditasiLanding = async (req, res) => {
  const docs = await Accreditation.find({ jenis: { $exists: true } })
    .populate({ path: 'programStudi', select: 'nama fakultas', populate: { path: 'fakultas', select: 'nama singkatan' } })
    .populate('lembaga', 'singkatan nama')
    .sort({ berlakuSampai: -1 })
    .lean();

  docs.forEach(d => {
    d.status = accreditationStatus(d.berlakuSampai);
    d.label = d.jenis === JENIS.PRODI && d.programStudi ? d.programStudi.nama : d.namaUnit;
  });

  // Shown as-is, not merged into one "current" status (FR-A-01): legacy data
  // can have more than one institutional record whose active flag disagrees
  // with its dates (see docs/MIGRASI-F2.md) — hiding one would assert an
  // answer the content team hasn't confirmed yet.
  const institusi = docs.filter(d => d.jenis === JENIS.INSTITUSI);

  const peringkatCounts = {};
  docs.filter(d => d.jenis !== JENIS.INSTITUSI).forEach(d => {
    if (d.peringkat) peringkatCounts[d.peringkat] = (peringkatCounts[d.peringkat] || 0) + 1;
  });
  const peringkatStats = PERINGKAT.map(p => ({ peringkat: p, total: peringkatCounts[p] || 0 })).filter(p => p.total > 0);

  const rows = groupAccreditationHistory(docs);
  const fakultasList = await Faculty.find().sort({ nama: 1 }).lean();

  const q = String(req.query.q || '').trim().toLowerCase();
  const statusFilter = String(req.query.status || '');
  const fakultasFilter = String(req.query.fakultas || '');
  let filtered = rows.filter(r => {
    if (q && !`${r.label} ${r.programStudi?.fakultas?.nama || ''}`.toLowerCase().includes(q)) return false;
    if (statusFilter && r.status.key !== statusFilter) return false;
    if (fakultasFilter && String(r.programStudi?.fakultas?._id) !== fakultasFilter) return false;
    return true;
  });
  filtered.sort((a, b) => a.label.localeCompare(b.label, 'id', { sensitivity: 'base' }));

  const limit = 12;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * limit, currentPage * limit);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, filtered.length);

  res.renderPage('landing/akreditasi', {
    title: 'Akreditasi',
    description: 'Status akreditasi institusi dan program studi Universitas Jenderal Achmad Yani.',
    institusi,
    peringkatStats,
    rows: pageRows,
    fakultasList,
    filters: { q: req.query.q || '', status: statusFilter, fakultas: fakultasFilter },
    pagination: { page: currentPage, totalPages, total: filtered.length, from: start, to: end },
  });
};

exports.getKalenderLanding = async (req, res) => {
  const calendars = await AcademicCalendar.find().sort({ tahunAjaran: -1, createdAt: -1 }).lean();
  if (!calendars.length) {
    return res.renderPage('landing/kalender-akademik', {
      title: 'Kalender Akademik',
      description: 'Kalender akademik resmi Universitas Jenderal Achmad Yani.',
      calendars: [],
      calendar: null,
    });
  }

  const calendar = calendars.find(c => c.tahunAjaran === req.query.tahun) || calendars[0];
  const { berlangsung, berikutnya } = currentAndNext(calendar.events, new Date(), 2);
  const bySemester = SEMESTER.map(s => ({
    ...s,
    events: (calendar.events || [])
      .filter(e => e.semester === s.value)
      .sort(byStart)
      .map(e => ({ ...e, status: calendarEventStatus(e.mulai, e.selesai) })),
  }));

  res.renderPage('landing/kalender-akademik', {
    title: 'Kalender Akademik',
    description: `Kalender akademik Universitas Jenderal Achmad Yani tahun ajaran ${calendar.tahunAjaran}.`,
    calendars,
    calendar,
    bySemester,
    berlangsung,
    berikutnya,
  });
};

exports.getKurikulumLanding = async (req, res) => {
  const docs = await Kurikulum.find({})
    .populate({ path: 'prodi', select: 'nama fakultas', populate: { path: 'fakultas', select: 'nama' } })
    .sort({ tahun: -1 })
    .lean();

  docs.forEach(d => {
    d.namaProdi = d.prodi ? d.prodi.nama : d.programStudi;
    d.namaFakultas = d.prodi?.fakultas ? d.prodi.fakultas.nama : d.fakultas;
    d.jenjang = jenjangFromNama(d.namaProdi);
  });

  const fakultasFilter = String(req.query.fakultas || '');
  const jenjangFilter = String(req.query.jenjang || '');
  const filtered = docs.filter(d => {
    if (fakultasFilter && d.namaFakultas !== fakultasFilter) return false;
    if (jenjangFilter && d.jenjang !== jenjangFilter) return false;
    return true;
  });

  const byFakultas = new Map();
  filtered.forEach(d => {
    const key = d.namaFakultas || 'Lainnya';
    if (!byFakultas.has(key)) byFakultas.set(key, []);
    byFakultas.get(key).push(d);
  });
  const groups = [...byFakultas.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'id'))
    .map(([fakultas, items]) => ({ fakultas, items: items.sort((a, b) => a.namaProdi.localeCompare(b.namaProdi, 'id')) }));

  const fakultasList = [...new Set(docs.map(d => d.namaFakultas).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
  const jenjangList = [...new Set(docs.map(d => d.jenjang))].sort();

  res.renderPage('landing/kurikulum', {
    title: 'Kurikulum',
    description: 'Dokumen kurikulum program studi Universitas Jenderal Achmad Yani.',
    groups,
    fakultasList,
    jenjangList,
    filters: { fakultas: fakultasFilter, jenjang: jenjangFilter },
    total: filtered.length,
  });
};

exports.getDokumenAkademikLanding = async (req, res) => {
  const limit = 12;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const q = String(req.query.q || '').trim();
  const kategoriId = kategoriParam(req.query.kategori);

  const filter = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { keterangan: { $regex: q, $options: 'i' } }];
  if (kategoriId) filter.kategori = kategoriId;

  const [kategoriList, kategoriCounts, totalDocs, totalDocsAll] = await Promise.all([
    Kategori.find({ jenis: 'dokumen', isActive: true }).sort({ urutan: 1 }).lean(),
    AcademicDocument.aggregate([{ $group: { _id: '$kategori', total: { $sum: 1 } } }]),
    AcademicDocument.countDocuments(filter),
    AcademicDocument.countDocuments(),
  ]);
  const countByKategori = Object.fromEntries(kategoriCounts.map(c => [String(c._id), c.total]));
  const kategoriOptions = kategoriList.map(k => ({ ...k, total: countByKategori[String(k._id)] || 0 }));

  const totalPages = Math.max(Math.ceil(totalDocs / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const documents = await AcademicDocument.find(filter)
    .sort({ pinned: -1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .populate('kategori', 'nama')
    .lean();
  const start = totalDocs === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalDocs);

  res.renderPage('landing/dokumen-akademik', {
    title: 'Dokumen Akademik',
    description: 'Formulir, pedoman, dan peraturan akademik resmi Universitas Jenderal Achmad Yani.',
    documents,
    kategoriOptions,
    totalDocsAll,
    filters: { q, kategori: kategoriId },
    pagination: { page: currentPage, totalPages, total: totalDocs, from: start, to: end },
  });
};

exports.getRplLanding = async (req, res) => {
  const rplDocs = await RplDocument.find().sort({ status: -1, tahun: -1, createdAt: -1 }).lean();

  res.renderPage('landing/rpl', {
    title: 'Rekognisi Pembelajaran Lampau (RPL)',
    description: 'Dokumen dan panduan Rekognisi Pembelajaran Lampau (RPL) Universitas Jenderal Achmad Yani.',
    rplDocs,
  });
};

exports.getPimpinanStaffLanding = async (req, res) => {
  // NIP/NID is never sent to this view (K-05) — only fields the public page uses are selected.
  const all = await Staff.find({}, 'nama gelar jabatan foto nomorUrut tingkat')
    .sort({ nomorUrut: 1, createdAt: -1 })
    .lean();
  res.renderPage('landing/pimpinan-staff', {
    title: 'Pimpinan & Staf',
    description: 'Struktur kepemimpinan dan staf Bidang Akademik Universitas Jenderal Achmad Yani.',
    grup: groupByTingkat(all),
  });
};

exports.getBeritaLanding = (req, res) =>
  listContentPage(req, res, {
    Model: News,
    view: 'landing/berita',
    title: 'Berita',
    description: 'Berita dan kegiatan akademik Universitas Jenderal Achmad Yani.',
    basePath: '/berita',
    noun: 'berita',
  });

// Sidebar "Kategori" on the detail pages (F7 R3): active categories that have
// at least one published item, with counts — an empty category would link to an empty list.
const kategoriSidebar = async (Model, jenis) => {
  const [list, counts] = await Promise.all([
    Kategori.find({ jenis, isActive: true }, 'nama').sort({ urutan: 1 }).lean(),
    Model.aggregate([
      { $match: { status: 'published', kategori: { $ne: null } } },
      { $group: { _id: '$kategori', total: { $sum: 1 } } },
    ]),
  ]);
  const totalById = new Map(counts.map(c => [String(c._id), c.total]));
  return list
    .map(k => ({ _id: k._id, nama: k.nama, total: totalById.get(String(k._id)) || 0 }))
    .filter(k => k.total > 0);
};

exports.getBeritaDetail = async (req, res) => {
  const item = await News.findOne({ slug: req.params.slug, status: 'published' })
    .populate('kategori', 'nama')
    .populate('createdBy', 'name')
    .lean();
  if (!item) {
    return res.status(404).render('landing/error', { status: 404, heading: 'Berita tidak ditemukan', message: 'Berita yang Anda cari tidak tersedia atau sudah dihapus.' });
  }
  // Defense in depth: old content was saved before sanitizeHtml existed, and
  // the F4 admin form is the real write-time guard (NFR-S-06).
  item.body = sanitizeHtml(item.body);
  const [lainnya, kategoriList] = await Promise.all([
    News.find({ status: 'published', _id: { $ne: item._id } }, 'title slug createdAt featuredImage')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(4)
      .lean(),
    kategoriSidebar(News, 'berita'),
  ]);

  res.renderPage('landing/berita-show', {
    title: item.title,
    description: item.excerpt || item.title,
    item,
    lainnya,
    kategoriList,
    basePath: '/berita',
  });
};

// Shared by Pengumuman and Berita list pages (FR-P-01..02).
const listContentPage = async (req, res, { Model, view, title, description, basePath, noun }) => {
  const q = String(req.query.q || '').trim();
  const kategoriId = kategoriParam(req.query.kategori);
  const filter = { status: 'published' };
  if (q) filter.$or = [{ title: { $regex: q, $options: 'i' } }, { excerpt: { $regex: q, $options: 'i' } }];
  if (kategoriId) filter.kategori = kategoriId;

  const jenis = Model.modelName === 'News' ? 'berita' : 'pengumuman';
  const limit = 10;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const [kategoriList, total] = await Promise.all([
    Kategori.find({ jenis, isActive: true }).sort({ urutan: 1 }).lean(),
    Model.countDocuments(filter),
  ]);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const currentPage = Math.min(page, totalPages);

  // The list never shows body, and one news body can be hundreds of KB.
  const items = await Model.find(filter)
    .select('-body')
    .sort({ pinned: -1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .populate('kategori', 'nama')
    .lean();
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  items.forEach(item => {
    item.isBaru = new Date(item.createdAt).getTime() >= sevenDaysAgo;
  });

  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  res.renderPage(view, {
    title,
    description,
    items,
    kategoriList,
    filters: { q, kategori: kategoriId },
    pagination: { page: currentPage, totalPages, total, from, to },
    basePath,
    noun,
  });
};

exports.getPengumumanLanding = (req, res) =>
  listContentPage(req, res, {
    Model: Pengumuman,
    view: 'landing/pengumuman',
    title: 'Pengumuman',
    description: 'Pengumuman resmi akademik Universitas Jenderal Achmad Yani.',
    basePath: '/pengumuman',
    noun: 'pengumuman',
  });

exports.getPengumumanDetail = async (req, res) => {
  const item = await Pengumuman.findOne({ slug: req.params.slug, status: 'published' })
    .populate('kategori', 'nama')
    .populate('createdBy', 'name')
    .lean();
  if (!item) {
    return res.status(404).render('landing/error', { status: 404, heading: 'Pengumuman tidak ditemukan', message: 'Pengumuman yang Anda cari tidak tersedia atau sudah dihapus.' });
  }
  item.body = sanitizeHtml(item.body);
  const [lainnya, kategoriList] = await Promise.all([
    Pengumuman.find({ status: 'published', _id: { $ne: item._id } }, 'title slug createdAt')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(4)
      .lean(),
    kategoriSidebar(Pengumuman, 'pengumuman'),
  ]);

  res.renderPage('landing/pengumuman-show', {
    title: item.title,
    description: item.excerpt || item.title,
    item,
    lainnya,
    kategoriList,
    basePath: '/pengumuman',
  });
};

// Dasbor (FR-DS-01..04). "Perlu Perhatian" dihitung dari data saat ini, tidak
// pernah disimpan — konsisten dengan status akreditasi/kalender di publik.
const isValidHttpUrl = value => {
  if (!value) return true; // kosong = tidak ditampilkan (lihat Beranda), bukan "tidak valid"
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch (_err) {
    return false;
  }
};

exports.getDashboard = async (req, res) => {
  const now = new Date();
  const today = dayKey(now);
  const dayStart = new Date(`${today}T00:00:00+07:00`);
  const dueDate = new Date(new Date(`${today}T23:59:59.999+07:00`).getTime() + 90 * 86400000);
  const oldDate = new Date(now.getTime() - 30 * 86400000);
  const setting = res.locals.siteSetting;
  const [
    beritaTerbit, pengumumanAktif, dokCount,
    akreditasiAll, beritaTanpaGambar, pengumumanTanpaGambar,
    kalenderTerbaru, aktivitas, sematanLama, draftGroups, akreditasiExpired,
  ] = await Promise.all([
    News.countDocuments({ status: 'published' }),
    Pengumuman.countDocuments({ status: 'published' }),
    AcademicDocument.countDocuments(),
    Accreditation.find({ berlakuSampai: { $type: 'date', $lte: dueDate } }, 'namaUnit unit institusi berlakuSampai jenis').lean(),
    News.find({ status: 'published', $or: [{ featuredImage: '' }, { featuredImage: { $exists: false } }] }, 'title').lean(),
    Pengumuman.find({ status: 'published', $or: [{ featuredImage: '' }, { featuredImage: { $exists: false } }] }, 'title').lean(),
    AcademicCalendar.findOne().sort({ tahunAjaran: -1 }).lean(),
    Promise.all([
      News.find({}, 'title createdAt updatedAt createdBy updatedBy').populate('createdBy updatedBy', 'name').sort({ updatedAt: -1 }).limit(5).lean().then(rows => rows.map(r => ({ ...r, label: 'Berita', href: '/admin/news' }))),
      Pengumuman.find({}, 'title createdAt updatedAt createdBy updatedBy').populate('createdBy updatedBy', 'name').sort({ updatedAt: -1 }).limit(5).lean().then(rows => rows.map(r => ({ ...r, label: 'Pengumuman', href: '/admin/pengumuman' }))),
      AcademicDocument.find({}, 'name createdAt updatedAt createdBy updatedBy').populate('createdBy updatedBy', 'name').sort({ updatedAt: -1 }).limit(5).lean().then(rows => rows.map(r => ({ ...r, title: r.name, label: 'Dokumen Akademik', href: '/admin/academic-documents' }))),
      RplDocument.find({}, 'judul createdAt updatedAt createdBy updatedBy').populate('createdBy updatedBy', 'name').sort({ updatedAt: -1 }).limit(5).lean().then(rows => rows.map(r => ({ ...r, title: r.judul, label: 'Dokumen RPL', href: '/admin/rpl-documents' }))),
      AcademicCalendar.find({}, 'tahunAjaran createdAt updatedAt createdBy updatedBy').populate('createdBy updatedBy', 'name').sort({ updatedAt: -1 }).limit(3).lean().then(rows => rows.map(r => ({ ...r, title: `Kalender ${r.tahunAjaran}`, label: 'Kalender Akademik', href: '/admin/academic-calendars' }))),
      Accreditation.find({}, 'namaUnit peringkat createdAt updatedAt createdBy updatedBy').populate('createdBy updatedBy', 'name').sort({ updatedAt: -1 }).limit(3).lean().then(rows => rows.map(r => ({ ...r, title: r.namaUnit || r.peringkat || 'Akreditasi', label: 'Akreditasi', href: '/admin/accreditations' }))),
      Staff.find({}, 'nama createdAt updatedAt createdBy updatedBy').populate('createdBy updatedBy', 'name').sort({ updatedAt: -1 }).limit(3).lean().then(rows => rows.map(r => ({ ...r, title: r.nama, label: 'Pimpinan & Staf', href: '/admin/staff' }))),
    ]),
    Pengumuman.find({ pinned: true, createdAt: { $lt: oldDate } }, 'title').sort({ createdAt: 1 }).lean(),
    Promise.all([
      News.find({ status: 'draft' }, 'title updatedAt').sort({ updatedAt: -1 }).limit(5).lean().then(rows => rows.map(row => ({ ...row, label: 'Berita', href: `/admin/news/${row._id}/edit` }))),
      Pengumuman.find({ status: 'draft' }, 'title updatedAt').sort({ updatedAt: -1 }).limit(5).lean().then(rows => rows.map(row => ({ ...row, label: 'Pengumuman', href: `/admin/pengumuman/${row._id}/edit` }))),
    ]),
    Accreditation.countDocuments({ berlakuSampai: { $type: 'date', $lt: dayStart } }),
  ]);

  const akreditasiKedaluwarsa = akreditasiAll.filter(a => accreditationStatus(a.berlakuSampai).key !== 'berlaku');

  const issues = [];
  if (sematanLama.length) {
    issues.push({ icon: 'keep', title: `${sematanLama.length} pengumuman tersemat berusia lebih dari 30 hari`, text: sematanLama.slice(0, 3).map(item => item.title).join(', '), href: `/admin/pengumuman/${sematanLama[0]._id}/edit`, label: 'Tinjau' });
  }
  if (akreditasiKedaluwarsa.length) {
    issues.push({
      icon: 'warning', title: `${akreditasiKedaluwarsa.length} akreditasi kedaluwarsa atau segera berakhir`,
      text: akreditasiKedaluwarsa.slice(0, 3).map(a => a.namaUnit || a.unit || a.institusi).join(', '),
      href: '/admin/accreditations', label: 'Tinjau',
    });
  }
  const tanpaGambar = [...beritaTanpaGambar.map(b => b.title), ...pengumumanTanpaGambar.map(p => p.title)];
  if (tanpaGambar.length) {
    issues.push({
      icon: 'image', title: `${tanpaGambar.length} konten terbit tanpa gambar sampul`,
      text: tanpaGambar.slice(0, 3).join(', '), href: '/admin/news', label: 'Lihat',
    });
  }
  if (isSuperadmin(req.user) && !isValidHttpUrl(setting?.landingVideoUrl)) {
    issues.push({ icon: 'error', title: 'URL video profil tidak valid', text: setting.landingVideoUrl, href: '/admin/settings/edit', label: 'Perbaiki' });
  }
  const tahunBerjalan = `${now.getFullYear()}/${now.getFullYear() + 1}`;
  const tahunLalu = `${now.getFullYear() - 1}/${now.getFullYear()}`;
  if (!kalenderTerbaru || ![tahunBerjalan, tahunLalu].includes(kalenderTerbaru.tahunAjaran) || !(kalenderTerbaru.events || []).length) {
    issues.push({
      icon: 'event', title: `Kalender akademik ${tahunBerjalan} belum lengkap`,
      text: kalenderTerbaru ? `Kalender terbaru: ${kalenderTerbaru.tahunAjaran}` : 'Belum ada kalender diunggah',
      href: '/admin/academic-calendars', label: 'Kelola',
    });
  }

  // FR-AD-08 (Sebaiknya): siapa + kapan + aksi apa, lewat createdBy/updatedBy
  // yang sudah dicatat tiap model -- bukan koleksi audit-log terpisah, jadi
  // tidak menangkap penghapusan (item yang dihapus tidak lagi ada untuk
  // di-query). "Dibuat" vs "Diperbarui" dibedakan dari selisih createdAt/
  // updatedAt: keduanya sama persis hanya pada create pertama.
  const ICONS = { Berita: 'newspaper', Pengumuman: 'campaign', 'Dokumen Akademik': 'description', 'Dokumen RPL': 'verified', 'Kalender Akademik': 'event', Akreditasi: 'workspace_premium', 'Pimpinan & Staf': 'groups' };
  const actorName = u => (u && u.name) || 'Sistem';
  const recentActivities = aktivitas
    .flat()
    .map(r => {
      const created = new Date(r.createdAt).getTime();
      const updated = new Date(r.updatedAt).getTime();
      const isCreate = Math.abs(updated - created) < 2000;
      const actor = actorName(isCreate ? r.createdBy : r.updatedBy);
      return { label: `${r.label} · ${isCreate ? 'Dibuat' : 'Diperbarui'} oleh ${actor}`, title: r.title, date: r.updatedAt, icon: ICONS[r.label] || 'description', href: r.href };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  res.renderPage(
    'admin/dashboard',
    {
      title: 'Dasbor',
      stats: {
        beritaTerbit, pengumumanAktif, dokCount,
        akreditasiKedaluwarsa: akreditasiExpired,
      },
      issues,
      recentActivities,
      drafts: draftGroups.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    },
    ADMIN_LAYOUT
  );
};

// Pencarian global (FR-G-06): pengumuman, berita, dokumen, kurikulum.
exports.getCari = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.renderPage('landing/cari', { title: 'Cari', q: '', results: null });
  }

  const rx = { $regex: q, $options: 'i' };
  const [pengumuman, berita, dokumen, kurikulum] = await Promise.all([
    Pengumuman.find({ status: 'published', $or: [{ title: rx }, { excerpt: rx }] }, 'title slug createdAt').sort({ createdAt: -1 }).limit(8).lean(),
    News.find({ status: 'published', $or: [{ title: rx }, { excerpt: rx }] }, 'title slug createdAt').sort({ createdAt: -1 }).limit(8).lean(),
    AcademicDocument.find({ $or: [{ name: rx }, { keterangan: rx }] }).sort({ createdAt: -1 }).limit(8).lean(),
    Kurikulum.find({ $or: [{ nama: rx }, { programStudi: rx }] }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  res.renderPage('landing/cari', {
    title: `Cari: ${q}`,
    q,
    results: {
      pengumuman: pengumuman.map(p => ({ judul: p.title, href: `/pengumuman/${p.slug}`, tanggal: p.createdAt })),
      berita: berita.map(n => ({ judul: n.title, href: `/berita/${n.slug}`, tanggal: n.createdAt })),
      dokumen: dokumen.map(d => ({ judul: d.name, href: d.file, tanggal: d.createdAt })),
      kurikulum: kurikulum.map(k => ({ judul: k.nama, href: '/kurikulum', tanggal: k.createdAt })),
    },
  });
};

