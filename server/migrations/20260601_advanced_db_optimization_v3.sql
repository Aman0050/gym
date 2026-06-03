-- ============================================================
-- FITXENO MIGRATION: ADVANCED DB OPTIMIZATION V3
-- ============================================================

-- 1. Enable Trigram Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Drop Broken Index Reference (date column doesn't exist)
DROP INDEX IF EXISTS idx_attendance_gym_date;

-- 3. Create Valid Composite Time-Series Indexes for Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_gym_check_in 
ON attendance(gym_id, check_in_time DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_member_check_in
ON attendance(member_id, check_in_time DESC);

-- 4. Index Foreign Keys on Invoices to prevent Cascade Deletion locks
CREATE INDEX IF NOT EXISTS idx_invoices_member_id ON invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);

-- 5. Add Compound Index for active subscriptions lookup
CREATE INDEX IF NOT EXISTS idx_payments_active_subs 
ON payments(member_id, valid_until DESC) 
WHERE payment_status IN ('PAID', 'PENDING');

-- 6. Add Trigram Index for fast substring name queries on members
CREATE INDEX IF NOT EXISTS idx_members_name_trgm_gin 
ON members USING gin (name gin_trgm_ops);

-- 7. Add B-Tree Index on Payments Valid Expiry Date
CREATE INDEX IF NOT EXISTS idx_payments_valid_until_gym
ON payments(gym_id, valid_until DESC);
