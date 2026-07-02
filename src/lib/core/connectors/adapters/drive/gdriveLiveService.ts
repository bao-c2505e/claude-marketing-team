// gdriveLiveService.ts — T4-7 (health) + T4-17 (read-only file list)
// Calls the gdrive-read Supabase Edge Function. Read-only. No writes, no
// uploads, no content reads, no sharing changes. No credentials in this file —
// GDRIVE_SERVICE_ACCOUNT_JSON lives server-side in the Supabase vault.

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
      ? 'gdrive-read Edge Function reachable (read-only proxy)'
      : (result.error ?? 'unreachable'),
  };
}

// ── T4-17: read-only file-list surface ───────────────────────────────────────

/** Hard cap mirrored from the Edge Function — a preview, not a data mirror. */
export const GDRIVE_FILE_LIST_MAX_ITEMS = 20;

/**
 * The ONLY file shape this wrapper can return — whitelisted metadata rebuilt
 * field by field. Contents, download or export links, sharing permissions, and
 * owner identities are unrepresentable here.
 */
export interface GdriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
}

export interface GdriveFileListResult {
  ok: boolean;
  files: GdriveFileSummary[];
  note: string;
  error?: string;
}

/**
 * Defense in depth: the Edge Function already whitelists fields, but the raw
 * payload is re-sanitized here — every summary is rebuilt from scratch, so an
 * unexpected upstream field can never reach the UI. Invalid entries are
 * dropped; the list is hard-capped.
 */
export function sanitizeGdriveFileSummaries(raw: unknown): GdriveFileSummary[] {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(payload.files) ? payload.files : [];
  const files: GdriveFileSummary[] = [];
  for (const entry of list) {
    if (files.length >= GDRIVE_FILE_LIST_MAX_ITEMS) break;
    const file = (entry ?? {}) as Record<string, unknown>;
    if (typeof file.id !== 'string' || file.id.trim() === '') continue;
    if (typeof file.name !== 'string' || file.name.trim() === '') continue;
    files.push({
      id: file.id,
      name: file.name,
      mimeType: typeof file.mimeType === 'string' ? file.mimeType : 'unknown',
      modifiedTime: typeof file.modifiedTime === 'string' ? file.modifiedTime : null,
      size: typeof file.size === 'string' ? file.size : null,
    });
  }
  return files;
}

/**
 * Read-only file-list read receipt via the gdrive-read Edge Function
 * ('list_files' action — GET-only, drive.readonly scope, metadata only).
 * Errors come back as `ok: false` results, never as throws.
 */
export async function listGdriveFilesReadOnly(): Promise<GdriveFileListResult> {
  const result = await fetchGdriveData('list_files');
  if (!result.ok) {
    return {
      ok: false,
      files: [],
      note: 'gdrive-read list_files unavailable',
      error: result.error ?? 'gdrive-read list_files failed',
    };
  }
  const files = sanitizeGdriveFileSummaries(result.data);
  return {
    ok: true,
    files,
    note: `${files.length} file(s) visible via gdrive-read (sanitized metadata only, read-only)`,
  };
}
