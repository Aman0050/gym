const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');

// Apply auth/tenant middleware
router.use(protect);
router.use(checkTenantStatus);

// Inventory routes
router.get('/', inventoryController.getInventory);
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);

// Transaction & History routes
router.post('/transaction', inventoryController.adjustStock);
router.get('/history', inventoryController.getInventoryHistory);

module.exports = router;
