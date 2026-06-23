// Phase N — AI Factory Brand Context Injection
// ---------------------------------------------------------------------------
// Verifies that every AI Factory module (Content / Design / Video / Ads /
// Report) frames its request with the SAME normalized, draft-only Brand Brain
// context snapshot, and that the safety posture (internal · draft-only ·
// approval-first · Approved ≠ Published · no live connectors) is preserved.
import { describe, expect, it } from 'vitest';
import { createContentFactoryPayload } from './contentFactory';
import { createDesignBriefPayload } from './designFactory';
import { createVideoScriptPayload } from './videoFactory';
import { createAdsPackPayload } from './adsFactory';
import { createReportDraftPayload } from './reportFactory';
import { APPROVED_NOT_PUBLISHED_REMINDER } from './brandBrain';
import type { ContentFactoryRunInput } from './contentFactory';
import { SEED_CLIENTS, SEED_BRANDS, SEED_CAMPAIGNS, SEED_BRIEFS } from './coreData';

const client = SEED_CLIENTS.find(c => c.id === 'client-vi-cuon')!;
const brand = SEED_BRANDS.find(b => b.id === 'brand-vi-cuon')!;
const campaign = SEED_CAMPAIGNS.find(c => c.brand_id === 'brand-vi-cuon')!;
const brief = SEED_BRIEFS.find(b => b.brand_id === 'brand-vi-cuon')!;

const input: ContentFactoryRunInput = {
  client,
  brand,
  campaign,
  brief,
  requestedBy: 'owner@example.com',
  options: { planLengthDays: 7, channel: 'Facebook', goal: 'branding' },
};

// Each factory payload exposes the snapshot under the same additive key.
const payloads = {
  content: createContentFactoryPayload(input),
  design: createDesignBriefPayload(input),
  video: createVideoScriptPayload(input),
  ads: createAdsPackPayload(input),
  report: createReportDraftPayload(input),
};

describe('AI Factory brand context injection (Phase N)', () => {
  it('every factory payload carries the shared normalized Brand Brain context', () => {
    for (const [name, payload] of Object.entries(payloads)) {
      const ctx = payload.brand_brain_context;
      expect(ctx, `${name} should carry brand_brain_context`).toBeTruthy();
      // Grounded in the selected brand / campaign.
      expect(ctx.brand_identity.brand_name).toBe('Vị Cuốn');
      expect(ctx.positioning).toMatch(/Street Food/);
      expect(ctx.target_customers.length).toBeGreaterThan(0);
      expect(ctx.products_offers.length).toBeGreaterThan(0);
      expect(ctx.brand_voice.length).toBeGreaterThan(0);
      expect(ctx.content_pillars.length).toBeGreaterThan(0);
      expect(ctx.campaign_context.length).toBeGreaterThan(0);
    }
  });

  it('all factory contexts are identical (single source of truth)', () => {
    const ids = Object.values(payloads).map(p => p.brand_brain_context.brand_identity.brand_name);
    expect(new Set(ids).size).toBe(1);
    // Same positioning / pillars across modules — no per-module re-derivation drift.
    const pillars = Object.values(payloads).map(p => p.brand_brain_context.content_pillars.join('|'));
    expect(new Set(pillars).size).toBe(1);
  });

  it('keeps internal / draft-only / approval-first labels on every payload', () => {
    for (const [name, payload] of Object.entries(payloads)) {
      const ctx = payload.brand_brain_context;
      expect(ctx.source, name).toBe('internal');
      expect(ctx.draft_only, name).toBe(true);
      expect(ctx.internal_only, name).toBe(true);
      expect(ctx.owner_approval_required, name).toBe(true);
      expect(ctx.approved_not_published).toBe(APPROVED_NOT_PUBLISHED_REMINDER);
      expect(ctx.approved_not_published).toMatch(/Approved ≠ Published/);
      expect(ctx.safety_notes.join(' ')).toMatch(/Approved ≠ Published/);
      // Payload-level approval gate is untouched.
      expect(payload.owner_approval_required).toBe(true);
      expect(payload.safety.no_auto_post).toBe(true);
      expect(payload.safety.no_auto_ads).toBe(true);
      expect(payload.safety.no_live_connectors).toBe(true);
    }
  });

  it('introduces no published/launched state and no URL/token in the context', () => {
    for (const payload of Object.values(payloads)) {
      const serialized = JSON.stringify(payload.brand_brain_context);
      expect(serialized).not.toMatch(/"status"\s*:\s*"published"/);
      expect(serialized).not.toMatch(/"status"\s*:\s*"launched"/);
      expect(serialized).not.toMatch(/https?:\/\//i);
      expect(serialized).not.toMatch(/access_token|OPENAI_API_KEY|OAuth/i);
      // status stays an internal review value.
      expect(['draft', 'needs_review', 'approved_internal', 'archived'])
        .toContain(payload.brand_brain_context.status);
    }
  });
});
