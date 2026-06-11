# CURRENT PHASE — Phase 17 ✅ CLOSED (2026-06-11) | Phase 16D ✅ CLOSED (Codex PASS — 2026-06-11) | Phase 16C-2 ✅ CLOSED (Codex PASS — 2026-06-11) | Phase 16C-1 ✅ CLOSED (Codex PASS — 2026-06-11) | Phase 16B-2 ✅ CLOSED (Codex PASS — 2026-06-10) | Phase 16B-1 ✅ CLOSED (Codex PASS — 2026-06-10) | Phase 16A ✅ CLOSED (Codex PASS — 2026-06-09)

## 📌 Thông tin chung
- **Phase trước:** Phase 16D — Asset Library CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)
- **Phase hiện tại:** Phase 17 — End-to-end Workflow Test — ✅ CLOSED (2026-06-11). `vitest` added as a devDependency (zero extra config — runs in vitest's default `node` environment via `npm run test`); `assetRepoFor()`/`approvalRepoFor()`'s inline UUID-gating predicates extracted verbatim into `src/lib/core/repoRouting.ts` (`assetScopeIsSupabaseSafe`, `approvalScopeIsSupabaseSafe`, `okOrAbsentUuid`) and unit-tested (34 tests); `sanitizeAssetPatch`/`sanitizeGenerationPatch`/`sanitizeBriefPatch` + `isUuid`/`generateId` unit-tested (11 tests) in `src/lib/core/coreRepository.test.ts`. Manual MVP E2E workflow checklist added at `CLAUDE_MARKETING_TEAM/08_logs/phase_17_e2e_checklist.md`. Build PASS (0 TS errors, 1575 modules), `npm run test` 45/45 PASS.
- **Phase tiếp theo:** TBD (pending Owner direction)

---

## 🏁 Phase 17 — End-to-end Workflow Test (CLOSED — 2026-06-11)

### Scope completed:
- Test runner: `vitest` (already a transitive dep, now an explicit
  devDependency) + `npm run test` / `npm run test:watch` scripts in
  `package.json`. No `vite.config.ts` test block needed — vitest 3.x runs
  pure-function tests against its default `node` environment with zero
  config.
- New `src/lib/core/repoRouting.ts`: the inline UUID-gating predicates from
  `App.tsx`'s `assetRepoFor()`/`approvalRepoFor()` (Phases 16C-2/16D + both
  Codex fix rounds) extracted **verbatim** as pure, exported functions —
  `assetScopeIsSupabaseSafe(ids: AssetRouteIds)`,
  `approvalScopeIsSupabaseSafe(ids: ApprovalRouteIds)`,
  `okOrAbsentUuid(v?: string | null)`. `App.tsx` now imports and calls these
  directly — behavior unchanged, routing logic now unit-testable in
  isolation.
- New `src/lib/core/repoRouting.test.ts` (34 tests): full valid-UUID chains
  → true; local-format `clientId`/`brandId` → false; every optional scope id
  (`campaignId`/`briefId`/`generationId`/`contentItemId`/
  `assetCollectionId`/`currentAssetCollectionId`) absent (undefined/null) →
  true, present-but-local-format → false; `assetId`/`approvalId`/
  `contentItemId` local-format → false; **Codex Fix Round 2 case** — local
  CURRENT `asset_collection_id` with NEXT collection id `null` or a valid
  UUID → still false (stays on localStorage).
- New `src/lib/core/coreRepository.test.ts` (11 tests): `sanitizeAssetPatch`
  strips all `ASSET_IMMUTABLE_PATCH_FIELDS` (snake_case + camelCase) while
  preserving editable fields including `asset_collection_id`;
  `sanitizeGenerationPatch`/`sanitizeBriefPatch` strip their respective
  immutable field sets while preserving `status`/`brief_title`; `isUuid`
  true/false cases; `generateId` produces a prefixed id that never passes
  `isUuid`.
- New `CLAUDE_MARKETING_TEAM/08_logs/phase_17_e2e_checklist.md`: manual MVP
  E2E workflow checklist (Client → Brand → Campaign → Brief → Generation →
  Approval → Asset Library, plus UUID-gating fallback verification in both
  Local/Demo and Supabase-configured modes) — companion to the unit tests
  above; UI sections deferred (no browser-automation tool available this
  session).

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO** — secrets grep clean
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Routing/sanitization behavior: **UNCHANGED** — pure refactor (extraction +
  tests only), `App.tsx` diff is import + call-site only
- Build: PASS — 0 TS errors (`tsc && vite build`, 1575 modules)
- Tests: PASS — `npm run test` → 45/45 (2 files)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `package.json` / `package-lock.json` | Added `vitest` devDependency + `test`/`test:watch` scripts |
| `src/lib/core/repoRouting.ts` | NEW — `assetScopeIsSupabaseSafe`/`approvalScopeIsSupabaseSafe`/`okOrAbsentUuid` extracted from `App.tsx` |
| `src/lib/core/repoRouting.test.ts` | NEW — 34 unit tests for the routing gates |
| `src/lib/core/coreRepository.test.ts` | NEW — 11 unit tests for patch sanitizers + `isUuid`/`generateId` |
| `src/App.tsx` | `assetRepoFor()`/`approvalRepoFor()` now call the extracted predicates instead of inlining them |
| `CLAUDE_MARKETING_TEAM/08_logs/phase_17_e2e_checklist.md` | NEW — manual MVP E2E workflow checklist |

### Known future consideration:
- Manual UI/E2E sections (B–G) of the Phase 17 checklist still need a
  browser-automation pass (e.g. Playwright) or an Owner manual run —
  deferred, no browser tool available this session.

---

## 🏁 Phase 16D — Asset Library CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

### Scope completed:
- Supabase CRUD repository wiring for **Asset Library** only (Calendar/Reports/Connector Inbox/Automation Logs untouched, deferred to later phases)
- New **additive** migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16d_asset_extension.sql` creates `content_assets`/`content_asset_collections` tables matching the Phase 10 `AssetItem`/`LocalAssetCollection` TS types. `AssetItem` extended with nullable `brief_id`/`generation_job_id` (additive — old localStorage data normalized via `loadAssetData()`). RLS enabled with hierarchy-validated policies. All `CREATE TABLE/TYPE/INDEX/TRIGGER/POLICY/FUNCTION IF NOT EXISTS` / `DROP ... IF EXISTS` before `CREATE OR REPLACE` — safe to re-run, **not applied to any live DB**.
- `AssetRepository` (list/get/create/update/archive) scoped by clientId+brandId (required) + optional campaignId/briefId/generationId/contentItemId/assetCollectionId(+assetId for get/update/archive)
- `AssetCollectionRepository` (list/create) scoped by clientId+brandId+optional campaignId
- `sanitizeAssetPatch()` strips all tenant/identity/audit fields from update patches
- Supabase implementation: `SupabaseAssetRepository` / `SupabaseAssetCollectionRepository`
- localStorage fallback: `LocalStorageAssetRepository` / `LocalStorageAssetCollectionRepository`
- `createPhase16aRepositories` factory extended — bundle now returns `assets`/`assetCollections` repos
- App.tsx wired: `assetRepoFor()` per-operation repo selection; `handleAssetCreate`/`handleAssetEdit`/`handleAssetArchive` route through it
- `AssetLibraryTab.tsx`: Client/Brand/Campaign fields disabled in edit mode (immutable after create); async create/edit/archive with error banner + "Saving…" state
- Removed now-dead `createAsset`/`updateAsset`/`createCollection` helpers from `coreData.ts`

### Tenant-scope contract (final):
- `AssetRepository.list({ clientId, brandId, campaignId?, briefId?, generationId?, contentItemId?, assetCollectionId? })` — `clientId`+`brandId` required, all other levels optional
- `AssetRepository.get/update/archive(params: AssetScopedParams)` — `AssetScopedParams` is a standalone, fully-required-but-nullable interface (`clientId`, `brandId`, `campaignId`, `briefId`, `generationId`, `contentItemId`, `assetCollectionId`, `assetId`) — callers must state the asset's FULL scope (explicit `null` for levels that don't apply)
- `AssetCollectionRepository.list/create({ clientId, brandId, campaignId? })`
- `assetRepoFor()` in App.tsx selects the repository **per operation**: requires `clientId`+`brandId` as valid UUIDs, treats null/undefined optional scope ids as "absent" (always safe via `okOrAbsent`), validates `assetId`/`currentAssetCollectionId`/`assetCollectionId` when used by that operation — falls back to `LocalStorageAssetRepository` otherwise so local-format ids (`asset-*`/`col-*`/`collection-*`/`asset-collection-*`) are never sent into a Supabase UUID column
- `SupabaseAssetRepository` (list/get/create/update) calls `assertUuid`/`assertUuidOrNull` on every id it writes/filters (defense-in-depth on top of `assetRepoFor()`'s routing gate); `get`/`update` always filter on all 5 optional-hierarchy columns via `.is()`/`.eq()`

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Calendar / Reports / Connector Inbox / Automation Logs: **UNCHANGED** (untouched, deferred to later phases)
- `asset_collection_id`/`assetCollectionId` UUID-gated everywhere it could reach Supabase, including both the asset's CURRENT collection and the patch's NEXT collection (`handleAssetEdit` gates both via `okOrAbsent`)
- RLS: `content_asset_hierarchy_is_valid()` is NULL-tolerant (each deeper level — campaign/brief/generation/content_item — requires its parent non-null and validates against real FK tables, reusing `content_plan_hierarchy_is_valid()` from 16C-1 for the brief level); extended to a 7th param `p_asset_collection_id` — when present, the referenced `content_asset_collections` row must share the asset's `client_id`+`brand_id`, and if the collection has a `campaign_id`, it must match the asset's `campaign_id`
- `content_asset_user_has_scope()`/`_user_can_write()` and brand-level `content_asset_collection_*` equivalents follow the same active/unexpired-assignment + owner/manager-write pattern as 16C-1/16C-2 — read-only/client/viewer roles cannot write/archive/delete
- Build: PASS — 0 TS errors (`tsc && vite build`, 1574 modules)
- Secrets grep: clean (only `.env.example` placeholders + doc mentions)

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16d_asset_extension.sql` | NEW — additive migration: `content_assets`/`content_asset_collections` tables, RLS hierarchy-validated policies |
| `src/types/core.ts` | `AssetItem` extended with nullable `brief_id`/`generation_job_id` |
| `src/lib/core/coreData.ts` | `loadAssetData()` normalizes old localStorage data; removed dead `createAsset`/`updateAsset`/`createCollection` |
| `src/lib/core/coreRepository.ts` | `AssetRepository`/`AssetCollectionRepository` + `AssetListParams`/`AssetScopedParams`/`AssetCreateInput`/sanitizer types |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageAssetRepository`/`LocalStorageAssetCollectionRepository` (scoped) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseAssetRepository`/`SupabaseAssetCollectionRepository` (scoped, UUID-asserted) |
| `src/lib/core/repositoryFactory.ts` | Added `assets`/`assetCollections` to `Phase16aRepositories` bundle |
| `src/App.tsx` | `assetRepoFor()` per-operation repo selection; `handleAssetCreate`/`handleAssetEdit`/`handleAssetArchive` |
| `src/components/core/AssetLibraryTab.tsx` | Client/Brand/Campaign immutable in edit mode; async create/edit/archive with error banner + "Saving…" state |

### Known future consideration:
- Real file storage/upload is not enabled yet — this phase only wires safe asset metadata CRUD.

---

## ✅ Phase 16D Codex Fix Round 1 — UUID-gate asset_collection_id + Hardened Scoped Params + RLS Collection Check (Applied — 2026-06-11)

**Issue 1 (asset_collection_id not UUID-gated):** `asset_collection_id`/`assetCollectionId` could be a local id (`col-*`/`collection-*`/`asset-collection-*`) and still be sent to Supabase on create/update/get/archive.

**Fix 1:** `assetRepoFor()` in App.tsx now checks `assetCollectionId` (via `okOrAbsent`) for create/update/get/archive; `handleAssetEdit` computes `nextCollectionId` (patch's new collection if changing, else the asset's current one) and routes to `LocalStorageAssetRepository` if either the asset's current collection or the target collection is a local id.

**Issue 2 (AssetScopedParams allowed omitted hierarchy levels):** `AssetScopedParams` extended `AssetListParams`, so get/update/archive could omit hierarchy levels instead of stating the asset's full scope.

**Fix 2:** `AssetScopedParams` is now a standalone, fully-required-but-nullable interface (`clientId`, `brandId`, `campaignId`, `briefId`, `generationId`, `contentItemId`, `assetCollectionId`, `assetId`) — get/update/archive must state the FULL scope (explicit `null` for levels that don't apply). `AssetListParams` gained optional `assetCollectionId` so `AssetScopedParams` remains structurally assignable to it (reused by `assetMatchesScope()`). `SupabaseAssetRepository` (list/get/create/update) now calls `assertUuid`/`assertUuidOrNull` on every id it writes/filters; `get`/`update` always filter on all 5 optional-hierarchy columns via `.is()`/`.eq()` instead of conditionally.

**Issue 3 (RLS — asset_collection_id not validated against tenant):** `content_asset_hierarchy_is_valid()`/`_user_has_scope()`/`_user_can_write()` did not validate that a referenced `asset_collection_id` belonged to the same client/brand/campaign.

**Fix 3:** Extended all three to a 7th param `p_asset_collection_id` — when present, the referenced `content_asset_collections` row must share the asset's `client_id`+`brand_id`, and if the collection has a `campaign_id`, it must match the asset's `campaign_id`. INSERT/UPDATE policies pass `asset_collection_id` as the 7th arg. `DROP FUNCTION IF EXISTS` added for both old (6-arg) and new (7-arg) signatures for idempotent re-runs.

**Migration safety:** additive, idempotent. No anon/broad access, no secrets/service role key, production Supabase env remains OFF. Diff scoped to exactly: `coreRepository.ts`, `supabaseRepositories.ts`, `localStorageRepositories.ts`, `App.tsx`, `schema_v1_phase16d_asset_extension.sql`.

**Build:** PASS — 0 TS errors (`tsc && vite build`, 1574 modules). Secrets grep clean.

**Commit:** `a9c6644` (fix: harden asset collection uuid routing and scope)

---

## ✅ Phase 16D Codex Fix Round 2 — Gate Current asset_collection_id on Edit (Applied — 2026-06-11)

**Issue:** `handleAssetEdit()` in App.tsx gated only `nextCollectionId` (the patch's target collection), overwriting the check on the asset's EXISTING `asset_collection_id`. If the asset's CURRENT `asset_collection_id` was a local id (`col-*`/`collection-*`/`asset-collection-*`) and the patch changed it to `null` or a valid UUID, the op was incorrectly routed to Supabase (which has no row to match by that local id) and threw.

**Fix:** `assetRepoFor()` gained a `currentAssetCollectionId?: string | null` field, gated via the same `okOrAbsent` (null/undefined/UUID) check as the other ids; `handleAssetEdit()` now passes `currentAssetCollectionId: asset.asset_collection_id` alongside `assetCollectionId: nextCollectionId` — Supabase is selected only when BOTH the current and next collection ids are null/undefined or valid UUIDs. `handleAssetCreate` is unaffected (no `currentAssetCollectionId` passed → `okOrAbsent(undefined)` is always true).

**Diff:** `src/App.tsx` only, 12 insertions / 3 deletions.

**Build:** PASS — 0 TS errors (`tsc && vite build`, 1574 modules).

**Codex result:** PASS.

**Commits:** `b598844` (feat: wire asset library crud with scoped fallback) → `a9c6644` (fix: harden asset collection uuid routing and scope) → `ec0178b` (fix: gate current asset collection id on edit)

---

## 🏁 Phase 16D — CLOSED (Codex PASS — 2026-06-11)

**Summary:**
- Asset Library CRUD wired to Supabase with localStorage fallback.
- Asset operations are scoped by clientId, brandId, campaignId, briefId, generationId/contentItemId/assetCollectionId where applicable.
- assetId and assetCollectionId are UUID-gated before Supabase routing.
- Local `col-*`/`collection-*`/`asset-collection-*` IDs route to localStorage.
- `handleAssetEdit` gates both current and next `assetCollectionId`.
- RLS validates `asset_collection_id` hierarchy.
- Read-only/client/viewer roles cannot write/archive/delete.
- Production Supabase env remains OFF.
- Demo Sign In remains.
- No secrets or service role key.
- **Known future consideration:** real file storage/upload is not enabled yet — this phase only wires safe asset metadata CRUD.

- **Codex result:** PASS — no further required fixes.
- **Commits:** `b598844` (feat: wire asset library crud with scoped fallback) → `a9c6644` (fix: harden asset collection uuid routing and scope) → `ec0178b` (fix: gate current asset collection id on edit)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** TBD.

---

## 🏁 Phase 16C-2 — Approval CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

### Scope completed:
- Supabase CRUD repository wiring for **Approval** only (Calendar/Reports/Asset Library/Connector Inbox/Automation Logs untouched, deferred to later phases)
- New **additive** migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c2_approval_extension.sql` creates `content_approval_requests`, `content_approval_events`, `content_approval_comments` tables matching the Phase 8 `ContentApprovalRequest`/`ContentApprovalEvent`/`ContentApprovalComment` TS types: 3 enums (`content_approval_status`, `approval_priority`, `approval_action_type`); `content_approval_requests` carries the full `client_id`/`brand_id`/`campaign_id`/`brief_id`/`generation_job_id`/`content_item_id` scope; `content_approval_events`/`content_approval_comments` reference `approval_request_id` + `content_item_id`; 11 indexes; `updated_at` trigger via existing `set_updated_at()`; RLS enabled with full hierarchy-validated policies. All `CREATE TABLE/TYPE/INDEX/TRIGGER/POLICY/FUNCTION IF NOT EXISTS` / `DROP ... IF EXISTS` before `CREATE OR REPLACE` — safe to re-run, **not applied to any live DB**.
- `ApprovalRepository` interface added to `coreRepository.ts`: `list`, `get`, `create`, `executeAction`, `addComment` with scoped param types `ApprovalListParams` / `ApprovalScopedParams` (adds `approvalId`) / `ApprovalCreateInput`
- Supabase implementation: `SupabaseApprovalRepository`
- localStorage fallback: `LocalStorageApprovalRepository` (operates on `ApprovalDataStore` / `loadApprovalData()` / `saveApprovalData()`, key `core_agency_approval_data_v1`)
- `createPhase16aRepositories` factory extended — bundle now returns `approvals` repo
- App.tsx wired: `handleApprovalSubmit`, `handleApprovalAction`, `handleApprovalComment` route through `approvalRepoFor()`; wired into `ApprovalsTab` and `ClientViewTab` (`onComment`)

### Tenant-scope contract (final):
- `ApprovalRepository.list({ clientId, brandId, campaignId, briefId, generationId })` — all 5 IDs required
- `ApprovalRepository.get/executeAction/addComment({ ...same, approvalId })` — all 6 IDs required
- `ApprovalRepository.create(data: ApprovalCreateInput)` — requires `contentItem` + `clientId` + `brandId` + `campaignId` + `briefId` + `generationId` + `actorLabel`; Supabase impl never sends a local `approval-*`/`item-*`/`generation-*`/`job-*` id — DB generates the UUIDs, returned rows update React state
- `approvalRepoFor()` in App.tsx selects the repository **per operation**: routes to Supabase only if `isSupabaseConfigured` AND every UUID id *used by that operation* is valid —
  - list/create: `clientId`, `brandId`, `campaignId`, `briefId`, `generationId` (+ `contentItemId` for create)
  - get/executeAction/addComment/archive: also `approvalId`
  - any operation involving `contentItemId`: `contentItemId` also validated
  - if any required id is missing or not a valid UUID → routes to `LocalStorageApprovalRepository`, so local-format ids (`approval-*`/`content-item-*`/`generation-*`/`job-*`/`item-*`) are never sent into a Supabase UUID column

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Calendar / Reports / Asset Library / Connector Inbox / Automation Logs: **UNCHANGED** (untouched, deferred to later phases)
- RLS hierarchy: `content_approval_hierarchy_is_valid()` validates the full chain `client_id -> brand_id -> campaign_id -> brief_id -> generation_id -> content_item_id` (extends 16C-1's `content_plan_hierarchy_is_valid()` + validates `content_plan_jobs`/`content_plan_items` membership). `content_approval_request_user_has_scope()`/`..._can_write()` additionally require a child event/comment row's `content_item_id` to match its parent request's `content_item_id`.
- Role permissions: `content_approval_requests` insert/update and `content_approval_events`/`content_approval_comments` insert are **owner/manager only** (`content_approval_request_user_can_write`); `client`/`viewer` roles can read (requests/events/comments) but cannot insert any of the three tables.
- Build: PASS — 0 TS errors (`tsc && vite build`)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c2_approval_extension.sql` | NEW — additive migration: `content_approval_requests`/`events`/`comments` tables, 3 enums, 11 indexes, `updated_at` trigger, RLS enable + hierarchy-validated policies |
| `src/lib/core/coreRepository.ts` | `ApprovalRepository` + `ApprovalListParams`/`ApprovalScopedParams`/`ApprovalCreateInput`/result types |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageApprovalRepository` (list/get/create/executeAction/addComment, scoped) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseApprovalRepository` (list/get/create/executeAction/addComment, scoped) |
| `src/lib/core/repositoryFactory.ts` | Added `approvals` to `Phase16aRepositories` bundle |
| `src/App.tsx` | `approvalRepoFor()` per-operation repo selection; `handleApprovalSubmit`/`handleApprovalAction`/`handleApprovalComment` |
| `src/components/core/ApprovalsTab.tsx` | wired to `onApprovalSubmit`/`onApprovalAction`/`onComment` |
| `src/components/core/ClientViewTab.tsx` | wired to `onComment` (client feedback) |

---

## ✅ Phase 16C-2 Codex Fix — UUID Routing + RLS Hierarchy + Comment/Event Permissions (Applied — 2026-06-11)

**Issue 1 (App.tsx — incomplete UUID gating):** `approvalRepoFor()` validated only the 5 tenant-scope ids (`clientId`/`brandId`/`campaignId`/`briefId`/`generationId`). `approvalId` and `contentItemId` were not checked, so a local-format `approval-*`/`content-item-*` id could still be sent into a Supabase UUID column on `get`/`executeAction`/`addComment`/`create`.

**Fix 1:** `approvalRepoFor()` now accepts optional `approvalId`/`contentItemId` and routes to Supabase only if `isSupabaseConfigured` AND all 5 tenant-scope ids AND (when provided) `approvalId`/`contentItemId` are valid UUIDs — otherwise falls back to `LocalStorageApprovalRepository`. `handleApprovalSubmit` now passes `contentItemId: item.id`; `handleApprovalAction`/`handleApprovalComment` now pass `approvalId: request.id` and `contentItemId: request.content_item_id`.

**Issue 2 (RLS hierarchy — content_item_id not validated):** `content_approval_hierarchy_is_valid()` validated `client_id`/`brand_id`/`campaign_id`/`brief_id`/`generation_job_id` against `content_plan_jobs`, but never checked that `content_item_id` belongs to that same chain. Event/comment rows could reference a `content_item_id` different from their parent request's.

**Fix 2:** `content_approval_hierarchy_is_valid()` extended to 6 args (`+ p_content_item_id`), adds an `EXISTS` check against `content_plan_items` requiring `id = p_content_item_id` AND `generation_job_id`/`client_id`/`brand_id`/`campaign_id`/`brief_id` all match the same chain. `content_approval_user_has_scope()`/`..._can_write()` extended to thread `p_content_item_id` through. `content_approval_request_user_has_scope()`/`..._can_write()` extended to take `p_content_item_id` and additionally require `req.content_item_id = p_content_item_id` — so an event/comment can never reference a different content item than its parent request. All 7 policies updated to pass `content_item_id`.

**Issue 3 (role permissions — comments/events writable by read-only roles):** `content_approval_comments_insert` allowed any in-scope role (including `client`/`viewer`) to insert, and `content_approval_events_insert` allowed any in-scope role to insert `'commented'` events.

**Fix 3:** Both `content_approval_events_insert` and `content_approval_comments_insert` now use `content_approval_request_user_can_write(approval_request_id, content_item_id)` — **owner/manager only**, matching `canRequestApproval`/`canApproveContent`/`canRejectContent` in `permissions.ts`. The `client`/`viewer` "commented"-event/comment exception was removed. Read access (`SELECT`) is unchanged — any active, unexpired, in-scope role (including `client`/`viewer`) can still read requests/events/comments.

**Migration safety:** additive, idempotent — `DROP FUNCTION IF EXISTS` added for all prior signatures (param counts changed) before `CREATE OR REPLACE`. No anon/broad access, no secrets/service role key, production Supabase env remains OFF. Calendar/Reports/Asset Library/Connector Inbox/Automation Logs untouched.

**Known future consideration:** `ClientViewTab`'s "Add Feedback" path (`onComment`, `is_internal=false`) is wired to `handleApprovalComment`. Once Supabase is enabled with a `client`-role user, this insert would be rejected by RLS (owner/manager-only). Currently moot — production Supabase env is OFF and localStorage has no RLS — but real client-facing feedback in Supabase will require an explicit feedback-write role/policy decision in a later phase.

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS.

**Commits:** `871c3d0` (feat: wire approval crud with scoped fallback) → `70f8b8a` (fix: harden approval uuid routing and rls hierarchy)

---

## 🏁 Phase 16C-2 — CLOSED (Codex PASS — 2026-06-11)

**Summary:**
- Approval CRUD wired to Supabase with localStorage fallback.
- Approval operations are fully scoped by clientId, brandId, campaignId, briefId, generationId/contentItemId where applicable.
- approvalId/contentItemId/local IDs are UUID-gated before Supabase routing.
- RLS validates the full tenant/content hierarchy (client → brand → campaign → brief → generation → content item).
- Read-only/client/viewer roles cannot write approval comments/events.
- Production Supabase env remains OFF.
- Demo Sign In remains.
- No secrets or service role key.

- **Codex result:** PASS — no further required fixes.
- **Commits:** `871c3d0` (feat: wire approval crud with scoped fallback) → `70f8b8a` (fix: harden approval uuid routing and rls hierarchy)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** TBD.
- **Known future consideration:** real client feedback in Supabase will require an explicit feedback role/policy in a later phase.

---

## 🏁 Phase 16C-1 — Content Plan Generation CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

### Scope completed:
- Supabase CRUD repository wiring for **Content Plan Generation** only (Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs untouched, deferred to later phases)
- New tables: `schema_v1.sql`'s legacy `generation_jobs`/`content_items` (Phase-15-planned, campaign-scoped, unused by the app) are left untouched. New **additive** migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c1_generation_extension.sql` creates `content_plan_jobs` and `content_plan_items` tables matching the Phase 6 `ContentPlanJob`/`ContentPlanItem` TS types: 3 new enums (`content_plan_job_status`, `content_plan_item_status`, `content_plan_generation_mode`), both tables with `client_id`/`brand_id`/`campaign_id`/`brief_id` UUID FKs, `plan_length_days CHECK (IN (7,15,30))`, `requested_by TEXT` (role name, not a user UUID), 7 indexes, `updated_at` triggers via existing `set_updated_at()`, RLS enabled with tenant-scoped policies (Codex Fix 4, see below). All `CREATE TABLE/TYPE/INDEX/TRIGGER/POLICY IF NOT EXISTS` / `EXCEPTION WHEN duplicate_object` — safe to re-run, **not applied to any live DB**.
- `GenerationRepository` interface added to `coreRepository.ts`: `list`, `get`, `create`, `update`, `archive` with scoped param types `GenerationListParams` / `GenerationScopedParams` / `GenerationCreateInput`, plus `GenerationListResult`/`GenerationDetailResult` (`{ jobs, items }` / `{ job, items }`)
- Supabase implementation: `SupabaseGenerationRepository` (list/get/create/update/archive)
- localStorage fallback: `LocalStorageGenerationRepository` (operates on `GenerationDataStore` / `loadGenerationData()` / `saveGenerationData()`, key `core_agency_gen_data_v1`)
- `createPhase16aRepositories` factory extended — bundle now returns `generations` repo
- App.tsx wired: generation jobs/items loaded per-brief on Supabase mount (alongside clients/brands/campaigns/briefs), new `handleGenerationCreate` handler
- `ContentGenerationTab.tsx`: new async `onGenerate` prop; `handleGenerate` rewritten from sync `setTimeout` + direct `generateContentPlan()` call to `await onGenerate(brief, planLength)`; `genError` state + dismissible error banner; removed now-unused direct `generateContentPlan` import

### Tenant-scope contract (final):
- `GenerationRepository.list({ clientId, brandId, campaignId, briefId })` — all 4 IDs required, returns `{ jobs, items }`
- `GenerationRepository.get({ clientId, brandId, campaignId, briefId, generationId })` — all 5 IDs required
- `GenerationRepository.create(data: GenerationCreateInput)` — requires `brief` + `clientId` + `brandId` + `campaignId` + `briefId` + `planLengthDays` + `requestedBy`; calls `generateContentPlan(brief, planLengthDays, requestedBy)` for the mock plan/items, then inserts into `content_plan_jobs`/`content_plan_items`; Supabase impl never sends a local `job-*`/`item-*`/`generation-*` `id` — DB generates the UUIDs, and the returned `{ job, items }` (with real UUIDs) is used to update React state
- `GenerationRepository.update({ clientId, brandId, campaignId, briefId, generationId }, patch: GenerationUpdatePatch)` — all 5 IDs required; `GENERATION_IMMUTABLE_PATCH_FIELDS` (snake_case + camelCase tenant/identity/ownership/audit fields — see Codex Fix 3 below), `GenerationUpdatePatch = Partial<Omit<ContentPlanJob, GenerationImmutableField>>`, and the shared `sanitizeGenerationPatch()` helper strip all of those before the patch reaches storage (mirrors Phase 16B-2 Codex Fix 2)
- `GenerationRepository.archive({ clientId, brandId, campaignId, briefId, generationId })` — all 5 IDs required (Codex Fix 2); implemented as `update(params, { status: 'archived' })` in both repos
- **No method accepts `generationId` alone** — `get`/`update`/`archive`/`list` always require the full `clientId`+`brandId`+`campaignId`+`briefId` scope in addition to (for get/update/archive) `generationId`
- Supabase generation queries always include `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId).eq('brief_id', briefId)`, plus `.eq('id', generationId)` for `get`/`update` on `content_plan_jobs`. The related `content_plan_items` query in `get()` now also includes the full 4-ID tenant filter in addition to `.eq('generation_job_id', generationId)` (Codex Fix 1)
- `LocalStorageGenerationRepository` mirrors the same 4-ID (+ `generationId` for get/update/archive) filtering against `loadGenerationData()`, including the items-by-tenant filter in `get()` (Codex Fix 1)
- TypeScript enforces: unscoped calls (`list()`, `get({generationId})`, `update({generationId}, patch)`, `archive({generationId})`) do not type-check

### Data flow:
- Supabase mode: on mount, after campaigns + briefs load, generation jobs/items loaded per-brief — `Promise.all(loadedCampaigns.flatMap((c, idx) => briefArrays[idx].map(b => repos.generations.list({ clientId: c.client_id, brandId: c.brand_id, campaignId: c.id, briefId: b.id }))))`, flattened into `loadedGenerationJobs`/`loadedContentItems`, then `setGenData` + `saveGenerationData`
- localStorage mode: `LocalStorageGenerationRepository` filters `loadGenerationData()` by `client_id`+`brand_id`+`campaign_id`+`brief_id`
- Create: `ContentGenerationTab.handleGenerate` calls `onGenerate(brief, planLength)` → `App.tsx`'s `handleGenerationCreate` derives `clientId`/`brandId`/`campaignId` from the brief's parent campaign (`coreData.campaigns.find(c => c.id === brief.campaign_id)`, same pattern as `handleBriefUpdate`), calls `repos.generations.create(...)`, returns `{ job, items }` with DB-issued UUIDs; the Tab merges these into `generationJobs`/`contentItems` via the existing `onUpdate({ generationJobs, contentItems })` callback and switches to the detail view
- Update/Archive: existing `handleGenerationUpdate`/`onUpdate` state-merge flow is unchanged; `GenerationRepository.update()`/`archive()` are available for future status-transition wiring (Calendar/Approval phases) but not yet called from the UI

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Calendar / Approval / Reports / Asset Library / Connector Inbox / Automation Logs: **UNCHANGED** (untouched, deferred to later phases)
- Local IDs (`job-*`/`item-*`/`generation-*`/`brief-*`) never sent to Supabase UUID/FK columns — DB generates UUIDs for `content_plan_jobs`/`content_plan_items`, returned rows update React state
- Update patch sanitization: `sanitizeGenerationPatch()` blocks `id`, tenant scope (`client_id`/`clientId`, `brand_id`/`brandId`, `campaign_id`/`campaignId`, `brief_id`/`briefId`), audit (`created_at`/`createdAt`, `updated_at`/`updatedAt`), and ownership/audit aliases (`requested_by`/`requestedBy`, `submitted_by`/`submittedBy`, `submitted_at`/`submittedAt`, `archived_at`/`archivedAt`, `archive_at`/`archiveAt`, `deleted_at`/`deletedAt`, `owner_id`/`ownerId`, `tenant_id`/`tenantId`, `organization_id`/`organizationId`, `user_id`/`userId`) in both snake_case and camelCase
- RLS: `content_plan_jobs`/`content_plan_items` have tenant-scoped SELECT/INSERT/UPDATE policies via `content_plan_user_has_scope()` (checks `user_roles` for `auth.uid()` against `client_id`/`brand_id`/`campaign_id`, global or scoped role) — anon/unauthenticated requests never match (Codex Fix 4)
- Build: PASS — 0 TS errors (`tsc && vite build`)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c1_generation_extension.sql` | NEW — additive migration: `content_plan_jobs`/`content_plan_items` tables, 3 enums, 7 indexes, `updated_at` triggers, RLS enable + tenant-scoped policies (Codex Fix 4) |
| `src/lib/core/coreRepository.ts` | `GenerationRepository` (+ `archive`) + `GenerationListParams`/`GenerationScopedParams`/`GenerationCreateInput`/`GenerationListResult`/`GenerationDetailResult`; hardened `GENERATION_IMMUTABLE_PATCH_FIELDS`/`GenerationImmutableField`/`GenerationUpdatePatch`/`sanitizeGenerationPatch()` (Codex Fix 2 + 3) |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageGenerationRepository` (list/get/create/update/archive, scoped, backed by `loadGenerationData()`/`saveGenerationData()`); `get()` items filter now tenant-scoped (Codex Fix 1) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseGenerationRepository` (list/get/create/update/archive, scoped); `get()` items query now tenant-scoped (Codex Fix 1) |
| `src/lib/core/repositoryFactory.ts` | Added `generations` to `Phase16aRepositories` bundle |
| `src/App.tsx` | Per-brief generation load on Supabase mount; new `handleGenerationCreate`; wired into `ContentGenerationTab` via `onGenerate` |
| `src/components/core/ContentGenerationTab.tsx` | New async `onGenerate` prop; `handleGenerate` rewritten to call `onGenerate` + existing `onUpdate`; `genError` state + error banner; removed direct `generateContentPlan` import |

---

## ✅ Phase 16C-1 Codex Fix — Harden Generation Tenant Scope (Applied — 2026-06-11)

**Issue 1 (unscoped item read in `get()`):** `SupabaseGenerationRepository.get()` and `LocalStorageGenerationRepository.get()` fetched `content_plan_items` filtered only by `generation_job_id` (`.eq('generation_job_id', generationId)` / `i.generation_job_id === job.id`), without the `client_id`/`brand_id`/`campaign_id`/`brief_id` tenant filter already applied to the parent job query.

**Fix 1:** both `get()` implementations now filter `content_plan_items` by `generation_job_id` **and** `client_id`/`brand_id`/`campaign_id`/`brief_id` — Supabase adds `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId).eq('brief_id', briefId)` to the items query; localStorage adds the same 4 field checks to the `contentItems.filter()` predicate.

**Issue 2 (no scoped `archive()`):** `GenerationRepository` had no `archive()` method, unlike `CampaignRepository.archive(params: CampaignScopedParams)`.

**Fix 2:** added `archive(params: GenerationScopedParams): Promise<void>` to `GenerationRepository`, requiring all 5 IDs (`clientId`+`brandId`+`campaignId`+`briefId`+`generationId`). Both `SupabaseGenerationRepository.archive` and `LocalStorageGenerationRepository.archive` implement it as `this.update(params, { status: 'archived' })` — same pattern as `LocalStorageCampaignRepository.archive`, fully scoped via the existing `update()` query/filter chain. Cannot be called by `generationId` alone.

**Issue 3 (sanitizer gaps — camelCase + extra audit/ownership fields):** `GENERATION_IMMUTABLE_PATCH_FIELDS` only listed snake_case `id`/`client_id`/`brand_id`/`campaign_id`/`brief_id`/`created_at`/`updated_at`/`requested_by`. A dynamically-built patch using camelCase keys (`clientId`, `requestedBy`, etc.) or other ownership/audit aliases (`submittedBy`, `archivedAt`, `ownerId`, `tenantId`, `organizationId`, `userId`, …) would pass through `sanitizeGenerationPatch()` unstripped.

**Fix 3:** `GENERATION_IMMUTABLE_PATCH_FIELDS` expanded to include both snake_case and camelCase forms of: `id`, `client_id`/`clientId`, `brand_id`/`brandId`, `campaign_id`/`campaignId`, `brief_id`/`briefId`, `created_at`/`createdAt`, `updated_at`/`updatedAt`, `requested_by`/`requestedBy`, `submitted_by`/`submittedBy`, `submitted_at`/`submittedAt`, `archived_at`/`archivedAt`, `archive_at`/`archiveAt`, `deleted_at`/`deletedAt`, `owner_id`/`ownerId`, `tenant_id`/`tenantId`, `organization_id`/`organizationId`, `user_id`/`userId`. `sanitizeGenerationPatch()` signature widened to `Partial<ContentPlanJob> & Record<string, unknown>` so it can accept (and strip) these extra keys from a dynamically-built object at runtime while still returning `GenerationUpdatePatch`.

**Issue 4 (RLS enabled with no policies):** the migration enabled RLS on `content_plan_jobs`/`content_plan_items` but added no policies, leaving them accessible only to `service_role`.

**Fix 4:** added `content_plan_user_has_scope(p_client_id, p_brand_id, p_campaign_id)` — a `SECURITY DEFINER` SQL function (fixed `search_path = public`) that checks the existing `user_roles(user_id, resource_type, resource_id)` table for `auth.uid()` having a `'global'` role, or a `'client'`/`'brand'`/`'campaign'`-scoped role matching the row's tenant IDs. Added tenant-scoped `SELECT`/`INSERT`/`UPDATE` policies for both `content_plan_jobs` and `content_plan_items` using this function (each wrapped in `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`). `auth.uid()` is `NULL` for anon/unauthenticated requests and `user_roles.user_id` is `NOT NULL`, so anon never matches — **no anonymous public access** is granted. Both tables are brand-new (this migration), so no existing rows/backfill concerns.

**Tenant scope:** unchanged otherwise — `list`/`get`/`update`/`archive` still require `clientId`+`brandId`+`campaignId`+`briefId`(+`generationId`); local `job-*`/`item-*`/`generation-*` IDs still never sent to Supabase.

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

**Codex result:** Superseded — RLS (Fix 4) further hardened in Codex Fix Round 2 below; final Codex PASS recorded in the closure section below.

---

## ✅ Phase 16C-1 Codex Fix Round 2 — RLS Role Permissions + Brief Hierarchy (Applied — 2026-06-11)

**Issue 1 (role permissions / active-expired assignments):** `content_plan_user_has_scope()` (Fix 4 above) granted INSERT/UPDATE to every scoped role — including read-only `client`/`viewer` roles — and did not check `user_roles.is_active`/`expires_at`, so revoked or expired assignments still matched.

**Fix 1:** `content_plan_user_has_scope()` now requires `ur.is_active = TRUE AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`, and takes a `p_roles role_name[]` parameter (default = all four roles, for reads). New `content_plan_user_can_write()` narrows this to `ARRAY['owner','manager']`. `content_plan_jobs`/`content_plan_items` policies are split: SELECT uses `content_plan_user_has_scope(...)` (any active, unexpired, in-scope role may read); INSERT/UPDATE use `content_plan_user_can_write(...)` (only owner/manager — `client`/`viewer` can never insert/update, including transitions to `archived`).

**Issue 2 (missing brief_id / OR-based scope could authorize mismatched hierarchies):** the helper/policies omitted `brief_id`, and the role-scope OR-check (`global`/`client`/`brand`/`campaign`) could authorize a row whose `client_id`/`brand_id`/`campaign_id`/`brief_id` did not all belong to the same real tenant hierarchy.

**Fix 2:** new `content_plan_hierarchy_is_valid(p_client_id, p_brand_id, p_campaign_id, p_brief_id)` — `SECURITY DEFINER`/`STABLE` SQL function that validates, against the real `clients → brands → campaigns → campaign_briefs` FK chain, that all four ids form ONE consistent hierarchy. `content_plan_user_has_scope()` now AND-s this check with the role-assignment check, so a role-scope match alone can never authorize a row with a mismatched/borrowed id. `brief_id` is now a parameter on every helper and is included in every policy call (SELECT / INSERT WITH CHECK / UPDATE USING / UPDATE WITH CHECK) for both `content_plan_jobs` and `content_plan_items`.

**Migration safety:** additive only; `DROP POLICY IF EXISTS` + `DROP FUNCTION IF EXISTS` (for prior signatures) precede `CREATE OR REPLACE`, so the migration stays idempotent across iterative Codex-fix passes. No anon/broad access, no service role key/secrets, production Supabase env remains OFF. Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs untouched.

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS.

**Commits:** `c81b069` (fix: tighten generation rls role permissions) → `0876162` (fix: enforce generation rls brief hierarchy)

---

## 🏁 Phase 16C-1 — CLOSED (Codex PASS — 2026-06-11)

**Summary:**
- Generation CRUD wired to Supabase with localStorage fallback.
- Full scope required: clientId + brandId + campaignId + briefId.
- No get/update/archive by generationId alone.
- Local generation/job/item IDs are not sent into Supabase UUID columns.
- Update patch sanitizes tenant/audit/ownership fields.
- Archive is fully scoped.
- RLS policies enforce active/unexpired assignments, role-specific read/write permissions, and full client/brand/campaign/brief hierarchy.
- Production Supabase env remains OFF.
- Demo Sign In remains.
- No secrets or service role key.

- **Codex result:** PASS — no further required fixes.
- **Commits:** `77987ab` (feat: wire generation crud to supabase) → `db0819b` (fix: harden generation crud tenant scope) → `c81b069` (fix: tighten generation rls role permissions) → `0876162` (fix: enforce generation rls brief hierarchy)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** TBD.

---

## 🏁 Phase 16B-2 — Campaign Briefs CRUD Wiring (CLOSED — Codex PASS — 2026-06-10)

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
- `BriefRepository.update({ clientId, brandId, campaignId, briefId }, patch: BriefUpdatePatch)` — all 4 IDs required; `patch` type and the shared `sanitizeBriefPatch()` helper both strip `id`/`client_id`/`brand_id`/`campaign_id`/`created_at`/`updated_at`/`submitted_by`/`submitted_at` before the patch reaches storage (Codex Fix 2)
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

## ✅ Phase 16B-2 Codex Fix 1+2 — Migration Backfill + Brief Update Sanitizer (2026-06-10)

**Issue 1 (migration):** `schema_v1_phase16b2_brief_extension.sql` added `client_id`/`brand_id` as `NOT NULL` directly. Any existing `campaign_briefs` rows would have `NULL` `client_id`/`brand_id` and (a) fail the new `NOT NULL` constraints on migration, and (b) even if nullable, would silently disappear from every new tenant-scoped `list`/`get`/`update` query.

**Fix 1:** Migration now runs in 3 steps: (1) add `client_id`/`brand_id` as **nullable**; (2) `UPDATE campaign_briefs b SET client_id = c.client_id, brand_id = c.brand_id FROM campaigns c WHERE b.campaign_id = c.id AND (b.client_id IS NULL OR b.brand_id IS NULL)` — backfills every existing row from its campaign; (3) a `DO $$ ... $$` block counts any rows still missing a tenant ref — if zero, applies `ALTER COLUMN ... SET NOT NULL` to both columns; if any remain (orphaned `campaign_id` with no matching campaign), it `RAISE NOTICE`s the affected brief IDs, leaves the columns nullable, and skips the `NOT NULL` constraint rather than guessing/corrupting a tenant assignment. All steps are idempotent (re-running after a successful backfill is a no-op).

**Issue 2 (update sanitization):** `LocalStorageBriefRepository.update` did `{ ...b, ...patch, updated_at: now }` — a patch could overwrite `id`, `client_id`, `brand_id`, `campaign_id`, `created_at`, `submitted_by`, `submitted_at`, reassigning a brief to a different tenant/campaign. `SupabaseBriefRepository.update` only stripped `id`/`created_at`/`client_id`/`brand_id`/`campaign_id` — `submitted_by`/`submitted_at`/`updated_at` were still patchable.

**Fix 2:** New `BriefUpdatePatch` type (`Partial<Omit<CampaignBrief, 'id'|'client_id'|'brand_id'|'campaign_id'|'created_at'|'updated_at'|'submitted_by'|'submitted_at'>>`) and runtime `sanitizeBriefPatch()` helper added to `coreRepository.ts`. `BriefRepository.update`'s `patch` param is now typed `BriefUpdatePatch` (compile-time), and both `LocalStorageBriefRepository.update` and `SupabaseBriefRepository.update` call `sanitizeBriefPatch(patch)` (runtime) before merging/sending — neither repo can reassign identity, tenant, or audit fields via `update()`. `App.tsx`'s `handleBriefUpdate` and `BriefIntakeTab.tsx`'s `onBriefUpdate` prop are typed `BriefUpdatePatch` accordingly.

**Tenant scope:** unchanged — `list`/`get`/`update` still require `clientId`+`brandId`+`campaignId`(+`briefId`), Supabase queries still chain `.eq('client_id', ...).eq('brand_id', ...).eq('campaign_id', ...)` (+`.eq('id', briefId)`).

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS — no further required fixes.

---

## 🏁 Phase 16B-2 — CLOSED (Codex PASS — 2026-06-10)

- **Codex result:** PASS — no further required fixes (Fix 1: migration backfill, Fix 2: brief update patch sanitizer — both verified).
- **Commits:** `1e3e664` (feat: add phase 16b2 brief repository wiring) → `4a5ce38` (fix: backfill and sanitize campaign brief updates)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** TBD.

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
| Phase 16B-2 | Supabase CRUD Wiring — Campaign Briefs (Codex PASS) | 4a5ce38 |
| Phase 16C-1 | Supabase CRUD Wiring — Content Plan Generation (Codex PASS) | 0876162 |
| Phase 16C-2 | Supabase CRUD Wiring — Approval (Codex PASS) | 70f8b8a |
