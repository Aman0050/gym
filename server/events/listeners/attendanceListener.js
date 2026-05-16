const { eventBus, EVENTS } = require('../eventBus');
const logger = require('../../utils/logger');

const initAttendanceListeners = () => {
  eventBus.on(EVENTS.ATTENDANCE_RECORDED, (data) => {
    const { gymId, memberId, attendance } = data;
    logger.info(`[Event] Attendance Recorded for Member ${memberId} at Gym ${gymId}`);
    
    // Future: Check if member is visiting after a long gap and send "Welcome Back" message
  });
};

module.exports = initAttendanceListeners;
