const express = require('express');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const facultyController = require('../controllers/facultyController');

const router = express.Router();

router.use(requireAuth, requireSuperadmin);

router.get('/', facultyController.list);
router.get('/new', facultyController.showCreate);
router.post('/', facultyController.create);
router.post('/bulk', facultyController.bulk);
router.get('/:id/edit', facultyController.showEdit);
router.post('/:id', facultyController.update);
router.post('/:id/delete', facultyController.destroy);

module.exports = router;
