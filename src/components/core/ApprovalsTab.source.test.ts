import { describe, expect, it } from 'vitest';
// Static source scan (no DOM runner in this project — same approach as the other
// *.source.test.ts files). Phase O adds a read-only Brand Context Snapshot to the
// approval detail; the safety-sensitive assertions are scoped to that marked slice
// because ApprovalsTab legitimately contains pre-existing negated phrases
// ("…does not auto-post or launch ads") and a manual-delivery `https://`
// reference-only placeholder elsewhere in the file.
import SOURCE from './ApprovalsTab.tsx?raw';

// Slice between the stable Phase O markers so the bans below test ONLY the new
// snapshot region, not the whole (large, pre-existing) component.
const START = 'PHASE_O_SNAPSHOT_START';
const END = 'PHASE_O_SNAPSHOT_END';
const between = SOURCE.split(START)[1]?.split(END)[0] ?? '';

// The snapshot panel body (its component definition).
const PANEL_START = 'function BrandContextSnapshotPanel';
const PANEL_END = 'function DetailView(';
const panel = SOURCE.split(PANEL_START)[1]?.split(PANEL_END)[0] ?? '';

describe('ApprovalsTab — Phase O Brand Context Snapshot (review-only)', () => {
  it('wires the read-only snapshot panel into the approval detail', () => {
    expect(between).toMatch(/BrandContextSnapshotPanel/);
    expect(SOURCE).toMatch(/buildAiFactoryBrandContext/);
    expect(SOURCE).toMatch(/brandContextFor/);
    // Built from the draft's originating brand/client/campaign/brief — read-only.
    expect(SOURCE).toMatch(/brandContext=\{brandContextFor\(request, item\)\}/);
  });

  it('renders the snapshot review fields', () => {
    expect(panel).toMatch(/Brand Context Snapshot/);
    expect(panel).toMatch(/Grounding used for this draft/);
    expect(panel).toMatch(/Review-only/);
    expect(panel).toMatch(/Internal draft context/);
    expect(panel).toMatch(/Campaign context/);
    expect(panel).toMatch(/Target customers/);
    expect(panel).toMatch(/Brand voice \/ tone/);
    expect(panel).toMatch(/Content pillars/);
    expect(panel).toMatch(/Creative do/);
    expect(panel).toMatch(/Creative don't/);
    expect(panel).toMatch(/Compliance \/ claim notes/);
    // Source / status labels surfaced (internal/mock/demo/draft-only come from data).
    expect(panel).toMatch(/label="Source"/);
    expect(panel).toMatch(/label="Status"/);
  });

  it('keeps approval-first + Approved ≠ Published visible in the snapshot', () => {
    expect(panel).toMatch(/Approved ≠ Published/);
    expect(panel).toMatch(/no auto-post/i);
    expect(panel).toMatch(/no live connectors/i);
    // Whole-file approval-first banner is preserved.
    expect(SOURCE).toMatch(/Approved ≠ Published/);
  });

  it('renders no publish / post / ads-launch / activate / sync action in the snapshot', () => {
    expect(panel).not.toMatch(/publish now/i);
    expect(panel).not.toMatch(/launch ad/i);
    expect(panel).not.toMatch(/launch campaign/i);
    expect(panel).not.toMatch(/post to/i);
    expect(panel).not.toMatch(/go live/i);
    expect(panel).not.toMatch(/activate connector/i);
    expect(panel).not.toMatch(/send to canva/i);
    expect(panel).not.toMatch(/upload to canva/i);
    expect(panel).not.toMatch(/sync live/i);
    // auto-post only ever appears negated in the snapshot.
    expect(panel).not.toMatch(/(?<!no )auto-post/i);
  });

  it('is display-only — no edit/save/upload or handler wiring in the panel', () => {
    expect(panel).not.toMatch(/onAction|onComment|onSubmit|onSave|onUpload|useState/);
    expect(panel).not.toMatch(/<input|<textarea|<button/);
  });

  it('introduces no live connector call or secret in the snapshot region', () => {
    expect(panel).not.toMatch(/https?:\/\//i);
    expect(panel).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
    expect(panel).not.toMatch(/OAuth|webhook/i);
    expect(panel).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(panel).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS|OPENAI_API_KEY/);
  });

  it('carries no off-domain / off-project contamination in the snapshot region', () => {
    expect(panel).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});
