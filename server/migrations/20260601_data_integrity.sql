-- ============================================================
-- FITXENO — Data Integrity Audit Fixes
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Prevent Duplicate Payments (Transaction References)
-- Note: If there are existing duplicates, this will fail.
-- In production, you'd want to handle duplicates first. 
-- We add a constraint to ensure transaction references are unique per gym (excluding NULLs).
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_txn 
ON payments (gym_id, transaction_reference) 
WHERE transaction_reference IS NOT NULL;

-- 2. Prevent Duplicate Attendance
-- Ensures a member can only check in once per calendar day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_attendance 
ON attendance (gym_id, member_id, DATE(check_in_time));
