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
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = safeFilename(file.originalname);
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'pdf') {
    if (file.mimetype !== 'application/pdf') return cb(fileError('File PDF tidak valid'));
  }
  if (file.fieldname === 'cover') {
    if (!isAllowedImage(file)) return cb(fileError('File cover harus gambar'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });

router.get('/', requireAuth, requireAdmin, graduationBookController.list);
router.get('/new', requireAuth, requireAdmin, graduationBookController.showCreate);
router.post('/', requireAuth, requireAdmin, upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), checkUploads, graduationBookController.create);
router.get('/:id/edit', requireAuth, requireAdmin, graduationBookController.showEdit);
router.post('/:id', requireAuth, requireAdmin, upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), checkUploads, graduationBookController.update);
router.post('/:id/delete', requireAuth, requireAdmin, graduationBookController.destroy);

module.exports = router;
