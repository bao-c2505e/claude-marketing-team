# Ads Pack Draft V1 — Implementation PASS - 2026-06-17

## Status

Implementation PASS. **Production activation NOT STARTED / Owner-gated.**
Ads Pack Draft V1 was added on the Core side as the next external module job,
reusing the existing n8n AI Provider `external_module` code path and the existing
job/item/approval model (same pattern as Content Factory, Design Factory, and
Video Scripts). Final Codex review: PASS. Build PASS, test PASS 61/61,
`git diff --check` clean, `git status` clean.

Real n8n activation is **not** live yet:

- The n8n Ads Pack workflow (`n8n-workflows/ads_pack_v1.workflow.json`) is **not**
  imported/activated yet.
- `VITE_N8N_ADS_PACK_WEBHOOK_URL` is **not** set in Vercel yet.
- Current safe behavior: **local fallback** when the env is missing (clearly
  labelled "Local fallback mode · External module job"). Nothing runs in
  production via n8n yet.

Owner-gated activation steps are documented in
[../07_runbooks/ads_pack_v1_activation_runbook.md](../07_runbooks/ads_pack_v1_activation_runbook.md).

## Commit

- `5f839cc feat(core): add Ads Pack Draft V1 as external module job`

## Implementation summary

- **Core UI** (Automation Factory): new **Generate Ads Pack** external module job.
  Mode-aware:
  - env configured → "n8n AI Provider · External module job" / button "Generate
    Ads Pack with n8n AI Provider".
  - env missing → "Local fallback mode · External module job" / button "Generate
    Ads Pack with Local fallback".
- **Env var expected later:** `VITE_N8N_ADS_PACK_WEBHOOK_URL` (its own
  external_module path, separate from Content / Design / Video factories).
- **Production activation remains Owner-gated** — not started.

## Expected 5 output items (per run)

1. Campaign Angle & Offer Draft
2. Ad Copy Variants Draft
3. Audience & Targeting Notes
4. Budget & Testing Plan Draft
5. Ads Manager Handoff Checklist

Each is a `ContentPlanItem` with `content_type = 'ads_draft'`. Structured ads
fields (objective, focus, target audience notes, draft, key points/variants,
budget/testing note, CTA) are rendered into the item caption as a readable spec
block + a metadata footer. Each item auto-submits for approval and lands in the
Approval Board as a pending item (`status: needs_review`). **These are
strategy/draft notes only — no ads are created, launched, scheduled, or spent.**

## Metadata (per item + envelope)

| Field | Value |
|---|---|
| `source` | `n8n` |
| `generated_by` | `n8n-ai-provider` |
| `generation_mode` | `external_module` |
| `workflow_type` | `ads_pack` |
| `content_type` | `ads_draft` |
| `status` | `needs_review` / `pending_approval` |
| `owner_approval_required` | `true` |
| `no_auto_post` | `true` |
| `no_auto_ads` | `true` |
| `no_image_generation` | `true` |
| `no_video_generation` | `true` |
| `no_live_connectors` | `true` |
| `no_platform_launch` | `true` |

## How it works (reuse, no schema change)

- New module `src/lib/core/adsFactory.ts` mirrors `videoFactory.ts`:
  `getAdsFactoryWebhookUrl()`, `createAdsPackPayload()`, `runAdsFactory()`.
- Webhook env: `VITE_N8N_ADS_PACK_WEBHOOK_URL`.
- `App.tsx` `handleAdsFactoryGenerate` reuses the exact Content/Design/Video
  Factory wiring: create job+items, then `submitForApproval` per item. No approval
  logic changed.
- Reuses `ContentPlanJob` / `ContentPlanItem` / approval model → **no DB schema /
  RLS change**.
- Reuses the mode-aware generation-mode labels, so ads jobs render "n8n AI
  Provider" / "Local fallback mode" automatically in the shared Generation History.
- `workflow_type` / `content_type` are forced to `ads_pack` / `ads_draft` in Core,
  so a nonconforming AI response can never mislabel them.

## n8n side

`n8n-workflows/ads_pack_v1.workflow.json` (additive, mirrors Video Scripts):
webhook `ads-pack-v1/ads-pack` → contract+safety validation → if → AI Provider
placeholder Code node (STRATEGY/DRAFT notes only) → structured response. The
safety gate requires exactly `workflow_type === 'ads_pack'` plus
`generate_images=false`, `generate_videos=false`, `create_ads=false`,
`launch_ads=false`, and all `no_*` flags true (including `no_platform_launch`). No
secret, no real URL, no image/video-generation node, no campaign/ad-set/ad/
audience/budget/pixel/post/scheduled-launch node, no live connector node.

## Safety guarantees

- Strategy / spec / draft notes only. **No ad creation. No campaign / ad-set / ad /
  audience / budget / pixel / post / scheduled-launch creation.**
- No image generation. No video generation.
- No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo / Google Ads connectors.
- No auto-post. No auto-ads. No platform launch.
- Approval-first preserved: items are `needs_review`; approving does not create,
  publish, schedule, launch, or spend. **Approved ≠ Published** remains clear.
- OpenAI/AI provider key stays only in n8n Credentials — never in
  Core/frontend/docs/tests. No real webhook URL committed.
- No Supabase schema/RLS change. No new dependencies. Content Factory, Design
  Factory, and Video Scripts behavior preserved.

## Tests (`adsFactory.test.ts`, +4)

- Payload is approval-first + `generate_images: false` + `generate_videos: false`
  + `create_ads: false` + `launch_ads: false` + 5 `ads_pack_types` + full safety
  flags (incl. `no_platform_launch`).
- Missing env → local fallback, `generation_mode = mock` ("Local fallback mode"),
  5 `ads_draft` items, all `needs_review`, caption carries structured fields +
  safety (`no_auto_post`/`no_auto_ads`/`no_platform_launch`/`no_image_generation`/
  `no_video_generation`) and "no ads created, launched, scheduled, or spent".
- Webhook configured → `mode = n8n`, `generation_mode = external_module`
  ("n8n AI Provider"), provenance `generated_by: n8n-ai-provider`,
  `workflow_type: ads_pack` forced, items stay `needs_review`.
- Configured webhook returning no items → fails safely (throws, no items created).

## Validation

- `npm run build`: PASS (0 errors).
- `npm run test`: PASS 61/61 across 6 files (was 57; +4 ads factory tests).
- `git diff --check`: clean. `git status`: clean. Final Codex review: PASS.
- No schema/RLS/approval-pipeline changes. No secrets or real webhook URLs. No
  connector or generation nodes. Content Factory, Design Factory, and Video Scripts
  behavior preserved.

## Scope of this record

Docs/log only. No Core runtime code change, no n8n workflow change, no schema/RLS/
approval change, no dependency change, no secret, no real webhook URL, no
connector, no auto-post, no auto-ads, no platform launch in this step.
