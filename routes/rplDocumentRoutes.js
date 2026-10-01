const express = require('express');
const path = require('path');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const rplDocumentController = require('../controllers/rplDocumentController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'rpl-documents');
const fs = require('fs');
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
    return cb(fileError('File harus berupa PDF'));
  }
  if (file.fieldname === 'cover' && !['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
    return cb(fileError('Cover harus berupa PNG/JPG'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });

router.get('/', requireAuth, requireAdmin, rplDocumentController.list);
router.get('/new', requireAuth, requireAdmin, rplDocumentController.showCreate);
router.post('/', requireAuth, requireAdmin, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'file', maxCount: 1 }]), checkUploads, rplDocumentController.create);
router.get('/:id/edit', requireAuth, requireAdmin, rplDocumentController.showEdit);
router.post('/:id', requireAuth, requireAdmin, upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'file', maxCount: 1 }]), checkUploads, rplDocumentController.update);
router.post('/:id/delete', requireAuth, requireAdmin, rplDocumentController.destroy);

module.exports = router;
