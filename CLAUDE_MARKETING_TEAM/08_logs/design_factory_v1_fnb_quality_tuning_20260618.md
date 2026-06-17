# Design Factory V1 — FnB Output Quality Tuning (Phase B2) - 2026-06-18

## Status

DONE. Prompt/copy tuning only. Workflow behavior, output count (5 design brief
items), Core callback/normalize, pending-approval creation, and metadata
semantics are all unchanged. `npm run build` PASS (no >500 kB warning),
`npm run test` PASS 67/67, `node contracts/tools/validate_contracts.js` ALL PASS.

## Scope

Tuned the two prompt/copy surfaces the repo controls — the Core **local fallback**
design-brief content and the **production OpenAI system prompt** (the design
activation runbook the Owner pastes into n8n). **No** changes to: workflow node
graph / behavior, webhook URLs, approval state machine, Supabase UUID gate,
localStorage fallback, env, or dependencies. No image generation. No secrets.
Design Factory remains **text/spec/brief only**.

## Files changed

- `src/lib/core/designFactory.ts`
  - `DESIGN_BRIEF_SPECS`: kept the same 5 keys/titles; updated formats to
    FnB-practical (Facebook **4:5**, Story/Reels **9:16**, Menu/Promo **A5 print +
    4:5**, Key Visual master incl. banner, Handoff doc) and Vietnamese objectives.
  - Added optional structured fields to `N8nDesignBriefItem` (`customer_insight`,
    `key_message`, `food_styling`, `typography`, `copy_placement`,
    `designer_notes`, `owner_checklist`) — additive, backward-compatible.
  - New `fnbDesignDefaults()` (senior-FnB Vietnamese) feeds both the local
    fallback and `mapDesignItem`'s per-field fallbacks. Rewrote `buildMockResult`
    and the `mapDesignItem` caption to a structured 13-element Vietnamese brief.
  - Added exact-five normalization for local fallback and n8n responses: Core
    caps overlong n8n output to the first 5 items and pads short/empty n8n output
    with safe fallback design brief drafts while preserving n8n provenance
    metadata (`source: n8n`, `generated_by: n8n-ai-provider`,
    `generation_mode: external_module`).
- `CLAUDE_MARKETING_TEAM/07_runbooks/design_factory_v1_activation_runbook.md` —
  replaced the Path B OpenAI **system prompt** with a senior-FnB Vietnamese
  creative-director prompt (asks for the richer field set; no image gen; no fake
  prices/metrics/awards/testimonials) and expanded the Normalize item-field list.

## Prompt / design quality changes

Each of the 5 briefs now reads like a senior FnB creative director wrote it, with:
design objective · target customer + **insight** · key message · visual concept ·
**food styling / product-hero** direction · layout · color palette · **typography**
· format suggestion (FB 4:5 / Story 9:16 / A5 menu-poster / banner) · **copy
placement** guidance · **designer notes** · **Owner approval checklist** · safety
label. Modern Vietnamese, premium-street-food tone, clean/appetizing/legible,
executable by local owners; avoids generic corporate design language.

## Safety constraints preserved

- Text/spec/brief only — **no image generation**; every brief states "Chỉ dùng
  ảnh món thật do quán cung cấp. No AI image generation in this V1 flow." Never
  claims image files were created or that Canva/ComfyUI/Fal.ai was used.
- Approval-first: all 5 items `needs_review` / pending; nothing posted, launched,
  scheduled, or spent. Approved ≠ Published. Each item carries an explicit safety
  label: "Draft design brief only · Pending approval · Not generated as image ·
  Not published."
- Honest by construction: never invents prices, discounts, addresses, phones,
  awards, testimonials, or metrics — missing info becomes "Owner xác nhận …" /
  "Assumption: …". No "Owner to confirm" placeholders.
- Metadata semantics intact (verified by unit test): `workflow_type:
  design_factory`, `content_type: design_brief`, `source: n8n`, `generated_by:
  n8n-ai-provider`, `generation_mode: external_module`, `status:
  pending_approval`, `owner_approval_required: true`, `safety: no_auto_post=true;
  no_auto_ads=true; no_image_generation=true`. OpenAI key stays only in n8n
  Credentials; no secrets/webhook URLs committed.

## Validation results

- `npm run build` — PASS (1582 modules; entry 344 kB; no >500 kB warning).
- `npm run test` — PASS 67/67 (incl. `designFactory.test.ts` exact-five n8n
  cap/pad coverage).
- `node contracts/tools/validate_contracts.js` — ALL CHECKS PASSED.
- Secrets/URL grep on the diff — clean.

## Does n8n production require a manual prompt update?

- **The repo workflow JSON was NOT changed → no re-import of the JSON is needed.**
- **Recommended (Owner-gated, n8n-only):** paste the upgraded system prompt
  (runbook §2.4) into the existing production Design Factory OpenAI node and Save,
  so production briefs gain the new Vietnamese FnB depth + structured fields. This
  is an n8n-side edit — **no Core redeploy and no Vercel env change** (webhook URL
  unchanged). The new item fields are backward-compatible: if the current n8n
  prompt omits them, Core fills senior-FnB Vietnamese defaults, so there is no
  breakage. The improved output is already live in **Local fallback mode** / dev /
  demo via the Core code change.

## Recommended next phase (B3)

- Apply the same senior-FnB Vietnamese quality pass to the remaining modules'
  local fallbacks + activation-runbook prompts: **Video Scripts V1**, **Ads Pack
  Draft V1**, **Report Draft V1** (report stays draft-only / no live analytics).
- Optional: a small unit test asserting design briefs stay metric-free and image-
  generation-free as a safety regression guard.
