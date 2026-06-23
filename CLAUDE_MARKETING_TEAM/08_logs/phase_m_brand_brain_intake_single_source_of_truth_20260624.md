# Phase M — Brand Brain Intake & Single Source of Truth

**Date:** 2026-06-24
**Builder:** Claude Code (PC1)
**Scope:** Extract a shared, internal **Brand Brain data contract + builder**
(`lib/core/brandBrain.ts`) that normalizes one brand's full marketing context
from existing local records, wire `BrandBrainTab` to read from it (removing the
inline derivation that previously lived in `App.tsx`), and add a **Brand Context
Source & Review** intake surface (completeness, missing fields, owner review
status, source, last updated/reviewed). Pure/local/read-only. No live connectors,
real APIs, OAuth, webhooks, uploads, publishing, ads launch, auto-post, sync,
connector activation, or new dependency; no approval safety rule changed.

## Inspection (before any edit)

Reviewed `BrandBrainTab` (Phase L), `CampaignWorkspace` (Phase K),
`OwnerOperationsPanel` (Phase J), the `CoreDataStore` seed
(clients/brands/campaigns/briefs), `AssetDataStore` (assets), the approval queue,
and AI-output (`ContentPlanItem`) structures. Finding: the brand-context
**aggregation/union logic** (target audience, products, voice, pillars, do/don't,
compliance, owner notes unioned across a brand's briefs) lived **inline in
App.tsx**, feeding `BrandBrainTab` raw props. That was the one place at risk of
duplication. The fix is a single normalizer all surfaces can consume. Raw
brand/brief/asset records remain owned by `coreData`/`assetData`; the new module
is the single **normalizer** over them — no new persistence layer was added
(consistent with "no backend/Supabase/fetch unless an existing local pattern").

## Source-of-truth structure

`src/lib/core/brandBrain.ts` (new — pure, read-only):
- **Contract** `BrandBrain` with the requested fields: `brandId`, `clientId`,
  `brandName`/`clientName`/`contactName`, `category`, `positioning`,
  `targetCustomers`, `products`, `offers`, `brandVoice`, `contentPillars`,
  `keyMessages`, `creativeDos`, `creativeDonts`, `claimComplianceNotes`,
  `campaignContext[]`, `ownerNotes`, `channels`, `brandColors`,
  `assetReferences[]`, `assetStatusCounts`, `approvalSafetyNotes`, `source`,
  `status`, `updatedAt`, `lastReviewedAt`.
- **Status** `BrandBrainStatus = draft | needs_review | approved_internal |
  archived` (internal review lifecycle only — never an external state), derived
  from the brand's primary brief status.
- **Source** `BrandBrainSource = internal | mock | demo | draft-only`; the
  seed/local builder always emits `source: 'internal'` (UI shows
  "Internal · Draft-only").
- **Builder** `buildBrandBrain({ brand, client, campaigns, briefs, assets })` —
  unions list fields across all briefs, composes `positioning`, maps campaign
  context (+ per-campaign goal) and asset references, and attaches standing
  `BRAND_BRAIN_SAFETY_NOTES` (Approved ≠ Published, internal only, no auto-post,
  no fabricated metrics). Pure: does not mutate inputs, no network, no storage.
- **Completeness** `assessBrandBrainCompleteness(brain)` scores the 10
  `BRAND_BRAIN_CONTEXT_FIELDS`, returning present/total/percent + missing labels.
- **Option builder** `buildBrandBrainOption(...)` for the brand picker.
- Display maps `BRAND_BRAIN_STATUS_LABEL/COLOR`, `BRAND_BRAIN_SOURCE_LABEL`.

## UI / data wiring

1. **`src/components/core/BrandBrainTab.tsx`** (refactored)
   - Props changed from raw `client/brand/campaigns/briefs/assets` to the
     normalized `brandBrain: BrandBrain` + `completeness: BrandBrainCompleteness`
     (+ `options`/`selectedId`/`onSelect`/`onNavigate`). All sections now read
     `brandBrain.*` — no re-derivation from raw brief fields.
   - **New "Brand Context Source & Review" card**: source + status chips,
     completeness bar (`present/total · %`), missing-field chips, source / owner
     review status / last updated / last reviewed, and allowed-label navigation
     actions — **Review missing fields**, **Mark for owner review**, **Use as
     draft context**, **View safety status** (all navigation only; no edit/save).
   - Existing Phase L sections retained (Identity, Target Customers, Products/
     Offers, Voice, Pillars, Do/Don't, Compliance, Campaign Context, Owner Notes,
     Asset Snapshot, Safety & Connector Status, Last Updated/Internal Draft State).

2. **`src/App.tsx`** (scoped)
   - Imports `buildBrandBrain` / `assessBrandBrainCompleteness` /
     `buildBrandBrainOption`.
   - The `brand-brain` render block now resolves brand-scoped local state, calls
     the shared builder, and passes the assembled `brandBrain` + `completeness`
     to `BrandBrainTab` (replacing the previous inline union/option derivation).

3. **Tests**
   - **`src/lib/core/brandBrain.test.ts`** (new — 6 tests): builder assembles a
     normalized contract from seed; `source` always `internal`; safety notes carry
     "Approved ≠ Published"/"No fabricated metrics"; status derives draft /
     needs_review / approved_internal from brief status; completeness = 100% for a
     full brand and lists missing fields for a sparse one; builder does not mutate
     inputs; option builder works.
   - **`src/components/core/BrandBrainTab.source.test.ts`** (updated — 12 tests):
     reads from `lib/core/brandBrain`; renders all sections from the contract
     (`bb.targetCustomers`/`products`/… `assetReferences`); **no** re-derivation
     from raw `must_include`/`must_avoid`/`content_pillars`/`target_audience`;
     intake/review (completeness, missing fields, owner review status, last
     updated/reviewed) + allowed action labels present; approval-first + Approved ≠
     Published + Internal records only + Manual confirmation outside CORE visible;
     internal/simulated/demo/draft-only labels; connector safety blocked +
     read-only (`LEDGER_SUMMARY.liveCount`); no upload/publish/post/ads-launch/
     activate/sync/fetch wording; auto-post only negated; no URL/OAuth/webhook/
     fetch/axios/token/persistence; display+nav only; no contamination.

## Safety guarantees

- **Single source of truth, pure & local.** `buildBrandBrain` derives drafts/
  context only — no fetch / axios / network / OAuth / webhook / external URL, no
  Supabase / persistence / live sync, no input mutation. (Its header documents
  this in a "no …" negation, matching the repo convention.)
- **Approval-first visible.** Safety ribbon + per-section copy + the contract's
  `approvalSafetyNotes`: Internal records only, Approved ≠ Published, Owner
  approval required, No auto-post, Live connectors blocked, Manual confirmation
  outside CORE.
- **Internal/demo only.** Every assembled brain is `source: 'internal'` and shown
  "Internal · Draft-only"; the intake card labels context internal / simulated /
  demo / draft-only; "No fabricated metrics" pinned.
- **No upload/publish/post/ads/launch/activate/sync controls.** Intake actions are
  navigation-only (Review missing fields / Mark for owner review / Use as draft
  context / View safety status); enforced by source-scan test.
- **Connector safety read-only & blocked.** `0 of N live` from the ledger's hard
  `0` literal; Canva remains sandbox/mock.
- **No approval safety rule changed.** AI ceiling stays `pending_approval`;
  `published`/`launched` are never set by the builder; `BrandBrainStatus` is an
  internal review lifecycle (`approved_internal`), not an external state.

## Validation

- **`npm test`** — PASS (24 files, 249 tests; +1 file / +8 tests vs 23/241).
- **`npm run build`** — PASS (tsc + vite, ~3.6s; 0 TS errors).
- **`git status --short`** — only intentional changes: `M src/App.tsx`,
  `M BrandBrainTab.tsx`, `M BrandBrainTab.source.test.ts`, plus new
  `brandBrain.ts` + `brandBrain.test.ts`. This log is the additional new doc.
- **Safety search** — no `CANVA_*`/`META_ACCESS_TOKEN`/`TIKTOK_ACCESS_TOKEN`/
  `ZALO_ACCESS_TOKEN`/`GOOGLE_ADS`, no live OAuth/webhook/external URL/fetch/axios,
  no upload/publish/post/ads/launch/activate/sync behaviour; auto-post only
  negated; no Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination (the only
  grep hits are the negated safety comment in `brandBrain.ts` and the negated test
  guards).

## Risk / follow-up

- Low risk: additive + a clean refactor that *reduces* duplication; the
  BrandBrainTab render is unchanged in substance (same sections), now fed by a
  tested contract. `CampaignWorkspace` was intentionally left reading raw brand
  fields directly (no aggregation there to dedupe) to keep the change scoped.
- Optional next: have Campaign Workspace / AI Factory framing / Report Drafts also
  consume `buildBrandBrain` for their brand-context blocks, and (Owner-gated) a
  local-only editable brand-brain status routed through existing forms.

## Recommended next phase

**Phase N — Brand Brain consumers & AI Factory context framing**: feed
`buildBrandBrain` into the AI Factory request framing and Report Drafts so every
generated draft cites the same normalized, owner-verified brand context — all
within the approval-first, no-live-connector boundary.

## Recommendation: **PASS** — commit pending Owner review (do not commit yet).
