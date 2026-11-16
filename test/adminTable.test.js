// Tabel data admin (docs/DESIGN.md §7.4–7.5, SPEC FR-ADM-20..25, 30): partial EJS + Alpine dataTable.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ejs = require('ejs');
const { listHref, pageItems } = require('../utils/listQuery');

const render = (name, locals = {}) => ejs.renderFile(path.join(__dirname, '../views/admin/_ui', `${name}.ejs`), {
  icon: require('../utils/icons'), listHref, pageItems, ...locals,
});

const loadDataTable = rows => {
  const components = {};
  let init;
  // admin.js juga mendaftar listener submit/pageshow; stub ini mengabaikannya.
  const context = vm.createContext({
    document: { addEventListener(name, handler) { if (name === 'alpine:init') init = handler; }, documentElement: { dataset: {} } },
    window: { Alpine: { data(name, factory) { components[name] = factory; } }, addEventListener() {} },
    setTimeout,
  });
  vm.runInContext(fs.readFileSync(require.resolve('../public/js/admin.js'), 'utf8'), context);
  init();
  const boxes = rows.map(value => {
    const box = { value, checked: false, closest: selector => (selector === 'input[data-row-check]' ? box : null) };
    return box;
  });
  const events = [];
  const table = components.dataTable();
  Object.assign(table, {
    $root: { querySelectorAll: () => boxes },
    $refs: { all: { checked: false, indeterminate: false } },
    $dispatch: (name, detail) => events.push(JSON.parse(JSON.stringify({ name, detail }))), // objek realm vm → objek biasa
  });
  table.init();
  const click = (index, shiftKey = false) => {
    boxes[index].checked = !boxes[index].checked; // browser mengubah checked sebelum event click
    table.rowClick({ target: boxes[index], shiftKey });
  };
  return { table, boxes, events, click };
};

test('dataTable syncs count, header checkbox state and dispatches the selection', () => {
  const { table, boxes, events, click } = loadDataTable(['a', 'b', 'c']);
  assert.deepEqual(events.at(-1), { name: 'table-selection', detail: { ids: [], count: 0, total: 3 } });
  click(1);
  assert.equal(table.count, 1);
  assert.deepEqual([table.$refs.all.checked, table.$refs.all.indeterminate], [false, true]);
  assert.deepEqual(events.at(-1).detail, { ids: ['b'], count: 1, total: 3 });
  table.toggleAll({ target: { checked: true } });
  assert.deepEqual(boxes.map(b => b.checked), [true, true, true]);
  assert.deepEqual([table.$refs.all.checked, table.$refs.all.indeterminate], [true, false]);
  table.clear();
  assert.equal(table.count, 0);
  assert.deepEqual([table.$refs.all.checked, table.$refs.all.indeterminate], [false, false]);
});

test('dataTable selects a range with Shift+click, following the clicked box state', () => {
  const { boxes, click } = loadDataTable(['a', 'b', 'c', 'd', 'e']);
  click(1);
  click(3, true);
  assert.deepEqual(boxes.map(b => b.checked), [false, true, true, true, false]);
  click(4, true); // rentang 3..4, mengikuti kotak yang diklik (tercentang)
  assert.deepEqual(boxes.map(b => b.checked), [false, true, true, true, true]);
  click(1, true); // kotak 1 jadi tidak tercentang → rentang 1..4 ikut dilepas
  assert.deepEqual(boxes.map(b => b.checked), [false, false, false, false, false]);
});

test('dataTable ignores clicks outside row checkboxes and toggles mobile select mode', () => {
  const { table, boxes } = loadDataTable(['a', 'b']);
  table.rowClick({ target: { closest: () => null }, shiftKey: false });
  assert.equal(table.count, 0);
  assert.equal(table.selecting, false);
  assert.equal(table.selectToggleLabel, 'Pilih');
  table.toggleSelecting();
  assert.equal(table.selecting, true);
  assert.equal(table.selectToggleLabel, 'Selesai');
  boxes[0].checked = true;
  table.rowClick({ target: boxes[0], shiftKey: false });
  table.toggleSelecting(); // keluar dari mode pilih melepas semua pilihan
  assert.equal(table.selecting, false);
  assert.equal(boxes[0].checked, false);
  assert.equal(table.count, 0);
});

test('data-table renders sortable headers, escaped cells and form-bound row checkboxes', async () => {
  const state = { q: 'wisuda', status: 'draft', sort: 'title', dir: 'asc', page: '2' };
  const html = await render('data-table', {
    caption: 'Daftar pengumuman',
    state,
    bulkForm: 'bulk-pengumuman',
    columns: [
      { key: 'title', label: 'Judul', sortable: true, primary: true },
      { key: 'status', label: 'Status', cell: item => `<b>${item.status}</b>` },
      { key: 'updatedAt', label: 'Diperbarui', sortable: true, firstDir: 'desc' },
    ],
    items: [{ _id: 'id1', title: '<script>x</script>', status: 'draft', updatedAt: '19 Okt' }],
    rowHref: item => `/admin/pengumuman/${item._id}/edit`,
    actions: item => `<a href="/edit/${item._id}">Ubah</a>`,
  });
  assert.match(html, /<caption class="sr-only">Daftar pengumuman<\/caption>/);
  assert.match(html, /<th[^>]*aria-sort="ascending"[\s\S]*?href="\?q=wisuda&amp;status=draft&amp;sort=title&amp;dir=desc"/);
  assert.match(html, /href="\?q=wisuda&amp;status=draft&amp;sort=updatedAt&amp;dir=desc"/);
  assert.doesNotMatch(html, /page=2/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>x/);
  assert.match(html, /<b>draft<\/b>/);
  assert.match(html, /type="checkbox" name="ids\[\]" value="id1" form="bulk-pengumuman" data-row-check aria-label="Pilih &lt;script&gt;x&lt;\/script&gt;"/);
  assert.match(html, /x-ref="all"[^>]*x-cloak|x-cloak[^>]*x-ref="all"/);
  assert.match(html, /href="\/admin\/pengumuman\/id1\/edit"/);
  assert.match(html, /href="\/edit\/id1">Ubah/);
});

test('v0.1.0: long/HTML titles wrap escaped, null metadata renders empty, header is mono 60px rows', async () => {
  const long = `<i>${'Pengumuman sangat panjang '.repeat(20)}</i>`;
  const html = await render('data-table', {
    caption: 'Daftar <uji>', state: { sort: 'title', dir: 'desc' },
    columns: [{ key: 'title', label: 'Judul', sortable: true, primary: true }, { key: 'kategori', label: 'Kategori' }],
    items: [{ _id: 'a1', title: long, kategori: null }],
    rowHref: item => `/admin/x/${item._id}/edit`,
  });
  assert.match(html, /<caption class="sr-only">Daftar &lt;uji&gt;<\/caption>/);
  assert.equal((html.match(/<th scope="col"/g) || []).length, 3);
  assert.match(html, /aria-sort="descending"[\s\S]*?href="\?sort=title&amp;dir=asc"/);
  assert.match(html, /aria-label="Pilih &lt;i&gt;Pengumuman sangat panjang/);
  assert.doesNotMatch(html, /<i>Pengumuman/);
  assert.match(html, /<td class="dt-meta">\s*<\/td>/);
  assert.doesNotMatch(html, /null|undefined/);
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/admin.css'), 'utf8');
  const rule = selector => css.match(new RegExp(`\\${selector} \\{\\s*@apply ([^;]+);`))[1].split(' ');
  for (const cls of ['font-mono', 'uppercase', 'top-16']) assert.ok(rule('.data-table th').includes(cls), `th tanpa ${cls}`);
  assert.ok(rule('.data-table td').includes('h-15'), 'baris minimum 60px');
  const wrap = css.match(/\.data-table \.dt-text \{ @apply ([^;]+);/)[1].split(' ');
  assert.ok(wrap.includes('break-words') && !wrap.includes('truncate'), 'judul panjang membungkus');
});

test('publication title callbacks wrap long escaped titles without inner truncation', async () => {
  for (const name of ['content-title', 'book-title']) {
    const filename = path.join(__dirname, '../views/admin/_ui', `${name}.ejs`);
    const title = `<script>${'Judul panjang '.repeat(40)}</script>`;
    const html = await render('data-table', {
      caption: 'Publikasi', selectable: false,
      columns: [{ key: 'title', label: 'Judul', cell: item => ejs.render(fs.readFileSync(filename, 'utf8'), { item, icon: require('../utils/icons') }, { filename }) }],
      items: [{ _id: '1', title }], rowHref: () => '/admin/news/1/edit',
    });
    assert.match(html, /&lt;script&gt;Judul panjang/);
    assert.doesNotMatch(html, /<script>|\btruncate\b/);
    assert.match(html, /class="min-w-0 break-words"/);
  }
});

test('v0.1.0: pagination keeps q/status/sort, marks current page and disables edges', async () => {
  const state = { q: 'wisuda', status: 'draft', sort: 'title', dir: 'asc', page: '1' };
  const html = await render('pagination', { page: 1, totalPages: 3, total: 60, pageSize: 25, noun: 'berita', state });
  assert.match(html, /Menampilkan 1–25 dari 60 berita/);
  assert.match(html, /href="\?q=wisuda&amp;status=draft&amp;sort=title&amp;dir=asc&amp;page=2"/);
  assert.match(html, /aria-current="page" class="[^"]*bg-primary text-on-primary/);
  assert.doesNotMatch(html, /rel="prev"/);
});

test('data-table without selection renders no checkboxes', async () => {
  const html = await render('data-table', { caption: 'x', state: {}, selectable: false, columns: [{ key: 'title', label: 'Judul', primary: true }], items: [{ _id: '1', title: 'A' }] });
  assert.doesNotMatch(html, /type="checkbox"/);
});

test('filter-bar keeps sort in hidden fields and status tabs reset the page', async () => {
  const state = { status: 'draft', kategori: 'k1', q: 'rpl', sort: 'title', dir: 'asc', page: '3' };
  const html = await render('filter-bar', {
    state,
    statusTabs: { name: 'status', options: [{ value: '', label: 'Semua' }, { value: 'published', label: 'Terbit' }, { value: 'draft', label: 'Draf' }] },
    filters: [{ name: 'kategori', label: 'Kategori', options: [{ value: 'k1', label: 'Akademik' }, { value: 'k2', label: 'Umum' }] }],
    searchLabel: 'Cari judul pengumuman',
  });
  assert.match(html, /<form method="get"/);
  assert.match(html, /href="\?kategori=k1&amp;q=rpl&amp;sort=title&amp;dir=asc"[^>]*>Semua/);
  assert.match(html, /href="\?status=draft&amp;kategori=k1&amp;q=rpl&amp;sort=title&amp;dir=asc" aria-current="page"[^>]*>Draf/);
  assert.match(html, /<input type="hidden" name="status" value="draft">/);
  assert.match(html, /<input type="hidden" name="sort" value="title">/);
  assert.match(html, /<input type="hidden" name="dir" value="asc">/);
  assert.doesNotMatch(html, /name="page"/);
  assert.match(html, /<option value="k1" selected>Akademik/);
  assert.match(html, /<input[^>]*type="search"[^>]*name="q"[^>]*value="rpl"/);
  assert.match(html, /aria-label="Cari judul pengumuman"|<label[^>]*>Cari judul pengumuman/);
  assert.match(html, /Hapus filter/);
  assert.doesNotMatch(await render('filter-bar', { state: {}, searchLabel: 'Cari' }), /Hapus filter/);
});

test('pagination summarises the range and links pages while keeping filters', async () => {
  const html = await render('pagination', { page: 2, totalPages: 12, total: 290, pageSize: 25, noun: 'pengumuman', state: { status: 'draft', page: '2' } });
  assert.match(html, /26–50 dari 290 pengumuman/);
  assert.match(html, /<nav aria-label="Halaman"/);
  assert.match(html, /href="\?status=draft"[^>]*rel="prev"|rel="prev"[^>]*href="\?status=draft"/);
  assert.match(html, /href="\?status=draft&amp;page=3"[^>]*rel="next"|rel="next"[^>]*href="\?status=draft&amp;page=3"/);
  assert.match(html, /aria-current="page"[^>]*>2</);
  assert.match(html, /…/);
  const single = await render('pagination', { page: 1, totalPages: 1, total: 3, pageSize: 25, noun: 'berita', state: {} });
  assert.match(single, /1–3 dari 3 berita/);
  assert.doesNotMatch(single, /<nav/);
  assert.match(await render('pagination', { page: 1, totalPages: 1, total: 0, pageSize: 25, noun: 'berita', state: {} }), /0 berita/);
});
