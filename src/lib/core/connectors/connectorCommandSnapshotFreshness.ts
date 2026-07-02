// ---------------------------------------------------------------------------
// Connector Command Snapshot Freshness — T4-14 (pure helpers, no side effects)
// ---------------------------------------------------------------------------
// Pure functions that answer ONE question about a shared read-only preview
// snapshot: "how old is it, and can the dashboard still trust it as current?"
//
//   • A snapshot is a read-only preview derived from Owner approvals at build
//     time. The older it gets, the more likely the approval state has moved on,
//     so an old snapshot is flagged as a STALE PREVIEW that the Owner should
//     rebuild from the current approval state.
//   • Pure TypeScript only — no React, no storage, no network, no side effects.
//     The clock is ALWAYS injected as `nowMs`; nothing here reads the system
//     clock itself, so every result is deterministic and unit-testable.
//   • Freshness is advisory metadata for dashboard review. It never runs a
//     connector, never changes a command, and never repairs a bad snapshot.
// ---------------------------------------------------------------------------

import type { ConnectorCommandSnapshot } from './connectorCommandSnapshot';

/**
 * Default maximum age before a shared preview is flagged as a stale preview
 * (24 hours). Injectable per call — this is only the default.
 */
export const CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Freshness verdict for a shared snapshot:
 *   fresh             — built recently enough to review as-is,
 *   stale             — older than the threshold; rebuild from the current
 *                       approval state before any connector work,
 *   invalid_timestamp — builtAt cannot be parsed; age is unknowable, treat
 *                       with the same caution as stale.
 */
export type ConnectorSnapshotFreshness = 'fresh' | 'stale' | 'invalid_timestamp';

/**
 * Parse the snapshot's `builtAt` provenance timestamp into epoch milliseconds.
 * Returns null when the value is missing or not a parseable date — never throws.
 */
export function parseSnapshotBuiltAt(
  snapshot: Pick<ConnectorCommandSnapshot, 'builtAt'>,
): number | null {
  if (typeof snapshot.builtAt !== 'string' || snapshot.builtAt.length === 0) return null;
  const ms = Date.parse(snapshot.builtAt);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Age of the snapshot in milliseconds at the injected `nowMs` clock reading.
 * A builtAt in the future (clock skew) clamps to 0 rather than going negative —
 * skew must never crash the dashboard or mark a just-built preview stale.
 * Returns null when builtAt is unparseable.
 */
export function getConnectorSnapshotAgeMs(
  snapshot: Pick<ConnectorCommandSnapshot, 'builtAt'>,
  nowMs: number,
): number | null {
  const builtAtMs = parseSnapshotBuiltAt(snapshot);
  if (builtAtMs === null) return null;
  return Math.max(0, nowMs - builtAtMs);
}

/**
 * Freshness verdict at the injected clock reading. Boundary rule: a snapshot
 * is fresh strictly UNDER the threshold; at exactly `maxAgeMs` it is already
 * a stale preview (erring toward "rebuild from current approval state").
 */
export function getConnectorSnapshotFreshness(
  snapshot: Pick<ConnectorCommandSnapshot, 'builtAt'>,
  nowMs: number,
  maxAgeMs: number = CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS,
): ConnectorSnapshotFreshness {
  const ageMs = getConnectorSnapshotAgeMs(snapshot, nowMs);
  if (ageMs === null) return 'invalid_timestamp';
  return ageMs < maxAgeMs ? 'fresh' : 'stale';
}

/**
 * Conservative staleness check: true unless the snapshot is PROVABLY fresh.
 * Both 'stale' and 'invalid_timestamp' count as stale — an unknowable age can
 * never justify trusting a preview as current.
 */
export function isConnectorSnapshotStale(
  snapshot: Pick<ConnectorCommandSnapshot, 'builtAt'>,
  nowMs: number,
  maxAgeMs: number = CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS,
): boolean {
  return getConnectorSnapshotFreshness(snapshot, nowMs, maxAgeMs) !== 'fresh';
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Human-readable age label for the dashboard provenance line.
 * null (unparseable builtAt) → 'unknown age'; negative input clamps to 0.
 */
export function formatConnectorSnapshotAgeLabel(ageMs: number | null): string {
  if (ageMs === null) return 'unknown age';
  const age = Math.max(0, ageMs);
  if (age < MINUTE_MS) return 'just now';
  if (age < HOUR_MS) {
    const m = Math.floor(age / MINUTE_MS);
    return `${m} minute${m === 1 ? '' : 's'} ago`;
  }
  if (age < DAY_MS) {
    const h = Math.floor(age / HOUR_MS);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  const d = Math.floor(age / DAY_MS);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}
