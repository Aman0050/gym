-- Enterprise Notifications System
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- PAYMENT_SUCCESS, PLAN_EXPIRING, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_gym_is_read ON notifications(gym_id, is_read);

-- Gym Operational Settings
CREATE TABLE IF NOT EXISTS gym_settings (
  gym_id UUID PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
  -- Membership Rules
  expiry_reminder_days INTEGER DEFAULT 3,
  auto_freeze_enabled BOOLEAN DEFAULT TRUE,
  grace_period_days INTEGER DEFAULT 0,
  -- Billing
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  currency VARCHAR(10) DEFAULT 'INR',
  -- Notification Channels
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  email_enabled BOOLEAN DEFAULT FALSE,
  realtime_alerts_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help & Support System
CREATE TABLE IF NOT EXISTS faq_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  issue_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'NORMAL',
  status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some FAQ data
INSERT INTO faq_articles (category, question, answer, priority) VALUES 
('Membership', 'How do I freeze a membership?', 'Go to the member profile, click "Freeze Membership", and select the appropriate reason.', 1),
('Billing', 'How to download an invoice?', 'In the Payments section, click the download icon next to any transaction record.', 2),
('Attendance', 'QR code not scanning?', 'Ensure the member has an active plan and the QR code is clearly visible on their mobile device. Check lighting conditions.', 3)
ON CONFLICT DO NOTHING;
