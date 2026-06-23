import { describe, expect, it } from 'vitest';
// Static source scan (Vite `?raw`) — the project has no DOM test runner, so the
// Asset Library's Phase L safety posture is pinned the same way as the Brand
// Brain / CampaignWorkspace source tests. NB: the Asset Library intentionally
// exposes an *optional metadata* "External URL" field (placeholder only), so this
// test does not assert the absence of a URL — it pins labels + action wording.
import SOURCE from './AssetLibraryTab.tsx?raw';

describe('AssetLibraryTab (Phase L asset-library safety + labelling)', () => {
  it('renders asset type / status / source / approval-state metadata', () => {
    expect(SOURCE).toMatch(/ASSET_TYPE_LABEL/);
    expect(SOURCE).toMatch(/ASSET_APPROVAL_LABEL/);
    expect(SOURCE).toMatch(/ASSET_SOURCE_LABEL/);
    expect(SOURCE).toMatch(/approval_status/);
    // Lifecycle statuses are surfaced (draft / needs_review / approved / archived).
    expect(SOURCE).toMatch(/Approval Status/);
  });

  it('labels sample records as internal / simulated / demo / draft-only', () => {
    expect(SOURCE).toMatch(/internal/i);
    expect(SOURCE).toMatch(/simulated/i);
    expect(SOURCE).toMatch(/demo/i);
    expect(SOURCE).toMatch(/draft-only/i);
  });

  it('keeps "Approved ≠ Published" + approval-first messaging visible', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/internal use only/i);
    expect(SOURCE).toMatch(/Manual confirmation outside CORE/i);
    expect(SOURCE).toMatch(/Live connectors blocked/i);
  });

  it('renders no upload-to-canva / publish / post / ads-launch / activate / sync action wording', () => {
    expect(SOURCE).not.toMatch(/upload to canva/i);
    expect(SOURCE).not.toMatch(/send to canva/i);
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/activate connector/i);
    expect(SOURCE).not.toMatch(/sync live/i);
    // No un-negated auto-post wording.
    expect(SOURCE).not.toMatch(/(?<!no )auto-post/i);
  });

  it('introduces no live connector capability (no fetch / axios / OAuth / webhook / token)', () => {
    expect(SOURCE).not.toMatch(/OAuth/i);
    expect(SOURCE).not.toMatch(/webhook/i);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
    expect(SOURCE).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(SOURCE).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});
