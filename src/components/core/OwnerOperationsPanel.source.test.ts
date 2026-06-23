import { describe, expect, it } from 'vitest';
// Load the component source as a raw string via Vite's `?raw` import. There is no
// DOM test runner in this project (no jsdom / testing-library, and adding deps is
// out of scope), so Phase J safety is enforced with a static source scan — the
// same approach as ConnectorActivationLedger.source.test.ts.
import SOURCE from './OwnerOperationsPanel.tsx?raw';

describe('OwnerOperationsPanel (Phase J safety + content guard)', () => {
  it('keeps approval-first messaging and "Approved ≠ Published" visible', () => {
    expect(SOURCE).toMatch(/Approved ≠ Published/);
    expect(SOURCE).toMatch(/Approval-first/i);
    expect(SOURCE).toMatch(/Owner sign-off/i);
  });

  it('shows connector safety status as blocked and read-only', () => {
    expect(SOURCE).toMatch(/Connector Safety Status/);
    expect(SOURCE).toMatch(/Read-only/i);
    expect(SOURCE).toMatch(/live blocked/i);
    // Live count is rendered from the ledger summary (a hard 0 literal), never a
    // hand-written "live" claim.
    expect(SOURCE).toMatch(/LEDGER_SUMMARY\.liveCount/);
  });

  it('labels demo/production figures as internal / simulated (no live metrics)', () => {
    expect(SOURCE).toMatch(/simulated|internal/i);
    expect(SOURCE).toMatch(/no live metrics|no live pull/i);
  });

  it('renders no publish / post / ads-launch / activate action wording', () => {
    expect(SOURCE).not.toMatch(/publish now/i);
    expect(SOURCE).not.toMatch(/launch ad/i);
    expect(SOURCE).not.toMatch(/launch campaign/i);
    expect(SOURCE).not.toMatch(/post to/i);
    expect(SOURCE).not.toMatch(/go live/i);
    expect(SOURCE).not.toMatch(/activate connector/i);
    expect(SOURCE).not.toMatch(/send to canva/i);
    expect(SOURCE).not.toMatch(/auto-post/i);
  });

  it('introduces no live connector capability (no API / OAuth / token / webhook / URL)', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/OAuth/i);
    expect(SOURCE).not.toMatch(/webhook/i);
    expect(SOURCE).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(SOURCE).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS/);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
    // No connector-registry mutation helpers — this panel only displays state.
    expect(SOURCE).not.toMatch(/updateConnectorStatus|saveConnectorRegistryData|addMockEvent/);
  });

  it('carries no off-domain / off-project contamination', () => {
    expect(SOURCE).not.toMatch(/Forme|sofa|furniture|nội thất|Fal\.ai|ImgBB/i);
  });

  it('only navigates the dashboard — its sole side effect is onNavigate', () => {
    // The single mutation-ish surface is the onNavigate prop callback.
    expect(SOURCE).toMatch(/onNavigate/);
    // No direct state mutation or persistence from this presentational panel.
    expect(SOURCE).not.toMatch(/useState|useReducer|localStorage/);
  });
});
