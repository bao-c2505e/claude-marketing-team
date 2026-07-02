// ---------------------------------------------------------------------------
// CORE V1 Integration Closure — central flow map + official active-context gate
// ---------------------------------------------------------------------------
// This module does NOT add a new phase or a new external capability. It CONNECTS
// the already-built CORE modules into ONE visible, auditable, approval-first flow
// and encodes the rules that keep every step honest. It is PURE + LOCAL:
//   • no fetch / axios / network / OAuth / webhook / URL / secret,
//   • no persistence, no Supabase, no live sync, no connector call,
//   • it only reads normalized shapes other modules already produce and returns
//     plain typed objects the UI renders.
//
// The V1 flow it maps (each arrow is Owner-gated / manual, never automatic):
//
//   BrandBrainVersion → Campaign → Approval → ConnectorCommand
//     → ManualPublishingEvidence → ResultReview → LearningCandidate
//     → BrandBrainProposal → ManualApply  (→ new BrandBrainVersion)
//
// Load-bearing safety invariants encoded here (see CLAUDE.md §3/§4/§6/§7):
//   • ONLY an APPLIED Brand Brain version is official active context. A draft, a
//     proposal, or a learning candidate can NEVER become the official context.
//   • Brand Brain is not auto-updated; an approved proposal is only
//     `ready_for_manual_apply`; a new version exists only after a manual apply.
//   • A connector command is an approval-gated handoff/preview — it never equals
//     Published. Published requires separate Owner manual evidence.
//   • Approved ≠ Published. Client Accepted ≠ Published. Connector executed ≠
//     Published. No auto-post, no auto-ads, no live analytics, no fake metrics.
// ---------------------------------------------------------------------------

import type { BrandContextSnapshot } from './brandBrain';
import { APPROVED_NOT_PUBLISHED_REMINDER } from './brandBrain';
import type {
  BrandBrainVersionHistory,
  BrandBrainVersion,
  BrandBrainVersionOrigin,
} from './brandBrainVersioning';
import { currentVersion } from './brandBrainVersioning';

// ---------------------------------------------------------------------------
// The integration map — the canonical, ordered V1 flow stages.
// ---------------------------------------------------------------------------

export type CoreV1StageKey =
  | 'brand_brain_version'
  | 'campaign'
  | 'approval'
  | 'connector_command'
  | 'manual_publishing_evidence'
  | 'result_review'
  | 'learning_candidate'
  | 'brand_brain_proposal'
  | 'manual_apply';

export interface CoreV1Stage {
  key: CoreV1StageKey;
  /** 1-based position in the flow. */
  order: number;
  label: string;
  /** What this stage does in one line. */
  description: string;
  /** The lib module (source of truth) that backs this stage. */
  module: string;
  /** The standing safety rule this stage must never violate. */
  safetyNote: string;
  /** True when the ONLY way to advance past this stage is an explicit human step. */
  ownerGated: boolean;
}

/**
 * The canonical CORE V1 flow. Order is stable so the UI, the docs, and tests all
 * reference one source of truth. Each stage is backed by an already-built module.
 */
export const CORE_V1_FLOW: CoreV1Stage[] = [
  {
    key: 'brand_brain_version',
    order: 1,
    label: 'Applied Brand Brain Version',
    description: 'Only the applied (versioned) Brand Brain is the official active context for a campaign.',
    module: 'brandBrainVersioning.ts / brandBrain.ts',
    safetyNote: 'Draft / proposal / learning candidate can never be official context.',
    ownerGated: true,
  },
  {
    key: 'campaign',
    order: 2,
    label: 'Campaign & AI Factory Output',
    description: 'AI Factory drafts are generated grounded in the applied Brand Brain version.',
    module: 'brandBrain.ts (buildAiFactoryBrandContext) / *Factory.ts',
    safetyNote: 'AI generation reaches at most pending_approval — never published.',
    ownerGated: false,
  },
  {
    key: 'approval',
    order: 3,
    label: 'Owner Approval',
    description: 'Owner approves drafts for internal use only. Approved ≠ Published.',
    module: 'coreRepository.ts / approvalDecision.ts',
    safetyNote: 'Only an authenticated Owner action approves; approval authorizes internal use only.',
    ownerGated: true,
  },
  {
    key: 'connector_command',
    order: 4,
    label: 'Connector Command Handoff',
    description: 'Approved assets can produce approval-gated connector command previews.',
    module: 'connectors/connectorCommand.ts',
    safetyNote: 'A connector command does not publish content by itself; it never equals Published.',
    ownerGated: true,
  },
  {
    key: 'manual_publishing_evidence',
    order: 5,
    label: 'Manual Publishing Evidence',
    description: 'Owner manually records whether an asset was published outside CORE (link / screenshot / note).',
    module: 'manualPublishingEvidence.ts',
    safetyNote: 'Published means an Owner manual record — CORE never publishes, and a connector run alone is not Published.',
    ownerGated: true,
  },
  {
    key: 'result_review',
    order: 6,
    label: 'Manual Result Review',
    description: 'Owner-provided manual results are reviewed (never gathered) into a review + learning preview.',
    module: 'manualResultReview.ts',
    safetyNote: 'No live analytics pull, no fabricated metrics; review does not change Published status.',
    ownerGated: true,
  },
  {
    key: 'learning_candidate',
    order: 7,
    label: 'Learning Candidate',
    description: 'A review can surface a Brand Brain learning candidate that the Owner accepts or rejects.',
    module: 'brandBrainLearning.ts',
    safetyNote: 'A learning candidate is not Brand Brain memory; accepting it does not apply it.',
    ownerGated: true,
  },
  {
    key: 'brand_brain_proposal',
    order: 8,
    label: 'Brand Brain Update Proposal',
    description: 'Accepted candidates form an explicit update proposal behind a separate Owner merge gate.',
    module: 'brandBrainUpdateProposal.ts',
    safetyNote: 'An approved proposal is only ready_for_manual_apply — it is never auto-applied.',
    ownerGated: true,
  },
  {
    key: 'manual_apply',
    order: 9,
    label: 'Manual Apply → New Version',
    description: 'The Owner manually applies an approved proposal to create a new versioned Brand Brain snapshot.',
    module: 'brandBrainVersioning.ts',
    safetyNote: 'Applying appends a new version (previous versions preserved); Brand Brain is not auto-updated.',
    ownerGated: true,
  },
];

/** Standing safety notes the whole integrated flow carries (pinned by tests + UI). */
export const CORE_V1_FLOW_SAFETY_NOTES: string[] = [
  'Approval-first — nothing leaves the draft/review pipeline without an explicit Owner approval.',
  'Approved ≠ Published. Client Accepted ≠ Published. Connector executed ≠ Published.',
  'Published requires separate Owner manual evidence — CORE never auto-publishes.',
  'Only the applied Brand Brain version is official context — drafts / proposals / learning candidates are not.',
  'Brand Brain is not auto-updated; an approved proposal is only ready for a manual apply.',
  'No auto-post, no auto-ads, no ad spend, no live analytics pull, no fabricated metrics.',
  'No live connector runs from CORE — connector commands are approval-gated previews/handoffs only.',
];

/** Lookup one stage by key. */
export function getCoreV1Stage(key: CoreV1StageKey): CoreV1Stage {
  const stage = CORE_V1_FLOW.find(s => s.key === key);
  // CORE_V1_FLOW covers every CoreV1StageKey, so this is always defined.
  return stage as CoreV1Stage;
}

// ---------------------------------------------------------------------------
// Official active-context gate.
//
// Only an APPLIED Brand Brain version may be the official campaign context. This
// is enforced two ways:
//   1. `resolveActiveBrandBrainContext` only accepts a `BrandBrainVersionHistory`
//      (whose entries are all `baseline` or `manual_apply` — i.e. applied), and
//      reads its CURRENT version. There is no way to hand it a draft / proposal /
//      learning candidate.
//   2. `contextSourceIsOfficial` classifies a candidate source kind and returns
//      false for anything that is not an applied version.
// ---------------------------------------------------------------------------

/** The kinds of thing that could be *offered* as brand context. */
export type ContextSourceKind =
  | 'applied_version'
  | 'draft'
  | 'proposal'
  | 'learning_candidate';

export const CONTEXT_SOURCE_KIND_LABEL: Record<ContextSourceKind, string> = {
  applied_version:    'Applied Brand Brain version',
  draft:              'Draft Brand Brain (not applied)',
  proposal:           'Brand Brain update proposal (not applied)',
  learning_candidate: 'Learning candidate (not accepted/applied)',
};

/**
 * ONLY an applied Brand Brain version may serve as official active context. A
 * draft, a proposal, or a learning candidate is explicitly rejected — this is the
 * gate the whole learning loop relies on so unofficial context never grounds a
 * campaign. Pure & total.
 */
export function contextSourceIsOfficial(kind: ContextSourceKind): boolean {
  return kind === 'applied_version';
}

/** The official, versioned active brand context handed to campaign generation/preview. */
export interface ActiveBrandBrainContext {
  /** The applied version this context came from. */
  versionId: string;
  versionNumber: number;
  origin: BrandBrainVersionOrigin;
  brandId: string | null;
  brandName: string;
  /** The compact, draft-only brand-context snapshot (shared with AI Factory / Approval Queue). */
  snapshot: BrandContextSnapshot;
  /** A short human tag, e.g. "Brand Brain v2 (manual apply)". */
  versionLabel: string;
  // ── Structural guarantees — official context is always an applied version. ──
  source: 'applied_brand_brain_version';
  is_official: true;
  based_on_draft: false;
  based_on_proposal: false;
  based_on_learning_candidate: false;
  based_on_live_analytics: false;
  approved_not_published: string;
}

export interface ResolveActiveContextParams {
  /** The brand's append-only version history (baseline + any manual applies). */
  history: BrandBrainVersionHistory;
  /** The compact brand-context snapshot to tag with the applied version. */
  snapshot: BrandContextSnapshot;
}

function versionLabel(v: BrandBrainVersion): string {
  const originText = v.origin === 'manual_apply' ? 'manual apply' : 'baseline';
  return `Brand Brain v${v.versionNumber} (${originText})`;
}

/**
 * Resolve the OFFICIAL active brand context for a campaign: the CURRENT (latest
 * applied) version of the brand's version history, tagged onto the provided
 * snapshot. Because a version history only ever contains applied versions
 * (baseline / manual_apply), the official context can never be a draft, proposal,
 * or learning candidate. Pure & read-only.
 */
export function resolveActiveBrandBrainContext(
  params: ResolveActiveContextParams,
): ActiveBrandBrainContext {
  const { history, snapshot } = params;
  const version = currentVersion(history);
  return {
    versionId: version.versionId,
    versionNumber: version.versionNumber,
    origin: version.origin,
    brandId: history.brandId,
    brandName: history.brandName,
    snapshot,
    versionLabel: versionLabel(version),
    source: 'applied_brand_brain_version',
    is_official: true,
    based_on_draft: false,
    based_on_proposal: false,
    based_on_learning_candidate: false,
    based_on_live_analytics: false,
    approved_not_published: APPROVED_NOT_PUBLISHED_REMINDER,
  };
}

// ---------------------------------------------------------------------------
// Integration status — a per-stage complete/blocked/pending projection for the
// "CORE V1 Flow" panel. Pure function of explicit signals; derives nothing from
// the network and mutates nothing.
// ---------------------------------------------------------------------------

export type CoreV1StageStatus =
  | 'complete'
  | 'in_progress'
  | 'manual_required'
  | 'pending'
  | 'blocked';

export const CORE_V1_STAGE_STATUS_LABEL: Record<CoreV1StageStatus, string> = {
  complete:        'Complete',
  in_progress:     'In progress',
  manual_required: 'Manual step required',
  pending:         'Not started',
  blocked:         'Blocked',
};

export const CORE_V1_STAGE_STATUS_COLOR: Record<CoreV1StageStatus, string> = {
  complete:        '#34d399',
  in_progress:     '#60a5fa',
  manual_required: '#fbbf24',
  pending:         '#94a3b8',
  blocked:         '#f87171',
};

/** Explicit signals the caller derives from local campaign state. */
export interface CoreV1IntegrationSignals {
  hasAppliedBrandBrainVersion: boolean;
  appliedVersionLabel: string | null;
  hasCampaign: boolean;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  connectorCommandCount: number;
  blockedConnectorCommandCount: number;
  hasManualPublishingEvidence: boolean;
  hasReviewedResult: boolean;
  learningCandidateCount: number;
  hasBrandBrainProposal: boolean;
  proposalApproved: boolean;
  appliedNewVersion: boolean;
}

export interface CoreV1StageState {
  key: CoreV1StageKey;
  order: number;
  label: string;
  description: string;
  safetyNote: string;
  status: CoreV1StageStatus;
  detail: string;
}

/**
 * Project the flow into a per-stage state for the integration panel. Every step
 * that can only advance via a human action is at most `manual_required` until the
 * signal proves the human step happened — the projection never implies an
 * automatic transition. Pure & deterministic.
 */
export function buildCoreV1IntegrationStatus(
  signals: CoreV1IntegrationSignals,
): CoreV1StageState[] {
  const s = signals;

  const stageStatus = (key: CoreV1StageKey): { status: CoreV1StageStatus; detail: string } => {
    switch (key) {
      case 'brand_brain_version':
        return s.hasAppliedBrandBrainVersion
          ? { status: 'complete', detail: s.appliedVersionLabel ?? 'Applied version active' }
          : { status: 'pending', detail: 'No applied Brand Brain version yet' };

      case 'campaign':
        if (!s.hasCampaign) return { status: 'pending', detail: 'No campaign selected' };
        return s.draftCount > 0
          ? { status: 'complete', detail: `${s.draftCount} AI draft${s.draftCount === 1 ? '' : 's'} generated` }
          : { status: 'in_progress', detail: 'Campaign ready — no AI drafts generated yet' };

      case 'approval':
        if (s.approvedCount > 0) {
          return { status: 'complete', detail: `${s.approvedCount} approved (internal use only)` };
        }
        if (s.pendingApprovalCount > 0) {
          return { status: 'manual_required', detail: `${s.pendingApprovalCount} awaiting Owner approval` };
        }
        return { status: 'pending', detail: 'Nothing submitted for approval yet' };

      case 'connector_command':
        if (s.approvedCount === 0) {
          return { status: 'pending', detail: 'Approve assets first to enable connector commands' };
        }
        if (s.blockedConnectorCommandCount > 0) {
          return { status: 'blocked', detail: `${s.blockedConnectorCommandCount} command${s.blockedConnectorCommandCount === 1 ? '' : 's'} blocked` };
        }
        return s.connectorCommandCount > 0
          ? { status: 'manual_required', detail: `${s.connectorCommandCount} approval-gated command${s.connectorCommandCount === 1 ? '' : 's'} — does not publish by itself` }
          : { status: 'in_progress', detail: 'Approved assets can produce connector command previews' };

      case 'manual_publishing_evidence':
        if (s.approvedCount === 0) return { status: 'pending', detail: 'No approved assets to publish yet' };
        return s.hasManualPublishingEvidence
          ? { status: 'complete', detail: 'Owner manual publishing evidence recorded' }
          : { status: 'manual_required', detail: 'Owner must record manual publishing evidence' };

      case 'result_review':
        if (!s.hasManualPublishingEvidence) return { status: 'pending', detail: 'Record manual evidence to enable review' };
        return s.hasReviewedResult
          ? { status: 'complete', detail: 'Manual result reviewed (no live analytics)' }
          : { status: 'manual_required', detail: 'Owner review of provided manual result pending' };

      case 'learning_candidate':
        return s.learningCandidateCount > 0
          ? { status: 'manual_required', detail: `${s.learningCandidateCount} learning candidate${s.learningCandidateCount === 1 ? '' : 's'} — not Brand Brain memory yet` }
          : { status: 'pending', detail: 'No learning candidate surfaced yet' };

      case 'brand_brain_proposal':
        if (!s.hasBrandBrainProposal) return { status: 'pending', detail: 'No update proposal prepared yet' };
        return s.proposalApproved
          ? { status: 'manual_required', detail: 'Proposal approved — ready for manual apply only' }
          : { status: 'in_progress', detail: 'Proposal awaiting Owner merge decision' };

      case 'manual_apply':
        if (!s.proposalApproved) return { status: 'pending', detail: 'Needs an Owner-approved proposal' };
        return s.appliedNewVersion
          ? { status: 'complete', detail: 'New Brand Brain version applied (previous preserved)' }
          : { status: 'manual_required', detail: 'Owner must manually apply the approved proposal' };
    }
  };

  return CORE_V1_FLOW.map(stage => {
    const { status, detail } = stageStatus(stage.key);
    return {
      key: stage.key,
      order: stage.order,
      label: stage.label,
      description: stage.description,
      safetyNote: stage.safetyNote,
      status,
      detail,
    };
  });
}

/** Roll-up of the flow status for a headline chip. */
export interface CoreV1FlowSummary {
  total: number;
  complete: number;
  blocked: number;
  manualRequired: number;
  /** True when nothing is blocked — the flow is healthy (may still need manual steps). */
  healthy: boolean;
}

export function summarizeCoreV1Flow(states: CoreV1StageState[]): CoreV1FlowSummary {
  const complete = states.filter(x => x.status === 'complete').length;
  const blocked = states.filter(x => x.status === 'blocked').length;
  const manualRequired = states.filter(x => x.status === 'manual_required').length;
  return {
    total: states.length,
    complete,
    blocked,
    manualRequired,
    healthy: blocked === 0,
  };
}

// ---------------------------------------------------------------------------
// Plain-text render — copyable local summary. Emits no URL/link, touches nothing.
// ---------------------------------------------------------------------------

export function renderCoreV1FlowText(
  states: CoreV1StageState[],
  activeContext: ActiveBrandBrainContext | null,
  title = 'CORE V1 Integration Flow',
): string {
  const lines: string[] = [];
  lines.push(`CORE V1 INTEGRATION FLOW (LOCAL/DEMO) — ${title}`);
  lines.push(
    activeContext
      ? `Official context: ${activeContext.versionLabel} · brand ${activeContext.brandName}`
      : 'Official context: no applied Brand Brain version yet',
  );
  lines.push('');
  lines.push('FLOW STATUS');
  for (const st of states) {
    lines.push(`- ${st.order}. ${st.label}: ${CORE_V1_STAGE_STATUS_LABEL[st.status]} — ${st.detail}`);
    lines.push(`    safety: ${st.safetyNote}`);
  }
  lines.push('');
  lines.push('SAFETY');
  for (const note of CORE_V1_FLOW_SAFETY_NOTES) lines.push(`- ${note}`);
  return lines.join('\n');
}
