const fs = require('fs');
const multer = require('multer');

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

exports.isAllowedImage = file => IMAGE_TYPES.includes(file.mimetype);

// Rejection shown to the admin as-is by the central error handler.
exports.fileError = message => Object.assign(new Error(message), { status: 400, expose: true });

const uploadedFiles = req => {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files) Object.values(req.files).forEach(list => files.push(...list));
  return files;
};

exports.enforceImageLimit = (req, _res, next) => {
  const files = uploadedFiles(req);
  const oversized = files.find(f => f.mimetype.startsWith('image/') && f.size > IMAGE_MAX_BYTES);
  if (!oversized) return next();
  files.forEach(f => f.path && fs.unlink(f.path, () => {}));
  return next(new multer.MulterError('LIMIT_FILE_SIZE', oversized.fieldname));
};

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
