# Phase I-S2 — Canva Approval Contract Mapping

**Date:** 2026-06-22
**Builder:** Claude Code (PC1)
**Status:** PASS

## Goal
Normalize a contract/status mapping for Canva Sandbox outputs flowing through the
Approval Queue, preparing for a future real connector — WITHOUT connecting real
Canva in this phase.

## What changed
- **New:** `src/lib/core/connectors/canvaApprovalContract.ts` — pure/offline
  contract module:
  - `CanvaApprovalStatus` lifecycle: `sandbox_created → needs_review → submitted
    → approved | rejected` (no `published`/`live`/`launched` member exists).
  - Immutable single-literal axes: `mode='sandbox'`,
    `preview_status='sandbox_preview_only'`, `publish_status='not_published'`,
    `real_connector_action='none'`, `safety_flags` (`no_live_canva_api`,
    `no_publish`, `approval_required` all `true`).
  - `buildCanvaApprovalContract()`, `applyCanvaApprovalDecision()` (only mutates
    `approval_status`; re-asserts the safety axes on every decision),
    `isCanvaInternallyApproved()`, status↔item-status maps (fail-safe: any
    external-world item status maps back to `needs_review`).
  - `CANVA_APPROVAL_STATUS_LABEL` / `_COLOR`, `CANVA_CONTRACT_COPY`
    (adds **"Internal approval only"**).
- **Updated:** `canvaSandboxConnector.ts` — each preview now carries an
  `approval_contract`; item status derived via `canvaStatusToItemStatus` (still
  `needs_review`); caption embeds contract block (`publish_status`,
  `real_connector_action`, `approval_status`, "Internal approval only").
- **Updated:** `AutomationFactoryTab.tsx` — sandbox box header shows
  "Canva Sandbox Preview · Internal approval only".
- **Tests:** new `canvaApprovalContract.test.ts` (12); extended
  `canvaSandboxConnector.test.ts` (+2: contract carried on previews/items; copy
  drift guard).

## Validation
- `npm run build` — PASS (tsc + vite).
- `npm test` — PASS, 156/156 (was 142; +14).

## Safety assessment (§4)
- Approval-first: items enter as `needs_review`; ceiling unchanged. ✓
- **Approved ≠ Published:** `approve` only sets `approval_status='approved'`;
  `publish_status` stays `not_published`, `real_connector_action` stays `none`
  (asserted by tests). ✓
- No auto-post, no auto-ads, no live Canva connector, no real API/SDK/OAuth/
  token/env, no external Canva URL, no image/video generation. ✓
- No secrets / webhook URLs committed; sandbox needs no env vars. ✓

## Confirmation
Approved ≠ Published remains TRUE.
