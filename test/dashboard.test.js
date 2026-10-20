const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ejs = require('ejs');
const { fakeModel, id } = require('./helpers/adminContentFixture');

test('dashboard bounds accreditation at 90 WIB days, warns on old pinned content and merges five latest drafts', async t => {
  const now = new Date('2026-10-19T12:00:00Z');
  t.mock.timers.enable({ apis: ['Date'], now: now.getTime() });
  const ago = days => new Date(now.getTime() - days * 86400000);
  const content = Array.from({ length: 6 }, (_, n) => ({ _id: id(n + 1), title: `Draf ${n + 1}`, status: 'draft', createdAt: ago(40), updatedAt: ago(n), pinned: n === 0 }));
  const models = {};
  const data = {
    News: content.map((d, n) => ({ ...d, title: `Berita ${n}`, updatedAt: new Date(d.updatedAt.getTime() - 3600000) })),
    Pengumuman: content,
    Accreditation: [
      { _id: id(80), namaUnit: 'Lewat', berlakuSampai: new Date('2026-10-18T23:59:59+07:00') },
      { _id: id(81), namaUnit: 'Hari ke-90', berlakuSampai: new Date('2027-01-17T23:59:59+07:00') },
      { _id: id(82), namaUnit: 'Hari ke-91', berlakuSampai: new Date('2027-01-18T00:00:00+07:00') },
    ],
    AcademicCalendar: [{ _id: id(90), tahunAjaran: '2026/2027', events: [{}] }],
    AcademicDocument: [], RplDocument: [], Staff: [],
  };
  for (const [name, docs] of Object.entries(data)) {
    const actual = require(`../models/${name}`), fake = fakeModel(docs);
    models[name] = fake;
    for (const [key, method] of Object.entries(fake)) if (typeof method === 'function') t.mock.method(actual, key, method);
  }
  let locals;
  const res = { locals: { siteSetting: { landingVideoUrl: 'not a URL' } }, renderPage(view, values, layout) { assert.equal(layout, 'layouts/admin-v2'); locals = values; } };
  await require('../controllers/homeController').getDashboard({ user: { role: 'editor' } }, res);
  assert.equal(locals.stats.akreditasiKedaluwarsa, 1);
  assert.ok(locals.issues.some(issue => /30 hari/.test(issue.title)));
  assert.ok(locals.issues.some(issue => /^2 akreditasi/.test(issue.title)));
  assert.ok(!locals.issues.some(issue => issue.href.startsWith('/admin/settings')));
  assert.equal(locals.drafts.length, 5);
  assert.deepEqual(locals.drafts.slice(0, 2).map(d => d.label), ['Pengumuman', 'Berita']);
  assert.match(locals.drafts[0].href, /\/edit$/);
  const dueQuery = models.Accreditation.calls.find(([name, query]) => name === 'find' && query.berlakuSampai)?.[1];
  assert.equal(dueQuery.berlakuSampai.$lte.toISOString(), '2027-01-17T16:59:59.999Z');
  const html = await ejs.renderFile(path.join(__dirname, '../views/admin/dashboard.ejs'), { ...locals, ...require('../utils/format'), icon: require('../utils/icons') });
  const sections = ['perlu-perhatian', 'buat-cepat', 'draf-terakhir', 'statistik', 'aktivitas-terbaru'].map(id => html.indexOf(`<section aria-labelledby="${id}"`));
  assert.ok(sections.every((n, i) => n >= 0 && (i === 0 || n > sections[i - 1])));
  assert.match(html, /href="\/admin\/news\?status=published"/);
  assert.match(html, /href="\/admin\/accreditations\?status=kedaluwarsa"/);
});
