import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_LEDGER_COPY,
  buildConnectorActivationLedger,
  buildConnectorLedgerSummary,
} from './connectorLedger';
import type { GovernedConnectorKey } from './connectorGovernance';

// Affirmative live/published claims only — must NOT match the negated safety
// copy the ledger intentionally emits ("No connector is live").
const unsafeLiveCopy =
  /(is now live|went live|successfully published|has been published|ads? (launched|are live)|oauth (connected|enabled)|webhook (active|enabled))/i;

describe('connectorLedger', () => {
  it('renders a ledger row per governed connector', () => {
    const rows = buildConnectorActivationLedger();
    const keys = rows.map(r => r.connectorKey).sort();
    const expected: GovernedConnectorKey[] = [
      'canva', 'google_ads', 'google_drive', 'google_sheets', 'meta', 'n8n', 'tiktok', 'zalo',
    ];
    expect(keys).toEqual(expected.sort());
    expect(rows.length).toBe(8);
  });

  it('shows every live capability as false/blocked on every row', () => {
    for (const r of buildConnectorActivationLedger()) {
      expect(r.liveConnectorEnabled).toBe(false);
      expect(r.publishEnabled).toBe(false);
      expect(r.adsLaunchEnabled).toBe(false);
      expect(r.webhookEnabled).toBe(false);
      expect(r.oauthEnabled).toBe(false);
      expect(r.envRequiredNow).toBe(false);
      expect(r.readOnly).toBe(true);
    }
  });

  it('requires Owner sign-off but shows it NOT granted', () => {
    for (const r of buildConnectorActivationLedger()) {
      expect(r.ownerSignoffRequired).toBe(true);
      expect(r.ownerSignoffGranted).toBe(false);
      expect(r.signoffStatus).toBe('not_requested');
    }
  });

  it('keeps Canva sandbox/mock only and sandbox-locked', () => {
    const canva = buildConnectorActivationLedger().find(r => r.connectorKey === 'canva')!;
    expect(canva.currentStatus).toBe('sandbox');
    expect(canva.safetyStateLabel).toBe(CONNECTOR_LEDGER_COPY.sandboxLocked);
    expect(canva.liveConnectorEnabled).toBe(false);
  });

  it('keeps Meta / TikTok / Zalo / Google Ads future-only and not live', () => {
    const rows = buildConnectorActivationLedger();
    for (const key of ['meta', 'tiktok', 'zalo', 'google_ads'] as GovernedConnectorKey[]) {
      const r = rows.find(x => x.connectorKey === key)!;
      expect(r.currentStatus).toBe('future_only');
      expect(r.adsLaunchEnabled).toBe(false);
      expect(r.publishEnabled).toBe(false);
    }
  });

  it('keeps Approved ≠ Published explicit on every row', () => {
    expect(buildConnectorActivationLedger().every(r => r.approvedDoesNotPublish === true)).toBe(true);
    expect(CONNECTOR_LEDGER_COPY.approvedNotPublished).toBe('Approved ≠ Published');
  });

  it('summary reports zero live connectors, all blocked, read-only', () => {
    const s = buildConnectorLedgerSummary();
    expect(s.liveCount).toBe(0);
    expect(s.allLiveBlocked).toBe(true);
    expect(s.allOwnerSignoffRequired).toBe(true);
    expect(s.anySignoffGranted).toBe(false);
    expect(s.readOnly).toBe(true);
    expect(s.total).toBe(8);
  });

  it('is deterministic', () => {
    expect(buildConnectorActivationLedger()).toEqual(buildConnectorActivationLedger());
  });

  it('introduces no external URL / OAuth / token / real env-key references and no live copy', () => {
    const blob = JSON.stringify(buildConnectorActivationLedger()) + JSON.stringify(CONNECTOR_LEDGER_COPY);
    expect(blob).not.toMatch(/https?:\/\//i);
    expect(blob).not.toMatch(/canva\.com/i);
    expect(blob).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(blob).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS_/);
    expect(unsafeLiveCopy.test(blob)).toBe(false);
  });
});
