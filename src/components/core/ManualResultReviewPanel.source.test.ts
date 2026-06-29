import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library, adding deps is out of scope), so the interactive panel's
// safety posture is enforced by scanning its source, the same approach used by
// ManualPublishingEvidencePanel / DeliveryClosurePanel / DeliveryAcceptancePanel.
// (The pure model logic itself is unit-tested in manualResultReview.test.ts.)
import SOURCE from './ManualResultReviewPanel.tsx?raw';
import SECTION from './ManualPublishingEvidenceSection.tsx?raw';
import WORKSPACE from './CampaignWorkspace.tsx?raw';

describe('ManualResultReviewPanel (Phase W manual result review & campaign learning loop safety guard)', () => {
  it('renders the Manual Result Review surface as a local/demo room', () => {
    expect(SOURCE).toMatch(/Manual Result Review/);
    expect(SOURCE).toMatch(/Local\/Demo/i);
  });

  it('shows the required local/demo badges and a "does not change Published status" badge', () => {
    expect(SOURCE).toMatch(/RESULT_REVIEW_LOCAL_ONLY_BADGES/);
    expect(SOURCE).toMatch(/Does not change Published status/);
  });

  it('1. carries the required safety copy', () => {
    expect(SOURCE).toMatch(/Manual review only/);
    expect(SOURCE).toMatch(/Owner-provided manual result data/);
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Client Accepted ≠ Published/);
  });

  it('2. "No live analytics" appears', () => {
    expect(SOURCE).toMatch(/No live analytics/);
  });

  it('3. "Does not change Published status." appears', () => {
    expect(SOURCE).toMatch(/Does not change Published status\./);
  });

  it('4. "Learning candidate only" appears', () => {
    expect(SOURCE).toMatch(/Learning candidate only/);
  });

  it('5. "Not persisted to Brand Brain yet" appears', () => {
    expect(SOURCE).toMatch(/Not persisted to Brand Brain yet/);
  });

  it('surfaces the ten required review sections', () => {
    expect(SOURCE).toMatch(/Review status/);
    expect(SOURCE).toMatch(/Evidence quality/);
    expect(SOURCE).toMatch(/Result summary/);
    expect(SOURCE).toMatch(/Performance signal/);
    expect(SOURCE).toMatch(/Risk flags/);
    expect(SOURCE).toMatch(/Repeat recommendations/);
    expect(SOURCE).toMatch(/Avoid recommendations/);
    expect(SOURCE).toMatch(/Next action suggestions/);
    expect(SOURCE).toMatch(/Brand Brain learning candidate/);
    expect(SOURCE).toMatch(/Owner data needed next/);
  });

  // ── Codex fix: the panel must depend on PASSED-IN evidence, never seed its own data. ──
  it('depends on the passed-in manual evidence prop and seeds NO sample/result data of its own', () => {
    expect(SOURCE).toMatch(/evidence:\s*ManualPublishingEvidence\[\]/); // typed prop
    expect(SOURCE).toMatch(/evidence\.map\(/);                          // builds entries FROM the prop
    expect(SOURCE).toMatch(/buildManualResultReview/);                  // reviews via the pure model
    expect(SOURCE).toMatch(/Reviews only the manual publishing evidence recorded above/);
    // No private sample/seed — an empty evidence list must yield no_manual_evidence.
    expect(SOURCE).not.toMatch(/sampleManualResultEntries/);
    expect(SOURCE).not.toMatch(/sampleManualPublishingEvidence/);
  });

  it('renders the no-evidence path safely (driven by the review status, never invented)', () => {
    expect(SOURCE).toMatch(/review\.reviewStatus/);
    expect(SOURCE).toMatch(/review_status_label|REVIEW_STATUS_DESCRIPTION/);
  });

  it('never hardcodes Vị Cuốn / sample data as a real reviewed result', () => {
    expect(SOURCE).not.toMatch(/vị cuốn|vi cuon|vicuon/i);
    // No fabricated metric literals embedded as "results".
    expect(SOURCE).not.toMatch(/reach:\s*\d|orders:\s*\d|revenue:\s*\d|messages:\s*\d/i);
  });

  it('keeps the Brand Brain learning candidate preview-only (never an affirmative write)', () => {
    expect(SOURCE).toMatch(/Learning candidate only/);
    expect(SOURCE).toMatch(/Not persisted to Brand Brain yet/);
    expect(SOURCE).toMatch(/preview/i);
    expect(SOURCE).not.toMatch(/Brand Brain (was )?updated|updated Brand Brain|saved to Brand Brain|wrote to Brand Brain|writes to Brand Brain|auto-?updat\w* Brand Brain/i);
  });

  it('6. introduces no forbidden auto-post / auto-ads / auto-publish wording (only ever negated)', () => {
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?post/i);
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?ads/i);
    expect(SOURCE).not.toMatch(/auto-?publish/i);
    expect(SOURCE).not.toMatch(/auto-?approve/i);
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/run ads/i);
    expect(SOURCE).not.toMatch(/launch (campaign|ad)/i);
    expect(SOURCE).not.toMatch(/go live/i);
  });

  it('6. introduces no live connector / sync wording', () => {
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
    expect(SOURCE).not.toMatch(/saveManualDelivery|setManualDelivery|persistBrandBrain|updateBrandBrain|saveBrandBrain/);
    expect(SOURCE).not.toMatch(/localStorage\.setItem/);
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
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });

  // ── Codex fix: semantic wiring — review consumes the SAME shared evidence state. ──
  it('7. is wired into CampaignWorkspace via the shared section, with the review AFTER the evidence panel', () => {
    // Workspace renders the shared, stateful section (state lives there, not in the stateless workspace).
    expect(WORKSPACE).toMatch(/import\s+ManualPublishingEvidenceSection\s+from\s+'\.\/ManualPublishingEvidenceSection'/);
    expect(WORKSPACE).toMatch(/<ManualPublishingEvidenceSection/);

    // The section imports BOTH panels and renders the review AFTER the evidence panel.
    expect(SECTION).toMatch(/import\s+ManualPublishingEvidencePanel\s+from\s+'\.\/ManualPublishingEvidencePanel'/);
    expect(SECTION).toMatch(/import\s+ManualResultReviewPanel\s+from\s+'\.\/ManualResultReviewPanel'/);
    const evIdx = SECTION.indexOf('<ManualPublishingEvidencePanel');
    const rvIdx = SECTION.indexOf('<ManualResultReviewPanel');
    expect(evIdx).toBeGreaterThanOrEqual(0);
    expect(rvIdx).toBeGreaterThan(evIdx);

    // Both panels share ONE evidence state (review consumes the same `evidence`).
    expect(SECTION).toMatch(/evidence=\{evidence\}/);
    expect(SECTION).toMatch(/onChange=\{setEvidence\}/);
  });

  it('the shared section owns one evidence state, defaults to EMPTY, and does no network/persistence', () => {
    expect(SECTION).toMatch(/useState<ManualPublishingEvidence\[\]>\(\(\) => \[\]\)/); // default empty
    expect(SECTION).not.toMatch(/sampleManualPublishingEvidence|sampleManualResultEntries/); // no auto-seed
    expect(SECTION).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
    expect(SECTION).not.toMatch(/localStorage/);
  });
});
