# Video Scripts V1 — Implementation PASS - 2026-06-17

## Status

Implementation PASS. **Production activation NOT STARTED / Owner-gated.**
Video Scripts V1 was added on the Core side as the next external module job,
reusing the existing n8n AI Provider `external_module` code path and the existing
job/item/approval model (same pattern as Content Factory and Design Factory).
Final Codex review: PASS. Build PASS, test PASS 57/57, `git diff --check` clean,
`git status` clean.

Real n8n activation is **not** live yet:

- The n8n Video Scripts workflow (`n8n-workflows/video_scripts_v1.workflow.json`)
  is **not** imported/activated yet.
- `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL` is **not** set in Vercel yet.
- Current safe behavior: **local fallback** when the env is missing (clearly
  labelled "Local fallback mode · External module job"). Nothing runs in
  production via n8n yet.

Owner-gated activation steps are documented in
[../07_runbooks/video_scripts_v1_activation_runbook.md](../07_runbooks/video_scripts_v1_activation_runbook.md).

## Commits

- `3cba6a7 feat(core): add Video Scripts V1 external module job`
- `3eae344 fix(core): require workflow_type video_scripts in Video Scripts V1 safety gate`

## Implementation summary

- **Core UI** (Automation Factory): new **Generate Video Scripts** external module
  job. Mode-aware:
  - env configured → "n8n AI Provider · External module job" / button "Generate
    Video Scripts with n8n AI Provider".
  - env missing → "Local fallback mode · External module job" / button "Generate
    Video Scripts with Local fallback".
- **Env var expected later:** `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL` (its own
  external_module path, separate from Content Factory and Design Factory).
- **Production activation remains Owner-gated** — not started.

## Expected 5 output items (per run)

1. Hook / First 3 Seconds Script
2. Short-Form Video Script (Reels/TikTok, 15–30s)
3. Voiceover / Caption Script
4. Shot List + B-roll Direction
5. Editor Handoff Notes

Each is a `ContentPlanItem` with `content_type = 'video_script'`. Structured
script fields (objective, target audience, format/duration, script/scene
breakdown, voiceover/on-screen text, shot/B-roll direction, CTA) are rendered into
the item caption as a readable spec block + a metadata footer. Each item
auto-submits for approval and lands in the Approval Board as a pending item
(`status: needs_review`).

## Metadata (per item + envelope)

| Field | Value |
|---|---|
| `source` | `n8n` |
| `generated_by` | `n8n-ai-provider` |
| `generation_mode` | `external_module` |
| `workflow_type` | `video_scripts` |
| `content_type` | `video_script` |
| `status` | `needs_review` / `pending_approval` |
| `owner_approval_required` | `true` |
| `no_auto_post` | `true` |
| `no_auto_ads` | `true` |
| `no_image_generation` | `true` |
| `no_video_generation` | `true` |

## How it works (reuse, no schema change)

- New module `src/lib/core/videoFactory.ts` mirrors `designFactory.ts`:
  `getVideoFactoryWebhookUrl()`, `createVideoScriptPayload()`, `runVideoFactory()`.
- Webhook env: `VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL`.
- `App.tsx` `handleVideoFactoryGenerate` reuses the exact Content/Design Factory
  wiring: create job+items, then `submitForApproval` per item. No approval logic
  changed.
- Reuses `ContentPlanJob` / `ContentPlanItem` / approval model → **no DB schema /
  RLS change**.
- Reuses the mode-aware generation-mode labels, so video jobs render "n8n AI
  Provider" / "Local fallback mode" automatically in the shared Generation History.
- `workflow_type` / `content_type` are forced to `video_scripts` / `video_script`
  in Core, so a nonconforming AI response can never mislabel them.

## n8n side

`n8n-workflows/video_scripts_v1.workflow.json` (additive, mirrors Design Factory):
webhook `video-scripts-v1/video-scripts` → contract+safety validation → if →
AI Provider placeholder Code node (TEXT/SCRIPT only) → structured response. The
safety gate requires exactly `workflow_type === 'video_scripts'` plus
`generate_images=false`, `generate_videos=false`, and all `no_*` flags true
(Codex fix `3eae344` removed the earlier `video_script` fallback). No secret, no
real URL, no image/video-generation node, no live connector node.

## Safety guarantees

- Text/script/spec only. No image generation. No video generation.
- No Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo connectors.
- No auto-post. No auto-ads.
- Approval-first preserved: items are `needs_review`; approving does not publish,
  schedule, or launch. **Approved ≠ Published** remains clear.
- OpenAI/AI provider key stays only in n8n Credentials — never in
  Core/frontend/docs/tests. No real webhook URL committed.
- No Supabase schema/RLS change. No new dependencies. Content Factory and Design
  Factory unchanged.

## Tests (`videoFactory.test.ts`, +4)

- Payload is approval-first + `generate_images: false` + `generate_videos: false`
  + 5 video_script_types + full safety flags (incl. `no_video_generation`).
- Missing env → local fallback, `generation_mode = mock` ("Local fallback mode"),
  5 `video_script` items, all `needs_review`, caption carries structured fields +
  safety (`no_auto_post`/`no_auto_ads`/`no_image_generation`/`no_video_generation`).
- Webhook configured → `mode = n8n`, `generation_mode = external_module`
  ("n8n AI Provider"), provenance `generated_by: n8n-ai-provider`,
  `workflow_type: video_scripts` forced, items stay `needs_review`.
- Configured webhook returning no items → fails safely (throws, no items created).

## Validation

- `npm run build`: PASS (0 errors).
- `npm run test`: PASS 57/57 (was 53; +4 video factory tests).
- `git diff --check`: clean. `git status`: clean. Final Codex review: PASS.

## Scope of this record

Docs/log only. No Core runtime code change, no n8n workflow change, no schema/RLS/
approval change, no dependency change, no secret, no real webhook URL, no
connector, no auto-post, no auto-ads in this step.
