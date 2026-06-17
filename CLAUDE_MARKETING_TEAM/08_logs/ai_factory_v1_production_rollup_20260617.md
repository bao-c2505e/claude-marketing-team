# AI Factory V1 — Production Modules PASS (Rollup / Acceptance Summary) - 2026-06-17

## Milestone

**AI Factory V1 Production Modules PASS.** All 5 n8n AI Provider `external_module`
jobs are **active in production**. Each module runs Core → n8n Production Webhook →
OpenAI → Normalize → Core and creates **pending approval items only**. Nothing is
posted, launched, published, scheduled, sent to ads, or spent; no live analytics is
pulled.

## Summary table

| Module | Env var | n8n workflow file | Expected output | Output type | Production | Safety |
|---|---|---|---|---|---|---|
| Content Factory V1 | `VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL` | n8n workflow `Content Factory V1 - Content Pack` | 7-day content pack | Text content plan | PASS | Approval-first; no auto-post |
| Design Factory V1 | `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL` | `n8n-workflows/design_factory_v1.workflow.json` | 5 items | Design brief — text/spec only, no image gen | PASS (incl. output quality fix) | Approval-first; no image gen |
| Video Scripts V1 | `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL` | `n8n-workflows/video_scripts_v1.workflow.json` | 5 items | Video script — text/script/spec only, no image/video gen | PASS | Approval-first; no image/video gen |
| Ads Pack Draft V1 | `VITE_N8N_ADS_PACK_WEBHOOK_URL` | `n8n-workflows/ads_pack_v1.workflow.json` | 5 items | Ads draft — draft/spec only | PASS | Approval-first; no ad create/schedule/launch/spend |
| Report Draft V1 | `VITE_N8N_REPORT_DRAFT_WEBHOOK_URL` | `n8n-workflows/report_draft_v1.workflow.json` | 5 items | Report draft — notes only | PASS | Approval-first; no live analytics, no unverified metrics |

(Real webhook URLs live only in Vercel/n8n — never committed or documented here.)

## Modules

### 1. Content Factory V1
- Core → n8n Production Webhook → OpenAI → Normalize → Core: **PASS**.
- 7-day content pack via n8n AI Provider: **PASS**.
- Pending approval items only.

### 2. Design Factory V1
- Production activation: **PASS**. Output quality fix: **PASS**.
- 5 design brief approval items created via n8n AI Provider.
- Text / spec only — **no image generation**.

### 3. Video Scripts V1
- Production activation: **PASS**.
- 5 video script approval items created via n8n AI Provider.
- Text / script / spec only — **no image or video generation**.

### 4. Ads Pack Draft V1
- Production activation: **PASS**.
- 5 ads draft approval items created via n8n AI Provider.
- Draft / spec only — **no ads created, scheduled, launched, sent, or spent**.

### 5. Report Draft V1
- Production activation: **PASS**.
- 5 report draft approval items created via n8n AI Provider.
- **No live analytics pull. No unverified metrics.**
- Latest commit: `24b61fb docs(log): record Report Draft V1 production activation PASS`.

## Confirmed production behavior

- Core UI shows **n8n AI Provider · External module job** for all 5 activated modules.
- **Core → n8n Production Webhook → OpenAI → Normalize → Core** works for every module.
- Each module creates **pending approval items only** (`needs_review` /
  `pending_approval`).
- **Owner approval remains required** (`owner_approval_required: true`).
- **Approved ≠ Published** remains clear — approving does not publish, schedule,
  launch, spend, or pull data.

## Global safety

- No auto-post.
- No auto-ads.
- No live Meta / TikTok / Zalo / Google Ads / GA4 / CRM / Canva / ComfyUI / Fal.ai
  connectors.
- No image / video generation unless explicitly implemented in a future
  Owner-gated phase.
- No live analytics pull.
- No unverified metrics.
- No secrets or real webhook URLs committed.
- OpenAI API key stays **only in n8n Credentials** — never in Core / frontend /
  docs / tests.

## Known non-blocking quality notes

- CTA / content quality can be improved later for Design / Video / Ads (prompt-only
  tweaks).
- Report quality can be improved later (prompt-only tweak).
- Old local fallback / mock items may remain in demo approvals but are **superseded
  by n8n-generated items**.

None of these block the AI Factory V1 Production Modules PASS.

## Recommended next phases (all Owner-gated where noted)

- **A.** Premium dashboard / UI polish.
- **B.** Output quality tuning prompts for FnB.
- **C.** Approval queue cleanup / demo data management.
- **D.** Manual export / client presentation polish.
- **E.** Future connector planning — **remains Owner-gated**.

## Scope of this record

Docs/log only. No Core runtime code change, no n8n workflow change, no schema / RLS /
approval change, no dependency change, no secret, no real webhook URL, no connector
change, no auto-post, no auto-ads in this step.
