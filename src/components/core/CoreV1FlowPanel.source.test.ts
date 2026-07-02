import { describe, expect, it } from 'vitest';
// Static source scan — no DOM test runner in this project (no jsdom); the panel's
// safety posture is enforced by scanning its source, the same approach used by
// CampaignPackPanel / CampaignWorkspace / DeliveryAcceptancePanel. The pure logic
// (integration map, active-context gate, connector command handoff) is unit-tested
// in coreV1Integration.test.ts + connectorCommand.test.ts.
import SOURCE from './CoreV1FlowPanel.tsx?raw';

describe('CoreV1FlowPanel (CORE V1 integration closure safety guard)', () => {
  it('renders the integration flow surface', () => {
    expect(SOURCE).toMatch(/CORE V1 Flow/);
    expect(SOURCE).toMatch(/Connector command handoff/i);
    expect(SOURCE).toMatch(/Official Brand Brain context/i);
  });

  it('uses the applied Brand Brain version as official context (not draft/proposal/candidate)', () => {
    expect(SOURCE).toMatch(/resolveActiveBrandBrainContext/);
    expect(SOURCE).toMatch(/applied Brand Brain version/i);
    // It must never treat a proposal / learning candidate as the official context.
    expect(SOURCE).not.toMatch(/official context.*(proposal|draft|learning candidate)/i);
  });

  it('builds connector commands only from APPROVED assets', () => {
    expect(SOURCE).toMatch(/collectCampaignPackItems/);
    expect(SOURCE).toMatch(/buildConnectorCommands/);
    expect(SOURCE).toMatch(/only approved assets can produce connector commands/i);
  });

  it('carries the "does not publish" + "requires manual evidence" copy', () => {
    expect(SOURCE).toMatch(/CONNECTOR_COMMAND_DOES_NOT_PUBLISH/);
    expect(SOURCE).toMatch(/CONNECTOR_COMMAND_REQUIRES_EVIDENCE/);
    expect(SOURCE).toMatch(/not Published/);
  });

  it('is read-only + copy-only — clipboard, never a network call or persistence', () => {
    expect(SOURCE).toMatch(/navigator\.clipboard/);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
    expect(SOURCE).not.toMatch(/localStorage\.setItem/);
    // Never mutates approval state.
    expect(SOURCE).not.toMatch(/executeApprovalAction|updateApproval|setApprovalData/);
  });

  it('renders no publish / launch / go-live / auto action wording', () => {
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/go live/i);
    // "auto-post" / "auto-publish" only ever negated as a safety guarantee.
    expect(SOURCE).not.toMatch(/(?<!no )auto-post/i);
    expect(SOURCE).not.toMatch(/(?<!never )auto-?publish|automatically publish/i);
  });

  it('introduces no live connector capability (no URL / OAuth / webhook / token)', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/OAuth/i);
    expect(SOURCE).not.toMatch(/webhook/i);
    expect(SOURCE).not.toMatch(/CANVA_API|CANVA_TOKEN|META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS_/);
    // No live health check is fired from this panel.
    expect(SOURCE).not.toMatch(/checkN8nHealth|checkGdriveHealth|fetchN8nData|fetchGdriveData/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });

  // ── T4-10-B: per-command lifecycle buttons (local state only) ──

  it('offers the two lifecycle buttons — dry-run mark + manual-run approval', () => {
    expect(SOURCE).toMatch(/Mark simulated \(dry-run\)/);
    expect(SOURCE).toMatch(/Approve for manual run/);
  });

  it('transitions status only via the pure setConnectorCommandStatus helper', () => {
    expect(SOURCE).toMatch(/setConnectorCommandStatus/);
  });

  it('lifecycle buttons are gated — disabled when blocked, hidden outside draft/ready_for_owner', () => {
    expect(SOURCE).toMatch(/showLifecycle/);
    expect(SOURCE).toMatch(/lifecycleDisabled/);
    expect(SOURCE).toMatch(/c\.status === 'blocked'/);
  });

  it('has no emit / send-command wording in any language', () => {
    expect(SOURCE).not.toMatch(/gửi lệnh|send command|\bemit\b/i);
  });

  it('reads evidence/review receipts from optional props, never hardcoded true', () => {
    expect(SOURCE).toMatch(/hasManualPublishingEvidence\s*=\s*false/);
    expect(SOURCE).toMatch(/hasReviewedResult\s*=\s*false/);
    expect(SOURCE).not.toMatch(/hasManualPublishingEvidence:\s*true|hasReviewedResult:\s*true/);
  });

  // ── T4-11-B: receipts wire-in landed — panel is rendered by the evidence section ──

  it('receipts wire-in TODO is gone — the wire-in landed in T4-11-B', () => {
    expect(SOURCE).not.toMatch(/TODO.*wire in when receipts wire-in lands/);
  });

  it('keeps both receipt props in the signature (optional, backward compatible)', () => {
    expect(SOURCE).toMatch(/hasManualPublishingEvidence\?:\s*boolean/);
    expect(SOURCE).toMatch(/hasReviewedResult\?:\s*boolean/);
  });

  // ── T4-13: explicit Owner share of read-only previews into the in-memory store ──

  it('offers the explicit share action with read-only framing', () => {
    expect(SOURCE).toMatch(/Share read-only previews with Connector Dashboard/);
    expect(SOURCE).toMatch(/Read-only connector previews shared for dashboard review\./);
  });

  it('writes the snapshot only through the validated store API, from a click handler', () => {
    expect(SOURCE).toMatch(/createConnectorCommandSnapshot/);
    expect(SOURCE).toMatch(/writeConnectorCommandSnapshot/);
    expect(SOURCE).toMatch(/handleShareReadOnlyPreviews/);
    // Never auto-shares on render — the panel has no effect hook at all.
    expect(SOURCE).not.toMatch(/useEffect/);
  });
});
