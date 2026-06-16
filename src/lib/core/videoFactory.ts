// Video Scripts Factory V1
// ---------------------------------------------------------------------------
// Production-safe V1 flow that turns an approved campaign/brief into a set of
// VIDEO SCRIPT (text/spec/script) approval items via the same n8n AI Provider
// external_module path as the Content Factory and Design Factory. It never
// generates video or images and never touches Canva / ComfyUI / Fal.ai / Meta /
// TikTok / Zalo. Output is approval-first text scripts only — nothing is posted,
// launched, scheduled, or rendered.
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// video scripts unchanged (content_type = 'video_script'), so there is NO DB
// schema change. Structured script fields that have no dedicated column are
// rendered into the item caption as a readable spec block (same metadata
// pattern the Content Factory and Design Factory already use).
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../types/core';
import type { ContentFactoryOptions, ContentFactoryRunInput } from './contentFactory';
import { generateId } from './coreData';

// workflow_type identifies the n8n workflow / external module; content_type
// identifies the kind of item it produces. Keeping them distinct mirrors the
// Design Factory fix so video items never mislabel as content_pack/design_brief.
const WORKFLOW_TYPE = 'video_scripts';
const CONTENT_TYPE = 'video_script';

// Fixed V1 set of video script items produced per run. Text/script only.
interface VideoScriptSpec {
  key: string;
  title: string;
  platform: string;
  format: string;
  objective: string;
}

const VIDEO_SCRIPT_SPECS: VideoScriptSpec[] = [
  { key: 'hook_first_3s',          title: 'Hook / First 3 Seconds Script',                platform: 'Reels / TikTok', format: 'First 3 seconds (9:16 vertical)', objective: 'Stop the scroll in the first 3 seconds' },
  { key: 'short_form_script',      title: 'Short-Form Video Script (Reels/TikTok, 15–30s)', platform: 'Reels / TikTok', format: '15–30s vertical (9:16)',          objective: 'Deliver the core message in 15–30s' },
  { key: 'voiceover_caption_script', title: 'Voiceover / Caption Script',                 platform: 'Cross-channel',  format: 'Voiceover + on-screen captions',  objective: 'Spoken + caption script that lands the message' },
  { key: 'shot_list_broll',        title: 'Shot List + B-roll Direction',                 platform: 'Production',     format: 'Shot list / B-roll plan',         objective: 'Give the shooter a clear, ordered shot list' },
  { key: 'editor_handoff_notes',   title: 'Editor Handoff Notes',                         platform: 'Internal',       format: 'Editor handoff document',         objective: 'Hand the cut to the editor cleanly' },
];

export interface VideoScriptRequestPayload {
  request_id: string;
  workflow_type: 'video_scripts';
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
  video_script_types: string[];
  // Image AND video generation are explicitly out of scope for this V1 flow.
  generate_images: false;
  generate_videos: false;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_image_generation: true;
    no_video_generation: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nVideoScriptItem {
  key?: string;
  title?: string;
  platform?: string;
  channel?: string;
  format?: string;
  objective?: string;
  target_audience?: string;
  script_body?: string;
  voiceover_text?: string;
  shot_direction?: string;
  cta?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
}

interface N8nVideoScriptResponse {
  ok?: boolean;
  request_id?: string;
  generated_by?: string;
  status?: string;
  items?: N8nVideoScriptItem[];
  error?: { code?: string; message?: string };
}

export interface VideoFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: VideoScriptRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class VideoFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VideoFactoryError';
  }
}

export function getVideoFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_VIDEO_SCRIPTS_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createVideoScriptPayload(input: ContentFactoryRunInput): VideoScriptRequestPayload {
  return {
    request_id: generateId('vf'),
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
    video_script_types: VIDEO_SCRIPT_SPECS.map(spec => spec.key),
    generate_images: false,
    generate_videos: false,
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_image_generation: true,
      no_video_generation: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runVideoFactory(input: ContentFactoryRunInput): Promise<VideoFactoryResult> {
  const payload = createVideoScriptPayload(input);
  const webhookUrl = getVideoFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new VideoFactoryError(`n8n Video Scripts failed (${response.status}). No video scripts were created.`);
  }

  const data = await response.json() as N8nVideoScriptResponse;
  if (data.ok === false) {
    throw new VideoFactoryError(data.error?.message || 'n8n Video Scripts returned a failure response.');
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new VideoFactoryError('n8n Video Scripts returned no video script items.');
  }

  return buildResult(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

function buildMockResult(input: ContentFactoryRunInput, payload: VideoScriptRequestPayload): VideoFactoryResult {
  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || 'hero product';
  const audience = input.brief.target_audience || input.brand.target_audience || 'core local audience';
  const offer = input.brief.offer || 'Assumption: feature the current campaign hero offer';
  const tone = input.brand.tone_of_voice || 'warm, trustworthy';

  const items: N8nVideoScriptItem[] = VIDEO_SCRIPT_SPECS.map(spec => ({
    key: spec.key,
    title: spec.title,
    platform: spec.platform,
    format: spec.format,
    objective: spec.objective,
    target_audience: audience,
    script_body: buildMockScriptBody(spec.key, brand, product, offer),
    voiceover_text: `VO (tone: ${tone}): "${brand} — ${spec.objective}." Keep it natural and concise.`,
    shot_direction: spec.key === 'shot_list_broll'
      ? `Ordered shots: 1) hero ${product} close-up, 2) prep/process B-roll, 3) happy customer reaction, 4) logo/CTA end card. Real footage only.`
      : `Hold on the hero ${product}; keep the frame clean and on-brand. Real footage only — no AI video.`,
    cta: input.options.goal === 'sales' ? 'Inbox to order' : input.options.goal === 'lead' ? 'Leave your contact' : 'Follow for more',
  }));

  return buildResult(input, payload, items, 'local_mock', 'core-local-mock');
}

function buildMockScriptBody(key: string, brand: string, product: string, offer: string): string {
  switch (key) {
    case 'hook_first_3s':
      return `0–3s: Open on ${product}. On-screen text: "${brand} — wait for it". Punchy line that promises the payoff.`;
    case 'short_form_script':
      return `0–3s hook → 3–10s show ${product} + the offer (${offer}) → 10–25s proof / quick benefit → 25–30s CTA end card.`;
    case 'voiceover_caption_script':
      return `VO + captions, line by line: 1) Hook line. 2) What it is (${product}). 3) Why it matters. 4) Offer: ${offer}. 5) CTA line.`;
    case 'shot_list_broll':
      return `Shot list: hero ${product} close-up, prep/process B-roll, customer reaction, end card. Note durations and safe margins per shot.`;
    case 'editor_handoff_notes':
      return `Editor notes: aspect 9:16, captions burned-in, music ducked under VO, brand colors on end card, export H.264 1080x1920.`;
    default:
      return `Scene-by-scene script for ${brand} featuring ${product}.`;
  }
}

function buildResult(
  input: ContentFactoryRunInput,
  payload: VideoScriptRequestPayload,
  sourceItems: N8nVideoScriptItem[],
  mode: VideoFactoryResult['mode'],
  generatedBy: string,
): VideoFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const items = sourceItems.map((item, idx) => mapVideoItem(input, item, jobId, idx + 1, now, generatedBy, mode));

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

function mapVideoItem(
  input: ContentFactoryRunInput,
  item: N8nVideoScriptItem,
  jobId: string,
  sequence: number,
  now: string,
  generatedBy: string,
  mode: VideoFactoryResult['mode'],
): ContentPlanItem {
  // Always anchor to a canonical spec: match by key, else by sequence, else the
  // first. This guarantees a specific title/format/objective even when an n8n AI
  // response omits fields — so items never degrade to "Owner to confirm ...".
  const spec = VIDEO_SCRIPT_SPECS.find(s => s.key === item.key)
    ?? VIDEO_SCRIPT_SPECS[sequence - 1]
    ?? VIDEO_SCRIPT_SPECS[0];

  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || `${brand} hero product`;
  const goal = input.options.goal;
  const defaultCta = goal === 'sales' ? 'Inbox to order' : goal === 'lead' ? 'Leave your contact for a callback' : 'Follow for more';
  const tone = input.brand.tone_of_voice || 'warm, trustworthy';

  // Prefer AI/source values; fall back to the canonical spec or a clearly-flagged
  // "Assumption: ..." derived from the brief — never a generic "Owner to confirm".
  const title     = item.title || spec.title;
  const platform  = item.platform || item.channel || spec.platform;
  const format    = item.format || spec.format;
  const objective = item.objective || spec.objective;
  const audience  = item.target_audience || input.brief.target_audience || input.brand.target_audience || 'Assumption: core local audience for this brand';
  const script    = item.script_body || `Assumption: scene-by-scene script for "${brand} — ${objective}", featuring ${product}.${input.brief.offer ? ` Offer: ${input.brief.offer}.` : ''}`;
  const voiceover = item.voiceover_text || `Assumption: VO (tone: ${tone}) — "${brand} — ${objective}." On-screen captions mirror the VO.`;
  const shots     = item.shot_direction || (spec.key === 'shot_list_broll'
    ? `Ordered shots: hero ${product} close-up, prep/process B-roll, customer reaction, logo/CTA end card. Real footage only — no AI video.`
    : `Hold on the hero ${product}; keep the frame clean and on-brand. Real footage only — no AI video.`);
  const cta       = item.cta || defaultCta;

  const sourceLabel = mode === 'n8n' ? 'n8n' : 'local';
  const caption = [
    `Video objective: ${objective}`,
    `Target audience: ${audience}`,
    `Format / duration: ${format}`,
    `Script / scene breakdown: ${script}`,
    `Voiceover / on-screen text: ${voiceover}`,
    `Shot / B-roll direction: ${shots}`,
    `CTA: ${cta}`,
    'Safety: text/script only — no image or video generation.',
    '',
    '---',
    'Video Scripts V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    // workflow_type/content_type are forced to the canonical constants (not the
    // upstream item value) so a nonconforming AI response can never mislabel them.
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${sourceLabel}`,
    `generation_mode: ${mode === 'n8n' ? 'external_module' : 'mock'}`,
    'safety: no_auto_post=true; no_auto_ads=true; no_image_generation=true; no_video_generation=true',
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
    pillar: 'Video Script',
    angle: title,
    hook: `${title} — ${objective}`,
    caption,
    visual_brief: shots,
    cta,
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #VideoScript`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}
