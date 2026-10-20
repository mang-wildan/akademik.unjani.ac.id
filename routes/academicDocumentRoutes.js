const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const academicDocumentController = require('../controllers/academicDocumentController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'academic-documents');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'file' && file.mimetype !== 'application/pdf') return cb(fileError('File dokumen harus berupa PDF.'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });
const uploadFile = upload.fields([{ name: 'file', maxCount: 1 }]);

router.use(requireAuth, requireAdmin);

router.post('/bulk', academicDocumentController.bulk);

router.get('/', academicDocumentController.list);
router.get('/new', academicDocumentController.showCreate);
router.post('/', uploadFile, checkUploads, academicDocumentController.create);
router.get('/:id/edit', academicDocumentController.showEdit);
router.post('/:id', uploadFile, checkUploads, academicDocumentController.update);
router.post('/:id/pin', academicDocumentController.togglePin);
router.post('/:id/delete', academicDocumentController.destroy);

module.exports = router;
