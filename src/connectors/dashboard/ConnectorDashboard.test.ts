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
import READONLY_HEALTH from './ReadOnlyHealthSection.tsx?raw';
import READONLY_PREVIEW from './ReadOnlyPreviewSection.tsx?raw';

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
  it('T4-18: routes per-card live checks through the T4-15 read-only health registry', () => {
    expect(HOOK).toMatch(/import \{ checkReadOnlyConnectorHealth \} from '\.\.\/\.\.\/lib\/core\/connectors\/readOnlyConnectorHealthRegistry'/);
    expect(HOOK).toMatch(/checkReadOnlyConnectorHealth\(connectorId\)/);
  });
  it('T4-18: no direct n8n/gdrive wrapper calls remain in the dashboard hook', () => {
    expect(HOOK).not.toMatch(/n8nLiveService|gdriveLiveService|checkN8nHealth|checkGdriveHealth/);
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
  it('derives per-card health from the normalized result status — one mapping only', () => {
    expect(HOOK).toMatch(/result\.status === 'available'/);
    expect(HOOK).toMatch(/note: result\.message/);
    expect(HOOK).toMatch(/checked_at: result\.checkedAt/);
    // The old duplicate wrapper mapping is gone.
    expect(HOOK).not.toMatch(/raw\.healthy/);
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
  it('handleCheck uses isLiveCheckSupported as the single live/simulate boundary', () => {
    expect(HOOK).toMatch(/isLiveCheckSupported\(connector_type\)/);
    expect(HOOK).toMatch(/runRegistryHealthCheck\(id, connector_type\)/);
    // No per-connector dispatch duplication remains.
    expect(HOOK).not.toMatch(/connector_type\s*===\s*['"]n8n['"]/);
    expect(HOOK).not.toMatch(/connector_type\s*===\s*['"]google_drive['"]/);
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

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ReadOnlyHealthSection.tsx — read-only health checks (T4-15)
// ─────────────────────────────────────────────────────────────────────────────

describe('ReadOnlyHealthSection — read-only connector health (T4-15)', () => {
  it('dashboard renders the section', () => {
    expect(DASHBOARD).toContain('ReadOnlyHealthSection');
    expect(DASHBOARD).toMatch(/<ReadOnlyHealthSection \/>/);
  });

  it('offers the explicit Owner button "Check read-only connector health"', () => {
    expect(READONLY_HEALTH).toContain('Check read-only connector health');
    expect(READONLY_HEALTH).toContain('data-testid="check-readonly-health-btn"');
    expect(READONLY_HEALTH).toMatch(/onClick=\{handleCheck\}/);
    expect(READONLY_HEALTH).toContain('disabled={isChecking}');
  });

  it('never auto-runs — no effects, no timers, no polling, no subscription', () => {
    expect(READONLY_HEALTH).not.toMatch(/useEffect|setInterval|setTimeout|subscribe/);
  });

  it('calls only the read-only registry — no direct network, storage, or command store access', () => {
    expect(READONLY_HEALTH).toContain('checkAllReadOnlyConnectorHealth');
    expect(READONLY_HEALTH).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|https?:\/\/|webhook/i);
    expect(READONLY_HEALTH).not.toMatch(/localStorage|sessionStorage|indexedDB|BroadcastChannel/i);
    expect(READONLY_HEALTH).not.toMatch(/connectorCommandStore|ConnectorCommand\b/);
  });

  it('renders the normalized result fields including hard-false capabilities', () => {
    expect(READONLY_HEALTH).toContain('result.status');
    expect(READONLY_HEALTH).toContain('result.mode');
    expect(READONLY_HEALTH).toContain('result.checkedAt');
    expect(READONLY_HEALTH).toContain('result.safetyNote');
    expect(READONLY_HEALTH).toContain("write: no · publishing: no · ad spend: no");
  });

  it('has no execution or publishing-action wording', () => {
    expect(READONLY_HEALTH).not.toMatch(/execute|publish now|auto-post|auto-ads|run ads|go live|upload|send to n8n|write to drive/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ReadOnlyPreviewSection.tsx — read-only previews (T4-16)
// ─────────────────────────────────────────────────────────────────────────────

describe('ReadOnlyPreviewSection — read-only connector previews (T4-16)', () => {
  it('dashboard renders the section alongside the intact T4-15 health section', () => {
    expect(DASHBOARD).toContain('ReadOnlyPreviewSection');
    expect(DASHBOARD).toMatch(/<ReadOnlyPreviewSection \/>/);
    // T4-15 health section is still rendered.
    expect(DASHBOARD).toMatch(/<ReadOnlyHealthSection \/>/);
    // T4-13/T4-14 snapshot preview/freshness/clear surface is still intact.
    expect(DASHBOARD).toMatch(/getValidatedConnectorCommandSnapshot/);
    expect(DASHBOARD).toMatch(/clearConnectorCommandSnapshot\(\)/);
    expect(DASHBOARD).toMatch(/command-snapshot-stale-warning/);
  });

  it('offers the explicit Owner button "Check read-only connector previews"', () => {
    expect(READONLY_PREVIEW).toContain('Check read-only connector previews');
    expect(READONLY_PREVIEW).toContain('data-testid="check-readonly-previews-btn"');
    expect(READONLY_PREVIEW).toMatch(/onClick=\{handleCheck\}/);
    expect(READONLY_PREVIEW).toContain('disabled={isChecking}');
  });

  it('never auto-runs — no effects, no timers, no polling, no subscription', () => {
    expect(READONLY_PREVIEW).not.toMatch(/useEffect|setInterval|setTimeout|subscribe/);
  });

  it('calls only the read-only preview registry — no direct network, storage, or command store access', () => {
    expect(READONLY_PREVIEW).toContain('checkAllReadOnlyConnectorPreviews');
    expect(READONLY_PREVIEW).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|https?:\/\/|webhook/i);
    expect(READONLY_PREVIEW).not.toMatch(/localStorage|sessionStorage|indexedDB|BroadcastChannel/i);
    expect(READONLY_PREVIEW).not.toMatch(/connectorCommandStore|ConnectorCommand\b/);
  });

  it('renders the normalized result fields and sanitized item summaries only', () => {
    expect(READONLY_PREVIEW).toContain('result.previewType');
    expect(READONLY_PREVIEW).toContain('result.mode');
    expect(READONLY_PREVIEW).toContain('result.items.length');
    expect(READONLY_PREVIEW).toContain('result.message');
    expect(READONLY_PREVIEW).toContain('result.safetyNote');
    expect(READONLY_PREVIEW).toContain('item.name');
    expect(READONLY_PREVIEW).toContain('item.summary');
    // Explicit read-only wording required by T4-16.
    expect(READONLY_PREVIEW).toContain('read-only');
    expect(READONLY_PREVIEW).toContain('no write');
    expect(READONLY_PREVIEW).toContain('no publishing');
    expect(READONLY_PREVIEW).toContain('no ads spend');
    expect(READONLY_PREVIEW).toContain('no execution');
  });

  it('has no action wording that implies running, publishing, or uploading', () => {
    expect(READONLY_PREVIEW).not.toMatch(/publish now|auto-post|auto-ads|run ads|go live|upload|send to n8n|write to drive|run workflow|trigger workflow/i);
    // "execution" only ever appears inside negation copy ("no execution").
    expect(READONLY_PREVIEW).not.toMatch(/(?<!no )execution/);
    expect(READONLY_PREVIEW).not.toMatch(/\bexecute\b/i);
  });
});
