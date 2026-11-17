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

test('v0.1.0: serif header keeps 0, badge dot is decorative text, dialog 480px with status bar', async () => {
  assert.match(await render('page-header', { heading: 'Data', count: 0 }), /<h1[^>]*class="[^"]*font-serif[^"]*">Data<\/h1>[\s\S]*>0<\/span>/);
  const badge = await render('badge', { text: 'Terbit', tone: 'success' });
  assert.match(badge, /<span[^>]*aria-hidden="true"[^>]*><\/span>Terbit<\/span>/);
  assert.match(await render('badge', { text: 'Admin', badgeIcon: 'verified' }), /<svg[\s\S]*Admin<\/span>/);
  const html = await render('confirm-dialog', { dialogId: 'd1', dialogTitle: '<b>Hapus?</b>', dialogText: 'x', action: '/admin/x/1/delete' });
  assert.match(html, /<dialog[^>]*class="[^"]*max-w-\[480px\][^"]*border-t-4 border-t-danger/);
  assert.match(html, /<h2[^>]*font-serif[^>]*>&lt;b&gt;Hapus\?&lt;\/b&gt;<\/h2>/);
  assert.match(html, /method="POST" action="\/admin\/x\/1\/delete"/);
  assert.match(html, /formmethod="dialog" formnovalidate autofocus[^>]*>Batal/);
});

test('v0.1.0: toast is dark ink with escaped text, roles, close and no undo', async () => {
  for (const [key, role] of [['success', 'status'], ['error', 'alert']]) {
    const html = await render('toast', { [key]: '<img src=x>' });
    assert.match(html, new RegExp(`data-toast-duration="5000"[^>]*role="${role}"`));
    assert.match(html, /bg-ink text-canvas/);
    assert.match(html, /&lt;img src=x&gt;/);
    assert.match(html, /aria-label="Tutup pesan"/);
    assert.doesNotMatch(html, /Urungkan|<img/);
  }
});

test('page heading constrains unbroken names inside its wrapping flex row', async () => {
  const html = await render('page-header', { heading: 'Nama'.repeat(200) });
  assert.match(html, /<h1 class="min-w-0 max-w-full break-words/);
});

test('shared list controls keep 44px targets on coarse pointers at desktop widths', () => {
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/admin.css'), 'utf8');
  const coarse = css.match(/@media \(pointer: coarse\) \{([\s\S]*?)\n  \}/)[1];
  for (const selector of ['.dt-box-hit', '.dt-sort', '[data-filter-bar] nav a', 'nav[aria-label="Halaman"] a', '[data-toast] button']) {
    const rule = coarse.slice(coarse.indexOf(selector)).split('}')[0];
    assert.ok(coarse.includes(selector) && rule.includes('min-h-11') && rule.includes('min-w-11'), selector);
  }
});

test('mobile toast moves above an active bulk bar rather than covering its final actions', () => {
  const css = fs.readFileSync(path.join(__dirname, '../assets/css/admin.css'), 'utf8');
  const mobile = css.slice(css.indexOf('@media (width < 64rem) {', css.indexOf('/* Di luar layer')));
  assert.match(mobile, /body:has\(\[data-bulk-active\]\) \[data-toast\] \{\s*top: 5rem;\s*bottom: auto;/);
});

test('admin toast has a five-second pausable timer, correct roles and no empty message', async () => {
  assert.equal((await render('toast')).trim(), '');
  assert.match(await render('toast', { success: 'Tersimpan' }), /data-toast-duration="5000"[^>]*role="status"[\s\S]*x-on:mouseenter="pause"/);
  assert.match(await render('toast', { error: '<script>' }), /role="alert"[\s\S]*x-on:focusout="resume"[\s\S]*&lt;script&gt;/);
});

test('publication forms separate main fields and publication panel without duplicating partial headings', async () => {
  for (const basePath of ['pengumuman', 'news']) {
    const locals = { mode: 'edit', basePath, singularLabel: 'Konten', item: { _id: 'p1', featuredImage: '/uploads/news/current.webp', attachments: [{ _id: 'a1', judul: '<PDF>', file: '/uploads/news/current.pdf' }, { _id: 'a2', judul: 'Dihapus', file: '/uploads/news/removed.pdf' }] }, values: { title: 'Judul <uji>', body: '<p>Isi</p>', status: 'published', kategori: 'k1', pinned: 'on', attachmentsEditable: '1', keepAttachment: ['a1'] }, errors: { title: 'Perbaiki judul', body: 'Perbaiki isi', _form: 'Batas sematan', attachments: 'Periksa file' }, kategoriList: [{ _id: 'k1', nama: 'Akademik' }] };
    const html = await render('content-form', locals);
    assert.match(html, /class="publication-form"/);
    assert.match(html, /class="publication-layout"/);
    assert.match(html, /data-form-main[\s\S]*name="title"[\s\S]*name="body"[\s\S]*name="attachments"[\s\S]*data-publication-panel/);
    assert.match(html, /aria-labelledby="publication-title"/);
    assert.match(html, /id="publication-title"[^>]*>Terbitkan/);
    assert.match(html, /value="Judul &lt;uji&gt;"/);
    assert.match(html, /value="published" selected/);
    assert.match(html, /value="k1" selected/);
    assert.match(html, /name="pinned"[^>]*checked/);
    assert.match(html, /id="keep-a1"[^>]*checked/);
    assert.doesNotMatch(html, /id="keep-a2"[^>]*checked/);
    assert.match(html, /href="\/uploads\/news\/current.pdf"/);
    assert.match(html, /src="\/uploads\/news\/current.webp"/);
    for (const input of html.matchAll(/<input type="file"[^>]*>/g)) assert.doesNotMatch(input[0], /\svalue=/);
    assert.match(html, /[Pp]ilih ulang/);
    for (const target of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${target[1]}"`), target[1]);
    assert.match(html, /name="intent" value="publish"/);
    assert.match(html, /data-save-form[\s\S]*x-data="dirtyGuard"/);
    const partial = await render('content-form', { ...locals, partial: true });
    assert.match(partial, /class="publication-form publication-form--stacked"/);
    assert.doesNotMatch(partial, /<h1|<!DOCTYPE/);
    assert.match(partial, /name="body"/);
  }
});

test('summary targets reserve space beneath sticky header and form actions', async () => {
  const field = await render('field', { name: 'title', label: 'Judul' });
  assert.match(field, /<input[^>]*class="[^"]*scroll-mt-20 scroll-mb-40/);
  const editor = await render('richtext-field', { name: 'body', label: 'Isi' });
  assert.match(editor, /id="f-body-field"[^>]*class="scroll-mt-20 scroll-mb-40"/);
});

test('upload field wraps native file control and exposes escaped current-file link', async () => {
  const html = await render('upload-field', { name: 'file', label: 'PDF', value: 'private.pdf', current: { href: '/uploads/books/test.pdf', label: '<Panduan>' }, limitText: 'PDF, maks. 10 MB.' });
  assert.match(html, /border-dashed/);
  assert.match(html, /<input type="file"[^>]*id="f-file"/);
  assert.doesNotMatch(html, /value="private.pdf"|[Tt]arik file/);
  assert.match(html, /href="\/uploads\/books\/test.pdf"[^>]*rel="noopener"[\s\S]*&lt;Panduan&gt;/);
  assert.match(html, /Pilih ulang setelah gagal validasi/);
});

test('empty publication lists distinguish initial state from filtered results and retain real actions', async () => {
  const { listHref, pageItems } = require('../utils/listQuery');
  for (const basePath of ['pengumuman', 'news']) {
    const common = { basePath, listLabel: basePath === 'news' ? 'Berita' : 'Pengumuman', singularLabel: 'Konten', counts: { total: 0 }, pagination: { total: 0, page: 1, totalPages: 1, pageSize: 20 }, kategoriList: [], listHref, pageItems, formatTanggal: () => '16 Nov 2026' };
    const empty = await render('content-list', { ...common, state: {}, items: [] });
    assert.match(empty, /Belum ada/);
    assert.equal((empty.match(new RegExp(`href="/admin/${basePath}/new"`, 'g')) || []).length, 2);
    for (const status of ['published', 'draft']) {
      const html = await render('content-list', { ...common, state: { q: 'Uji', status, kategori: 'k1' }, items: [] });
      assert.match(html, /Tidak ada[\s\S]*yang cocok/);
      assert.match(html, new RegExp(`href="/admin/${basePath}"[^>]*>[\\s\\S]*Hapus filter`));
      assert.match(html, /status=published/);
      assert.match(html, /status=draft/);
      assert.match(html, /q=Uji/);
    }
    const row = await render('content-actions', { basePath, item: { _id: 'p1', title: '<Judul>', pinned: true } });
    assert.match(row, new RegExp(`href="/admin/${basePath}/p1/edit"`));
    assert.match(row, /<summary[^>]*aria-label="Aksi untuk &lt;Judul&gt;"/);
    assert.match(row, new RegExp(`method="POST" action="/admin/${basePath}/p1/pin"`));
    assert.match(row, new RegExp(`method="POST" action="/admin/${basePath}/p1/delete"`));
  }
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

test('bulk select-all only shrinks to 40px for fine pointers', async () => {
  const html = await render('bulk-bar', { action: '/admin/news/bulk', noun: 'berita', total: 3 });
  const button = html.match(/<button[^>]*x-on:click="selectAll"[^>]*>/)[0];
  assert.match(button, /class="min-h-11\s/);
  assert.match(button, /lg:pointer-fine:min-h-10/);
  assert.doesNotMatch(button, /(?:\s|^)lg:min-h-10/);
});
