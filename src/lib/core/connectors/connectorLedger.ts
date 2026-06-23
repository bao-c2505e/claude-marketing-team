// Connector Activation Ledger — READ-ONLY SAFETY AUDIT (no live behaviour)
// ---------------------------------------------------------------------------
// Phase I-S8 — Connector Activation Audit Trail & Sign-off Ledger UI.
//
// A pure/offline data model that projects the Phase I-S6 governance matrix
// (`connectorGovernance.ts`) and the Phase I-S7 sign-off contract
// (`connectorSignoff.ts`) into a flat, READ-ONLY ledger the admin UI renders.
// It adds NO real connector and NO mutation surface:
//   • no real Canva / Meta / TikTok / Zalo / Google Ads / Drive / n8n API,
//   • no OAuth, no webhook, no external URL, no env requirement,
//   • no publishing, no ads launch, no auto-post, no activation controls.
//
// Every capability column is a hard `false` literal and `readOnly` is `true`, so
// the ledger can only ever DISPLAY the blocked/sandbox state — it can never flip
// a connector live. See CLAUDE.md §4 (Safety), §6 (Output Status Model), §7
// (Connector Roadmap — approval-gated, future-only).
// ---------------------------------------------------------------------------
import {
  CONNECTOR_GOVERNANCE_MATRIX,
  type ConnectorActivationStatus,
  type GovernedConnectorKey,
} from './connectorGovernance';
import {
  buildDefaultSignoffRecord,
  isLiveActivationGranted,
  type ConnectorSignoffStatus,
} from './connectorSignoff';

// Canonical, premium-SaaS ledger copy. Pinned by tests so labels can never drift
// into a "live"/"published" claim.
export const CONNECTOR_LEDGER_COPY = {
  title: 'Connector Activation Ledger',
  subtitle: 'Read-only safety audit',
  liveBlocked: 'Live blocked',
  ownerSignoffRequired: 'Owner sign-off required',
  signoffNotGranted: 'Sign-off not granted',
  approvedNotPublished: 'Approved ≠ Published',
  sandboxLocked: 'Sandbox locked',
  futureOnly: 'Future-only',
  noLiveConnector: 'No connector is live',
} as const;

// One ledger row per governed connector. All capability columns are hard `false`
// literals; `readOnly` is a hard `true` literal.
export interface ConnectorLedgerRow {
  connectorKey: GovernedConnectorKey;
  connectorName: string;
  currentStatus: ConnectorActivationStatus;
  liveConnectorEnabled: false;
  publishEnabled: false;
  adsLaunchEnabled: false;
  webhookEnabled: false;
  oauthEnabled: false;
  envRequiredNow: false;
  futureEnvDocumented: boolean;
  ownerSignoffRequired: true;
  ownerSignoffGranted: false;
  approvedDoesNotPublish: true;
  signoffStatus: ConnectorSignoffStatus;
  safetyStateLabel: string;
  readOnly: true;
}

function safetyStateLabel(status: ConnectorActivationStatus): string {
  switch (status) {
    case 'sandbox': return CONNECTOR_LEDGER_COPY.sandboxLocked;
    case 'mock':    return `Mock — ${CONNECTOR_LEDGER_COPY.liveBlocked}`;
    default:        return `${CONNECTOR_LEDGER_COPY.futureOnly} — ${CONNECTOR_LEDGER_COPY.liveBlocked}`;
  }
}

function buildRow(key: GovernedConnectorKey): ConnectorLedgerRow {
  const gov = CONNECTOR_GOVERNANCE_MATRIX.find(e => e.key === key)!;
  const signoff = buildDefaultSignoffRecord(key);
  return {
    connectorKey: key,
    connectorName: gov.displayName,
    currentStatus: gov.activationStatus,
    liveConnectorEnabled: false,
    publishEnabled: false,
    adsLaunchEnabled: false,
    webhookEnabled: false,
    oauthEnabled: false,
    envRequiredNow: false,
    futureEnvDocumented: gov.futureEnvDocumented,
    ownerSignoffRequired: true,
    // Hard `false`: derived from the sign-off contract, which never grants live.
    ownerSignoffGranted: isLiveActivationGranted(signoff) as false,
    approvedDoesNotPublish: true,
    signoffStatus: signoff.signoffStatus,
    safetyStateLabel: safetyStateLabel(gov.activationStatus),
    readOnly: true,
  };
}

/** Build the full read-only activation ledger (one row per governed connector). */
export function buildConnectorActivationLedger(): ConnectorLedgerRow[] {
  return CONNECTOR_GOVERNANCE_MATRIX.map(e => buildRow(e.key));
}

export interface ConnectorLedgerSummary {
  total: number;
  liveCount: 0;
  allLiveBlocked: true;
  allOwnerSignoffRequired: true;
  anySignoffGranted: false;
  readOnly: true;
}

/** Summary banner figures. `liveCount` is a hard `0` literal — nothing is live. */
export function buildConnectorLedgerSummary(): ConnectorLedgerSummary {
  return {
    total: CONNECTOR_GOVERNANCE_MATRIX.length,
    liveCount: 0,
    allLiveBlocked: true,
    allOwnerSignoffRequired: true,
    anySignoffGranted: false,
    readOnly: true,
  };
}
