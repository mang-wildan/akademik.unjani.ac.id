const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const connectDB = require('./config/db');
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
const lulusanRoutes = require('./routes/lulusanRoutes');
const siteSettingRoutes = require('./routes/siteSettingRoutes');
const academicProfileRoutes = require('./routes/academicProfileRoutes');
const rplDocumentRoutes = require('./routes/rplDocumentRoutes');
const indexRoutes = require('./routes/indexRoutes');
const SiteSetting = require('./models/SiteSetting');
const News = require('./models/News');
const Pengumuman = require('./models/Pengumuman');
const AcademicDocument = require('./models/AcademicDocument');
const AcademicCalendar = require('./models/AcademicCalendar');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false, // keep simple for starter template; adjust for stricter CSP as needed
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

// Expose current path to templates for active menu states
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// Load site setting per request for landing banners
app.use(async (_req, res, next) => {
  try {
    const setting = await SiteSetting.findOne();
    res.locals.siteSetting = setting;
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
  if (!(req.path.startsWith('/admin') && res.locals.user && res.locals.user.role === 'admin')) {
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
app.use('/admin/lulusan', lulusanRoutes);
app.use('/admin/settings', siteSettingRoutes);
app.use('/admin/profil-akademik', academicProfileRoutes);
app.use('/admin/rpl-documents', rplDocumentRoutes);
app.use('/', authRoutes);
app.use('/', indexRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404);
  res.render('admin/index', {
    title: 'Not Found',
    error: 'Halaman tidak ditemukan.',
    user: req.user,
    stats: { bookCount: 0, gradBookCount: 0, accCount: 0, calCount: 0, docCount: 0, kurCount: 0 },
    latest: null,
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port http://localhost:${PORT}`);
});

