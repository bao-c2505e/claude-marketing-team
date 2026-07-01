import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library), so the interactive panel's safety posture is enforced by
// scanning its source, the same approach used by BrandBrainLearningReviewPanel /
// ManualResultReviewPanel. (The pure model is unit-tested in
// brandBrainUpdateProposal.test.ts.)
import SOURCE from './BrandBrainUpdateProposalPanel.tsx?raw';
import SECTION from './ManualPublishingEvidenceSection.tsx?raw';

describe('BrandBrainUpdateProposalPanel (Phase Y Brand Brain update proposal & owner merge gate safety guard)', () => {
  it('renders the Brand Brain Update Proposal surface as a local/demo room', () => {
    expect(SOURCE).toMatch(/Brand Brain Update Proposal/);
    expect(SOURCE).toMatch(/Local\/Demo/i);
  });

  it('shows the required local/demo badges', () => {
    expect(SOURCE).toMatch(/BRAND_BRAIN_PROPOSAL_LOCAL_ONLY_BADGES/);
  });

  it('carries the required Phase Y safety copy', () => {
    expect(SOURCE).toMatch(/Accepted learning does not automatically update Brand Brain/);
    expect(SOURCE).toMatch(/Brand Brain update requires explicit Owner approval/);
    expect(SOURCE).toMatch(/This proposal is not based on live analytics/);
    expect(SOURCE).toMatch(/not auto-applied|never auto-applied/i);
    expect(SOURCE).toMatch(/separate, (later )?manual apply step|separate, manual apply step/i);
  });

  it('carries the regression safety copy (Approved ≠ Published, Client Accepted ≠ Published)', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Client Accepted ≠ Published/);
  });

  it('is Owner-gated (owner-only) — not manager/other roles', () => {
    expect(SOURCE).toMatch(/can\.publishContent|userRole === 'owner'|role === 'owner'/);
    expect(SOURCE).not.toMatch(/can\.approveContent|isInternalRole/);
  });

  it('drives the proposal through the pure model and never applies to Brand Brain', () => {
    expect(SOURCE).toMatch(/generateBrandBrainUpdateProposal/);
    expect(SOURCE).toMatch(/approveBrandBrainUpdateProposal/);
    expect(SOURCE).toMatch(/rejectBrandBrainUpdateProposal/);
    expect(SOURCE).toMatch(/requestBrandBrainUpdateRevision/);
    // No affirmative Brand Brain write.
    expect(SOURCE).not.toMatch(/Brand Brain (was )?updated|updated Brand Brain|saved to Brand Brain|wrote to Brand Brain|writes to Brand Brain|auto-?updat\w* Brand Brain/i);
    expect(SOURCE).not.toMatch(/persistBrandBrain|updateBrandBrain|saveBrandBrain/);
  });

  it('offers the three explicit Owner decisions and only feeds accepted candidates', () => {
    expect(SOURCE).toMatch(/Approve proposal/);
    expect(SOURCE).toMatch(/Request revision/);
    expect(SOURCE).toMatch(/Reject proposal/);
    expect(SOURCE).toMatch(/decision === 'accepted'/);
  });

  it('shows a before / after diff preview', () => {
    expect(SOURCE).toMatch(/diffSummary/);
    expect(SOURCE).toMatch(/Existing/);
    expect(SOURCE).toMatch(/Proposed/);
  });

  it('introduces no forbidden auto-post / auto-ads / auto-publish wording (only ever negated)', () => {
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?post/i);
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?ads/i);
    expect(SOURCE).not.toMatch(/auto-?publish/i);
    expect(SOURCE).not.toMatch(/auto-?approve/i);
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/run ads/i);
    expect(SOURCE).not.toMatch(/launch (campaign|ad)/i);
    expect(SOURCE).not.toMatch(/go live/i);
  });

  it('introduces no live connector / sync wording', () => {
    expect(SOURCE).not.toMatch(/live connector/i);
    expect(SOURCE).not.toMatch(/synced from (Meta|TikTok|Google|Canva|Zalo)/i);
    expect(SOURCE).not.toMatch(/sync (to|with|from) (Meta|TikTok|Google|Canva|Zalo)/i);
  });

  it('performs no sending/publishing — clipboard + local preview only, never a network call', () => {
    expect(SOURCE).toMatch(/navigator\.clipboard/);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
  });

  it('mutates no approval / delivery / persisted / Brand Brain state', () => {
    expect(SOURCE).not.toMatch(/executeApprovalAction|updateApproval|setApprovalData/);
    expect(SOURCE).not.toMatch(/localStorage/);
  });

  it('introduces no URL / login / endpoint / token / share-url / email send / OAuth / webhook', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/www\./i);
    expect(SOURCE).not.toMatch(/OAuth/i);
    expect(SOURCE).not.toMatch(/\bwebhook\b/i);
    expect(SOURCE).not.toMatch(/share[_-]?url/i);
    expect(SOURCE).not.toMatch(/mailto:|sendEmail|sendMail|emailClient/i);
    expect(SOURCE).not.toMatch(/CANVA_CLIENT|CANVA_API|CANVA_TOKEN|META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS|access_token|client_secret|api_key/);
  });

  it('quotes no fabricated metrics / live analytics pull', () => {
    expect(SOURCE).not.toMatch(/fetchAnalytics|getAnalytics|pull(Live)?Metrics|liveMetrics/i);
    expect(SOURCE).not.toMatch(/reach:\s*\d|orders:\s*\d|revenue:\s*\d|messages:\s*\d/i);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });

  it('is wired into ManualPublishingEvidenceSection as the fourth panel, AFTER the learning review panel', () => {
    expect(SECTION).toMatch(/import\s+BrandBrainUpdateProposalPanel\s+from\s+'\.\/BrandBrainUpdateProposalPanel'/);
    const bblIdx = SECTION.indexOf('<BrandBrainLearningReviewPanel');
    const bbupIdx = SECTION.indexOf('<BrandBrainUpdateProposalPanel');
    expect(bblIdx).toBeGreaterThanOrEqual(0);
    expect(bbupIdx).toBeGreaterThan(bblIdx);
    // Phase X panel reports its reviews up so Phase Y can consume the accepted ones.
    expect(SECTION).toMatch(/onReviewsChange/);
  });
});
