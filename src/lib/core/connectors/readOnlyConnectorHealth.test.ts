// readOnlyConnectorHealth.test.ts — T4-15
// Pure unit tests + source-scan guards for the read-only health contract.

import { describe, it, expect } from 'vitest';
import CONTRACT from './readOnlyConnectorHealth.ts?raw';
import {
  READ_ONLY_CONNECTOR_IDS,
  READ_ONLY_CONNECTOR_SAFETY_NOTE,
  type ReadOnlyConnectorHealthBase,
  type ReadOnlyConnectorHealthResult,
  createAvailableReadOnlyConnectorHealthResult,
  createBlockedConnectorHealthResult,
  createDegradedReadOnlyConnectorHealthResult,
  normalizeConnectorHealthError,
  assertReadOnlyConnectorHealthResult,
} from './readOnlyConnectorHealth';

const BASE: ReadOnlyConnectorHealthBase = {
  connectorId: 'n8n',
  label: 'n8n Workflow (read-only)',
  mode: 'edge_read_proxy',
  checkedAt: '2026-07-03T00:00:00.000Z',
  source: 'test',
};

// ─────────────────────────────────────────────────────────────────────────────
// Hard-false write capabilities
// ─────────────────────────────────────────────────────────────────────────────

describe('readOnlyConnectorHealth — write capabilities are always hard false', () => {
  const results: ReadOnlyConnectorHealthResult[] = [
    createAvailableReadOnlyConnectorHealthResult(BASE, 'ok'),
    createBlockedConnectorHealthResult(BASE, 'no surface'),
    createDegradedReadOnlyConnectorHealthResult(BASE, 'unhealthy'),
    normalizeConnectorHealthError(BASE, new Error('boom')),
  ];

  it.each(results.map(r => [r.status, r] as const))(
    '%s result has canWrite/canPublish/canRunAds === false',
    (_status, r) => {
      expect(r.canWrite).toBe(false);
      expect(r.canPublish).toBe(false);
      expect(r.canRunAds).toBe(false);
    },
  );

  it('every result carries the standing safety note', () => {
    for (const r of results) {
      expect(r.safetyNote).toBe(READ_ONLY_CONNECTOR_SAFETY_NOTE);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Result shapes
// ─────────────────────────────────────────────────────────────────────────────

describe('createBlockedConnectorHealthResult', () => {
  it('is blocked, cannot read, keeps identity and message', () => {
    const r = createBlockedConnectorHealthResult(
      { ...BASE, connectorId: 'canva', mode: 'manual_only' },
      'no read surface',
      'no_read_surface',
    );
    expect(r.status).toBe('blocked');
    expect(r.canRead).toBe(false);
    expect(r.connectorId).toBe('canva');
    expect(r.mode).toBe('manual_only');
    expect(r.message).toBe('no read surface');
    expect(r.errorCode).toBe('no_read_surface');
    expect(r.checkedAt).toBe(BASE.checkedAt);
  });

  it('errorCode is optional and omitted when not given', () => {
    const r = createBlockedConnectorHealthResult(BASE, 'blocked');
    expect(r.errorCode).toBeUndefined();
    expect('errorCode' in r).toBe(false);
  });
});

describe('createAvailableReadOnlyConnectorHealthResult', () => {
  it('is available and can read — and ONLY read', () => {
    const r = createAvailableReadOnlyConnectorHealthResult(BASE, 'reachable');
    expect(r.status).toBe('available');
    expect(r.canRead).toBe(true);
    expect(r.message).toBe('reachable');
    expect(r.source).toBe('test');
  });
});

describe('createDegradedReadOnlyConnectorHealthResult', () => {
  it('is degraded, cannot read, defaults errorCode', () => {
    const r = createDegradedReadOnlyConnectorHealthResult(BASE, 'unhealthy');
    expect(r.status).toBe('degraded');
    expect(r.canRead).toBe(false);
    expect(r.errorCode).toBe('health_check_unhealthy');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error normalization
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeConnectorHealthError', () => {
  it('extracts message from Error', () => {
    const r = normalizeConnectorHealthError(BASE, new Error('edge fn unreachable'));
    expect(r.status).toBe('degraded');
    expect(r.canRead).toBe(false);
    expect(r.message).toBe('edge fn unreachable');
    expect(r.errorCode).toBe('health_check_threw');
  });

  it('uses non-empty strings as-is', () => {
    const r = normalizeConnectorHealthError(BASE, 'timeout');
    expect(r.message).toBe('timeout');
  });

  it('falls back for unknown/empty values', () => {
    expect(normalizeConnectorHealthError(BASE, undefined).message).toBe(
      'Unknown health check failure',
    );
    expect(normalizeConnectorHealthError(BASE, '   ').message).toBe(
      'Unknown health check failure',
    );
    expect(normalizeConnectorHealthError(BASE, 42).message).toBe(
      'Unknown health check failure',
    );
  });

  it('never throws', () => {
    expect(() => normalizeConnectorHealthError(BASE, null)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Assertion guard
// ─────────────────────────────────────────────────────────────────────────────

describe('assertReadOnlyConnectorHealthResult', () => {
  const valid = createAvailableReadOnlyConnectorHealthResult(BASE, 'ok');

  it('returns the same object for a valid result', () => {
    expect(assertReadOnlyConnectorHealthResult(valid)).toBe(valid);
  });

  it.each(['canWrite', 'canPublish', 'canRunAds'] as const)(
    'rejects %s forced to true through a cast',
    flag => {
      const tampered = { ...valid, [flag]: true } as unknown as ReadOnlyConnectorHealthResult;
      expect(() => assertReadOnlyConnectorHealthResult(tampered)).toThrow(/hard false/);
    },
  );

  it('rejects unknown connector id / status / mode', () => {
    const badId = { ...valid, connectorId: 'meta' } as unknown as ReadOnlyConnectorHealthResult;
    const badStatus = { ...valid, status: 'live' } as unknown as ReadOnlyConnectorHealthResult;
    const badMode = { ...valid, mode: 'production' } as unknown as ReadOnlyConnectorHealthResult;
    expect(() => assertReadOnlyConnectorHealthResult(badId)).toThrow(/connector id/);
    expect(() => assertReadOnlyConnectorHealthResult(badStatus)).toThrow(/status/);
    expect(() => assertReadOnlyConnectorHealthResult(badMode)).toThrow(/mode/);
  });

  it('rejects empty checkedAt / label / source / safetyNote', () => {
    for (const field of ['checkedAt', 'label', 'source', 'safetyNote'] as const) {
      const bad = { ...valid, [field]: '' } as unknown as ReadOnlyConnectorHealthResult;
      expect(() => assertReadOnlyConnectorHealthResult(bad)).toThrow();
    }
  });

  it('rejects non-boolean canRead', () => {
    const bad = { ...valid, canRead: 'yes' } as unknown as ReadOnlyConnectorHealthResult;
    expect(() => assertReadOnlyConnectorHealthResult(bad)).toThrow(/canRead/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Known ids
// ─────────────────────────────────────────────────────────────────────────────

describe('READ_ONLY_CONNECTOR_IDS', () => {
  it('contains exactly n8n, google_drive, canva — no publishing channels', () => {
    expect([...READ_ONLY_CONNECTOR_IDS]).toEqual(['n8n', 'google_drive', 'canva']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Source-scan guards — the contract file stays pure
// ─────────────────────────────────────────────────────────────────────────────

describe('readOnlyConnectorHealth.ts — source guard', () => {
  it('has no network capability', () => {
    expect(CONTRACT).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|https?:\/\/|webhook|functions\.invoke/i);
  });

  it('has no storage capability', () => {
    expect(CONTRACT).not.toMatch(/localStorage|sessionStorage|indexedDB|BroadcastChannel/i);
  });

  it('has no React', () => {
    expect(CONTRACT).not.toMatch(/from ['"]react['"]|useState|useEffect|useCallback|useMemo/);
  });

  it('owns no clock — checkedAt is always injected', () => {
    expect(CONTRACT).not.toMatch(/Date\.now|new Date\(/);
  });

  it('has no secret/env handling', () => {
    expect(CONTRACT).not.toMatch(/import\.meta\.env|process\.env|API_KEY|SECRET|TOKEN/);
  });

  it('write capability fields are typed as literal false', () => {
    expect(CONTRACT).toMatch(/canWrite:\s*false;/);
    expect(CONTRACT).toMatch(/canPublish:\s*false;/);
    expect(CONTRACT).toMatch(/canRunAds:\s*false;/);
  });
});
