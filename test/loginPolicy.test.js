const test = require('node:test');
const assert = require('node:assert/strict');

process.env.RECAPTCHA_SITE_KEY = 'test-site-key';
process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
process.env.JWT_SECRET = 'test-only-login-policy-secret';
const controller = require('../controllers/authController');
const attempts = require('../utils/loginAttempts');
const User = require('../models/User');

const response = () => ({
  locals: {}, headers: {}, code: 200,
  status(code) { this.code = code; return this; },
  set(name, value) { this.headers[name] = value; return this; },
  render(view, data) { this.view = view; this.data = data; return this; },
  cookie() { return this; },
  redirect(url) { this.redirected = url; return this; },
});

test('2 failed logins show CAPTCHA; failed/missing CAPTCHA counts toward a 10-failure block', async t => {
  const req = { ip: 'login-policy-block', body: { email: 'preview@example.test', password: 'wrong-test-password' } };
  const lookup = t.mock.method(User, 'findOne', async () => ({ comparePassword: async () => false }));
  const verify = t.mock.method(globalThis, 'fetch', async () => ({ json: async () => ({ success: false }) }));
  let res;
  for (let i = 1; i <= 10; i += 1) {
    if (i === 3) req.body['g-recaptcha-response'] = 'invalid-test-token';
    if (i === 4) delete req.body['g-recaptcha-response'];
    res = response();
    await controller.login(req, res);
    assert.equal(res.code, i === 10 ? 429 : 400);
    if (i < 10) assert.equal(res.data.requireCaptcha, i >= 2);
  }
  assert.equal(lookup.mock.callCount(), 2);
  assert.equal(verify.mock.callCount(), 1);
  assert.equal(res.data.loginBlocked, true);
  assert.ok(Number(res.headers['Retry-After']) >= 3590);
  assert.equal(res.data.requireCaptcha, false);
  await controller.login(req, response());
  assert.equal(lookup.mock.callCount(), 2);
  assert.equal(verify.mock.callCount(), 1);
  const reload = response();
  controller.getLogin({ ip: req.ip }, reload);
  assert.equal(reload.code, 429);
  assert.equal(reload.data.loginBlocked, true);
});

test('successful active-account login resets earlier failures', async t => {
  const req = { ip: 'login-policy-success', body: { email: 'success@example.test', password: 'correct-test-password' }, headers: {} };
  const user = { _id: '507f1f77bcf86cd799439011', email: req.body.email, role: 'editor', isActive: true, comparePassword: async () => true };
  t.mock.method(User, 'findOne', async () => user);
  const update = t.mock.method(User, 'updateOne', async () => ({}));
  attempts.recordFailure({ ip: req.ip, email: req.body.email });
  const res = response();
  await controller.login(req, res);
  assert.equal(res.redirected, '/admin/dashboard');
  assert.equal(update.mock.callCount(), 1);
  attempts.recordFailure({ ip: req.ip, email: req.body.email });
  assert.equal(attempts.captchaRequired({ ip: req.ip, email: req.body.email }), false);
});

test('valid CAPTCHA never resets the wrong-password count', async t => {
  const req = { ip: 'login-policy-valid-captcha', body: { email: 'captcha@example.test', password: 'wrong-test-password' } };
  const lookup = t.mock.method(User, 'findOne', async () => ({ comparePassword: async () => false }));
  const verify = t.mock.method(globalThis, 'fetch', async () => ({ json: async () => ({ success: true }) }));
  for (let i = 1; i <= 10; i += 1) {
    req.body['g-recaptcha-response'] = `test-token-${i}`;
    const res = response();
    await controller.login(req, res);
    assert.equal(res.code, i === 10 ? 429 : 400);
  }
  assert.equal(lookup.mock.callCount(), 10);
  assert.equal(verify.mock.callCount(), 8);
});

test('an inactive account with the right password still counts as a failed login', async t => {
  const req = { ip: 'login-policy-inactive', body: { email: 'inactive@example.test', password: 'correct-test-password' } };
  const who = { ip: req.ip, email: req.body.email };
  t.mock.method(User, 'findOne', async () => ({ isActive: false, comparePassword: async () => true }));
  attempts.recordFailure(who);
  const res = response();
  await controller.login(req, res);
  assert.equal(res.code, 400);
  assert.equal(res.data.requireCaptcha, true);
});

test('a request that becomes blocked during password verification cannot start a session', async t => {
  const req = { ip: 'login-policy-concurrent', body: { email: 'concurrent@example.test', password: 'correct-test-password' }, headers: {} };
  const who = { ip: req.ip, email: req.body.email };
  t.mock.method(User, 'findOne', async () => ({
    comparePassword: async () => {
      for (let i = 0; i < 10; i += 1) attempts.recordFailure(who);
      return true;
    },
  }));
  const update = t.mock.method(User, 'updateOne', async () => ({}));
  const res = response();
  await controller.login(req, res);
  assert.equal(res.code, 429);
  assert.equal(update.mock.callCount(), 0);
  assert.equal(res.redirected, undefined);
});

test('fresh login page and another account are unaffected by CAPTCHA failures on a shared IP', async t => {
  const ip = 'login-shared-ip';
  for (let i = 0; i < 2; i += 1) attempts.recordFailure({ ip, email: 'different@example.test' });
  const page = response();
  controller.getLogin({ ip }, page);
  assert.equal(page.code, 200);
  assert.equal(page.data.requireCaptcha, false);
  const lookup = t.mock.method(User, 'findOne', async () => ({ comparePassword: async () => false }));
  const post = response();
  await controller.login({ ip, body: { email: 'first-try@example.test', password: 'wrong-test-password' } }, post);
  assert.equal(lookup.mock.callCount(), 1);
  assert.equal(post.data.requireCaptcha, false);
});

test('reloading a clean form cannot bypass CAPTCHA enforcement for a previously failed email', async t => {
  const who = { ip: 'login-reload', email: 'reload@example.test' };
  for (let i = 0; i < 2; i += 1) attempts.recordFailure(who);
  const page = response();
  controller.getLogin({ ip: who.ip }, page);
  assert.equal(page.data.requireCaptcha, false);
  const lookup = t.mock.method(User, 'findOne', async () => null);
  const post = response();
  await controller.login({ ip: who.ip, body: { email: who.email, password: 'test-password' } }, post);
  assert.equal(post.data.requireCaptcha, true);
  assert.equal(lookup.mock.callCount(), 0);
});
