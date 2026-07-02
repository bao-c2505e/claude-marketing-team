// readOnlyConnectorPreview.ts — T4-16
// Pure contract for connector-specific READ-ONLY previews / read receipts.
// Same discipline as the T4-15 health contract: no network, no storage, no
// React, no secret handling, no clock (checkedAt is always supplied by the
// caller). A preview can only *describe* what a read surface returned — every
// result carries hard-false canWrite/canPublish/canRunAds/canExecute (literal
// `false` types) and the runtime assertion below rejects cast-forced values.

export type ReadOnlyPreviewConnectorId = 'n8n' | 'google_drive' | 'canva' | 'meta';

export type ReadOnlyConnectorPreviewStatus = 'available' | 'degraded' | 'blocked';

export type ReadOnlyConnectorPreviewMode = 'edge_read_proxy' | 'manual_only' | 'excluded';

export type ReadOnlyConnectorPreviewType =
  | 'n8n_workflows'
  | 'gdrive_files'
  | 'no_safe_read_surface';

export const READ_ONLY_PREVIEW_CONNECTOR_IDS: readonly ReadOnlyPreviewConnectorId[] = [
  'n8n',
  'google_drive',
  'canva',
  'meta',
] as const;

export const READ_ONLY_PREVIEW_STATUSES: readonly ReadOnlyConnectorPreviewStatus[] = [
  'available',
  'degraded',
  'blocked',
] as const;

export const READ_ONLY_PREVIEW_MODES: readonly ReadOnlyConnectorPreviewMode[] = [
  'edge_read_proxy',
  'manual_only',
  'excluded',
] as const;

export const READ_ONLY_PREVIEW_TYPES: readonly ReadOnlyConnectorPreviewType[] = [
  'n8n_workflows',
  'gdrive_files',
  'no_safe_read_surface',
] as const;

/** Hard cap on preview items — a preview is a receipt, not a data mirror. */
export const READ_ONLY_PREVIEW_MAX_ITEMS = 20;

/** Hard cap on any sanitized text field. */
export const READ_ONLY_PREVIEW_MAX_TEXT_LENGTH = 120;

/** Standing safety wording carried on every result. */
export const READ_ONLY_PREVIEW_SAFETY_NOTE =
  'Read-only preview — no write, no publishing, no ads spend, no execution, no external mutation.';

/**
 * A sanitized read-only item summary. Only these three scrubbed text fields
 * exist — raw connector payloads (workflow definitions, file contents,
 * credentials, links) can never pass through this shape.
 */
export interface ReadOnlyConnectorPreviewItem {
  id: string;
  name: string;
  summary: string;
}

export interface ReadOnlyConnectorPreviewResult {
  connectorId: ReadOnlyPreviewConnectorId;
  label: string;
  previewType: ReadOnlyConnectorPreviewType;
  status: ReadOnlyConnectorPreviewStatus;
  mode: ReadOnlyConnectorPreviewMode;
  /** ISO timestamp supplied by the caller — this contract owns no clock. */
  checkedAt: string;
  items: readonly ReadOnlyConnectorPreviewItem[];
  /** Which safe wrapper (or local decision) produced the result. */
  source: string;
  message: string;
  safetyNote: string;
  canWrite: false;
  canPublish: false;
  canRunAds: false;
  canExecute: false;
  errorCode?: string;
}

/** Identity of one preview check — everything except the outcome fields. */
export interface ReadOnlyConnectorPreviewBase {
  connectorId: ReadOnlyPreviewConnectorId;
  label: string;
  previewType: ReadOnlyConnectorPreviewType;
  mode: ReadOnlyConnectorPreviewMode;
  checkedAt: string;
  source: string;
}

// ─── Sanitization ────────────────────────────────────────────────────────────

const LINK_PATTERN = /https?:\/\/\S+/gi;

/**
 * Scrub one text value: strings only (numbers coerced), links redacted,
 * trimmed, hard-capped in length. Returns null when nothing safe remains.
 */
export function scrubReadOnlyPreviewText(value: unknown): string | null {
  const text =
    typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : typeof value === 'string'
        ? value
        : null;
  if (text === null) return null;
  const cleaned = text
    .replace(LINK_PATTERN, '[link removed]')
    .trim()
    .slice(0, READ_ONLY_PREVIEW_MAX_TEXT_LENGTH);
  return cleaned === '' ? null : cleaned;
}

/**
 * Sanitize one candidate item: only `id`, `name`, `summary` are read; every
 * other field on the candidate is dropped. Items without a safe id AND name
 * are rejected (null).
 */
export function sanitizeReadOnlyPreviewItem(raw: unknown): ReadOnlyConnectorPreviewItem | null {
  if (raw === null || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  const id = scrubReadOnlyPreviewText(candidate.id);
  const name = scrubReadOnlyPreviewText(candidate.name);
  if (!id || !name) return null;
  return { id, name, summary: scrubReadOnlyPreviewText(candidate.summary) ?? '' };
}

/** Sanitize a candidate list: invalid items dropped, count hard-capped. */
export function sanitizeReadOnlyPreviewItems(
  raw: readonly unknown[],
): ReadOnlyConnectorPreviewItem[] {
  const items: ReadOnlyConnectorPreviewItem[] = [];
  for (const candidate of raw) {
    if (items.length >= READ_ONLY_PREVIEW_MAX_ITEMS) break;
    const item = sanitizeReadOnlyPreviewItem(candidate);
    if (item) items.push(item);
  }
  return items;
}

// ─── Result creators ─────────────────────────────────────────────────────────

function buildResult(
  base: ReadOnlyConnectorPreviewBase,
  status: ReadOnlyConnectorPreviewStatus,
  items: readonly ReadOnlyConnectorPreviewItem[],
  message: string,
  errorCode?: string,
): ReadOnlyConnectorPreviewResult {
  const result: ReadOnlyConnectorPreviewResult = {
    connectorId: base.connectorId,
    label: base.label,
    previewType: base.previewType,
    status,
    mode: base.mode,
    checkedAt: base.checkedAt,
    items: Object.freeze(items.map(item => ({ ...item }))),
    source: base.source,
    message,
    safetyNote: READ_ONLY_PREVIEW_SAFETY_NOTE,
    canWrite: false,
    canPublish: false,
    canRunAds: false,
    canExecute: false,
    ...(errorCode !== undefined ? { errorCode } : {}),
  };
  return assertReadOnlyConnectorPreviewResult(result);
}

/** A read surface answered with sanitized items. */
export function createAvailableReadOnlyConnectorPreviewResult(
  base: ReadOnlyConnectorPreviewBase,
  items: readonly ReadOnlyConnectorPreviewItem[],
  message: string,
): ReadOnlyConnectorPreviewResult {
  return buildResult(base, 'available', items, message);
}

/** A read surface answered unhealthy/refusing — no items are shown. */
export function createDegradedReadOnlyConnectorPreviewResult(
  base: ReadOnlyConnectorPreviewBase,
  message: string,
  errorCode?: string,
): ReadOnlyConnectorPreviewResult {
  return buildResult(base, 'degraded', [], message, errorCode ?? 'preview_unhealthy');
}

/** No safe read surface exists — nothing was contacted, nothing is faked. */
export function createBlockedConnectorPreviewResult(
  base: ReadOnlyConnectorPreviewBase,
  message: string,
  errorCode?: string,
): ReadOnlyConnectorPreviewResult {
  return buildResult(base, 'blocked', [], message, errorCode);
}

/**
 * Normalize a thrown value from a preview check into a degraded result.
 * Never rethrows — a failed *look* must not break the dashboard.
 */
export function normalizeConnectorPreviewError(
  base: ReadOnlyConnectorPreviewBase,
  error: unknown,
): ReadOnlyConnectorPreviewResult {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string' && error.trim() !== ''
        ? error
        : 'Unknown preview check failure';
  return buildResult(base, 'degraded', [], message, 'preview_check_threw');
}

// ─── Runtime assertion ───────────────────────────────────────────────────────

/**
 * Runtime guard: rejects any result whose capabilities were forced truthy
 * (e.g. via `as unknown as` casts) or whose shape is not a valid read-only
 * preview result. Returns the same object on success.
 */
export function assertReadOnlyConnectorPreviewResult(
  result: ReadOnlyConnectorPreviewResult,
): ReadOnlyConnectorPreviewResult {
  const raw = result as unknown as Record<string, unknown>;
  if (
    raw.canWrite !== false ||
    raw.canPublish !== false ||
    raw.canRunAds !== false ||
    raw.canExecute !== false
  ) {
    throw new Error(
      'Unsafe connector preview result: canWrite/canPublish/canRunAds/canExecute must be hard false.',
    );
  }
  if (!READ_ONLY_PREVIEW_CONNECTOR_IDS.includes(result.connectorId)) {
    throw new Error(`Unknown preview connector id: ${String(raw.connectorId)}`);
  }
  if (!READ_ONLY_PREVIEW_STATUSES.includes(result.status)) {
    throw new Error(`Unknown preview status: ${String(raw.status)}`);
  }
  if (!READ_ONLY_PREVIEW_MODES.includes(result.mode)) {
    throw new Error(`Unknown preview mode: ${String(raw.mode)}`);
  }
  if (!READ_ONLY_PREVIEW_TYPES.includes(result.previewType)) {
    throw new Error(`Unknown preview type: ${String(raw.previewType)}`);
  }
  if (typeof result.checkedAt !== 'string' || result.checkedAt.trim() === '') {
    throw new Error('checkedAt must be a non-empty ISO string supplied by the caller.');
  }
  if (!Array.isArray(result.items)) {
    throw new Error('items must be an array.');
  }
  if (result.items.length > READ_ONLY_PREVIEW_MAX_ITEMS) {
    throw new Error(`items must not exceed ${READ_ONLY_PREVIEW_MAX_ITEMS}.`);
  }
  for (const item of result.items) {
    if (
      typeof item.id !== 'string' || item.id.trim() === '' ||
      typeof item.name !== 'string' || item.name.trim() === '' ||
      typeof item.summary !== 'string'
    ) {
      throw new Error('Every preview item must be a sanitized { id, name, summary } summary.');
    }
  }
  if (typeof result.label !== 'string' || result.label.trim() === '') {
    throw new Error('label must be a non-empty string.');
  }
  if (typeof result.source !== 'string' || result.source.trim() === '') {
    throw new Error('source must be a non-empty string.');
  }
  if (typeof result.message !== 'string') {
    throw new Error('message must be a string.');
  }
  if (typeof result.safetyNote !== 'string' || result.safetyNote.trim() === '') {
    throw new Error('safetyNote must be a non-empty string.');
  }
  return result;
}
