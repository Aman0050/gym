const db = require('../config/db');
const logger = require('../utils/logger');
const { eventBus } = require('../events/eventBus');

const NOTIFICATION_TYPES = {
  PAYMENT_SUCCESS:  'PAYMENT_SUCCESS',
  PLAN_EXPIRING:    'PLAN_EXPIRING',
  MEMBER_FROZEN:    'MEMBER_FROZEN',
  ATTENDANCE_ALERT: 'ATTENDANCE_ALERT',
  STAFF_ACTIVITY:   'STAFF_ACTIVITY',
  SYSTEM_WARNING:   'SYSTEM_WARNING',
  SYNC_FAILURE:     'SYNC_FAILURE'
};

/**
 * Core Notification Dispatcher
 */
const createNotification = async ({ gymId, type, title, message, priority = 'NORMAL', actionUrl = null }) => {
  try {
    const result = await db.query(
      `INSERT INTO notifications (gym_id, type, title, message, priority, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [gymId, type, title, message, priority, actionUrl]
    );

    const notification = result.rows[0];
    
    // Emit for Socket.io bridge
    eventBus.emit('notification.created', {
      gymId,
      notification
    });

    return notification;
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
    return null;
  }
};

/**
 * Utility: Notify on Payment Success
 */
const notifyPaymentSuccess = async (gymId, memberName, amount) => {
  return createNotification({
    gymId,
    type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
    title: 'Payment Received',
    message: `Revenue boost! ${memberName} paid ₹${amount.toLocaleString('en-IN')}.`,
    priority: 'NORMAL',
    actionUrl: '/payments'
  });
};

/**
 * Utility: Notify on Frozen Check-in
 */
const notifyFrozenCheckin = async (gymId, memberName, reason) => {
  return createNotification({
    gymId,
    type: NOTIFICATION_TYPES.MEMBER_FROZEN,
    title: 'Frozen Access Attempt',
    message: `${memberName} attempted to check-in but is currently frozen (${reason}).`,
    priority: 'HIGH',
    actionUrl: '/attendance'
  });
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  notifyPaymentSuccess,
  notifyFrozenCheckin
};
