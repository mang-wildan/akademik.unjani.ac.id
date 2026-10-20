const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, isAllowedImage, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const graduationBookController = require('../controllers/graduationBookController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'graduation-books');
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

router.post('/bulk', graduationBookController.bulk);

router.get('/', graduationBookController.list);
router.get('/new', graduationBookController.showCreate);
router.post('/', uploadFields, checkUploads, graduationBookController.create);
router.get('/:id/edit', graduationBookController.showEdit);
router.post('/:id', uploadFields, checkUploads, graduationBookController.update);
router.post('/:id/delete', graduationBookController.destroy);

module.exports = router;
