import { describe, expect, it } from 'vitest';
// Load the component source as a raw string via Vite's `?raw` import (typed by
// vite/client). No node:fs needed, so this type-checks under tsc too.
import SOURCE from './ConnectorActivationLedger.tsx?raw';

// Static source-scan guard: the ledger UI must stay READ-ONLY. There is no DOM
// test runner in this project (no jsdom / testing-library, and adding deps is
// out of scope), so we assert the component source contains no controls,
// mutation handlers, state, or activation/publish/launch actions.

describe('ConnectorActivationLedger (read-only source guard)', () => {
  it('renders no interactive controls (no buttons, inputs, links)', () => {
    expect(SOURCE).not.toMatch(/<button\b/i);
    expect(SOURCE).not.toMatch(/<input\b/i);
    expect(SOURCE).not.toMatch(/<select\b/i);
    expect(SOURCE).not.toMatch(/<a\b/i);
    expect(SOURCE).not.toMatch(/<textarea\b/i);
  });

  it('wires no event handlers or state', () => {
    expect(SOURCE).not.toMatch(/onClick/);
    expect(SOURCE).not.toMatch(/onChange/);
    expect(SOURCE).not.toMatch(/onSubmit/);
    expect(SOURCE).not.toMatch(/useState/);
    expect(SOURCE).not.toMatch(/useReducer/);
  });

  it('performs no activation / publish / launch / mutation actions', () => {
    // No imperative activation/publish/launch verbs as function-like calls.
    expect(SOURCE).not.toMatch(/\b(activate|publish|launch|enableLive|signOff|grant)\s*\(/i);
    // No registry mutation helpers imported/used here.
    expect(SOURCE).not.toMatch(/updateConnectorStatus|saveConnectorRegistryData|addMockEvent/);
  });

  it('introduces no external URL / OAuth / token / real env-key references', () => {
    expect(SOURCE).not.toMatch(/https?:\/\//i);
    expect(SOURCE).not.toMatch(/canva\.com/i);
    expect(SOURCE).not.toMatch(/CANVA_CLIENT_ID|CANVA_CLIENT_SECRET|CANVA_API|CANVA_TOKEN/);
    expect(SOURCE).not.toMatch(/META_ACCESS_TOKEN|TIKTOK_ACCESS_TOKEN|ZALO_ACCESS_TOKEN|GOOGLE_ADS_/);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest/);
  });
});
