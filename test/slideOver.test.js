// Slide-over, dirtyGuard, shortcuts (docs/ARCHITECTURE.md §2.5, SPEC FR-ADM-40..46, DESIGN §7.7, §8).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ejs = require('ejs');
const { listHref, pageItems } = require('../utils/listQuery');

const ID = '0123456789abcdef01234567';
const plain = value => JSON.parse(JSON.stringify(value)); // objek realm vm → objek biasa

const response = ({ status = 200, type = 'text/html; charset=utf-8', body = '', redirected = false, url = 'http://admin.test/' } = {}) => ({
  ok: status >= 200 && status < 300, status, redirected, url,
  headers: { get: name => (name.toLowerCase() === 'content-type' ? type : null) },
  text: async () => body,
  json: async () => JSON.parse(body),
});

const FORM_HTML = `<form method="post" data-panel-title="Ubah kategori"><input name="nama"></form>`;

// Lingkungan browser tiruan secukupnya untuk public/js/admin.js.
const setup = ({ href = 'http://admin.test/admin/kategori?status=aktif', responses = [] } = {}) => {
  const components = {};
  let init;
  const calls = { fetch: [], push: [], replace: [], back: 0, assign: [], focus: [], toasts: [] };
  const location = {
    href,
    get origin() { return new URL(this.href).origin; },
    get pathname() { return new URL(this.href).pathname; },
    get search() { return new URL(this.href).search; },
    assign(url) { calls.assign.push(url); },
  };
  const history = {
    state: null,
    pushState(state, _title, url) { calls.push.push(url); this.state = state; location.href = new URL(url, location.href).href; },
    replaceState(state, _title, url) { calls.replace.push(url); this.state = state; location.href = new URL(url, location.href).href; },
    back() { calls.back += 1; },
  };
  const queue = [...responses];
  const fetch = async (url, options = {}) => {
    calls.fetch.push({ url: String(url), method: options.method || 'GET', accept: options.headers && options.headers.Accept, body: options.body });
    const next = queue.shift();
    if (next instanceof Error) throw next;
    if (!next) throw new Error('fetch tak terduga');
    return response(next);
  };
  class FormData {
    constructor(form, submitter) {
      this.pairs = [...form.fields];
      if (submitter && submitter.name) this.pairs.push([submitter.name, submitter.value]);
    }
    *[Symbol.iterator]() { yield* this.pairs; }
  }
  const region = { replaced: null, replaceWith(node) { this.replaced = node; } };
  let regionPresent = true;
  const document = {
    addEventListener(name, handler) { if (name === 'alpine:init') init = handler; },
    documentElement: { dataset: {} },
    querySelector: selector => (selector === '[data-list-region]' && regionPresent ? region : null),
    querySelectorAll: () => [],
    importNode: node => node,
    body: { append: node => calls.toasts.push(node.message.textContent) },
  };
  class DOMParser {
    parseFromString(html) { return { querySelector: selector => (selector === '[data-list-region]' && html.includes('data-list-region') ? { fresh: html } : null) }; }
  }
  const context = vm.createContext({
    document, location, history, fetch, FormData, DOMParser, URL, URLSearchParams, setTimeout,
    window: { Alpine: { data(name, factory) { components[name] = factory; } }, addEventListener() {} },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../public/js/admin.js'), 'utf8'), context);
  init();

  // Isi panel tiruan: menyimpan HTML dan menjawab querySelector yang dipakai komponen.
  const field = { focus() { calls.focus.push('field'); } };
  const body = {
    html: '',
    set innerHTML(html) { this.html = html; },
    get innerHTML() { return this.html; },
    replaceChildren() { this.html = ''; },
    querySelector(selector) {
      if (selector === '[data-panel-title]') {
        const m = this.html.match(/data-panel-title="([^"]*)"/);
        return m ? { dataset: { panelTitle: m[1] } } : null;
      }
      if (selector === 'h1, h2') return null;
      if (selector === '[x-data="errorSummary"]') return this.html.includes('errorSummary') ? {} : null;
      return this.html.includes('<input') ? field : null;
    },
  };
  const panel = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
  const slide = components.slideOver();
  Object.assign(slide, {
    $root: { dataset: { editUrl: '/admin/kategori/:id/edit', newUrl: '/admin/kategori/new' } },
    $refs: {
      panel, body, discard: { focus() { calls.focus.push('discard'); } },
      toastTemplate: { content: { firstElementChild: { cloneNode: () => ({ message: { textContent: '' }, querySelector() { return this.message; } }) } } },
    },
    $nextTick: fn => fn(),
  });
  const queueResponse = (...more) => queue.push(...more);
  return { components, slide, panel, body, calls, location, history, region, queueResponse, setRegion: v => { regionPresent = v; } };
};

const settle = () => new Promise(resolve => setImmediate(resolve));
const link = (href, extra = {}) => ({
  defaultPrevented: false, button: 0, ...extra,
  target: { closest: selector => (selector === 'a[data-slide-over]' ? { href: new URL(href, 'http://admin.test').href, getAttribute: () => href } : null) },
  preventDefault() { this.defaultPrevented = true; },
});
const form = ({ fields = [['nama', 'Akademik']], enctype = 'application/x-www-form-urlencoded', action = `http://admin.test/admin/kategori/${ID}` } = {}) => ({
  nodeName: 'FORM', method: 'post', action, enctype, fields,
  attrs: {}, getAttribute(k) { return this.attrs[k]; }, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, hasAttribute(k) { return Object.hasOwn(this.attrs, k); },
});
const busyButton = () => ({ name: '', value: '', disabled: false, innerHTML: 'Simpan', dataset: {}, setAttribute(k,v) { this[k]=v; }, removeAttribute(k) { delete this[k]; } });
const submitEvent = (target, submitter = null) => ({ target, submitter, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });

test('slideOver maps panel URLs to ?edit / ?new and ignores malformed ids', () => {
  const { slide } = setup();
  assert.deepEqual(plain(slide.paramFor(`/admin/kategori/${ID}/edit`)), ['edit', ID]);
  assert.deepEqual(plain(slide.paramFor('/admin/kategori/new')), ['new', '1']);
  for (const p of ['/admin/kategori/edit', '/admin/kategori/a.b/edit', '/admin/unit/x/edit', '/admin/kategori']) assert.equal(slide.paramFor(p), null, p);
  for (const [search, expected] of [[`?edit=${ID}`, `/admin/kategori/${ID}/edit`], ['?new=1', '/admin/kategori/new'], ['?edit=../x', ''], ['?new=2', '']]) {
    const env = setup({ href: `http://admin.test/admin/kategori${search}` });
    assert.equal(env.slide.hrefFromLocation(), expected, search);
  }
});

test('closing a saved panel ignores the final input change emitted during focus restoration', () => {
  const { slide, panel } = setup();
  const change = { target: { closest: () => ({}) } };
  panel.open = true;
  slide.markDirty(change);
  assert.equal(slide.dirty, true);
  panel.close = function () { this.open = false; slide.markDirty(change); };
  slide.finishClose();
  assert.equal(slide.dirty, false);
  slide.markDirty(change);
  assert.equal(slide.dirty, false);
});

test('opening from a link pushes ?edit, fetches the partial form and focuses the first field', async () => {
  const { slide, panel, calls, location } = setup({ responses: [{ body: FORM_HTML }] });
  const event = link(`/admin/kategori/${ID}/edit`);
  slide.intercept(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(panel.open, true);
  assert.equal(slide.loading, true);
  assert.deepEqual(calls.push, [`/admin/kategori?status=aktif&edit=${ID}`]);
  await settle();
  assert.equal(calls.fetch[0].url, `http://admin.test/admin/kategori/${ID}/edit?partial=1`);
  assert.match(calls.fetch[0].accept, /application\/json/);
  assert.equal(slide.title, 'Ubah kategori');
  assert.equal(slide.loading, false);
  assert.deepEqual(calls.focus, ['field']);
  assert.equal(location.search, `?status=aktif&edit=${ID}`);
});

test('new panels preserve form query parameters from links, direct URLs and history', async () => {
  const env = setup({ href: 'http://admin.test/admin/kategori?jenis=berita', responses: [{ body: FORM_HTML }] });
  env.slide.intercept(link('/admin/kategori/new?jenis=berita'));
  await settle();
  assert.equal(env.calls.fetch[0].url, 'http://admin.test/admin/kategori/new?jenis=berita&partial=1');
  assert.deepEqual(env.calls.push, ['/admin/kategori?jenis=berita&new=1']);
  assert.equal(env.history.state.slideOver, '/admin/kategori/new?jenis=berita');
  const direct = setup({ href: 'http://admin.test/admin/kategori?jenis=dokumen&new=1' });
  assert.equal(direct.slide.hrefFromLocation(), '/admin/kategori/new?jenis=dokumen');
  assert.deepEqual(plain(direct.slide.paramFor('/admin/kategori/new?jenis=dokumen')), ['new', '1']);
});

test('clicks the panel must not take over are left alone', () => {
  const { slide, calls } = setup();
  for (const event of [link('/admin/kategori/new', { ctrlKey: true }), link('/admin/kategori/new', { button: 1 }), link('https://evil.test/admin/kategori/new'), link('/admin/unit/new'), link('/admin/kategori/new', { defaultPrevented: true })]) {
    slide.intercept(event);
  }
  assert.deepEqual(calls.push, []);
  assert.deepEqual(calls.fetch, []);
});

test('opening directly from ?edit= does not add a history entry; load errors explain and offer the full page', async () => {
  const env = setup({ href: `http://admin.test/admin/kategori?edit=${ID}`, responses: [{ status: 404 }] });
  env.slide.init();
  await settle();
  assert.deepEqual(env.calls.push, []);
  assert.equal(env.slide.error, 'Data tidak ditemukan. Mungkin sudah dihapus.');
  assert.equal(env.slide.loadFailed, true);
  const offline = setup({ responses: [new TypeError('Failed to fetch')] });
  offline.slide.open('/admin/kategori/new', true);
  await settle();
  assert.equal(offline.slide.error, 'Koneksi terputus. Periksa jaringan lalu coba lagi.');
});

test('a saved form closes through history, reloads the list region and shows a toast', async () => {
  const env = setup({ responses: [{ body: FORM_HTML }] });
  env.slide.intercept(link(`/admin/kategori/${ID}/edit`));
  await settle();
  env.queueResponse({ type: 'application/json', body: '{"ok":true,"message":"Kategori disimpan"}' }, { body: '<div data-list-region>baru</div>' });
  const target = form();
  const event = submitEvent(target, { ...busyButton(), name: 'action', value: 'save' });
  await env.slide.submit(event);
  assert.equal(event.defaultPrevented, true);
  const post = env.calls.fetch[1];
  assert.equal(post.method, 'POST');
  assert.equal(post.url, `http://admin.test/admin/kategori/${ID}?partial=1`);
  assert.equal(String(post.body), 'nama=Akademik&action=save'); // urlencoded seperti submit biasa
  assert.equal(env.calls.back, 1);
  assert.equal(env.panel.open, true); // tertutup saat popstate tiba
  env.history.state = null;
  env.location.href = 'http://admin.test/admin/kategori?status=aktif';
  env.slide.popstate({ state: null });
  assert.equal(env.panel.open, false);
  await settle();
  assert.equal(env.calls.fetch[2].url, 'http://admin.test/admin/kategori?status=aktif&partial=1');
  assert.deepEqual(plain(env.region.replaced), { fresh: '<div data-list-region>baru</div>' });
  assert.deepEqual(env.calls.toasts, ['Kategori disimpan']);
  assert.equal(target.attrs['aria-busy'], undefined);
});

test('multipart forms keep FormData so uploads are sent', async () => {
  const env = setup({ responses: [{ type: 'application/json', body: '{"ok":true}' }, { body: '<div data-list-region></div>' }] });
  await env.slide.submit(submitEvent(form({ enctype: 'multipart/form-data' })));
  assert.equal(env.calls.fetch[0].body.constructor.name, 'FormData');
});

test('validation errors (422 or 200 HTML) replace the panel and keep it dirty', async () => {
  for (const status of [422, 200]) {
    const env = setup({ responses: [{ status, body: '<form data-panel-title="Ubah kategori"><div x-data="errorSummary"></div><input></form>' }] });
    env.panel.open = true;
    await env.slide.submit(submitEvent(form()));
    assert.match(env.body.html, /errorSummary/);
    assert.equal(env.slide.dirty, true);
    assert.equal(env.slide.error, '');
    assert.equal(env.panel.open, true);
    assert.deepEqual(env.calls.focus, []); // ringkasan error memfokuskan dirinya sendiri
  }
});

test('redirects count as saved only when they carry ?success=', async () => {
  const ok = setup({ responses: [{ redirected: true, url: 'http://admin.test/admin/kategori?success=1%20kategori%20disimpan' }, { body: '<div data-list-region></div>' }] });
  ok.panel.open = true;
  await ok.slide.submit(submitEvent(form()));
  await settle();
  assert.deepEqual(ok.calls.toasts, ['1 kategori disimpan']);

  const lost = setup({ responses: [{ redirected: true, url: 'http://admin.test/login' }] });
  lost.panel.open = true;
  lost.body.html = FORM_HTML;
  await lost.slide.submit(submitEvent(form()));
  assert.equal(lost.slide.error, 'Perubahan mungkin belum tersimpan. Muat ulang halaman untuk memastikan.');
  assert.equal(lost.panel.open, true);
  assert.equal(lost.body.html, FORM_HTML);
});

test('server, session and network failures keep the form and explain', async () => {
  const cases = [
    [{ status: 500 }, 'Server sedang bermasalah. Coba lagi beberapa saat lagi.'],
    [{ status: 401, type: 'application/json', body: '{"error":"Silakan login terlebih dahulu."}' }, 'Sesi Anda berakhir. Masuk kembali lalu ulangi.'],
    [{ status: 403 }, 'Anda tidak punya akses ke data ini.'],
    [new TypeError('Failed to fetch'), 'Koneksi terputus. Periksa jaringan lalu coba lagi.'],
  ];
  for (const [reply, message] of cases) {
    const env = setup({ responses: [reply] });
    env.panel.open = true;
    env.body.html = FORM_HTML;
    const submitter = busyButton();
    await env.slide.submit(submitEvent(form(), submitter));
    assert.equal(env.slide.error, message);
    assert.equal(env.body.html, FORM_HTML);
    assert.equal(env.slide.busy, false);
    assert.equal(submitter.disabled, false);
  }
});

test('a second submit while saving is ignored', async () => {
  const env = setup({ responses: [{ type: 'application/json', body: '{"ok":true}' }, { body: '<div data-list-region></div>' }] });
  const first = env.slide.submit(submitEvent(form()));
  const second = submitEvent(form());
  await env.slide.submit(second);
  assert.equal(second.defaultPrevented, true);
  await first;
  assert.equal(env.calls.fetch.filter(call => call.method === 'POST').length, 1);
});

test('slide-over submit applies busy label by action type', async () => {
  const cases = [
    { action: '/admin/kategori/new', label: 'Menyimpan' },
    { action: `/admin/kategori/${ID}`, label: 'Menyimpan' },
    { action: `/admin/kategori/${ID}/delete`, label: 'Menghapus' },
    { action: '/admin/kategori/bulk', label: 'Memproses' },
  ];
  for (const { action, label } of cases) {
    const env = setup({ responses: [{ type: 'application/json', body: '{"ok":true}' }] });
    const target = form({ action });
    const submitter = busyButton();
    const pending = env.slide.submit(submitEvent(target, submitter));
    assert.equal(target.attrs['aria-busy'], 'true');
    assert.equal(submitter.disabled, true);
    assert.match(submitter.innerHTML, new RegExp(label));
    assert.match(submitter.innerHTML, /spinner/);
    await pending;
    assert.equal(submitter.innerHTML, 'Simpan');
    assert.equal(submitter.disabled, false);
  }
});

test('slide-over submit applies data-busy-label override', async () => {
  const env = setup({ responses: [{ type: 'application/json', body: '{"ok":true}' }] });
  const target = form({ action: '/admin/kategori/new' });
  target.setAttribute('data-busy-label', 'Kustom…');
  const submitter = busyButton();
  const pending = env.slide.submit(submitEvent(target, submitter));
  assert.equal(target.attrs['aria-busy'], 'true');
  assert.equal(submitter.disabled, true);
  assert.match(submitter.innerHTML, /Kustom/);
  await pending;
  assert.equal(submitter.innerHTML, 'Simpan');
  assert.equal(submitter.disabled, false);
});

test('slide-over restores button after validation response', async () => {
  const env = setup({responses:[{status:422,body:FORM_HTML}]});
  const target = form();
  const button = busyButton();
  const pending = env.slide.submit(submitEvent(target,button));
  assert.match(button.innerHTML,/spinner/);
  await pending;
  assert.equal(button.disabled,false);
  assert.equal(button.innerHTML,'Simpan');
  assert.equal(button['aria-busy'],undefined);
  assert.equal(target.attrs['aria-busy'],undefined);
});

test('slide-over submit restores button after fetch failure', async () => {
  const env = setup({ responses: [new TypeError('Failed to fetch')] });
  const target = form({ action: `/admin/kategori/${ID}` });
  const submitter = busyButton();
  await env.slide.submit(submitEvent(target, submitter));
  assert.equal(env.slide.error, 'Koneksi terputus. Periksa jaringan lalu coba lagi.');
  assert.equal(submitter.disabled, false);
  assert.equal(submitter.innerHTML, 'Simpan');
});

test('closing with unsaved changes asks first; Escape and Back are routed through the same check', async () => {
  const env = setup({ responses: [{ body: FORM_HTML }] });
  env.slide.intercept(link(`/admin/kategori/${ID}/edit`));
  await settle();
  env.slide.markDirty({ target: { closest: () => ({}) } });
  env.slide.requestClose();
  assert.equal(env.slide.confirming, true);
  assert.deepEqual(env.calls.focus.at(-1), 'discard');
  assert.equal(env.calls.back, 0);

  const escape = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  env.slide.cancel(escape);
  assert.equal(escape.defaultPrevented, true);
  assert.equal(env.panel.open, true);

  env.slide.popstate({ state: null }); // Back saat ada perubahan: entri dipulihkan, panel tetap
  assert.equal(env.panel.open, true);
  assert.equal(env.calls.push.at(-1), `/admin/kategori?status=aktif&edit=${ID}`);

  const unload = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  env.slide.beforeUnload(unload);
  assert.equal(unload.defaultPrevented, true);

  env.slide.discard();
  assert.equal(env.calls.back, 1);
  env.location.href = 'http://admin.test/admin/kategori?status=aktif'; // history.back() sudah memindahkan URL
  env.slide.popstate({ state: null });
  assert.equal(env.panel.open, false);
  assert.equal(env.slide.dirty, false);
});

test('Escape is handled on keydown, because Chrome may make the dialog cancel event uncancelable', async () => {
  const env = setup({ responses: [{ body: FORM_HTML }] });
  env.slide.intercept(link(`/admin/kategori/${ID}/edit`));
  await settle();
  env.slide.markDirty({ target: { closest: () => ({}) } });
  const key = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  env.slide.escape(key);
  assert.equal(key.defaultPrevented, true); // mencegah permintaan tutup dari browser
  assert.equal(env.slide.confirming, true);
  assert.equal(env.panel.open, true);
});

test('a dialog closed by the browser itself is reopened when dirty, or cleaned up when clean', async () => {
  const dirty = setup({ responses: [{ body: FORM_HTML }] });
  dirty.slide.intercept(link(`/admin/kategori/${ID}/edit`));
  await settle();
  dirty.slide.markDirty({ target: { closest: () => ({}) } });
  dirty.panel.open = false; // Escape tanpa aktivasi pengguna: cancel tak bisa dibatalkan
  dirty.slide.nativeClose();
  assert.equal(dirty.panel.open, true);
  assert.equal(dirty.slide.confirming, true);
  assert.equal(dirty.calls.back, 0);

  const clean = setup({ responses: [{ body: FORM_HTML }] });
  clean.slide.intercept(link(`/admin/kategori/${ID}/edit`));
  await settle();
  clean.panel.open = false;
  clean.slide.nativeClose();
  assert.equal(clean.calls.back, 1); // entri riwayat panel ikut dibuang

  // Penutupan oleh komponen sendiri juga memicu event close: tidak boleh diproses ulang.
  clean.location.href = 'http://admin.test/admin/kategori?status=aktif';
  clean.panel.open = true;
  clean.slide.popstate({ state: null });
  assert.equal(clean.panel.open, false);
  clean.slide.nativeClose();
  assert.equal(clean.calls.back, 1);
  assert.equal(clean.panel.open, false);
});

test('without a list region the page reloads with the success message', async () => {
  const env = setup({ responses: [{ type: 'application/json', body: '{"ok":true,"message":"Tersimpan"}' }] });
  env.setRegion(false);
  env.panel.open = true;
  await env.slide.submit(submitEvent(form()));
  await settle();
  assert.equal(env.calls.replace.length, 1); // tidak ada entri riwayat milik panel → replaceState
  assert.deepEqual(env.calls.assign, ['http://admin.test/admin/kategori?status=aktif&success=Tersimpan']);
});

test('shortcuts: N opens the add action outside text fields, Ctrl/Cmd+S submits the visible form', () => {
  const env = setup();
  const shortcuts = env.components.shortcuts();
  const clicked = [];
  const submitted = [];
  const saveButton = { id: 'simpan' };
  const panelForm = { requestSubmit: b => submitted.push(['panel', b]), querySelector: () => saveButton };
  const pageForm = { requestSubmit: b => submitted.push(['page', b]), querySelector: () => saveButton };
  let dialogOpen = false;
  shortcuts.$root = null;
  Object.assign(shortcuts, {
    find: selector => ({
      '[data-shortcut="new"]': { click: () => clicked.push('new') },
      'dialog[open]': dialogOpen ? {} : null,
      'dialog[open] form[data-save-form]': dialogOpen ? panelForm : null,
      'form[data-save-form]': pageForm,
    })[selector] || null,
  });
  const key = (k, extra = {}) => ({ key: k, target: { closest: () => null }, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra });

  const n = key('n');
  shortcuts.keydown(n);
  assert.deepEqual(clicked, ['new']);
  assert.equal(n.defaultPrevented, true);
  shortcuts.keydown(key('N', { target: { closest: () => ({}) } })); // sedang mengetik
  shortcuts.keydown(key('n', { ctrlKey: true }));
  shortcuts.keydown(key('n', { repeat: true }));
  dialogOpen = true;
  shortcuts.keydown(key('n'));
  assert.deepEqual(clicked, ['new']);

  const save = key('s', { ctrlKey: true }); // tetap jalan di dalam input
  shortcuts.keydown(save);
  assert.equal(save.defaultPrevented, true);
  dialogOpen = false;
  shortcuts.keydown(key('S', { metaKey: true }));
  assert.deepEqual(submitted.map(([where]) => where), ['panel', 'page']);
  assert.equal(submitted[0][1], saveButton);
  shortcuts.keydown(key('s', { ctrlKey: true, target: { closest: () => panelForm } }));
  assert.equal(submitted.at(-1)[0], 'panel'); // form yang sedang difokuskan, bukan form pertama
});

test('dirtyGuard warns before leaving a changed full-page form, not after submit', () => {
  const env = setup();
  const guard = env.components.dirtyGuard();
  const unload = () => ({ defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });
  let event = unload();
  guard.beforeUnload(event);
  assert.equal(event.defaultPrevented, false);
  guard.mark();
  event = unload();
  guard.beforeUnload(event);
  assert.equal(event.defaultPrevented, true);
  guard.submitted();
  event = unload();
  guard.beforeUnload(event);
  assert.equal(event.defaultPrevented, false);
});

const render = (name, locals = {}) => ejs.renderFile(path.join(__dirname, '../views/admin/_ui', `${name}.ejs`), {
  icon: require('../utils/icons'), listHref, pageItems, ...locals,
});

test('slide-over markup: modal dialog labelled by its title, URL patterns and an inert toast template', async () => {
  const html = await render('slide-over', { editUrl: '/admin/kategori/:id/edit', newUrl: '/admin/kategori/new' });
  assert.match(html, /x-data="slideOver" data-edit-url="\/admin\/kategori\/:id\/edit" data-new-url="\/admin\/kategori\/new"/);
  assert.match(html, /x-on:click\.document="intercept"[^>]*x-on:popstate\.window="popstate"/);
  assert.match(html, /<dialog x-ref="panel"[^>]*aria-labelledby="slide-over-title"/);
  assert.match(html, /id="slide-over-title"[^>]*x-text="title"/);
  assert.match(html, /x-ref="body"[^>]*x-on:submit="submit"/);
  assert.match(html, /<template x-ref="toastTemplate">[\s\S]*data-toast[\s\S]*data-toast-message[\s\S]*<\/template>/);
});

test('links and buttons opt into the panel and shortcuts by attribute', async () => {
  const table = await render('data-table', { caption: 'x', state: {}, slideOver: true, columns: [{ key: 'nama', label: 'Nama', primary: true }], items: [{ _id: ID, nama: 'A' }], rowHref: item => `/admin/kategori/${item._id}/edit` });
  assert.match(table, new RegExp(`<a href="/admin/kategori/${ID}/edit" class="dt-link"[^>]*data-slide-over`));
  assert.doesNotMatch(await render('data-table', { caption: 'x', state: {}, columns: [{ key: 'nama', label: 'Nama' }], items: [{ _id: ID, nama: 'A' }], rowHref: () => '/x' }), /data-slide-over/);
  const button = await render('button', { label: 'Tambah', href: '/admin/kategori/new', slideOver: true, shortcut: 'new' });
  assert.match(button, /<a href="\/admin\/kategori\/new"[^>]*data-slide-over[^>]*data-shortcut="new"/);
});

// Audit F5-03: setelah skip-link, URL berisi #konten; history.back() memfokuskan target fragmen
// setelah dialog mengembalikan fokus, sehingga fokus tidak kembali ke baris pemicu.
test('closing without a list refresh returns focus to the triggering link', async () => {
  const env = setup({ responses: [{ body: FORM_HTML }] });
  const focused = [];
  const anchor = { href: `http://admin.test/admin/kategori/${ID}/edit`, isConnected: true, getAttribute: () => `/admin/kategori/${ID}/edit`, focus() { focused.push('link'); } };
  env.slide.intercept({ defaultPrevented: false, button: 0, target: { closest: () => anchor }, preventDefault() {} });
  await settle();
  env.slide.requestClose();
  env.location.href = 'http://admin.test/admin/kategori?status=aktif';
  env.slide.popstate({ state: null });
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.deepEqual(focused, ['link']);
});
