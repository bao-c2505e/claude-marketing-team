# Phase W — Manual Publishing Result Review & Campaign Learning Loop

**Date:** 2026-06-29
**Builder:** Claude Code (PC1)
**Status:** ✅ Implemented locally + validated · 🟡 **PENDING FINAL CODEX APPROVAL** · **NOT committed / NOT pushed**

## Scope

Add a **SAFE, deterministic local/demo REVIEW layer** on top of Phase V (Manual Publishing
Evidence & Result Intake). It **reviews — never gathers** — the Owner-provided manual
publishing evidence/result and produces a deterministic result summary, evidence/attribution/
confidence quality, risk flags, repeat/avoid recommendations, next actions, and a **Brand Brain
LEARNING CANDIDATE PREVIEW**. New pure model + a read-only panel + a tiny stateful section
wrapper that shares ONE evidence state between the Phase V (record) and Phase W (review) panels.

**Non-negotiable safety preserved:** approval-first; **Approved ≠ Published**; **Client Accepted
≠ Published**; **Published only means an Owner manual evidence/result record**; no live
connectors; no auto-post; no auto-ads; no AI API calls; no live analytics; **no fake metrics**;
no fake published status; no secrets / env / OAuth / webhook / fetch / axios / network;
**Brand Brain is never auto-updated**; learning stays **candidate/preview only**.

## Codex blocking issues → fixes

1. **Review panel not semantically connected to Phase V's actual evidence state.**
   *Fix:* The Phase V `ManualPublishingEvidencePanel` is now **controlled** (`evidence` +
   `onChange` props). A new tiny stateful wrapper `ManualPublishingEvidenceSection` owns the
   **single shared evidence state** and renders both panels as siblings, so the Phase W review
   reviews the **same** Owner-provided evidence the Owner records in Phase V (no private copy).
   CampaignWorkspace stays **stateless** (its Phase K source-scan test forbids `useState`), so
   the lifted state lives in the wrapper, not the workspace.

2. **Sample/Vị Cuốn data rendered as if it were real Owner result data.**
   *Fix:* The shared evidence state now **defaults to EMPTY**. With no evidence, the review
   correctly shows **`no_manual_evidence` / "cannot review"** — nothing implies a published or
   reviewed Vị Cuốn post. The Phase V sample is now an **opt-in, clearly-labeled "Load example
   data (sample)"** action (never auto-loaded on mount). The review panel **seeds no sample of
   its own** (`sampleManualResultEntries`/`sampleManualPublishingEvidence` are no longer used in
   the panel) and reviews **only** the passed-in `evidence` prop. Banner reinforces "Reviews only
   the manual publishing evidence recorded above — nothing is invented."

3. **No Phase W log entry.**
   *Fix:* this file + a Phase W entry appended to `08_logs/phase_log.md`.

## Files changed

**New**
- `src/lib/core/manualResultReview.ts` — pure, deterministic review model.
- `src/lib/core/manualResultReview.test.ts` — 17 domain tests.
- `src/components/core/ManualResultReviewPanel.tsx` — read-only review panel (consumes `evidence` prop).
- `src/components/core/ManualResultReviewPanel.source.test.ts` — 21 source-scan safety tests.
- `src/components/core/ManualPublishingEvidenceSection.tsx` — stateful wrapper; single shared
  evidence state, **default empty**; renders Phase V panel (controlled) + Phase W panel (review).

**Updated**
- `src/components/core/ManualPublishingEvidencePanel.tsx` — now **controlled** (`evidence` +
  `onChange`); removed the auto-seed on mount; added opt-in "Load example data (sample)" loader.
- `src/components/core/ManualPublishingEvidencePanel.source.test.ts` — +1 test proving controlled
  + no auto-seed.
- `src/components/core/CampaignWorkspace.tsx` — renders the shared `<ManualPublishingEvidenceSection>`
  (replacing the two separate panel renders); header comment updated. Still **stateless**.
- `src/components/core/CampaignWorkspace.source.test.ts` — +1 test proving the section wiring;
  stateless guard unchanged.

## Domain model — `manualResultReview.ts` (pure, reuses Phase V)

- **Reuses** Phase V types/predicates as the single source of truth: `ManualPublishingEvidence`,
  `ResultMetrics`/`ResultMetricKey`/`ResultDataSource`/`PublishStatus`, `isPublishedRecord`,
  `isScheduledNotPublished`, `metricsRealClaimAllowed`, `metricsPresentation`, plus the
  `EVIDENCE_NO_LIVE_ANALYTICS` / `EVIDENCE_APPROVED_NOT_PUBLISHED` /
  `EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED` safety constants. **Published semantics are derived
  only via `isPublishedRecord`** — Phase W never invents a `published`/`launched` state.
- **Review status:** `no_manual_evidence` (no manually-published record) → cannot review;
  `evidence_logged_result_pending` (published but no real Owner/Client metrics) → pending;
  `provided_manual_result_reviewed` (published + real provided metrics) → reviewed.
- **Outputs:** `reviewStatus`, `resultSummary` (only provided values; missing data labeled),
  `performanceSignal` (conservative, always "based on provided manual data"), `confidenceLevel`,
  `evidenceQuality`, `attributionQuality`, `riskFlags` (`incomplete_conversion_data`,
  `weak_attribution`, `customer_complaint`, `stockout_or_capacity_issue`,
  `content_accuracy_issue`, `timing_issue`, `unverified_metrics`), `learningCandidates`,
  `repeat/avoidRecommendations`, `nextActionSuggestions`, `brandBrainLearningCandidatePreview`
  (`persisted_to_brand_brain: false`, `is_brand_brain_update: false`, `sufficiency`), and
  structural guards `core_published: false`, `published_semantics_unchanged: true`,
  `persisted_to_brand_brain: false`.
- **Deterministic rules:** spend (Owner-provided, optional) without messages/orders/revenue →
  `incomplete_conversion_data`; orders/revenue without evidence/real source → `weak_attribution`;
  EN+VN note scans (chê/phàn nàn, hết hàng, sai giá/sai món, đăng muộn/sai giờ) → respective
  flags; strongest provided-signal entry → a "repeat this angle" learning (phrased "Based on
  provided manual data", never "analytics shows"); owner-estimate-only caps confidence below high;
  simulated/not-provided metrics → `unverified_metrics`, never treated as real.
- **Decoupled from Brand Brain:** this module does **not import `brandBrain.ts`** — the learning
  output is a preview only and cannot write/auto-update Brand Brain.

## Validation

- **Tests:** `npm test -- --run` → **42 files / 525 tests PASS** (Phase V baseline 40/485; Phase W
  added 2 files + the controlled/section/empty-state assertions). New: 17 domain + 21 review-panel
  source.
- **Build:** `npm run build` (tsc + vite) → **PASS**, 0 TS errors (`CampaignWorkspace` chunk
  ~163.87 kB).
- **Safety greps:** the new/changed source files carry **no** `fetch(`/axios/XMLHttpRequest/
  WebSocket/OAuth/webhook/access_token/client_secret/api_key/`process.env`/`import.meta.env`/
  `localStorage`/`http(s)://`/`www.`; **no** affirmative auto-post/auto-ads/auto-publish (only
  negated); **no** "synced from Meta/TikTok/Google/Canva/Zalo"; **no** affirmative "Brand Brain
  updated"; **no** Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination.

## Safety assessment (CLAUDE.md §4)

Approval-first ✅ · Approved ≠ Published / Client Accepted ≠ Published ✅ (carried verbatim) ·
Published only = manual Owner record (`isPublishedRecord`; `core_published:false`) ✅ · no
connectors / API / network / OAuth / webhook / secrets ✅ · no live analytics, no fake metrics
(only provided values echoed; simulated→unverified) ✅ · Brand Brain not auto-updated
(`persisted_to_brand_brain:false`, module decoupled) ✅ · learning candidate/preview only ✅ ·
default empty state → no fake published/reviewed post ✅.

## Status

- Working tree: **dirty** (Phase W changes uncommitted).
- **Commit: NO.** **Push: NO.** Awaiting Owner/Codex final approval.
