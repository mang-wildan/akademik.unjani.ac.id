// Accreditation rules (SRS FR-A-01..03, K-06).
const { daysBetween } = require('./dates');

// Shown exactly as on the certificate (K-06): new BAN-PT/LAM scale and the
// older letter scale. Order = display order, best first within each scale.
const PERINGKAT = ['Unggul', 'Baik Sekali', 'Baik', 'A', 'B', 'C'];

const JENIS = { INSTITUSI: 'institusi', PRODI: 'prodi', LAINNYA: 'lainnya' };

const SOON_DAYS = 90;

const STATUSES = {
  berlaku: { key: 'berlaku', label: 'Berlaku', tone: 'success' },
  segera: { key: 'segera-berakhir', label: 'Segera berakhir', tone: 'warning' },
  kedaluwarsa: { key: 'kedaluwarsa', label: 'Kedaluwarsa', tone: 'danger' },
  tidakDiketahui: { key: 'tidak-diketahui', label: 'Tanggal belum diisi', tone: 'neutral' },
};

// Status is never stored: it follows from berlakuSampai and today's date (WIB).
// The certificate is still valid on its last day.
const accreditationStatus = (berlakuSampai, now = new Date()) => {
  const sisaHari = berlakuSampai ? daysBetween(now, berlakuSampai) : null;
  if (sisaHari === null) return { ...STATUSES.tidakDiketahui, sisaHari: null };
  if (sisaHari < 0) return { ...STATUSES.kedaluwarsa, sisaHari };
  if (sisaHari <= SOON_DAYS) return { ...STATUSES.segera, sisaHari };
  return { ...STATUSES.berlaku, sisaHari };
};

// Free-text grade from the old form → one of PERINGKAT, or null if unclear.
const normalizePeringkat = value => {
  const text = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!text) return null;
  return PERINGKAT.find(p => p.toLowerCase() === text) || null;
};

const peringkatRank = value => {
  const i = PERINGKAT.indexOf(value);
  return i === -1 ? PERINGKAT.length : i;
};

module.exports = { PERINGKAT, JENIS, SOON_DAYS, accreditationStatus, normalizePeringkat, peringkatRank };
