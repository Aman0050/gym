const attendanceService = require('../services/attendanceService');
const logger = require('../utils/logger');

const recordAttendance = async (req, res) => {
  const { memberId } = req.body;
  const gymId = req.user.gym_id;

  try {
    const { member, attendance } = await attendanceService.recordAttendance(memberId, gymId);
    
    res.status(201).json({
      success: true,
      message: `Welcome, ${member.name}!`,
      attendance
    });
  } catch (error) {
    logger.error('Check-in error:', error);
    res.status(400).json({ 
      error: error.message,
      isBlocked: error.isBlocked || false,
      memberData: error.memberData || null
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
