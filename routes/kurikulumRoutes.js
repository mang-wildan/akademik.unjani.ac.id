const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const kurikulumController = require('../controllers/kurikulumController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'kurikulum');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (file.fieldname === 'cover' && !imageTypes.includes(file.mimetype)) {
    return cb(new Error('Cover harus berupa gambar JPG/PNG.'));
  }
  if (file.fieldname === 'file' && file.mimetype !== 'application/pdf') {
    return cb(new Error('File kurikulum harus berupa PDF.'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

router.get('/', requireAuth, requireAdmin, kurikulumController.list);
router.get('/new', requireAuth, requireAdmin, kurikulumController.showCreate);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  kurikulumController.create
);
router.get('/:id/edit', requireAuth, requireAdmin, kurikulumController.showEdit);
router.post(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  kurikulumController.update
);
router.post('/:id/delete', requireAuth, requireAdmin, kurikulumController.destroy);

module.exports = router;
