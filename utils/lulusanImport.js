// Impor Data Lulusan dari CSV (FR-M-08). Program studi dan fakultas dicocokkan
// dengan nama atau singkatan master data (tidak case-sensitive), bukan ObjectId
// mentah -- admin mengisi file dengan nama yang mereka kenal.
const TEMPLATE_HEADER = ['programStudi', 'fakultas', 'periode', 'tahun', 'jumlah'];

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

// → { rows: [{ prodiKey, fakultasKey, periode, tahun, jumlah, row }], errors: ['Baris 3: ...'] }
// Pencocokan ke master data (ProgramStudi/Faculty) dilakukan di kontroler,
// karena butuh akses database -- modul ini murni mem-parsing teks file.
const parseLulusanCsv = text => {
  const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) return { rows: [], errors: ['File kosong.'] };

  const sep = detectSeparator(lines[0]);
  const header = splitLine(lines[0], sep).map(h => h.toLowerCase().replace(/\s+/g, ''));
  const col = Object.fromEntries(TEMPLATE_HEADER.map(name => [name, header.indexOf(name.toLowerCase())]));
  const missing = TEMPLATE_HEADER.filter(name => col[name] === -1);
  if (missing.length) {
    return { rows: [], errors: [`Kolom wajib tidak ditemukan: ${missing.join(', ')}. Gunakan template: ${TEMPLATE_HEADER.join(sep)}`] };
  }

  const rows = [];
  const errors = [];
  lines.slice(1).forEach((line, i) => {
    const row = i + 2;
    const cells = splitLine(line, sep);
    const prodiKey = cells[col.programStudi] || '';
    const fakultasKey = cells[col.fakultas] || '';
    const periode = cells[col.periode] || '';
    const tahun = Number(cells[col.tahun]);
    const jumlah = Number(cells[col.jumlah]);
    const problems = [];
    if (!prodiKey) problems.push('program studi kosong');
    if (!fakultasKey) problems.push('fakultas kosong');
    if (!periode) problems.push('periode kosong');
    if (!Number.isInteger(tahun) || tahun < 1950 || tahun > 2100) problems.push(`tahun "${cells[col.tahun] || ''}" tidak valid`);
    if (!Number.isInteger(jumlah) || jumlah < 0) problems.push(`jumlah "${cells[col.jumlah] || ''}" tidak valid`);
    if (problems.length) errors.push(`Baris ${row}: ${problems.join('; ')}.`);
    else rows.push({ prodiKey, fakultasKey, periode, tahun, jumlah, row });
  });
  return { rows, errors };
};

module.exports = { parseLulusanCsv, TEMPLATE_HEADER };
