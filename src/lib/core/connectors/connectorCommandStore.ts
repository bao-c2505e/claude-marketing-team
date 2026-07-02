// ---------------------------------------------------------------------------
// Connector Command Store — T4-13 (in-memory repository singleton)
// ---------------------------------------------------------------------------
// The cross-tab home for approval-gated connector command PREVIEW snapshots,
// implementing Option B of docs/core_connector_state_architecture.md:
//
//   • Writer: CoreV1FlowPanel, ONLY on an explicit Owner click
//     ("Share read-only previews with Connector Dashboard").
//   • Reader: ConnectorDashboard, read-on-mount (tabs never coexist).
//   • Holds AT MOST ONE validated ConnectorCommandSnapshot — plain data only.
//
// Deliberate properties:
//   • In-memory only. NOT persisted anywhere — a page refresh clears it, because
//     previews are derived from Owner approvals and must be rebuilt from the
//     current approval state, never replayed from a stale cache.
//   • Validates on write via the T4-12 contract guard; an invalid snapshot is
//     rejected and the store keeps its previous value.
//   • Defensive copies on write AND read — no caller can mutate stored data.
//   • Carries no callback, no URL, no secret, no capability of any kind. Reading
//     or writing this store never runs a connector and never marks anything as
//     more than an approval-gated, read-only preview.
//   • No React dependency — pure TypeScript module, unit-testable directly.
// ---------------------------------------------------------------------------

import type { ConnectorCommand } from './connectorCommand';
import type { GovernedConnectorKey } from './connectorGovernance';
import {
  validateConnectorCommandSnapshot,
  groupCommandsByConnector,
  type ConnectorCommandSnapshot,
  type ConnectorCommandSnapshotValidation,
} from './connectorCommandSnapshot';
import {
  getConnectorSnapshotAgeMs,
  getConnectorSnapshotFreshness,
  formatConnectorSnapshotAgeLabel,
  type ConnectorSnapshotFreshness,
} from './connectorCommandSnapshotFreshness';

/** Module-level singleton slot — at most one snapshot, newest write wins. */
let currentSnapshot: ConnectorCommandSnapshot | null = null;

/** Deep-enough copy: snapshot, commands array, and each command's nested objects. */
function copySnapshot(snapshot: ConnectorCommandSnapshot): ConnectorCommandSnapshot {
  return {
    ...snapshot,
    commands: snapshot.commands.map(cmd => ({
      ...cmd,
      safetyFlags: { ...cmd.safetyFlags },
      approvalEvidence: { ...cmd.approvalEvidence },
    })),
  };
}

/**
 * Accepts a snapshot ONLY when the approval-first integrity guard passes
 * (approved provenance, untampered safety flags, known lifecycle statuses,
 * matching campaign). On rejection the store is left unchanged. Stores a
 * defensive copy, so later mutation of the caller's snapshot cannot leak in.
 */
export function writeConnectorCommandSnapshot(
  snapshot: ConnectorCommandSnapshot,
): ConnectorCommandSnapshotValidation {
  const validation = validateConnectorCommandSnapshot(snapshot);
  if (validation.ok) {
    currentSnapshot = copySnapshot(snapshot);
  }
  return validation;
}

/** Defensive copy of the current snapshot, or null when nothing was shared. */
export function getConnectorCommandSnapshot(): ConnectorCommandSnapshot | null {
  return currentSnapshot ? copySnapshot(currentSnapshot) : null;
}

/**
 * The dashboard projection: current commands grouped by target connector
 * (defensive copies). Empty Map when nothing was shared.
 */
export function getConnectorCommandsByConnector(): Map<GovernedConnectorKey, ConnectorCommand[]> {
  return currentSnapshot
    ? groupCommandsByConnector(copySnapshot(currentSnapshot).commands)
    : new Map<GovernedConnectorKey, ConnectorCommand[]>();
}

// ---------------------------------------------------------------------------
// T4-14 — validation-on-read + freshness status.
// ---------------------------------------------------------------------------
// Defense in depth: write validation already makes a contract-invalid stored
// snapshot unreachable through this module's public API, but readers must not
// TRUST that — the dashboard consumes only the validated read path below, so
// even a future regression in the write path can never surface a tampered
// snapshot. Invalid data is never repaired, only withheld with a reason.

/**
 * Re-runs the approval-first integrity guard on the CURRENT snapshot before
 * returning it. A snapshot that no longer passes validation is NOT surfaced
 * (returns null) — it is never silently repaired. Defensive copy on return.
 */
export function getValidatedConnectorCommandSnapshot(): ConnectorCommandSnapshot | null {
  if (!currentSnapshot) return null;
  const validation = validateConnectorCommandSnapshot(currentSnapshot);
  return validation.ok ? copySnapshot(currentSnapshot) : null;
}

/**
 * The dashboard projection, gated by validation-on-read: commands grouped by
 * target connector, or an empty Map when nothing valid is available.
 */
export function getValidatedConnectorCommandsByConnector(): Map<GovernedConnectorKey, ConnectorCommand[]> {
  const snapshot = getValidatedConnectorCommandSnapshot();
  return snapshot
    ? groupCommandsByConnector(snapshot.commands)
    : new Map<GovernedConnectorKey, ConnectorCommand[]>();
}

/** Read-only status of the shared preview, for the dashboard provenance line. */
export interface ConnectorCommandSnapshotStatus {
  /** Whether anything was shared at all. */
  hasSnapshot: boolean;
  /** Whether the current snapshot still passes the integrity guard. */
  isValid: boolean;
  /** Freshness verdict (null when there is no snapshot to age). */
  freshness: ConnectorSnapshotFreshness | null;
  /** Human age label for the provenance line (null when no snapshot). */
  ageLabel: string | null;
  /** Why the preview is withheld or flagged; null when fresh and valid. */
  reason: string | null;
}

/**
 * One status object describing the shared preview: presence, integrity, and
 * freshness at the given clock reading (defaults to the caller's "now" —
 * pass `nowMs` explicitly for deterministic tests). Reading status never
 * changes the store and never runs anything.
 */
export function getConnectorCommandSnapshotStatus(
  nowMs: number = Date.now(),
): ConnectorCommandSnapshotStatus {
  if (!currentSnapshot) {
    return {
      hasSnapshot: false,
      isValid: false,
      freshness: null,
      ageLabel: null,
      reason: 'No read-only preview has been shared for dashboard review yet.',
    };
  }
  const validation = validateConnectorCommandSnapshot(currentSnapshot);
  if (!validation.ok) {
    return {
      hasSnapshot: true,
      isValid: false,
      freshness: null,
      ageLabel: null,
      reason: `Shared preview failed re-validation and is withheld: ${validation.issues.join('; ')}`,
    };
  }
  const freshness = getConnectorSnapshotFreshness(currentSnapshot, nowMs);
  const ageLabel = formatConnectorSnapshotAgeLabel(getConnectorSnapshotAgeMs(currentSnapshot, nowMs));
  let reason: string | null = null;
  if (freshness === 'stale') {
    reason = 'This preview may be stale. Rebuild from the current approval state before connector work.';
  } else if (freshness === 'invalid_timestamp') {
    reason = 'This preview has an unreadable build timestamp. Clear the preview and rebuild from the current approval state.';
  }
  return { hasSnapshot: true, isValid: true, freshness, ageLabel, reason };
}

/** Owner-facing clear — forget the shared previews. */
export function clearConnectorCommandSnapshot(): void {
  currentSnapshot = null;
}

/** Test isolation only — identical effect to clear, explicit name for intent. */
export function resetConnectorCommandStoreForTests(): void {
  currentSnapshot = null;
}
