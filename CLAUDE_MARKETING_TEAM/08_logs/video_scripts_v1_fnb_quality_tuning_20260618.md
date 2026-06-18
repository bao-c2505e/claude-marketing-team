# Video Scripts V1 — FnB Output Quality Tuning (Phase B3) - 2026-06-18

## Status

DONE. Prompt/copy tuning + exact-five enforcement only. Workflow behavior, output
count (5 video script items), Core callback/normalize, pending-approval creation,
and metadata semantics are all unchanged. `npm run build` PASS (no >500 kB
warning), `npm run test` PASS 69/69, `node contracts/tools/validate_contracts.js`
ALL PASS.

## Scope

Tuned the two prompt/copy surfaces the repo controls — the Core **local fallback**
video-script content and the **production OpenAI system prompt** (the video
activation runbook the Owner pastes into n8n) — and hardened the n8n path to
always yield exactly 5 approval items. **No** changes to: workflow node graph /
behavior, webhook URLs, approval state machine, Supabase UUID gate, localStorage
fallback, env, dependencies, or the `n8n-workflows/video_scripts_v1.workflow.json`
file. No video generation. No image generation. No secrets. Video Scripts remains
**text/script/spec only**.

## Files changed

- `src/lib/core/videoFactory.ts`
  - `VIDEO_SCRIPT_SPECS`: kept the same 5 keys/titles; updated `platform` to cover
    TikTok / Facebook Reels / YouTube Shorts / Zalo, and `format`/objective to
    phone-shootable Vietnamese (9:16, 15–30s).
  - Added optional structured fields to `N8nVideoScriptItem` (`customer_insight`,
    `hook`, `scene_script`, `on_screen_text`, `food_styling`, `duration`,
    `owner_checklist`) — additive, backward-compatible; `script_body` kept as an
    alias for `scene_script`.
  - New `fnbVideoDefaults()` (senior short-form video strategist, Vietnamese)
    feeds both the local fallback (`createFallbackVideoScriptItem`) and
    `mapVideoItem`'s per-field fallbacks. Rewrote the caption to a structured
    13-element Vietnamese video brief.
  - **Exact-five enforcement** via `normalizeVideoScriptItems()`: drops non-object
    entries, caps an overlong n8n response to the first 5, and pads a short/empty
    response with safe fallback video script drafts — while preserving n8n
    provenance (`source: n8n`, `generated_by: n8n-ai-provider`, `generation_mode:
    external_module`). `runVideoFactory` now throws only on a non-array `items`
    (contract breach); an empty array is padded, not rejected.
- `src/lib/core/videoFactory.test.ts` — updated the caption assertions to the new
  Vietnamese field set + safety label; added a `unsafeExecutionCopy` guard; added
  three exact-five tests (cap to 5, pad short, pad empty). 4 → 6 tests.
- `CLAUDE_MARKETING_TEAM/07_runbooks/video_scripts_v1_activation_runbook.md` —
  replaced the Path B OpenAI **system prompt** with a senior-FnB Vietnamese
  short-form strategist prompt (asks for the richer field set; no video/image gen;
  no fake prices/metrics/awards/testimonials), expanded the Normalize item-field
  list, noted Core's exact-five enforcement, and refreshed the "Expected 5 output
  items" caption description.

## Prompt / video quality changes

Each of the 5 scripts now reads like a senior FnB short-form strategist wrote it,
with: video objective · platform suggestion (TikTok / Facebook Reels / YouTube
Shorts / Zalo) · target customer + **insight** · **opening hook in the first 1–3
seconds** · **scene-by-scene script** · voiceover/lời thoại · **on-screen text**
suggestions · **shot list / camera direction** · **food styling / product-hero**
direction · **suggested duration** · CTA · **Owner approval checklist** · safety
label. Modern Vietnamese, premium-street-food tone, appetizing/visual-first,
phone-shootable by a small content team; avoids generic influencer language and
impossible production ideas.

## Exact-five enforcement status

Enforced for all paths. Local fallback always emits the 5 canonical specs. The
n8n path is normalized in `normalizeVideoScriptItems`: >5 → first 5; <5 → padded
with safe fallback drafts; 0 → 5 safe fallback drafts; non-array → throws
`VideoFactoryError` (contract breach). Verified by unit tests
(`caps … to exactly 5`, `pads short …`, `pads empty …`) and `job.item_count === 5`.

## Tests added/updated

- Updated: local-fallback caption test (new Vietnamese field set + safety label +
  unsafe-execution guard); n8n provenance test (now asserts normalize-to-5).
- Added: `caps n8n video script output to exactly 5`, `pads short n8n … output`,
  `pads empty n8n … output`.
- Removed: the old "fails safely when the webhook returns no items" throw test
  (empty is now padded to 5, per the exact-five requirement).
- Suite: `videoFactory.test.ts` 6 tests; project total 69/69 PASS.

## Safety constraints preserved

- Text/script/spec only — **no video generation, no image generation**; styling
  and shot direction state "Quay món thật của quán … KHÔNG tạo video/ảnh bằng AI."
  Never claims a video/image file was created or that
  Canva/ComfyUI/Fal.ai/TikTok/Facebook/Zalo/YouTube was used or posted to.
- Approval-first: all 5 items `needs_review` / pending; nothing posted, launched,
  scheduled, or spent. Approved ≠ Published. Each item carries the explicit safety
  label: "Draft video script only · Pending approval · Not generated as video ·
  Not published."
- Honest by construction: never invents prices, discounts, addresses, phones,
  awards, testimonials, or metrics (views/likes/comments/reach/ROAS) — missing
  info becomes "Owner xác nhận …" / "Assumption: …". No "Owner to confirm"
  placeholders. Guarded by the `unsafeExecutionCopy` regex test.
- Metadata semantics intact (verified by unit test): `workflow_type:
  video_scripts`, `content_type: video_script`, `source: n8n`, `generated_by:
  n8n-ai-provider`, `generation_mode: external_module`, `status:
  pending_approval`, `owner_approval_required: true`, `safety: no_auto_post=true;
  no_auto_ads=true; no_image_generation=true; no_video_generation=true`. OpenAI
  key stays only in n8n Credentials; no secrets/webhook URLs committed.

## Validation results

- `npm run build` — PASS (1582 modules; entry 348.53 kB; no >500 kB warning).
- `npm run test` — PASS 69/69 (incl. `videoFactory.test.ts` exact-five n8n
  cap/pad coverage).
- `node contracts/tools/validate_contracts.js` — ALL CHECKS PASSED.
- `git diff --check` — clean (only benign LF→CRLF notices).
- Secrets/URL grep on the diff — clean.

## Does n8n production require a manual prompt update?

- **The repo workflow JSON was NOT changed → no re-import of the JSON is needed.**
- **Recommended (Owner-gated, n8n-only):** paste the upgraded system prompt
  (runbook §2.4) into the existing production Video Scripts OpenAI node and Save,
  so production scripts gain the new Vietnamese FnB depth + structured fields. This
  is an n8n-side edit — **no Core redeploy and no Vercel env change** (webhook URL
  unchanged). The new item fields are backward-compatible: if the current n8n
  prompt omits them, Core fills senior-FnB Vietnamese defaults and enforces exactly
  5 items, so there is no breakage. The improved output is already live in **Local
  fallback mode** / dev / demo via the Core code change.

## Recommended next phase (B4)

- Apply the same senior-FnB Vietnamese quality pass to the remaining modules'
  local fallbacks + activation-runbook prompts: **Ads Pack Draft V1** (stays
  draft-only / no spend / no live ads connector) and **Report Draft V1** (stays
  draft-only / no live analytics / no unverified metrics).
- Optional: a shared safety-regression unit (the `unsafeExecutionCopy` guard)
  reused across all factory tests to assert outputs stay generation-free,
  publish-free, and metric-free.
