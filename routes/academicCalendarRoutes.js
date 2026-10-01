const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, DOCUMENT_LIMITS } = require('../utils/upload');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const academicCalendarController = require('../controllers/academicCalendarController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'academic-calendars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

// CSV import writes its upload to the same disk storage (not memoryStorage)
// so checkUploads' magic-byte check (which reads file.path) still runs; the
// controller deletes the temp file right after reading it.
const pdfFilter = fieldName => (_req, file, cb) => {
  if (file.fieldname === fieldName && file.mimetype !== 'application/pdf') return cb(fileError('File harus berupa PDF.'));
  cb(null, true);
};
const csvFilter = (_req, file, cb) => {
  if (file.fieldname === 'csv' && !/\.csv$/i.test(file.originalname || '')) return cb(fileError('File harus berupa CSV.'));
  cb(null, true);
};

const uploadSK = multer({ storage, fileFilter: pdfFilter('file'), limits: DOCUMENT_LIMITS });
const uploadLampiran = multer({ storage, fileFilter: pdfFilter('lampiran'), limits: DOCUMENT_LIMITS });
const uploadCsv = multer({ storage, fileFilter: csvFilter, limits: DOCUMENT_LIMITS });

router.use(requireAuth, requireAdmin);

router.get('/', academicCalendarController.list);
router.get('/template.csv', academicCalendarController.downloadTemplate);
router.get('/new', academicCalendarController.showCreate);
router.post('/', uploadSK.fields([{ name: 'file', maxCount: 1 }]), checkUploads, academicCalendarController.create);
router.get('/:id/edit', academicCalendarController.showEdit);
router.post('/:id', uploadSK.fields([{ name: 'file', maxCount: 1 }]), checkUploads, academicCalendarController.update);
router.post('/:id/delete', academicCalendarController.destroy);

router.post('/:id/events', academicCalendarController.addEvent);
router.post('/:id/events/import', uploadCsv.fields([{ name: 'csv', maxCount: 1 }]), checkUploads, academicCalendarController.importEvents);
router.post('/:id/events/:eventId/delete', academicCalendarController.deleteEvent);

router.post('/:id/lampiran', uploadLampiran.fields([{ name: 'lampiran', maxCount: 1 }]), checkUploads, academicCalendarController.addLampiran);
router.post('/:id/lampiran/:lampiranId/delete', academicCalendarController.deleteLampiran);

module.exports = router;
