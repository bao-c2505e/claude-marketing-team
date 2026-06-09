# RLS Policy Plan — The Core Agency
# Phase 15 — To Be Applied in Phase 16

**Status:** Plan only (Phase 15). Policies NOT yet applied. Apply and test in Phase 16 before enabling production Supabase env.
**Target DB:** Supabase Postgres (schema_v1.sql)

> This document is a **plan**, not a done checklist. Enabling Supabase production env before completing sections 2–14 and passing the cross-tenant tests in section 14 is a security risk.
>
> **Phase 16 must not start until Codex returns PASS on this RLS/tenant isolation plan.**

---

## ⚠️ Critical Warnings (Read First)

> **1. Do NOT enable production env (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Vercel) until:**
> - Bootstrap policies in section 3 are applied
> - Cross-tenant isolation tests in section 14 pass
> - `SUPABASE_SERVICE_ROLE_KEY` is NOT in Vercel public env
>
> **2. If RLS is enabled on a table with zero policies:** the authenticated client gets zero rows. `user_roles` already has RLS but no policies — `fetchUserRole()` will always fall back to `viewer` until bootstrap is applied.
>
> **3. Never use `SUPABASE_SERVICE_ROLE_KEY` in frontend code.** It bypasses RLS entirely.
>
> **4. Role check alone is not enough for multi-tenant data.** A user with `manager` role scoped to Client A must NOT see Client B's data. All tenant data policies must check ownership via `resource_type = 'client' AND resource_id = <client_id>`, not just role name.

---

## 1. Current RLS Status — All 27 Tables

### ✅ RLS Enabled in schema_v1.sql (11 tables)
| Table | Group | Notes |
|---|---|---|
| users | A. Identity | |
| user_profiles | A. Identity | |
| user_roles | A. Identity | **RLS on, zero policies — bootstrap required** |
| clients | B. Business | |
| brands | B. Business | |
| campaigns | B. Business | |
| campaign_briefs | B. Business | |
| content_items | C. Content | |
| approval_requests | D. Approval | |
| assets | E. Assets | |
| reports | E. Reports | |

### ❌ RLS Not Enabled — Must enable before any production CRUD (16 tables)
| Table | Group | Phase | Decision |
|---|---|---|---|
| **roles** | A. Identity | P16 | Enable RLS + authenticated read (safe: no sensitive data) |
| generation_jobs | C. Content | P16 | Internal staff only |
| content_calendar_items | C. Content | P16 | Staff + client (approved only) |
| creative_briefs | C. Content | P17+ | Internal staff only |
| ad_briefs | C. Content | P17+ | Internal staff only |
| approval_events | D. Approval | P16 | Tenant-scoped (NOT global role read) |
| approval_comments | D. Approval | P16 | Tenant-scoped + is_internal gate |
| asset_collections | E. Assets | P16 | Tenant-scoped |
| report_metrics | E. Reports | P16 | Staff + client (approved parent) |
| connector_registry | F. Automation | P17+ | Staff only |
| module_registry | F. Automation | P17+ | Staff only |
| module_events | F. Automation | P17+ | Staff only |
| webhook_callbacks | F. Automation | P17+ | Staff only |
| automation_logs | F. Automation | P17+ | Staff only |
| audit_logs | G. Safety | P17+ | Owner only |
| system_settings | G. Safety | P17+ | Public fields + owner |

> **Note on `roles` table:** Contains only id, name (enum), description, created_at. No sensitive data. Decision: enable RLS + allow all authenticated users to read. This is required for `fetchUserRole()` in AuthContext.tsx to resolve role names from the DB.

---

## 2. Step 0 — Enable RLS on Missing Tables (Phase 16 migration)

Apply in SQL Editor **before** adding any policies. After this step, each listed table has RLS on with zero policies = authenticated client sees zero rows. Apply policies immediately after.

```sql
-- Phase 16 (apply first)
ALTER TABLE roles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_collections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_metrics            ENABLE ROW LEVEL SECURITY;

-- Phase 17+ (defer until those stores are wired)
ALTER TABLE creative_briefs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_briefs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_registry        ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_registry           ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_callbacks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings           ENABLE ROW LEVEL SECURITY;
```

---

## 3. Bootstrap Policies (CRITICAL — Apply Immediately After Step 0)

These must exist before any user can sign in and have their role resolved. Without them:
- `roles_read_authenticated` fails (roles just got RLS with zero policies)
- `user_roles_read_own` fails (user_roles has RLS with zero policies)
- `fetchUserRole()` in `src/lib/auth/AuthContext.tsx` returns empty → falls back to `viewer`

```sql
-- =========================================================================
-- BOOTSTRAP — apply right after Step 0, before helper functions
-- =========================================================================

-- roles: all authenticated users can read role definitions (no sensitive data)
CREATE POLICY "roles_read_authenticated"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

-- user_roles: each user reads only their own active assignments
CREATE POLICY "user_roles_read_own"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id AND is_active = true);

-- user_profiles: each user reads/updates their own profile
CREATE POLICY "user_profiles_read_own"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- users: each user reads their own record
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

**Verify after applying:** Sign in with a real Supabase user. Role badge in header must show their actual role (e.g., "Owner"), not fall back to "Viewer".

---

## 4. Helper Functions — Tenant-Aware Role Checks

> **Why four functions instead of one?**
>
> A single `current_user_has_role(role_names)` that checks all `user_roles` rows regardless of `resource_type` is incorrect for multi-tenant data. A `manager` assigned to Client A only (`resource_type = 'client', resource_id = client_A_id`) would be treated as a global manager and could read Client B's data. The helpers below enforce the distinction.

> **SECURITY DEFINER safety rules:**
> - `SET search_path = public, pg_temp` is required to prevent search_path hijacking
> - Never use dynamic SQL (`EXECUTE`) in these helpers
> - Only return `BOOLEAN` — never return row data from a SECURITY DEFINER function
> - These functions read `user_roles` and `roles` tables, which must have bootstrap policies applied first

```sql
-- =========================================================================
-- Helper 1: Global role check
-- Returns true ONLY if user has the role with global scope
-- (resource_type IS NULL or resource_type = 'global')
-- Use for: staff-only tables, internal operations
-- =========================================================================
CREATE OR REPLACE FUNCTION current_user_has_global_role(role_names TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND (ur.resource_type IS NULL OR ur.resource_type = 'global')
      AND r.name = ANY(role_names)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;


-- =========================================================================
-- Helper 2: Scoped role check
-- Returns true if user has the role for a specific resource (tenant)
-- Use for: verifying client/viewer access to a specific client record
-- =========================================================================
CREATE OR REPLACE FUNCTION current_user_has_scoped_role(
  role_names        TEXT[],
  p_resource_type   TEXT,
  p_resource_id     UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND ur.resource_type = p_resource_type
      AND ur.resource_id = p_resource_id
      AND r.name = ANY(role_names)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;


-- =========================================================================
-- Helper 3: Can access client
-- Returns true if:
--   (a) user has global owner/manager role, OR
--   (b) user has scoped manager/client/viewer for this specific client
-- Use for: clients table, brands table (via brand.client_id), user assignments
-- =========================================================================
CREATE OR REPLACE FUNCTION current_user_can_access_client(target_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR current_user_has_scoped_role(
         ARRAY['manager', 'client', 'viewer'],
         'client',
         target_client_id
       )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;


-- =========================================================================
-- Helper 4: Can access campaign
-- Returns true if user can access the campaign's parent client
-- Use for: campaigns, campaign_briefs, content_items, approval_requests,
--          approval_events (via request), approval_comments (via request),
--          reports, generation_jobs
-- =========================================================================
CREATE OR REPLACE FUNCTION current_user_can_access_campaign(target_campaign_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = target_campaign_id
      AND current_user_can_access_client(c.client_id)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_temp;
```

---

## 5. Group A — Identity / Access Policies

```sql
-- owner/manager (global) can read all user records
CREATE POLICY "users_staff_read"
  ON users FOR SELECT
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- owner (global only) can manage role assignments
CREATE POLICY "user_roles_owner_manage"
  ON user_roles FOR ALL
  USING (current_user_has_global_role(ARRAY['owner']));

-- owner/manager (global) can read all profiles
CREATE POLICY "user_profiles_staff_read"
  ON user_profiles FOR SELECT
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));
```

---

## 6. Group B — Business Objects (Tenant-Scoped)

All four helpers are used here. Key rule: `clients` access checks `current_user_can_access_client(clients.id)`. Everything downstream (brands, campaigns, briefs) ultimately resolves to the same client check.

```sql
-- clients: global staff OR user scoped to this client
CREATE POLICY "clients_read"
  ON clients FOR SELECT
  USING (current_user_can_access_client(clients.id));

CREATE POLICY "clients_modify"
  ON clients FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- brands: access via brand.client_id
CREATE POLICY "brands_read"
  ON brands FOR SELECT
  USING (current_user_can_access_client(brands.client_id));

CREATE POLICY "brands_modify"
  ON brands FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- campaigns: access via campaign.client_id
CREATE POLICY "campaigns_read"
  ON campaigns FOR SELECT
  USING (current_user_can_access_client(campaigns.client_id));

CREATE POLICY "campaigns_modify"
  ON campaigns FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- campaign_briefs: access via brief→campaign→client
CREATE POLICY "campaign_briefs_read"
  ON campaign_briefs FOR SELECT
  USING (current_user_can_access_campaign(campaign_briefs.campaign_id));

CREATE POLICY "campaign_briefs_modify"
  ON campaign_briefs FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));
```

---

## 7. Group C — Content (Tenant + Status Scoped)

> **Three-tier access for content_items:**
> - Global staff (owner/manager global): sees all statuses, all tenants
> - Scoped manager (manager scoped to a client): sees all statuses in their tenant — including draft/generated/failed needed for review workflow
> - Client/viewer: only `approved` content in their tenant
>
> Without the scoped-manager tier, a manager assigned only to Client A cannot review or edit drafts in their tenant, breaking the review workflow.

```sql
-- content_items: three-tier access
CREATE POLICY "content_items_read"
  ON content_items FOR SELECT
  USING (
    -- Tier 1: Global staff — sees everything (all statuses, all tenants)
    current_user_has_global_role(ARRAY['owner', 'manager'])
    -- Tier 2: Scoped manager — sees all statuses within their tenant
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = content_items.campaign_id
        AND current_user_has_scoped_role(ARRAY['manager'], 'client', c.client_id)
    )
    -- Tier 3: Client/viewer — approved only within their tenant
    OR (
      content_items.status = 'approved'
      AND EXISTS (
        SELECT 1 FROM campaigns c
        WHERE c.id = content_items.campaign_id
          AND current_user_has_scoped_role(ARRAY['client', 'viewer'], 'client', c.client_id)
      )
    )
  );

-- content_items modify: global staff or scoped manager can create/update
CREATE POLICY "content_items_modify"
  ON content_items FOR ALL
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = content_items.campaign_id
        AND current_user_has_scoped_role(ARRAY['manager'], 'client', c.client_id)
    )
  );

-- generation_jobs: internal only — client/viewer never sees generation runs
CREATE POLICY "generation_jobs_staff_only"
  ON generation_jobs FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- content_calendar_items: internal (editorial calendar is staff-only)
CREATE POLICY "calendar_items_read"
  ON content_calendar_items FOR SELECT
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

CREATE POLICY "calendar_items_modify"
  ON content_calendar_items FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));
```

---

## 8. Group D — Approval Workflow (Tenant-Scoped, Not Global)

> **Why approval_events and approval_comments must be tenant-scoped:**
>
> Approval events are linked to `approval_requests`, which are linked to `campaigns`, which are linked to `clients`. A client/viewer from Client B must not be able to read approval events or comments for Client A's requests, even if `is_internal = false`. The join chain must go all the way through to client ownership.

```sql
-- -------------------------------------------------------------------------
-- approval_requests
-- -------------------------------------------------------------------------
CREATE POLICY "approval_requests_read"
  ON approval_requests FOR SELECT
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR current_user_can_access_campaign(approval_requests.campaign_id)
  );

CREATE POLICY "approval_requests_modify"
  ON approval_requests FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- -------------------------------------------------------------------------
-- approval_events — tenant-scoped read
-- Path: approval_events.approval_request_id
--       → approval_requests.campaign_id
--       → campaigns.client_id
--       → user_roles.resource_id
-- Global staff can read all; scoped users only see events in their tenant
-- -------------------------------------------------------------------------
CREATE POLICY "approval_events_read"
  ON approval_events FOR SELECT
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM approval_requests ar
      WHERE ar.id = approval_events.approval_request_id
        AND current_user_can_access_campaign(ar.campaign_id)
    )
  );

-- Only global staff (owner/manager) can insert events
CREATE POLICY "approval_events_insert"
  ON approval_events FOR INSERT
  WITH CHECK (current_user_has_global_role(ARRAY['owner', 'manager']));

-- -------------------------------------------------------------------------
-- approval_comments — three-tier access
--
-- Tier 1: Global owner/manager — full access to all comments in all tenants
-- Tier 2: Scoped manager of the correct tenant — reads ALL comments
--         (internal + non-internal) for approval requests in their tenant.
--         Scoped managers need internal comments for the review workflow.
--         Cross-tenant scoped managers are denied.
-- Tier 3: Client/viewer — non-internal only, within their tenant only
--
-- ⚠️ Tier 2 MUST use current_user_has_scoped_role(['manager']) not
--    current_user_can_access_campaign() — the latter also returns true for
--    client/viewer and would expose internal comments to them.
-- -------------------------------------------------------------------------

-- Tier 1: Global staff full access
CREATE POLICY "approval_comments_global_staff_all"
  ON approval_comments FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- Tier 2: Scoped manager reads all comments (internal + non-internal) in their tenant
CREATE POLICY "approval_comments_scoped_staff_read"
  ON approval_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM approval_requests ar
      JOIN campaigns c ON c.id = ar.campaign_id
      WHERE ar.id = approval_comments.approval_request_id
        AND current_user_has_scoped_role(ARRAY['manager'], 'client', c.client_id)
    )
  );

-- Tier 3: Client/viewer reads non-internal only, within their tenant
CREATE POLICY "approval_comments_client_read"
  ON approval_comments FOR SELECT
  USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM approval_requests ar
      WHERE ar.id = approval_comments.approval_request_id
        AND current_user_can_access_campaign(ar.campaign_id)
    )
  );
```

---

## 9. Group E — Assets / Reports (Tenant-Scoped)

```sql
-- assets: global staff sees all; client sees approved assets in their brand scope
CREATE POLICY "assets_read"
  ON assets FOR SELECT
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR (
      assets.status = 'approved'
      AND current_user_can_access_client(
            (SELECT client_id FROM brands WHERE id = assets.brand_id)
          )
    )
  );

CREATE POLICY "assets_modify"
  ON assets FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- asset_collections: brand-scoped
CREATE POLICY "asset_collections_read"
  ON asset_collections FOR SELECT
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR current_user_can_access_client(
         (SELECT client_id FROM brands WHERE id = asset_collections.brand_id)
       )
  );

CREATE POLICY "asset_collections_modify"
  ON asset_collections FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- reports: campaign-scoped; client only sees approved
CREATE POLICY "reports_read"
  ON reports FOR SELECT
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR (
      reports.status = 'approved'
      AND current_user_can_access_campaign(reports.campaign_id)
    )
  );

CREATE POLICY "reports_modify"
  ON reports FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

-- report_metrics: tied to report — staff reads; client only if parent report approved
CREATE POLICY "report_metrics_read"
  ON report_metrics FOR SELECT
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM reports rp
      WHERE rp.id = report_metrics.report_id
        AND rp.status = 'approved'
        AND current_user_can_access_campaign(rp.campaign_id)
    )
  );

CREATE POLICY "report_metrics_modify"
  ON report_metrics FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));
```

---

## 10. Group F — Automation / Modules (Global Staff Only)

These tables are internal infrastructure. Client/viewer must never read them.

```sql
CREATE POLICY "connector_registry_staff_only"
  ON connector_registry FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

CREATE POLICY "module_registry_staff_only"
  ON module_registry FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

CREATE POLICY "module_events_staff_only"
  ON module_events FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

CREATE POLICY "webhook_callbacks_staff_only"
  ON webhook_callbacks FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));

CREATE POLICY "automation_logs_staff_only"
  ON automation_logs FOR ALL
  USING (current_user_has_global_role(ARRAY['owner', 'manager']));
```

---

## 11. Group G — Safety / Governance

```sql
-- audit_logs: owner can read; staff can insert; no one can update or delete via client
CREATE POLICY "audit_logs_owner_read"
  ON audit_logs FOR SELECT
  USING (current_user_has_global_role(ARRAY['owner']));

CREATE POLICY "audit_logs_staff_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (current_user_has_global_role(ARRAY['owner', 'manager']));

-- system_settings: public settings readable by all authenticated users; private owner only
CREATE POLICY "system_settings_public_read"
  ON system_settings FOR SELECT
  USING (is_public = true OR current_user_has_global_role(ARRAY['owner']));

CREATE POLICY "system_settings_owner_modify"
  ON system_settings FOR ALL
  USING (current_user_has_global_role(ARRAY['owner']));
```

---

## 12. Application Order (Phase 16)

Run in this exact order. Each step must succeed before the next.

```
Step 0  — Enable RLS on 16 missing tables (section 2)
          ↓ (tables now have RLS + zero policies = blocked)
Step 1  — Bootstrap policies: roles, user_roles, user_profiles, users (section 3)
          ↓
Step 2  — Create 4 helper functions (section 4)
          ↓
Step 3  — Verify: sign in as owner, role badge = "Owner" (NOT "Viewer")
          If still "Viewer": check bootstrap policies, re-apply
          ↓
Step 4  — Apply Group A additional policies (section 5)
Step 5  — Apply Group B policies (section 6)
Step 6  — Apply Group C policies (section 7)
Step 7  — Apply Group D policies (section 8) — approval with tenant scope
Step 8  — Apply Group E policies (section 9)
Step 9  — Apply Group F policies (section 10) — only when Phase 17 stores are wired
Step 10 — Apply Group G policies (section 11) — only when Phase 17 stores are wired
          ↓
Step 11 — Run cross-tenant tests (section 14)
          ↓
Step 12 — Enable VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in Vercel ONLY after tests pass
```

> To roll back a policy: `DROP POLICY "policy_name" ON table_name;`
> To drop a helper: `DROP FUNCTION function_name(args);`

---

## 13. Safety Checklist Before Enabling Production Env

- [ ] Step 0 applied — RLS enabled on all Phase 16 tables
- [ ] Bootstrap policies applied (section 3)
- [ ] 4 helper functions created (section 4)
- [ ] Signed in as owner — role badge = "Owner" (not "Viewer")
- [ ] All Group B–E policies applied
- [ ] Cross-tenant tests pass (section 14)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` NOT in Vercel environment variables
- [ ] `auto_post_enabled` = false in `system_settings`
- [ ] `require_approval` = true in `system_settings`
- [ ] Demo Sign In still works when env vars removed

All boxes checked → enable `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Vercel.

---

## 14. Recommended Cross-Tenant Tests (Run Before Production Env)

> **⚠️ These are EXPECTED policy outcomes, not executed results.**
> All tests below are PLANNED. Mark each as PASS only after running against a real Supabase project with the policies applied. Do not enable production Supabase env until all tests pass on a real DB.

### Test Setup

Create in Supabase Auth + `user_roles` table:

| User | Email | Role | Scope |
|---|---|---|---|
| U1 | owner@test.com | owner | global (`resource_type` NULL) |
| U2 | manager-a@test.com | manager | scoped to Client A (`resource_type='client', resource_id=client_A_id`) |
| U3 | client-a@test.com | client | scoped to Client A |
| U4 | client-b@test.com | client | scoped to Client B |
| U5 | viewer-a@test.com | viewer | scoped to Client A |
| U6 | viewer-b@test.com | viewer | scoped to Client B |

Create: Client A, Client B. For each client: one campaign, one `content_item` with `status='approved'`, one with `status='draft'`. One `approval_request` with one `approval_event`, one `approval_comment` with `is_internal=false`, one with `is_internal=true`.

### Test Cases

```
──────────────────────────────────────────────────────────────
 Basic tenant access (clients table)
──────────────────────────────────────────────────────────────
T01  U1 (owner global)  reads clients       → sees Client A + B          ☐ EXPECTED
T02  U2 (manager A)     reads clients       → sees only Client A          ☐ EXPECTED
T03  U3 (client A)      reads clients       → sees only Client A          ☐ EXPECTED
T04  U4 (client B)      reads clients       → sees only Client B          ☐ EXPECTED
T05  U5 (viewer A)      reads clients       → sees only Client A          ☐ EXPECTED
T06  U6 (viewer B)      reads Client A row  → denied (zero rows)          ☐ EXPECTED

──────────────────────────────────────────────────────────────
 Content access (content_items — status gate)
──────────────────────────────────────────────────────────────
T07  U1 (owner global)  reads draft content_A   → sees it                 ☐ EXPECTED
T08  U2 (manager A)     reads draft content_A   → sees it (scoped staff)  ☐ EXPECTED
T09  U2 (manager A)     reads draft content_B   → denied                  ☐ EXPECTED
T10  U3 (client A)      reads approved content_A → sees it                ☐ EXPECTED
T11  U3 (client A)      reads draft content_A   → denied (status gate)   ☐ EXPECTED
T12  U5 (viewer A)      reads approved content_A → sees it                ☐ EXPECTED
T13  U5 (viewer A)      reads draft content_A   → denied (status gate)   ☐ EXPECTED
T14  U4 (client B)      reads Client A content  → denied (cross-tenant)  ☐ EXPECTED

──────────────────────────────────────────────────────────────
 Approval events
──────────────────────────────────────────────────────────────
T15  U2 (manager A)     reads approval_events for Client A → sees them    ☐ EXPECTED
T16  U2 (manager A)     reads approval_events for Client B → denied       ☐ EXPECTED
T17  U3 (client A)      reads approval_events for Client A → sees them    ☐ EXPECTED
T18  U4 (client B)      reads approval_events for Client A → denied       ☐ EXPECTED
T19  U5 (viewer A)      reads approval_events for Client A → sees them    ☐ EXPECTED
T20  U6 (viewer B)      reads approval_events for Client A → denied       ☐ EXPECTED

──────────────────────────────────────────────────────────────
 Approval comments (is_internal gate + tenant scope)
──────────────────────────────────────────────────────────────
T21  U1 (owner global)  reads is_internal=true  comment for A request → sees it   ☐ EXPECTED
T22  U2 (manager A)     reads is_internal=true  comment for A request → sees it   ☐ EXPECTED
T23  U2 (manager A)     reads is_internal=true  comment for B request → denied    ☐ EXPECTED
T24  U3 (client A)      reads is_internal=false comment for A request → sees it   ☐ EXPECTED
T25  U3 (client A)      reads is_internal=true  comment for A request → denied    ☐ EXPECTED
T26  U4 (client B)      reads is_internal=false comment for A request → denied    ☐ EXPECTED
T27  U5 (viewer A)      reads is_internal=false comment for A request → sees it   ☐ EXPECTED
T28  U5 (viewer A)      reads is_internal=true  comment for A request → denied    ☐ EXPECTED
T29  U6 (viewer B)      reads is_internal=false comment for A request → denied    ☐ EXPECTED

──────────────────────────────────────────────────────────────
 Internal infrastructure (automation tables)
──────────────────────────────────────────────────────────────
T30  U3 (client A)      reads automation_logs    → denied                  ☐ EXPECTED
T31  U5 (viewer A)      reads connector_registry → denied                  ☐ EXPECTED

──────────────────────────────────────────────────────────────
 Demo fallback
──────────────────────────────────────────────────────────────
T32  Remove env vars, open app                  → Demo Sign In works        ☐ EXPECTED

──────────────────────────────────────────────────────────────
 Scoped manager update allow/deny
──────────────────────────────────────────────────────────────
T33  U2 (manager A)     updates content_item in tenant A → allowed (content_items_modify policy allows scoped manager) ☐ EXPECTED
T34  U2 (manager A)     updates content_item in tenant B → denied (cross-tenant, resource_id mismatch)                 ☐ EXPECTED
```

**All 34 tests must show PASS on a real Supabase DB before enabling production env in Vercel.**

### Diagnostics

If T02 fails (manager A sees Client B): verify `current_user_has_global_role` filters `resource_type IS NULL OR 'global'`.
If T08 fails (manager A cannot see draft in A): verify `content_items_read` Tier 2 uses `current_user_has_scoped_role(['manager'], 'client', c.client_id)`.
If T16 fails (manager A sees Client B events): verify `approval_events_read` joins `approval_requests → campaigns → client_id`.
If T22 fails (manager A cannot see internal comments in A): verify `approval_comments_scoped_staff_read` joins `approval_requests → campaigns` and checks `current_user_has_scoped_role(['manager'], ...)`.
If T25 fails (client A sees internal comments): verify `approval_comments_client_read` only applies to `is_internal = false` rows.
