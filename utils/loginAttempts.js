// Tracks failed login attempts per IP and per email so reCAPTCHA is only
// required after repeated failures. Kept in memory: counts reset on restart and
// are not shared between processes (fine for a single Node instance).
const WINDOW_MS = 15 * 60 * 1000;
const CAPTCHA_AFTER_FAILURES = 3;
const MAX_TRACKED_KEYS = 10000;

const attempts = new Map(); // key -> { count, firstAt }

const keysFor = ({ ip, email }) => {
  const keys = [];
  if (ip) keys.push(`ip:${ip}`);
  if (email) keys.push(`email:${email}`);
  return keys;
};

const countFor = (key, now) => {
  const entry = attempts.get(key);
  if (!entry) return 0;
  if (now - entry.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return 0;
  }
  return entry.count;
};

// Drop expired entries; if a flood of distinct keys still fills the map,
// evict the oldest ones (Map keeps insertion order) so memory stays bounded.
const prune = now => {
  for (const [key, entry] of attempts) {
    if (now - entry.firstAt > WINDOW_MS) attempts.delete(key);
  }
  for (const key of attempts.keys()) {
    if (attempts.size < MAX_TRACKED_KEYS) break;
    attempts.delete(key);
  }
};

exports.captchaRequired = (who, now = Date.now()) =>
  keysFor(who).some(key => countFor(key, now) >= CAPTCHA_AFTER_FAILURES);

exports.recordFailure = (who, now = Date.now()) => {
  if (attempts.size >= MAX_TRACKED_KEYS) prune(now);
  for (const key of keysFor(who)) {
    if (countFor(key, now) === 0) {
      attempts.set(key, { count: 1, firstAt: now });
    } else {
      attempts.get(key).count += 1;
    }
  }
};

exports.reset = who => {
  for (const key of keysFor(who)) attempts.delete(key);
};

exports.CAPTCHA_AFTER_FAILURES = CAPTCHA_AFTER_FAILURES;
exports.WINDOW_MS = WINDOW_MS;
