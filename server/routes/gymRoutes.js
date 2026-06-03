const express = require('express');
const router = express.Router();
const { getGyms, createGym, updateGymStatus, getGlobalAnalytics, createGymAccount, checkGymIdAvailability, assignManager, getGymDetails, updateGym, notifyGym } = require('../controllers/gymController');
const { protect, superAdminOnly } = require('../middlewares/authMiddleware');
const { validateUuidParamMiddleware } = require('../middlewares/validateMiddleware');

router.param('id', validateUuidParamMiddleware);

// ── Public routes (no auth — called during onboarding flow) ──────────────────
// POST /api/gym/create-account
router.post('/create-account', createGymAccount);

// GET /api/gym/check-id?gym_id=xxx  (real-time availability check)
router.get('/check-id', checkGymIdAvailability);

// ── Protected routes (Super Admin only) ──────────────────────────────────────
router.use(protect);
router.use(superAdminOnly);

// GET /api/gyms
router.get('/', getGyms);

// GET /api/gyms/:id/details
router.get('/:id/details', getGymDetails);

// POST /api/gyms
router.post('/', createGym);

// PUT /api/gyms/:id
router.put('/:id', updateGym);

// PATCH /api/gyms/:id/status
router.patch('/:id/status', updateGymStatus);

// PATCH /api/gyms/:id/manager
router.patch('/:id/manager', assignManager);

// POST /api/gyms/:id/notify
router.post('/:id/notify', notifyGym);

// PUT /api/gyms/:id/status (Alias for backward compatibility)
router.put('/:id/status', updateGymStatus);

// GET /api/gyms/analytics/global
router.get('/analytics/global', getGlobalAnalytics);

module.exports = router;
