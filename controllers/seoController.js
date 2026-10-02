// robots.txt + sitemap.xml (NFR-SEO-02). Static public routes are listed by
// hand (there are few and they rarely change); detail pages for Pengumuman
// and Berita are included dynamically for every published item.
const Pengumuman = require('../models/Pengumuman');
const News = require('../models/News');

const STATIC_PATHS = [
  { path: '/', priority: '1.0' },
  { path: '/profil', priority: '0.6' },
  { path: '/struktur-organisasi', priority: '0.5' },
  { path: '/pimpinan-dan-staff', priority: '0.5' },
  { path: '/akreditasi', priority: '0.8' },
  { path: '/kalender-akademik', priority: '0.8' },
  { path: '/kurikulum', priority: '0.7' },
  { path: '/dokumen-akademik', priority: '0.7' },
  { path: '/rpl', priority: '0.6' },
  { path: '/buku', priority: '0.5' },
  { path: '/buku-wisuda', priority: '0.5' },
  { path: '/berita', priority: '0.8' },
  { path: '/pengumuman', priority: '0.8' },
];

const originOf = req => (process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const xmlEscape = s => String(s).replace(/&/g, '&amp;');

exports.robotsTxt = (req, res) => {
  const origin = originOf(req);
  res.type('text/plain').send(
    ['User-agent: *', 'Disallow: /admin', 'Disallow: /dashboard', 'Disallow: /login', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')
  );
};

exports.sitemap = async (req, res) => {
  const origin = originOf(req);
  const [pengumuman, berita] = await Promise.all([
    Pengumuman.find({ status: 'published' }, 'slug updatedAt').lean(),
    News.find({ status: 'published' }, 'slug updatedAt').lean(),
  ]);

  const urls = [
    ...STATIC_PATHS.map(p => ({ loc: `${origin}${p.path}`, priority: p.priority })),
    ...pengumuman.map(p => ({ loc: `${origin}/pengumuman/${p.slug}`, lastmod: p.updatedAt, priority: '0.6' })),
    ...berita.map(b => ({ loc: `${origin}/berita/${b.slug}`, lastmod: b.updatedAt, priority: '0.6' })),
  ];

  const body = urls
    .map(u => `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}<priority>${u.priority}</priority></url>`)
    .join('\n');

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
};
