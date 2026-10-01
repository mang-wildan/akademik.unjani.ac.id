const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const facultyController = require('../controllers/facultyController');

const router = express.Router();

router.get('/', requireAuth, requireAdmin, facultyController.list);
router.get('/new', requireAuth, requireAdmin, facultyController.showCreate);
router.post('/', requireAuth, requireAdmin, facultyController.create);
router.get('/:id/edit', requireAuth, requireAdmin, facultyController.showEdit);
router.post('/:id', requireAuth, requireAdmin, facultyController.update);
router.post('/:id/delete', requireAuth, requireAdmin, facultyController.destroy);

module.exports = router;
