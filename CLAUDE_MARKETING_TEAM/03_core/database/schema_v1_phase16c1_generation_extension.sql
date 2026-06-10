-- =============================================================================
-- THE CORE AGENCY — Schema Extension: content_plan_jobs / content_plan_items
-- (Phase 16C-1)
--
-- Phase 6 (frontend) introduced ContentPlanJob / ContentPlanItem types for
-- mock content-plan generation, scoped by client_id/brand_id/campaign_id/
-- brief_id. schema_v1.sql's existing `generation_jobs` / `content_items`
-- tables target a different, incompatible Phase-15-planned schema (keyed by
-- campaign_id only, with module/job_status enums) and are unused by the app.
--
-- This additive migration creates new tables matching the Phase 6 shape so
-- Supabase CRUD wiring (Phase 16C-1) can persist generation jobs and content
-- items without touching the legacy generation_jobs / content_items tables.
--
-- Safe to run multiple times (IF NOT EXISTS / duplicate_object guards).
-- Additive only — no existing tables/columns are altered or dropped. Not
-- applied to any live database; production Supabase env remains OFF.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE content_plan_job_status AS ENUM (
    'draft',
    'queued',
    'generating',
    'completed',
    'failed',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE content_plan_item_status AS ENUM (
    'generated',
    'needs_review',
    'revision_requested',
    'approved',
    'scheduled',
    'published',
    'rejected',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE content_plan_generation_mode AS ENUM (
    'mock',
    'ai_ready',
    'external_module'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- content_plan_jobs: one row per "Generate N-day plan" run, scoped to a
-- single client + brand + campaign + brief.
CREATE TABLE IF NOT EXISTS content_plan_jobs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  brand_id         UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brief_id         UUID NOT NULL REFERENCES campaign_briefs(id) ON DELETE CASCADE,
  plan_length_days INT NOT NULL CHECK (plan_length_days IN (7, 15, 30)),
  generation_mode  content_plan_generation_mode NOT NULL DEFAULT 'mock',
  status           content_plan_job_status NOT NULL DEFAULT 'draft',
  requested_by     TEXT,
  item_count       INT NOT NULL DEFAULT 0,
  completed_at     TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content_plan_items: individual content pieces belonging to a
-- content_plan_jobs row. Carries the same client/brand/campaign/brief scope
-- as its parent job so it can be queried directly without a join.
CREATE TABLE IF NOT EXISTS content_plan_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_job_id UUID NOT NULL REFERENCES content_plan_jobs(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  brand_id          UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brief_id          UUID NOT NULL REFERENCES campaign_briefs(id) ON DELETE CASCADE,
  day_number        INT NOT NULL,
  planned_date      DATE,
  channel           TEXT NOT NULL,
  content_type      TEXT NOT NULL,
  pillar            TEXT NOT NULL,
  angle             TEXT NOT NULL,
  hook              TEXT NOT NULL,
  caption           TEXT NOT NULL,
  visual_brief      TEXT NOT NULL,
  cta               TEXT NOT NULL,
  hashtags          TEXT NOT NULL,
  status            content_plan_item_status NOT NULL DEFAULT 'needs_review',
  -- Phase 7 — Calendar metadata (out of scope for 16C-1, columns reserved
  -- for parity with the frontend ContentPlanItem type)
  scheduled_time    TEXT,
  publish_note      TEXT,
  owner_note        TEXT,
  last_moved_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_plan_jobs_brief    ON content_plan_jobs(brief_id);
CREATE INDEX IF NOT EXISTS idx_content_plan_jobs_campaign ON content_plan_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_plan_jobs_brand    ON content_plan_jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_plan_jobs_client   ON content_plan_jobs(client_id);

CREATE INDEX IF NOT EXISTS idx_content_plan_items_job      ON content_plan_items(generation_job_id);
CREATE INDEX IF NOT EXISTS idx_content_plan_items_brief    ON content_plan_items(brief_id);
CREATE INDEX IF NOT EXISTS idx_content_plan_items_campaign ON content_plan_items(campaign_id);

-- updated_at triggers — mirrors set_updated_at() defined in schema_v1.sql
DO $$ BEGIN
  CREATE TRIGGER trg_content_plan_jobs_updated_at
    BEFORE UPDATE ON content_plan_jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_content_plan_items_updated_at
    BEFORE UPDATE ON content_plan_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS — enabled with tenant-scoped policies (Codex required-fix, 2026-06-11).
-- schema_v1.sql's other tables are still "service_role only, no policies"
-- (Phase 3/4 TODO). These two new tables are not read by service_role-only
-- code paths today, so they get real policies now, built on the access model
-- that already exists in schema_v1.sql: user_roles(user_id, resource_type,
-- resource_id) where resource_type is 'global' | 'client' | 'brand' |
-- 'campaign' and resource_id is the matching client/brand/campaign id (NULL
-- for 'global').
--
-- content_plan_user_has_scope() checks whether auth.uid() has a user_roles
-- row granting global access, or access scoped to the row's client/brand/
-- campaign. SECURITY DEFINER + fixed search_path is required because
-- user_roles itself has RLS enabled with no policies, so a normal (non-owner)
-- session could not otherwise read it to evaluate the check. auth.uid() is
-- NULL for anon/unauthenticated requests, and user_roles.user_id is NOT NULL,
-- so anon never matches — no anonymous public access is granted.
ALTER TABLE content_plan_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plan_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION content_plan_user_has_scope(
  p_client_id   UUID,
  p_brand_id    UUID,
  p_campaign_id UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND (
        (ur.resource_type = 'global'   AND ur.resource_id IS NULL)
        OR (ur.resource_type = 'client'   AND ur.resource_id = p_client_id)
        OR (ur.resource_type = 'brand'    AND ur.resource_id = p_brand_id)
        OR (ur.resource_type = 'campaign' AND ur.resource_id = p_campaign_id)
      )
  );
$$;

DO $$ BEGIN
  CREATE POLICY content_plan_jobs_select ON content_plan_jobs
    FOR SELECT
    USING (content_plan_user_has_scope(client_id, brand_id, campaign_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY content_plan_jobs_insert ON content_plan_jobs
    FOR INSERT
    WITH CHECK (content_plan_user_has_scope(client_id, brand_id, campaign_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY content_plan_jobs_update ON content_plan_jobs
    FOR UPDATE
    USING (content_plan_user_has_scope(client_id, brand_id, campaign_id))
    WITH CHECK (content_plan_user_has_scope(client_id, brand_id, campaign_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY content_plan_items_select ON content_plan_items
    FOR SELECT
    USING (content_plan_user_has_scope(client_id, brand_id, campaign_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY content_plan_items_insert ON content_plan_items
    FOR INSERT
    WITH CHECK (content_plan_user_has_scope(client_id, brand_id, campaign_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY content_plan_items_update ON content_plan_items
    FOR UPDATE
    USING (content_plan_user_has_scope(client_id, brand_id, campaign_id))
    WITH CHECK (content_plan_user_has_scope(client_id, brand_id, campaign_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
