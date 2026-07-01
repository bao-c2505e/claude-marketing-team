# Phase Y — Brand Brain Update Proposal & Owner Merge Gate

**Date:** 2026-07-01
**Builder:** Claude Code (PC1)
**Status:** ✅ Implemented locally + validated · 🟡 **PENDING CODEX REVIEW** · **NOT committed / NOT pushed**

## Scope

Turn the Phase X Owner-**accepted** learning candidates into explicit **Brand Brain Update
Proposals**, each with a visible **before/after diff** and a **separate Owner merge-approval gate**.

- Core model for a `BrandBrainUpdateProposal` (proposalId, brand/campaign/source ids, status,
  proposed sections, before/after snapshot, diff summary, owner decision, safety flags, audit trail).
- Deterministic generation that converts **only accepted** learning candidates into a proposal draft.
- Pure diff preview (existing value → proposed value + reason/evidence + risk note).
- Owner merge gate: `approve` / `reject` / `request revision` helpers.
- Owner-facing panel inside the Campaign Workspace, consistent with the existing UI style.

**Non-negotiable safety preserved:** Accepted learning does **NOT** auto-update Brand Brain; the
Brand Brain update proposal is **separate** from learning acceptance and requires an **explicit
Owner approval**; approval only marks a proposal `ready_for_manual_apply` (a separate, later manual
step — **never auto-applied**); Brand Brain source of truth is **never mutated** (no mutator exists
or was added); rejected/pending/unreviewed candidates are **ignored**; weak/missing evidence and
vague changes raise **safety flags** instead of being asserted; **no live analytics, no fabricated
metrics, no connector, no AI/API/network, no secrets/OAuth/webhook, no auto-post, no auto-ads**.
Approved ≠ Published; Client Accepted ≠ Published.

## Files changed

**New**
- `src/lib/core/brandBrainUpdateProposal.ts` — pure, deterministic Phase Y model:
  `BrandBrainUpdateProposal` + `BrandBrainProposalStatus` (`draft` / `pending_owner_approval` /
  `owner_approved` / `owner_rejected` / `revision_requested`); `toSectionSnapshot` (projects a
  `BrandBrain` into diffable section lists); `generateBrandBrainUpdateProposal` (accepted-only, maps
  candidate kind → Brand Brain section, raises weak-evidence/vague safety flags); `buildProposalDiff`
  (pure existing→proposed diff); merge-gate helpers `approve` / `reject` / `requestRevision`
  (+ shared `decideBrandBrainUpdateProposal`, no-op on non-decidable statuses); `listProposalAudit`;
  `renderBrandBrainUpdateProposalText`; verbatim safety-copy constants.
- `src/lib/core/brandBrainUpdateProposal.test.ts` — 24 domain tests.
- `src/components/core/BrandBrainUpdateProposalPanel.tsx` — Owner-only panel: accepted-candidates
  feed list, prepare button, proposal status, safety flags, before/after diff, Owner merge gate
  (Approve / Request revision / Reject), local audit trail, clipboard copy + text preview.
- `src/components/core/BrandBrainUpdateProposalPanel.source.test.ts` — 16 source-scan safety tests.

**Updated**
- `src/components/core/BrandBrainLearningReviewPanel.tsx` (Phase X) — **additive only**: optional
  `onReviewsChange` callback + a `useEffect` that mirrors the current review list up. The panel stays
  authoritative over its own decision state; the callback only reports so a sibling can read the
  ACCEPTED candidates. (All prior Phase X behavior/exports/copy unchanged.)
- `src/components/core/ManualPublishingEvidenceSection.tsx` — now also owns the mirrored learning
  reviews and renders `<BrandBrainUpdateProposalPanel>` as the **fourth** panel, AFTER Phase X; takes
  `client` / `brand` / `brief` / `assets` so Phase Y can build the current Brand Brain (read-only).
- `src/components/core/CampaignWorkspace.tsx` — passes `client` / `brand` / `brief` / `assets` into
  the section (still stateless — no `useState`/`useReducer` added).

**Not touched (as required):** `brandBrain.ts` (no mutator added — proposal is a sibling artifact,
never a `BrandBrain`), `brandBrainLearning.ts` (Phase X model frozen), `manualResultReview.ts`
(Phase W model frozen).

## Domain model — `brandBrainUpdateProposal.ts` (pure, never applies to Brand Brain)

- **Accepted-only:** `generateBrandBrainUpdateProposal` filters `reviews` to `decision === 'accepted'`;
  rejected / pending / unreviewed candidates never reach the proposal.
- **Deterministic section mapping:** `repeat → creativeDirection`, `avoid → donts`,
  `investigate → evidenceNotes` (each mapped to a real Brand Brain field for the diff).
- **Before/after + diff:** `toSectionSnapshot(brain)` builds the existing value; net-new additions are
  computed case-insensitively (an insight already present adds nothing); `buildProposalDiff` yields
  per-section `{ before, proposedAfter, additions, reason, risk }`.
- **Safety flags:** `weak_or_missing_evidence` (investigate / incomplete basis),
  `vague_change_needs_owner_review` (short insight), `no_accepted_candidates`, and always
  `not_based_on_live_analytics` + `no_fabricated_metrics`.
- **Status rule:** `draft` when nothing is accepted (nothing to approve); otherwise
  `pending_owner_approval`.
- **Merge gate:** `approve`/`reject`/`requestRevision` return NEW proposals and only act when status is
  `pending_owner_approval` or `revision_requested` (else a no-op returning the SAME reference — a draft
  or already-decided proposal is never silently changed). Approval sets `ready_for_manual_apply: true`
  but **never** persists/applies. Every decision appends an immutable audit entry.
- **Structural guarantees (always):** `persisted_to_brand_brain: false`,
  `is_applied_to_brand_brain: false`, `auto_applied: false`, `based_on_live_analytics: false`,
  `requires_owner_approval_to_apply: true`.

## UI — `BrandBrainUpdateProposalPanel.tsx`

- Owner-only gate (`can.publishContent`) for prepare + decisions; non-owners see a "Owner role
  required" note and no action buttons.
- Surfaces: (1) accepted candidates feeding the proposal + Prepare button, (2) proposal status,
  (3) safety flags, (4) before/after diff preview (additions highlighted), (5) Owner merge gate
  (Approve / Request revision / Reject + optional note), (6) local decision audit trail; CTA =
  Copy / Preview only (clipboard), no network.
- Re-preparing is required if the accepted set changes after a proposal was prepared (a stale proposal
  is dropped so no outdated approval lingers).
- Verbatim copy: "Accepted learning does not automatically update Brand Brain.", "Brand Brain update
  requires explicit Owner approval.", "This proposal is not based on live analytics.", "never
  auto-applied", "separate, later manual apply step", "Applied to Brand Brain: NO", "Approved ≠
  Published", "Client Accepted ≠ Published".

## Validation

- **Tests:** `npm test` (vitest run) → **51 files / 740 tests PASS**. Phase Y added 2 files + 40
  tests (24 domain + 16 panel-source). Affected panel tests (Phase X panel source, CampaignWorkspace
  source, section wiring) all green.
- **Build:** `npm run build` (tsc + vite) → **PASS**, 0 TS errors (`CampaignWorkspace` chunk
  ~199.28 kB). (Three initial TS errors were `Array.prototype.at` usages in the new test file only —
  replaced with index access; no change to model/panel.)
- **Safety greps:** the new/changed source files carry **no** `http(s)://` / `www.` / `fetch(` /
  axios / XMLHttpRequest / OAuth / webhook / access_token / client_secret / api_key / `localStorage`;
  **no** affirmative auto-post / auto-ads / auto-publish (only negated); **no** affirmative "Brand
  Brain updated" / updateBrandBrain / saveBrandBrain / persistBrandBrain; **no** Forme / sofa /
  furniture / nội thất / Fal.ai / ImgBB contamination.

## Safety assessment (CLAUDE.md §4)

Approval-first ✅ · Owner-only authority (owner gate, not manager) ✅ · Accepted learning ≠
auto-update Brand Brain (generation is a separate, explicit prepare step) ✅ · Brand Brain update
requires explicit Owner approval, separate from learning acceptance ✅ · approval only marks
`ready_for_manual_apply` (manual, never auto-applied) ✅ · Brand Brain never mutated/auto-updated (no
mutator, proposal is a sibling artifact) ✅ · rejected/pending/unreviewed ignored ✅ · Approved ≠
Published / Client Accepted ≠ Published ✅ · no live analytics / no fabricated metrics (weak evidence
→ safety flag) ✅ · no live connectors / no AI/API/network / no secrets / no webhook / no OAuth ✅ ·
audit trail (generation + every decision: actor, action, from/to status, notes, timestamp) ✅.

## Status

- Working tree: **dirty** (Phase Y changes uncommitted).
- **Commit: NO.** **Push: NO.** Awaiting Codex review / Owner final approval.
