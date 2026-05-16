const db = require('../config/db');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');
const notificationService = require('./notificationService');

const recordAttendance = async (memberId, gymId) => {
  // 1. Fetch comprehensive member metadata & intelligence in a single high-performance query
  const result = await db.query(
    `WITH target_member AS (
       SELECT id, name, phone, status, join_date, gym_id,
              freeze_reason_type, freeze_custom_reason, freeze_notes, frozen_at
       FROM members 
       WHERE (id::text = $1 OR phone = $1) AND gym_id = $2
       LIMIT 1
     ),
     last_payment AS (
       SELECT DISTINCT ON (member_id) member_id, valid_until, payment_date as last_payment_date, amount, plan_id
       FROM payments 
       WHERE member_id IN (SELECT id FROM target_member)
       ORDER BY member_id, valid_until DESC
     ),
     attendance_summary AS (
       SELECT 
         COUNT(*) FILTER (WHERE check_in_time > NOW() - INTERVAL '30 days') as monthly_visits,
         (SELECT check_in_time FROM attendance WHERE member_id = tm.id ORDER BY check_in_time DESC LIMIT 1 OFFSET 1) as prev_visit,
         (SELECT json_agg(h) FROM (SELECT check_in_time FROM attendance WHERE member_id = tm.id ORDER BY check_in_time DESC LIMIT 3) h) as history
       FROM target_member tm
       LEFT JOIN attendance a ON tm.id = a.member_id
       GROUP BY tm.id
     ),
     streak_calc AS (
       SELECT count(*) as streak FROM (
         SELECT DISTINCT date_trunc('day', check_in_time) as visit_day
         FROM attendance 
         WHERE member_id IN (SELECT id FROM target_member)
       ) s
     )
     SELECT 
       tm.*,
       lp.valid_until, lp.last_payment_date, lp.amount as last_amount, lp.plan_id,
       p.name as plan_name,
       asum.monthly_visits, asum.prev_visit, asum.history,
       sc.streak
     FROM target_member tm
     LEFT JOIN last_payment lp ON tm.id = lp.member_id
     LEFT JOIN plans p ON lp.plan_id = p.id
     LEFT JOIN attendance_summary asum ON tm.id = asum.member_id
     CROSS JOIN streak_calc sc`,
    [memberId, gymId]
  );

  if (result.rows.length === 0) throw new Error('Member not found');
  const member = result.rows[0];

  // 2. Validation (Frozen/Expired)
  let blockReason = null;
  if (member.status === 'FROZEN') {
    const reason = member.freeze_reason_type === 'OTHER' ? member.freeze_custom_reason : member.freeze_reason_type;
    blockReason = `Membership Frozen: ${reason || 'Administrative Hold'}`;
  } else if (!member.valid_until || new Date(member.valid_until) < new Date()) {
    blockReason = 'Membership expired';
  }

  if (blockReason) {
    notificationService.notifyFrozenCheckin(gymId, member.name, blockReason);
    const error = new Error(blockReason);
    error.isBlocked = true;
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

  // 4. Record Check-in (Using atomic transaction wrapper if needed, but simple INSERT is fine here)
  const insertResult = await db.query(
    'INSERT INTO attendance (gym_id, member_id) VALUES ($1, $2) RETURNING *',
    [gymId, member.id]
  );
  const attendanceRecord = insertResult.rows[0];

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
