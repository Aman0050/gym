const express = require('express');
const router = express.Router();
const { getFAQs, createTicket, getTickets } = require('../controllers/supportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/faqs', protect, getFAQs);
router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getTickets);

module.exports = router;
