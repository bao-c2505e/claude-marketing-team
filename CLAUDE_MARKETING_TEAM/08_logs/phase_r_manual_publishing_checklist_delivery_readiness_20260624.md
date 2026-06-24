# Phase R — Manual Publishing Checklist & Delivery Readiness

**Date:** 2026-06-24
**Builder:** Claude Code (PC1)
**Scope:** A SAFE, **read-only** readiness layer ON TOP of the Phase Q Campaign Pack so the
Owner/team can SEE whether ONE campaign's Owner-**APPROVED** deliverables are ready to be
**manually published** — **without performing any publishing action**. New pure builder +
a read-only panel surfaced inside the Campaign Production Workspace (Phase K). Additive,
local-only. **No publishing**, no approval-state change, no live connector, webhook,
secret, or env change. **This is manual-publishing readiness only, not real publishing.**

## What changed

### `src/lib/core/manualPublishingChecklist.ts` (new — pure, read-only)
- `buildManualPublishingChecklist()` derives a checklist from the Phase Q data shapes
  (`CampaignPackContext` + `CampaignPackItem[]`, optional campaign `approvalRequests`) —
  no connectors, no network, no storage. Reuses `approvalClassify` (`splitCaption`,
  `ModuleKey`) and the standing `APPROVED_NOT_PUBLISHED_REMINDER` from `brandBrain`.
- **Eight deterministic sections:** Owner Approval · Approved ≠ Published Safety · Copy &
  Captions · Creative Assets / Design Briefs · Channel Formatting · Manual Publishing Prep ·
  Client Handoff · Metrics & Claims Disclaimer.
- **Item shape:** `id`, `label`, `description`, `status` (`ready` /
  `needs_owner_review` / `blocked` / `manual_action_required`), `severity` (`info` /
  `warning` / `critical`), `owner` (`owner` / `internal_team` / `client`), `source_label`,
  `action_hint`.
- **Campaign-level `summary`:** `total_items`, `ready_count`, `blocked_count`,
  `needs_owner_review_count`, `manual_action_required_count`, `overall_status`
  (`ready_for_manual_publishing` / `needs_review_before_manual_publishing` / `blocked`),
  and an explicit `safety_notice` = `MANUAL_PUBLISHING_SAFETY_NOTICE` ("Approved ≠
  Published. Core never auto-posts, auto-launches, schedules, or spends — every channel
  must be published manually by the Owner/team after approval.").
- **Readiness rule:** a hard `blocked` item ⇒ `blocked`; any `needs_owner_review` ⇒
  `needs_review_before_manual_publishing`; otherwise `ready_for_manual_publishing`.
  `manual_action_required` items are the EXPECTED human publish steps and never block
  readiness (publishing is still a manual step).
- `renderManualPublishingChecklistText()` — pure string render for the "Copy manual
  checklist" CTA (carries the safety notice + `MANUAL_PUBLISHING_ONLY_NOTE`); never
  touches clipboard/DOM/network.

### `src/components/core/ManualPublishingChecklistPanel.tsx` (new — read-only panel)
- Resolves the SAME campaign context + APPROVED deliverables as the Campaign Pack
  (`resolveCampaignPackContext` + `collectCampaignPackItems`, delivery map irrelevant ⇒
  `{}`), then renders the checklist sections + readiness summary.
- Carries **"Approved ≠ Published"** + **"No auto-posting. Owner/team must publish
  manually."** in a standing safety banner.
- CTAs are **copy + local note only**: **"Copy manual checklist"** (clipboard) and **"Mark
  ready for manual handoff"** — the latter is a LOCAL acknowledgement (a local `useState`
  flag), enabled only when `overall_status === ready_for_manual_publishing`; it records
  nothing externally, sends nothing, persists nothing, and never publishes. **No real
  Publish button.**
- It lives in a **separate component on purpose** so the parent `CampaignWorkspace` stays
  stateless / display-only (Phase K source-scan contract holds).

### `src/components/core/CampaignWorkspace.tsx` (additive)
- Renders `<ManualPublishingChecklistPanel>` after `<CampaignPackPanel>`, threading the
  same already-available props (`campaign`, `client`, `brand`, `brief→briefs`,
  `contentItems`, `approvals→approvalRequests`, `approvalEvents`, `userRole`,
  `actorLabel`). Component remains stateless — no `App.tsx`/routing/RLS/state-machine
  change needed.

## Tests

- **`src/lib/core/manualPublishingChecklist.test.ts`** (new — 17 tests): all eight
  sections in canonical order; every item carries the required deterministic fields;
  summary counts add to `total_items`; **approved pack is ready for MANUAL publishing,
  never marked published/launched**; explicit Approved ≠ Published item + summary notice;
  **missing owner approval ⇒ blocked**; pending approval ⇒ needs-review; **missing
  caption ⇒ blocked**, **empty design brief ⇒ needs-review**; final creative always
  manual; **metrics disclaimer present when metrics absent**, report labels ⇒ manual
  when a report draft is in the pack; channel listing + brand-channel fallback; manual
  publish framing; **safety regression** (no `publish now` / `auto publish` / `run ads` /
  `launch campaign` / bare auto-post / webhook / URL / OAuth / token); copyable render.
- **`src/components/core/ManualPublishingChecklistPanel.source.test.ts`** (new — 9
  source-scan tests): renders the checklist surface; keeps Approved ≠ Published +
  manual-only language; uses the pure builder over approved-only items; only allowed
  CTAs (copy + local handoff, no `publish now` / `auto publish` / `run ads` / `launch
  campaign` / `launch ad` / `go live` / `post to`); clipboard only, no fetch/axios/XHR;
  mutates no approval/delivery/persisted state; auto-post only negated; no
  URL/OAuth/webhook/token; no off-domain contamination.

## Safety guarantees (CLAUDE.md §4)

- **Approval-first.** The checklist is derived only from items in status **exactly
  `approved`** for the chosen campaign; building it **never** changes any approval state.
- **Approved ≠ Published.** The summary `safety_notice` + a standing checklist item + the
  panel banner all state Approved ≠ Published verbatim; readiness tops out at
  **ready_for_manual_publishing** — never a published/launched state.
- **No auto-post / no auto-ads / no spend.** No posting/scheduling/launch/spend path
  exists. "Mark ready for manual handoff" is a local acknowledgement only; publishing is a
  separate manual human step OUTSIDE Core. Source-scan bans affirmative publish/launch/
  post wording and un-negated auto-post.
- **No fake metrics.** The Metrics & Claims Disclaimer section always carries a
  no-fabricated-metrics item; report drafts ⇒ a manual "verify data labels (Provided /
  Simulated / Missing / Owner input required)" step. No metric is invented.
- **No secrets / no live connector / no webhook / no env change.** No keys/URLs/webhook/
  `fetch`/`axios`/`process.env`/`import.meta.env`; pure local read + clipboard copy.
- **Dry-run/sandbox** — N/A: no connector is touched.

## Validation

- **`npm test`** — PASS **32 files / 342 tests** (+2 files / +26 tests vs 30/316).
- **`npm run build`** — PASS (tsc + vite; 0 TS errors; no >500 kB warning; entry `index`
  376.11 kB; `CampaignWorkspace` chunk 55.42 kB now includes the readiness panel).
- **`git status --short`** — only intentional changes: new `manualPublishingChecklist.ts`
  + `manualPublishingChecklist.test.ts` + `ManualPublishingChecklistPanel.tsx` +
  `ManualPublishingChecklistPanel.source.test.ts`, `M CampaignWorkspace.tsx`, plus this
  log + `phase_log.md`.
- **Safety search** — no `webhook` / `https://` / `OAuth` / `access_token` / `api_key` /
  `process.env` / `import.meta.env` / `CANVA_*` / `META_ACCESS_TOKEN` /
  `TIKTOK_ACCESS_TOKEN` / `ZALO_ACCESS_TOKEN` / `GOOGLE_ADS` introduced; no fetch/axios/XHR;
  no affirmative publish/launch/run-ads wording; auto-post only negated; no
  Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination.

## Risk / follow-up

- Low risk: one new pure builder + one read-only panel + one render in the already-stateful
  child slot; the approval state machine, repositories, routing, RLS, and CampaignWorkspace's
  stateless contract are untouched.
- Optional next: persist the "ready for manual handoff" acknowledgement (still Owner-gated,
  needs a table + scoped RLS); a per-campaign readiness badge in the workspace header.

## Recommendation: **PASS** — manual-publishing readiness only (not real publishing);
awaiting Owner review of the diff before commit.
