// ConnectorDashboard.test.ts — T4-8
// Two categories:
//   1. Source-scan guards (no DOM) — verify structure/safety via ?raw imports
//   2. Pure unit tests — isLiveCheckSupported, computeSummary, appendLog

import { describe, it, expect } from 'vitest';

// ── Source imports ─────────────────────────────────────────────────────────────
import HOOK from './useConnectorDashboard.ts?raw';
import TYPES from './connectorDashboard.types.ts?raw';
import DASHBOARD from './ConnectorDashboard.tsx?raw';
import CARD from './ConnectorCard.tsx?raw';
import SUMMARY_BAR from './ConnectorSummaryBar.tsx?raw';
import HEALTH_LOG from './ConnectorHealthLog.tsx?raw';

// ── Pure logic imports ─────────────────────────────────────────────────────────
import { isLiveCheckSupported } from './connectorDashboard.types';
import { computeSummary, appendLog, MAX_LOG } from './useConnectorDashboard';
import type { ConnectorDashboardItem, HealthCheckEntry } from './connectorDashboard.types';
import type { LocalConnectorRegistryItem } from '../../types/core';

// ─────────────────────────────────────────────────────────────────────────────
// PURE UNIT: isLiveCheckSupported
// ─────────────────────────────────────────────────────────────────────────────

describe('isLiveCheckSupported', () => {
  it('returns true for n8n', () => {
    expect(isLiveCheckSupported('n8n')).toBe(true);
  });
  it('returns true for google_drive', () => {
    expect(isLiveCheckSupported('google_drive')).toBe(true);
  });
  it('returns false for anthropic', () => {
    expect(isLiveCheckSupported('anthropic')).toBe(false);
  });
  it('returns false for canva', () => {
    expect(isLiveCheckSupported('canva')).toBe(false);
  });
  it('returns false for openai', () => {
    expect(isLiveCheckSupported('openai')).toBe(false);
  });
  it('returns false for google_sheets', () => {
    expect(isLiveCheckSupported('google_sheets')).toBe(false);
  });
  it('returns false for comfyui', () => {
    expect(isLiveCheckSupported('comfyui')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PURE UNIT: appendLog cap
// ─────────────────────────────────────────────────────────────────────────────

function makeEntry(i: number): HealthCheckEntry {
  return {
    checked_at: new Date(i).toISOString(),
    status: 'simulated',
    latency_ms: null,
    note: `entry ${i}`,
  };
}

describe('appendLog — cap at MAX_LOG', () => {
  it('MAX_LOG is 5', () => {
    expect(MAX_LOG).toBe(5);
  });
  it('prepends newest entry first', () => {
    const log = appendLog([], makeEntry(1));
    expect(log[0].note).toBe('entry 1');
  });
  it('caps at 5 after 7 calls', () => {
    let log: HealthCheckEntry[] = [];
    for (let i = 0; i < 7; i++) log = appendLog(log, makeEntry(i));
    expect(log).toHaveLength(5);
  });
  it('never exceeds MAX_LOG', () => {
    let log: HealthCheckEntry[] = [];
    for (let i = 0; i < 20; i++) log = appendLog(log, makeEntry(i));
    expect(log.length).toBeLessThanOrEqual(MAX_LOG);
  });
  it('newest entry is always at index 0', () => {
    let log: HealthCheckEntry[] = [];
    for (let i = 0; i < 6; i++) log = appendLog(log, makeEntry(i));
    expect(log[0].note).toBe('entry 5');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PURE UNIT: computeSummary
// ─────────────────────────────────────────────────────────────────────────────

function makeItem(status: LocalConnectorRegistryItem['status']): ConnectorDashboardItem {
  return {
    connector: {
      id: `id-${status}-${Math.random()}`,
      name: status,
      connector_type: 'other',
      status,
      mode: 'mock',
      description: null,
      required_env_keys: [],
      last_checked_at: null,
      health_note: null,
      safety_note: null,
      created_at: '',
      updated_at: '',
    },
    isChecking: false,
    healthLog: [],
  };
}

describe('computeSummary', () => {
  it('total equals items.length', () => {
    const items = [makeItem('connected'), makeItem('error'), makeItem('not_configured')];
    expect(computeSummary(items).total).toBe(3);
  });
  it('counts connected correctly', () => {
    const items = [makeItem('connected'), makeItem('connected'), makeItem('error')];
    expect(computeSummary(items).connected).toBe(2);
  });
  it('counts error correctly', () => {
    const items = [makeItem('error'), makeItem('not_configured')];
    expect(computeSummary(items).error).toBe(1);
  });
  it('counts not_configured correctly', () => {
    const items = [makeItem('not_configured'), makeItem('not_configured'), makeItem('not_configured')];
    expect(computeSummary(items).not_configured).toBe(3);
  });
  it('returns zeros for empty list', () => {
    const s = computeSummary([]);
    expect(s.total).toBe(0);
    expect(s.connected).toBe(0);
    expect(s.error).toBe(0);
    expect(s.not_configured).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: useConnectorDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('useConnectorDashboard — source guard', () => {
  it('imports checkN8nHealth from n8nLiveService', () => {
    expect(HOOK).toMatch(/import.*checkN8nHealth.*from.*n8nLiveService/);
  });
  it('imports checkGdriveHealth from gdriveLiveService', () => {
    expect(HOOK).toMatch(/import.*checkGdriveHealth.*from.*gdriveLiveService/);
  });
  it('MOCK_REGISTRY has exactly 9 entries (9 id strings)', () => {
    const matches = HOOK.match(/id:\s*['"]conn-/g);
    expect(matches).toHaveLength(9);
  });
  it('exports MAX_LOG = 5', () => {
    expect(HOOK).toMatch(/MAX_LOG\s*=\s*5/);
  });
  it('exports computeSummary', () => {
    expect(HOOK).toContain('export function computeSummary');
  });
  it('exports appendLog', () => {
    expect(HOOK).toContain('export function appendLog');
  });
  it('adapts raw.healthy to entry status for n8n', () => {
    expect(HOOK).toMatch(/raw\.healthy/);
  });
  it('simulate sets status to simulated', () => {
    expect(HOOK).toContain("status: 'simulated'");
  });
  it('simulate note contains "Mock simulate"', () => {
    expect(HOOK).toContain('Mock simulate');
  });
  it('simulate latency_ms is null', () => {
    expect(HOOK).toContain('latency_ms: null');
  });
  it('handleCheck dispatches n8n to checkN8n', () => {
    expect(HOOK).toMatch(/connector_type.*===.*['"]n8n['"]/);
  });
  it('handleCheck dispatches google_drive to checkGDrive', () => {
    expect(HOOK).toMatch(/connector_type.*===.*['"]google_drive['"]/);
  });
  it('does not set allow_write to true', () => {
    expect(HOOK).not.toMatch(/allow_write\s*:\s*true/);
  });
  it('does not set allow_publish to true', () => {
    expect(HOOK).not.toMatch(/allow_publish\s*:\s*true/);
  });
  it('does not set allow_spend to true', () => {
    expect(HOOK).not.toMatch(/allow_spend\s*:\s*true/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: connectorDashboard.types.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('connectorDashboard.types — source guard', () => {
  it('exports isLiveCheckSupported', () => {
    expect(TYPES).toContain('export function isLiveCheckSupported');
  });
  it('HealthCheckEntry has status field', () => {
    expect(TYPES).toContain('status:');
  });
  it('HealthCheckEntry has latency_ms field', () => {
    expect(TYPES).toContain('latency_ms');
  });
  it('ConnectorSummary has not_configured field', () => {
    expect(TYPES).toContain('not_configured');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ConnectorDashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────

describe('ConnectorDashboard — source guard', () => {
  it('renders data-testid="connector-dashboard"', () => {
    expect(DASHBOARD).toContain('data-testid="connector-dashboard"');
  });
  it('uses ConnectorSummaryBar', () => {
    expect(DASHBOARD).toContain('ConnectorSummaryBar');
  });
  it('uses ConnectorCard', () => {
    expect(DASHBOARD).toContain('ConnectorCard');
  });
  it('uses useConnectorDashboard hook', () => {
    expect(DASHBOARD).toContain('useConnectorDashboard');
  });
  it('renders heading "Connector Dashboard"', () => {
    expect(DASHBOARD).toContain('Connector Dashboard');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ConnectorCard.tsx
// ─────────────────────────────────────────────────────────────────────────────

describe('ConnectorCard — source guard', () => {
  it('has data-testid="connector-card-{id}"', () => {
    expect(CARD).toMatch(/data-testid=\{`connector-card-\$\{connector\.id\}`\}/);
  });
  it('has check-btn data-testid', () => {
    expect(CARD).toMatch(/data-testid=\{`check-btn-\$\{connector\.id\}`\}/);
  });
  it('shows "⚡ Check Health" for live connectors', () => {
    expect(CARD).toContain('⚡ Check Health');
  });
  it('shows "🔲 Simulate" for non-live connectors', () => {
    expect(CARD).toContain('🔲 Simulate');
  });
  it('shows "Checking…" when isChecking', () => {
    expect(CARD).toContain('Checking…');
  });
  it('button is disabled when isChecking', () => {
    expect(CARD).toContain('disabled={isChecking}');
  });
  it('renders safety_note', () => {
    expect(CARD).toContain('connector.safety_note');
  });
  it('renders last_checked_at', () => {
    expect(CARD).toContain('connector.last_checked_at');
  });
  it('uses isLiveCheckSupported', () => {
    expect(CARD).toContain('isLiveCheckSupported');
  });
  it('uses ConnectorHealthLog', () => {
    expect(CARD).toContain('ConnectorHealthLog');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ConnectorSummaryBar.tsx
// ─────────────────────────────────────────────────────────────────────────────

describe('ConnectorSummaryBar — source guard', () => {
  it('has data-testid="connector-summary-bar"', () => {
    expect(SUMMARY_BAR).toContain('data-testid="connector-summary-bar"');
  });
  it('renders Total label', () => {
    expect(SUMMARY_BAR).toContain('Total');
  });
  it('renders Connected label', () => {
    expect(SUMMARY_BAR).toContain('Connected');
  });
  it('renders Error label', () => {
    expect(SUMMARY_BAR).toContain('Error');
  });
  it('renders Not Configured label', () => {
    expect(SUMMARY_BAR).toContain('Not Configured');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ConnectorHealthLog.tsx
// ─────────────────────────────────────────────────────────────────────────────

describe('ConnectorHealthLog — source guard', () => {
  it('has data-testid="health-log-list"', () => {
    expect(HEALTH_LOG).toContain('data-testid="health-log-list"');
  });
  it('shows "No checks yet" when empty', () => {
    expect(HEALTH_LOG).toContain('No checks yet');
  });
  it('renders latency_ms when not null', () => {
    expect(HEALTH_LOG).toContain('latency_ms');
  });
  it('renders entry.note', () => {
    expect(HEALTH_LOG).toContain('entry.note');
  });
  it('uses StatusDot', () => {
    expect(HEALTH_LOG).toContain('StatusDot');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ConnectorDashboard.tsx — read-only command previews (T4-13)
// ─────────────────────────────────────────────────────────────────────────────

describe('ConnectorDashboard — read-only command previews (T4-13/T4-14)', () => {
  it('reads the shared snapshot from the in-memory store once on mount, via the VALIDATED read path', () => {
    expect(DASHBOARD).toMatch(/getValidatedConnectorCommandSnapshot/);
    expect(DASHBOARD).toMatch(/useState\(\(\) => getValidatedConnectorCommandSnapshot\(\)\)/);
    expect(DASHBOARD).toMatch(/useState\(\(\) => getConnectorCommandSnapshotStatus\(\)\)/);
    // Never the raw, unvalidated snapshot read.
    expect(DASHBOARD).not.toMatch(/getConnectorCommandSnapshot\(\)/);
    // No polling / subscription / effects — a single read on mount.
    expect(DASHBOARD).not.toMatch(/useEffect|setInterval|setTimeout|subscribe/);
  });

  it('feeds grouped commands into the existing dashboard read surface', () => {
    expect(DASHBOARD).toMatch(/groupCommandsByConnector/);
    expect(DASHBOARD).toMatch(/useConnectorDashboard\(commandsByConnector\)/);
    expect(DASHBOARD).toMatch(/commands=\{selected\?\.commands \?\? \[\]\}/);
  });

  it('shows read-only provenance and keeps the empty-store path unchanged', () => {
    expect(DASHBOARD).toMatch(/Read-only previews shared by/);
    expect(DASHBOARD).toMatch(/command-snapshot-provenance/);
    expect(DASHBOARD).toMatch(/snapshot \? groupCommandsByConnector\(snapshot\.commands\) : undefined/);
    // No execution wording anywhere in the dashboard shell.
    expect(DASHBOARD).not.toMatch(/execute|publish now|auto-post|auto-ads|run ads|go live/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ConnectorDashboard.tsx — snapshot freshness + clear preview (T4-14)
// ─────────────────────────────────────────────────────────────────────────────

describe('ConnectorDashboard — snapshot freshness + clear preview (T4-14)', () => {
  it('renders the freshness/age metadata next to the provenance line', () => {
    expect(DASHBOARD).toMatch(/snapshotStatus\.ageLabel/);
    expect(DASHBOARD).toMatch(/snapshotStatus\.freshness/);
    expect(DASHBOARD).toMatch(/stale preview/);
  });

  it('surfaces the stale warning wording from the store status', () => {
    expect(DASHBOARD).toMatch(/command-snapshot-stale-warning/);
    expect(DASHBOARD).toMatch(/snapshotStatus\.reason/);
  });

  it('offers "Clear read-only preview" and clears only the command preview store', () => {
    expect(DASHBOARD).toMatch(/Clear read-only preview/);
    expect(DASHBOARD).toMatch(/clear-command-preview-btn/);
    expect(DASHBOARD).toMatch(/clearConnectorCommandSnapshot\(\)/);
    // Clear never reaches approvals / evidence / Brand Brain / campaign data.
    expect(DASHBOARD).not.toMatch(/approvalRequests|publishingEvidence|brandBrain|setCampaign|coreData/i);
  });

  it('withholds a snapshot that failed re-validation instead of rendering it', () => {
    expect(DASHBOARD).toMatch(/command-snapshot-withheld/);
    expect(DASHBOARD).toMatch(/rebuild from the current approval state/i);
  });

  it('still brings in no storage or network capability', () => {
    expect(DASHBOARD).not.toMatch(/localStorage|sessionStorage|indexedDB|BroadcastChannel/i);
    expect(DASHBOARD).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|https?:\/\/|webhook/i);
  });
});
