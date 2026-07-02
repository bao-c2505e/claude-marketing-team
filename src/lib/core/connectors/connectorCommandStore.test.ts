import { beforeEach, describe, expect, it } from 'vitest';
import type { CampaignPackItem } from '../campaignPack';
import { buildConnectorCommands } from './connectorCommand';
import { createConnectorCommandSnapshot } from './connectorCommandSnapshot';
import {
  writeConnectorCommandSnapshot,
  getConnectorCommandSnapshot,
  getConnectorCommandsByConnector,
  getValidatedConnectorCommandSnapshot,
  getValidatedConnectorCommandsByConnector,
  getConnectorCommandSnapshotStatus,
  clearConnectorCommandSnapshot,
  resetConnectorCommandStoreForTests,
} from './connectorCommandStore';
// The store must stay an in-memory, plain-data, React-free module. Enforced below.
import SOURCE from './connectorCommandStore.ts?raw';

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

function validSnapshot(campaignId = 'camp-1') {
  const commands = buildConnectorCommands({
    campaignId,
    items: [
      approvedItem(),
      approvedItem({ approvalId: 'appr-2', contentItemId: 'item-2', title: 'Ngày 2' }),
    ],
    targetConnector: 'canva',
    now: NOW,
  });
  return createConnectorCommandSnapshot({ campaignId, builtBy: 'Owner', commands, now: NOW });
}

beforeEach(() => {
  resetConnectorCommandStoreForTests();
});

describe('connectorCommandStore — empty state', () => {
  it('returns null snapshot and an empty grouped Map before anything is shared', () => {
    expect(getConnectorCommandSnapshot()).toBeNull();
    expect(getConnectorCommandsByConnector().size).toBe(0);
  });
});

describe('connectorCommandStore — write / read', () => {
  it('accepts a valid snapshot and reads it back with schemaVersion + provenance intact', () => {
    const snap = validSnapshot();
    const result = writeConnectorCommandSnapshot(snap);
    expect(result.ok).toBe(true);

    const read = getConnectorCommandSnapshot();
    expect(read).not.toBeNull();
    expect(read?.schemaVersion).toBe(1);
    expect(read?.sourceCampaignId).toBe('camp-1');
    expect(read?.builtBy).toBe('Owner');
    expect(read?.builtAt).toBe(NOW.toISOString());
    expect(read?.commands).toHaveLength(2);
    expect(read).toEqual(snap);
  });

  it('rejects an invalid snapshot and leaves the store unchanged', () => {
    // Campaign mismatch: snapshot claims a different campaign than its commands.
    const bad = { ...validSnapshot(), sourceCampaignId: 'camp-OTHER' };
    const result = writeConnectorCommandSnapshot(bad);
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(getConnectorCommandSnapshot()).toBeNull();

    // Also unchanged when a previous VALID snapshot exists.
    expect(writeConnectorCommandSnapshot(validSnapshot()).ok).toBe(true);
    expect(writeConnectorCommandSnapshot(bad).ok).toBe(false);
    expect(getConnectorCommandSnapshot()?.sourceCampaignId).toBe('camp-1');
  });

  it('defensive copy on write — mutating the caller snapshot after write does not leak in', () => {
    const snap = validSnapshot();
    writeConnectorCommandSnapshot(snap);
    snap.commands.pop();
    snap.commands[0].note = 'tampered after write';
    const read = getConnectorCommandSnapshot();
    expect(read?.commands).toHaveLength(2);
    expect(read?.commands[0].note).not.toContain('tampered');
  });

  it('defensive copy on read — mutating a read result does not affect the store', () => {
    writeConnectorCommandSnapshot(validSnapshot());
    const first = getConnectorCommandSnapshot();
    first?.commands.pop();
    if (first) first.commands[0].note = 'tampered read';
    const second = getConnectorCommandSnapshot();
    expect(second?.commands).toHaveLength(2);
    expect(second?.commands[0].note).not.toContain('tampered');
  });
});

describe('connectorCommandStore — grouped projection', () => {
  it('groups the stored commands by target connector, matching the snapshot contents', () => {
    const snap = validSnapshot();
    writeConnectorCommandSnapshot(snap);
    const grouped = getConnectorCommandsByConnector();
    expect(grouped.size).toBe(1);
    expect(grouped.get('canva')).toHaveLength(2);
    expect(grouped.get('canva')?.map(c => c.id)).toEqual(snap.commands.map(c => c.id));
  });

  it('grouped read returns defensive copies too', () => {
    writeConnectorCommandSnapshot(validSnapshot());
    const grouped = getConnectorCommandsByConnector();
    const bucket = grouped.get('canva');
    if (bucket) bucket[0].note = 'tampered bucket';
    expect(getConnectorCommandSnapshot()?.commands[0].note).not.toContain('tampered');
  });
});

describe('connectorCommandStore — clear / reset', () => {
  it('clearConnectorCommandSnapshot forgets the shared previews', () => {
    writeConnectorCommandSnapshot(validSnapshot());
    clearConnectorCommandSnapshot();
    expect(getConnectorCommandSnapshot()).toBeNull();
    expect(getConnectorCommandsByConnector().size).toBe(0);
  });

  it('resetConnectorCommandStoreForTests restores the pristine empty state', () => {
    writeConnectorCommandSnapshot(validSnapshot());
    resetConnectorCommandStoreForTests();
    expect(getConnectorCommandSnapshot()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T4-14 — validation-on-read + freshness status
// ─────────────────────────────────────────────────────────────────────────────

const NOW_MS = NOW.getTime();
const HOUR_MS = 60 * 60 * 1000;

describe('connectorCommandStore — validated read (T4-14)', () => {
  it('returns the snapshot when it still passes the integrity guard', () => {
    const snap = validSnapshot();
    writeConnectorCommandSnapshot(snap);
    const read = getValidatedConnectorCommandSnapshot();
    expect(read).toEqual(snap);
    const grouped = getValidatedConnectorCommandsByConnector();
    expect(grouped.get('canva')).toHaveLength(2);
  });

  it('returns null / empty Map when nothing was shared', () => {
    expect(getValidatedConnectorCommandSnapshot()).toBeNull();
    expect(getValidatedConnectorCommandsByConnector().size).toBe(0);
  });

  it('validated read returns defensive copies — mutation never leaks back', () => {
    writeConnectorCommandSnapshot(validSnapshot());
    const first = getValidatedConnectorCommandSnapshot();
    first?.commands.pop();
    if (first) first.commands[0].note = 'tampered validated read';
    const second = getValidatedConnectorCommandSnapshot();
    expect(second?.commands).toHaveLength(2);
    expect(second?.commands[0].note).not.toContain('tampered');
  });
});

describe('connectorCommandStore — snapshot status (T4-14)', () => {
  it('empty store reports hasSnapshot false with a reason', () => {
    const status = getConnectorCommandSnapshotStatus(NOW_MS);
    expect(status.hasSnapshot).toBe(false);
    expect(status.isValid).toBe(false);
    expect(status.freshness).toBeNull();
    expect(status.ageLabel).toBeNull();
    expect(status.reason).toMatch(/No read-only preview/);
  });

  it('a valid snapshot under the threshold is fresh with an age label and no reason', () => {
    writeConnectorCommandSnapshot(validSnapshot());
    const status = getConnectorCommandSnapshotStatus(NOW_MS + HOUR_MS);
    expect(status.hasSnapshot).toBe(true);
    expect(status.isValid).toBe(true);
    expect(status.freshness).toBe('fresh');
    expect(status.ageLabel).toBe('1 hour ago');
    expect(status.reason).toBeNull();
  });

  it('over the threshold the status marks a stale preview but stays valid (read-only visible)', () => {
    writeConnectorCommandSnapshot(validSnapshot());
    const status = getConnectorCommandSnapshotStatus(NOW_MS + 25 * HOUR_MS);
    expect(status.isValid).toBe(true);
    expect(status.freshness).toBe('stale');
    expect(status.ageLabel).toBe('1 day ago');
    expect(status.reason).toMatch(/stale/i);
    expect(status.reason).toMatch(/Rebuild from the current approval state/);
    // Stale ≠ withheld: the preview remains readable, only flagged.
    expect(getValidatedConnectorCommandSnapshot()).not.toBeNull();
  });

  it('an unreadable builtAt passes the contract guard but is flagged invalid_timestamp', () => {
    // builtAt is provenance, not part of the T4-12 contract guard — freshness
    // re-validation on read is what catches it.
    const bad = { ...validSnapshot(), builtAt: 'not-a-timestamp' };
    expect(writeConnectorCommandSnapshot(bad).ok).toBe(true);
    const status = getConnectorCommandSnapshotStatus(NOW_MS);
    expect(status.isValid).toBe(true);
    expect(status.freshness).toBe('invalid_timestamp');
    expect(status.ageLabel).toBe('unknown age');
    expect(status.reason).toMatch(/unreadable build timestamp/i);
    expect(status.reason).toMatch(/rebuild from the current approval state/i);
  });

  it('clear resets the status back to the empty state', () => {
    writeConnectorCommandSnapshot(validSnapshot());
    clearConnectorCommandSnapshot();
    const status = getConnectorCommandSnapshotStatus(NOW_MS);
    expect(status.hasSnapshot).toBe(false);
    expect(getValidatedConnectorCommandSnapshot()).toBeNull();
  });

  it('reading status never mutates the stored snapshot', () => {
    const snap = validSnapshot();
    writeConnectorCommandSnapshot(snap);
    getConnectorCommandSnapshotStatus(NOW_MS + 30 * HOUR_MS);
    expect(getConnectorCommandSnapshot()).toEqual(snap);
  });
});

describe('connectorCommandStore — read path re-runs the integrity guard (source guard)', () => {
  it('validated read helpers exist and call validateConnectorCommandSnapshot before surfacing', () => {
    expect(SOURCE).toMatch(/export function getValidatedConnectorCommandSnapshot/);
    expect(SOURCE).toMatch(/export function getValidatedConnectorCommandsByConnector/);
    expect(SOURCE).toMatch(/export function getConnectorCommandSnapshotStatus/);
    // The validator runs on write AND on both read paths (≥ 3 call sites).
    const calls = SOURCE.match(/validateConnectorCommandSnapshot\(/g) ?? [];
    expect(calls.length).toBeGreaterThanOrEqual(3);
    // Invalid data is withheld, never repaired.
    expect(SOURCE).toMatch(/never silently repaired|never repaired, only withheld/);
  });
});

describe('connectorCommandStore — source guard (in-memory, plain data, React-free)', () => {
  it('has no persistence, network, or React primitive', () => {
    expect(SOURCE).not.toMatch(/localStorage|sessionStorage|indexedDB|BroadcastChannel/i);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|https?:\/\/|OAuth|webhook/i);
    expect(SOURCE).not.toMatch(/from 'react'|useState|useEffect|useReducer|createContext/);
  });

  it('has no execution / posting / ads wording anywhere in the module', () => {
    expect(SOURCE).not.toMatch(/execute|publish now|auto-post|auto-ads|run ads|live post|\bpost\b/i);
  });
});
