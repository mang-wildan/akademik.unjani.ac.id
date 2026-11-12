const test = require('node:test');
const assert = require('node:assert/strict');
const f = require('../utils/format');

test('formatTanggal: short and long Indonesian months', () => {
  assert.equal(f.formatTanggal('2026-02-03T00:00:00Z'), '3 Feb 2026');
  assert.equal(f.formatTanggal('2026-02-03T00:00:00Z', { long: true }), '3 Februari 2026');
  assert.equal(f.formatTanggal('2026-08-28T00:00:00Z'), '28 Agu 2026');
});

test('formatTanggal: shown in WIB, not UTC', () => {
  // 20:00 UTC on 2 Feb is 03:00 WIB on 3 Feb.
  assert.equal(f.formatTanggal('2026-02-02T20:00:00Z'), '3 Feb 2026');
});

test('formatTanggal: empty or invalid input', () => {
  assert.equal(f.formatTanggal(null), '-');
  assert.equal(f.formatTanggal('bukan tanggal'), '-');
});

test('formatRentangTanggal: collapses shared month and year', () => {
  assert.equal(f.formatRentangTanggal('2026-07-13', '2026-07-17'), '13–17 Jul 2026');
  assert.equal(f.formatRentangTanggal('2026-06-29', '2026-07-10'), '29 Jun – 10 Jul 2026');
  assert.equal(f.formatRentangTanggal('2025-09-22', '2026-01-15'), '22 Sep 2025 – 15 Jan 2026');
  assert.equal(f.formatRentangTanggal('2026-08-28', null), '28 Agu 2026');
  assert.equal(f.formatRentangTanggal('2026-08-28', '2026-08-28'), '28 Agu 2026');
});

test('rentangTanggal: normalizes dash spacing within and across months and years', () => {
  assert.equal(f.rentangTanggal('2026-07-13', '2026-07-17'), '13 - 17 Jul 2026');
  assert.equal(f.rentangTanggal('2026-06-29', '2026-07-10'), '29 Jun - 10 Jul 2026');
  assert.equal(f.rentangTanggal('2025-09-22', '2026-01-15'), '22 Sep 2025 - 15 Jan 2026');
});

test('tanggalBlok: day / upper-case month / year', () => {
  assert.deepEqual(
    { ...f.tanggalBlok('2026-06-29T00:00:00Z'), iso: undefined },
    { day: '29', month: 'JUN', year: '2026', iso: undefined }
  );
  assert.equal(f.tanggalBlok(''), null);
});

test('formatAngka and formatUkuranFile use Indonesian separators', () => {
  assert.equal(f.formatAngka(11769), '11.769');
  assert.equal(f.formatAngka('x'), '-');
  assert.equal(f.formatUkuranFile(250 * 1024), '250 KB');
  assert.equal(f.formatUkuranFile(1.25 * 1024 * 1024), '1,3 MB');
  assert.equal(f.formatUkuranFile(0), '-');
});
