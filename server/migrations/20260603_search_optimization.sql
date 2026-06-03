-- ============================================================
-- FITXENO MIGRATION: SEARCH OPTIMIZATION (TRIGRAM GIN INDEXES)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_members_name_trgm_gin ON members USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gyms_name_trgm_gin ON gyms USING gin (name gin_trgm_ops);
