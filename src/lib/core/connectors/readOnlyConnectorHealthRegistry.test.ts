// readOnlyConnectorHealthRegistry.test.ts — T4-15
// All checks run against INJECTED fakes — no network is ever touched here.

import { describe, it, expect } from 'vitest';
import REGISTRY from './readOnlyConnectorHealthRegistry.ts?raw';
import {
  getReadOnlyConnectorHealthDescriptors,
  checkReadOnlyConnectorHealth,
  checkAllReadOnlyConnectorHealth,
  type ReadOnlyConnectorHealthCheckDeps,
} from './readOnlyConnectorHealthRegistry';
import {
  assertReadOnlyConnectorHealthResult,
  type ReadOnlyConnectorId,
} from './readOnlyConnectorHealth';

const NOW_ISO = '2026-07-03T00:00:00.000Z';

function deps(overrides?: Partial<ReadOnlyConnectorHealthCheckDeps>): ReadOnlyConnectorHealthCheckDeps {
  return {
    checkN8nHealth: async () => ({ healthy: true, note: 'n8n reachable via Edge Function' }),
    checkGdriveHealth: async () => ({ healthy: true, note: 'gdrive-read reachable' }),
    nowIso: () => NOW_ISO,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Descriptors
// ─────────────────────────────────────────────────────────────────────────────

describe('getReadOnlyConnectorHealthDescriptors', () => {
  it('lists exactly n8n, google_drive, canva', () => {
    expect(getReadOnlyConnectorHealthDescriptors().map(d => d.connectorId)).toEqual([
      'n8n',
      'google_drive',
      'canva',
    ]);
  });

  it('every descriptor is read-only, non-writing, non-publishing, Owner-click-gated', () => {
    for (const d of getReadOnlyConnectorHealthDescriptors()) {
      expect(d.readOnly).toBe(true);
      expect(d.writesExternalSystems).toBe(false);
      expect(d.publishesExternalSystems).toBe(false);
      expect(d.requiresOwnerClick).toBe(true);
    }
  });

  it('returns defensive copies — mutating a copy never leaks back', () => {
    const first = getReadOnlyConnectorHealthDescriptors();
    (first[0] as { label: string }).label = 'tampered';
    expect(getReadOnlyConnectorHealthDescriptors()[0].label).not.toBe('tampered');
  });

  it('n8n and google_drive use edge_read_proxy; canva is manual_only', () => {
    const byId = new Map(getReadOnlyConnectorHealthDescriptors().map(d => [d.connectorId, d]));
    expect(byId.get('n8n')?.mode).toBe('edge_read_proxy');
    expect(byId.get('google_drive')?.mode).toBe('edge_read_proxy');
    expect(byId.get('canva')?.mode).toBe('manual_only');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Injected check mapping
// ─────────────────────────────────────────────────────────────────────────────

describe('checkReadOnlyConnectorHealth — injected fakes', () => {
  it('healthy n8n wrapper maps to available + canRead', async () => {
    const r = await checkReadOnlyConnectorHealth('n8n', deps());
    expect(r.status).toBe('available');
    expect(r.canRead).toBe(true);
    expect(r.checkedAt).toBe(NOW_ISO);
    expect(r.message).toContain('reachable');
    expect(r.source).toContain('checkN8nHealth');
  });

  it('unhealthy wrapper maps to degraded with the wrapper note', async () => {
    const r = await checkReadOnlyConnectorHealth(
      'google_drive',
      deps({ checkGdriveHealth: async () => ({ healthy: false, note: 'Supabase not configured' }) }),
    );
    expect(r.status).toBe('degraded');
    expect(r.canRead).toBe(false);
    expect(r.message).toBe('Supabase not configured');
  });

  it('a throwing wrapper is normalized to degraded — never rethrown', async () => {
    const r = await checkReadOnlyConnectorHealth(
      'n8n',
      deps({ checkN8nHealth: async () => { throw new Error('network down'); } }),
    );
    expect(r.status).toBe('degraded');
    expect(r.message).toBe('network down');
    expect(r.errorCode).toBe('health_check_threw');
  });

  it('canva is always blocked/manual_only and calls NO injected function', async () => {
    let called = 0;
    const r = await checkReadOnlyConnectorHealth(
      'canva',
      deps({
        checkN8nHealth: async () => { called++; return { healthy: true, note: '' }; },
        checkGdriveHealth: async () => { called++; return { healthy: true, note: '' }; },
      }),
    );
    expect(r.status).toBe('blocked');
    expect(r.mode).toBe('manual_only');
    expect(r.errorCode).toBe('no_read_surface');
    expect(called).toBe(0);
  });

  it('rejects unknown connector ids', async () => {
    await expect(
      checkReadOnlyConnectorHealth('meta' as unknown as ReadOnlyConnectorId, deps()),
    ).rejects.toThrow(/Unknown read-only connector id/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkAll
// ─────────────────────────────────────────────────────────────────────────────

describe('checkAllReadOnlyConnectorHealth', () => {
  it('returns one result per descriptor, all hard-false and assertion-clean', async () => {
    const results = await checkAllReadOnlyConnectorHealth(deps());
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.canWrite).toBe(false);
      expect(r.canPublish).toBe(false);
      expect(r.canRunAds).toBe(false);
      expect(() => assertReadOnlyConnectorHealthResult(r)).not.toThrow();
    }
  });

  it('one failing connector never breaks the others', async () => {
    const results = await checkAllReadOnlyConnectorHealth(
      deps({ checkN8nHealth: async () => { throw new Error('down'); } }),
    );
    const byId = new Map(results.map(r => [r.connectorId, r]));
    expect(byId.get('n8n')?.status).toBe('degraded');
    expect(byId.get('google_drive')?.status).toBe('available');
    expect(byId.get('canva')?.status).toBe('blocked');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Source-scan guards
// ─────────────────────────────────────────────────────────────────────────────

describe('readOnlyConnectorHealthRegistry.ts — source guard', () => {
  it('nothing auto-runs on import — no top-level check call, no timers, no IIFE', () => {
    expect(REGISTRY).not.toMatch(/^\s*(void\s+)?check(All)?ReadOnlyConnectorHealth\(/m);
    expect(REGISTRY).not.toMatch(/setInterval|setTimeout|subscribe\(/);
    expect(REGISTRY).not.toMatch(/\(\s*async\s*\(\s*\)\s*=>[\s\S]*?\)\s*\(\)/);
  });

  it('contains no URLs, secrets, or env access', () => {
    expect(REGISTRY).not.toMatch(/https?:\/\//);
    expect(REGISTRY).not.toMatch(/import\.meta\.env|process\.env|API_KEY|SECRET|TOKEN/);
  });

  it('has no direct network or storage capability of its own', () => {
    expect(REGISTRY).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|functions\.invoke|webhook/i);
    expect(REGISTRY).not.toMatch(/localStorage|sessionStorage|indexedDB/i);
  });

  it('wraps ONLY the two existing safe read wrappers', () => {
    expect(REGISTRY).toMatch(/import \{ checkN8nHealth \} from '\.\/adapters\/n8n\/n8nLiveService'/);
    expect(REGISTRY).toMatch(/import \{ checkGdriveHealth \} from '\.\/adapters\/drive\/gdriveLiveService'/);
  });

  it('has no React', () => {
    expect(REGISTRY).not.toMatch(/from ['"]react['"]|useState|useEffect/);
  });

  it('descriptors are hard-safe: readOnly true, writes/publishes false, Owner click required', () => {
    expect(REGISTRY).toMatch(/readOnly:\s*true/);
    expect(REGISTRY).toMatch(/writesExternalSystems:\s*false/);
    expect(REGISTRY).toMatch(/publishesExternalSystems:\s*false/);
    expect(REGISTRY).toMatch(/requiresOwnerClick:\s*true/);
    expect(REGISTRY).not.toMatch(/writesExternalSystems:\s*true|publishesExternalSystems:\s*true/);
  });
});
