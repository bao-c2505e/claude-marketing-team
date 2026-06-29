// n8nLiveService.test.ts — T4-6
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
import { fetchN8nData, checkN8nHealth } from './n8nLiveService';

const mockInvoke = vi.mocked(
  (supabase as NonNullable<typeof supabase>).functions.invoke,
);

const SAFETY = { allow_write: false, allow_publish: false, allow_spend: false } as const;

function makeOkResponse(data: unknown = { status: 'ok' }) {
  return {
    data: {
      ok: true,
      action: 'health',
      data,
      fetched_at: '2026-06-30T00:00:00.000Z',
      safety: SAFETY,
    },
    error: null,
  };
}

describe('n8nLiveService — T4-6', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  describe('fetchN8nData', () => {
    it('returns ok result when Edge Function succeeds', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const result = await fetchN8nData('health');
      expect(result.ok).toBe(true);
      expect(result.action).toBe('health');
    });

    it('returns error result when Edge Function errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'n8n-read unreachable' },
      });
      const result = await fetchN8nData('health');
      expect(result.ok).toBe(false);
      expect(result.error).toBe('n8n-read unreachable');
    });

    it('calls Edge Function with correct action body', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      await fetchN8nData('health');
      expect(mockInvoke).toHaveBeenCalledWith('n8n-read', { body: { action: 'health' } });
    });

    // ── SAFETY INVARIANTS ────────────────────────────────────────────────────

    it('always returns allow_write: false on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const result = await fetchN8nData('health');
      expect(result.safety.allow_write).toBe(false);
    });

    it('always returns allow_publish: false on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const result = await fetchN8nData('health');
      expect(result.safety.allow_publish).toBe(false);
    });

    it('always returns allow_spend: false on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const result = await fetchN8nData('health');
      expect(result.safety.allow_spend).toBe(false);
    });

    it('always returns allow_write: false on error', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: { message: 'timeout' } });
      const result = await fetchN8nData('health');
      expect(result.safety.allow_write).toBe(false);
    });

    it('always returns allow_publish: false on error', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: { message: 'timeout' } });
      const result = await fetchN8nData('health');
      expect(result.safety.allow_publish).toBe(false);
    });

    it('always returns allow_spend: false on error', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: { message: 'timeout' } });
      const result = await fetchN8nData('health');
      expect(result.safety.allow_spend).toBe(false);
    });
  });

  describe('checkN8nHealth', () => {
    it('returns healthy: true when Edge Function responds ok', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const { healthy } = await checkN8nHealth();
      expect(healthy).toBe(true);
    });

    it('returns healthy: false when Edge Function errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'connection refused' },
      });
      const { healthy, note } = await checkN8nHealth();
      expect(healthy).toBe(false);
      expect(note).toContain('connection refused');
    });

    it('note contains "Edge Function" on success', async () => {
      mockInvoke.mockResolvedValue(makeOkResponse());
      const { note } = await checkN8nHealth();
      expect(note).toContain('Edge Function');
    });
  });
});
