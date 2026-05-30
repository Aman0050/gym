const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');

router.use(protect);
router.use(checkTenantStatus);

router.get('/dashboard', getDashboardStats);

module.exports = router;
