// ConnectorDetailPanel.test.ts — T4-9
// Repo has no DOM test stack (no jsdom / @testing-library), so this mirrors the
// existing T4-8 style: pure-logic unit tests + source-scan (?raw) guards.

import { describe, it, expect } from 'vitest';

import PANEL from './ConnectorDetailPanel.tsx?raw';
import { getPanelActionKind, META_SANDBOX_INFO } from './ConnectorDetailPanel';

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
