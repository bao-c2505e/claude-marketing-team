# CURRENT PHASE — Phase 16A: Supabase CRUD Wiring — Clients + Brands (Codex Fix) ✅ DONE

## 📌 Thông tin chung
- **Phase hiện tại:** Phase 16A — Supabase CRUD Wiring Core Objects: Repository Base + Clients/Brands
- **Mục tiêu:** Implement safe first slice of Supabase CRUD wiring — add repository pattern and CRUD support for Clients and Brands while preserving localStorage fallback and demo behavior.
- **Trạng thái:** ✅ DONE — Repositories implemented, wired into App.tsx, build pass, 0 TS errors.

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

## 🔮 Phase 16B Recommended Scope
- Campaigns CRUD wiring (same repository pattern, `campaigns` table)
- Campaign Briefs CRUD wiring (`campaign_briefs` table)
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
| Phase 16A | Supabase CRUD Wiring — Clients + Brands | (this phase) |
