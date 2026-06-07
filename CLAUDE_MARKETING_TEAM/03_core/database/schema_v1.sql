-- =============================================================================
-- THE CORE AGENCY — Database Schema V1
-- Target: Supabase Postgres
-- Phase: 2 (2026-06-07)
--
-- RULES:
--   - Core DB is the single source of truth.
--   - n8n and modules do NOT store data here directly.
--   - Generated ≠ Approved. Approved ≠ Published.
--   - published state requires explicit human approval action.
--   - All automation actions are logged in automation_logs + audit_logs.
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE content_status AS ENUM (
  'draft',
  'generated',
  'needs_review',
  'revision_requested',
  'approved',
  'scheduled',
  'published',
  'rejected',
  'archived',
  'failed'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'revision_requested',
  'withdrawn'
);

CREATE TYPE resource_status AS ENUM (
  'active',
  'inactive',
  'archived'
);

CREATE TYPE campaign_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
);

CREATE TYPE campaign_type AS ENUM (
  '7_day',
  '15_day',
  '30_day',
  'custom'
);

CREATE TYPE module_type AS ENUM (
  'copywriter',
  'designer',
  'video_scripter',
  'ads_manager',
  'reporter',
  'custom'
);

CREATE TYPE connector_type AS ENUM (
  'n8n_workflow',
  'module',
  'webhook',
  'api'
);

CREATE TYPE trigger_source AS ENUM (
  'manual',
  'n8n',
  'api',
  'system'
);

CREATE TYPE job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE log_level AS ENUM (
  'debug',
  'info',
  'warning',
  'error'
);

CREATE TYPE platform AS ENUM (
  'facebook',
  'instagram',
  'tiktok',
  'google',
  'youtube',
  'other'
);

CREATE TYPE content_type AS ENUM (
  'caption',
  'headline',
  'video_script',
  'design_brief',
  'ad_copy',
  'report',
  'hook',
  'cta',
  'slogan',
  'other'
);

CREATE TYPE role_name AS ENUM (
  'owner',
  'manager',
  'client',
  'viewer'
);

-- =============================================================================
-- A. IDENTITY / ACCESS
-- =============================================================================

-- users: thin wrapper around Supabase auth.users
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_profiles: display info per user
CREATE TABLE user_profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  phone        TEXT,
  timezone     TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  locale       TEXT DEFAULT 'vi',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- roles: role definitions
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        role_name NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- seed default roles
INSERT INTO roles (name, description) VALUES
  ('owner',   'Full access — manage all clients, brands, campaigns, users'),
  ('manager', 'Manage assigned clients, brands, campaigns; approve content'),
  ('client',  'Read-only access to approved content for assigned brands'),
  ('viewer',  'Read-only access, no approval rights');

-- user_roles: role assignments (can be scoped to a resource)
CREATE TABLE user_roles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id        UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  resource_type  TEXT,            -- 'global' | 'client' | 'brand' | 'campaign'
  resource_id    UUID,            -- nullable; NULL means global scope
  granted_by     UUID REFERENCES users(id),
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, role_id, resource_type, resource_id)
);

-- =============================================================================
-- B. BUSINESS OBJECTS
-- =============================================================================

-- clients: client companies
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status        resource_status NOT NULL DEFAULT 'active',
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- brands: brands per client
CREATE TABLE brands (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL,
  industry         TEXT,
  hero_product     TEXT,
  tone_of_voice    TEXT,
  target_audience  TEXT,
  primary_channels TEXT[],
  brand_colors     JSONB,
  logo_url         TEXT,
  status           resource_status NOT NULL DEFAULT 'active',
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, slug)
);

-- campaigns: campaign instances per brand
CREATE TABLE campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id         UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  name             TEXT NOT NULL,
  description      TEXT,
  campaign_type    campaign_type NOT NULL DEFAULT '7_day',
  duration_days    INT NOT NULL DEFAULT 7 CHECK (duration_days > 0),
  start_date       DATE,
  end_date         DATE,
  status           campaign_status NOT NULL DEFAULT 'draft',
  budget_estimate  NUMERIC(12,2),
  currency         TEXT DEFAULT 'VND',
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- campaign_briefs: input brief for a campaign
CREATE TABLE campaign_briefs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_name       TEXT NOT NULL,
  hero_product     TEXT,
  industry         TEXT,
  tone             TEXT,
  target_audience  TEXT,
  campaign_goals   TEXT[],
  key_messages     TEXT[],
  channels         TEXT[],
  duration_days    INT,
  additional_notes TEXT,
  submitted_by     UUID REFERENCES users(id),
  submitted_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id)
);

-- =============================================================================
-- C. CONTENT PRODUCTION
-- =============================================================================

-- generation_jobs: tracks each AI / module generation run
CREATE TABLE generation_jobs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  module           module_type NOT NULL,
  status           job_status NOT NULL DEFAULT 'pending',
  triggered_by     UUID REFERENCES users(id),
  trigger_source   trigger_source NOT NULL DEFAULT 'manual',
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  error_message    TEXT,
  n8n_execution_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content_items: individual content pieces
CREATE TABLE content_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  generation_job_id UUID REFERENCES generation_jobs(id),
  content_type      content_type NOT NULL DEFAULT 'other',
  title             TEXT,
  body              TEXT NOT NULL,
  metadata          JSONB,          -- platform, format, duration, day_number, etc.
  status            content_status NOT NULL DEFAULT 'draft',
  generated_at      TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id),
  approved_by       UUID REFERENCES users(id),
  published_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content_calendar_items: scheduled content per day/platform
CREATE TABLE content_calendar_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  content_item_id  UUID REFERENCES content_items(id),
  scheduled_date   DATE,
  day_number       INT CHECK (day_number > 0),
  platform         platform NOT NULL DEFAULT 'facebook',
  content_type     content_type NOT NULL DEFAULT 'caption',
  title            TEXT,
  description      TEXT,
  status           content_status NOT NULL DEFAULT 'draft',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- creative_briefs: design / video instructions
CREATE TABLE creative_briefs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  content_item_id  UUID REFERENCES content_items(id),
  module           module_type NOT NULL DEFAULT 'designer',
  instructions     TEXT NOT NULL,
  dimensions       TEXT,
  format           TEXT,
  references       JSONB,
  status           content_status NOT NULL DEFAULT 'draft',
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ad_briefs: paid ads configuration briefs
CREATE TABLE ad_briefs (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id                 UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  platform                    platform NOT NULL DEFAULT 'facebook',
  objective                   TEXT NOT NULL DEFAULT 'awareness',
  budget_estimate             NUMERIC(12,2),
  target_audience_description TEXT,
  ad_formats                  TEXT[],
  key_message                 TEXT,
  cta                         TEXT,
  status                      content_status NOT NULL DEFAULT 'draft',
  approved_by                 UUID REFERENCES users(id),
  created_by                  UUID REFERENCES users(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- D. APPROVAL WORKFLOW
-- =============================================================================

-- approval_requests: approval requests for any resource
CREATE TABLE approval_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type  TEXT NOT NULL,   -- 'content_item' | 'ad_brief' | 'creative_brief' | 'campaign' | 'export_pack'
  resource_id    UUID NOT NULL,
  campaign_id    UUID REFERENCES campaigns(id),
  title          TEXT NOT NULL,
  status         approval_status NOT NULL DEFAULT 'pending',
  requested_by   UUID NOT NULL REFERENCES users(id),
  assigned_to    UUID REFERENCES users(id),
  due_date       TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ
);

-- approval_events: immutable log of every approval action
CREATE TABLE approval_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL,  -- 'submitted' | 'approved' | 'rejected' | 'revision_requested' | 'withdrawn' | 'reassigned' | 'comment_added'
  actor_id            UUID NOT NULL REFERENCES users(id),
  previous_status     approval_status,
  new_status          approval_status,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- approval_comments: threaded review comments
CREATE TABLE approval_comments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  author_id           UUID NOT NULL REFERENCES users(id),
  body                TEXT NOT NULL,
  is_internal         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- E. ASSETS / REPORTS
-- =============================================================================

-- asset_collections: grouped asset sets
CREATE TABLE asset_collections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- assets: uploaded or generated creative assets
CREATE TABLE assets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id            UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  campaign_id         UUID REFERENCES campaigns(id),
  collection_id       UUID REFERENCES asset_collections(id),
  name                TEXT NOT NULL,
  file_type           TEXT NOT NULL,   -- 'image' | 'video' | 'audio' | 'document' | 'archive'
  mime_type           TEXT,
  file_url            TEXT NOT NULL,
  thumbnail_url       TEXT,
  file_size_bytes     BIGINT,
  metadata            JSONB,           -- width, height, duration, etc.
  status              content_status NOT NULL DEFAULT 'draft',
  approval_request_id UUID REFERENCES approval_requests(id),
  uploaded_by         UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- reports: campaign performance reports
CREATE TABLE reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id       UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  generation_job_id UUID REFERENCES generation_jobs(id),
  report_type       TEXT NOT NULL DEFAULT 'summary',   -- 'performance' | 'summary' | 'weekly' | 'monthly' | 'final'
  title             TEXT NOT NULL,
  body              TEXT,
  period_start      DATE,
  period_end        DATE,
  status            content_status NOT NULL DEFAULT 'draft',
  generated_by      UUID REFERENCES users(id),
  approved_by       UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- report_metrics: individual metric rows per report
CREATE TABLE report_metrics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id     UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  metric_name   TEXT NOT NULL,
  metric_value  NUMERIC,
  metric_unit   TEXT,         -- 'count' | 'percent' | 'currency'
  platform      TEXT,
  date_recorded DATE,
  is_estimated  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- F. AUTOMATION / MODULES
-- =============================================================================

-- connector_registry: registered n8n / module / webhook connectors
CREATE TABLE connector_registry (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL UNIQUE,
  type             connector_type NOT NULL DEFAULT 'webhook',
  description      TEXT,
  endpoint_url     TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT FALSE,
  last_triggered_at TIMESTAMPTZ,
  config           JSONB,           -- non-secret config only
  registered_by    UUID REFERENCES users(id),
  registered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- module_registry: registered processing modules
CREATE TABLE module_registry (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL UNIQUE,
  module_type  module_type NOT NULL,
  version      TEXT NOT NULL DEFAULT '1.0.0',
  description  TEXT,
  endpoint_url TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT FALSE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- module_events: inbound events from modules (Module Event Inbox)
CREATE TABLE module_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id         UUID REFERENCES module_registry(id),
  generation_job_id UUID REFERENCES generation_jobs(id),
  campaign_id       UUID REFERENCES campaigns(id),
  event_type        TEXT NOT NULL,  -- 'task_received' | 'processing_started' | 'processing_completed' | 'callback_sent' | 'callback_received' | 'error'
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'processed' | 'error'
  payload_summary   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- webhook_callbacks: raw webhook payloads received from modules/n8n
CREATE TABLE webhook_callbacks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_event_id   UUID REFERENCES module_events(id),
  generation_job_id UUID REFERENCES generation_jobs(id),
  source            TEXT NOT NULL,    -- module name or 'n8n'
  http_method       TEXT NOT NULL DEFAULT 'POST',
  endpoint_path     TEXT NOT NULL,
  payload           JSONB NOT NULL,
  response_status   INT,
  response_body     JSONB,
  is_processed      BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at      TIMESTAMPTZ,
  error_message     TEXT,
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- automation_logs: full automation audit trail
CREATE TABLE automation_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level      log_level NOT NULL DEFAULT 'info',
  source         TEXT NOT NULL,     -- 'n8n' | module name | 'core_api' | 'system'
  action         TEXT NOT NULL,
  resource_type  TEXT,
  resource_id    UUID,
  message        TEXT NOT NULL,
  metadata       JSONB,
  actor_id       UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- G. SAFETY / GOVERNANCE
-- =============================================================================

-- audit_logs: immutable system-wide audit trail
CREATE TABLE audit_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id       UUID REFERENCES users(id),
  action         TEXT NOT NULL,     -- e.g. 'content.approve', 'campaign.create', 'export.download'
  resource_type  TEXT NOT NULL,
  resource_id    UUID,
  ip_address     INET,
  user_agent     TEXT,
  old_values     JSONB,
  new_values     JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- system_settings: key-value config store
CREATE TABLE system_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,
  value       JSONB NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- seed default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('app_name',          '"The Core Agency"',                    'Public app name',                      TRUE),
  ('app_tagline',       '"AI Marketing Team Workspace"',        'App tagline',                          TRUE),
  ('app_mode',          '"Real Operations MVP"',                'Current operating mode',               TRUE),
  ('auto_post_enabled', 'false',                                'Auto-post guard (must stay false)',    FALSE),
  ('auto_ads_enabled',  'false',                                'Auto-ads guard (must stay false)',     FALSE),
  ('require_approval',  'true',                                 'Require approval before publish',      FALSE);

-- =============================================================================
-- INDEXES (performance)
-- =============================================================================

CREATE INDEX idx_user_roles_user     ON user_roles(user_id);
CREATE INDEX idx_brands_client       ON brands(client_id);
CREATE INDEX idx_campaigns_brand     ON campaigns(brand_id);
CREATE INDEX idx_campaigns_client    ON campaigns(client_id);
CREATE INDEX idx_content_items_campaign ON content_items(campaign_id);
CREATE INDEX idx_content_items_status   ON content_items(status);
CREATE INDEX idx_calendar_campaign   ON content_calendar_items(campaign_id);
CREATE INDEX idx_generation_jobs_campaign ON generation_jobs(campaign_id);
CREATE INDEX idx_approval_requests_resource ON approval_requests(resource_type, resource_id);
CREATE INDEX idx_approval_events_request ON approval_events(approval_request_id);
CREATE INDEX idx_assets_brand        ON assets(brand_id);
CREATE INDEX idx_assets_campaign     ON assets(campaign_id);
CREATE INDEX idx_module_events_job   ON module_events(generation_job_id);
CREATE INDEX idx_webhook_callbacks_processed ON webhook_callbacks(is_processed);
CREATE INDEX idx_automation_logs_source ON automation_logs(source, created_at DESC);
CREATE INDEX idx_audit_logs_actor    ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- =============================================================================
-- UPDATED_AT TRIGGER (auto-maintain updated_at)
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','user_profiles','user_roles',
    'clients','brands','campaigns','campaign_briefs',
    'generation_jobs','content_items','content_calendar_items','creative_briefs','ad_briefs',
    'approval_requests','approval_comments',
    'asset_collections','assets','reports',
    'connector_registry','module_registry',
    'system_settings'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (enable — policies in Phase 3/4)
-- =============================================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands            ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_briefs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;

-- Phase 3 will add the actual RLS policies.
-- For now, only service_role can access (safe default).
