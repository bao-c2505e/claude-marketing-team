// readOnlyConnectorPreview.test.ts — T4-16
// Pure unit tests + source-scan guards for the read-only preview contract.

import { describe, it, expect } from 'vitest';
import CONTRACT from './readOnlyConnectorPreview.ts?raw';
import {
  READ_ONLY_PREVIEW_CONNECTOR_IDS,
  READ_ONLY_PREVIEW_MAX_ITEMS,
  READ_ONLY_PREVIEW_MAX_TEXT_LENGTH,
  READ_ONLY_PREVIEW_SAFETY_NOTE,
  type ReadOnlyConnectorPreviewBase,
  type ReadOnlyConnectorPreviewResult,
  createAvailableReadOnlyConnectorPreviewResult,
  createBlockedConnectorPreviewResult,
  createDegradedReadOnlyConnectorPreviewResult,
  normalizeConnectorPreviewError,
  assertReadOnlyConnectorPreviewResult,
  sanitizeReadOnlyPreviewItem,
  sanitizeReadOnlyPreviewItems,
  scrubReadOnlyPreviewText,
} from './readOnlyConnectorPreview';

const BASE: ReadOnlyConnectorPreviewBase = {
  connectorId: 'n8n',
  label: 'n8n Workflow (read-only)',
  previewType: 'n8n_workflows',
  mode: 'edge_read_proxy',
  checkedAt: '2026-07-03T00:00:00.000Z',
  source: 'test',
};

const ITEM = { id: 'wf-1', name: 'Video pipeline', summary: 'active: yes' };

// ─────────────────────────────────────────────────────────────────────────────
// Hard-false capabilities
// ─────────────────────────────────────────────────────────────────────────────

describe('readOnlyConnectorPreview — capabilities are always hard false', () => {
  const results: ReadOnlyConnectorPreviewResult[] = [
    createAvailableReadOnlyConnectorPreviewResult(BASE, [ITEM], 'ok'),
    createDegradedReadOnlyConnectorPreviewResult(BASE, 'unhealthy'),
    createBlockedConnectorPreviewResult(BASE, 'no surface'),
    normalizeConnectorPreviewError(BASE, new Error('boom')),
  ];

  it.each(results.map(r => [r.status, r] as const))(
    '%s result has canWrite/canPublish/canRunAds/canExecute === false',
    (_status, r) => {
      expect(r.canWrite).toBe(false);
      expect(r.canPublish).toBe(false);
      expect(r.canRunAds).toBe(false);
      expect(r.canExecute).toBe(false);
    },
  );

  it('every result carries the standing safety note', () => {
    for (const r of results) {
      expect(r.safetyNote).toBe(READ_ONLY_PREVIEW_SAFETY_NOTE);
    }
  });

  it('checkedAt is exactly the injected value — never generated internally', () => {
    for (const r of results) {
      expect(r.checkedAt).toBe(BASE.checkedAt);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Result shapes
// ─────────────────────────────────────────────────────────────────────────────

describe('result creators', () => {
  it('available carries defensively copied, frozen items', () => {
    const r = createAvailableReadOnlyConnectorPreviewResult(BASE, [ITEM], '1 workflow visible');
    expect(r.status).toBe('available');
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toEqual(ITEM);
    expect(r.items[0]).not.toBe(ITEM);
    expect(Object.isFrozen(r.items)).toBe(true);
  });

  it('degraded has no items and a default errorCode', () => {
    const r = createDegradedReadOnlyConnectorPreviewResult(BASE, 'proxy unhealthy');
    expect(r.status).toBe('degraded');
    expect(r.items).toHaveLength(0);
    expect(r.errorCode).toBe('preview_unhealthy');
  });

  it('blocked has no items, keeps message and optional errorCode', () => {
    const r = createBlockedConnectorPreviewResult(
      { ...BASE, connectorId: 'meta', mode: 'excluded', previewType: 'no_safe_read_surface' },
      'excluded',
      'excluded_no_read_surface',
    );
    expect(r.status).toBe('blocked');
    expect(r.items).toHaveLength(0);
    expect(r.errorCode).toBe('excluded_no_read_surface');
    expect(r.mode).toBe('excluded');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error normalization — never throws into the UI
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeConnectorPreviewError', () => {
  it('maps Error to degraded without throwing', () => {
    const r = normalizeConnectorPreviewError(BASE, new Error('edge fn unreachable'));
    expect(r.status).toBe('degraded');
    expect(r.message).toBe('edge fn unreachable');
    expect(r.errorCode).toBe('preview_check_threw');
    expect(r.items).toHaveLength(0);
  });

  it('handles strings and unknown values', () => {
    expect(normalizeConnectorPreviewError(BASE, 'timeout').message).toBe('timeout');
    expect(normalizeConnectorPreviewError(BASE, undefined).message).toBe(
      'Unknown preview check failure',
    );
    expect(normalizeConnectorPreviewError(BASE, 42).message).toBe(
      'Unknown preview check failure',
    );
  });

  it('never throws', () => {
    expect(() => normalizeConnectorPreviewError(BASE, null)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sanitization
// ─────────────────────────────────────────────────────────────────────────────

describe('scrubReadOnlyPreviewText', () => {
  it('redacts links', () => {
    expect(scrubReadOnlyPreviewText('call https://example.com/hook-abc now')).toBe(
      'call [link removed] now',
    );
  });

  it('coerces finite numbers, rejects other types', () => {
    expect(scrubReadOnlyPreviewText(42)).toBe('42');
    expect(scrubReadOnlyPreviewText({})).toBeNull();
    expect(scrubReadOnlyPreviewText(null)).toBeNull();
    expect(scrubReadOnlyPreviewText(true)).toBeNull();
  });

  it('trims and caps length', () => {
    expect(scrubReadOnlyPreviewText('   ')).toBeNull();
    const long = 'x'.repeat(500);
    expect(scrubReadOnlyPreviewText(long)).toHaveLength(READ_ONLY_PREVIEW_MAX_TEXT_LENGTH);
  });
});

describe('sanitizeReadOnlyPreviewItem', () => {
  it('keeps ONLY id/name/summary — all other fields are dropped', () => {
    const item = sanitizeReadOnlyPreviewItem({
      id: 'wf-1',
      name: 'Pipeline',
      summary: 'active: yes',
      nodes: [{ credentials: 'SECRET' }],
      apiKey: 'leak-me',
    });
    expect(item).toEqual({ id: 'wf-1', name: 'Pipeline', summary: 'active: yes' });
    expect(Object.keys(item!)).toEqual(['id', 'name', 'summary']);
  });

  it('rejects items without a safe id and name', () => {
    expect(sanitizeReadOnlyPreviewItem({ name: 'x' })).toBeNull();
    expect(sanitizeReadOnlyPreviewItem({ id: 'x' })).toBeNull();
    expect(sanitizeReadOnlyPreviewItem({ id: '', name: '' })).toBeNull();
    expect(sanitizeReadOnlyPreviewItem('not an object')).toBeNull();
    expect(sanitizeReadOnlyPreviewItem(null)).toBeNull();
  });

  it('missing summary becomes an empty string', () => {
    expect(sanitizeReadOnlyPreviewItem({ id: '1', name: 'a' })?.summary).toBe('');
  });
});

describe('sanitizeReadOnlyPreviewItems', () => {
  it('drops invalid entries and caps the count', () => {
    const raw = [
      ...Array.from({ length: 30 }, (_, i) => ({ id: `id-${i}`, name: `wf ${i}` })),
      null,
      'junk',
    ];
    const items = sanitizeReadOnlyPreviewItems(raw);
    expect(items).toHaveLength(READ_ONLY_PREVIEW_MAX_ITEMS);
  });

  it('returns [] for garbage input', () => {
    expect(sanitizeReadOnlyPreviewItems([null, undefined, 42, 'x'])).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Assertion guard
// ─────────────────────────────────────────────────────────────────────────────

describe('assertReadOnlyConnectorPreviewResult', () => {
  const valid = createAvailableReadOnlyConnectorPreviewResult(BASE, [ITEM], 'ok');

  it('returns the same object for a valid result', () => {
    expect(assertReadOnlyConnectorPreviewResult(valid)).toBe(valid);
  });

  it.each(['canWrite', 'canPublish', 'canRunAds', 'canExecute'] as const)(
    'rejects %s forced to true through a cast',
    flag => {
      const tampered = { ...valid, [flag]: true } as unknown as ReadOnlyConnectorPreviewResult;
      expect(() => assertReadOnlyConnectorPreviewResult(tampered)).toThrow(/hard false/);
    },
  );

  it('rejects unknown connector id / status / mode / previewType', () => {
    for (const patch of [
      { connectorId: 'tiktok' },
      { status: 'live' },
      { mode: 'production' },
      { previewType: 'ads_accounts' },
    ]) {
      const bad = { ...valid, ...patch } as unknown as ReadOnlyConnectorPreviewResult;
      expect(() => assertReadOnlyConnectorPreviewResult(bad)).toThrow();
    }
  });

  it('rejects unsanitized or oversized items', () => {
    const badItem = {
      ...valid,
      items: [{ id: '', name: 'x', summary: '' }],
    } as unknown as ReadOnlyConnectorPreviewResult;
    expect(() => assertReadOnlyConnectorPreviewResult(badItem)).toThrow(/sanitized/);

    const tooMany = {
      ...valid,
      items: Array.from({ length: READ_ONLY_PREVIEW_MAX_ITEMS + 1 }, (_, i) => ({
        id: `${i}`, name: `n${i}`, summary: '',
      })),
    } as unknown as ReadOnlyConnectorPreviewResult;
    expect(() => assertReadOnlyConnectorPreviewResult(tooMany)).toThrow(/exceed/);
  });

  it('rejects empty checkedAt / label / source / safetyNote', () => {
    for (const field of ['checkedAt', 'label', 'source', 'safetyNote'] as const) {
      const bad = { ...valid, [field]: '' } as unknown as ReadOnlyConnectorPreviewResult;
      expect(() => assertReadOnlyConnectorPreviewResult(bad)).toThrow();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Known ids
// ─────────────────────────────────────────────────────────────────────────────

describe('READ_ONLY_PREVIEW_CONNECTOR_IDS', () => {
  it('contains exactly n8n, google_drive, canva, meta', () => {
    expect([...READ_ONLY_PREVIEW_CONNECTOR_IDS]).toEqual([
      'n8n',
      'google_drive',
      'canva',
      'meta',
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Source-scan guards — the contract file stays pure
// ─────────────────────────────────────────────────────────────────────────────

describe('readOnlyConnectorPreview.ts — source guard', () => {
  it('has no network capability', () => {
    expect(CONTRACT).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|functions\.invoke/i);
    // No real URL literals (the link-redaction regex is a pattern, not a URL).
    expect(CONTRACT).not.toMatch(/https?:\/\/[a-z0-9]/i);
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

  it('capability fields are typed as literal false', () => {
    expect(CONTRACT).toMatch(/canWrite:\s*false;/);
    expect(CONTRACT).toMatch(/canPublish:\s*false;/);
    expect(CONTRACT).toMatch(/canRunAds:\s*false;/);
    expect(CONTRACT).toMatch(/canExecute:\s*false;/);
  });
});
