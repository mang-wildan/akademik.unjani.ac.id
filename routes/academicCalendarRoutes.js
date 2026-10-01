const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const academicCalendarController = require('../controllers/academicCalendarController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'academic-calendars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === 'file' && file.mimetype !== 'application/pdf') {
    return cb(fileError('File kalender harus berupa PDF.'));
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: DOCUMENT_LIMITS });

router.get('/', requireAuth, requireAdmin, academicCalendarController.list);
router.get('/new', requireAuth, requireAdmin, academicCalendarController.showCreate);
router.post('/', requireAuth, requireAdmin, upload.fields([{ name: 'file', maxCount: 1 }]), academicCalendarController.create);
router.get('/:id/edit', requireAuth, requireAdmin, academicCalendarController.showEdit);
router.post('/:id', requireAuth, requireAdmin, upload.fields([{ name: 'file', maxCount: 1 }]), academicCalendarController.update);
router.post('/:id/delete', requireAuth, requireAdmin, academicCalendarController.destroy);

module.exports = router;
