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

exports.getLanding = async (req, res) => {
  const [
    pengumumans,
    latestDocs,
    latestNews,
    pinnedNews,
    pinnedPengumumans,
    pinnedDocs,
    setting,
    accreditationDocs,
    lulusanAgg,
  ] = await Promise.all([
    Pengumuman.find({ status: 'published' }).sort({ pinned: -1, createdAt: -1 }).limit(3),
    AcademicDocument.find({}).sort({ pinned: -1, createdAt: -1 }).limit(4),
    News.find({ status: 'published' }).sort({ pinned: -1, createdAt: -1 }).limit(3),
    News.find({ status: 'published', pinned: true }).sort({ createdAt: -1 }).limit(4),
    Pengumuman.find({ status: 'published', pinned: true }).sort({ createdAt: -1 }).limit(4),
    AcademicDocument.find({ pinned: true }).sort({ createdAt: -1 }).limit(4),
    SiteSetting.findOne(),
    Accreditation.find({ isActive: { $ne: false } }, 'akreditasi').sort({ createdAt: 1 }).lean(),
    Lulusan.aggregate([
      { $group: { _id: { tahun: '$tahun', periode: '$periode' }, total: { $sum: '$jumlah' } } },
      { $sort: { '_id.tahun': 1, '_id.periode': 1 } },
    ]),
  ]);

  const accreditationChart = [];
  const accreditationIndexMap = {};
  accreditationDocs.forEach((a) => {
    const label = String(a.akreditasi || '').trim();
    if (!label) return;
    if (typeof accreditationIndexMap[label] === 'number') {
      accreditationChart[accreditationIndexMap[label]].value += 1;
      return;
    }
    accreditationIndexMap[label] = accreditationChart.length;
    accreditationChart.push({ label, value: 1 });
  });

  // Build lulusan chart data (stacked by periode per tahun)
  const periodeLabels = ['I', 'II', 'III'];
  const yearMap = {};
  lulusanAgg.forEach(item => {
    const tahun = item._id?.tahun || 0;
    const periode = (item._id?.periode || '').toUpperCase();
    if (!yearMap[tahun]) yearMap[tahun] = {};
    yearMap[tahun][periode] = item.total || 0;
  });
  const years = Object.keys(yearMap).map(Number).sort((a, b) => a - b);
  const palette = ['#0ea5e9', '#22c55e', '#f97316'];
  const lulusanChart = {
    labels: years,
    datasets: periodeLabels.map((p, idx) => ({
      label: `Periode ${p}`,
      data: years.map(y => yearMap[y]?.[p] || 0),
      backgroundColor: palette[idx % palette.length],
      stack: 'periode',
      borderRadius: 6,
      borderSkipped: false,
    })),
    total: lulusanAgg.reduce((acc, cur) => acc + (cur.total || 0), 0),
  };

  res.render('landing/index', {
    title: 'Beranda',
    user: res.locals.user || req.user,
    pengumumans,
    latestDocs,
    latestNews,
    pinnedNews,
    pinnedPengumumans,
    pinnedDocs,
    setting,
    accreditationChart,
    lulusanChart,
  });
};

exports.getStrukturLanding = async (req, res) => {
  const setting = await SiteSetting.findOne();
  const formatDate = (d) =>
    d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  const strukturUpdatedLabel = formatDate(
    (setting && (setting.strukturOrganisasiUpdatedAt || setting.updatedAt)) || null
  );

  res.render('landing/struktur-organisasi', {
    title: 'Struktur Organisasi',
    user: res.locals.user || req.user,
    siteSetting: setting,
    strukturUpdatedLabel,
  });
};

exports.getProfil = async (req, res) => {
  const [profileContent, units, setting] = await Promise.all([
    getProfileSingleton(req.user || res.locals.user),
    Unit.find().sort({ createdAt: -1 }),
    SiteSetting.findOne(),
  ]);

  res.render('landing/profil', {
    title: 'Profil',
    user: res.locals.user || req.user,
    profileContent,
    units,
    siteSetting: setting,
  });
};

// Redirect /admin or other legacy home calls to the dashboard renderer so stats is always defined
exports.getHome = async (req, res) => exports.getDashboard(req, res);

exports.getBuku = async (req, res) => {
  const limit = 12;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const totalBooks = await Book.countDocuments();
  const totalPages = Math.max(Math.ceil(totalBooks / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const books = await Book.find()
    .sort({ year: -1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit);
  const start = totalBooks === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalBooks);
  res.render('landing/buku', {
    title: 'Buku',
    user: res.locals.user || req.user,
    books,
    pagination: { totalBooks, totalPages, currentPage, start, end },
  });
};

exports.getBukuWisudaLanding = async (req, res) => {
  const gradBooks = await GraduationBook.find().sort({ year: -1, createdAt: -1 });
  res.render('landing/buku-wisuda', {
    title: 'Buku Wisuda',
    user: res.locals.user || req.user,
    gradBooks,
  });
};

exports.getAkreditasiLanding = async (req, res) => {
  const normalize = value =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  const slugify = value =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'group';

  const allAccreditations = await Accreditation.find({}).sort({ tahun: -1, createdAt: -1 }).lean();
  const groupMap = new Map();

  allAccreditations.forEach(item => {
    const institusiDisplay = String(item.institusi || '').trim() || '-';
    const unitDisplay = String(item.unit || '').trim() || '-';
    const key = `${normalize(institusiDisplay)}||${normalize(unitDisplay)}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        institusi: institusiDisplay,
        unit: unitDisplay,
        activeRows: [],
        inactiveRows: [],
      });
    }

    const group = groupMap.get(key);
    if (item.isActive === false) {
      group.inactiveRows.push(item);
      return;
    }
    group.activeRows.push(item);
  });

  const byNewestYear = (a, b) => {
    const yearA = Number(a && a.tahun ? a.tahun : 0);
    const yearB = Number(b && b.tahun ? b.tahun : 0);
    if (yearB !== yearA) return yearB - yearA;
    return new Date(b && b.createdAt ? b.createdAt : 0) - new Date(a && a.createdAt ? a.createdAt : 0);
  };

  const groupedRaw = Array.from(groupMap.values())
    .filter(group => group.activeRows.length > 0)
    .map(group => {
      const activeRows = group.activeRows.sort(byNewestYear);
      const inactiveRows = group.inactiveRows.sort(byNewestYear);
      const latestActiveYear = activeRows.length ? Number(activeRows[0].tahun || 0) : 0;
      return {
        institusi: group.institusi,
        unit: group.unit,
        activeRows,
        inactiveRows,
        latestActiveYear,
      };
    })
    .sort((a, b) => {
      if (b.latestActiveYear !== a.latestActiveYear) return b.latestActiveYear - a.latestActiveYear;
      const byInstitusi = a.institusi.localeCompare(b.institusi, 'id', { sensitivity: 'base' });
      if (byInstitusi !== 0) return byInstitusi;
      return a.unit.localeCompare(b.unit, 'id', { sensitivity: 'base' });
    });

  const accreditationGroups = groupedRaw.map((group, idx) => ({
    ...group,
    groupId: `ac-group-${idx + 1}-${slugify(`${group.institusi}-${group.unit}`)}`,
  }));

  const totalVisible = accreditationGroups.reduce((sum, group) => sum + group.activeRows.length, 0);
  const totalHidden = accreditationGroups.reduce((sum, group) => sum + group.inactiveRows.length, 0);
  const accreditationSummary = {
    totalAll: totalVisible + totalHidden,
    totalVisible,
    totalHidden,
    totalGroups: accreditationGroups.length,
  };

  res.render('landing/akreditasi', {
    title: 'Akreditasi',
    user: res.locals.user || req.user,
    accreditationGroups,
    accreditationSummary,
  });
};

exports.getKalenderLanding = async (req, res) => {
  const calendars = await AcademicCalendar.find().sort({ tahunAjaran: -1, createdAt: -1 }).populate('createdBy');
  res.render('landing/kalender-akademik', {
    title: 'Kalender Akademik',
    user: res.locals.user || req.user,
    calendars,
  });
};

exports.getKurikulumLanding = async (req, res) => {
  const kurikulums = await Kurikulum.find({}).sort({ tahun: -1, createdAt: -1 }).populate('createdBy');
  res.render('landing/kurikulum', {
    title: 'Kurikulum',
    user: res.locals.user || req.user,
    kurikulums,
  });
};

exports.getDokumenAkademikLanding = async (req, res) => {
  const limit = 12;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const totalDocs = await AcademicDocument.countDocuments();
  const totalPages = Math.max(Math.ceil(totalDocs / limit), 1);
  const currentPage = Math.min(page, totalPages);
  const documents = await AcademicDocument.find({})
    .sort({ pinned: -1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .populate('createdBy');
  const start = totalDocs === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalDocs);

  res.render('landing/dokumen-akademik', {
    title: 'Dokumen Akademik',
    user: res.locals.user || req.user,
    documents,
    pagination: { totalDocs, totalPages, currentPage, start, end },
  });
};

exports.getRplLanding = async (req, res) => {
  const [rplDocs, setting] = await Promise.all([
    RplDocument.find()
    .populate('createdBy', 'name email')
    .sort({ status: -1, tahun: -1, createdAt: -1 }),
    SiteSetting.findOne(),
  ]);
  const activeDoc = rplDocs.find(d => d.status);

  res.render('landing/rpl', {
    title: 'RPL',
    user: res.locals.user || req.user,
    rplDocs,
    activeDoc,
    setting,
  });
};

exports.getPimpinanStaffLanding = async (req, res) => {
  const staffs = await Staff.find().sort({ nomorUrut: 1, createdAt: -1 });
  res.render('landing/pimpinan-staff', {
    title: 'Pimpinan dan Staff',
    user: res.locals.user || req.user,
    staffs,
  });
};

exports.getBeritaLanding = async (req, res) => {
  const search = (req.query.q || '').trim();
  const filter = { status: 'published' };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { body: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const limit = 5;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const [totalNews, recentNews, tagSource] = await Promise.all([
    News.countDocuments(filter),
    News.find({ status: 'published' }).sort({ pinned: -1, createdAt: -1 }).limit(5),
    News.find({ status: 'published' }, 'tags').lean(),
  ]);

  const totalPages = Math.max(Math.ceil(totalNews / limit), 1);
  const currentPage = Math.min(page, totalPages);

  const newsList = await News.find(filter)
    .sort({ pinned: -1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .populate('createdBy');
  newsList.forEach(item => {
    item.displayTags = normalizeTags(item.tags);
  });

  const tagCounts = {};
  const tagLabels = {};
  tagSource.forEach(n => {
    normalizeTags(n.tags).forEach(tag => {
      if (!tag) return;
      const key = tag.toLowerCase();
      tagLabels[key] = tagLabels[key] || tag;
      tagCounts[key] = (tagCounts[key] || 0) + 1;
    });
  });
  const categories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({ name: tagLabels[key] || key, count }));
  const allTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => tagLabels[key] || key);

  const start = totalNews === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalNews);
  const pagination = { totalNews, totalPages, currentPage, start, end };

  res.render('landing/berita', {
    title: 'Berita',
    user: res.locals.user || req.user,
    newsList,
    recentNews,
    categories,
    allTags,
    pagination,
    q: search,
    paginationQuery: search ? `&q=${encodeURIComponent(search)}` : '',
  });
};

exports.getBeritaDetail = async (req, res) => {
  const item = await News.findOne({ slug: req.params.slug, status: 'published' }).populate('createdBy');
  if (!item) return res.status(404).render('landing/404', { title: 'Berita tidak ditemukan', user: res.locals.user || req.user });
  const displayTags = normalizeTags(item.tags);
  const recentNews = await News.find({ status: 'published', _id: { $ne: item._id } })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(4);
  const tagCounts = {};
  const tagLabels = {};
  const all = await News.find({ status: 'published' });
  all.forEach(n => normalizeTags(n.tags).forEach(t => {
    if (!t) return;
    const key = t.toLowerCase();
    tagLabels[key] = tagLabels[key] || t;
    tagCounts[key] = (tagCounts[key] || 0) + 1;
  }));
  const categories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({ name: tagLabels[key] || key, count }));
  const allTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => tagLabels[key] || key);
  res.render('landing/berita-show', {
    title: item.title,
    user: res.locals.user || req.user,
    item,
    displayTags,
    recentNews,
    categories,
    allTags,
  });
};

exports.getPengumumanLanding = async (req, res) => {
  const search = (req.query.q || '').trim();
  const filter = { status: 'published' };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { body: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const limit = 5;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const [totalPengumuman, recentPengumuman, tagSource] = await Promise.all([
    Pengumuman.countDocuments(filter),
    Pengumuman.find({ status: 'published' }).sort({ pinned: -1, createdAt: -1 }).limit(5),
    Pengumuman.find({ status: 'published' }, 'tags').lean(),
  ]);

  const totalPages = Math.max(Math.ceil(totalPengumuman / limit), 1);
  const currentPage = Math.min(page, totalPages);

  const pengumumanList = await Pengumuman.find(filter)
    .sort({ pinned: -1, createdAt: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .populate('createdBy');
  pengumumanList.forEach(item => {
    item.displayTags = normalizeTags(item.tags);
  });

  const tagCounts = {};
  const tagLabels = {};
  tagSource.forEach(p => {
    normalizeTags(p.tags).forEach(tag => {
      if (!tag) return;
      const key = tag.toLowerCase();
      tagLabels[key] = tagLabels[key] || tag;
      tagCounts[key] = (tagCounts[key] || 0) + 1;
    });
  });
  const categories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({ name: tagLabels[key] || key, count }));
  const allTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => tagLabels[key] || key);

  const start = totalPengumuman === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalPengumuman);
  const pagination = { totalPengumuman, totalPages, currentPage, start, end };

  res.render('landing/pengumuman', {
    title: 'Pengumuman',
    user: res.locals.user || req.user,
    pengumumanList,
    recentPengumuman,
    categories,
    allTags,
    pagination,
    q: search,
    paginationQuery: search ? `&q=${encodeURIComponent(search)}` : '',
  });
};

exports.getPengumumanDetail = async (req, res) => {
  const item = await Pengumuman.findOne({ slug: req.params.slug, status: 'published' }).populate('createdBy');
  if (!item) return res.status(404).render('landing/404', { title: 'Pengumuman tidak ditemukan', user: res.locals.user || req.user });
  const displayTags = normalizeTags(item.tags);
  const recentPengumuman = await Pengumuman.find({ status: 'published', _id: { $ne: item._id } })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(4);
  const tagCounts = {};
  const tagLabels = {};
  const all = await Pengumuman.find({ status: 'published' });
  all.forEach(n => normalizeTags(n.tags).forEach(t => {
    if (!t) return;
    const key = t.toLowerCase();
    tagLabels[key] = tagLabels[key] || t;
    tagCounts[key] = (tagCounts[key] || 0) + 1;
  }));
  const categories = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({ name: tagLabels[key] || key, count }));
  const allTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => tagLabels[key] || key);
  res.render('landing/pengumuman-show', {
    title: item.title,
    user: res.locals.user || req.user,
    item,
    displayTags,
    recentPengumuman,
    categories,
    allTags,
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

