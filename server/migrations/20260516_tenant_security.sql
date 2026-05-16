-- ── Phase 1: Enterprise Tenant Suspension Infrastructure ──

-- Add detailed suspension metadata to gyms
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_by UUID;

-- Create Tenant Audit Logs for security tracking
CREATE TABLE IF NOT EXISTS tenant_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- SUSPENSION, REACTIVATION, MODIFICATION
    reason TEXT,
    performed_by UUID, -- Super Admin ID
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast status checks
CREATE INDEX IF NOT EXISTS idx_gym_status ON gyms(saas_subscription_status);
