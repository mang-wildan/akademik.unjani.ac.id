const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, isAllowedImage, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const academicDocumentController = require('../controllers/academicDocumentController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'academic-documents');
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
  if (file.fieldname === 'file' && file.mimetype !== 'application/pdf') {
    return cb(fileError('File dokumen harus berupa PDF.'));
  }
  if (file.fieldname === 'cover' && !isAllowedImage(file)) {
    return cb(fileError('Cover harus berupa gambar (jpg/png).'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });

router.get('/', requireAuth, requireAdmin, academicDocumentController.list);
router.get('/new', requireAuth, requireAdmin, academicDocumentController.showCreate);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]), checkUploads,
  academicDocumentController.create
);
router.get('/:id/edit', requireAuth, requireAdmin, academicDocumentController.showEdit);
router.post(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]), checkUploads,
  academicDocumentController.update
);
router.post('/:id/pin', requireAuth, requireAdmin, academicDocumentController.togglePin);
router.post('/:id/delete', requireAuth, requireAdmin, academicDocumentController.destroy);

module.exports = router;
