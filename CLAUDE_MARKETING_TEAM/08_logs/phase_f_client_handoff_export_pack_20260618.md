# Phase F — Client Handoff / Export Pack UI

**Date:** 2026-06-18 (Local)
**Status:** ✅ DONE / PASS
**Builder:** Claude Code (PC1) — Core Product Builder

---

## 1. Goal

Add a SAFE internal **Client Handoff Pack** UI so the Owner can gather APPROVED
outputs into a client-facing delivery pack for copy / export / review. It is a
manual internal export/copy experience only:

- ❌ No automatic emails
- ❌ No posting to platforms
- ❌ No ad launch / no spend
- ❌ No external connector calls
- ❌ No image/video generation
- ❌ No live analytics fetch

---

## 2. What changed (files)

| File | Type | Purpose |
|------|------|---------|
| `src/lib/core/handoffPack.ts` | **new** | Pure, read-only builder: collect approved candidates, group by client/brand/campaign/module, build Markdown/plain-text pack with verbatim safety copy. No localStorage write, no DB, no network. |
| `src/lib/core/handoffPack.test.ts` | **new** | 18 unit + safety-regression tests. |
| `src/components/core/ClientHandoffTab.tsx` | **new** | F1–F5 UI: grouped approved-output selection, build preview, copy-to-clipboard, local Markdown/text download. |
| `src/App.tsx` | modified | `PackageCheck` icon import, `lazy()` import of the tab, sidebar nav button ("Client Handoff"), render block (`activeTab === 'client-handoff'`). No state/handler/repo/routing change. |

**Not touched:** repositories, Supabase wiring, RLS, auth, approval state machine,
content/asset stores, n8n workflow JSON, contracts, env, secrets.

---

## 3. F1–F6 implementation

- **F1 — Section/tab:** new "Client Handoff" tab. Approved outputs are listed
  grouped by **Client → Brand → Campaign**, with **Module/type** (Content /
  Design / Video / Ads / Report) shown as a per-row badge and used for sorting +
  the module filter. Uses existing approval/output data only (`approvalData` +
  `genData.contentItems`), classified via the existing `approvalClassify` module.
- **F2 — Pack builder:** Owner selects approved items (per-item checkbox, per-group
  select/deselect, select-all/clear) → builds a preview. The pack includes pack
  title, client/brand/campaign overview, included items, module labels, approval
  status, **manual delivery status from Phase E** (read from
  `core_agency_manual_delivery_v1`, read-only), and the safety note
  "This is an internal handoff pack. Core did not publish, launch, schedule, or spend."
- **F3 — Copy/export:** "Copy to clipboard" (with select-the-textarea fallback) +
  "Download .md/.txt" (local browser `Blob` + object URL only — no PDF, no Drive,
  no Gmail, no external API).
- **F4 — Client-safe formatting:** Campaign Overview → module sections (Approved
  Content Items / Design Briefs / Video Scripts / Ads Drafts / Report Drafts /
  Other) → Delivery Notes. Each item shows the clean caption **body only**
  (`splitCaption()` strips the internal metadata block). Report sections carry the
  draft's own data labels (Provided / Simulated / Missing / Owner input required)
  verbatim — **no metrics are invented**, nothing is implied as published/launched.
- **F5 — Approved ≠ Published copy:** every pack carries
  "Approved for handoff. Not published, scheduled, launched, or spent by Core."
  Manually-posted items are labelled
  "Marked as manually posted outside Core by Owner/staff."
- **F6 — Docs/logs:** this log + `phase_log.md` entry.

---

## 4. Validation

| Check | Result |
|-------|--------|
| `npm run build` (tsc + vite) | ✅ PASS — 1586 modules, 0 TS errors, entry 358.43 kB (no >500 kB warning); new `ClientHandoffTab` chunk 21.16 kB |
| `npm run test` (vitest) | ✅ PASS — **118/118** (was 100; +18 handoffPack) |
| `node contracts/tools/validate_contracts.js` | ✅ ALL PASS |
| `git diff --check` | ✅ clean (no whitespace errors) |
| Secrets / webhook URL scan | ✅ clean (new files have none) |
| Network / connector scan (new files) | ✅ no `fetch`/`axios`/`.post(`/connectors/image-video gen — only safety-copy negation strings |
| localStorage writes (new files) | ✅ none — feature is read-only (only `loadManualDelivery()` read) |

---

## 5. Safety assessment

- **Approval-first:** unchanged. Only approval requests with status exactly
  `approved` can become handoff candidates — nothing pending/rejected/revision can
  be handed off.
- **Approved ≠ Published:** explicit, on every pack and in the UI banners/reminders
  ("Not published, scheduled, launched, or spent by Core").
- **Manual posted = outside Core:** echoed from the Phase E manual-delivery record,
  with the verbatim "Marked as manually posted outside Core by Owner/staff." label.
- **No auto-post / auto-ads / publish / schedule / launch / spend automation:**
  the only side effects are an in-memory preview, a clipboard write, and a local
  file download. No state mutation, no scheduling, no spend.
- **No live connectors:** no Meta/TikTok/Zalo/Google Ads/Canva/ComfyUI/Fal.ai/Drive/
  Gmail calls. No HTTP requests at all.
- **No image/video generation; no live analytics pull; no fake metrics:** the pack
  only re-renders existing approved drafts; report data labels are carried verbatim
  from the draft.
- **Secrets:** OpenAI key untouched (stays in n8n Credentials); no secrets, env, or
  webhook URLs committed; n8n workflow JSON unchanged.
- **No DB/RLS/auth/repo/routing change.** Reuses existing `can.viewExportPacks`
  (owner/manager/client view) and `can.exportPacks` (owner/manager build).

---

## 6. Limitations / notes

- Built packs are not persisted (in-memory preview + copy/download only) —
  intentionally avoids any localStorage/DB write this phase. History persistence
  would be a future Owner-gated option.
- Manual delivery status is browser-local per-device (Phase E behaviour), so the
  handoff pack reflects the delivery state recorded on the current device.
