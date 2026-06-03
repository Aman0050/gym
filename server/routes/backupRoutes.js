const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { protect, superAdminOnly } = require('../middlewares/authMiddleware');

router.get('/status', protect, superAdminOnly, backupController.getBackupStatus);
router.post('/trigger', protect, superAdminOnly, backupController.triggerManualBackup);

module.exports = router;
