// gdrive-read — Supabase Edge Function (Deno runtime)
// Phase 2 (T4-17): read-only allowlist — 'health' + 'list_files'.
//
// list_files is METADATA-ONLY and READ-ONLY:
//   • Google Drive v3 files.list via GET with the drive.readonly scope.
//   • Server-side field whitelist: files(id,name,mimeType,modifiedTime,size).
//   • Hard cap of 20 files, sanitized again before responding.
//   • No file contents, no download or export paths, no sharing data,
//     no create, no update, no delete, no upload — those endpoints are never
//     called and the readonly scope could not authorize them anyway.
//
// Credentials (GDRIVE_SERVICE_ACCOUNT_JSON) come from the Supabase vault —
// never from the repo — and are never echoed back: error responses carry
// fixed messages or HTTP status codes only, never raw upstream bodies.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SAFETY = {
  allow_write:   false,
  allow_publish: false,
  allow_spend:   false,
} as const;

const ALLOWED_ACTIONS = ['health', 'list_files'] as const;

const MAX_FILES = 20;
const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const FILES_LIST_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const FILE_FIELD_WHITELIST = 'files(id,name,mimeType,modifiedTime,size)';

// ── Service-account auth (read-only scope) ───────────────────────────────────

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeJwtSegment(value: unknown): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function pemToDer(pem: string): Uint8Array {
  // Strip the standard PEM envelope markers, keep only the base64 body.
  const body = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function mintReadOnlyAccessToken(serviceAccountJson: string): Promise<string> {
  let clientEmail: string;
  let privateKeyPem: string;
  try {
    const parsed = JSON.parse(serviceAccountJson) as {
      client_email?: string;
      private_key?: string;
    };
    if (typeof parsed.client_email !== 'string' || typeof parsed.private_key !== 'string') {
      throw new Error('incomplete');
    }
    clientEmail = parsed.client_email;
    privateKeyPem = parsed.private_key;
  } catch {
    // Fixed message — never echo credential material or parse details.
    throw new Error('service account credentials unreadable or incomplete');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const unsignedJwt =
    `${encodeJwtSegment({ alg: 'RS256', typ: 'JWT' })}.` +
    encodeJwtSegment({
      iss: clientEmail,
      scope: DRIVE_READONLY_SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    });

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsignedJwt)),
  );
  const assertion = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  // This POST is the standard OAuth2 token handshake — authentication only.
  // It reads and writes no Drive data, and the scope it requests is read-only.
  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!resp.ok) {
    // Status code only — never the upstream body.
    throw new Error(`token exchange failed (status ${resp.status})`);
  }
  const json = await resp.json();
  if (typeof json?.access_token !== 'string' || json.access_token === '') {
    throw new Error('token exchange returned no usable token');
  }
  return json.access_token;
}

// ── files.list (GET, metadata only, sanitized) ───────────────────────────────

interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
}

function sanitizeDriveFile(raw: unknown): DriveFileSummary | null {
  const file = (raw ?? {}) as Record<string, unknown>;
  if (typeof file.id !== 'string' || file.id === '') return null;
  if (typeof file.name !== 'string' || file.name === '') return null;
  return {
    id: file.id,
    name: file.name,
    mimeType: typeof file.mimeType === 'string' ? file.mimeType : 'unknown',
    modifiedTime: typeof file.modifiedTime === 'string' ? file.modifiedTime : null,
    size: typeof file.size === 'string' ? file.size : null,
  };
}

async function listDriveFilesReadOnly(): Promise<DriveFileSummary[]> {
  const serviceAccountJson = Deno.env.get('GDRIVE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    throw new Error('GDRIVE_SERVICE_ACCOUNT_JSON not configured in Supabase vault');
  }
  const accessToken = await mintReadOnlyAccessToken(serviceAccountJson);

  const query = new URLSearchParams({
    pageSize: String(MAX_FILES),
    orderBy: 'modifiedTime desc',
    fields: FILE_FIELD_WHITELIST,
  });
  const resp = await fetch(`${FILES_LIST_ENDPOINT}?${query.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    // Status code only — never the upstream body.
    throw new Error(`Drive files.list failed (status ${resp.status})`);
  }
  const json = await resp.json();
  const rawFiles = Array.isArray(json?.files) ? json.files : [];

  const files: DriveFileSummary[] = [];
  for (const raw of rawFiles) {
    if (files.length >= MAX_FILES) break;
    const sanitized = sanitizeDriveFile(raw);
    if (sanitized) files.push(sanitized);
  }
  return files;
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action: string = body?.action ?? 'health';

    if (!(ALLOWED_ACTIONS as readonly string[]).includes(action)) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `action '${action}' not allowed. Read-only actions: ${ALLOWED_ACTIONS.join(', ')}.`,
          safety: SAFETY,
          fetched_at: new Date().toISOString(),
        }),
        { status: 403, headers: jsonHeaders },
      );
    }

    if (action === 'health') {
      return new Response(
        JSON.stringify({
          ok: true,
          action: 'health',
          note: 'gdrive-read Edge Function healthy. Phase 2 — read-only list_files available when vault credentials are set.',
          fetched_at: new Date().toISOString(),
          safety: SAFETY,
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    // action === 'list_files'
    try {
      const files = await listDriveFilesReadOnly();
      return new Response(
        JSON.stringify({
          ok: true,
          action: 'list_files',
          data: { files, count: files.length },
          note: 'read-only files.list — drive.readonly scope, sanitized metadata only',
          fetched_at: new Date().toISOString(),
          safety: SAFETY,
        }),
        { status: 200, headers: jsonHeaders },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          ok: false,
          action: 'list_files',
          error: err instanceof Error ? err.message : 'unknown error',
          safety: SAFETY,
          fetched_at: new Date().toISOString(),
        }),
        { status: 200, headers: jsonHeaders },
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : 'unknown error',
        safety: SAFETY,
        fetched_at: new Date().toISOString(),
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
