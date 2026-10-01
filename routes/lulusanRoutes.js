const express = require('express');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const lulusanController = require('../controllers/lulusanController');

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

router.get('/', requireAuth, requireAdmin, lulusanController.list);
router.get('/new', requireAuth, requireAdmin, lulusanController.showCreate);
router.post('/', requireAuth, requireAdmin, lulusanController.create);
router.post('/import', requireAuth, requireAdmin, upload.single('file'), lulusanController.importCsv);
router.get('/:id/edit', requireAuth, requireAdmin, lulusanController.showEdit);
router.post('/:id', requireAuth, requireAdmin, lulusanController.update);
router.post('/:id/delete', requireAuth, requireAdmin, lulusanController.destroy);

module.exports = router;
