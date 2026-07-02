// ---------------------------------------------------------------------------
// Connector Command Snapshot Contract — T4-12 (design-sprint contract only)
// ---------------------------------------------------------------------------
// The PURE data contract for how approval-gated connector command previews will
// travel from the Campaign Workspace flow (writer: CoreV1FlowPanel, on explicit
// Owner action) to the Connector Dashboard (reader: useConnectorDashboard) in
// T4-13, via an in-memory repository singleton (see
// docs/core_connector_state_architecture.md).
//
// THIS FILE IS NOT WIRED TO ANY UI OR STORE YET. It defines:
//   • ConnectorCommandSnapshot — the immutable, plain-data payload shape,
//   • createConnectorCommandSnapshot — pure constructor (defensive copy),
//   • validateConnectorCommandSnapshot — approval-first integrity guard,
//   • groupCommandsByConnector — pure grouping for the dashboard projection.
//
// Safety posture (same as connectorCommand.ts): a snapshot is a read-only
// handoff artifact. It carries no callback, no URL, no secret, and no execution
// capability — publishing a snapshot to the future store shares a PREVIEW, it
// never runs, posts, spends, or publishes anything. Deliberately NOT persisted
// across refresh: commands are derived from Owner approvals and must be rebuilt,
// never replayed from stale storage.
// ---------------------------------------------------------------------------

import type { ConnectorCommand } from './connectorCommand';
import { CONNECTOR_COMMAND_STATUSES } from './connectorCommand';
import type { GovernedConnectorKey } from './connectorGovernance';

/** Bump only with a migration note in docs/core_connector_state_architecture.md. */
export const CONNECTOR_COMMAND_SNAPSHOT_SCHEMA_VERSION = 1;

/**
 * The one payload shape the future cross-tab store accepts. Plain data only —
 * every command inside still carries its own hard-false/hard-true safety flags
 * and approval evidence.
 */
export interface ConnectorCommandSnapshot {
  schemaVersion: typeof CONNECTOR_COMMAND_SNAPSHOT_SCHEMA_VERSION;
  /** The single campaign every command in this snapshot belongs to. */
  sourceCampaignId: string;
  /** Actor label of the Owner action that built/shared the previews. */
  builtBy: string;
  /** ISO timestamp of the explicit Owner build action. */
  builtAt: string;
  commands: ConnectorCommand[];
}

export interface ConnectorCommandSnapshotValidation {
  ok: boolean;
  issues: string[];
}

export interface CreateConnectorCommandSnapshotParams {
  campaignId: string;
  builtBy: string;
  commands: ConnectorCommand[];
  /** Injectable clock for deterministic tests. */
  now?: Date;
}

/**
 * Pure constructor. Defensively copies the commands array so later mutation of
 * the caller's array can never change an already-created snapshot.
 */
export function createConnectorCommandSnapshot(
  params: CreateConnectorCommandSnapshotParams,
): ConnectorCommandSnapshot {
  const { campaignId, builtBy, commands, now } = params;
  return {
    schemaVersion: CONNECTOR_COMMAND_SNAPSHOT_SCHEMA_VERSION,
    sourceCampaignId: campaignId,
    builtBy,
    builtAt: (now ?? new Date()).toISOString(),
    commands: [...commands],
  };
}

/**
 * Approval-first integrity guard the future store MUST run before accepting a
 * snapshot (and readers MAY re-run before rendering). Rejects any snapshot where
 * a command:
 *   • belongs to a different campaign than the snapshot claims,
 *   • was not provably created from an Owner-approved asset,
 *   • carries a tampered safety flag (publish/live must stay false; gates true),
 *   • has a status outside the known lifecycle (there is NO 'published' status).
 * Pure — never throws, never mutates.
 */
export function validateConnectorCommandSnapshot(
  snapshot: ConnectorCommandSnapshot,
): ConnectorCommandSnapshotValidation {
  const issues: string[] = [];
  if (snapshot.schemaVersion !== CONNECTOR_COMMAND_SNAPSHOT_SCHEMA_VERSION) {
    issues.push(`unknown schemaVersion ${String(snapshot.schemaVersion)}`);
  }
  snapshot.commands.forEach((cmd, i) => {
    if (cmd.sourceCampaignId !== snapshot.sourceCampaignId) {
      issues.push(`commands[${i}] campaign mismatch: ${cmd.sourceCampaignId} ≠ ${snapshot.sourceCampaignId}`);
    }
    if (cmd.approvalEvidence?.createdFromApprovedAsset !== true) {
      issues.push(`commands[${i}] is not provably created from an approved asset`);
    }
    const f = cmd.safetyFlags;
    if (
      f?.publishesContent !== false ||
      f?.launchesAds !== false ||
      f?.spends !== false ||
      f?.autoRuns !== false ||
      f?.usesLiveConnector !== false
    ) {
      issues.push(`commands[${i}] has a tampered outward-capability flag (must all be false)`);
    }
    if (
      f?.requiresOwnerApproval !== true ||
      f?.requiresManualPublishingEvidence !== true ||
      f?.approvedNotPublished !== true
    ) {
      issues.push(`commands[${i}] has a tampered owner-gate flag (must all be true)`);
    }
    if (!CONNECTOR_COMMAND_STATUSES.includes(cmd.status)) {
      issues.push(`commands[${i}] has unknown status '${String(cmd.status)}'`);
    }
  });
  return { ok: issues.length === 0, issues };
}

/**
 * Group commands by their target connector — the pure projection the dashboard
 * reader feeds into `useConnectorDashboard(commandsByConnector)` (T4-10-C
 * surface). Keeps original order inside each bucket; empty input → empty Map.
 * Immutable — never mutates the input array or the commands.
 */
export function groupCommandsByConnector(
  commands: ConnectorCommand[],
): Map<GovernedConnectorKey, ConnectorCommand[]> {
  const grouped = new Map<GovernedConnectorKey, ConnectorCommand[]>();
  for (const cmd of commands) {
    const bucket = grouped.get(cmd.targetConnector);
    if (bucket) bucket.push(cmd);
    else grouped.set(cmd.targetConnector, [cmd]);
  }
  return grouped;
}
