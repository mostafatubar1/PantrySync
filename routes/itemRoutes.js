const router = require('express').Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, itemController.dashboard);

router.post('/items',protect, itemController.create);
router.post('/items/:id/update', protect, itemController.update);
router.post('/items/:id/delete', protect, itemController.remove);

router.put('/api/items/:id',    protect, itemController.update);
router.delete('/api/items/:id', protect, itemController.remove);

router.get('/api/foods', protect, itemController.foods);

module.exports = router;