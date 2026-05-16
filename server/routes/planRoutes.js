const express = require('express');
const router = express.Router();
const { getPlans, createPlan, deletePlan } = require('../controllers/planController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');

router.use(protect);
router.use(checkTenantStatus);

router.get('/', getPlans);
router.post('/', adminOnly, createPlan);
router.delete('/:id', adminOnly, deletePlan);

module.exports = router;
