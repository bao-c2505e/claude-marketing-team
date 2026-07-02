// ---------------------------------------------------------------------------
// Connector Command Handoff (CORE V1 Integration Closure) — pure, local/demo
// ---------------------------------------------------------------------------
// The bridge between an Owner-APPROVED campaign asset and the connector layer. It
// turns approved deliverables into approval-gated CONNECTOR COMMAND previews — a
// handoff artifact that says "this asset is ready to be run through connector X"
// WITHOUT ever running it. A connector command is NOT a publish action:
//
//   • CORE runs no connector here. Building a command reads existing approved
//     items and returns plain objects — no fetch / axios / OAuth / webhook / URL /
//     secret / env, no live connector call, no persistence, no network.
//   • A connector command NEVER equals Published. Every command carries hard-false
//     safety flags (publishesContent / launchesAds / spends / autoRuns /
//     usesLiveConnector) and a hard-true `requiresManualPublishingEvidence`, so a
//     command — even a `simulated` or `approved_for_manual_run` one — can only ever
//     be a step toward a MANUAL publish the Owner records separately (Phase V).
//   • A command is built ONLY from an approved asset (it carries the approval
//     evidence). `createdFromApprovedAsset` is a hard `true`.
//   • Every command carries the verbatim copy "This command does not publish
//     content by itself."
//
// See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output Status Model — published /
// launched are never set here), §7 (Connector Roadmap — approval-gated, future-only).
// ---------------------------------------------------------------------------

import { generateId } from '../coreData';
import type { ModuleKey } from '../approvalClassify';
import { MODULE_META } from '../approvalClassify';
import type { CampaignPackItem } from '../campaignPack';
import type { GovernedConnectorKey } from './connectorGovernance';
import { getConnectorGovernance } from './connectorGovernance';

// ---------------------------------------------------------------------------
// Verbatim safety copy — one source of truth for the panel + tests.
// ---------------------------------------------------------------------------

/** Required, visible on every connector command. */
export const CONNECTOR_COMMAND_DOES_NOT_PUBLISH =
  'This command does not publish content by itself.';

/** Approved ≠ Published stays explicit on the handoff. */
export const CONNECTOR_COMMAND_APPROVED_NOT_PUBLISHED =
  'Approved ≠ Published — a connector command is an approval-gated handoff, not a publish action.';

/** A connector run/simulation is still not Published without Owner manual evidence. */
export const CONNECTOR_COMMAND_REQUIRES_EVIDENCE =
  'A connector command being run or simulated is NOT Published — the Owner must still record manual publishing evidence.';

/** Full standing safety note carried on the command list + copied text. */
export const CONNECTOR_COMMAND_SAFETY_NOTE =
  'Connector commands are local/demo, approval-gated handoff previews only. CORE runs no connector, ' +
  'publishes nothing, launches no ads, spends nothing, calls no live connector, and opens no external endpoint. ' +
  'Published is only ever an Owner manual record recorded separately.';

/** Local/demo provenance badges shown on the panel. */
export const CONNECTOR_COMMAND_LOCAL_ONLY_BADGES: string[] = [
  'Local/demo only',
  'Approval-gated handoff',
  'Does not publish',
  'No live connector',
];

// ---------------------------------------------------------------------------
// Status + safety-flag contracts.
// ---------------------------------------------------------------------------

/**
 * Lifecycle of a connector command. NONE of these means "published":
 *   draft                  — created, not yet offered to the Owner,
 *   ready_for_owner        — presented for the Owner to review,
 *   approved_for_manual_run— Owner marked it OK to run manually (still not published),
 *   simulated              — a dry-run/sandbox preview was produced (still not published),
 *   blocked                — cannot proceed (e.g. connector live-blocked / missing evidence path).
 */
export type ConnectorCommandStatus =
  | 'draft'
  | 'ready_for_owner'
  | 'approved_for_manual_run'
  | 'simulated'
  | 'blocked';

export const CONNECTOR_COMMAND_STATUSES: ConnectorCommandStatus[] = [
  'draft',
  'ready_for_owner',
  'approved_for_manual_run',
  'simulated',
  'blocked',
];

export const CONNECTOR_COMMAND_STATUS_LABEL: Record<ConnectorCommandStatus, string> = {
  draft:                   'Draft',
  ready_for_owner:         'Ready for Owner',
  approved_for_manual_run: 'Approved for manual run',
  simulated:               'Simulated (dry-run)',
  blocked:                 'Blocked',
};

export const CONNECTOR_COMMAND_STATUS_COLOR: Record<ConnectorCommandStatus, string> = {
  draft:                   '#94a3b8',
  ready_for_owner:         '#60a5fa',
  approved_for_manual_run: '#fbbf24',
  simulated:               '#22d3ee',
  blocked:                 '#f87171',
};

/** Every outward-facing capability is a hard `false`; the Owner gates are hard `true`. */
export interface ConnectorCommandSafetyFlags {
  publishesContent: false;
  launchesAds: false;
  spends: false;
  autoRuns: false;
  usesLiveConnector: false;
  requiresOwnerApproval: true;
  requiresManualPublishingEvidence: true;
  approvedNotPublished: true;
}

/** The single immutable safety-flag object every command carries. */
export const CONNECTOR_COMMAND_SAFETY_FLAGS: ConnectorCommandSafetyFlags = {
  publishesContent: false,
  launchesAds: false,
  spends: false,
  autoRuns: false,
  usesLiveConnector: false,
  requiresOwnerApproval: true,
  requiresManualPublishingEvidence: true,
  approvedNotPublished: true,
};

/** Proof a command was built from an APPROVED asset (never from a draft/pending item). */
export interface ConnectorCommandApprovalEvidence {
  approvalId: string;
  approvedBy: string;
  approvedAt: string | null;
  createdFromApprovedAsset: true;
}

export interface ConnectorCommand {
  id: string;
  sourceCampaignId: string;
  /** The approved content item this command hands off. */
  sourceAssetId: string;
  /** The approval request id (also the approval-evidence key). */
  sourceApprovalId: string;
  sourceAssetType: ModuleKey;
  sourceAssetTypeLabel: string;
  sourceAssetTitle: string;
  targetConnector: GovernedConnectorKey;
  targetConnectorLabel: string;
  status: ConnectorCommandStatus;
  safetyFlags: ConnectorCommandSafetyFlags;
  approvalEvidence: ConnectorCommandApprovalEvidence;
  /** Human note — always includes the "does not publish" copy. */
  note: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Target connectors — labels come from the governance matrix (all live-blocked).
// ---------------------------------------------------------------------------

/** Governed connectors that can be offered as a command target. */
export const CONNECTOR_COMMAND_TARGETS: GovernedConnectorKey[] = [
  'canva',
  'meta',
  'tiktok',
  'zalo',
  'google_ads',
  'google_drive',
  'google_sheets',
  'n8n',
];

export function connectorTargetLabel(key: GovernedConnectorKey): string {
  return getConnectorGovernance(key)?.displayName ?? key;
}

/**
 * A SUGGESTED default target connector for a module. This is a convenience only —
 * the Owner always chooses the real target — and it never implies the connector
 * is live (all connectors are live-blocked).
 */
export function suggestConnectorForModule(module: ModuleKey): GovernedConnectorKey {
  switch (module) {
    case 'design':  return 'canva';
    case 'ads':     return 'meta';
    case 'video':   return 'tiktok';
    case 'report':  return 'google_sheets';
    case 'content': return 'n8n';
    default:        return 'n8n';
  }
}

// ---------------------------------------------------------------------------
// Build — approved asset → connector command preview.
// ---------------------------------------------------------------------------

export interface BuildConnectorCommandParams {
  campaignId: string;
  /** Approved deliverables (already filtered to status `approved` by campaignPack). */
  items: CampaignPackItem[];
  targetConnector: GovernedConnectorKey;
  /** Default lifecycle status for the built commands (default `ready_for_owner`). */
  defaultStatus?: ConnectorCommandStatus;
  /** Injectable clock for deterministic tests. */
  now?: Date;
  /** Injectable id prefix generator for deterministic tests. */
  idFor?: (index: number) => string;
}

function commandNote(assetTitle: string): string {
  return `Approval-gated handoff for "${assetTitle}". ${CONNECTOR_COMMAND_DOES_NOT_PUBLISH} ${CONNECTOR_COMMAND_REQUIRES_EVIDENCE}`;
}

/**
 * Build ONE connector command from an approved deliverable. Pure — clones the
 * immutable safety flags so a per-command object can never re-enable a live/publish
 * capability. `createdFromApprovedAsset` and the approval evidence are always set,
 * so a command is provably tied to an Owner approval.
 */
export function buildConnectorCommandForItem(
  campaignId: string,
  item: CampaignPackItem,
  targetConnector: GovernedConnectorKey,
  opts: { status?: ConnectorCommandStatus; now?: Date; id?: string } = {},
): ConnectorCommand {
  const now = opts.now ?? new Date();
  return {
    id: opts.id ?? generateId('conncmd'),
    sourceCampaignId: campaignId,
    sourceAssetId: item.contentItemId,
    sourceApprovalId: item.approvalId,
    sourceAssetType: item.module,
    sourceAssetTypeLabel: MODULE_META[item.module].label,
    sourceAssetTitle: item.title,
    targetConnector,
    targetConnectorLabel: connectorTargetLabel(targetConnector),
    status: opts.status ?? 'ready_for_owner',
    // Clone so no command shares a mutable reference with the shared constant.
    safetyFlags: { ...CONNECTOR_COMMAND_SAFETY_FLAGS },
    approvalEvidence: {
      approvalId: item.approvalId,
      approvedBy: item.provenance?.actorLabel ?? 'Owner',
      approvedAt: item.provenance?.at ?? null,
      createdFromApprovedAsset: true,
    },
    note: commandNote(item.title),
    createdAt: now.toISOString(),
  };
}

/**
 * Build connector command previews for a set of APPROVED deliverables. The input
 * items are already approved-only (produced by `collectCampaignPackItems`), so
 * every resulting command is created from an approved asset. Pure & deterministic.
 */
export function buildConnectorCommands(params: BuildConnectorCommandParams): ConnectorCommand[] {
  const { campaignId, items, targetConnector, defaultStatus = 'ready_for_owner', now, idFor } = params;
  return items.map((item, index) =>
    buildConnectorCommandForItem(campaignId, item, targetConnector, {
      status: defaultStatus,
      now,
      id: idFor ? idFor(index) : undefined,
    }),
  );
}

// ---------------------------------------------------------------------------
// Transitions + predicates — status can change, safety flags never do.
// ---------------------------------------------------------------------------

/**
 * Return a NEW command with a changed lifecycle status. The safety flags are
 * re-asserted from the immutable constant on every transition, so advancing to
 * `simulated` or `approved_for_manual_run` can NEVER flip a publish/live flag on.
 * Pure — never mutates the input command.
 */
export function setConnectorCommandStatus(
  command: ConnectorCommand,
  status: ConnectorCommandStatus,
): ConnectorCommand {
  return {
    ...command,
    status,
    safetyFlags: { ...CONNECTOR_COMMAND_SAFETY_FLAGS },
  };
}

/**
 * A connector command NEVER implies Published — hard `false` for every command in
 * every status. Encodes the invariant "Connector command ≠ Published" and
 * "Connector executed/simulated ≠ Published".
 */
export function connectorCommandImpliesPublished(_command: ConnectorCommand): false {
  return false;
}

/**
 * A connector command ALWAYS still requires the Owner to record separate manual
 * publishing evidence before anything can be treated as Published. Hard `true`.
 */
export function connectorCommandRequiresManualEvidence(command: ConnectorCommand): boolean {
  return command.safetyFlags.requiresManualPublishingEvidence === true;
}

// ---------------------------------------------------------------------------
// Summary + render.
// ---------------------------------------------------------------------------

export interface ConnectorCommandSummary {
  total: number;
  byStatus: Record<ConnectorCommandStatus, number>;
  readyForOwner: number;
  blocked: number;
  /** Hard `false` — no command ever publishes. */
  anyPublishes: false;
}

export function summarizeConnectorCommands(commands: ConnectorCommand[]): ConnectorCommandSummary {
  const byStatus: Record<ConnectorCommandStatus, number> = {
    draft: 0, ready_for_owner: 0, approved_for_manual_run: 0, simulated: 0, blocked: 0,
  };
  for (const c of commands) byStatus[c.status] += 1;
  return {
    total: commands.length,
    byStatus,
    readyForOwner: byStatus.ready_for_owner,
    blocked: byStatus.blocked,
    anyPublishes: false,
  };
}

/** Copyable plain-text render. Emits no URL/link; touches nothing. */
export function renderConnectorCommandsText(
  commands: ConnectorCommand[],
  title = 'Connector Command Handoff',
): string {
  const lines: string[] = [];
  lines.push(`CONNECTOR COMMAND HANDOFF (LOCAL/DEMO) — ${title}`);
  lines.push(CONNECTOR_COMMAND_DOES_NOT_PUBLISH);
  lines.push(CONNECTOR_COMMAND_APPROVED_NOT_PUBLISHED);
  lines.push('');
  if (commands.length === 0) {
    lines.push('(No approved assets — approve deliverables first to create connector commands.)');
  } else {
    lines.push('COMMANDS');
    for (const c of commands) {
      lines.push(`- [${CONNECTOR_COMMAND_STATUS_LABEL[c.status]}] ${c.sourceAssetTypeLabel} → ${c.targetConnectorLabel}: ${c.sourceAssetTitle}`);
      lines.push(`    from approved asset ${c.sourceApprovalId} (approved by ${c.approvalEvidence.approvedBy})`);
      lines.push(`    ${CONNECTOR_COMMAND_DOES_NOT_PUBLISH}`);
    }
  }
  lines.push('');
  lines.push('SAFETY');
  lines.push(`- ${CONNECTOR_COMMAND_SAFETY_NOTE}`);
  lines.push(`- ${CONNECTOR_COMMAND_REQUIRES_EVIDENCE}`);
  return lines.join('\n');
}
