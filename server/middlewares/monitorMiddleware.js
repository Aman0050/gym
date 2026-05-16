const logger = require('../utils/logger');
const Sentry = require('@sentry/node');

/**
 * Performance Monitoring Middleware
 * Tracks request duration and logs high-latency calls
 */
const requestMonitor = (req, res, next) => {
  const start = Date.now();

  // Add metadata to Sentry context
  Sentry.setTag("path", req.originalUrl);
  Sentry.setTag("method", req.method);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      user: req.user ? req.user.id : 'anonymous'
    };

    if (duration > 1000) {
      logger.warn(`[PERF_ALERT] Slow Request: ${req.method} ${req.originalUrl}`, logData);
    } else {
      logger.info(`${req.method} ${req.originalUrl} - ${statusCode}`, logData);
    }
  });

  next();
};

module.exports = { requestMonitor };
