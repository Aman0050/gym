-- Add trial tracking columns to gyms
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;
