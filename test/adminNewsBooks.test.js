const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { fixture, id } = require('./helpers/adminContentFixture');
let png;
test.before(async () => { png = await require('sharp')({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } }).png().toBuffer(); });
const publicPath = url => path.join(__dirname, '../public', url);
const setup = async (t, basePath, docs = []) => {
  const { app, Model } = fixture(t.mock, { basePath, docs, role: 'editor' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/admin/${basePath}`;
  return { Model, get: suffix => fetch(base + suffix), post: (suffix, body) => fetch(base + suffix, { method: 'POST', body: body instanceof FormData ? body : new URLSearchParams(body), redirect: 'manual' }) };
};
const upload = (fields, { pdf = 'file', image = 'cover' } = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  const prefix = 'f2-test-' + randomUUID();
  if (pdf) form.set(pdf, new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' }), prefix + '.pdf');
  if (image) form.set(image, new Blob([png], { type: 'image/png' }), prefix + '.png');
  return form;
};

test('News v2 full-page form validates published covers; bulk publishes only rows with a cover', async t => {
  const docs = [
    { _id: id(1), title: 'Tanpa sampul', body: 'Isi', status: 'draft', attachments: [] },
    { _id: id(2), title: 'Dengan sampul', body: 'Isi', status: 'draft', featuredImage: '/uploads/news/seed.webp', attachments: [] },
    { _id: id(3), title: 'Sampul kosong', body: 'Isi', status: 'draft', featuredImage: ' ', attachments: [] },
  ];
  const { Model, get, post } = await setup(t, 'news', docs);
  let res = await get('');
  assert.equal(res.status, 200); assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  const html = await res.text();
  assert.match(html, /Cari judul berita/); assert.doesNotMatch(html, /data-slide-over/);
  res = await post('?partial=1', { title: 'Berita baru', body: 'Isi', status: 'published' });
  assert.equal(res.status, 422); assert.match(await res.text(), /Gambar sampul wajib/);
  res = await post('/' + id(1) + '?partial=1', { title: 'Tanpa sampul', body: 'Isi', status: 'published' });
  assert.equal(res.status, 422); assert.equal(Model.docs[0].status, 'draft');
  res = await post('/bulk', [['action', 'publish'], ['ids[]', id(1)], ['ids[]', id(2)], ['ids[]', id(3)]]);
  assert.equal(res.status, 303);
  assert.match(decodeURIComponent(res.headers.get('location')).replaceAll('+', ' '), /1 berita diterbitkan, 2 gagal/);
  assert.deepEqual(Model.docs.map(d => d.status), ['draft', 'published', 'draft']);
  res = await post('/bulk', { action: 'unpublish', scope: 'filter', status: 'published', q: 'Dengan sampul' });
  assert.equal(res.status, 303); assert.equal(Model.docs[1].status, 'draft');
});

test('News real multipart uploads publish and bulk deletion removes PDF, WebP and thumbnail', async t => {
  const { Model, post } = await setup(t, 'news');
  const dir = path.join(__dirname, '../public/uploads/news');
  const before = new Set(await fs.readdir(dir));
  t.after(async () => {
    for (const name of await fs.readdir(dir)) if (!before.has(name) && name.includes('f2-test-')) await fs.rm(path.join(dir, name), { force: true });
  });
  const res = await post('?partial=1', upload({ title: 'Berita dengan berkas', body: '<p>Isi berita.</p>', status: 'published' }, { pdf: 'attachments', image: 'featuredImage' }));
  assert.equal(res.status, 200, res.status === 200 ? '' : await res.text()); assert.equal((await res.json()).ok, true);
  const created = Model.docs[0];
  const files = [created.featuredImage, created.featuredImage.replace('.webp', '-thumb.webp'), created.attachments[0].file].map(publicPath);
  t.after(() => Promise.all(files.map(file => fs.rm(file, { force: true }))));
  await Promise.all(files.map(file => fs.access(file)));
  const deleted = await post('/bulk', { action: 'delete', ids: created._id });
  assert.equal(deleted.status, 303); assert.equal(Model.docs.length, 0);
  for (const file of files) await assert.rejects(fs.access(file), { code: 'ENOENT' });
});

test('Books v2 searches literal text, paginates/sorts and exposes partial multipart forms', async t => {
  const { get, Model, post } = await setup(t, 'books', [{ _id: id(1), title: 'Panduan (2026)', year: 2026 }]);
  let res = await get('?q=%28&sort=year&dir=desc&page=99');
  assert.equal(res.status, 200); assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  assert.deepEqual(Model.calls.at(-1)[1], { $or: [{ title: { $regex: '\\(', $options: 'i' } }] });
  const html = await res.text(); assert.match(html, /data-slide-over/); assert.match(html, /1–1 dari 1 buku/);
  res = await get('/new?partial=1');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const form = await res.text(); assert.match(form, /enctype="multipart\/form-data"/); assert.doesNotMatch(form, /<!DOCTYPE/);
  res = await post('?partial=1', { title: 'Buku baru', year: '2026' });
  assert.equal(res.status, 422); const invalid = await res.text(); assert.match(invalid, /File PDF wajib/); assert.match(invalid, /Gambar sampul wajib/);
  res = await post('/bulk', { action: 'publish', ids: id(1) });
  assert.match(res.headers.get('location'), /error=/);
});

test('Books failed edits keep values and current native uploads in full-page and stacked partial forms', async t => {
  const { post, get } = await setup(t, 'books', [{ _id: id(1), title: 'Panduan', year: 2026, src: '/uploads/books/current.pdf', cover: '/uploads/books/current.webp' }]);
  for (const suffix of ['', '?partial=1']) {
    const res = await post('/' + id(1) + suffix, { title: 'Judul <uji>', year: '1940' });
    assert.equal(res.status, 422);
    const html = await res.text();
    assert.match(html, suffix ? /publication-form--stacked/ : /class="publication-form"/);
    assert.match(html, /data-form-main[\s\S]*name="title"[\s\S]*data-publication-panel/);
    assert.match(html, /value="Judul &lt;uji&gt;"/);
    assert.match(html, /value="1940"/);
    assert.match(html, /href="\/uploads\/books\/current.pdf"/);
    assert.match(html, /src="\/uploads\/books\/current.webp"/);
    assert.match(html, /href="#f-year"/);
    for (const input of html.matchAll(/<input type="file"[^>]*>/g)) assert.doesNotMatch(input[0], /\svalue=/);
    if (suffix) assert.doesNotMatch(html, /<h1|<!DOCTYPE/);
  }
  const html = await (await get('')).text();
  assert.match(html, new RegExp(`href="/admin/books/${id(1)}/edit"`));
  assert.match(html, /aria-label="Aksi untuk Panduan"/);
  assert.match(html, new RegExp(`method="POST" action="/admin/books/${id(1)}/delete"`));
});

test('Books upload/create/edit/replace/delete retains current files and cleans replaced uploads', async t => {
  const { Model, post } = await setup(t, 'books');
  const files = [];
  t.after(() => Promise.all(files.map(file => fs.rm(file, { force: true }))));
  let res = await post('?partial=1', upload({ title: 'Buku baru', year: '2026' }));
  assert.equal(res.status, 200); assert.equal((await res.json()).ok, true);
  const item = Model.docs[0], old = [publicPath(item.src), publicPath(item.cover)]; files.push(...old);
  await Promise.all(old.map(file => fs.access(file)));
  res = await post('/' + item._id + '?partial=1', { title: 'Judul diubah', year: '2025' });
  assert.equal((await res.json()).ok, true); await Promise.all(old.map(file => fs.access(file)));
  res = await post('/' + item._id + '?partial=1', upload({ title: 'Buku pengganti', year: '2024' }));
  assert.equal((await res.json()).ok, true);
  const replaced = [publicPath(item.src), publicPath(item.cover)]; files.push(...replaced);
  for (const file of old) await assert.rejects(fs.access(file), { code: 'ENOENT' });
  await Promise.all(replaced.map(file => fs.access(file)));
  res = await post('/bulk', { action: 'delete', scope: 'filter', q: 'Buku pengganti' });
  assert.equal(res.status, 303); assert.equal(Model.docs.length, 0);
  for (const file of replaced) await assert.rejects(fs.access(file), { code: 'ENOENT' });
});

test('Books invalid form, forged upload and failed database write discard only the newly uploaded files', async t => {
  const { Model, post } = await setup(t, 'books');
  const dir = path.join(__dirname, '../public/uploads/books');
  const entries = async () => (await fs.readdir(dir)).filter(name => name.includes('f2-test-')).sort();
  const before = await entries();
  let res = await post('?partial=1', upload({ title: 'X', year: '2026' }));
  assert.equal(res.status, 422); assert.deepEqual(await entries(), before);
  const forged = upload({ title: 'File palsu' });
  forged.set('file', new Blob(['not a PDF'], { type: 'application/pdf' }), 'f2-test-forged.pdf');
  res = await post('?partial=1', forged); assert.equal(res.status, 400);
  // checkUploads discards files asynchronously.
  for (let n = 0; n < 20 && (await entries()).length !== before.length; n++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.deepEqual(await entries(), before);
  t.mock.method(require('../models/Book'), 'create', async () => { throw new Error('DB unavailable'); });
  res = await post('?partial=1', upload({ title: 'Buku gagal' })); assert.equal(res.status, 500);
  assert.deepEqual(await entries(), before); assert.equal(Model.docs.length, 0);
});

test('Books bulk deletion reports failures and never removes a path outside books', async t => {
  const { Model, post } = await setup(t, 'books', [
    { _id: id(1), title: 'Tanpa berkas', src: '/uploads/books/missing-test.pdf' },
    { _id: id(2), title: 'Path rusak', src: '/uploads/books/../../package.json' },
  ]);
  t.mock.method(console, 'error', () => {});
  const res = await post('/bulk', [['action', 'delete'], ['ids[]', id(1)], ['ids[]', id(2)]]);
  assert.match(decodeURIComponent(res.headers.get('location')).replaceAll('+', ' '), /1 buku dihapus, 1 gagal/);
  assert.equal(Model.docs.length, 1); assert.equal(Model.docs[0]._id, id(2));
  await fs.access(path.join(__dirname, '../package.json'));
});
