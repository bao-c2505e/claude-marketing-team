# Phase Q — Client-ready Campaign Pack Export / Handoff

**Date:** 2026-06-24
**Builder:** Claude Code (PC1)
**Scope:** A SAFE, **campaign-centric** delivery pack so the Owner can assemble ONE
campaign's Owner-**APPROVED** deliverables into a client-presentation-grade dossier and
**copy / download** it locally. New pure builder + a self-contained export panel surfaced
inside the Campaign Production Workspace (Phase K). Additive, read-only, local-only. No
approval-state change, no live connector, webhook, secret, or env change.

## What changed

### `src/lib/core/campaignPack.ts` (new — pure, read-only)
- A campaign-scoped delivery dossier builder that reuses (no duplication) the existing
  building blocks: `handoffPack` module ordering + `toPlainText`, `brandBrain`
  snapshot, `approvalDecision` audit, `manualDelivery` labels, `approvalClassify`
  module classification.
- `resolveCampaignPackContext()` — builds the campaign's Brand-Context cover from the
  SAME `buildBrandContextSnapshot` normalizer the AI Factory + Approval Queue use
  (internal / draft-only — never a live/published source). Null snapshot when no brand.
- `collectCampaignPackItems()` — turns the campaign's approval requests into resolved
  deliverables. **Only requests whose status is exactly `approved` AND that belong to
  the chosen campaign** become items; each carries its latest Owner approval decision
  (Phase P audit trail) for client-facing provenance, plus the Phase E manual-delivery
  status/note/link (read-only).
- `campaignModuleBreakdown()`, `buildCampaignPack()` (Markdown / plain-text),
  `campaignPackFileStem()` (safe, dated, separator-free slug).
- Verbatim safety constants on every pack: `CAMPAIGN_PACK_SAFETY_NOTE` = "This is an
  internal client-ready campaign pack. Core did not publish, launch, schedule, or
  spend." / `CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED` = "Approved for client handoff. Not
  published, scheduled, launched, or spent by Core." / `CAMPAIGN_PACK_MANUALLY_POSTED_NOTE`.
- Pure: no localStorage write, no DB, no network — trivially unit-testable.

### `src/components/core/CampaignPackPanel.tsx` (new — interactive export panel)
- A self-contained panel (owns its own UI state) embedded in the Campaign Workspace:
  select approved deliverables → **Build campaign pack** → preview → **Copy to
  clipboard** / **Download .md/.txt** (local `Blob` + object URL only).
- Reads the Phase E manual-delivery map via `loadManualDelivery()` (read-only); never
  writes it, never mutates approvals.
- Build gated by `can.exportPacks(userRole)`; safety banner + per-pack reminders carry
  the Approved ≠ Published / no-publish-launch-schedule-spend copy.
- It lives in a **separate component on purpose**: the parent `CampaignWorkspace` stays
  stateless / display-only, so its Phase K source-scan safety contract (no `useState`,
  no mutation) keeps holding.

### `src/components/core/CampaignWorkspace.tsx` (additive)
- Renders `<CampaignPackPanel>` after the status sections; threads three new pass-through
  props (`approvalEvents`, `userRole`, `actorLabel`). Component remains stateless —
  display + navigation only; header comment updated to document the local export feature.

### `src/App.tsx`
- In the Campaign Workspace render block: scopes `wsApprovalEvents` to the inspected
  campaign (events whose request belongs to it) and passes `approvalEvents` +
  `userRole={user?.role}` + `actorLabel` to `CampaignWorkspace`. No handler, repo,
  routing, RLS, or state-machine change.

## Tests

- **`src/lib/core/campaignPack.test.ts`** (new — 23 tests): context resolution
  (internal/draft-only snapshot, per-campaign briefs, null brand); collect includes
  ONLY approved requests for the chosen campaign (never pending/rejected/other-campaign);
  module classification; Phase P provenance + `resolved_at` fallback; Phase E
  manual-delivery read; module breakdown; build carries verbatim Approved ≠ Published +
  internal-pack safety copy; Brand Context cover; per-item "Approved by …"; clean caption
  body (no metadata leak); report data-status labels kept verbatim + no invented metrics;
  manually-posted label; **safety regression** (no auto-post / published-to / scheduled /
  launched-ad / spent-$ / pulled-analytics); empty selection placeholder; default title;
  plain-text strip; cover-only pack; missing-item graceful; file stem.
- **`src/components/core/CampaignPackPanel.source.test.ts`** (new — 9 source-scan tests):
  renders the export surface; references both pack safety constants; uses
  `collectCampaignPackItems` (approved-only); exports locally (Blob + clipboard, no
  fetch/axios/XHR); reads but never writes manual-delivery / never mutates approvals;
  no publish/post/ads-launch/go-live action wording; auto-post only negated; no
  URL/OAuth/webhook/token; no off-domain contamination.

### Fixture fix carried over (from the in-progress test of the prior session)
The half-written `campaignPack.test.ts` failed before this wrap-up for two **fixture**
reasons (not logic): `must_include`/`must_avoid` were declared as arrays but the real
`CampaignBrief` type is `string | null` (slipped past an `as unknown as` cast → crashed
`brandBrain.uniq`); and the `Brand` fixture was missing required `slug`/`logo_url`/
`created_by` (a `tsc` build error since the build typechecks tests). Both fixed in the
fixture; `brandBrain.ts` itself was already correct and was **not** changed.

## Safety guarantees (CLAUDE.md §4)

- **Approval-first.** A pack includes only items in status **exactly `approved`** for the
  chosen campaign; building a pack **never** changes any approval state.
- **Approved ≠ Published.** Every pack carries the verbatim Approved ≠ Published +
  internal-pack safety copy (header + closing); the panel banner restates it.
- **No auto-post / no auto-ads / no spend.** Copy/clipboard + local `Blob` download only;
  no posting/scheduling/launch/spend path. Source-scan bans affirmative publish/launch/
  post wording.
- **No fake metrics.** Report items keep their own data-status labels (Provided /
  Simulated / Missing / Owner input required) verbatim; "No metrics are invented".
- **No secrets / no live connector / no webhook / no env change.** No keys/URLs/webhook/
  `fetch`/`axios`; pure local read + local export. (The only `https://` is a fictional
  reference-link **test fixture** reused verbatim from the Phase F handoff test to verify
  `isSafeHttpLink` display — not a real secret/webhook.)
- **Dry-run/sandbox** — N/A: no connector is touched.

## Validation

- **`npm test`** — PASS **30 files / 316 tests** (+2 files / +32 tests vs 28/284).
- **`npm run build`** — PASS (tsc + vite; 0 TS errors; no >500 kB warning; entry `index`
  376.11 kB; `CampaignWorkspace` chunk 37.11 kB now includes the panel).
- **`git status --short`** — only intentional changes: new `campaignPack.ts` +
  `campaignPack.test.ts` + `CampaignPackPanel.tsx` + `CampaignPackPanel.source.test.ts`,
  `M CampaignWorkspace.tsx`, `M App.tsx`, plus this log + `phase_log.md`.
- **Safety search** — no `CANVA_*` / `META_ACCESS_TOKEN` / `TIKTOK_ACCESS_TOKEN` /
  `ZALO_ACCESS_TOKEN` / `GOOGLE_ADS` / `OPENAI_API_KEY` added; no OAuth/webhook/external
  URL/fetch/axios introduced; no upload/publish/post/ads/launch/activate/sync; auto-post
  only negated; no Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination in the diff.

## Risk / follow-up

- Low risk: one new pure builder + one self-contained panel + three pass-through props;
  the approval state machine, repositories, routing, RLS, and CampaignWorkspace's
  stateless contract are untouched.
- Optional next: pack-history persistence and a per-campaign "ready to hand off" badge;
  cross-device manual-delivery sync (still Owner-gated, needs a table + scoped RLS).

## Recommendation: **PASS** — Owner-approved; committed and pushed to `origin/main`.
