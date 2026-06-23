# Phase I-S5 — Canva Sandbox Owner QA & Release Lock

**Date:** 2026-06-23
**Builder:** Claude Code (PC1)
**Scope:** Add an Owner QA & Release Lock layer that certifies the Canva sandbox
as cleared for demo/internal release in **sandbox mode only**, while structurally
locking it out of any live connector, publishing, external URL, OAuth, env keys,
and real Canva API/SDK. No real integration is added.

## What changed

1. **`src/lib/core/connectors/canvaReleaseLock.ts`** (new)
   - `CanvaSandboxReleaseLock` + `CANVA_SANDBOX_RELEASE_LOCK`: a machine-readable
     contract with `releaseMode: 'sandbox_locked'` and hard-`false` outward
     capability literals — `liveConnectorEnabled`, `publishEnabled`, `requiresEnv`,
     `oauthEnabled`, `externalUrlEnabled`, `webhookEnabled` — plus
     `approvalRequired: true` and `approvedDoesNotPublish: true`. The `false`
     literals mean TypeScript itself forbids ever representing this connector as
     live / publish-capable / env-requiring.
   - `CANVA_RELEASE_LOCK_COPY`: user-facing release-lock copy (`badge:
     'Sandbox Release Locked'`, `Internal QA Ready · Mock-only Canva Preview`,
     `Approved ≠ Published`).
   - `buildCanvaOwnerQaReport()`: pure/offline Owner QA report whose 8 checks
     (sandbox/mock only · approval preview exists · Owner can review · Approved ≠
     Published · no publish/post/ads/launch action · no live env/API/OAuth · no
     external URL/webhook · release locked sandbox) are each **derived** from the
     single-sourced sandbox safety flags / handoff record / release lock — so the
     checklist can never report "pass" while the underlying flags say live.

2. **`src/components/core/AutomationFactoryTab.tsx`**
   - Canva Sandbox controls now render a visible **🔒 Sandbox Release Locked**
     badge, the Owner QA checklist (per-check pass/warn), and the release-lock
     flag chips (`releaseMode`, `liveConnectorEnabled`, `publishEnabled`,
     `requiresEnv`, `approvalRequired`, `approvedDoesNotPublish`).
   - Added an explicit `Approved ≠ Published` chip next to the Sandbox-mode chip.

3. **Tests** — new `src/lib/core/connectors/canvaReleaseLock.test.ts` (7 tests):
   lock flags all false/sandbox; QA report all-pass; required QA dimensions
   present; no env keys / no live connector state; Approved ≠ Published structural;
   copy never affirms a live/published state; no external URL / API endpoint /
   OAuth / token / env-key references introduced.

## Safety guarantees

- **Sandbox/mock only.** `releaseMode = 'sandbox_locked'`; `liveConnectorEnabled
  = false`. No real Canva API/SDK/OAuth/token/env, no external URL, no webhook.
- **Approval-first preserved.** `approvalRequired = true`; sandbox output still
  enters `needs_review`; QA check `owner_can_review_preview` derives from this.
- **Approved ≠ Published.** `approvedDoesNotPublish = true`, `publishEnabled =
  false`, handoff `publish_status = not_published`; visible in UI + tests.
- **No publish/post/ads/launch path.** `publishEnabled = false`,
  `publish_capability = false`, `no_publish = true`. No such action exists.
- **No secrets / no live integration.** No keys, tokens, webhook URLs, or
  endpoints added. All "OAuth/webhook/external URL" mentions are negations.

## Tests / build result

- **`npm test`** — PASS (15 files, 177 tests; +7 new).
- **`npm run build`** — PASS (built in ~3.5s).
- **Safety search** — no real `CANVA_CLIENT_ID/SECRET/API/TOKEN`, no live OAuth,
  no real webhook/external Canva URL, no publish/post/ads/launch behaviour. No
  off-domain (Forme/sofa/furniture/nội thất/Fal.ai/ImgBB) contamination.

## Confirmations

- This is **sandbox-only**. No live Canva connector, OAuth, API, or webhook.
- **Approved ≠ Published** remains explicit and structural.
- The release is **locked** as sandbox/internal-release only; a real connector
  stays future-only behind the connector activation runbook + Owner sign-off.

## Recommendation: **PASS** — commit pending Owner review.
