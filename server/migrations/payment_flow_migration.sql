-- ============================================================
-- FITXENO — Payment Flow Migration
-- Run this in your Supabase SQL Editor or via psql
-- ============================================================

-- 1. Add payment lifecycle columns to payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PAID'
    CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
  ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- 2. Backfill existing payments as PAID (they were all confirmed before this migration)
UPDATE payments SET payment_status = 'PAID', paid_at = payment_date, activated_at = payment_date
  WHERE payment_status IS NULL OR payment_status = 'PAID';

-- 3. Expand payment_mode constraint to include BANK_TRANSFER
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check
  CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER'));

-- 4. Index for fast status lookups
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(member_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_member_status ON payments(gym_id, payment_status, created_at DESC);
