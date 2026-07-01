import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library), so the interactive panel's safety posture is enforced by
// scanning its source, the same approach used by ManualResultReviewPanel /
// ManualPublishingEvidencePanel. (The pure model is unit-tested in
// brandBrainLearning.test.ts.)
import SOURCE from './BrandBrainLearningReviewPanel.tsx?raw';
import SECTION from './ManualPublishingEvidenceSection.tsx?raw';

describe('BrandBrainLearningReviewPanel (Phase X Owner-approved learning candidate approval safety guard)', () => {
  it('renders the Brand Brain Learning Review surface as a local/demo room', () => {
    expect(SOURCE).toMatch(/Brand Brain Learning Review|Learning Candidate Review/);
    expect(SOURCE).toMatch(/Local\/Demo/i);
  });

  it('shows the required local/demo badges', () => {
    expect(SOURCE).toMatch(/BRAND_BRAIN_LEARNING_LOCAL_ONLY_BADGES/);
  });

  it('carries the required Phase X safety copy', () => {
    expect(SOURCE).toMatch(/Learning candidate/i);
    expect(SOURCE).toMatch(/Accepted for Brand Brain update/i);
    expect(SOURCE).toMatch(/Rejected \/ not used/i);
    expect(SOURCE).toMatch(/Prepared/i);
    expect(SOURCE).toMatch(/not applied|not persisted|not silently persisted/i);
    expect(SOURCE).toMatch(/Brand Brain is not updated automatically/i);
  });

  it('carries the regression safety copy (Approved ≠ Published, Client Accepted ≠ Published, Accepted ≠ applied)', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Client Accepted ≠ Published/);
    expect(SOURCE).toMatch(/Accepted ≠/);
  });

  it('is Owner-gated (owner-only) — not manager/other roles', () => {
    // Owner-only authority: gate on the owner role, never on manager approval.
    expect(SOURCE).toMatch(/can\.publishContent|userRole === 'owner'|role === 'owner'/);
    expect(SOURCE).not.toMatch(/can\.approveContent|isInternalRole/);
  });

  it('drives decisions through the pure model (accept/reject/reset) and never applies to Brand Brain', () => {
    expect(SOURCE).toMatch(/applyLearningDecision/);
    expect(SOURCE).toMatch(/buildBrandBrainUpdateProposal/);
    expect(SOURCE).toMatch(/initLearningReviews/);
    // No affirmative Brand Brain write.
    expect(SOURCE).not.toMatch(/Brand Brain (was )?updated|updated Brand Brain|saved to Brand Brain|wrote to Brand Brain|writes to Brand Brain|auto-?updat\w* Brand Brain/i);
  });

  it('reviews candidates from the passed-in evidence via Phase W — seeds no sample data of its own', () => {
    expect(SOURCE).toMatch(/evidence:\s*ManualPublishingEvidence\[\]/);
    expect(SOURCE).toMatch(/buildManualResultReview/);
    expect(SOURCE).not.toMatch(/sampleManualResultEntries|sampleManualPublishingEvidence/);
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
    expect(SOURCE).not.toMatch(/persistBrandBrain|updateBrandBrain|saveBrandBrain|buildBrandBrain\b/);
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
    expect(SOURCE).not.toMatch(/vị cuốn|vi cuon|vicuon/i);
  });

  it('is wired into ManualPublishingEvidenceSection as the third panel, AFTER the review panel, sharing the same evidence', () => {
    expect(SECTION).toMatch(/import\s+BrandBrainLearningReviewPanel\s+from\s+'\.\/BrandBrainLearningReviewPanel'/);
    const rvIdx = SECTION.indexOf('<ManualResultReviewPanel');
    const bblIdx = SECTION.indexOf('<BrandBrainLearningReviewPanel');
    expect(rvIdx).toBeGreaterThanOrEqual(0);
    expect(bblIdx).toBeGreaterThan(rvIdx);
    // Shares the same single evidence state.
    const matches = SECTION.match(/evidence=\{evidence\}/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
