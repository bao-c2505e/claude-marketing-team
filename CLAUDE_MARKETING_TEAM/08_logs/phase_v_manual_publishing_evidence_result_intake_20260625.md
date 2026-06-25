# Phase V — Manual Publishing Evidence & Result Intake Room

**Date:** 2026-06-25
**Builder:** Claude Code (PC1)
**Scope:** Add a **SAFE local/demo post-delivery evidence layer** on top of Phase U
(Delivery Closure) and Phase T (Delivery Acceptance). After a delivery has been
accepted/closed, this lets the Owner **manually record** whether the delivered assets
were actually published **outside CORE** — without CORE publishing anything, calling any
connector, opening any external endpoint, pulling any analytics, or creating any link.
New pure model + a self-contained interactive panel. Additive, **local/demo only.**
**CORE does not publish** — every value is **Owner-provided** (or client-provided, or
simulated demo) **evidence**. **Approved ≠ Published** and **Client Accepted ≠ Published**
stay explicit; **"published" only ever means a manual Owner record**;
`scheduled_outside_core` is **NOT published**; result metrics are **never presented as real**
unless **owner/client-provided**. **No real publishing, no ads, no live
Meta/TikTok/Zalo/Google/Canva connector, no real webhook/endpoint, no OAuth/token/API/env,
no live analytics pull, no fake metrics, no approval mutation, no auto-post/auto-ads.**

## What changed

### `src/lib/core/manualPublishingEvidence.ts` (new — pure, deterministic, local/demo)
- **Publish status model:** `PublishStatus` =
  `not_published` · `manually_published` · `scheduled_outside_core` · `blocked_or_cancelled`,
  with label/color/description maps. There is deliberately **NO Core-set
  `published`/`launched` state** — the only status meaning "published" is
  `manually_published`, an **Owner annotation** that a person published OUTSIDE CORE.
  Predicates `isManuallyPublished` / `isScheduledNotPublished` / `isPublishedRecord` keep the
  rule in one place: **only `manually_published` counts as published; `scheduled_outside_core`
  explicitly does not.**
- **Result data source + metrics:** `ResultDataSource` =
  `not_provided` · `owner_provided` · `client_provided` · `simulated_demo`;
  `ResultMetricKey` = `reach` · `impressions` · `engagement` · `messages` · `leads` ·
  `orders` · `revenue` (all optional, manual-only). `metricsRealClaimAllowed(source)` is true
  **only** for owner/client-provided; `metricsPresentation(source, metrics)` →
  `none` | `manual_provided_real` | `simulated_or_unverified` so the UI/report can label
  provenance and never present simulated/unverified numbers as real.
- **Evidence record + pure mutators:** `ManualPublishingEvidence`
  (`campaignId`, optional `contentItemId`, `channel`, `publishStatus`, optional
  `publishedAt` / `manualScheduledAt` / `publishedBy` / `publicUrl` / `evidenceNote`,
  `resultDataSource`, optional `metrics`, `notes`, structural **`local_mock: true`**,
  timestamps). `createEvidence` / `addEvidence` / `updateEvidence` / `setEvidenceStatus` /
  `removeEvidence` / `listEvidence` (newest-first) — each returns a **NEW array** (no in-place
  mutation); `cleanMetrics` keeps only finite, non-negative numbers. A recorded `publicUrl` is
  **Owner-pasted evidence data, never a link Core created**.
- **Validation (`validateEvidence`)** — fixed, pure rules: **`manually_published` requires
  channel/platform + `publishedBy` + (evidence note **or** public URL)** (blocking errors);
  **`scheduled_outside_core` warns it is NOT published** (advisory, never a published record);
  **metrics that are simulated/not-provided warn they must NOT be presented as real**. Returns
  `{ ok, errors, warnings, metrics_presentation, metrics_real_claim_allowed,
  is_published_record, is_scheduled_not_published }`.
- **Post-publish report draft (`buildPublishingEvidenceReport`)** — summarizes **only what was
  manually recorded**: per-status counts, per-row metric cells with provenance labels, missing
  data flags, `rows_with_real_metrics_count` / `has_any_real_metrics`, the standing notices
  (CORE does not publish · No live analytics connected · Manual evidence only · Approved ≠
  Published · Client Accepted ≠ Published), and structural **`core_published: false`**.
- **Verbatim safety copy:** `EVIDENCE_CORE_DOES_NOT_PUBLISH` (**"CORE does not publish. This is
  Owner-provided evidence only."**), `EVIDENCE_NO_LIVE_ANALYTICS` (**"No live analytics
  connected."**), `EVIDENCE_MANUAL_ONLY` (**"Manual evidence only."**),
  `EVIDENCE_APPROVED_NOT_PUBLISHED`, `EVIDENCE_CLIENT_ACCEPTED_NOT_PUBLISHED`,
  `EVIDENCE_PUBLISHED_MEANS_MANUAL`, `EVIDENCE_SAFETY_NOTE`, `EVIDENCE_LOCAL_ONLY_BADGES`.
- **`renderPublishingEvidenceReportText(report, title?)`** — pure copyable summary that prints
  the status summary, evidence rows (with simulated metrics explicitly labeled **SIMULATED /
  UNVERIFIED, not real**), missing/incomplete flags, and the safety lines; emits **no
  system-created URL/link** (any URL printed is the Owner-provided evidence value).
- **Deterministic mock seed `sampleManualPublishingEvidence(campaignId?, now?)`** — FnB samples
  (Vị Cuốn): one `manually_published` with owner-provided metrics + a scheme-less sample
  `publicUrl`, one `scheduled_outside_core` (not published), one simulated-demo metrics row.
  Author/URL values are explicitly **`(sample)`** and never real identities/links.

### `src/components/core/ManualPublishingEvidencePanel.tsx` (new — self-contained interactive panel)
- Holds the evidence list in **local React state**, seeded by
  `sampleManualPublishingEvidence(campaign.id)`. No persistence, no network.
- **Four required surfaces:** **Publishing status** summary (per-status badges + Add evidence
  row) · per-row **Evidence / URL / screenshot note** inputs (`publicUrl` labeled
  *Owner-provided evidence*, screenshot/evidence note) · **Manual result intake** (result data
  source select + the 7 metric number inputs, badged *May show as provided data* vs *Simulated
  / unverified — not real*) · **Post-Publish Report Draft** (per-row provenance + missing-data
  flags + standing notices).
- **Per-row validation** is shown inline: blocking errors (red) for incomplete
  `manually_published`, advisories (amber) for scheduled-not-published and
  simulated/unverified metrics.
- **Visible safety surface:** local/demo badges (`Local/demo state only` · `No publishing by
  CORE` · `No live analytics` · `No connector used` · `Not Published by CORE`) + a banner with
  **"CORE does not publish. This is Owner-provided evidence only."** + **"No live analytics
  connected."** + **"Manual evidence only."** + **"Approved ≠ Published. Client Accepted ≠
  Published."**
- Local helper actions only: **Copy evidence report** (clipboard, gated by `can.exportPacks`)
  + **Preview evidence report** (local read-only textarea). No real Publish/Send/Notify/Launch
  button, no share/public URL created by CORE, no network call. Separate component so the
  parent `CampaignWorkspace` stays stateless.

### `src/components/core/CampaignWorkspace.tsx` (additive)
- Renders `<ManualPublishingEvidencePanel>` directly after `<DeliveryClosurePanel>` (Phase U),
  threading the already-available `campaign` / `userRole` / `actorLabel` props. Component stays
  stateless — no `App.tsx`/routing/RLS/state-machine change; header comment updated to document
  the Phase V surface.

## Tests

- **`src/lib/core/manualPublishingEvidence.test.ts`** (new — 24 tests): status model exposes
  exactly the four manual statuses with **no Core-set `published`/`launched`**; **only
  `manually_published` is a published record — `scheduled_outside_core` is not**; pure mutators
  (add/update/set-status/remove/list) return new arrays + clean metrics + no-op on unknown ids;
  **report is always `core_published:false`** and carries both ≠-published notices; a scheduled
  row is not counted as published; **`manually_published` validation requires channel +
  publishedBy + (note or public URL)**; metrics source labeling
  (`metricsRealClaimAllowed`/`metricsPresentation`, simulated/not-provided warn *must NOT be
  presented as real*, owner/client provided allowed); report rows label provenance + flag
  missing metrics; **render copy safety** (required notices, "Scheduled outside CORE (NOT
  published)", simulated metrics labeled, template emits no URL/webhook/token/connector/analytics
  call, auto-post/auto-ads only negated, Owner-provided URL passed through as labeled evidence,
  no contamination); deterministic local-only sample.
- **`src/components/core/ManualPublishingEvidencePanel.source.test.ts`** (new — 14 source-scan
  tests): renders the Manual Publishing Evidence local/demo surface; shows local-only badges +
  Not Published by CORE + the CORE-does-not-publish / no-live-analytics / manual-only / ≠-published
  copy; composes the pure evidence model; surfaces the four required sections; **`publicUrl` is an
  Owner-provided evidence field with no literal URL in source**; metrics labeled by source; only
  local CTAs (copy/preview), no publish-now/auto-publish/run-ads/launch/go-live/post-to/
  send-to-client/notify-client/create-share-link; clipboard only, no fetch/axios/XHR; mutates no
  approval/delivery/persisted state (no `localStorage.setItem`); auto-post/auto-ads only negated,
  no auto-approve; no URL/login/endpoint/token/share-url/email-send; no live-analytics pull; no
  off-domain contamination.

## Safety guarantees (CLAUDE.md §4)

- **Approval-first.** Recording evidence / setting a publish status **never** mutates approval
  state — approval decisions stay in the Approval Queue. The panel touches no approval data.
- **Approved ≠ Published & Client Accepted ≠ Published (explicit).** Structural
  `core_published: false`; the verbatim "Approved ≠ Published" + "Client Accepted ≠ Published"
  copy is always visible; there is **no Core-set `published`/`launched` state**;
  **`manually_published` is an explicit Owner annotation** (publishing happened **outside CORE**)
  and is **never auto-derived**; **`scheduled_outside_core` is explicitly NOT published.**
- **CORE does not publish — Owner-provided evidence only.** No publishing, no posting, no
  scheduling, no launching, no spending. A recorded `publicUrl` is **Owner-pasted data**, never a
  link Core created or called.
- **No fake metrics / no live analytics.** Result metrics are manual-only; they are presented as
  real **only** when `owner_provided`/`client_provided`, otherwise labeled **simulated /
  unverified**; the report always shows **"No live analytics connected." / "Manual evidence
  only."** and flags missing data.
- **No auto-post / no auto-ads / no spend / no auto-approve.** Helper actions are clipboard +
  local preview only; source scan bans affirmative publish/launch/run-ads/share-url and
  auto-approve wording; every `auto-post`/`auto-ads` appears only **negated**.
- **No secrets / no live connector / no real webhook/endpoint / no env change / no live
  analytics.** No keys/URLs/webhook/`fetch`/`axios`/`process.env`/`import.meta.env`; pure local
  React state + clipboard copy. No dependency added. No contamination
  (Forme/sofa/furniture/nội thất/Fal.ai/ImgBB) — the `webhook`/`OAuth`/`perform*` tokens are
  deliberately avoided in production source.

## Validation

- **`npm run build`** — PASS (tsc + vite; 0 TS errors; no >500 kB warning; entry `index`
  376.11 kB; `CampaignWorkspace` chunk 137.87 kB incl. the Q/R/S/T/U/V panels).
- **`npm test`** — PASS **40 files / 485 tests** (+2 files / +38 vs 38/447). All prior tests
  preserved.
- **Safety search** (new production source `manualPublishingEvidence.ts` +
  `ManualPublishingEvidencePanel.tsx`) — `http(s)`/`www.`/`webhook`/`oauth`/`access_token`/
  `client_secret`/`api_key`/`mailto`/`fetch(`/`axios`/`XHR`/`process.env`/`import.meta.env`/
  `localStorage.setItem`/`fetchAnalytics`/`getAnalytics`/`META_ACCESS`/`TIKTOK_ACCESS`/
  `ZALO_ACCESS`/`GOOGLE_ADS`/`CANVA_*` = **none**; no `'published'`/`'launched'` literal status;
  every auto-post/auto-ads is negated. No `.env`/`package.json`/lockfile change. No off-domain
  contamination.

## Risk / follow-up

- Low risk: one new pure model + one self-contained interactive panel + one render in the
  already-stateful child slot. Approval state machine, repositories, routing, RLS, and
  CampaignWorkspace's stateless contract are untouched.
- Optional next: persist evidence per campaign (still local-only, no real link); roll evidence
  counts into a workspace-header badge; let the Phase U closure panel read the same evidence
  store rather than each panel seeding its own mock; an export-pack section that bundles the
  evidence report alongside the campaign pack.

## Recommendation: **PASS** — local/demo manual publishing evidence + result intake only (CORE
does not publish; Approved/Client-Accepted ≠ Published; "published" = manual Owner record;
scheduled ≠ published; metrics real only when owner/client-provided; no connector, no live
analytics, no auto-publish/auto-ads); awaiting Owner review of the diff before commit.
