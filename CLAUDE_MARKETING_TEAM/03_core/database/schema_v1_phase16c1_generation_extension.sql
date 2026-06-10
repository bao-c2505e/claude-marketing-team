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

-- RLS — enabled with tenant-scoped, role-aware, hierarchy-validated policies
-- (Codex required-fix, 2026-06-11; tightened across three passes same day per
-- follow-up Codex reviews).
-- schema_v1.sql's other tables are still "service_role only, no policies"
-- (Phase 3/4 TODO). These two new tables are not read by service_role-only
-- code paths today, so they get real policies now, built on the access model
-- that already exists in schema_v1.sql: user_roles(user_id, role_id,
-- resource_type, resource_id, is_active, expires_at) joined to roles(name),
-- where resource_type is 'global' | 'client' | 'brand' | 'campaign',
-- resource_id is the matching client/brand/campaign id (NULL for 'global'),
-- and roles.name is one of 'owner' | 'manager' | 'client' | 'viewer'.
--
-- content_plan_hierarchy_is_valid() verifies, against the real
-- clients/brands/campaigns/campaign_briefs FK chain, that the four scope ids
-- carried on a content_plan_jobs/content_plan_items row — client_id,
-- brand_id, campaign_id, brief_id — all belong to ONE consistent tenant
-- hierarchy: brand.client_id = client_id; campaign.client_id = client_id AND
-- campaign.brand_id = brand_id; campaign_briefs.{client_id,brand_id,
-- campaign_id} all match. A row whose four ids don't form a single real
-- chain (e.g. a brief id borrowed from a different client/brand/campaign) is
-- never authorized, regardless of role.
--
-- content_plan_user_has_scope() checks whether auth.uid() has a user_roles
-- row that is:
--   - is_active = TRUE (revoked/disabled assignments never match)
--   - unexpired: expires_at IS NULL OR expires_at > NOW()
--   - scoped to the row's client/brand/campaign (or 'global')
--   - assigned a role whose name is in p_roles (defaults to all four
--     project roles — i.e. any valid, active, unexpired, in-scope
--     assignment may read)
-- AND that content_plan_hierarchy_is_valid() holds for the row's four ids.
-- The role-scope OR (global/client/brand/campaign) only selects WHICH node
-- of the hierarchy an assignment grants access to — it can no longer
-- authorize a row whose other ids don't actually belong under that node,
-- because the hierarchy check is AND-ed in and validated against real FK
-- data, not against caller-supplied values alone.
--
-- content_plan_user_can_write() narrows p_roles to the write-capable roles
-- ('owner', 'manager') per roles.description in schema_v1.sql. The 'client'
-- and 'viewer' roles are read-only and can never satisfy an INSERT/UPDATE
-- check (including status transitions to 'archived').
--
-- SECURITY DEFINER + fixed search_path is required because user_roles,
-- brands, campaigns and campaign_briefs all have RLS enabled with no
-- policies, so a normal (non-owner) session could not otherwise read them to
-- evaluate these checks. auth.uid() is NULL for anon/unauthenticated
-- requests, and user_roles.user_id is NOT NULL, so anon never matches — no
-- anonymous public access is granted.
ALTER TABLE content_plan_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plan_items ENABLE ROW LEVEL SECURITY;

-- Drop prior-signature helpers from earlier iterations of this migration so
-- CREATE OR REPLACE below can't leave a stale overload (with the old,
-- non-hierarchy-validated argument list) reachable. Policies are dropped
-- first (below) so these drops never need CASCADE.
DROP POLICY IF EXISTS content_plan_jobs_select ON content_plan_jobs;
DROP POLICY IF EXISTS content_plan_jobs_insert ON content_plan_jobs;
DROP POLICY IF EXISTS content_plan_jobs_update ON content_plan_jobs;
DROP POLICY IF EXISTS content_plan_items_select ON content_plan_items;
DROP POLICY IF EXISTS content_plan_items_insert ON content_plan_items;
DROP POLICY IF EXISTS content_plan_items_update ON content_plan_items;

DROP FUNCTION IF EXISTS content_plan_user_has_scope(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS content_plan_user_has_scope(UUID, UUID, UUID, role_name[]);
DROP FUNCTION IF EXISTS content_plan_user_can_write(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION content_plan_hierarchy_is_valid(
  p_client_id   UUID,
  p_brand_id    UUID,
  p_campaign_id UUID,
  p_brief_id    UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM campaign_briefs cb
    JOIN campaigns c ON c.id = cb.campaign_id
    JOIN brands b    ON b.id = c.brand_id
    WHERE cb.id          = p_brief_id
      AND cb.campaign_id = p_campaign_id
      AND cb.brand_id    = p_brand_id
      AND cb.client_id   = p_client_id
      AND c.id           = p_campaign_id
      AND c.brand_id     = p_brand_id
      AND c.client_id    = p_client_id
      AND b.id           = p_brand_id
      AND b.client_id    = p_client_id
  );
$$;

CREATE OR REPLACE FUNCTION content_plan_user_has_scope(
  p_client_id   UUID,
  p_brand_id    UUID,
  p_campaign_id UUID,
  p_brief_id    UUID,
  p_roles       role_name[] DEFAULT ARRAY['owner','manager','client','viewer']::role_name[]
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_plan_hierarchy_is_valid(p_client_id, p_brand_id, p_campaign_id, p_brief_id)
    AND EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND r.name = ANY (p_roles)
      AND (
        (ur.resource_type = 'global'   AND ur.resource_id IS NULL)
        OR (ur.resource_type = 'client'   AND ur.resource_id = p_client_id)
        OR (ur.resource_type = 'brand'    AND ur.resource_id = p_brand_id)
        OR (ur.resource_type = 'campaign' AND ur.resource_id = p_campaign_id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION content_plan_user_can_write(
  p_client_id   UUID,
  p_brand_id    UUID,
  p_campaign_id UUID,
  p_brief_id    UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_plan_user_has_scope(
    p_client_id, p_brand_id, p_campaign_id, p_brief_id,
    ARRAY['owner','manager']::role_name[]
  );
$$;

-- content_plan_jobs: any active, unexpired, hierarchy-valid, in-scope role
-- may read; only owner/manager may insert or update (including status ->
-- 'archived').
CREATE POLICY content_plan_jobs_select ON content_plan_jobs
  FOR SELECT
  USING (content_plan_user_has_scope(client_id, brand_id, campaign_id, brief_id));

CREATE POLICY content_plan_jobs_insert ON content_plan_jobs
  FOR INSERT
  WITH CHECK (content_plan_user_can_write(client_id, brand_id, campaign_id, brief_id));

CREATE POLICY content_plan_jobs_update ON content_plan_jobs
  FOR UPDATE
  USING (content_plan_user_can_write(client_id, brand_id, campaign_id, brief_id))
  WITH CHECK (content_plan_user_can_write(client_id, brand_id, campaign_id, brief_id));

-- content_plan_items: same read/write split as content_plan_jobs.
CREATE POLICY content_plan_items_select ON content_plan_items
  FOR SELECT
  USING (content_plan_user_has_scope(client_id, brand_id, campaign_id, brief_id));

CREATE POLICY content_plan_items_insert ON content_plan_items
  FOR INSERT
  WITH CHECK (content_plan_user_can_write(client_id, brand_id, campaign_id, brief_id));

CREATE POLICY content_plan_items_update ON content_plan_items
  FOR UPDATE
  USING (content_plan_user_can_write(client_id, brand_id, campaign_id, brief_id))
  WITH CHECK (content_plan_user_can_write(client_id, brand_id, campaign_id, brief_id));
