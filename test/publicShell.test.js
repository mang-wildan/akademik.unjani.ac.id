const test = require('node:test');
const assert = require('node:assert/strict');
const ejs = require('ejs');
const path = require('node:path');
const fs = require('node:fs');
const helpers = { ...require('../utils/format'), ...require('../utils/navigation'), ...require('../utils/contact'), icon: require('../utils/icons'), assetUrl: value => value };
const render = (file, data = {}) => ejs.renderFile(path.join(__dirname, '../views', `${file}.ejs`), { ...helpers, ...data });

test('public shell preserves navigation and uses a flat dark footer', async () => {
  const html = await render('layouts/public', { body: '<h1>Test</h1>', path: '/profil', chatEnabled: false });
  assert.match(html, /<footer class="on-dark bg-black/);
  assert.match(html, /Ada pertanyaan akademik\?/);
  assert.match(html, /class="skip-link" href="#konten"/);
  assert.match(html, /aria-controls="menu-hp"/);
  assert.match(html, /x-on:keydown.escape="closeAndFocus"/);
  assert.match(html, /href="\/profil"[^>]+aria-current="page"/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)|\sstyle=/);
  assert.doesNotMatch(html, /support_agent|shadow-card/);
});

test('public page header is ivory and escapes titles while retaining breadcrumbs and actions', async () => {
  const html = await render('components/page-header', { heading: '<Test>', breadcrumb: [{ label: 'Profil' }], actions: [{ label: 'Baca', href: '/buku' }] });
  assert.match(html, /bg-canvas/);
  assert.match(html, /&lt;Test&gt;/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /btn-primary/);
  assert.doesNotMatch(html, /section-dark|lambang-unjani/);
});

test('dates and empty states use typography instead of decorative tiles', async () => {
  const html = await render('components/date-block', { date: new Date('2026-11-11'), dateTone: 'solid' });
  assert.match(html, /<time datetime=/);
  assert.doesNotMatch(html, /bg-primary|rounded-control|border border/);
  const empty = await render('components/empty-state', { emptyTitle: 'Kosong', emptyText: 'Coba lagi', emptyAction: { label: 'Kembali', href: '/' } });
  assert.match(empty, /Coba lagi/);
  assert.match(empty, /href="\/"/);
  assert.doesNotMatch(empty, /rounded-full|border-dashed/);
});

test('form labels, errors and notification roles remain accessible', async () => {
  const field = await render('components/form-field', { name: 'judul', label: 'Judul', required: true, value: '<x>', help: 'Bantuan', error: 'Wajib' });
  assert.match(field, /for="f-judul"/);
  assert.match(field, /aria-describedby="f-judul-help f-judul-error"/);
  assert.match(field, /aria-invalid="true"/);
  assert.match(field, /&lt;x&gt;/);
  assert.match(await render('components/alert', { alertTone: 'danger', alertText: 'Gagal' }), /role="alert"/);
  assert.match(await render('components/toast', { success: 'Simpan' }), /role="status"/);
  assert.ok(fs.readFileSync('assets/css/app.css', 'utf8').includes('.on-dark :focus-visible'));
});
