const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Protect routes - verifies access token and attaches user to req
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn(`Authorization denied: No token provided for path ${req.originalUrl}`);
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Token verification failed for path ${req.originalUrl}: ${error.message}`, { 
      token: token.substring(0, 10) + '...',
      error: error.message,
      name: error.name
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

/**
 * Role-based access control (RBAC) middleware factory
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Authorization denied: Role ${req.user.role} is not authorized for path ${req.originalUrl}`, {
        userId: req.user.id,
        requiredRoles: roles
      });
      return res.status(403).json({ 
        error: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

// Convenience middleware
const superAdminOnly = authorize('SUPER_ADMIN');
const adminOnly = authorize('ADMIN', 'SUPER_ADMIN');

module.exports = { protect, authorize, superAdminOnly, adminOnly };
