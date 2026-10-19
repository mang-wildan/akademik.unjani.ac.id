// shortcut: bounded process-local tracking resets on restart; use a shared persistent store for multiple workers or restart-safe bans.
const WINDOW_MS = 15 * 60 * 1000;
const CAPTCHA_AFTER_FAILURES = 2;
const BLOCK_AFTER_FAILURES = 10;
const BLOCK_MS = 60 * 60 * 1000;
const MAX_TRACKED_KEYS = 10000;

const attempts = new Map(); // key -> { count, firstAt, blockedUntil }

const keysFor = ({ ip, email }) => {
  const keys = [];
  if (ip) keys.push(`ip:${ip}`);
  if (email) keys.push(`email:${email}`);
  return keys;
};

const entryFor = (key, now) => {
  const entry = attempts.get(key);
  if (!entry) return undefined;
  if (entry.blockedUntil ? now >= entry.blockedUntil : now - entry.firstAt >= WINDOW_MS) {
    attempts.delete(key);
    return undefined;
  }
  return entry;
};

// Drop expired entries; if a flood of distinct keys still fills the map,
// evict the oldest ones (Map keeps insertion order) so memory stays bounded.
const prune = now => {
  for (const key of attempts.keys()) entryFor(key, now);
  // Prefer dropping failure history over an active block when the cache is full.
  for (const [key, entry] of attempts) {
    if (attempts.size < MAX_TRACKED_KEYS) return;
    if (!entry.blockedUntil) attempts.delete(key);
  }
  for (const key of attempts.keys()) {
    if (attempts.size < MAX_TRACKED_KEYS) break;
    attempts.delete(key);
  }
};

exports.captchaRequired = (who, now = Date.now()) =>
  Boolean(who.email && (entryFor(`email:${who.email}`, now)?.count || 0) >= CAPTCHA_AFTER_FAILURES);

exports.retryAfter = (who, now = Date.now()) =>
  Math.max(0, ...keysFor(who).map(key => Math.ceil(((entryFor(key, now)?.blockedUntil || 0) - now) / 1000)));

exports.recordFailure = (who, now = Date.now()) => {
  for (const key of keysFor(who)) {
    let entry = entryFor(key, now);
    if (entry?.blockedUntil) continue;
    if (!entry) {
      if (attempts.size >= MAX_TRACKED_KEYS) prune(now);
      entry = { count: 0, firstAt: now, blockedUntil: 0 };
      attempts.set(key, entry);
    }
    entry.count += 1;
    if (entry.count >= BLOCK_AFTER_FAILURES) entry.blockedUntil = now + BLOCK_MS;
  }
};

exports.reset = (who, now = Date.now()) => {
  for (const key of keysFor(who)) {
    if (!entryFor(key, now)?.blockedUntil) attempts.delete(key);
  }
};

exports.CAPTCHA_AFTER_FAILURES = CAPTCHA_AFTER_FAILURES;
exports.WINDOW_MS = WINDOW_MS;
exports.BLOCK_MS = BLOCK_MS;
