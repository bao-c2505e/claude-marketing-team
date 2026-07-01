// ---------------------------------------------------------------------------
// Brand Brain Update Proposal & Owner Merge Gate (Phase Y) — pure, local,
// deterministic
//
// Sits ON TOP of Phase X (`brandBrainLearning.ts`). Phase X lets the Owner
// ACCEPT / REJECT campaign LEARNING CANDIDATES. Phase Y turns the ACCEPTED
// candidates into an explicit, reviewable BRAND BRAIN UPDATE PROPOSAL — with a
// before/after snapshot, a visible diff, and a SEPARATE Owner merge-approval gate.
//
//   • Accepted learning does NOT automatically update the Brand Brain. Generating
//     a proposal only PREPARES a change set; it never writes to, mutates, or
//     auto-updates the Brand Brain source of truth (`brandBrain.ts` has no mutator
//     and none is added here).
//   • Only ACCEPTED learning candidates are used. Rejected / pending / unreviewed
//     candidates are ignored (filtered out) — never proposed.
//   • The Brand Brain update proposal is SEPARATE from learning acceptance and
//     requires its own EXPLICIT Owner decision (approve / reject / request
//     revision) before it can be marked `ready_for_manual_apply`.
//   • `ready_for_manual_apply` is NOT auto-apply. Applying a proposal to the Brand
//     Brain is a separate, later, manual Owner step outside this layer. Every
//     proposal carries `persisted_to_brand_brain: false`, `is_applied_to_brand_brain:
//     false`, `auto_applied: false`, `requires_owner_approval_to_apply: true`.
//   • No fabricated metrics, no live analytics, no connector, no AI/API/network
//     call. `based_on_live_analytics` is always false. Weak/missing evidence and
//     vague changes raise SAFETY FLAGS for the Owner rather than being asserted.
//   • Full local audit trail: generation + every decision appends an immutable
//     entry (actor, action, from/to status, notes, timestamp).
//
// Pure & deterministic: the generator is a fixed function of its inputs (plus an
// injectable `now` / ids), decision helpers return NEW proposal objects (no in-place
// mutation), and there is no storage / DB / network / connector — trivially
// unit-testable. See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output Status),
// §7 (Connectors).
// ---------------------------------------------------------------------------

import { generateId } from './coreData';
import type { BrandBrain } from './brandBrain';
import type { LearningCandidateReview } from './brandBrainLearning';
import type { LearningCandidateKind } from './manualResultReview';

// ---------------------------------------------------------------------------
// Status + decision enums, labels, colors
// ---------------------------------------------------------------------------

/** Lifecycle of a Brand Brain update proposal. Never an external-world state. */
export type BrandBrainProposalStatus =
  | 'draft'
  | 'pending_owner_approval'
  | 'owner_approved'
  | 'owner_rejected'
  | 'revision_requested';

export const BRAND_BRAIN_PROPOSAL_STATUS_LABEL: Record<BrandBrainProposalStatus, string> = {
  draft:                  'Draft — nothing to approve yet',
  pending_owner_approval: 'Pending Owner approval',
  owner_approved:         'Owner approved — ready for manual apply',
  owner_rejected:         'Owner rejected — not applied',
  revision_requested:     'Revision requested',
};

export const BRAND_BRAIN_PROPOSAL_STATUS_COLOR: Record<BrandBrainProposalStatus, string> = {
  draft:                  '#94a3b8',
  pending_owner_approval: '#fbbf24',
  owner_approved:         '#34d399',
  owner_rejected:         '#f87171',
  revision_requested:     '#60a5fa',
};

/** An explicit Owner decision on a proposal. */
export type BrandBrainProposalDecision = 'approved' | 'rejected' | 'revision_requested';

/** The Brand Brain sections a proposal can touch (the change surface). */
export type BrandBrainSectionKey =
  | 'positioning'
  | 'audience'
  | 'tone'
  | 'offer'
  | 'productPriority'
  | 'creativeDirection'
  | 'dos'
  | 'donts'
  | 'evidenceNotes';

export const BRAND_BRAIN_SECTION_LABEL: Record<BrandBrainSectionKey, string> = {
  positioning:       'Positioning',
  audience:          'Audience',
  tone:              'Tone / Voice',
  offer:             'Offer',
  productPriority:   'Product Priority',
  creativeDirection: 'Creative Direction',
  dos:               "Do's",
  donts:             "Don'ts",
  evidenceNotes:     'Evidence Notes',
};

/** The BrandBrain field each section maps to (used to build before/after + diff). */
export const BRAND_BRAIN_SECTION_FIELD: Record<BrandBrainSectionKey, keyof BrandBrainSectionSnapshot> = {
  positioning:       'positioning',
  audience:          'audience',
  tone:              'tone',
  offer:             'offer',
  productPriority:   'productPriority',
  creativeDirection: 'creativeDirection',
  dos:               'dos',
  donts:             'donts',
  evidenceNotes:     'evidenceNotes',
};

/**
 * Deterministic mapping of a learning-candidate KIND to the Brand Brain section
 * it proposes a change to:
 *   • repeat  → Creative Direction (angles that worked → keep doing)
 *   • avoid   → Don'ts (issues noted → avoid repeating)
 *   • investigate → Evidence Notes (incomplete data → gather more; needs review)
 */
export const CANDIDATE_KIND_SECTION: Record<LearningCandidateKind, BrandBrainSectionKey> = {
  repeat:      'creativeDirection',
  avoid:       'donts',
  investigate: 'evidenceNotes',
};

// ---------------------------------------------------------------------------
// Safety flags + copy
// ---------------------------------------------------------------------------

export type BrandBrainProposalSafetyFlag =
  | 'weak_or_missing_evidence'
  | 'vague_change_needs_owner_review'
  | 'no_accepted_candidates'
  | 'not_based_on_live_analytics'
  | 'no_fabricated_metrics';

export const BRAND_BRAIN_PROPOSAL_SAFETY_FLAG_LABEL: Record<BrandBrainProposalSafetyFlag, string> = {
  weak_or_missing_evidence:        'Weak or missing evidence',
  vague_change_needs_owner_review: 'Vague change — needs Owner review',
  no_accepted_candidates:          'No accepted candidates — nothing proposed',
  not_based_on_live_analytics:     'Not based on live analytics',
  no_fabricated_metrics:           'No fabricated metrics',
};

export const BRAND_BRAIN_PROPOSAL_SAFETY_FLAG_COLOR: Record<BrandBrainProposalSafetyFlag, string> = {
  weak_or_missing_evidence:        '#fbbf24',
  vague_change_needs_owner_review: '#fbbf24',
  no_accepted_candidates:          '#94a3b8',
  not_based_on_live_analytics:     '#60a5fa',
  no_fabricated_metrics:           '#60a5fa',
};

/** Stable display/dedupe order for safety flags. */
export const PROPOSAL_SAFETY_FLAG_ORDER: BrandBrainProposalSafetyFlag[] = [
  'no_accepted_candidates',
  'weak_or_missing_evidence',
  'vague_change_needs_owner_review',
  'not_based_on_live_analytics',
  'no_fabricated_metrics',
];

/** Standing safety notes carried on every proposal (asserted by tests + UI). */
export const BRAND_BRAIN_PROPOSAL_SAFETY_NOTES: string[] = [
  'Accepted learning does not automatically update Brand Brain.',
  'Brand Brain update requires explicit Owner approval.',
  'This proposal is not based on live analytics.',
  'Owner approval only marks the proposal ready for a separate, manual apply step — it is never auto-applied.',
  'Approved ≠ Published. Client Accepted ≠ Published.',
  'No fabricated metrics, no connector, no AI/API/network call, no auto-post, no auto-ads — local/demo only.',
];

/** Local/demo provenance badges shown on the panel. */
export const BRAND_BRAIN_PROPOSAL_LOCAL_ONLY_BADGES: string[] = [
  'Local/demo only',
  'Proposal preview only',
  'Owner-only merge gate',
  'Not applied to Brand Brain',
];

// Minimum non-whitespace length before a proposed change is treated as concrete
// rather than "vague" (which raises a safety flag for the Owner to review).
const VAGUE_INSIGHT_MIN_LENGTH = 15;

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

/** A subset of Brand Brain fields, uniformly modeled as string lists for diffing. */
export interface BrandBrainSectionSnapshot {
  positioning: string[];
  audience: string[];
  tone: string[];
  offer: string[];
  productPriority: string[];
  creativeDirection: string[];
  dos: string[];
  donts: string[];
  evidenceNotes: string[];
}

/** One proposed change to a Brand Brain section, derived from ONE accepted candidate. */
export interface ProposedSectionChange {
  section: BrandBrainSectionKey;
  sectionLabel: string;
  sourceCandidateId: string;
  kind: LearningCandidateKind;
  insight: string;
  /** Evidence source / basis carried from the learning candidate. */
  basis: string;
  /** The proposed additions to the section (the insight, deduped against existing). */
  additions: string[];
  /** Risk / uncertainty note (null when the change is concrete + well-evidenced). */
  riskNote: string | null;
}

/** One diff row: existing value vs proposed value, plus reason + risk. */
export interface BrandBrainDiffEntry {
  section: BrandBrainSectionKey;
  sectionLabel: string;
  /** Existing Brand Brain value for this section. */
  before: string[];
  /** Proposed new value = before + net-new additions. */
  proposedAfter: string[];
  /** Net-new additions only (not already present in `before`). */
  additions: string[];
  /** Reason / evidence source for the change. */
  reason: string;
  /** Risk or uncertainty note (null when none). */
  risk: string | null;
}

export interface BrandBrainDiffSummary {
  entries: BrandBrainDiffEntry[];
  totalAdditions: number;
  changedSections: number;
  hasChanges: boolean;
}

export interface BrandBrainProposalOwnerDecision {
  decidedBy: string | null;
  decidedAt: string | null;
  decision: BrandBrainProposalDecision | null;
  notes: string | null;
}

export type BrandBrainProposalAuditAction =
  | 'generated'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export interface BrandBrainProposalAuditEntry {
  id: string;
  at: string;
  actor: string | null;
  action: BrandBrainProposalAuditAction;
  fromStatus: BrandBrainProposalStatus | null;
  toStatus: BrandBrainProposalStatus;
  notes: string | null;
}

/** The Phase Y Brand Brain update proposal artifact — never a BrandBrain, never applied. */
export interface BrandBrainUpdateProposal {
  proposalId: string;
  brandId: string | null;
  brandName: string;
  sourceCampaignId: string | null;
  sourceManualResultReviewId: string | null;
  sourceLearningCandidateIds: string[];
  proposalStatus: BrandBrainProposalStatus;
  proposedSections: ProposedSectionChange[];
  beforeSnapshot: BrandBrainSectionSnapshot;
  proposedAfterSnapshot: BrandBrainSectionSnapshot;
  diffSummary: BrandBrainDiffSummary;
  ownerDecision: BrandBrainProposalOwnerDecision;
  safetyFlags: BrandBrainProposalSafetyFlag[];
  safetyNotes: string[];
  auditTrail: BrandBrainProposalAuditEntry[];
  // ── Structural guarantees — a proposal is never applied / persisted here. ──
  requires_owner_approval_to_apply: true;
  persisted_to_brand_brain: false;
  is_applied_to_brand_brain: false;
  auto_applied: false;
  based_on_live_analytics: false;
  /** True ONLY after explicit Owner approval — a separate manual apply is still required. */
  ready_for_manual_apply: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Snapshot helpers — project a BrandBrain into the diffable section snapshot.
// ---------------------------------------------------------------------------

/** Deduping, whitespace-trimming union of optional strings (stable order). */
function uniq(values: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const t = (v ?? '').trim();
    if (t && !out.some(x => x.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out;
}

/** Build the diffable section snapshot from a full Brand Brain. Pure, read-only. */
export function toSectionSnapshot(brain: BrandBrain): BrandBrainSectionSnapshot {
  return {
    positioning:       uniq([brain.positioning]),
    audience:          uniq(brain.targetCustomers),
    tone:              uniq(brain.brandVoice),
    offer:             uniq(brain.offers),
    productPriority:   uniq(brain.products),
    creativeDirection: uniq(brain.contentPillars),
    dos:               uniq(brain.creativeDos),
    donts:             uniq(brain.creativeDonts),
    evidenceNotes:     uniq(brain.ownerNotes),
  };
}

function cloneSnapshot(s: BrandBrainSectionSnapshot): BrandBrainSectionSnapshot {
  return {
    positioning:       [...s.positioning],
    audience:          [...s.audience],
    tone:              [...s.tone],
    offer:             [...s.offer],
    productPriority:   [...s.productPriority],
    creativeDirection: [...s.creativeDirection],
    dos:               [...s.dos],
    donts:             [...s.donts],
    evidenceNotes:     [...s.evidenceNotes],
  };
}

/** Additions in `insight` not already present (case-insensitive) in `existing`. */
function netNewAdditions(existing: string[], insight: string): string[] {
  const t = insight.trim();
  if (!t) return [];
  return existing.some(x => x.toLowerCase() === t.toLowerCase()) ? [] : [t];
}

// ---------------------------------------------------------------------------
// Generation — accepted candidates → proposal. Rejected / pending are ignored.
// ---------------------------------------------------------------------------

export interface GenerateProposalParams {
  /** Current Brand Brain (source of truth) — read only, never mutated. */
  brain: BrandBrain;
  /**
   * Owner review list from Phase X. Only entries with `decision === 'accepted'`
   * are used; rejected / pending / unreviewed candidates are ignored.
   */
  reviews: LearningCandidateReview[];
  sourceCampaignId?: string | null;
  sourceManualResultReviewId?: string | null;
  now?: Date;
  /** Injectable ids for deterministic tests. */
  proposalId?: string;
  auditId?: string;
}

/**
 * Convert the Owner-ACCEPTED learning candidates into a Brand Brain update
 * proposal. Deterministic and pure — never writes to the Brand Brain. Rejected,
 * pending, and unreviewed candidates are excluded. Weak-evidence and vague
 * changes raise safety flags rather than being asserted as fact.
 */
export function generateBrandBrainUpdateProposal(params: GenerateProposalParams): BrandBrainUpdateProposal {
  const { brain } = params;
  const now = params.now ?? new Date();
  const iso = now.toISOString();

  // Only ACCEPTED candidates may be used — everything else is ignored.
  const accepted = params.reviews.filter(r => r.decision === 'accepted');

  const beforeSnapshot = toSectionSnapshot(brain);
  const afterSnapshot = cloneSnapshot(beforeSnapshot);

  const proposedSections: ProposedSectionChange[] = [];
  const flags = new Set<BrandBrainProposalSafetyFlag>();
  // These two are always true for this layer, by construction.
  flags.add('not_based_on_live_analytics');
  flags.add('no_fabricated_metrics');

  for (const r of accepted) {
    const section = CANDIDATE_KIND_SECTION[r.kind];
    const field = BRAND_BRAIN_SECTION_FIELD[section];
    const insight = r.insight.trim();

    // Compute additions against the (already-accumulated) after snapshot so two
    // accepted candidates proposing the same text don't double-add.
    const additions = netNewAdditions(afterSnapshot[field], insight);
    for (const a of additions) afterSnapshot[field].push(a);

    // Risk / safety assessment for THIS change.
    const riskNotes: string[] = [];
    const vague = insight.length < VAGUE_INSIGHT_MIN_LENGTH;
    const weakEvidence = r.kind === 'investigate' || /incomplete|weak|insufficient|missing/i.test(r.basis);
    if (vague) {
      riskNotes.push('Proposed change is vague — Owner review needed before apply.');
      flags.add('vague_change_needs_owner_review');
    }
    if (weakEvidence) {
      riskNotes.push('Evidence is weak or incomplete — gather more before relying on this.');
      flags.add('weak_or_missing_evidence');
    }

    proposedSections.push({
      section,
      sectionLabel: BRAND_BRAIN_SECTION_LABEL[section],
      sourceCandidateId: r.id,
      kind: r.kind,
      insight,
      basis: r.basis,
      additions,
      riskNote: riskNotes.length ? riskNotes.join(' ') : null,
    });
  }

  if (accepted.length === 0) flags.add('no_accepted_candidates');

  const diffSummary = buildProposalDiff(beforeSnapshot, afterSnapshot, proposedSections);

  // Nothing to approve until there is at least one accepted candidate.
  const proposalStatus: BrandBrainProposalStatus =
    accepted.length === 0 ? 'draft' : 'pending_owner_approval';

  const audit: BrandBrainProposalAuditEntry = {
    id: params.auditId ?? generateId('bbup-audit'),
    at: iso,
    actor: null,
    action: 'generated',
    fromStatus: null,
    toStatus: proposalStatus,
    notes: `Generated from ${accepted.length} accepted learning candidate(s).`,
  };

  return {
    proposalId: params.proposalId ?? generateId('bbup'),
    brandId: brain.brandId ?? null,
    brandName: brain.brandName,
    sourceCampaignId: params.sourceCampaignId ?? null,
    sourceManualResultReviewId: params.sourceManualResultReviewId ?? null,
    sourceLearningCandidateIds: accepted.map(r => r.id),
    proposalStatus,
    proposedSections,
    beforeSnapshot,
    proposedAfterSnapshot: afterSnapshot,
    diffSummary,
    ownerDecision: { decidedBy: null, decidedAt: null, decision: null, notes: null },
    safetyFlags: PROPOSAL_SAFETY_FLAG_ORDER.filter(f => flags.has(f)),
    safetyNotes: [...BRAND_BRAIN_PROPOSAL_SAFETY_NOTES],
    auditTrail: [audit],
    requires_owner_approval_to_apply: true,
    persisted_to_brand_brain: false,
    is_applied_to_brand_brain: false,
    auto_applied: false,
    based_on_live_analytics: false,
    ready_for_manual_apply: false,
    createdAt: iso,
    updatedAt: iso,
  };
}

// ---------------------------------------------------------------------------
// Diff preview — pure logic over before/after snapshots.
// ---------------------------------------------------------------------------

/**
 * Build a clear, testable diff: for every section that has a proposed change,
 * show the existing value, the proposed new value, the reason/evidence source,
 * and any risk/uncertainty note. Pure — no side effects.
 */
export function buildProposalDiff(
  before: BrandBrainSectionSnapshot,
  after: BrandBrainSectionSnapshot,
  proposedSections: ProposedSectionChange[],
): BrandBrainDiffSummary {
  const entries: BrandBrainDiffEntry[] = [];

  // Group proposed changes by section, preserving section display order.
  const order: BrandBrainSectionKey[] = [
    'positioning', 'audience', 'tone', 'offer', 'productPriority',
    'creativeDirection', 'dos', 'donts', 'evidenceNotes',
  ];

  for (const section of order) {
    const changes = proposedSections.filter(c => c.section === section);
    if (changes.length === 0) continue;
    const field = BRAND_BRAIN_SECTION_FIELD[section];
    const additions = changes.flatMap(c => c.additions);
    if (additions.length === 0) continue; // nothing net-new for this section

    const reasons = uniq(changes.map(c => c.basis));
    const risks = changes.map(c => c.riskNote).filter((x): x is string => !!x);

    entries.push({
      section,
      sectionLabel: BRAND_BRAIN_SECTION_LABEL[section],
      before: [...before[field]],
      proposedAfter: [...after[field]],
      additions,
      reason: reasons.join(' · '),
      risk: risks.length ? uniq(risks).join(' ') : null,
    });
  }

  const totalAdditions = entries.reduce((n, e) => n + e.additions.length, 0);
  return {
    entries,
    totalAdditions,
    changedSections: entries.length,
    hasChanges: totalAdditions > 0,
  };
}

// ---------------------------------------------------------------------------
// Owner merge gate — explicit approve / reject / request-revision decisions.
// Pure: each returns a NEW proposal (or the SAME reference on an invalid no-op).
// ---------------------------------------------------------------------------

/** Statuses from which an explicit Owner decision is allowed. */
const DECIDABLE_STATUSES = new Set<BrandBrainProposalStatus>([
  'pending_owner_approval',
  'revision_requested',
]);

export interface ProposalDecisionOpts {
  actor?: string;
  notes?: string;
  now?: string;
  /** Injectable audit id for deterministic tests. */
  auditId?: string;
}

const DECISION_TO_STATUS: Record<BrandBrainProposalDecision, BrandBrainProposalStatus> = {
  approved:           'owner_approved',
  rejected:           'owner_rejected',
  revision_requested: 'revision_requested',
};

const DECISION_TO_ACTION: Record<BrandBrainProposalDecision, BrandBrainProposalAuditAction> = {
  approved:           'approved',
  rejected:           'rejected',
  revision_requested: 'revision_requested',
};

/**
 * Apply an explicit Owner decision to a proposal. Only valid when the proposal is
 * awaiting a decision (`pending_owner_approval` / `revision_requested`) — otherwise
 * a no-op returning the SAME reference (so a draft or an already-decided proposal
 * is never silently changed). Approval sets `ready_for_manual_apply: true` but NEVER
 * persists or applies to the Brand Brain. Appends an immutable audit entry.
 */
export function decideBrandBrainUpdateProposal(
  proposal: BrandBrainUpdateProposal,
  decision: BrandBrainProposalDecision,
  opts: ProposalDecisionOpts = {},
): BrandBrainUpdateProposal {
  if (!DECIDABLE_STATUSES.has(proposal.proposalStatus)) return proposal;

  const at = opts.now ?? new Date().toISOString();
  const actor = opts.actor?.trim() || null;
  const notes = opts.notes?.trim() || null;
  const toStatus = DECISION_TO_STATUS[decision];

  const audit: BrandBrainProposalAuditEntry = {
    id: opts.auditId ?? generateId('bbup-audit'),
    at,
    actor,
    action: DECISION_TO_ACTION[decision],
    fromStatus: proposal.proposalStatus,
    toStatus,
    notes,
  };

  return {
    ...proposal,
    proposalStatus: toStatus,
    ownerDecision: { decidedBy: actor, decidedAt: at, decision, notes },
    // Approval ONLY marks readiness for a separate manual apply — never auto-apply.
    ready_for_manual_apply: decision === 'approved',
    auditTrail: [...proposal.auditTrail, audit],
    updatedAt: at,
  };
}

/** Explicit Owner APPROVAL — marks ready for a separate manual apply step. */
export function approveBrandBrainUpdateProposal(
  proposal: BrandBrainUpdateProposal,
  opts: ProposalDecisionOpts = {},
): BrandBrainUpdateProposal {
  return decideBrandBrainUpdateProposal(proposal, 'approved', opts);
}

/** Explicit Owner REJECTION — proposal is not applied. */
export function rejectBrandBrainUpdateProposal(
  proposal: BrandBrainUpdateProposal,
  opts: ProposalDecisionOpts = {},
): BrandBrainUpdateProposal {
  return decideBrandBrainUpdateProposal(proposal, 'rejected', opts);
}

/** Explicit Owner REVISION request — sends the proposal back for changes. */
export function requestBrandBrainUpdateRevision(
  proposal: BrandBrainUpdateProposal,
  opts: ProposalDecisionOpts = {},
): BrandBrainUpdateProposal {
  return decideBrandBrainUpdateProposal(proposal, 'revision_requested', opts);
}

/** Newest-first ordered audit list (stable display). */
export function listProposalAudit(proposal: BrandBrainUpdateProposal): BrandBrainProposalAuditEntry[] {
  return [...proposal.auditTrail].sort((a, b) => b.at.localeCompare(a.at));
}

// ---------------------------------------------------------------------------
// Plain-text render — copyable local summary. Pure: returns a string, never
// touches clipboard/DOM/network, and never emits a URL/link.
// ---------------------------------------------------------------------------

export function renderBrandBrainUpdateProposalText(
  proposal: BrandBrainUpdateProposal,
  title = 'Brand Brain Update Proposal',
): string {
  const lines: string[] = [];
  lines.push(`BRAND BRAIN UPDATE PROPOSAL (LOCAL/DEMO) — ${title}`);
  lines.push(`Brand: ${proposal.brandName}`);
  lines.push(`Status: ${BRAND_BRAIN_PROPOSAL_STATUS_LABEL[proposal.proposalStatus]}`);
  lines.push('Accepted learning does not automatically update Brand Brain — this proposal requires explicit Owner approval.');
  lines.push('');

  lines.push('DIFF PREVIEW (existing → proposed)');
  if (!proposal.diffSummary.hasChanges) {
    lines.push('- (No proposed changes — no accepted candidates.)');
  } else {
    for (const e of proposal.diffSummary.entries) {
      lines.push(`- ${e.sectionLabel}`);
      lines.push(`    existing: ${e.before.length ? e.before.join(' | ') : '(empty)'}`);
      lines.push(`    proposed: ${e.proposedAfter.join(' | ')}`);
      lines.push(`    + adds:   ${e.additions.join(' | ')}`);
      lines.push(`    reason:   ${e.reason}`);
      if (e.risk) lines.push(`    risk:     ${e.risk}`);
    }
  }
  lines.push('');

  if (proposal.safetyFlags.length > 0) {
    lines.push('SAFETY FLAGS');
    for (const f of proposal.safetyFlags) lines.push(`- ${BRAND_BRAIN_PROPOSAL_SAFETY_FLAG_LABEL[f]}`);
    lines.push('');
  }

  if (proposal.ownerDecision.decision) {
    lines.push('OWNER DECISION');
    const who = proposal.ownerDecision.decidedBy ? ` by ${proposal.ownerDecision.decidedBy}` : '';
    const why = proposal.ownerDecision.notes ? ` — ${proposal.ownerDecision.notes}` : '';
    lines.push(`- ${proposal.ownerDecision.decision}${who}${why}`);
    lines.push(`- Ready for manual apply: ${proposal.ready_for_manual_apply ? 'YES (manual step, not auto-applied)' : 'NO'}`);
    lines.push('');
  }

  lines.push('APPLY STATE');
  lines.push('- Applied to Brand Brain: NO · Persisted: NO · Auto-applied: NO · Requires separate Owner approval to apply: YES');
  lines.push('');

  lines.push('SAFETY');
  for (const s of proposal.safetyNotes) lines.push(`- ${s}`);

  return lines.join('\n');
}
