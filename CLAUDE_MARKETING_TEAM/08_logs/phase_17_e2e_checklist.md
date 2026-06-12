# Phase 17 — Manual MVP End-to-End Workflow Checklist

This checklist covers the full Owner-side MVP workflow (Client → Brand →
Campaign → Brief → Content Generation → Approval → Asset Library) plus the
UUID-gating / repository-routing fallback rules introduced across Phases
16A–16D. It is the manual companion to the automated unit tests added in this
phase (no browser-automation tool was available this session, so the UI steps
below are documented for the next session/owner pass rather than executed).

## Automated test coverage added in this phase

Run with `npm run test` (vitest, zero extra config — `node` environment):

- `src/lib/core/repoRouting.test.ts` (34 tests) — `assetScopeIsSupabaseSafe`,
  `approvalScopeIsSupabaseSafe`, `okOrAbsentUuid`. Covers: full valid-UUID
  chains, local-format ids at every scope level, optional ids absent
  (undefined/null), and the Codex Fix Round 2 case (local CURRENT
  `asset_collection_id` keeps routing on localStorage even when the NEXT
  collection id is `null` or a valid UUID).
- `src/lib/core/coreRepository.test.ts` (11 tests) — `sanitizeAssetPatch`,
  `sanitizeGenerationPatch`, `sanitizeBriefPatch` (immutable
  identity/tenant/audit field stripping, snake_case + camelCase, while
  preserving `asset_collection_id` and other editable fields), plus `isUuid`
  and `generateId`.

These cover the **code-level routing/sanitization rules** exhaustively. The
sections below cover the **UI workflow** that exercises those rules end to
end.

## How to use this checklist

Run section B–G once in **Local/Demo mode** (Supabase env vars unset — the
current production state) and again in **Supabase-configured mode** (a test
Supabase project with `.env.local` set and all `schema_v1*.sql` migrations
through `schema_v1_phase16d_asset_extension.sql` applied), if/when a test
project is available.

## A. Setup

- [ ] `npm run dev`, sign in (Demo Sign In in Local/Demo mode, or Supabase
      Auth in Supabase mode)
- [ ] Confirm signed-in role is `owner` or `manager` (full write access)

## B. Client → Brand → Campaign

- [ ] Create a new Client (Clients tab) — appears in list, detail view loads
- [ ] Create a new Brand under that Client — appears in Brand workspace,
      linked to the client
- [ ] Create a new Campaign under that Client + Brand — appears in Campaigns
      tab with a valid status

## C. Brief Intake

- [ ] From the Campaign, create a new Brief (Brief Intake tab) — title,
      goals, channels, tone, etc. all save correctly
- [ ] Edit the brief (status transition + content fields) — confirm
      `id`/`client_id`/`brand_id`/`campaign_id`/`created_at`/`updated_at`/
      `submitted_by`/`submitted_at` are unchanged after the edit
      (`sanitizeBriefPatch`)

## D. Content Generation

- [ ] From the Brief detail view, trigger "Generate Content Plan" (7/15/30
      day) — a generation job + content items are created and visible
- [ ] Generated items appear on the Content Calendar

## E. Approval Workflow

- [ ] Submit a generated content item for approval (Approvals tab) — request
      is created scoped to the full client/brand/campaign/brief/
      generation/content-item chain
- [ ] Approve a pending item — status becomes `approved`, an event is
      recorded
- [ ] Reject a pending item — status becomes `rejected`/needs-changes, an
      event (+ optional comment) is recorded
- [ ] Add an internal comment as owner/manager — appears in the thread
- [ ] (Client View) "Add Feedback" — verify behavior matches the current role
      rules: in Supabase mode this is owner/manager-only under RLS (Phase
      16C-2 fix round), so a `client`/`viewer` user's feedback submission
      should be rejected; in Local/Demo mode (no RLS) it succeeds — this
      mode-dependent difference is a known, accepted limitation

## F. Asset Library

- [ ] Create a new Asset Collection (scoped to client + brand, optional
      campaign)
- [ ] Create a new Asset and assign it to that collection
- [ ] Edit the Asset — change name/tags/notes/approval_status; confirm
      Client/Brand/Campaign fields are disabled (immutable) in edit mode
- [ ] Move the Asset to a different collection (and to "no collection") —
      confirm `asset_collection_id` updates and persists correctly
- [ ] Archive the Asset — `approval_status` becomes `archived` and it drops
      out of the active asset list

## G. UUID-gating / repository routing fallback (Phase 17 focus)

### Local/Demo mode (Supabase env unset — current production state)

- [ ] All client/brand/campaign/brief/generation/approval/asset ids created
      above are local-format (`client-*`, `brand-*`, `campaign-*`,
      `brief-*`, `generation-*`/`job-*`, `approval-*`/`item-*`,
      `ast-*`/`asset-*`, `col-*`/`collection-*`/`asset-collection-*`)
- [ ] All CRUD operations in B–F complete successfully entirely via
      localStorage — no Supabase network calls, no Supabase-related console
      errors
- [ ] `assetScopeIsSupabaseSafe` / `approvalScopeIsSupabaseSafe` return
      `false` for these local-format ids — verified by
      `repoRouting.test.ts` at the unit level

### Supabase-configured mode (when a test project is available)

- [ ] With `.env.local` Supabase vars set and migrations applied, repeat
      sections B–F
- [ ] Entities created via the UI receive real DB-issued UUIDs; subsequent
      get/update/archive operations route to Supabase (verify via the
      Supabase dashboard or browser network tab)
- [ ] Mixed-state check: an asset whose `asset_collection_id` is a
      pre-existing **local** `col-*` id (carried over from Local/Demo data) —
      editing it, even to set `asset_collection_id` to `null` or to a real
      UUID collection, must still route to `LocalStorageAssetRepository`, not
      Supabase (Codex Fix Round 2 — verified at the unit level by
      `repoRouting.test.ts`)
- [ ] RLS: sign in as a `client`/`viewer`-role user — confirm read access to
      approvals/assets, and confirm write attempts (approve/reject/comment/
      asset edit/archive) are rejected

## H. Build & test gate

- [ ] `npm run build` (tsc + vite) — 0 TS errors
- [ ] `npm run test` (vitest run) — all unit tests pass
- [ ] Secrets grep clean (`service_role|secret|api_key|password`)

## Result log

| Date | Mode | Sections run | Result | Notes |
|---|---|---|---|---|
| 2026-06-11 | N/A | H only | PASS | Build PASS (1575 modules), `npm run test` 45/45 PASS, secrets grep clean. Sections B–G (browser UI workflow) deferred — no browser-automation tool available this session; routing/sanitization logic they exercise is fully covered by `repoRouting.test.ts` + `coreRepository.test.ts` at the unit level. |
