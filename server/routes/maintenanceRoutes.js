const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { protect } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');
const upload = require('../middlewares/fileUploadMiddleware');

// Apply auth/tenant middleware
router.use(protect);
router.use(checkTenantStatus);

// Maintenance routes
router.get('/', maintenanceController.getMaintenanceLogs);
router.post('/', upload.single('invoice'), maintenanceController.createMaintenanceLog);

module.exports = router;
