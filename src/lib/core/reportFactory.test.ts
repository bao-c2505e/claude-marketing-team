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

// Guards against the module ever fabricating performance data or claiming an
// action it must not perform: pulling live analytics, connecting to a data
// source, inventing numeric metrics (ROAS/CTR/CPC/CPM/reach/impressions/orders/
// messages/etc.), or claiming the report/post/ads were published/launched/sent.
const unsafeReportCopy = /(pulled live analytics|live analytics (were|was) (pulled|fetched)|fetched (data )?from (ga4|google analytics|meta|tiktok|zalo|grabfood|shopeefood|pos|crm)|connected to (ga4|google analytics|meta|tiktok|zalo|crm|pos)|(roas|ctr|cpc|cpm|reach|impressions|conversion rate)\s*(of|was|is|=|:)\s*\d|\d+\s*(orders|messages|leads|clicks|conversions|impressions|views|likes|comments)|report (was )?sent to (the )?client|posts? (were|was) published|ads? (were|was) launched)/i;

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
    // Senior-FnB structured fields + safety land in the caption spec block.
    const first = result.items[0].caption;
    expect(first).toContain('workflow_type: report_draft');
    expect(first).toContain('content_type: report_draft');
    expect(first).toContain('status: pending_approval');
    expect(first).toContain('Mục tiêu báo cáo:');
    expect(first).toContain('Kỳ báo cáo:');
    expect(first).toContain('Tình trạng nguồn dữ liệu:');
    expect(first).toContain('Tóm tắt điều hành (không bịa số):');
    expect(first).toContain('Quan sát chính');
    expect(first).toContain('Rà soát nội dung & sáng tạo:');
    expect(first).toContain('Rà soát chiến dịch/quảng cáo (bản nháp, không số liệu giả):');
    expect(first).toContain('Insight khách hàng / đơn hàng (chỉ khi có dữ liệu):');
    expect(first).toContain('Hành động đề xuất tiếp theo:');
    expect(first).toContain('Câu hỏi cho Owner/khách trước khi chốt:');
    expect(first).toContain('Checklist Owner duyệt:');
    // Data source status names all 4 states required by the spec.
    expect(first).toContain('Provided data');
    expect(first).toContain('Simulated data');
    expect(first).toContain('Missing data');
    expect(first).toContain('Owner input required');
    expect(first).toContain('no_auto_post=true');
    expect(first).toContain('no_auto_ads=true');
    expect(first).toContain('no_platform_launch=true');
    expect(first).toContain('no_image_generation=true');
    expect(first).toContain('no_video_generation=true');
    expect(first).toContain('no_live_analytics_pull=true');
    expect(first).toContain('no_unverified_metrics=true');
    // Safety label: draft report only, no live analytics, no unverified metrics.
    expect(first).toContain('Draft report only · Pending approval · No live analytics pull · No unverified metrics · Not published.');
    // Local fallback must never imply real platform data was pulled.
    expect(result.items.every(item => /no live analytics/i.test(item.caption))).toBe(true);
    // Honest by construction: no fabricated metrics / pull / publish claims.
    expect(result.items.every(item => !unsafeReportCopy.test(item.caption))).toBe(true);
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
          { key: 'campaign_status_summary', title: 'Status Draft', objective: 'summarize status', exec_summary: 'Briefs approved' },
          { key: 'report_handoff', title: 'Handoff Skeleton', objective: 'assemble report' },
        ],
      }),
    });

    const result = await runReportFactory(input);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe('n8n');
    expect(result.job.generation_mode).toBe('external_module');
    expect(GENERATION_MODE_LABEL[result.job.generation_mode]).toBe('n8n AI Provider');
    // V1 always normalizes to the fixed set of 5 report draft approval items.
    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items.every(item => item.content_type === 'report_draft')).toBe(true);
    // Approval-first preserved on the n8n path too.
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('generated_by: n8n-ai-provider'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    // Metadata consistency: workflow_type forced to report_draft even from n8n.
    expect(result.items.every(item => item.caption.includes('workflow_type: report_draft'))).toBe(true);
    // No-metrics guarantee: every item still carries the no-live-analytics line,
    // even when the AI response omits data fields.
    expect(result.items.every(item => /no live analytics/i.test(item.caption))).toBe(true);
    expect(result.items.every(item => !unsafeReportCopy.test(item.caption))).toBe(true);
    // Quality: the second item omits most fields — it must resolve to the
    // canonical spec + senior-FnB defaults, never a generic "Owner to confirm".
    const handoff = result.items[1];
    expect(handoff.angle).toBe('Handoff Skeleton');
    expect(result.items.every(item => !/Owner to confirm/i.test(item.caption))).toBe(true);
  });

  it('caps n8n report draft output to exactly 5 approval items', async () => {
    vi.stubEnv('VITE_N8N_REPORT_DRAFT_WEBHOOK_URL', 'https://n8n.example.com/webhook/report-draft');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: Array.from({ length: 8 }, (_, idx) => ({
          key: `extra_${idx + 1}`,
          title: `Returned Report ${idx + 1}`,
          objective: `Objective ${idx + 1}`,
          exec_summary: `Safe draft summary ${idx + 1}`,
        })),
      }),
    });

    const result = await runReportFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items[0].angle).toBe('Returned Report 1');
    expect(result.items[4].angle).toBe('Returned Report 5');
    expect(result.items.some(item => item.angle === 'Returned Report 6')).toBe(false);
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => /no live analytics/i.test(item.caption))).toBe(true);
    expect(result.items.every(item => !unsafeReportCopy.test(item.caption))).toBe(true);
  });

  it('pads short n8n report draft output with safe fallback approval items', async () => {
    vi.stubEnv('VITE_N8N_REPORT_DRAFT_WEBHOOK_URL', 'https://n8n.example.com/webhook/report-draft');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        generated_by: 'n8n-ai-provider',
        items: [
          { key: 'campaign_status_summary', title: 'Status Draft', objective: 'summarize status', exec_summary: 'Briefs approved' },
          { key: 'performance_insight', title: 'Insight Notes', objective: 'frame insight' },
        ],
      }),
    });

    const result = await runReportFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items[0].angle).toBe('Status Draft');
    expect(result.items[1].angle).toBe('Insight Notes');
    expect(result.items[2].angle).toBe('Content & Creative Review Notes');
    expect(result.items[3].angle).toBe('Risks, Learnings & Next Actions');
    expect(result.items[4].angle).toBe('Owner / Client Report Handoff Draft');
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('pending_approval'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generated_by: n8n-ai-provider'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => /no live analytics/i.test(item.caption))).toBe(true);
    expect(result.items.every(item => !unsafeReportCopy.test(item.caption))).toBe(true);
  });

  it('pads empty n8n report draft output with safe fallback approval items', async () => {
    vi.stubEnv('VITE_N8N_REPORT_DRAFT_WEBHOOK_URL', 'https://n8n.example.com/webhook/report-draft');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ ok: true, generated_by: 'n8n-ai-provider', items: [] }) });

    const result = await runReportFactory(input);

    expect(result.items).toHaveLength(5);
    expect(result.job.item_count).toBe(5);
    expect(result.items.every(item => item.status === 'needs_review')).toBe(true);
    expect(result.items.every(item => item.caption.includes('source: n8n'))).toBe(true);
    expect(result.items.every(item => item.caption.includes('generation_mode: external_module'))).toBe(true);
    expect(result.items.every(item => /no live analytics/i.test(item.caption))).toBe(true);
    expect(result.items.every(item => !unsafeReportCopy.test(item.caption))).toBe(true);
  });

  it('rejects a non-array items response as a contract breach', async () => {
    vi.stubEnv('VITE_N8N_REPORT_DRAFT_WEBHOOK_URL', 'https://n8n.example.com/webhook/report-draft');
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: { not: 'an array' } }) });

    await expect(runReportFactory(input)).rejects.toThrow(/invalid report draft items/i);
  });
});
