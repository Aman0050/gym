const { Worker } = require('bullmq');
const redisConnection = require('../config/redis');
const logger = require('../utils/logger');

// Simulate provider logic (would normally be imported)
const providers = {
  EMAIL: async (data) => logger.info(`[Worker] Sent Email to ${data.recipient}`),
  WHATSAPP: async (data) => logger.info(`[Worker] Sent WhatsApp to ${data.recipient}`),
  SMS: async (data) => logger.info(`[Worker] Sent SMS to ${data.recipient}`)
};

const notificationWorker = new Worker('notifications', async (job) => {
  const { channel, recipient, subject, body } = job.data;
  
  logger.info(`Processing Job ${job.id}: ${channel} to ${recipient}`);

  const sendFn = providers[channel];
  if (sendFn) {
    await sendFn({ recipient, subject, body });
  } else {
    throw new Error(`Unsupported channel: ${channel}`);
  }
}, { 
  connection: redisConnection,
  concurrency: 5 // Process 5 notifications in parallel
});

notificationWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed: ${err.message}`);
});

module.exports = notificationWorker;
