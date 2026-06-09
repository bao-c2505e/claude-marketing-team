# RLS Policy Plan — The Core Agency
# Phase 15 — To Be Applied in Phase 16

**Status:** Plan only. No policies applied yet. Apply alongside Phase 16 CRUD wiring.  
**Target DB:** Supabase Postgres (schema_v1.sql)

---

## ⚠️ Critical Warning

> **Do NOT set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in production (Vercel) until ALL bootstrap policies below are applied.**
>
> If RLS is enabled on a table with no policy, the anon/authenticated client gets zero rows. In particular, `user_roles` has RLS but no policy — meaning `fetchUserRole()` in `AuthContext.tsx` will return empty and every user will fall back to `viewer`, losing owner/manager access.
>
> **Never use `SUPABASE_SERVICE_ROLE_KEY` in frontend code.** It bypasses RLS entirely.

---

## 1. Current RLS Status (from schema_v1.sql)

### ✅ RLS Already Enabled
| Table | Group | Notes |
|---|---|---|
| users | A. Identity | |
| user_profiles | A. Identity | |
| user_roles | A. Identity | **No policies yet — bootstrap required first** |
| clients | B. Business | |
| brands | B. Business | |
| campaigns | B. Business | |
| campaign_briefs | B. Business | |
| content_items | C. Content | |
| approval_requests | D. Approval | |
| assets | E. Assets | |
| reports | E. Reports | |

### ❌ RLS Not Yet Enabled (must enable before production CRUD)
| Table | Group | Priority |
|---|---|---|
| generation_jobs | C. Content | P16 |
| content_calendar_items | C. Content | P16 |
| creative_briefs | C. Content | P17+ |
| ad_briefs | C. Content | P17+ |
| approval_events | D. Approval | P16 |
| approval_comments | D. Approval | P16 |
| asset_collections | E. Assets | P16 |
| report_metrics | E. Reports | P16 |
| connector_registry | F. Automation | P17+ |
| module_registry | F. Automation | P17+ |
| module_events | F. Automation | P17+ |
| webhook_callbacks | F. Automation | P17+ |
| automation_logs | F. Automation | P17+ |
| audit_logs | G. Safety | P17+ |
| system_settings | G. Safety | P17+ |

---

## 2. Step 0 — Enable RLS on Missing Tables (Phase 16 migration)

Apply this in SQL Editor **before** adding policies:

```sql
-- Phase 16: Enable RLS on tables missing it
ALTER TABLE generation_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_briefs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_briefs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_collections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_metrics           ENABLE ROW LEVEL SECURITY;

-- Phase 17+
ALTER TABLE connector_registry       ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_registry          ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_callbacks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings          ENABLE ROW LEVEL SECURITY;
```

---

## 3. Bootstrap Policies (CRITICAL — Apply First)

These policies must exist before any user can successfully authenticate and have their role fetched. Without them, `fetchUserRole()` in `src/lib/auth/AuthContext.tsx` returns empty and falls back to `viewer`.

```sql
-- =========================================================================
-- BOOTSTRAP: Allow authenticated users to read their own role assignment
-- Must be the FIRST policy applied after schema, before any other wiring
-- =========================================================================

-- roles table: all authenticated users can read role definitions
CREATE POLICY "roles_read_authenticated"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

-- user_roles: each user can read their own role assignment(s)
CREATE POLICY "user_roles_read_own"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id AND is_active = true);

-- user_profiles: each user can read and update their own profile
CREATE POLICY "user_profiles_read_own"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- users: each user can read their own record
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

---

## 4. Helper Function — Role Check

Create this function once. All policies use it to avoid repeating the join.

```sql
-- Helper: check if the current user has any of the given roles (globally active)
CREATE OR REPLACE FUNCTION current_user_has_role(role_names TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name = ANY(role_names)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

> `SECURITY DEFINER` lets this function bypass RLS internally so it can read `user_roles` without circular dependency.

---

## 5. Group A — Identity / Access Policies

```sql
-- owner/manager can read all user records (for team management UI)
CREATE POLICY "users_staff_read"
  ON users FOR SELECT
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- owner can manage user_roles (grant/revoke roles)
CREATE POLICY "user_roles_owner_manage"
  ON user_roles FOR ALL
  USING (current_user_has_role(ARRAY['owner']));

-- owner/manager can read all profiles
CREATE POLICY "user_profiles_staff_read"
  ON user_profiles FOR SELECT
  USING (current_user_has_role(ARRAY['owner', 'manager']));
```

---

## 6. Group B — Business Objects (Tenant-Scoped)

**Critical:** Client/viewer should only see data for clients they are assigned to. The `user_roles` table supports `resource_type = 'client'` + `resource_id` for this purpose.

```sql
-- clients: owner/manager can read all; client/viewer only see their assigned client
CREATE POLICY "clients_staff_read"
  ON clients FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
        AND ur.resource_id = clients.id
    )
  );

CREATE POLICY "clients_owner_manager_modify"
  ON clients FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- brands: same pattern — scope to client ownership
CREATE POLICY "brands_staff_read"
  ON brands FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
        AND ur.resource_id = brands.client_id
    )
  );

CREATE POLICY "brands_owner_manager_modify"
  ON brands FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- campaigns: same — scope to client_id
CREATE POLICY "campaigns_staff_read"
  ON campaigns FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
        AND ur.resource_id = campaigns.client_id
    )
  );

CREATE POLICY "campaigns_owner_manager_modify"
  ON campaigns FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- campaign_briefs: same — join via campaign → client_id
CREATE POLICY "campaign_briefs_staff_read"
  ON campaign_briefs FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM campaigns c
      JOIN user_roles ur ON ur.resource_id = c.client_id
      JOIN roles r ON r.id = ur.role_id
      WHERE c.id = campaign_briefs.campaign_id
        AND ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
    )
  );

CREATE POLICY "campaign_briefs_owner_manager_modify"
  ON campaign_briefs FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));
```

---

## 7. Group C — Content (Tenant + Status Scoped)

Clients should only see `approved` content (not `draft`, `generated`, `failed`).

```sql
-- content_items: owner/manager see all; client/viewer only see approved items in their client scope
CREATE POLICY "content_items_staff_read"
  ON content_items FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM campaigns c
      JOIN user_roles ur ON ur.resource_id = c.client_id
      JOIN roles r ON r.id = ur.role_id
      WHERE c.id = content_items.campaign_id
        AND ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
        AND content_items.status = 'approved'
    )
  );

CREATE POLICY "content_items_owner_manager_modify"
  ON content_items FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- generation_jobs: internal only
CREATE POLICY "generation_jobs_staff_only"
  ON generation_jobs FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- content_calendar_items: same as content_items scoping
CREATE POLICY "calendar_items_staff_read"
  ON content_calendar_items FOR SELECT
  USING (current_user_has_role(ARRAY['owner', 'manager']));

CREATE POLICY "calendar_items_owner_manager_modify"
  ON content_calendar_items FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));
```

---

## 8. Group D — Approval Workflow

```sql
-- approval_requests: owner/manager can manage; client can read their own scope
CREATE POLICY "approval_requests_staff_read"
  ON approval_requests FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM campaigns c
      JOIN user_roles ur ON ur.resource_id = c.client_id
      JOIN roles r ON r.id = ur.role_id
      WHERE c.id = approval_requests.campaign_id
        AND ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
    )
  );

CREATE POLICY "approval_requests_owner_manager_modify"
  ON approval_requests FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- approval_events: immutable audit — staff can read, owner/manager can insert
CREATE POLICY "approval_events_staff_read"
  ON approval_events FOR SELECT
  USING (current_user_has_role(ARRAY['owner', 'manager', 'client', 'viewer']));

CREATE POLICY "approval_events_staff_insert"
  ON approval_events FOR INSERT
  WITH CHECK (current_user_has_role(ARRAY['owner', 'manager']));

-- approval_comments: is_internal=true hidden from client
CREATE POLICY "approval_comments_staff_all"
  ON approval_comments FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

CREATE POLICY "approval_comments_client_public"
  ON approval_comments FOR SELECT
  USING (
    is_internal = false
    AND current_user_has_role(ARRAY['client', 'viewer'])
  );
```

---

## 9. Group E — Assets / Reports

```sql
-- assets: staff see all in their scope; client sees approved in their scope
CREATE POLICY "assets_staff_read"
  ON assets FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM brands b
      JOIN user_roles ur ON ur.resource_id = b.client_id
      JOIN roles r ON r.id = ur.role_id
      WHERE b.id = assets.brand_id
        AND ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
        AND assets.status = 'approved'
    )
  );

CREATE POLICY "assets_owner_manager_modify"
  ON assets FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- asset_collections: owner/manager manage; client can read in their scope
CREATE POLICY "asset_collections_staff_read"
  ON asset_collections FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM brands b
      JOIN user_roles ur ON ur.resource_id = b.client_id
      JOIN roles r ON r.id = ur.role_id
      WHERE b.id = asset_collections.brand_id
        AND ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
    )
  );

CREATE POLICY "asset_collections_owner_manager_modify"
  ON asset_collections FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- reports: owner/manager manage; client can read approved reports in their scope
CREATE POLICY "reports_staff_read"
  ON reports FOR SELECT
  USING (
    current_user_has_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM campaigns c
      JOIN user_roles ur ON ur.resource_id = c.client_id
      JOIN roles r ON r.id = ur.role_id
      WHERE c.id = reports.campaign_id
        AND ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('client', 'viewer')
        AND ur.resource_type = 'client'
        AND reports.status = 'approved'
    )
  );

CREATE POLICY "reports_owner_manager_modify"
  ON reports FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

-- report_metrics: same scope as parent report
CREATE POLICY "report_metrics_staff_read"
  ON report_metrics FOR SELECT
  USING (current_user_has_role(ARRAY['owner', 'manager']));

CREATE POLICY "report_metrics_owner_manager_modify"
  ON report_metrics FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));
```

---

## 10. Group F — Automation / Modules (Internal Only)

```sql
-- All automation tables: owner/manager only
CREATE POLICY "connector_registry_staff_only"
  ON connector_registry FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

CREATE POLICY "module_registry_staff_only"
  ON module_registry FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

CREATE POLICY "module_events_staff_only"
  ON module_events FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

CREATE POLICY "webhook_callbacks_staff_only"
  ON webhook_callbacks FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));

CREATE POLICY "automation_logs_staff_only"
  ON automation_logs FOR ALL
  USING (current_user_has_role(ARRAY['owner', 'manager']));
```

---

## 11. Group G — Safety / Governance

```sql
-- audit_logs: immutable — owner can read, no one can update/delete via client
CREATE POLICY "audit_logs_owner_read"
  ON audit_logs FOR SELECT
  USING (current_user_has_role(ARRAY['owner']));

CREATE POLICY "audit_logs_staff_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (current_user_has_role(ARRAY['owner', 'manager']));

-- system_settings: public settings readable by all; private settings owner only
CREATE POLICY "system_settings_public_read"
  ON system_settings FOR SELECT
  USING (is_public = true OR current_user_has_role(ARRAY['owner']));

CREATE POLICY "system_settings_owner_modify"
  ON system_settings FOR ALL
  USING (current_user_has_role(ARRAY['owner']));
```

---

## 12. Application Order (Phase 16)

Run in this exact order in Supabase SQL Editor:

1. **Step 0** — Enable RLS on missing tables (section 2 above)
2. **Step 1** — Create `current_user_has_role()` helper function (section 4)
3. **Step 2** — Bootstrap policies: `roles`, `user_roles`, `user_profiles`, `users` (section 3)
4. **Step 3** — Verify: sign in with real user, confirm role badge shows correctly
5. **Step 4** — Apply Group B policies (clients, brands, campaigns, briefs)
6. **Step 5** — Apply Group C, D, E policies
7. **Step 6** — Apply Group F, G policies

> Apply and test incrementally. If a policy blocks something unexpected, `DROP POLICY "name" ON table;` to roll back.

---

## 13. Safety Checklist Before Enabling Production Env

- [ ] Bootstrap policies applied (step 3 above)
- [ ] Signed in as owner — role badge shows "Owner" not "Viewer"
- [ ] client/viewer cannot see draft content_items
- [ ] client/viewer cannot see other clients' data
- [ ] automation_logs not visible to client role
- [ ] `SUPABASE_SERVICE_ROLE_KEY` not set in Vercel environment variables
- [ ] `auto_post_enabled` = false in `system_settings`
- [ ] `require_approval` = true in `system_settings`

Only after all checkboxes pass: enable `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Vercel.
