const express = require('express');
const router = express.Router();
const { getGyms, createGym, updateGymStatus, getGlobalAnalytics } = require('../controllers/gymController');
const { protect, superAdminOnly } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(superAdminOnly);

// GET /api/gyms
router.get('/', getGyms);

// POST /api/gyms
router.post('/', createGym);

// PATCH /api/gyms/:id/status
router.patch('/:id/status', updateGymStatus);

// GET /api/gyms/analytics/global
router.get('/analytics/global', getGlobalAnalytics);

module.exports = router;
