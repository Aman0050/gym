const db = require('../config/db');
const logger = require('../utils/logger');
const { compileTemplate } = require('./notificationTemplates');
const { notificationQueue } = require('../queues/jobQueues');

/**
 * Main Notification Dispatcher (Now with BullMQ)
 */
const notify = async ({ gymId, memberId, templateKey, data, channels = ['IN_APP'] }) => {
  try {
    const { subject, body } = compileTemplate(templateKey, data) || { subject: 'Update', body: 'New update from Gym' };

    for (const channel of channels) {
      if (channel === 'IN_APP') {
        await createInAppNotification(gymId, memberId, subject, body);
      } else {
        // Offload to BullMQ for high reliability and retries
        await notificationQueue.add(`notify-${templateKey}`, {
          gymId,
          channel,
          recipient: data.phone || data.email,
          subject,
          body
        });
        logger.info(`Notification queued for ${channel}: ${templateKey}`);
      }
    }
  } catch (error) {
    logger.error(`Notification Dispatch Failed: ${error.message}`);
  }
};

const createInAppNotification = async (gymId, memberId, title, message, category = 'SYSTEM', metadata = {}) => {
  try {
    const result = await db.query(
      'INSERT INTO notifications (gym_id, member_id, title, message, category, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [gymId, memberId, title, message, category, JSON.stringify(metadata)]
    );
    
    // Also emit for real-time socket delivery
    const { eventBus } = require('../events/eventBus');
    eventBus.emit('notification.created', { 
      gymId, 
      notification: result.rows[0] 
    });

    return result.rows[0];
  } catch (err) {
    logger.error('In-app notification error:', err);
  }
};

module.exports = { 
  notify, 
  createInAppNotification
};
