const EventEmitter = require('events');

class GymEventBus extends EventEmitter {}

// Singleton instance
const eventBus = new GymEventBus();

// Event Names Constants
const EVENTS = {
  PAYMENT_SUCCESS: 'payment.success',
  MEMBER_CREATED: 'member.created',
  ATTENDANCE_RECORDED: 'attendance.recorded',
  MEMBERSHIP_EXPIRED: 'membership.expired',
  GYM_SUSPENDED: 'gym.suspended'
};

module.exports = { eventBus, EVENTS };
