import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library, adding deps is out of scope), so the interactive panel's
// safety posture is enforced by scanning its source, the same approach used by
// DeliveryAcceptancePanel / ClientDeliveryRoomPanel / ManualPublishingChecklistPanel.
// (The pure model logic itself is unit-tested in deliveryClosure.test.ts.)
import SOURCE from './DeliveryClosurePanel.tsx?raw';

describe('DeliveryClosurePanel (Phase U delivery closure & manual publishing handoff safety guard)', () => {
  it('renders the Delivery Closure surface as a local/demo closeout', () => {
    expect(SOURCE).toMatch(/Delivery Closure/);
    expect(SOURCE).toMatch(/Local\/Demo/i);
  });

  it('shows the required local/demo badges and a Not Published badge', () => {
    // Rendered via closure.local_only_badges, which is the verbatim constant list.
    expect(SOURCE).toMatch(/local_only_badges/);
    expect(SOURCE).toMatch(/Not Published/);
  });

  it('keeps "Client accepted ≠ Published" + "publish manually outside CORE" visible', () => {
    expect(SOURCE).toMatch(/client_accepted_not_published_message/);
    expect(SOURCE).toMatch(/publish_outside_core_message/);
    expect(SOURCE).toMatch(/safety_note/);
  });

  it('composes the Phase R checklist + the closure model (reuse, not a parallel system)', () => {
    expect(SOURCE).toMatch(/collectCampaignPackItems/);
    expect(SOURCE).toMatch(/buildManualPublishingChecklist/);
    expect(SOURCE).toMatch(/buildDeliveryClosure/);
    expect(SOURCE).toMatch(/renderDeliveryClosureText/);
  });

  it('surfaces the manual closure checklist + the audit trail', () => {
    expect(SOURCE).toMatch(/Manual Publishing Checklist/);
    expect(SOURCE).toMatch(/Closure Audit Trail/);
    expect(SOURCE).toMatch(/local\/mock\/demo/i);
    expect(SOURCE).toMatch(/appendClosureAudit/);
  });

  it('the manual publish mark requires an explicit operator action (never auto-set)', () => {
    // The mark is only ever set inside explicit click handlers.
    expect(SOURCE).toMatch(/setManualPublishMark\('marked_published'\)/);
    expect(SOURCE).toMatch(/setManualPublishMark\('closed_unpublished'\)/);
    // Marking published is gated behind the safe-close readiness.
    expect(SOURCE).toMatch(/ready_to_close/);
  });

  it('BOTH terminal marks (publish AND close) are gated by the safe-close readiness — no bypass', () => {
    // Each mark handler early-returns unless closure.ready_to_close holds.
    const markPublished = SOURCE.match(/handleMarkPublished[\s\S]*?\}, \[/);
    const closeUnpublished = SOURCE.match(/handleCloseUnpublished[\s\S]*?\}, \[/);
    expect(markPublished?.[0]).toMatch(/!closure\.ready_to_close/);
    expect(closeUnpublished?.[0]).toMatch(/!closure\.ready_to_close/);
    // A requested-but-unsafe mark is surfaced as NOT applied.
    expect(SOURCE).toMatch(/manual_publish_mark_applied/);
    expect(SOURCE).toMatch(/manual_publish_mark_requested/);
  });

  it('offers only local helper actions — never publish/share-url/notification CTAs', () => {
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/auto[-\s]?publish/i);
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

  it('never auto-posts or auto-approves — auto-post only ever shown negated', () => {
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

  it('quotes no fabricated metrics / live analytics pull', () => {
    expect(SOURCE).not.toMatch(/fetchAnalytics|getAnalytics|pull(Live)?Metrics|liveMetrics/i);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });
});
