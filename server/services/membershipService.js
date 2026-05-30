const db = require('../config/db');
const logger = require('../utils/logger');

const STATES = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  FROZEN: 'FROZEN',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED'
};

/**
 * Transition a member to a new state with validation
 */
const transitionTo = async (memberId, newState, gymId) => {
  try {
    const memberResult = await db.query(
      'SELECT id, status FROM members WHERE id = $1 AND gym_id = $2',
      [memberId, gymId]
    );

    if (memberResult.rows.length === 0) throw new Error('Member not found');
    const currentStatus = memberResult.rows[0].status;

    // Define valid transitions (Optional but recommended for strict FSM)
    const validTransitions = {
      [STATES.PENDING]: [STATES.ACTIVE, STATES.CANCELLED],
      [STATES.ACTIVE]: [STATES.EXPIRED, STATES.FROZEN, STATES.CANCELLED],
      [STATES.EXPIRED]: [STATES.ACTIVE, STATES.CANCELLED],
      [STATES.FROZEN]: [STATES.ACTIVE, STATES.CANCELLED],
      [STATES.CANCELLED]: [STATES.PENDING] // Allow re-activation via pending
    };

    if (currentStatus !== newState && !validTransitions[currentStatus]?.includes(newState)) {
      logger.warn(`Invalid state transition attempted: ${currentStatus} -> ${newState}`);
      // return false; // Or throw error depending on strictness
    }

    const result = await db.query(
      'UPDATE members SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newState, memberId]
    );

    logger.info(`Member ${memberId} transitioned to ${newState}`);
    return result.rows[0];
  } catch (error) {
    logger.error(`State transition failed: ${error.message}`);
    throw error;
  }
};

/**
 * Automatically activate membership after payment
 */
const activateAfterPayment = async (memberId, gymId) => {
  return await transitionTo(memberId, STATES.ACTIVE, gymId);
};

/**
 * Background job logic: Expire members whose plans have ended
 */
const runExpiryJob = async () => {
  try {
    logger.info('Running Global Membership Expiry Job...');
    
    // Find members who are ACTIVE but their latest payment validity has passed
    const result = await db.query(`
      UPDATE members m
      SET status = 'EXPIRED', updated_at = NOW()
      FROM (
        SELECT DISTINCT ON (member_id) member_id, valid_until
        FROM payments
        ORDER BY member_id, valid_until DESC
      ) p
      WHERE m.id = p.member_id 
      AND m.status = 'ACTIVE'
      AND p.valid_until < CURRENT_DATE
      RETURNING m.id, m.gym_id, m.name
    `);

    logger.info(`Expiry Job: ${result.rowCount} members moved to EXPIRED state.`);
    
    // Optional: Emit events for each expired member for notifications
    const { eventBus, EVENTS } = require('../events/eventBus');
    result.rows.forEach(member => {
      eventBus.emit(EVENTS.MEMBERSHIP_EXPIRED, {
        gymId: member.gym_id,
        memberId: member.id,
        memberName: member.name
      });
    });

    return result.rowCount;
  } catch (error) {
    logger.error(`Expiry Job Failed: ${error.message}`);
  }
};

/**
 * Detect members who haven't visited in 14 days
 */
const detectInactiveMembers = async () => {
  try {
    logger.info('Running Inactive Member Detection...');
    const result = await db.query(`
      SELECT m.id, m.name, m.gym_id 
      FROM members m
      LEFT JOIN (
        SELECT member_id, MAX(check_in_time) as last_visit
        FROM attendance
        GROUP BY member_id
      ) a ON m.id = a.member_id
      WHERE m.status = 'ACTIVE'
      AND (a.last_visit < CURRENT_DATE - INTERVAL '14 days' OR a.last_visit IS NULL)
      AND m.created_at < CURRENT_DATE - INTERVAL '14 days'
    `);

    const { eventBus, EVENTS } = require('../events/eventBus');
    result.rows.forEach(member => {
      eventBus.emit('member.inactive', {
        gymId: member.gym_id,
        memberId: member.id,
        memberName: member.name
      });
    });

    return result.rowCount;
  } catch (error) {
    logger.error(`Inactive Detection Failed: ${error.message}`);
  }
};

/**
 * Find memberships expiring in exactly 3 days for reminders
 */
const sendRenewalReminders = async () => {
  try {
    logger.info('Scanning for Renewal Reminders (Expiring in 3 days)...');
    const result = await db.query(`
      SELECT m.id, m.name, m.phone, m.gym_id, p.valid_until
      FROM members m
      JOIN (
        SELECT DISTINCT ON (member_id) member_id, valid_until
        FROM payments
        ORDER BY member_id, valid_until DESC
      ) p ON m.id = p.member_id
      WHERE m.status = 'ACTIVE'
      AND p.valid_until = CURRENT_DATE + INTERVAL '3 days'
    `);

    const { eventBus, EVENTS } = require('../events/eventBus');
    result.rows.forEach(member => {
      eventBus.emit('member.reminder_due', {
        gymId: member.gym_id,
        memberId: member.id,
        memberName: member.name,
        expiryDate: member.valid_until
      });
    });

    return result.rowCount;
  } catch (error) {
    logger.error(`Renewal Reminders Failed: ${error.message}`);
  }
};

module.exports = { 
  STATES, 
  transitionTo, 
  activateAfterPayment, 
  runExpiryJob,
  detectInactiveMembers,
  sendRenewalReminders
};
