const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log detailed error for internal tracking
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    user: req.user ? req.user.id : 'anonymous'
  });

  // Handle specific DB errors gracefully
  if (err.code === '23505') { // Unique constraint violation
    err.statusCode = 400;
    err.message = 'This record already exists in our system.';
  }

  if (err.code === '23503') { // Foreign key violation
    err.statusCode = 400;
    err.message = 'Related record not found.';
  }

  // Response for production (masking internal stacks)
  if (process.env.NODE_ENV === 'production') {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    }

    // Programming or unknown errors: don't leak details
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Critical system error. Please try again later.'
    });
  }

  // Response for development (full details)
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

module.exports = { errorHandler };
