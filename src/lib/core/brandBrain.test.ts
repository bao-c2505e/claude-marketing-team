import { describe, expect, it } from 'vitest';
import {
  buildBrandBrain,
  buildBrandBrainOption,
  assessBrandBrainCompleteness,
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
