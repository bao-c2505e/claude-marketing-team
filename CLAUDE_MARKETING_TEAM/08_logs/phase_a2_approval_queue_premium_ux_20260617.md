# Phase A2 — Approval Queue Premium UX + Demo Cleanup Filter - 2026-06-17

## Status

DONE. Display-only UX upgrade to the Approvals tab. The approval **state
machine, permissions, and all action handlers are unchanged** — Submit /
Approve / Reject / Request Revision / Cancel / Comment behave exactly as before.
`npm run build` PASS (0 TS errors), `npm run test` PASS 65/65.

## Scope

Frontend display + filtering only. **No** changes to: n8n workflows, contracts,
env files, `package.json`, repositories, routing/UUID-gating, RLS, approval
state-machine logic, or any data mutation. No new dependencies. No secrets or
real webhook URLs. No new props were needed (App.tsx untouched) — module/source
classification is read from data the tab already receives.

## Files changed

- `src/components/core/ApprovalsTab.tsx` — rewritten list/review experience
  (classifier + toolbar + badges + empty states + detail safety copy). All
  existing sub-behaviors (`SubmitPanel`, `DetailView` actions, comments,
  history timeline, permission gate) preserved verbatim.
- `src/index.css` — additive premium classes (`.appr-tabs`/`.appr-tab`,
  `.appr-search`, `.appr-select`, `.appr-toggle`, `.appr-badge`, `.appr-card`),
  built from existing tokens. No existing rules changed.

## Module / source / content-type classification (display only)

Each AI Factory V1 module appends a metadata block to the content item's caption
(`workflow_type:` / `generation_mode:` / `source:`) and sets a clean
`content_type`. The tab reads those signals (never mutates):

- **Module**: `workflow_type` → Content Factory (`content_pack`) / Design Factory
  (`design_factory`) / Video Scripts (`video_scripts`) / Ads Pack Draft
  (`ads_pack`) / Report Draft (`report_draft`); falls back to the structured
  `content_type` field; else **Other / Legacy**.
- **Source**: `generation_mode: external_module` or `source: n8n` → **n8n AI
  Provider**; any V1 metadata in fallback → **Local demo**; no metadata (old
  seed data) → **Legacy / mock**.
- **Content type badge**: canonical per module (content_pack / design_brief /
  video_script / ads_draft / report_draft / other).

## What changed visually

- **Status tabs** (segmented, with live counts): All / Pending / Approved /
  Needs revision / Rejected.
- **Search** by title / client / brand / campaign (uses existing resolved names).
- **Module filter** dropdown (6 modules + All) alongside the existing
  client/brand/campaign/priority filters.
- **Per-item badges** on each card and in the detail header: module, content
  type, and source (n8n AI Provider / Local demo / Legacy / mock).
- **Premium review cards** with hover lift; cleaner typography/spacing.
- **Detail metadata panel** gains Module + Source fields and a per-module safety
  line; resolved requests show a status-context safety banner.

## Demo cleanup / display management

- A **"Hide local/demo"** toggle (off by default) that shows n8n-generated items
  only. Display-only: it filters the view, **deletes nothing**, mutates no
  Supabase/localStorage record. A clear banner states how many local/demo &
  legacy items are hidden. The header shows an `n8n-generated` count.

## Safety copy preserved / strengthened

- Top safety banner now also states **no live analytics pull**.
- "Approved ≠ Published" kept in the pending action panel; cards show
  "· not published" on approved items; detail shows "Approved — not published…"
  and equivalent lines for rejected / revision / cancelled.
- Per-module draft/spec notes: Content "no auto-post"; Design "no image
  generation"; Video "no video generation"; Ads "no auto-ads, no spend";
  Report "no live analytics pull, no unverified metrics".
- Empty pending state: "No pending approvals. Generate a new AI Factory pack to
  review." Nothing implies anything was published or launched.

## Validation

- `npm run build` — PASS (tsc + vite, 1581 modules; pre-existing >500 kB chunk
  warning only).
- `npm run test` — PASS 65/65.
- Diff scoped to `src/components/core/ApprovalsTab.tsx` + `src/index.css`.
  Secrets/URL grep clean.

## Recommended next phase (A3)

- Extract the classifier into a tiny `src/lib/core/approvalClassify.ts` with unit
  tests (would lift coverage and let the Command Center reuse the same labels).
- Bulk review affordances (multi-select approve within a module) — still
  one-decision-per-record, approval-gate-only.
- Code-split `App.tsx`/tabs to clear the standing >500 kB bundle warning.
