const express = require('express');
const router = express.Router();
const operationsReportController = require('../controllers/operationsReportController');
const { protect } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');

// Apply auth/tenant middleware
router.use(protect);
router.use(checkTenantStatus);

// Routes
router.get('/overview', operationsReportController.getOperationsOverview);
router.get('/profit-analytics', operationsReportController.getProfitAnalytics);
router.get('/audit-logs', operationsReportController.getOperationsAuditLogs);
router.get('/export', operationsReportController.exportOperationsData);

module.exports = router;
