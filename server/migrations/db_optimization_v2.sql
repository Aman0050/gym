-- 1. Full-Text Search Optimization (GIN Index)
-- Speed up member searching by name or phone across millions of records
CREATE INDEX IF NOT EXISTS idx_members_search_trgm ON members USING gin (name gin_trgm_ops, phone gin_trgm_ops);

-- 2. Partial Indexes for Active Data
-- Only index active members to keep the index size small and fast
CREATE INDEX IF NOT EXISTS idx_members_active ON members (gym_id) WHERE status = 'ACTIVE';

-- 3. BRIN Indexes for Time-Series Data (Payments)
-- BRIN (Block Range Index) is extremely efficient for large ordered datasets
CREATE INDEX IF NOT EXISTS idx_payments_date_brin ON payments USING brin (payment_date);

-- 4. Attendance Table Partitioning Strategy
-- We'll prepare a partitioned table for high-volume attendance tracking
CREATE TABLE IF NOT EXISTS attendance_partitioned (
    id UUID NOT NULL,
    gym_id UUID NOT NULL,
    member_id UUID NOT NULL,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- Create sample partitions for the current year
CREATE TABLE IF NOT EXISTS attendance_y2026_m05 PARTITION OF attendance_partitioned
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- 5. Foreign Key Indexing (Standard Practice)
-- Ensure all FKs have indexes to prevent sequential scans on joins/deletes
CREATE INDEX IF NOT EXISTS idx_notifications_gym_id ON notifications(gym_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_gym_id ON daily_stats(gym_id);

-- 6. Functional Indexes
-- Index by normalized email for faster case-insensitive login
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
