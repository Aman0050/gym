-- Add Enterprise Freeze Metadata to Members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS freeze_reason_type VARCHAR(50); 
ALTER TABLE members ADD COLUMN IF NOT EXISTS freeze_custom_reason TEXT; 
ALTER TABLE members ADD COLUMN IF NOT EXISTS freeze_notes TEXT; 
ALTER TABLE members ADD COLUMN IF NOT EXISTS frozen_by UUID REFERENCES users(id); 
ALTER TABLE members ADD COLUMN IF NOT EXISTS freeze_date TIMESTAMPTZ;

-- Add index for status based queries
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
