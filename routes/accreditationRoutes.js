const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const accreditationController = require('../controllers/accreditationController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'accreditations');
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
  if (file.fieldname === 'sertifikat' && file.mimetype !== 'application/pdf') {
    return cb(fileError('File sertifikat harus berupa PDF'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });

router.get('/', requireAuth, requireAdmin, accreditationController.list);
router.get('/new', requireAuth, requireAdmin, accreditationController.showCreate);
router.post('/', requireAuth, requireAdmin, upload.fields([{ name: 'sertifikat', maxCount: 1 }]), checkUploads, accreditationController.create);
router.post('/:id/toggle-active', requireAuth, requireAdmin, accreditationController.toggleActive);
router.get('/:id/edit', requireAuth, requireAdmin, accreditationController.showEdit);
router.post('/:id', requireAuth, requireAdmin, upload.fields([{ name: 'sertifikat', maxCount: 1 }]), checkUploads, accreditationController.update);
router.post('/:id/delete', requireAuth, requireAdmin, accreditationController.destroy);

module.exports = router;
