const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads } = require('../utils/upload');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profiles');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = safeFilename(file.originalname);
    cb(null, `${Date.now()}-${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Foto profil harus berupa gambar PNG/JPG/WEBP.'));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const profilePhotoUpload = (req, res, next) => {
  upload.single('profilePhoto')(req, res, err => {
    if (!err) return checkUploads(req, res, next);

    return res.status(400).render('admin/profile/edit', {
      title: 'Edit Profil',
      user: req.user,
      values: {
        name: req.body && req.body.name ? req.body.name : (req.user && req.user.name ? req.user.name : ''),
        email: req.body && req.body.email ? req.body.email : (req.user && req.user.email ? req.user.email : ''),
        profilePhoto: req.user && req.user.profilePhoto ? req.user.profilePhoto : '',
      },
      profile: req.user,
      error: err.message || 'Gagal mengunggah foto profil.',
    });
  });
};

router.get('/login', authController.getLogin);
router.get('/profile', requireAuth, authController.getProfile);
router.get('/profile/edit', requireAuth, authController.getEditProfile);
router.post('/profile/edit', requireAuth, profilePhotoUpload, authController.updateProfile);
router.get('/profile/password', requireAuth, authController.getChangePassword);
router.post('/profile/password', requireAuth, authController.updatePassword);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;
