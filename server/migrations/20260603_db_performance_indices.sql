-- ============================================================
-- FITXENO MIGRATION: DB PERFORMANCE B-TREE INDICES
-- ============================================================

-- Payments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_gym_member ON payments(gym_id, member_id);

-- Attendance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_gym_member ON attendance(gym_id, member_id);

-- Members
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_members_gym ON members(gym_id);

-- Plans
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plans_gym ON plans(gym_id);
