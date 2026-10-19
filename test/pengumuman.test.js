const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ejs = require('ejs');

const kategori = { _id: '507f1f77bcf86cd799439011', nama: 'Perkuliahan' };
const item = {
  title: 'Registrasi & perkuliahan <2026>', slug: 'registrasi-perkuliahan',
  createdAt: '2026-10-19T01:00:00Z', kategori, pinned: true, isBaru: true,
  excerpt: 'Informasi registrasi semester.', body: '<p>Isi pengumuman resmi.</p>',
};
const render = (view, overrides = {}) => ejs.renderFile(
  path.join(__dirname, '../views/landing', `${view}.ejs`),
  {
    ...require('../utils/format'), icon: require('../utils/icons'),
    basePath: '/pengumuman', noun: 'pengumuman', kategoriList: [kategori],
    items: [item, { ...item, title: 'Jadwal layanan', slug: 'jadwal-layanan', kategori: null, pinned: false, isBaru: false, excerpt: '' }],
    filters: { q: '', kategori: '' },
    pagination: { page: 1, totalPages: 1, total: 2, from: 1, to: 2 },
    item, lainnya: [], ...overrides,
  }
);

test('setiap pengumuman punya satu tautan detail dengan ajakan baca yang terlihat', async () => {
  const html = await render('pengumuman');
  const links = html.match(/<a\b[^>]*href="\/pengumuman\/[^"?]+"[^>]*>[\s\S]*?<\/a>/g);
  assert.equal(links.length, 2);
  for (const link of links) {
    assert.match(link, /Baca selengkapnya/);
    assert.match(link, /<h[23]\b/);
  }
  assert.match(html, /Registrasi &amp; perkuliahan &lt;2026&gt;/);
});

test('pencarian dan kategori tetap terbawa, hasil kosong memberi jalan kembali', async () => {
  const filters = { q: 'KRS & registrasi', kategori: kategori._id };
  const html = await render('pengumuman', {
    filters, pagination: { page: 1, totalPages: 2, total: 12, from: 1, to: 10 },
  });
  assert.match(html, /name="kategori" value="507f1f77bcf86cd799439011"/);
  assert.match(html, /href="\/pengumuman\?q=KRS%20%26%20registrasi"/);
  assert.match(html, /q=KRS\+%26\+registrasi&amp;kategori=507f1f77bcf86cd799439011&amp;page=2/);
  const empty = await render('pengumuman', {
    filters, items: [], pagination: { page: 1, totalPages: 1, total: 0, from: 0, to: 0 },
  });
  assert.match(empty, /Pengumuman tidak ditemukan/);
  assert.match(empty, /Hapus filter/);
  assert.doesNotMatch(empty, /Baca selengkapnya/);
  const noContent = await render('pengumuman', {
    items: [], kategoriList: [], pagination: { page: 1, totalPages: 1, total: 0, from: 0, to: 0 },
  });
  assert.match(noContent, /Belum ada pengumuman/);
  assert.match(noContent, /setelah diterbitkan/);
});

test('detail memberi akses lampiran bernama dan navigasi kembali ke daftar', async () => {
  const html = await render('pengumuman-show', {
    item: { ...item, attachments: [{ judul: 'Panduan registrasi', file: '/uploads/panduan.pdf' }] },
  });
  assert.match(html, /Buka lampiran: Panduan registrasi \(membuka tab baru\)/);
  assert.match(html, /href="\/pengumuman"[^>]*>[\s\S]*?Kembali ke pengumuman/);
});
