import { describe, expect, it } from 'vitest';
import {
  CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS,
  parseSnapshotBuiltAt,
  getConnectorSnapshotAgeMs,
  getConnectorSnapshotFreshness,
  isConnectorSnapshotStale,
  formatConnectorSnapshotAgeLabel,
} from './connectorCommandSnapshotFreshness';
// Freshness must stay a pure, clock-injected helper module. Enforced below.
import SOURCE from './connectorCommandSnapshotFreshness.ts?raw';

const BUILT_AT = '2026-07-02T10:00:00.000Z';
const BUILT_AT_MS = Date.parse(BUILT_AT);
const HOUR = 60 * 60 * 1000;

function snap(builtAt: string) {
  return { builtAt };
}

describe('CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS', () => {
  it('defaults to 24 hours', () => {
    expect(CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS).toBe(24 * HOUR);
  });
});

describe('parseSnapshotBuiltAt', () => {
  it('parses a valid ISO builtAt to epoch ms', () => {
    expect(parseSnapshotBuiltAt(snap(BUILT_AT))).toBe(BUILT_AT_MS);
  });
  it('returns null for garbage', () => {
    expect(parseSnapshotBuiltAt(snap('not-a-date'))).toBeNull();
  });
  it('returns null for an empty string', () => {
    expect(parseSnapshotBuiltAt(snap(''))).toBeNull();
  });
  it('returns null for a non-string builtAt and never throws', () => {
    expect(parseSnapshotBuiltAt({ builtAt: undefined as unknown as string })).toBeNull();
    expect(parseSnapshotBuiltAt({ builtAt: 12345 as unknown as string })).toBeNull();
  });
});

describe('getConnectorSnapshotAgeMs', () => {
  it('returns elapsed ms since builtAt', () => {
    expect(getConnectorSnapshotAgeMs(snap(BUILT_AT), BUILT_AT_MS + 5000)).toBe(5000);
  });
  it('clamps a future builtAt (clock skew) to age 0', () => {
    expect(getConnectorSnapshotAgeMs(snap(BUILT_AT), BUILT_AT_MS - HOUR)).toBe(0);
  });
  it('returns null when builtAt is unparseable', () => {
    expect(getConnectorSnapshotAgeMs(snap('garbage'), BUILT_AT_MS)).toBeNull();
  });
});

describe('getConnectorSnapshotFreshness', () => {
  it('fresh under the threshold', () => {
    expect(getConnectorSnapshotFreshness(snap(BUILT_AT), BUILT_AT_MS + 23 * HOUR)).toBe('fresh');
  });
  it('stale over the threshold', () => {
    expect(getConnectorSnapshotFreshness(snap(BUILT_AT), BUILT_AT_MS + 25 * HOUR)).toBe('stale');
  });
  it('exact boundary counts as stale (errs toward rebuild)', () => {
    expect(
      getConnectorSnapshotFreshness(snap(BUILT_AT), BUILT_AT_MS + CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS),
    ).toBe('stale');
    expect(
      getConnectorSnapshotFreshness(snap(BUILT_AT), BUILT_AT_MS + CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS - 1),
    ).toBe('fresh');
  });
  it('invalid timestamp yields invalid_timestamp', () => {
    expect(getConnectorSnapshotFreshness(snap('garbage'), BUILT_AT_MS)).toBe('invalid_timestamp');
  });
  it('future builtAt is safely fresh (clamped age 0)', () => {
    expect(getConnectorSnapshotFreshness(snap(BUILT_AT), BUILT_AT_MS - 10 * HOUR)).toBe('fresh');
  });
  it('honors a custom maxAgeMs', () => {
    expect(getConnectorSnapshotFreshness(snap(BUILT_AT), BUILT_AT_MS + 5000, 10_000)).toBe('fresh');
    expect(getConnectorSnapshotFreshness(snap(BUILT_AT), BUILT_AT_MS + 5000, 5000)).toBe('stale');
  });
});

describe('isConnectorSnapshotStale — conservative', () => {
  it('false while provably fresh', () => {
    expect(isConnectorSnapshotStale(snap(BUILT_AT), BUILT_AT_MS + HOUR)).toBe(false);
  });
  it('true over the threshold', () => {
    expect(isConnectorSnapshotStale(snap(BUILT_AT), BUILT_AT_MS + 25 * HOUR)).toBe(true);
  });
  it('true for an unparseable builtAt (unknowable age is never trusted)', () => {
    expect(isConnectorSnapshotStale(snap('garbage'), BUILT_AT_MS)).toBe(true);
  });
});

describe('formatConnectorSnapshotAgeLabel', () => {
  it("'just now' under one minute", () => {
    expect(formatConnectorSnapshotAgeLabel(0)).toBe('just now');
    expect(formatConnectorSnapshotAgeLabel(59_999)).toBe('just now');
  });
  it('minutes ago, with singular form', () => {
    expect(formatConnectorSnapshotAgeLabel(60_000)).toBe('1 minute ago');
    expect(formatConnectorSnapshotAgeLabel(35 * 60_000)).toBe('35 minutes ago');
  });
  it('hours ago, with singular form', () => {
    expect(formatConnectorSnapshotAgeLabel(HOUR)).toBe('1 hour ago');
    expect(formatConnectorSnapshotAgeLabel(23 * HOUR)).toBe('23 hours ago');
  });
  it('days ago, with singular form', () => {
    expect(formatConnectorSnapshotAgeLabel(24 * HOUR)).toBe('1 day ago');
    expect(formatConnectorSnapshotAgeLabel(72 * HOUR + 5)).toBe('3 days ago');
  });
  it("'unknown age' for null and clamps negatives", () => {
    expect(formatConnectorSnapshotAgeLabel(null)).toBe('unknown age');
    expect(formatConnectorSnapshotAgeLabel(-5000)).toBe('just now');
  });
});

describe('freshness module stays pure (source guard)', () => {
  it('has no React, storage, network, or hidden clock', () => {
    expect(SOURCE).not.toMatch(/from 'react'|useState|useEffect|useReducer|createContext/);
    expect(SOURCE).not.toMatch(/localStorage|sessionStorage|indexedDB|BroadcastChannel/i);
    expect(SOURCE).not.toMatch(/fetch\s*\(|axios|XMLHttpRequest|https?:\/\/|OAuth|webhook/i);
    // The clock is always injected — the module never reads Date.now() itself.
    expect(SOURCE).not.toMatch(/Date\.now\s*\(/);
    expect(SOURCE).not.toMatch(/new Date\s*\(\s*\)/);
  });
  it('has no run / ads / posting wording — freshness is advisory metadata only', () => {
    expect(SOURCE).not.toMatch(/execute|publish now|auto-ads|run ads|\bpost\b/i);
  });
});
