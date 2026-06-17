// Ads Pack Draft Factory V1
// ---------------------------------------------------------------------------
// Production-safe V1 flow that turns an approved campaign/brief into a set of
// ADS PACK (strategy/spec/draft) approval items via the same n8n AI Provider
// external_module path as the Content / Design / Video factories. It is
// STRATEGY & DRAFT NOTES ONLY: it never creates, launches, schedules, or spends
// ads, never generates images or video, and never touches any live
// Meta / TikTok / Zalo / Google Ads / Canva / ComfyUI / Fal.ai connector.
// Output is approval-first text drafts only — nothing is posted or launched.
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// ads drafts unchanged (content_type = 'ads_draft'), so there is NO DB schema
// change. Structured ads fields that have no dedicated column are rendered into
// the item caption as a readable spec block (same metadata pattern the Content,
// Design, and Video factories already use).
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../types/core';
import type { ContentFactoryOptions, ContentFactoryRunInput } from './contentFactory';
import { generateId } from './coreData';

// workflow_type identifies the n8n workflow / external module; content_type
// identifies the kind of item it produces. Keeping them distinct mirrors the
// Video Scripts fix so ads items never mislabel as content_pack/video_script.
const WORKFLOW_TYPE = 'ads_pack';
const CONTENT_TYPE = 'ads_draft';

// Fixed V1 set of ads draft items produced per run. Strategy/draft notes only —
// no campaigns, ad sets, ads, audiences, budgets, or launches are ever created.
interface AdsPackSpec {
  key: string;
  title: string;
  focus: string;
  objective: string;
}

const ADS_PACK_SPECS: AdsPackSpec[] = [
  { key: 'campaign_angle_offer', title: 'Campaign Angle & Offer Draft',     focus: 'Positioning & offer',      objective: 'Define the core campaign angle and the offer to test' },
  { key: 'ad_copy_variants',     title: 'Ad Copy Variants Draft',           focus: 'Primary text & headlines', objective: 'Draft multiple ad copy variants for the owner to A/B test' },
  { key: 'audience_targeting',   title: 'Audience & Targeting Notes',       focus: 'Audience strategy',        objective: 'Outline audience segments & targeting notes (no audiences are created)' },
  { key: 'budget_testing_plan',  title: 'Budget & Testing Plan Draft',      focus: 'Budget & test structure',  objective: 'Draft a budget split and testing plan for owner review (no budget is set or spent)' },
  { key: 'ads_manager_handoff',  title: 'Ads Manager Handoff Checklist',    focus: 'Manual handoff',           objective: 'Checklist for a human to set up manually in Ads Manager after approval' },
];

export interface AdsPackRequestPayload {
  request_id: string;
  workflow_type: 'ads_pack';
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
  ads_pack_types: string[];
  // Image AND video generation are explicitly out of scope for this V1 flow.
  generate_images: false;
  generate_videos: false;
  // Ads creation / launch are explicitly out of scope — drafts only.
  create_ads: false;
  launch_ads: false;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_platform_launch: true;
    no_image_generation: true;
    no_video_generation: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nAdsItem {
  key?: string;
  title?: string;
  focus?: string;
  objective?: string;
  target_audience?: string;
  draft_body?: string;
  key_points?: string;
  testing_note?: string;
  cta?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
}

interface N8nAdsResponse {
  ok?: boolean;
  request_id?: string;
  generated_by?: string;
  status?: string;
  items?: N8nAdsItem[];
  error?: { code?: string; message?: string };
}

export interface AdsFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: AdsPackRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class AdsFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdsFactoryError';
  }
}

export function getAdsFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_ADS_PACK_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createAdsPackPayload(input: ContentFactoryRunInput): AdsPackRequestPayload {
  return {
    request_id: generateId('af'),
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
    ads_pack_types: ADS_PACK_SPECS.map(spec => spec.key),
    generate_images: false,
    generate_videos: false,
    create_ads: false,
    launch_ads: false,
    safety: {
      no_auto_post: true,
      no_auto_ads: true,
      no_live_connectors: true,
      no_platform_launch: true,
      no_image_generation: true,
      no_video_generation: true,
      no_secrets: true,
      owner_approval_required: true,
    },
  };
}

export async function runAdsFactory(input: ContentFactoryRunInput): Promise<AdsFactoryResult> {
  const payload = createAdsPackPayload(input);
  const webhookUrl = getAdsFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new AdsFactoryError(`n8n Ads Pack failed (${response.status}). No ads draft items were created and no ads were launched.`);
  }

  const data = await response.json() as N8nAdsResponse;
  if (data.ok === false) {
    throw new AdsFactoryError(data.error?.message || 'n8n Ads Pack returned a failure response.');
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new AdsFactoryError('n8n Ads Pack returned no ads draft items.');
  }

  return buildResult(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

function buildMockResult(input: ContentFactoryRunInput, payload: AdsPackRequestPayload): AdsFactoryResult {
  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || 'hero product';
  const audience = input.brief.target_audience || input.brand.target_audience || 'core local audience';
  const offer = input.brief.offer || 'Assumption: feature the current campaign hero offer';
  const channel = input.options.channel;

  const items: N8nAdsItem[] = ADS_PACK_SPECS.map(spec => ({
    key: spec.key,
    title: spec.title,
    focus: spec.focus,
    objective: spec.objective,
    target_audience: audience,
    draft_body: buildMockDraftBody(spec.key, brand, product, offer, channel),
    key_points: buildMockKeyPoints(spec.key, brand, product, offer),
    testing_note: spec.key === 'budget_testing_plan'
      ? 'Draft only: suggest a small test budget split across 2–3 ad sets for the owner to review. No budget is set or spent here.'
      : 'Draft note for owner review — nothing is created or launched.',
    cta: input.options.goal === 'sales' ? 'Inbox to order' : input.options.goal === 'lead' ? 'Leave your contact' : 'Learn more',
  }));

  return buildResult(input, payload, items, 'local_mock', 'core-local-mock');
}

function buildMockDraftBody(key: string, brand: string, product: string, offer: string, channel: string): string {
  switch (key) {
    case 'campaign_angle_offer':
      return `Angle: position ${brand}'s ${product} as the easy local choice on ${channel}. Lead offer to test: ${offer}. Draft only — no campaign is created.`;
    case 'ad_copy_variants':
      return `Variant A (benefit): "${product} — ${offer}". Variant B (social proof). Variant C (urgency). Draft copy only — no ads are created.`;
    case 'audience_targeting':
      return `Suggested segments to consider: local radius around the brand, age/interest notes, lookalike idea (draft). No audiences are created in any Ads Manager.`;
    case 'budget_testing_plan':
      return `Draft test plan: split a small test budget across 2–3 ad sets, run ~5–7 days, then review. No budget is set, scheduled, or spent.`;
    case 'ads_manager_handoff':
      return `Manual checklist for the owner after approval: pick objective, set up audience, paste approved copy, attach approved creative, set budget, review, then launch manually.`;
    default:
      return `Ads draft notes for ${brand} featuring ${product}.`;
  }
}

function buildMockKeyPoints(key: string, brand: string, product: string, offer: string): string {
  switch (key) {
    case 'campaign_angle_offer':
      return `Primary message, secondary message, and the offer hook (${offer}).`;
    case 'ad_copy_variants':
      return `3 primary-text variants + 3 headline variants for ${product}, owner to pick winners.`;
    case 'audience_targeting':
      return `Core, broad, and retargeting audience ideas — notes only, not created.`;
    case 'budget_testing_plan':
      return `Test → learn → scale outline with a draft daily budget range for owner sign-off.`;
    case 'ads_manager_handoff':
      return `Pre-launch checklist items + reminder that Approved ≠ Published and launch is manual.`;
    default:
      return `Key draft points for ${brand}.`;
  }
}

function buildResult(
  input: ContentFactoryRunInput,
  payload: AdsPackRequestPayload,
  sourceItems: N8nAdsItem[],
  mode: AdsFactoryResult['mode'],
  generatedBy: string,
): AdsFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const items = sourceItems.map((item, idx) => mapAdsItem(input, item, jobId, idx + 1, now, generatedBy, mode));

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

function mapAdsItem(
  input: ContentFactoryRunInput,
  item: N8nAdsItem,
  jobId: string,
  sequence: number,
  now: string,
  generatedBy: string,
  mode: AdsFactoryResult['mode'],
): ContentPlanItem {
  // Always anchor to a canonical spec: match by key, else by sequence, else the
  // first. This guarantees a specific title/focus/objective even when an n8n AI
  // response omits fields — so items never degrade to "Owner to confirm ...".
  const spec = ADS_PACK_SPECS.find(s => s.key === item.key)
    ?? ADS_PACK_SPECS[sequence - 1]
    ?? ADS_PACK_SPECS[0];

  const brand = input.brand.name;
  const product = input.brief.product_focus || input.brand.hero_product || `${brand} hero product`;
  const goal = input.options.goal;
  const defaultCta = goal === 'sales' ? 'Inbox to order' : goal === 'lead' ? 'Leave your contact for a callback' : 'Learn more';

  // Prefer AI/source values; fall back to the canonical spec or a clearly-flagged
  // "Assumption: ..." derived from the brief — never a generic "Owner to confirm".
  const title     = item.title || spec.title;
  const focus     = item.focus || spec.focus;
  const objective = item.objective || spec.objective;
  const audience  = item.target_audience || input.brief.target_audience || input.brand.target_audience || 'Assumption: core local audience for this brand';
  const draft     = item.draft_body || `Assumption: draft notes for "${brand} — ${objective}", featuring ${product}.${input.brief.offer ? ` Offer: ${input.brief.offer}.` : ''} Draft only — no ads are created or launched.`;
  const keyPoints = item.key_points || `Assumption: key draft points for ${brand} (${focus}). Owner reviews and decides.`;
  const testing   = item.testing_note || (spec.key === 'budget_testing_plan'
    ? 'Draft only: small test budget split for owner review. No budget is set, scheduled, or spent.'
    : 'Draft note for owner review — nothing is created, launched, or scheduled.');
  const cta       = item.cta || defaultCta;

  const sourceLabel = mode === 'n8n' ? 'n8n' : 'local';
  const caption = [
    `Ads objective: ${objective}`,
    `Focus: ${focus}`,
    `Target audience (notes only): ${audience}`,
    `Draft: ${draft}`,
    `Key points / variants: ${keyPoints}`,
    `Budget / testing note: ${testing}`,
    `CTA: ${cta}`,
    'Safety: strategy/draft notes only — no ads created, launched, scheduled, or spent. No platform connector is called.',
    '',
    '---',
    'Ads Pack Draft V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    // workflow_type/content_type are forced to the canonical constants (not the
    // upstream item value) so a nonconforming AI response can never mislabel them.
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${sourceLabel}`,
    `generation_mode: ${mode === 'n8n' ? 'external_module' : 'mock'}`,
    'safety: no_auto_post=true; no_auto_ads=true; no_platform_launch=true; no_image_generation=true; no_video_generation=true; no_live_connectors=true',
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
    channel: input.options.channel,
    content_type: CONTENT_TYPE,
    pillar: 'Ads Draft',
    angle: title,
    hook: `${title} — ${objective}`,
    caption,
    visual_brief: keyPoints,
    cta,
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #AdsDraft`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}
