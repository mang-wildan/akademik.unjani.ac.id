const test = require('node:test');
const assert = require('node:assert/strict');
const { parseListQuery } = require('../utils/listQuery');

const options = {
  sortable: ['title', 'updatedAt', 'status'],
  defaultSort: { updatedAt: -1 },
  filters: { status: ['published', 'draft'], isActive: [true, false], tahun: [2025, 2026] },
  pageSize: 25,
};

test('defaults return an empty filter, configured sort and the first page', () => {
  assert.deepEqual(parseListQuery({}, options), {
    filter: {}, sort: { updatedAt: -1 }, page: 1, limit: 25, skip: 0, state: { page: '1' },
  });
  assert.equal(parseListQuery().limit, 25);
});

test('only configured filters and values are accepted, preserving boolean and numeric types', () => {
  const result = parseListQuery({ status: 'draft', isActive: 'false', tahun: '2026', role: 'admin', limit: '999' }, options);
  assert.deepEqual(result.filter, { status: 'draft', isActive: false, tahun: 2026 });
  assert.deepEqual(result.state, { status: 'draft', isActive: 'false', tahun: '2026', page: '1' });
  assert.deepEqual(parseListQuery({ status: 'hidden', isActive: '0', tahun: '2027' }, options).filter, {});
});

test('sort fields are allowlisted and directions normalize to asc or desc', () => {
  for (const [dir, expected] of [['asc', 1], ['desc', -1], ['bad', 1], [undefined, 1]]) {
    const result = parseListQuery({ sort: 'title', dir }, options);
    assert.deepEqual(result.sort, { title: expected });
    assert.equal(result.state.dir, expected === 1 ? 'asc' : 'desc');
  }
  assert.deepEqual(parseListQuery({ sort: 'updatedAt' }, options).sort, { updatedAt: -1 });
  for (const sort of ['$where', 'password', '__proto__', 'constructor', ['title'], { $gt: '' }]) {
    const result = parseListQuery({ sort, dir: 'asc' }, options);
    assert.deepEqual(result.sort, options.defaultSort);
    assert.equal(result.state.sort, undefined);
    assert.equal(result.state.dir, undefined);
  }
});

test('page accepts positive decimal integers and rejects malformed or unsafe offsets', () => {
  assert.equal(parseListQuery({ page: ' 003 ' }, options).page, 3);
  assert.equal(parseListQuery({ page: '3' }, options).skip, 50);
  for (const page of ['', '0', '-2', '2.5', '2abc', '1e3', 'Infinity', '9007199254740991', '999999999999999999999', ['2'], { $gt: '1' }]) {
    const result = parseListQuery({ page }, options);
    assert.equal(result.page, 1, JSON.stringify(page));
    assert.equal(result.skip, 0);
    assert.equal(result.state.page, '1');
  }
  for (const pageSize of [0, -1, 1.5, Infinity, '25']) assert.throws(() => parseListQuery({}, { pageSize }), /pageSize/);
});

test('search trims and escapes regex metacharacters, with configurable search fields', () => {
  const q = 'a.b[*+?^${}()|\\ & Wisuda';
  const result = parseListQuery({ q: ` ${q} ` }, options);
  const clause = result.filter.$or[0].title;
  const regex = new RegExp(clause.$regex, clause.$options);
  assert.equal(regex.test(q.toUpperCase()), true);
  assert.equal(regex.test('unrelated'), false);
  assert.equal(result.state.q, q);
  const multiple = parseListQuery({ q: 'a.c', status: 'draft' }, { ...options, searchFields: ['title', 'status'] });
  assert.equal(multiple.filter.status, 'draft');
  assert.deepEqual(Object.keys(multiple.filter.$or[1]), ['status']);
  assert.equal(new RegExp(multiple.filter.$or[0].title.$regex).test('abc'), false);
  assert.deepEqual(parseListQuery({ q: '  ' }, options).filter, {});
  assert.deepEqual(parseListQuery({ q: 'ignored' }, { searchFields: [] }).state, { page: '1' });
});

test('arrays, objects, inherited properties and MongoDB operators cannot enter filters or state', () => {
  for (const value of [['draft'], { $ne: '' }, 1, true, null]) {
    const result = parseListQuery({ status: value, q: value, sort: value, dir: value, page: value, $where: 'evil' }, options);
    assert.deepEqual(result.filter, {});
    assert.deepEqual(result.state, { page: '1' });
  }
  const inherited = Object.create({ status: 'draft', q: 'inherited', sort: 'title', page: '2' });
  assert.deepEqual(parseListQuery(inherited, options).state, { page: '1' });
});

test('state round-trips through URLSearchParams and drops transient query parameters', () => {
  const query = { status: 'published', q: ' RPL & wisuda + [2026] ', sort: 'title', dir: 'desc', page: '3', partial: '1', fragment: 'list', success: 'Saved', error: 'Error', edit: 'id', scope: 'filter' };
  const snapshot = structuredClone(query);
  const result = parseListQuery(query, options);
  assert.deepEqual(result.state, { status: 'published', q: 'RPL & wisuda + [2026]', sort: 'title', dir: 'desc', page: '3' });
  const roundTrip = Object.fromEntries(new URLSearchParams(result.state));
  assert.deepEqual(parseListQuery(roundTrip, options), result);
  const compound = { ...options, defaultSort: { pinned: -1, updatedAt: -1 } };
  const defaults = parseListQuery({}, compound);
  assert.deepEqual(parseListQuery(Object.fromEntries(new URLSearchParams(defaults.state)), compound), defaults);
  assert.deepEqual(query, snapshot);
  assert.deepEqual(options.defaultSort, { updatedAt: -1 });
});

const { listHref, pageItems } = require('../utils/listQuery');

test('listHref keeps list state, resets the page when filters change and drops empty values', () => {
  const state = { status: 'draft', q: 'a&b c', sort: 'title', dir: 'asc', page: '3' };
  assert.equal(listHref(state, { page: 4 }), '?status=draft&q=a%26b+c&sort=title&dir=asc&page=4');
  assert.equal(listHref(state, { status: 'published' }), '?status=published&q=a%26b+c&sort=title&dir=asc');
  assert.equal(listHref(state, { status: '', q: undefined, sort: null, dir: null }), '?');
  assert.equal(listHref({ page: '1' }, { page: 1 }), '?');
  assert.equal(listHref(state), '?status=draft&q=a%26b+c&sort=title&dir=asc');
  assert.equal(listHref(), '?');
  assert.deepEqual(state, { status: 'draft', q: 'a&b c', sort: 'title', dir: 'asc', page: '3' });
});

test('pageItems shows first, last and neighbours of the current page with gaps', () => {
  assert.deepEqual(pageItems(1, 1), [1]);
  assert.deepEqual(pageItems(3, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(pageItems(1, 12), [1, 2, '…', 12]);
  assert.deepEqual(pageItems(6, 12), [1, '…', 5, 6, 7, '…', 12]);
  assert.deepEqual(pageItems(12, 12), [1, '…', 11, 12]);
  assert.deepEqual(pageItems(3, 12), [1, 2, 3, 4, '…', 12]);
  assert.deepEqual(pageItems(4, 12), [1, 2, 3, 4, 5, '…', 12]); // celah satu halaman ditampilkan sebagai angka
  assert.deepEqual(pageItems(1, 0), [1]);
});
