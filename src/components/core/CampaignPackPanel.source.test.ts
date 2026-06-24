import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library, adding deps is out of scope), so the interactive panel's
// safety posture is enforced by scanning its source, the same approach used by
// CampaignWorkspace / ConnectorActivationLedger / OwnerOperationsPanel.
// (The pure pack-building logic itself is unit-tested in campaignPack.test.ts.)
import SOURCE from './CampaignPackPanel.tsx?raw';

describe('CampaignPackPanel (Phase Q client-ready export safety guard)', () => {
  it('renders the campaign pack export surface', () => {
    expect(SOURCE).toMatch(/Campaign Pack/);
    expect(SOURCE).toMatch(/Build campaign pack/);
    expect(SOURCE).toMatch(/copy\/export only/i);
    expect(SOURCE).toMatch(/Copy to clipboard/);
  });

  it('keeps approval-first messaging — pack carries Approved ≠ Published + safety copy', () => {
    // The verbatim copy lives in campaignPack.ts; the panel must reference both
    // constants so every built pack carries them.
    expect(SOURCE).toMatch(/CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED/);
    expect(SOURCE).toMatch(/CAMPAIGN_PACK_SAFETY_NOTE/);
  });

  it('only packs APPROVED deliverables (no publishing semantics)', () => {
    // collectCampaignPackItems filters to status `approved`; the panel must use it.
    expect(SOURCE).toMatch(/collectCampaignPackItems/);
    expect(SOURCE).toMatch(/No approved deliverables/i);
  });

  it('exports locally only — Blob/object-URL download + clipboard, never a network call', () => {
    expect(SOURCE).toMatch(/new Blob\(/);
    expect(SOURCE).toMatch(/navigator\.clipboard/);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
  });

  it('reads manual-delivery state but never writes/mutates it or approvals', () => {
    expect(SOURCE).toMatch(/loadManualDelivery/);
    expect(SOURCE).not.toMatch(/saveManualDelivery|setManualDelivery/);
    expect(SOURCE).not.toMatch(/executeApprovalAction|updateApproval|setApprovalData/);
    expect(SOURCE).not.toMatch(/localStorage\.setItem/);
  });

  it('renders no publish / post / ads-launch / go-live action wording', () => {
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/send to (canva|client)/i);
  });

  it('treats auto-post as forbidden — only ever shown negated as a safety guarantee', () => {
    expect(SOURCE).not.toMatch(/(?<!no )auto-post/i);
  });

  it('introduces no live connector capability (no URL / OAuth / webhook / token)', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/OAuth/i);
    expect(SOURCE).not.toMatch(/webhook/i);
    expect(SOURCE).not.toMatch(/CANVA_API|CANVA_TOKEN|META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});
