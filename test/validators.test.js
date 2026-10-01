const test = require('node:test');
const assert = require('node:assert/strict');
const { validate, schemas } = require('../validators');

const ID = '69829f8a5d4c473960b4305c';

test('accreditation: valid prodi form is cleaned', () => {
  const r = validate(schemas.accreditation, {
    jenis: 'prodi', programStudi: ID, namaUnit: '', peringkat: 'Baik Sekali', lembaga: ID,
    nomorSK: ' 123/SK/LAM/2026 ', tanggalBerlaku: '2026-05-05', berlakuSampai: '2031-05-05', catatanPerpanjangan: '',
  });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.data.nomorSK, '123/SK/LAM/2026');
  assert.equal(r.data.namaUnit, undefined);
  assert.ok(r.data.berlakuSampai instanceof Date);
});

test('accreditation: per-field Indonesian errors', () => {
  const r = validate(schemas.accreditation, {
    jenis: 'prodi', programStudi: '', peringkat: 'Sangat Baik', lembaga: 'x',
    tanggalBerlaku: '2026-05-05', berlakuSampai: '2026-01-01',
  });
  assert.equal(r.ok, false);
  assert.equal(r.errors.peringkat, 'Pilih peringkat dari daftar.');
  assert.equal(r.errors.lembaga, 'Pilih lembaga akreditasi dari daftar.');
  assert.equal(r.errors.programStudi, 'Program studi wajib diisi.');
  assert.equal(r.errors.berlakuSampai, 'Tanggal berlaku sampai harus setelah tanggal berlaku.');
});

test('accreditation: institusi needs a unit name instead of a prodi', () => {
  const r = validate(schemas.accreditation, { jenis: 'institusi', peringkat: 'Unggul', lembaga: ID, tanggalBerlaku: '2025-02-11', berlakuSampai: '2030-02-11' });
  assert.equal(r.errors.namaUnit, 'Nama unit wajib diisi.');
});

test('calendar: tahun ajaran must be consecutive years', () => {
  assert.equal(validate(schemas.calendar, { tahunAjaran: '2026/2027' }).ok, true);
  assert.equal(validate(schemas.calendar, { tahunAjaran: '2026/2028' }).errors.tahunAjaran, 'Tahun ajaran ditulis seperti 2026/2027.');
  assert.equal(validate(schemas.calendar, { tahunAjaran: '' }).errors.tahunAjaran, 'Tahun ajaran wajib diisi.');
});

test('kegiatan: end date not before start, one-day events allowed', () => {
  assert.equal(validate(schemas.kegiatan, { semester: 'genap', nama: 'UAS', mulai: '2026-06-29', selesai: '' }).ok, true);
  const r = validate(schemas.kegiatan, { semester: 'genap', nama: 'UAS', mulai: '2026-06-29', selesai: '2026-06-01' });
  assert.equal(r.errors.selesai, 'Tanggal selesai tidak boleh sebelum tanggal mulai.');
  assert.equal(validate(schemas.kegiatan, { semester: 'x', nama: '', mulai: '31/02/2026' }).errors.mulai, 'Tanggal mulai tidak valid.');
});

test('content: body of only empty tags counts as empty; checkbox parsed', () => {
  const r = validate(schemas.content, { title: 'Jadwal UAS', body: '<p><br></p>', status: 'published', pinned: 'on' });
  assert.equal(r.errors.body, 'Isi wajib diisi.');
  const ok = validate(schemas.content, { title: 'Jadwal UAS Genap', body: '<p>Isi</p>', status: 'draft' });
  assert.equal(ok.ok, true);
  assert.equal(ok.data.pinned, false);
});

test('staff: email optional but checked, urutan numeric', () => {
  assert.equal(validate(schemas.staff, { nama: 'Rina', jabatan: 'Kepala', kelompok: 'pimpinan', email: '', nomorUrut: '' }).data.nomorUrut, 0);
  assert.equal(validate(schemas.staff, { nama: 'Rina', jabatan: 'Kepala', kelompok: 'pimpinan', email: 'rina@' }).errors.email, 'Format email tidak valid.');
});

test('userCreate and passwordChange', () => {
  const u = validate(schemas.userCreate, { name: 'Editor', email: ' Editor@UNJANI.ac.id ', role: 'editor', password: 'rahasia123' });
  assert.equal(u.data.email, 'editor@unjani.ac.id');
  assert.equal(validate(schemas.userCreate, { name: 'X', email: 'x@unjani.ac.id', role: 'admin', password: 'rahasia123' }).errors.role, 'Pilih role dari daftar.');
  assert.equal(validate(schemas.userCreate, { name: 'X', email: 'x@unjani.ac.id', role: 'editor', password: 'pendek' }).errors.password, 'Password minimal 8 karakter.');
  const p = validate(schemas.passwordChange, { currentPassword: 'lama12345', newPassword: 'baru12345', confirmPassword: 'beda12345' });
  assert.equal(p.errors.confirmPassword, 'Konfirmasi password tidak sesuai.');
});
