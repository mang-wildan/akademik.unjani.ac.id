const express = require('express');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const facultyController = require('../controllers/facultyController');

const router = express.Router();

router.get('/', requireAuth, requireSuperadmin, facultyController.list);
router.get('/new', requireAuth, requireSuperadmin, facultyController.showCreate);
router.post('/', requireAuth, requireSuperadmin, facultyController.create);
router.get('/:id/edit', requireAuth, requireSuperadmin, facultyController.showEdit);
router.post('/:id', requireAuth, requireSuperadmin, facultyController.update);
router.post('/:id/delete', requireAuth, requireSuperadmin, facultyController.destroy);

module.exports = router;
