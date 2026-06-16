# Design Brief Generation V1 - 2026-06-17

## Status

DONE. Approval-first Design Brief Generation V1 added, reusing the existing
n8n AI Provider `external_module` path and the existing job/item/approval model.
Build PASS, test PASS 53/53.

## Goal

From an approved campaign/brief, generate DESIGN BRIEF (text/spec) approval
items via the n8n AI Provider path — never images, never a live connector.

## What it produces

One generation job + 5 design brief approval items per run:

1. Facebook Post Design Brief
2. Story / Reels Cover Design Brief
3. Menu / Promo Visual Design Brief
4. Key Visual Direction
5. Designer Handoff Notes

Each item is a `ContentPlanItem` with `content_type = 'design_brief'`. Structured
design fields (objective, target audience, format/ratio, layout guidance,
copy/text, brand colors/style, image/product requirements, CTA) are rendered
into the item caption as a readable spec block + a metadata footer
(`source`, `generated_by`, `generation_mode`, `status: pending_approval`,
`owner_approval_required`, `safety: no_auto_post / no_auto_ads / no_image_generation`).
Each item auto-submits for approval and lands in the Approval Board as a pending
item (`status: needs_review`).

## How it works (reuse, no schema change)

- New module `src/lib/core/designFactory.ts` mirrors `contentFactory.ts`:
  `getDesignFactoryWebhookUrl()`, `createDesignBriefPayload()`, `runDesignFactory()`.
- Webhook env: `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL` (its own external_module path,
  separate from the Content Factory webhook).
- `App.tsx` `handleDesignFactoryGenerate` reuses the exact Content Factory wiring:
  create job+items, then `submitForApproval` per item. No approval logic changed.
- Reuses `ContentPlanJob` / `ContentPlanItem` / approval model → **no DB schema /
  RLS change**.
- Reuses the mode-aware `GENERATION_MODE_LABEL` labels added in the prior phase,
  so design jobs render "n8n AI Provider" / "Local fallback mode" automatically in
  the shared Generation History.

## Configured vs missing env behavior

| State | Run path | `generation_mode` | UI label / button |
|---|---|---|---|
| `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL` set | POST to n8n Design Factory → AI provider | `external_module` | "n8n AI Provider" chip · button "Generate Design Briefs with n8n AI Provider" |
| Missing | Local fallback sample generator | `mock` | "Local fallback mode" chip · button "Generate Design Briefs with Local fallback" |

Local fallback produces safe sample design briefs clearly labelled Local fallback
mode. Card safety note: "Approval-first: design briefs only. Nothing is posted or
launched. No auto-post, no auto-ads, no image generation."

## n8n side

Added `n8n-workflows/design_factory_v1.workflow.json` (additive, mirrors the
Content Factory workflow): webhook → contract+safety validation (rejects unless
`generate_images === false` and `no_image_generation === true`) → AI Provider
placeholder Code node (TEXT/SPEC only) → structured response. No secret, no real
URL, no image-generation node.

## Safety guarantees

- Text/spec design briefs only. No image generation. No Canva / ComfyUI / Fal.ai.
- No Meta / TikTok / Zalo connectors. No auto-post. No auto-ads.
- Approval-first preserved: items are `needs_review`; approving does not publish,
  schedule, or launch. Existing approval behavior unchanged.
- OpenAI/AI provider key stays only in n8n Credentials — never in Core/frontend/
  docs/tests. No real webhook URL committed.
- No Supabase schema/RLS change. No new dependencies. Content Factory V1 unchanged.

## Tests (`designFactory.test.ts`, +4)

- Payload is approval-first + `generate_images: false` + 5 design_brief_types +
  full safety flags.
- Missing env → local fallback, `generation_mode = mock` ("Local fallback mode"),
  5 `design_brief` items, all `needs_review`, caption carries structured fields +
  safety (`no_auto_post`/`no_auto_ads`/`no_image_generation`) + "no image generation".
- Webhook configured → `mode = n8n`, `generation_mode = external_module`
  ("n8n AI Provider"), provenance `generated_by: n8n-ai-provider`, items stay
  `needs_review` (approval-first).
- Configured webhook returning no items → fails safely (throws, no items created).

## Validation

- `npm run build`: PASS (0 errors).
- `npm test`: PASS 53/53 (was 49; +4 design factory tests).
