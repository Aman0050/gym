-- Add BANK_TRANSFER to the payment_mode CHECK constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
  CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER'));
