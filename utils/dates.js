// Calendar-day arithmetic in WIB. Statuses (akreditasi, kalender) change at
// midnight Jakarta time, not at midnight UTC.
const TIME_ZONE = 'Asia/Jakarta';

// 'YYYY-MM-DD' of the given instant, as seen in Jakarta.
const dayKey = value => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

// Whole days from `from` to `to` (both taken as Jakarta calendar days).
const daysBetween = (from, to) => {
  const a = dayKey(from);
  const b = dayKey(to);
  if (!a || !b) return null;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
};

module.exports = { TIME_ZONE, dayKey, daysBetween };
