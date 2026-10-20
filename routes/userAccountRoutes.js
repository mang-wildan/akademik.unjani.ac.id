const express = require('express');
const { requireAuth, requireSuperadmin } = require('../middleware/authMiddleware');
const userAccountController = require('../controllers/userAccountController');

const router = express.Router();

router.use(requireAuth, requireSuperadmin);

router.get('/', userAccountController.list);
router.get('/new', userAccountController.showCreate);
router.post('/', userAccountController.create);
router.post('/bulk', userAccountController.bulk);
router.get('/:id/edit', userAccountController.showEdit);
router.post('/:id', userAccountController.update);
router.get('/:id/reset-password', userAccountController.resetPasswordForm);
router.post('/:id/reset-password', userAccountController.resetPassword);
router.post('/:id/delete', userAccountController.destroy);

module.exports = router;
