import { describe, expect, it } from 'vitest';
// Static source scan (same approach as the other *.source.test.ts files — no DOM
// runner in this project). Asserts the Phase N Brand Brain grounding preview and
// its safety posture, and that no live-action wording or live connector call was
// introduced into the Automation Factory surface.
import SOURCE from './AutomationFactoryTab.tsx?raw';

describe('AutomationFactoryTab (Phase N — Brand Brain grounding preview)', () => {
  it('renders the shared Brand Brain grounding panel', () => {
    expect(SOURCE).toMatch(/BrandGroundingPanel/);
    expect(SOURCE).toMatch(/Brand Brain grounding/);
    expect(SOURCE).toMatch(/buildAiFactoryBrandContext/);
    // Grounds the visible draft modules in one shared, normalized context.
    expect(SOURCE).toMatch(/Content \/ Design \/ Video \/ Ads \/ Report/);
  });

  it('keeps internal / draft-only + approval-first + Approved ≠ Published visible', () => {
    expect(SOURCE).toMatch(/Internal · Draft-only/);
    expect(SOURCE).toMatch(/Approval-first/);
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/pending Owner approval/i);
  });

  it('treats auto-post as forbidden — only ever shown negated as a safety guarantee', () => {
    expect(SOURCE).toMatch(/no auto-post/i);
    expect(SOURCE).not.toMatch(/(?<!no )auto-post/i);
  });

  it('renders no publish / post / ads-launch / activate / sync action wording', () => {
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/activate connector/i);
    expect(SOURCE).not.toMatch(/send to canva/i);
    expect(SOURCE).not.toMatch(/sync live/i);
  });

  it('introduces no live connector call or secret (no fetch / axios / URL / token / key)', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
    expect(SOURCE).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(SOURCE).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS/);
    expect(SOURCE).not.toMatch(/OPENAI_API_KEY/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|ImgBB/i);
  });
});
