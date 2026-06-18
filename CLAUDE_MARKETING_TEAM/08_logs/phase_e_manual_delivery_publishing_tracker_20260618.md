# Phase E — Manual Delivery / Publishing Tracker UI

**Date:** 2026-06-18
**Status:** ✅ DONE / PASS
**Scope:** A SAFE, internal, **manual** tracker so the Owner/staff can record what
happened to an approved output *after* approval (delivered to client, manually
posted outside Core, etc.). **This is NOT automation — Core never posts,
schedules, launches, spends, or contacts any external platform.**

---

## 1. Design decision — why a separate local store

Per the Phase E constraints ("prefer metadata/local existing structures over
schema changes", "no repository routing/auth/RLS changes", "no external API
calls"), the manual delivery state is stored in a **dedicated browser localStorage
key** (`core_agency_manual_delivery_v1`), keyed by approval request id, completely
independent of:

- the approval state machine (`ContentApprovalRequest.status` is never touched),
- the repositories / Supabase / RLS (no read or write),
- any network call.

This keeps the tracker a pure internal note. It does **not** add a DB schema,
does **not** change auth/routing/RLS, and does **not** touch the n8n workflow JSON.
The store's mutators are pure (return a new map) and unit-tested.

---

## 2. What was implemented (E1–E6)

### E1 — Manual delivery status labels ✅
Five states (`manualDelivery.ts`): **Not delivered** · **Ready for manual
delivery** · **Delivered to client** · **Manually posted outside Core** ·
**Archived / no action**. Shown as a colored `DeliveryChip` on list cards (only
when set to a non-default state, to avoid noise) and in the detail tracker.

### E2 — Safe manual action controls ✅
In the detail view (owner/manager only — `canApprove`):
- Set status buttons: Ready for manual delivery / Delivered to client / Manually
  posted outside Core / Archived.
- **Add manual post/reference link** (text input + Save).
- **Add delivery note** (textarea + Save).
- **Clear/reset** manual delivery status (removes the record).
All controls update **only** the local delivery store. None calls an external
platform. None publishes, schedules, launches, or spends. Viewers see read-only.

### E3 — Approved ≠ Published messaging ✅
- Approved items: **"Approved for internal use. Not published or launched by Core."**
- When status = manually posted: **"Marked as manually posted outside Core by
  Owner/staff."** + "Core did not post, schedule, launch, or spend." Core is never
  implied to have posted anything.

### E4 — Delivery tracker filters ✅
New **Manual delivery view** dropdown (UI-only): All delivery · Approved · not
delivered · Delivered to client · Manually posted outside Core · Pending approval
· Needs revision. Implemented via the pure `matchesDeliveryView()` helper, ANDed
with the existing status/module/source/scope/search filters; the "Clear" control
resets it.

### E5 — Detail view "Manual Delivery Tracker" section ✅
A dedicated panel showing: current delivery status, manual post/reference link
(clickable **only** for safe http/https URLs via `isSafeHttpLink` — otherwise
shown as plain text and never opened by Core), delivery note, last-updated
timestamp + actor, and the safety note **"Core does not auto-post or launch ads."**

### E6 — Docs/logs ✅
This file.

---

## 3. Files changed

| File | Change |
|------|--------|
| `src/lib/core/manualDelivery.ts` | **New.** Local tracker store: types/labels/colors, `loadManualDelivery`/`saveManualDelivery` (localStorage only), pure mutators (`setDeliveryStatus`/`setDeliveryLink`/`setDeliveryNote`/`clearDelivery`), getters, and `isSafeHttpLink` (http/https only). No network, no Supabase, no schema. |
| `src/lib/core/manualDelivery.test.ts` | **New.** 10 unit tests: defaults, status/link/note upsert + immutability, trim/drop-empty, clear/reset, link safety (rejects `javascript:`/`data:`/non-URL), labels. |
| `src/components/core/ApprovalsTab.tsx` | Owns the delivery state via localStorage (no App.tsx change). Added `DeliveryChip` (E1), `ManualDeliveryTracker` section + safe controls (E2/E5), manually-posted + approved messaging (E3), the delivery-view filter (E4). Mutating controls gated to `canApprove`. |

No App.tsx change, no new CSS class, no new dependency. n8n workflow JSON, repos,
RLS, auth, env, secrets — all untouched.

---

## 4. Validation results

- **`npm run build`** — ✅ PASS. 1583 modules, entry `index.js` 357.71 kB
  (gzip 89.68), **no >500 kB warning**, 0 TS errors. ApprovalsTab chunk 36→45 kB.
- **`npm run test`** — ✅ **100/100 PASS** (was 90; +10 from `manualDelivery.test.ts`).
- **`node contracts/tools/validate_contracts.js`** — ✅ ALL PASS.
- **`git diff --check HEAD^ HEAD`** — clean (run at commit time).
- **Secrets / webhook / connector scan** of changed files — clean.

---

## 5. Safety assessment — all rules preserved

| Rule | Status |
|------|--------|
| Approval-first mandatory | ✅ Approval state machine untouched; delivery store is separate. |
| Approved ≠ Published clear | ✅ "Approved for internal use. Not published or launched by Core." |
| No auto-post | ✅ Manual record only; "manually posted" = a human did it outside Core. |
| No auto-ads | ✅ None. |
| No publish/schedule/launch/spend automation | ✅ Controls only write local notes. |
| No live platform connectors | ✅ None; the reference link is text — Core never opens/fetches it. |
| No image/video generation | ✅ None. |
| No live analytics pull | ✅ None. |
| No unverified/fake metrics | ✅ Free-text notes only; no numbers introduced. |
| OpenAI key only in n8n Credentials | ✅ Untouched. |
| No secrets / real webhook URLs / env values committed | ✅ Scan clean. |
| No n8n workflow JSON changed | ✅ Not touched. |
| Repository routing / auth / RLS unchanged | ✅ Not touched. |
| Existing tests + approval semantics preserved | ✅ All prior tests pass; semantics unchanged. |

**Manual safety check:** PASS — no auto-post, no auto-ads, no publish/schedule/
launch/spend automation, no live connectors, no image/video generation, no live
analytics pull, no unverified/fake metrics, Approved ≠ Published remains clear,
"manually posted" means outside Core only, no secrets/webhook URLs/env committed.

---

## 6. Notes / limitations
- The manual delivery tracker is **browser-local** (per-device localStorage). It is
  intentionally not synced to the DB to avoid schema/RLS changes this phase. If
  cross-device/multi-user delivery tracking is needed later, that is a separate,
  Owner-gated phase requiring a `manual_delivery` table + scoped RLS (plan only).
- Reference links are stored as text; only `http(s)` URLs render as clickable
  links (`isSafeHttpLink`). Core never fetches or pings them.
