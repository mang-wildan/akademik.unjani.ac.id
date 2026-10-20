const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { safeFilename, checkUploads, uploadErrorMessage } = require('../utils/upload');
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

// Upload problems (wrong type, > 2 MB, forged content) are shown on the edit
// form itself, with what the user typed, instead of the generic error page.
const uploadErrorText = err => {
  if (err.code === 'LIMIT_FILE_SIZE') return 'Ukuran foto profil maksimal 2 MB.';
  if (err instanceof multer.MulterError) return uploadErrorMessage(err);
  return err.message || 'Gagal mengunggah foto profil.';
};

const profilePhotoUpload = (req, res, next) => {
  const showError = err => {
    const body = req.body || {};
    const values = {
      name: String(body.name !== undefined ? body.name : req.user.name || ''),
      email: String(body.email !== undefined ? body.email : req.user.email || ''),
      removeProfilePhoto: String(body.removeProfilePhoto || '') === '1',
    };
    return authController.renderEditProfile(req, res, { values, errors: { profilePhoto: uploadErrorText(err) } }, 422);
  };
  upload.single('profilePhoto')(req, res, err => {
    if (err) return showError(err);
    return checkUploads(req, res, checkErr => (checkErr ? showError(checkErr) : next()));
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
