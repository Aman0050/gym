const express = require('express');
const router = express.Router();
const { getPlans, createPlan, deletePlan } = require('../controllers/planController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', protect, getPlans);
router.post('/', protect, adminOnly, createPlan);
router.delete('/:id', protect, adminOnly, deletePlan);

module.exports = router;
