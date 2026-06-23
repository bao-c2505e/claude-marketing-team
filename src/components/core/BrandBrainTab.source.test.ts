import { describe, expect, it } from 'vitest';
// Load the component source as a raw string via Vite's `?raw` import. There is no
// DOM test runner in this project (no jsdom / testing-library, and adding deps is
// out of scope), so Phase L safety is enforced with a static source scan — the
// same approach as CampaignWorkspace / OwnerOperationsPanel source tests.
import SOURCE from './BrandBrainTab.tsx?raw';

describe('BrandBrainTab (Phase L brand-brain sections + safety guard)', () => {
  it('renders every required Brand Brain section', () => {
    expect(SOURCE).toMatch(/Client \/ Brand Identity/);
    expect(SOURCE).toMatch(/Target Customers/);
    expect(SOURCE).toMatch(/Products \/ Services \/ Menu \/ Offers/);
    expect(SOURCE).toMatch(/Brand Voice \/ Tone/);
    expect(SOURCE).toMatch(/Content Pillars/);
    expect(SOURCE).toMatch(/Creative Do/);
    expect(SOURCE).toMatch(/Claim \/ Compliance Notes/);
    expect(SOURCE).toMatch(/Campaign Context/);
    expect(SOURCE).toMatch(/Owner Notes/);
    expect(SOURCE).toMatch(/Asset Library Snapshot/);
    expect(SOURCE).toMatch(/Last Updated \/ Internal Draft State/);
  });

  it('surfaces brand identity, audience, products, voice, pillars and do/dont fields', () => {
    // Each section is fed from existing brand / brief data already in local state.
    expect(SOURCE).toMatch(/brand\.target_audience/);
    expect(SOURCE).toMatch(/hero_product/);
    expect(SOURCE).toMatch(/product_focus/);
    expect(SOURCE).toMatch(/tone_of_voice/);
    expect(SOURCE).toMatch(/content_pillars/);
    expect(SOURCE).toMatch(/must_include/);
    expect(SOURCE).toMatch(/must_avoid/);
    expect(SOURCE).toMatch(/approval_requirements/);
    expect(SOURCE).toMatch(/brand_colors/);
  });

  it('keeps approval-first messaging and "Approved ≠ Published" visible', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Approval-first/i);
    expect(SOURCE).toMatch(/Owner approval required/i);
    expect(SOURCE).toMatch(/Manual confirmation outside CORE/i);
    expect(SOURCE).toMatch(/Internal records only/i);
  });

  it('labels sample data as internal / simulated / demo / draft-only', () => {
    expect(SOURCE).toMatch(/internal/i);
    expect(SOURCE).toMatch(/simulated/i);
    expect(SOURCE).toMatch(/demo/i);
    expect(SOURCE).toMatch(/draft-only/i);
    // No fabricated quantitative metrics are invented in this surface.
    expect(SOURCE).toMatch(/No fabricated metrics/i);
  });

  it('shows connector safety as blocked and read-only (live count hard 0)', () => {
    expect(SOURCE).toMatch(/live blocked/i);
    expect(SOURCE).toMatch(/Read-only/i);
    expect(SOURCE).toMatch(/Live connectors blocked/i);
    expect(SOURCE).toMatch(/LEDGER_SUMMARY\.liveCount/);
  });

  it('renders no upload / publish / post / ads-launch / activate / sync action wording', () => {
    expect(SOURCE).not.toMatch(/upload to canva/i);
    expect(SOURCE).not.toMatch(/send to canva/i);
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/activate connector/i);
    expect(SOURCE).not.toMatch(/sync live/i);
    expect(SOURCE).not.toMatch(/fetch assets/i);
  });

  it('treats auto-post as forbidden — only ever shown negated as a safety guarantee', () => {
    expect(SOURCE).toMatch(/no auto-post/i);
    expect(SOURCE).not.toMatch(/(?<!no )auto-post/i);
  });

  it('introduces no live connector capability (no fetch / axios / API / OAuth / webhook / URL / token)', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/OAuth/i);
    expect(SOURCE).not.toMatch(/webhook/i);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
    expect(SOURCE).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(SOURCE).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS/);
    // No persistence / mutation from this presentational surface.
    expect(SOURCE).not.toMatch(/saveAssetData|saveCoreData|updateConnectorStatus|localStorage/);
  });

  it('is display + navigation only — selects a brand or navigates, never mutates state', () => {
    expect(SOURCE).toMatch(/onSelect/);
    expect(SOURCE).toMatch(/onNavigate/);
    expect(SOURCE).not.toMatch(/useState|useReducer/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});
