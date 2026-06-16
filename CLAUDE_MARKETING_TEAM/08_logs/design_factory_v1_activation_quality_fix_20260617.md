# Design Factory V1 — Production Activation + Output Quality Fix PASS - 2026-06-17

## Status

PASS. The n8n Design Factory V1 workflow is **active in production** and Core is
wired to it through the n8n AI Provider `external_module` path. The follow-up
output quality / metadata consistency fix is also PASS and live.

This supersedes the "real n8n activation NOT STARTED / Owner-gated" state recorded
in [design_brief_generation_v1_20260617.md](design_brief_generation_v1_20260617.md)
(Core-side implementation log). Both the activation and the quality fix are now
verified on production Core.

## Latest commit

`b1a5528 feat(core): improve design brief quality and metadata consistency`

Confirmed at record time: `git status` clean, `main` up to date with `origin/main`,
`npm run build` PASS, `npm run test` PASS 53/53.

## Production activation — PASS

- n8n workflow imported and toggled **Active**:
  `n8n-workflows/design_factory_v1.workflow.json`.
- Production webhook connected through the Vercel env
  `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL` (real URL stays only in Vercel/n8n — not
  committed, not documented here).
- Core UI shows **Generate Design Briefs → n8n AI Provider - External module job**.
- A run creates **5 pending design brief approval items** via the n8n AI Provider.
  Items land in the Approval Board as `needs_review` / pending approval.
- Nothing was posted, launched, published, or sent to ads.

## Output quality fix — PASS

Re-imported the updated `design_factory_v1.workflow.json` into n8n and redeployed
Core on Vercel, then retested the production Core UI. Design brief titles are now
specific and useful:

1. Facebook Post Design Brief — Stop the scroll and drive feed engagement
2. Story / Reels Cover Design Brief — High-contrast cover that earns the tap
3. Menu / Promo Visual Design Brief — Communicate the offer / menu clearly
4. Key Visual Direction — Define the campaign visual system
5. Designer Handoff Notes — Hand the spec to the designer cleanly

Each detail page shows useful brief content: target audience, format/ratio, layout
guidance, copy/text to include, brand colors/style direction, image/product
requirements, CTA, and the safety note.

## Metadata confirmed (per item + envelope)

| Field | Value |
|---|---|
| `workflow_type` | `design_factory` |
| `content_type` | `design_brief` |
| `status` | `pending_approval` |
| `owner_approval_required` | `true` |
| `source` | `n8n` |
| `generated_by` | `n8n-ai-provider` |
| `generation_mode` | `external_module` |
| `no_auto_post` | `true` |
| `no_auto_ads` | `true` |
| `no_image_generation` | `true` |

## Safety preserved

- Text/spec only. No image generation.
- No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo connectors.
- No auto-post. No auto-ads.
- Approval-first preserved; **Approved ≠ Published** remains clear (approving an
  item does not publish, schedule, or launch it).
- AI provider key stays only in n8n Credentials — never in Core/frontend/docs/tests.
  No real webhook URL committed.
- No Supabase schema / RLS / approval-logic change. No new dependencies.

## Scope of this record

Docs/log only. No Core runtime code change, no n8n workflow change, no schema/RLS/
approval change, no dependency change, no secret, no connector, no auto-post,
no auto-ads in this step.
