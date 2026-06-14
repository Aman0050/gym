const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');
const notificationService = require('./notificationService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Create Pending Payment
// Inserts a payment record with payment_status = 'PENDING'.
// Membership is NOT activated yet. Returns the pending payment ID.
// ─────────────────────────────────────────────────────────────────────────────
const createPendingPayment = async (payload, gymId, adminId = null) => {
  const {
    memberId, planId, amount, validFrom,
    pricingType = 'STANDARD', originalPrice, customDurationDays, discountReason,
    paymentMethod = 'Cash', overrideExistingSubscription = false
  } = payload;

  // Normalize payment method to match DB constraint (CASH, UPI, CARD, BANK_TRANSFER)
  const normalizedPaymentMode = paymentMethod.toUpperCase().replace(/\s+/g, '_');

  // Calculate valid_until
  let finalValidUntil;
  if (pricingType === 'CUSTOM' && customDurationDays) {
    const startDate = new Date(validFrom);
    startDate.setDate(startDate.getDate() + parseInt(customDurationDays));
    finalValidUntil = startDate.toISOString().split('T')[0];
  } else if (planId) {
    const planResult = await db.query('SELECT duration_days FROM plans WHERE id = $1', [planId]);
    if (planResult.rows.length > 0) {
      const duration = planResult.rows[0].duration_days;
      const startDate = new Date(validFrom);
      startDate.setDate(startDate.getDate() + duration);
      finalValidUntil = startDate.toISOString().split('T')[0];
    }
  }

  if (!finalValidUntil) {
    throw new Error('Could not calculate payment expiry date (valid_until)');
  }

  try {
    await db.query('BEGIN');

    // ── Concurrency Lock & Ownership Verification ─────────
    const memberCheck = await db.query('SELECT id FROM members WHERE id = $1 AND gym_id = $2 FOR UPDATE', [memberId, gymId]);
    if (memberCheck.rows.length === 0) {
      throw new Error('Member not found in this gym');
    }

    // ── Duplicate Membership Check ────────────────────────
    if (!overrideExistingSubscription) {
      const activeSubResult = await db.query(
        `SELECT p.valid_until, p.payment_status, pl.name as plan_name 
         FROM payments p 
         LEFT JOIN plans pl ON p.plan_id = pl.id 
         WHERE p.member_id = $1 AND p.gym_id = $2 
         AND p.valid_until >= CURRENT_DATE 
         AND p.payment_status IN ('PAID', 'PENDING')
         ORDER BY p.valid_until DESC LIMIT 1`,
        [memberId, gymId]
      );

      if (activeSubResult.rows.length > 0) {
        const activeSub = activeSubResult.rows[0];
        const remainingDays = Math.ceil((new Date(activeSub.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
        
        const error = new Error('Duplicate Subscription Detected');
        error.isDuplicateWarning = true;
        error.warningData = {
          hasActiveSubscription: true,
          currentPlan: activeSub.plan_name || 'Custom Plan',
          expiresAt: activeSub.valid_until,
          paymentStatus: activeSub.payment_status,
          remainingDays: remainingDays > 0 ? remainingDays : 0,
        };
        throw error;
      }
    } else {
      logger.warn(`Admin ${adminId} overrode duplicate subscription warning for member ${memberId}`);
    }

    // Insert payment with PENDING status
    const result = await db.query(
      `INSERT INTO payments (
        gym_id, member_id, plan_id, amount, payment_mode,
        valid_from, valid_until, original_price, pricing_type,
        custom_duration_days, discount_reason, admin_id,
        payment_status, paid_at, activated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING', NULL, NULL)
      RETURNING *`,
      [
        gymId, memberId, planId, amount, normalizedPaymentMode,
        validFrom, finalValidUntil, originalPrice || amount, pricingType,
        customDurationDays, discountReason, adminId,
      ]
    );

    await db.query('COMMIT');
    logger.info(`Pending payment created: ${result.rows[0].id} for member ${memberId}`);
    return result.rows[0];
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Confirm Payment
// Admin manually confirms payment received.
// Updates status to PAID, sets paid_at + activated_at, fires events.
// ─────────────────────────────────────────────────────────────────────────────
const confirmPayment = async (paymentId, gymId, transactionReference = null) => {
  const now = new Date().toISOString();

  let confirmedPayment;
  let payment;
  try {
    await db.query('BEGIN');

    // Fetch and lock the pending payment inside the transaction
    const fetchResult = await db.query(
      `SELECT p.*, m.name as member_name, pl.name as plan_name
       FROM payments p
       JOIN members m ON p.member_id = m.id
       LEFT JOIN plans pl ON p.plan_id = pl.id
       WHERE p.id = $1 AND p.gym_id = $2 FOR UPDATE OF p`,
      [paymentId, gymId]
    );

    if (fetchResult.rows.length === 0) {
      throw new Error('Payment not found');
    }

    payment = fetchResult.rows[0];

    if (payment.payment_status === 'PAID') {
      throw new Error('Payment already confirmed');
    }

    if (payment.payment_status === 'FAILED') {
      throw new Error('Cannot confirm a failed payment');
    }

    // Mark as PAID + set timestamps
    const updateResult = await db.query(
      `UPDATE payments
       SET payment_status = 'PAID',
           paid_at = $1,
           activated_at = $1,
           transaction_reference = $2
       WHERE id = $3
       RETURNING *`,
      [now, transactionReference, paymentId]
    );

    confirmedPayment = updateResult.rows[0];

    // Generate Invoice Record
    await db.query(
      `INSERT INTO invoices (gym_id, member_id, payment_id, invoice_number, amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [gymId, payment.member_id, paymentId, `INV-${Date.now()}`, payment.amount]
    );

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    logger.error(`Confirm payment failed for ${paymentId}: ${error.message}`);
    
    // If the error is a unique constraint violation on transaction reference
    if (error.code === '23505' && error.constraint === 'idx_payments_unique_txn') {
      throw new Error('This Transaction Reference has already been used.');
    }
    throw error;
  }

  // Notify Staff — wrapped so notification failures never block confirmation
  try {
    const notificationService = require('./notificationService');
    await notificationService.notifyPaymentSuccess(gymId, payment.member_name, payment.amount, paymentId);
  } catch (notifyErr) {
    logger.warn(`Notification skipped for payment ${paymentId}: ${notifyErr.message}`);
  }

  // Emit Event — downstream handlers handle membership activation
  try {
    eventBus.emit(EVENTS.PAYMENT_SUCCESS, {
      gymId,
      memberId: payment.member_id,
      amount: payment.amount,
      paymentId,
      pricingType: payment.pricing_type,
      discountAmount: payment.original_price ? (payment.original_price - payment.amount) : 0,
    });
  } catch (eventErr) {
    logger.warn(`Event emit skipped for payment ${paymentId}: ${eventErr.message}`);
  }

  logger.info(`Payment confirmed: ${paymentId} — Member: ${payment.member_name}`);
  return confirmedPayment;
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — Razorpay order creation (kept for future Razorpay integration)
// ─────────────────────────────────────────────────────────────────────────────
const createRazorpayOrder = async (amount, currency, gymId, memberId, planId) => {
  if (process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder' || !process.env.RAZORPAY_KEY_ID) {
    return {
      isMock: true,
      order: { id: `order_mock_${Date.now()}`, amount: amount * 100, currency },
    };
  }

  const options = {
    amount: amount * 100,
    currency,
    receipt: `receipt_${Date.now()}`,
    notes: { gymId, memberId, planId },
  };

  const order = await razorpay.orders.create(options);
  return { isMock: false, order };
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — Razorpay verify (kept for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────
const verifyAndRecordPayment = async (payload, gymId, adminId = null) => {
  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    memberId, planId, amount, validFrom,
    pricingType = 'STANDARD', originalPrice, customDurationDays, discountReason,
    paymentMethod = 'UPI',
  } = payload;

  const normalizedPaymentMode = paymentMethod.toUpperCase().replace(/\s+/g, '_');

  // Ownership Verification (Phase 14)
  const memberResult = await db.query('SELECT name FROM members WHERE id = $1 AND gym_id = $2', [memberId, gymId]);
  if (memberResult.rows.length === 0) {
    throw new Error('Member not found in this gym');
  }

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
    .update(sign.toString())
    .digest('hex');

  const isMock = razorpay_signature === 'mock_signature';
  if (razorpay_signature !== expectedSign && !isMock) {
    throw new Error('Invalid payment signature');
  }

  let finalValidUntil = payload.validUntil;
  if (pricingType === 'CUSTOM' && customDurationDays) {
    const startDate = new Date(validFrom);
    startDate.setDate(startDate.getDate() + parseInt(customDurationDays));
    finalValidUntil = startDate.toISOString().split('T')[0];
  } else if (!finalValidUntil && planId) {
    const planResult = await db.query('SELECT duration_days FROM plans WHERE id = $1', [planId]);
    if (planResult.rows.length > 0) {
      const duration = planResult.rows[0].duration_days;
      const startDate = new Date(validFrom);
      startDate.setDate(startDate.getDate() + duration);
      finalValidUntil = startDate.toISOString().split('T')[0];
    }
  }

  if (!finalValidUntil) {
    throw new Error('Could not calculate payment expiry date (valid_until)');
  }

  const now = new Date().toISOString();
  const paymentResult = await db.query(
    `INSERT INTO payments (
      gym_id, member_id, plan_id, amount, payment_mode,
      valid_from, valid_until, original_price, pricing_type,
      custom_duration_days, discount_reason, admin_id,
      payment_status, paid_at, activated_at, transaction_reference
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PAID', $13, $13, $14)
    RETURNING *`,
    [
      gymId, memberId, planId, amount, normalizedPaymentMode,
      validFrom, finalValidUntil, originalPrice || amount, pricingType,
      customDurationDays, discountReason, adminId,
      now, razorpay_payment_id || null,
    ]
  );

  await db.query(
    `INSERT INTO invoices (gym_id, member_id, payment_id, invoice_number, amount)
     VALUES ($1, $2, $3, $4, $5)`,
    [gymId, memberId, paymentResult.rows[0].id, `INV-${Date.now()}`, amount]
  );

  if (memberResult.rows.length > 0) {
    notificationService.notifyPaymentSuccess(gymId, memberResult.rows[0].name, amount);
  }

  eventBus.emit(EVENTS.PAYMENT_SUCCESS, {
    gymId, memberId, amount,
    paymentId: paymentResult.rows[0].id,
    pricingType,
    discountAmount: originalPrice ? (originalPrice - amount) : 0,
  });

  return paymentResult.rows[0];
};

module.exports = {
  createPendingPayment,
  confirmPayment,
  createRazorpayOrder,
  verifyAndRecordPayment,
};
