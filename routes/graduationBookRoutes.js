const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const graduationBookController = require('../controllers/graduationBookController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'graduation-books');
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
  if (file.fieldname === 'pdf') {
    if (file.mimetype !== 'application/pdf') return cb(new Error('File PDF tidak valid'));
  }
  if (file.fieldname === 'cover') {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('File cover harus gambar'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

router.get('/', requireAuth, requireAdmin, graduationBookController.list);
router.get('/new', requireAuth, requireAdmin, graduationBookController.showCreate);
router.post('/', requireAuth, requireAdmin, upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), graduationBookController.create);
router.get('/:id/edit', requireAuth, requireAdmin, graduationBookController.showEdit);
router.post('/:id', requireAuth, requireAdmin, upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), graduationBookController.update);
router.post('/:id/delete', requireAuth, requireAdmin, graduationBookController.destroy);

module.exports = router;
