const test = require('node:test');
const assert = require('node:assert/strict');
const adminPrefs = require('../middleware/adminPrefs');

const run = cookies => {
  const res = { locals: { existing: true } };
  let calls = 0;
  adminPrefs({ cookies }, res, () => { calls += 1; });
  assert.equal(calls, 1);
  assert.equal(res.locals.existing, true);
  return res.locals;
};

test('admin preferences accept every allowed theme and sidebar value', () => {
  for (const admin_theme of ['light', 'dark', 'system']) {
    for (const admin_sidebar of ['open', 'collapsed']) {
      const locals = run({ admin_theme, admin_sidebar });
      assert.equal(locals.adminTheme, admin_theme);
      assert.equal(locals.adminSidebar, admin_sidebar);
    }
  }
});

test('missing, malformed and untrusted cookie values use defaults independently', () => {
  for (const value of [undefined, '', 'DARK', '<script>', 'constructor', ['dark'], {}, true, 1]) {
    const locals = run({ admin_theme: value, admin_sidebar: value });
    assert.equal(locals.adminTheme, 'system');
    assert.equal(locals.adminSidebar, 'open');
  }
  assert.equal(run(undefined).adminTheme, 'system');
  assert.equal(run({}).adminSidebar, 'open');
  assert.equal(run({ admin_theme: 'dark', admin_sidebar: 'invalid' }).adminTheme, 'dark');
  assert.equal(run({ admin_theme: 'invalid', admin_sidebar: 'collapsed' }).adminSidebar, 'collapsed');
});
