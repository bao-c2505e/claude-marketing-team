import { describe, expect, it } from 'vitest';
import type { LearningCandidate } from './manualResultReview';
import {
  candidateKey,
  initLearningReviews,
  applyLearningDecision,
  summarizeLearningReviews,
  buildBrandBrainUpdateProposal,
  renderBrandBrainUpdateProposalText,
  BRAND_BRAIN_LEARNING_SAFETY_NOTES,
  type LearningCandidateReview,
  type LearningReviewAuditEntry,
} from './brandBrainLearning';

const NOW = '2026-06-30T10:00:00.000Z';
const NOW_DATE = new Date(NOW);

function cand(over: Partial<LearningCandidate> = {}): LearningCandidate {
  return {
    kind: 'repeat',
    label: 'Repeat candidate',
    insight: 'Based on provided manual data, "Facebook Page" showed the strongest signals — consider repeating.',
    basis: 'Owner/Client-provided manual result data',
    persisted: false,
    ...over,
  };
}

const SAMPLE_CANDIDATES: LearningCandidate[] = [
  cand({ kind: 'repeat', insight: 'repeat this angle' }),
  cand({ kind: 'avoid', label: 'Avoid candidate', insight: 'a customer complaint was noted', basis: 'Owner-provided manual notes' }),
  cand({ kind: 'investigate', label: 'Investigate candidate', insight: 'attribution data is incomplete', basis: 'Owner-provided manual result data (incomplete)' }),
];

// ---------------------------------------------------------------------------
// candidateKey — deterministic & stable across re-derivation.
// ---------------------------------------------------------------------------

describe('candidateKey', () => {
  it('is deterministic for identical candidate content', () => {
    expect(candidateKey(cand({ kind: 'repeat', insight: 'x' }))).toBe(candidateKey(cand({ kind: 'repeat', insight: 'x' })));
  });

  it('differs by kind and by insight', () => {
    expect(candidateKey(cand({ kind: 'repeat', insight: 'x' }))).not.toBe(candidateKey(cand({ kind: 'avoid', insight: 'x' })));
    expect(candidateKey(cand({ kind: 'repeat', insight: 'x' }))).not.toBe(candidateKey(cand({ kind: 'repeat', insight: 'y' })));
  });
});

// ---------------------------------------------------------------------------
// initLearningReviews — all pending, stable ids, never applied.
// ---------------------------------------------------------------------------

describe('initLearningReviews', () => {
  it('maps candidates to pending reviews with stable ids and no application to Brand Brain', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    expect(reviews).toHaveLength(3);
    for (const r of reviews) {
      expect(r.decision).toBe('pending');
      expect(r.reason).toBeNull();
      expect(r.decidedBy).toBeNull();
      expect(r.decidedAt).toBeNull();
      expect(r.is_applied_to_brand_brain).toBe(false);
      expect(r.id).toBe(candidateKey({ kind: r.kind, insight: r.insight }));
    }
  });

  it('dedupes candidates sharing the same key (keeps the first)', () => {
    const dup = [cand({ kind: 'repeat', insight: 'same' }), cand({ kind: 'repeat', insight: 'same' })];
    expect(initLearningReviews(dup)).toHaveLength(1);
  });

  it('returns an empty list for no candidates', () => {
    expect(initLearningReviews([])).toEqual([]);
  });

  it('preserves existing decisions when re-initializing from re-derived candidates (by stable id)', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    const targetId = reviews[0].id;
    const { reviews: decided, audit } = applyLearningDecision(reviews, [], targetId, 'accepted', { actor: 'Owner', now: NOW });
    // Re-derive from the SAME candidates, carrying prior decisions forward.
    const reInit = initLearningReviews(SAMPLE_CANDIDATES, decided);
    expect(reInit.find(r => r.id === targetId)?.decision).toBe('accepted');
    expect(audit).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// applyLearningDecision — pure, new arrays, audit trail.
// ---------------------------------------------------------------------------

describe('applyLearningDecision', () => {
  it('accepts a candidate, recording reason/actor/timestamp and returning NEW arrays', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    const id = reviews[0].id;
    const res = applyLearningDecision(reviews, [], id, 'accepted', { reason: 'Strong signal', actor: 'Owner', now: NOW });
    expect(res.reviews).not.toBe(reviews);
    const r = res.reviews.find(x => x.id === id)!;
    expect(r.decision).toBe('accepted');
    expect(r.reason).toBe('Strong signal');
    expect(r.decidedBy).toBe('Owner');
    expect(r.decidedAt).toBe(NOW);
    expect(r.is_applied_to_brand_brain).toBe(false);
  });

  it('rejects a candidate', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    const id = reviews[1].id;
    const res = applyLearningDecision(reviews, [], id, 'rejected', { actor: 'Owner', now: NOW });
    expect(res.reviews.find(x => x.id === id)!.decision).toBe('rejected');
  });

  it('resets a decided candidate back to pending and clears decision metadata', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    const id = reviews[0].id;
    const accepted = applyLearningDecision(reviews, [], id, 'accepted', { actor: 'Owner', now: NOW });
    const reset = applyLearningDecision(accepted.reviews, accepted.audit, id, 'pending', { actor: 'Owner', now: NOW });
    const r = reset.reviews.find(x => x.id === id)!;
    expect(r.decision).toBe('pending');
    expect(r.reason).toBeNull();
    expect(r.decidedBy).toBeNull();
    expect(r.decidedAt).toBeNull();
  });

  it('appends an immutable audit entry per decision (source id, action, actor, reason, timestamp)', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    const id = reviews[0].id;
    let audit: LearningReviewAuditEntry[] = [];
    let list: LearningCandidateReview[] = reviews;
    ({ reviews: list, audit } = applyLearningDecision(list, audit, id, 'accepted', { reason: 'yes', actor: 'Owner', now: NOW, auditId: 'a1' }));
    ({ reviews: list, audit } = applyLearningDecision(list, audit, id, 'rejected', { reason: 'changed mind', actor: 'Owner', now: NOW, auditId: 'a2' }));
    ({ reviews: list, audit } = applyLearningDecision(list, audit, id, 'pending', { actor: 'Owner', now: NOW, auditId: 'a3' }));
    expect(audit).toHaveLength(3);
    expect(audit.map(a => a.action)).toEqual(['accepted', 'rejected', 'reset']);
    expect(audit[0]).toMatchObject({ candidateId: id, action: 'accepted', reason: 'yes', actor: 'Owner', at: NOW });
    expect(audit[2].action).toBe('reset');
  });

  it('is a no-op (same references, no audit entry) for an unknown id', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    const res = applyLearningDecision(reviews, [], 'nope', 'accepted', { actor: 'Owner', now: NOW });
    expect(res.reviews).toBe(reviews);
    expect(res.audit).toHaveLength(0);
  });

  it('is a no-op for an invalid decision value', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    // @ts-expect-error — invalid decision must be rejected at runtime too.
    const res = applyLearningDecision(reviews, [], reviews[0].id, 'bogus', { actor: 'Owner', now: NOW });
    expect(res.reviews).toBe(reviews);
    expect(res.audit).toHaveLength(0);
  });

  it('does not mutate the input arrays', () => {
    const reviews = initLearningReviews(SAMPLE_CANDIDATES);
    const snapshot = JSON.stringify(reviews);
    applyLearningDecision(reviews, [], reviews[0].id, 'accepted', { actor: 'Owner', now: NOW });
    expect(JSON.stringify(reviews)).toBe(snapshot);
  });
});

// ---------------------------------------------------------------------------
// summarizeLearningReviews
// ---------------------------------------------------------------------------

describe('summarizeLearningReviews', () => {
  it('counts pending / accepted / rejected', () => {
    let list = initLearningReviews(SAMPLE_CANDIDATES);
    ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
    ({ reviews: list } = applyLearningDecision(list, [], list[1].id, 'rejected', { actor: 'Owner', now: NOW }));
    expect(summarizeLearningReviews(list)).toEqual({ total: 3, pending: 1, accepted: 1, rejected: 1 });
  });
});

// ---------------------------------------------------------------------------
// buildBrandBrainUpdateProposal — accepted-only, prepared-only, never applied.
// ---------------------------------------------------------------------------

describe('buildBrandBrainUpdateProposal', () => {
  it('includes ONLY accepted candidates — rejected and pending are excluded (not used)', () => {
    let list = initLearningReviews(SAMPLE_CANDIDATES);
    ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
    ({ reviews: list } = applyLearningDecision(list, [], list[1].id, 'rejected', { actor: 'Owner', now: NOW }));
    // list[2] stays pending
    const proposal = buildBrandBrainUpdateProposal(list, { now: NOW_DATE });
    expect(proposal.proposedAdditions).toHaveLength(1);
    expect(proposal.proposedAdditions[0].insight).toBe('repeat this angle');
    expect(proposal.accepted_count).toBe(1);
    expect(proposal.rejected_count).toBe(1);
    expect(proposal.pending_count).toBe(1);
  });

  it('is a PREPARED proposal only — never persisted to and never applied to Brand Brain', () => {
    let list = initLearningReviews(SAMPLE_CANDIDATES);
    ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
    const proposal = buildBrandBrainUpdateProposal(list, { now: NOW_DATE });
    expect(proposal.persisted_to_brand_brain).toBe(false);
    expect(proposal.is_applied_to_brand_brain).toBe(false);
    expect(proposal.requires_owner_approval_to_apply).toBe(true);
  });

  it('yields an empty proposal (no additions) when nothing is accepted', () => {
    const list = initLearningReviews(SAMPLE_CANDIDATES);
    const proposal = buildBrandBrainUpdateProposal(list, { now: NOW_DATE });
    expect(proposal.proposedAdditions).toHaveLength(0);
    expect(proposal.accepted_count).toBe(0);
    // Still structurally safe.
    expect(proposal.persisted_to_brand_brain).toBe(false);
    expect(proposal.is_applied_to_brand_brain).toBe(false);
  });

  it('never returns a BrandBrain-shaped object (no brandId/brandName write target)', () => {
    let list = initLearningReviews(SAMPLE_CANDIDATES);
    ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
    const proposal = buildBrandBrainUpdateProposal(list, { now: NOW_DATE }) as unknown as Record<string, unknown>;
    expect(proposal.brandId).toBeUndefined();
    expect(proposal.brandName).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// renderBrandBrainUpdateProposalText — copyable, safety copy, no URL.
// ---------------------------------------------------------------------------

describe('renderBrandBrainUpdateProposalText', () => {
  it('renders safety copy and never emits a URL', () => {
    let list = initLearningReviews(SAMPLE_CANDIDATES);
    ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
    const proposal = buildBrandBrainUpdateProposal(list, { now: NOW_DATE });
    const text = renderBrandBrainUpdateProposalText(proposal, list, 'Sample Campaign');
    expect(text).toMatch(/Prepared/i);
    expect(text).toMatch(/not applied|not persisted|not updated/i);
    expect(text).not.toMatch(/https?:\/\//i);
  });

  it('exposes standing safety notes', () => {
    expect(BRAND_BRAIN_LEARNING_SAFETY_NOTES.join(' ')).toMatch(/Brand Brain is not updated automatically/i);
    expect(BRAND_BRAIN_LEARNING_SAFETY_NOTES.join(' ')).toMatch(/Accepted ≠/);
  });
});
