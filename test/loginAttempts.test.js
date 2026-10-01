const test = require('node:test');
const assert = require('node:assert/strict');
const loginAttempts = require('../utils/loginAttempts');

const T0 = 1_000_000;
let n = 0;
// Fresh IP/email per test: the tracker is module-level state.
const fresh = () => {
  n += 1;
  return { ip: `10.0.0.${n}`, email: `user${n}@unjani.ac.id` };
};

test('no captcha before 3 failures', () => {
  const who = fresh();
  assert.equal(loginAttempts.captchaRequired(who, T0), false);
  loginAttempts.recordFailure(who, T0);
  loginAttempts.recordFailure(who, T0);
  assert.equal(loginAttempts.captchaRequired(who, T0), false);
});

test('captcha required from the 3rd failure on', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure(who, T0);
  assert.equal(loginAttempts.captchaRequired(who, T0), true);
});

test('counting is per email: other IPs trying the same account still hit captcha', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure({ ip: `192.168.1.${i}`, email: who.email }, T0);
  assert.equal(loginAttempts.captchaRequired({ ip: '172.16.0.1', email: who.email }, T0), true);
});

test('counting is per IP: cycling emails from one IP still hits captcha', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure({ ip: who.ip, email: `x${i}@unjani.ac.id` }, T0);
  assert.equal(loginAttempts.captchaRequired({ ip: who.ip }, T0), true);
});

test('failures expire after the window', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure(who, T0);
  assert.equal(loginAttempts.captchaRequired(who, T0 + loginAttempts.WINDOW_MS + 1), false);
});

test('successful login resets the counters', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure(who, T0);
  loginAttempts.reset(who);
  assert.equal(loginAttempts.captchaRequired(who, T0), false);
});
