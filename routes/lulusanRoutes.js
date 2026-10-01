const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const lulusanController = require('../controllers/lulusanController');

const router = express.Router();

// diskStorage (bukan memoryStorage): checkUploads membaca file.path untuk
// verifikasi magic-byte -- file di memori tidak punya .path sehingga
// pemeriksaan itu diam-diam dilewati (lih. docs/POLA-ADMIN.md).
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'lulusan-import');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'csv' && !/\.csv$/i.test(file.originalname || '')) return cb(fileError('File harus berupa CSV.'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });

router.use(requireAuth, requireAdmin);

router.get('/', lulusanController.list);
router.get('/template.csv', lulusanController.downloadTemplate);
router.get('/new', lulusanController.showCreate);
router.post('/', lulusanController.create);
router.post('/import', upload.fields([{ name: 'csv', maxCount: 1 }]), checkUploads, lulusanController.importCsv);
router.get('/:id/edit', lulusanController.showEdit);
router.post('/:id', lulusanController.update);
router.post('/:id/delete', lulusanController.destroy);

module.exports = router;
