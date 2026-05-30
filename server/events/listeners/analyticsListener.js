const { eventBus, EVENTS } = require('../eventBus');
const { incrementStats } = require('../../services/analyticsService');
const logger = require('../../utils/logger');

const initAnalyticsListeners = () => {
  // 1. Member Growth Tracking
  eventBus.on(EVENTS.MEMBER_CREATED, async ({ gymId }) => {
    logger.info(`[Analytics] Incrementing Member Count for Gym ${gymId}`);
    await incrementStats(gymId, { new_members: 1 });
  });

  // 2. Real-time Revenue Tracking
  eventBus.on(EVENTS.PAYMENT_SUCCESS, async ({ gymId, amount }) => {
    logger.info(`[Analytics] Adding ₹${amount} to Daily Revenue for Gym ${gymId}`);
    await incrementStats(gymId, { total_revenue: amount });
  });

  // 3. Live Attendance Trends
  eventBus.on('attendance.recorded', async ({ gymId }) => {
    logger.info(`[Analytics] Incrementing Check-ins for Gym ${gymId}`);
    await incrementStats(gymId, { check_ins: 1 });
  });
};

module.exports = initAnalyticsListeners;
