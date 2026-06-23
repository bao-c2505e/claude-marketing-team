# Phase N — AI Factory Brand Context Injection

**Date:** 2026-06-24
**Builder:** Claude Code (PC1)
**Scope:** Wire the shared **Brand Brain** source/contract (Phase M) into every AI
Factory module's **request framing** and into an Owner-facing **grounding preview**
so Content / Design / Video / Ads / Report drafts consistently use the **same
normalized brand context**. Additive only. No live connectors, real APIs, OAuth,
webhooks, uploads, image/video generation, publishing, ads launch, auto-post,
sync, connector activation, OpenAI-key-in-Core, or new dependency; no approval
safety rule changed.

## Inspection (before any edit)

Reviewed the five AI Factory modules (`contentFactory`, `designFactory`,
`videoFactory`, `adsFactory`, `reportFactory`), the Phase M `brandBrain`
contract/builder, `AutomationFactoryTab` (the factory control surface), the
approval queue, and `CampaignWorkspace`. Finding: each factory built its request
payload by re-reading raw `brand`/`brief` fields independently (industry,
hero_product, tone, audience, pillars, must_include/avoid). The Brand Brain
normalizer already unions/normalizes that context but **nothing fed it into the
factory request framing** — the gap this phase closes with one shared snapshot.

## What changed

### 1. Shared AI Factory context snapshot — `src/lib/core/brandBrain.ts` (additive)
- New `BrandContextSnapshot` — a compact, **draft-only** projection of a
  `BrandBrain`: `brand_identity` (name/client/contact/category), `positioning`,
  `target_customers`, `products_offers`, `brand_voice`, `content_pillars`,
  `key_messages`, `creative_dos`, `creative_donts`, `claim_compliance_notes`,
  `campaign_context[]`, `owner_notes`, `channels`, `safety_notes`, plus pinned
  labels `source` (`internal`), `status` (internal review value), `draft_only`,
  `internal_only`, `owner_approval_required`, and `approved_not_published`.
- `buildBrandContextSnapshot(brain)` projects a full brain into the snapshot,
  capping each list at 8 entries so request framing stays compact.
- `buildAiFactoryBrandContext({ brand, client, campaign, brief, assets? })` —
  convenience builder for the single-record shape the factories hold; wraps the
  records into the array-based `buildBrandBrain` then snapshots. Takes **raw
  records** (not a factory type) to keep `brandBrain.ts` import-free of any
  factory module → **no circular dependency**; pure & read-only.
- `APPROVED_NOT_PUBLISHED_REMINDER` constant ("Approved ≠ Published …"), pinned
  into every snapshot and asserted by tests.

### 2. Request framing — all five factory payloads (additive field)
Each `create*Payload(input)` now emits `brand_brain_context: BrandContextSnapshot`
via `buildAiFactoryBrandContext({ brand, client, campaign, brief })`, and each
`*RequestPayload` interface gained the matching field:
- `contentFactory.ts` → `ContentFactoryRequestPayload`
- `designFactory.ts` → `DesignBriefRequestPayload`
- `videoFactory.ts` → `VideoScriptRequestPayload`
- `adsFactory.ts` → `AdsPackRequestPayload`
- `reportFactory.ts` → `ReportDraftRequestPayload`

Existing `client`/`brand`/`campaign`/`brief`/`options`/`safety` fields are
unchanged — the snapshot is purely additive, so existing request contracts and
their tests (`toMatchObject` on `safety`, field-level assertions) keep passing.

### 3. Owner-facing grounding preview — `src/components/core/AutomationFactoryTab.tsx`
- New read-only `BrandGroundingPanel` rendered above the Workflow Starters grid.
  When a brand is selected it builds the **same** snapshot
  (`buildAiFactoryBrandContext`, memoized) and shows what every draft is grounded
  in: brand identity + campaign + brief, positioning, target customers, products/
  offers, voice, pillars, creative don't, claim/compliance — with
  **Internal · Draft-only**, **Source: internal**, **Approval-first** badges and an
  **Approved ≠ Published** safety footer ("No auto-post, no auto-ads, no live
  connectors — drafts stay pending Owner approval"). Presentational only: it
  renders the snapshot, never posts/launches/syncs/fetches.

## Surfaces now consuming Brand Brain context

| Surface | Consumes via |
|---|---|
| Content Factory request | `brand_brain_context` in `ContentFactoryRequestPayload` |
| Design Factory request | `brand_brain_context` in `DesignBriefRequestPayload` |
| Video Scripts request | `brand_brain_context` in `VideoScriptRequestPayload` |
| Ads Pack request | `brand_brain_context` in `AdsPackRequestPayload` |
| Report Draft request | `brand_brain_context` in `ReportDraftRequestPayload` |
| Automation Factory UI | `BrandGroundingPanel` (shared snapshot preview) |

## Tests

- **`src/lib/core/brandBrain.test.ts`** (+3 tests): snapshot is brand-grounded and
  carries internal/draft-only/approval-first labels + `APPROVED_NOT_PUBLISHED_REMINDER`;
  lists are capped (≤ 8); single-record builder works (incl. empty campaign/brief).
- **`src/lib/core/aiFactoryBrandContext.test.ts`** (new — 4 tests): every factory
  payload carries `brand_brain_context`, all five contexts are identical (single
  source of truth — no per-module drift), internal/draft-only/approval-first labels
  + payload-level `no_auto_post`/`no_auto_ads`/`no_live_connectors` preserved, and
  no `published`/`launched` status and no URL/token/key in the serialized context.
- **`src/components/core/AutomationFactoryTab.source.test.ts`** (new — 6 tests):
  grounding panel + `buildAiFactoryBrandContext` present; Internal · Draft-only +
  Approval-first + Approved ≠ Published + "pending Owner approval" visible; auto-post
  only negated; no publish/launch-ad/post-to/go-live/activate-connector/send-to-canva/
  sync-live wording; no fetch/axios/URL/token/key; no off-domain contamination.

## Safety guarantees

- **Approval-first preserved.** AI ceiling stays `pending_approval`; the snapshot's
  `status` is an internal review lifecycle value only (`draft`/`needs_review`/
  `approved_internal`/`archived`) — `published`/`launched` are never set.
- **Approved ≠ Published explicit.** Pinned in every snapshot
  (`approved_not_published`) and rendered in the grounding panel footer.
- **Internal / draft-only.** Every snapshot is `source: 'internal'`,
  `draft_only: true`, `internal_only: true`; UI shows "Internal · Draft-only".
- **No live behaviour added.** Pure, offline derivation — no fetch / axios /
  network / OAuth / webhook / external URL; no upload/publish/post/ads/launch/
  activate/sync; no image/video generation; no OpenAI/API key/env in Core.
- **Connector safety unchanged.** Ledger remains read-only, live connectors
  blocked, Canva sandbox/mock only.
- **No fabricated metrics.** Brand Brain safety notes (incl. "No fabricated
  metrics") carried into `safety_notes`.

## Validation

- **`npm test`** — PASS (26 files, 262 tests; +2 files / +13 tests vs 24/249).
- **`npm run build`** — PASS (tsc + vite, ~3.5s; 0 TS errors).
- **`git status --short`** — only intentional changes: `M` on
  `AutomationFactoryTab.tsx`, `contentFactory.ts`, `designFactory.ts`,
  `videoFactory.ts`, `adsFactory.ts`, `reportFactory.ts`, `brandBrain.ts`,
  `brandBrain.test.ts`; new `aiFactoryBrandContext.test.ts`,
  `AutomationFactoryTab.source.test.ts`; plus this log.
- **Safety search** — no `CANVA_*` / `META_ACCESS_TOKEN` / `TIKTOK_ACCESS_TOKEN` /
  `ZALO_ACCESS_TOKEN` / `GOOGLE_ADS` / `OPENAI_API_KEY` added; no live OAuth/webhook/
  external URL/fetch/axios introduced; no upload/publish/post/ads/launch/activate/
  sync behaviour; auto-post only negated; no Forme/sofa/furniture/nội thất/ImgBB
  contamination. (Pre-existing grep hits are all negated safety declarations or the
  connector registry's documented future env keys — none in this phase's diff.)

## Risk / follow-up

- Low risk: additive request field + a presentational preview; existing payload
  fields, item shapes, and approval semantics are untouched.
- Optional next: also surface the per-item grounding (which brand context an
  approval item was generated from) in the Approval Queue / Campaign Workspace, and
  let the n8n provider prompt explicitly cite `brand_brain_context` fields.

## Recommended next phase

**Phase O — Approval Queue brand-context provenance**: show each pending approval
item's originating Brand Brain snapshot (read-only) so reviewers see exactly what
context grounded the draft — still approval-first, no live connectors.

## Recommendation: **PASS** — commit pending Owner review (do not commit yet).
