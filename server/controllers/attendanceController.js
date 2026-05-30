const attendanceService = require('../services/attendanceService');
const logger = require('../utils/logger');

const recordAttendance = async (req, res) => {
  const { memberId } = req.body;
  const gymId = req.user.gym_id;

  if (!memberId) {
    return res.status(400).json({ error: 'Member ID is required for check-in.' });
  }

  try {
    const { member, attendance, intelligence } = await attendanceService.recordAttendance(memberId, gymId);

    res.status(201).json({
      success: true,
      message: `Welcome, ${member.name}!`,
      member,
      attendance,
      intelligence,
    });
  } catch (error) {
    logger.error('Check-in error:', error.message);

    // Determine the right HTTP status
    const statusCode = error.blockCode === 'PAYMENT_PENDING' ? 402 : 400;

    res.status(statusCode).json({
      error: typeof error.message === 'string' ? error.message : 'Check-in failed',
      isBlocked: error.isBlocked || false,
      blockCode: error.blockCode || null,
      memberData: error.memberData
        ? {
            id: error.memberData.id,
            name: error.memberData.name,
            phone: error.memberData.phone,
            status: error.memberData.status,
            valid_until: error.memberData.valid_until,
            last_payment_date: error.memberData.last_payment_date,
            freeze_notes: error.memberData.freeze_notes,
            freeze_reason_type: error.memberData.freeze_reason_type,
            // Error message as string — NEVER pass the whole error object
            error: typeof error.message === 'string' ? error.message : 'Access denied',
          }
        : null,
    });
  }
};

const getDailyAttendance = async (req, res) => {
  const db = require('../config/db');
  const gymId = req.user.gym_id;
  try {
    const result = await db.query(
      `SELECT a.*, m.name as member_name
       FROM attendance a
       JOIN members m ON a.member_id = m.id
       WHERE a.gym_id = $1 AND a.check_in_time::date = CURRENT_DATE
       ORDER BY a.check_in_time DESC`,
      [gymId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

module.exports = { recordAttendance, getDailyAttendance };
