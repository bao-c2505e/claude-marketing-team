-- =============================================================================
-- THE CORE AGENCY — Schema Extension: campaign_briefs (Phase 16B-2)
--
-- Phase 5 (frontend) extended `CampaignBrief` / `BriefIntakeTab` with
-- client_id, brand_id, status, and 13 brief-detail fields, but schema_v1.sql's
-- `campaign_briefs` table was never updated to match. This additive migration
-- closes that gap so Supabase CRUD wiring (Phase 16B-2) can persist the same
-- fields the localStorage repository already stores.
--
-- Safe to run multiple times (IF NOT EXISTS guards). Additive only — no
-- existing columns are altered or dropped. Not applied to any live database;
-- production Supabase env remains OFF.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE brief_status AS ENUM (
    'draft',
    'ready_for_generation',
    'needs_revision',
    'approved_for_generation',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE campaign_briefs
  ADD COLUMN IF NOT EXISTS client_id              UUID REFERENCES clients(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS brand_id               UUID REFERENCES brands(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS status                 brief_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS brief_title            TEXT,
  ADD COLUMN IF NOT EXISTS campaign_goal          TEXT,
  ADD COLUMN IF NOT EXISTS product_focus          TEXT,
  ADD COLUMN IF NOT EXISTS offer                  TEXT,
  ADD COLUMN IF NOT EXISTS tone_of_voice          TEXT,
  ADD COLUMN IF NOT EXISTS content_pillars        TEXT[],
  ADD COLUMN IF NOT EXISTS must_include           TEXT,
  ADD COLUMN IF NOT EXISTS must_avoid             TEXT,
  ADD COLUMN IF NOT EXISTS competitors            TEXT,
  ADD COLUMN IF NOT EXISTS reference_links        TEXT,
  ADD COLUMN IF NOT EXISTS budget_note            TEXT,
  ADD COLUMN IF NOT EXISTS timeline_note          TEXT,
  ADD COLUMN IF NOT EXISTS approval_requirements  TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_briefs_client ON campaign_briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_brand  ON campaign_briefs(brand_id);
