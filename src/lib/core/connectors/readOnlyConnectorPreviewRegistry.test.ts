// readOnlyConnectorPreviewRegistry.test.ts — T4-16
// All checks run against INJECTED fakes — no network is ever touched here.

import { describe, it, expect } from 'vitest';
import REGISTRY from './readOnlyConnectorPreviewRegistry.ts?raw';
import {
  getReadOnlyConnectorPreviewDescriptors,
  checkReadOnlyConnectorPreview,
  checkAllReadOnlyConnectorPreviews,
  type ReadOnlyConnectorPreviewCheckDeps,
} from './readOnlyConnectorPreviewRegistry';
import {
  assertReadOnlyConnectorPreviewResult,
  type ReadOnlyPreviewConnectorId,
} from './readOnlyConnectorPreview';
import type { N8nLiveResult } from './adapters/n8n/n8nLiveService';
import type { GdriveFileListResult, GdriveFileSummary } from './adapters/drive/gdriveLiveService';

const NOW_ISO = '2026-07-03T00:00:00.000Z';

function n8nOk(workflows: unknown[]): N8nLiveResult {
  return {
    ok: true,
    action: 'workflows',
    data: { data: workflows },
    fetched_at: NOW_ISO,
    safety: { allow_write: false, allow_publish: false, allow_spend: false },
  };
}

function gdriveOk(files: GdriveFileSummary[]): GdriveFileListResult {
  return { ok: true, files, note: `${files.length} file(s) visible` };
}

const GDRIVE_FILE: GdriveFileSummary = {
  id: 'f1',
  name: 'campaign-brief.pdf',
  mimeType: 'application/pdf',
  modifiedTime: '2026-07-01T00:00:00Z',
  size: '1024',
};

function deps(overrides?: Partial<ReadOnlyConnectorPreviewCheckDeps>): ReadOnlyConnectorPreviewCheckDeps {
  return {
    fetchN8nWorkflows: async () =>
      n8nOk([{ id: 'wf-1', name: 'FBV Video Factory', active: true, updatedAt: '2026-07-01' }]),
    listGdriveFiles: async () => gdriveOk([GDRIVE_FILE]),
    nowIso: () => NOW_ISO,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Descriptors
// ─────────────────────────────────────────────────────────────────────────────

describe('getReadOnlyConnectorPreviewDescriptors', () => {
  it('registers exactly n8n, google_drive, canva, meta', () => {
    expect(getReadOnlyConnectorPreviewDescriptors().map(d => d.connectorId)).toEqual([
      'n8n',
      'google_drive',
      'canva',
      'meta',
    ]);
  });

  it('every descriptor is read-only, non-writing, non-publishing, Owner-click-gated', () => {
    for (const d of getReadOnlyConnectorPreviewDescriptors()) {
      expect(d.readOnly).toBe(true);
      expect(d.writesExternalSystems).toBe(false);
      expect(d.publishesExternalSystems).toBe(false);
      expect(d.requiresOwnerClick).toBe(true);
    }
  });

  it('modes and preview types match the T4-16 matrix', () => {
    const byId = new Map(getReadOnlyConnectorPreviewDescriptors().map(d => [d.connectorId, d]));
    expect(byId.get('n8n')).toMatchObject({ mode: 'edge_read_proxy', previewType: 'n8n_workflows' });
    expect(byId.get('google_drive')).toMatchObject({ mode: 'edge_read_proxy', previewType: 'gdrive_files' });
    expect(byId.get('canva')).toMatchObject({ mode: 'manual_only', previewType: 'no_safe_read_surface' });
    expect(byId.get('meta')).toMatchObject({ mode: 'excluded', previewType: 'no_safe_read_surface' });
  });

  it('returns defensive copies — mutating a copy never leaks back', () => {
    const first = getReadOnlyConnectorPreviewDescriptors();
    (first[0] as { label: string }).label = 'tampered';
    expect(getReadOnlyConnectorPreviewDescriptors()[0].label).not.toBe('tampered');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// n8n workflow preview
// ─────────────────────────────────────────────────────────────────────────────

describe('checkReadOnlyConnectorPreview — n8n (injected fakes)', () => {
  it('healthy list maps to available with sanitized items', async () => {
    const r = await checkReadOnlyConnectorPreview('n8n', deps());
    expect(r.status).toBe('available');
    expect(r.previewType).toBe('n8n_workflows');
    expect(r.checkedAt).toBe(NOW_ISO);
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toEqual({
      id: 'wf-1',
      name: 'FBV Video Factory',
      summary: 'active: yes · updated 2026-07-01',
    });
    expect(r.message).toContain('read receipt');
  });

  it('dangerous workflow fields are stripped and links redacted', async () => {
    const r = await checkReadOnlyConnectorPreview(
      'n8n',
      deps({
        fetchN8nWorkflows: async () =>
          n8nOk([
            {
              id: 7,
              name: 'Hook at https://n8n.example.com/hook/secret-path',
              active: false,
              nodes: [{ credentials: { apiKey: 'LEAK' } }],
              connections: { a: 'b' },
              staticData: { token: 'LEAK' },
            },
          ]),
      }),
    );
    expect(r.items).toHaveLength(1);
    const item = r.items[0];
    expect(Object.keys(item)).toEqual(['id', 'name', 'summary']);
    expect(item.id).toBe('7');
    expect(item.name).toBe('Hook at [link removed]');
    expect(item.summary).toBe('active: no');
    expect(JSON.stringify(r)).not.toContain('LEAK');
    expect(JSON.stringify(r)).not.toContain('secret-path');
  });

  it('wrapper ok:false maps to degraded with the wrapper error', async () => {
    const r = await checkReadOnlyConnectorPreview(
      'n8n',
      deps({
        fetchN8nWorkflows: async () => ({
          ok: false,
          action: 'workflows',
          data: null,
          fetched_at: NOW_ISO,
          safety: { allow_write: false, allow_publish: false, allow_spend: false },
          error: 'Supabase not configured',
        }),
      }),
    );
    expect(r.status).toBe('degraded');
    expect(r.items).toHaveLength(0);
    expect(r.message).toBe('Supabase not configured');
    expect(r.errorCode).toBe('read_proxy_unhealthy');
  });

  it('a throwing wrapper is normalized to degraded — never rethrown', async () => {
    const r = await checkReadOnlyConnectorPreview(
      'n8n',
      deps({ fetchN8nWorkflows: async () => { throw new Error('network down'); } }),
    );
    expect(r.status).toBe('degraded');
    expect(r.message).toBe('network down');
    expect(r.errorCode).toBe('preview_check_threw');
  });

  it('malformed data payloads yield an empty available list, not a crash', async () => {
    const r = await checkReadOnlyConnectorPreview(
      'n8n',
      deps({ fetchN8nWorkflows: async () => n8nOk([]) }),
    );
    expect(r.status).toBe('available');
    expect(r.items).toHaveLength(0);

    const weird = await checkReadOnlyConnectorPreview(
      'n8n',
      deps({
        fetchN8nWorkflows: async () => ({ ...n8nOk([]), data: 'not-an-object' }),
      }),
    );
    expect(weird.status).toBe('available');
    expect(weird.items).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// google_drive / canva / meta
// ─────────────────────────────────────────────────────────────────────────────

describe('checkReadOnlyConnectorPreview — google_drive (T4-17, injected fakes)', () => {
  it('healthy list maps to available with sanitized items — no longer permanently blocked', async () => {
    const r = await checkReadOnlyConnectorPreview('google_drive', deps());
    expect(r.status).toBe('available');
    expect(r.previewType).toBe('gdrive_files');
    expect(r.mode).toBe('edge_read_proxy');
    expect(r.checkedAt).toBe(NOW_ISO);
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toEqual({
      id: 'f1',
      name: 'campaign-brief.pdf',
      summary: 'application/pdf · modified 2026-07-01T00:00:00Z',
    });
    expect(r.message).toContain('read receipt');
    expect(r.source).toContain('listGdriveFilesReadOnly');
  });

  it('wrapper ok:false (e.g. missing vault credentials) maps to degraded, never faked', async () => {
    const r = await checkReadOnlyConnectorPreview(
      'google_drive',
      deps({
        listGdriveFiles: async () => ({
          ok: false,
          files: [],
          note: 'gdrive-read list_files unavailable',
          error: 'GDRIVE_SERVICE_ACCOUNT_JSON not configured in Supabase vault',
        }),
      }),
    );
    expect(r.status).toBe('degraded');
    expect(r.items).toHaveLength(0);
    expect(r.message).toContain('not configured');
    expect(r.errorCode).toBe('read_proxy_unhealthy');
  });

  it('a throwing wrapper is normalized to degraded — never rethrown', async () => {
    const r = await checkReadOnlyConnectorPreview(
      'google_drive',
      deps({ listGdriveFiles: async () => { throw new Error('network down'); } }),
    );
    expect(r.status).toBe('degraded');
    expect(r.message).toBe('network down');
    expect(r.errorCode).toBe('preview_check_threw');
  });

  it('unsafe fields and links cannot reach the items', async () => {
    const r = await checkReadOnlyConnectorPreview(
      'google_drive',
      deps({
        listGdriveFiles: async () =>
          gdriveOk([
            {
              ...GDRIVE_FILE,
              name: 'shared at https://drive.google.com/private/f1',
              webViewLink: 'https://drive.google.com/private/f1',
              owners: [{ emailAddress: 'owner@example.com' }],
            } as unknown as GdriveFileSummary,
          ]),
      }),
    );
    expect(r.items).toHaveLength(1);
    expect(Object.keys(r.items[0])).toEqual(['id', 'name', 'summary']);
    expect(r.items[0].name).toBe('shared at [link removed]');
    expect(JSON.stringify(r)).not.toContain('drive.google.com');
    expect(JSON.stringify(r)).not.toContain('emailAddress');
  });

  it('an empty file list is an available empty receipt, not an error', async () => {
    const r = await checkReadOnlyConnectorPreview(
      'google_drive',
      deps({ listGdriveFiles: async () => gdriveOk([]) }),
    );
    expect(r.status).toBe('available');
    expect(r.items).toHaveLength(0);
  });
});

describe('checkReadOnlyConnectorPreview — connectors without a safe list surface', () => {
  it('canva stays blocked/manual_only with a no-safe-read-surface message', async () => {
    const r = await checkReadOnlyConnectorPreview('canva', deps());
    expect(r.status).toBe('blocked');
    expect(r.mode).toBe('manual_only');
    expect(r.previewType).toBe('no_safe_read_surface');
    expect(r.errorCode).toBe('no_read_surface');
    expect(r.message).toContain('no safe read surface');
  });

  it('meta stays excluded with a no-safe-read-surface-in-repo message', async () => {
    const r = await checkReadOnlyConnectorPreview('meta', deps());
    expect(r.status).toBe('blocked');
    expect(r.mode).toBe('excluded');
    expect(r.errorCode).toBe('excluded_no_read_surface');
    expect(r.message).toContain('no safe read surface in this repo');
  });

  it('rejects unknown connector ids', async () => {
    await expect(
      checkReadOnlyConnectorPreview('tiktok' as unknown as ReadOnlyPreviewConnectorId, deps()),
    ).rejects.toThrow(/Unknown read-only preview connector id/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkAll
// ─────────────────────────────────────────────────────────────────────────────

describe('checkAllReadOnlyConnectorPreviews', () => {
  it('returns one result per descriptor, all hard-false and assertion-clean', async () => {
    const results = await checkAllReadOnlyConnectorPreviews(deps());
    expect(results).toHaveLength(4);
    for (const r of results) {
      expect(r.canWrite).toBe(false);
      expect(r.canPublish).toBe(false);
      expect(r.canRunAds).toBe(false);
      expect(r.canExecute).toBe(false);
      expect(() => assertReadOnlyConnectorPreviewResult(r)).not.toThrow();
    }
  });

  it('one failing connector never breaks the others', async () => {
    const results = await checkAllReadOnlyConnectorPreviews(
      deps({ fetchN8nWorkflows: async () => { throw new Error('down'); } }),
    );
    const byId = new Map(results.map(r => [r.connectorId, r]));
    expect(byId.get('n8n')?.status).toBe('degraded');
    expect(byId.get('google_drive')?.status).toBe('available');
    expect(byId.get('canva')?.status).toBe('blocked');
    expect(byId.get('meta')?.status).toBe('blocked');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Source-scan guards
// ─────────────────────────────────────────────────────────────────────────────

describe('readOnlyConnectorPreviewRegistry.ts — source guard', () => {
  it('nothing auto-runs on import — no top-level check call, no timers, no IIFE', () => {
    expect(REGISTRY).not.toMatch(/^\s*(void\s+)?check(All)?ReadOnlyConnectorPreview/m);
    expect(REGISTRY).not.toMatch(/setInterval|setTimeout|subscribe\(/);
    expect(REGISTRY).not.toMatch(/\(\s*async\s*\(\s*\)\s*=>[\s\S]*?\)\s*\(\)/);
  });

  it('contains no URLs, secrets, env access, or client tokens', () => {
    expect(REGISTRY).not.toMatch(/https?:\/\//);
    expect(REGISTRY).not.toMatch(/import\.meta\.env|process\.env|API_KEY|SECRET|CLIENT_ID|OAuth|access_token/);
  });

  it('has no direct network or storage capability of its own', () => {
    expect(REGISTRY).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|functions\.invoke/i);
    expect(REGISTRY).not.toMatch(/localStorage|sessionStorage|indexedDB/i);
  });

  it("wraps ONLY the existing safe read wrappers' list actions", () => {
    expect(REGISTRY).toMatch(/import \{ fetchN8nData, type N8nLiveResult \} from '\.\/adapters\/n8n\/n8nLiveService'/);
    expect(REGISTRY).toMatch(/fetchN8nData\('workflows'\)/);
    // The read-only action allowlist is never widened here.
    expect(REGISTRY).not.toMatch(/fetchN8nData\('(?!workflows')/);
    // T4-17: gdrive goes through the sanitizing wrapper — never fetchGdriveData directly.
    expect(REGISTRY).toMatch(/listGdriveFilesReadOnly/);
    expect(REGISTRY).not.toMatch(/fetchGdriveData/);
  });

  it('never touches the ConnectorCommand layer', () => {
    expect(REGISTRY).not.toMatch(/connectorCommand|ConnectorCommand/);
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
