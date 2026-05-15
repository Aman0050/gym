const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

const createRazorpayOrder = async (amount, currency, gymId, memberId, planId) => {
  // MOCK BYPASS
  if (process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder' || !process.env.RAZORPAY_KEY_ID) {
    return { 
      isMock: true, 
      order: { id: `order_mock_${Date.now()}`, amount: amount * 100, currency } 
    };
  }

  const options = {
    amount: amount * 100,
    currency,
    receipt: `receipt_${Date.now()}`,
    notes: { gymId, memberId, planId }
  };

  const order = await razorpay.orders.create(options);
  return { isMock: false, order };
};

const verifyAndRecordPayment = async (payload, gymId, adminId = null) => {
  const { 
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    memberId, planId, amount, validFrom, 
    pricingType = 'STANDARD', originalPrice, customDurationDays, discountReason 
  } = payload;

  // Signature Verification
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
    .update(sign.toString())
    .digest("hex");

  const isMock = razorpay_signature === 'mock_signature';

  if (razorpay_signature !== expectedSign && !isMock) {
    throw new Error('Invalid payment signature');
  }

  // Calculate Expiry
  let finalValidUntil = payload.validUntil;
  if (pricingType === 'CUSTOM' && customDurationDays) {
    const startDate = new Date(validFrom);
    startDate.setDate(startDate.getDate() + parseInt(customDurationDays));
    finalValidUntil = startDate.toISOString().split('T')[0];
  }

  // Database Transaction
  const paymentResult = await db.query(
    `INSERT INTO payments (
      gym_id, member_id, plan_id, amount, payment_mode, 
      valid_from, valid_until, original_price, pricing_type, 
      custom_duration_days, discount_reason, admin_id
    ) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      gymId, memberId, planId, amount, 'UPI', 
      validFrom, finalValidUntil, originalPrice || amount, pricingType, 
      customDurationDays, discountReason, adminId
    ]
  );

  // Generate Invoice Record
  await db.query(
    `INSERT INTO invoices (gym_id, member_id, payment_id, invoice_number, amount) 
     VALUES ($1, $2, $3, $4, $5)`,
    [gymId, memberId, paymentResult.rows[0].id, `INV-${Date.now()}`, amount]
  );

  // Emit Event
  eventBus.emit(EVENTS.PAYMENT_SUCCESS, {
    gymId, 
    memberId, 
    amount, 
    paymentId: paymentResult.rows[0].id,
    pricingType,
    discountAmount: originalPrice ? (originalPrice - amount) : 0
  });

  return paymentResult.rows[0];
};

module.exports = { createRazorpayOrder, verifyAndRecordPayment };
