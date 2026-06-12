-- =============================================================================
-- THE CORE AGENCY — Schema Extension: campaign_briefs (Phase 16B-2)
--
-- Phase 5 (frontend) extended `CampaignBrief` / `BriefIntakeTab` with
-- client_id, brand_id, status, and 13 brief-detail fields, but schema_v1.sql's
-- `campaign_briefs` table was never updated to match. This additive migration
-- closes that gap so Supabase CRUD wiring (Phase 16B-2) can persist the same
-- fields the localStorage repository already stores.
--
-- Safe to run multiple times (IF NOT EXISTS guards, idempotent backfill).
-- Additive only — no existing columns are altered or dropped. Not applied to
-- any live database; production Supabase env remains OFF.
--
-- Codex Fix 1 (2026-06-10): client_id/brand_id are added NULLABLE, backfilled
-- from campaigns for any existing rows, and only promoted to NOT NULL if the
-- backfill leaves zero rows with a missing tenant ref. This avoids existing
-- briefs vanishing from the new tenant-scoped queries and avoids guessing a
-- tenant for rows whose campaign_id has no match (see notes below).
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

-- Step 1 — add columns. client_id/brand_id start NULLABLE so existing rows
-- aren't rejected; NOT NULL is enforced in Step 3 once backfilled.
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

-- Step 2 — backfill client_id/brand_id for existing rows from their campaign.
-- Idempotent: only touches rows where either tenant ref is still missing, so
-- re-running this migration after Step 3 has succeeded is a no-op here.
UPDATE campaign_briefs b
SET
  client_id = c.client_id,
  brand_id  = c.brand_id
FROM campaigns c
WHERE b.campaign_id = c.id
  AND (b.client_id IS NULL OR b.brand_id IS NULL);

-- Step 3 — enforce NOT NULL only if every row now has a tenant ref. A brief
-- whose campaign_id has no matching campaign (orphaned FK) cannot be safely
-- backfilled — guessing a client/brand for it would silently reassign that
-- brief to the wrong tenant. In that case this migration leaves client_id/
-- brand_id NULLABLE, raises a NOTICE naming the affected brief IDs, and skips
-- the NOT NULL constraint. Those rows will not appear in the new
-- tenant-scoped list/get/update queries until the orphaned campaign_id is
-- fixed manually and this migration is re-run.
DO $$
DECLARE
  orphan_count INT;
  orphan_ids   TEXT;
BEGIN
  SELECT COUNT(*), string_agg(id::text, ', ')
    INTO orphan_count, orphan_ids
    FROM campaign_briefs
    WHERE client_id IS NULL OR brand_id IS NULL;

  IF orphan_count = 0 THEN
    ALTER TABLE campaign_briefs ALTER COLUMN client_id SET NOT NULL;
    ALTER TABLE campaign_briefs ALTER COLUMN brand_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'campaign_briefs: % row(s) have no matching campaign for campaign_id (orphaned FK) — client_id/brand_id left NULL and NOT NULL constraint NOT applied. Affected brief id(s): %. Fix campaign_id on these rows and re-run this migration.', orphan_count, orphan_ids;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_briefs_client ON campaign_briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_brand  ON campaign_briefs(brand_id);
