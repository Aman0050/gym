const db = require('../config/db');

// GET /api/plans
const getPlans = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM plans WHERE gym_id = $1 AND is_active = true ORDER BY created_at DESC',
      [req.user.gym_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

// POST /api/plans
const createPlan = async (req, res) => {
  const { name, duration_days, price } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO plans (gym_id, name, duration_days, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.gym_id, name, duration_days, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create plan' });
  }
};

// DELETE /api/plans/:id
const deletePlan = async (req, res) => {
  const { id } = req.params;
  const gymId = req.user.gym_id;
  try {
    const result = await db.query(
      'UPDATE plans SET is_active = false WHERE id = $1 AND gym_id = $2 RETURNING *',
      [id, gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Emit event for real-time sync
    const { eventBus } = require('../events/eventBus');
    eventBus.emit('plan.updated', { gymId, planId: id });

    res.json({ message: 'Plan removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove plan' });
  }
};

module.exports = { getPlans, createPlan, deletePlan };
