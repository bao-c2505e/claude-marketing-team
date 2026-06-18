# Phase G — Client Feedback / Revision Loop UI

**Date:** 2026-06-18 (Local)
**Status:** ✅ DONE / PASS
**Builder:** Claude Code (PC1) — Core Product Builder

---

## 1. Goal

Add a SAFE internal client feedback + revision loop UI. After a handoff pack is
prepared/delivered manually, the Owner can record client feedback, classify it,
and create internal revision notes for follow-up. Manual/internal only:

- ❌ No emails / no messaging
- ❌ No n8n call / no OpenAI trigger / no AI regeneration
- ❌ No platform posting / no ads launch / no spend
- ❌ No external connectors / no live analytics
- ❌ Feedback NEVER mutates approval state automatically

---

## 2. Files changed

| File | Type | Purpose |
|------|------|---------|
| `src/lib/core/clientFeedback.ts` | **new** | Pure store: enums/labels, `ClientFeedbackRecord`, localStorage load/save (`core_agency_client_feedback_v1`), pure mutators (`addFeedback`/`updateFeedback`/`setFeedbackStatus`/`deleteFeedback` — return new map), filters (`feedbackMatches`/`filterFeedback`), revision-note builder (`buildRevisionNote`), verbatim safety constants. No network, no DB, no approval mutation. |
| `src/lib/core/clientFeedback.test.ts` | **new** | 17 unit + safety-regression tests. |
| `src/components/core/FeedbackRevisionTab.tsx` | **new** | G1–G5 UI: record feedback, link to approved item/handoff, filters, revision-note preview + copy + local download. |
| `src/App.tsx` | modified | `MessageSquare` icon, `lazy()` import, owner/manager-gated sidebar nav button, render block, `'client-feedback'` added to `ownerOnlyTabs`. No state/handler/repo/routing change. |

**Not touched:** repositories, Supabase wiring, RLS, auth, approval state machine,
content/asset/approval stores, n8n workflow JSON, contracts, env, secrets.

---

## 3. G1–G6 implementation

- **G1 — Feedback / Revision section:** new "Feedback & Revision" tab (internal,
  owner/manager only). Each feedback record has: client note, **source**
  (manual note / call / chat / meeting / other), **type** (copy / design / video /
  ads / report / general edit), **priority** (low / normal / high), **status**
  (open / in review / resolved / archived). Browser localStorage state, mirroring
  the Phase E manual-delivery tracker — no DB/RLS/auth/repo change.
- **G2 — Link feedback to items:** feedback can be linked to an **approved output
  item** (via the existing approval request id, list built from
  `collectHandoffCandidates`) and/or a free-text **handoff pack reference**.
  Module/type (Content/Design/Video/Ads/Report) is derived from the linked item
  or the feedback type. Linking uses existing ids/metadata only and **never
  mutates approval status**.
- **G3 — Revision note builder:** `buildRevisionNote()` renders a safe preview —
  original item title/module, client feedback summary, internal revision
  instructions, owner note, and the safety note
  "This revision note is internal. Core did not send, publish, schedule, launch, or spend."
  No AI/n8n is called; nothing is regenerated. Copy-to-clipboard + local .md/.txt
  download (Blob only).
- **G4 — Filters:** UI-only view tabs (All / Open / In review / Resolved /
  Archived / High priority) + a module/type dropdown, via the pure
  `feedbackMatches`/`filterFeedback` helpers. No data invented.
- **G5 — Approved ≠ Published / Handoff ≠ Sent copy:** explicit in the banner and
  the safety panel — "Approved means approved for internal handoff only.",
  "Handoff pack means prepared/exported manually, not sent automatically.",
  "Core does not email, message, publish, schedule, launch ads, or spend."
- **G6 — Docs/logs:** this log + `phase_log.md` entry.

---

## 4. Validation

| Check | Result |
|-------|--------|
| `npm run build` (tsc + vite) | ✅ PASS — 0 TS errors, no >500 kB warning; new `FeedbackRevisionTab` chunk 20.94 kB |
| `npm run test` (vitest) | ✅ PASS — **11 files / 135 tests** (was 10 / 118; +17 clientFeedback) |
| `node contracts/tools/validate_contracts.js` | ✅ ALL PASS |
| `git diff --check` | ✅ clean |
| Network / AI / n8n / connector / email / messaging scan (new files) | ✅ only safety-copy negation strings — no `fetch`/`axios`/`.post(http`/`openai`/`n8n` call/`sendmail`/image-video gen |
| localStorage writes | ✅ only the dedicated `core_agency_client_feedback_v1` store |
| Secrets / URL scan | ✅ clean |

---

## 5. Safety assessment

- **Approval-first preserved / approval untouched:** the feedback store is fully
  independent of the approval state machine and repositories. Recording or
  resolving feedback NEVER changes `approval_status`. Approval decisions stay in
  the Approval Queue, by authenticated Core UI action only.
- **Approved ≠ Published / Handoff ≠ Sent:** explicit copy in the UI and on every
  revision note.
- **No emails / no messaging / no n8n / no OpenAI / no AI regeneration:** the
  builder only formats recorded text; there is no network call of any kind.
- **No auto-post / auto-ads / publish / schedule / launch / spend:** the only side
  effects are localStorage writes (feedback store), a clipboard write, and a local
  file download.
- **No live connectors, no image/video generation, no live analytics, no fake
  metrics.**
- **Secrets:** none committed; OpenAI key untouched (stays in n8n Credentials);
  n8n workflow JSON unchanged; no env/webhook change.
- **Permissions:** internal-only — nav gated to owner/manager, `ownerOnlyTabs`
  redirects client view to dashboard, and the component gates view to
  owner/manager and edit to `can.approveContent` (owner/manager).

---

## 6. Limitations / notes

- Feedback is browser-local per-device (same intentional trade-off as Phase E) to
  avoid DB schema/RLS this phase. Cross-device sync and AI-assisted revision
  generation are future Owner-gated phases (would need a `client_feedback` table +
  scoped RLS per the V2-D2 Checkpoint C/D policy).
