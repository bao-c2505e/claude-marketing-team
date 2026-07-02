// ConnectorDetailPanel.test.ts — T4-9
// Repo has no DOM test stack (no jsdom / @testing-library), so this mirrors the
// existing T4-8 style: pure-logic unit tests + source-scan (?raw) guards.

import { describe, it, expect } from 'vitest';

import PANEL from './ConnectorDetailPanel.tsx?raw';
import { getPanelActionKind, META_SANDBOX_INFO } from './ConnectorDetailPanel';
import { routeCommandsToItems } from './useConnectorDashboard';
import { buildConnectorCommandForItem, type ConnectorCommand } from '../../lib/core/connectors/connectorCommand';
import type { GovernedConnectorKey } from '../../lib/core/connectors/connectorGovernance';
import type { LocalConnectorRegistryItem, LocalConnectorType } from '../../types/core';
import type { ConnectorDashboardItem } from './connectorDashboard.types';

// ─────────────────────────────────────────────────────────────────────────────
// PURE UNIT: getPanelActionKind (action branch per connector type)
// ─────────────────────────────────────────────────────────────────────────────

describe('getPanelActionKind', () => {
  it('n8n → recheck', () => {
    expect(getPanelActionKind('n8n')).toBe('recheck');
  });
  it('google_drive → recheck', () => {
    expect(getPanelActionKind('google_drive')).toBe('recheck');
  });
  it('meta_ads → sandbox', () => {
    expect(getPanelActionKind('meta_ads')).toBe('sandbox');
  });
  it('canva → simulate', () => {
    expect(getPanelActionKind('canva')).toBe('simulate');
  });
  it('openai → simulate', () => {
    expect(getPanelActionKind('openai')).toBe('simulate');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PURE UNIT: META_SANDBOX_INFO (public identifiers only, no secrets)
// ─────────────────────────────────────────────────────────────────────────────

describe('META_SANDBOX_INFO', () => {
  it('exposes public App ID', () => {
    expect(META_SANDBOX_INFO.appId).toBe('1352130343722707');
  });
  it('exposes public ad account id', () => {
    expect(META_SANDBOX_INFO.adAccountId).toBe('act_1863911107274773');
  });
  it('currency is VND', () => {
    expect(META_SANDBOX_INFO.currency).toBe('VND');
  });
  it('timezone is Asia/Ho_Chi_Minh', () => {
    expect(META_SANDBOX_INFO.timezone).toBe('Asia/Ho_Chi_Minh');
  });
  it('contains no token/secret fields', () => {
    const keys = Object.keys(META_SANDBOX_INFO).join(' ').toLowerCase();
    expect(keys).not.toMatch(/token|secret|key|password/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE SCAN: ConnectorDetailPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────

describe('ConnectorDetailPanel — source guard', () => {
  it('renders data-testid="connector-detail-panel"', () => {
    expect(PANEL).toContain('data-testid="connector-detail-panel"');
  });
  it('slides via translateX (translate-x-full equivalent)', () => {
    expect(PANEL).toContain('translateX(100%)');
    expect(PANEL).toContain('translateX(0)');
  });
  it('open state is driven by item !== null', () => {
    expect(PANEL).toMatch(/item\s*!==\s*null/);
  });
  it('renders connector name in a titled header', () => {
    expect(PANEL).toContain('id="panel-title"');
    expect(PANEL).toContain('{item.name}');
  });
  it('renders connector_type', () => {
    expect(PANEL).toContain('{item.connector_type}');
  });
  it('renders StatusBadge and ModeBadge', () => {
    expect(PANEL).toContain('StatusBadge');
    expect(PANEL).toContain('ModeBadge');
  });
  it('env-keys-list maps required_env_keys (names only)', () => {
    expect(PANEL).toContain('data-testid="env-keys-list"');
    expect(PANEL).toMatch(/item\.required_env_keys\.map/);
  });
  it('does not render ENV values or read process.env', () => {
    expect(PANEL).not.toMatch(/process\.env/);
  });
  it('safety-note-panel is conditional on item.safety_note', () => {
    expect(PANEL).toContain('data-testid="safety-note-panel"');
    expect(PANEL).toMatch(/item\.safety_note\s*&&/);
  });
  it('mode-display shows Owner-approval note and is read-only (no input/select)', () => {
    expect(PANEL).toContain('data-testid="mode-display"');
    expect(PANEL).toContain('changes require Owner approval');
    expect(PANEL).not.toMatch(/<input|<select/);
  });
  it('empty health log shows "No health checks recorded yet"', () => {
    expect(PANEL).toContain('No health checks recorded yet');
  });
  it('reuses ConnectorHealthLog with the log prop', () => {
    expect(PANEL).toMatch(/<ConnectorHealthLog\s+log=\{healthLog\}/);
  });
  it('X button has aria-label="Close panel" and calls onClose', () => {
    expect(PANEL).toContain('aria-label="Close panel"');
    expect(PANEL).toContain('onClick={onClose}');
  });
  it('backdrop click calls onClose', () => {
    expect(PANEL).toContain('data-testid="detail-panel-backdrop"');
  });
  it('drawer stops click propagation (inside does not close)', () => {
    expect(PANEL).toMatch(/onClick=\{e\s*=>\s*e\.stopPropagation\(\)\}/);
  });
  it('ESC key handler calls onClose', () => {
    expect(PANEL).toContain("e.key === 'Escape'");
    expect(PANEL).toContain("addEventListener('keydown'");
  });
  it('focuses the close button on open', () => {
    expect(PANEL).toContain('closeBtnRef');
    expect(PANEL).toMatch(/closeBtnRef\.current\?\.focus\(\)/);
  });
  it('has a11y dialog attributes', () => {
    expect(PANEL).toContain('role="dialog"');
    expect(PANEL).toContain('aria-modal="true"');
    expect(PANEL).toContain('aria-labelledby="panel-title"');
  });
  it('action button testid + disabled when isChecking', () => {
    expect(PANEL).toContain('data-testid="panel-action-btn"');
    expect(PANEL).toContain('disabled={isChecking}');
  });
  it('action labels cover recheck / sandbox / simulate', () => {
    expect(PANEL).toContain('Re-check Health');
    expect(PANEL).toContain('View Sandbox Config');
    expect(PANEL).toContain('Simulate Check');
  });
  it('recheck/simulate route through onCheck(item.id), not a direct API call', () => {
    expect(PANEL).toContain('onCheck(item.id)');
  });
  it('sandbox action reveals only public META_SANDBOX_INFO', () => {
    expect(PANEL).toContain('data-testid="sandbox-config-block"');
    expect(PANEL).toContain('META_SANDBOX_INFO.appId');
    expect(PANEL).not.toContain('META_ACCESS_TOKEN');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T4-10-C: approved-assets projection (source guard + pure routing unit tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('ConnectorDetailPanel — approved assets projection (T4-10-C)', () => {
  it('renders the "Approved assets targeting this connector" section with empty state', () => {
    expect(PANEL).toContain('Approved assets targeting this connector');
    expect(PANEL).toContain('No approved assets targeting this connector yet.');
    expect(PANEL).toContain('data-testid="approved-assets-section"');
  });

  it('carries the "does not publish or emit anything" copy', () => {
    expect(PANEL).toContain('This does not publish or emit anything.');
  });

  it('accepts the optional read-only commands prop', () => {
    expect(PANEL).toMatch(/commands\?:\s*ConnectorCommand\[\]/);
    expect(PANEL).toMatch(/commands\s*=\s*\[\]/);
  });

  it('has no network / emit / publish capability beyond the negation copy', () => {
    // Strip the one allowed negation sentence, then nothing publish/emit/network
    // shaped may remain anywhere in the panel source.
    const scrubbed = PANEL.replace('This does not publish or emit anything.', '');
    expect(scrubbed).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|https?:\/\/|OAuth|webhook|\bemit\b|send command|publish/i);
  });
});

describe('routeCommandsToItems (useConnectorDashboard, T4-10-C)', () => {
  function dashItem(connector_type: LocalConnectorType, id: string): ConnectorDashboardItem {
    return {
      connector: {
        id, name: id, connector_type, status: 'configured', mode: 'mock', description: '',
        required_env_keys: [], last_checked_at: null, health_note: null, safety_note: null,
        created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-01T00:00:00.000Z',
      } as LocalConnectorRegistryItem,
      isChecking: false,
      healthLog: [],
    };
  }

  function cmdFor(target: GovernedConnectorKey): ConnectorCommand {
    return buildConnectorCommandForItem('camp-1', {
      approvalId: 'appr-1', contentItemId: 'item-1', title: 'Ngày 1 — Món signature',
      module: 'content', moduleLabel: 'Content Factory', deliveryStatus: 'not_delivered',
      provenance: { actorLabel: 'Owner', at: '2026-07-01T09:00:00.000Z' },
    }, target, { now: new Date('2026-07-02T10:00:00.000Z') });
  }

  it('routes commands to the matching item, including the meta → meta_ads type mapping', () => {
    const items = [dashItem('meta_ads', 'conn-meta'), dashItem('canva', 'conn-canva'), dashItem('n8n', 'conn-n8n')];
    const map = new Map<GovernedConnectorKey, ConnectorCommand[]>([
      ['meta', [cmdFor('meta')]],
      ['canva', [cmdFor('canva'), cmdFor('canva')]],
    ]);
    const routed = routeCommandsToItems(items, map);
    expect(routed[0].commands).toHaveLength(1);
    expect(routed[0].commands?.[0].targetConnector).toBe('meta');
    expect(routed[1].commands).toHaveLength(2);
    expect(routed[2].commands).toBeUndefined();
  });

  it('leaves items untouched when no map is passed — commands stays undefined', () => {
    const items = [dashItem('canva', 'conn-canva')];
    const routed = routeCommandsToItems(items);
    expect(routed).toBe(items);
    expect(routed[0].commands).toBeUndefined();
  });

  it('never routes commands to a non-governed connector type', () => {
    const items = [dashItem('anthropic', 'conn-anthropic')];
    const map = new Map<GovernedConnectorKey, ConnectorCommand[]>([['meta', [cmdFor('meta')]]]);
    const routed = routeCommandsToItems(items, map);
    expect(routed[0].commands).toBeUndefined();
  });
});
