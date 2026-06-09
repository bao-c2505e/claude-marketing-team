# Supabase Auth & Database Wiring Plan
# The Core Agency — Phase 15

**Status:** Phase 15 DONE — Plan + Interface ready. CRUD wiring deferred to Phase 16.  
**Date:** 2026-06-09  
**Author:** Claude Code Builder (PC1)

---

## 1. Current State Audit

### 1.1 Auth Status

| Component | File | Status |
|---|---|---|
| Supabase client (anon key, null-safe) | `src/lib/supabaseClient.ts` | ✅ Ready |
| Auth context (supabase/demo/unconfigured) | `src/lib/auth/AuthContext.tsx` | ✅ Ready |
| Login screen (banner + demo fallback) | `src/components/auth/LoginScreen.tsx` | ✅ Ready |
| Role permission matrix | `src/lib/auth/permissions.ts` | ✅ Ready |
| Role fetch from DB (`user_roles` table) | `AuthContext.tsx:fetchUserRole()` | ✅ Ready — needs DB live |

**Auth conclusion:** Auth foundation is complete. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, the app will switch automatically from demo mode to real Supabase session. No code changes required for auth.

### 1.2 Database Schema Status

| Group | Tables | Schema SQL | TypeScript Types |
|---|---|---|---|
| A. Identity / Access | users, user_profiles, roles, user_roles | ✅ schema_v1.sql | ✅ core.ts |
| B. Business Objects | clients, brands, campaigns, campaign_briefs | ✅ | ✅ |
| C. Content Production | generation_jobs, content_items, content_calendar_items, creative_briefs, ad_briefs | ✅ | ✅ |
| D. Approval Workflow | approval_requests, approval_events, approval_comments | ✅ | ✅ |
| E. Assets / Reports | assets, asset_collections, reports, report_metrics | ✅ | ✅ |
| F. Automation / Modules | connector_registry, module_registry, module_events, webhook_callbacks, automation_logs | ✅ | ✅ |
| G. Safety / Governance | audit_logs, system_settings | ✅ | ✅ |

**Schema conclusion:** Schema V1 is complete and matches TypeScript types. Ready to apply to Supabase.

### 1.3 localStorage Stores → Supabase Tables Mapping

| localStorage Key | Store Interface | Tables | Phase 16 |
|---|---|---|---|
| `core_agency_core_data_v1` | `CoreDataStore` (clients, brands, campaigns, briefs) | `clients`, `brands`, `campaigns`, `campaign_briefs` | Wire in Phase 16 |
| `core_agency_gen_data_v1` | `GenerationDataStore` (generationJobs, contentItems) | `generation_jobs`, `content_items`, `content_calendar_items` (for calendar edits) | Wire in Phase 16 |
| `core_agency_approval_data_v1` | `ApprovalDataStore` (approvalRequests, approvalEvents, approvalComments) | `approval_requests`, `approval_events`, `approval_comments` | Wire in Phase 16 |
| `core_agency_asset_data_v1` | `AssetDataStore` (assets, collections) | `assets`, `asset_collections` | Wire in Phase 16 |
| `core_agency_export_pack_data_v1` | `LocalExportPack[]` | No direct schema table — keep local or add `export_packs` table in schema V2 | Phase 17+ |
| `core_agency_connector_registry_v1` | `ConnectorRegistryStore` (connectors, modules, events) | `connector_registry`, `module_registry`, `module_events` | Phase 17+ |
| `core_agency_automation_logs_v1` | `AutomationLogStore` (logs) | `automation_logs` | Phase 17+ |

### 1.4 RLS Status — Accurate Audit

> **Full policy plan (SQL, apply order, helper function):** `database/rls_policy_plan.md`

#### Tables with RLS already enabled in schema_v1.sql (11/27)
`users`, `user_profiles`, `user_roles`, `clients`, `brands`, `campaigns`, `campaign_briefs`, `content_items`, `approval_requests`, `assets`, `reports`

#### Tables that still need `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` before production (16/27)
`roles` (Phase 16 — enable + authenticated read), `generation_jobs`, `content_calendar_items`, `approval_events`, `approval_comments`, `asset_collections`, `report_metrics` (all Phase 16); `creative_briefs`, `ad_briefs`, `connector_registry`, `module_registry`, `module_events`, `webhook_callbacks`, `automation_logs`, `audit_logs`, `system_settings` (Phase 17+)

> **`roles` table**: Not sensitive (only id/name/description/created_at). Enable RLS + `roles_read_authenticated` policy so `fetchUserRole()` can resolve role names. See `database/rls_policy_plan.md` section 3.

#### ⚠️ Bootstrap problem: user_roles has RLS, no policies yet

`user_roles` is RLS-enabled but has zero policies. The anon Supabase client (used by `AuthContext.tsx:fetchUserRole()`) cannot read it. Effect: every authenticated user falls back to `viewer`. **Bootstrap policies must be applied before enabling production env.**

```sql
-- MUST apply first — without this, every sign-in gets "viewer" role
CREATE POLICY "roles_read_authenticated" ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "user_roles_read_own" ON user_roles FOR SELECT
  USING (auth.uid() = user_id AND is_active = true);
```

See `database/rls_policy_plan.md` section 3 for the full bootstrap set.

#### Key policy patterns

> **Four helper functions** replace the old single `current_user_has_role()`. See `database/rls_policy_plan.md` section 4 for full SQL.
>
> - `current_user_has_global_role(role_names[])` — global only (`resource_type IS NULL` or `'global'`)
> - `current_user_has_scoped_role(role_names[], resource_type, resource_id)` — specific tenant
> - `current_user_can_access_client(client_id)` — global staff OR scoped to this client
> - `current_user_can_access_campaign(campaign_id)` — joins via `campaign.client_id`
>
> All four use `SECURITY DEFINER` + `SET search_path = public, pg_temp`. No dynamic SQL. Boolean-only return.

**Pattern 1 — Internal staff only (global role required)**
```sql
-- Tables that must never be visible to client/viewer (automation_logs, generation_jobs, etc.)
CREATE POLICY "automation_logs_staff_only" ON automation_logs
  FOR ALL USING (current_user_has_global_role(ARRAY['owner', 'manager']));
```

**Pattern 2 — Tenant-scoped access (global OR scoped to specific client)**

Do NOT check role name alone. A `manager` scoped to Client A must not see Client B data. Use `current_user_can_access_client()` which enforces both global and scoped paths.

```sql
-- clients table: global staff OR user scoped to this specific client
CREATE POLICY "clients_read" ON clients FOR SELECT
  USING (current_user_can_access_client(clients.id));
```

**Pattern 3 — Status gate + tenant scope (content and reports)**
```sql
-- content_items: global staff sees all; client/viewer only sees approved in their tenant
CREATE POLICY "content_items_read" ON content_items FOR SELECT
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR (
      content_items.status = 'approved'
      AND current_user_can_access_campaign(content_items.campaign_id)
    )
  );
```

**Pattern 4 — Approval events/comments (tenant scope via join chain, NOT global role read)**

Approval events and comments must be scoped through `approval_request → campaign → client`. Checking only role name would expose cross-tenant data.

```sql
-- approval_events: scoped via approval_request → campaign → client
CREATE POLICY "approval_events_read" ON approval_events FOR SELECT
  USING (
    current_user_has_global_role(ARRAY['owner', 'manager'])
    OR EXISTS (
      SELECT 1 FROM approval_requests ar
      WHERE ar.id = approval_events.approval_request_id
        AND current_user_can_access_campaign(ar.campaign_id)
    )
  );

-- approval_comments: non-internal, same tenant scope
CREATE POLICY "approval_comments_client_read" ON approval_comments FOR SELECT
  USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM approval_requests ar
      WHERE ar.id = approval_comments.approval_request_id
        AND current_user_can_access_campaign(ar.campaign_id)
    )
  );
```

### 1.5 Missing / Deferred Items

| Item | Status | Decision |
|---|---|---|
| RLS policies applied | ❌ Not yet | Apply in Phase 16 alongside CRUD wiring |
| `export_packs` table in schema | ❌ Missing | Add in schema V2 if needed; keep local for now |
| `content_calendar_items` CRUD | ❌ Not wired | Wire in Phase 16 (maps from `GenerationDataStore.contentItems` calendar fields) |
| Webhook callbacks CRUD | ❌ Not wired | Phase 17+ |
| Module events CRUD | ❌ Not wired | Phase 17+ |
| Supabase Storage (file uploads) | ❌ Not wired | Phase 18 or later |

---

## 2. Environment Variables

### 2.1 Required for Production

Set in Vercel dashboard (or `.env.local` for local dev):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_dashboard
```

**Source:** Supabase Dashboard → Settings → API → Project URL + anon public key.

### 2.2 NOT for Frontend

```
SUPABASE_SERVICE_ROLE_KEY=do_not_put_in_vercel_public_env
```

This key bypasses RLS. Never expose to browser. Only for server-side scripts/migrations.

### 2.3 Current Safety Check

- `supabaseClient.ts` reads only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- No service role key is imported or used anywhere in frontend code.
- If vars are missing/placeholder, `isSupabaseConfigured = false` and app uses demo mode.

---

## 3. Supabase Client Safety

**File:** `src/lib/supabaseClient.ts`

```typescript
// SAFE — anon key only, null when unconfigured
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
```

**Rules enforced:**
- ✅ Only anon key used (reads `VITE_` prefixed vars)
- ✅ Returns `null` when unconfigured — no crash
- ✅ `isSupabaseConfigured` guard exported for use in components
- ✅ Placeholder URL/key detection prevents false-positive "configured" state
- ✅ HTTPS check on URL

**No changes needed to supabaseClient.ts.**

---

## 4. Auth Wiring — Current Flow

**File:** `src/lib/auth/AuthContext.tsx` — exports `AuthProvider` (React context) + `useAuth` hook.

```
App starts
  └── AuthProvider (src/lib/auth/AuthContext.tsx) useEffect
        ├── isSupabaseConfigured? YES
        │     └── supabase.auth.getSession()
        │           ├── session exists → fetchUserRole() → setState(supabase mode)
        │           └── no session → setState(loading=false, not authenticated)
        └── isSupabaseConfigured? NO
              └── setState(loading=false, mode='unconfigured')

signIn()
  ├── isSupabaseConfigured? NO → demo mode check (owner@thecore.agency / demo1234)
  └── isSupabaseConfigured? YES → supabase.auth.signInWithPassword()

fetchUserRole(userId)                           ← depends on bootstrap RLS policies
  └── SELECT role_id FROM user_roles WHERE user_id = $userId
        └── SELECT name FROM roles WHERE id = $role_id
              └── returns RoleName ('owner'|'manager'|'client'|'viewer')
              └── fallback → 'viewer' on any error (including RLS block)
```

**⚠️ Bootstrap required:** If `user_roles` has no RLS policy (current schema state), `fetchUserRole()` will always return empty → fallback 'viewer'. Apply bootstrap policies from `database/rls_policy_plan.md` section 3 first.

**To make auth live:** Apply schema V1, apply bootstrap RLS policies, create a Supabase user, insert a row into `user_roles`, then set env vars. No frontend code changes needed.

---

## 5. Repository Interface Plan

See `src/lib/core/coreRepository.ts` for the TypeScript interface definitions.

### 5.1 Interface Pattern

Each data domain follows:
```typescript
interface XxxRepository {
  list(filter?: XxxFilter): Promise<Xxx[]>;
  get(id: string): Promise<Xxx | null>;
  create(data: XxxFormData): Promise<Xxx>;
  update(id: string, patch: Partial<Xxx>): Promise<Xxx>;
  archive(id: string): Promise<void>;
}
```

### 5.2 Phase 16 Wiring Strategy

For Phase 16, each `load*Data()` / `save*Data()` function in `coreData.ts` will be replaced with:

```typescript
// Before (Phase 14 and earlier):
export function loadCoreData(): CoreDataStore {
  // reads from localStorage
}

// After (Phase 16):
export async function loadCoreData(): Promise<CoreDataStore> {
  if (!isSupabaseConfigured || !supabase) {
    return loadCoreDataLocal(); // localStorage fallback
  }
  const [clients, brands, campaigns, briefs] = await Promise.all([
    supabase.from('clients').select('*').eq('status', 'active'),
    supabase.from('brands').select('*'),
    supabase.from('campaigns').select('*'),
    supabase.from('campaign_briefs').select('*'),
  ]);
  return { clients: clients.data ?? [], ... };
}
```

**Priority order for Phase 16 CRUD wiring:**
1. `CoreDataStore` (clients → brands → campaigns → briefs) — foundation
2. `GenerationDataStore` (jobs → content items) — depends on CoreData
3. `ApprovalDataStore` (requests → events → comments) — depends on GenerationData
4. `AssetDataStore` (assets + collections) — depends on CoreData
5. Other stores — Phase 17+

---

## 6. SQL Apply Guide (Step-by-Step)

### Prerequisites
- Supabase account (free tier sufficient for MVP)
- `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1.sql` — full schema

### Step 1: Create Supabase Project
1. Go to https://supabase.com → New Project
2. Choose a region close to your users
3. Set a strong database password (save it securely — not in repo)
4. Wait for project to provision (~2 minutes)

### Step 2: Apply Schema
1. In Supabase dashboard → SQL Editor → New Query
2. Open `schema_v1.sql` from this repo
3. Paste entire contents and click **Run**
4. Check for errors — common issue: run `CREATE EXTENSION` first if uuid-ossp not available

### Step 3: Configure Authentication
1. Supabase dashboard → Authentication → Providers → Email: Enable
2. Authentication → Settings → Disable "Confirm email" for MVP (re-enable for production)
3. Create first user: Authentication → Users → Invite user (use your email)

### Step 4: Assign Owner Role
After schema is applied, insert seed roles and assign owner role via SQL Editor:
```sql
-- Seed roles (already in schema_v1.sql seed section, run if missing)
INSERT INTO roles (name, description) VALUES
  ('owner',   'Agency owner — full access'),
  ('manager', 'Agency manager — create, edit, approve'),
  ('client',  'Client — read-only, approved content'),
  ('viewer',  'Viewer — read-only')
ON CONFLICT (name) DO NOTHING;

-- Assign owner role to your user (replace with your auth.users UUID)
INSERT INTO user_roles (user_id, role_id, is_active, granted_at)
SELECT
  'YOUR_USER_UUID_FROM_AUTH_USERS',
  r.id,
  true,
  now()
FROM roles r WHERE r.name = 'owner';
```

### Step 5: Set Environment Variables
**For local dev:** Copy `.env.example` to `.env.local` and fill in:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**For Vercel production:**
1. Vercel dashboard → Project → Settings → Environment Variables
2. Add `VITE_SUPABASE_URL` (value: your Supabase project URL)
3. Add `VITE_SUPABASE_ANON_KEY` (value: your anon/public key)
4. **Do NOT add** `SUPABASE_SERVICE_ROLE_KEY` to Vercel — service role key bypasses RLS

### Step 6: Redeploy
```bash
git push origin main  # Vercel auto-deploys
# or manually trigger redeploy in Vercel dashboard
```

### Step 7: Verify
1. Open production URL
2. Login screen should show "Sign in" (not "Demo Sign In")
3. Sign in with email/password
4. User role badge in header should show "Owner"
5. All tabs should be accessible

---

## 7. Phase 16 CRUD Wiring Checklist

The following must be done in Phase 16. **Do RLS step first** — without it, CRUD will fail silently for non-owner users.

### Step 0 — RLS Foundation (required before any CRUD)
- [ ] Run `database/rls_policy_plan.md` Step 0: enable RLS on 16 missing tables (including `roles`)
- [ ] Apply 4 tenant-aware helper functions: `current_user_has_global_role`, `current_user_has_scoped_role`, `current_user_can_access_client`, `current_user_can_access_campaign` (see `rls_policy_plan.md` section 4)
- [ ] Apply bootstrap policies (roles, user_roles, user_profiles, users — `rls_policy_plan.md` section 3)
- [ ] Verify: sign in as owner, confirm role badge = "Owner" (not "Viewer")
- [ ] Apply Group A–G policies in order per `rls_policy_plan.md` section 12
- [ ] Run cross-tenant tests T01–T32 (`rls_policy_plan.md` section 14) — all must pass before enabling production env

### Identity / Access
- [ ] `users`, `user_profiles`, `user_roles`, `roles` — read-only from frontend (no CRUD needed, managed via Supabase Auth + SQL)

### Core Objects (Priority 1)
- [ ] `loadCoreData()` → `supabase.from('clients').select('*')` + brands + campaigns + briefs
- [ ] `saveCoreData()` → `supabase.from('clients').upsert()` etc.
- [ ] RLS policies: clients, brands, campaigns, campaign_briefs (with tenant scope)

### Content (Priority 2)
- [ ] `loadGenerationData()` → generation_jobs + content_items
- [ ] `saveGenerationData()` → upsert jobs + items
- [ ] RLS: generation_jobs (staff only), content_items (staff + approved-only for client)
- [ ] content_calendar_items — enable RLS + wire CRUD

### Approval Workflow (Priority 3)
- [ ] `loadApprovalData()` → approval_requests + approval_events + approval_comments
- [ ] `saveApprovalData()` → upsert requests; insert-only events; upsert comments
- [ ] RLS: approval_requests (tenant-scoped), approval_events (staff insert, read with scope), approval_comments (internal flag)

### Assets / Asset Collections (Priority 4)
- [ ] `loadAssetData()` → assets + asset_collections
- [ ] `saveAssetData()` → upsert assets + collections
- [ ] RLS: assets (brand-scoped + approved-gate for client), asset_collections (brand-scoped)

### Reports / Report Metrics (Priority 5)
- [ ] `loadReportData()` → reports (from `src/lib/core/reportModule.ts` or similar)
- [ ] Wire `reports` + `report_metrics` tables
- [ ] RLS: reports (campaign-scoped + approved-gate for client), report_metrics (staff read)

### Phase 17+ (deferred)
- [ ] Export packs — add `export_packs` table in schema V2 or keep localStorage
- [ ] Connector registry (`connector_registry`, `module_registry`) → Supabase
- [ ] Module events (`module_events`, `webhook_callbacks`) → Supabase
- [ ] Automation logs (`automation_logs`) → Supabase
- [ ] Audit logs → Supabase (insert-only from server actions)
- [ ] Supabase Storage for file uploads (Phase 18+)

---

## 8. Data Mode UI Indicator

**Current state:** The app already shows:
- Login screen: "⚠️ Supabase not configured" banner + pre-filled demo credentials when unconfigured
- Header: "localStorage mode" badge in Connector Registry, Automation Logs, and Export Pack tabs
- `isSupabaseConfigured` exported from `supabaseClient.ts` and used throughout components

**No additional UI changes needed for Phase 15.** Phase 16 may add a global status indicator to the dashboard.

---

## 9. Safety Invariants (Non-Negotiable)

> **Phase 15 creates the plan. Phase 16 applies and tests it. Production Supabase env must NOT be enabled until cross-tenant tests in `database/rls_policy_plan.md` section 14 pass.**

| Rule | Status | Enforced by |
|---|---|---|
| No service role key in frontend | ✅ Code enforced | `supabaseClient.ts` reads only `VITE_` vars; never add to Vercel |
| App does not crash without env | ✅ Code enforced | `isSupabaseConfigured` guard, null-safe client |
| Demo Sign In fallback preserved | ✅ Code enforced | `AuthContext.signIn()` demo branch — never remove |
| Generated ≠ Approved ≠ Published | ✅ Code + plan | State machine in `coreData.ts` + RLS `status` gate (Phase 16) |
| No auto-post / no auto-ads | ✅ Code enforced | `system_settings` seeded `false`; no frontend bypass |
| Client sees only own tenant data | ⏳ Plan only | `current_user_can_access_client()` helper — must apply + test in Phase 16 |
| Approval events/comments tenant-scoped | ⏳ Plan only | Join chain policies (section 8 of rls_policy_plan.md) — apply Phase 16 |
| `roles` table: RLS + authenticated read | ⏳ Plan only | Step 0 + bootstrap — apply Phase 16 before auth works |
| Bootstrap before prod env | ⏳ Plan only | Apply `database/rls_policy_plan.md` steps 0–3, verify role badge |
| Manager scoped ≠ manager global | ⏳ Plan only | `current_user_has_global_role()` checks `resource_type IS NULL/'global'` |
| If RLS on with no policy → zero rows | ⚠️ Risk until Phase 16 | Default Supabase behavior; do not enable env before bootstrap |

---

## 10. Next Phase

**Phase 16 — Supabase CRUD Wiring Core Objects**
- Wire Priority 1 + 2 (Core + Content) localStorage → Supabase
- Apply RLS policies
- Test with real Supabase project
- Keep localStorage fallback when Supabase not configured
