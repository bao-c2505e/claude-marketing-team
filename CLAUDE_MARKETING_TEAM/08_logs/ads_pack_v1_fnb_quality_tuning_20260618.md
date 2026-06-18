# Phase B4 — Ads Pack Draft V1 FnB Output Quality Tuning

**Date:** 2026-06-18
**Status:** ✅ DONE (committed, not pushed — Owner pushes per repo convention)
**Scope:** Prompt/copy tuning + exact-five enforcement for the Ads Pack Draft V1
local fallback (`src/lib/core/adsFactory.ts`) and the n8n activation runbook
system prompt. **No workflow behavior, webhook URL, approval state machine,
Supabase UUID gate, localStorage fallback, or metadata semantics changed.**

---

## Goal

Make the 5 generated Ads Pack Draft V1 approval items read like a senior
performance marketer wrote them for a Vietnamese FnB brand (local
restaurants / street food / cà phê / trà sữa), not generic AI — while staying
strictly draft/spec only (no ad creation, no launch, no spend, no live connector,
no fake metrics).

## Key architecture fact (unchanged from B1–B3)

Production AI quality comes from a real OpenAI node whose prompt lives **in n8n
(server)**, NOT in the repo. The repo workflow JSON
`n8n-workflows/ads_pack_v1.workflow.json` ships only a deterministic
"AI Provider Placeholder" stub (left **UNCHANGED**). So the two prompt/copy
surfaces the repo controls are:
1. Core local fallback `src/lib/core/adsFactory.ts`.
2. A runbook prompt-spec the Owner pastes into the production n8n OpenAI node.

---

## Files changed (3)

| File | Change |
|---|---|
| `src/lib/core/adsFactory.ts` | Senior-FnB Vietnamese defaults (`fnbAdsDefaults`), 12-element Vietnamese caption, `createFallbackAdsItem`, `normalizeAdsItems` exact-five, `mapAdsItem` rewrite. |
| `src/lib/core/adsFactory.test.ts` | Exact-five tests (cap/pad/empty + non-array reject), `unsafeExecutionCopy` safety-regression guard, new caption-field assertions. |
| `CLAUDE_MARKETING_TEAM/07_runbooks/ads_pack_v1_activation_runbook.md` | Path-B senior-FnB Vietnamese OpenAI system prompt, expanded Normalize node field list + exact-five note, refreshed "Expected 5 output items" description. |

No unrelated modules touched.

---

## Prompt / ads quality changes

Each ads draft now carries the full senior-FnB spec block (modern Vietnamese,
local-restaurant-practical, conversion-aware). The 12 required elements, all
present per item:

1. **Campaign objective suggestion** — goal-mapped to FnB-relevant Meta/social
   objectives: awareness · engagement · messages·inbox · traffic · local store
   visit intent · delivery·order intent. Suggestion only — nothing is set.
2. **Target audience hypothesis** (from brief/brand, else "Assumption").
3. **Customer insight** (why local FnB ads convert: food hero + trust + easy CTA).
4. **Offer / message angle** (per spec; offer wrapped "Owner xác nhận" if present,
   never invented).
5. **Primary text draft** (nháp — clearly draft, never "already running").
6. **Headline draft.**
7. **Description draft** (where relevant).
8. **Creative direction** — food hero / combo·menu / store atmosphere /
   founder·story / UGC·review-style (real photos/clips only, no AI image/video).
9. **Suggested placement** — Facebook Feed / Reels, Instagram·Reels if relevant,
   Zalo·social as draft idea only.
10. **CTA suggestion** (channel/goal-aware).
11. **Owner approval checklist.**
12. **Safety label** — "Draft ads concept only · Pending approval · Not launched ·
    No spend · No live ad account connection."

The 5 specs (keys/titles unchanged so the workflow contract holds):
`campaign_angle_offer` · `ad_copy_variants` · `audience_targeting` ·
`budget_testing_plan` · `ads_manager_handoff`.

**Honest-by-construction:** never invents prices / discounts / addresses / phones /
awards / testimonials / customer counts / metrics (CPM/CPC/CTR/ROAS/reach/clicks/
orders); avoids fake urgency, impossible targeting claims, and performance
promises. Missing info → "Owner xác nhận ..." / "Assumption: ..." (never the
generic "Owner to confirm"). The budget item explicitly states **no budget is set,
scheduled, or spent**; the handoff item states **Approved ≠ Published** and that
launch is a manual, off-platform human step.

`fnbAdsDefaults()` is shared by the local fallback and by `mapAdsItem`'s per-field
fallbacks, so an n8n response that omits fields still reads like a senior marketer
wrote it.

---

## Exact-five enforcement status — ✅ IMPLEMENTED

`runAdsFactory` now:
- **Non-array `items`** → throws `AdsFactoryError` (contract breach) — was the same.
- **Empty / short array** → padded with safe fallback ads drafts (was: threw on
  empty; old throw-on-empty test removed).
- **Overlong array** → capped to the first 5.

Done via `normalizeAdsItems()` (drop non-object entries → `slice(0, 5)` → pad with
`createFallbackAdsItem` for the remaining canonical specs), mirroring B2/B3.
Padded/capped items keep correct n8n provenance (`source: n8n`,
`generation_mode: external_module`). `job.item_count` is always 5.

---

## Tests added/updated — 7 ads tests (was 4); suite 72/72 (was 69)

- payload approval-first/launch-free (unchanged).
- local fallback → 5 items + all 12 caption labels + safety label + no
  `unsafeExecutionCopy` + no "Owner to confirm".
- n8n provenance → now normalizes to exactly 5 (2 returned → padded), provenance
  on every item.
- **NEW** cap >5 → exactly 5.
- **NEW** pad short → exactly 5 (returned first, canonical specs appended in order).
- **NEW** pad empty → exactly 5.
- **NEW** non-array `items` → rejected as contract breach.
- **NEW** `unsafeExecutionCopy` regex guard (no "ads launched / campaign launched /
  ad set created / budget spent / published / posted to <channel> / connected to a
  live ad account / fake CPM·CPC·CTR·ROAS·reach / guaranteed sales·orders·roas").

---

## Safety constraints preserved

- Approval-first only — every item `status: needs_review`, `owner_approval_required`.
- Output count: exactly **5** ads draft approval items (now enforced).
- Same Core callback/normalize behavior; same pending-approval item creation.
- Metadata semantics unchanged: `workflow_type=ads_pack`, `content_type=ads_draft`,
  `source=n8n`, `generated_by=n8n-ai-provider`, `generation_mode=external_module`.
- Draft/spec only. No auto-ads, no ad creation, no ad launch, no spend, no fake
  metrics, no live connector. No secret/real-webhook changes. Payload shape
  unchanged (`create_ads:false`, `launch_ads:false`, `generate_images:false`,
  `generate_videos:false`, all `no_*` safety flags true).

---

## Validation results

- `git diff --check`: clean (only benign LF→CRLF notices on this Windows repo).
- `npm run build`: **PASS** — entry `index` 352.95 kB (gzip 88.13), no >500 kB
  warning; vendor 175.77 kB, vendor-supabase 204.73 kB.
- `npm run test`: **PASS — 72/72** (adsFactory 7).
- `node contracts/tools/validate_contracts.js`: **ALL PASS**.
- Secrets/real-webhook scan on changed files: **clean** (only
  `n8n.example.com` test placeholders + `.env`-style placeholder names).

---

## n8n production: does it need a manual prompt update?

**Yes, to get the new quality live in production.** The repo workflow JSON was
**not** changed → no n8n re-import needed. But production AI text is produced by
the n8n OpenAI node (Path B), not the repo. To get the new senior-FnB ads drafts
in production, the Owner should paste the updated **Section 2 system prompt** from
`07_runbooks/ads_pack_v1_activation_runbook.md` into the existing production
OpenAI node (n8n-only edit — **no Core redeploy, no Vercel env change, webhook URL
unchanged**). Until then:
- Local fallback / dev / demo already show the new FnB output + exact-five.
- Production (if/when activated) keeps the old prompt text until the Owner pastes
  the new one. Core still force-fills/normalizes any missing fields to the new
  senior-FnB defaults and enforces exactly 5, so even the old/placeholder response
  stays specific, Vietnamese, correctly labelled, and capped at 5.

Production activation of Ads Pack remains **Owner-gated** (no Vercel env set).

---

## Recommended next phase

- **B5 — Report Draft V1 FnB Output Quality Tuning** (the last AI Factory module
  not yet FnB-tuned): same pass for `src/lib/core/reportFactory.ts` + runbook,
  draft-only / no live analytics / no unverified metrics, with exact-item-count
  enforcement and the shared `unsafeExecutionCopy`-style guard.
- Optional: extract the shared `unsafeExecutionCopy` regex into one test helper
  reused across all factory suites (currently duplicated per file).
