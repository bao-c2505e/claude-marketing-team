import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createContentFactoryPayload, runContentFactory } from './contentFactory';
import { GENERATION_MODE_LABEL, GENERATION_MODE_SOURCE } from './coreData';
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
  created_at: '2026-06-16T00:00:00.000Z',
  updated_at: '2026-06-16T00:00:00.000Z',
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
  brand_colors: null,
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

describe('contentFactory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL', '');
  });

  it('creates a safety-gated content pack request payload', () => {
    const payload = createContentFactoryPayload(input);

    expect(payload.workflow_type).toBe('content_pack');
    expect(payload.generated_by).toBe('owner@example.com');
    expect(payload.owner_approval_required).toBe(true);
    expect(payload.options.plan_length_days).toBe(7);
    expect(payload.safety).toMatchObject({
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_secrets: true,
      owner_approval_required: true,
    });
  });

  it('falls back to local mock output when webhook env is absent', async () => {
    const result = await runContentFactory(input);

    expect(fetch).not.toHaveBeenCalled();
    expect(result.mode).toBe('local_mock');
    expect(result.job.generation_mode).toBe('mock');
    expect(result.items).toHaveLength(7);
    expect(result.items[0].status).toBe('needs_review');
    expect(result.items[0].caption).toContain('workflow_type: content_pack');
    expect(result.items[0].caption).toContain('status: pending_approval');
    expect(result.items[0].caption).toContain('owner_approval_required: true');
  });

  it('uses external_module mode and n8n provenance when the webhook is configured', async () => {
    vi.stubEnv('VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL', 'https://n8n.example.com/webhook/content-factory');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: [{ day_number: 1, channel: 'Facebook', hook: 'AI hook', caption: 'AI caption' }],
      }),
    });

    const result = await runContentFactory({ ...input, options: { ...input.options, planLengthDays: 7 } });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe('n8n');
    expect(result.job.generation_mode).toBe('external_module');
    // Production label + provenance the UI renders for an n8n job.
    expect(GENERATION_MODE_LABEL[result.job.generation_mode]).toBe('n8n AI Provider');
    expect(GENERATION_MODE_SOURCE[result.job.generation_mode]).toContain('generated_by: n8n-ai-provider');
    // Approval-first preserved: n8n items are still review-gated, never auto-approved.
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
  });

  it('labels the local fallback job as Local fallback mode', () => {
    expect(GENERATION_MODE_LABEL.mock).toBe('Local fallback mode');
    expect(GENERATION_MODE_SOURCE.mock).toContain('core-local-mock');
  });
});
