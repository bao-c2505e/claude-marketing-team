# Phase I-S6 — Connector Activation Governance & Live Connector Blockers

**Date:** 2026-06-23
**Builder:** Claude Code (PC1)
**Scope:** Add a shared connector activation governance layer so every
current/future connector has an explicit activation status, a hard live-blocker
contract, and an Owner sign-off requirement before anything can ever become live.
No real connector, OAuth, webhook, env requirement, or publish/ads behaviour is
added.

## What changed

1. **`src/lib/core/connectors/connectorGovernance.ts`** (new)
   - `ConnectorActivationStatus` union: `sandbox · mock · disabled · future_only
     · live_blocked · requires_owner_signoff` (+ label/color maps for UI).
   - `ConnectorLiveBlockers` + `CONNECTOR_LIVE_BLOCKERS`: shared contract with
     hard-`false` literals (`liveConnectorEnabled`, `publishEnabled`,
     `adsLaunchEnabled`, `webhookEnabled`, `oauthEnabled`, `requiresEnv`) plus
     `ownerSignoffRequired: true` and `approvedDoesNotPublish: true`. The `false`
     literals make a live/publish/ads/OAuth/webhook state a TypeScript error.
   - `CONNECTOR_GOVERNANCE_MATRIX` covering Canva, Meta, TikTok, Zalo, Google Ads,
     Google Drive, Google Sheets, n8n. TikTok/Zalo/Google Ads are represented as
     `future_only` **docs-only** entries — no fake runtime connector is added.
     `futureEnvDocumented` honestly flags future env placeholders WITHOUT setting
     `requiresEnv` (stays false) and without listing any real key names.
   - `buildConnectorGovernanceMatrix()`, `getConnectorGovernance(key)`,
     `isConnectorLiveBlocked()`, and `connectorActivationBadge(type)` (runtime
     registry bridge: maps `LocalConnectorType` → activation status; unmapped
     provider/infra types default to `future_only`).
   - Compile-time consistency guard ties the Canva entry to
     `CANVA_SANDBOX_RELEASE_LOCK` (Phase I-S5) so they can never drift.

2. **`src/components/core/ConnectorRegistryTab.tsx`**
   - Each connector card now shows a governance badge row: **activation status**
     · **Live blocked** · **Owner sign-off required** · **Approved ≠ Published**.
   - Governance footer adds the activation-governance summary + Owner sign-off /
     Approved ≠ Published reminders.

3. **Tests** — new `src/lib/core/connectors/connectorGovernance.test.ts`
   (11 tests): live capabilities blocked by default; required statuses present;
   every governed connector live-blocked; matrix coverage; Canva sandbox/mock &
   release-lock consistency; Meta/TikTok/Zalo/Google Ads future-only & not live;
   Approved ≠ Published explicit; deterministic flags; no live env keys required;
   runtime badge live-blocked + owner-gated; no external URL/OAuth/token/env-key
   references.

## Connector governance matrix

| Connector | Activation status | Live | Publish | Ads launch | OAuth | Webhook | Owner sign-off | Approved ≠ Published |
|---|---|---|---|---|---|---|---|---|
| Canva | sandbox | ✗ | ✗ | ✗ | ✗ | ✗ | required | ✓ |
| Meta Ads | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | required | ✓ |
| TikTok Business | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | required | ✓ |
| Zalo OA | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | required | ✓ |
| Google Ads | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | required | ✓ |
| Google Drive | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | required | ✓ |
| Google Sheets | future_only | ✗ | ✗ | ✗ | ✗ | ✗ | required | ✓ |
| n8n Backbone | mock | ✗ | ✗ | ✗ | ✗ | ✗ | required | ✓ |

(✗ = hard-`false` literal / blocked. Runtime provider/infra types not in the
matrix — openai/anthropic/gemini/comfyui/storage/webhook — badge as `future_only`,
live-blocked, owner-gated.)

## Safety guarantees

- **All live connectors blocked.** Every live/publish/ads/OAuth/webhook flag is a
  hard `false` literal. `isConnectorLiveBlocked()` is true for all entries.
- **Canva stays sandbox/mock only**, consistent with `CANVA_SANDBOX_RELEASE_LOCK`
  via a compile-time guard.
- **Owner sign-off required** before any future activation (`ownerSignoffRequired
  = true` everywhere; surfaced in the UI).
- **Approved ≠ Published** explicit on every connector and in the UI.
- **No real env required now** (`requiresEnv = false`); future env is documented
  only (no real key names introduced).
- **No new dependency, API, SDK, OAuth, webhook, or external URL.**

## Confirmations

- **No live connector was enabled.** This is governance metadata + UI only.
- **Approved ≠ Published** remains explicit.
- **No real Canva/Meta/TikTok/Zalo/Google Ads/Drive/Sheets/n8n integration** was
  added; future connectors remain future-only behind the activation runbook.

## Validation

- **`npm test`** — PASS (16 files, 188 tests; +11 new).
- **`npm run build`** — PASS (~3.5s).
- **Safety search** — no real `CANVA_*`/`META_ACCESS_TOKEN`/`TIKTOK_ACCESS_TOKEN`/
  `ZALO_ACCESS_TOKEN`/`GOOGLE_ADS_*`, no live OAuth/webhook/external URL, no
  publish/post/ads/launch behaviour in connector runtime. No off-domain
  (Forme/sofa/furniture/nội thất/Fal.ai/ImgBB) contamination.

## Recommended next phase

**Phase I-S7 — Connector Activation Runbook & Owner Sign-off Record:** a
machine-readable, per-connector activation checklist + Owner sign-off ledger that
must be satisfied (and recorded) before a connector could ever be proposed for a
future live phase — still no live integration.

## Recommendation: **PASS** — commit pending Owner review.
