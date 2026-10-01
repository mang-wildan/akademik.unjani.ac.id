// Academic calendar rules (SRS FR-K-01..03, K-04).
const { daysBetween } = require('./dates');

const SEMESTER = [
  { value: 'ganjil', label: 'Semester Ganjil' },
  { value: 'genap', label: 'Semester Genap' },
  { value: 'pendek', label: 'Semester Pendek' },
];

const STATUSES = {
  selesai: { key: 'selesai', label: 'Selesai', tone: 'neutral' },
  berlangsung: { key: 'berlangsung', label: 'Berlangsung', tone: 'success' },
  akanDatang: { key: 'akan-datang', label: 'Akan datang', tone: 'warning' },
};

// A one-day event has no `selesai`; both ends count as part of the event.
const calendarEventStatus = (mulai, selesai, now = new Date()) => {
  const end = selesai || mulai;
  if (daysBetween(now, mulai) > 0) return STATUSES.akanDatang;
  if (daysBetween(now, end) < 0) return STATUSES.selesai;
  return STATUSES.berlangsung;
};

const byStart = (a, b) => new Date(a.mulai) - new Date(b.mulai) || (a.urutan || 0) - (b.urutan || 0);

// Running events, and the next one(s) to start, for the cards above the table.
const currentAndNext = (events, now = new Date(), nextCount = 1) => {
  const sorted = [...(events || [])].filter(e => e && e.mulai).sort(byStart);
  const withStatus = sorted.map(e => ({ ...e, status: calendarEventStatus(e.mulai, e.selesai, now) }));
  return {
    berlangsung: withStatus.filter(e => e.status.key === 'berlangsung'),
    berikutnya: withStatus.filter(e => e.status.key === 'akan-datang').slice(0, nextCount),
  };
};

module.exports = { SEMESTER, calendarEventStatus, currentAndNext, byStart };
