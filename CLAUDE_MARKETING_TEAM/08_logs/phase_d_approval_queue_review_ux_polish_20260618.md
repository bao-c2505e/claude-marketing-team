# Phase D — Approval Queue / Output Review UX Polish

**Date:** 2026-06-18
**Status:** ✅ DONE / PASS
**Scope:** Display-only review-UX polish for the Approval Queue now that all 5 AI
Factory V1 modules (Content / Design / Video / Ads / Report) produce real pending
approval items. **No changes to the approval state machine, repositories, routing,
Supabase RLS, auth, webhook URLs, env, credentials, or n8n workflows.**

---

## 0. Phase C — Production Smoke Test PASS Rollup (carry-over)

Phase C (`f82bec7`) manually activated the Phase B FnB prompt quality in the
production n8n OpenAI node(s). Owner-run production smoke test results:

| Module | Result | Evidence | Safety |
|--------|--------|----------|--------|
| Content Factory V1 | ✅ PASS | 7 pending-approval items created via n8n AI Provider | Nothing posted or launched |
| Design Factory V1   | ✅ PASS | 5 design-brief approval items via n8n AI Provider | Nothing posted or launched |
| Video Scripts V1    | ✅ PASS | 5 video-script approval items via n8n AI Provider | Nothing posted or launched |
| Ads Pack Draft V1   | ✅ PASS | 5 ads-draft approval items via n8n AI Provider | No ads created/launched/scheduled/spent |
| Report Draft V1     | ✅ PASS | 5 report-draft approval items via n8n AI Provider | No live analytics pull; provided/simulated/missing data labelled correctly; no fake metrics |

All 5 modules produced **drafts pending approval only** — none published, launched,
scheduled, or spent. This is the data that Phase D's review UX is built to inspect.

---

## 1. What was improved (D1–D5)

### D1 — Module-specific preview headers and labels ✅
- The detail content-preview header previously read a generic
  `Content Preview — Day X · <channel>` for **every** module.
- Now driven by `modulePreviewLabel(module)`:
  - Content → **Content Preview**
  - Design → **Design Brief Preview**
  - Video → **Video Script Preview**
  - Ads → **Ads Draft Preview**
  - Report → **Report Draft Preview**
  - Fallback → **Output Preview**
- The module is detected from existing item signals (the `workflow_type` metadata
  the factory appends, then the structured `content_type`), so the helper works
  for **all** approval items, not a single test item.

### D2 — Approval Queue filters ✅
- Already present from Phase A2: status tabs (All / Pending / Approved / Needs
  revision / Rejected), search (title/client/brand/campaign), module filter,
  client/brand/campaign scope filters, priority filter, and a "Hide local/demo"
  display-only toggle.
- **Added in Phase D:** an explicit **Source** filter (`All sources` / `n8n AI
  Provider` / `Local demo` / `Legacy / mock`) wired into the existing scope filter.
- All filters are UI-only and safe — no schema change, no fake data, no live
  analytics. Filters that depend on missing data degrade gracefully (e.g. a
  metadata-less legacy item classifies as `Other / Legacy` rather than erroring).

### D3 — Detail view layout per output type ✅
- The full caption used to be dumped into the preview, **including** the raw
  `--- / <Module> V1 metadata:` block. Now `splitCaption()` separates:
  - the **human-readable content body** (rendered in the preview), and
  - the **provenance + safety metadata** (rendered in a dedicated panel).
- Shared `ContentPlanItem` fields are relabelled per module via
  `moduleFieldLabels(module)` — e.g. Video headline → "Hook (0–3s)", Design CTA →
  "Handoff / Output Note", Report visual → "Focus / Key Observation". **No fields
  are invented** — only existing fields (hook/caption/visual_brief/cta/hashtags,
  plus pillar/angle/channel/day/planned_date chips) are renamed for clarity.
- New **Provenance & Safety** panel parses the draft's own metadata
  (`parseItemMetadata()`): workflow / source / mode / status / owner-approval, plus
  the `safety:` flags rendered as chips (e.g. `no_auto_post=true`,
  `no_live_analytics_pull=true`). All read-only; nothing editable or live.

### D4 — "Approved ≠ Published" made clearer ✅
- Approved detail view now states verbatim: **"Approved for internal use. Not
  published or launched."** (followed by the unchanged "unlocked the next workflow
  stage only — nothing was posted, scheduled, sent to ads, or spent").
- Approved list cards now read **"· internal use — not published or launched"**.
- No publish/launch/schedule/spend button was added. Published/launched/spent
  status remains absent throughout.

### D5 — Docs/logs ✅
- This file: Phase C smoke-test PASS rollup + Phase D implementation summary +
  safety assessment + files changed + validation results.

---

## 2. Files changed

| File | Change |
|------|--------|
| `src/lib/core/approvalClassify.ts` | **New.** Extracted the Phase A2 classifier (`classifyRequest`, `MODULE_META`, `SOURCE_META`, `readMetaLine`) verbatim out of `ApprovalsTab.tsx`, and added Phase D helpers: `modulePreviewLabel` (D1), `splitCaption` + `parseItemMetadata` (D3), `moduleFieldLabels` (D3). All read-only, pure functions. `MODULE_META` gained a `previewLabel` field. |
| `src/lib/core/approvalClassify.test.ts` | **New.** 15 unit tests: classification by workflow_type / content_type / fallback, source detection (n8n/local/legacy), preview labels incl. fallback, caption split, metadata + safety-flag parse, per-module field labels. |
| `src/components/core/ApprovalsTab.tsx` | Import the extracted helpers (removed the inline copies — no behaviour change). Added the **Source** filter (D2). Rewrote the detail content preview: module-aware header (D1), per-module field labels + clean body + **Provenance & Safety** panel (D3). Strengthened the approved label (D4). Added a small `MetaChip` display helper. |

No other files touched. No CSS classes added (reused existing `.appr-*` + inline
styles, consistent with the file). No new dependencies.

---

## 3. Validation results

- **`npm run build`** — ✅ PASS. 1583 modules, entry `index.js` 357.71 kB
  (gzip 89.68), **no >500 kB warning**, 0 TS errors.
- **`npm run test`** — ✅ **90/90 PASS** (was 75; +15 from `approvalClassify.test.ts`).
- **`node contracts/tools/validate_contracts.js`** — ✅ ALL CONTRACT VALIDATION
  CHECKS PASSED.
- **`git diff --check`** — clean.
- **Secrets / webhook scan** of changed files — clean (no API keys, no live
  webhook URLs).

---

## 4. Safety assessment — all rules preserved

| Rule | Status |
|------|--------|
| Approval-first mandatory | ✅ Unchanged — all changes are display-only; submit/approve/reject/revision/cancel handlers and the state machine are untouched. |
| Approved ≠ Published clear | ✅ Strengthened (D4) — explicit "Approved for internal use. Not published or launched." label. |
| No auto-post | ✅ No posting code added. |
| No auto-ads | ✅ No ads code added. |
| No publish/schedule/launch/spend behaviour | ✅ None added; no publish button added. |
| No live platform connectors | ✅ None added. |
| No image/video generation | ✅ None added. |
| No live analytics pull | ✅ None added; Report drafts still labelled provided/simulated/missing. |
| No unverified/fake metrics | ✅ None introduced; the preview renders only existing draft fields, inventing nothing. |
| OpenAI key only in n8n Credentials | ✅ Untouched. |
| No secrets / real webhook URLs committed | ✅ Scan clean. |
| n8n workflow JSON unchanged | ✅ Not touched. |
| Supabase RLS / auth / routing / env unchanged | ✅ Not touched. |

**Manual safety check:** PASS — no auto-post, no auto-ads, no publish/schedule/
launch/spend, no live connectors, no live analytics pull, no unverified/fake
metrics, Approved ≠ Published remains clear, no secrets/webhook URLs committed.

---

## 5. Notes / follow-ups
- The extracted `approvalClassify.ts` is now reusable by the Command Center
  (Phase A1) and any future surface that needs module/source classification.
- `splitCaption()`/`parseItemMetadata()` rely on the factory metadata convention
  (`--- / <Module> V1 metadata:` + `key: value` lines). If a future factory
  changes that block format, update the marker logic and its tests together.
