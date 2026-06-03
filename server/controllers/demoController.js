const db = require('../config/db');

const submitDemoRequest = async (req, res) => {
  const { name, gymName, email, phone, members, branches, contactMethod, message } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO demo_requests (name, gym_name, email, phone, members, branches, contact_method, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [name, gymName, email, phone, members, branches, contactMethod, message]
    );

    // Mock Email/Notification to Admin Team
    console.log(`\n========================================================`);
    console.log(`🚀 NEW ENTERPRISE DEMO REQUEST RECEIVED`);
    console.log(`Gym: ${gymName} (${branches} branches, ${members} members)`);
    console.log(`Contact: ${name} | ${email} | ${phone} | Prefers: ${contactMethod}`);
    console.log(`Message: ${message || 'N/A'}`);
    console.log(`========================================================\n`);

    res.status(201).json({ 
      success: true, 
      message: 'Your demo request has been received. A FitXeno specialist will contact you shortly.',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Demo request error:', error);
    res.status(500).json({ error: 'Server error processing demo request' });
  }
};

module.exports = { submitDemoRequest };
