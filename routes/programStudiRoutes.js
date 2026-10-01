const express = require('express');
const multer = require('multer');
const { checkUploads, fileError } = require('../utils/upload');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const programStudiController = require('../controllers/programStudiController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.includes('csv') && !file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(fileError('File harus berupa CSV'));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.get('/', requireAuth, requireSuperadmin, programStudiController.list);
router.get('/new', requireAuth, requireSuperadmin, programStudiController.showCreate);
router.post('/', requireAuth, requireSuperadmin, programStudiController.create);
router.post('/import', requireAuth, requireSuperadmin, upload.single('file'), checkUploads, programStudiController.importCsv);
router.get('/:id/edit', requireAuth, requireSuperadmin, programStudiController.showEdit);
router.post('/:id', requireAuth, requireSuperadmin, programStudiController.update);
router.post('/:id/delete', requireAuth, requireSuperadmin, programStudiController.destroy);

module.exports = router;
