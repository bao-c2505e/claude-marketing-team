import { describe, expect, it } from 'vitest';
import type { CampaignPackItem } from '../campaignPack';
import {
  buildConnectorCommands,
  setConnectorCommandStatus,
  type ConnectorCommand,
  type ConnectorCommandStatus,
} from './connectorCommand';
import {
  createConnectorCommandSnapshot,
  validateConnectorCommandSnapshot,
  groupCommandsByConnector,
  CONNECTOR_COMMAND_SNAPSHOT_SCHEMA_VERSION,
} from './connectorCommandSnapshot';
// The contract file must stay pure data + pure functions — no store, no
// persistence, no network. Enforced by the source scan below.
import SOURCE from './connectorCommandSnapshot.ts?raw';

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

function cmds(target: 'canva' | 'meta' | 'n8n', count = 1): ConnectorCommand[] {
  const items = Array.from({ length: count }, (_, i) =>
    approvedItem({ approvalId: `appr-${target}-${i}`, contentItemId: `item-${target}-${i}`, title: `Asset ${target} ${i}` }),
  );
  return buildConnectorCommands({ campaignId: 'camp-1', items, targetConnector: target, now: NOW });
}

describe('createConnectorCommandSnapshot (T4-12 contract)', () => {
  it('builds a schema-versioned, plain-data snapshot with a defensive copy of commands', () => {
    const commands = cmds('canva', 2);
    const snap = createConnectorCommandSnapshot({ campaignId: 'camp-1', builtBy: 'Owner', commands, now: NOW });
    expect(snap.schemaVersion).toBe(CONNECTOR_COMMAND_SNAPSHOT_SCHEMA_VERSION);
    expect(snap.sourceCampaignId).toBe('camp-1');
    expect(snap.builtBy).toBe('Owner');
    expect(snap.builtAt).toBe(NOW.toISOString());
    expect(snap.commands).toHaveLength(2);
    // Mutating the caller's array after creation cannot change the snapshot.
    commands.pop();
    expect(snap.commands).toHaveLength(2);
  });
});

describe('validateConnectorCommandSnapshot — approval-first integrity guard', () => {
  it('accepts a snapshot of untampered, approval-built commands', () => {
    const snap = createConnectorCommandSnapshot({ campaignId: 'camp-1', builtBy: 'Owner', commands: cmds('canva', 2), now: NOW });
    const result = validateConnectorCommandSnapshot(snap);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('rejects a command that belongs to a different campaign', () => {
    const snap = createConnectorCommandSnapshot({ campaignId: 'camp-OTHER', builtBy: 'Owner', commands: cmds('canva'), now: NOW });
    const result = validateConnectorCommandSnapshot(snap);
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/campaign mismatch/);
  });

  it('rejects a tampered outward-capability flag (publish/live must stay false)', () => {
    const [cmd] = cmds('meta');
    const tampered = { ...cmd, safetyFlags: { ...cmd.safetyFlags, publishesContent: true } } as unknown as ConnectorCommand;
    const snap = createConnectorCommandSnapshot({ campaignId: 'camp-1', builtBy: 'Owner', commands: [tampered], now: NOW });
    const result = validateConnectorCommandSnapshot(snap);
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/tampered outward-capability flag/);
  });

  it('rejects a tampered owner-gate flag (gates must stay true)', () => {
    const [cmd] = cmds('meta');
    const tampered = { ...cmd, safetyFlags: { ...cmd.safetyFlags, requiresManualPublishingEvidence: false } } as unknown as ConnectorCommand;
    const snap = createConnectorCommandSnapshot({ campaignId: 'camp-1', builtBy: 'Owner', commands: [tampered], now: NOW });
    const result = validateConnectorCommandSnapshot(snap);
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/tampered owner-gate flag/);
  });

  it('rejects a command not provably created from an approved asset', () => {
    const [cmd] = cmds('canva');
    const tampered = {
      ...cmd,
      approvalEvidence: { ...cmd.approvalEvidence, createdFromApprovedAsset: false },
    } as unknown as ConnectorCommand;
    const snap = createConnectorCommandSnapshot({ campaignId: 'camp-1', builtBy: 'Owner', commands: [tampered], now: NOW });
    const result = validateConnectorCommandSnapshot(snap);
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/not provably created from an approved asset/);
  });

  it("rejects an unknown lifecycle status — there is NO 'published' status", () => {
    const [cmd] = cmds('canva');
    const tampered = { ...cmd, status: 'published' as unknown as ConnectorCommandStatus };
    const snap = createConnectorCommandSnapshot({ campaignId: 'camp-1', builtBy: 'Owner', commands: [tampered], now: NOW });
    const result = validateConnectorCommandSnapshot(snap);
    expect(result.ok).toBe(false);
    expect(result.issues.join(' ')).toMatch(/unknown status 'published'/);
  });

  it('never throws — validation reports issues instead', () => {
    const snap = createConnectorCommandSnapshot({ campaignId: 'camp-1', builtBy: 'Owner', commands: [], now: NOW });
    expect(() => validateConnectorCommandSnapshot(snap)).not.toThrow();
    expect(validateConnectorCommandSnapshot(snap).ok).toBe(true);
  });
});

describe('groupCommandsByConnector — pure dashboard projection', () => {
  it('empty input → empty Map', () => {
    const grouped = groupCommandsByConnector([]);
    expect(grouped.size).toBe(0);
  });

  it('3 commands on one connector → one bucket, original order preserved', () => {
    const commands = cmds('canva', 3);
    const grouped = groupCommandsByConnector(commands);
    expect(grouped.size).toBe(1);
    expect(grouped.get('canva')).toHaveLength(3);
    expect(grouped.get('canva')?.map(c => c.id)).toEqual(commands.map(c => c.id));
  });

  it('5 commands across 3 connectors → 3 buckets with correct sizes', () => {
    const commands = [...cmds('canva', 2), ...cmds('meta', 2), ...cmds('n8n', 1)];
    const grouped = groupCommandsByConnector(commands);
    expect(grouped.size).toBe(3);
    expect(grouped.get('canva')).toHaveLength(2);
    expect(grouped.get('meta')).toHaveLength(2);
    expect(grouped.get('n8n')).toHaveLength(1);
  });

  it('is immutable — input array and command objects are not mutated', () => {
    const commands = [...cmds('canva'), ...cmds('meta')];
    const before = JSON.stringify(commands);
    const grouped = groupCommandsByConnector(commands);
    // Post-group status change on a copy never leaks back into the input.
    setConnectorCommandStatus(commands[0], 'simulated');
    expect(JSON.stringify(commands)).toBe(before);
    expect(grouped.get('canva')?.[0]).toBe(commands[0]);
  });
});

describe('contract file stays pure (source guard)', () => {
  it('has no store, persistence, or network primitive — contract only', () => {
    const codeOnly = SOURCE
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(codeOnly).not.toMatch(/fetch|axios|XMLHttpRequest|https?:\/\/|OAuth|webhook|localStorage|sessionStorage|indexedDB|BroadcastChannel|dispatchEvent/i);
    // No React coupling — this contract must stay renderer-agnostic.
    expect(codeOnly).not.toMatch(/from 'react'|useState|useEffect|createContext/);
  });
});
