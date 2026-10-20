const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { id, category, fixture } = require('./helpers/adminContentFixture');
const factory = require('../controllers/adminContentController');
const options = Model => ({ Model, jenis: 'pengumuman', basePath: 'pengumuman', listLabel: 'Pengumuman', singularLabel: 'Pengumuman' });

test('Pengumuman v2 routes, bulk configuration, validation and full-page/partial CRUD', async t => {
  const { app, Model } = fixture(t.mock);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/admin/pengumuman`;
  const post = (suffix, body) => fetch(base + suffix, { method: 'POST', body: new URLSearchParams(body), redirect: 'manual' });
  let res = await fetch(base + '?q=%28&status=bad&kategori=invalid&sort=title&dir=asc');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  let html = await res.text();
  assert.match(html, /\/css\/admin.css/);
  assert.doesNotMatch(html, /\/js\/app.js/);
  assert.deepEqual(Model.calls.at(-1)[1], { $or: [{ title: { $regex: '\\(', $options: 'i' } }] });

  res = await post('/bulk', { action: 'publish', ids: id(1) });
  assert.equal(res.status, 303);
  assert.equal(Model.docs[0].status, 'published');
  assert.equal(Model.docs[0].updatedBy, id(200));
  res = await post('/bulk', { action: 'unpublish', scope: 'filter', status: 'published', kategori: category._id, q: 'Pengumuman 3', sort: 'title', dir: 'desc' });
  assert.equal(Model.docs[0].status, 'published');
  assert.equal(Model.docs[2].status, 'draft');
  assert.match(res.headers.get('location'), /kategori=/);
  assert.match(res.headers.get('location'), /sort=title/);
  res = await post('/bulk', { action: 'pin', ids: id(1) });
  assert.match(res.headers.get('location'), /error=/);

  res = await post('?partial=1', { title: 'abc', body: '', status: 'draft' });
  assert.equal(res.status, 422);
  html = await res.text();
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /<!DOCTYPE/);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(html, /<textarea[^>]*name="body"/);
  assert.match(html, /name="attachments"[^>]*multiple/);

  res = await post('?partial=1', { title: 'Pengumuman baru', body: '<p>Isi baru.</p>', status: 'draft', intent: 'publish' });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
  assert.equal(Model.docs.at(-1).status, 'published');
  const created = Model.docs.at(-1);
  res = await post('/' + created._id, { title: 'Pengumuman diperbarui', body: 'Isi diubah', status: 'draft' });
  assert.equal(res.status, 303);
  assert.equal(created.title, 'Pengumuman diperbarui');
  res = await post('/' + created._id + '/delete', {});
  assert.equal(res.status, 303);
  assert.ok(!Model.docs.includes(created));
  res = await fetch(base);
  html = await res.text();
  assert.match(html, /action="\/admin\/pengumuman\/bulk"/);
  assert.match(html, /href="\/admin\/pengumuman\/new"/);
  assert.match(html, /\/edit"/);
  assert.doesNotMatch(html, /data-slide-over/);
});

test('factory, News and Pengumuman use the v2 layout', async t => {
  t.mock.method(require('../models/Kategori'), 'find', () => ({ sort() { return this; }, lean: async () => [] }));
  for (const controller of [factory(options({})), require('../controllers/newsController'), require('../controllers/pengumumanController')]) {
    await controller.newForm({}, { renderPage(view, locals, layout) { assert.equal(layout, 'layouts/admin-v2'); } });
  }
});

test('single and bulk deletion remove uploads, retain failed records and reject paths outside module', async t => {
  const { Model } = fixture(t.mock);
  const controller = factory(options(Model));
  const dir = path.join(__dirname, '../public/uploads/pengumuman');
  const filename = `f1-14-test-${process.pid}.pdf`;
  const file = path.join(dir, filename);
  const image = path.join(dir, `f1-14-test-${process.pid}.webp`);
  const thumb = image.replace('.webp', '-thumb.webp');
  await Promise.all([fs.writeFile(image, 'image'), fs.writeFile(thumb, 'thumbnail')]);
  t.after(() => Promise.all([fs.rm(image, { force: true }), fs.rm(thumb, { force: true })]));
  await fs.writeFile(file, '%PDF-test');
  t.after(() => fs.rm(file, { force: true }));
  Model.docs[0].attachments = [{ file: `/uploads/pengumuman/${filename}` }];
  Model.docs[0].featuredImage = '/uploads/pengumuman/' + path.basename(image);
  const res = { redirect(status, url) { this.url = url; }, json() {} };
  await controller.destroy({ params: { id: id(1) }, query: {} }, res);
  await assert.rejects(fs.access(file), { code: 'ENOENT' });
  await assert.rejects(fs.access(image), { code: 'ENOENT' });
  await assert.rejects(fs.access(thumb), { code: 'ENOENT' });
  await fs.writeFile(file, '%PDF-test');
  Model.docs[0].featuredImage = `/uploads/pengumuman/${filename}`;
  Model.docs[1].attachments = [{ file: '/uploads/pengumuman/../../package.json' }];
  t.mock.method(console, 'error', () => {});
  await controller.bulk({ body: { action: 'delete', ids: [id(2), id(3)] }, user: { _id: id(200) } }, res);
  await assert.rejects(fs.access(file), { code: 'ENOENT' });
  assert.equal(Model.docs.length, 1);
  assert.equal(Model.docs[0]._id, id(3));
  assert.match(decodeURIComponent(res.url).replaceAll('+', ' '), /1 pengumuman dihapus, 1 gagal/);
});

test('editing attachment selection preserves new uploads and deletes removed files only after save', async t => {
  const { Model } = fixture(t.mock);
  const controller = factory(options(Model));
  const dir = path.join(__dirname, '../public/uploads/pengumuman');
  const old = path.join(dir, `old-${process.pid}.pdf`), added = path.join(dir, `new-${process.pid}.pdf`);
  await Promise.all([fs.writeFile(old, '%PDF-old'), fs.writeFile(added, '%PDF-new')]);
  t.after(() => Promise.all([fs.rm(old, { force: true }), fs.rm(added, { force: true })]));
  Model.docs[0].attachments = [{ _id: id(90), file: '/uploads/pengumuman/' + path.basename(old) }];
  await controller.update({ params: { id: id(1) }, query: {}, user: { _id: id(200) }, body: { title: 'Lampiran berubah', body: 'Isi', status: 'draft', attachmentsEditable: '1' }, files: { attachments: [{ originalname: 'baru.pdf', path: added, size: 8 }] } }, { redirect() {} });
  assert.equal(Model.docs[0].attachments.length, 1);
  assert.match(Model.docs[0].attachments[0].file, /new-/);
  await assert.rejects(fs.access(old), { code: 'ENOENT' });
  await fs.access(added);
});

test('pin cap returns 422, preserves form values and never writes', async t => {
  const { Model } = fixture(t.mock);
  Model.countDocuments = async () => 4;
  const controller = factory({ ...options(Model), layout: 'layouts/admin-v2' });
  const res = { status(code) { assert.equal(code, 422); return this; }, renderPage(view, data, layout) { assert.match(data.errors._form, /Maksimal 4/); assert.equal(data.values.title, 'Judul uji'); assert.equal(layout, 'layouts/admin-v2'); } };
  await controller.create({ body: { title: 'Judul uji', body: 'Isi', status: 'draft', pinned: 'on' } }, res);
  assert.equal(Model.docs.length, 3);
});
