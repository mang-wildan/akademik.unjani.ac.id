const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const ejs = require('ejs');

const render = (name, locals = {}) => ejs.renderFile(path.join(__dirname, '../views/admin/_ui', `${name}.ejs`), { icon: require('../utils/icons'), ...locals });

test('buttons escape labels, distinguish links and enforce accessible icon and busy states', async () => {
  assert.match(await render('button', { label: '<script>', href: '/admin/new' }), /<a href="\/admin\/new"[\s\S]*&lt;script&gt;/);
  assert.match(await render('button', { label: 'Save', type: 'submit', name: 'action', value: 'save' }), /type="submit"[^>]*name="action" value="save"/);
  assert.match(await render('button', { label: 'Save', busy: true, href: '/admin/new' }), /<button[^>]*disabled[^>]*aria-busy="true"[\s\S]*class="spinner"/);
  await assert.rejects(render('button', { variant: 'icon', buttonIcon: 'edit' }), /ariaLabel/);
  assert.match(await render('button', { variant: 'icon', buttonIcon: 'edit', ariaLabel: 'Ubah' }), /aria-label="Ubah"/);
});

test('fields render escaped values, associated help/errors and native required validation', async () => {
  const html = await render('field', { name: 'title', label: 'Judul', required: true, help: 'Bantuan', error: 'Wajib diisi', value: '"><script>' });
  assert.match(html, /for="f-title"/);
  assert.match(html, /\(wajib\)/);
  assert.match(html, /aria-describedby="f-title-help f-title-error" aria-invalid="true"[^>]*value="&#34;&gt;&lt;script&gt;"[^>]*required/);
  assert.match(html, /id="f-title-error"/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(await render('field', { name: 'body', label: 'Isi', type: 'textarea', value: '</textarea><script>' }), /&lt;\/textarea&gt;&lt;script&gt;/);
  assert.match(await render('field', { name: 'state', label: 'Status', type: 'select', value: 0, options: [{ value: 0, label: 'Draf' }] }), /value="0" selected>Draf/);
  assert.match(await render('field', { name: 'active', label: 'Aktif', type: 'checkbox', checked: true, value: 'on' }), /type="checkbox"[^>]*checked/);
  assert.doesNotMatch(await render('field', { name: 'file', label: 'File', type: 'file', value: 'secret' }), /value="secret"/);
});

test('summary links match field IDs, is focusable and is omitted without errors', async () => {
  const html = await render('error-summary', { errors: { title: 'Judul wajib', body: 'Isi wajib' }, fieldIds: { body: 'custom-body' } });
  assert.match(html, /role="alert" tabindex="-1" x-data="errorSummary"/);
  assert.match(html, /href="#f-title"/);
  assert.match(html, /href="#custom-body"/);
  assert.equal((await render('error-summary')).trim(), '');
});

test('header, empty state, badges and confirmation expose text and a no-JS POST form', async () => {
  assert.match(await render('page-header', { heading: 'Data', count: 0, actions: [{ label: 'Tambah', href: '/new' }] }), /<h1[^>]*>Data<\/h1>[\s\S]*>0<\/span>[\s\S]*href="\/new"/);
  assert.match(await render('empty-state', { text: 'Tidak ada hasil', action: { label: 'Hapus filter', href: '/admin' } }), /Tidak ada hasil[\s\S]*Hapus filter/);
  for (const tone of ['neutral', 'success', 'warning', 'danger', 'info']) assert.match(await render('badge', { text: 'Status', tone }), />Status<\/span>/);
  const html = await render('confirm-dialog', { dialogId: 'delete-1', dialogTitle: 'Hapus data?', dialogText: 'Permanen.', action: '/admin/1/delete' });
  assert.match(html, /<dialog open id="delete-1"[^>]*aria-labelledby="delete-1-title"[^>]*aria-describedby="delete-1-text"/);
  assert.match(html, /method="POST" action="\/admin\/1\/delete"/);
  assert.match(html, /formmethod="dialog" formnovalidate autofocus/);
  assert.doesNotMatch(html, /<script|\sonclick=|\sstyle=/);
});

test('admin toast has a five-second pausable timer, correct roles and no empty message', async () => {
  assert.equal((await render('toast')).trim(), '');
  assert.match(await render('toast', { success: 'Tersimpan' }), /data-toast-duration="5000"[^>]*role="status"[\s\S]*x-on:mouseenter="pause"/);
  assert.match(await render('toast', { error: '<script>' }), /role="alert"[\s\S]*x-on:focusout="resume"[\s\S]*&lt;script&gt;/);
});

const runtime = () => {
  const components = {}, handlers = {}, windowHandlers = {}, timers = new Map();
  let now = 0, sequence = 0;
  const document = { addEventListener(name, handler) { handlers[name] = handler; } };
  const context = vm.createContext({
    document,
    window: { Alpine: { data(name, factory) { components[name] = factory; } }, addEventListener(name, handler) { windowHandlers[name] = handler; } },
    Date: { now: () => now },
    setTimeout(fn, delay) { timers.set(++sequence, { fn, delay }); return sequence; },
    clearTimeout(id) { timers.delete(id); },
  });
  for (const file of ['shared', 'admin']) {
    vm.runInContext(fs.readFileSync(require.resolve(`../public/js/${file}.js`), 'utf8'), context);
    handlers['alpine:init']();
  }
  return { components, handlers, windowHandlers, timers, document, advance(ms) { now += ms; } };
};

test('toast retains remaining time, stays paused while hover or focus remains and clears timers', () => {
  const rt = runtime();
  const toast = rt.components.toast();
  let held = true;
  toast.$el = { dataset: { toastDuration: '5000' }, matches: () => held };
  toast.$nextTick = fn => fn();
  toast.init();
  assert.equal(rt.timers.get(toast.timer).delay, 5000);
  rt.advance(1200);
  toast.pause();
  toast.pause();
  assert.equal(toast.remaining, 3800);
  assert.equal(rt.timers.size, 0);
  toast.resume();
  assert.equal(rt.timers.size, 0);
  held = false;
  toast.resume();
  assert.equal(rt.timers.get(toast.timer).delay, 3800);
  toast.dismiss();
  toast.resume();
  assert.equal(toast.visible, false);
  assert.equal(rt.timers.size, 0);
  const legacy = rt.components.toast();
  legacy.init();
  assert.equal(rt.timers.get(legacy.timer).delay, 6000);
  legacy.destroy();
});

test('error summary receives focus and confirmation uses native modal focus handling', () => {
  const { components } = runtime();
  let focused = false, opened = false;
  const summary = components.errorSummary();
  summary.$nextTick = fn => fn();
  summary.$el = { focus() { focused = true; } };
  summary.init();
  assert.equal(focused, true);
  const confirm = components.confirmDialog();
  const dialog = { close() { opened = false; }, showModal() { opened = true; } };
  confirm.$refs = { dialog };
  confirm.init();
  confirm.show();
  confirm.backdrop({ target: {} });
  assert.equal(opened, true);
  confirm.backdrop({ target: dialog });
  assert.equal(opened, false);
});

test('POST busy state prevents duplicate submission, preserves submitter initially and resets on bfcache', () => {
  const { handlers, windowHandlers, timers, document } = runtime();
  const attrs = {};
  const button = { innerHTML: 'Simpan', dataset: {}, setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { delete this[name]; } };
  const form = { method: 'post', hasAttribute: () => false, getAttribute: name => attrs[name], setAttribute(name, value) { attrs[name] = value; }, removeAttribute(name) { delete attrs[name]; }, querySelectorAll: () => [button] };
  const event = { target: form, submitter: button, preventDefault() { this.defaultPrevented = true; } };
  handlers.submit(event);
  assert.equal(button.disabled, undefined);
  assert.equal(attrs['aria-busy'], 'true');
  handlers.submit(event);
  assert.equal(event.defaultPrevented, true);
  timers.values().next().value.fn();
  assert.equal(button.disabled, true);
  assert.match(button.innerHTML, /spinner/);
  document.querySelectorAll = () => [form];
  windowHandlers.pageshow({ persisted: true });
  assert.equal(button.disabled, false);
  assert.equal(button.innerHTML, 'Simpan');
  assert.equal(attrs['aria-busy'], undefined);
  handlers.submit({ target: form, submitter: { formMethod: 'dialog' } });
  assert.equal(attrs['aria-busy'], undefined);
});

// Audit F5-03: sel tabel ber-white-space:nowrap membuat tautan inline-flex di menu ⋯ berjejer
// keluar kartu ("Reset Password" di Akun Pengguna menjorok ke luar layar).
test('row action menus stack their items and allow wrapping inside nowrap table cells', () => {
  const files = ['users/actions', '_ui/academic-actions', '_ui/book-actions', '_ui/content-actions', '_ui/kategori-actions'];
  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, '../views/admin', `${file}.ejs`), 'utf8');
    const menu = source.match(/<div class="(absolute right-0 [^"]*)"/);
    assert.ok(menu, `${file}: menu tidak ditemukan`);
    for (const cls of ['flex', 'flex-col', 'whitespace-normal']) assert.ok(menu[1].split(' ').includes(cls), `${file}: menu tanpa ${cls}`);
  }
});
