const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError, isAllowedImage, IMAGE_LIMITS } = require('../utils/upload');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const siteSettingController = require('../controllers/siteSettingController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'settings');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${safeFilename(file.originalname)}`),
});

const fileFilter = (_req, file, cb) => {
  if (!isAllowedImage(file)) return cb(fileError('File harus berupa gambar (JPG/PNG/WEBP).'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: IMAGE_LIMITS });
const uploadFields = upload.fields([{ name: 'favicon', maxCount: 1 }, { name: 'strukturOrganisasiImage', maxCount: 1 }]);

router.use(requireAuth, requireSuperadmin);

router.get('/', siteSettingController.editForm);
router.post('/', uploadFields, checkUploads, siteSettingController.update);
router.post('/quick-links', siteSettingController.addQuickLink);
router.post('/quick-links/:linkId/delete', siteSettingController.deleteQuickLink);

module.exports = router;
