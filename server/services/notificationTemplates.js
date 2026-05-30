const TEMPLATES = {
  WELCOME_MEMBER: {
    subject: 'Welcome to {{gymName}}!',
    body: 'Hi {{memberName}}, welcome to the family! We are excited to have you join us at {{location}}.'
  },
  PAYMENT_CONFIRMED: {
    subject: 'Payment Successful - {{gymName}}',
    body: 'Hi {{memberName}}, your payment of ₹{{amount}} has been confirmed. Your membership is valid until {{validUntil}}.'
  },
  MEMBERSHIP_EXPIRED: {
    subject: 'Membership Expired - {{gymName}}',
    body: 'Hi {{memberName}}, your membership has expired. Renew today to continue your fitness journey!'
  },
  INACTIVITY_ALERT: {
    subject: 'We miss you at {{gymName}}!',
    body: 'Hi {{memberName}}, we noticed you haven\'t visited in a while. Is everything okay? We hope to see you back soon!'
  }
};

const compileTemplate = (templateKey, data) => {
  const template = TEMPLATES[templateKey];
  if (!template) return null;

  let { subject, body } = template;
  
  // Simple regex replacement for {{key}}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, data[key]);
    body = body.replace(regex, data[key]);
  });

  return { subject, body };
};

module.exports = { TEMPLATES, compileTemplate };
