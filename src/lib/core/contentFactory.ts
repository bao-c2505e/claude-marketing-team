import type { Brand, Campaign, CampaignBrief, Client, ContentPlanItem, ContentPlanJob, PlanLengthDays } from '../../types/core';
import { generateId } from './coreData';

export type ContentFactoryChannel = 'Facebook' | 'TikTok' | 'Zalo';
export type ContentFactoryGoal = 'branding' | 'sales' | 'khai_truong' | 'lead' | 'tuyen_sinh';

export interface ContentFactoryOptions {
  planLengthDays: PlanLengthDays;
  channel: ContentFactoryChannel;
  goal: ContentFactoryGoal;
}

export interface ContentFactoryRunInput {
  client: Client;
  brand: Brand;
  campaign: Campaign;
  brief: CampaignBrief;
  options: ContentFactoryOptions;
  requestedBy: string;
}

export interface ContentFactoryRequestPayload {
  request_id: string;
  workflow_type: 'content_pack';
  generated_by: string;
  owner_approval_required: true;
  requested_at: string;
  client: { id: string; name: string };
  brand: {
    id: string;
    name: string;
    industry: string | null;
    hero_product: string | null;
    tone_of_voice: string | null;
    target_audience: string | null;
  };
  campaign: {
    id: string;
    name: string;
    description: string | null;
  };
  brief: {
    id: string;
    title: string | null;
    campaign_goal: string | null;
    product_focus: string | null;
    offer: string | null;
    channels: string[] | null;
    content_pillars: string[] | null;
    key_messages: string[] | null;
    must_include: string | null;
    must_avoid: string | null;
    approval_requirements: string | null;
  };
  options: {
    plan_length_days: PlanLengthDays;
    channel: ContentFactoryChannel;
    goal: ContentFactoryGoal;
  };
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nContentItem {
  day_number: number;
  planned_date?: string | null;
  channel?: string;
  content_type?: string;
  pillar?: string;
  angle?: string;
  hook?: string;
  caption?: string;
  visual_brief?: string;
  cta?: string;
  hashtags?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
  owner_approval_required?: boolean;
}

interface N8nContentFactoryResponse {
  ok?: boolean;
  request_id?: string;
  workflow_type?: string;
  generated_by?: string;
  owner_approval_required?: boolean;
  status?: string;
  job?: {
    external_execution_id?: string | null;
    item_count?: number;
  };
  items?: N8nContentItem[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ContentFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: ContentFactoryRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class ContentFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentFactoryError';
  }
}

const WORKFLOW_TYPE = 'content_pack';

export function getContentFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_CONTENT_FACTORY_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createContentFactoryPayload(input: ContentFactoryRunInput): ContentFactoryRequestPayload {
  return {
    request_id: generateId('cf'),
    workflow_type: WORKFLOW_TYPE,
    generated_by: input.requestedBy,
    owner_approval_required: true,
    requested_at: new Date().toISOString(),
    client: {
      id: input.client.id,
      name: input.client.name,
    },
    brand: {
      id: input.brand.id,
      name: input.brand.name,
      industry: input.brand.industry,
      hero_product: input.brand.hero_product,
      tone_of_voice: input.brand.tone_of_voice,
      target_audience: input.brand.target_audience,
    },
    campaign: {
      id: input.campaign.id,
      name: input.campaign.name,
      description: input.campaign.description,
    },
    brief: {
      id: input.brief.id,
      title: input.brief.brief_title,
      campaign_goal: input.brief.campaign_goal,
      product_focus: input.brief.product_focus,
      offer: input.brief.offer,
      channels: input.brief.channels,
      content_pillars: input.brief.content_pillars,
      key_messages: input.brief.key_messages,
      must_include: input.brief.must_include,
      must_avoid: input.brief.must_avoid,
      approval_requirements: input.brief.approval_requirements,
    },
    options: {
      plan_length_days: input.options.planLengthDays,
      channel: input.options.channel,
      goal: input.options.goal,
    },
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runContentFactory(input: ContentFactoryRunInput): Promise<ContentFactoryResult> {
  const payload = createContentFactoryPayload(input);
  const webhookUrl = getContentFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ContentFactoryError(`n8n Content Factory failed (${response.status}). No content was created.`);
  }

  const data = await response.json() as N8nContentFactoryResponse;
  if (data.ok === false) {
    throw new ContentFactoryError(data.error?.message || 'n8n Content Factory returned a failure response.');
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new ContentFactoryError('n8n Content Factory returned no content items.');
  }

  return buildResultFromItems(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

function buildMockResult(input: ContentFactoryRunInput, payload: ContentFactoryRequestPayload): ContentFactoryResult {
  const items: N8nContentItem[] = [];
  const pillars = input.brief.content_pillars?.length ? input.brief.content_pillars : ['Product', 'Offer', 'Trust', 'Lifestyle'];
  const messages = input.brief.key_messages?.length ? input.brief.key_messages : ['Quality first', 'Owner-approved offer', 'Clear customer benefit'];
  for (let day = 1; day <= input.options.planLengthDays; day++) {
    const planned = new Date();
    planned.setDate(planned.getDate() + day);
    const pillar = pillars[(day - 1) % pillars.length];
    const message = messages[(day - 1) % messages.length];
    const brand = input.brand.name;
    const product = input.brief.product_focus || input.brand.hero_product || 'hero product';
    items.push({
      day_number: day,
      planned_date: planned.toISOString().slice(0, 10),
      channel: input.options.channel,
      content_type: input.options.channel === 'TikTok' ? 'video_script' : 'caption',
      pillar,
      angle: `${goalLabel(input.options.goal)} / ${pillar}`,
      hook: `${brand}: ${message}`,
      caption: [
        `${product}`,
        '',
        `Goal: ${goalLabel(input.options.goal)}.`,
        `Draft angle for ${input.options.channel}: ${message}.`,
        input.brief.offer ? `Offer: ${input.brief.offer}` : null,
        input.brief.must_include ? `Must include: ${input.brief.must_include}` : null,
      ].filter(Boolean).join('\n'),
      visual_brief: `Create a ${input.options.channel} creative direction for ${brand}. Keep brand tone: ${input.brand.tone_of_voice || input.brief.tone_of_voice || 'brand-safe'}.`,
      cta: input.options.goal === 'lead' ? 'Leave your contact for consultation.' : input.options.goal === 'sales' ? 'Message us to order.' : 'Follow for the next update.',
      hashtags: `#${brand.replace(/\s+/g, '')} #TheCoreAgency #${input.options.channel}`,
    });
  }
  return buildResultFromItems(input, payload, items, 'local_mock', 'core-local-mock');
}

function buildResultFromItems(
  input: ContentFactoryRunInput,
  payload: ContentFactoryRequestPayload,
  sourceItems: N8nContentItem[],
  mode: ContentFactoryResult['mode'],
  generatedBy: string,
): ContentFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const items = sourceItems.slice(0, input.options.planLengthDays).map((item, idx) =>
    mapFactoryItem(input, item, jobId, idx + 1, now, generatedBy, mode),
  );

  const job: ContentPlanJob = {
    id: jobId,
    brief_id: input.brief.id,
    campaign_id: input.campaign.id,
    brand_id: input.brand.id,
    client_id: input.client.id,
    plan_length_days: input.options.planLengthDays,
    generation_mode: mode === 'n8n' ? 'external_module' : 'mock',
    status: 'completed',
    requested_by: input.requestedBy,
    item_count: items.length,
    created_at: now,
    updated_at: now,
    completed_at: now,
    error_message: null,
  };

  return { mode, payload, job, items };
}

function mapFactoryItem(
  input: ContentFactoryRunInput,
  item: N8nContentItem,
  jobId: string,
  fallbackDay: number,
  now: string,
  generatedBy: string,
  mode: ContentFactoryResult['mode'],
): ContentPlanItem {
  const day = Number.isFinite(item.day_number) && item.day_number > 0 ? item.day_number : fallbackDay;
  const metadata = [
    '',
    '---',
    'Content Factory V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    `workflow_type: ${item.workflow_type || WORKFLOW_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${mode}`,
    'safety: no_auto_post=true; no_auto_ads=true',
  ].join('\n');

  return {
    id: generateId('item'),
    generation_job_id: jobId,
    brief_id: input.brief.id,
    campaign_id: input.campaign.id,
    brand_id: input.brand.id,
    client_id: input.client.id,
    day_number: day,
    planned_date: item.planned_date ?? null,
    channel: item.channel || input.options.channel,
    content_type: item.content_type || 'caption',
    pillar: item.pillar || 'Content Factory',
    angle: item.angle || goalLabel(input.options.goal),
    hook: item.hook || `${input.brand.name} content draft`,
    caption: `${item.caption || 'Draft content generated by Content Factory V1.'}${metadata}`,
    visual_brief: item.visual_brief || 'Owner must review this draft before use.',
    cta: item.cta || 'Owner to confirm CTA.',
    hashtags: item.hashtags || `#${input.brand.name.replace(/\s+/g, '')}`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}

function goalLabel(goal: ContentFactoryGoal): string {
  const labels: Record<ContentFactoryGoal, string> = {
    branding: 'Branding',
    sales: 'Sales',
    khai_truong: 'Khai truong',
    lead: 'Lead generation',
    tuyen_sinh: 'Tuyen sinh',
  };
  return labels[goal];
}
