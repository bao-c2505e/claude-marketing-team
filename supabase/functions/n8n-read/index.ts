// n8n-read — Supabase Edge Function (Deno runtime)
// READ-ONLY proxy to n8n API. No writes, no triggers, no spend.
// Credentials are read from Supabase vault — never from repo.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ENDPOINTS: Record<string, string> = {
  health:     '/healthz',
  workflows:  '/api/v1/workflows?active=true&limit=20',
  executions: '/api/v1/executions?limit=10',
};

const SAFETY = {
  allow_write:   false,
  allow_publish: false,
  allow_spend:   false,
} as const;

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action: string = body?.action ?? 'health';

    if (!ALLOWED_ENDPOINTS[action]) {
      return new Response(
        JSON.stringify({ ok: false, error: `action '${action}' not allowed` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const n8nBaseUrl = Deno.env.get('N8N_BASE_URL');
    const n8nApiKey  = Deno.env.get('N8N_API_KEY');

    if (!n8nBaseUrl || !n8nApiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          action,
          error: 'N8N_BASE_URL or N8N_API_KEY not configured in Supabase vault',
          safety: SAFETY,
          fetched_at: new Date().toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = `${n8nBaseUrl}${ALLOWED_ENDPOINTS[action]}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': n8nApiKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await resp.json();

    return new Response(
      JSON.stringify({
        ok: resp.ok,
        action,
        data,
        fetched_at: new Date().toISOString(),
        safety: SAFETY,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : 'unknown error',
        safety: SAFETY,
        fetched_at: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
