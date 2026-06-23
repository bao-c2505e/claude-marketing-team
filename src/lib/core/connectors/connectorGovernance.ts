// Connector Activation Governance — LIVE CONNECTORS BLOCKED BY DEFAULT
// ---------------------------------------------------------------------------
// Phase I-S6 — Connector Activation Governance & Live Connector Blockers.
//
// A single shared governance layer so EVERY current/future connector has an
// explicit activation status, a safety lock, and an Owner sign-off requirement
// before anything can ever become live. It adds NO real connector and changes
// NO runtime behaviour:
//   • no real Canva / Meta / TikTok / Zalo / Google Ads / Drive / n8n API,
//   • no OAuth, no webhook activation, no external URL,
//   • no publishing, no ads launch, no auto-post,
//   • no real credentials / env requirement (sandbox/registry-only today).
//
// Every outward-facing capability is a hard `false` literal, so TypeScript
// itself forbids ever representing a connector as live / publish / ads-launch /
// OAuth / webhook capable through this contract. The only honest "future" signal
// is `futureEnvDocumented` (env placeholders live in .env.example + the connector
// activation runbook — never real values, never required to run today).
//
// Reuses the Canva release-lock pattern (`canvaReleaseLock.ts`) so the Canva
// entry can never drift from CANVA_SANDBOX_RELEASE_LOCK. See CLAUDE.md §4 (Safety
// Principles), §6 (Output Status Model), §7 (Connector Roadmap — approval-gated,
// future-only).
// ---------------------------------------------------------------------------
import type { LocalConnectorType } from '../../../types/core';
import { CANVA_SANDBOX_RELEASE_LOCK } from './canvaReleaseLock';

// ---------------------------------------------------------------------------
// Activation status — the single descriptive axis. None of these is "live".
// ---------------------------------------------------------------------------
export type ConnectorActivationStatus =
  | 'sandbox'                 // safe offline preview exists (e.g. Canva)
  | 'mock'                    // registry/mock only, no real call
  | 'disabled'               // explicitly turned off
  | 'future_only'            // roadmap; not implemented as a live connector
  | 'live_blocked'           // live path exists in roadmap but is hard-blocked
  | 'requires_owner_signoff'; // gated behind an explicit Owner sign-off

export const CONNECTOR_ACTIVATION_STATUSES: ConnectorActivationStatus[] = [
  'sandbox',
  'mock',
  'disabled',
  'future_only',
  'live_blocked',
  'requires_owner_signoff',
];

export const CONNECTOR_ACTIVATION_STATUS_LABEL: Record<ConnectorActivationStatus, string> = {
  sandbox:                 'Sandbox',
  mock:                    'Mock',
  disabled:                'Disabled',
  future_only:             'Future only',
  live_blocked:            'Live blocked',
  requires_owner_signoff:  'Owner sign-off required',
};

export const CONNECTOR_ACTIVATION_STATUS_COLOR: Record<ConnectorActivationStatus, string> = {
  sandbox:                 '#22d3ee',
  mock:                    '#f59e0b',
  disabled:                '#52525b',
  future_only:             '#a78bfa',
  live_blocked:            '#f87171',
  requires_owner_signoff:  '#fbbf24',
};

// ---------------------------------------------------------------------------
// Live blockers — every outward capability is a hard `false` literal.
// ---------------------------------------------------------------------------
export interface ConnectorLiveBlockers {
  liveConnectorEnabled: false;
  publishEnabled: false;
  adsLaunchEnabled: false;
  webhookEnabled: false;
  oauthEnabled: false;
  requiresEnv: false;          // nothing requires env to run today (registry/sandbox only)
  ownerSignoffRequired: true;  // any future activation needs an explicit Owner sign-off
  approvedDoesNotPublish: true; // Approved ≠ Published, always
}

export const CONNECTOR_LIVE_BLOCKERS: ConnectorLiveBlockers = {
  liveConnectorEnabled: false,
  publishEnabled: false,
  adsLaunchEnabled: false,
  webhookEnabled: false,
  oauthEnabled: false,
  requiresEnv: false,
  ownerSignoffRequired: true,
  approvedDoesNotPublish: true,
};

// ---------------------------------------------------------------------------
// Governed connectors. Includes connectors that are not yet runtime types
// (tiktok / zalo / google_ads) — represented here as future_only / docs-only,
// with NO fake runtime behaviour added anywhere.
// ---------------------------------------------------------------------------
export type GovernedConnectorKey =
  | 'canva'
  | 'meta'
  | 'tiktok'
  | 'zalo'
  | 'google_ads'
  | 'google_drive'
  | 'google_sheets'
  | 'n8n';

export interface ConnectorGovernanceEntry extends ConnectorLiveBlockers {
  key: GovernedConnectorKey;
  displayName: string;
  activationStatus: ConnectorActivationStatus;
  // True only to DOCUMENT that a future live activation would need env keys
  // (placeholders in .env.example + activation runbook). It NEVER means env is
  // required now — `requiresEnv` stays false. No real key names live here.
  futureEnvDocumented: boolean;
  note: string;
}

// Build one entry. Spreads the immutable blockers last so a per-entry object can
// never accidentally re-enable a live capability.
function entry(
  key: GovernedConnectorKey,
  displayName: string,
  activationStatus: ConnectorActivationStatus,
  futureEnvDocumented: boolean,
  note: string,
): ConnectorGovernanceEntry {
  return { key, displayName, activationStatus, futureEnvDocumented, note, ...CONNECTOR_LIVE_BLOCKERS };
}

// The governance matrix. Order is stable so the UI / tests can rely on it.
export const CONNECTOR_GOVERNANCE_MATRIX: ConnectorGovernanceEntry[] = [
  entry(
    'canva', 'Canva', 'sandbox', true,
    'Sandbox/mock preview only. Live Canva Connect (OAuth) is future-only, ' +
    'behind the connector activation runbook + Owner sign-off. Approved ≠ Published.',
  ),
  entry(
    'meta', 'Meta Ads', 'future_only', true,
    'Future-only. No live Meta Marketing connector, no ads launch, no spend, ' +
    'no auto-post. Owner sign-off required before any activation.',
  ),
  entry(
    'tiktok', 'TikTok Business', 'future_only', true,
    'Future-only (not yet a runtime connector). No live TikTok connector, ' +
    'no ads launch, no auto-post. Owner sign-off required before any activation.',
  ),
  entry(
    'zalo', 'Zalo OA', 'future_only', true,
    'Future-only (not yet a runtime connector). No live Zalo connector, ' +
    'no auto-message, no auto-post. Owner sign-off required before any activation.',
  ),
  entry(
    'google_ads', 'Google Ads', 'future_only', true,
    'Future-only (not yet a runtime connector). No live Google Ads connector, ' +
    'no ads launch, no spend. Owner sign-off required before any activation.',
  ),
  entry(
    'google_drive', 'Google Drive', 'future_only', true,
    'Future-only. No live Drive connector, no upload/export to a real account. ' +
    'Owner sign-off required before any activation.',
  ),
  entry(
    'google_sheets', 'Google Sheets', 'future_only', true,
    'Future-only. No live Sheets connector, no real read/write. ' +
    'Owner sign-off required before any activation.',
  ),
  entry(
    'n8n', 'n8n Backbone', 'mock', true,
    'Registry/mock only. No real n8n webhook sent. Owner sign-off + manual ' +
    'env setup required before any activation.',
  ),
];

/** Stable, deterministic copy of the governance matrix. */
export function buildConnectorGovernanceMatrix(): ConnectorGovernanceEntry[] {
  return CONNECTOR_GOVERNANCE_MATRIX.map(e => ({ ...e }));
}

/** Look up a governed connector by key. */
export function getConnectorGovernance(key: GovernedConnectorKey): ConnectorGovernanceEntry | undefined {
  return CONNECTOR_GOVERNANCE_MATRIX.find(e => e.key === key);
}

/** A connector is live-blocked whenever its live path is disabled (always today). */
export function isConnectorLiveBlocked(entry: ConnectorLiveBlockers): boolean {
  return (
    entry.liveConnectorEnabled === false &&
    entry.publishEnabled === false &&
    entry.adsLaunchEnabled === false
  );
}

// ---------------------------------------------------------------------------
// Runtime registry bridge. Maps a LocalConnectorType to its activation status
// for UI badges. Unmapped provider/infra types (openai/anthropic/gemini/comfyui/
// storage/webhook/other) default to future_only — live is always blocked.
// ---------------------------------------------------------------------------
const CONNECTOR_TYPE_ACTIVATION: Partial<Record<LocalConnectorType, ConnectorActivationStatus>> = {
  canva:         'sandbox',
  n8n:           'mock',
  meta_ads:      'future_only',
  google_drive:  'future_only',
  google_sheets: 'future_only',
};

export interface ConnectorActivationBadge {
  activationStatus: ConnectorActivationStatus;
  liveBlocked: true;
  ownerSignoffRequired: true;
  approvedDoesNotPublish: true;
}

/**
 * Governance badge for any runtime connector type. `liveBlocked`,
 * `ownerSignoffRequired`, and `approvedDoesNotPublish` are hard literals — every
 * connector is live-blocked and Owner-gated regardless of type.
 */
export function connectorActivationBadge(type: LocalConnectorType): ConnectorActivationBadge {
  return {
    activationStatus: CONNECTOR_TYPE_ACTIVATION[type] ?? 'future_only',
    liveBlocked: true,
    ownerSignoffRequired: true,
    approvedDoesNotPublish: true,
  };
}

// Compile-time guarantee: the Canva governance entry stays consistent with the
// Canva release lock (Phase I-S5). If either drifts, this stops type-checking.
const _canvaConsistency: {
  liveConnectorEnabled: typeof CANVA_SANDBOX_RELEASE_LOCK.liveConnectorEnabled;
  publishEnabled: typeof CANVA_SANDBOX_RELEASE_LOCK.publishEnabled;
  approvedDoesNotPublish: typeof CANVA_SANDBOX_RELEASE_LOCK.approvedDoesNotPublish;
} = {
  liveConnectorEnabled: false,
  publishEnabled: false,
  approvedDoesNotPublish: true,
};
void _canvaConsistency;
