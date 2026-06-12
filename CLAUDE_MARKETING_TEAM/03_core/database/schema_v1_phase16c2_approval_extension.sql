-- =============================================================================
-- THE CORE AGENCY — Schema Extension: content_approval_requests / events /
-- comments (Phase 16C-2)
--
-- Phase 8 (frontend) introduced ContentApprovalRequest / ContentApprovalEvent /
-- ContentApprovalComment types for the approval workflow on
-- content_plan_items (Phase 16C-1). This additive migration creates matching
-- tables so Supabase CRUD wiring (Phase 16C-2) can persist approval requests,
-- their history events, and review comments.
--
-- Every approval request belongs to exactly one content_plan_items row, which
-- belongs to exactly one content_plan_jobs row — so every request carries the
-- full client/brand/campaign/brief/generation_job scope and every operation
-- is validated against that full chain, never by approval id alone.
--
-- Safe to run multiple times (IF NOT EXISTS / duplicate_object guards, DROP
-- POLICY IF EXISTS before CREATE POLICY). Additive only — no existing
-- tables/columns are altered or dropped. Not applied to any live database;
-- production Supabase env remains OFF.
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE content_approval_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'revision_requested',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_priority AS ENUM (
    'low',
    'normal',
    'high'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_action_type AS ENUM (
    'submitted',
    'approved',
    'rejected',
    'revision_requested',
    'commented',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- content_approval_requests: one row per "submit for review" action on a
-- content_plan_items row. Carries the full client/brand/campaign/brief/
-- generation_job scope of that item so it can be queried and authorized
-- without a join.
CREATE TABLE IF NOT EXISTS content_approval_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id   UUID NOT NULL REFERENCES content_plan_items(id) ON DELETE CASCADE,
  generation_job_id UUID NOT NULL REFERENCES content_plan_jobs(id)  ON DELETE CASCADE,
  brief_id          UUID NOT NULL REFERENCES campaign_briefs(id)    ON DELETE CASCADE,
  campaign_id       UUID NOT NULL REFERENCES campaigns(id)          ON DELETE CASCADE,
  brand_id          UUID NOT NULL REFERENCES brands(id)             ON DELETE RESTRICT,
  client_id         UUID NOT NULL REFERENCES clients(id)            ON DELETE RESTRICT,
  title             TEXT NOT NULL,
  status            content_approval_status NOT NULL DEFAULT 'submitted',
  priority          approval_priority NOT NULL DEFAULT 'normal',
  requested_by      TEXT NOT NULL,
  assigned_to_role  TEXT,
  due_date          DATE,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content_approval_events: append-only history of status transitions and
-- comment notifications for a content_approval_requests row. No scope
-- columns of its own — scope is resolved via approval_request_id.
CREATE TABLE IF NOT EXISTS content_approval_events (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_request_id  UUID NOT NULL REFERENCES content_approval_requests(id) ON DELETE CASCADE,
  content_item_id      UUID NOT NULL REFERENCES content_plan_items(id)        ON DELETE CASCADE,
  action               approval_action_type NOT NULL,
  actor_label          TEXT NOT NULL,
  comment              TEXT,
  previous_status      content_approval_status,
  new_status           content_approval_status,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content_approval_comments: review comments on a content_approval_requests
-- row. is_internal = TRUE for team-only notes, FALSE for client-visible
-- feedback. No scope columns of its own — scope is resolved via
-- approval_request_id.
CREATE TABLE IF NOT EXISTS content_approval_comments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_request_id  UUID NOT NULL REFERENCES content_approval_requests(id) ON DELETE CASCADE,
  content_item_id      UUID NOT NULL REFERENCES content_plan_items(id)        ON DELETE CASCADE,
  actor_label          TEXT NOT NULL,
  comment              TEXT NOT NULL,
  is_internal          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_approval_requests_client   ON content_approval_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_requests_brand    ON content_approval_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_requests_campaign ON content_approval_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_requests_brief    ON content_approval_requests(brief_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_requests_job      ON content_approval_requests(generation_job_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_requests_item     ON content_approval_requests(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_requests_status   ON content_approval_requests(status);

CREATE INDEX IF NOT EXISTS idx_content_approval_events_request ON content_approval_events(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_events_item    ON content_approval_events(content_item_id);

CREATE INDEX IF NOT EXISTS idx_content_approval_comments_request ON content_approval_comments(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_content_approval_comments_item    ON content_approval_comments(content_item_id);

-- updated_at trigger — mirrors set_updated_at() defined in schema_v1.sql
DO $$ BEGIN
  CREATE TRIGGER trg_content_approval_requests_updated_at
    BEFORE UPDATE ON content_approval_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS — enabled with tenant-scoped, role-aware, hierarchy-validated policies,
-- following the pattern established in schema_v1_phase16c1_generation_extension.sql:
-- user_roles(user_id, role_id, resource_type, resource_id, is_active,
-- expires_at) joined to roles(name), where resource_type is
-- 'global' | 'client' | 'brand' | 'campaign', resource_id is the matching
-- client/brand/campaign id (NULL for 'global'), and roles.name is one of
-- 'owner' | 'manager' | 'client' | 'viewer'.
--
-- content_approval_hierarchy_is_valid() reuses content_plan_hierarchy_is_valid()
-- (Phase 16C-1) to verify client_id/brand_id/campaign_id/brief_id form one
-- consistent tenant chain, verifies that generation_job_id is a
-- content_plan_jobs row whose own client/brand/campaign/brief ids match the
-- same chain, and additionally verifies that content_item_id is a
-- content_plan_items row belonging to that exact generation_job_id AND whose
-- own client/brand/campaign/brief ids also match the same chain. A row whose
-- six ids (client/brand/campaign/brief/generation/content_item) don't form a
-- single real chain — e.g. a content_item_id borrowed from a different
-- generation/brief/campaign/brand/client — is never authorized, regardless of
-- role.
--
-- content_approval_user_has_scope() checks whether auth.uid() has a
-- user_roles row that is active, unexpired, scoped to the row's
-- client/brand/campaign (or 'global'), and assigned a role in p_roles
-- (defaults to all four project roles), AND that
-- content_approval_hierarchy_is_valid() holds for the row's six ids
-- (including content_item_id).
--
-- content_approval_user_can_write() narrows p_roles to the write-capable
-- roles ('owner', 'manager') — matches canRequestApproval / canApproveContent
-- / canRejectContent in src/lib/auth/permissions.ts, which are owner/manager
-- only. The 'client' and 'viewer' roles can read but can never submit,
-- approve, reject, request revision, cancel, or insert events/comments
-- (including 'commented' events and review comments) — write access to
-- content_approval_requests/events/comments is owner/manager only.
--
-- content_approval_events / content_approval_comments carry no scope columns
-- of their own beyond approval_request_id and content_item_id, so
-- content_approval_request_user_has_scope() /
-- content_approval_request_user_can_write() take BOTH the parent
-- approval_request_id AND the child row's own content_item_id, verify the
-- referenced content_approval_requests row exists and has that exact
-- content_item_id (so an event/comment can never reference a different
-- content item than its parent request), and then delegate to the functions
-- above using the parent request's full six-id scope.
--
-- SECURITY DEFINER + fixed search_path is required because user_roles,
-- brands, campaigns, campaign_briefs, content_plan_jobs, content_plan_items
-- and content_approval_requests all have RLS enabled, so a normal session
-- could not otherwise read them to evaluate these checks. auth.uid() is NULL
-- for anon/unauthenticated requests, and user_roles.user_id is NOT NULL, so
-- anon never matches — no anonymous public access is granted.
ALTER TABLE content_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approval_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approval_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_approval_requests_select ON content_approval_requests;
DROP POLICY IF EXISTS content_approval_requests_insert ON content_approval_requests;
DROP POLICY IF EXISTS content_approval_requests_update ON content_approval_requests;
DROP POLICY IF EXISTS content_approval_events_select   ON content_approval_events;
DROP POLICY IF EXISTS content_approval_events_insert   ON content_approval_events;
DROP POLICY IF EXISTS content_approval_comments_select ON content_approval_comments;
DROP POLICY IF EXISTS content_approval_comments_insert ON content_approval_comments;

-- Drop prior-signature helpers so CREATE OR REPLACE below can't leave a stale
-- overload (without content_item_id in the chain) reachable. Policies are
-- dropped above, so these drops never need CASCADE.
DROP FUNCTION IF EXISTS content_approval_hierarchy_is_valid(UUID, UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS content_approval_user_has_scope(UUID, UUID, UUID, UUID, UUID, role_name[]);
DROP FUNCTION IF EXISTS content_approval_user_can_write(UUID, UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS content_approval_request_user_has_scope(UUID, role_name[]);
DROP FUNCTION IF EXISTS content_approval_request_user_can_write(UUID);

CREATE OR REPLACE FUNCTION content_approval_hierarchy_is_valid(
  p_client_id        UUID,
  p_brand_id         UUID,
  p_campaign_id      UUID,
  p_brief_id         UUID,
  p_generation_id    UUID,
  p_content_item_id  UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_plan_hierarchy_is_valid(p_client_id, p_brand_id, p_campaign_id, p_brief_id)
    AND EXISTS (
      SELECT 1
      FROM content_plan_jobs j
      WHERE j.id          = p_generation_id
        AND j.client_id   = p_client_id
        AND j.brand_id    = p_brand_id
        AND j.campaign_id = p_campaign_id
        AND j.brief_id    = p_brief_id
    )
    AND EXISTS (
      SELECT 1
      FROM content_plan_items i
      WHERE i.id                = p_content_item_id
        AND i.generation_job_id = p_generation_id
        AND i.client_id         = p_client_id
        AND i.brand_id          = p_brand_id
        AND i.campaign_id       = p_campaign_id
        AND i.brief_id          = p_brief_id
    );
$$;

CREATE OR REPLACE FUNCTION content_approval_user_has_scope(
  p_client_id        UUID,
  p_brand_id         UUID,
  p_campaign_id      UUID,
  p_brief_id         UUID,
  p_generation_id    UUID,
  p_content_item_id  UUID,
  p_roles            role_name[] DEFAULT ARRAY['owner','manager','client','viewer']::role_name[]
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_approval_hierarchy_is_valid(p_client_id, p_brand_id, p_campaign_id, p_brief_id, p_generation_id, p_content_item_id)
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

CREATE OR REPLACE FUNCTION content_approval_user_can_write(
  p_client_id        UUID,
  p_brand_id         UUID,
  p_campaign_id      UUID,
  p_brief_id         UUID,
  p_generation_id    UUID,
  p_content_item_id  UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_approval_user_has_scope(
    p_client_id, p_brand_id, p_campaign_id, p_brief_id, p_generation_id, p_content_item_id,
    ARRAY['owner','manager']::role_name[]
  );
$$;

CREATE OR REPLACE FUNCTION content_approval_request_user_has_scope(
  p_approval_request_id UUID,
  p_content_item_id     UUID,
  p_roles               role_name[] DEFAULT ARRAY['owner','manager','client','viewer']::role_name[]
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM content_approval_requests req
    WHERE req.id              = p_approval_request_id
      AND req.content_item_id = p_content_item_id
      AND content_approval_user_has_scope(
        req.client_id, req.brand_id, req.campaign_id, req.brief_id, req.generation_job_id, req.content_item_id, p_roles
      )
  );
$$;

CREATE OR REPLACE FUNCTION content_approval_request_user_can_write(
  p_approval_request_id UUID,
  p_content_item_id     UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_approval_request_user_has_scope(
    p_approval_request_id,
    p_content_item_id,
    ARRAY['owner','manager']::role_name[]
  );
$$;

-- content_approval_requests: any active, unexpired, hierarchy-valid, in-scope
-- role may read; only owner/manager may insert (submit) or update (approve /
-- reject / request revision / cancel).
CREATE POLICY content_approval_requests_select ON content_approval_requests
  FOR SELECT
  USING (content_approval_user_has_scope(client_id, brand_id, campaign_id, brief_id, generation_job_id, content_item_id));

CREATE POLICY content_approval_requests_insert ON content_approval_requests
  FOR INSERT
  WITH CHECK (content_approval_user_can_write(client_id, brand_id, campaign_id, brief_id, generation_job_id, content_item_id));

CREATE POLICY content_approval_requests_update ON content_approval_requests
  FOR UPDATE
  USING (content_approval_user_can_write(client_id, brand_id, campaign_id, brief_id, generation_job_id, content_item_id))
  WITH CHECK (content_approval_user_can_write(client_id, brand_id, campaign_id, brief_id, generation_job_id, content_item_id));

-- content_approval_events: any in-scope role may read. INSERT (status
-- transitions AND 'commented' notifications) requires owner/manager —
-- read-only roles ('client'/'viewer') can never insert events.
CREATE POLICY content_approval_events_select ON content_approval_events
  FOR SELECT
  USING (content_approval_request_user_has_scope(approval_request_id, content_item_id));

CREATE POLICY content_approval_events_insert ON content_approval_events
  FOR INSERT
  WITH CHECK (content_approval_request_user_can_write(approval_request_id, content_item_id));

-- content_approval_comments: any in-scope role may read. INSERT requires
-- owner/manager — read-only roles ('client'/'viewer') can never insert
-- comments.
CREATE POLICY content_approval_comments_select ON content_approval_comments
  FOR SELECT
  USING (content_approval_request_user_has_scope(approval_request_id, content_item_id));

CREATE POLICY content_approval_comments_insert ON content_approval_comments
  FOR INSERT
  WITH CHECK (content_approval_request_user_can_write(approval_request_id, content_item_id));
