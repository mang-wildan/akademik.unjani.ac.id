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
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'sertifikat' && file.mimetype !== 'application/pdf') return cb(fileError('File sertifikat harus berupa PDF.'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });
const uploadSertifikat = upload.fields([{ name: 'sertifikat', maxCount: 1 }]);

router.use(requireAuth, requireAdmin);

router.post('/bulk', accreditationController.bulk);

router.get('/', accreditationController.list);
router.get('/new', accreditationController.showCreate);
router.post('/', uploadSertifikat, checkUploads, accreditationController.create);
router.get('/:id/edit', accreditationController.showEdit);
router.post('/:id', uploadSertifikat, checkUploads, accreditationController.update);
router.post('/:id/delete', accreditationController.destroy);

module.exports = router;
