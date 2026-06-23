# Phase P — Approval Revision Loop & Decision Audit Trail

**Date:** 2026-06-24
**Builder:** Claude Code (PC1)
**Scope:** Surface the approval **revision loop** and **decision audit trail** in the
Approval Queue detail — a prominent "latest decision + feedback" panel and an explicit
"changes requested — awaiting revised output" placeholder — built entirely on the
**existing** approval state machine and event log. Additive, read-only. No model
rename, no new dependency, no live connector, webhook, secret, or env change.

## Inspection (before any edit) — most of Phase P already existed

The approval system already provides the full revision workflow; Phase P surfaces it
rather than rebuilding it:
- **States** (`types/core.ContentApprovalStatus`): `draft · submitted · approved ·
  rejected · revision_requested · cancelled` — compatible with the requested
  needs_review/pending_review (`submitted` + item `needs_review`), approved,
  changes_requested (`revision_requested`), rejected. **No new states added** (keeps
  existing exhaustive label/colour maps and tests intact).
- **Actions**: `ApprovalsTab` DetailView already renders **Approve / Reject / Request
  Revision**, each with an Owner **feedback/comment** textarea.
- **Non-destructive + audited**: `coreData.executeApprovalAction` updates request +
  item status, **preserves the content item** (maps, never deletes), and appends a
  `ContentApprovalEvent` with `previous_status` / `new_status` / `comment` / actor /
  timestamp. The **Approval History** timeline + **Comments** section already render
  this. `revision_requested` → item status `revision_requested` (original draft kept).

The genuine gaps were UI surfacing: (1) the **latest** decision + its feedback wasn't
called out (buried in history), and (2) there was no explicit "changes requested —
awaiting revised output" state with its preservation/no-auto-regenerate guarantees.

## What changed

### `src/lib/core/approvalDecision.ts` (new — pure, read-only)
- `deriveLatestDecision(events)` → the most recent reviewer decision (approved /
  rejected / revision_requested / cancelled) with its feedback `comment`, actor, and
  time; sorts by `created_at` desc itself; `null` when none.
- `isAwaitingRevision(status)` → true for `revision_requested`.
- `summarizeDecisions(events)` → per-action counts (compact audit summary).
- `DECISION_ACTIONS` and `REVISION_LOOP_COPY` (pinned, approval-first placeholder
  copy: original draft preserved / snapshot preserved / no auto-regenerate / nothing
  published · Approved ≠ Published).
- Header documents the read-only contract: no mutation, no regeneration, no network.

### `src/components/core/ApprovalsTab.tsx` (additive UI)
- Imports the helpers; derives `latestDecision = deriveLatestDecision(events)` and
  `awaitingRevision = isAwaitingRevision(request.status)`.
- New surfaces between the header card and the AI output preview (wrapped in
  `PHASE_P_REVISION_START/END`):
  - **Changes Requested — Awaiting Revised Output** (when `awaitingRevision`): shows
    the latest feedback note + actor/time, and the three guarantees (original AI draft
    preserved / Brand Context Snapshot preserved / Core does not auto-regenerate),
    plus the Approved ≠ Published / nothing-published line.
  - **Latest Decision & Feedback** (for other resolved states): action label + status
    chip + feedback note + actor/time.
- No handler, state-machine, or approval-semantics change; the existing Approve /
  Reject / Request Revision actions, Comments, and Approval History are untouched.

### `src/App.tsx`
- Unchanged this phase (ApprovalsTab already receives everything needed).

## Tests

- **`src/lib/core/approvalDecision.test.ts`** (new — 8 tests): latest decision +
  feedback note (request changes), unsorted-events robustness, rejected detection,
  `isAwaitingRevision` for revision/approved/rejected/submitted, decision summary,
  decision-action set, and `REVISION_LOOP_COPY` stays non-destructive + Approved ≠
  Published.
- **`src/components/core/ApprovalsTab.source.test.ts`** (+7 tests): wires
  `deriveLatestDecision`/`isAwaitingRevision`/`REVISION_LOOP_COPY` from the audit log;
  Approve/Reject/Request Revision + feedback textarea present; explicit revision
  placeholder references the preserved-draft/preserved-snapshot/no-auto-regenerate
  copy + "Latest feedback"; latest-decision + feedback-note surface; Approved ≠
  Published + Approval History present; and (scoped to the marked slice) no
  publish/post/ads-launch/activate/sync action, no fetch/axios/URL/OAuth/webhook/
  token/key, no contamination.
- Existing approval behaviour unchanged — full suite stays green.

## Safety guarantees

- **Non-destructive revision.** Request Changes never deletes the original AI output
  (`executeApprovalAction` preserves the content item); the UI states this explicitly.
- **Snapshot preserved.** The Phase O Brand Context Snapshot still renders in the
  revision_requested state, so the reviewed version's grounding stays visible.
- **No auto-regeneration / no live behaviour.** Pure derived UI — no fetch / axios /
  network / OAuth / webhook / external URL; no upload/publish/post/ads/launch/activate/
  sync; no OpenAI/API key/env in Core; no new dependency.
- **Approved ≠ Published** and approval-first copy remain visible; AI outputs stay
  draft / `pending_approval` / `revision_requested` only — no published/posted/launched
  state introduced.
- **Connector safety unchanged.** Ledger read-only, live connectors blocked, Canva
  sandbox/mock only.

## Validation

- **`npm test`** — PASS (28 files, 284 tests; +2 files / +15 tests vs 27/269).
- **`npm run build`** — PASS (tsc + vite, ~5s; 0 TS errors; no >500 kB warning).
- **`git status --short`** — only intentional changes: `M ApprovalsTab.tsx`,
  `M ApprovalsTab.source.test.ts`, new `approvalDecision.ts` + `approvalDecision.test.ts`,
  plus this log.
- **Safety search** — no `CANVA_*` / `META_ACCESS_TOKEN` / `TIKTOK_ACCESS_TOKEN` /
  `ZALO_ACCESS_TOKEN` / `GOOGLE_ADS` / `OPENAI_API_KEY` added; no OAuth/webhook/external
  URL/fetch/axios introduced; no upload/publish/post/ads/launch/activate/sync; auto-post
  only negated; no Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination in the diff.

## Risk / follow-up

- Low risk: one new pure helper module + two additive read-only panels; the approval
  state machine, handlers, and data model are untouched.
- Optional next: show a "changes requested" badge + latest-feedback preview on approval
  **list** rows, and link a revised regeneration back to its prior version id.

## Recommended next phase

**Phase Q — Campaign Workspace decision & revision rollup**: surface per-campaign
approval/revision status (counts + latest decisions) in the Campaign Workspace
production drill-down — still read-only, approval-first, no live connectors.

## Recommendation: **PASS** — commit pending Owner review (do not commit yet).
