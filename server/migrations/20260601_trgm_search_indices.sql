-- ============================================================
-- FITXENO MIGRATION: SEARCH OPTIMIZATION (TRIGRAM GIN INDEXES)
-- ============================================================

-- 1. Enable Trigram Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create GIN index for members phone trigram search
CREATE INDEX IF NOT EXISTS idx_members_phone_trgm_gin 
ON members USING gin (phone gin_trgm_ops);

-- 3. Create GIN index for gyms name trigram search
CREATE INDEX IF NOT EXISTS idx_gyms_name_trgm_gin 
ON gyms USING gin (name gin_trgm_ops);

-- 4. Create GIN index for gyms phone trigram search
CREATE INDEX IF NOT EXISTS idx_gyms_phone_trgm_gin 
ON gyms USING gin (phone gin_trgm_ops);
