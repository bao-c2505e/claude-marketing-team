# Phase U — Delivery Closure & Manual Publishing Handoff Control

**Date:** 2026-06-25
**Builder:** Claude Code (PC1)
**Scope:** Add a **SAFE local/demo closeout layer** on top of Phase T (Client Feedback
Intake & Delivery Acceptance) and Phase R (Manual Publishing Checklist). After a client
has accepted a delivery, this makes the after-acceptance situation explicit: the
Owner/team can SEE the final closure status, unresolved feedback, manual-publishing
readiness, an external publishing owner, closure notes, and a local audit trail — and
close a campaign delivery **without implying any live connector or automatic publishing**.
New pure model + a self-contained interactive panel. Additive, **local/demo only.**
**Client accepted ≠ Published**, publishing is completed **manually outside CORE**, and
**"manually marked as published" is an explicit operator annotation only** — never
auto-set. **No real share URL, no email, no webhook, no notification, no OAuth/token/API,
no live Meta/TikTok/Zalo/Google/Canva connector, no env/secret, no fake analytics, no
approval mutation, no auto-publish/auto-ads.**

## What changed

### `src/lib/core/deliveryClosure.ts` (new — pure, deterministic, local/demo)
- **Closure status model:** `DeliveryClosureStatus` =
  `not_accepted` · `client_accepted_not_published` · `ready_for_manual_publishing` ·
  `manually_marked_published` · `closed_without_publishing`, with label/color/description
  maps. There is deliberately **NO Core-set `published`/`launched` state** — the only status
  mentioning "published" is `manually_marked_published`, an **operator annotation** that a
  human published OUTSIDE CORE.
- **`deriveClosureStatus(input)`** — a fixed, pure function of explicit inputs
  (acceptance state, Phase R `publishingOverall`, unresolved-feedback count, explicit
  `feedbackCarriedForward`, and the operator's `manualPublishMark`). Terminal states are
  reachable **only** via an explicit `ManualPublishMark` (`marked_published` /
  `closed_unpublished`) — **never inferred**. Without a mark, an accepted delivery is
  `client_accepted_not_published` until the Phase R checklist is ready AND feedback is
  resolved/carried forward, then `ready_for_manual_publishing` — **which is still NOT
  published**.
- **`buildDeliveryClosure(params)`** composes status + acceptance roll-up + feedback
  roll-up (unresolved/resolved counts, `has_open_revision_request`, an
  `unresolved_feedback_warning`) + Phase R readiness + the **6-item manual closure
  checklist** + `checklist_complete` + `ready_to_close` + the manual publish mark +
  external publishing owner + closure notes. Always carries structural **`core_published:
  false`** (Core itself never publishes) and the verbatim safety labels.
- **Manual closure checklist (6 required gates):** `client_acceptance_reviewed`,
  `final_pack_reviewed`, `feedback_resolved_or_carried`,
  `manual_publishing_checklist_reviewed`, `external_publishing_owner_assigned`,
  `external_publishing_status_marked`. Each is a manual confirmation; the owner-assigned
  gate also requires a **named owner**, and the status-marked gate requires an **explicit
  manual mark** (not just a checkbox). Derived advisories warn when feedback is unresolved,
  Phase R isn't ready, no owner is named, or the status isn't marked.
- **Audit trail (pure):** `ClosureAuditEventType` (`client_acceptance_recorded` ·
  `closure_checklist_reviewed` · `ready_for_manual_publishing_marked` ·
  `manually_marked_published` · `closed_without_publishing`); `buildClosureAuditEntry` /
  `appendClosureAudit` (returns a NEW array) / `listClosureAudit` (newest-first). Every
  entry is flagged **`local_mock: true`**. Deterministic `sampleClosureAudit(now?)` seed.
- **Verbatim safety copy:** `CLOSURE_CLIENT_ACCEPTED_NOT_PUBLISHED` (**"Client accepted ≠
  Published."**), `CLOSURE_PUBLISH_OUTSIDE_CORE` (**"Publishing must be completed manually
  outside CORE."**), `CLOSURE_SAFETY_NOTE`, `CLOSURE_NO_AUTOMATION_NOTE` (Core never
  auto-posts / never auto-launches ads), `CLOSURE_LOCAL_ONLY_BADGES`.
- **`renderDeliveryClosureText(view, audit?, title?)`** — pure copyable summary that emits
  **no URL/link**, prints "Not published by CORE", and includes the closure checklist,
  handoff, notes, audit trail, and safety lines.

### `src/components/core/DeliveryClosurePanel.tsx` (new — self-contained interactive panel)
- Holds closure state in **local React state** (acceptance-state selector, checklist
  confirmations, carry-forward toggle, manual publish mark, external publishing owner,
  closure notes, audit list seeded by `sampleClosureAudit`). Resolves the SAME campaign
  context + APPROVED deliverables as Phase Q/R/S/T and builds the Phase R checklist purely
  to read its `overall_status`, and reuses `buildDeliveryAcceptanceRoom` only to derive a
  seeded feedback summary.
- **Closure status callout** (color-coded) + **acceptance summary** (accepted/unresolved/
  resolved/Phase-R badges) + **unresolved-feedback warning** with an explicit "carry
  forward" toggle.
- **Manual publishing checklist:** the 6 gates as confirm toggles with descriptions +
  derived advisories; an **external publishing owner** text input.
- **Manual publishing handoff controls:** record-acceptance / record-checklist-reviewed /
  record-ready / **Mark published manually (outside CORE)** (gated behind `ready_to_close`)
  / **Close without publishing** / reset-mark — each appends a local audit entry.
- **Visible safety surface:** local/demo badges (`Local/demo state only` · `No publishing
  by CORE` · `No public URL created` · `No connector used` · `Not Published`) + a banner
  with the verbatim **"Client accepted ≠ Published."** and **"Publishing must be completed
  manually outside CORE."** copy.
- Local helper actions only: **Copy closure summary** (clipboard, gated by
  `can.exportPacks`) + **Preview closure summary** (local read-only textarea). No real
  Publish/Send/Notify button, no share/public URL, no network call. Separate component so
  the parent `CampaignWorkspace` stays stateless.

### `src/components/core/CampaignWorkspace.tsx` (additive)
- Renders `<DeliveryClosurePanel>` directly after `<DeliveryAcceptancePanel>` (Phase T),
  threading the same already-available props. Component stays stateless — no `App.tsx`/
  routing/RLS/state-machine change; header comment updated to document the Phase U surface.

## Tests

- **`src/lib/core/deliveryClosure.test.ts`** (new — 23 tests): status derivation across all
  five states; **`manually_marked_published` requires an explicit mark — never auto-derived**
  (everything-ready + no mark stays `ready_for_manual_publishing`); `client_accepted_not_published`
  vs `ready_for_manual_publishing` are **both non-published and distinct**; no `published`/
  `launched` status exists; unresolved feedback **warns and blocks `ready_to_close`** until
  resolved or explicitly carried forward; closure-checklist derivation (owner-named gate +
  explicit-mark gate); audit purity + `local_mock` flag + deterministic sample; render text
  carries the safety copy + "Not published by CORE", has **no URL/webhook/token**, uses only
  **negated** auto-post/auto-publish/auto-launch wording, and no contamination.
- **`src/components/core/DeliveryClosurePanel.source.test.ts`** (new — 13 source-scan tests):
  renders the Delivery Closure local/demo surface; shows local-only badges + Not Published +
  the "Client accepted ≠ Published"/"outside CORE" messages; composes the Phase R checklist +
  closure model; surfaces the closure checklist + audit trail; **the manual publish mark is
  only ever set inside explicit click handlers and gated by `ready_to_close`**; only local
  CTAs (copy/preview), no publish-now/auto-publish/run-ads/launch/go-live/post-to/
  send-to-client/notify-client/create-share-link; clipboard only, no fetch/axios/XHR; mutates
  no approval/delivery/persisted state (no `localStorage.setItem`); never auto-post/auto-approve
  (auto-post only negated); no URL/OAuth/webhook/token/share-url/email-send; no live-analytics
  pull; no off-domain contamination.

## Safety guarantees (CLAUDE.md §4)

- **Approval-first.** Recording closure state / marking the manual publish status **never**
  mutates approval state — approval decisions stay in the Approval Queue. The panel reads only
  `approved` deliverables to derive the Phase R readiness.
- **Client accepted ≠ Published (explicit).** Structural `core_published: false`; the verbatim
  "Client accepted ≠ Published." + "Publishing must be completed manually outside CORE." copy is
  always visible; `client_accepted_not_published` and `ready_for_manual_publishing` are both
  non-published; there is **no Core-set `published`/`launched` state**;
  `manually_marked_published` is an explicit operator annotation (publishing happened **outside
  CORE**) and is **never auto-derived** — it requires an explicit manual action gated behind the
  closure checklist.
- **Local/demo only — not a real client portal.** No email, **no public/share URL is ever
  created**, no notification, no connector, nothing synced; the audit trail is flagged
  local/mock/demo state (asserted on both the rendered text and the panel source).
- **No auto-post / no auto-ads / no spend / no auto-approve.** Helper actions are clipboard +
  local preview only; source scan bans affirmative publish/launch/run-ads/share-url and
  auto-approve wording; every `auto-post`/`auto-publish`/`auto-launch` appears only **negated**.
- **No secrets / no live connector / no webhook / no env change / no fake metrics / no live
  analytics.** No keys/URLs/webhook/`fetch`/`axios`/`process.env`/`import.meta.env`; pure local
  React state + clipboard copy. No dependency added. No contamination
  (Forme/sofa/furniture/nội thất/Fal.ai/ImgBB) — note the `perform*` token is deliberately
  avoided to dodge the `Forme` substring false-positive.

## Codex fix round (2026-06-25) — safe-close gate so a manual mark can NEVER bypass the gates

**Codex finding:** `deriveClosureStatus()` returned `manually_marked_published` /
`closed_without_publishing` **before** checking any safe-close conditions, so an explicit mark
could force a terminal "published/closed" status onto an unaccepted / unresolved-feedback /
Phase-R-not-ready / incomplete-checklist delivery — unsafe.

**Exact logic change** (`src/lib/core/deliveryClosure.ts`):
- Added a single shared pure guard **`hasSafeClosureReadiness(input)`** requiring ALL of:
  acceptance ∈ {`client_accepted`, `owner_ready_for_manual_publish`}; unresolved feedback
  resolved **or** explicitly carried forward; Phase R = `ready_for_manual_publishing`; and
  `closureGatesComplete` (every required closure gate **except** the status-mark gate itself —
  excluded to avoid the circular dependency, since that gate is satisfied BY setting the mark).
  Exposed thin wrappers **`canMarkManualPublished`** and **`canCloseDelivery`** (both = the gate)
  plus helper `feedbackIsClear`.
- **`deriveClosureStatus`** now honors `marked_published` / `closed_unpublished` **only when
  `hasSafeClosureReadiness` holds**; an unsafe mark is ignored and the function falls through to
  the appropriate safer existing status (`not_accepted` / `client_accepted_not_published` /
  `ready_for_manual_publishing`). New field `closureGatesComplete?: boolean` on `ClosureStatusInput`
  (defaults closed when omitted, so a bare mark can never force a terminal state). No new status
  was introduced.
- **`buildDeliveryClosure`** now builds the closure checklist FIRST, computes
  `closure_gates_complete` (all gates except the status-mark), derives the status with that, and
  reports an **effective** mark: `manual_publish_mark` = requested mark only when it actually drove
  a terminal status (`manual_publish_mark_applied`), else `none`; also exposes
  `safe_closure_ready` (= `ready_to_close`, now also requiring Phase R ready) and
  `manual_publish_mark_requested`.
- **Panel** (`DeliveryClosurePanel.tsx`): `handleCloseUnpublished` now early-returns unless
  `closure.ready_to_close`; the **Close-without-publishing** button is disabled (lock icon) until
  safe-close, matching the Mark-published button; the Reset button keys off local state; a
  red advisory shows when a mark was **requested but not applied**.

**New/updated tests** (`src/lib/core/deliveryClosure.test.ts`, +10):
- `marked_published` is **ignored** when (a) not accepted, (b) unresolved feedback not carried
  forward, (c) Phase R not ready / blocked, (d) closure gates / owner assignment incomplete.
- `closed_unpublished` has the **same** non-bypass tests (equivalent gating).
- positive: `marked_published` is honored **only** when every safe-close condition holds (incl.
  `owner_ready_for_manual_publish` + carried-forward-feedback variants).
- guard predicates (`hasSafeClosureReadiness` / `canMarkManualPublished` / `canCloseDelivery`)
  agree with the gate and default-closed when `closureGatesComplete` is omitted.
- end-to-end via `buildDeliveryClosure`: unsafe mark ⇒ `manual_publish_mark_applied=false`,
  effective mark `none`, status falls back; safe mark ⇒ applied, status
  `manually_marked_published`, `core_published` still `false`.
- updated the two prior tests that asserted the OLD pre-gate behavior to the new safe behavior;
  strengthened the render test to exercise the genuinely-applied published state.
- Panel source test (+1): asserts **both** terminal-mark handlers are gated by
  `!closure.ready_to_close` and that `manual_publish_mark_applied`/`_requested` are surfaced.

## Validation

- **`npm run build`** — PASS (tsc + vite; 0 TS errors; entry `index` 376.11 kB;
  `CampaignWorkspace` chunk 114.17 kB incl. the Q/R/S/T/U panels).
- **`npm test`** — PASS **38 files / 447 tests** (+2 files / +47 vs 36/400; +11 from this Codex
  fix round). All prior tests preserved (two pre-gate assertions updated to the new safe behavior).
- **Safety search** (changed production source `deliveryClosure.ts` + `DeliveryClosurePanel.tsx`)
  — `perform`/`http(s)`/`webhook`/`oauth`/`access_token`/`client_secret`/`api_key`/`share_url`/
  `public_url`/`META`/`TIKTOK`/`ZALO`/`GOOGLE_ADS`/`CANVA_*`/`fetch(`/`axios`/`XHR`/`mailto`/
  `process.env`/`import.meta.env`/`localStorage.setItem` = **none**; no `published`/`launched`
  literal status; every auto-post/auto-publish/auto-launch is negated. No `.env`/`package.json`
  change. No off-domain contamination.

## Risk / follow-up

- Low risk: one new pure model + one self-contained interactive panel + one render in the
  already-stateful child slot. Approval state machine, repositories, routing, RLS, and
  CampaignWorkspace's stateless contract are untouched.
- Optional next: persist closure state per campaign (still local-only, no real share link); a
  workspace-header closure badge; share the same feedback store with the Phase T panel rather
  than each panel seeding its own mock.

## Recommendation: **PASS** — local/demo delivery closeout + manual publishing handoff control
only (no real share URL, no email/notification, no connector, no auto-publish; client accepted
≠ published; publishing manual & outside CORE); awaiting Owner review of the diff before commit.
