const express = require('express');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const lembagaAkreditasiController = require('../controllers/lembagaAkreditasiController');

const router = express.Router();

router.use(requireAuth, requireSuperadmin);

router.get('/', lembagaAkreditasiController.list);
router.get('/new', lembagaAkreditasiController.showCreate);
router.post('/', lembagaAkreditasiController.create);
router.get('/:id/edit', lembagaAkreditasiController.showEdit);
router.post('/:id', lembagaAkreditasiController.update);
router.post('/:id/delete', lembagaAkreditasiController.destroy);

module.exports = router;
