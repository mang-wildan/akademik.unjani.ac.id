const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { createRequire } = require('node:module');
const { adminNav, canSee } = require('../utils/navigation');
const guards = require('../middleware/authMiddleware');
const menu = adminNav.flatMap(group => group.items.map(item => ({ ...item, group: group.group })));

test('every registered admin module has one menu item with the same role guard', () => {
  const server = fs.readFileSync(require.resolve('../server'), 'utf8');
  const requireServer = createRequire(require.resolve('../server'));
  const imports = Object.fromEntries([...server.matchAll(/const (\w+) = require\('([^']+)'\);/g)].map(m => [m[1], m[2]]));
  const registrations = [...server.matchAll(/app\.use\('(\/admin\/[^']+)', (\w+)\);/g)];
  assert.equal(new Set(menu.map(item => item.href)).size, menu.length, 'duplicate menu');
  assert.equal(menu.length, registrations.length + 1, 'dashboard plus all module routers');
  for (const [, href, name] of registrations) {
    const item = menu.find(item => item.href === href);
    assert.ok(item, `${href} is missing from the menu`);
    const router = requireServer(imports[name]);
    const list = router.stack.find(layer => layer.route?.path === '/' && layer.route.methods.get);
    assert.ok(list, `${href}: missing list route`);
    const middleware = [...router.stack.filter(layer => !layer.route).map(layer => layer.handle), ...list.route.stack.map(layer => layer.handle)];
    assert.ok(middleware.includes(guards.requireAuth), href);
    const restricted = middleware.includes(guards.requireSuperadmin);
    assert.ok(restricted || middleware.includes(guards.requireAdmin), href);
    for (const role of ['editor', 'superadmin', 'admin']) assert.equal(canSee(item, { role }), role !== 'editor' || !restricted, `${href}: ${role}`);
  }
  const dashboard = require('../routes/indexRoutes').stack.find(layer => layer.route?.path === '/admin/dashboard');
  assert.ok(dashboard.route.stack.some(layer => layer.handle === guards.requireAdmin));
});

test('menu groups, labels, routes and roles match SPEC section 5; profile remains in the account menu', () => {
  const spec = fs.readFileSync(path.join(__dirname, '../docs/SPEC.md'), 'utf8');
  const rows = [...spec.matchAll(/^\| ([^|]+) \| ([^|]+) \| `(\/[^`]+)` \| ([^|]+) \|/gm)];
  assert.equal(rows.length, 21);
  for (const [, group, label, href, role] of rows) {
    if (href === '/profile') {
      assert.match(fs.readFileSync(path.join(__dirname, '../views/admin/_ui/shell-account.ejs'), 'utf8'), /href="\/profile"/);
      continue;
    }
    const item = menu.find(item => item.href === href);
    assert.ok(item, href);
    assert.equal(item.label, label.trim());
    if (href !== '/admin/dashboard') assert.equal(item.group, group.trim());
    assert.equal(canSee(item, { role: 'editor' }), role.trim() === 'semua');
  }
});

test('moduleSearch filters permitted links, enters the first result, handles no results and respects typing/dialogs', () => {
  let init; const components = {}, assigned = [];
  let dialogOpen = false;
  const document = { addEventListener(name, fn) { if (name === 'alpine:init') init = fn; }, querySelector: () => dialogOpen ? {} : null };
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/js/admin.js'), 'utf8'), {
    document, window: { Alpine: { data: (name, factory) => { components[name] = factory; } }, addEventListener() {} }, location: { assign: href => assigned.push(href) },
  });
  init();
  const options = [{ dataset: { label: 'Berita' }, href: '/admin/news' }, { dataset: { label: 'Buku Wisuda' }, href: '/admin/graduation-books' }];
  const search = components.moduleSearch();
  let focus = 0;
  search.$root = { querySelectorAll: () => options, contains: el => el === 'inside' };
  search.$refs = { input: { value: 'BERI', focus() { focus++; } }, trigger: { offsetParent: {}, focus() { focus++; } } };
  search.$nextTick = fn => fn();
  search.search(); assert.equal(search.count, 1); search.go(); assert.deepEqual(assigned, ['/admin/news']);
  search.$refs.input.value = 'tidak ada'; search.search(); assert.equal(search.noResults, true); search.go(); assert.equal(assigned.length, 1);
  search.close({ type: 'keydown' }); assert.equal(search.open, false); assert.equal(focus, 1);
  let prevented = 0;
  const key = typing => ({ key: '/', target: { closest: () => typing }, preventDefault() { prevented++; } });
  search.shortcut(key(true)); assert.equal(prevented, 0);
  dialogOpen = true; search.shortcut(key(false)); assert.equal(prevented, 0);
  dialogOpen = false; search.shortcut(key(false)); assert.equal(prevented, 1); assert.equal(focus, 2);
  search.focusout({ relatedTarget: 'inside' }); assert.equal(search.open, true);
  search.focusout({ relatedTarget: null }); assert.equal(search.open, false);
});
