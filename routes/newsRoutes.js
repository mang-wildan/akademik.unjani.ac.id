const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const newsController = require('../controllers/newsController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'news');
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
  if (!file.mimetype.startsWith('image/')) return cb(new Error('Featured image harus berupa gambar'));
  cb(null, true);
};
const upload = multer({ storage, fileFilter });

router.use(requireAuth, requireAdmin);

router.get('/', newsController.list);
router.get('/new', newsController.newForm);
router.post('/', upload.single('featuredImage'), newsController.create);
router.get('/:id/edit', newsController.editForm);
router.post('/:id', upload.single('featuredImage'), newsController.update);
router.post('/:id/pin', newsController.togglePin);
router.post('/:id/delete', newsController.remove);

module.exports = router;
