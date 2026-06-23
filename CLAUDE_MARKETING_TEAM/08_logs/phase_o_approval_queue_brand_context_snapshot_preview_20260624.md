# Phase O — Approval Queue Brand Context Snapshot Preview

**Date:** 2026-06-24
**Builder:** Claude Code (PC1)
**Scope:** Surface each approval item's originating **Brand Brain context snapshot**
(Phase N) in the Approval Queue detail view, so an Owner/reviewer can see exactly
what normalized brand context grounded the AI draft. Read-only, review-only.
Additive. No live connectors, real APIs, OAuth, webhooks, fetch/axios, OpenAI key
in Core, uploads, publish/post/ads/launch/activate/sync, or new dependency; no
approval semantics changed.

## Inspection (before any edit)

Reviewed `ApprovalsTab` (detail view, classifier, manual-delivery tracker),
`CampaignWorkspace`, the AI-output `ContentPlanItem` shape, and the Phase N
`BrandContextSnapshot` / `buildAiFactoryBrandContext` builder. Finding: an approval
request carries `client_id` / `brand_id` / `campaign_id`, and its content item
carries `brief_id` — exactly the records `buildAiFactoryBrandContext` needs. So the
**same** snapshot the factory framed the draft with can be rebuilt for review with
no new data store and no change to the approval state machine. `ApprovalsTab` did
not previously receive `briefs`; that is the one prop added.

## What changed

### `src/components/core/ApprovalsTab.tsx`
- **New prop** `briefs: CampaignBrief[]` (so the draft's originating brief can be
  resolved for the snapshot).
- **`brandContextFor(request, item)`** — resolves the draft's brand/client/campaign
  (from the request) + brief (from `item.brief_id`) and rebuilds the snapshot via
  `buildAiFactoryBrandContext`. Pure + local; returns `null` when the brand can't be
  resolved.
- **New read-only `BrandContextSnapshotPanel`** rendered in the detail view, right
  after the AI output preview (wrapped in stable `PHASE_O_SNAPSHOT_START/END`
  markers). Shows: **Brand Context Snapshot** header + "Grounding used for this
  draft · Review-only · not live publishing data"; **Source** / **Status** /
  **Internal draft context** badges; and rows for Brand identity, Positioning,
  Campaign context, Target customers, Brand voice / tone, Content pillars, Creative
  do, Creative don't, Compliance / claim notes (each rendered only when present).
  Footer: **Approved ≠ Published** + the snapshot's standing reminder + "internal/
  draft-only review context — no auto-post, no auto-ads, no live connectors". Pure
  presentation: no inputs, no handlers, no network, no mutation.

### `src/App.tsx`
- Passes `briefs={coreData.briefs}` to `ApprovalsTab` (the only wiring change).

## Where the snapshot appears

Approval Queue → open any request → **Request Detail** → below the module-aware AI
output preview, above the Manual Delivery Tracker. One panel per reviewed draft,
grounded in that draft's own brand/campaign/brief.

## Tests

- **`src/components/core/ApprovalsTab.source.test.ts`** (new — 7 tests): snapshot
  panel is wired into the detail via `brandContextFor` / `buildAiFactoryBrandContext`;
  renders the review fields (brand/campaign/target customers/voice/pillars/creative
  do-don't/compliance + Source/Status labels); Approved ≠ Published + approval-first
  ("no auto-post", "no live connectors") visible; **scoped to the marked snapshot
  slice**, asserts no publish/post/ads-launch/activate/sync/upload action, no
  fetch/axios/URL/OAuth/webhook/token/key, display-only (no handlers/inputs/buttons/
  useState), and no off-domain contamination. Slice-scoping is used because
  `ApprovalsTab` legitimately contains pre-existing negated phrases ("…does not
  auto-post or launch ads") and a manual-delivery `https://` reference-only
  placeholder elsewhere — out of scope for Phase O.
- The snapshot **data** path (brief-derived content pillars / creative don't /
  compliance, internal/draft-only labels, Approved ≠ Published) is the exact
  `buildAiFactoryBrandContext` covered by the Phase N `brandBrain` /
  `aiFactoryBrandContext` suites.

## Safety guarantees

- **Read-only / review-only.** The panel renders the snapshot; it has no edit/save/
  upload/publish/sync/live controls, no handlers, no state.
- **Approval semantics unchanged.** No handler, state machine, or terminal rule
  touched; AI outputs stay draft / `pending_approval`; no published/posted/launched
  state introduced.
- **Approval-first + Approved ≠ Published** visible in the panel footer and the
  existing queue banner.
- **No live behaviour.** Pure local rebuild — no fetch / axios / network / OAuth /
  webhook / external URL; no upload/publish/post/ads/launch/activate/sync; no
  OpenAI/API key/env in Core.
- **Connector safety unchanged.** Ledger read-only, live connectors blocked, Canva
  sandbox/mock only.
- **Internal/draft-only clear.** Snapshot `source` is `internal`, badges show
  "Internal draft context"; the source/status labels (internal/mock/demo/draft-only)
  come straight from the snapshot.

## Validation

- **`npm test`** — PASS (27 files, 269 tests; +1 file / +7 tests vs 26/262).
- **`npm run build`** — PASS (tsc + vite, ~3.6s; 0 TS errors; no >500 kB warning).
- **`git status --short`** — only intentional changes: `M src/App.tsx`,
  `M src/components/core/ApprovalsTab.tsx`, new `ApprovalsTab.source.test.ts`, plus
  this log.
- **Safety search** — no `CANVA_*` / `META_ACCESS_TOKEN` / `TIKTOK_ACCESS_TOKEN` /
  `ZALO_ACCESS_TOKEN` / `GOOGLE_ADS` / `OPENAI_API_KEY` added; no live OAuth/webhook/
  external URL/fetch/axios introduced; no upload/publish/post/ads/launch/activate/
  sync behaviour; auto-post only negated; no Forme/sofa/furniture/nội thất/Fal.ai/
  ImgBB contamination in the diff. (The pre-existing manual-delivery `https://`
  placeholder and negated "launch ads" safety copy are unchanged and out of scope.)

## Risk / follow-up

- Low risk: one additive prop + a presentational panel; approval flow untouched.
- Optional next: show the snapshot (collapsed) on approval list rows too, and add
  the same grounding panel to the Campaign Workspace production drill-down.

## Recommended next phase

**Phase P — Campaign Workspace brand-context grounding**: surface the same read-only
Brand Context Snapshot in the Campaign Workspace production drill-down so reviewers
see grounding at the campaign level — still approval-first, no live connectors.

## Recommendation: **PASS** — commit pending Owner review (do not commit yet).
