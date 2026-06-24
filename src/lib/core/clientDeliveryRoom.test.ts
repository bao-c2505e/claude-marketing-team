import { describe, expect, it } from 'vitest';
import {
  buildClientDeliveryRoom,
  renderClientDeliveryRoomText,
  DELIVERY_ROOM_APPROVED_NOT_PUBLISHED,
  DELIVERY_ROOM_MANUAL_ONLY,
} from './clientDeliveryRoom';
import { resolveCampaignPackContext, collectCampaignPackItems } from './campaignPack';
import { buildManualPublishingChecklist } from './manualPublishingChecklist';
import type {
  Client,
  Brand,
  Campaign,
  CampaignBrief,
  ContentPlanItem,
  ContentApprovalRequest,
  ContentApprovalEvent,
} from '../../types/core';
import type { ManualDeliveryMap } from './manualDelivery';

const NOW = new Date('2026-06-24T10:00:00.000Z');

// ---------------------------------------------------------------------------
// Fixtures (fictional FnB/SME brand — CLAUDE.md scope) — mirrors Phase Q/R tests
// ---------------------------------------------------------------------------

const clients: Client[] = [
  { id: 'cli-1', name: 'Cơm Tấm Bản Khói', contact_name: 'Chị Lan', status: 'active', created_at: '', updated_at: '' } as Client,
];
const brands: Brand[] = [
  {
    id: 'br-1', client_id: 'cli-1', name: 'Bản Khói', slug: 'ban-khoi',
    industry: 'F&B / Cơm tấm', hero_product: 'Cơm tấm sườn',
    target_audience: 'Dân văn phòng quận 1',
    tone_of_voice: 'Thân thiện, ngon miệng',
    primary_channels: ['Facebook', 'TikTok'],
    brand_colors: { primary: '#8B4513', accent: '#F4A300' },
    logo_url: null, created_by: 'owner',
    status: 'active', created_at: '', updated_at: '2026-06-20T00:00:00.000Z',
  } as Brand,
];
const campaigns: Campaign[] = [
  { id: 'cmp-1', client_id: 'cli-1', brand_id: 'br-1', name: 'Tháng 6 Launch', status: 'active', duration_days: 7, created_at: '', updated_at: '' } as Campaign,
];
const briefs: CampaignBrief[] = [
  {
    id: 'brief-1', campaign_id: 'cmp-1',
    product_focus: 'Cơm tấm sườn bì chả',
    target_audience: 'Dân văn phòng quận 1',
    tone_of_voice: 'Thân thiện, ngon miệng',
    content_pillars: ['Món signature', 'Combo & ưu đãi'],
    key_messages: ['Sườn nướng than thật'],
    must_include: 'Ảnh món thật',
    must_avoid: 'Không bịa giá',
    offer: '',
    approval_requirements: 'Owner xác nhận giá',
    additional_notes: '',
    channels: ['Facebook'],
    campaign_goal: 'Tăng nhận diện',
    status: 'approved_for_generation',
    submitted_at: '2026-06-20T00:00:00.000Z',
  } as unknown as CampaignBrief,
];

function makeItem(id: string, contentType: string, caption: string, extra: Partial<ContentPlanItem> = {}): ContentPlanItem {
  return {
    id, generation_job_id: 'job-1', brief_id: 'brief-1', campaign_id: 'cmp-1',
    brand_id: 'br-1', client_id: 'cli-1', day_number: 1, planned_date: null,
    channel: 'Facebook', content_type: contentType, pillar: 'Món signature',
    angle: 'Giới thiệu món', hook: `${id} hook`, caption,
    visual_brief: `${id} visual`, cta: `${id} cta`, hashtags: '#banhkhoi',
    status: 'approved', created_at: '', updated_at: '', ...extra,
  };
}

const contentBody = 'Hôm nay quán có món signature thơm lừng.';
const contentCaption = `${contentBody}\n\n---\nContent Factory V1 metadata:\nworkflow_type: content_pack\ncontent_type: caption\nsource: n8n`;

const contentItems: ContentPlanItem[] = [
  makeItem('item-content', 'caption', contentCaption),
  makeItem('item-design', 'design_brief', 'Brief thiết kế poster.'),
];

function req(id: string, contentItemId: string, status: ContentApprovalRequest['status'], title: string, campaign_id = 'cmp-1'): ContentApprovalRequest {
  return {
    id, content_item_id: contentItemId, generation_job_id: 'job-1', brief_id: 'brief-1',
    campaign_id, brand_id: 'br-1', client_id: 'cli-1', title, status, priority: 'normal',
    requested_by: 'owner', assigned_to_role: null, due_date: null,
    created_at: '2026-06-24T09:00:00.000Z', updated_at: '2026-06-24T09:30:00.000Z',
    resolved_at: '2026-06-24T09:30:00.000Z',
  };
}

const approvedRequests: ContentApprovalRequest[] = [
  req('appr-content', 'item-content', 'approved', 'Content Day 1'),
  req('appr-design', 'item-design', 'approved', 'Design Poster'),
];

const approvalEvents: ContentApprovalEvent[] = [];
const context = resolveCampaignPackContext({ campaign: campaigns[0], clients, brands, briefs });

function collect(items = contentItems, requests = approvedRequests) {
  return collectCampaignPackItems({
    campaignId: 'cmp-1',
    contentItems: items,
    approvalRequests: requests,
    approvalEvents,
    deliveryMap: {} as ManualDeliveryMap,
  });
}

function room(opts: { items?: ContentPlanItem[]; requests?: ContentApprovalRequest[] } = {}) {
  const items = collect(opts.items ?? contentItems, opts.requests ?? approvedRequests);
  const requests = opts.requests ?? approvedRequests;
  const checklist = buildManualPublishingChecklist({ context, items, approvalRequests: requests, now: NOW });
  return buildClientDeliveryRoom({ context, items, checklist, approvalRequests: requests, now: NOW });
}

// ---------------------------------------------------------------------------
// Structure + composition
// ---------------------------------------------------------------------------

describe('buildClientDeliveryRoom — structure', () => {
  it('composes client summary, brand snapshot, sections, approval, readiness', () => {
    const r = room();
    expect(r.client_summary.client_name).toBe('Cơm Tấm Bản Khói');
    expect(r.client_summary.brand_name).toBe('Bản Khói');
    expect(r.client_summary.campaign_name).toBe('Tháng 6 Launch');
    expect(r.client_summary.approved_deliverables).toBe(2);
    expect(r.brand_snapshot).not.toBeNull();
    expect(r.brand_snapshot!.content_pillars).toContain('Món signature');
    expect(r.brand_snapshot!.draft_only).toBe(true);
    expect(r.brand_snapshot!.internal_only).toBe(true);
    // Sections grouped by module in canonical order (content before design).
    expect(r.sections.map(s => s.module)).toEqual(['content', 'design']);
    expect(r.sections[0].item_titles).toContain('Content Day 1');
  });

  it('always carries the explicit Approved≠Published + manual-only messages', () => {
    const r = room();
    expect(r.approved_not_published_message).toBe(DELIVERY_ROOM_APPROVED_NOT_PUBLISHED);
    expect(r.manual_publishing_only_message).toBe(DELIVERY_ROOM_MANUAL_ONLY);
    expect(r.approved_not_published_message).toMatch(/Approved does not mean Published/);
    expect(r.manual_publishing_only_message).toMatch(/Manual publishing only/i);
  });
});

// ---------------------------------------------------------------------------
// Readiness states (the three required cases)
// ---------------------------------------------------------------------------

describe('buildClientDeliveryRoom — readiness states', () => {
  it('approved + checklist ready ⇒ ready_for_manual_client_handoff (still Not Published)', () => {
    const r = room();
    expect(r.readiness.status).toBe('ready_for_manual_client_handoff');
    expect(r.readiness.publishing_overall).toBe('ready_for_manual_publishing');
    // Approved is NEVER rendered as published.
    expect(r.published).toBe(false);
  });

  it('unapproved campaign (no approved deliverables) ⇒ not_client_ready', () => {
    const r = room({ items: [], requests: [req('appr-pending', 'item-content', 'submitted', 'Pending')] });
    expect(r.readiness.status).toBe('not_client_ready');
    expect(r.client_summary.approved_deliverables).toBe(0);
    expect(r.approval.all_approved).toBe(false);
    // A readiness caveat is surfaced as the first safety warning.
    expect(r.safety_warnings[0]).toMatch(/Not client-ready/);
    expect(r.published).toBe(false);
  });

  it('approved but checklist not ready (a copy deliverable is empty) ⇒ delivery_not_ready', () => {
    const items = [
      makeItem('item-content', 'caption', '\n\n---\nContent Factory V1 metadata:\nworkflow_type: content_pack'),
    ];
    const requests = [req('appr-content', 'item-content', 'approved', 'Empty caption')];
    const r = room({ items, requests });
    expect(r.readiness.status).toBe('delivery_not_ready');
    expect(r.readiness.blocked_count).toBeGreaterThan(0);
    expect(r.safety_warnings[0]).toMatch(/Delivery not ready/);
    expect(r.published).toBe(false);
  });

  it('approved but still has a pending sibling ⇒ delivery_not_ready (needs review), never published', () => {
    const requests = [...approvedRequests, req('appr-pending', 'item-extra', 'submitted', 'Pending sibling')];
    const r = room({ requests });
    expect(r.approval.pending_count).toBe(1);
    expect(r.approval.all_approved).toBe(false);
    expect(r.readiness.status).toBe('delivery_not_ready');
    expect(r.published).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// No external URL / webhook / share link is ever generated
// ---------------------------------------------------------------------------

describe('buildClientDeliveryRoom — no link/URL generation', () => {
  it('neither the room object nor the rendered text contains a URL / webhook / share link / token', () => {
    const r = room();
    const text = renderClientDeliveryRoomText(r);
    const blobs = [JSON.stringify(r), text];
    // No external link / share URL / secret is ever generated. (Affirmative
    // publish/auto-post wording is a different concern — the room's safety copy
    // only ever uses negated forms like "does not auto-post", guarded by the
    // panel source scan.)
    const forbidden = [
      /https?:\/\//i,
      /www\./i,
      /\bwebhook\b/i,
      /share[_-]?url/i,
      /public[_-]?url/i,
      /access_token|client_secret|api_key/i,
    ];
    for (const b of blobs) for (const re of forbidden) expect(b).not.toMatch(re);
  });

  it('the room safety copy only ever uses NEGATED publish/auto-post wording (never affirmative)', () => {
    const text = renderClientDeliveryRoomText(room());
    // "auto-post" / "run ads" appear only inside the negated manual-only message.
    expect(text).not.toMatch(/(?<!no |not |never )\bauto[-\s]?post/i);
    expect(text).not.toMatch(/\bpublish now\b/i);
    expect(text).not.toMatch(/\bauto[-\s]?publish\b/i);
  });
});

// ---------------------------------------------------------------------------
// renderClientDeliveryRoomText
// ---------------------------------------------------------------------------

describe('renderClientDeliveryRoomText', () => {
  it('renders a copyable handoff summary with the safety messages + Not Published', () => {
    const text = renderClientDeliveryRoomText(room());
    expect(text).toContain('CLIENT DELIVERY ROOM —');
    expect(text).toContain(DELIVERY_ROOM_APPROVED_NOT_PUBLISHED);
    expect(text).toContain(DELIVERY_ROOM_MANUAL_ONLY);
    expect(text).toMatch(/Status: Ready for manual client handoff \(Not Published\)/);
    expect(text).toContain('INCLUDED HANDOFF SECTIONS');
    expect(text).toContain('MANUAL NEXT STEPS');
    expect(text).toContain('SAFETY');
  });

  it('shows the empty-state line when there are no approved deliverables', () => {
    const text = renderClientDeliveryRoomText(room({ items: [], requests: [] }));
    expect(text).toMatch(/No approved deliverables yet/);
    expect(text).toMatch(/Status: Not client-ready \(Not Published\)/);
  });
});
