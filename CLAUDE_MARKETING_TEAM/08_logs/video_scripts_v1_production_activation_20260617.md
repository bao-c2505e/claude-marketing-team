# Video Scripts V1 — Production Activation PASS - 2026-06-17

## Status

PASS. The n8n Video Scripts V1 workflow is **active in production** and Core is
wired to it through the n8n AI Provider `external_module` path. A production test
run created 5 pending video script approval items via the n8n AI Provider, and
nothing was posted or launched.

This supersedes the "Production activation NOT STARTED / Owner-gated" state
recorded in
[video_scripts_v1_implementation_20260617.md](video_scripts_v1_implementation_20260617.md).
Owner-gated activation steps are in
[../07_runbooks/video_scripts_v1_activation_runbook.md](../07_runbooks/video_scripts_v1_activation_runbook.md).

## Commits (context)

- `3cba6a7 feat(core): add Video Scripts V1 external module job`
- `3eae344 fix(core): require workflow_type video_scripts in Video Scripts V1 safety gate`
- `9dc2ef0 docs(log): add Video Scripts V1 implementation PASS runbook + log`

Final Codex review: PASS. `npm run build` PASS. `npm run test` PASS 57/57.

## Production activation — PASS

- n8n workflow imported and toggled **Active** by Owner:
  `n8n-workflows/video_scripts_v1.workflow.json`.
- Vercel **Production** env set by Owner: `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL`
  (real URL stays only in Vercel/n8n — not committed, not documented here).
- Production redeployed.
- Core UI shows **Generate Video Scripts → n8n AI Provider · External module job**.
- **Core → n8n Production Webhook → OpenAI → Normalize → Core: PASS.**
- A production run created **5 pending video script approval items** via the n8n
  AI Provider. Items land in the Approval Board as `needs_review` / pending
  approval.
- Nothing was posted, launched, published, or sent to ads.

## Items created (5)

1. Hook / First 3 Seconds Script
2. Short-Form Video Script (Reels/TikTok, 15–30s)
3. Voiceover / Caption Script
4. Shot List + B-roll Direction
5. Editor Handoff Notes

Each item is text/script/spec only and carries a readable spec block (objective,
target audience, format/duration, script/scene breakdown, voiceover/on-screen
text, shot/B-roll direction, CTA, safety note) plus a metadata footer.

## Metadata confirmed (Core approval detail)

| Field | Value |
|---|---|
| `generated_by` | `n8n-ai-provider` |
| `workflow_type` | `video_scripts` |
| `content_type` | `video_script` |
| `status` | `pending_approval` |
| `owner_approval_required` | `true` |
| `source` | `n8n` |
| `generation_mode` | `external_module` |
| `safety` | `no_auto_post=true; no_auto_ads=true; no_image_generation=true; no_video_generation=true` |

## Safety confirmed

- Text/script/spec only.
- No image generation.
- No video generation.
- No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo connectors.
- No auto-post. No auto-ads.
- Approval-first preserved; items are `needs_review` and approving does not
  publish, schedule, or launch.
- **Approved ≠ Published** remains clear.
- AI provider key stays only in n8n Credentials — never in Core/frontend/docs/
  tests. No real webhook URL committed.
- No Supabase schema / RLS / approval-logic change. No new dependencies. Content
  Factory and Design Factory unaffected.

## Note (non-blocking)

- CTA quality in the generated video scripts can be improved later (prompt-only
  tweak). This does **not** block the Production Activation PASS.

## Scope of this record

Docs/log only. No Core runtime code change, no n8n workflow change, no schema/RLS/
approval change, no dependency change, no secret, no real webhook URL, no
connector change, no auto-post, no auto-ads in this step.
