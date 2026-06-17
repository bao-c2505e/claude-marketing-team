import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createReportDraftPayload, runReportFactory } from './reportFactory';
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

describe('reportFactory', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('VITE_N8N_REPORT_DRAFT_WEBHOOK_URL', '');
  });

  it('builds an approval-first, analytics-free report draft request payload', () => {
    const payload = createReportDraftPayload(input);

    expect(payload.workflow_type).toBe('report_draft');
    expect(payload.generated_by).toBe('owner@example.com');
    expect(payload.owner_approval_required).toBe(true);
    expect(payload.generate_images).toBe(false);
    expect(payload.generate_videos).toBe(false);
    expect(payload.pull_live_analytics).toBe(false);
    expect(payload.use_unverified_metrics).toBe(false);
    expect(payload.report_draft_types).toContain('campaign_status_summary');
    expect(payload.report_draft_types).toHaveLength(5);
    expect(payload.safety).toMatchObject({
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_platform_launch: true,
      no_image_generation: true,
      no_video_generation: true,
      no_live_analytics_pull: true,
      no_unverified_metrics: true,
      no_secrets: true,
      owner_approval_required: true,
    });
  });

  it('falls back to local sample report drafts (no live data) when the webhook env is absent', async () => {
    const result = await runReportFactory(input);

    expect(fetch).not.toHaveBeenCalled();
    expect(result.mode).toBe('local_mock');
    expect(result.job.generation_mode).toBe('mock');
    expect(GENERATION_MODE_LABEL[result.job.generation_mode]).toBe('Local fallback mode');
    // V1 produces the fixed set of 5 report draft specs.
    expect(result.items).toHaveLength(5);
    expect(result.items.every(item => item.content_type === 'report_draft')).toBe(true);
    // Approval-first: every item is review-gated, never auto-approved.
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    // Structured fields + safety land in the caption spec block.
    const first = result.items[0].caption;
    expect(first).toContain('workflow_type: report_draft');
    expect(first).toContain('content_type: report_draft');
    expect(first).toContain('status: pending_approval');
    expect(first).toContain('Data basis:');
    expect(first).toContain('Summary draft:');
    expect(first).toContain('no_auto_post=true');
    expect(first).toContain('no_auto_ads=true');
    expect(first).toContain('no_platform_launch=true');
    expect(first).toContain('no_image_generation=true');
    expect(first).toContain('no_video_generation=true');
    expect(first).toContain('no_live_analytics_pull=true');
    expect(first).toContain('no_unverified_metrics=true');
    // Local fallback must never imply real platform data was pulled.
    expect(result.items.every(item => /no live analytics/i.test(item.caption))).toBe(true);
    // Quality: no generic "Owner to confirm ..." placeholders anywhere.
    expect(result.items.every(item => !/Owner to confirm/i.test(item.caption))).toBe(true);
    // The first item resolves to a real, specific spec (not a generic label).
    expect(result.items[0].angle).toBe('Campaign Status Summary Draft');
  });

  it('uses external_module mode and n8n provenance when the webhook is configured', async () => {
    vi.stubEnv('VITE_N8N_REPORT_DRAFT_WEBHOOK_URL', 'https://n8n.example.com/webhook/report-draft');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: [
          { key: 'campaign_status_summary', title: 'Status Draft', objective: 'summarize status', summary_body: 'Briefs approved' },
          { key: 'report_handoff', title: 'Handoff Skeleton', objective: 'assemble report' },
        ],
      }),
    });

    const result = await runReportFactory(input);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe('n8n');
    expect(result.job.generation_mode).toBe('external_module');
    expect(GENERATION_MODE_LABEL[result.job.generation_mode]).toBe('n8n AI Provider');
    expect(result.items.every(item => item.content_type === 'report_draft')).toBe(true);
    // Approval-first preserved on the n8n path too.
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items[0].caption).toContain('generated_by: n8n-ai-provider');
    expect(result.items[0].caption).toContain('generation_mode: external_module');
    // Metadata consistency: workflow_type forced to report_draft even from n8n.
    expect(result.items.every(item => item.caption.includes('workflow_type: report_draft'))).toBe(true);
    // No-metrics guarantee: every item still carries the no-live-analytics data basis,
    // even when the AI response omits data_basis.
    expect(result.items.every(item => /no live analytics/i.test(item.caption))).toBe(true);
    // Quality: the second item omits summary/data fields — it must resolve to the
    // canonical spec + "Assumption: ...", never a generic "Owner to confirm".
    const handoff = result.items[1];
    expect(handoff.angle).toBe('Handoff Skeleton');
    expect(handoff.caption).not.toMatch(/Owner to confirm/i);
  });

  it('fails safely when the configured webhook returns no items', async () => {
    vi.stubEnv('VITE_N8N_REPORT_DRAFT_WEBHOOK_URL', 'https://n8n.example.com/webhook/report-draft');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: [] }) });

    await expect(runReportFactory(input)).rejects.toThrow(/no report draft items/i);
  });
});
