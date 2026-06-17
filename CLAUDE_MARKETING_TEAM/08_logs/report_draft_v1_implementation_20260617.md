# Report Draft V1 — Implementation PASS - 2026-06-17

## Status

Implementation PASS. **Production activation NOT STARTED / Owner-gated.**
Report Draft V1 was added on the Core side as the next external module job,
reusing the existing n8n AI Provider `external_module` code path and the existing
job/item/approval model (same pattern as Content Factory, Design Factory, Video
Scripts, and Ads Pack). Final Codex review: PASS. Build PASS, test PASS 65/65
across 7 files, `git diff --check` clean, `git status` clean.

Real n8n activation is **not** live yet:

- The n8n Report Draft workflow (`n8n-workflows/report_draft_v1.workflow.json`) is
  **not** imported/activated yet.
- `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL` is **not** set in Vercel yet.
- Current safe behavior: **local fallback** when the env is missing (clearly
  labelled "Local fallback mode · External module job"). Nothing runs in
  production via n8n yet.

Owner-gated activation steps are documented in
[../07_runbooks/report_draft_v1_activation_runbook.md](../07_runbooks/report_draft_v1_activation_runbook.md).

## Commit

- `bf414f6 feat(core): add Report Draft V1 as external module job`

## Implementation summary

- **Core UI** (Automation Factory): new **Generate Report Draft** external module
  job. Mode-aware:
  - env configured → "n8n AI Provider · External module job" / button "Generate
    Report Draft with n8n AI Provider".
  - env missing → "Local fallback mode · External module job" / button "Generate
    Report Draft with Local fallback".
- **Env var expected later:** `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL` (its own
  external_module path, separate from Content / Design / Video / Ads factories).
- **Production activation remains Owner-gated** — not started.

## Expected 5 output items (per run)

1. Campaign Status Summary Draft
2. Performance Insight Notes
3. Content & Creative Review Notes
4. Risks, Learnings & Next Actions
5. Owner / Client Report Handoff Draft

Each is a `ContentPlanItem` with `content_type = 'report_draft'`. Structured report
fields (objective, focus, period, **data basis**, summary draft, key points/
insights, next actions) are rendered into the item caption as a readable spec block
+ a metadata footer. Each item auto-submits for approval and lands in the Approval
Board as a pending item (`status: needs_review`). **These are report draft notes
only — no live analytics is pulled and no real metric is claimed unless provided
in the Core request.**

## Metadata (per item + envelope)

| Field | Value |
|---|---|
| `source` | `n8n` |
| `generated_by` | `n8n-ai-provider` |
| `generation_mode` | `external_module` |
| `workflow_type` | `report_draft` |
| `content_type` | `report_draft` |
| `status` | `needs_review` / `pending_approval` |
| `owner_approval_required` | `true` |
| `no_auto_post` | `true` |
| `no_auto_ads` | `true` |
| `no_image_generation` | `true` |
| `no_video_generation` | `true` |
| `no_live_connectors` | `true` |
| `no_platform_launch` | `true` |
| `no_live_analytics_pull` | `true` |
| `no_unverified_metrics` | `true` |

## How it works (reuse, no schema change)

- New module `src/lib/core/reportFactory.ts` mirrors `adsFactory.ts`:
  `getReportFactoryWebhookUrl()`, `createReportDraftPayload()`, `runReportFactory()`.
- Webhook env: `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL`.
- `App.tsx` `handleReportFactoryGenerate` reuses the exact Content/Design/Video/Ads
  Factory wiring: create job+items, then `submitForApproval` per item. No approval
  logic changed.
- Reuses `ContentPlanJob` / `ContentPlanItem` / approval model → **no DB schema /
  RLS change**.
- Reuses the mode-aware generation-mode labels, so report jobs render "n8n AI
  Provider" / "Local fallback mode" automatically in the shared Generation History.
- `workflow_type` / `content_type` are forced to `report_draft` / `report_draft`
  in Core, so a nonconforming AI response can never mislabel them.
- **No-data integrity:** each item's `data_basis` is force-filled to state that no
  live analytics were pulled if the source omits it, so a report draft can never
  imply real platform data. Local fallback explicitly labels its figures as
  simulated/demo for structure only.

## n8n side

`n8n-workflows/report_draft_v1.workflow.json` (additive, mirrors Ads Pack):
webhook `report-draft-v1/report-draft` → contract+safety validation → if → AI
Provider placeholder Code node (REPORT DRAFT NOTES only) → structured response. The
safety gate requires exactly `workflow_type === 'report_draft'` plus
`generate_images=false`, `generate_videos=false`, `pull_live_analytics=false`,
`use_unverified_metrics=false`, and all `no_*` flags true (including
`no_live_analytics_pull` and `no_unverified_metrics`). No secret, no real URL, no
image/video-generation node, no analytics-pull node, no live connector node, no
publishing/posting/ad-launch/spend node.

## Safety guarantees

- Report draft notes only. No live analytics pull. No real metrics unless
  owner-provided. Missing/non-live data is labelled assumption / owner-provided /
  simulated-demo — never a fabricated number.
- No image generation. No video generation.
- No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo / Google Ads / GA4 / CRM
  connectors.
- No auto-post. No auto-ads. No platform launch.
- Approval-first preserved: items are `needs_review`; approving does not publish,
  schedule, launch, spend, or pull data. **Approved ≠ Published** remains clear.
- OpenAI/AI provider key stays only in n8n Credentials — never in
  Core/frontend/docs/tests. No real webhook URL committed.
- No Supabase schema/RLS change. No new dependencies. Content Factory, Design
  Factory, Video Scripts, and Ads Pack behavior preserved.

## Tests (`reportFactory.test.ts`, +4)

- Payload is approval-first + `generate_images: false` + `generate_videos: false`
  + `pull_live_analytics: false` + `use_unverified_metrics: false` + 5
  `report_draft_types` + full safety flags (incl. `no_live_analytics_pull` and
  `no_unverified_metrics`).
- Missing env → local fallback, `generation_mode = mock` ("Local fallback mode"),
  5 `report_draft` items, all `needs_review`, caption carries structured fields +
  safety (incl. `no_live_analytics_pull=true`/`no_unverified_metrics=true`) and a
  "no live analytics" data basis on every item.
- Webhook configured → `mode = n8n`, `generation_mode = external_module`
  ("n8n AI Provider"), provenance `generated_by: n8n-ai-provider`,
  `workflow_type: report_draft` forced, items stay `needs_review`, and the
  no-live-analytics data basis is still present even when the AI omits it.
- Configured webhook returning no items → fails safely (throws, no items created).

## Validation evidence

- Final Codex review: PASS.
- `npm run build`: PASS (0 errors).
- `npm run test`: PASS 65/65 across 7 files (was 61; +4 report factory tests).
- `git diff --check`: clean. `git status`: clean.
- No schema/RLS/approval-pipeline changes. No secrets or real webhook URLs. No
  connector or generation nodes. Content Factory, Design Factory, Video Scripts,
  and Ads Pack behavior preserved.

## Scope of this record

Docs/log only. No Core runtime code change, no n8n workflow change, no schema/RLS/
approval change, no dependency change, no secret, no real webhook URL, no
connector, no auto-post, no auto-ads, no platform launch, no live analytics pull in
this step.
