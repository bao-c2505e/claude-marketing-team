// Connector Activation Owner Sign-off — STATIC CONTRACT (no live behaviour)
// ---------------------------------------------------------------------------
// Phase I-S7 — Connector Activation Runbook & Owner Sign-off Record.
//
// A small, pure/offline contract that represents the Owner sign-off REQUIRED
// before any connector could ever move from sandbox/mock/future_only/live_blocked
// toward a (future) live mode. It adds NO real connector and NO runtime behaviour:
//   • no real Canva / Meta / TikTok / Zalo / Google Ads / Drive / n8n API,
//   • no OAuth, no webhook, no external URL, no env requirement,
//   • no publishing, no ads launch, no auto-post.
//
// Critically, even a RECORDED Owner sign-off never auto-enables anything:
// `liveActivationGranted` and `publishCapabilityGranted` are hard `false`
// literals. A sign-off is a documented decision/audit artefact only — turning a
// connector live remains a separate, future, staged action (see
// `07_runbooks/connector_activation_governance_runbook.md` + the staged
// `connector_activation_safety_runbook.md`). Reuses the Phase I-S6 governance
// live-blocker contract so the two can never drift.
// ---------------------------------------------------------------------------
import {
  CONNECTOR_LIVE_BLOCKERS,
  CONNECTOR_GOVERNANCE_MATRIX,
  getConnectorGovernance,
  type ConnectorLiveBlockers,
  type ConnectorActivationStatus,
  type GovernedConnectorKey,
} from './connectorGovernance';

// ---------------------------------------------------------------------------
// Sign-off lifecycle. None of these implies "live" — they describe the state of
// the Owner sign-off DOCUMENT, not the connector's runtime capability.
// ---------------------------------------------------------------------------
export type ConnectorSignoffStatus =
  | 'not_requested'         // no activation has been requested
  | 'pending_owner_signoff' // requested; awaiting Owner decision
  | 'owner_signed_off'      // Owner recorded a sign-off (still NOT live)
  | 'rejected';             // Owner rejected the activation request

export const CONNECTOR_SIGNOFF_STATUSES: ConnectorSignoffStatus[] = [
  'not_requested',
  'pending_owner_signoff',
  'owner_signed_off',
  'rejected',
];

// The review items an Owner sign-off MUST cover before any activation. Labels
// only — there is no automation that can satisfy these on the Owner's behalf.
export type ConnectorSignoffChecklistId =
  | 'business_reason'
  | 'scope_of_activation'
  | 'env_keys_review'
  | 'oauth_webhook_api_risk'
  | 'data_access_review'
  | 'publishing_ads_risk'
  | 'rollback_plan'
  | 'test_plan'
  | 'safety_checklist'
  | 'approved_not_published_ack';

export const CONNECTOR_SIGNOFF_CHECKLIST: { id: ConnectorSignoffChecklistId; label: string }[] = [
  { id: 'business_reason',            label: 'Business reason documented' },
  { id: 'scope_of_activation',        label: 'Scope of activation defined (what the connector may/may not do)' },
  { id: 'env_keys_review',            label: 'Required env keys reviewed (none required today)' },
  { id: 'oauth_webhook_api_risk',     label: 'OAuth / webhook / API risk reviewed' },
  { id: 'data_access_review',         label: 'Data access reviewed (what data is read/written)' },
  { id: 'publishing_ads_risk',        label: 'Publishing / ads / spend risk reviewed' },
  { id: 'rollback_plan',              label: 'Rollback / kill-switch plan documented' },
  { id: 'test_plan',                  label: 'Dry-run / sandbox test plan documented' },
  { id: 'safety_checklist',           label: 'Safety checklist passed (CLAUDE.md §4)' },
  { id: 'approved_not_published_ack', label: 'Acknowledged: Approved ≠ Published unless publish is separately approved' },
];

// ---------------------------------------------------------------------------
// The sign-off record. Mirrors the runbook template. Extends the immutable live
// blockers, and adds two extra hard-`false` grant flags so a recorded sign-off
// can never itself authorise live activation or publishing.
// ---------------------------------------------------------------------------
export interface ConnectorActivationSignoffRecord extends ConnectorLiveBlockers {
  connectorKey: GovernedConnectorKey;
  connectorName: string;
  currentActivationStatus: ConnectorActivationStatus;
  requestedActivationMode: ConnectorActivationStatus | null;
  signoffStatus: ConnectorSignoffStatus;
  ownerApprover: string | null;
  signoffDate: string | null;
  businessReason: string | null;
  // Even a recorded sign-off NEVER auto-enables these. Turning a connector live
  // is a separate, future, staged action — not a property of this record.
  liveActivationGranted: false;
  publishCapabilityGranted: false;
}

/**
 * Build the DEFAULT (blocked, not-requested) sign-off record for a connector.
 * Reuses the governance live blockers + current activation status so the default
 * is always "live blocked, Owner sign-off required, nothing granted".
 */
export function buildDefaultSignoffRecord(
  key: GovernedConnectorKey,
): ConnectorActivationSignoffRecord {
  const gov = getConnectorGovernance(key);
  return {
    connectorKey: key,
    connectorName: gov?.displayName ?? key,
    currentActivationStatus: gov?.activationStatus ?? 'live_blocked',
    requestedActivationMode: null,
    signoffStatus: 'not_requested',
    ownerApprover: null,
    signoffDate: null,
    businessReason: null,
    liveActivationGranted: false,
    publishCapabilityGranted: false,
    ...CONNECTOR_LIVE_BLOCKERS,
  };
}

/** Default sign-off records for every governed connector (all blocked). */
export function buildAllDefaultSignoffRecords(): ConnectorActivationSignoffRecord[] {
  return CONNECTOR_GOVERNANCE_MATRIX.map(e => buildDefaultSignoffRecord(e.key));
}

/**
 * Whether a connector's live activation is granted by its sign-off record. Both
 * grant flags are hard `false` literals, so this is ALWAYS false in the current
 * phase: a recorded sign-off is necessary but NOT sufficient — live activation
 * also needs the staged runbook completed, which is future-only.
 */
export function isLiveActivationGranted(record: ConnectorActivationSignoffRecord): boolean {
  return record.liveActivationGranted && record.publishCapabilityGranted;
}
