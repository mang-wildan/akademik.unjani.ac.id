const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { safeFilename, matchesSignature, checkUploads, GRADUATION_BOOK_LIMITS, DOCUMENT_LIMITS, uploadErrorMessage } = require('../utils/upload');

test('graduation PDFs have a dedicated 200 MB limit; other PDFs remain 10 MB', () => {
  assert.equal(GRADUATION_BOOK_LIMITS?.fileSize, 209715200);
  assert.equal(DOCUMENT_LIMITS.fileSize, 10485760);
  assert.equal(uploadErrorMessage({ code: 'LIMIT_FILE_SIZE' }), 'Ukuran file terlalu besar. Batas maksimal: gambar 5 MB, PDF 10 MB.');
});

test('mixed PDF uploads still reject valid PNG above 5 MB', async () => {
  const file = tmp('oversize.png', [0x89, 0x50, 0x4e, 0x47]);
  const err = await new Promise(resolve => checkUploads({ files: { cover: [{ path: file, mimetype: 'image/png', size: 5 * 1024 * 1024 + 1, fieldname: 'cover' }] } }, {}, resolve));
  assert.equal(err.code, 'LIMIT_FILE_SIZE');
});

test('safeFilename strips any path so uploads stay in their folder', () => {
  assert.equal(safeFilename('../../../../server.js'), 'server.js');
  assert.equal(safeFilename('..\\..\\app.js'), 'app.js');
  assert.equal(safeFilename('/etc/passwd'), 'passwd');
});

test('safeFilename keeps readable names and lower-cases the extension', () => {
  assert.equal(safeFilename('Kalender Akademik 2025-2026.PDF'), 'Kalender_Akademik_2025-2026.pdf');
  assert.equal(safeFilename('Pengumuman (Revisi) #2.png'), 'Pengumuman_Revisi_2.png');
  assert.equal(safeFilename('Résumé.jpg'), 'Resume.jpg');
  assert.equal(safeFilename('...'), 'file');
  assert.equal(safeFilename(''), 'file');
  assert.ok(safeFilename(`${'a'.repeat(300)}.pdf`).length <= 84);
});

const tmp = (name, bytes) => {
  const file = path.join(os.tmpdir(), `sig-${process.pid}-${name}`);
  fs.writeFileSync(file, Buffer.from(bytes));
  return file;
};

test('matchesSignature accepts real PDF / PNG / JPEG / WEBP headers', () => {
  const cases = [
    ['a.pdf', 'application/pdf', [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]],
    ['a.png', 'image/png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]],
    ['a.jpg', 'image/jpeg', [0xff, 0xd8, 0xff, 0xe0]],
    ['a.webp', 'image/webp', [...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBP')]],
  ];
  for (const [name, mimetype, bytes] of cases) {
    assert.equal(matchesSignature({ path: tmp(name, bytes), mimetype, originalname: name }), true, name);
  }
});

test('matchesSignature rejects content that lies about its type', () => {
  const html = [...Buffer.from('<script>alert(1)</script>')];
  assert.equal(matchesSignature({ path: tmp('x.pdf', html), mimetype: 'application/pdf', originalname: 'x.pdf' }), false);
  assert.equal(matchesSignature({ path: tmp('x.png', html), mimetype: 'image/png', originalname: 'x.png' }), false);
  assert.equal(matchesSignature({ path: tmp('x.riff', [...Buffer.from('RIFF0000WAVE')]), mimetype: 'image/webp', originalname: 'x.webp' }), false);
  assert.equal(matchesSignature({ path: tmp('x.svg', html), mimetype: 'image/svg+xml', originalname: 'x.svg' }), false);
});

test('matchesSignature treats .csv as text whatever the browser calls it', () => {
  const csv = [...Buffer.from('semester;kegiatan;mulai\n')];
  assert.equal(matchesSignature({ path: tmp('k.csv', csv), mimetype: 'application/octet-stream', originalname: 'k.csv' }), true);
  assert.equal(matchesSignature({ path: tmp('b.csv', [0x50, 0x4b, 0x03, 0x00]), mimetype: 'text/csv', originalname: 'b.csv' }), false);
});
