const db = require('../config/db');
const logger = require('../utils/logger');

const SEVERITY = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * Log a system or user activity to the audit database
 */
const logActivity = async ({
  gymId,
  userId,
  action,
  entityType,
  entityId,
  details = {},
  severity = SEVERITY.INFO,
  ipAddress = null
}) => {
  try {
    await db.query(
      `INSERT INTO audit_logs 
       (gym_id, user_id, action, entity_type, entity_id, details, severity, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [gymId, userId, action, entityType, entityId, JSON.stringify(details), severity, ipAddress]
    );
    
    logger.info(`[Audit] ${action} performed on ${entityType} ${entityId || ''}`);
  } catch (error) {
    logger.error(`Failed to write audit log: ${error.message}`);
  }
};

/**
 * Retrieve logs with filtering
 */
const getLogs = async (gymId, filters = {}) => {
  const { action, entityType, severity, limit = 50 } = filters;
  let query = 'SELECT * FROM audit_logs WHERE gym_id = $1';
  const params = [gymId];

  if (action) {
    params.push(action);
    query += ` AND action = $${params.length}`;
  }
  if (entityType) {
    params.push(entityType);
    query += ` AND entity_type = $${params.length}`;
  }
  if (severity) {
    params.push(severity);
    query += ` AND severity = $${params.length}`;
  }

  query += ` ORDER BY created_at DESC LIMIT ${limit}`;
  
  const result = await db.query(query, params);
  return result.rows;
};

module.exports = { logActivity, SEVERITY, getLogs };
