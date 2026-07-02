# CORE V1 Integration Map

> **Purpose:** the single, source-of-truth description of how the already-built
> CORE modules connect into ONE visible, auditable, approval-first operating flow.
> This is **integration closure**, not a new phase — it wires existing pieces
> together and encodes the safety rules that keep every hand-off honest.
>
> **Canonical code:** `src/lib/core/coreV1Integration.ts` (`CORE_V1_FLOW`,
> `resolveActiveBrandBrainContext`, `buildCoreV1IntegrationStatus`) and
> `src/lib/core/connectors/connectorCommand.ts`. The Owner-facing surface is
> `src/components/core/CoreV1FlowPanel.tsx`, embedded in the Campaign Production
> Workspace.

---

## The V1 flow

Each arrow is **Owner-gated and manual** — never automatic:

```
BrandBrainVersion → Campaign → Approval → ConnectorCommand
   → ManualPublishingEvidence → ResultReview → LearningCandidate
   → BrandBrainProposal → ManualApply  (→ new BrandBrainVersion)
```

| # | Stage | Backed by | Rule this stage must never break |
|---|-------|-----------|----------------------------------|
| 1 | **Applied Brand Brain Version** | `brandBrainVersioning.ts` / `brandBrain.ts` | Only the **applied** (versioned) Brand Brain is official context. A draft / proposal / learning candidate is never official. |
| 2 | **Campaign & AI Factory Output** | `brandBrain.ts` (`buildAiFactoryBrandContext`) / `*Factory.ts` | AI generation reaches at most `pending_approval` — never published. |
| 3 | **Owner Approval** | `coreRepository.ts` / `approvalDecision.ts` | Only an authenticated Owner action approves; **Approved ≠ Published**. |
| 4 | **Connector Command Handoff** | `connectors/connectorCommand.ts` | A connector command **does not publish content by itself**; it never equals Published. |
| 5 | **Manual Publishing Evidence** | `manualPublishingEvidence.ts` | Published means an Owner **manual record**; CORE never publishes, and a connector run/simulation alone is **not** Published. |
| 6 | **Manual Result Review** | `manualResultReview.ts` | No live analytics pull, no fabricated metrics; review never changes Published status. |
| 7 | **Learning Candidate** | `brandBrainLearning.ts` | A learning candidate is **not** Brand Brain memory; accepting it does not apply it. |
| 8 | **Brand Brain Update Proposal** | `brandBrainUpdateProposal.ts` | An approved proposal is only `ready_for_manual_apply` — never auto-applied. |
| 9 | **Manual Apply → New Version** | `brandBrainVersioning.ts` | Applying appends a new version (previous versions preserved); Brand Brain is not auto-updated. |

---

## Official active context — the load-bearing gate

`resolveActiveBrandBrainContext({ history, snapshot })` returns the **current
(latest applied)** version of a brand's append-only version history, tagged onto
the compact `BrandContextSnapshot` that the AI Factory and Approval Queue already
share. Because a `BrandBrainVersionHistory` only ever contains **applied** versions
(`baseline` / `manual_apply`), the official context can never be a draft, a
proposal, or a learning candidate. This is enforced two ways:

1. **Type-level** — the resolver only accepts a version history; there is no code
   path to hand it a proposal / draft / candidate.
2. **Classifier** — `contextSourceIsOfficial(kind)` returns `true` only for
   `'applied_version'`; `'draft'`, `'proposal'`, and `'learning_candidate'` all
   return `false`.

The returned `ActiveBrandBrainContext` carries structural guarantees
(`based_on_draft: false`, `based_on_proposal: false`,
`based_on_learning_candidate: false`, `based_on_live_analytics: false`).

---

## Connector command handoff — approval-gated preview only

`connectorCommand.ts` turns an Owner-**approved** deliverable (a
`CampaignPackItem`, which is already filtered to status exactly `approved`) into a
**connector command preview**. A command is a handoff artifact — "this approved
asset is ready to be run through connector X" — that runs no connector.

- **Statuses:** `draft → ready_for_owner → approved_for_manual_run → simulated`,
  plus `blocked`. **None means Published.**
- **Safety flags** (hard literals on every command): `publishesContent: false`,
  `launchesAds: false`, `spends: false`, `autoRuns: false`,
  `usesLiveConnector: false`, `requiresOwnerApproval: true`,
  `requiresManualPublishingEvidence: true`, `approvedNotPublished: true`.
- Every command carries the verbatim copy **"This command does not publish content
  by itself."** and is provably built from an approved asset
  (`approvalEvidence.createdFromApprovedAsset: true`).
- `connectorCommandImpliesPublished()` is a hard `false`;
  `connectorCommandRequiresManualEvidence()` is a hard `true`. A `simulated` or
  `approved_for_manual_run` command is still **not** Published — the Owner must
  record manual publishing evidence (stage 5) separately.

Target connectors come from the governance matrix (`connectorGovernance.ts`) — all
live-blocked, read-only (`connectorLedger.ts` reports `liveCount: 0`).

---

## Safety invariants (verbatim, pinned by tests)

- Approval-first — nothing leaves the draft/review pipeline without an explicit Owner approval.
- **Approved ≠ Published. Client Accepted ≠ Published. Connector executed ≠ Published.**
- Published requires separate Owner manual evidence — CORE never auto-publishes.
- Only the applied Brand Brain version is official context — drafts / proposals / learning candidates are not.
- Brand Brain is not auto-updated; an approved proposal is only ready for a manual apply.
- No auto-post, no auto-ads, no ad spend, no live analytics pull, no fabricated metrics.
- No live connector runs from CORE — connector commands are approval-gated previews/handoffs only.
- No secrets, no committed webhook URLs, no hidden persistence/network behaviour.

---

## Tests

| Concern | Test |
|---------|------|
| Integration map order + safety notes | `src/lib/core/coreV1Integration.test.ts` |
| Official context = applied version only; draft/proposal/candidate rejected | `coreV1Integration.test.ts` |
| Integration status projection (approval manual-required, connector ≠ published, apply gate) | `coreV1Integration.test.ts` |
| Approved asset → command; command ≠ Published; simulated still needs manual evidence | `src/lib/core/connectors/connectorCommand.test.ts` |
| Panel safety posture (read-only, no live connector, does-not-publish copy) | `src/components/core/CoreV1FlowPanel.source.test.ts` |
