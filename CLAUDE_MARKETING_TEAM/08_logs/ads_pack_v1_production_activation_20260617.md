# Ads Pack Draft V1 — Production Activation PASS - 2026-06-17

## Status

PASS. The n8n Ads Pack Draft V1 workflow is **active in production** and Core is
wired to it through the n8n AI Provider `external_module` path. A production test
run created 5 pending ads draft approval items via the n8n AI Provider, and
nothing was posted, launched, published, scheduled, sent to ads, or spent.

This supersedes the "Production activation NOT STARTED / Owner-gated" state
recorded in
[ads_pack_v1_implementation_20260617.md](ads_pack_v1_implementation_20260617.md).
Owner-gated activation steps are in
[../07_runbooks/ads_pack_v1_activation_runbook.md](../07_runbooks/ads_pack_v1_activation_runbook.md).

## Commit (context)

- `5f839cc feat(core): add Ads Pack Draft V1 as external module job`

Final Codex review: PASS. `npm run build` PASS. `npm run test` PASS 61/61.
Implementation log + activation runbook already recorded.

## Production activation — PASS

- n8n workflow imported and toggled **Active** by Owner:
  `n8n-workflows/ads_pack_v1.workflow.json`.
- Vercel **Production** env set by Owner: `VITE_N8N_ADS_PACK_WEBHOOK_URL`
  (real URL stays only in Vercel/n8n — not committed, not documented here).
- Production redeployed.
- Core UI shows **Generate Ads Pack → n8n AI Provider · External module job**.
- **Core → n8n Production Webhook → OpenAI → Normalize → Core: PASS.**
- A production run created **5 pending ads draft approval items** via the n8n AI
  Provider. Items land in the Approval Board as `needs_review` / pending approval.
- Nothing was posted, launched, published, scheduled, sent to ads, or spent.

## Items created (5)

1. Campaign Angle & Offer Draft
2. Ad Copy Variants Draft
3. Audience & Targeting Notes
4. Budget & Testing Plan Draft
5. Ads Manager Handoff Checklist

Each item is strategy/spec/draft only and carries a readable spec block
(objective, focus, target audience notes, draft, key points/variants,
budget/testing note, CTA) plus a metadata footer. **These are strategy/draft notes
only — no ads are created, launched, scheduled, or spent.**

## Metadata confirmed (Core approval detail)

| Field | Value |
|---|---|
| `generated_by` | `n8n-ai-provider` |
| `workflow_type` | `ads_pack` |
| `content_type` | `ads_draft` |
| `status` | `pending_approval` |
| `owner_approval_required` | `true` |
| `source` | `n8n` |
| `generation_mode` | `external_module` |
| `safety` | `no_auto_post=true; no_auto_ads=true; no_platform_launch=true; no_image_generation=true; no_video_generation=true; no_live_connectors=true` |

## Safety confirmed

- Strategy / spec / draft only.
- No ad creation.
- No campaign / ad-set / ad / audience / budget / pixel creation.
- No schedule.
- No launch.
- No spend.
- No image generation.
- No video generation.
- No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo / Google Ads connectors.
- No auto-post. No auto-ads. No platform launch.
- Approval-first preserved; items are `needs_review` and approving does not create,
  publish, schedule, launch, or spend.
- **Approved ≠ Published** remains clear.
- AI provider key stays only in n8n Credentials — never in Core/frontend/docs/
  tests. No real webhook URL committed.
- No Supabase schema / RLS / approval-logic change. No new dependencies. Content
  Factory, Design Factory, and Video Scripts unaffected.

## Note (non-blocking)

- CTA / content quality in the generated ads drafts can be improved later
  (prompt-only tweak). This does **not** block the Production Activation PASS.

## Scope of this record

Docs/log only. No Core runtime code change, no n8n workflow change, no schema/RLS/
approval change, no dependency change, no secret, no real webhook URL, no
connector change, no auto-post, no auto-ads, no platform launch in this step.
