const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, isAllowedImage, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const newsController = require('../controllers/newsController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'news');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'featuredImage' && !isAllowedImage(file)) return cb(fileError('Gambar sampul harus berupa gambar (JPG/PNG/WEBP).'));
  if (file.fieldname === 'attachments' && file.mimetype !== 'application/pdf') return cb(fileError('Lampiran harus berupa PDF.'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });
const uploadFields = upload.fields([{ name: 'featuredImage', maxCount: 1 }, { name: 'attachments', maxCount: 5 }]);

router.use(requireAuth, requireAdmin);

router.get('/', newsController.list);
router.get('/new', newsController.newForm);
router.post('/', uploadFields, checkUploads, newsController.create);
router.get('/:id/edit', newsController.editForm);
router.post('/:id', uploadFields, checkUploads, newsController.update);
router.post('/:id/pin', newsController.togglePin);
router.post('/:id/delete', newsController.destroy);

module.exports = router;
