const Redis = require('ioredis');
const logger = require('../utils/logger');

function createQueueRedisClient() {
  const url = process.env.REDIS_QUEUE_URL || process.env.REDIS_URL;

  const retryStrategy = (times) => {
    if (process.env.NODE_ENV === 'production' && times > 5) {
      return null; // Stop after 5 failures in production
    }
    if (process.env.NODE_ENV === 'development' && times > 3) {
      return null; // Stop after 3 failures in development
    }
    return 10000; // Retry every 10s
  };

  if (url) {
    return new Redis(url, {
      maxRetriesPerRequest: null,
      tls: url.startsWith('rediss://') ? {} : undefined,
      retryStrategy,
    });
  }

  // Local development
  return new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    retryStrategy,
  });
}

const queueRedisConnection = createQueueRedisClient();

let hasLoggedError = false;
queueRedisConnection.on('error', (err) => {
  if (!hasLoggedError) {
    logger.warn('Queue Infrastructure Alert: Queue Redis is offline. Background worker queues are suspended.');
    hasLoggedError = true;
  }
});

queueRedisConnection.on('connect', () => {
  hasLoggedError = false; // reset flag on reconnect
  logger.info('Queue Redis Connected Successfully');
});

module.exports = queueRedisConnection;
