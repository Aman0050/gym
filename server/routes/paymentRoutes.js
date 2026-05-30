const express = require('express');
const router = express.Router();
const {
  createPendingPayment,
  confirmPayment,
  createOrder,
  verifyPayment,
  getPaymentHistory,
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { checkTenantStatus } = require('../middlewares/tenantMiddleware');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validatorMiddleware');

router.use(protect);
router.use(checkTenantStatus);
router.use(adminOnly);

// GET /api/payments
router.get('/', getPaymentHistory);

// ─────────────────────────────────────────────────────────────────────────────
// NEW — Enterprise POS Flow
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/payments/create-pending
// Phase 1: Creates a PENDING payment record. No membership activation.
router.post('/create-pending', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('memberId').isUUID().withMessage('Valid member ID is required'),
  body('planId').isUUID().withMessage('Valid plan ID is required'),
  body('validFrom').isDate().withMessage('Valid start date is required'),
  validate,
], createPendingPayment);

// POST /api/payments/confirm/:id
// Phase 2: Admin confirms payment received. Activates membership.
router.post('/confirm/:id', [
  param('id').isUUID().withMessage('Valid payment ID is required'),
  validate,
], confirmPayment);

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — Razorpay Integration (kept for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/payments/create-order
router.post('/create-order', [
  body('amount').isNumeric().withMessage('Amount is required'),
  body('memberId').isUUID().withMessage('Member ID is required'),
  validate,
], createOrder);

// POST /api/payments/verify
router.post('/verify', [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  validate,
], verifyPayment);

module.exports = router;
