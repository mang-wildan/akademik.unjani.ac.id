// Aksi massal (docs/ARCHITECTURE.md §2.7, SPEC FR-ADM-32..37).
const test = require('node:test');
const assert = require('node:assert/strict');
const { bulkHandler, BULK_LIMIT } = require('../utils/bulk');

const id = n => n.toString(16).padStart(24, '0');

// Model tiruan: cukup untuk find/countDocuments/updateMany dengan filter sederhana.
const fakeModel = docs => {
  const calls = [];
  const matches = (doc, filter) => Object.entries(filter).every(([key, cond]) => {
    if (key === '$or') return cond.some(clause => matches(doc, clause));
    if (cond && cond.$in) return cond.$in.map(String).includes(String(doc[key]));
    if (cond && cond.$regex) return new RegExp(cond.$regex, cond.$options).test(doc[key]);
    return doc[key] === cond;
  });
  const select = filter => docs.filter(d => matches(d, filter));
  return {
    calls,
    countDocuments: async filter => { calls.push(['countDocuments', filter]); return select(filter).length; },
    find: filter => {
      calls.push(['find', filter]);
      const result = select(filter).map(d => ({ _id: d._id }));
      return { select: () => ({ lean: async () => result }) };
    },
    updateMany: async (filter, update) => {
      calls.push(['updateMany', filter, update]);
      const matched = select(filter);
      matched.forEach(d => Object.assign(d, update));
      return { matchedCount: matched.length, modifiedCount: matched.length };
    },
  };
};

const seed = () => [
  { _id: id(1), title: 'Wisuda periode I', status: 'draft', jenis: 'berita' },
  { _id: id(2), title: 'Wisuda periode II', status: 'draft', jenis: 'berita' },
  { _id: id(3), title: 'Kalender akademik', status: 'published', jenis: 'berita' },
  { _id: id(4), title: 'Wisuda (jenis lain)', status: 'draft', jenis: 'lain' },
];

const setup = (overrides = {}) => {
  const docs = seed();
  const Model = fakeModel(docs);
  const deleted = [];
  const handler = bulkHandler({
    Model,
    basePath: 'news',
    noun: 'berita',
    baseFilter: { jenis: 'berita' },
    listQuery: { sortable: ['title'], filters: { status: ['published', 'draft'] } },
    actions: {
      publish: { label: 'diterbitkan', update: { status: 'published' } },
      delete: { label: 'dihapus', run: async ids => { deleted.push(...ids); return ids.length; } },
    },
    ...overrides,
  });
  const run = async (body, req = {}) => {
    const res = { redirect(status, url) { this.status = status; this.url = new URL(url, 'http://admin.test'); } };
    await handler({ body, ...req }, res);
    return res;
  };
  return { docs, Model, deleted, run };
};

test('explicit ids are deduplicated, scoped to the module and updated in one query', async () => {
  const { docs, Model, run } = setup();
  const res = await run({ action: 'publish', 'ids': [id(1), id(2), id(1), id(4), id(9)], status: 'draft', page: '2' });
  assert.equal(res.status, 303);
  assert.equal(res.url.pathname, '/admin/news');
  assert.equal(res.url.searchParams.get('success'), '2 berita diterbitkan');
  assert.equal(res.url.searchParams.get('status'), 'draft');
  assert.equal(res.url.searchParams.get('page'), '2');
  const update = Model.calls.find(([name]) => name === 'updateMany');
  assert.deepEqual(update[1], { jenis: 'berita', _id: { $in: [id(1), id(2)] } });
  assert.deepEqual(update[2], { status: 'published' });
  assert.deepEqual(docs.map(d => d.status), ['published', 'published', 'published', 'draft']);
});

test('a single id sent without [] is accepted', async () => {
  const { run } = setup();
  assert.equal((await run({ action: 'publish', ids: id(1) })).url.searchParams.get('success'), '1 berita diterbitkan');
});

test('invalid input never reaches the database', async () => {
  const cases = [
    [{ action: 'drop', ids: [id(1)] }, 'Aksi tidak dikenal.'],
    [{ action: 'publish' }, 'Pilih minimal satu data.'],
    [{ action: 'publish', ids: [] }, 'Pilih minimal satu data.'],
    [{ action: 'publish', ids: ['abc'] }, 'Data yang dipilih tidak valid.'],
    [{ action: 'publish', ids: [{ $gt: '' }] }, 'Data yang dipilih tidak valid.'],
    [{ action: 'publish', ids: Array.from({ length: BULK_LIMIT + 1 }, (_, i) => id(i + 1)) }, `Maksimal ${BULK_LIMIT} data per aksi.`],
    [{ action: ['publish'], ids: [id(1)] }, 'Aksi tidak dikenal.'],
    [{ action: 'publish', scope: 'all', ids: [id(1)] }, 'Aksi tidak dikenal.'],
  ];
  for (const [body, message] of cases) {
    const { Model, run } = setup();
    const res = await run(body);
    assert.equal(res.status, 303, JSON.stringify(body).slice(0, 80));
    assert.equal(res.url.pathname, '/admin/news');
    assert.equal(res.url.searchParams.get('error'), message, JSON.stringify(body).slice(0, 80));
    assert.deepEqual(Model.calls, [], JSON.stringify(body).slice(0, 80));
  }
});

test('scope=filter applies the same allowlisted list filters plus the module scope', async () => {
  const { Model, run } = setup();
  const res = await run({ action: 'publish', scope: 'filter', status: 'draft', q: 'wisuda', role: 'admin', $where: '1' });
  assert.equal(res.url.searchParams.get('success'), '2 berita diterbitkan');
  const [, filter] = Model.calls.find(([name]) => name === 'countDocuments');
  assert.equal(filter.jenis, 'berita');
  assert.equal(filter.status, 'draft');
  assert.ok(filter.$or);
  assert.equal(filter.role, undefined);
  assert.equal(filter.$where, undefined);
  assert.equal(res.url.searchParams.get('q'), 'wisuda');
  assert.equal(res.url.searchParams.get('role'), null);
});

test('scope=filter refuses more than the limit before touching any data', async () => {
  const { Model, run } = setup({ limit: 1 });
  const res = await run({ action: 'publish', scope: 'filter', status: 'draft' });
  assert.equal(res.url.searchParams.get('error'), 'Hasil filter berisi 2 data; maksimal 1 per aksi. Persempit filter dulu.');
  assert.deepEqual(Model.calls.map(([name]) => name), ['countDocuments']);
});

test('run actions get only resolved ids and may report failures', async () => {
  const { deleted, run } = setup();
  assert.equal((await run({ action: 'delete', ids: [id(1), id(4)] })).url.searchParams.get('success'), '1 berita dihapus');
  assert.deepEqual(deleted, [id(1)]);

  const partial = setup({ actions: { delete: { label: 'dihapus', run: async () => ({ done: 1, failed: 1 }) } } });
  assert.equal((await partial.run({ action: 'delete', ids: [id(1), id(2)] })).url.searchParams.get('success'), '1 berita dihapus, 1 gagal');
  const failed = setup({ actions: { delete: { label: 'dihapus', run: async () => ({ done: 0, failed: 2 }) } } });
  const res = await failed.run({ action: 'delete', ids: [id(1), id(2)] });
  assert.equal(res.url.searchParams.get('error'), '2 berita gagal dihapus');
  assert.equal(res.url.searchParams.get('success'), null);
});

test('exclude removes protected ids and reports them as skipped', async () => {
  const { Model, run } = setup({ exclude: req => [req.user._id] });
  const res = await run({ action: 'publish', ids: [id(1), id(2)] }, { user: { _id: { toString: () => id(1) } } });
  assert.equal(res.url.searchParams.get('success'), '1 berita diterbitkan, 1 dilewati');
  assert.deepEqual(Model.calls.find(([name]) => name === 'updateMany')[1]._id, { $in: [id(2)] });

  const none = setup({ exclude: () => [id(1)] });
  const empty = await none.run({ action: 'publish', ids: [id(1), id(9)] });
  assert.equal(empty.url.searchParams.get('error'), 'Tidak ada data yang bisa diproses.');
  assert.equal(none.Model.calls.some(([name]) => name === 'updateMany'), false);
});

test('configuration mistakes fail at startup, not per request', () => {
  const base = { Model: fakeModel([]), basePath: 'news', noun: 'berita' };
  assert.throws(() => bulkHandler({ ...base, actions: {} }), /aksi/);
  assert.throws(() => bulkHandler({ ...base, actions: { x: { label: 'x' } } }), /update atau run/);
  assert.throws(() => bulkHandler({ ...base, actions: { x: { label: 'x', update: {}, run: () => {} } } }), /update atau run/);
  assert.throws(() => bulkHandler({ ...base, basePath: '../x', actions: { x: { label: 'x', update: {} } } }), /basePath/);
});

test('deactivation filter scope excludes the current user before updateMany', async () => {
  const docs = [{ _id: id(1), isActive: true }, { _id: id(2), isActive: true }];
  const Model = fakeModel(docs);
  const handler = bulkHandler({ Model, basePath: 'users', noun: 'akun', exclude: req => [req.user._id],
    actions: { deactivate: { label: 'dinonaktifkan', update: { isActive: false } } } });
  let location;
  await handler({ body: { action: 'deactivate', scope: 'filter' }, user: { _id: id(1) } }, { redirect: (status, url) => { assert.equal(status, 303); location = new URL(url, 'http://test'); } });
  assert.equal(docs[0].isActive, true); assert.equal(docs[1].isActive, false);
  assert.equal(location.searchParams.get('success'), '1 akun dinonaktifkan, 1 dilewati');
});
