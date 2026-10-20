const express = require('express');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const kategoriController = require('../controllers/kategoriController');

const router = express.Router();

router.use(requireAuth, requireSuperadmin);

router.get('/', kategoriController.list);
router.get('/new', kategoriController.showCreate);
router.post('/', kategoriController.create);
router.post('/bulk', kategoriController.bulk);
router.get('/:id/edit', kategoriController.showEdit);
router.post('/:id', kategoriController.update);
router.post('/:id/delete', kategoriController.destroy);

module.exports = router;
