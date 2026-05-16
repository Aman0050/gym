const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

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

const verifyPayment = async (req, res) => {
  const gymId = req.user.gym_id;
  const { pricingType } = req.body;

  // Security: Only ADMIN can use CUSTOM pricing
  if (pricingType === 'CUSTOM' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only administrators can apply custom pricing' });
  }

  try {
    const payment = await paymentService.verifyAndRecordPayment(req.body, gymId, req.user.id);
    res.json({ success: true, message: 'Payment verified and recorded', payment });
  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(error.message === 'Invalid payment signature' ? 400 : 500).json({ error: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  const db = require('../config/db');
  const gymId = req.user.gym_id;
  try {
    const result = await db.query(
      `SELECT p.*, m.name as member_name, pl.name as plan_name 
       FROM payments p 
       JOIN members m ON p.member_id = m.id 
       LEFT JOIN plans pl ON p.plan_id = pl.id 
       WHERE p.gym_id = $1 
       ORDER BY p.payment_date DESC`,
      [gymId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory };
