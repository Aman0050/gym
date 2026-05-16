const express = require('express');
const router = express.Router();
const { recordAttendance, getDailyAttendance } = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validatorMiddleware');

router.use(protect);
router.use(checkTenantStatus);
router.use(adminOnly);

// POST /api/attendance/check-in
router.post('/check-in', [
  body('memberId').notEmpty().withMessage('Member ID or Phone is required'),
  validate
], recordAttendance);

// GET /api/attendance/today
router.get('/today', getDailyAttendance);

module.exports = router;
