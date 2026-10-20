const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, IMAGE_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const unitController = require('../controllers/unitController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'unit');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safe = safeFilename(file.originalname);
    cb(null, `${timestamp}-${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(fileError('Gambar harus berupa JPG/PNG/WEBP.'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: IMAGE_LIMITS });

router.use(requireAuth,requireAdmin);
router.post('/bulk',unitController.bulk);

router.get('/', unitController.list);
router.get('/new', unitController.showCreate);
router.post('/', upload.single('img'), checkUploads, unitController.create);
router.get('/:id/edit', unitController.showEdit);
router.post('/:id', upload.single('img'), checkUploads, unitController.update);
router.post('/:id/delete', unitController.destroy);

module.exports = router;
