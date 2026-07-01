# Phase X — Owner-Approved Campaign Learning Memory / Brand Brain Learning Candidate Approval

**Date:** 2026-07-01
**Builder:** Claude Code (PC1)
**Status:** ✅ Implemented locally + validated · 🟡 **PENDING CODEX REVIEW** · **NOT committed / NOT pushed**

## Scope

Turn the Phase W Brand Brain **learning candidates** into an **Owner-reviewed accept / reject
decision flow** that prepares a Brand Brain **update proposal** from the accepted candidates only.
Recommended minimal implementation, per Owner scope approval:

- Local candidate decision model — `pending` / `accepted` / `rejected` (+ reset back to pending).
- Owner-only accept/reject decision preview with an optional reason/note.
- A **prepared** Brand Brain update proposal built from **accepted candidates only**, flagged
  `persisted_to_brand_brain: false`, `is_applied_to_brand_brain: false`,
  `requires_owner_approval_to_apply: true`.
- An immutable/local decision **audit trail** (candidate source id, action, actor, reason, timestamp).
- Clear UI safety language (Candidate / Accepted-for-update / Rejected / Prepared-only-not-applied).

**Non-negotiable safety preserved:** Owner is the **only** approval authority (owner-only gate, not
manager); **Accepted ≠ applied / written to Brand Brain**; **Brand Brain source of truth is never
mutated or auto-updated** (no Brand Brain mutator exists or was added); rejected/pending learning is
**not used**; **Approved ≠ Published**; **Client Accepted ≠ Published**; no AI/API calls; no live
connectors; no live analytics; no auto-post; no auto-ads; no fake metrics; no secrets / env / OAuth /
webhook / fetch / axios / network.

## Files changed

**New**
- `src/lib/core/brandBrainLearning.ts` — pure, deterministic Phase X model: `LearningDecision`
  (`pending`/`accepted`/`rejected`), stable `candidateKey`, `initLearningReviews` (carries prior
  decisions forward on Phase W re-derivation), `applyLearningDecision` (accept/reject/reset →
  NEW arrays + immutable audit entry; no-op on unknown id / invalid decision),
  `summarizeLearningReviews`, `listLearningAudit`, `buildBrandBrainUpdateProposal` (accepted-only,
  prepared-only), `renderBrandBrainUpdateProposalText`, and verbatim safety-copy constants.
- `src/lib/core/brandBrainLearning.test.ts` — 20 domain tests.
- `src/components/core/BrandBrainLearningReviewPanel.tsx` — Owner-only accept/reject/reset panel +
  prepared-proposal preview + local audit trail + clipboard copy (consumes `evidence` prop; derives
  candidates via Phase W `buildManualResultReview`; seeds no sample of its own).
- `src/components/core/BrandBrainLearningReviewPanel.source.test.ts` — 15 source-scan safety tests.

**Updated**
- `src/components/core/ManualPublishingEvidenceSection.tsx` — renders
  `<BrandBrainLearningReviewPanel>` as the **third** panel, AFTER the Phase W review, sharing the
  same single `evidence` state; header comment updated. (Only import + one JSX block added.)

**Not touched (as required):** `manualResultReview.ts` (Phase W model frozen — Phase X derives a
stable candidate id from candidate content instead of adding ids there), `brandBrain.ts` and all
Brand Brain read/write paths, `CampaignWorkspace.tsx` (stays stateless).

## Domain model — `brandBrainLearning.ts` (pure, decoupled from Brand Brain)

- **Decoupled from Brand Brain:** imports Brand Brain **types are not needed**; the module imports
  only the Phase W `LearningCandidate`/`LearningCandidateKind` types and `generateId`. It does
  **not import `brandBrain.ts`** and adds no Brand Brain builder/mutator — the proposal is a sibling
  artifact, structurally distinct from a `BrandBrain`, so accepted learning can never be mistaken for
  applied memory.
- **Stable ids:** `candidateKey(kind, insight)` gives each candidate a stable id so Owner decisions
  survive Phase W re-deriving candidates from edited evidence. Candidates that disappear are dropped;
  new ones start `pending`.
- **Decision mutator:** `applyLearningDecision` returns NEW `{ reviews, audit }` arrays; a `pending`
  decision on a previously-decided candidate clears the decision metadata and audits as `reset`; an
  unknown id / invalid decision is a no-op returning the SAME references (and no audit entry).
- **Prepared proposal:** `buildBrandBrainUpdateProposal` includes ONLY `accepted` reviews; rejected +
  pending are excluded. Always `persisted_to_brand_brain: false`, `is_applied_to_brand_brain: false`,
  `requires_owner_approval_to_apply: true`.

## UI — `BrandBrainLearningReviewPanel.tsx`

- Owner-only gate (`can.publishContent`, owner-only) for accept/reject/reset; non-owners see a
  "Owner role required" note and no decision buttons.
- Surfaces: (1) decision summary, (2) learning candidates with Accept / Reject / Reset + optional
  reason input, (3) prepared Brand Brain update proposal (accepted only, "Applied to Brand Brain: NO"),
  (4) local decision audit trail; CTA = Copy / Preview only (clipboard), no network.
- Verbatim copy: "Learning candidate", "Accepted for Brand Brain update", "Rejected / not used",
  "Prepared only — not applied", "Brand Brain is not updated automatically", "Accepted ≠ … Brand
  Brain", "Approved ≠ Published", "Client Accepted ≠ Published".

## Validation

- **Tests:** `npm test` (vitest run) → **44 files / 560 tests PASS** (Phase W baseline 42/525; Phase X
  added 2 files + 35 tests: 20 domain + 15 panel-source). Targeted: `brandBrainLearning` (20),
  `BrandBrainLearningReviewPanel` (15), `ManualPublishingEvidenceSection`-related section wiring via
  the panel source test — all green.
- **Build:** `npm run build` (tsc + vite) → **PASS**, 0 TS errors (`CampaignWorkspace` chunk
  ~178.52 kB). (Two initial TS errors were in the new test file only — a `candidateKey` arg shape and
  a cast — both fixed; no change to the model/panel.)
- **Safety greps:** the new/changed source files carry **no** `fetch(`/axios/XMLHttpRequest/OAuth/
  webhook/access_token/client_secret/api_key/`localStorage`/`http(s)://`/`www.`; **no** affirmative
  auto-post/auto-ads/auto-publish (only negated); **no** affirmative "Brand Brain updated"/
  updateBrandBrain/saveBrandBrain/persistBrandBrain/buildBrandBrain in the panel; **no** Forme/sofa/
  furniture/nội thất/Fal.ai/ImgBB or Vị Cuốn contamination.

## Safety assessment (CLAUDE.md §4)

Approval-first ✅ · Owner-only authority (owner gate, not manager) ✅ · Accepted ≠ applied / written
to Brand Brain (`is_applied_to_brand_brain:false`, proposal `persisted_to_brand_brain:false` /
`requires_owner_approval_to_apply:true`) ✅ · Brand Brain never mutated/auto-updated (no mutator,
module decoupled) ✅ · rejected/pending not used (proposal accepted-only) ✅ · Approved ≠ Published /
Client Accepted ≠ Published ✅ · no AI/API/network / no live connectors / no live analytics / no
secrets / no webhook / no OAuth ✅ · no fake metrics (re-labels Phase W candidates only, invents no
numbers) ✅ · audit trail (source id, action, actor, reason, timestamp) ✅.

## Status

- Working tree: **dirty** (Phase X changes uncommitted).
- **Commit: NO.** **Push: NO.** Awaiting Codex review / Owner final approval.
