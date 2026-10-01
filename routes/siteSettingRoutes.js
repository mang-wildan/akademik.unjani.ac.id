const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const siteSettingController = require('../controllers/siteSettingController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'settings');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${ts}-${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!ok.includes(file.mimetype)) return cb(new Error('Banner harus berupa gambar (PNG/JPG)'));
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

router.get('/', requireAuth, requireAdmin, siteSettingController.show);
router.get('/edit', requireAuth, requireAdmin, siteSettingController.editForm);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.fields([
    { name: 'bannerRpl', maxCount: 1 },
    { name: 'slideshowImages', maxCount: 10 },
    { name: 'siteLogo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
    { name: 'strukturOrganisasiImage', maxCount: 1 },
  ]),
  siteSettingController.update
);

module.exports = router;
