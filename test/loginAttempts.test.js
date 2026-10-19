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

test('no captcha before 2 failures', () => {
  const who = fresh();
  assert.equal(loginAttempts.captchaRequired(who, T0), false);
  loginAttempts.recordFailure(who, T0);
  assert.equal(loginAttempts.captchaRequired(who, T0), false);
});

test('captcha required from the 2nd failure on', () => {
  const who = fresh();
  for (let i = 0; i < 2; i += 1) loginAttempts.recordFailure(who, T0);
  assert.equal(loginAttempts.captchaRequired(who, T0), true);
});

test('the 10th failure blocks both IP and email for one hour from that failure', () => {
  const who = fresh();
  for (let i = 0; i < 9; i += 1) loginAttempts.recordFailure(who, T0);
  assert.equal(loginAttempts.retryAfter(who, T0), 0);
  const blockedAt = T0 + 5 * 60 * 1000;
  loginAttempts.recordFailure(who, blockedAt);
  assert.equal(loginAttempts.retryAfter({ ip: who.ip }, blockedAt), 3600);
  assert.equal(loginAttempts.retryAfter({ email: who.email }, blockedAt), 3600);
  assert.equal(loginAttempts.retryAfter(who, blockedAt + loginAttempts.WINDOW_MS), 2700);
  assert.equal(loginAttempts.retryAfter(who, blockedAt + loginAttempts.BLOCK_MS - 1), 1);
  assert.equal(loginAttempts.retryAfter(who, blockedAt + loginAttempts.BLOCK_MS), 0);
  assert.equal(loginAttempts.captchaRequired(who, blockedAt + loginAttempts.BLOCK_MS), false);
});

test('rejected requests during a block do not extend its expiry or clear it', () => {
  const who = fresh();
  for (let i = 0; i < 10; i += 1) loginAttempts.recordFailure(who, T0);
  loginAttempts.recordFailure(who, T0 + 1000);
  loginAttempts.reset(who, T0 + 1000);
  assert.equal(loginAttempts.retryAfter(who, T0 + 1000), 3599);
});

test('counting is per email: other IPs trying the same account still hit captcha', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure({ ip: `192.168.1.${i}`, email: who.email }, T0);
  assert.equal(loginAttempts.captchaRequired({ ip: '172.16.0.1', email: who.email }, T0), true);
});

test('shared IP failures do not show CAPTCHA for a different email', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure({ ip: who.ip, email: `x${i}@unjani.ac.id` }, T0);
  assert.equal(loginAttempts.captchaRequired({ ip: who.ip }, T0), false);
  assert.equal(loginAttempts.captchaRequired(who, T0), false);
  for (let i = 3; i < 10; i += 1) loginAttempts.recordFailure({ ip: who.ip, email: `other${i}@unjani.ac.id` }, T0);
  assert.equal(loginAttempts.retryAfter({ ip: who.ip }, T0), 3600);
});

test('failures expire after the window', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure(who, T0);
  assert.equal(loginAttempts.captchaRequired(who, T0 + loginAttempts.WINDOW_MS + 1), false);
});

test('successful login resets the counters', () => {
  const who = fresh();
  for (let i = 0; i < 3; i += 1) loginAttempts.recordFailure(who, T0);
  loginAttempts.reset(who, T0);
  assert.equal(loginAttempts.captchaRequired(who, T0), false);
});
