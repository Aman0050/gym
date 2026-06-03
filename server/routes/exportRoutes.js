const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { protect, superAdminOnly } = require('../middlewares/authMiddleware');

router.get('/payments', protect, superAdminOnly, exportController.exportPayments);
router.get('/attendance', protect, superAdminOnly, exportController.exportAttendance);
router.get('/subscriptions', protect, superAdminOnly, exportController.exportSubscriptions);

module.exports = router;
