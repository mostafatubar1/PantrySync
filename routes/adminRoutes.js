const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

router.use(requireLogin, requireAdmin);
router.get('/', adminController.renderAdminDashboard);

module.exports = router;
