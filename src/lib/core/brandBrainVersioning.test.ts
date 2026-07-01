import { describe, expect, it } from 'vitest';
import type { BrandBrain } from './brandBrain';
import { initLearningReviews, applyLearningDecision } from './brandBrainLearning';
import type { LearningCandidate } from './manualResultReview';
import {
  generateBrandBrainUpdateProposal,
  approveBrandBrainUpdateProposal,
  rejectBrandBrainUpdateProposal,
  requestBrandBrainUpdateRevision,
  toSectionSnapshot,
  type BrandBrainUpdateProposal,
} from './brandBrainUpdateProposal';
import {
  initBrandBrainVersionHistory,
  applyApprovedProposal,
  checkApplyEligibility,
  currentVersion,
  diffSnapshots,
  previewApply,
  previewRollback,
  listApplyAudit,
  renderVersionHistoryText,
  BRAND_BRAIN_APPLY_SAFETY_NOTES,
} from './brandBrainVersioning';

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
    insight: 'Repeat the morning combo angle that drove the most messages.',
    basis: 'Owner/Client-provided manual result data',
    persisted: false,
    ...over,
  };
}

/** Build an owner-approved, ready-for-manual-apply proposal (the happy path). */
function approvedProposal(brainOver: Partial<BrandBrain> = {}): BrandBrainUpdateProposal {
  let list = initLearningReviews([cand()]);
  ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
  const proposal = generateBrandBrainUpdateProposal({
    brain: makeBrain(brainOver), reviews: list, now: NOW_DATE, proposalId: 'prop-1',
  });
  return approveBrandBrainUpdateProposal(proposal, { actor: 'Owner', notes: 'Looks right', now: NOW });
}

/** Build a still-pending proposal (accepted candidate, no owner decision). */
function pendingProposal(): BrandBrainUpdateProposal {
  let list = initLearningReviews([cand()]);
  ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
  return generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: list, now: NOW_DATE, proposalId: 'prop-1' });
}

// ---------------------------------------------------------------------------
// diffSnapshots
// ---------------------------------------------------------------------------

describe('diffSnapshots', () => {
  it('reports additions and removals per section', () => {
    const before = toSectionSnapshot(makeBrain());
    const after = toSectionSnapshot(makeBrain({ contentPillars: ['signature drinks', 'morning combo'], creativeDonts: [] }));
    const diff = diffSnapshots(before, after);
    const creative = diff.entries.find(e => e.section === 'creativeDirection')!;
    expect(creative.additions).toEqual(['morning combo']);
    const donts = diff.entries.find(e => e.section === 'donts')!;
    expect(donts.removals).toEqual(['no stock photos']);
    expect(diff.hasChanges).toBe(true);
  });

  it('is empty for identical snapshots', () => {
    const snap = toSectionSnapshot(makeBrain());
    const diff = diffSnapshots(snap, snap);
    expect(diff.hasChanges).toBe(false);
    expect(diff.changedSections).toBe(0);
    expect(diff.totalAdditions).toBe(0);
    expect(diff.totalRemovals).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// initBrandBrainVersionHistory — baseline capture.
// ---------------------------------------------------------------------------

describe('initBrandBrainVersionHistory', () => {
  it('captures the current Brand Brain as baseline v1 with a baseline audit entry', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE, versionId: 'v1', auditId: 'a1' });
    expect(history.versions).toHaveLength(1);
    expect(history.currentVersionNumber).toBe(1);
    const v1 = history.versions[0];
    expect(v1.versionNumber).toBe(1);
    expect(v1.origin).toBe('baseline');
    expect(v1.sourceProposalId).toBeNull();
    expect(v1.appliedBy).toBeNull();
    expect(v1.snapshot.creativeDirection).toEqual(['signature drinks']);
    expect(history.auditTrail).toHaveLength(1);
    expect(history.auditTrail[0].action).toBe('baseline_created');
    expect(history.auditTrail[0].toVersion).toBe(1);
  });

  it('is never live/persisted/auto-applied (structural guarantees)', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    expect(history.based_on_live_analytics).toBe(false);
    expect(history.persisted).toBe(false);
    expect(history.auto_applied).toBe(false);
  });

  it('does not mutate the input Brand Brain', () => {
    const brain = makeBrain();
    const before = JSON.stringify(brain);
    initBrandBrainVersionHistory({ brain, now: NOW_DATE });
    expect(JSON.stringify(brain)).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Manual apply gate — only owner-approved proposals can be applied.
// ---------------------------------------------------------------------------

describe('applyApprovedProposal — apply gate', () => {
  it('CANNOT apply a pending proposal (blocked, history unchanged)', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const outcome = applyApprovedProposal(history, pendingProposal(), { actor: 'Owner', now: NOW });
    expect(outcome.applied).toBe(false);
    expect(outcome.reason).toBe('not_owner_approved');
    expect(outcome.createdVersion).toBeNull();
    expect(outcome.history).toBe(history); // same reference — nothing changed
    expect(history.versions).toHaveLength(1);
  });

  it('CANNOT apply a rejected proposal', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const rejected = rejectBrandBrainUpdateProposal(pendingProposal(), { actor: 'Owner', now: NOW });
    const outcome = applyApprovedProposal(history, rejected, { actor: 'Owner', now: NOW });
    expect(outcome.applied).toBe(false);
    expect(outcome.reason).toBe('not_owner_approved');
    expect(outcome.history).toBe(history);
  });

  it('CANNOT apply a revision-requested proposal', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const revision = requestBrandBrainUpdateRevision(pendingProposal(), { actor: 'Owner', now: NOW });
    const outcome = applyApprovedProposal(history, revision, { actor: 'Owner', now: NOW });
    expect(outcome.applied).toBe(false);
    expect(outcome.reason).toBe('not_owner_approved');
  });

  it('blocks a brand mismatch between proposal and history', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain({ brandId: 'other-brand' }), now: NOW_DATE });
    const outcome = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: NOW });
    expect(outcome.applied).toBe(false);
    expect(outcome.reason).toBe('proposal_brand_mismatch');
  });

  it('blocks an approved proposal that has no net-new changes over the current version', () => {
    // Baseline already contains the exact insight the proposal proposes → nothing to add.
    const history = initBrandBrainVersionHistory({
      brain: makeBrain({ contentPillars: ['signature drinks', 'Repeat the morning combo angle that drove the most messages.'] }),
      now: NOW_DATE,
    });
    const outcome = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: NOW });
    expect(outcome.applied).toBe(false);
    expect(outcome.reason).toBe('no_net_new_changes');
  });

  it('CAN apply an owner-approved, ready-for-manual-apply proposal', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const outcome = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: NOW, versionId: 'v2' });
    expect(outcome.applied).toBe(true);
    expect(outcome.reason).toBeNull();
    expect(outcome.createdVersion).not.toBeNull();
  });

  it('checkApplyEligibility mirrors the gate (null when allowed)', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    expect(checkApplyEligibility(history, approvedProposal())).toBeNull();
    expect(checkApplyEligibility(history, pendingProposal())).toBe('not_owner_approved');
  });
});

// ---------------------------------------------------------------------------
// Manual apply — versioning + preservation + audit.
// ---------------------------------------------------------------------------

describe('applyApprovedProposal — versioning', () => {
  it('applying creates the NEXT version from the proposed after-snapshot', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const outcome = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: NOW, versionId: 'v2' });
    expect(outcome.history.versions).toHaveLength(2);
    expect(outcome.history.currentVersionNumber).toBe(2);
    const v2 = currentVersion(outcome.history);
    expect(v2.versionNumber).toBe(2);
    expect(v2.origin).toBe('manual_apply');
    expect(v2.sourceProposalId).toBe('prop-1');
    expect(v2.appliedBy).toBe('Owner');
    // v2 carries the applied change.
    expect(v2.snapshot.creativeDirection).toContain('Repeat the morning combo angle that drove the most messages.');
  });

  it('preserves the previous version unchanged (append-only)', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const v1Snapshot = JSON.stringify(history.versions[0].snapshot);
    const outcome = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: NOW });
    const v1After = outcome.history.versions[0];
    expect(v1After.versionNumber).toBe(1);
    expect(v1After.origin).toBe('baseline');
    expect(JSON.stringify(v1After.snapshot)).toBe(v1Snapshot); // untouched
    // Original history object is not mutated either.
    expect(history.versions).toHaveLength(1);
  });

  it('audit trail includes the manual-apply evidence chain', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const outcome = applyApprovedProposal(history, approvedProposal(), {
      actor: 'Owner', now: NOW,
      auditIdApproved: 'aa', auditIdRequested: 'ar', auditIdCreated: 'ac',
    });
    const actions = outcome.history.auditTrail.map(a => a.action);
    expect(actions).toEqual(['baseline_created', 'proposal_approved', 'apply_requested', 'version_created']);
    const created = outcome.history.auditTrail.find(a => a.action === 'version_created')!;
    expect(created.fromVersion).toBe(1);
    expect(created.toVersion).toBe(2);
    expect(created.proposalId).toBe('prop-1');
  });

  it('supports a second apply → v3, preserving v1 and v2', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const first = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: NOW });
    // A second, distinct approved proposal.
    let list = initLearningReviews([cand({ kind: 'avoid', label: 'Avoid', insight: 'Avoid posting after 11pm — engagement drops.', basis: 'Owner notes' })]);
    ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
    let p2 = generateBrandBrainUpdateProposal({ brain: makeBrain(), reviews: list, now: NOW_DATE, proposalId: 'prop-2' });
    p2 = approveBrandBrainUpdateProposal(p2, { actor: 'Owner', now: NOW });
    const second = applyApprovedProposal(first.history, p2, { actor: 'Owner', now: NOW });
    expect(second.applied).toBe(true);
    expect(second.history.versions.map(v => v.versionNumber)).toEqual([1, 2, 3]);
    expect(second.history.currentVersionNumber).toBe(3);
  });

  it('does not mutate the input proposal', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const proposal = approvedProposal();
    const snapshot = JSON.stringify(proposal);
    applyApprovedProposal(history, proposal, { actor: 'Owner', now: NOW });
    expect(JSON.stringify(proposal)).toBe(snapshot);
  });
});

// ---------------------------------------------------------------------------
// previews — apply preview + non-destructive rollback preview.
// ---------------------------------------------------------------------------

describe('previews', () => {
  it('previewApply shows the change an apply WOULD make without applying', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const diff = previewApply(history, approvedProposal());
    expect(diff.hasChanges).toBe(true);
    expect(diff.entries.find(e => e.section === 'creativeDirection')!.additions)
      .toContain('Repeat the morning combo angle that drove the most messages.');
    // history is untouched by a preview
    expect(history.versions).toHaveLength(1);
  });

  it('previewRollback returns a non-destructive diff from current back to an older version', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const applied = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: NOW }).history;
    const diff = previewRollback(applied, 1)!;
    expect(diff).not.toBeNull();
    // Rolling back to v1 would REMOVE the applied addition.
    expect(diff.entries.find(e => e.section === 'creativeDirection')!.removals)
      .toContain('Repeat the morning combo angle that drove the most messages.');
    // Preview does not delete/alter any version.
    expect(applied.versions).toHaveLength(2);
    expect(applied.currentVersionNumber).toBe(2);
  });

  it('previewRollback returns null for the current or a non-existent version', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    expect(previewRollback(history, 1)).toBeNull(); // current version
    expect(previewRollback(history, 9)).toBeNull(); // does not exist
  });
});

// ---------------------------------------------------------------------------
// render + safety.
// ---------------------------------------------------------------------------

describe('renderVersionHistoryText + safety', () => {
  it('renders versions + audit + safety copy and never emits a URL', () => {
    const history = initBrandBrainVersionHistory({ brain: makeBrain(), now: NOW_DATE });
    const applied = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: NOW }).history;
    const text = renderVersionHistoryText(applied, 'Mộc An Coffee');
    expect(text).toMatch(/VERSION HISTORY/);
    expect(text).toMatch(/v2/);
    expect(text).toMatch(/AUDIT TRAIL/);
    expect(text).toMatch(/not active until the Owner applies them/i);
    expect(text).not.toMatch(/https?:\/\//i);
  });

  it('listApplyAudit returns newest-first', () => {
    let history = initBrandBrainVersionHistory({ brain: makeBrain(), now: new Date('2026-07-01T09:00:00.000Z') });
    history = applyApprovedProposal(history, approvedProposal(), { actor: 'Owner', now: '2026-07-01T10:00:00.000Z' }).history;
    const ordered = listApplyAudit(history);
    expect(ordered[0].action).toBe('version_created');
    expect(ordered[ordered.length - 1].action).toBe('baseline_created');
  });

  it('exposes standing safety notes (approved ≠ auto-applied, not active until applied)', () => {
    const joined = BRAND_BRAIN_APPLY_SAFETY_NOTES.join(' ');
    expect(joined).toMatch(/never auto-applied/i);
    expect(joined).toMatch(/not active until the Owner explicitly applies/i);
    expect(joined).toMatch(/every previous version is preserved/i);
  });

  it('carries no forbidden live connector / webhook / secret strings in safety notes', () => {
    const joined = BRAND_BRAIN_APPLY_SAFETY_NOTES.join(' ');
    expect(joined).not.toMatch(/https?:\/\//i);
    expect(joined).not.toMatch(/webhook|access_token|api_key|client_secret/i);
  });
});
