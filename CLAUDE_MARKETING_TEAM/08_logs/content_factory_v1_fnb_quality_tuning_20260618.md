# Content Factory V1 — FnB Output Quality Tuning (Phase B1) - 2026-06-18

## Status

DONE. Prompt/copy tuning only. Workflow behavior, output count (7-day pack),
Core callback/normalize, pending-approval creation, and metadata semantics are
all unchanged. `npm run build` PASS (no >500 kB warning), `npm run test` PASS
65/65, `node contracts/tools/validate_contracts.js` ALL PASS.

## Scope

Tuned the two prompt/copy surfaces that the repo controls — the Core **local
fallback** content and the **production OpenAI system prompt** (as a runbook spec
the Owner pastes into n8n). **No** changes to: workflow node graph / behavior,
webhook URLs, Core approval state machine, Supabase UUID gate, localStorage
fallback, env, or dependencies. No secrets. No image/video generation. No
connectors.

## Files changed

- `src/lib/core/contentFactory.ts` — rewrote the local-fallback generator
  (`buildMockResult`) to senior-FnB Vietnamese: 7 distinct daily "plays" (món
  signature, câu chuyện quán, combo/ưu đãi, tương tác/UGC, hậu trường & nguyên
  liệu, giờ vàng/giao hàng, nhắc nhớ cuối tuần), platform-aware captions
  (TikTok = short shootable script; Facebook/Zalo = hook-led caption), concrete
  visual directions, platform-appropriate CTAs, and an Owner-review note line.
  Improved `mapFactoryItem` field fallbacks to FnB Vietnamese and switched
  `goalLabel` to Vietnamese. **The metadata block, item shape, 7-item count, and
  approval-first status (`needs_review`) are unchanged.**
- `CLAUDE_MARKETING_TEAM/07_runbooks/content_factory_v1_activation_runbook.md`
  (new) — the upgraded **senior-FnB OpenAI system prompt** for production (the
  real quality lever, since the production prompt lives in n8n, not the repo) +
  how to apply it to the already-wired workflow, the Normalize-node envelope
  contract, a UI re-test checklist, and rollback. No secrets/URLs.

## Prompt / content quality changes

- Specific to Vietnamese FnB brands; practical for Facebook/TikTok/Zalo.
- Stronger, varied hooks; clear daily content objective; natural Vietnamese
  caption; concrete shootable visual direction; platform-appropriate CTA; an
  explicit Owner-approval note per item.
- Less generic / corporate / robotic; supports premium street-food tone.
- Honest by construction: no invented prices, discounts, addresses, phones,
  awards, customer counts, reviews, or performance metrics — missing info becomes
  an "Owner xác nhận …" note. UGC day invites sharing instead of fabricating
  testimonials.

## Safety constraints preserved

- Approval-first only; every item is `needs_review` / pending approval; nothing
  is posted, scheduled, launched, or spent. Approved ≠ Published.
- No auto-post, no auto-ads, no live connectors, no image/video generation, no
  live analytics, no unverified metrics. OpenAI key stays only in n8n
  Credentials. No secrets or webhook URLs committed.
- Metadata semantics intact: `workflow_type: content_pack`, `status:
  pending_approval`, `owner_approval_required: true`, `source` / `generation_mode`,
  `safety: no_auto_post=true; no_auto_ads=true` (verified by unit test).

## Validation results

- `npm run build` — PASS (1582 modules; entry 342 kB, no >500 kB warning).
- `npm run test` — PASS 65/65 (incl. `contentFactory.test.ts`).
- `node contracts/tools/validate_contracts.js` — ALL CHECKS PASSED.
- Secrets/URL grep on the diff — clean.

## Does the n8n production workflow need manual re-import/update?

- **The repo workflow JSON was NOT changed → no re-import of the JSON is needed.**
- **YES, a manual n8n-side prompt update is recommended:** to get the new quality
  in production, the Owner pastes the upgraded system prompt (runbook §1) into the
  existing production OpenAI node and Saves. This is an n8n-only edit — no Core
  redeploy and no Vercel env change (the webhook URL is unchanged). Until then,
  production keeps producing with the current n8n prompt; the improved Vietnamese
  FnB output is already live in **Local fallback mode** / dev / demo via the Core
  code change.

## Recommended next phase (B2)

- Apply the same FnB quality pass to the other modules' local fallbacks +
  activation-runbook prompts (Design Factory visual briefs, Video Scripts, Ads
  Pack Draft, Report Draft) for a consistent senior-FnB voice across the factory.
- Optional: a couple of unit tests asserting the local fallback stays
  metric-free (no digits-as-price/percent patterns) as a safety regression guard.
