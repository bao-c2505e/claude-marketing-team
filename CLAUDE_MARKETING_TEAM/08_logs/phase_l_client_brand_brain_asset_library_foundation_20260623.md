# Phase L — Client Brand Brain & Asset Library Foundation

**Date:** 2026-06-23
**Builder:** Claude Code (PC1)
**Scope:** Add an Owner-facing **Client Brand Brain** surface that organizes one
client/brand's full marketing context (identity, customers, products/offers,
voice, pillars, do/don't, compliance, campaign context, owner notes, internal
draft state) and **polish the existing Asset Library** so its internal/demo/
draft-only provenance and "Approved ≠ Published" posture are explicit. Display +
navigation only. No live connectors, real APIs, OAuth, webhooks, uploads,
publishing, ads launch, auto-post, sync, or connector activation; no approval
safety rule changed.

## Inspection (before any edit)

Reviewed the data model and existing surfaces. The Brand Brain needed **no new
data** — every section is derivable from existing local state:
`CoreDataStore` (`Client`, `Brand` with `hero_product`/`tone_of_voice`/
`target_audience`/`primary_channels`/`brand_colors`, `Campaign`, `CampaignBrief`
with `product_focus`/`offer`/`content_pillars`/`key_messages`/`must_include`/
`must_avoid`/`approval_requirements`/`campaign_goal`/`additional_notes`) and
`AssetDataStore` (assets scoped by `brand_id`). Confirmed the Asset Library
(`AssetLibraryTab.tsx`, Phase 10) already covers asset name / type / status
(draft·needs_review·approved·rejected·archived) / source / approval state / usage
notes — so Phase L **polishes** it rather than rebuilding. Reused the read-only
connector ledger (`connectorLedger.ts`, hard `liveCount: 0`) and the established
`?raw` source-scan test pattern.

## What changed

1. **`src/components/core/BrandBrainTab.tsx`** (new — presentational + nav)
   - Internal brand-context surface for one brand. Props are existing local state
     passed in (client/brand + brand-scoped campaigns, briefs, assets) plus
     `options`/`selectedId`/`onSelect` (brand picker) and `onNavigate` (tab
     switch). No `useState`, no persistence, no fetch.
   - Sections: brand selector + safety ribbon; **Client / Brand Identity** (incl.
     brand colour swatches); **Target Customers**; **Products / Services / Menu /
     Offers** (offers flagged owner-confirmed-only); **Brand Voice / Tone**;
     **Content Pillars** (+ key messages); **Creative Do / Don't**; **Claim /
     Compliance Notes** (per-brief approval requirements + standing guarantees:
     no fabricated metrics, owner-verified claims, AI ceiling = pending_approval);
     **Campaign Context**; **Owner Notes**; **Asset Library Snapshot** (status
     chips, Approved ≠ Published); **Safety & Connector Status** (read-only ledger
     summary, `0 of N live`); **Last Updated / Internal Draft State**.
   - List fields are unioned across all of a brand's briefs so multi-campaign
     brands lose nothing. Action labels are limited to View campaign / Review
     brief / Preview draft / View approval state / Review asset / View safety
     status.

2. **`src/components/core/AssetLibraryTab.tsx`** (polish — safety banner only)
   - `AssetSafetyBanner` now states records are **internal / simulated / demo /
     draft-only**, that **Live connectors blocked**, and spells out **Approved ≠
     Published** ("approval authorizes internal use only; manual confirmation
     outside CORE is still required"). No behavioural/data change.

3. **`src/App.tsx`** (+50 / −1, scoped)
   - Lazy-imports `BrandBrainTab` (own code-split chunk, inside the existing
     `<Suspense>`); imports the `Brain` icon.
   - Adds `brandBrainBrandId` state (which brand to inspect).
   - Adds an owner-only **Brand Brain** sidebar tab (after Campaign Workspace) and
     registers `brand-brain` in `ownerOnlyTabs` (returns to dashboard when
     switching to Client View).
   - Adds the `brand-brain` render block: resolves the selected brand + its client
     and filters campaigns/briefs/assets to that brand — all from existing state —
     then renders `<BrandBrainTab />`.

4. **`src/components/core/BrandBrainTab.source.test.ts`** (new — 10 tests) and
   **`src/components/core/AssetLibraryTab.source.test.ts`** (new — 6 tests),
   source-scan via `?raw`, matching the established pattern:
   - all required Brand Brain sections render; brand/brief fields are surfaced;
   - asset type/status/source/approval-state metadata surfaced (Asset Library);
   - approval-first + "Approved ≠ Published" + "Owner approval required" +
     "Manual confirmation outside CORE" + "Internal records only" visible;
   - sample data labelled internal / simulated / demo / draft-only; "No fabricated
     metrics" present;
   - connector safety shown blocked + read-only, live count from the ledger
     summary literal;
   - no upload-to-canva / send-to-canva / publish-now / launch-ad / launch-campaign
     / post-to / go-live / activate-connector / sync-live / fetch-assets wording;
   - auto-post only ever appears negated ("No auto-post");
   - no live connector capability (no URL / OAuth / webhook / fetch / axios /
     `*_ACCESS_TOKEN` / `CANVA_*` / `GOOGLE_ADS` / persistence mutation);
   - no off-domain contamination; Brand Brain side effects are only `onSelect` /
     `onNavigate` (no `useState`/`useReducer`).

## UI sections added / polished

| Section | State | Source |
|---|---|---|
| Brand selector + safety ribbon | **new** | core brands list |
| Client / Brand Identity (+ colour swatches) | **new** | `coreData` client + brand |
| Target Customers | **new** | brand + briefs `target_audience` |
| Products / Services / Menu / Offers | **new** | brand `hero_product` + briefs `product_focus`/`offer` |
| Brand Voice / Tone | **new** | brand + briefs `tone_of_voice` |
| Content Pillars (+ key messages) | **new** | briefs `content_pillars`/`key_messages` |
| Creative Do / Don't | **new** | briefs `must_include`/`must_avoid` |
| Claim / Compliance Notes | **new** | briefs `approval_requirements` + standing guarantees |
| Campaign Context | **new** | brand-scoped campaigns + primary brief goal |
| Owner Notes | **new** | client `notes` + briefs `additional_notes` |
| Asset Library Snapshot | **new** | assets (brand-scoped) status chips |
| Safety & Connector Status | **new** | read-only `connectorLedger` projection |
| Last Updated / Internal Draft State | **new** | brand `updated_at` + brief status |
| Asset Library safety banner | **polished** | explicit internal/demo/draft-only + Approved ≠ Published |

## Safety guarantees

- **Approval-first visible.** Safety ribbon + per-section copy on both surfaces:
  Internal records only, Approved ≠ Published, Owner approval required, No
  auto-post, Live connectors blocked, Manual confirmation outside CORE.
- **Internal/demo only.** All sample content is labelled internal / simulated /
  demo / draft-only; the compliance section pins "No fabricated metrics" and
  "every price/discount/claim/award/statistic must be Owner-confirmed".
- **No upload/publish/post/ads/launch/activate/sync controls.** Only
  Review/Preview/View/selector navigation; enforced by source-scan tests.
- **Connector safety read-only & blocked.** Summary shows `0 of N live` from the
  ledger's hard `0` literal; no activation control. Canva remains sandbox/mock.
- **No live connector / API / OAuth / webhook / external URL / fetch / axios /
  secret** added; no new dependency.
- **No approval safety rule changed.** AI generation ceiling (`pending_approval`),
  terminal external states (`published`/`launched`), and the separate manual-
  confirm publish step are untouched.

## Validation

- **`npm test`** — PASS (23 files, 241 tests; +2 files / +16 tests vs 21/225).
- **`npm run build`** — PASS (tsc + vite, ~3.5s). `BrandBrainTab` emits its own
  16.67 kB chunk.
- **`git status --short`** — only intentional changes: `M src/App.tsx` (+50/−1),
  `M src/components/core/AssetLibraryTab.tsx` (banner only), plus three new files
  (component + two tests). This log is the additional new doc.
- **Safety search** — no `CANVA_CLIENT_ID/SECRET/API/TOKEN`, `META_ACCESS_TOKEN`,
  `TIKTOK_ACCESS_TOKEN`, `ZALO_ACCESS_TOKEN`, `GOOGLE_ADS`, OAuth, webhook,
  external URL, fetch, axios, or upload/publish/post/ads/launch/activate/sync-live
  behaviour in the new/polished files; auto-post only appears negated; no
  Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination (only the negated
  test guards reference those terms).

## Risk / follow-up

- Low risk: additive, presentational, code-split, owner-only; existing dashboard,
  approval, asset, and connector flows are unchanged. The Brand Brain reads
  existing seed/local data and shows honest empty states ("No … captured yet")
  when a brand/brief field is blank.
- Optional later: an inline "edit brand context" affordance (still approval-first,
  routed through the existing Brands/Brief flows) and a per-brand asset
  collection deep link.

## Recommended next phase

**Phase M — Brand Brain editing & brief sync** (let the Owner curate brand-brain
fields through the existing Brands/Brief intake forms, keeping a single source of
truth) — all within the approval-first, no-live-connector boundary.

## Recommendation: **PASS** — commit pending Owner review (do not commit yet).
