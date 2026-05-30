const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

// Initialize Queues
const notificationQueue = new Queue('notifications', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  }
});

const reportQueue = new Queue('reports', { connection: redisConnection });
const analyticsQueue = new Queue('analytics', { connection: redisConnection });

module.exports = {
  notificationQueue,
  reportQueue,
  analyticsQueue
};
