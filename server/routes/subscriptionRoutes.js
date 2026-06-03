const express = require('express');
const router = express.Router();
const { getSubscriptionStatus } = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

// GET /api/subscription/status
router.get('/status', getSubscriptionStatus);

module.exports = router;
