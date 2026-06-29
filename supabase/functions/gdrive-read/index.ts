// gdrive-read — Supabase Edge Function (Deno runtime)
// Phase 1: health-only. No Google API call. No OAuth.
// T4-8+: will add real Drive read when GDRIVE_SERVICE_ACCOUNT_JSON is in vault.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

    if (action !== 'health') {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `action '${action}' not supported in Phase 1. Only 'health' is allowed.`,
          safety: SAFETY,
          fetched_at: new Date().toISOString(),
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        action: 'health',
        note: 'gdrive-read Edge Function healthy. Phase 1 — no Google API call yet.',
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
