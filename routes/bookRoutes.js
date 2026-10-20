const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, isAllowedImage, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const bookController = require('../controllers/bookController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'books');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'file' && file.mimetype !== 'application/pdf') return cb(fileError('File harus berupa PDF.'));
  if (file.fieldname === 'cover' && !isAllowedImage(file)) return cb(fileError('Sampul harus berupa gambar (JPG/PNG/WEBP).'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });
const uploadFields = upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]);

router.use(requireAuth, requireAdmin);

router.get('/', bookController.list);
router.get('/new', bookController.showCreate);
router.post('/', uploadFields, checkUploads, bookController.create);
router.post('/bulk', bookController.bulk);
router.get('/:id/edit', bookController.showEdit);
router.post('/:id', uploadFields, checkUploads, bookController.update);
router.post('/:id/delete', bookController.destroy);

module.exports = router;
