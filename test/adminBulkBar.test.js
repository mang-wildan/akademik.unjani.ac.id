const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ejs = require('ejs');

const setup = (total = 60, noun = 'pengumuman') => {
  const components = {};
  let init;
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/js/admin.js'), 'utf8'), {
    document: { addEventListener(name, handler) { if (name === 'alpine:init') init = handler; } },
    window: { Alpine: { data(name, factory) { components[name] = factory; } }, addEventListener() {} },
  });
  init();
  const root = { closest: () => root };
  const trigger = { closest: () => root };
  const boxes = Array.from({ length: 3 }, (_, i) => ({ value: String(i), checked: false }));
  const table = components.dataTable();
  const bar = components.bulkBar();
  let focus = '';
  const dialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
  bar.$refs = { bulkForm: { dataset: { total: String(total), noun } }, deleteDialog: dialog, deleteConfirm: { value: 'delete' } };
  bar.$dispatch = name => {
    if (name === 'bulk-clear') table.bulkClear({ target: trigger });
    if (name === 'bulk-select-all') table.bulkSelectAll({ target: trigger });
  };
  Object.assign(table, {
    $root: { querySelectorAll: () => boxes, closest: () => root },
    $refs: { all: { focus() { focus = 'all'; } }, selectToggle: { getClientRects: () => [], focus() { focus = 'mobile'; } } },
    $nextTick: fn => fn(),
    $dispatch: (_name, detail) => bar.selection({ detail }),
  });
  table.init();
  const choose = count => { boxes.forEach((box, i) => { box.checked = i < count; }); table.sync(); };
  const submit = submitter => {
    const event = { submitter, prevented: false, preventDefault() { this.prevented = true; } };
    bar.submit(event);
    return event;
  };
  return { bar, table, boxes, dialog, choose, submit, focused: () => focus };
};

test('bulk bar follows table selection, selects all filtered results, and reverts after a checkbox change', () => {
  const { bar, boxes, table, choose } = setup();
  assert.equal(bar.active, false);
  assert.equal(bar.cannotSubmit, true);
  choose(1);
  assert.equal(bar.selectionLabel, '1 pengumuman dipilih');
  assert.equal(bar.canSelectAll, true);
  bar.selectAll();
  assert.equal(boxes.every(box => box.checked), true);
  assert.equal(bar.count, 60);
  assert.equal(bar.scope, 'filter');
  assert.equal(bar.canSelectAll, false);
  boxes[1].checked = false;
  table.sync();
  assert.equal(bar.count, 2);
  assert.equal(bar.scope, 'selected');
});

test('cancel clears checkboxes, indeterminate state and mobile select mode, restoring focus', () => {
  const { bar, table, boxes, choose, focused } = setup();
  choose(1);
  assert.equal(table.$refs.all.indeterminate, true);
  bar.clearSelection();
  assert.equal(bar.active, false);
  assert.equal(boxes.some(box => box.checked), false);
  assert.equal(table.$refs.all.indeterminate, false);
  assert.equal(table.selecting, false);
  assert.equal(focused(), 'all');
  table.$refs.selectToggle.getClientRects = () => [{}];
  choose(1);
  bar.clearSelection();
  assert.equal(focused(), 'mobile');
});

test('table bulk events are scoped to their own list', () => {
  const { table, boxes, choose } = setup();
  choose(1);
  table.bulkClear({ target: {} });
  assert.equal(boxes[0].checked, true);
  table.bulkSelectAll({ target: {} });
  assert.equal(boxes[1].checked, false);
});

test('bulk actions reject zero or over 500 selected items and cap select-all at 500', () => {
  const { bar, choose, submit } = setup(501);
  assert.equal(submit({ value: 'publish' }).prevented, true);
  assert.match(bar.error, /minimal satu/);
  choose(1);
  bar.selectAll();
  assert.equal(bar.scope, 'selected');
  assert.equal(bar.count, 1);
  assert.equal(submit({ value: 'publish' }).prevented, false);
  bar.selection({ detail: { count: 501 } });
  assert.equal(submit({ value: 'publish' }).prevented, true);
  assert.match(bar.error, /500/);
  const allowed = setup(500);
  allowed.choose(1);
  allowed.bar.selectAll();
  assert.equal(allowed.bar.scope, 'filter');
  assert.equal(allowed.submit({ value: 'publish' }).prevented, false);
});

test('delete requires the count/noun dialog and its confirmation submitter; cancel preserves selection', () => {
  const { bar, dialog, choose, submit } = setup(60, 'berita');
  choose(2);
  assert.equal(submit(bar.$refs.deleteConfirm).prevented, true);
  assert.equal(dialog.open, true);
  assert.equal(bar.deleteTitle, 'Hapus 2 berita?');
  assert.equal(submit({ value: 'delete' }).prevented, true);
  assert.equal(submit(bar.$refs.deleteConfirm).prevented, false);
  bar.deleteBackdrop({ target: {} });
  assert.equal(dialog.open, true);
  bar.closeDelete();
  assert.equal(bar.count, 2);
  bar.openDelete();
  bar.deleteBackdrop({ target: dialog });
  assert.equal(dialog.open, false);
});

const render = (overrides = {}) => ejs.renderFile(path.join(__dirname, '../views/admin/_ui/bulk-bar.ejs'), {
  id: 'bulk-test', action: '/admin/news/bulk', total: 60, noun: 'berita',
  state: { q: '<script>', status: 'draft', sort: 'title', dir: 'asc', page: '2' },
  actions: [{ value: 'publish', label: 'Terbitkan' }, { value: 'delete', label: 'Hapus' }], ...overrides,
});

test('bulk partial renders POST contract, escaped state, live count and a native delete dialog', async () => {
  const html = await render();
  assert.match(html, /id="bulk-test" method="POST" action="\/admin\/news\/bulk"/);
  assert.match(html, /name="scope" value="selected" x-bind:value="scope"/);
  assert.match(html, /name="q" value="&lt;script&gt;"/);
  assert.match(html, /name="page" value="2"/);
  assert.match(html, /role="status" aria-live="polite" aria-atomic="true" x-text="selectionLabel"/);
  assert.match(html, /form="bulk-test" name="action" value="delete" x-ref="deleteConfirm"/);
  assert.match(html, /x-on:click="closeDelete" autofocus/);
  assert.doesNotMatch(html, /<dialog[^>]* open|<script|\sstyle=/);
  assert.doesNotMatch(await render({ actions: [{ value: 'deactivate', label: 'Nonaktifkan' }] }), /<dialog|value="delete"/);
});

test('v0.1.0: bulk bar is a brand band with white focus ring and the shared 480px delete dialog', async () => {
  const html = await render();
  assert.match(html, /<form id="bulk-test"[^>]*class="on-brand [^"]*bg-brand text-white/);
  assert.match(html, /x-on:click="clearSelection">Batalkan pilihan</);
  assert.match(html, /<dialog[^>]*class="[^"]*max-w-\[480px\][^"]*border-t-4 border-t-danger/);
  assert.match(html, /<h2[^>]*font-serif[^>]*x-text="deleteTitle"/);
});
