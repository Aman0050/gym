-- Fix notifications table to match the notificationService.js schema
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS action_url VARCHAR(255);
