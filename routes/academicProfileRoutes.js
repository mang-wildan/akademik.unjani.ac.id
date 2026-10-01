const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const academicProfileController = require('../controllers/academicProfileController');

const router = express.Router();

router.get('/', requireAuth, requireAdmin, academicProfileController.show);
router.get('/edit', requireAuth, requireAdmin, academicProfileController.editForm);
router.post('/', requireAuth, requireAdmin, academicProfileController.update);

module.exports = router;
