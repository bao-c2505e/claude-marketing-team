# CURRENT PHASE — Phase 16B-2 (Implemented — awaiting Codex review — 2026-06-10) | Phase 16B-1 ✅ CLOSED (Codex PASS — 2026-06-10) | Phase 16A ✅ CLOSED (Codex PASS — 2026-06-09)

## 📌 Thông tin chung
- **Phase trước:** Phase 16B-1 — Supabase CRUD Wiring: Campaigns
- **Trạng thái Phase 16B-1:** ✅ CLOSED — repository + App.tsx + CampaignsTab wired, build PASS (0 TS errors). Codex Fix 1 applied (positive `duration_days` on create). Codex result: PASS.
- **Phase hiện tại:** Phase 16B-2 — Campaign Briefs CRUD wiring — implemented, build PASS (0 TS errors), awaiting Codex review (see scope below)
- **Phase tiếp theo:** TBD — pending Codex review of Phase 16B-2

---

## 🏁 Phase 16B-2 — Campaign Briefs CRUD Wiring (Implemented — awaiting Codex review — 2026-06-10)

### Scope completed:
- Supabase CRUD repository wiring for **Campaign Briefs** only (Generation/Calendar/Approval/Reports/Asset Library untouched)
- Schema gap fixed first: `schema_v1.sql`'s `campaign_briefs` table was missing `client_id`, `brand_id`, `status`, and 13 fields that Phase 5 added to the `CampaignBrief` TS type/UI but never migrated to the DB. New **additive** migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16b2_brief_extension.sql` adds: `brief_status` enum, `client_id UUID REFERENCES clients(id)`, `brand_id UUID REFERENCES brands(id)`, `status brief_status DEFAULT 'draft'`, plus `brief_title`, `campaign_goal`, `product_focus`, `offer`, `tone_of_voice`, `content_pillars`, `must_include`, `must_avoid`, `competitors`, `reference_links`, `budget_note`, `timeline_note`, `approval_requirements`, and 2 indexes (`idx_campaign_briefs_client`, `idx_campaign_briefs_brand`). All `ADD COLUMN IF NOT EXISTS` / `CREATE TYPE ... EXCEPTION WHEN duplicate_object` — safe to re-run, **not applied to any live DB**.
- `BriefRepository` interface added: `list`, `get`, `create`, `update` with scoped param types `BriefListParams` / `BriefScopedParams`
- Supabase implementation: `SupabaseBriefRepository` (list/get/create/update)
- localStorage fallback: `LocalStorageBriefRepository`
- `createPhase16aRepositories` factory extended — bundle now returns `briefs` repo
- App.tsx wired: briefs loaded per-campaign on Supabase mount (alongside clients/brands/campaigns), `handleBriefCreate`, `handleBriefUpdate`; removed now-unused `handleCoreUpdate`
- `BriefIntakeTab.tsx`: async `onBriefCreate`/`onBriefUpdate` props, `formLoading`/`actionError` states; removed `generateId` and the broad `onUpdate(CoreDataStore)` prop; create-mode validation now requires client + brand selection (both required by `BriefFormData`)

### Tenant-scope contract (final):
- `BriefRepository.list({ clientId, brandId, campaignId })` — all 3 IDs required
- `BriefRepository.get({ clientId, brandId, campaignId, briefId })` — all 4 IDs required
- `BriefRepository.create(data: BriefFormData)` — requires `client_id` + `brand_id` + `campaign_id` (+ denormalised `brand_name`/`industry`); Supabase impl never sends an `id`, `submitted_by`, `submitted_at`, `duration_days`, or `additional_notes` — DB generates the UUID, returned row updates React state
- `BriefRepository.update({ clientId, brandId, campaignId, briefId }, patch)` — all 4 IDs required; Supabase strips `id`/`created_at`/`client_id`/`brand_id`/`campaign_id` from the patch before sending
- No `archive()` method — `BriefIntakeTab.tsx` has no Archive button; `status: 'archived'` remains reachable via `update()` (same as existing `handleStatusChange` transitions)
- Supabase brief queries always include `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId)`, plus `.eq('id', briefId)` for `get`/`update`
- `LocalStorageBriefRepository` mirrors the same `client_id`/`brand_id`/`campaign_id` filtering
- TypeScript enforces: unscoped calls (`list()`, `get({briefId})`, `update({briefId}, patch)`) do not type-check

### Data flow:
- Supabase mode: on mount, after campaigns load, briefs loaded per-campaign — `Promise.all(loadedCampaigns.map(c => repos.briefs.list({ clientId: c.client_id, brandId: c.brand_id, campaignId: c.id })))`
- localStorage mode: `LocalStorageBriefRepository` filters `loadCoreData().briefs` by `client_id` + `brand_id` + `campaign_id`
- Create: `BriefIntakeTab` resolves `brand_name`/`industry` from the selected brand at submit time, calls `onBriefCreate(data)`, then navigates to the detail view of the returned brief (real DB-issued `id`)
- Update (edit form + status transitions): `handleBriefUpdate` derives `clientId`/`brandId`/`campaignId` from the parent campaign (`coreData.campaigns.find(c => c.id === brief.campaign_id)`), calls `repos.briefs.update(...)`, merges the returned row into `coreData.briefs`

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Generation / Calendar / Approval / Reports / Asset Library: **UNCHANGED** (read `briefs` as props only, untouched)
- Build: PASS — 0 TS errors (`tsc && vite build`)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16b2_brief_extension.sql` | NEW — additive migration: `brief_status` enum, `client_id`/`brand_id`/`status` + 13 brief-detail columns, 2 indexes |
| `src/lib/core/coreData.ts` | `BriefFormData`/`EMPTY_BRIEF_FORM` extended with `brand_name`/`industry`; new shared exported `parseLines`/`parseComma` helpers |
| `src/lib/core/coreRepository.ts` | `BriefRepository` + `BriefListParams`/`BriefScopedParams` — scoped contract (replaces old unscoped interface) |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageBriefRepository` (list/get/create/update, scoped) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseBriefRepository` (list/get/create/update, scoped) |
| `src/lib/core/repositoryFactory.ts` | Added `briefs` to `Phase16aRepositories` bundle |
| `src/App.tsx` | Per-campaign brief load on Supabase mount; `handleBriefCreate`/`handleBriefUpdate`; removed unused `handleCoreUpdate`; wired into `BriefIntakeTab` |
| `src/components/core/BriefIntakeTab.tsx` | `onBriefCreate`/`onBriefUpdate` async props; `formLoading`/`actionError`; removed `generateId`/`onUpdate`/`CoreDataStore`; create-mode validation requires client + brand |

---

## 🏁 Phase 16B-1 — Campaigns CRUD Wiring (CLOSED — Codex PASS — 2026-06-10)

### Scope completed:
- Supabase CRUD repository wiring for **Campaigns** only (Briefs/Generation/Calendar/Approval/Reports untouched, deferred to 16B-2+)
- `CampaignRepository` interface extended with scoped param types: `CampaignListParams`, `CampaignGetParams`, `CampaignScopedParams`
- Supabase implementation: `SupabaseCampaignRepository` (list/get/create/update/archive)
- localStorage fallback: `LocalStorageCampaignRepository`
- `createPhase16aRepositories` factory extended — bundle now returns `campaigns` repo
- App.tsx wired: campaigns loaded per-client on Supabase mount (alongside clients/brands), `handleCampaignCreate`, `handleCampaignUpdate`
- `CampaignsTab.tsx`: async `onCampaignCreate`/`onCampaignUpdate` props, `formLoading`/`actionError` states; removed `generateId` and the broad `onUpdate(CoreDataStore)` / `briefs` prop

### Tenant-scope contract (final):
- `CampaignRepository.list({ clientId, brandId? })` — `clientId` required, `brandId` optional
- `CampaignRepository.get({ clientId, campaignId, brandId? })` — scoped by client (+ brand if given)
- `CampaignRepository.update({ clientId, brandId, campaignId }, patch)` — all 3 IDs required
- `CampaignRepository.archive({ clientId, brandId, campaignId })` — all 3 IDs required
- Supabase campaign queries always include `.eq('client_id', clientId)`, plus `.eq('brand_id', brandId)` when provided/required
- TypeScript enforces: calling list/get/update/archive without the required scope is a compile error — unscoped calls (`list()`, `get({campaignId})`, `update({campaignId}, patch)`, `archive({campaignId})`) do not type-check
- `create(data: CampaignFormData)` requires `client_id` + `brand_id`; Supabase impl never sends an `id` field — DB generates the UUID, and the returned row (with real UUID) is used to update React state

### Data flow:
- Supabase mode: on mount, campaigns loaded per-client — `Promise.all(clients.map(c => repos.campaigns.list({ clientId: c.id })))`, same pattern as brands (Phase 16A)
- localStorage mode: `LocalStorageCampaignRepository` filters `loadCoreData().campaigns` by `client_id` (+ `brand_id` when given)
- Create/update return the repository row, merged into `coreData.campaigns` React state and persisted via `saveCoreData`

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Brief / Generation / Calendar / Approval / Reports wiring: **NOT DONE** (deferred to 16B-2+)
- Build: PASS — 0 TS errors (`tsc && vite build`)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `src/lib/core/coreRepository.ts` | `CampaignRepository` interface + `CampaignListParams`/`CampaignGetParams`/`CampaignScopedParams` |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageCampaignRepository` (list/get/create/update/archive, scoped) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseCampaignRepository` (list/get/create/update/archive, scoped) |
| `src/lib/core/repositoryFactory.ts` | Added `campaigns` to `Phase16aRepositories` bundle |
| `src/App.tsx` | Per-client campaign load on Supabase mount; `handleCampaignCreate`/`handleCampaignUpdate`; wired into `CampaignsTab` |
| `src/components/core/CampaignsTab.tsx` | `onCampaignCreate`/`onCampaignUpdate` async props; `formLoading`/`actionError`; removed `generateId`/`onUpdate`/`briefs` |

---

## ✅ Phase 16B-1 Codex Fix 1 — Positive `duration_days` on Create (Applied — 2026-06-10)

### Issue fixed:
- `schema_v1.sql` defines `campaigns.duration_days INT NOT NULL DEFAULT 7 CHECK (duration_days > 0)`. Both `SupabaseCampaignRepository.create` and `LocalStorageCampaignRepository.create` hardcoded `duration_days: 0`, which would violate the CHECK constraint and fail every Supabase campaign insert.

### Fix:
- Added `calculateCampaignDurationDays(startDate, endDate)` helper to `src/lib/core/coreData.ts`: inclusive day count `max(1, round((end - start) / 1 day) + 1)` when both dates are valid; falls back to `1` if either date is missing/invalid.
- Both `SupabaseCampaignRepository.create` and `LocalStorageCampaignRepository.create` now compute `duration_days: calculateCampaignDurationDays(data.start_date, data.end_date)` instead of hardcoding `0`.

### Files changed in fix 1:
| File | Change |
|---|---|
| `src/lib/core/coreData.ts` | Added `calculateCampaignDurationDays` helper |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageCampaignRepository.create` — `duration_days` computed via helper |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseCampaignRepository.create` — `duration_days` computed via helper |

### Tenant-scope contract: UNCHANGED (list/get/update/archive scoping untouched).

### Build: PASS — 0 TS errors. git diff --check: PASS (CRLF warnings only, not errors).

---

## 🏁 Phase 16B-1 — CLOSED (Codex PASS — 2026-06-10)

- **Codex result:** PASS — no further required fixes.
- **Commits:** `e733633` (feat: add phase 16b1 campaign repository wiring) → `a2a8651` (fix: ensure positive campaign duration on create)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** Phase 16B-2 — Campaign Briefs CRUD wiring.

---

## 🏁 Phase 16A — CLOSED (Codex PASS — 2026-06-09)

### Scope completed:
- Supabase CRUD repository wiring for **Clients** and **Brands** only
- `ClientRepository` + `BrandRepository` interfaces defined and implemented
- Supabase implementations: `SupabaseClientRepository`, `SupabaseBrandRepository`
- localStorage fallback implementations: `LocalStorageClientRepository`, `LocalStorageBrandRepository`
- Repository factory: `createPhase16aRepositories` — picks impl based on `isSupabaseConfigured`
- App.tsx wired: repos on mount, client-scoped brand load, `handleClientCreate/Update`, `handleBrandCreate`

### Tenant-scope contract (final):
- `BrandRepository.list(clientId: string)` — **required**, no optional fallback
- `BrandRepository.get(id, clientId)` — scoped by both id + client_id
- `BrandRepository.update(id, clientId, patch)` — scoped by both id + client_id
- `BrandRepository.archive(id, clientId)` — scoped by both id + client_id; throws if 0 rows affected
- Supabase brand queries always include `.eq('client_id', clientId)` — no unscoped path exists
- TypeScript enforces: calling any brand op without `clientId` is a compile error

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Campaign / Brief / Generation / Calendar / Approval / Reports wiring: **NOT DONE** (deferred to 16B+)
- Codex result: **PASS**

### Commits:
| Commit | Description |
|---|---|
| `54c8281` | feat: add phase 16a supabase clients brands wiring |
| `bccd1d1` | fix: route phase 16a client brand mutations through repositories |
| `53e8450` | fix: scope phase 16a brand repository operations by client |
| `df7e6aa` | fix: require client scope for brand repository list |

---

---

## 📋 Checklist Phase 16A

### A. Repository Layer (New Files)
- [x] Created `src/lib/core/localStorageRepositories.ts`
  - `LocalStorageClientRepository` implements `ClientRepository` interface
  - `LocalStorageBrandRepository` implements `BrandRepository` interface
  - Wraps existing coreData.ts helpers (no behavior change for demo)
- [x] Created `src/lib/core/supabaseRepositories.ts`
  - `SupabaseClientRepository` implements `ClientRepository` interface
  - `SupabaseBrandRepository` implements `BrandRepository` interface
  - Anon key only — no service role key, no tenant bypass
  - Proper null-safe error handling (throws on Supabase errors)
- [x] Created `src/lib/core/repositoryFactory.ts`
  - `createPhase16aRepositories(supabase, isConfigured)` factory
  - Returns Supabase repos when configured, localStorage repos otherwise
  - `Phase16aRepositories` type exported

### B. App.tsx Wiring
- [x] Import `supabase` from supabaseClient alongside existing `isSupabaseConfigured`
- [x] Import `createPhase16aRepositories` from repositoryFactory
- [x] `useMemo` to create repos once at startup
- [x] `useEffect` on mount: if Supabase configured, fetch clients+brands, update state + localStorage
- [x] `supabaseLoadError` state — non-blocking, dismissible banner on Supabase load failure
- [x] `handleCoreUpdate` — captures `prev` state, keeps localStorage write, fires async Supabase diff sync

### C. Clients CRUD Wiring
- [x] `list()` — reads from Supabase when configured, localStorage otherwise
- [x] `get(id)` — Supabase single row fetch with PGRST116 not-found handling
- [x] `create(data)` — Supabase insert on new entity detection (diff in handleCoreUpdate)
- [x] `update(id, patch)` — Supabase update on changed entity detection (diff in handleCoreUpdate)
- [x] `archive(id)` — via update with `status: 'archived'`

### D. Brands CRUD Wiring
- [x] `list(clientId?)` — reads from Supabase with optional client_id filter
- [x] `get(id)` — Supabase single row fetch
- [x] `create(data)` — Supabase insert on new entity detection
- [x] `update(id, patch)` — Supabase update on changed entity detection
- [x] `archive(id)` — via update with `status: 'archived'`

### E. Fallback Requirements
- [x] localStorage/mock continues working without Supabase env
- [x] If Supabase unavailable, error shown in non-blocking banner (not a crash)
- [x] Demo Sign In: completely preserved
- [x] All other tabs unaffected (Campaign/Brief/Generation/Approval/etc.)

### F. Safety
- [x] No secrets, no service role key in any file
- [x] `isSupabaseConfigured` guard on all Supabase paths
- [x] Production Supabase env NOT enabled (env vars still unset)
- [x] No RLS policies applied to real DB (still plan-only from Phase 15)
- [x] No auto-post, no real ads, no real messaging
- [x] Build PASS — 0 TypeScript errors
- [x] git diff --check PASS

---

## 🗂️ Phase 16A Deliverables

| File | Type | Action |
|---|---|---|
| `src/lib/core/localStorageRepositories.ts` | Code | NEW — localStorage ClientRepository + BrandRepository |
| `src/lib/core/supabaseRepositories.ts` | Code | NEW — Supabase ClientRepository + BrandRepository |
| `src/lib/core/repositoryFactory.ts` | Code | NEW — factory picks correct impl based on config |
| `src/App.tsx` | Code | MODIFIED — repos wired, async Supabase load, diff writes |

---

## 🔌 Data Flow (Phase 16A)

```
Without Supabase env (production / demo):
  App.tsx → LocalStorageClientRepository → coreData.ts → localStorage
  (No change from Phase 15 behavior)

With Supabase env (future):
  App.tsx mount → SupabaseClientRepository.list() → Supabase DB → setCoreData + saveCoreData
  handleCoreUpdate → diff prev vs next → SupabaseClientRepository insert/update (async)
  + saveCoreData to localStorage (sync, primary write)
```

---

## 🛡️ Safety Guard (Phase 16A)
- Secrets committed: NO
- Service role key in frontend: NO
- Real API called: NO (Supabase env not set)
- Demo Sign In fallback: PRESERVED
- localStorage fallback: PRESERVED
- Campaign/Brief/Generation/Approval wiring: NOT DONE (deferred to 16B+)
- Build: PASS (0 TS errors, tsc + vite)
- git diff --check: PASS

---

## ✅ Phase 16A Codex Fix 1 (Applied — 2026-06-09)

### Issues fixed:
1. **UUID bypass (CRITICAL):** Removed `syncClientsBrandsToSupabase` which inserted local `client-*`/`brand-*` string IDs into UUID Postgres columns.
2. **Error swallowing (REQUIRED):** Removed `.catch(() => {})` — errors now propagate to UI via `formError` (create) and `actionError` (archive/activate).
3. **Repo bypass:** All client/brand mutations now route through `repos.clients` / `repos.brands` exclusively. The database row with real UUID is used to update React state.

### Files changed in fix 1:
| File | Change |
|---|---|
| `src/components/core/ClientsTab.tsx` | Async `onClientCreate`/`onClientUpdate` props; `formLoading`/`actionError` states; removed `generateId`, `onUpdate`, `briefs` |
| `src/components/core/BrandsTab.tsx` | Async `onBrandCreate` prop; `formLoading` state; removed `generateId`, `onUpdate`, `briefs` |
| `src/App.tsx` | Removed `syncClientsBrandsToSupabase`; added `handleClientCreate`, `handleClientUpdate`, `handleBrandCreate`; restored `handleCoreUpdate` to pure localStorage write |

---

## ✅ Phase 16A Codex Fix 2 — Tenant-Scoped Brand Operations (Applied — 2026-06-09)

### Issues fixed:
1. **Unscoped brand list (REQUIRED):** `App.tsx` called `repos.brands.list()` with no `clientId`, loading all brands across all clients in a single query. Fixed: clients loaded first, then brands fetched per-client via `Promise.all(clients.map(c => repos.brands.list(c.id)))`.
2. **Brand get without client_id:** `SupabaseBrandRepository.get(id)` only filtered by `id`. Fixed: now requires `clientId`, adds `.eq('client_id', clientId)`.
3. **Brand update without client_id:** `SupabaseBrandRepository.update(id, patch)` only scoped by `id`. Fixed: now requires `clientId`, adds `.eq('client_id', clientId)`, surfaces PGRST116 as a typed error.
4. **Brand archive without client_id:** `SupabaseBrandRepository.archive(id)` only scoped by `id`. Fixed: now requires `clientId`, adds `.eq('client_id', clientId)`, returns error if no row affected.
5. **Interface not enforcing clientId:** `BrandRepository` interface had `get`, `update`, `archive` without required `clientId`. Fixed: TypeScript now requires `clientId` for all three — callers cannot call them unscoped.
6. **LocalStorage repo not validating clientId:** `LocalStorageBrandRepository.get/update/archive` matched by id only. Fixed: all three now filter/verify by both `id` and `client_id`.

### Files changed in fix 2:
| File | Change |
|---|---|
| `src/lib/core/coreRepository.ts` | `BrandRepository.get/update/archive` — added required `clientId: string` param |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseBrandRepository.get/update/archive` — added `.eq('client_id', clientId)` to all queries; archive now returns error if 0 rows affected |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageBrandRepository.get/update/archive` — filter/verify by both `id` and `client_id`; throws if not found for that client |
| `src/App.tsx` | Initial Supabase load: replaced `repos.brands.list()` with sequential client-then-per-client-brands load |

### Build: PASS — 0 TS errors. git diff --check: PASS (CRLF warnings only, not errors).

---

## ✅ Phase 16A Codex Fix 3 — Mandatory clientId on BrandRepository.list (Applied — 2026-06-09)

### Issue fixed:
- `BrandRepository.list(clientId?: string)` had `clientId` optional, allowing an unscoped all-brand read to compile without error.

### Changes:
1. **`coreRepository.ts`:** `list(clientId?: string)` → `list(clientId: string)` — TypeScript now rejects any call site that omits `clientId`.
2. **`supabaseRepositories.ts`:** `SupabaseBrandRepository.list` signature made required; conditional `.eq('client_id', clientId)` replaced with unconditional `.eq('client_id', clientId)` — no code path can read all brands.
3. **`localStorageRepositories.ts`:** `LocalStorageBrandRepository.list` signature made required; ternary `clientId ? filter : all` replaced with unconditional `filter(b => b.client_id === clientId)`.

### Call site verification:
- Only call site: `App.tsx:275` — `repos.brands.list(c.id)` — already passes `c.id`, no change required.

### Build: PASS — 0 TS errors. git diff --check: PASS.

---

## 🔮 Phase 16B-2 Recommended Scope
- Campaign Briefs CRUD wiring (`campaign_briefs` table), same repository + tenant-scope pattern as Campaigns (16B-1)
- Connect brief creation flow to Supabase
- Keep localStorage fallback

---

## ✅ Previous Phases (CLOSED)

| Phase | Feature | Commit |
|---|---|---|
| Phase 1 | Strategy + Branding | 317c6c8 |
| Phase 2 | Database Schema V1 | d0cb365 |
| Phase 3 | Auth + Role Permission | d8b972a |
| Phase 4 | Client/Brand/Campaign Management | 28f62f8 |
| Phase 5 | Brief Intake | 4585c45 |
| Phase 6 | Content Generation | 858a18a |
| Phase 7 | Content Calendar | c93eb3d |
| Phase 8 | Approval Workflow | 061b879 |
| Phase 9 | Client View Foundation | 860d06e |
| Phase 10 | Asset Library Foundation | 2ff8007 |
| Phase 11 | Report Module Foundation | 6e15e25 |
| Phase 12 | Export Pack Foundation | 860d06e |
| Phase 13 | Connector Registry + Module Event Inbox | f21dbf7 |
| Phase 14 | Automation Logs Foundation | 2d3c009 |
| Phase 15 | Supabase Auth + Database Wiring Plan | 68e8982 |
| Phase 16A | Supabase CRUD Wiring — Clients + Brands (Codex PASS) | df7e6aa |
| Phase 16B-1 | Supabase CRUD Wiring — Campaigns (Codex PASS) | a2a8651 |
