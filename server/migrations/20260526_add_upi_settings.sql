-- Migration: Add UPI Settings for QR code generation

ALTER TABLE gym_settings 
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS qr_enabled BOOLEAN DEFAULT FALSE;
