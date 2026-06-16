-- Migration: Add Gym Owner QR field to gyms table
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS owner_qr TEXT;
