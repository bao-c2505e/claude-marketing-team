import { describe, expect, it } from 'vitest';
// Load the component source as a raw string via Vite's `?raw` import. There is no
// DOM test runner in this project (no jsdom / testing-library, and adding deps is
// out of scope), so Phase K safety is enforced with a static source scan — the
// same approach as ConnectorActivationLedger / OwnerOperationsPanel source tests.
import SOURCE from './CampaignWorkspace.tsx?raw';

describe('CampaignWorkspace (Phase K drill-down safety + content guard)', () => {
  it('renders the client/campaign drill-down sections', () => {
    expect(SOURCE).toMatch(/Client \/ Brand Overview/);
    expect(SOURCE).toMatch(/Campaign Brief Snapshot/);
    expect(SOURCE).toMatch(/Production Pipeline/);
    expect(SOURCE).toMatch(/AI Output Queue/);
    expect(SOURCE).toMatch(/Pending Approval Items/);
    expect(SOURCE).toMatch(/Asset \/ Design Preview Status/);
    expect(SOURCE).toMatch(/Report Draft Status/);
    expect(SOURCE).toMatch(/Safety & Connector Status/);
    expect(SOURCE).toMatch(/Recent Activity/);
    expect(SOURCE).toMatch(/Next Owner Actions/);
  });

  it('keeps approval-first messaging and "Approved ≠ Published" visible', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Approval-first/i);
    expect(SOURCE).toMatch(/Owner approval required/i);
    expect(SOURCE).toMatch(/Manual confirmation outside CORE/i);
  });

  it('shows connector safety status as blocked and read-only', () => {
    expect(SOURCE).toMatch(/live blocked/i);
    expect(SOURCE).toMatch(/Read-only/i);
    // Live count comes from the ledger summary (a hard 0 literal), never a claim.
    expect(SOURCE).toMatch(/LEDGER_SUMMARY\.liveCount/);
  });

  it('labels demo/production figures as internal / simulated (no live metrics)', () => {
    expect(SOURCE).toMatch(/simulated|internal/i);
    expect(SOURCE).toMatch(/no live analytics pull|no live pull/i);
  });

  it('renders no publish / post / ads-launch / activate action wording', () => {
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/activate connector/i);
    expect(SOURCE).not.toMatch(/send to canva/i);
    expect(SOURCE).not.toMatch(/sync live/i);
  });

  it('treats auto-post as forbidden — only ever shown negated as a safety guarantee', () => {
    // "No auto-post" is the correct safety posture and should be visible; an
    // un-negated auto-post action must never appear.
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
    // No registry / persistence mutation from this presentational drill-down.
    expect(SOURCE).not.toMatch(/updateConnectorStatus|saveConnectorRegistryData|addMockEvent|localStorage/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });

  it('only selects a campaign or navigates — no internal state mutation', () => {
    expect(SOURCE).toMatch(/onSelect/);
    expect(SOURCE).toMatch(/onNavigate/);
    expect(SOURCE).not.toMatch(/useState|useReducer/);
  });

  it('wires the Manual Publishing Evidence + Result Review via the shared stateful section', () => {
    // The workspace stays stateless; the shared manual evidence/result state lives in the
    // section wrapper, which renders the Phase V evidence panel and the Phase W result-review
    // panel against ONE source of truth (review reflects the SAME Owner-provided evidence).
    expect(SOURCE).toMatch(/import\s+ManualPublishingEvidenceSection\s+from\s+'\.\/ManualPublishingEvidenceSection'/);
    expect(SOURCE).toMatch(/<ManualPublishingEvidenceSection/);
  });

  // ── T4-11-B: the CORE V1 flow panel moved inside the evidence section ──

  it('no longer renders CoreV1FlowPanel directly — it lives inside the evidence section', () => {
    expect(SOURCE).not.toMatch(/<CoreV1FlowPanel/);
    expect(SOURCE).not.toMatch(/import\s+CoreV1FlowPanel/);
  });

  it('forwards the flow-panel data to the section as pass-through props (still stateless)', () => {
    expect(SOURCE).toMatch(/contentItems=\{contentItems\}/);
    expect(SOURCE).toMatch(/approvalRequests=\{approvals\}/);
    expect(SOURCE).toMatch(/approvalEvents=\{approvalEvents\}/);
  });
});
