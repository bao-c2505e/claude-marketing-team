# Phase I-S8 — Connector Activation Audit Trail & Sign-off Ledger UI

**Date:** 2026-06-23
**Builder:** Claude Code (PC1)
**Scope:** Add a **read-only** Connector Activation Ledger / Owner Sign-off audit
surface in the Connector Registry admin tab that clearly shows each connector's
activation status, live blockers, Owner sign-off requirement (not granted), and
the fact that **no connector is live**. Completes the connector safety foundation.
No live connector, OAuth, webhook, env, publish/ads behaviour, or activation
control was added.

## What changed

1. **`src/lib/core/connectors/connectorLedger.ts`** (new — pure model)
   - `ConnectorLedgerRow` projects the Phase I-S6 governance matrix + Phase I-S7
     sign-off contract into a flat read-only row. Every capability column
     (`liveConnectorEnabled`, `publishEnabled`, `adsLaunchEnabled`,
     `webhookEnabled`, `oauthEnabled`, `envRequiredNow`, `ownerSignoffGranted`)
     is a hard `false` literal; `ownerSignoffRequired`, `approvedDoesNotPublish`,
     `readOnly` are hard `true`.
   - `buildConnectorActivationLedger()` (one row per governed connector),
     `buildConnectorLedgerSummary()` (`liveCount: 0`, `allLiveBlocked: true`,
     `anySignoffGranted: false`, `readOnly: true`), and `CONNECTOR_LEDGER_COPY`
     (premium-SaaS labels).

2. **`src/components/core/ConnectorActivationLedger.tsx`** (new — presentational)
   - DISPLAY-ONLY React component: no state, no handlers, no buttons/inputs, no
     mutation. Renders the ledger summary banner + per-connector cards with
     `Live blocked · Owner sign-off required · Sign-off not granted · Approved ≠
     Published` pills and the `false` capability cells. Shows a "Read-only — no
     activation, publish, or launch controls" notice.

3. **`src/components/core/ConnectorRegistryTab.tsx`**
   - Added a new **Activation Ledger** read-only sub-tab (ShieldCheck icon) that
     renders `<ConnectorActivationLedger />`. No other behaviour changed.

4. **Tests** —
   - `connectorLedger.test.ts` (9 tests): rows per connector; all live caps
     false/blocked; Owner sign-off required but not granted; Canva sandbox-locked;
     Meta/TikTok/Zalo/Google Ads future-only & not live; Approved ≠ Published
     visible; summary zero-live/all-blocked/read-only; deterministic; no
     URL/OAuth/token/env-key refs & no live copy.
   - `ConnectorActivationLedger.source.test.ts` (4 tests, source-scan via `?raw`):
     no buttons/inputs/selects/links; no onClick/onChange/onSubmit/useState; no
     activate/publish/launch/grant calls or registry mutations; no
     URL/OAuth/token/env-key/fetch refs.

## Connector ledger matrix

| Connector | Status | Live | Publish | Ads launch | Webhook | OAuth | Env now | Sign-off required | Sign-off granted | Approved ≠ Published |
|---|---|---|---|---|---|---|---|---|---|---|
| Canva | sandbox (Sandbox locked) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Meta Ads | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| TikTok Business | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Zalo OA | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Google Ads | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Google Drive | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Google Sheets | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| n8n Backbone | mock | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |

(✗ on a capability = hard-`false` / blocked; ✓ on "Sign-off required" / "Approved
≠ Published" = enforced. `liveCount = 0`.)

## Safety guarantees

- **Read-only.** The component has no state/handlers/buttons/mutations (enforced
  by a source-scan test). The new sub-tab only renders the ledger.
- **All live connectors blocked.** Every capability column is a `false` literal;
  summary `liveCount = 0`, `allLiveBlocked = true`.
- **Owner sign-off required but NOT granted** on every row (`signoffStatus =
  not_requested`).
- **Canva remains sandbox/mock only** (Sandbox locked).
- **Approved ≠ Published** visible on every row + in the summary banner.
- **No real env/API/OAuth/webhook/external URL** introduced; no new dependency.

## Confirmations

- **No live connector was enabled.** Display-only projection of existing
  governance + sign-off contracts.
- **No activation controls were added.** No toggles, buttons, or mutation
  handlers (source-scan verified).
- **Approved ≠ Published** remains explicit.

## Validation

- **`npm test`** — PASS (19 files, 209 tests; +13 new).
- **`npm run build`** — PASS (~3.5s; tsc + vite). Two issues caught & fixed
  mid-phase: a self-matching regex on the "No connector is live" copy, and the
  source-scan switched from `node:fs` to a typed `?raw` import.
- **Safety search** — no real `CANVA_*` / `META_ACCESS_TOKEN` /
  `TIKTOK_ACCESS_TOKEN` / `ZALO_ACCESS_TOKEN` / `GOOGLE_ADS_*`, no live
  OAuth/webhook/external URL, no publish/post/ads/launch behaviour. No off-domain
  (Forme/sofa/furniture/nội thất/Fal.ai/ImgBB) contamination.

## Connector safety foundation status

**COMPLETE.** Sandbox foundation → approval contract → registry/runbook cleanup →
E2E preview layer → Owner QA & release lock → activation governance & live
blockers → activation runbook & Owner sign-off record → **read-only activation
ledger UI**. Canva is sandbox/mock only; all connectors are live-blocked behind
Owner sign-off; Approved ≠ Published throughout.

## Recommended next phase (outside connector safety)

**Phase J — Owner Dashboard / Campaign Production Polish:** e.g. an Owner-facing
overview (approval queue health, campaign progress, content pack readiness) or
UX polish of the existing approval/handoff flows — all within the existing
approval-first, no-live-connector boundary.

## Recommendation: **PASS** — commit pending Owner review.
