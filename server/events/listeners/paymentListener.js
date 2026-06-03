const { eventBus, EVENTS } = require('../eventBus');
const logger = require('../../utils/logger');
const { createInAppNotification, sendWhatsAppMock } = require('../../services/notificationService');
const { activateAfterPayment } = require('../../services/membershipService');

const initPaymentListeners = () => {
  // 1. Notification & State Transition Listener
  eventBus.on(EVENTS.PAYMENT_SUCCESS, async (data) => {
    const { gymId, memberId, amount, memberName } = data;
    logger.info(`[Event] Processing Payment Success for Member ${memberId}`);

    try {
      // Transition state to ACTIVE
      await activateAfterPayment(memberId, gymId);

      // Trigger Unified Notification
      const { createNotification } = require('../../services/notificationService');
      await createNotification({
        gymId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Confirmed',
        message: `${memberName || 'Member'} paid ₹${amount}.`,
        priority: 'NORMAL',
        actionUrl: `/payments?highlight=${data.paymentId || ''}`
      });

      // Auto-Record Attendance on Payment (Convenience for front-desk flows)
      const { recordAttendance } = require('../../services/attendanceService');
      try {
        await recordAttendance(memberId, gymId);
        logger.info(`Auto check-in successful for member ${memberId} after payment.`);
      } catch (err) {
        logger.warn(`Auto check-in skipped: ${err.message}`);
      }

    } catch (error) {
      logger.error('Error in Payment Success listener:', error);
    }
  });

  // 2. Analytics Listener (Example: Invalidate cache or update real-time dashboard)
  eventBus.on(EVENTS.PAYMENT_SUCCESS, (data) => {
    logger.info(`[Event] Refreshing Revenue Analytics for Gym ${data.gymId}`);
    // Here you would call a caching service or a WebSocket emitter
  });
};

module.exports = initPaymentListeners;
