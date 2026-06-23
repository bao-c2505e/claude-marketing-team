import { describe, expect, it } from 'vitest';
import {
  buildBrandBrain,
  buildBrandBrainOption,
  buildBrandContextSnapshot,
  buildAiFactoryBrandContext,
  assessBrandBrainCompleteness,
  APPROVED_NOT_PUBLISHED_REMINDER,
  BRAND_BRAIN_SAFETY_NOTES,
  BRAND_BRAIN_CONTEXT_FIELDS,
  BRAND_BRAIN_STATUS_LABEL,
} from './brandBrain';
import {
  SEED_CLIENTS,
  SEED_BRANDS,
  SEED_CAMPAIGNS,
  SEED_BRIEFS,
  SEED_ASSETS,
} from './coreData';

const brandFor = (id: string) => SEED_BRANDS.find(b => b.id === id)!;
const clientFor = (brandId: string) => {
  const b = brandFor(brandId);
  return SEED_CLIENTS.find(c => c.id === b.client_id) ?? null;
};
const scoped = (brandId: string) => ({
  brand: brandFor(brandId),
  client: clientFor(brandId),
  campaigns: SEED_CAMPAIGNS.filter(c => c.brand_id === brandId),
  briefs: SEED_BRIEFS.filter(b => b.brand_id === brandId),
  assets: SEED_ASSETS.filter(a => a.brand_id === brandId),
});

describe('brandBrain — shared single source of truth (Phase M)', () => {
  it('assembles a normalized Brand Brain from local records', () => {
    const bb = buildBrandBrain(scoped('brand-vi-cuon'));

    expect(bb.brandId).toBe('brand-vi-cuon');
    expect(bb.clientId).toBe('client-vi-cuon');
    expect(bb.brandName).toBe('Vị Cuốn');
    expect(bb.clientName).toBe('Vị Cuốn');
    expect(bb.category).toMatch(/Street Food/);
    // positioning is a composed line (industry · hero product).
    expect(bb.positioning).toMatch(/Street Food/);
    expect(bb.positioning).toMatch(/heo quay/i);

    expect(bb.targetCustomers.length).toBeGreaterThan(0);
    expect(bb.products.length).toBeGreaterThan(0);
    expect(bb.offers.length).toBeGreaterThan(0);
    expect(bb.brandVoice.length).toBeGreaterThan(0);
    expect(bb.contentPillars.length).toBeGreaterThan(0);
    expect(bb.creativeDos.length).toBeGreaterThan(0);
    expect(bb.creativeDonts.length).toBeGreaterThan(0);
    expect(bb.claimComplianceNotes.length).toBeGreaterThan(0);
    expect(bb.ownerNotes.length).toBeGreaterThan(0);
    expect(bb.channels.length).toBeGreaterThan(0);
    expect(bb.brandColors.length).toBeGreaterThan(0);

    // Campaign context carries the per-campaign goal from its brief.
    expect(bb.campaignContext.length).toBe(1);
    expect(bb.campaignContext[0].goal).toMatch(/.+/);

    // Asset references + status counts come from the brand's assets.
    expect(bb.assetReferences.length).toBe(3);
    expect(Object.values(bb.assetStatusCounts).reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('always flags context as internal + carries approval-first safety notes', () => {
    const bb = buildBrandBrain(scoped('brand-vi-cuon'));
    expect(bb.source).toBe('internal');
    expect(bb.approvalSafetyNotes).toEqual(BRAND_BRAIN_SAFETY_NOTES);
    expect(bb.approvalSafetyNotes.join(' ')).toMatch(/Approved ≠ Published/);
    expect(bb.approvalSafetyNotes.join(' ')).toMatch(/internal only/i);
    expect(bb.approvalSafetyNotes.join(' ')).toMatch(/No fabricated metrics/i);
  });

  it('derives internal review status from the brand brief (never an external state)', () => {
    // vi-cuon brief: draft → draft; com-tam: ready_for_generation → needs_review;
    // moc-an: approved_for_generation → approved_internal.
    expect(buildBrandBrain(scoped('brand-vi-cuon')).status).toBe('draft');
    expect(buildBrandBrain(scoped('brand-com-tam')).status).toBe('needs_review');
    expect(buildBrandBrain(scoped('brand-moc-an')).status).toBe('approved_internal');

    // Status is one of the internal lifecycle values only.
    const statuses = Object.keys(BRAND_BRAIN_STATUS_LABEL);
    for (const id of ['brand-vi-cuon', 'brand-com-tam', 'brand-moc-an']) {
      expect(statuses).toContain(buildBrandBrain(scoped(id)).status);
    }
  });

  it('scores completeness and lists missing context fields', () => {
    // A fully-seeded brand is 100% complete with no missing fields.
    const full = assessBrandBrainCompleteness(buildBrandBrain(scoped('brand-vi-cuon')));
    expect(full.total).toBe(BRAND_BRAIN_CONTEXT_FIELDS.length);
    expect(full.present).toBe(full.total);
    expect(full.percent).toBe(100);
    expect(full.missing).toEqual([]);

    // A brand with no client / briefs / campaigns / assets is partially complete:
    // brand-record fields stay present, brief-only fields are reported missing.
    const sparse = assessBrandBrainCompleteness(
      buildBrandBrain({ brand: brandFor('brand-vi-cuon'), client: null, campaigns: [], briefs: [], assets: [] }),
    );
    expect(sparse.percent).toBeLessThan(100);
    expect(sparse.missing).toContain('Content Pillars');
    expect(sparse.missing).toContain('Owner Notes');
    expect(sparse.missing).toContain('Campaign Context');
  });

  it('does not mutate its inputs (pure builder)', () => {
    const input = scoped('brand-vi-cuon');
    const briefsBefore = input.briefs.length;
    const assetsBefore = input.assets.length;
    buildBrandBrain(input);
    expect(input.briefs.length).toBe(briefsBefore);
    expect(input.assets.length).toBe(assetsBefore);
  });

  it('projects a compact, draft-only AI Factory context snapshot (Phase N)', () => {
    const snap = buildBrandContextSnapshot(buildBrandBrain(scoped('brand-vi-cuon')));

    // Brand identity + normalized context carry through from the Brand Brain.
    expect(snap.brand_identity.brand_name).toBe('Vị Cuốn');
    expect(snap.brand_identity.client_name).toBe('Vị Cuốn');
    expect(snap.positioning).toMatch(/Street Food/);
    expect(snap.target_customers.length).toBeGreaterThan(0);
    expect(snap.products_offers.length).toBeGreaterThan(0);
    expect(snap.brand_voice.length).toBeGreaterThan(0);
    expect(snap.content_pillars.length).toBeGreaterThan(0);
    expect(snap.creative_donts.length).toBeGreaterThan(0);
    expect(snap.claim_compliance_notes.length).toBeGreaterThan(0);
    expect(snap.campaign_context.length).toBeGreaterThan(0);

    // Internal / draft-only / approval-first labels are pinned by construction.
    expect(snap.source).toBe('internal');
    expect(snap.draft_only).toBe(true);
    expect(snap.internal_only).toBe(true);
    expect(snap.owner_approval_required).toBe(true);
    expect(snap.approved_not_published).toBe(APPROVED_NOT_PUBLISHED_REMINDER);
    expect(snap.approved_not_published).toMatch(/Approved ≠ Published/);
    expect(snap.safety_notes).toEqual(BRAND_BRAIN_SAFETY_NOTES);

    // Status is always one of the internal lifecycle values — never published/launched.
    expect(Object.keys(BRAND_BRAIN_STATUS_LABEL)).toContain(snap.status);
  });

  it('caps each snapshot list so request framing stays compact', () => {
    const brain = buildBrandBrain(scoped('brand-vi-cuon'));
    // Flood every list field with > cap entries; the snapshot must clamp to <= 8.
    const flooded = {
      ...brain,
      targetCustomers: Array.from({ length: 30 }, (_, i) => `aud-${i}`),
      products: Array.from({ length: 30 }, (_, i) => `prod-${i}`),
      offers: Array.from({ length: 30 }, (_, i) => `offer-${i}`),
    };
    const snap = buildBrandContextSnapshot(flooded);
    expect(snap.target_customers.length).toBeLessThanOrEqual(8);
    expect(snap.products_offers.length).toBeLessThanOrEqual(8);
  });

  it('builds the snapshot from the single-record AI Factory input shape', () => {
    const brand = brandFor('brand-vi-cuon');
    const client = clientFor('brand-vi-cuon');
    const campaign = SEED_CAMPAIGNS.find(c => c.brand_id === brand.id) ?? null;
    const brief = SEED_BRIEFS.find(b => b.brand_id === brand.id) ?? null;

    const snap = buildAiFactoryBrandContext({ brand, client, campaign, brief });
    expect(snap.brand_identity.brand_name).toBe('Vị Cuốn');
    expect(snap.campaign_context.length).toBe(1);
    expect(snap.draft_only).toBe(true);
    expect(snap.source).toBe('internal');

    // Tolerates a brand with no campaign/brief (still internal + draft-only).
    const sparse = buildAiFactoryBrandContext({ brand, client: null, campaign: null, brief: null });
    expect(sparse.campaign_context).toEqual([]);
    expect(sparse.owner_approval_required).toBe(true);
    expect(sparse.approved_not_published).toMatch(/Approved ≠ Published/);
  });

  it('builds a lightweight picker option for a brand', () => {
    const opt = buildBrandBrainOption({
      brand: brandFor('brand-moc-an'),
      client: clientFor('brand-moc-an'),
      firstCampaignStatus: 'active',
    });
    expect(opt.id).toBe('brand-moc-an');
    expect(opt.name).toBe('Mộc An Coffee');
    expect(opt.clientName).toBe('Mộc An Coffee');
    expect(opt.status).toBe('active');
    // Falls back to the brand's own status when no campaign status is supplied.
    expect(buildBrandBrainOption({ brand: brandFor('brand-moc-an'), client: null, firstCampaignStatus: null }).status)
      .toBe(brandFor('brand-moc-an').status);
  });
});
