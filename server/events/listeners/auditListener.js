const { eventBus, EVENTS } = require('../eventBus');
const { logActivity, SEVERITY } = require('../../services/auditService');
const logger = require('../../utils/logger');

const initAuditListeners = () => {
  // 1. Payment Success Audit
  eventBus.on(EVENTS.PAYMENT_SUCCESS, async (data) => {
    const isCustom = data.pricingType === 'CUSTOM';
    
    await logActivity({
      gymId: data.gymId,
      userId: null, 
      action: isCustom ? 'CUSTOM_PAYMENT_AUTHORIZED' : 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      entityId: data.paymentId,
      details: { 
        amount: data.amount, 
        memberId: data.memberId,
        pricingType: data.pricingType,
        discountAmount: data.discountAmount 
      },
      severity: isCustom ? SEVERITY.WARN : SEVERITY.INFO
    });
  });

  // 2. Member Created Audit
  eventBus.on(EVENTS.MEMBER_CREATED, async (data) => {
    await logActivity({
      gymId: data.gymId,
      userId: null,
      action: 'MEMBER_REGISTERED',
      entityType: 'MEMBER',
      entityId: data.member.id,
      details: { name: data.member.name, phone: data.member.phone },
      severity: SEVERITY.INFO
    });
  });

  // 3. Attendance Audit
  eventBus.on(EVENTS.ATTENDANCE_RECORDED, async (data) => {
    await logActivity({
      gymId: data.gymId,
      userId: null,
      action: 'ATTENDANCE_CHECKIN',
      entityType: 'MEMBER',
      entityId: data.memberId,
      details: { attendanceId: data.attendance.id },
      severity: SEVERITY.INFO
    });
  });

  // 4. Expiry Audit
  eventBus.on(EVENTS.MEMBERSHIP_EXPIRED, async (data) => {
    await logActivity({
      gymId: data.gymId,
      userId: null,
      action: 'MEMBERSHIP_EXPIRED',
      entityType: 'MEMBER',
      entityId: data.memberId,
      details: { memberName: data.memberName },
      severity: SEVERITY.WARN
    });
  });

  logger.info('Audit Listeners Initialized.');
};

module.exports = initAuditListeners;
