const test = require('node:test');
const assert = require('node:assert/strict');
const { isStaff, isSuperadmin, roleLabel } = require('../utils/roles');
const { requireAdmin, requireSuperadmin } = require('../middleware/authMiddleware');
const { canSee, adminNav } = require('../utils/navigation');

test('role helpers: legacy admin counts as superadmin during the transition', () => {
  assert.equal(isStaff('admin'), true);
  assert.equal(isSuperadmin('admin'), true);
  assert.equal(isStaff('editor'), true);
  assert.equal(isSuperadmin('editor'), false);
  assert.equal(isStaff('user'), false);
  assert.equal(isStaff(undefined), false);
  assert.equal(roleLabel({ role: 'editor' }), 'Editor');
  assert.equal(roleLabel('superadmin'), 'Super Admin');
});

// Runs a middleware with a user already loaded (as server.js soft-auth does).
const run = (mw, user) =>
  new Promise(resolve => {
    const req = { user, headers: {}, cookies: {} };
    const res = { locals: {}, clearCookie() {}, redirect: to => resolve({ redirect: to }), status() { return this; }, json: body => resolve({ json: body }) };
    mw(req, res, err => resolve({ next: err || null }));
  });

test('requireAdmin lets superadmin and editor in, blocks inactive accounts', async () => {
  assert.deepEqual(await run(requireAdmin, { role: 'superadmin' }), { next: null });
  assert.deepEqual(await run(requireAdmin, { role: 'editor' }), { next: null });
  assert.deepEqual(await run(requireAdmin, { role: 'admin' }), { next: null });
  assert.deepEqual(await run(requireAdmin, { role: 'editor', isActive: false }), { redirect: '/login' });
  const outsider = await run(requireAdmin, { role: 'user' });
  assert.equal(outsider.next.status, 403);
});

test('requireSuperadmin blocks editors with a 403', async () => {
  assert.deepEqual(await run(requireSuperadmin, { role: 'superadmin' }), { next: null });
  const editor = await run(requireSuperadmin, { role: 'editor' });
  assert.equal(editor.next.status, 403);
  assert.equal(editor.next.expose, true);
});

test('admin sidebar hides superadmin-only items from editors', () => {
  const visible = role => adminNav.flatMap(g => g.items).filter(i => canSee(i, { role })).map(i => i.label);
  assert.ok(visible('superadmin').includes('Pengaturan Situs'));
  assert.ok(!visible('editor').includes('Pengaturan Situs'));
  assert.ok(visible('editor').includes('Kalender Akademik'));
});
