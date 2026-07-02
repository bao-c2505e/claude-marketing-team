import { describe, expect, it } from 'vitest';
import type { BrandBrain, BrandContextSnapshot } from './brandBrain';
import { buildBrandContextSnapshot } from './brandBrain';
import {
  initBrandBrainVersionHistory,
  applyApprovedProposal,
  type BrandBrainVersionHistory,
} from './brandBrainVersioning';
import {
  toSectionSnapshot,
  generateBrandBrainUpdateProposal,
  approveBrandBrainUpdateProposal,
} from './brandBrainUpdateProposal';
import { initLearningReviews, applyLearningDecision } from './brandBrainLearning';
import type { LearningCandidate } from './manualResultReview';
import {
  CORE_V1_FLOW,
  CORE_V1_FLOW_SAFETY_NOTES,
  getCoreV1Stage,
  contextSourceIsOfficial,
  resolveActiveBrandBrainContext,
  buildCoreV1IntegrationStatus,
  summarizeCoreV1Flow,
  renderCoreV1FlowText,
  type CoreV1IntegrationSignals,
} from './coreV1Integration';

const NOW = '2026-07-02T10:00:00.000Z';
const NOW_DATE = new Date(NOW);

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

function snapshotFor(brain: BrandBrain): BrandContextSnapshot {
  return buildBrandContextSnapshot(brain);
}

function baselineHistory(brain = makeBrain()): BrandBrainVersionHistory {
  return initBrandBrainVersionHistory({ brain, now: NOW_DATE, versionId: 'v1', auditId: 'a1' });
}

function defaultSignals(over: Partial<CoreV1IntegrationSignals> = {}): CoreV1IntegrationSignals {
  return {
    hasAppliedBrandBrainVersion: false,
    appliedVersionLabel: null,
    hasCampaign: false,
    draftCount: 0,
    pendingApprovalCount: 0,
    approvedCount: 0,
    connectorCommandCount: 0,
    blockedConnectorCommandCount: 0,
    hasManualPublishingEvidence: false,
    hasReviewedResult: false,
    learningCandidateCount: 0,
    hasBrandBrainProposal: false,
    proposalApproved: false,
    appliedNewVersion: false,
    ...over,
  };
}

describe('CORE V1 integration map', () => {
  it('documents the full 9-stage flow in order', () => {
    expect(CORE_V1_FLOW.map(s => s.key)).toEqual([
      'brand_brain_version',
      'campaign',
      'approval',
      'connector_command',
      'manual_publishing_evidence',
      'result_review',
      'learning_candidate',
      'brand_brain_proposal',
      'manual_apply',
    ]);
    CORE_V1_FLOW.forEach((s, i) => expect(s.order).toBe(i + 1));
  });

  it('carries the standing approval-first safety notes', () => {
    const joined = CORE_V1_FLOW_SAFETY_NOTES.join(' ');
    expect(joined).toMatch(/Approved ≠ Published/);
    expect(joined).toMatch(/Connector executed ≠ Published/);
    expect(joined).toMatch(/Brand Brain is not auto-updated/);
    expect(joined).toMatch(/no auto-post/i);
  });

  it('looks up a stage by key', () => {
    expect(getCoreV1Stage('connector_command').label).toMatch(/Connector Command/);
  });
});

describe('official active-context gate', () => {
  it('only an applied version is official — draft/proposal/learning candidate are not', () => {
    expect(contextSourceIsOfficial('applied_version')).toBe(true);
    expect(contextSourceIsOfficial('draft')).toBe(false);
    expect(contextSourceIsOfficial('proposal')).toBe(false);
    expect(contextSourceIsOfficial('learning_candidate')).toBe(false);
  });

  it('resolves the applied version as the official context (baseline v1)', () => {
    const brain = makeBrain();
    const ctx = resolveActiveBrandBrainContext({
      history: baselineHistory(brain),
      snapshot: snapshotFor(brain),
    });
    expect(ctx.versionId).toBe('v1');
    expect(ctx.versionNumber).toBe(1);
    expect(ctx.origin).toBe('baseline');
    expect(ctx.source).toBe('applied_brand_brain_version');
    expect(ctx.is_official).toBe(true);
    expect(ctx.based_on_draft).toBe(false);
    expect(ctx.based_on_proposal).toBe(false);
    expect(ctx.based_on_learning_candidate).toBe(false);
    expect(ctx.based_on_live_analytics).toBe(false);
    expect(ctx.versionLabel).toMatch(/v1/);
    expect(ctx.approved_not_published).toMatch(/Approved ≠ Published/);
  });

  it('after a manual apply, the official context tracks the NEW applied version — never the proposal', () => {
    const brain = makeBrain();
    const history = baselineHistory(brain);

    const cand: LearningCandidate = {
      kind: 'repeat', label: 'Repeat morning combo',
      insight: 'Repeat the morning combo angle.', basis: 'Owner-provided manual result', persisted: false,
    };
    let list = initLearningReviews([cand]);
    ({ reviews: list } = applyLearningDecision(list, [], list[0].id, 'accepted', { actor: 'Owner', now: NOW }));
    let proposal = generateBrandBrainUpdateProposal({
      brain, reviews: list, now: NOW_DATE, proposalId: 'prop-1',
    });
    proposal = approveBrandBrainUpdateProposal(proposal, { actor: 'Owner', notes: 'ok', now: NOW });

    const outcome = applyApprovedProposal(history, proposal, { actor: 'Owner', now: NOW, versionId: 'v2' });
    expect(outcome.applied).toBe(true);

    const ctx = resolveActiveBrandBrainContext({
      history: outcome.history,
      snapshot: snapshotFor(brain),
    });
    // The official context is the APPLIED version 2, not the proposal.
    expect(ctx.versionNumber).toBe(2);
    expect(ctx.versionId).toBe('v2');
    expect(ctx.origin).toBe('manual_apply');
    expect(ctx.based_on_proposal).toBe(false);
  });

  it('a proposal snapshot is not accepted as context — there is no code path to pass one', () => {
    // A proposal exposes `proposedAfterSnapshot` (a section snapshot), NOT a
    // version history — resolveActiveBrandBrainContext only takes a history, so a
    // proposal can never be the official source. Documented + asserted at the
    // classifier level instead.
    const brain = makeBrain();
    const proposalSnapshot = toSectionSnapshot(brain);
    expect(proposalSnapshot).toBeDefined();
    expect(contextSourceIsOfficial('proposal')).toBe(false);
  });
});

describe('integration status projection', () => {
  it('is fully pending on an empty campaign', () => {
    const states = buildCoreV1IntegrationStatus(defaultSignals());
    expect(states).toHaveLength(9);
    expect(states.find(s => s.key === 'brand_brain_version')!.status).toBe('pending');
    expect(states.find(s => s.key === 'approval')!.status).toBe('pending');
    expect(summarizeCoreV1Flow(states).blocked).toBe(0);
  });

  it('pending approval is a manual step, not complete', () => {
    const states = buildCoreV1IntegrationStatus(defaultSignals({
      hasCampaign: true, draftCount: 7, pendingApprovalCount: 3,
    }));
    expect(states.find(s => s.key === 'campaign')!.status).toBe('complete');
    expect(states.find(s => s.key === 'approval')!.status).toBe('manual_required');
    // Connector commands cannot start until something is approved.
    expect(states.find(s => s.key === 'connector_command')!.status).toBe('pending');
  });

  it('approved assets enable connector commands but never mark published', () => {
    const states = buildCoreV1IntegrationStatus(defaultSignals({
      hasCampaign: true, draftCount: 7, approvedCount: 2, connectorCommandCount: 2,
    }));
    const cmd = states.find(s => s.key === 'connector_command')!;
    expect(cmd.status).toBe('manual_required');
    expect(cmd.detail).toMatch(/does not publish/i);
    // Publishing evidence is still a required manual step.
    expect(states.find(s => s.key === 'manual_publishing_evidence')!.status).toBe('manual_required');
  });

  it('surfaces a blocked connector command', () => {
    const states = buildCoreV1IntegrationStatus(defaultSignals({
      hasCampaign: true, approvedCount: 1, blockedConnectorCommandCount: 1,
    }));
    const cmd = states.find(s => s.key === 'connector_command')!;
    expect(cmd.status).toBe('blocked');
    expect(summarizeCoreV1Flow(states).healthy).toBe(false);
  });

  it('an approved proposal is only ready for manual apply — not auto-applied', () => {
    const states = buildCoreV1IntegrationStatus(defaultSignals({
      hasCampaign: true, approvedCount: 1,
      hasManualPublishingEvidence: true, hasReviewedResult: true,
      learningCandidateCount: 1, hasBrandBrainProposal: true, proposalApproved: true,
      appliedNewVersion: false,
    }));
    expect(states.find(s => s.key === 'brand_brain_proposal')!.status).toBe('manual_required');
    expect(states.find(s => s.key === 'manual_apply')!.status).toBe('manual_required');
  });

  it('marks manual apply complete only after a new version is applied', () => {
    const states = buildCoreV1IntegrationStatus(defaultSignals({
      hasCampaign: true, approvedCount: 1,
      hasBrandBrainProposal: true, proposalApproved: true, appliedNewVersion: true,
    }));
    expect(states.find(s => s.key === 'manual_apply')!.status).toBe('complete');
  });
});

describe('renderCoreV1FlowText', () => {
  it('renders flow + safety and emits no URL/link', () => {
    const brain = makeBrain();
    const ctx = resolveActiveBrandBrainContext({ history: baselineHistory(brain), snapshot: snapshotFor(brain) });
    const states = buildCoreV1IntegrationStatus(defaultSignals({ hasAppliedBrandBrainVersion: true, appliedVersionLabel: ctx.versionLabel }));
    const text = renderCoreV1FlowText(states, ctx);
    expect(text).toMatch(/CORE V1 INTEGRATION FLOW/);
    expect(text).toMatch(/Official context: Brand Brain v1/);
    expect(text).toMatch(/Approved ≠ Published/);
    expect(text).not.toMatch(/https?:\/\//i);
  });
});
