# Phase I-S7 — Connector Activation Runbook & Owner Sign-off Record

**Date:** 2026-06-23
**Builder:** Claude Code (PC1)
**Scope:** Add a formal connector activation **governance runbook**, an **Owner
sign-off record template**, an activation **matrix**, and a small static
**sign-off contract** so any future move from sandbox/mock/future_only/
live_blocked toward live mode requires an explicit, documented, reviewed Owner
sign-off. No live connector, OAuth, webhook, env, or publish/ads behaviour added.

## What changed

1. **`CLAUDE_MARKETING_TEAM/07_runbooks/connector_activation_governance_runbook.md`** (new)
   - Explains the six activation statuses (`sandbox`, `mock`, `disabled`,
     `future_only`, `live_blocked`, `requires_owner_signoff`) and what each means.
   - Documents **why Approved ≠ Published**, **why an approval preview is not
     publishing**, and **why live activation is blocked by default** (hard `false`
     type literals + sign-off necessary-but-not-sufficient).
   - Defines the **required process** before enabling any real connector and the
     **connector activation matrix** (all live-blocked, Owner sign-off required).
   - Provides the **Owner sign-off record template** (connector name/key, current
     vs requested mode, business reason, approver, date, scope, env keys,
     OAuth/webhook/API risk, data-access review, publishing/ads/spend risk,
     rollback plan, test plan, safety checklist, sign-off status, final signature,
     and the explicit `Approved ≠ Published` statement).
   - Cross-links the staged `connector_activation_safety_runbook.md`.

2. **`src/lib/core/connectors/connectorSignoff.ts`** (new — static contract)
   - `ConnectorSignoffStatus` lifecycle: `not_requested · pending_owner_signoff ·
     owner_signed_off · rejected` (sign-off **document** state; never "live").
   - `CONNECTOR_SIGNOFF_CHECKLIST` — the 10 review items an Owner must cover
     (incl. `approved_not_published_ack`).
   - `ConnectorActivationSignoffRecord` — mirrors the template; **extends** the
     Phase I-S6 `CONNECTOR_LIVE_BLOCKERS` and adds two extra hard-`false` grant
     flags (`liveActivationGranted`, `publishCapabilityGranted`) so a recorded
     sign-off can never itself authorise live/publish.
   - `buildDefaultSignoffRecord(key)` / `buildAllDefaultSignoffRecords()` —
     default = blocked, not-requested, nothing granted; current status mirrors the
     governance matrix. `isLiveActivationGranted()` is always false.

3. **Tests** — new `src/lib/core/connectors/connectorSignoff.test.ts` (8 tests):
   default blocked & not-requested; Owner sign-off gate present before live;
   Approved ≠ Published explicit + ack in checklist; covers all governed
   connectors mirroring current status; Canva stays sandbox & not live; full
   lifecycle + checklist exposed; deterministic; no external URL/OAuth/token/
   real env-key references.

## Safety guarantees

- **All live connectors remain blocked.** Records extend the shared `false`
  live-blocker literals; both grant flags are hard `false`; `isLiveActivationGranted`
  is always false.
- **Owner sign-off required** before any live mode, and a recorded sign-off is
  **necessary but not sufficient** (staged runbook still required, future-only).
- **Canva remains sandbox/mock only** (current status mirrored from governance).
- **Approved ≠ Published** explicit on every record + an explicit acknowledgement
  item in the checklist + an explicit statement in the runbook template.
- **No real env required now** (`requiresEnv = false`); no real key names, no
  OAuth, no webhook, no external URL introduced. No new dependency.

## Connector matrix summary

| Connector | Status | Live/Publish/Ads/OAuth/Webhook | Env now | Owner sign-off | Approved ≠ Published |
|---|---|---|---|---|---|
| Canva | sandbox | all ✗ | none | required | ✓ |
| Meta / TikTok / Zalo / Google Ads | future_only | all ✗ | none | required | ✓ |
| Google Drive / Sheets | future_only | all ✗ | none | required | ✓ |
| n8n | mock | all ✗ | none | required | ✓ |

## Confirmations

- **No live connector was enabled.** This phase is docs + a static, blocked
  sign-off contract only.
- **Approved ≠ Published** remains explicit (record flag + checklist ack +
  runbook statement).
- **No real Canva/Meta/TikTok/Zalo/Google Ads/Drive/Sheets/n8n integration**,
  OAuth, webhook, env requirement, or publish/ads behaviour was added.

## Validation

- **`npm test`** — PASS (17 files, 196 tests; +8 new).
- **`npm run build`** — PASS (~3.4s; tsc + vite).
- **Safety search** — no real `CANVA_*` / `META_ACCESS_TOKEN` / `TIKTOK_ACCESS_TOKEN`
  / `ZALO_ACCESS_TOKEN` / `GOOGLE_ADS_*`, no live OAuth/webhook/external URL, no
  publish/post/ads/launch behaviour in connector runtime. No off-domain
  (Forme/sofa/furniture/nội thất/Fal.ai/ImgBB) contamination.

## Recommended next phase

**Phase I-S8 — Connector Activation Audit Trail & Sign-off Ledger UI:** surface
the sign-off records as a read-only Owner ledger in the Connector Registry tab
(history of requested/recorded sign-offs), still with zero live capability.

## Recommendation: **PASS** — commit pending Owner review.
