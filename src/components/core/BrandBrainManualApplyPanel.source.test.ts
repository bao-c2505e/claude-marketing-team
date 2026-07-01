import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library), so the interactive panel's safety posture is enforced by
// scanning its source, the same approach used by BrandBrainUpdateProposalPanel /
// BrandBrainLearningReviewPanel. (The pure model is unit-tested in
// brandBrainVersioning.test.ts.)
import SOURCE from './BrandBrainManualApplyPanel.tsx?raw';
import SECTION from './ManualPublishingEvidenceSection.tsx?raw';
import PANEL_Y from './BrandBrainUpdateProposalPanel.tsx?raw';

describe('BrandBrainManualApplyPanel (Phase Z Brand Brain manual apply & versioned audit trail safety guard)', () => {
  it('renders the Brand Brain Manual Apply Room surface as a local/demo room', () => {
    expect(SOURCE).toMatch(/Brand Brain Manual Apply Room/);
    expect(SOURCE).toMatch(/Local\/Demo/i);
  });

  it('shows the required local/demo badges', () => {
    expect(SOURCE).toMatch(/BRAND_BRAIN_APPLY_LOCAL_ONLY_BADGES/);
  });

  it('carries the required Phase Z safety copy', () => {
    expect(SOURCE).toMatch(/Approved proposal is only ready for manual apply/);
    expect(SOURCE).toMatch(/Brand Brain changes are not active until the Owner applies them/);
    expect(SOURCE).toMatch(/preserves every previous version/i);
    expect(SOURCE).toMatch(/never auto-applied/i);
  });

  it('carries the regression safety copy (Approved ≠ Published, Client Accepted ≠ Published)', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Client Accepted ≠ Published/);
  });

  it('is Owner-gated (owner-only) — not manager/other roles', () => {
    expect(SOURCE).toMatch(/can\.publishContent|userRole === 'owner'|role === 'owner'/);
    expect(SOURCE).not.toMatch(/can\.approveContent|isInternalRole/);
  });

  it('only applies an owner-approved proposal via the pure gate — never auto-applies', () => {
    expect(SOURCE).toMatch(/checkApplyEligibility/);
    expect(SOURCE).toMatch(/applyApprovedProposal/);
    expect(SOURCE).toMatch(/owner_approved/);
    expect(SOURCE).toMatch(/ready_for_manual_apply/);
    // "auto-applied" wording, when present, must always be negated.
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?applied/i);
  });

  it('creates a new version + preserves history via the versioning model', () => {
    expect(SOURCE).toMatch(/initBrandBrainVersionHistory/);
    expect(SOURCE).toMatch(/currentVersionNumber/);
    expect(SOURCE).toMatch(/Version history/);
    // Never writes back to the underlying Brand Brain records.
    expect(SOURCE).not.toMatch(/persistBrandBrain|updateBrandBrain|saveBrandBrain/);
  });

  it('shows a before / after diff preview and a NON-DESTRUCTIVE rollback preview', () => {
    expect(SOURCE).toMatch(/previewApply/);
    expect(SOURCE).toMatch(/previewRollback/);
    expect(SOURCE).toMatch(/non-destructive/i);
    expect(SOURCE).toMatch(/Before/);
    expect(SOURCE).toMatch(/After/);
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

  it('mutates no approval / delivery / persisted / storage state', () => {
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

  it('is wired into ManualPublishingEvidenceSection as the fifth panel, AFTER the update-proposal panel', () => {
    expect(SECTION).toMatch(/import\s+BrandBrainManualApplyPanel\s+from\s+'\.\/BrandBrainManualApplyPanel'/);
    const bbupIdx = SECTION.indexOf('<BrandBrainUpdateProposalPanel');
    const bbmaIdx = SECTION.indexOf('<BrandBrainManualApplyPanel');
    expect(bbupIdx).toBeGreaterThanOrEqual(0);
    expect(bbmaIdx).toBeGreaterThan(bbupIdx);
  });

  it('receives the approved proposal from the Phase Y panel (lifted up), so accepting/approving never auto-applies', () => {
    // Phase Y panel mirrors its current proposal up.
    expect(PANEL_Y).toMatch(/onProposalChange/);
    // The section wires that proposal into the Phase Z panel.
    expect(SECTION).toMatch(/proposal=\{/);
  });
});
