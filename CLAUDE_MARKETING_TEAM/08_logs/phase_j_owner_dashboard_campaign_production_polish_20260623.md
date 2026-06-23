# Phase J — Owner Dashboard / Campaign Production Polish

**Date:** 2026-06-23
**Builder:** Claude Code (PC1)
**Scope:** Polish the Owner-facing dashboard / campaign production flow so CORE
reads like a premium internal Agency OS. Adds three operational sections that
were missing from the owner Command Center — **Today's Production Status**,
**Next Owner Actions**, and an inline **Connector Safety Status** summary — all
display + navigation only. No live connectors, real APIs, OAuth, webhooks,
publishing, ads launch, or auto-post were added; no approval safety rule changed.

## Inspection (before any edit)

Existing dashboard (`src/App.tsx`, `activeTab === 'dashboard'`) already had a
strong Phase A1 "Approval-first Command Center" for owner view: KPI cards
(Clients/Brands/Campaigns/Briefs/Pending Approvals/Assets), AI Factory module
status, Approval Queue + System & Safety, and Recent Activity. Connector blocked
state lived only in the Connector Registry tab (`ConnectorActivationLedger`).
Gaps for an operational daily view: a production funnel snapshot, a recommended
next-actions list, and connector safety surfaced on the dashboard itself.

## What changed

1. **`src/components/core/OwnerOperationsPanel.tsx`** (new — presentational + nav)
   - Renders three sections:
     - **Today's Production Status** — six tiles derived from existing pipeline
       state: Awaiting approval (pending Owner sign-off), Approved (internal,
       labelled "Approved ≠ Published"), Needs revision, Drafts in progress,
       Active campaigns, Events today (display only). Header labels the data
       "Internal pipeline · simulated data · no live metrics".
     - **Next Owner Actions** — recommendations computed from the metrics. Every
       verb is **Review / View queue / View safety status** — there is no publish,
       post, ads-launch, or activate action. Buttons only call `onNavigate(tab)`.
     - **Connector Safety Status** — read-only summary of the existing pure
       activation ledger (`connectorLedger.ts`): "0 of N live", per-connector
       `Live blocked` state labels, and a "View safety status" nav button.
   - Props: `metrics` (numbers derived in App.tsx) + `onNavigate` (tab switch).
     The panel has no state, no persistence, no fetch — its only side effect is
     navigation.

2. **`src/App.tsx`** (+29 lines, scoped)
   - Lazy-imports `OwnerOperationsPanel` (own code-split chunk; rendered inside
     the existing `<Suspense>` boundary).
   - In the owner Command Center IIFE, derives `ownerMetrics` from existing state
     only (`approvalData.approvalRequests` status counts, `coreData` campaign/
     brand/client counts, and an `eventsToday` count of logs with today's date).
   - Renders `<OwnerOperationsPanel metrics={ownerMetrics} onNavigate={setActiveTab} />`
     directly under the KPI header, above the AI Factory module status.

3. **`src/components/core/OwnerOperationsPanel.source.test.ts`** (new — 7 tests,
   source-scan via `?raw`, matching the `ConnectorActivationLedger` pattern):
   - approval-first + "Approved ≠ Published" + "Owner sign-off" visible;
   - connector safety shown as blocked + read-only, live count from the ledger
     summary literal;
   - demo figures labelled internal/simulated with "no live metrics/pull";
   - no publish/post/ads-launch/activate/auto-post wording;
   - no live connector capability (no URL / OAuth / webhook / `*_ACCESS_TOKEN` /
     `CANVA_*` / fetch / registry-mutation helpers);
   - no off-domain contamination (Forme/sofa/furniture/nội thất/Fal.ai/ImgBB);
   - only side effect is `onNavigate`; no `useState`/`useReducer`/`localStorage`.

## UI sections added / polished

| Section | State | Source |
|---|---|---|
| Today's Production Status | **new** | derived pipeline counts (simulated, labelled) |
| Next Owner Actions | **new** | derived recommendations, review/view verbs only |
| Connector Safety Status (on dashboard) | **new** | read-only `connectorLedger` projection |
| Approval Queue / System & Safety / Recent Activity / KPIs | unchanged | existing Phase A1 Command Center |

## Safety guarantees

- **Approval-first stays visible.** "Approval-first" badge + "Approved ≠
  Published" appear in the new sections; pending items are labelled "Pending
  Owner sign-off".
- **No publish/launch/post buttons.** Allowed wording only (Review / View queue /
  View safety status); enforced by source-scan test.
- **Connector safety remains blocked & read-only.** Summary shows `0 of N live`
  from the ledger's hard `0` literal; no activation control added.
- **No fake live metrics.** All figures are counts of items already in the local
  pipeline, labelled internal/simulated; `eventsToday` is display-only.
- **No live connector / API / OAuth / webhook / external URL / secret** added; no
  new dependency. Canva remains sandbox/mock only.
- **No approval safety rule changed.** AI generation ceiling, terminal external
  states, and the manual-confirm publish step are untouched.

## Validation

- **`npm test`** — PASS (20 files, 216 tests; +1 file / +7 tests vs 19/209).
- **`npm run build`** — PASS (tsc + vite, ~3.4s). `OwnerOperationsPanel` emits its
  own 6.78 kB chunk.
- **`git status --short`** — only intentional changes: `M src/App.tsx`, plus the
  two new files.
- **Safety search** — no `CANVA_CLIENT_ID/SECRET/API/TOKEN`, `META_ACCESS_TOKEN`,
  `TIKTOK_ACCESS_TOKEN`, `ZALO_ACCESS_TOKEN`, `GOOGLE_ADS`, OAuth, webhook,
  external URL, or publish/post/ads/launch runtime behaviour in the new panel; no
  Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination.

## Risk / follow-up

- Low risk: additive, presentational, code-split; existing dashboard sections and
  all approval/connector flows are unchanged.
- Optional later polish: surface per-campaign production progress (e.g. drafts →
  approved ratio per active campaign) on the dashboard — still approval-first and
  no-live-connector.

## Recommended next phase

**Phase K — Campaign production drill-down** (per-campaign status detail) or
approval-queue UX refinements, all within the approval-first, no-live-connector
boundary.

## Recommendation: **PASS** — commit pending Owner review (do not commit yet).
