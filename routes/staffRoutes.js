const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, IMAGE_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const staffController = require('../controllers/staffController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'staff');
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
  const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(fileError('Foto harus berupa gambar JPG/PNG.'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: IMAGE_LIMITS });

router.use(requireAuth,requireAdmin);
router.post('/bulk',staffController.bulk);

router.get('/', staffController.list);
router.get('/new', staffController.showCreate);
router.post('/', upload.single('foto'), checkUploads, staffController.create);
router.get('/:id/edit', staffController.showEdit);
router.post('/:id', upload.single('foto'), checkUploads, staffController.update);
router.post('/:id/delete', staffController.destroy);

module.exports = router;
