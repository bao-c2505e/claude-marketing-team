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

/** Owner-facing clear — forget the shared previews. */
export function clearConnectorCommandSnapshot(): void {
  currentSnapshot = null;
}

/** Test isolation only — identical effect to clear, explicit name for intent. */
export function resetConnectorCommandStoreForTests(): void {
  currentSnapshot = null;
}
