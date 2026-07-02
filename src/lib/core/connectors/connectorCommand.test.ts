import { describe, expect, it } from 'vitest';
import type { CampaignPackItem } from '../campaignPack';
import {
  buildConnectorCommands,
  buildConnectorCommandForItem,
  setConnectorCommandStatus,
  connectorCommandImpliesPublished,
  connectorCommandRequiresManualEvidence,
  summarizeConnectorCommands,
  renderConnectorCommandsText,
  suggestConnectorForModule,
  connectorTargetLabel,
  CONNECTOR_COMMAND_TARGETS,
  CONNECTOR_COMMAND_DOES_NOT_PUBLISH,
  CONNECTOR_COMMAND_SAFETY_FLAGS,
  type ConnectorCommand,
} from './connectorCommand';

const NOW = new Date('2026-07-02T10:00:00.000Z');

function approvedItem(over: Partial<CampaignPackItem> = {}): CampaignPackItem {
  return {
    approvalId: 'appr-1',
    contentItemId: 'item-1',
    title: 'Ngày 1 — Món signature',
    module: 'content',
    moduleLabel: 'Content Factory',
    deliveryStatus: 'not_delivered',
    provenance: { actorLabel: 'Owner', at: '2026-07-01T09:00:00.000Z' },
    ...over,
  };
}

describe('connector command handoff — build from approved asset', () => {
  it('builds one command per approved item, tied to approval evidence', () => {
    const items = [approvedItem(), approvedItem({ approvalId: 'appr-2', contentItemId: 'item-2', title: 'Ngày 2', module: 'design', moduleLabel: 'Design Factory' })];
    const cmds = buildConnectorCommands({ campaignId: 'camp-1', items, targetConnector: 'canva', now: NOW });

    expect(cmds).toHaveLength(2);
    expect(cmds[0].sourceCampaignId).toBe('camp-1');
    expect(cmds[0].sourceApprovalId).toBe('appr-1');
    expect(cmds[0].sourceAssetId).toBe('item-1');
    expect(cmds[0].sourceAssetType).toBe('content');
    expect(cmds[0].targetConnector).toBe('canva');
    expect(cmds[0].targetConnectorLabel).toBe(connectorTargetLabel('canva'));
    expect(cmds[0].status).toBe('ready_for_owner');
    // Provably built from an approved asset.
    expect(cmds[0].approvalEvidence.createdFromApprovedAsset).toBe(true);
    expect(cmds[0].approvalEvidence.approvedBy).toBe('Owner');
    expect(cmds[0].approvalEvidence.approvalId).toBe('appr-1');
  });

  it('every command carries the "does not publish" copy', () => {
    const cmd = buildConnectorCommandForItem('camp-1', approvedItem(), 'meta', { now: NOW });
    expect(cmd.note).toContain(CONNECTOR_COMMAND_DOES_NOT_PUBLISH);
  });

  it('every command has hard-false publish/live safety flags and hard-true owner gates', () => {
    const cmd = buildConnectorCommandForItem('camp-1', approvedItem(), 'meta', { now: NOW });
    expect(cmd.safetyFlags.publishesContent).toBe(false);
    expect(cmd.safetyFlags.launchesAds).toBe(false);
    expect(cmd.safetyFlags.spends).toBe(false);
    expect(cmd.safetyFlags.autoRuns).toBe(false);
    expect(cmd.safetyFlags.usesLiveConnector).toBe(false);
    expect(cmd.safetyFlags.requiresOwnerApproval).toBe(true);
    expect(cmd.safetyFlags.requiresManualPublishingEvidence).toBe(true);
    expect(cmd.safetyFlags.approvedNotPublished).toBe(true);
    // Clone, not the shared reference.
    expect(cmd.safetyFlags).not.toBe(CONNECTOR_COMMAND_SAFETY_FLAGS);
  });

  it('suggests a plausible default connector per module (all live-blocked)', () => {
    expect(suggestConnectorForModule('design')).toBe('canva');
    expect(suggestConnectorForModule('ads')).toBe('meta');
    expect(suggestConnectorForModule('video')).toBe('tiktok');
    expect(suggestConnectorForModule('report')).toBe('google_sheets');
    expect(CONNECTOR_COMMAND_TARGETS).toContain('n8n');
  });
});

describe('connector command ≠ Published', () => {
  it('never implies Published, in any status', () => {
    const cmd = buildConnectorCommandForItem('camp-1', approvedItem(), 'canva', { now: NOW });
    for (const status of ['draft', 'ready_for_owner', 'approved_for_manual_run', 'simulated', 'blocked'] as const) {
      const next = setConnectorCommandStatus(cmd, status);
      expect(connectorCommandImpliesPublished(next)).toBe(false);
    }
  });

  it('a simulated / approved_for_manual_run command still requires Owner manual evidence', () => {
    const cmd = buildConnectorCommandForItem('camp-1', approvedItem(), 'canva', { now: NOW });
    const simulated = setConnectorCommandStatus(cmd, 'simulated');
    const runReady = setConnectorCommandStatus(cmd, 'approved_for_manual_run');
    expect(connectorCommandRequiresManualEvidence(simulated)).toBe(true);
    expect(connectorCommandRequiresManualEvidence(runReady)).toBe(true);
    // A transition never re-enables a publish/live flag.
    expect(simulated.safetyFlags.publishesContent).toBe(false);
    expect(simulated.safetyFlags.usesLiveConnector).toBe(false);
    expect(runReady.safetyFlags.launchesAds).toBe(false);
  });

  it('setConnectorCommandStatus is pure — never mutates the input command', () => {
    const cmd = buildConnectorCommandForItem('camp-1', approvedItem(), 'canva', { now: NOW });
    const before = cmd.status;
    setConnectorCommandStatus(cmd, 'simulated');
    expect(cmd.status).toBe(before);
  });
});

describe('summary + render', () => {
  it('summarizes counts and never reports a publishing command', () => {
    const items = [approvedItem(), approvedItem({ approvalId: 'appr-2', contentItemId: 'item-2' })];
    let cmds = buildConnectorCommands({ campaignId: 'camp-1', items, targetConnector: 'canva', now: NOW });
    cmds = [cmds[0], setConnectorCommandStatus(cmds[1], 'blocked')];
    const sum = summarizeConnectorCommands(cmds);
    expect(sum.total).toBe(2);
    expect(sum.readyForOwner).toBe(1);
    expect(sum.blocked).toBe(1);
    expect(sum.anyPublishes).toBe(false);
  });

  it('renders copyable text with the safety copy and no URL/link', () => {
    const cmds = buildConnectorCommands({ campaignId: 'camp-1', items: [approvedItem()], targetConnector: 'meta', now: NOW });
    const text = renderConnectorCommandsText(cmds);
    expect(text).toMatch(/CONNECTOR COMMAND HANDOFF/);
    expect(text).toContain(CONNECTOR_COMMAND_DOES_NOT_PUBLISH);
    expect(text).toMatch(/Approved ≠ Published/);
    expect(text).not.toMatch(/https?:\/\//i);
  });

  it('renders an empty state when no approved assets exist', () => {
    const text = renderConnectorCommandsText([]);
    expect(text).toMatch(/No approved assets/i);
  });
});

describe('no forbidden live behavior at the type/data level', () => {
  it('carries no fabricated metric or spend value on a command', () => {
    const cmd = buildConnectorCommandForItem('camp-1', approvedItem(), 'meta', { now: NOW }) as ConnectorCommand;
    const serialized = JSON.stringify(cmd);
    // No spend/currency amounts, no reach/impression counts baked into a command.
    expect(serialized).not.toMatch(/\$\d|₫\s*\d|\d+\s*(impressions|reach|clicks|orders)/i);
    expect(serialized).not.toMatch(/https?:\/\//i);
  });
});
