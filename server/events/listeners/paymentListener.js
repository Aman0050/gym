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

      // Trigger Unified Notification (In-App + WhatsApp Mock)
      const { notify } = require('../../services/notificationService');
      await notify({
        gymId,
        memberId,
        templateKey: 'PAYMENT_CONFIRMED',
        data: { 
          memberName: memberName || 'Member', 
          amount, 
          validUntil: 'Next Month', // Dynamic calculation usually happens before emitting
          gymName: 'Your Gym' 
        },
        channels: ['IN_APP', 'WHATSAPP']
      });

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
