const initPaymentListeners = require('./listeners/paymentListener');
const initMemberListeners = require('./listeners/memberListener');
const initAttendanceListeners = require('./listeners/attendanceListener');
const initAuditListeners = require('./listeners/auditListener');
const initAnalyticsListeners = require('./listeners/analyticsListener');
const logger = require('../utils/logger');

const initEvents = () => {
  logger.info('Initializing Event Listeners...');
  
  initPaymentListeners();
  initMemberListeners();
  initAttendanceListeners();
  initAuditListeners();
  initAnalyticsListeners();

  logger.info('Event Listeners Initialized Successfully.');
};

module.exports = initEvents;
