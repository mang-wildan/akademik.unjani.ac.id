const test = require('node:test');
const assert = require('node:assert/strict');
const { accreditationStatus, normalizePeringkat, peringkatRank } = require('../utils/accreditation');
const { calendarEventStatus, currentAndNext } = require('../utils/calendar');
const { makeExcerpt, sanitizeHtml } = require('../utils/html');
const { parseCalendarCsv, parseTanggal, templateCsv } = require('../utils/calendarImport');

// "Now" = 1 Okt 2026, 10:00 WIB.
const NOW = new Date('2026-10-01T03:00:00Z');
const wib = day => new Date(`${day}T00:00:00+07:00`);

test('accreditationStatus: valid, expiring within 90 days, expired', () => {
  assert.equal(accreditationStatus(wib('2027-06-01'), NOW).key, 'berlaku');
  assert.equal(accreditationStatus(wib('2026-12-28'), NOW).key, 'segera-berakhir');
  assert.equal(accreditationStatus(wib('2026-12-28'), NOW).sisaHari, 88);
  assert.equal(accreditationStatus(wib('2026-02-11'), NOW).key, 'kedaluwarsa');
  assert.equal(accreditationStatus(null, NOW).key, 'tidak-diketahui');
});

test('accreditationStatus: still valid on its last day (WIB), expired the day after', () => {
  assert.equal(accreditationStatus(wib('2026-10-01'), NOW).key, 'segera-berakhir');
  assert.equal(accreditationStatus(wib('2026-09-30'), NOW).key, 'kedaluwarsa');
  // Stored as UTC midnight (old form): 2026-10-01T00:00Z is 07:00 WIB on 1 Oct.
  assert.equal(accreditationStatus(new Date('2026-10-01T00:00:00Z'), NOW).key, 'segera-berakhir');
});

test('normalizePeringkat maps free text to the fixed list', () => {
  assert.equal(normalizePeringkat(' unggul '), 'Unggul');
  assert.equal(normalizePeringkat('baik  sekali'), 'Baik Sekali');
  assert.equal(normalizePeringkat('B'), 'B');
  assert.equal(normalizePeringkat('Terakreditasi'), null);
  assert.ok(peringkatRank('Unggul') < peringkatRank('Baik'));
});

test('calendarEventStatus: before, during (inclusive), after', () => {
  assert.equal(calendarEventStatus(wib('2026-10-05'), wib('2026-10-09'), NOW).key, 'akan-datang');
  assert.equal(calendarEventStatus(wib('2026-09-28'), wib('2026-10-01'), NOW).key, 'berlangsung');
  assert.equal(calendarEventStatus(wib('2026-10-01'), null, NOW).key, 'berlangsung');
  assert.equal(calendarEventStatus(wib('2026-09-01'), wib('2026-09-30'), NOW).key, 'selesai');
  assert.equal(calendarEventStatus(wib('2026-09-30'), null, NOW).key, 'selesai');
});

test('currentAndNext picks running events and the next to start', () => {
  const events = [
    { nama: 'Lalu', mulai: wib('2026-09-01'), selesai: wib('2026-09-10') },
    { nama: 'Nanti 2', mulai: wib('2026-11-01') },
    { nama: 'Sedang', mulai: wib('2026-09-29'), selesai: wib('2026-10-03') },
    { nama: 'Nanti 1', mulai: wib('2026-10-10') },
  ];
  const r = currentAndNext(events, NOW);
  assert.deepEqual(r.berlangsung.map(e => e.nama), ['Sedang']);
  assert.deepEqual(r.berikutnya.map(e => e.nama), ['Nanti 1']);
});

test('makeExcerpt strips tags, decodes entities once, cuts at a word', () => {
  assert.equal(makeExcerpt('<p>Halo&nbsp;<b>dunia</b></p><p>BEM &amp; Alumni</p>'), 'Halo dunia BEM & Alumni');
  // Text the editor stored escaped stays readable text, not live HTML.
  assert.equal(makeExcerpt('rfgw&lt;a href:"unjani.ac.id"&gt;unjani&lt;/a&gt;'), 'rfgw<a href:"unjani.ac.id">unjani</a>');
  assert.equal(makeExcerpt('<script>alert(1)</script>Isi'), 'Isi');
  const long = makeExcerpt(`<p>${'kata '.repeat(100)}</p>`, 50);
  assert.ok(long.length <= 51 && long.endsWith('…'), long);
});

test('sanitizeHtml keeps formatting, drops script, events, foreign images', () => {
  const out = sanitizeHtml('<p onclick="x()">Hai <strong>kamu</strong><script>alert(1)</script></p>'
    + '<a href="javascript:alert(1)">x</a><a href="https://unjani.ac.id" target="_blank">ok</a>'
    + '<img src="https://evil.example/a.png"><img src="/uploads/news/a.webp" alt="a"><img src="data:image/png;base64,AA">');
  assert.ok(out.includes('<p>Hai <strong>kamu</strong></p>'), out);
  assert.ok(!/script|onclick|javascript:|evil\.example|data:/.test(out), out);
  assert.ok(out.includes('rel="noopener noreferrer"'), out);
  assert.ok(out.includes('<img src="/uploads/news/a.webp" alt="a" />'), out);
});

test('parseTanggal accepts DD/MM/YYYY and ISO, rejects impossible dates', () => {
  assert.equal(parseTanggal('29/06/2026').toISOString(), '2026-06-28T17:00:00.000Z');
  assert.equal(parseTanggal('2026-06-29').toISOString(), '2026-06-28T17:00:00.000Z');
  assert.equal(parseTanggal('31/02/2026'), undefined);
  assert.equal(parseTanggal('06/29/2026'), undefined);
  assert.equal(parseTanggal(''), null);
});

test('parseCalendarCsv reads semicolon Excel CSV with BOM and quotes', () => {
  const csv = '﻿semester;kegiatan;mulai;selesai\r\n'
    + 'Genap;"Ujian Akhir Semester (UAS); semua prodi";29/06/2026;10/07/2026\r\n'
    + 'genap;Batas Akhir Pengumuman Nilai;17/07/2026;\r\n';
  const r = parseCalendarCsv(csv);
  assert.deepEqual(r.errors, []);
  assert.equal(r.events.length, 2);
  assert.equal(r.events[0].nama, 'Ujian Akhir Semester (UAS); semua prodi');
  assert.equal(r.events[1].selesai, null);
});

test('parseCalendarCsv reports every bad row by line number', () => {
  const r = parseCalendarCsv('semester,kegiatan,mulai,selesai\nganjil,OK,01/09/2026,\nsemester3,,31/02/2026,\ngenap,Mundur,10/07/2026,01/07/2026\n');
  assert.equal(r.events.length, 1);
  assert.equal(r.errors.length, 2);
  assert.match(r.errors[0], /^Baris 3: semester "semester3" tidak dikenal .*; nama kegiatan kosong; tanggal mulai "31\/02\/2026" tidak valid/);
  assert.match(r.errors[1], /^Baris 4: tanggal selesai sebelum tanggal mulai/);
  assert.match(parseCalendarCsv('nama;tanggal\nx;y').errors[0], /Kolom wajib tidak ditemukan/);
});

test('templateCsv round-trips through the parser', () => {
  const r = parseCalendarCsv(templateCsv());
  assert.deepEqual(r.errors, []);
  assert.equal(r.events.length, 2);
});
