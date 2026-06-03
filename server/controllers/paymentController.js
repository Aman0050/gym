const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');
const { del } = require('../services/cacheService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-pending
// Phase 1: Create a PENDING payment record. No membership activation yet.
// Returns the pending payment ID for use in Phase 2.
// ─────────────────────────────────────────────────────────────────────────────
const createPendingPayment = async (req, res) => {
  const gymId = req.user.gym_id;
  const { pricingType } = req.body;

  // Security: Only ADMIN can use CUSTOM pricing
  if (pricingType === 'CUSTOM' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only administrators can apply custom pricing' });
  }

  try {
    const payment = await paymentService.createPendingPayment(req.body, gymId, req.user.id);
    
    // Invalidate member profile cache
    if (payment) await del(gymId, `member_profile:${payment.member_id}`);

    res.json({
      success: true,
      message: 'Pending payment created — awaiting confirmation',
      payment,
      paymentId: payment.id,
    });
  } catch (error) {
    if (error.isDuplicateWarning) {
      return res.status(409).json({ error: error.message, ...error.warningData });
    }
    logger.error('Create pending payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to create pending payment' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/confirm/:id
// Phase 2: Admin confirms payment received. Activates membership.
// ─────────────────────────────────────────────────────────────────────────────
const confirmPayment = async (req, res) => {
  const gymId = req.user.gym_id;
  const { id: paymentId } = req.params;
  const { transactionReference } = req.body || {};

  try {
    const payment = await paymentService.confirmPayment(paymentId, gymId, transactionReference);
    
    // Invalidate member profile cache
    if (payment) await del(gymId, `member_profile:${payment.member_id}`);

    res.json({
      success: true,
      message: 'Payment confirmed — membership activated',
      payment,
    });
  } catch (error) {
    logger.error('Confirm payment error:', error);
    const status = error.message === 'Payment not found' ? 404
      : error.message === 'Payment already confirmed' ? 409
      : 500;
    res.status(status).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — Razorpay order creation
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
  const { amount, currency = 'INR', memberId, planId } = req.body;
  const gymId = req.user.gym_id;

  try {
    const result = await paymentService.createRazorpayOrder(amount, currency, gymId, memberId, planId);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — Razorpay payment verification
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  const gymId = req.user.gym_id;
  const { pricingType } = req.body;

  if (pricingType === 'CUSTOM' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only administrators can apply custom pricing' });
  }

  try {
    const payment = await paymentService.verifyAndRecordPayment(req.body, gymId, req.user.id);
    
    // Invalidate member profile cache
    if (payment) await del(gymId, `member_profile:${payment.member_id}`);

    res.json({ success: true, message: 'Payment verified and recorded', payment });
  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(error.message === 'Invalid payment signature' ? 400 : 500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments
// Payment history with payment_status included
// ─────────────────────────────────────────────────────────────────────────────
const getPaymentHistory = async (req, res) => {
  const db = require('../config/db');
  const gymId = req.user.gym_id;
  
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)); // Default to 20, max 100
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  try {
    let whereClause = `WHERE p.gym_id = $1`;
    let queryParams = [gymId, limit, offset];
    let countParams = [gymId];

    if (search) {
      whereClause += ` AND (m.name ILIKE $2 OR m.phone ILIKE $2 OR p.payment_method ILIKE $2)`;
      countParams.push(`%${search}%`);
      queryParams = [gymId, `%${search}%`, limit, offset];
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM payments p JOIN members m ON p.member_id = m.id ${whereClause}`,
      countParams
    );
    const totalRecords = parseInt(countResult.rows[0].total || 0);
    const totalPages = Math.ceil(totalRecords / limit);

    const result = await db.query(
      `SELECT p.*, m.name as member_name, m.phone as member_phone, pl.name as plan_name
       FROM payments p
       JOIN members m ON p.member_id = m.id
       LEFT JOIN plans pl ON p.plan_id = pl.id
       ${whereClause}
       ORDER BY p.payment_date DESC
       LIMIT $${search ? 3 : 2} OFFSET $${search ? 4 : 3}`,
      queryParams
    );

    res.json({
      data: result.rows,
      payments: result.rows, // fallback for legacy safety
      page,
      limit,
      totalPages,
      totalRecords
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

module.exports = { createPendingPayment, confirmPayment, createOrder, verifyPayment, getPaymentHistory };
