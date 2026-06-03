const db = require('../config/db');

const getSubscriptionStatus = async (req, res) => {
  try {
    const gymId = req.user.gym_id;

    const result = await db.query(
      'SELECT saas_subscription_status, trial_start_date, trial_end_date, saas_valid_until FROM gyms WHERE id = $1',
      [gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gym not found' });
    }

    const gym = result.rows[0];
    let trial_days_remaining = 0;

    if (gym.saas_subscription_status === 'TRIAL' && gym.trial_end_date) {
      const now = new Date();
      const end = new Date(gym.trial_end_date);
      const diffMs = end - now;
      trial_days_remaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    res.json({
      success: true,
      status: gym.saas_subscription_status,
      trial_days_remaining,
      trial_end_date: gym.trial_end_date,
      valid_until: gym.saas_valid_until
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
};

module.exports = { getSubscriptionStatus };
