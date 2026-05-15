const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);

module.exports = router;
