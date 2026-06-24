import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library, adding deps is out of scope), so the interactive panel's
// safety posture is enforced by scanning its source, the same approach used by
// CampaignPackPanel / ManualPublishingChecklistPanel / CampaignWorkspace.
// (The pure builder logic itself is unit-tested in clientDeliveryRoom.test.ts.)
import SOURCE from './ClientDeliveryRoomPanel.tsx?raw';

describe('ClientDeliveryRoomPanel (Phase S client delivery room safety guard)', () => {
  it('renders the client delivery room / handoff surface', () => {
    expect(SOURCE).toMatch(/Client Delivery Room/i);
    expect(SOURCE).toMatch(/Handoff Preview/i);
  });

  it('keeps Approved ≠ Published + manual-only + Not Published language visible', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Not Published/);
    // The explicit messages are rendered via the room model fields.
    expect(SOURCE).toMatch(/approved_not_published_message/);
    expect(SOURCE).toMatch(/manual_publishing_only_message/);
  });

  it('composes Phase Q pack + Phase R checklist (reuse, not a parallel system)', () => {
    expect(SOURCE).toMatch(/collectCampaignPackItems/);
    expect(SOURCE).toMatch(/buildManualPublishingChecklist/);
    expect(SOURCE).toMatch(/buildClientDeliveryRoom/);
  });

  it('offers only local helper actions — copy + preview, never publish/share-url', () => {
    expect(SOURCE).toMatch(/Copy client handoff summary/);
    expect(SOURCE).toMatch(/Copy manual publishing checklist/);
    expect(SOURCE).toMatch(/Preview delivery room/);
    // Forbidden publish/automation/share-url CTA wording must never appear.
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/auto publish/i);
    expect(SOURCE).not.toMatch(/run ads/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/create (share|public) link/i);
    expect(SOURCE).not.toMatch(/generate (share|public) (link|url)/i);
  });

  it('performs no sharing/publishing — clipboard + local preview only, never a network call', () => {
    expect(SOURCE).toMatch(/navigator\.clipboard/);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
  });

  it('mutates no approval / delivery / persisted state', () => {
    expect(SOURCE).not.toMatch(/executeApprovalAction|updateApproval|setApprovalData/);
    expect(SOURCE).not.toMatch(/saveManualDelivery|setManualDelivery/);
    expect(SOURCE).not.toMatch(/localStorage\.setItem/);
  });

  it('treats auto-post as forbidden — only ever shown negated as a safety guarantee', () => {
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?post/i);
  });

  it('introduces no live connector capability / no URL / OAuth / webhook / token / share-url', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/OAuth/i);
    expect(SOURCE).not.toMatch(/webhook/i);
    expect(SOURCE).not.toMatch(/share[_-]?url|public[_-]?url/i);
    expect(SOURCE).not.toMatch(/CANVA_CLIENT|CANVA_API|CANVA_TOKEN|META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS|access_token|client_secret/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});
