import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createDesignBriefPayload, runDesignFactory } from './designFactory';
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

const unsafeExecutionCopy = /(image file (created|generated)|created image|generated image|was published|were published|published live|ads? launched|spend occurred|spent budget|live analytics|analytics were pulled)/i;

describe('designFactory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL', '');
  });

  it('builds an approval-first, image-free design brief request payload', () => {
    const payload = createDesignBriefPayload(input);

    expect(payload.workflow_type).toBe('design_factory');
    expect(payload.generated_by).toBe('owner@example.com');
    expect(payload.owner_approval_required).toBe(true);
    expect(payload.generate_images).toBe(false);
    expect(payload.design_brief_types).toContain('facebook_post');
    expect(payload.design_brief_types).toHaveLength(5);
    expect(payload.safety).toMatchObject({
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_image_generation: true,
      no_secrets: true,
      owner_approval_required: true,
    });
  });

  it('falls back to local sample design briefs when the webhook env is absent', async () => {
    const result = await runDesignFactory(input);

    expect(fetch).not.toHaveBeenCalled();
    expect(result.mode).toBe('local_mock');
    expect(result.job.generation_mode).toBe('mock');
    expect(GENERATION_MODE_LABEL[result.job.generation_mode]).toBe('Local fallback mode');
    // V1 produces the fixed set of 5 design brief specs.
    expect(result.items).toHaveLength(5);
    expect(result.items.every(item => item.content_type === 'design_brief')).toBe(true);
    // Approval-first: every item is review-gated, never auto-approved.
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    // Structured fields + safety land in the caption spec block.
    const first = result.items[0].caption;
    expect(first).toContain('workflow_type: design_factory');
    expect(first).toContain('content_type: design_brief');
    expect(first).toContain('status: pending_approval');
    expect(first).toContain('Format / ratio:');
    expect(first).toContain('no_auto_post=true');
    expect(first).toContain('no_auto_ads=true');
    expect(first).toContain('no_image_generation=true');
    // No image generation: explicitly states real photography only.
    expect(first).toContain('No AI image generation in this V1 flow.');
    // Quality: no generic "Owner to confirm ..." placeholders anywhere.
    expect(result.items.every(item => !/Owner to confirm/i.test(item.caption))).toBe(true);
    // The first item resolves to a real, specific spec (not "Design Brief").
    expect(result.items[0].angle).toBe('Facebook Post Design Brief');
  });

  it('uses external_module mode and n8n provenance when the webhook is configured', async () => {
    vi.stubEnv('VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL', 'https://n8n.example.com/webhook/design-factory');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: [
          { key: 'facebook_post', title: 'FB Post Brief', format: '1:1', objective: 'engagement', visual_direction: 'hero shot' },
          { key: 'designer_handoff_notes', title: 'Handoff', format: 'doc', objective: 'handoff' },
        ],
      }),
    });

    const result = await runDesignFactory(input);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe('n8n');
    expect(result.job.generation_mode).toBe('external_module');
    expect(GENERATION_MODE_LABEL[result.job.generation_mode]).toBe('n8n AI Provider');
    // V1 always normalizes to the fixed set of 5 design brief approval items.
    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items.every(item => item.content_type === 'design_brief')).toBe(true);
    // Approval-first preserved on the n8n path too.
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('generated_by: n8n-ai-provider'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    // Metadata consistency: workflow_type forced to design_factory even from n8n.
    expect(result.items.every(item => item.caption.includes('workflow_type: design_factory'))).toBe(true);
    // Quality: the second item omits copy/cta fields — it must resolve to the
    // canonical spec + "Assumption: ...", never a generic "Owner to confirm".
    const handoff = result.items[1];
    expect(handoff.angle).toBe('Handoff');
    expect(result.items.every(item => !/Owner to confirm/i.test(item.caption))).toBe(true);
    expect(result.items.every(item => !/Owner to confirm/i.test(item.cta))).toBe(true);
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
  });

  it('caps n8n design brief output to exactly 5 approval items', async () => {
    vi.stubEnv('VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL', 'https://n8n.example.com/webhook/design-factory');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: Array.from({ length: 10 }, (_, idx) => ({
          key: `extra_${idx + 1}`,
          title: `Returned Brief ${idx + 1}`,
          objective: `Objective ${idx + 1}`,
          visual_direction: `Safe text/spec direction ${idx + 1}`,
        })),
      }),
    });

    const result = await runDesignFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items[0].angle).toBe('Returned Brief 1');
    expect(result.items[4].angle).toBe('Returned Brief 5');
    expect(result.items.some(item => item.angle === 'Returned Brief 6')).toBe(false);
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
  });

  it('pads short n8n design brief output with safe fallback approval items', async () => {
    vi.stubEnv('VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL', 'https://n8n.example.com/webhook/design-factory');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: [
          { key: 'facebook_post', title: 'FB Post Brief', format: '4:5', objective: 'feed engagement', visual_direction: 'real food photo only' },
          { key: 'story_reels_cover', title: 'Story Cover Brief', format: '9:16', objective: 'story tap', visual_direction: 'real food photo only' },
        ],
      }),
    });

    const result = await runDesignFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items[0].angle).toBe('FB Post Brief');
    expect(result.items[1].angle).toBe('Story Cover Brief');
    expect(result.items[2].angle).toBe('Menu / Promo Visual Design Brief');
    expect(result.items[3].angle).toBe('Key Visual Direction');
    expect(result.items[4].angle).toBe('Designer Handoff Notes');
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('pending_approval'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generated_by: n8n-ai-provider'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('No AI image generation in this V1 flow.'))).toBe(true);
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
  });

  it('pads empty n8n design brief output with safe fallback approval items', async () => {
    vi.stubEnv('VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL', 'https://n8n.example.com/webhook/design-factory');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ ok: true, generated_by: 'n8n-ai-provider', items: [] }) });

    const result = await runDesignFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => !unsafeExecutionCopy.test(item.caption))).toBe(true);
  });
});
