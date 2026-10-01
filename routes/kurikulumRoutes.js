const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const kurikulumController = require('../controllers/kurikulumController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'kurikulum');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'file' && file.mimetype !== 'application/pdf') return cb(fileError('File kurikulum harus berupa PDF.'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });
const uploadFile = upload.fields([{ name: 'file', maxCount: 1 }]);

router.use(requireAuth, requireAdmin);

router.get('/', kurikulumController.list);
router.get('/new', kurikulumController.showCreate);
router.post('/', uploadFile, checkUploads, kurikulumController.create);
router.get('/:id/edit', kurikulumController.showEdit);
router.post('/:id', uploadFile, checkUploads, kurikulumController.update);
router.post('/:id/delete', kurikulumController.destroy);

module.exports = router;
