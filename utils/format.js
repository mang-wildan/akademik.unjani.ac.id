// Indonesian date & number formatting for views (NFR-C-02). Dates are shown in
// WIB regardless of the server's timezone.
const TIME_ZONE = 'Asia/Jakarta';

const toDate = value => {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parts = (date, options) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('id-ID', { timeZone: TIME_ZONE, ...options })
      .formatToParts(date)
      .map(p => [p.type, p.value])
  );

// "3 Feb 2026" (default) or "3 Februari 2026" with { long: true }.
exports.formatTanggal = (value, { long = false } = {}) => {
  const date = toDate(value);
  if (!date) return '-';
  const p = parts(date, { day: 'numeric', month: long ? 'long' : 'short', year: 'numeric' });
  return `${p.day} ${p.month} ${p.year}`;
};

// "29 Jun – 10 Jul 2026", "13–17 Jul 2026", "28 Agu 2026" (single day).
exports.formatRentangTanggal = (start, end) => {
  const a = toDate(start);
  const b = toDate(end);
  if (!a) return '-';
  const pa = parts(a, { day: 'numeric', month: 'short', year: 'numeric' });
  if (!b) return `${pa.day} ${pa.month} ${pa.year}`;
  const pb = parts(b, { day: 'numeric', month: 'short', year: 'numeric' });
  if (pa.year !== pb.year) return `${pa.day} ${pa.month} ${pa.year} – ${pb.day} ${pb.month} ${pb.year}`;
  if (pa.month !== pb.month) return `${pa.day} ${pa.month} – ${pb.day} ${pb.month} ${pb.year}`;
  if (pa.day !== pb.day) return `${pa.day}–${pb.day} ${pb.month} ${pb.year}`;
  return `${pa.day} ${pa.month} ${pa.year}`;
};

// { day: '29', month: 'JUN', year: '2026' } for the date block component.
exports.tanggalBlok = value => {
  const date = toDate(value);
  if (!date) return null;
  const p = parts(date, { day: 'numeric', month: 'short', year: 'numeric' });
  return { day: p.day, month: p.month.toUpperCase(), year: p.year, iso: date.toISOString() };
};

// Situs publik (mockup v0.0.1): tanggal mono ringkas dan rentang bertanda hubung, tanpa en dash.
// "06 NOV 2026", atau "06 NOV" dengan { tahun: false }.
exports.tanggalRingkas = (value, { tahun = true } = {}) => {
  const block = exports.tanggalBlok(value);
  if (!block) return '-';
  return `${String(block.day).padStart(2, '0')} ${block.month}${tahun ? ` ${block.year}` : ''}`;
};

// "2 - 18 Nov 2026": formatRentangTanggal dengan tanda hubung berspasi.
exports.rentangTanggal = (start, end) => exports.formatRentangTanggal(start, end).replace(/\s*–\s*/g, ' - ');

// "18 - 29 AGU", "14 SEP - 2 OKT", "01 SEP": rentang tanpa tahun untuk tabel kalender.
exports.rentangRingkas = (start, end) => {
  const a = exports.tanggalBlok(start);
  if (!a) return '-';
  const b = exports.tanggalBlok(end);
  const pad = day => String(day).padStart(2, '0');
  if (!b || (a.day === b.day && a.month === b.month && a.year === b.year)) return `${pad(a.day)} ${a.month}`;
  if (a.month === b.month && a.year === b.year) return `${pad(a.day)} - ${pad(b.day)} ${a.month}`;
  return `${pad(a.day)} ${a.month} - ${pad(b.day)} ${b.month}`;
};

// "11.769"
exports.formatAngka = value => {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('id-ID').format(number) : '-';
};

// "245 KB", "1,3 MB"
exports.formatUkuranFile = bytes => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return '-';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(size / (1024 * 1024))} MB`;
};
