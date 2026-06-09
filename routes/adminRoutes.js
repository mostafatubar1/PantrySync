const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

router.use(requireLogin, requireAdmin);

router.get('/', adminController.renderAdminDashboard);
router.post('/users/:id/delete', adminController.deleteUser);
router.post('/items/:id/delete', adminController.deleteItem);
router.post('/users/:id/toggle-admin', adminController.toggleAdmin);

module.exports = router;
