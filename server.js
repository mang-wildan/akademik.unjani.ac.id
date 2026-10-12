const path = require('path');
const express = require('express');
// Express 4 ignores rejected promises from async handlers; this routes them to
// the error handler instead of crashing the process. Must load before routes.
require('express-async-errors');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const multer = require('multer');

dotenv.config();

const connectDB = require('./config/db');
require('./models'); // register every schema before any route can .populate() one
const User = require('./models/User');
const staffRoutes = require('./routes/staffRoutes');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const graduationBookRoutes = require('./routes/graduationBookRoutes');
const accreditationRoutes = require('./routes/accreditationRoutes');
const academicCalendarRoutes = require('./routes/academicCalendarRoutes');
const academicDocumentRoutes = require('./routes/academicDocumentRoutes');
const newsRoutes = require('./routes/newsRoutes');
const pengumumanRoutes = require('./routes/pengumumanRoutes');
const kurikulumRoutes = require('./routes/kurikulumRoutes');
const unitRoutes = require('./routes/unitRoutes');
const programStudiRoutes = require('./routes/programStudiRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const lembagaAkreditasiRoutes = require('./routes/lembagaAkreditasiRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const userAccountRoutes = require('./routes/userAccountRoutes');
const lulusanRoutes = require('./routes/lulusanRoutes');
const siteSettingRoutes = require('./routes/siteSettingRoutes');
const academicProfileRoutes = require('./routes/academicProfileRoutes');
const rplDocumentRoutes = require('./routes/rplDocumentRoutes');
const indexRoutes = require('./routes/indexRoutes');
const siteSettingCache = require('./utils/siteSettingCache');
const News = require('./models/News');
const Pengumuman = require('./models/Pengumuman');
const AcademicDocument = require('./models/AcademicDocument');
const AcademicCalendar = require('./models/AcademicCalendar');
const { uploadErrorMessage } = require('./utils/upload');
const roles = require('./utils/roles');
const { isStaff } = roles;
const icon = require('./utils/icons');
const format = require('./utils/format');
const navigation = require('./utils/navigation');
const { phoneLink } = require('./utils/contact');
const { TINGKAT } = require('./utils/staffTingkat');
const { assetUrl } = require('./utils/assetVersion');
const { accreditationStatus } = require('./utils/accreditation');
const { calendarEventStatus } = require('./utils/calendar');
const renderPage = require('./middleware/renderPage');
const verifyOrigin = require('./middleware/verifyOrigin');

const app = express();
const PORT = process.env.PORT || 3000;

// Helpers available in every view (new layouts & components).
Object.assign(app.locals, { icon, ...format, ...navigation, phoneLink, TINGKAT, isStaff: roles.isStaff, isSuperadmin: roles.isSuperadmin, roleLabel: roles.roleLabel, accreditationStatus, calendarEventStatus, assetUrl });

// Behind a reverse proxy (Nginx, cPanel, etc.) set TRUST_PROXY to the number of
// proxy hops so req.ip is the visitor's address; login attempt limits rely on it.
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isInteger(hops) ? hops : process.env.TRUST_PROXY);
}

const truncateText = (text, max = 72) => {
  const value = String(text || '').trim();
  if (!value) return '-';
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
};

const toRelativeTime = value => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Connect to MongoDB
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// Long + immutable: uploads keep a unique timestamped filename per file
// (utils/upload.js), and app.css/app.js are only ever linked through
// assetUrl() with a content-hash query string -- both are safe to cache
// for a year because their URL changes whenever their content does.
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1y', immutable: true }));
app.use(verifyOrigin);
app.use(renderPage);
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false, // keep simple for starter template; adjust for stricter CSP as needed
    // Helmet's default "no-referrer" makes browsers send `Origin: null` on
    // every form POST navigation (Fetch spec ties the Origin header to the
    // referrer policy for navigations), which verifyOrigin then rejects as
    // cross-site. This is the browser's own modern default and still sends a
    // real Origin on same-origin navigations.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Attach user to views when token exists (soft authentication for templates)
app.use(async (req, res, next) => {
  const token = req.cookies && req.cookies.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = user;
      res.locals.user = user;
    }
  } catch (error) {
    // Ignore invalid token for public routes
  }
  return next();
});

// Expose current path and absolute URL to templates (active menu states,
// canonical link, og:url — NFR-SEO-01). APP_ORIGIN wins when set (reverse
// proxy / custom domain), otherwise built from this request.
app.use((req, res, next) => {
  res.locals.path = req.path;
  const origin = (process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.locals.canonicalUrl = `${origin}${req.originalUrl}`;
  next();
});

// Site setting for layout/footer: cached in memory (NFR-P-05), not queried
// per request. See utils/siteSettingCache.js; invalidated on save.
app.use(async (_req, res, next) => {
  try {
    res.locals.siteSetting = await siteSettingCache.get();
  } catch (err) {
    // ignore setting errors to avoid breaking requests
  }
  next();
});

// Expose alert messages from query string to templates for SweetAlert2
app.use((req, res, next) => {
  res.locals.alertSuccess = req.query.success || '';
  res.locals.alertError = req.query.error || '';
  next();
});

// Load topbar notifications for admin pages
app.use(async (req, res, next) => {
  if (!(req.path.startsWith('/admin') && res.locals.user && isStaff(res.locals.user))) {
    res.locals.topNotifications = [];
    res.locals.topNotificationCount = 0;
    return next();
  }

  try {
    const [newsItems, pengumumanItems, docItems, calendarItems] = await Promise.all([
      News.find().sort({ updatedAt: -1, createdAt: -1 }).limit(4).lean(),
      Pengumuman.find().sort({ updatedAt: -1, createdAt: -1 }).limit(4).lean(),
      AcademicDocument.find().sort({ updatedAt: -1, createdAt: -1 }).limit(4).lean(),
      AcademicCalendar.find().sort({ updatedAt: -1, createdAt: -1 }).limit(4).lean(),
    ]);

    const notifications = [
      ...newsItems.map(item => ({
        title: truncateText(item.title),
        message: item.status === 'published' ? 'Berita dipublikasikan' : 'Berita disimpan sebagai draft',
        date: item.updatedAt || item.createdAt,
        href: '/admin/news',
        icon: 'ri-newspaper-line',
        iconBg: 'bg-label-primary',
      })),
      ...pengumumanItems.map(item => ({
        title: truncateText(item.title),
        message:
          item.status === 'published'
            ? 'Pengumuman dipublikasikan'
            : 'Pengumuman disimpan sebagai draft',
        date: item.updatedAt || item.createdAt,
        href: '/admin/pengumuman',
        icon: 'ri-megaphone-line',
        iconBg: 'bg-label-warning',
      })),
      ...docItems.map(item => ({
        title: truncateText(item.name),
        message: 'Dokumen akademik diperbarui',
        date: item.updatedAt || item.createdAt,
        href: '/admin/academic-documents',
        icon: 'ri-file-list-3-line',
        iconBg: 'bg-label-danger',
      })),
      ...calendarItems.map(item => ({
        title: truncateText(item.tahunAjaran),
        message: 'Kalender akademik diperbarui',
        date: item.updatedAt || item.createdAt,
        href: '/admin/academic-calendars',
        icon: 'ri-calendar-event-line',
        iconBg: 'bg-label-info',
      })),
    ]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 8)
      .map(item => ({
        ...item,
        timeLabel: toRelativeTime(item.date),
      }));

    res.locals.topNotifications = notifications;
    res.locals.topNotificationCount = notifications.length;
  } catch (err) {
    res.locals.topNotifications = [];
    res.locals.topNotificationCount = 0;
  }

  return next();
});

// Routes
if (process.env.NODE_ENV !== 'production') {
  app.use('/dev', require('./routes/devRoutes'));
}
app.get('/admin', (_req, res) => res.redirect('/admin/dashboard'));
app.use('/admin/books', bookRoutes);
app.use('/admin/graduation-books', graduationBookRoutes);
app.use('/admin/accreditations', accreditationRoutes);
app.use('/admin/academic-calendars', academicCalendarRoutes);
app.use('/admin/academic-documents', academicDocumentRoutes);
app.use('/admin/news', newsRoutes);
app.use('/admin/pengumuman', pengumumanRoutes);
app.use('/admin/kurikulum', kurikulumRoutes);
app.use('/admin/staff', staffRoutes);
app.use('/admin/unit', unitRoutes);
app.use('/admin/program-studi', programStudiRoutes);
app.use('/admin/faculties', facultyRoutes);
app.use('/admin/lembaga-akreditasi', lembagaAkreditasiRoutes);
app.use('/admin/kategori', kategoriRoutes);
app.use('/admin/users', userAccountRoutes);
app.use('/admin/lulusan', lulusanRoutes);
app.use('/admin/settings', siteSettingRoutes);
app.use('/admin/profil-akademik', academicProfileRoutes);
app.use('/admin/rpl-documents', rplDocumentRoutes);
app.use('/', authRoutes);
app.use('/', indexRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).render('landing/error', {
    status: 404,
    heading: 'Halaman tidak ditemukan',
    message: 'Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.',
  });
});

// Only sends the user back to a page on this same site.
const sameOriginReferer = req => {
  try {
    const url = new URL(req.get('referer'));
    return url.host === req.get('host') ? url : null;
  } catch (_err) {
    return null;
  }
};

// Central error handler: never shows stack traces. Upload and validation errors
// on admin forms go back to the form, where the message appears as an alert.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const isUploadError = err instanceof multer.MulterError;
  let status = err.status || err.statusCode || 500;
  if (isUploadError) status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  if (status < 400 || status > 599) status = 500;

  let message = null;
  if (isUploadError) message = uploadErrorMessage(err);
  else if (status < 500 && err.expose) message = err.message;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const back = message && req.method === 'POST' && req.path.startsWith('/admin') ? sameOriginReferer(req) : null;
  if (back) {
    back.searchParams.set('error', message);
    return res.redirect(303, back.pathname + back.search);
  }

  return res.status(status).render('landing/error', {
    status,
    heading: status >= 500 ? 'Terjadi kesalahan pada server' : 'Permintaan tidak dapat diproses',
    message:
      message ||
      (status >= 500
        ? 'Silakan coba beberapa saat lagi. Jika masalah berlanjut, hubungi akademik@unjani.ac.id.'
        : 'Periksa kembali data yang Anda kirim, lalu coba lagi.'),
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port http://localhost:${PORT}`);
});

