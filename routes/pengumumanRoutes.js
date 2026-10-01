const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { fileError, isAllowedImage, IMAGE_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const pengumumanController = require('../controllers/pengumumanController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'pengumuman');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});
const fileFilter = (_req, file, cb) => {
  if (!isAllowedImage(file)) return cb(fileError('Featured image harus berupa gambar'));
  cb(null, true);
};
const upload = multer({ storage, fileFilter, limits: IMAGE_LIMITS });

router.use(requireAuth, requireAdmin);

router.get('/', pengumumanController.list);
router.get('/new', pengumumanController.newForm);
router.post('/', upload.single('featuredImage'), pengumumanController.create);
router.get('/:id/edit', pengumumanController.editForm);
router.post('/:id', upload.single('featuredImage'), pengumumanController.update);
router.post('/:id/pin', pengumumanController.togglePin);
router.post('/:id/delete', pengumumanController.remove);

module.exports = router;
