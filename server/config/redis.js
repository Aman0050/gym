const Redis = require('ioredis');
const logger = require('../utils/logger');

// Supports:
//   Production  → REDIS_URL=rediss://... (Upstash TLS URL)
//   Development → falls back to localhost:6379
function createRedisClient() {
  const url = process.env.REDIS_URL;

  const retryStrategy = (times) => {
    if (times > 3) return null; // Stop after 3 fails
    return 10000;               // Retry every 10s
  };

  if (url) {
    // Upstash (or any full Redis URL with TLS)
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

const redisConnection = createRedisClient();

let hasLoggedError = false;
redisConnection.on('error', (err) => {
  if (!hasLoggedError) {
    logger.warn('Infrastructure Alert: Redis is offline. Background workers (Sync/Notifications) are suspended.');
    hasLoggedError = true;
  }
});

redisConnection.on('connect', () => {
  hasLoggedError = false; // reset flag on reconnect
  logger.info('Redis Connected Successfully');
});

module.exports = redisConnection;
