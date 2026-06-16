// Design Brief Factory V1
// ---------------------------------------------------------------------------
// Production-safe V1 flow that turns an approved campaign/brief into a set of
// DESIGN BRIEF (text/spec) approval items via the same n8n AI Provider
// external_module path as the Content Factory. It never generates images and
// never touches Canva / ComfyUI / Fal.ai / Meta / TikTok / Zalo. Output is
// approval-first text specs only — nothing is posted, launched, or scheduled.
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// design briefs unchanged (content_type = 'design_brief'), so there is NO DB
// schema change. Structured design fields that have no dedicated column are
// rendered into the item caption as a readable spec block (same metadata
// pattern the Content Factory already uses).
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../types/core';
import type { ContentFactoryOptions, ContentFactoryRunInput } from './contentFactory';
import { generateId } from './coreData';

// workflow_type identifies the n8n workflow / external module; content_type
// identifies the kind of item it produces. Keeping them distinct fixes the
// earlier metadata bug where design items showed workflow_type: content_pack.
const WORKFLOW_TYPE = 'design_factory';
const CONTENT_TYPE = 'design_brief';

// brand_colors is a JSON map on the model; render it as a readable spec string.
function formatBrandColors(colors: Record<string, string> | null): string | null {
  if (!colors) return null;
  const entries = Object.entries(colors);
  if (!entries.length) return null;
  return entries.map(([name, value]) => `${name}: ${value}`).join(', ');
}

// Fixed V1 set of design brief items produced per run. Text/spec only.
interface DesignBriefSpec {
  key: string;
  title: string;
  platform: string;
  format: string;
  objective: string;
}

const DESIGN_BRIEF_SPECS: DesignBriefSpec[] = [
  { key: 'facebook_post',         title: 'Facebook Post Design Brief',        platform: 'Facebook',      format: '1:1 square (1080x1080)',  objective: 'Stop the scroll and drive feed engagement' },
  { key: 'story_reels_cover',     title: 'Story / Reels Cover Design Brief',  platform: 'Story / Reels', format: '9:16 vertical (1080x1920)', objective: 'High-contrast cover that earns the tap' },
  { key: 'menu_promo_visual',     title: 'Menu / Promo Visual Design Brief',  platform: 'Facebook',      format: '4:5 portrait (1080x1350)', objective: 'Communicate the offer / menu clearly' },
  { key: 'key_visual_direction',  title: 'Key Visual Direction',              platform: 'Cross-channel', format: 'Master key visual',        objective: 'Define the campaign visual system' },
  { key: 'designer_handoff_notes',title: 'Designer Handoff Notes',            platform: 'Internal',      format: 'Handoff document',         objective: 'Hand the spec to the designer cleanly' },
];

export interface DesignBriefRequestPayload {
  request_id: string;
  workflow_type: 'design_factory';
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
    brand_colors: string | null;
  };
  campaign: { id: string; name: string; description: string | null };
  brief: {
    id: string;
    title: string | null;
    campaign_goal: string | null;
    product_focus: string | null;
    offer: string | null;
    channels: string[] | null;
    must_include: string | null;
    must_avoid: string | null;
  };
  options: { channel: ContentFactoryOptions['channel']; goal: ContentFactoryOptions['goal'] };
  design_brief_types: string[];
  // Image generation is explicitly out of scope for this V1 flow.
  generate_images: false;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_image_generation: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nDesignBriefItem {
  key?: string;
  title?: string;
  platform?: string;
  channel?: string;
  format?: string;
  objective?: string;
  target_audience?: string;
  visual_direction?: string;
  layout_guidance?: string;
  copy_text?: string;
  brand_style?: string;
  image_requirements?: string;
  cta?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
}

interface N8nDesignBriefResponse {
  ok?: boolean;
  request_id?: string;
  generated_by?: string;
  status?: string;
  items?: N8nDesignBriefItem[];
  error?: { code?: string; message?: string };
}

export interface DesignFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: DesignBriefRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class DesignFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DesignFactoryError';
  }
}

export function getDesignFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createDesignBriefPayload(input: ContentFactoryRunInput): DesignBriefRequestPayload {
  return {
    request_id: generateId('df'),
    workflow_type: WORKFLOW_TYPE,
    generated_by: input.requestedBy,
    owner_approval_required: true,
    requested_at: new Date().toISOString(),
    client: { id: input.client.id, name: input.client.name },
    brand: {
      id: input.brand.id,
      name: input.brand.name,
      industry: input.brand.industry,
      hero_product: input.brand.hero_product,
      tone_of_voice: input.brand.tone_of_voice,
      target_audience: input.brand.target_audience,
      brand_colors: formatBrandColors(input.brand.brand_colors),
    },
    campaign: { id: input.campaign.id, name: input.campaign.name, description: input.campaign.description },
    brief: {
      id: input.brief.id,
      title: input.brief.brief_title,
      campaign_goal: input.brief.campaign_goal,
      product_focus: input.brief.product_focus,
      offer: input.brief.offer,
      channels: input.brief.channels,
      must_include: input.brief.must_include,
      must_avoid: input.brief.must_avoid,
    },
    options: { channel: input.options.channel, goal: input.options.goal },
    design_brief_types: DESIGN_BRIEF_SPECS.map(spec => spec.key),
    generate_images: false,
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_image_generation: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runDesignFactory(input: ContentFactoryRunInput): Promise<DesignFactoryResult> {
  const payload = createDesignBriefPayload(input);
  const webhookUrl = getDesignFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new DesignFactoryError(`n8n Design Factory failed (${response.status}). No design briefs were created.`);
  }

  const data = await response.json() as N8nDesignBriefResponse;
  if (data.ok === false) {
    throw new DesignFactoryError(data.error?.message || 'n8n Design Factory returned a failure response.');
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new DesignFactoryError('n8n Design Factory returned no design brief items.');
  }

  return buildResult(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

function buildMockResult(input: ContentFactoryRunInput, payload: DesignBriefRequestPayload): DesignFactoryResult {
  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || 'hero product';
  const audience = input.brief.target_audience || input.brand.target_audience || 'core local audience';
  const colors = formatBrandColors(input.brand.brand_colors) || 'Assumption: brand primary + neutral support, high legibility';
  const offer = input.brief.offer || 'Assumption: feature the current campaign hero offer';
  const platformContext = input.options.channel;

  const items: N8nDesignBriefItem[] = DESIGN_BRIEF_SPECS.map(spec => ({
    key: spec.key,
    title: spec.title,
    platform: spec.platform === 'Facebook' ? platformContext : spec.platform,
    format: spec.format,
    objective: spec.objective,
    target_audience: audience,
    visual_direction: `Hero ${product} in a clean, appetizing ${brand} frame. Tone: ${input.brand.tone_of_voice || 'warm, trustworthy'}. No stock-looking clutter.`,
    layout_guidance: spec.key === 'designer_handoff_notes'
      ? 'Provide layered source, fonts, and export specs. List safe margins and where text must stay readable.'
      : 'Clear focal point, generous safe margins, one primary message. Keep text legible at thumbnail size.',
    copy_text: `Headline idea: ${brand} — ${spec.objective}. Offer: ${offer}.`,
    brand_style: colors,
    image_requirements: 'Use owner-provided real product photography only. No AI image generation in this V1 flow.',
    cta: input.options.goal === 'sales' ? 'Inbox to order' : input.options.goal === 'lead' ? 'Leave your contact' : 'Follow for more',
  }));

  return buildResult(input, payload, items, 'local_mock', 'core-local-mock');
}

function buildResult(
  input: ContentFactoryRunInput,
  payload: DesignBriefRequestPayload,
  sourceItems: N8nDesignBriefItem[],
  mode: DesignFactoryResult['mode'],
  generatedBy: string,
): DesignFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const items = sourceItems.map((item, idx) => mapDesignItem(input, item, jobId, idx + 1, now, generatedBy, mode));

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

function mapDesignItem(
  input: ContentFactoryRunInput,
  item: N8nDesignBriefItem,
  jobId: string,
  sequence: number,
  now: string,
  generatedBy: string,
  mode: DesignFactoryResult['mode'],
): ContentPlanItem {
  // Always anchor to a canonical spec: match by key, else by sequence, else the
  // first. This guarantees a specific title/format/objective even when an n8n AI
  // response omits fields — so items never degrade to "Owner to confirm ...".
  const spec = DESIGN_BRIEF_SPECS.find(s => s.key === item.key)
    ?? DESIGN_BRIEF_SPECS[sequence - 1]
    ?? DESIGN_BRIEF_SPECS[0];

  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || `${brand} hero product`;
  const goal = input.options.goal;
  const defaultCta = goal === 'sales' ? 'Inbox to order' : goal === 'lead' ? 'Leave your contact for a callback' : 'Follow for more';

  // Prefer AI/source values; fall back to the canonical spec or a clearly-flagged
  // "Assumption: ..." derived from the brief — never a generic "Owner to confirm".
  const title     = item.title || spec.title;
  const platform  = item.platform || item.channel || (spec.platform === 'Facebook' ? input.options.channel : spec.platform);
  const format    = item.format || spec.format;
  const objective = item.objective || spec.objective;
  const audience  = item.target_audience || input.brief.target_audience || input.brand.target_audience || 'Assumption: core local audience for this brand';
  const layout    = item.layout_guidance || (spec.key === 'designer_handoff_notes'
    ? 'Provide layered source, fonts, export specs, safe margins, and where text must stay legible.'
    : 'One clear focal point, generous safe margins, single primary message, legible at thumbnail size.');
  const copy      = item.copy_text || `Assumption: lead with "${brand} — ${objective}".${input.brief.offer ? ` Offer: ${input.brief.offer}.` : ''}`;
  const colors    = item.brand_style || formatBrandColors(input.brand.brand_colors) || 'Assumption: brand primary + neutral support, high legibility';
  const imageReq  = item.image_requirements || 'Owner-provided real product photography only. No AI image generation in this V1 flow.';
  const cta       = item.cta || defaultCta;
  const visual    = item.visual_direction || `Hero ${product} in a clean, on-brand ${brand} frame. Tone: ${input.brand.tone_of_voice || 'warm, trustworthy'}. Real photography only — no image generation.`;

  const sourceLabel = mode === 'n8n' ? 'n8n' : 'local';
  const caption = [
    `Design objective: ${objective}`,
    `Target audience: ${audience}`,
    `Format / ratio: ${format}`,
    `Layout guidance: ${layout}`,
    `Copy / text to include: ${copy}`,
    `Brand colors / style: ${colors}`,
    `Image / product requirements: ${imageReq}`,
    `CTA: ${cta}`,
    'Safety: text/spec only — no image generation.',
    '',
    '---',
    'Design Brief V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    // workflow_type/content_type are forced to the canonical constants (not the
    // upstream item value) so a nonconforming AI response can never mislabel them.
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${sourceLabel}`,
    `generation_mode: ${mode === 'n8n' ? 'external_module' : 'mock'}`,
    'safety: no_auto_post=true; no_auto_ads=true; no_image_generation=true',
  ].join('\n');

  return {
    id: generateId('item'),
    generation_job_id: jobId,
    brief_id: input.brief.id,
    campaign_id: input.campaign.id,
    brand_id: input.brand.id,
    client_id: input.client.id,
    day_number: sequence,
    planned_date: null,
    channel: platform,
    content_type: CONTENT_TYPE,
    pillar: 'Design Brief',
    angle: title,
    hook: `${title} — ${objective}`,
    caption,
    visual_brief: visual,
    cta,
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #DesignBrief`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}
