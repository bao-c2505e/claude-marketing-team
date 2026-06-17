# Report Draft V1 — Production Activation PASS - 2026-06-17

## Status

PASS. The n8n Report Draft V1 workflow is **active in production** and Core is
wired to it through the n8n AI Provider `external_module` path. A production test
run created 5 pending report draft approval items via the n8n AI Provider, and
nothing was posted, launched, published, scheduled, sent to ads, or spent — and
no live analytics data was pulled.

This supersedes the "Production activation NOT STARTED / Owner-gated" state
recorded in
[report_draft_v1_implementation_20260617.md](report_draft_v1_implementation_20260617.md).
Owner-gated activation steps are in
[../07_runbooks/report_draft_v1_activation_runbook.md](../07_runbooks/report_draft_v1_activation_runbook.md).

## Commit (context)

- `bf414f6 feat(core): add Report Draft V1 as external module job`
- `731c6fb docs(log): add Report Draft V1 implementation PASS runbook + log`

Final Codex review: PASS. Implementation log + activation runbook already
recorded.

## Production activation — PASS

- n8n workflow imported and toggled **Active** by Owner:
  `n8n-workflows/report_draft_v1.workflow.json`.
- Vercel **Production** env set by Owner: `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL`
  (real URL stays only in Vercel/n8n — not committed, not documented here).
- Production redeployed.
- Core UI shows **Generate Report Draft → n8n AI Provider · External module job**.
- **Core → n8n Production Webhook → OpenAI → Normalize → Core: PASS.**
- A production run created **5 pending report draft approval items** via the n8n AI
  Provider. Items land in the Approval Board as `needs_review` / pending approval.
- Nothing was posted, launched, published, scheduled, sent to ads, or spent.
- No live analytics data was pulled.

## Items created (5)

1. Campaign Status Summary Draft
2. Performance Insight Notes
3. Content & Creative Review Notes
4. Risks, Learnings & Next Actions
5. Owner / Client Report Handoff Draft

Each item is a report draft note only and carries a readable spec block
(objective, focus, period, data basis, summary draft, key points/insights, next
actions) plus a metadata footer. **These are report draft notes only — no live
analytics is pulled and no real metric is claimed unless owner-provided.**

## Metadata confirmed (Core approval detail)

| Field | Value |
|---|---|
| `generated_by` | `n8n-ai-provider` |
| `workflow_type` | `report_draft` |
| `content_type` | `report_draft` |
| `status` | `pending_approval` |
| `owner_approval_required` | `true` |
| `source` | `n8n` |
| `generation_mode` | `external_module` |
| `safety` | `no_auto_post=true; no_auto_ads=true; no_platform_launch=true; no_image_generation=true; no_video_generation=true; no_live_connectors=true; no_live_analytics_pull=true; no_unverified_metrics=true` |

## Safety confirmed

- Report draft notes only.
- No live analytics pull.
- No real metrics unless owner-provided.
- No unverified metrics.
- No image generation.
- No video generation.
- No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo / Google Ads / GA4 / CRM
  connectors.
- No auto-post. No auto-ads. No platform launch.
- Approval-first preserved; items are `needs_review` and approving does not
  publish, schedule, launch, spend, or pull data.
- **Approved ≠ Published** remains clear.
- AI provider key stays only in n8n Credentials — never in Core/frontend/docs/
  tests. No real webhook URL committed.
- No Supabase schema / RLS / approval-logic change. No new dependencies. Content
  Factory, Design Factory, Video Scripts, and Ads Pack unaffected.

## Note (non-blocking)

- Report quality in the generated drafts can be improved later (prompt-only
  tweak). This does **not** block the Production Activation PASS.

## Scope of this record

Docs/log only. No Core runtime code change, no n8n workflow change, no schema/RLS/
approval change, no dependency change, no secret, no real webhook URL, no
connector change, no auto-post, no auto-ads, no platform launch, no live analytics
pull in this step.
