const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Verifies if the given userId exists in the users table.
 */
const checkUserExists = async (userId) => {
  if (!userId) return false;
  try {
    const res = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
    return res.rows.length > 0;
  } catch (err) {
    logger.error(`Error checking user existence: ${err.message}`);
    return false;
  }
};

/**
 * Logs a creation, modification or deletion in the Operations Hub audit trail
 */
const logOperation = async ({
  tenantId,
  userId,
  recordId,
  entityType,
  action,
  changes = {}
}) => {
  try {
    const userExists = await checkUserExists(userId);
    const auditUserId = userExists ? userId : null;

    await db.query(
      `INSERT INTO operations_audit_logs 
       (tenant_id, record_id, entity_type, action, changes, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, recordId, entityType, action, JSON.stringify(changes), auditUserId]
    );
    logger.info(`[Operations Audit] ${action} performed on ${entityType} ${recordId} by User ${auditUserId || 'SYSTEM/BRANCH'}`);
  } catch (error) {
    logger.error(`Failed to write operations audit log: ${error.message}`);
  }
};

/**
 * Computes a simple diff between old and new state objects
 */
const getDiff = (oldState, newState) => {
  const diff = {};
  const allKeys = new Set([...Object.keys(oldState || {}), ...Object.keys(newState || {})]);
  
  // Skip internal system columns from audit diff
  const skipKeys = ['id', 'tenant_id', 'created_at', 'updated_at', 'created_by'];
  
  for (let key of allKeys) {
    if (skipKeys.includes(key)) continue;

    const oldVal = oldState ? oldState[key] : undefined;
    const newVal = newState ? newState[key] : undefined;

    if (String(oldVal) !== String(newVal)) {
      diff[key] = {
        old: oldVal === undefined ? null : oldVal,
        new: newVal === undefined ? null : newVal
      };
    }
  }
  return diff;
};

module.exports = {
  logOperation,
  getDiff,
  checkUserExists
};
