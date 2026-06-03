const db = require('../config/db');
const { get, set, del, CACHE_TTL } = require('../services/cacheService');

// GET /api/plans
const getPlans = async (req, res) => {
  const gymId = req.user.gym_id;
  try {
    // Try Cache First
    const cachedPlans = await get(gymId, 'plans_list');
    if (cachedPlans) {
      return res.json(cachedPlans);
    }

    const result = await db.query(
      'SELECT * FROM plans WHERE gym_id = $1 AND is_active = true ORDER BY created_at DESC',
      [gymId]
    );

    // Save to Cache for 300 seconds (Phase 11)
    await set(gymId, 'plans_list', result.rows, CACHE_TTL.PLAN);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

// POST /api/plans
const createPlan = async (req, res) => {
  const { name, duration_days, price } = req.body;
  const gymId = req.user.gym_id;
  try {
    const result = await db.query(
      'INSERT INTO plans (gym_id, name, duration_days, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [gymId, name, duration_days, price]
    );

    // Invalidate Cache
    await del(gymId, 'plans_list');

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

    // Invalidate Cache
    await del(gymId, 'plans_list');

    // Emit event for real-time sync
    const { eventBus } = require('../events/eventBus');
    eventBus.emit('plan.updated', { gymId, planId: id });

    res.json({ message: 'Plan removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove plan' });
  }
};

// PUT /api/plans/:id
const updatePlan = async (req, res) => {
  const { id } = req.params;
  const { name, duration_days, price } = req.body;
  const gymId = req.user.gym_id;
  try {
    const result = await db.query(
      'UPDATE plans SET name = $1, duration_days = $2, price = $3 WHERE id = $4 AND gym_id = $5 RETURNING *',
      [name, duration_days, price, id, gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Invalidate Cache
    await del(gymId, 'plans_list');

    // Emit event for real-time sync
    const { eventBus } = require('../events/eventBus');
    eventBus.emit('plan.updated', { gymId, planId: id });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan };
