import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library, adding deps is out of scope), so the interactive panel's
// safety posture is enforced by scanning its source, the same approach used by
// ClientDeliveryRoomPanel / ManualPublishingChecklistPanel / CampaignWorkspace.
// (The pure model logic itself is unit-tested in deliveryAcceptance.test.ts.)
import SOURCE from './DeliveryAcceptancePanel.tsx?raw';

describe('DeliveryAcceptancePanel (Phase T client feedback & delivery acceptance safety guard)', () => {
  it('renders the client feedback & delivery acceptance surface as a local mock', () => {
    expect(SOURCE).toMatch(/Client Feedback & Delivery Acceptance/i);
    expect(SOURCE).toMatch(/Local Mock/i);
  });

  it('shows the required local/mock badges', () => {
    // Rendered via room.local_only_badges, which is the verbatim constant list.
    expect(SOURCE).toMatch(/local_only_badges/);
  });

  it('keeps "Client accepted ≠ Published" + Not Published language visible', () => {
    expect(SOURCE).toMatch(/Not Published/);
    expect(SOURCE).toMatch(/client_accepted_not_published_message/);
    expect(SOURCE).toMatch(/mock_note/);
  });

  it('composes the Phase R checklist to gate owner-ready (reuse, not a parallel system)', () => {
    expect(SOURCE).toMatch(/collectCampaignPackItems/);
    expect(SOURCE).toMatch(/buildManualPublishingChecklist/);
    expect(SOURCE).toMatch(/buildDeliveryAcceptanceRoom/);
    expect(SOURCE).toMatch(/can_mark_owner_ready_for_manual_publish/);
  });

  it('surfaces the explicit owner-ready-still-needs-Phase-R-checklist copy', () => {
    expect(SOURCE).toMatch(/DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST/);
  });

  it('offers only local helper actions — never publish/share-url/notification CTAs', () => {
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/auto publish/i);
    expect(SOURCE).not.toMatch(/run ads/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/send (to )?client/i);
    expect(SOURCE).not.toMatch(/notify client/i);
    expect(SOURCE).not.toMatch(/create (share|public) link/i);
    expect(SOURCE).not.toMatch(/generate (share|public) (link|url)/i);
  });

  it('performs no sending/publishing — clipboard + local preview only, never a network call', () => {
    expect(SOURCE).toMatch(/navigator\.clipboard/);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
  });

  it('mutates no approval / delivery / persisted state — local React state only', () => {
    expect(SOURCE).not.toMatch(/executeApprovalAction|updateApproval|setApprovalData/);
    expect(SOURCE).not.toMatch(/saveManualDelivery|setManualDelivery/);
    expect(SOURCE).not.toMatch(/localStorage\.setItem/);
  });

  it('never auto-approves or auto-publishes — auto-post only ever shown negated', () => {
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?post/i);
    expect(SOURCE).not.toMatch(/auto-?approve/i);
  });

  it('introduces no live connector capability / no URL / OAuth / webhook / token / share-url / email send', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/OAuth/i);
    expect(SOURCE).not.toMatch(/webhook/i);
    expect(SOURCE).not.toMatch(/share[_-]?url|public[_-]?url/i);
    expect(SOURCE).not.toMatch(/mailto:|sendEmail|sendMail|emailClient/i);
    expect(SOURCE).not.toMatch(/CANVA_CLIENT|CANVA_API|CANVA_TOKEN|META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS|access_token|client_secret/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});
