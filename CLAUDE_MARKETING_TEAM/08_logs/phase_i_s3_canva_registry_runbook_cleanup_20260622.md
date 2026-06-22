# Phase I-S3 — Canva Connector Registry & Runbook Cleanup

**Date:** 2026-06-22
**Builder:** Claude Code (PC1)
**Status:** PASS

## Goal
Clean older docs/registry references so Canva is consistently represented as
**sandbox / mock / future-only**, preventing any confusion that CORE currently
has a live Canva connector. No new connector, no real API, no secrets.

## Problem found
Older PC2-module design docs used present-tense / "V1" wording that could imply a
live Canva integration already exists:
- `modules/canva-connector/README.md` — "connects with the Canva API to generate
  and modify design templates"; listed `CANVA_API_KEY` as a needed env var.
- `modules/canva-connector/contract.md` — `design_id` / `design_url` /
  `export_urls`; "Allowed actions in V1: create drafts … export drafts".
- `modules/README.md` — Canva row "Integrates Canva API to generate/modify…".
- `.env.example` — Canva block described capability without a "not required in
  sandbox" marker.
- `src/lib/core/connectorRegistry.ts` — `conn-canva` description/safety_note was
  stale ("Phase 13 — registry only") and didn't reference the sandbox connector.

## Cleanup applied (clarify, do not delete history)
- **`modules/canva-connector/README.md`** — added a ⚠️ STATUS banner (contract/
  design-spec only, NOT implemented/live; points to `canvaSandboxConnector.ts`;
  no API/SDK/OAuth/token/env, no design created, nothing published, real action =
  none); reworded body to "intended, in a future phase"; marked env vars
  **"KHÔNG bắt buộc trong phase hiện tại — sandbox không cần key"** (future-only
  placeholders).
- **`modules/canva-connector/contract.md`** — added ⚠️ STATUS banner; reframed
  `design_id`/`design_url`/`export_urls` as a future target (sandbox emits fake
  `MOCK-CANVA-*` / `sandbox-canva-*` refs instead); reworded "Allowed actions in
  V1" → "future real V1, after Owner-gated activation" + explicit "NONE run in
  the current sandbox phase".
- **`modules/README.md`** — Canva row status → "Contract Only (not implemented)"
  + "Current phase: Sandbox Preview only — no real Canva API/key, no design
  created, nothing published".
- **`.env.example`** — Canva block now states CURRENT PHASE = sandbox/mock,
  keys NOT required / NOT read / NOT used; live capability is FUTURE-only behind
  the activation runbook + `ALLOW_CANVA_EXPORT_AFTER_APPROVAL`. No real values.
- **`src/lib/core/connectorRegistry.ts`** (runtime — safety-label consistency):
  `conn-canva` description + safety_note rewritten to "Sandbox/mock only — no real
  Canva API call, no API key required, no design created, nothing published; real
  connector (OAuth 2.0) is future-only". `mode: 'mock'`, `status: not_configured`
  unchanged.
- **`07_runbooks/connector_activation_safety_runbook.md`** §4 — added a
  "Current phase = Stage 1–2 only (sandbox/mock)" note; "Allowed: create draft/
  design" relabelled "Allowed (future, Stage 5)".
- **`03_core/connector_registry_README.md`** — added a Canva sandbox-only note
  under the connectors table.
- **NEW** this log.

## Preserved as-is (already safe / historical)
- `07_docs/future_real_connectors.md`, `07_docs/demo_vs_real_boundary.md` — Canva
  already in the explicit **future / "Tương Lai"** column.
- `n8n-workflows/*.workflow.json` — Canva appears only in **"do NOT add any
  Canva connector"** safety notes; `n8n-workflows/README.md` "canvas" = the n8n
  editor canvas (false positive).
- `src/mockData.ts` — "Canva brief" is demo **design-brief content** (a brief a
  designer would use), not a connector claim.
- All `08_logs/*` historical entries left intact (history preserved).

## Validation
- `npm run build` — PASS (tsc + vite).
- `npm test` — PASS, 156/156.

## Remaining Canva/env/webhook references — classification
- **OK (sandbox/future-only docs):** module README/contract (now bannered),
  modules/README, .env.example Canva block, runbook §4, registry README,
  future_real_connectors, demo_vs_real_boundary, CLAUDE.md §7.
- **OK (historical logs w/ context):** all `08_logs/*` Canva mentions.
- **OK (safety guards):** n8n workflow "no Canva connector" notes.
- **OK (runtime, sandbox-only):** `connectorRegistry.ts` conn-canva
  (mock/not_configured), `canvaSandboxConnector.ts` / `canvaApprovalContract.ts`
  (offline mock).
- **BLOCKER (live Canva active):** NONE.

## Safety assessment (§4)
- Approval-first preserved; Approved ≠ Published preserved.
- No live Canva connector, no real Canva API/SDK/OAuth/token/env, no external
  Canva URL, no fake "created in Canva", no fake "published".
- No auto-post, no auto-ads. Real connector action remains **none**.
- No secrets or real webhook URLs added (docs-only + one runtime safety-label
  string). `.env.example` keeps empty placeholders only.

## Confirmation
- No secrets / no real Canva API / no webhook / no publish path introduced.
- NOT pushed.
