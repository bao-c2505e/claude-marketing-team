# CORE V1 Integration Closure — 2026-07-02

**Type:** Integration closure (NOT a new phase). Connects the already-built CORE
modules into one visible, auditable, approval-first operating flow.

**Base:** Phase Z DONE, commit `5d5fb96` (53 files / 781 tests). Working tree was
clean before this work.

---

## What was built

### New pure modules
- **`src/lib/core/coreV1Integration.ts`** — the central integration map + gates:
  - `CORE_V1_FLOW` — the canonical, ordered 9-stage flow (BrandBrainVersion →
    Campaign → Approval → ConnectorCommand → ManualPublishingEvidence →
    ResultReview → LearningCandidate → BrandBrainProposal → ManualApply), each
    stage backed by an existing module + its safety rule.
  - `resolveActiveBrandBrainContext()` — returns the **current applied** version of
    a brand's version history as the OFFICIAL context; `contextSourceIsOfficial()`
    rejects `draft` / `proposal` / `learning_candidate`. Structural guarantees
    (`based_on_draft/proposal/learning_candidate/live_analytics` all `false`).
  - `buildCoreV1IntegrationStatus()` / `summarizeCoreV1Flow()` /
    `renderCoreV1FlowText()` — per-stage complete/blocked/manual-required
    projection for the panel.
- **`src/lib/core/connectors/connectorCommand.ts`** — approved asset → connector
  command handoff:
  - `buildConnectorCommands()` / `buildConnectorCommandForItem()` from approved
    `CampaignPackItem`s only; `approvalEvidence.createdFromApprovedAsset: true`.
  - Hard-false safety flags (`publishesContent`, `launchesAds`, `spends`,
    `autoRuns`, `usesLiveConnector`) + hard-true `requiresManualPublishingEvidence`.
  - `connectorCommandImpliesPublished()` = hard `false`;
    `connectorCommandRequiresManualEvidence()` = hard `true`.
  - Verbatim copy `CONNECTOR_COMMAND_DOES_NOT_PUBLISH` = "This command does not
    publish content by itself." `setConnectorCommandStatus()` re-asserts safety
    flags on every transition (simulated/approved_for_manual_run never flips a flag).

### New UI
- **`src/components/core/CoreV1FlowPanel.tsx`** — Owner-facing integration panel in
  the Campaign Production Workspace. Shows: (1) applied Brand Brain version as
  official context, (2) approval-gated connector command previews with a target
  selector + copy, (3) connector readiness (read-only ledger, `0 of N live`),
  (4) publishing-evidence bridge (points to the Manual Publishing Evidence
  section; nothing marked Published here), (5) the end-to-end flow status chain.
  Self-contained local state; no network, no persistence, no live connector.

### Wiring
- **`src/components/core/CampaignWorkspace.tsx`** — imports + renders
  `<CoreV1FlowPanel>` above the Manual Publishing Evidence section. Parent stays
  stateless (Phase K source-scan still holds — no `useState` added).

### Docs
- **`07_runbooks/core_v1_integration_map.md`** — the integration map source of truth.
- This log.

---

## Validation

- **Tests:** `npx vitest run` → **56 files / 814 PASS** (was 53/781; +3 files, +33
  tests: coreV1Integration 14, connectorCommand 11, CoreV1FlowPanel.source 8).
- **Build:** `npm run build` → **PASS** (tsc + vite, 0 TS errors, no >500 kB
  warning; entry `index` 376.71 kB, `CampaignWorkspace` chunk 240 kB).
- **Safety greps:** network/URL/secret matches are all NEGATION comments
  (documentation of what the code does NOT do); no real fetch/axios call, no real
  URL, no secret, no webhook URL. Un-negated auto-post/auto-ads = none.
  Contamination (Forme/sofa/furniture/nội thất/Fal.ai/ImgBB) = clean.

## Safety assessment (CLAUDE.md §4)
- Approval-first: ✅ connector commands require Owner approval + are built only from approved assets.
- Approved ≠ Published / Client Accepted ≠ Published / Connector executed ≠ Published: ✅ enforced by hard-false flags + tests.
- Published = Owner manual evidence only: ✅ bridge routes back to Manual Publishing Evidence; nothing auto-marked Published.
- No auto-post / no auto-ads / no spend: ✅ hard-false flags, no launch/spend path.
- No fake metrics / no live analytics: ✅ no metric fields on commands; review stage keeps provided/simulated labels.
- No secrets / no webhook URL committed: ✅ grep clean.
- Dry-run/sandbox first, no live connector: ✅ ledger read-only, `liveCount: 0`; commands never run a connector.
- Brand Brain not auto-updated: ✅ only applied version is official; proposal only `ready_for_manual_apply`.

## Status
- Tests PASS · Build PASS · Safety PASS.
- **Codex review: PENDING.** Commit/push: PENDING Owner/Codex approval (per repo rule — no commit without approval).
