// ---------------------------------------------------------------------------
// Owner-approved Campaign Learning Memory — Brand Brain Learning Candidate
// Approval (Phase X) — pure, local, deterministic
//
// Turns the Phase W Brand Brain LEARNING CANDIDATES (see manualResultReview.ts)
// into an Owner-reviewed ACCEPT / REJECT / RESET decision flow, and prepares a
// Brand Brain UPDATE PROPOSAL from the accepted candidates only.
//
//   • Owner is the ONLY approval authority here. A decision is a local, explicit
//     Owner action — never automatic, never derived from analytics, never a
//     connector callback.
//   • Accepted ≠ applied. Accepting a candidate ONLY marks it for a prepared
//     proposal. This layer NEVER writes to, mutates, or auto-updates the Brand
//     Brain source of truth (`brandBrain.ts` has no mutator and none is added).
//     Every review carries `is_applied_to_brand_brain: false`; every proposal
//     carries `persisted_to_brand_brain: false` + `is_applied_to_brand_brain:
//     false` + `requires_owner_approval_to_apply: true`.
//   • Rejected / pending candidates are NOT used — only `accepted` reviews reach
//     the prepared proposal.
//   • Full local audit trail: every decision appends an immutable entry
//     (candidate source id, action, actor, reason, timestamp).
//   • No fabricated metrics. This layer only re-labels Phase W candidates (which
//     are already "based on provided manual data") — it invents no numbers, pulls
//     no analytics, makes no AI/API/network call, and uses no connector.
//
// Pure & deterministic: mutators return NEW arrays (no in-place mutation), the
// proposal builder is a fixed function of its inputs (plus injectable `now`), and
// there is no storage / DB / network / connector — trivially unit-testable. The UI
// panel holds the decision + audit state in local React state. See CLAUDE.md
// §3 (Workflow), §4 (Safety), §6 (Output Status), §7 (Connectors).
// ---------------------------------------------------------------------------

import { generateId } from './coreData';
import type { LearningCandidate, LearningCandidateKind } from './manualResultReview';

// ---------------------------------------------------------------------------
// Decision + audit enums, labels, colors
// ---------------------------------------------------------------------------

/** Owner decision on one learning candidate. `pending` is also the "reset" target. */
export type LearningDecision = 'pending' | 'accepted' | 'rejected';

export const LEARNING_DECISIONS: LearningDecision[] = ['pending', 'accepted', 'rejected'];

const DECISION_SET = new Set<string>(LEARNING_DECISIONS);

export const LEARNING_DECISION_LABEL: Record<LearningDecision, string> = {
  pending:  'Learning candidate — awaiting Owner review',
  accepted: 'Accepted for Brand Brain update (prepared only)',
  rejected: 'Rejected / not used',
};

export const LEARNING_DECISION_COLOR: Record<LearningDecision, string> = {
  pending:  '#94a3b8',
  accepted: '#34d399',
  rejected: '#f87171',
};

/** Audit action derived from a decision (a `pending` decision after a prior one is a reset). */
export type LearningReviewAction = 'accepted' | 'rejected' | 'reset';

export const LEARNING_ACTION_LABEL: Record<LearningReviewAction, string> = {
  accepted: 'Accepted',
  rejected: 'Rejected',
  reset:    'Reset to pending',
};

// ---------------------------------------------------------------------------
// Verbatim safety copy — exported so the panel + tests reference one source.
// ---------------------------------------------------------------------------

/** Standing safety notes carried on the panel + copied text (asserted by tests). */
export const BRAND_BRAIN_LEARNING_SAFETY_NOTES: string[] = [
  'Learning candidate only — an Owner decision here does not change any published content.',
  'Accepted ≠ already written to Brand Brain — accepting only prepares a proposal.',
  'Prepared update only — not silently persisted. Brand Brain is not updated automatically.',
  'Brand Brain source of truth is never mutated here; applying a proposal is a separate, later Owner-approved step.',
  'Approved ≠ Published. Client Accepted ≠ Published.',
  'No live analytics, no connector, no AI/API/network call, no auto-post, no auto-ads — local/demo review only.',
];

/** Local/demo provenance badges shown on the panel. */
export const BRAND_BRAIN_LEARNING_LOCAL_ONLY_BADGES: string[] = [
  'Local/demo only',
  'Candidate review only',
  'Owner-only decision',
  'Not written to Brand Brain',
];

/** Note carried on every prepared proposal. */
export const BRAND_BRAIN_UPDATE_PROPOSAL_NOTE =
  'Prepared Brand Brain update proposal (preview only) — built from Owner-accepted candidates. ' +
  'Not applied and not persisted to Brand Brain; applying requires a separate, later Owner-approved step.';

// ---------------------------------------------------------------------------
// Candidate key — deterministic, stable across Phase W re-derivation.
// ---------------------------------------------------------------------------

/**
 * A stable id for a learning candidate derived from its content (kind + insight),
 * so Owner decisions survive Phase W re-deriving candidates from the same evidence.
 * Not cryptographic — just a stable, collision-resistant-enough key for local state.
 */
export function candidateKey(c: Pick<LearningCandidate, 'kind' | 'insight'>): string {
  return `bbl:${c.kind}::${c.insight}`;
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export interface LearningCandidateReview {
  /** Stable id = candidateKey(candidate). */
  id: string;
  kind: LearningCandidateKind;
  label: string;
  insight: string;
  basis: string;
  decision: LearningDecision;
  /** Optional Owner note attached to the decision. */
  reason: string | null;
  /** Actor label who made the decision (Owner). */
  decidedBy: string | null;
  decidedAt: string | null;
  /** Structural guarantee — a review is NEVER applied to the Brand Brain here. */
  is_applied_to_brand_brain: false;
}

export interface LearningReviewAuditEntry {
  id: string;
  /** Source candidate id the decision was made on. */
  candidateId: string;
  action: LearningReviewAction;
  reason: string | null;
  actor: string | null;
  at: string;
}

export interface BrandBrainUpdateProposalAddition {
  candidateId: string;
  kind: LearningCandidateKind;
  insight: string;
  basis: string;
}

export interface BrandBrainUpdateProposal {
  note: string;
  proposedAdditions: BrandBrainUpdateProposalAddition[];
  accepted_count: number;
  rejected_count: number;
  pending_count: number;
  /** Structural guarantees — Brand Brain is never written to from here. */
  persisted_to_brand_brain: false;
  is_applied_to_brand_brain: false;
  requires_owner_approval_to_apply: true;
  safetyNotes: string[];
  generatedAt: string;
}

export interface LearningReviewSummary {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

// ---------------------------------------------------------------------------
// init — build pending reviews from Phase W candidates, carrying prior decisions.
// ---------------------------------------------------------------------------

/**
 * Build the Owner review list from Phase W learning candidates. Deduped by stable
 * id (first wins). When `prior` reviews are supplied (e.g. after Phase W re-derives
 * candidates from edited evidence), an existing decision is carried forward by id;
 * candidates that disappeared are dropped and new ones start `pending`. Pure.
 */
export function initLearningReviews(
  candidates: LearningCandidate[],
  prior: LearningCandidateReview[] = [],
): LearningCandidateReview[] {
  const priorById = new Map(prior.map(r => [r.id, r]));
  const out: LearningCandidateReview[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    const id = candidateKey(c);
    if (seen.has(id)) continue;
    seen.add(id);
    const p = priorById.get(id);
    out.push({
      id,
      kind: c.kind,
      label: c.label,
      insight: c.insight,
      basis: c.basis,
      decision: p?.decision ?? 'pending',
      reason: p?.reason ?? null,
      decidedBy: p?.decidedBy ?? null,
      decidedAt: p?.decidedAt ?? null,
      is_applied_to_brand_brain: false,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// decision mutator — pure; returns NEW reviews + audit arrays (or same on no-op).
// ---------------------------------------------------------------------------

export interface ApplyDecisionOpts {
  reason?: string;
  actor?: string;
  now?: string;
  /** Injectable audit id for deterministic tests. */
  auditId?: string;
}

export interface ApplyDecisionResult {
  reviews: LearningCandidateReview[];
  audit: LearningReviewAuditEntry[];
}

/**
 * Apply an Owner decision to one candidate and append an immutable audit entry.
 * Pure — returns NEW arrays. An unknown id or an invalid decision is a no-op that
 * returns the SAME array references (and no audit entry). A `pending` decision on a
 * previously-decided candidate clears the decision metadata and audits as `reset`.
 */
export function applyLearningDecision(
  reviews: LearningCandidateReview[],
  audit: LearningReviewAuditEntry[],
  id: string,
  decision: LearningDecision,
  opts: ApplyDecisionOpts = {},
): ApplyDecisionResult {
  if (!DECISION_SET.has(decision)) return { reviews, audit };
  const target = reviews.find(r => r.id === id);
  if (!target) return { reviews, audit };

  const now = opts.now ?? new Date().toISOString();
  const reason = opts.reason?.trim() || null;
  const actor = opts.actor?.trim() || null;

  const nextReviews = reviews.map(r => {
    if (r.id !== id) return r;
    if (decision === 'pending') {
      return { ...r, decision, reason: null, decidedBy: null, decidedAt: null };
    }
    return { ...r, decision, reason, decidedBy: actor, decidedAt: now };
  });

  const action: LearningReviewAction = decision === 'pending' ? 'reset' : decision;
  const entry: LearningReviewAuditEntry = {
    id: opts.auditId ?? generateId('bbla'),
    candidateId: id,
    action,
    reason,
    actor,
    at: now,
  };

  return { reviews: nextReviews, audit: [...audit, entry] };
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

export function summarizeLearningReviews(reviews: LearningCandidateReview[]): LearningReviewSummary {
  let pending = 0, accepted = 0, rejected = 0;
  for (const r of reviews) {
    if (r.decision === 'accepted') accepted += 1;
    else if (r.decision === 'rejected') rejected += 1;
    else pending += 1;
  }
  return { total: reviews.length, pending, accepted, rejected };
}

/** Newest-first ordered audit list (stable display). */
export function listLearningAudit(audit: LearningReviewAuditEntry[]): LearningReviewAuditEntry[] {
  return [...audit].sort((a, b) => b.at.localeCompare(a.at));
}

// ---------------------------------------------------------------------------
// Prepared Brand Brain update proposal — accepted-only, never applied.
// ---------------------------------------------------------------------------

export interface BuildProposalParams {
  now?: Date;
}

/**
 * Build a PREPARED Brand Brain update proposal from the Owner-accepted candidates
 * only. Rejected + pending candidates are excluded (not used). The result is a
 * proposal artifact — structurally distinct from a `BrandBrain` — and is never
 * persisted or applied. Pure.
 */
export function buildBrandBrainUpdateProposal(
  reviews: LearningCandidateReview[],
  params: BuildProposalParams = {},
): BrandBrainUpdateProposal {
  const now = params.now ?? new Date();
  const summary = summarizeLearningReviews(reviews);
  const proposedAdditions: BrandBrainUpdateProposalAddition[] = reviews
    .filter(r => r.decision === 'accepted')
    .map(r => ({ candidateId: r.id, kind: r.kind, insight: r.insight, basis: r.basis }));

  return {
    note: BRAND_BRAIN_UPDATE_PROPOSAL_NOTE,
    proposedAdditions,
    accepted_count: summary.accepted,
    rejected_count: summary.rejected,
    pending_count: summary.pending,
    persisted_to_brand_brain: false,
    is_applied_to_brand_brain: false,
    requires_owner_approval_to_apply: true,
    safetyNotes: [...BRAND_BRAIN_LEARNING_SAFETY_NOTES],
    generatedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Plain-text render — copyable local summary. Pure: returns a string, never
// touches clipboard/DOM/network, and never emits a URL/link.
// ---------------------------------------------------------------------------

export function renderBrandBrainUpdateProposalText(
  proposal: BrandBrainUpdateProposal,
  reviews: LearningCandidateReview[],
  title = 'Brand Brain Learning Review',
): string {
  const lines: string[] = [];
  lines.push(`BRAND BRAIN LEARNING REVIEW (LOCAL/DEMO) — ${title}`);
  lines.push(proposal.note);
  lines.push('');
  lines.push(
    `Decisions: ${proposal.accepted_count} accepted · ${proposal.rejected_count} rejected · ${proposal.pending_count} pending`,
  );
  lines.push('');

  lines.push('PREPARED BRAND BRAIN UPDATE PROPOSAL (accepted candidates only)');
  lines.push('- Applied to Brand Brain: NO · Persisted: NO · Requires separate Owner approval to apply: YES');
  if (proposal.proposedAdditions.length === 0) {
    lines.push('- (No accepted candidates — nothing proposed.)');
  } else {
    for (const a of proposal.proposedAdditions) {
      lines.push(`- [${a.kind}] ${a.insight} (basis: ${a.basis})`);
    }
  }
  lines.push('');

  const decided = reviews.filter(r => r.decision !== 'pending');
  if (decided.length > 0) {
    lines.push('DECISIONS');
    for (const r of decided) {
      const who = r.decidedBy ? ` by ${r.decidedBy}` : '';
      const why = r.reason ? ` — ${r.reason}` : '';
      lines.push(`- [${LEARNING_DECISION_LABEL[r.decision]}]${who} ${r.insight}${why}`);
    }
    lines.push('');
  }

  lines.push('SAFETY');
  for (const s of proposal.safetyNotes) lines.push(`- ${s}`);

  return lines.join('\n');
}
