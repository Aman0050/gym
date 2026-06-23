-- Add slip_number and aadhaar_number to members table
ALTER TABLE members
ADD COLUMN IF NOT EXISTS slip_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(12);

CREATE INDEX IF NOT EXISTS idx_members_slip_number ON members(slip_number);
