// gdriveLiveService.ts — T4-7
// Calls the gdrive-read Supabase Edge Function.
// Phase 1: health-only. No real Google API call. No OAuth credentials in this file.
// T4-8+: will expose fetchGdriveFiles() once GDRIVE_SERVICE_ACCOUNT_JSON is in vault.

import { supabase } from '../../../../supabaseClient';

export interface GdriveLiveSafety {
  allow_write: false;
  allow_publish: false;
  allow_spend: false;
}

export interface GdriveLiveResult {
  ok: boolean;
  action: string;
  note?: string;
  data?: unknown;
  fetched_at: string;
  safety: GdriveLiveSafety;
  error?: string;
}

const SAFETY_FLAGS: GdriveLiveSafety = {
  allow_write: false,
  allow_publish: false,
  allow_spend: false,
} as const;

function errorResult(action: string, error: string): GdriveLiveResult {
  return {
    ok: false,
    action,
    fetched_at: new Date().toISOString(),
    safety: SAFETY_FLAGS,
    error,
  };
}

export async function fetchGdriveData(action: string): Promise<GdriveLiveResult> {
  if (!supabase) {
    return errorResult(
      action,
      'Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
    );
  }

  const { data, error } = await supabase.functions.invoke('gdrive-read', {
    body: { action },
  });

  if (error) {
    return errorResult(action, error.message);
  }

  return data as GdriveLiveResult;
}

export async function checkGdriveHealth(): Promise<{ healthy: boolean; note: string }> {
  const result = await fetchGdriveData('health');
  return {
    healthy: result.ok,
    note: result.ok
      ? 'gdrive-read Edge Function reachable (Phase 1 — no Google API call yet)'
      : (result.error ?? 'unreachable'),
  };
}
