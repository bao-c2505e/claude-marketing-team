-- =============================================================================
-- THE CORE AGENCY — Schema Extension: content_assets / content_asset_collections
-- (Phase 16D)
--
-- Phase 10 (frontend) introduced AssetItem / LocalAssetCollection types for the
-- Asset Library, scoped by client_id/brand_id and OPTIONALLY by campaign_id/
-- brief_id/generation_job_id/content_item_id (an asset may live at the brand
-- level — e.g. a logo — or be scoped as deep as a single generated content
-- item). schema_v1.sql's existing `assets` / `asset_collections` tables target
-- a different, incompatible shape (collection_id FK, no brief/generation/
-- content_item scope) and are unused by the app.
--
-- This additive migration creates new tables matching the Phase 10 shape so
-- Supabase CRUD wiring (Phase 16D) can persist assets and collections without
-- touching the legacy assets / asset_collections tables.
--
-- Safe to run multiple times (IF NOT EXISTS / duplicate_object guards, DROP
-- POLICY/FUNCTION IF EXISTS before CREATE). Additive only — no existing
-- tables/columns are altered or dropped. Not applied to any live database;
-- production Supabase env remains OFF.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM (
    'image',
    'video',
    'design',
    'document',
    'logo',
    'raw_footage',
    'reference',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_source_type AS ENUM (
    'local_placeholder',
    'external_url',
    'storage_ready',
    'generated_placeholder'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_approval_status AS ENUM (
    'draft',
    'needs_review',
    'approved',
    'rejected',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- content_asset_collections: brand-level grouping of assets, optionally
-- scoped to a single campaign.
CREATE TABLE IF NOT EXISTS content_asset_collections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id)   ON DELETE RESTRICT,
  brand_id    UUID NOT NULL REFERENCES brands(id)    ON DELETE RESTRICT,
  campaign_id UUID REFERENCES campaigns(id)          ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content_assets: every asset carries client_id + brand_id; campaign_id/
-- brief_id/generation_job_id/content_item_id are nullable and only set when
-- the asset is scoped that deep. Each deeper level requires its parent to be
-- non-null (enforced by content_asset_hierarchy_is_valid() below, not by a
-- CHECK constraint, to mirror the read-side validation used by RLS).
CREATE TABLE IF NOT EXISTS content_assets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES clients(id)              ON DELETE RESTRICT,
  brand_id            UUID NOT NULL REFERENCES brands(id)               ON DELETE RESTRICT,
  campaign_id         UUID REFERENCES campaigns(id)                     ON DELETE CASCADE,
  brief_id            UUID REFERENCES campaign_briefs(id)               ON DELETE CASCADE,
  generation_job_id   UUID REFERENCES content_plan_jobs(id)             ON DELETE CASCADE,
  content_item_id     UUID REFERENCES content_plan_items(id)            ON DELETE CASCADE,
  asset_collection_id UUID REFERENCES content_asset_collections(id)     ON DELETE SET NULL,
  name                TEXT NOT NULL,
  asset_type          asset_type NOT NULL DEFAULT 'other',
  source_type         asset_source_type NOT NULL DEFAULT 'local_placeholder',
  url                 TEXT,
  thumbnail_url       TEXT,
  file_name           TEXT,
  file_size_note      TEXT,
  mime_type           TEXT,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  usage_rights_note   TEXT,
  approval_status     asset_approval_status NOT NULL DEFAULT 'draft',
  notes               TEXT,
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_asset_collections_client   ON content_asset_collections(client_id);
CREATE INDEX IF NOT EXISTS idx_content_asset_collections_brand    ON content_asset_collections(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_asset_collections_campaign ON content_asset_collections(campaign_id);

CREATE INDEX IF NOT EXISTS idx_content_assets_client     ON content_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_brand      ON content_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_campaign   ON content_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_brief      ON content_assets(brief_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_generation ON content_assets(generation_job_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_item       ON content_assets(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_collection ON content_assets(asset_collection_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_status     ON content_assets(approval_status);

-- updated_at triggers — mirrors set_updated_at() defined in schema_v1.sql
DO $$ BEGIN
  CREATE TRIGGER trg_content_asset_collections_updated_at
    BEFORE UPDATE ON content_asset_collections
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_content_assets_updated_at
    BEFORE UPDATE ON content_assets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS — enabled with tenant-scoped, role-aware, hierarchy-validated policies,
-- following the pattern established in
-- schema_v1_phase16c1_generation_extension.sql /
-- schema_v1_phase16c2_approval_extension.sql: user_roles(user_id, role_id,
-- resource_type, resource_id, is_active, expires_at) joined to roles(name),
-- where resource_type is 'global' | 'client' | 'brand' | 'campaign',
-- resource_id is the matching client/brand/campaign id (NULL for 'global'),
-- and roles.name is one of 'owner' | 'manager' | 'client' | 'viewer'.
--
-- content_asset_hierarchy_is_valid() is NULL-tolerant: client_id/brand_id are
-- always required and validated against brands/clients; campaign_id (if
-- present) must belong to that client+brand; brief_id (if present) requires
-- campaign_id to be set and reuses content_plan_hierarchy_is_valid() (Phase
-- 16C-1) to validate client/brand/campaign/brief as one chain;
-- generation_job_id (if present) requires brief_id to be set and must be a
-- content_plan_jobs row whose own client/brand/campaign/brief ids match;
-- content_item_id (if present) requires generation_job_id to be set and must
-- be a content_plan_items row belonging to that exact generation_job_id with
-- matching client/brand/campaign/brief ids. A row whose ids don't form one
-- consistent chain at whatever depth it claims is never authorized, regardless
-- of role.
--
-- content_asset_user_has_scope() checks whether auth.uid() has a user_roles
-- row that is active, unexpired, scoped to the row's client/brand/campaign (or
-- 'global'), and assigned a role in p_roles (defaults to all four project
-- roles), AND that content_asset_hierarchy_is_valid() holds for the row's six
-- ids. content_asset_user_can_write() narrows p_roles to the write-capable
-- roles ('owner', 'manager') — the 'client' and 'viewer' roles can read but
-- can never insert/update/archive an asset.
--
-- content_asset_collection_hierarchy_is_valid() / _user_has_scope() /
-- _user_can_write() are the brand-level equivalents for
-- content_asset_collections (client_id + brand_id + optional campaign_id, no
-- brief/generation/content_item scope).
--
-- SECURITY DEFINER + fixed search_path is required because user_roles,
-- brands, campaigns, campaign_briefs, content_plan_jobs, content_plan_items
-- all have RLS enabled, so a normal session could not otherwise read them to
-- evaluate these checks. auth.uid() is NULL for anon/unauthenticated requests,
-- and user_roles.user_id is NOT NULL, so anon never matches — no anonymous
-- public access is granted.
ALTER TABLE content_assets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_asset_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_assets_select             ON content_assets;
DROP POLICY IF EXISTS content_assets_insert             ON content_assets;
DROP POLICY IF EXISTS content_assets_update             ON content_assets;
DROP POLICY IF EXISTS content_asset_collections_select  ON content_asset_collections;
DROP POLICY IF EXISTS content_asset_collections_insert  ON content_asset_collections;

DROP FUNCTION IF EXISTS content_asset_hierarchy_is_valid(UUID, UUID, UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS content_asset_user_has_scope(UUID, UUID, UUID, UUID, UUID, UUID, role_name[]);
DROP FUNCTION IF EXISTS content_asset_user_can_write(UUID, UUID, UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS content_asset_collection_hierarchy_is_valid(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS content_asset_collection_user_has_scope(UUID, UUID, UUID, role_name[]);
DROP FUNCTION IF EXISTS content_asset_collection_user_can_write(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION content_asset_hierarchy_is_valid(
  p_client_id       UUID,
  p_brand_id        UUID,
  p_campaign_id     UUID,
  p_brief_id        UUID,
  p_generation_id   UUID,
  p_content_item_id UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM brands b
      WHERE b.id = p_brand_id AND b.client_id = p_client_id
    )
    AND (
      p_campaign_id IS NULL
      OR EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.id = p_campaign_id AND c.client_id = p_client_id AND c.brand_id = p_brand_id
      )
    )
    AND (
      p_brief_id IS NULL
      OR (
        p_campaign_id IS NOT NULL
        AND content_plan_hierarchy_is_valid(p_client_id, p_brand_id, p_campaign_id, p_brief_id)
      )
    )
    AND (
      p_generation_id IS NULL
      OR (
        p_brief_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM content_plan_jobs j
          WHERE j.id          = p_generation_id
            AND j.client_id   = p_client_id
            AND j.brand_id    = p_brand_id
            AND j.campaign_id = p_campaign_id
            AND j.brief_id    = p_brief_id
        )
      )
    )
    AND (
      p_content_item_id IS NULL
      OR (
        p_generation_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM content_plan_items i
          WHERE i.id                = p_content_item_id
            AND i.generation_job_id = p_generation_id
            AND i.client_id         = p_client_id
            AND i.brand_id          = p_brand_id
            AND i.campaign_id       = p_campaign_id
            AND i.brief_id          = p_brief_id
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION content_asset_user_has_scope(
  p_client_id       UUID,
  p_brand_id        UUID,
  p_campaign_id     UUID,
  p_brief_id        UUID,
  p_generation_id   UUID,
  p_content_item_id UUID,
  p_roles           role_name[] DEFAULT ARRAY['owner','manager','client','viewer']::role_name[]
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_asset_hierarchy_is_valid(p_client_id, p_brand_id, p_campaign_id, p_brief_id, p_generation_id, p_content_item_id)
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

CREATE OR REPLACE FUNCTION content_asset_user_can_write(
  p_client_id       UUID,
  p_brand_id        UUID,
  p_campaign_id     UUID,
  p_brief_id        UUID,
  p_generation_id   UUID,
  p_content_item_id UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_asset_user_has_scope(
    p_client_id, p_brand_id, p_campaign_id, p_brief_id, p_generation_id, p_content_item_id,
    ARRAY['owner','manager']::role_name[]
  );
$$;

CREATE OR REPLACE FUNCTION content_asset_collection_hierarchy_is_valid(
  p_client_id   UUID,
  p_brand_id    UUID,
  p_campaign_id UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM brands b
      WHERE b.id = p_brand_id AND b.client_id = p_client_id
    )
    AND (
      p_campaign_id IS NULL
      OR EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.id = p_campaign_id AND c.client_id = p_client_id AND c.brand_id = p_brand_id
      )
    );
$$;

CREATE OR REPLACE FUNCTION content_asset_collection_user_has_scope(
  p_client_id   UUID,
  p_brand_id    UUID,
  p_campaign_id UUID,
  p_roles       role_name[] DEFAULT ARRAY['owner','manager','client','viewer']::role_name[]
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_asset_collection_hierarchy_is_valid(p_client_id, p_brand_id, p_campaign_id)
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

CREATE OR REPLACE FUNCTION content_asset_collection_user_can_write(
  p_client_id   UUID,
  p_brand_id    UUID,
  p_campaign_id UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_asset_collection_user_has_scope(
    p_client_id, p_brand_id, p_campaign_id,
    ARRAY['owner','manager']::role_name[]
  );
$$;

-- content_assets: any active, unexpired, hierarchy-valid, in-scope role may
-- read; only owner/manager may insert or update (including approval_status ->
-- 'archived' — there is no DELETE policy, archive is a status update).
CREATE POLICY content_assets_select ON content_assets
  FOR SELECT
  USING (content_asset_user_has_scope(client_id, brand_id, campaign_id, brief_id, generation_job_id, content_item_id));

CREATE POLICY content_assets_insert ON content_assets
  FOR INSERT
  WITH CHECK (content_asset_user_can_write(client_id, brand_id, campaign_id, brief_id, generation_job_id, content_item_id));

CREATE POLICY content_assets_update ON content_assets
  FOR UPDATE
  USING (content_asset_user_can_write(client_id, brand_id, campaign_id, brief_id, generation_job_id, content_item_id))
  WITH CHECK (content_asset_user_can_write(client_id, brand_id, campaign_id, brief_id, generation_job_id, content_item_id));

-- content_asset_collections: same read/write split, brand-level scope. No
-- update/delete policy — there is no edit-collection UI yet.
CREATE POLICY content_asset_collections_select ON content_asset_collections
  FOR SELECT
  USING (content_asset_collection_user_has_scope(client_id, brand_id, campaign_id));

CREATE POLICY content_asset_collections_insert ON content_asset_collections
  FOR INSERT
  WITH CHECK (content_asset_collection_user_can_write(client_id, brand_id, campaign_id));
