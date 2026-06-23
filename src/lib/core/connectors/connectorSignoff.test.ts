import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_SIGNOFF_STATUSES,
  CONNECTOR_SIGNOFF_CHECKLIST,
  buildDefaultSignoffRecord,
  buildAllDefaultSignoffRecords,
  isLiveActivationGranted,
} from './connectorSignoff';
import { CONNECTOR_GOVERNANCE_MATRIX, type GovernedConnectorKey } from './connectorGovernance';

const ALL_KEYS: GovernedConnectorKey[] = [
  'canva', 'meta', 'tiktok', 'zalo', 'google_ads', 'google_drive', 'google_sheets', 'n8n',
];

describe('connectorSignoff', () => {
  it('defaults every connector to a blocked, not-requested sign-off record', () => {
    for (const r of buildAllDefaultSignoffRecords()) {
      expect(r.signoffStatus).toBe('not_requested');
      expect(r.requestedActivationMode).toBeNull();
      expect(r.ownerApprover).toBeNull();
      expect(r.signoffDate).toBeNull();
      // All live capabilities blocked + nothing granted.
      expect(r.liveConnectorEnabled).toBe(false);
      expect(r.publishEnabled).toBe(false);
      expect(r.adsLaunchEnabled).toBe(false);
      expect(r.webhookEnabled).toBe(false);
      expect(r.oauthEnabled).toBe(false);
      expect(r.requiresEnv).toBe(false);
      expect(r.liveActivationGranted).toBe(false);
      expect(r.publishCapabilityGranted).toBe(false);
    }
  });

  it('requires Owner sign-off (gate present) before any live mode', () => {
    for (const r of buildAllDefaultSignoffRecords()) {
      expect(r.ownerSignoffRequired).toBe(true);
      // No record can report itself live-ready.
      expect(isLiveActivationGranted(r)).toBe(false);
    }
  });

  it('keeps Approved ≠ Published explicit on every record', () => {
    for (const r of buildAllDefaultSignoffRecords()) {
      expect(r.approvedDoesNotPublish).toBe(true);
    }
    // The checklist forces an explicit acknowledgement of Approved ≠ Published.
    expect(CONNECTOR_SIGNOFF_CHECKLIST.some(c => c.id === 'approved_not_published_ack')).toBe(true);
  });

  it('covers all governed connectors and mirrors their current status', () => {
    const records = buildAllDefaultSignoffRecords();
    expect(records.map(r => r.connectorKey).sort()).toEqual([...ALL_KEYS].sort());
    for (const r of records) {
      const gov = CONNECTOR_GOVERNANCE_MATRIX.find(e => e.key === r.connectorKey)!;
      expect(r.currentActivationStatus).toBe(gov.activationStatus);
      expect(r.connectorName).toBe(gov.displayName);
    }
  });

  it('keeps Canva sign-off sandbox and not live', () => {
    const canva = buildDefaultSignoffRecord('canva');
    expect(canva.currentActivationStatus).toBe('sandbox');
    expect(isLiveActivationGranted(canva)).toBe(false);
  });

  it('exposes the full sign-off lifecycle and review checklist', () => {
    expect(CONNECTOR_SIGNOFF_STATUSES).toEqual([
      'not_requested', 'pending_owner_signoff', 'owner_signed_off', 'rejected',
    ]);
    const ids = CONNECTOR_SIGNOFF_CHECKLIST.map(c => c.id);
    for (const id of [
      'business_reason', 'scope_of_activation', 'env_keys_review', 'oauth_webhook_api_risk',
      'data_access_review', 'publishing_ads_risk', 'rollback_plan', 'test_plan',
      'safety_checklist', 'approved_not_published_ack',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('produces deterministic records', () => {
    expect(buildAllDefaultSignoffRecords()).toEqual(buildAllDefaultSignoffRecords());
  });

  it('introduces no external URL / OAuth / token / real env-key references', () => {
    const blob = JSON.stringify(buildAllDefaultSignoffRecords()) + JSON.stringify(CONNECTOR_SIGNOFF_CHECKLIST);
    expect(blob).not.toMatch(/https?:\/\//i);
    expect(blob).not.toMatch(/canva\.com/i);
    expect(blob).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(blob).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS_/);
  });
});
