const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture, id } = require('./helpers/adminContentFixture');
const user = (n, extra = {}) => ({ _id: id(n), name: `Akun (${n})`, email: `akun${n}@example.org`, role: 'editor', isActive: true, password: 'HASH-PRIVATE', ...extra });
const setup = async (t, docs = [], role = 'superadmin') => {
  const { app, Model } = fixture(t.mock, { basePath: 'users', docs, role });
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/admin/users`;
  return { Model, get: s => fetch(base + s), post: (s, body) => fetch(base + s, { method: 'POST', body: new URLSearchParams(body), redirect: 'manual' }) };
};
test('Users v2: literal search, typed status/role filters, pagination, CSP and escaped output', async t => {
  const { get, Model } = await setup(t, Array.from({ length: 26 }, (_, n) => user(n + 1, { name: `Akun (${String(n).padStart(2, '0')}) <uji>` })));
  const r = await get('?q=%28&role=editor&isActive=true&sort=name&dir=asc&page=2');
  assert.equal(r.status, 200, await r.clone().text()); assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  const html = await r.text(); assert.match(html, /Akun \(25\) &lt;uji&gt;/); assert.doesNotMatch(html, /HASH-PRIVATE|value="delete"/);
  const filter = Model.calls.at(-1)[1]; assert.equal(filter.isActive, true); assert.equal(filter.role, 'editor'); assert.equal(filter.$or[0].name.$regex, '\\(');
  const partial = await get('/new?partial=1'); assert.equal(partial.headers.get('cache-control'), 'no-store'); assert.doesNotMatch(await partial.text(), /<!DOCTYPE/);
});
test('User create/update supports partial JSON and full-page redirects, duplicate/invalid 422 without password echo', async t => {
  const { Model, get, post } = await setup(t, [user(1)]);
  let r = await post('?partial=1', { name: 'Baru', email: 'invalid', role: 'editor', password: 'DoNotEcho123!' });
  assert.equal(r.status, 422); assert.doesNotMatch(await r.text(), /DoNotEcho123!/);
  r = await post('', { name: 'Baru', email: ' AKUN1@example.org ', role: 'editor', password: 'Secret123!' }); assert.equal(r.status, 422);
  r = await post('?partial=1', { name: 'Baru', email: 'new@example.org', role: 'editor', password: 'Secret123!' }); assert.equal((await r.json()).ok, true);
  const item = Model.docs[1]; assert.equal(item.role, 'editor');
  r = await post(`/${item._id}?partial=1`, { name: 'Ubah', email: 'new@example.org', role: 'editor' }); assert.equal((await r.json()).ok, true); assert.equal(item.isActive, false);
  r = await post(`/${item._id}`, { name: 'Ubah', email: 'bad', role: 'editor' }); assert.equal(r.status, 422); assert.doesNotMatch(await r.text(), /value="on" checked/);
  r = await get(`/${item._id}/edit`); assert.equal(r.status, 200); assert.doesNotMatch(await r.text(), /Secret123!/);
  r = await post(`/${item._id}`, { name: 'Ubah', email: 'new@example.org', role: 'editor', isActive: 'on' }); assert.equal(r.status, 303); assert.equal(item.isActive, true);
});
test('Users bulk permits only deactivate; selected/filter scopes always exclude current account', async t => {
  const { Model, post } = await setup(t, [user(200, { role: 'superadmin' }), user(1, { role: 'superadmin' }), user(2)]);
  for (const action of ['delete', 'activate', 'reset-password']) {
    const r = await post('/bulk', { action, ids: id(1) }); assert.match(r.headers.get('location'), /error=/); assert.equal(Model.docs[1].isActive, true);
  }
  let r = await post('/bulk', { action: 'deactivate', 'ids[]': [id(200), id(1)].join(',') }); assert.match(r.headers.get('location'), /error=/);
  r = await post('/bulk', [['action', 'deactivate'], ['ids[]', id(200)], ['ids[]', id(1)]]);
  assert.equal(r.status, 303); assert.match(decodeURIComponent(r.headers.get('location')).replaceAll('+', ' '), /1 akun dinonaktifkan, 1 dilewati/);
  assert.equal(Model.docs[0].isActive, true); assert.equal(Model.docs[1].isActive, false);
  r = await post('/bulk', { action: 'deactivate', scope: 'filter', role: 'editor', isActive: 'true' }); assert.equal(r.status, 303); assert.equal(Model.docs[2].isActive, false);
  r = await post('/bulk', { action: 'deactivate', scope: 'filter' }); assert.equal(Model.docs[0].isActive, true); assert.equal(Model.docs.length, 3);
  r = await post('/bulk', { action: 'deactivate', ids: id(200) }); assert.match(r.headers.get('location'), /error=/);
});
test('Last Super Admin and self-delete remain protected; legacy admin is counted and editable', async t => {
  const self = user(200, { role: 'admin' }); const { Model, get, post } = await setup(t, [self, user(1)]);
  let r = await get(`/${self._id}/edit?partial=1`); assert.match(await r.text(), /value="superadmin" selected/);
  r = await post(`/${self._id}?partial=1`, { name: self.name, email: self.email, role: 'editor', isActive: 'on' }); assert.equal(r.status, 422); assert.equal(self.role, 'admin');
  r = await post(`/${self._id}/delete`, {}); assert.match(r.headers.get('location'), /error=/); assert.equal(Model.docs.length, 2);
  Model.docs.push(user(2, { role: 'admin' }));
  r = await post(`/${self._id}?partial=1`, { name: self.name, email: self.email, role: 'editor', isActive: 'on' }); assert.equal(r.status, 200); assert.equal(self.role, 'editor');
});
test('Reset password validates confirmation, never echoes secrets, and invokes save', async t => {
  const { Model, get, post } = await setup(t, [user(1)]);
  let r = await get(`/${id(1)}/reset-password`); assert.equal(r.status, 200); assert.doesNotMatch(await r.text(), /HASH-PRIVATE/);
  r = await post(`/${id(1)}/reset-password`, { newPassword: 'NewSecret123!', confirmPassword: 'mismatch' }); assert.equal(r.status, 422); assert.doesNotMatch(await r.text(), /NewSecret123!/); assert.equal(Model.docs[0].password, 'HASH-PRIVATE');
  r = await post(`/${id(1)}/reset-password`, { newPassword: 'NewSecret123!', confirmPassword: 'NewSecret123!' }); assert.equal(r.status, 303); assert.equal(Model.docs[0].password, 'NewSecret123!');
  assert.equal((await get(`/${id(999)}/edit`)).status, 404);
});
test('Editor is denied every account route including bulk and reset password', async t => {
  const { get, post } = await setup(t, [user(1)], 'editor');
  for (const p of ['', '/new', `/${id(1)}/edit`, `/${id(1)}/reset-password`]) assert.equal((await get(p)).status, 403);
  for (const p of ['', '/bulk', `/${id(1)}`, `/${id(1)}/delete`, `/${id(1)}/reset-password`]) assert.equal((await post(p, {})).status, 403);
});
test('Task 8: deactivate and reset are distinct confirmations on existing POST routes, no undo', async t => {
  const { get } = await setup(t, [user(200, { role: 'superadmin' }), user(1), user(2, { isActive: false })]);
  const html = await (await get('')).text();
  const dialog = html.match(/<dialog[^>]*id="nonaktif-[^"]+"[\s\S]*?<\/dialog>/)?.[0] || '';
  assert.match(dialog, /action="\/admin\/users\/bulk"/); assert.match(dialog, /name="action" value="deactivate"/); assert.match(dialog, new RegExp(`name="ids" value="${id(1)}"`));
  assert.match(dialog, /tidak bisa masuk/); assert.match(dialog, />\s*Nonaktifkan\s*</);
  assert.equal((html.match(/<dialog[^>]*id="nonaktif-/g) || []).length, 1, 'only active non-self accounts');
  assert.doesNotMatch(html, /Urungkan|Undo/i);
  const reset = await (await get(`/${id(1)}/reset-password`)).text();
  assert.match(reset, /Password lama langsung tidak berlaku/); assert.match(reset, /Atur Ulang Password/); assert.doesNotMatch(reset, /tidak bisa masuk|Urungkan|HASH-PRIVATE/);
  const filtered = (await (await get('?role=editor&isActive=true')).text()).match(/<dialog[^>]*id="nonaktif-[^"]+"[\s\S]*?<\/dialog>/)[0];
  assert.match(filtered, /name="role" value="editor"/); assert.match(filtered, /name="isActive" value="true"/);
});
test('Task 8: account form uses serif section panels for identity and access', async t => {
  const { get } = await setup(t, [user(1)]);
  for (const p of ['/new', `/${id(1)}/edit`]) {
    const html = await (await get(p)).text();
    for (const h of ['Identitas', 'Akses']) assert.match(html, new RegExp(`<section class="form-panel[^"]*">\\s*<h2 class="font-serif[^"]*">${h}</h2>`));
  }
});
test('Task 8: per-row deactivate fields deactivate only that account and return to the filtered list', async t => {
  const { Model, post } = await setup(t, [user(200, { role: 'superadmin' }), user(1), user(2)]);
  const r = await post('/bulk', { role: 'editor', action: 'deactivate', ids: id(1) });
  assert.equal(r.status, 303); assert.match(r.headers.get('location'), /role=editor/); assert.match(r.headers.get('location'), /success=/);
  assert.deepEqual(Model.docs.map(d => d.isActive), [true, false, true]);
});
