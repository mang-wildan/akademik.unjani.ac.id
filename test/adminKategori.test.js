const test = require('node:test');
const assert = require('node:assert/strict');
const { id, fixture } = require('./helpers/adminContentFixture');

const seed = () => [
  { _id: id(1), jenis: 'pengumuman', nama: 'Perkuliahan', urutan: 1, isActive: true, slug: 'perkuliahan' },
  { _id: id(2), jenis: 'pengumuman', nama: 'Wisuda (baru)', urutan: 2, isActive: false, slug: 'wisuda' },
  { _id: id(3), jenis: 'berita', nama: 'Kampus', urutan: 1, isActive: true, slug: 'kampus' },
  { _id: id(4), jenis: 'dokumen', nama: 'Formulir', urutan: 0, isActive: false, slug: 'formulir' },
];
const setup = async (t, options = {}) => {
  const { app, Model } = fixture(t.mock, { basePath: 'kategori', docs: seed(), ...options });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/admin/kategori`;
  return {
    Model, get: suffix => fetch(base + suffix),
    post: (suffix, body) => fetch(base + suffix, { method: 'POST', body: new URLSearchParams(body), redirect: 'manual' }),
  };
};

test('Kategori forms have serif panels and one heading with no-JS edit links',async t=>{
 const {get}=await setup(t);
 for(const route of ['/new',`/${id(1)}/edit`]){const r=await get(route),html=await r.text();assert.equal(r.status,200);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.match(html,/<h2[^>]*class="[^"]*font-serif/);assert.match(html,/method="POST"/);const partial=await(await get(route+'?partial=1')).text();assert.doesNotMatch(partial,/<h1\b|<!DOCTYPE/);}
 const html=await(await get('')).text();assert.match(html,new RegExp(`href="/admin/kategori/${id(1)}/edit"`));assert.match(html,/aria-label="Aksi untuk Perkuliahan"/);assert.match(html,/>\s*Ubah\s*<\/a>/);
});

test('Kategori uses v2, whitelist filters, escaped search, sortable pagination and slide-over links', async t => {
  const { Model, get } = await setup(t);
  let res = await get('?jenis=pengumuman&isActive=false&q=%28&sort=nama&dir=desc&page=900');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  const html = await res.text();
  assert.deepEqual(Model.calls.at(-1)[1], { jenis: 'pengumuman', isActive: false, $or: [{ nama: { $regex: '\\(', $options: 'i' } }] });
  assert.match(html, /\/css\/admin.css/);
  assert.match(html, /href="\/admin\/kategori\/new\?jenis=pengumuman"[^>]*data-slide-over/);
  assert.match(html, /href="\/admin\/kategori\/000000000000000000000002\/edit"[^>]*data-slide-over/);
  assert.match(html, /1–1 dari 1 kategori/);
  assert.match(html, /data-list-region/);
  assert.match(html, /data-edit-url="\/admin\/kategori\/:id\/edit"/);
  res = await get('?jenis[gt]=x&isActive[ne]=true&q[regex]=x&sort=password&partial=1');
  assert.equal(res.status, 200);
  assert.doesNotMatch(await res.text(), /<!DOCTYPE/);
  assert.deepEqual(Model.calls.at(-1)[1], { jenis: 'pengumuman' });
});

test('Kategori form preserves jenis, unchecked state and validation; CRUD returns partial JSON or 303', async t => {
  const { Model, get, post } = await setup(t);
  let res = await get('/new?jenis=berita&partial=1');
  let html = await res.text();
  assert.doesNotMatch(html, /<!DOCTYPE/);
  assert.match(html, /value="berita" selected/);
  assert.match(html, /data-save-form data-panel-title="Tambah Kategori"/);
  assert.match(html, /name="isActive"[^>]*checked/);
  res = await post('?partial=1', { jenis: 'berita', nama: '', urutan: '2' });
  assert.equal(res.status, 422);
  html = await res.text();
  assert.match(html, /x-data="errorSummary"/);
  assert.match(html, /href="#f-nama"/);
  assert.doesNotMatch(html, /name="isActive"[^>]*checked/);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  res = await post('?partial=1', { jenis: 'berita', nama: 'Kategori baru', urutan: '2' });
  assert.deepEqual(await res.json(), { ok: true, message: 'Kategori berhasil ditambahkan.' });
  const created = Model.docs.at(-1);
  assert.equal(created.isActive, false);
  assert.equal(created.createdBy, id(200));
  res = await post('/' + created._id + '?partial=1', { jenis: 'dokumen', nama: '', urutan: '-1' });
  assert.equal(res.status, 422);
  assert.equal(created.nama, 'Kategori baru');
  res = await post('/' + created._id + '?partial=1', { jenis: 'dokumen', nama: 'Nama diubah', urutan: '3', isActive: 'on' });
  assert.equal((await res.json()).ok, true);
  assert.equal(created.nama, 'Nama diubah');
  assert.equal(created.slug, 'nama-diubah');
  assert.equal(created.isActive, true);
  res = await post('/' + created._id + '/delete', {});
  assert.equal(res.status, 303);
  assert.match(res.headers.get('location'), /jenis=dokumen&success=/);
  assert.ok(!Model.docs.includes(created));
  res = await post('', { jenis: 'pengumuman', nama: 'Form penuh', urutan: '0' });
  assert.equal(res.status, 303);
  res = await get('/' + id(999) + '/edit');
  assert.equal(res.status, 404);
});

test('Kategori bulk activates/deactivates/deletes within jenis, preserves filters and rejects unsupported actions', async t => {
  const { Model, post } = await setup(t);
  let res = await post('/bulk', { action: 'deactivate', ids: [id(1), id(3)].join(',') });
  assert.match(res.headers.get('location'), /error=/);
  // Use the real extended form protocol for multiple selected IDs.
  res = await post('/bulk', [['action', 'deactivate'], ['jenis', 'pengumuman'], ['ids[]', id(1)], ['ids[]', id(3)]]);
  assert.equal(res.status, 303);
  assert.equal(Model.docs[0].isActive, false);
  assert.equal(Model.docs[2].isActive, true);
  assert.equal(Model.docs[0].updatedBy, id(200));
  res = await post('/bulk', { action: 'activate', scope: 'filter', jenis: 'pengumuman', isActive: 'false', q: 'Wisuda (baru)', sort: 'nama', dir: 'desc', page: '2' });
  assert.equal(Model.docs[0].isActive, false);
  assert.equal(Model.docs[1].isActive, true);
  const url = new URL(res.headers.get('location'), 'http://admin.test');
  for (const [key, value] of Object.entries({ jenis: 'pengumuman', isActive: 'false', q: 'Wisuda (baru)', sort: 'nama', dir: 'desc', page: '2' })) assert.equal(url.searchParams.get(key), value);
  res = await post('/bulk', { action: 'delete', scope: 'filter', jenis: 'pengumuman', isActive: 'false' });
  assert.equal(res.status, 303);
  assert.deepEqual(Model.docs.map(d => d._id), [id(2), id(3), id(4)]);
  res = await post('/bulk', { action: 'publish', ids: id(2) });
  assert.match(res.headers.get('location'), /error=/);
  res = await post('/bulk', { action: 'activate', ids: 'not-an-id' });
  assert.match(res.headers.get('location'), /error=/);
});

test('Kategori bulk filter refuses more than 500 matching records', async t => {
  const docs = Array.from({ length: 501 }, (_, i) => ({ ...seed()[0], _id: id(i + 1000) }));
  const { Model, post } = await setup(t, { docs });
  const res = await post('/bulk', { action: 'delete', scope: 'filter', jenis: 'pengumuman' });
  assert.match(decodeURIComponent(res.headers.get('location')).replaceAll('+', ' '), /maksimal 500/);
  assert.equal(Model.docs.length, 501);
});

test('Kategori keeps the superadmin guard on list, partial forms, writes and bulk', async t => {
  const { Model, get, post } = await setup(t, { role: 'editor' });
  for (const suffix of ['', '/new?partial=1', '/' + id(1) + '/edit?partial=1']) assert.equal((await get(suffix)).status, 403);
  for (const suffix of ['', '/bulk', '/' + id(1), '/' + id(1) + '/delete']) assert.equal((await post(suffix, { action: 'delete', ids: id(1) })).status, 403);
  assert.equal(Model.docs.length, 4);
  assert.equal(Model.calls.length, 0);
});
