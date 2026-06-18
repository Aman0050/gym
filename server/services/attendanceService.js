const db = require('../config/db');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');
const notificationService = require('./notificationService');

const recordAttendance = async (memberId, gymId) => {
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(memberId);

  let targetFilter = '';
  let params = [];

  if (isUuid) {
    targetFilter = 'id = $1::uuid AND gym_id = $2';
    params = [memberId, gymId];
  } else {
    const normalizedPhone = memberId.toString().replace(/\D/g, '').slice(-10);
    targetFilter = "right(regexp_replace(phone, '\\D', '', 'g'), 10) = $1 AND gym_id = $2";
    params = [normalizedPhone, gymId];
  }

  const result = await db.query(
    `WITH target_member AS (
       SELECT id, name, phone, status, join_date, gym_id,
              freeze_reason_type, freeze_custom_reason, freeze_notes, frozen_at
       FROM members 
       WHERE ${targetFilter}
       LIMIT 1
     ),
     last_payment AS (
       SELECT DISTINCT ON (member_id) member_id, valid_from, valid_until, payment_date as last_payment_date, amount, plan_id
       FROM payments 
       WHERE member_id IN (SELECT id FROM target_member) AND gym_id = $2
       ORDER BY member_id, valid_until DESC
     ),
     attendance_summary AS (
       SELECT 
         tm.id as member_id,
         COUNT(*) FILTER (WHERE check_in_time > NOW() - INTERVAL '30 days') as monthly_visits,
         (SELECT check_in_time FROM attendance WHERE member_id = tm.id AND gym_id = tm.gym_id ORDER BY check_in_time DESC LIMIT 1 OFFSET 1) as prev_visit,
         (SELECT json_agg(h) FROM (SELECT check_in_time FROM attendance WHERE member_id = tm.id AND gym_id = tm.gym_id ORDER BY check_in_time DESC LIMIT 3) h) as history
       FROM target_member tm
       LEFT JOIN attendance a ON tm.id = a.member_id AND a.gym_id = tm.gym_id
       GROUP BY tm.id, tm.gym_id
     ),
     streak_calc AS (
       SELECT count(*) as streak FROM (
         SELECT DISTINCT date_trunc('day', check_in_time) as visit_day
         FROM attendance 
         WHERE member_id IN (SELECT id FROM target_member) AND gym_id = $2
       ) s
     )
     SELECT 
       tm.*,
       lp.valid_from, lp.valid_until, lp.last_payment_date, lp.amount as last_amount, lp.plan_id,
       p.name as plan_name,
       asum.monthly_visits, asum.prev_visit, asum.history,
       sc.streak
     FROM target_member tm
     LEFT JOIN last_payment lp ON tm.id = lp.member_id
     LEFT JOIN plans p ON lp.plan_id = p.id
     LEFT JOIN attendance_summary asum ON tm.id = asum.member_id
     CROSS JOIN streak_calc sc`,
    params
  );

  if (result.rows.length === 0) throw new Error('Member not found');
  const member = result.rows[0];

  // 2. Validation (Frozen/Expired/Pending Payment)
  let blockReason = null;
  let blockCode = null;

  if (member.status === 'FROZEN') {
    const reason = member.freeze_reason_type === 'OTHER' ? member.freeze_custom_reason : member.freeze_reason_type;
    blockReason = `Membership Frozen: ${reason || 'Administrative Hold'}`;
    blockCode = 'FROZEN';
  } else if (!member.valid_until || new Date(member.valid_until) < new Date()) {
    blockReason = 'Membership expired';
    blockCode = 'EXPIRED';
  }

  // Check latest payment status — deny entry if payment is still PENDING
  if (!blockReason) {
    const paymentStatusResult = await db.query(
      `SELECT payment_status FROM payments
       WHERE member_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [member.id]
    );
    if (
      paymentStatusResult.rows.length > 0 &&
      paymentStatusResult.rows[0].payment_status === 'PENDING'
    ) {
      blockReason = 'Payment Pending — Membership not yet activated';
      blockCode = 'PAYMENT_PENDING';
    }
  }

  if (blockReason) {
    if (blockCode !== 'PAYMENT_PENDING') {
      notificationService.notifyFrozenCheckin(gymId, member.name, blockReason);
    }
    const error = new Error(blockReason);
    error.isBlocked = true;
    error.blockCode = blockCode;
    error.memberData = { ...member, error: blockReason };
    throw error;
  }

  // 3. Intelligence Payload
  const intelligence = {
    monthlyVisits: parseInt(member.monthly_visits || 0) + 1,
    streak: parseInt(member.streak || 0) + 1,
    prevVisit: member.prev_visit,
    history: member.history || [],
    alerts: []
  };

  // Generate Smart Alerts
  const daysUntilExpiry = Math.ceil((new Date(member.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry <= 7) intelligence.alerts.push({ type: 'EXPIRY', message: `Membership expiring in ${daysUntilExpiry} days` });
  if (intelligence.monthlyVisits > 20) intelligence.alerts.push({ type: 'VIP', message: 'High attendance: VIP Member' });
  if (new Date(member.join_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) intelligence.alerts.push({ type: 'NEW', message: 'New Member: Welcome!' });

  // 4. Idempotency Check (Prevent duplicate scans within 5 minutes)
  const redisConnection = require('../config/redis');
  if (redisConnection.status === 'ready') {
    const lockKey = `lock:attendance:${gymId}:${member.id}`;
    // SETNX with 10 seconds expiration to prevent race conditions
    const acquired = await redisConnection.set(lockKey, 'locked', 'NX', 'EX', 10);
    if (!acquired) {
      logger.warn(`Idempotency lock triggered: Rapid double-scan blocked for ${member.name}`);
      throw new Error('Please wait before checking in again');
    }
  }

  const recentCheck = await db.query(
    `SELECT * FROM attendance 
     WHERE member_id = $1 AND gym_id = $2 
     AND check_in_time > NOW() - INTERVAL '5 minutes'
     ORDER BY check_in_time DESC
     LIMIT 1`,
    [member.id, gymId]
  );

  if (recentCheck.rows.length > 0) {
    logger.warn(`Duplicate check-in attempt blocked for member ${member.name} (${member.id})`);
    const duplicateError = new Error('Attendance already recorded.');
    duplicateError.isDuplicate = true;
    throw duplicateError;
  }

  // 5. Record Check-in (Using atomic transaction wrapper if needed, but simple INSERT is fine here)
  const insertResult = await db.query(
    'INSERT INTO attendance (gym_id, member_id) VALUES ($1, $2) RETURNING *',
    [gymId, member.id]
  );
  const attendanceRecord = insertResult.rows[0];

  // Invalidate member profile cache (Phase 11)
  const { del } = require('./cacheService');
  await del(gymId, `member_profile:${member.id}`);

  // 5. Emit Realtime Events
  eventBus.emit(EVENTS.ATTENDANCE_RECORDED, {
    gymId,
    memberId: member.id,
    attendance: result.rows[0],
    intelligence
  });

  return { member, attendance: result.rows[0], intelligence };
};

module.exports = { recordAttendance };
