-- Member Export Audit Logging
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  exported_by UUID REFERENCES users(id),
  export_type VARCHAR(50) NOT NULL, -- MEMBERS, PAYMENTS, ATTENDANCE
  format VARCHAR(10) NOT NULL, -- CSV, XLSX
  filters_used JSONB DEFAULT '{}',
  records_count INTEGER DEFAULT 0,
  exported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_logs_gym_id ON export_logs(gym_id);
