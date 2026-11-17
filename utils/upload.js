const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Both single and bulk deletion stay inside the owning module's upload folder.
exports.removeUploadFiles = async (basePath, urls) => {
  const publicDir = path.join(__dirname, '..', 'public');
  const root = path.join(publicDir, 'uploads', basePath);
  const files = [...new Set(urls.filter(Boolean).flatMap(url => /\.webp$/i.test(url) ? [url, url.replace(/\.webp$/i, '-thumb.webp')] : [url]))].map(url => {
    const file = path.resolve(publicDir, `.${url}`);
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error('Lokasi lampiran tidak valid.');
    return file;
  });
  for (const file of files) await fs.promises.unlink(file).catch(err => { if (err.code !== 'ENOENT') throw err; });
};

const MB = 1024 * 1024;
const IMAGE_MAX_BYTES = 5 * MB;
const DOCUMENT_MAX_BYTES = 10 * MB;

// Raster formats only: SVG can carry script and would run on this origin.
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// Multer applies one fileSize cap to every file in a request. Image-only forms
// use IMAGE_LIMITS; forms that mix a PDF with an image use DOCUMENT_LIMITS and
// add enforceImageLimit after the multer middleware to hold images to 5 MB.
exports.IMAGE_LIMITS = { fileSize: IMAGE_MAX_BYTES };
exports.DOCUMENT_LIMITS = { fileSize: DOCUMENT_MAX_BYTES };
exports.GRADUATION_BOOK_LIMITS = { fileSize: 200 * MB };

exports.isAllowedImage = file => IMAGE_TYPES.includes(file.mimetype);

// Rejection shown to the admin as-is by the central error handler.
exports.fileError = message => Object.assign(new Error(message), { status: 400, expose: true });

// Name the file is stored under: never the client's path, only a plain base
// name ("../../server.js" would otherwise escape the upload folder).
exports.safeFilename = originalname => {
  const base = String(originalname || '').split(/[\\/]/).pop();
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) : '';
  const stem = (dot > 0 ? base.slice(0, dot) : base)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 80) || 'file';
  return ext ? `${stem}.${ext}` : stem;
};

// First bytes of each accepted format; the browser-sent MIME type is only a claim.
const SIGNATURES = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/jpg': [[0xff, 0xd8, 0xff]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF....WEBP (checked below)
};

const readHead = (filePath, length = 16) => {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const read = fs.readSync(fd, buffer, 0, length, 0);
    return buffer.subarray(0, read);
  } finally {
    fs.closeSync(fd);
  }
};

const isCsvMime = mime => /csv|text\/plain|vnd\.ms-excel/.test(mime);

// Does the file content match the type it was uploaded as?
exports.matchesSignature = file => {
  if (!file.path) return true;
  const head = readHead(file.path);
  const isCsv = isCsvMime(file.mimetype) || /\.csv$/i.test(file.originalname || '');
  if (isCsv) return !head.includes(0); // plain text, no NUL bytes
  const options = SIGNATURES[file.mimetype];
  if (!options) return false;
  const ok = options.some(sig => sig.every((byte, i) => head[i] === byte));
  if (ok && file.mimetype === 'image/webp') return head.subarray(8, 12).toString('ascii') === 'WEBP';
  return ok;
};

const uploadedFiles = req => {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files) Object.values(req.files).forEach(list => files.push(...list));
  return files;
};

const discard = files => files.forEach(f => f.path && fs.unlink(f.path, () => {}));

// Runs after multer on every upload route: rejects files whose content does
// not match their type, and holds images to 5 MB on forms that also take PDFs.
exports.checkUploads = (req, _res, next) => {
  const files = uploadedFiles(req);
  const forged = files.find(f => !exports.matchesSignature(f));
  if (forged) {
    discard(files);
    return next(exports.fileError(`Isi file "${forged.originalname}" tidak sesuai dengan jenisnya.`));
  }
  const oversized = files.find(f => f.mimetype.startsWith('image/') && f.size > IMAGE_MAX_BYTES);
  if (oversized) {
    discard(files);
    return next(new multer.MulterError('LIMIT_FILE_SIZE', oversized.fieldname));
  }
  return next();
};

exports.enforceImageLimit = exports.checkUploads;

exports.uploadErrorMessage = err => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return 'Ukuran file terlalu besar. Batas maksimal: gambar 5 MB, PDF 10 MB.';
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Kolom unggahan tidak dikenali.';
    default:
      return 'Gagal mengunggah file. Silakan coba lagi.';
  }
};
