# Canva Connector Sandbox — Foundation (2026-06-22)

## Scope
Add a **sandbox-only** Canva Connector foundation. No real Canva API, no token,
no real design, no publish, no auto-post, no auto-ads, no image generation.
Sandbox output flows into the existing approval queue (approval-first).

## Files changed
- **NEW** `src/lib/core/connectors/canvaSandboxConnector.ts`
  - Pure, offline adapter. `runCanvaSandboxConnector(input)` builds 5 MOCK
    preview specs (facebook_post / story / menu_a5 / tiktok_cover / zalo_post),
    each with `design_title`, `design_type`, `brand_name`, `campaign_name`,
    `format`, `dimensions`, `sandbox_design_ref` (`sandbox-canva-*`),
    `mock_canva_design_id` (`MOCK-CANVA-*`), `preview_status:
    sandbox_preview_only`, and immutable `safety_flags`
    (`no_live_canva_api`, `no_publish`, `approval_required`,
    `no_real_design_created`, `no_image_generation`, `no_secrets`).
  - Maps previews to `ContentPlanItem` (`content_type =
    'canva_sandbox_preview'`, `status = 'needs_review'`) — no DB schema change.
  - `buildCanvaSandboxAuditLog()` produces an automation-log entry for the
    audit trail. NO `fetch`, NO env read, NO real Canva URL.
- **NEW** `src/lib/core/connectors/canvaSandboxConnector.test.ts` — 7 tests.
- `src/App.tsx` — `handleCanvaSandboxGenerate`: runs the connector, prepends
  job/items, auto-submits each item for approval, and records an audit log via
  `createAutomationLog`. Wired as `onGenerateCanvaSandbox` prop.
- `src/components/core/AutomationFactoryTab.tsx` — new "Canva Sandbox Preview"
  workflow card + `CanvaSandboxControls` surfacing the required safety copy.

## Safety copy surfaced (UI + caption + log)
"Canva Sandbox Preview" · "No Canva design was created" · "Nothing was
published" · "Approval required before any real connector action".

## Output status model
Sandbox alone reaches at most the approval queue (`needs_review`). Owner approve
→ `approved` (internal use only). No `published` / `launched` path added.

## Validation
- `npm run build` → PASS (tsc + vite, built in ~7s).
- `npm test` → PASS 142/142 (was 135; +7 new Canva sandbox tests).
- No `lint` script exists in package.json (only dev/build/preview/test).
- Contamination sweep (forme/sofa/nội thất/furniture) on touched files → none.
- Secret / real-URL sweep on connector → none (only negative test assertions).

## Safety assessment (CLAUDE.md §4)
Approval-first ✓ · Approved ≠ Published ✓ · No auto-post ✓ · No auto-ads ✓ ·
No live connector / no real Canva API ✓ · No image generation ✓ · No fake
metrics ✓ · No secrets / no real webhook ✓ · Sandbox/dry-run first ✓ ·
All connector actions logged ✓.

## TODOs / future (still approval-gated, out of scope here)
- Real Canva Connect requires OAuth + token in n8n Credentials / env (never
  repo), staged via `07_runbooks/connector_activation_safety_runbook.md`.
- A future "export after approval" step stays human-confirmed and flag-gated.
