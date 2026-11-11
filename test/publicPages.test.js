const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ejs = require('ejs');
const path = require('node:path');
const common = { ...require('../utils/format'), icon: require('../utils/icons') };
const render = (name, locals) => ejs.renderFile(path.join(__dirname, '../views/landing', name + '.ejs'), { ...common, ...locals });

test('secondary pages use editorial surfaces instead of elevated cards and category badges', () => {
  for (const file of fs.readdirSync('views/landing').filter(f => f.endsWith('.ejs') && f !== 'index.ejs')) {
    const source = fs.readFileSync('views/landing/' + file, 'utf8');
    assert.doesNotMatch(source, /shadow-card|class="card|badge-info|rounded-full/, file);
  }
});

for (const page of ['berita', 'pengumuman']) {
  test(page + ' promotes the first item, keeps filters, escaped content and pagination', async () => {
    const locals = { basePath: '/' + page, noun: page, filters: { q: '<kata>', kategori: 'cat' }, kategoriList: [{ _id: 'cat', nama: '<Kategori>' }], pagination: { page: 1, totalPages: 2, total: 3, from: 1, to: 2 }, items: [0, 1].map(i => ({ slug: 'item-' + i, title: '<Judul ' + i + '>', createdAt: new Date('2026-11-11'), kategori: { nama: '<Kategori>' }, pinned: true, isBaru: true, excerpt: 'Ringkasan', featuredImage: '/img/hero-kampus.webp' })) };
    const html = await render(page, locals);
    assert.match(html, /data-featured/);
    assert.match(html, /aria-label="Halaman berikutnya"/);
    assert.match(html, /kategori=cat&amp;page=2/);
    assert.match(html, /&lt;Judul 0&gt;/);
    assert.match(html, /aria-current="true"/);
    assert.match(html, /name="kategori" value="cat"/);
    assert.match(html, new RegExp('href="/' + page + '/item-1"'));
    assert.doesNotMatch(html, /badge-info|badge-neutral/);
    const empty = await render(page, { ...locals, items: [] });
    assert.doesNotMatch(empty, /data-featured/);
    assert.match(empty, /tidak ditemukan/);
  });
}

test('reading and staff pages have bounded reading width and rectangular portraits', () => {
  for (const file of ['profil', 'rpl', 'berita-show', 'pengumuman-show', 'cari']) {
    assert.match(fs.readFileSync('views/landing/' + file + '.ejs', 'utf8'), /max-w-(?:3xl|\[var\(--container-reading\)\])/);
  }
  assert.match(fs.readFileSync('views/landing/pimpinan-staff.ejs', 'utf8'), /aspect-\[3\/4\]/);
});

test('staff retain photos at every level and long job titles can wrap on mobile', async () => {
  const html = await render('pimpinan-staff', { grup: require('../utils/staffTingkat').TINGKAT.map(t => ({ ...t, items: [{ foto: '/foto-' + t.value + '.png', nama: '<Nama>', jabatan: 'Jabatan yang sangat panjang untuk layar kecil' }] })) });
  assert.equal((html.match(/<img /g) || []).length, 5);
  assert.match(html, /&lt;Nama&gt;/);
  assert.doesNotMatch(html, /shrink-0 text-right/);
});

test('document sidebar and results allow grid children to shrink at narrow widths', () => {
  const source = fs.readFileSync('views/landing/dokumen-akademik.ejs', 'utf8');
  assert.match(source, /<aside class="min-w-0"/);
  assert.match(source, /<div class="min-w-0">/);
});
