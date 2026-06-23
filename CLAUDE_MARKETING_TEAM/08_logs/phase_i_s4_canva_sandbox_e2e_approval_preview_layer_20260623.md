# Phase I-S4 — Canva Sandbox E2E Approval Preview Layer

**Date:** 2026-06-23
**Builder:** Claude Code (PC1)
**Scope:** Make the existing Canva sandbox/mock connector usable end-to-end in the
CORE UI/approval flow as a normalized **handoff record** + **approval history**,
without adding any real external integration.

## What changed

1. **`src/lib/core/connectors/canvaApprovalContract.ts`**
   - Added `CanvaSandboxHandoffRecord` + `buildCanvaSandboxHandoffRecord(contract)`:
     a flat record with `provider: 'canva'`, `mode: 'sandbox'`, and hard-`false`
     capability flags `external_call`, `requires_env`, `publish_capability`, plus
     `approval_required: true`. The flags are fixed literals — no approval
     decision can flip them. `approval_status`/`publish_status` echo the contract
     (`publish_status` is itself pinned to `not_published`).
   - Added `CanvaApprovalHistoryEntry` + `buildCanvaApprovalHistory(status)`:
     preserves the lifecycle Generated draft → Canva sandbox preview created →
     Submitted for approval → Approved (internal only) / Rejected. No
     Published/Launched step exists.

2. **`src/lib/core/connectors/canvaSandboxConnector.ts`**
   - Added `mockPreviewOnly` / `noExternalCall` to `CANVA_SANDBOX_COPY`.
   - Each `CanvaSandboxPreview` now carries a `handoff_record`.
   - Caption now embeds the handoff record block, the new labels, an
     "Approved … manual handoff/export/mock preview only — never published" line,
     and the approval-history checklist (so the Approval detail view preserves it).
   - Audit-log payload now records `external_call:false`, `requires_env:false`,
     `publish_capability:false`.

3. **`src/components/core/AutomationFactoryTab.tsx`**
   - Canva Sandbox controls now show the four labels (Canva Sandbox · Mock preview
     only · No external Canva call · Nothing was published) and render the handoff
     record capability flags as chips.
   - Success message includes "Mock preview only" / "No external Canva call".

4. **`modules/canva-connector/README.md`** — added a "Current sandbox preview
   flow" section documenting the handoff record fields and approval history.

5. **Tests** — extended
   `canvaApprovalContract.test.ts` (handoff record flags fixed across all
   decisions; history lifecycle; Approved ≠ Published) and
   `canvaSandboxConnector.test.ts` (handoff record on every preview + embedded in
   caption; history + new labels embedded; audit-log capability flags).

## Validation

- **`npm test`** — PASS (14 files, 170 tests).
- **`npm run build`** — PASS (built in ~3.5s).
- **Repo search** — confirmed no real Canva API/SDK/OAuth/token/env/webhook or
  external URL is introduced; all matches are safety negations, comments, or
  test guards. No off-domain (non-FnB/SME) contamination.

## Safety assessment (CLAUDE.md §4)

- Approval-first: previews enter `needs_review`; ceiling for sandbox is the queue. ✅
- Approved ≠ Published: `publish_capability:false`, `publish_status:not_published`,
  approved maps to internal `approved` only; visible in UI, caption, and tests. ✅
- No auto-post / no auto-ads / no real Canva call / no env key / no image-video gen. ✅
- All connector actions logged (audit trail entry per run). ✅
- No secrets added. ✅

## Assumptions

- The handoff record is surfaced through the existing approval queue item
  (caption block) rather than a new DB field, to avoid a schema change.
- Sandbox handoff flags are deterministic, so the UI renders them from a
  module-level constant rather than threading run results.

## Recommendation: **PASS**
