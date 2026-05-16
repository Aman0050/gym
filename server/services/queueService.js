const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');
const logger = require('../utils/logger');

const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const addNotificationJob = async (data) => {
  try {
    if (redisConnection.status !== 'ready') {
      logger.warn('Redis offline: Notification queued failed');
      return;
    }
    await notificationQueue.add('send-notification', data);
    logger.info(`Notification job queued: ${data.channel} to ${data.recipient}`);
  } catch (err) {
    logger.error('Failed to queue notification:', err);
  }
};

module.exports = {
  addNotificationJob,
  notificationQueue
};
