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
const SiteSetting = require('../models/SiteSetting');
const Staff = require('../models/Staff');
const Unit = require('../models/Unit');
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

// Beranda (FR-B-01..08). Hero has no text-over-photo; every section degrades
// gracefully to nothing when its data is empty, rather than showing filler.
exports.getLanding = async (req, res) => {
  const now = new Date();
  const [
    setting,
    latestCalendar,
    pinnedPengumuman,
    pinnedDocs,
    pinnedNews,
    pengumumanTerbaru,
    institusiAcc,
    prodiPeringkat,
    kegiatanTerbaru,
    lulusanAgg,
  ] = await Promise.all([
    SiteSetting.findOne().lean(),
    AcademicCalendar.findOne().sort({ tahunAjaran: -1 }).lean(),
    Pengumuman.find({ status: 'published', pinned: true }).sort({ createdAt: -1 }).limit(3).lean(),
    AcademicDocument.find({ pinned: true }).sort({ createdAt: -1 }).limit(3).lean(),
    News.find({ status: 'published', pinned: true }).sort({ createdAt: -1 }).limit(3).lean(),
    Pengumuman.find({ status: 'published' }).sort({ pinned: -1, createdAt: -1 }).limit(5).lean(),
    Accreditation.find({ jenis: JENIS.INSTITUSI }).populate('lembaga', 'singkatan').sort({ berlakuSampai: -1 }).lean(),
    Accreditation.find({ jenis: { $ne: JENIS.INSTITUSI }, peringkat: { $exists: true } }, 'peringkat').lean(),
    News.find({ status: 'published' }).sort({ pinned: -1, createdAt: -1 }).limit(3).lean(),
    Lulusan.aggregate([{ $group: { _id: '$tahun', total: { $sum: '$jumlah' } } }, { $sort: { _id: -1 } }]),
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
  const peringkatCounts = {};
  prodiPeringkat.forEach(a => { peringkatCounts[a.peringkat] = (peringkatCounts[a.peringkat] || 0) + 1; });
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
    lulusan: tahunTerbaru ? { tahun: tahunTerbaru._id, total: tahunTerbaru.total, totalSemua, persenPerubahan } : null,
  });
};

exports.getStrukturLanding = async (req, res) => {
  const [setting, units] = await Promise.all([
    SiteSetting.findOne().lean(),
    Unit.find().sort({ createdAt: -1 }).lean(),
  ]);

  res.renderPage('landing/struktur-organisasi', {
    title: 'Struktur Organisasi',
    description: 'Struktur organisasi Bidang Akademik Universitas Jenderal Achmad Yani.',
    siteSetting: setting,
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

// Redirect /admin or other legacy home calls to the dashboard renderer so stats is always defined
exports.getHome = async (req, res) => exports.getDashboard(req, res);

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

  const [tahunList, gradBooks] = await Promise.all([
    GraduationBook.distinct('year'),
    GraduationBook.find(filter).sort({ year: -1, periode: 1, createdAt: -1 }).lean(),
  ]);

  res.renderPage('landing/buku-wisuda', {
    title: 'Buku Wisuda',
    description: 'Arsip buku wisuda per periode Universitas Jenderal Achmad Yani.',
    gradBooks,
    tahunList: tahunList.filter(Boolean).sort((a, b) => b - a),
    filters: { tahun: tahunFilter ? String(tahunFilter) : '', periode: periodeFilter },
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
  const kategoriId = String(req.query.kategori || '');

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
  const all = await Staff.find({}, 'nama gelar jabatan foto nomorUrut kelompok')
    .sort({ nomorUrut: 1, createdAt: -1 })
    .lean();
  res.renderPage('landing/pimpinan-staff', {
    title: 'Pimpinan & Staf',
    description: 'Struktur kepemimpinan dan staf Bidang Akademik Universitas Jenderal Achmad Yani.',
    pimpinan: all.filter(s => s.kelompok === 'pimpinan'),
    staf: all.filter(s => s.kelompok !== 'pimpinan'),
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
  const lainnya = await News.find({ status: 'published', _id: { $ne: item._id } })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(4)
    .lean();

  res.renderPage('landing/berita-show', {
    title: item.title,
    description: item.excerpt || item.title,
    item,
    lainnya,
    basePath: '/berita',
  });
};

// Shared by Pengumuman and Berita list pages (FR-P-01..02).
const listContentPage = async (req, res, { Model, view, title, description, basePath, noun }) => {
  const q = String(req.query.q || '').trim();
  const kategoriId = String(req.query.kategori || '');
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

  const items = await Model.find(filter)
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
  const lainnya = await Pengumuman.find({ status: 'published', _id: { $ne: item._id } })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(4)
    .lean();

  res.renderPage('landing/pengumuman-show', {
    title: item.title,
    description: item.excerpt || item.title,
    item,
    lainnya,
    basePath: '/pengumuman',
  });
};

exports.getDashboard = async (req, res) => {
  try {
    const [
      bookCount, gradBookCount, lulusanCount, accCount, calCount, docCount, kurCount,
      newsCount, pengumumanCount, staffCount, programStudiCount, rplDocCount
    ] = await Promise.all([
      Book.countDocuments(),
      GraduationBook.countDocuments(),
      Lulusan.countDocuments(),
      Accreditation.countDocuments(),
      AcademicCalendar.countDocuments(),
      AcademicDocument.countDocuments(),
      Kurikulum.countDocuments(),
      News.countDocuments({ status: 'published' }),
      Pengumuman.countDocuments({ status: 'published' }),
      Staff.countDocuments(),
      ProgramStudi.countDocuments ? ProgramStudi.countDocuments() : Promise.resolve(0),
      RplDocument.countDocuments(),
    ]);

    const [
      latestBooks, latestGradBooks, latestLulusan, latestAccreditations, latestCalendars, latestDocuments, latestKurikulum,
      latestNews, latestPengumuman, latestStaff, latestPrograms, latestRplDocs
    ] = await Promise.all([
      Book.find().sort({ createdAt: -1 }).limit(5),
      GraduationBook.find().sort({ createdAt: -1 }).limit(5),
      Lulusan.find().sort({ createdAt: -1 }).limit(5).populate('programStudi', 'nama'),
      Accreditation.find().sort({ createdAt: -1 }).limit(5),
      AcademicCalendar.find().sort({ createdAt: -1 }).limit(5),
      AcademicDocument.find().sort({ pinned: -1, createdAt: -1 }).limit(5),
      Kurikulum.find().sort({ createdAt: -1 }).limit(5),
      News.find({ status: 'published' }).sort({ pinned: -1, createdAt: -1 }).limit(5),
      Pengumuman.find({ status: 'published' }).sort({ pinned: -1, createdAt: -1 }).limit(5),
      Staff.find().sort({ createdAt: -1 }).limit(5),
      ProgramStudi.find ? ProgramStudi.find().sort({ createdAt: -1 }).limit(5) : [],
      RplDocument.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const recentActivities = [
      ...(latestNews || []).map(item => ({ label: 'Berita', title: item.title, date: item.createdAt, icon: 'ri-newspaper-line', color: 'primary' })),
      ...(latestPengumuman || []).map(item => ({ label: 'Pengumuman', title: item.title, date: item.createdAt, icon: 'ri-megaphone-line', color: 'warning' })),
      ...(latestDocuments || []).map(item => ({ label: 'Dokumen', title: item.name, date: item.createdAt, icon: 'ri-file-list-3-line', color: 'danger' })),
      ...(latestCalendars || []).map(item => ({ label: 'Kalender', title: item.tahunAjaran, date: item.createdAt, icon: 'ri-calendar-event-line', color: 'info' })),
      ...(latestAccreditations || []).map(item => ({ label: 'Akreditasi', title: item.institusi || 'Akreditasi', date: item.createdAt, icon: 'ri-medal-2-line', color: 'success' })),
      ...(latestLulusan || []).map(item => ({ label: 'Lulusan', title: `${item.periode || ''} ${item.tahun || ''}`.trim() || 'Lulusan', date: item.createdAt, icon: 'ri-bar-chart-2-line', color: 'primary' })),
      ...(latestStaff || []).map(item => ({ label: 'Staff', title: item.name, date: item.createdAt, icon: 'ri-team-line', color: 'secondary' })),
      ...(latestPrograms || []).map(item => ({ label: 'Prodi', title: item.name, date: item.createdAt, icon: 'ri-book-mark-line', color: 'primary' })),
      ...(latestRplDocs || []).map(item => ({ label: 'RPL', title: item.name, date: item.createdAt, icon: 'ri-stack-line', color: 'info' })),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 10);

    res.render('admin/index', {
      title: 'Dashboard',
      user: res.locals.user || req.user,
      stats: {
        bookCount, gradBookCount, lulusanCount, accCount, calCount, docCount, kurCount,
        newsCount, pengumumanCount, staffCount, programStudiCount, rplDocCount,
      },
      latest: {
        latestBooks, latestGradBooks, latestLulusan, latestAccreditations, latestCalendars, latestDocuments, latestKurikulum,
        latestNews, latestPengumuman, latestStaff, latestPrograms, latestRplDocs,
      },
      recentActivities,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('admin/index', {
      title: 'Dashboard',
      user: res.locals.user || req.user,
      stats: null,
      latest: null,
      error: 'Gagal memuat data dashboard. Coba lagi nanti.',
    });
  }
};

// Pencarian global (FR-G-06): pengumuman, berita, dokumen, kurikulum.
exports.getCari = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.renderPage('landing/cari', { title: 'Cari', q: '', results: null });
  }

  const rx = { $regex: q, $options: 'i' };
  const [pengumuman, berita, dokumen, kurikulum] = await Promise.all([
    Pengumuman.find({ status: 'published', $or: [{ title: rx }, { excerpt: rx }] }).sort({ createdAt: -1 }).limit(8).lean(),
    News.find({ status: 'published', $or: [{ title: rx }, { excerpt: rx }] }).sort({ createdAt: -1 }).limit(8).lean(),
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

