const { logActivity, SEVERITY } = require('../services/auditService');

const auditMiddleware = (req, res, next) => {
  // We only care about state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalSend = res.send;
    
    // Override res.send to capture the response and log after completion
    res.send = function (body) {
      res.send = originalSend;
      const response = originalSend.call(this, body);

      // Only log if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (req.user) {
          logActivity({
            gymId: req.user.gym_id,
            userId: req.user.id,
            action: `${req.method}_${req.originalUrl.split('/')[2]?.toUpperCase() || 'ACTION'}`,
            entityType: req.originalUrl.split('/')[2]?.toUpperCase() || 'SYSTEM',
            entityId: req.params.id || null,
            details: {
              path: req.originalUrl,
              method: req.method,
              params: req.params,
              // body: req.body // Be careful with logging body (PII/Passwords)
            },
            severity: SEVERITY.INFO,
            ipAddress: req.ip
          });
        }
      }
      
      return response;
    };
  }
  
  next();
};

module.exports = auditMiddleware;
