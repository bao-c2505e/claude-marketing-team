# V2-E3 — Manual E2E + UI Bug Triage

**Date:** 2026-06-15
**Owner direction:** Pause feedback implementation; run Manual E2E + UI bug triage.
**Scope:** Investigation + small safe fixes only (no redesign, no feedback table/RLS/UI, no
Supabase/migration/auth changes).
**Environment:** Local demo mode — `.env.local` absent → `isSupabaseConfigured = false` →
all repos use the `LocalStorage*` implementations. Demo user role = `owner`.

---

## Issue 1 — Create Brand: "clicking Create has no visible response"

### Reproduction / inspection result
- **Not reproduced as a hard failure in local mode.** The Create Brand data flow is
  functionally correct: `BrandsTab.handleCreate` → `onBrandCreate` → `App.handleBrandCreate`
  → `repos.brands.create` (`LocalStorageBrandRepository.create`) → `setCoreData` prepends the
  new brand → the new card renders in the grid.
- **The real defect is a UX gap, not a broken handler:** on success the form **silently
  closes** and the only feedback is a new card appearing in the grid. On small screens the
  new card renders **below the fold**, so the user perceives "nothing happened." There was
  **no explicit success confirmation**.

### Suspected cause
- Missing success feedback in the create flow (success path only did `setForm(EMPTY_FORM)` +
  `setShowForm(false)`), so the action produced no clear, in-place signal.

### Files inspected
- `src/components/core/BrandsTab.tsx` — form state, `handleCreate`, button wiring (all correct:
  validation visible, loading state present, errors caught into `formError`, no silent catch).
- `src/App.tsx` — `handleBrandCreate` (awaits repo, prepends to state, saves) — correct.
- `src/lib/core/repositoryFactory.ts` — `repos.brands` selects Supabase vs LocalStorage by
  `isSupabaseConfigured` (single instance; **not** per-operation UUID-gated like assets/approvals).
- `src/lib/core/localStorageRepositories.ts` — `LocalStorageBrandRepository.create` — correct.
- `src/lib/core/supabaseRepositories.ts` — `SupabaseBrandRepository.create` — throws on error
  (error would surface in `formError`).
- `src/lib/auth/AuthContext.tsx` — demo role = `owner` → `can.manageBrands` = true (form shows).
- `src/lib/core/coreData.ts` — seed clients exist (`client-vi-cuon`, etc.).

### Fix applied
- **Added a visible, auto-dismissing success confirmation** in `BrandsTab.tsx`: on successful
  create, show `✓ Brand "<name>" created.` (emerald banner), auto-clears after 4s; cleared
  when the form is reopened. This directly resolves the "no visible response" symptom.
- (No change to validation/loading/error handling — they were already correct.)

### Manual verification steps
1. Brands tab → **New Brand** → select a client (e.g. "Vị Cuốn"), enter a brand name.
2. Click **Create Brand** → button shows "Saving…", then the form closes, an emerald
   **"✓ Brand "…" created."** banner appears, and the new brand card is in the grid.
3. Click **New Brand** with no client selected → "Please select a client." error is visible.
4. Click **Create Brand** with a client but empty name → "Brand name is required." is visible.

### Remaining issues / recommended follow-up (NOT fixed here — out of "small safe" scope)
- **Latent UUID-gating gap:** `repos.brands` / `repos.clients` are a single Supabase-or-local
  instance and lack the **per-operation UUID fallback** that `assetRepoFor`/`approvalRepoFor`
  have. If a future user configures Supabase **on top of existing local demo data** (local
  `client-*` ids, not UUIDs), `brands.create` would attempt a Supabase insert with a non-UUID
  `client_id` and fail. It would surface as a visible `formError` (not a silent hang), but the
  create would not succeed. Recommend a future Checkpoint to extend `repoRouting.ts` with a
  `clientScopeIsSupabaseSafe`/`brandScopeIsSupabaseSafe` gate (mirroring Phase 16C/16D). Moot
  in the current local-only environment.

---

## Issue 2 — Mobile UI cluttered / "rối"

### Inspection result
- **Root cause:** `src/index.css` had **no `@media` queries at all**, and the main layout uses
  an inline fixed `gridTemplateColumns: '260px 1fr'` (sidebar + content) that **never collapses**
  on narrow screens. The 260px sidebar squeezes content, and full desktop paddings/gaps make
  phones feel cramped.

### Files inspected
- `src/index.css` (no responsive rules), `src/App.tsx` (main layout grid + sidebar `aside`).

### Fix applied (small, safe — desktop layout unchanged)
- `src/App.tsx`: added `className="app-main-grid"` to the layout grid and `app-sidebar` to the
  sidebar `aside` (desktop inline styles untouched).
- `src/index.css`: appended a responsive block (only affects ≤768px / ≤480px):
  - `.app-main-grid` collapses to a single column (sidebar stacks above content).
  - `.app-container` padding reduced (24px → 14px → 10px) on small screens.
  - `.app-header` wraps with gap.
  - New `.form-grid-2` helper collapses 2-column forms to one column on mobile (applied to the
    Brand create form; reusable by other tabs later).
  - `.glass-panel` radius trimmed; long headings wrap (`word-break`) to prevent card overflow.
- **No redesign, no brand-identity change** — colors, fonts, and desktop layout are unchanged.

### Manual verification steps
1. Open the app and narrow the viewport to < 768px (or device toolbar, e.g. iPhone width).
2. Confirm the sidebar stacks **above** the content instead of squeezing a 260px column.
3. Confirm reduced edge padding, header wrapping, and the Brand form fields stacking single-column.
4. Confirm desktop (≥ 769px) is visually identical to before.

### Remaining issues
- Other tabs' inline 2-column form grids (Campaigns/Briefs/etc.) could adopt the `.form-grid-2`
  helper in a later pass — deferred to avoid touching many components in this triage.

---

## Manual E2E smoke test (fictional data only)

Verified by build (type-correct wiring), dev-server run (app serves HTTP 200, modules
transform), and code-path reading. All create→state→list handlers follow the same correct
pattern (`await repos.X.create` → prepend to `coreData` state → `saveCoreData`):

| Flow | Handler / repo | Result |
|---|---|---|
| Create/read **client** | `handleClientCreate` → `clients.create` | OK — prepends, list refreshes |
| Create/read **brand** (scoped to client) | `handleBrandCreate` → `brands.create` | OK — + new success banner |
| Create/read **campaign** (scoped to brand/client) | `handleCampaignCreate` → `campaigns.create` | OK — prepends, list refreshes |
| Create/read **brief** (scoped to campaign/brand/client) | `handleBriefCreate` → `briefs.create` | OK — prepends, list refreshes |
| Generated/pending approval stays safe | (unchanged) | OK — no approval code touched |
| No callback-driven approval mutation | (unchanged) | OK — no callback/approval code touched |
| localStorage UUID gating | `repoRouting.ts` (34 tests) | OK — unchanged, 45/45 tests pass |

- **Safety:** no Supabase/RLS/auth/migration changes; no SQL; no secrets; no connectors; no
  feedback table/RLS/UI; approval semantics unchanged; PC2 callbacks remain non-authoritative.
- **Build:** PASS (0 TS errors, 1575 modules). **Tests:** 45/45 PASS.
