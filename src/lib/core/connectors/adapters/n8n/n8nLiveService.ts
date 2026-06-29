// n8nLiveService.ts — T4-6
// Calls the n8n-read Supabase Edge Function. Read-only. No writes, no triggers.

import { supabase } from '../../../../supabaseClient';

export type N8nAction = 'health' | 'workflows' | 'executions';

export interface N8nLiveSafety {
  allow_write: false;
  allow_publish: false;
  allow_spend: false;
}

export interface N8nLiveResult {
  ok: boolean;
  action: N8nAction;
  data: unknown;
  fetched_at: string;
  safety: N8nLiveSafety;
  error?: string;
}

const SAFETY_FLAGS: N8nLiveSafety = {
  allow_write: false,
  allow_publish: false,
  allow_spend: false,
} as const;

function errorResult(action: N8nAction, error: string): N8nLiveResult {
  return {
    ok: false,
    action,
    data: null,
    fetched_at: new Date().toISOString(),
    safety: SAFETY_FLAGS,
    error,
  };
}

export async function fetchN8nData(action: N8nAction): Promise<N8nLiveResult> {
  if (!supabase) {
    return errorResult(
      action,
      'Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
    );
  }

  const { data, error } = await supabase.functions.invoke('n8n-read', {
    body: { action },
  });

  if (error) {
    return errorResult(action, error.message);
  }

  return data as N8nLiveResult;
}

export async function checkN8nHealth(): Promise<{ healthy: boolean; note: string }> {
  const result = await fetchN8nData('health');
  return {
    healthy: result.ok,
    note: result.ok
      ? 'n8n reachable via Edge Function'
      : (result.error ?? 'unreachable'),
  };
}
