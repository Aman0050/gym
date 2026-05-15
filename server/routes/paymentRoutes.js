const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validatorMiddleware');

router.use(protect);
router.use(adminOnly);

// GET /api/payments
router.get('/', getPaymentHistory);

// POST /api/payments/create-order
router.post('/create-order', [
  body('amount').isNumeric().withMessage('Amount is required'),
  body('memberId').isUUID().withMessage('Member ID is required'),
  validate
], createOrder);

// POST /api/payments/verify
router.post('/verify', [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  validate
], verifyPayment);

module.exports = router;
