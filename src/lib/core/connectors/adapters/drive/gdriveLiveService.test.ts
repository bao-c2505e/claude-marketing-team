// gdriveLiveService.test.ts — T4-7
// Tests safety logic and response handling. No real network calls.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
  isSupabaseConfigured: true,
}));

import { supabase } from '../../../../supabaseClient';
import {
  fetchGdriveData,
  checkGdriveHealth,
  listGdriveFilesReadOnly,
  sanitizeGdriveFileSummaries,
  GDRIVE_FILE_LIST_MAX_ITEMS,
} from './gdriveLiveService';

const mockInvoke = vi.mocked(
  (supabase as NonNullable<typeof supabase>).functions.invoke,
);

const SAFETY = { allow_write: false, allow_publish: false, allow_spend: false } as const;

function makeOkResponse(note = 'gdrive-read Edge Function healthy') {
  return {
    data: {
      ok: true,
      action: 'health',
      note,
      fetched_at: '2026-06-30T00:00:00.000Z',
      safety: SAFETY,
    },
    error: null,
  };
}

describe('gdriveLiveService — T4-7', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  describe('fetchGdriveData', () => {
    it('returns ok result when Edge Function succeeds', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const result = await fetchGdriveData('health');
      expect(result.ok).toBe(true);
      expect(result.action).toBe('health');
    });

    it('returns error result when Edge Function errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'gdrive-read unreachable' },
      });
      const result = await fetchGdriveData('health');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('gdrive-read unreachable');
    });

    it('calls Edge Function with correct action body', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      await fetchGdriveData('health');
      expect(mockInvoke).toHaveBeenCalledWith('gdrive-read', { body: { action: 'health' } });
    });

    // ── SAFETY INVARIANTS — must never fail ──────────────────────────────────

    it('always returns allow_write: false on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const result = await fetchGdriveData('health');
      expect(result.safety.allow_write).toBe(false);
    });

    it('always returns allow_publish: false on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const result = await fetchGdriveData('health');
      expect(result.safety.allow_publish).toBe(false);
    });

    it('always returns allow_spend: false on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const result = await fetchGdriveData('health');
      expect(result.safety.allow_spend).toBe(false);
    });

    it('always returns allow_write: false on error', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: { message: 'timeout' } });
      const result = await fetchGdriveData('health');
      expect(result.safety.allow_write).toBe(false);
    });

    it('always returns allow_publish: false on error', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: { message: 'timeout' } });
      const result = await fetchGdriveData('health');
      expect(result.safety.allow_publish).toBe(false);
    });

    it('always returns allow_spend: false on error', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: { message: 'timeout' } });
      const result = await fetchGdriveData('health');
      expect(result.safety.allow_spend).toBe(false);
    });
  });

  describe('checkGdriveHealth', () => {
    it('returns healthy: true when Edge Function responds ok', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const { healthy } = await checkGdriveHealth();
      expect(healthy).toBe(true);
    });

    it('returns healthy: false when Edge Function errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'connection refused' },
      });
      const { healthy, note } = await checkGdriveHealth();
      expect(healthy).toBe(false);
      expect(note).toContain('connection refused');
    });

    it('note contains "Edge Function" on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const { note } = await checkGdriveHealth();
      expect(note).toContain('Edge Function');
    });

    it('note mentions the read-only proxy on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const { note } = await checkGdriveHealth();
      expect(note).toContain('read-only');
    });
  });

  // ── T4-17: read-only file list ─────────────────────────────────────────────

  describe('sanitizeGdriveFileSummaries', () => {
    it('rebuilds summaries from the whitelist only — unsafe fields are dropped', () => {
      const files = sanitizeGdriveFileSummaries({
        files: [
          {
            id: 'f1',
            name: 'brief.pdf',
            mimeType: 'application/pdf',
            modifiedTime: '2026-07-01T00:00:00Z',
            size: '1024',
            webViewLink: 'https://drive.google.com/private/f1',
            webContentLink: 'https://drive.google.com/uc?id=f1',
            permissions: [{ role: 'owner' }],
            owners: [{ emailAddress: 'owner@example.com' }],
          },
        ],
      });
      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        id: 'f1',
        name: 'brief.pdf',
        mimeType: 'application/pdf',
        modifiedTime: '2026-07-01T00:00:00Z',
        size: '1024',
      });
      expect(Object.keys(files[0])).toEqual(['id', 'name', 'mimeType', 'modifiedTime', 'size']);
      expect(JSON.stringify(files)).not.toContain('drive.google.com');
      expect(JSON.stringify(files)).not.toContain('emailAddress');
    });

    it('drops entries without a safe id/name and defaults optional fields', () => {
      const files = sanitizeGdriveFileSummaries({
        files: [
          { id: '', name: 'x' },
          { id: 'ok', name: '' },
          { id: 'f2', name: 'doc', size: 999, mimeType: 42 },
          null,
          'junk',
        ],
      });
      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        id: 'f2',
        name: 'doc',
        mimeType: 'unknown',
        modifiedTime: null,
        size: null,
      });
    });

    it('caps the list at GDRIVE_FILE_LIST_MAX_ITEMS', () => {
      const files = sanitizeGdriveFileSummaries({
        files: Array.from({ length: 50 }, (_, i) => ({ id: `f${i}`, name: `file ${i}` })),
      });
      expect(files).toHaveLength(GDRIVE_FILE_LIST_MAX_ITEMS);
    });

    it('returns [] for garbage payloads', () => {
      expect(sanitizeGdriveFileSummaries(null)).toEqual([]);
      expect(sanitizeGdriveFileSummaries('nope')).toEqual([]);
      expect(sanitizeGdriveFileSummaries({ files: 'not-an-array' })).toEqual([]);
    });
  });

  describe('listGdriveFilesReadOnly', () => {
    it("calls ONLY the read-only 'list_files' action", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          ok: true,
          action: 'list_files',
          data: { files: [], count: 0 },
          fetched_at: '2026-07-03T00:00:00.000Z',
          safety: SAFETY,
        },
        error: null,
      });
      await listGdriveFilesReadOnly();
      expect(mockInvoke).toHaveBeenCalledWith('gdrive-read', { body: { action: 'list_files' } });
    });

    it('returns sanitized files on success', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          ok: true,
          action: 'list_files',
          data: {
            files: [
              { id: 'f1', name: 'brief.pdf', mimeType: 'application/pdf', extra: 'dropped' },
            ],
            count: 1,
          },
          fetched_at: '2026-07-03T00:00:00.000Z',
          safety: SAFETY,
        },
        error: null,
      });
      const result = await listGdriveFilesReadOnly();
      expect(result.ok).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].id).toBe('f1');
      expect(result.note).toContain('read-only');
      expect(JSON.stringify(result)).not.toContain('dropped');
    });

    it('normalizes Edge Function errors to ok:false — never throws', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'gdrive-read unreachable' },
      });
      const result = await listGdriveFilesReadOnly();
      expect(result.ok).toBe(false);
      expect(result.files).toEqual([]);
      expect(result.error).toBe('gdrive-read unreachable');
    });

    it('normalizes a missing-credentials refusal to ok:false with the proxy message', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          ok: false,
          action: 'list_files',
          error: 'GDRIVE_SERVICE_ACCOUNT_JSON not configured in Supabase vault',
          fetched_at: '2026-07-03T00:00:00.000Z',
          safety: SAFETY,
        },
        error: null,
      });
      const result = await listGdriveFilesReadOnly();
      expect(result.ok).toBe(false);
      expect(result.files).toEqual([]);
      expect(result.error).toContain('not configured');
    });
  });
});
