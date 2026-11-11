const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const render = (overrides = {}) => ejs.renderFile(path.join(__dirname, '../views/landing/index.ejs'), {
  ...require('../utils/format'), icon: require('../utils/icons'),
  informasiPenting: [], agendaItems: [], kegiatanTerbaru: [], institusiAcc: [], peringkatStats: [],
  lulusan: null, pengumumanTerbaru: [], units: [], setting: {}, ...overrides,
});

test('home uses a split solid hero and ruled quick links without decorative glass or gradients', async () => {
  const html = await render();
  assert.match(html, /lg:grid-cols-2/);
  assert.match(html, /aria-labelledby="akses-judul"/);
  assert.doesNotMatch(html, /backdrop-blur|bg-linear|shadow-card/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.doesNotMatch(html, /id="agenda-judul"|id="info-penting"|id="kegiatan-judul"|id="mutu-judul"|id="lulusan-judul"|id="pengumuman-judul"|id="unit-judul"|<iframe/);
});

test('home agenda overlaps hero and data sections retain escaped titles, links and status', async () => {
  const date = new Date('2026-11-11');
  const html = await render({
    agendaItems: [{ mulai: date, selesai: date, nama: '<Agenda>', status: { label: 'Berlangsung', tone: 'success' } }],
    informasiPenting: [{ jenis: 'Dokumen', href: '/dokumen.pdf', judul: '<Dokumen>', tanggal: date }],
    kegiatanTerbaru: [{ title: '<Berita>', slug: 'kabar', createdAt: date, kategori: { nama: 'Kegiatan' } }],
    pengumumanTerbaru: [{ title: '<Pengumuman>', slug: 'resmi', pinned: true, createdAt: date, kategori: { nama: 'Akademik' } }],
  });
  assert.match(html, /-mt-12/);
  assert.match(html, /&lt;Agenda&gt;/);
  assert.match(html, /Berlangsung/);
  assert.match(html, /href="\/berita\/kabar"/);
  assert.match(html, /href="\/pengumuman\/resmi"/);
  assert.match(html, /Disematkan · Akademik/);
  assert.match(html, /&lt;Dokumen&gt;/);
  assert.doesNotMatch(html, /badge-info|badge-gold|bg-linear|backdrop-blur/);
});

test('hero responsive sources match the home-only preload', async () => {
  const html = await render();
  const image = html.match(/<img[^>]*fetchpriority="high"[^>]*>/)[0];
  const layout = fs.readFileSync('views/layouts/public.ejs', 'utf8');
  const preload = layout.match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*>/)[0];
  assert.equal(image.match(/srcset="([^"]+)"/)[1], preload.match(/imagesrcset="([^"]+)"/)[1]);
  assert.equal(image.match(/sizes="([^"]+)"/)[1], preload.match(/imagesizes="([^"]+)"/)[1]);
});
