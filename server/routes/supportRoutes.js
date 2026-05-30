const express = require('express');
const router = express.Router();
const { getFAQs, createTicket, getTickets, adminGetTickets, adminGetTicketDetails, adminUpdateTicket } = require('../controllers/supportController');
const { protect, superAdminOnly } = require('../middlewares/authMiddleware');

router.get('/faqs', protect, getFAQs);
router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getTickets);

// Super Admin Routes
router.get('/admin/tickets', protect, superAdminOnly, adminGetTickets);
router.get('/admin/tickets/:id', protect, superAdminOnly, adminGetTicketDetails);
router.patch('/admin/tickets/:id', protect, superAdminOnly, adminUpdateTicket);

module.exports = router;
