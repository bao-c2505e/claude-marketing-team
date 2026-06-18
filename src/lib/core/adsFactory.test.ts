import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createAdsPackPayload, runAdsFactory } from './adsFactory';
import { GENERATION_MODE_LABEL } from './coreData';
import type { Brand, Campaign, CampaignBrief, Client } from '../../types/core';

const client: Client = {
  id: 'client-1',
  name: 'Demo Client',
  slug: 'demo-client',
  contact_name: null,
  contact_email: null,
  contact_phone: null,
  status: 'active',
  notes: null,
  created_by: null,
  created_at: '2026-06-17T00:00:00.000Z',
  updated_at: '2026-06-17T00:00:00.000Z',
};

const brand: Brand = {
  id: 'brand-1',
  client_id: client.id,
  name: 'Demo Brand',
  slug: 'demo-brand',
  industry: 'F&B',
  hero_product: 'Signature dish',
  tone_of_voice: 'Warm and direct',
  target_audience: 'Local diners',
  primary_channels: ['Facebook'],
  brand_colors: { primary: '#8B0000', support: 'cream' },
  logo_url: null,
  status: 'active',
  created_by: null,
  created_at: client.created_at,
  updated_at: client.updated_at,
};

const campaign: Campaign = {
  id: 'campaign-1',
  brand_id: brand.id,
  client_id: client.id,
  name: 'Demo Campaign',
  description: 'Launch campaign',
  campaign_type: '7_day',
  duration_days: 7,
  start_date: null,
  end_date: null,
  status: 'active',
  budget_estimate: null,
  currency: 'VND',
  created_by: null,
  created_at: client.created_at,
  updated_at: client.updated_at,
};

const brief: CampaignBrief = {
  id: 'brief-1',
  campaign_id: campaign.id,
  brand_id: brand.id,
  client_id: client.id,
  brand_name: brand.name,
  hero_product: brand.hero_product,
  industry: brand.industry,
  brief_title: 'Demo Brief',
  campaign_goal: 'Increase awareness',
  product_focus: 'Signature dish',
  offer: 'Opening combo',
  tone_of_voice: brand.tone_of_voice,
  tone: null,
  target_audience: brand.target_audience,
  campaign_goals: ['branding'],
  key_messages: ['Fresh and fast'],
  channels: ['Facebook'],
  content_pillars: ['Product'],
  must_include: 'Address',
  must_avoid: 'Unverified claims',
  competitors: null,
  reference_links: null,
  budget_note: null,
  timeline_note: null,
  approval_requirements: 'Owner approval required',
  duration_days: 7,
  additional_notes: null,
  status: 'approved_for_generation',
  submitted_by: null,
  submitted_at: null,
  created_at: client.created_at,
  updated_at: client.updated_at,
};

const input = {
  client,
  brand,
  campaign,
  brief,
  requestedBy: 'owner@example.com',
  options: {
    planLengthDays: 7 as const,
    channel: 'Facebook' as const,
    goal: 'branding' as const,
  },
};

// Guards against the module ever claiming an action it must not perform: real ad
// launch / campaign / ad-set creation, publishing, posting to a channel, ad
// spend, a live ad-account connection, or fabricated performance metrics.
const unsafeExecutionCopy = /(ads? (were|was) launched|launched (an? )?ads?\b|campaign (was )?launched|ad set was created|budget was spent|spend occurred|was published|were published|published live|posted to (facebook|tiktok|zalo|instagram)|connected to (a )?live ad account|fake (cpm|cpc|ctr|roas|reach|impressions)|guaranteed (sales|orders|roas))/i;

describe('adsFactory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('VITE_N8N_ADS_PACK_WEBHOOK_URL', '');
  });

  it('builds an approval-first, image/video-free, launch-free ads pack request payload', () => {
    const payload = createAdsPackPayload(input);

    expect(payload.workflow_type).toBe('ads_pack');
    expect(payload.generated_by).toBe('owner@example.com');
    expect(payload.owner_approval_required).toBe(true);
    expect(payload.generate_images).toBe(false);
    expect(payload.generate_videos).toBe(false);
    expect(payload.create_ads).toBe(false);
    expect(payload.launch_ads).toBe(false);
    expect(payload.ads_pack_types).toContain('campaign_angle_offer');
    expect(payload.ads_pack_types).toHaveLength(5);
    expect(payload.safety).toMatchObject({
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_platform_launch: true,
      no_image_generation: true,
      no_video_generation: true,
      no_secrets: true,
      owner_approval_required: true,
    });
  });

  it('falls back to local sample ads drafts when the webhook env is absent', async () => {
    const result = await runAdsFactory(input);

    expect(fetch).not.toHaveBeenCalled();
    expect(result.mode).toBe('local_mock');
    expect(result.job.generation_mode).toBe('mock');
    expect(GENERATION_MODE_LABEL[result.job.generation_mode]).toBe('Local fallback mode');
    // V1 produces the fixed set of 5 ads draft specs.
    expect(result.items).toHaveLength(5);
    expect(result.items.every(item => item.content_type === 'ads_draft')).toBe(true);
    // Approval-first: every item is review-gated, never auto-approved.
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    // Senior-FnB structured fields + safety land in the caption spec block.
    const first = result.items[0].caption;
    expect(first).toContain('workflow_type: ads_pack');
    expect(first).toContain('content_type: ads_draft');
    expect(first).toContain('status: pending_approval');
    expect(first).toContain('Mục tiêu chiến dịch đề xuất:');
    expect(first).toContain('Tệp khách mục tiêu (giả định):');
    expect(first).toContain('Insight khách hàng:');
    expect(first).toContain('Góc tiếp cận / thông điệp (offer angle):');
    expect(first).toContain('Primary text (nháp):');
    expect(first).toContain('Headline (nháp):');
    expect(first).toContain('Description (nháp):');
    expect(first).toContain('Hướng sáng tạo (creative direction):');
    expect(first).toContain('Vị trí hiển thị đề xuất (placement):');
    expect(first).toContain('CTA:');
    expect(first).toContain('Checklist Owner duyệt:');
    expect(first).toContain('no_auto_post=true');
    expect(first).toContain('no_auto_ads=true');
    expect(first).toContain('no_platform_launch=true');
    expect(first).toContain('no_image_generation=true');
    expect(first).toContain('no_video_generation=true');
    // Safety label: draft concept only, not launched, no spend, no live ad account.
    expect(first).toContain('Draft ads concept only · Pending approval · Not launched · No spend · No live ad account connection.');
    // Honest by construction: no fake launch / spend / publish / metrics claims.
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
    // Quality: no generic "Owner to confirm ..." placeholders anywhere.
    expect(result.items.every(item => !/Owner to confirm/i.test(item.caption))).toBe(true);
    // The first item resolves to a real, specific spec (not a generic label).
    expect(result.items[0].angle).toBe('Campaign Angle & Offer Draft');
  });

  it('uses external_module mode and n8n provenance when the webhook is configured', async () => {
    vi.stubEnv('VITE_N8N_ADS_PACK_WEBHOOK_URL', 'https://n8n.example.com/webhook/ads-pack');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: [
          { key: 'campaign_angle_offer', title: 'Angle Draft', objective: 'pick the angle', primary_text: 'Lead with the offer' },
          { key: 'ads_manager_handoff', title: 'Handoff Checklist', objective: 'manual setup' },
        ],
      }),
    });

    const result = await runAdsFactory(input);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe('n8n');
    expect(result.job.generation_mode).toBe('external_module');
    expect(GENERATION_MODE_LABEL[result.job.generation_mode]).toBe('n8n AI Provider');
    // V1 always normalizes to the fixed set of 5 ads draft approval items.
    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items.every(item => item.content_type === 'ads_draft')).toBe(true);
    // Approval-first preserved on the n8n path too.
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('generated_by: n8n-ai-provider'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    // Metadata consistency: workflow_type forced to ads_pack even from n8n.
    expect(result.items.every(item => item.caption.includes('workflow_type: ads_pack'))).toBe(true);
    // Quality: the second item omits most fields — it must resolve to the
    // canonical spec + senior-FnB defaults, never a generic "Owner to confirm".
    const handoff = result.items[1];
    expect(handoff.angle).toBe('Handoff Checklist');
    expect(result.items.every(item => !/Owner to confirm/i.test(item.caption))).toBe(true);
    expect(result.items.every(item => !/Owner to confirm/i.test(item.cta))).toBe(true);
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
  });

  it('caps n8n ads pack output to exactly 5 approval items', async () => {
    vi.stubEnv('VITE_N8N_ADS_PACK_WEBHOOK_URL', 'https://n8n.example.com/webhook/ads-pack');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: Array.from({ length: 9 }, (_, idx) => ({
          key: `extra_${idx + 1}`,
          title: `Returned Ads Draft ${idx + 1}`,
          objective: `Objective ${idx + 1}`,
          primary_text: `Safe draft ad copy ${idx + 1}`,
        })),
      }),
    });

    const result = await runAdsFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items[0].angle).toBe('Returned Ads Draft 1');
    expect(result.items[4].angle).toBe('Returned Ads Draft 5');
    expect(result.items.some(item => item.angle === 'Returned Ads Draft 6')).toBe(false);
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
  });

  it('pads short n8n ads pack output with safe fallback approval items', async () => {
    vi.stubEnv('VITE_N8N_ADS_PACK_WEBHOOK_URL', 'https://n8n.example.com/webhook/ads-pack');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: [
          { key: 'campaign_angle_offer', title: 'Angle Draft', objective: 'pick the angle', primary_text: 'Lead with the offer' },
          { key: 'ad_copy_variants', title: 'Copy Variants', objective: 'draft A/B copy' },
        ],
      }),
    });

    const result = await runAdsFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items[0].angle).toBe('Angle Draft');
    expect(result.items[1].angle).toBe('Copy Variants');
    expect(result.items[2].angle).toBe('Audience & Targeting Notes');
    expect(result.items[3].angle).toBe('Budget & Testing Plan Draft');
    expect(result.items[4].angle).toBe('Ads Manager Handoff Checklist');
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('pending_approval'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generated_by: n8n-ai-provider'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('Not launched · No spend · No live ad account connection.'))).toBe(true);
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
  });

  it('pads empty n8n ads pack output with safe fallback approval items', async () => {
    vi.stubEnv('VITE_N8N_ADS_PACK_WEBHOOK_URL', 'https://n8n.example.com/webhook/ads-pack');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ ok: true, generated_by: 'n8n-ai-provider', items: [] }) });

    const result = await runAdsFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
  });

  it('rejects a non-array items response as a contract breach', async () => {
    vi.stubEnv('VITE_N8N_ADS_PACK_WEBHOOK_URL', 'https://n8n.example.com/webhook/ads-pack');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: { not: 'an array' } }) });

    await expect(runAdsFactory(input)).rejects.toThrow(/invalid ads draft items/i);
  });
});
