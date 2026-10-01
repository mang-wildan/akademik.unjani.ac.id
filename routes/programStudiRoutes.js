const express = require('express');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const programStudiController = require('../controllers/programStudiController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.includes('csv') && !file.originalname.toLowerCase().endsWith('.csv')) {
      return cb(new Error('File harus berupa CSV'));
    }
    cb(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.get('/', requireAuth, requireAdmin, programStudiController.list);
router.get('/new', requireAuth, requireAdmin, programStudiController.showCreate);
router.post('/', requireAuth, requireAdmin, programStudiController.create);
router.post('/import', requireAuth, requireAdmin, upload.single('file'), programStudiController.importCsv);
router.get('/:id/edit', requireAuth, requireAdmin, programStudiController.showEdit);
router.post('/:id', requireAuth, requireAdmin, programStudiController.update);
router.post('/:id/delete', requireAuth, requireAdmin, programStudiController.destroy);

module.exports = router;
