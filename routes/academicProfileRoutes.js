const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const academicProfileController = require('../controllers/academicProfileController');

const router = express.Router();

router.use(requireAuth, requireAdmin);

// Singleton: satu halaman untuk lihat + ubah, tidak ada daftar.
router.get('/', academicProfileController.editForm);
router.post('/', academicProfileController.update);

module.exports = router;
