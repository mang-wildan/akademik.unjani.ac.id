// Pembatas pemakaian Asisten Akademik. Kuota gratis Gemini kecil, jadi tanpa
// pembatas satu skrip saja bisa menghabiskannya dan mematikan asisten untuk
// semua orang. Dua lapis: per IP (jendela geser) dan total seluruh situs per
// hari (hari WIB). Disimpan di memori proses, seperti loginAttempts: hitungan
// kembali nol saat restart dan tidak dibagi antar proses (satu instance pm2).
const { dayKey } = require('./dates');

const MAX_TRACKED_IPS = 5000;

const createLimiter = ({ ipMax = 10, ipWindowMs = 60 * 60 * 1000, dailyMax = 150 } = {}) => {
  const hits = new Map(); // ip -> [timestamp, ...]
  let day = null;
  let dayCount = 0;

  const recent = (ip, now) => {
    const list = (hits.get(ip) || []).filter(t => now - t < ipWindowMs);
    if (list.length) hits.set(ip, list);
    else hits.delete(ip);
    return list;
  };

  const prune = now => {
    for (const ip of hits.keys()) recent(ip, now);
    for (const ip of hits.keys()) {
      if (hits.size < MAX_TRACKED_IPS) break;
      hits.delete(ip); // Map menjaga urutan sisip: buang yang tertua
    }
  };

  // Mengonsumsi satu jatah bila lolos. Jatah tidak terpakai bila salah satu batas penuh.
  const take = (ip, now = Date.now()) => {
    const today = dayKey(now);
    if (today !== day) {
      day = today;
      dayCount = 0;
    }
    if (dayCount >= dailyMax) return { ok: false, reason: 'daily' };
    const key = String(ip || 'unknown');
    if (hits.size >= MAX_TRACKED_IPS) prune(now);
    const list = recent(key, now);
    if (list.length >= ipMax) {
      return { ok: false, reason: 'ip', retryAfterSec: Math.max(1, Math.ceil((list[0] + ipWindowMs - now) / 1000)) };
    }
    list.push(now);
    hits.set(key, list);
    dayCount += 1;
    return { ok: true };
  };

  return { take };
};

const intFromEnv = (name, fallback) => {
  const n = Number.parseInt(process.env[name], 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

module.exports = { createLimiter, intFromEnv };
