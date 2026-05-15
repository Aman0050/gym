const { eventBus, EVENTS } = require('../eventBus');
const logger = require('../../utils/logger');
const { createInAppNotification } = require('../../services/notificationService');

const initMemberListeners = () => {
  eventBus.on(EVENTS.MEMBER_CREATED, async (data) => {
    const { gymId, member } = data;
    logger.info(`[Event] Member Created: ${member.name} in Gym ${gymId}`);

    try {
      await createInAppNotification(
        gymId,
        null,
        'New Member Joined',
        `${member.name} has registered at your gym.`
      );
    } catch (error) {
      logger.error('Error in Member Created listener:', error);
    }
  });

  // 2. Inactive Member Alert
  eventBus.on('member.inactive', async (data) => {
    const { gymId, memberName } = data;
    logger.info(`[Event] Alerting Gym ${gymId} about inactive member: ${memberName}`);
    await createInAppNotification(
      gymId,
      null,
      'Retention Alert',
      `Member ${memberName} hasn't visited in 14 days. Consider reaching out!`
    );
  });

  // 3. Renewal Reminder Alert
  eventBus.on('member.reminder_due', async (data) => {
    const { gymId, memberName, expiryDate } = data;
    logger.info(`[Event] Sending renewal reminder for ${memberName}`);
    await createInAppNotification(
      gymId,
      null,
      'Renewal Reminder',
      `${memberName}'s membership expires on ${new Date(expiryDate).toLocaleDateString()}. Follow up for renewal.`
    );
  });

  eventBus.on(EVENTS.MEMBERSHIP_EXPIRED, (data) => {
    const { gymId, memberId, memberName } = data;
    logger.info(`[Event] Membership Expired for ${memberName}`);
    // Trigger automated follow-up sequence
  });
};

module.exports = initMemberListeners;
