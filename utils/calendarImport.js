// Calendar import from CSV saved by Excel (SRS FR-M-03, K-04).
// Indonesian-locale Excel writes ';' as separator and dates as DD/MM/YYYY,
// so both separators and both date styles are accepted.
const { SEMESTER } = require('./calendar');

const TEMPLATE_HEADER = ['semester', 'kegiatan', 'mulai', 'selesai'];
const TEMPLATE_EXAMPLE = [
  ['genap', 'Ujian Akhir Semester (UAS)', '29/06/2026', '10/07/2026'],
  ['genap', 'Batas Akhir Pengumuman Nilai Semester Genap', '17/07/2026', ''],
];

// One CSV line → cells, honouring "quoted; cells" and "" escapes.
const splitLine = (line, sep) => {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { cells.push(cell); cell = ''; }
    else cell += ch;
  }
  cells.push(cell);
  return cells.map(c => c.trim());
};

const detectSeparator = headerLine => {
  const count = ch => headerLine.split(ch).length - 1;
  return count(';') > count(',') ? ';' : ',';
};

// '29/06/2026', '29-06-2026', '2026-06-29' → Date at 00:00 WIB.
const parseTanggal = value => {
  const text = String(value || '').trim();
  if (!text) return null;
  let y; let m; let d;
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) [, y, m, d] = match;
  else if ((match = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) [, d, m, y] = match;
  else return undefined;
  const date = new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  // Reject 31/02/2026 and friends, which Date would roll over.
  const check = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
  return check === `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` ? date : undefined;
};

const SEMESTER_ALIASES = {
  ganjil: 'ganjil', 'semester ganjil': 'ganjil', gasal: 'ganjil',
  genap: 'genap', 'semester genap': 'genap',
  pendek: 'pendek', 'semester pendek': 'pendek', sp: 'pendek', antara: 'pendek',
};

// → { events: [{ semester, nama, mulai, selesai, urutan }], errors: ['Baris 3: ...'] }
// Nothing is saved when errors is non-empty; the admin fixes the file first.
const parseCalendarCsv = text => {
  const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) return { events: [], errors: ['File kosong.'] };

  const sep = detectSeparator(lines[0]);
  const header = splitLine(lines[0], sep).map(h => h.toLowerCase());
  const col = Object.fromEntries(TEMPLATE_HEADER.map(name => [name, header.indexOf(name)]));
  const missing = ['semester', 'kegiatan', 'mulai'].filter(name => col[name] === -1);
  if (missing.length) {
    return { events: [], errors: [`Kolom wajib tidak ditemukan: ${missing.join(', ')}. Gunakan template: ${TEMPLATE_HEADER.join(sep)}`] };
  }

  const events = [];
  const errors = [];
  lines.slice(1).forEach((line, i) => {
    const row = i + 2;
    const cells = splitLine(line, sep);
    const semester = SEMESTER_ALIASES[(cells[col.semester] || '').toLowerCase()];
    const nama = cells[col.kegiatan] || '';
    const mulai = parseTanggal(cells[col.mulai]);
    const selesai = col.selesai === -1 ? null : parseTanggal(cells[col.selesai]);
    const problems = [];
    if (!semester) problems.push(`semester "${cells[col.semester] || ''}" tidak dikenal (pakai: ${SEMESTER.map(s => s.value).join(', ')})`);
    if (!nama) problems.push('nama kegiatan kosong');
    if (nama.length > 200) problems.push('nama kegiatan lebih dari 200 karakter');
    if (!mulai) problems.push(`tanggal mulai "${cells[col.mulai] || ''}" tidak valid (contoh: 29/06/2026)`);
    if (selesai === undefined) problems.push(`tanggal selesai "${cells[col.selesai]}" tidak valid`);
    if (mulai && selesai && selesai < mulai) problems.push('tanggal selesai sebelum tanggal mulai');
    if (problems.length) errors.push(`Baris ${row}: ${problems.join('; ')}.`);
    else events.push({ semester, nama, mulai, selesai: selesai || null, urutan: events.length + 1 });
  });
  return { events, errors };
};

// Template the admin downloads; ';' so it opens in columns in Indonesian Excel.
const templateCsv = () =>
  `﻿${[TEMPLATE_HEADER, ...TEMPLATE_EXAMPLE].map(r => r.map(c => (/[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(';')).join('\r\n')}\r\n`;

module.exports = { parseCalendarCsv, parseTanggal, templateCsv, TEMPLATE_HEADER };
