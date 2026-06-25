import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library, adding deps is out of scope), so the interactive panel's
// safety posture is enforced by scanning its source, the same approach used by
// DeliveryClosurePanel / DeliveryAcceptancePanel / ManualPublishingChecklistPanel.
// (The pure model logic itself is unit-tested in manualPublishingEvidence.test.ts.)
import SOURCE from './ManualPublishingEvidencePanel.tsx?raw';

describe('ManualPublishingEvidencePanel (Phase V manual publishing evidence & result intake safety guard)', () => {
  it('renders the Manual Publishing Evidence surface as a local/demo room', () => {
    expect(SOURCE).toMatch(/Manual Publishing Evidence/);
    expect(SOURCE).toMatch(/Local\/Demo/i);
  });

  it('shows the required local/demo badges and a Not Published by CORE badge', () => {
    // Rendered via report.local_only_badges, which is the verbatim constant list.
    expect(SOURCE).toMatch(/local_only_badges/);
    expect(SOURCE).toMatch(/Not Published by CORE/);
  });

  it('keeps the "CORE does not publish" + analytics/manual-only warning copy visible', () => {
    expect(SOURCE).toMatch(/core_does_not_publish_note/);
    expect(SOURCE).toMatch(/no_live_analytics_note/);
    expect(SOURCE).toMatch(/manual_evidence_only_note/);
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Client Accepted ≠ Published/);
  });

  it('composes the pure evidence model (reuse, not a parallel system)', () => {
    expect(SOURCE).toMatch(/buildPublishingEvidenceReport/);
    expect(SOURCE).toMatch(/validateEvidence/);
    expect(SOURCE).toMatch(/renderPublishingEvidenceReportText/);
    expect(SOURCE).toMatch(/sampleManualPublishingEvidence/);
  });

  it('surfaces the four required UI sections', () => {
    expect(SOURCE).toMatch(/Publishing [Ss]tatus/);
    expect(SOURCE).toMatch(/Evidence \/ URL \/ Screenshot note/);
    expect(SOURCE).toMatch(/Manual Result Intake/);
    expect(SOURCE).toMatch(/Post-Publish Report Draft/);
  });

  it('treats publicUrl strictly as an Owner-provided evidence field (never a Core-created link)', () => {
    expect(SOURCE).toMatch(/Owner-provided evidence/);
    // The publicUrl input is a controlled field bound to evidence state — no literal URL.
    expect(SOURCE).toMatch(/publicUrl/);
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/www\./i);
  });

  it('result metrics are labeled by source — simulated/unverified unless owner/client provided', () => {
    expect(SOURCE).toMatch(/metrics_real_claim_allowed/);
    expect(SOURCE).toMatch(/Simulated \/ unverified/i);
    expect(SOURCE).toMatch(/metrics_presentation_label/);
  });

  it('offers only local helper actions — never publish/share-url/notification/launch CTAs', () => {
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

  it('never auto-posts or auto-approves — auto-post/auto-ads only ever shown negated', () => {
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?post/i);
    expect(SOURCE).not.toMatch(/(?<!no |not |never )auto-?ads/i);
    expect(SOURCE).not.toMatch(/auto-?approve/i);
  });

  it('introduces no live connector capability / no URL / login / endpoint / token / share-url / email send', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
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
});
