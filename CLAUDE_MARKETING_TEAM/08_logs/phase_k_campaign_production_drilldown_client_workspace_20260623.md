# Phase K — Campaign Production Drill-down & Client Workspace

**Date:** 2026-06-23
**Builder:** Claude Code (PC1)
**Scope:** Add an Owner-facing **Campaign Production Workspace** that drills into
one active client/campaign and shows its production status end to end — client/
brand overview, brief snapshot, production pipeline, AI output queue, pending
approvals, asset/design preview status, report draft status, connector safety,
recent activity, and next Owner actions. Display + navigation only. No live
connectors, real APIs, OAuth, webhooks, publishing, ads launch, auto-post, or
connector activation; no approval safety rule changed.

## Inspection (before any edit)

Reviewed the data model and existing surfaces: `CoreDataStore`
(clients/brands/campaigns/briefs), `GenerationDataStore` (content plan items),
`ApprovalDataStore` (approval requests), `AssetDataStore` (assets + collections),
`AutomationLogStore` (logs, each with `related_campaign_id`), plus the status
label/color maps in `coreData.ts` and the read-only connector ledger
(`connectorLedger.ts`). The dashboard had the Phase A1 Command Center + Phase J
Owner Operations Panel (aggregate), but no per-campaign drill-down. All core
entities link by `client_id` / `brand_id` / `campaign_id`, so a single selected
campaign can resolve its whole production context.

## What changed

1. **`src/components/core/CampaignWorkspace.tsx`** (new — presentational + nav)
   - Drill-down for one campaign. Props are existing local state passed in
     (client/brand/campaign/brief + campaign-scoped content items, approvals,
     assets, activity) plus `options`/`selectedId`/`onSelect` (campaign picker)
     and `onNavigate` (tab switch). No state, no persistence, no fetch.
   - Sections: campaign selector + safety ribbon; **Production Pipeline** (Brief →
     AI Output → Approval → Assets → Report, status feel); **Client / Brand
     Overview**; **Campaign Brief Snapshot**; **AI Output Queue** (status chips +
     recent drafts); **Pending Approval Items**; **Asset / Design Preview Status**
     (briefs/placeholders only — no real image generation); **Report Draft
     Status** (draft-only, internal/simulated figures); **Safety & Connector
     Status** (read-only ledger summary, `0 of N live`); **Recent Activity**;
     **Next Owner Actions** (recommendations; review/view verbs only).
   - Connector safety figures come from `buildConnectorLedgerSummary()` (hard
     `liveCount: 0`). Action labels are limited to Review brief / Preview output /
     View approvals / View report draft / View connector safety.

2. **`src/App.tsx`** (+62 / −1, scoped)
   - Lazy-imports `CampaignWorkspace` (own code-split chunk, inside the existing
     `<Suspense>`); imports the `Building2` icon.
   - Adds `workspaceCampaignId` state (which campaign to inspect).
   - Adds an owner-only **Campaign Workspace** sidebar tab (after Campaigns) and
     registers `campaign-workspace` in `ownerOnlyTabs` (returns to dashboard when
     switching to Client View).
   - Adds the `campaign-workspace` render block: resolves the selected campaign +
     its client/brand/brief and filters content/approvals/assets/activity to that
     campaign — all from existing state — then renders `<CampaignWorkspace />`.

3. **`src/components/core/CampaignWorkspace.source.test.ts`** (new — 9 tests,
   source-scan via `?raw`, matching the established pattern):
   - all ten drill-down sections render;
   - approval-first + "Approved ≠ Published" + "Owner approval required" +
     "Manual confirmation outside CORE" visible;
   - connector safety shown blocked + read-only, live count from the ledger
     summary literal;
   - demo figures labelled internal/simulated, "no live analytics pull/no live pull";
   - no publish/post/ads-launch/activate/sync-live wording;
   - auto-post only ever appears negated ("No auto-post") — never as an action;
   - no live connector capability (no URL / OAuth / webhook / fetch / axios /
     `*_ACCESS_TOKEN` / `CANVA_*` / registry-mutation / localStorage);
   - no off-domain contamination; only side effects are `onSelect` / `onNavigate`.

## UI sections added / polished

| Section | State | Source |
|---|---|---|
| Campaign selector + safety ribbon | **new** | core campaigns list |
| Production Pipeline (Brief→AI→Approval→Assets→Report) | **new** | derived per-campaign counts |
| Client / Brand Overview | **new** | `coreData` client + brand |
| Campaign Brief Snapshot | **new** | `coreData` campaign + brief |
| AI Output Queue | **new** | generation content items (scoped) |
| Pending Approval Items | **new** | approval requests (scoped) |
| Asset / Design Preview Status | **new** | assets (scoped, briefs/placeholders only) |
| Report Draft Status | **new** | derived (draft-only, simulated/internal) |
| Safety & Connector Status | **new** | read-only `connectorLedger` projection |
| Recent Activity | **new** | automation logs (scoped) |
| Next Owner Actions | **new** | derived recommendations, review/view verbs |

## Safety guarantees

- **Approval-first visible.** Safety ribbon + per-section copy: Approved ≠
  Published, Owner approval required, No auto-post, Live connectors blocked,
  Manual confirmation outside CORE.
- **No publish/launch/post/activate controls.** Only Review/Preview/View/selector
  navigation; enforced by source-scan test.
- **Connector safety read-only & blocked.** Summary shows `0 of N live` from the
  ledger's hard `0` literal; no activation control.
- **No fake live metrics.** All figures are counts of items already in the local
  pipeline, labelled internal/simulated; Report Draft is draft-only with no live
  analytics pull.
- **No live connector / API / OAuth / webhook / external URL / fetch / axios /
  secret** added; no new dependency. Canva remains sandbox/mock only.
- **No approval safety rule changed.** AI generation ceiling, terminal external
  states, and the manual-confirm publish step are untouched.

## Validation

- **`npm test`** — PASS (21 files, 225 tests; +1 file / +9 tests vs 20/216).
- **`npm run build`** — PASS (tsc + vite, ~3.4s). `CampaignWorkspace` emits its own
  19.75 kB chunk.
- **`git status --short`** — only intentional changes: `M src/App.tsx` (+62/−1) plus
  the two new files (component + test). This log is the additional new doc.
- **Safety search** — no `CANVA_CLIENT_ID/SECRET/API/TOKEN`, `META_ACCESS_TOKEN`,
  `TIKTOK_ACCESS_TOKEN`, `ZALO_ACCESS_TOKEN`, `GOOGLE_ADS`, OAuth, webhook,
  external URL, fetch, axios, or publish/post/ads/launch/activate/sync-live
  behaviour in the new component; auto-post only appears negated; no
  Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination.

## Risk / follow-up

- Low risk: additive, presentational, code-split, owner-only; existing dashboard,
  approval, asset, and connector flows are unchanged. With empty seed generation/
  approval data, AI Output Queue and Pending Approvals show honest empty states
  until the Owner generates and submits.
- Optional later: a per-stage "open here" deep link that pre-filters the target
  tab to the selected campaign; still approval-first and no-live-connector.

## Recommended next phase

**Phase L — Approval queue UX refinement** (bulk review, per-campaign filtering,
clearer Approved ≠ Published transitions) or campaign timeline view — all within
the approval-first, no-live-connector boundary.

## Recommendation: **PASS** — commit pending Owner review (do not commit yet).
