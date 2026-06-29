import { describe, it, expect } from 'vitest';
// Static source-scan guard — no DOM runner needed.
// Verifies that T4-6-A (n8n) and T4-7 (Google Drive) wiring is in place.
import SOURCE from './ConnectorRegistryTab.tsx?raw';

describe('ConnectorRegistryTab — T4-6-A source guard', () => {
  it('imports checkN8nHealth from the live service', () => {
    expect(SOURCE).toMatch(/import.*checkN8nHealth.*from.*n8nLiveService/);
  });

  it('wires live health check to n8n connector_type', () => {
    expect(SOURCE).toMatch(/connector_type.*===.*['"]n8n['"]/);
    expect(SOURCE).toMatch(/handleN8nHealthCheck/);
  });

  it('shows "Check n8n Health" label for n8n connector', () => {
    expect(SOURCE).toContain('Check n8n Health');
  });

  it('keeps "Simulate Health Check" for other connectors', () => {
    expect(SOURCE).toContain('Simulate Health Check');
  });

  it('async handler calls checkN8nHealth', () => {
    expect(SOURCE).toMatch(/handleN8nHealthCheck\s*=\s*async/);
    expect(SOURCE).toMatch(/await\s+checkN8nHealth\s*\(\s*\)/);
  });

  it('has loading state for n8n check', () => {
    expect(SOURCE).toContain('isCheckingN8n');
  });

  it('has result state for n8n check', () => {
    expect(SOURCE).toContain('n8nHealthResult');
  });

  it('has error state for n8n check', () => {
    expect(SOURCE).toContain('n8nHealthError');
  });

  it('shows success result for n8n', () => {
    expect(SOURCE).toContain('n8n reachable');
  });

  it('shows failure result for n8n', () => {
    expect(SOURCE).toContain('n8n unreachable');
  });

  // ── Safety invariants ──────────────────────────────────────────────────────

  it('does not set allow_write to true', () => {
    expect(SOURCE).not.toMatch(/allow_write\s*:\s*true/);
  });

  it('does not set allow_publish to true', () => {
    expect(SOURCE).not.toMatch(/allow_publish\s*:\s*true/);
  });

  it('does not set allow_spend to true', () => {
    expect(SOURCE).not.toMatch(/allow_spend\s*:\s*true/);
  });
});

describe('ConnectorRegistryTab — T4-7 Google Drive source guard', () => {
  it('imports checkGdriveHealth from the live service', () => {
    expect(SOURCE).toMatch(/import.*checkGdriveHealth.*from.*gdriveLiveService/);
  });

  it('wires live health check to google_drive connector_type', () => {
    expect(SOURCE).toMatch(/connector_type.*===.*['"]google_drive['"]/);
    expect(SOURCE).toMatch(/handleGdriveHealthCheck/);
  });

  it('shows "Check Drive Health" label for google_drive connector', () => {
    expect(SOURCE).toContain('Check Drive Health');
  });

  it('async handler calls checkGdriveHealth', () => {
    expect(SOURCE).toMatch(/handleGdriveHealthCheck\s*=\s*async/);
    expect(SOURCE).toMatch(/await\s+checkGdriveHealth\s*\(\s*\)/);
  });

  it('has loading state for gdrive check', () => {
    expect(SOURCE).toContain('isCheckingGdrive');
  });

  it('has result state for gdrive check', () => {
    expect(SOURCE).toContain('gdriveHealthResult');
  });

  it('has error state for gdrive check', () => {
    expect(SOURCE).toContain('gdriveHealthError');
  });

  it('shows success result badge for Drive', () => {
    expect(SOURCE).toContain('Drive reachable');
  });

  it('shows failure result badge for Drive', () => {
    expect(SOURCE).toContain('Drive unreachable');
  });
});
