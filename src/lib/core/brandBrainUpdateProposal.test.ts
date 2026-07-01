import { describe, expect, it } from 'vitest';
import type { BrandBrain } from './brandBrain';
import { initLearningReviews, applyLearningDecision } from './brandBrainLearning';
import type { LearningCandidate } from './manualResultReview';
import {
  generateBrandBrainUpdateProposal,
  buildProposalDiff,
  toSectionSnapshot,
  approveBrandBrainUpdateProposal,
  rejectBrandBrainUpdateProposal,
  requestBrandBrainUpdateRevision,
  decideBrandBrainUpdateProposal,
  listProposalAudit,
  renderBrandBrainUpdateProposalText,
  BRAND_BRAIN_PROPOSAL_SAFETY_NOTES,
  CANDIDATE_KIND_SECTION,
} from './brandBrainUpdateProposal';

const NOW = '2026-07-01T10:00:00.000Z';
const NOW_DATE = new Date(NOW);

// ── Minimal BrandBrain fixture (only fields the snapshot reads matter) ──
function makeBrain(over: Partial<BrandBrain> = {}): BrandBrain {
  return {
    brandId: 'brand-1',
    clientId: 'client-1',
    brandName: 'Mộc An Coffee',
    clientName: 'Mộc An',
    contactName: null,
    category: 'coffee',
    positioning: 'Neighborhood specialty coffee',
    targetCustomers: ['office workers nearby'],
    products: ['cà phê sữa', 'cold brew'],
    offers: ['combo sáng'],
    brandVoice: ['warm', 'friendly'],
    contentPillars: ['signature drinks'],
    keyMessages: [],
    creativeDos: ['show the real drink'],
    creativeDonts: ['no stock photos'],
    claimComplianceNotes: [],
    campaignContext: [],
    ownerNotes: [],
    channels: ['Facebook'],
    brandColors: [],
    assetReferences: [],
    assetStatusCounts: {},
    approvalSafetyNotes: [],
    source: 'internal',
    status: 'draft',
    updatedAt: null,
    lastReviewedAt: null,
    ...over,
  };
}

function cand(over: Partial<LearningCandidate> = {}): LearningCandidate {
  return {
    kind: 'repeat',
    label: 'Repeat candidate',
    insight: 'Based on provided manual data, morning combo posts drove the most messages — repeat this angle.',
    basis: 'Owner/Client-provided manual result data',
    persisted: false,
    ...over,
  };
}

const CANDIDATES: LearningCandidate[] = [
  cand({ kind: 'repeat', insight: 'Repeat the morning combo angle that drove the most messages.' }),
  cand({ kind: 'avoid', label: 'Avoid candidate', insight: 'Avoid posting late — a timing issue was noted.', basis: 'Owner-provided manual notes' }),
  cand({ kind: 'investigate', label: 'Investigate candidate', insight: 'Attribution data is incomplete — gather more.', basis: 'Owner-provided manual result data (incomplete)' }),
];

/** Build reviews and accept a chosen subset by index. */
function reviewsWithAccepted(acceptIdx: number[], rejectIdx: number[] = []) {
  let list = initLearningReviews(CANDIDATES);
  for (const i of acceptIdx) {
    ({ reviews: list } = applyLearningDecision(list, [], list[i].id, 'accepted', { actor: 'Owner', now: NOW }));
  }
  for (const i of rejectIdx) {
    ({ reviews: list } = applyLearningDecision(list, [], list[i].id, 'rejected', { actor: 'Owner', now: NOW }));
  }
  return list;
}

// ---------------------------------------------------------------------------
// toSectionSnapshot
// ---------------------------------------------------------------------------

describe('toSectionSnapshot', () => {
  it('projects Brand Brain fields into diffable string lists', () => {
    const snap = toSectionSnapshot(makeBrain());
    expect(snap.positioning).toEqual(['Neighborhood specialty coffee']);
    expect(snap.creativeDirection).toEqual(['signature drinks']);
    expect(snap.dos).toEqual(['show the real drink']);
    expect(snap.donts).toEqual(['no stock photos']);
    expect(snap.evidenceNotes).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// generateBrandBrainUpdateProposal — accepted-only, never applied.
// ---------------------------------------------------------------------------

describe('generateBrandBrainUpdateProposal', () => {
  it('uses ONLY accepted candidates — rejected/pending/unreviewed are ignored', () => {
    // accept index 0 (repeat), reject index 1 (avoid), leave index 2 pending
    const reviews = reviewsWithAccepted([0], [1]);
    const proposal = generateBrandBrainUpdateProposal({
      brain: makeBrain(), reviews, now: NOW_DATE, proposalId: 'p1', auditId: 'a1',
    });
    expect(proposal.proposedSections).toHaveLength(1);
    expect(proposal.proposedSections[0].kind).toBe('repeat');
    expect(proposal.sourceLearningCandidateIds).toEqual([reviews[0].id]);
    // the avoid/investigate insights never appear
    expect(proposal.proposedSections.some(s => s.kind === 'avoid')).toBe(false);
    expect(proposal.proposedSections.some(s => s.kind === 'investigate')).toBe(false);
  });

  it('maps candidate kinds to their Brand Brain sections deterministically', () => {
    const reviews = reviewsWithAccepted([0, 1, 2]);
    const proposal = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews, now: NOW_DATE });
    const bySection = Object.fromEntries(proposal.proposedSections.map(s => [s.kind, s.section]));
    expect(bySection.repeat).toBe(CANDIDATE_KIND_SECTION.repeat);
    expect(bySection.avoid).toBe(CANDIDATE_KIND_SECTION.avoid);
    expect(bySection.investigate).toBe(CANDIDATE_KIND_SECTION.investigate);
    expect(bySection.repeat).toBe('creativeDirection');
    expect(bySection.avoid).toBe('donts');
    expect(bySection.investigate).toBe('evidenceNotes');
  });

  it('is pending_owner_approval when there are accepted candidates', () => {
    const proposal = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([0]), now: NOW_DATE });
    expect(proposal.proposalStatus).toBe('pending_owner_approval');
  });

  it('is a draft (nothing to approve) with a safety flag when nothing is accepted', () => {
    const reviews = reviewsWithAccepted([], [0]); // one rejected, none accepted
    const proposal = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews, now: NOW_DATE });
    expect(proposal.proposalStatus).toBe('draft');
    expect(proposal.proposedSections).toHaveLength(0);
    expect(proposal.safetyFlags).toContain('no_accepted_candidates');
    expect(proposal.diffSummary.hasChanges).toBe(false);
  });

  it('NEVER persists or applies to Brand Brain (structural guarantees)', () => {
    const proposal = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([0]), now: NOW_DATE });
    expect(proposal.persisted_to_brand_brain).toBe(false);
    expect(proposal.is_applied_to_brand_brain).toBe(false);
    expect(proposal.auto_applied).toBe(false);
    expect(proposal.based_on_live_analytics).toBe(false);
    expect(proposal.requires_owner_approval_to_apply).toBe(true);
    expect(proposal.ready_for_manual_apply).toBe(false);
  });

  it('does not mutate the input Brand Brain', () => {
    const brain = makeBrain();
    const before = JSON.stringify(brain);
    generateBrandBrainUpdateProposal({ brain, reviews: reviewsWithAccepted([0, 1, 2]), now: NOW_DATE });
    expect(JSON.stringify(brain)).toBe(before);
  });

  it('raises a weak-evidence safety flag for investigate / incomplete-basis candidates', () => {
    const proposal = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([2]), now: NOW_DATE });
    expect(proposal.safetyFlags).toContain('weak_or_missing_evidence');
    expect(proposal.proposedSections[0].riskNote).toMatch(/weak|incomplete/i);
  });

  it('raises a vague-change safety flag when the accepted insight is too short', () => {
    let list = initLearningReviews([cand({ kind: 'repeat', insight: 'do more' })]);
    ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
    const proposal = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: list, now: NOW_DATE });
    expect(proposal.safetyFlags).toContain('vague_change_needs_owner_review');
  });

  it('always carries the not-live-analytics + no-fabricated-metrics flags', () => {
    const proposal = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([0]), now: NOW_DATE });
    expect(proposal.safetyFlags).toContain('not_based_on_live_analytics');
    expect(proposal.safetyFlags).toContain('no_fabricated_metrics');
  });

  it('records source ids + an initial "generated" audit entry', () => {
    const reviews = reviewsWithAccepted([0]);
    const proposal = generateBrandBrainUpdateProposal({
      brain: makeBrain(), reviews, now: NOW_DATE,
      sourceCampaignId: 'campaign-9', sourceManualResultReviewId: 'mrr-9', auditId: 'a1',
    });
    expect(proposal.sourceCampaignId).toBe('campaign-9');
    expect(proposal.sourceManualResultReviewId).toBe('mrr-9');
    expect(proposal.auditTrail).toHaveLength(1);
    expect(proposal.auditTrail[0].action).toBe('generated');
    expect(proposal.auditTrail[0].toStatus).toBe('pending_owner_approval');
  });
});

// ---------------------------------------------------------------------------
// buildProposalDiff / diffSummary
// ---------------------------------------------------------------------------

describe('diff preview', () => {
  it('shows existing → proposed with net-new additions and reasons', () => {
    const proposal = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([0]), now: NOW_DATE });
    const entry = proposal.diffSummary.entries.find(e => e.section === 'creativeDirection')!;
    expect(entry.before).toEqual(['signature drinks']);
    expect(entry.additions).toEqual(['Repeat the morning combo angle that drove the most messages.']);
    expect(entry.proposedAfter).toEqual(['signature drinks', 'Repeat the morning combo angle that drove the most messages.']);
    expect(entry.reason).toMatch(/manual/i);
    expect(proposal.diffSummary.hasChanges).toBe(true);
    expect(proposal.diffSummary.totalAdditions).toBe(1);
  });

  it('does not add a change that already exists in the Brand Brain (no-op addition)', () => {
    const brain = makeBrain({ contentPillars: ['Repeat the morning combo angle that drove the most messages.'] });
    const proposal = generateBrandBrainUpdateProposal({ brain, reviews: reviewsWithAccepted([0]), now: NOW_DATE });
    // The insight already exists → no net-new addition, no diff entry.
    expect(proposal.diffSummary.entries.find(e => e.section === 'creativeDirection')).toBeUndefined();
    expect(proposal.diffSummary.hasChanges).toBe(false);
  });

  it('buildProposalDiff is pure logic over snapshots', () => {
    const before = toSectionSnapshot(makeBrain());
    const after = { ...before, donts: [...before.donts, 'Avoid late posts.'] };
    const summary = buildProposalDiff(before, after, [{
      section: 'donts', sectionLabel: "Don'ts", sourceCandidateId: 'c1', kind: 'avoid',
      insight: 'Avoid late posts.', basis: 'Owner notes', additions: ['Avoid late posts.'], riskNote: null,
    }]);
    expect(summary.changedSections).toBe(1);
    expect(summary.entries[0].additions).toEqual(['Avoid late posts.']);
  });
});

// ---------------------------------------------------------------------------
// Owner merge gate — approve / reject / request revision.
// ---------------------------------------------------------------------------

describe('owner merge gate', () => {
  function pending() {
    return generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([0]), now: NOW_DATE, proposalId: 'p1', auditId: 'a-gen' });
  }

  it('approve changes status, sets ready_for_manual_apply, records decision + audit', () => {
    const approved = approveBrandBrainUpdateProposal(pending(), { actor: 'Owner', notes: 'Looks right', now: NOW, auditId: 'a-approve' });
    expect(approved.proposalStatus).toBe('owner_approved');
    expect(approved.ready_for_manual_apply).toBe(true);
    expect(approved.ownerDecision).toMatchObject({ decision: 'approved', decidedBy: 'Owner', decidedAt: NOW, notes: 'Looks right' });
    expect(approved.auditTrail).toHaveLength(2);
    expect(approved.auditTrail[1]).toMatchObject({ action: 'approved', fromStatus: 'pending_owner_approval', toStatus: 'owner_approved' });
    // approval still never persists/applies
    expect(approved.persisted_to_brand_brain).toBe(false);
    expect(approved.is_applied_to_brand_brain).toBe(false);
    expect(approved.auto_applied).toBe(false);
  });

  it('reject changes status and does NOT set ready_for_manual_apply', () => {
    const rejected = rejectBrandBrainUpdateProposal(pending(), { actor: 'Owner', notes: 'Not yet', now: NOW });
    expect(rejected.proposalStatus).toBe('owner_rejected');
    expect(rejected.ready_for_manual_apply).toBe(false);
    expect(rejected.ownerDecision.decision).toBe('rejected');
    expect(rejected.auditTrail[rejected.auditTrail.length - 1].action).toBe('rejected');
  });

  it('request revision changes status and audit trail', () => {
    const revised = requestBrandBrainUpdateRevision(pending(), { actor: 'Owner', notes: 'Tighten wording', now: NOW });
    expect(revised.proposalStatus).toBe('revision_requested');
    expect(revised.ready_for_manual_apply).toBe(false);
    expect(revised.auditTrail[revised.auditTrail.length - 1].action).toBe('revision_requested');
  });

  it('allows a decision again after a revision request (revision_requested is decidable)', () => {
    const revised = requestBrandBrainUpdateRevision(pending(), { actor: 'Owner', now: NOW });
    const approved = approveBrandBrainUpdateProposal(revised, { actor: 'Owner', now: NOW });
    expect(approved.proposalStatus).toBe('owner_approved');
    expect(approved.ready_for_manual_apply).toBe(true);
  });

  it('is a no-op (same reference) on a draft (nothing to approve)', () => {
    const draft = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([], [0]), now: NOW_DATE });
    expect(draft.proposalStatus).toBe('draft');
    expect(approveBrandBrainUpdateProposal(draft, { actor: 'Owner', now: NOW })).toBe(draft);
  });

  it('is a no-op (same reference) once already approved (no silent re-decision)', () => {
    const approved = approveBrandBrainUpdateProposal(pending(), { actor: 'Owner', now: NOW });
    expect(rejectBrandBrainUpdateProposal(approved, { actor: 'Owner', now: NOW })).toBe(approved);
    expect(decideBrandBrainUpdateProposal(approved, 'approved', { actor: 'Owner', now: NOW })).toBe(approved);
  });

  it('does not mutate the input proposal', () => {
    const p = pending();
    const snapshot = JSON.stringify(p);
    approveBrandBrainUpdateProposal(p, { actor: 'Owner', now: NOW });
    expect(JSON.stringify(p)).toBe(snapshot);
  });

  it('listProposalAudit returns newest-first', () => {
    let p = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([0]), now: new Date('2026-07-01T09:00:00.000Z') });
    p = requestBrandBrainUpdateRevision(p, { actor: 'Owner', now: '2026-07-01T09:30:00.000Z' });
    p = approveBrandBrainUpdateProposal(p, { actor: 'Owner', now: '2026-07-01T10:00:00.000Z' });
    const ordered = listProposalAudit(p);
    expect(ordered[0].action).toBe('approved');
    expect(ordered[ordered.length - 1].action).toBe('generated');
  });
});

// ---------------------------------------------------------------------------
// render text — safety copy, no URL.
// ---------------------------------------------------------------------------

describe('renderBrandBrainUpdateProposalText', () => {
  it('renders the diff + safety copy and never emits a URL', () => {
    const p = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: reviewsWithAccepted([0]), now: NOW_DATE });
    const text = renderBrandBrainUpdateProposalText(p, 'Summer Campaign');
    expect(text).toMatch(/DIFF PREVIEW/);
    expect(text).toMatch(/Accepted learning does not automatically update Brand Brain/);
    expect(text).toMatch(/Applied to Brand Brain: NO/);
    expect(text).not.toMatch(/https?:\/\//i);
  });

  it('exposes standing safety notes', () => {
    const joined = BRAND_BRAIN_PROPOSAL_SAFETY_NOTES.join(' ');
    expect(joined).toMatch(/Accepted learning does not automatically update Brand Brain/);
    expect(joined).toMatch(/Brand Brain update requires explicit Owner approval/);
    expect(joined).toMatch(/not based on live analytics/);
  });
});
