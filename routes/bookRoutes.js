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
    if (!isAllowedImage(file)) return cb(fileError('File cover harus berupa gambar'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });

router.get('/', requireAuth, requireAdmin, bookController.list);
router.get('/new', requireAuth, requireAdmin, bookController.showCreate);
router.post('/', requireAuth, requireAdmin, upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), checkUploads, bookController.create);
router.get('/:id/edit', requireAuth, requireAdmin, bookController.showEdit);
router.post('/:id', requireAuth, requireAdmin, upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), checkUploads, bookController.update);
router.post('/:id/delete', requireAuth, requireAdmin, bookController.destroy);

module.exports = router;
