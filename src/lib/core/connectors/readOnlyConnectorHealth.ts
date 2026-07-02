// readOnlyConnectorHealth.ts — T4-15
// Pure contract for the read-only connector health layer.
// This file describes health *results* only: no network, no storage, no React,
// no secret handling, no clock (checkedAt is always supplied by the caller,
// same convention as connectorCommandSnapshotFreshness.ts).
//
// Safety model: every result carries hard-false write capabilities
// (canWrite / canPublish / canRunAds are the literal type `false`) and the
// runtime assertion below rejects any value where those flags were forced
// truthy through a cast. A health check can only ever *look*.

export type ReadOnlyConnectorId = 'n8n' | 'google_drive' | 'canva';

export type ReadOnlyConnectorHealthStatus =
  | 'unknown'
  | 'available'
  | 'degraded'
  | 'blocked'
  | 'unavailable';

export type ReadOnlyConnectorMode =
  | 'mock'
  | 'sandbox'
  | 'edge_read_proxy'
  | 'manual_only';

export const READ_ONLY_CONNECTOR_IDS: readonly ReadOnlyConnectorId[] = [
  'n8n',
  'google_drive',
  'canva',
] as const;

export const READ_ONLY_CONNECTOR_HEALTH_STATUSES: readonly ReadOnlyConnectorHealthStatus[] = [
  'unknown',
  'available',
  'degraded',
  'blocked',
  'unavailable',
] as const;

export const READ_ONLY_CONNECTOR_MODES: readonly ReadOnlyConnectorMode[] = [
  'mock',
  'sandbox',
  'edge_read_proxy',
  'manual_only',
] as const;

/** Standing safety wording carried on every result. */
export const READ_ONLY_CONNECTOR_SAFETY_NOTE =
  'Read-only health check — no write, no publishing, no ad spend, no external mutation.';

export interface ReadOnlyConnectorHealthResult {
  connectorId: ReadOnlyConnectorId;
  label: string;
  status: ReadOnlyConnectorHealthStatus;
  mode: ReadOnlyConnectorMode;
  /** ISO timestamp supplied by the caller — this contract owns no clock. */
  checkedAt: string;
  /** Whether a read surface responded. Read is the ONLY capability modeled. */
  canRead: boolean;
  canWrite: false;
  canPublish: false;
  canRunAds: false;
  /** Which safe wrapper produced the result (e.g. 'n8nLiveService.checkN8nHealth'). */
  source: string;
  message: string;
  safetyNote: string;
  errorCode?: string;
}

/** Identity of one check — everything except the outcome fields. */
export interface ReadOnlyConnectorHealthBase {
  connectorId: ReadOnlyConnectorId;
  label: string;
  mode: ReadOnlyConnectorMode;
  checkedAt: string;
  source: string;
}

function buildResult(
  base: ReadOnlyConnectorHealthBase,
  status: ReadOnlyConnectorHealthStatus,
  canRead: boolean,
  message: string,
  errorCode?: string,
): ReadOnlyConnectorHealthResult {
  const result: ReadOnlyConnectorHealthResult = {
    connectorId: base.connectorId,
    label: base.label,
    status,
    mode: base.mode,
    checkedAt: base.checkedAt,
    canRead,
    canWrite: false,
    canPublish: false,
    canRunAds: false,
    source: base.source,
    message,
    safetyNote: READ_ONLY_CONNECTOR_SAFETY_NOTE,
    ...(errorCode !== undefined ? { errorCode } : {}),
  };
  return assertReadOnlyConnectorHealthResult(result);
}

/** A connector with no safe read surface in this repo — nothing was contacted. */
export function createBlockedConnectorHealthResult(
  base: ReadOnlyConnectorHealthBase,
  message: string,
  errorCode?: string,
): ReadOnlyConnectorHealthResult {
  return buildResult(base, 'blocked', false, message, errorCode);
}

/** A read-only surface responded successfully. */
export function createAvailableReadOnlyConnectorHealthResult(
  base: ReadOnlyConnectorHealthBase,
  message: string,
): ReadOnlyConnectorHealthResult {
  return buildResult(base, 'available', true, message);
}

/** A read-only surface responded but reported itself unhealthy. */
export function createDegradedReadOnlyConnectorHealthResult(
  base: ReadOnlyConnectorHealthBase,
  message: string,
  errorCode?: string,
): ReadOnlyConnectorHealthResult {
  return buildResult(base, 'degraded', false, message, errorCode ?? 'health_check_unhealthy');
}

/**
 * Normalize a thrown value from a health check into a degraded result.
 * Never rethrows — a failed *look* must not break the dashboard.
 */
export function normalizeConnectorHealthError(
  base: ReadOnlyConnectorHealthBase,
  error: unknown,
): ReadOnlyConnectorHealthResult {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string' && error.trim() !== ''
        ? error
        : 'Unknown health check failure';
  return buildResult(base, 'degraded', false, message, 'health_check_threw');
}

/**
 * Runtime guard: rejects any result whose write capabilities were forced
 * truthy (e.g. via `as unknown as` casts) or whose shape is not a valid
 * read-only health result. Returns the same object on success.
 */
export function assertReadOnlyConnectorHealthResult(
  result: ReadOnlyConnectorHealthResult,
): ReadOnlyConnectorHealthResult {
  const raw = result as unknown as Record<string, unknown>;
  if (raw.canWrite !== false || raw.canPublish !== false || raw.canRunAds !== false) {
    throw new Error(
      'Unsafe connector health result: canWrite/canPublish/canRunAds must be hard false.',
    );
  }
  if (!READ_ONLY_CONNECTOR_IDS.includes(result.connectorId)) {
    throw new Error(`Unknown read-only connector id: ${String(raw.connectorId)}`);
  }
  if (!READ_ONLY_CONNECTOR_HEALTH_STATUSES.includes(result.status)) {
    throw new Error(`Unknown health status: ${String(raw.status)}`);
  }
  if (!READ_ONLY_CONNECTOR_MODES.includes(result.mode)) {
    throw new Error(`Unknown connector mode: ${String(raw.mode)}`);
  }
  if (typeof result.checkedAt !== 'string' || result.checkedAt.trim() === '') {
    throw new Error('checkedAt must be a non-empty ISO string supplied by the caller.');
  }
  if (typeof result.canRead !== 'boolean') {
    throw new Error('canRead must be a boolean.');
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
