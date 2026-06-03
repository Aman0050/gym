const express = require('express');
const router = express.Router();
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/planController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');
const { validateUuidParamMiddleware } = require('../middlewares/validateMiddleware');

router.param('id', validateUuidParamMiddleware);

router.use(protect);
router.use(checkTenantStatus);

router.get('/', getPlans);
router.post('/', adminOnly, createPlan);
router.put('/:id', adminOnly, updatePlan);
router.delete('/:id', adminOnly, deletePlan);

module.exports = router;
