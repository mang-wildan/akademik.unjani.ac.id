const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const rplDocumentController = require('../controllers/rplDocumentController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'rpl-documents');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'file' && file.mimetype !== 'application/pdf') return cb(fileError('File harus berupa PDF.'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });
const uploadFile = upload.fields([{ name: 'file', maxCount: 1 }]);

router.use(requireAuth, requireAdmin);

router.post('/bulk', rplDocumentController.bulk);

router.get('/', rplDocumentController.list);
router.get('/new', rplDocumentController.showCreate);
router.post('/', uploadFile, checkUploads, rplDocumentController.create);
router.get('/:id/edit', rplDocumentController.showEdit);
router.post('/:id', uploadFile, checkUploads, rplDocumentController.update);
router.post('/:id/delete', rplDocumentController.destroy);

module.exports = router;
