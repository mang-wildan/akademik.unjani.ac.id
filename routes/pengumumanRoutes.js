const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, isAllowedImage, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const pengumumanController = require('../controllers/pengumumanController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'pengumuman');
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

// Images are capped to 5 MB regardless by checkUploads (DOCUMENT_LIMITS allows
// 10 MB per file; the multer-level limit here only needs to cover the largest file type).
const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });
const uploadFields = upload.fields([{ name: 'featuredImage', maxCount: 1 }, { name: 'attachments', maxCount: 5 }]);

router.use(requireAuth, requireAdmin);

router.get('/', pengumumanController.list);
router.get('/new', pengumumanController.newForm);
router.post('/', uploadFields, checkUploads, pengumumanController.create);
router.get('/:id/edit', pengumumanController.editForm);
router.get('/:id/preview', pengumumanController.preview);
router.post('/:id', uploadFields, checkUploads, pengumumanController.update);
router.post('/:id/pin', pengumumanController.togglePin);
router.post('/:id/delete', pengumumanController.destroy);

module.exports = router;
