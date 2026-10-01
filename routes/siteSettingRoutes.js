const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, fileError } = require('../utils/upload');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const siteSettingController = require('../controllers/siteSettingController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'settings');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = safeFilename(file.originalname);
    cb(null, `${ts}-${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!ok.includes(file.mimetype)) return cb(fileError('Banner harus berupa gambar (PNG/JPG)'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

router.get('/', requireAuth, requireSuperadmin, siteSettingController.show);
router.get('/edit', requireAuth, requireSuperadmin, siteSettingController.editForm);
router.post(
  '/',
  requireAuth,
  requireSuperadmin,
  upload.fields([
    { name: 'bannerRpl', maxCount: 1 },
    { name: 'slideshowImages', maxCount: 10 },
    { name: 'siteLogo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
    { name: 'strukturOrganisasiImage', maxCount: 1 },
  ]),
  checkUploads,
  siteSettingController.update
);

module.exports = router;
