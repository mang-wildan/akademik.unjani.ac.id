const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const load = (files, dataset = {}) => {
  const components = {}, listeners = [], cookies = [], timers = [];
  const document = {
    documentElement: { dataset },
    addEventListener(name, handler) { if (name === 'alpine:init') listeners.push(handler); },
    set cookie(value) { cookies.push(value); },
    querySelector() { return null; },
  };
  const window = {
    Alpine: { data(name, factory) {
      assert.equal(components[name], undefined, `duplicate component: ${name}`);
      components[name] = factory;
    } },
    addEventListener() {}, location: { search: '' },
  };
  const context = vm.createContext({ document, window, Event, setTimeout: fn => timers.push(fn) });
  for (const file of files) vm.runInContext(fs.readFileSync(require.resolve(`../public/js/${file}.js`), 'utf8'), context);
  listeners.forEach(handler => handler());
  return { components, document, cookies, timers };
};

test('adminShell reads server preferences and persists sidebar and validated themes', () => {
  const { components, document, cookies } = load(['admin'], { theme: 'dark', sidebar: 'collapsed' });
  const shell = components.adminShell();
  shell.init();
  assert.equal(shell.theme, 'dark');
  assert.equal(shell.sidebar, 'collapsed');
  for (const sidebar of ['open', 'collapsed']) {
    shell.toggleSidebar();
    assert.equal(shell.sidebar, sidebar);
    assert.equal(document.documentElement.dataset.sidebar, sidebar);
    // /profile memakai layout admin juga: cookie ditulis per path, bukan Path=/ (cookie lama Path=/admin akan menang).
    assert.deepEqual(cookies.slice(-2), ['/admin', '/profile'].map(p => `admin_sidebar=${sidebar}; Path=${p}; Max-Age=31536000; SameSite=Lax`));
  }
  for (const theme of ['light', 'dark', 'system']) {
    shell.setTheme({ currentTarget: { dataset: { theme } } });
    assert.equal(shell.theme, theme);
    assert.equal(document.documentElement.dataset.theme, theme);
    assert.deepEqual(cookies.slice(-2), ['/admin', '/profile'].map(p => `admin_theme=${theme}; Path=${p}; Max-Age=31536000; SameSite=Lax`));
  }
  const count = cookies.length;
  for (const theme of [undefined, 'DARK', 'dark; Path=/', ['light']]) {
    shell.setTheme({ currentTarget: { dataset: { theme } } });
  }
  assert.equal(cookies.length, count);
  assert.equal(shell.theme, 'system');
  assert.equal(document.documentElement.dataset.theme, 'system');
});

test('adminShell defaults and mobile drawer use a native modal dialog', () => {
  const { components } = load(['admin']);
  const shell = components.adminShell();
  shell.init();
  assert.equal(shell.theme, 'system');
  assert.equal(shell.sidebar, 'open');
  let opened = 0, closed = 0;
  shell.$refs = { drawer: { showModal() { opened += 1; }, close() { closed += 1; } } };
  shell.openDrawer();
  shell.closeDrawer();
  assert.equal(opened, 1);
  assert.equal(closed, 1);
});

test('adminShell exposes state getters for CSP-safe bindings', () => {
  const { components } = load(['admin'], { theme: 'dark', sidebar: 'open' });
  const shell = components.adminShell();
  shell.init();
  assert.deepEqual([shell.themeLight, shell.themeDark, shell.themeSystem], [false, true, false]);
  assert.equal(shell.sidebarExpanded, true);
  assert.equal(shell.sidebarToggleLabel, 'Ciutkan sidebar');
  shell.toggleSidebar();
  assert.equal(shell.sidebarExpanded, false);
  assert.equal(shell.sidebarToggleLabel, 'Lebarkan sidebar');
});

test('adminShell closes the drawer only when its backdrop is clicked', () => {
  const { components } = load(['admin']);
  const shell = components.adminShell();
  let closed = 0;
  const drawer = { close() { closed += 1; } };
  shell.$refs = { drawer };
  shell.drawerBackdrop({ target: {} });
  assert.equal(closed, 0);
  shell.drawerBackdrop({ target: drawer });
  assert.equal(closed, 1);
});

test('shared components register once with either app or admin and preserve behaviour', () => {
  for (const entry of ['app', 'admin']) {
    const { components, timers } = load(['shared', entry]);
    for (const name of ['disclosure', 'richtext', 'toast']) assert.equal(typeof components[name], 'function');
    const disclosure = components.disclosure();
    let focused = 0;
    disclosure.$refs = { trigger: { focus() { focused += 1; } } };
    disclosure.toggle();
    assert.equal(disclosure.open, true);
    disclosure.escapeIfOpen({ stopPropagation() {} });
    assert.equal(disclosure.open, false);
    assert.equal(focused, 1);
    const richtext = components.richtext();
    let input;
    richtext.$refs = { editor: {}, hidden: { tagName: entry === 'admin' ? 'TEXTAREA' : 'INPUT', value: '<p>Existing text</p>', dispatchEvent(event) { input = event; } } };
    richtext.init();
    assert.equal(richtext.$refs.editor.innerHTML, '<p>Existing text</p>');
    assert.equal(Boolean(richtext.$refs.hidden.hidden), entry === 'admin');
    richtext.$refs.editor.innerHTML = '<p>Edited text</p>';
    richtext.sync();
    assert.equal(richtext.$refs.hidden.value, '<p>Edited text</p>');
    assert.equal(input.type, 'input');
    assert.equal(input.bubbles, true);
    const toast = components.toast();
    toast.init();
    assert.equal(toast.visible, true);
    timers.at(-1)();
    assert.equal(toast.visible, false);
  }
});

test('every page that boots Alpine loads versioned shared components before its bundle and Alpine', () => {
  // auth/login adalah halaman mandiri (tanpa layout) yang memakai disclosure dari shared.js.
  for (const [view, bundle] of [['layouts/public', 'app'], ['layouts/admin-v2', 'admin'], ['auth/login', 'app']]) {
    const source = fs.readFileSync(require.resolve(`../views/${view}.ejs`), 'utf8');
    const shared = source.indexOf("assetUrl('/js/shared.js')");
    const app = source.indexOf(`assetUrl('/js/${bundle}.js')`);
    assert.ok(shared >= 0 && shared < app && app < source.indexOf('/js/vendor/alpine-csp.min.js'), view);
  }
});

test('admin preferences middleware serves every admin-v2 area, including /profile', () => {
  const server = fs.readFileSync(require.resolve('../server.js'), 'utf8');
  assert.ok(server.includes("app.use(['/admin', '/profile'], adminPrefs);"));
});
