const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { protect } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');

router.use(protect);
router.use(checkTenantStatus);

router.get('/', globalSearch);

module.exports = router;
