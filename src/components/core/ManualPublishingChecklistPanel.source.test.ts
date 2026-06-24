import { describe, expect, it } from 'vitest';
// Static source scan — there is no DOM test runner in this project (no jsdom /
// testing-library, adding deps is out of scope), so the interactive panel's
// safety posture is enforced by scanning its source, the same approach used by
// CampaignPackPanel / CampaignWorkspace / ConnectorActivationLedger.
// (The pure checklist logic itself is unit-tested in manualPublishingChecklist.test.ts.)
import SOURCE from './ManualPublishingChecklistPanel.tsx?raw';

describe('ManualPublishingChecklistPanel (Phase R manual-publishing readiness safety guard)', () => {
  it('renders the manual publishing checklist surface', () => {
    expect(SOURCE).toMatch(/Manual Publishing Checklist/i);
    expect(SOURCE).toMatch(/Delivery Readiness/i);
  });

  it('keeps Approved ≠ Published + manual-only language visible', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    // The manual-only reminder is rendered via the shared constant.
    expect(SOURCE).toMatch(/MANUAL_PUBLISHING_ONLY_NOTE/);
    expect(SOURCE).toMatch(/MANUAL_PUBLISHING_SAFETY_NOTICE/);
  });

  it('uses the pure builder over APPROVED deliverables only (no publishing semantics)', () => {
    expect(SOURCE).toMatch(/collectCampaignPackItems/);
    expect(SOURCE).toMatch(/buildManualPublishingChecklist/);
  });

  it('offers only allowed CTAs — copy + local handoff note, never a real publish action', () => {
    expect(SOURCE).toMatch(/Copy manual checklist/);
    expect(SOURCE).toMatch(/Mark ready for manual handoff/);
    // Forbidden publish/automation CTA labels must never appear.
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/auto publish/i);
    expect(SOURCE).not.toMatch(/run ads/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/post to/i);
  });

  it('performs no publishing — clipboard + local note only, never a network call', () => {
    expect(SOURCE).toMatch(/navigator\.clipboard/);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
  });

  it('mutates no approval / delivery / persisted state', () => {
    expect(SOURCE).not.toMatch(/executeApprovalAction|updateApproval|setApprovalData/);
    expect(SOURCE).not.toMatch(/saveManualDelivery|setManualDelivery/);
    expect(SOURCE).not.toMatch(/localStorage\.setItem/);
  });

  it('treats auto-post as forbidden — only ever shown negated as a safety guarantee', () => {
    // Negated forms ("no auto-posting", "never auto-posts") are allowed; a bare
    // affirmative auto-post action must never appear.
    expect(SOURCE).not.toMatch(/(?<!no |never )auto-?post/i);
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
