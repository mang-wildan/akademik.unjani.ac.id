// Layout admin v2 (docs/SPEC.md FR-ADM-01..05, docs/DESIGN.md §7.1).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ejs = require('ejs');
const navigation = require('../utils/navigation');
const roles = require('../utils/roles');
const fs = require('node:fs');

test('admin CSS stays under 60 KB and public CSS does not exceed the F1 release', () => {
  assert.ok(fs.statSync(path.join(__dirname, '../public/css/admin.css')).size <= 60000);
  assert.ok(fs.statSync(path.join(__dirname, '../public/css/app.css')).size <= 80380);
});

const render = (overrides = {}) => ejs.renderFile(path.join(__dirname, '../views/layouts/admin-v2.ejs'), {
  icon: require('../utils/icons'),
  ...navigation,
  roleLabel: roles.roleLabel,
  assetUrl: url => `${url}?v=test`,
  user: { name: 'Admin Contoh', email: 'admin@unjani.ac.id', role: 'superadmin' },
  path: '/admin/pengumuman',
  title: 'Kelola Pengumuman',
  body: '<p>Isi halaman</p>',
  adminTheme: 'dark',
  adminSidebar: 'collapsed',
  ...overrides,
});

test('admin-v2 renders server preferences on <html> and falls back to defaults', async () => {
  const html = await render();
  assert.match(html, /<html lang="id" data-theme="dark" data-sidebar="collapsed">/);
  const fallback = await render({ adminTheme: undefined, adminSidebar: undefined });
  assert.match(fallback, /<html lang="id" data-theme="system" data-sidebar="open">/);
});

test('admin-v2 loads only admin assets, in shared → admin → Alpine order', async () => {
  const html = await render();
  assert.match(html, /href="\/css\/admin\.css\?v=test"/);
  assert.doesNotMatch(html, /app\.css|\/js\/app\.js/);
  const order = ['/js/shared.js?v=test', '/js/admin.js?v=test', '/js/vendor/alpine-csp.min.js'].map(src => html.indexOf(src));
  assert.ok(order.every(i => i > 0) && order[0] < order[1] && order[1] < order[2], `script order: ${order}`);
});

test('admin-v2 has no inline script or style (strict CSP)', async () => {
  const html = await render({ alertSuccess: 'Tersimpan' });
  assert.doesNotMatch(html, /<script(?![^>]*\ssrc=)[^>]*>/);
  assert.doesNotMatch(html, /<style|\sstyle="/);
});

test('admin-v2 menu respects roles and marks the active page', async () => {
  const superadmin = await render();
  assert.match(superadmin, /href="\/admin\/settings"/);
  const editor = await render({ user: { name: 'Editor', role: 'editor' } });
  assert.doesNotMatch(editor, /href="\/admin\/settings"/);
  assert.match(editor, /<a href="\/admin\/pengumuman"[^>]*aria-current="page"/);
  assert.doesNotMatch(editor, /<a href="\/admin\/news"[^>]*aria-current="page"/);
});

test('admin-v2 shell: skip link, breadcrumb, account menu, drawer, bottom nav', async () => {
  const html = await render();
  assert.match(html, /<a class="skip-link[^"]*" href="#konten">/);
  assert.match(html, /<main id="konten" tabindex="-1"/);
  assert.match(html, /<nav aria-label="Breadcrumb"[\s\S]*Publikasi[\s\S]*aria-current="page"[^>]*>Kelola Pengumuman</);
  for (const theme of ['light', 'dark', 'system']) assert.match(html, new RegExp(`data-theme="${theme}"[^>]*x-on:click="setTheme"`));
  assert.match(html, /<form action="\/logout" method="POST"/);
  assert.match(html, /<dialog x-ref="drawer"/);
  assert.match(html, /<nav aria-label="Navigasi cepat"[\s\S]*Dasbor[\s\S]*Pengumuman[\s\S]*Berita[\s\S]*x-on:click="openDrawer"/);
});

// Kelas pada tag pembuka pertama yang cocok `opening` (DESIGN v0.1.0 §4).
const classesOf = (html, opening) => {
  const m = html.match(new RegExp(`${opening}[^>]*?class="([^"]*)"`));
  assert.ok(m, `tag tidak ditemukan: ${opening}`);
  return m[1].split(/\s+/);
};

test('admin-v2 shell editorial: sidebar hijau 264px, topbar 64px, link aktif bergaris aksen 3px', async () => {
  const html = await render({ adminSidebar: 'open' });
  const aside = classesOf(html, '<aside id="sidebar-admin"');
  for (const cls of ['bg-brand', 'text-sidebar-text', 'lg:w-66', 'lg:collapsed:w-16']) assert.ok(aside.includes(cls), `aside: ${cls}`);
  assert.match(html, /<aside id="sidebar-admin"[\s\S]*?<nav class="[^"]*\boverflow-y-auto\b/, 'menu sidebar scroll sendiri');
  assert.match(html, /<div class="lg:pl-66 lg:collapsed:pl-16">/);
  assert.ok(classesOf(html, '<header').includes('h-16'));
  assert.ok(classesOf(html, '<main id="konten"').includes('xl:px-12'), 'gutter 48px di desktop lebar');
  const active = classesOf(html, '<a href="/admin/pengumuman" aria-current="page"');
  for (const cls of ['border-l-3', 'border-accent', 'bg-canvas', 'text-primary']) assert.ok(active.includes(cls), `aktif: ${cls}`);
  const idle = classesOf(html, '<a href="/admin/news"');
  assert.ok(idle.includes('border-l-3') && idle.includes('border-transparent'), 'lebar item tidak berubah saat aktif');
  assert.match(html, /<dialog x-ref="drawer"[^>]*class="[^"]*\bbg-brand\b/);
});

test('admin-v2 subpath ubah tetap menandai modul dan role editor hanya melihat modul berizin', async () => {
  const html = await render({ path: '/admin/pengumuman/abc123/edit', user: { name: 'Editor', role: 'editor' } });
  assert.match(html, /<a href="\/admin\/pengumuman" aria-current="page"/);
  for (const href of ['/admin/settings', '/admin/users']) assert.doesNotMatch(html, new RegExp(`href="${href}"`));
});

test('admin-v2 meng-escape nama pengguna dan breadcrumb panjang', async () => {
  const long = `${'Judul sangat panjang '.repeat(12)}<img src=x onerror=alert(1)>`;
  const html = await render({ user: { name: '<script>alert(1)</script>', role: 'superadmin' }, breadcrumb: [{ label: '<b>Grup</b>', href: '/admin/news' }, { label: long }] });
  assert.doesNotMatch(html, /<script>alert|<img src=x|<b>Grup/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /aria-current="page"[^>]*>Judul sangat panjang [^<]*&lt;img src=x/);
});

test('admin-v2 topbar: Cari menu dengan Ctrl/Cmd+K dan tautan Lihat situs', async () => {
  const html = await render();
  assert.match(html, /<input id="cari-modul"[^>]*placeholder="Cari menu/);
  assert.match(html, /aria-keyshortcuts="Control\+K Meta\+K"/);
  assert.match(html, /<kbd[^>]*>Ctrl K<\/kbd>/);
  assert.match(html, /<header[\s\S]*<a href="\/"[^>]*>[\s\S]*?Lihat situs[\s\S]*<\/header>/);
});

test('admin-v2 toast: status for success, alert for error, absent otherwise', async () => {
  assert.match(await render({ alertSuccess: '3 berita diterbitkan' }), /role="status"[\s\S]*3 berita diterbitkan/);
  assert.match(await render({ alertError: 'Gagal menyimpan' }), /role="alert"[\s\S]*Gagal menyimpan/);
  assert.doesNotMatch(await render(), /x-data="toast"/);
});
