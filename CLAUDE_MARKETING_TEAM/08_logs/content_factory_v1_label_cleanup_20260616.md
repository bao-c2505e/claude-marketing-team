# Content Factory V1 — n8n AI Provider Label Cleanup - 2026-06-16

## Status

DONE. Core UI generation labels now reflect the live production reality:
Production Core → n8n Production Webhook → OpenAI → Normalize → Core.

## Context (verified production state before this task)

- Domain live: `https://coreagency.digital` / `https://www.coreagency.digital`.
- Production Core → n8n Production Webhook → OpenAI → Normalize → Core flow: PASS.
- 7 pending approval items created from a real n8n AI response.
- Submit for Approval: PASS. Approve: PASS. Approval history visible.
- Approval-first safety preserved.
- OpenAI key remains only in n8n Credentials (never in Core/Vercel/frontend).
- Previous build/test: `npm run build` PASS, `npm test` PASS 47/47.

## Problem

Several UI strings still implied AI/n8n was not connected — most notably the
shared Generation History table hardcoded every job (including real n8n
`external_module` jobs) as `Mock`, and the Automation Factory header claimed its
buttons "do not call external APIs". With the n8n production flow live, these
labels were inaccurate.

## What changed (display text + mode clarity only)

- Centralized mode-aware labels in `coreData.ts`:
  - `GENERATION_MODE_LABEL`: `external_module → "n8n AI Provider"`,
    `mock → "Local fallback mode"`, `ai_ready → "AI provider"`.
  - `GENERATION_MODE_COLOR` and `GENERATION_MODE_SOURCE`
    (`external_module → "Source: n8n / generated_by: n8n-ai-provider"`).
- `ContentGenerationTab.tsx`: history table "Mode" column, detail "Generation
  Mode" value, and detail badge are now mode-aware (no more hardcoded `Mock`).
  Safety banner reworded to "Approval-first generation" (removed
  "AI API not connected").
- `AutomationFactoryTab.tsx`: header badge, header description, Content Pack card
  sublabel, and primary button are mode-aware. Button reads "Generate with n8n
  AI Provider"; a chip shows "n8n AI Provider" when the webhook env is
  configured and "Local fallback mode" when it is not. Result message:
  "<n> pending approval items were created via <mode>. Nothing was posted or
  launched." Removed the false "do not call external APIs" claim while keeping
  "no publish / no launch / no live connector".
- `App.tsx`: dashboard Automation Factory tile note
  `Draft workflows only → "n8n AI provider · approval-first"`.
- `connectorRegistry.ts`: `content_auto` module description updated to reference
  the n8n AI Provider external module job + approval-first + local fallback.
- Seed/sample automation logs (`automationLogs.ts`, `AutomationLogsTab.tsx`):
  the mock "No real AI API called" sample entries replaced with n8n AI Provider
  approval-first sample entries.

## Mode behavior

- Webhook env (`VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL`) configured → jobs run via
  n8n AI Provider, `generation_mode = external_module`, labelled "n8n AI Provider".
- Webhook env missing → local fallback generator, `generation_mode = mock`,
  labelled "Local fallback mode". Local fallback still works unchanged.
- The legacy ContentGenerationTab in-tab generator remains a local generator; its
  jobs are correctly labelled "Local fallback mode".

## Safety (unchanged)

- No auto-post. No auto-ads. No live Meta/TikTok/Zalo/Canva connectors added.
- OpenAI/AI provider key stays only in n8n Credentials — not moved to
  Core/Vercel/frontend.
- Approval-first preserved: n8n items map to Core `needs_review`; approving in
  Core does not publish, schedule, or launch. No approval logic changed.
- No Supabase schema/RLS changes. No dependencies added. No secrets or `.env`
  values touched. No webhook URL committed.

## Tests

- Extended `contentFactory.test.ts`:
  - n8n path: webhook configured → `mode = n8n`,
    `generation_mode = external_module`, label "n8n AI Provider", provenance
    `generated_by: n8n-ai-provider`, items stay `needs_review` (approval-first).
  - Local fallback label assertion ("Local fallback mode").
- `npm run build`: PASS (0 errors).
- `npm test`: PASS 49/49 (was 47; +2 new).

## Scope guardrails respected

Display text + mode-clarity only. No approval logic, no n8n workflow logic, no
Supabase schema/RLS, no new dependencies, no secrets.
