const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const programStudiController = require('../controllers/programStudiController');

const router = express.Router();

// diskStorage (bukan memoryStorage): lihat docs/POLA-ADMIN.md -- memoryStorage
// membuat checkUploads diam-diam tidak pernah memeriksa isi file.
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'program-studi-import');
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

router.use(requireAuth, requireSuperadmin);

router.get('/', programStudiController.list);
router.get('/new', programStudiController.showCreate);
router.post('/', programStudiController.create);
router.post('/import', upload.fields([{ name: 'csv', maxCount: 1 }]), checkUploads, programStudiController.importCsv);
router.post('/bulk', programStudiController.bulk);
router.get('/:id/edit', programStudiController.showEdit);
router.post('/:id', programStudiController.update);
router.post('/:id/delete', programStudiController.destroy);

module.exports = router;
