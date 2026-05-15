const db = require('../config/db');
const logger = require('../utils/logger');
const { eventBus, EVENTS } = require('../events/eventBus');

const recordAttendance = async (memberId, gymId) => {
  // 1. Fetch member by UUID OR Phone
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);
  
  const memberResult = await db.query(
    `SELECT m.*, p.valid_until 
     FROM members m 
     LEFT JOIN (
       SELECT member_id, MAX(valid_until) as valid_until 
       FROM payments 
       GROUP BY member_id
     ) p ON m.id = p.member_id 
     WHERE (m.id::text = $1 OR m.phone = $1) AND m.gym_id = $2`,
    [memberId, gymId]
  );

  if (memberResult.rows.length === 0) throw new Error('Member not found');
  
  const member = memberResult.rows[0];

  // 2. State Validation
  if (member.status === 'FROZEN') throw new Error('Membership is frozen');
  if (member.status === 'CANCELLED') throw new Error('Membership is cancelled');
  
  // 3. Expiry Validation
  if (!member.valid_until || new Date(member.valid_until) < new Date()) {
    throw new Error('Membership has expired');
  }

  // 4. Record check-in
  const result = await db.query(
    'INSERT INTO attendance (gym_id, member_id) VALUES ($1, $2) RETURNING *',
    [gymId, member.id]
  );

  // 5. Emit Event
  eventBus.emit(EVENTS.ATTENDANCE_RECORDED, { 
    gymId, memberId: member.id, attendance: result.rows[0] 
  });

  return { member, attendance: result.rows[0] };
};

module.exports = { recordAttendance };
