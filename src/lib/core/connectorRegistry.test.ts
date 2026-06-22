import { describe, expect, it } from 'vitest';
import { SEED_CONNECTORS } from './connectorRegistry';

const canva = SEED_CONNECTORS.find(c => c.id === 'conn-canva')!;

describe('connectorRegistry — conn-canva sandbox safety', () => {
  it('exists and is seeded as sandbox/mock, not configured', () => {
    expect(canva).toBeDefined();
    expect(canva.connector_type).toBe('canva');
    expect(canva.mode).toBe('mock');
    expect(canva.status).toBe('not_configured');
  });

  it('requires NO env keys in the current sandbox phase', () => {
    // The UI renders the "Required Env Keys" section only when this array is
    // non-empty (ConnectorRegistryTab: `required_env_keys.length > 0`), so an
    // empty array means the UI shows no current required env keys for Canva.
    expect(canva.required_env_keys).toEqual([]);
    expect(canva.required_env_keys.length).toBe(0);
  });

  it('safety copy states sandbox/mock only, no API key, nothing published', () => {
    const note = canva.safety_note ?? '';
    expect(note.toLowerCase()).toContain('sandbox');
    expect(note.toLowerCase()).toContain('no api key required');
    expect(note.toLowerCase()).toContain('nothing published');
  });

  it('describes the real Canva connector as future-only', () => {
    const blob = `${canva.description ?? ''} ${canva.safety_note ?? ''}`.toLowerCase();
    expect(blob).toContain('future-only');
  });

  it('introduces no real Canva API URL or secret in the seed', () => {
    const blob = JSON.stringify(canva);
    expect(blob).not.toMatch(/canva\.com/i);
    expect(blob).not.toMatch(/https?:\/\//i);
    // No real OAuth token / secret value baked into the seed.
    expect(blob).not.toMatch(/client_secret\s*[:=]\s*\S+/i);
  });
});
