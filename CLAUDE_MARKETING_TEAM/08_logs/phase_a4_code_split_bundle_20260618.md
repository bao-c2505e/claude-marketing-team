# Phase A4 — Code Split / Technical Cleanup - 2026-06-18

## Status

DONE. Technical-cleanup only. The 14 major tab sections are now lazy-loaded and
the vendor libraries are split into their own chunks. **No product behavior,
approval logic, n8n behavior, Supabase UUID gating, localStorage fallback, or
safety semantics changed.** `npm run build` PASS, `npm run test` PASS 65/65, and
the **>500 kB chunk warning is cleared**.

## Scope

Bundle/chunking only. **No** changes to: n8n workflows, contracts, env files,
repositories, routing/UUID-gating, RLS, approval state machine, generated-item
shape, or data mutation. **No new dependencies** (`React.lazy`/`Suspense` are
core React; `manualChunks` is Vite output config). No secrets / webhook URLs.

## Files changed

- `src/App.tsx` — converted the 14 tab section imports from static to
  `React.lazy(() => import(...))`; wrapped the existing tab-render area in a
  single `<Suspense>` boundary with a small, safe loading fallback. Props,
  handlers, state flows, and the conditional `activeTab === '…'` rendering are
  unchanged. `LoginScreen` stays eagerly imported (shown pre-auth).
- `vite.config.ts` — added `build.rollupOptions.output.manualChunks` to split
  `node_modules` into a `vendor` chunk and `@supabase/*` into `vendor-supabase`
  (the exact remedy Vite's warning suggests). Output chunking only.

## Components split (now lazy, one chunk each)

ClientsTab, BrandsTab, CampaignsTab, BriefIntakeTab, ContentGenerationTab,
ContentCalendarTab, ApprovalsTab, ClientViewTab, AssetLibraryTab, ReportsTab,
ExportPackTab, ConnectorRegistryTab, AutomationLogsTab, AutomationFactoryTab.

The Dashboard / Command Center stays inline in `App.tsx` (it is the default
view, so lazy-loading it would only add a fallback flash with no bundle benefit).

## Behavior preserved

- Same props/handlers/state for every tab; lazy only changes *when* each chunk
  loads (on first navigation), not what it does.
- ApprovalsTab unchanged (filters/search/demo-cleanup toggle/actions intact).
- Approval state machine, Supabase UUID gate, localStorage fallback, and n8n
  module behavior untouched.
- Loading fallback is display-only and safe: "Loading workspace… · Drafts only ·
  nothing is published" — implies no publishing/ads/analytics.

## Safety constraints preserved

Approval-first intact; Approved ≠ Published unchanged. No auto-post, no auto-ads,
no live connectors, no image/video generation, no live analytics, no unverified
metrics. OpenAI key remains n8n-only. No n8n/contract/env changes. No secrets.

## Build result

`npm run build` PASS (tsc + vite, 1582 modules). Chunking after split:

- `index.js` (app entry): **338.81 kB** (gzip 81.25) — was 1,002.91 kB before A4.
- `vendor.js`: 175.77 kB (gzip 52.77) — React/ReactDOM/lucide-core/etc.
- `vendor-supabase.js`: 204.73 kB (gzip 52.95).
- 14 tab chunks: ~10–39 kB each (on-demand); plus tiny per-icon chunks.

## Test result

`npm run test` PASS — 65/65.

## Bundle warning status

**Cleared.** No chunk exceeds 500 kB; the Vite >500 kB warning no longer prints.
The entry chunk fell from ~1,003 kB to ~339 kB. Two levers did it: (1) lazy tab
splitting removed ~291 kB of tab code from the entry; (2) the vendor split moved
React + Supabase (~380 kB) into their own sub-500 kB chunks.

What remains in `index.js` (338 kB): the App shell itself, including several
still-inline legacy sections (new-campaign form, outputs, approval checklist,
demo-pack, manual/presentation export). These are tightly coupled to App state
and were intentionally left untouched this phase to avoid behavior risk — they
are the natural target if further entry-size reduction is ever wanted.

## Commit hash

`725f5d2`

## Recommended next phase (A5)

- Optional: extract the still-inline App.tsx sections (new-campaign / outputs /
  approval checklist / demo-pack / export panels) into their own files and lazy
  them too — would shrink the entry chunk further, but is a larger refactor that
  needs careful state/handler threading.
- Optional: extract the A2 approval module/source classifier to
  `src/lib/core/approvalClassify.ts` with unit tests.
- Optional: a matching premium pass for the client-view dashboard.
