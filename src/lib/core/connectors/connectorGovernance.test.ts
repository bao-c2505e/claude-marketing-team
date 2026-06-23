import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_GOVERNANCE_MATRIX,
  CONNECTOR_LIVE_BLOCKERS,
  CONNECTOR_ACTIVATION_STATUSES,
  buildConnectorGovernanceMatrix,
  getConnectorGovernance,
  isConnectorLiveBlocked,
  connectorActivationBadge,
  type GovernedConnectorKey,
} from './connectorGovernance';
import { CANVA_SANDBOX_RELEASE_LOCK } from './canvaReleaseLock';
import { SEED_CONNECTORS } from '../connectorRegistry';

// Any copy that would falsely affirm a live/published/launched connector state.
const unsafeLiveCopy =
  /(live connector enabled|now live|went live|successfully published|has been published|ads? (launched|are live)|oauth (connected|enabled)|webhook (active|enabled)|spent budget)/i;

describe('connectorGovernance', () => {
  it('blocks every live capability by default on the shared blocker contract', () => {
    expect(CONNECTOR_LIVE_BLOCKERS.liveConnectorEnabled).toBe(false);
    expect(CONNECTOR_LIVE_BLOCKERS.publishEnabled).toBe(false);
    expect(CONNECTOR_LIVE_BLOCKERS.adsLaunchEnabled).toBe(false);
    expect(CONNECTOR_LIVE_BLOCKERS.webhookEnabled).toBe(false);
    expect(CONNECTOR_LIVE_BLOCKERS.oauthEnabled).toBe(false);
    expect(CONNECTOR_LIVE_BLOCKERS.requiresEnv).toBe(false);
    expect(CONNECTOR_LIVE_BLOCKERS.ownerSignoffRequired).toBe(true);
    expect(CONNECTOR_LIVE_BLOCKERS.approvedDoesNotPublish).toBe(true);
  });

  it('supports the required activation statuses', () => {
    for (const s of ['sandbox', 'mock', 'disabled', 'future_only', 'live_blocked', 'requires_owner_signoff']) {
      expect(CONNECTOR_ACTIVATION_STATUSES).toContain(s);
    }
  });

  it('every governed connector has all live capabilities blocked', () => {
    for (const e of CONNECTOR_GOVERNANCE_MATRIX) {
      expect(e.liveConnectorEnabled).toBe(false);
      expect(e.publishEnabled).toBe(false);
      expect(e.adsLaunchEnabled).toBe(false);
      expect(e.webhookEnabled).toBe(false);
      expect(e.oauthEnabled).toBe(false);
      expect(e.ownerSignoffRequired).toBe(true);
      expect(e.approvedDoesNotPublish).toBe(true);
      expect(isConnectorLiveBlocked(e)).toBe(true);
    }
  });

  it('covers Canva + the ad/messaging/storage/automation connectors', () => {
    const keys = CONNECTOR_GOVERNANCE_MATRIX.map(e => e.key).sort();
    const expected: GovernedConnectorKey[] = [
      'canva', 'google_ads', 'google_drive', 'google_sheets', 'meta', 'n8n', 'tiktok', 'zalo',
    ];
    expect(keys).toEqual(expected.sort());
  });

  it('keeps Canva sandbox/mock only and consistent with the release lock', () => {
    const canva = getConnectorGovernance('canva')!;
    expect(canva.activationStatus).toBe('sandbox');
    expect(canva.liveConnectorEnabled).toBe(CANVA_SANDBOX_RELEASE_LOCK.liveConnectorEnabled);
    expect(canva.publishEnabled).toBe(CANVA_SANDBOX_RELEASE_LOCK.publishEnabled);
    expect(canva.approvedDoesNotPublish).toBe(CANVA_SANDBOX_RELEASE_LOCK.approvedDoesNotPublish);
  });

  it('keeps Meta / TikTok / Zalo / Google Ads future-only and not live', () => {
    for (const key of ['meta', 'tiktok', 'zalo', 'google_ads'] as GovernedConnectorKey[]) {
      const e = getConnectorGovernance(key)!;
      expect(e.activationStatus).toBe('future_only');
      expect(e.liveConnectorEnabled).toBe(false);
      expect(e.adsLaunchEnabled).toBe(false);
      expect(e.publishEnabled).toBe(false);
    }
  });

  it('keeps Approved ≠ Published explicit on every connector', () => {
    expect(CONNECTOR_GOVERNANCE_MATRIX.every(e => e.approvedDoesNotPublish === true)).toBe(true);
  });

  it('produces deterministic governance flags', () => {
    expect(buildConnectorGovernanceMatrix()).toEqual(buildConnectorGovernanceMatrix());
    expect(buildConnectorGovernanceMatrix()).toEqual(CONNECTOR_GOVERNANCE_MATRIX);
  });

  it('requires no live env keys to run today (registry/sandbox only)', () => {
    // Governance: nothing requires env now; future env is only documented.
    expect(CONNECTOR_GOVERNANCE_MATRIX.every(e => e.requiresEnv === false)).toBe(true);
    // Runtime registry: the Canva sandbox connector needs no env keys.
    const canva = SEED_CONNECTORS.find(c => c.id === 'conn-canva')!;
    expect(canva.required_env_keys).toEqual([]);
  });

  it('badges every runtime connector type as live-blocked + owner-gated', () => {
    const types = SEED_CONNECTORS.map(c => c.connector_type);
    for (const t of types) {
      const badge = connectorActivationBadge(t);
      expect(badge.liveBlocked).toBe(true);
      expect(badge.ownerSignoffRequired).toBe(true);
      expect(badge.approvedDoesNotPublish).toBe(true);
    }
    // Canva badges as sandbox; an unmapped provider defaults to future_only.
    expect(connectorActivationBadge('canva').activationStatus).toBe('sandbox');
    expect(connectorActivationBadge('openai').activationStatus).toBe('future_only');
  });

  it('introduces no external URL / OAuth / token / real env-key references', () => {
    const blob = JSON.stringify(CONNECTOR_GOVERNANCE_MATRIX) + JSON.stringify(CONNECTOR_LIVE_BLOCKERS);
    expect(blob).not.toMatch(/https?:\/\//i);
    expect(blob).not.toMatch(/canva\.com/i);
    expect(blob).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(blob).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS_/);
    // Copy never affirms a live/published/launched state.
    expect(unsafeLiveCopy.test(blob)).toBe(false);
  });
});
