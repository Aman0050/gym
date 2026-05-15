-- 7. Daily Stats Table (Optimized Analytics Cache)
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    new_members INTEGER DEFAULT 0,
    check_ins INTEGER DEFAULT 0,
    total_active_members INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (gym_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_gym_date ON daily_stats(gym_id, date DESC);

-- 8. Lifetime Stats Table
CREATE TABLE IF NOT EXISTS lifetime_stats (
    gym_id UUID PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
    total_revenue_all_time DECIMAL(15, 2) DEFAULT 0,
    total_members_all_time INTEGER DEFAULT 0,
    total_checkins_all_time INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
