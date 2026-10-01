const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { fileError, IMAGE_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const unitController = require('../controllers/unitController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'unit');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(fileError('Gambar harus berupa JPG/PNG.'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: IMAGE_LIMITS });

router.get('/', requireAuth, requireAdmin, unitController.list);
router.get('/new', requireAuth, requireAdmin, unitController.showCreate);
router.post('/', requireAuth, requireAdmin, upload.single('img'), unitController.create);
router.get('/:id/edit', requireAuth, requireAdmin, unitController.showEdit);
router.post('/:id', requireAuth, requireAdmin, upload.single('img'), unitController.update);
router.post('/:id/delete', requireAuth, requireAdmin, unitController.destroy);

module.exports = router;
