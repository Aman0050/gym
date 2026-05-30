const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');

router.use(protect);
router.use(checkTenantStatus);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
