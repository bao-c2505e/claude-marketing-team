// Report Draft Factory V1
// ---------------------------------------------------------------------------
// Production-safe V1 flow that turns an approved campaign/brief into a set of
// REPORT DRAFT (notes/spec) approval items via the same n8n AI Provider
// external_module path as the Content / Design / Video / Ads factories. It is
// REPORT DRAFT NOTES ONLY: it never pulls live analytics, never claims real
// metrics (unless they are explicitly provided in the Core request), never
// generates images or video, and never touches any live Meta / TikTok / Zalo /
// Google Ads / GA4 / CRM / Canva / ComfyUI / Fal.ai connector. Output is
// approval-first text drafts only — nothing is posted, launched, or spent.
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// report drafts unchanged (content_type = 'report_draft'), so there is NO DB
// schema change. Structured report fields that have no dedicated column are
// rendered into the item caption as a readable spec block (same metadata pattern
// the Content, Design, Video, and Ads factories already use).
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../types/core';
import type { ContentFactoryOptions, ContentFactoryRunInput } from './contentFactory';
import { generateId } from './coreData';

// workflow_type identifies the n8n workflow / external module; content_type
// identifies the kind of item it produces. Keeping them aligned to report_draft
// so report items never mislabel as content_pack/ads_draft/etc.
const WORKFLOW_TYPE = 'report_draft';
const CONTENT_TYPE = 'report_draft';

// Fixed V1 set of report draft items produced per run. Notes/draft only — no live
// analytics is pulled and no metric is claimed unless provided in the request.
interface ReportDraftSpec {
  key: string;
  title: string;
  focus: string;
  objective: string;
}

const REPORT_DRAFT_SPECS: ReportDraftSpec[] = [
  { key: 'campaign_status_summary', title: 'Campaign Status Summary Draft',      focus: 'Status overview',        objective: 'Summarize campaign status from the brief & approvals (no live data pulled)' },
  { key: 'performance_insight',     title: 'Performance Insight Notes',          focus: 'Insight framing',        objective: 'Frame performance insight notes using only owner-provided figures (no metrics invented)' },
  { key: 'content_creative_review', title: 'Content & Creative Review Notes',    focus: 'Content & creative',     objective: 'Review content/creative items already in Core for the owner' },
  { key: 'risks_learnings_actions', title: 'Risks, Learnings & Next Actions',    focus: 'Risks & next actions',   objective: 'Draft risks, learnings, and suggested next actions for owner review' },
  { key: 'report_handoff',          title: 'Owner / Client Report Handoff Draft', focus: 'Report handoff',         objective: 'Assemble an owner/client-ready report draft skeleton for manual review' },
];

export interface ReportDraftRequestPayload {
  request_id: string;
  workflow_type: 'report_draft';
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
  report_draft_types: string[];
  // Image AND video generation are explicitly out of scope for this V1 flow.
  generate_images: false;
  generate_videos: false;
  // Live analytics pulls and unverified metrics are explicitly out of scope —
  // report drafts only, built from the request payload and Core-side data.
  pull_live_analytics: false;
  use_unverified_metrics: false;
  safety: {
    no_auto_post: true;
    no_auto_ads: true;
    no_live_connectors: true;
    no_platform_launch: true;
    no_image_generation: true;
    no_video_generation: true;
    no_live_analytics_pull: true;
    no_unverified_metrics: true;
    no_secrets: true;
    owner_approval_required: true;
  };
}

interface N8nReportItem {
  key?: string;
  title?: string;
  focus?: string;
  objective?: string;
  period?: string;
  data_basis?: string;
  summary_body?: string;
  key_points?: string;
  next_actions?: string;
  generated_by?: string;
  workflow_type?: string;
  status?: string;
}

interface N8nReportResponse {
  ok?: boolean;
  request_id?: string;
  generated_by?: string;
  status?: string;
  items?: N8nReportItem[];
  error?: { code?: string; message?: string };
}

export interface ReportFactoryResult {
  mode: 'local_mock' | 'n8n';
  payload: ReportDraftRequestPayload;
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

export class ReportFactoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportFactoryError';
  }
}

export function getReportFactoryWebhookUrl(): string | null {
  const url = import.meta.env.VITE_N8N_REPORT_DRAFT_WEBHOOK_URL?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

export function createReportDraftPayload(input: ContentFactoryRunInput): ReportDraftRequestPayload {
  return {
    request_id: generateId('rf'),
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
    report_draft_types: REPORT_DRAFT_SPECS.map(spec => spec.key),
    generate_images: false,
    generate_videos: false,
    pull_live_analytics: false,
    use_unverified_metrics: false,
    safety: {
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
    },
  };
}

export async function runReportFactory(input: ContentFactoryRunInput): Promise<ReportFactoryResult> {
  const payload = createReportDraftPayload(input);
  const webhookUrl = getReportFactoryWebhookUrl();
  if (!webhookUrl) return buildMockResult(input, payload);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ReportFactoryError(`n8n Report Draft failed (${response.status}). No report draft items were created and no analytics were pulled.`);
  }

  const data = await response.json() as N8nReportResponse;
  if (data.ok === false) {
    throw new ReportFactoryError(data.error?.message || 'n8n Report Draft returned a failure response.');
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new ReportFactoryError('n8n Report Draft returned no report draft items.');
  }

  return buildResult(input, payload, data.items, 'n8n', data.generated_by || 'n8n-ai-provider');
}

// Local fallback: builds the same 5 approval-first report draft items WITHOUT any
// live data. Every item's data basis explicitly states that no platform data was
// pulled and that figures are simulated/demo for structure only.
function buildMockResult(input: ContentFactoryRunInput, payload: ReportDraftRequestPayload): ReportFactoryResult {
  const brand = input.brand.name;
  const campaign = input.campaign.name;
  const goal = input.options.goal;
  const channel = input.options.channel;

  const items: N8nReportItem[] = REPORT_DRAFT_SPECS.map(spec => ({
    key: spec.key,
    title: spec.title,
    focus: spec.focus,
    objective: spec.objective,
    period: 'Assumption: current campaign window (owner to set exact dates)',
    data_basis: 'Local fallback / simulated demo structure only — NO live analytics were pulled and NO real metrics are claimed. Replace with owner-provided data before sharing.',
    summary_body: buildMockSummaryBody(spec.key, brand, campaign, channel),
    key_points: buildMockKeyPoints(spec.key, brand, goal),
    next_actions: spec.key === 'risks_learnings_actions'
      ? 'Draft next actions for owner review: confirm real figures, prioritize top creative, decide next test. Owner approves before anything is acted on.'
      : 'Owner reviews this draft and supplies/validates any figures before it is shared.',
  }));

  return buildResult(input, payload, items, 'local_mock', 'core-local-mock');
}

function buildMockSummaryBody(key: string, brand: string, campaign: string, channel: string): string {
  switch (key) {
    case 'campaign_status_summary':
      return `Status draft for ${brand} — "${campaign}" on ${channel}: summarize approved briefs, generated items, and approval progress from Core. No live platform data is pulled.`;
    case 'performance_insight':
      return `Insight framing only: structure where owner-provided figures would go (reach, engagement, leads). No metrics are invented — fields stay blank until the owner supplies real numbers.`;
    case 'content_creative_review':
      return `Review notes for the content/creative items already in Core: what was produced, what is pending approval, and qualitative notes. No external data.`;
    case 'risks_learnings_actions':
      return `Draft risks (e.g., unconfirmed data, pending approvals), learnings to validate with the owner, and suggested next actions. All subject to owner review.`;
    case 'report_handoff':
      return `Owner/client report skeleton: title, period, summary, insight, creative review, next steps — ready for the owner to fill verified data and approve before sharing.`;
    default:
      return `Report draft notes for ${brand} — "${campaign}".`;
  }
}

function buildMockKeyPoints(key: string, brand: string, goal: string): string {
  switch (key) {
    case 'campaign_status_summary':
      return `Briefs approved, items generated, approvals pending — counts to be confirmed from Core. Goal context: ${goal}.`;
    case 'performance_insight':
      return `Placeholders for owner-provided metrics only. Mark each as "owner to supply" — never fabricate a number.`;
    case 'content_creative_review':
      return `Top items to highlight, items needing rework, consistency notes for ${brand}.`;
    case 'risks_learnings_actions':
      return `Risk list, learning hypotheses (to validate), and a short prioritized next-action list.`;
    case 'report_handoff':
      return `Section checklist + reminder that Approved ≠ Published and figures must be verified before sharing.`;
    default:
      return `Key draft points for ${brand}.`;
  }
}

function buildResult(
  input: ContentFactoryRunInput,
  payload: ReportDraftRequestPayload,
  sourceItems: N8nReportItem[],
  mode: ReportFactoryResult['mode'],
  generatedBy: string,
): ReportFactoryResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const items = sourceItems.map((item, idx) => mapReportItem(input, item, jobId, idx + 1, now, generatedBy, mode));

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

function mapReportItem(
  input: ContentFactoryRunInput,
  item: N8nReportItem,
  jobId: string,
  sequence: number,
  now: string,
  generatedBy: string,
  mode: ReportFactoryResult['mode'],
): ContentPlanItem {
  // Always anchor to a canonical spec: match by key, else by sequence, else the
  // first. This guarantees a specific title/focus/objective even when an n8n AI
  // response omits fields — so items never degrade to "Owner to confirm ...".
  const spec = REPORT_DRAFT_SPECS.find(s => s.key === item.key)
    ?? REPORT_DRAFT_SPECS[sequence - 1]
    ?? REPORT_DRAFT_SPECS[0];

  const brand = input.brand.name;
  const campaign = input.campaign.name;

  // Prefer AI/source values; fall back to the canonical spec or a clearly-flagged
  // "Assumption: ..." derived from the request — never a generic "Owner to confirm".
  const title     = item.title || spec.title;
  const focus     = item.focus || spec.focus;
  const objective = item.objective || spec.objective;
  const period    = item.period || 'Assumption: current campaign window (owner to set exact dates)';
  // data_basis is forced to always state no-live-analytics if the source omits it,
  // so a report draft can never imply that real platform data was pulled.
  const dataBasis = item.data_basis || 'No live analytics were pulled. Any figures must be owner-provided; unverified metrics are not claimed.';
  const summary   = item.summary_body || `Assumption: report draft notes for "${brand} — ${campaign}". ${objective}.`;
  const keyPoints = item.key_points || `Assumption: key draft points for ${brand} (${focus}). Owner reviews and validates.`;
  const actions   = item.next_actions || 'Owner reviews this draft and supplies/validates any figures before it is shared.';

  const sourceLabel = mode === 'n8n' ? 'n8n' : 'local';
  const caption = [
    `Report objective: ${objective}`,
    `Focus: ${focus}`,
    `Period: ${period}`,
    `Data basis: ${dataBasis}`,
    `Summary draft: ${summary}`,
    `Key points / insights: ${keyPoints}`,
    `Next actions: ${actions}`,
    'Safety: report draft notes only — no live analytics pulled; no metrics claimed unless owner-provided in the request. Nothing is posted, launched, or spent.',
    '',
    '---',
    'Report Draft V1 metadata:',
    `generated_by: ${item.generated_by || generatedBy}`,
    // workflow_type/content_type are forced to the canonical constants (not the
    // upstream item value) so a nonconforming AI response can never mislabel them.
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'status: pending_approval',
    'owner_approval_required: true',
    `source: ${sourceLabel}`,
    `generation_mode: ${mode === 'n8n' ? 'external_module' : 'mock'}`,
    'safety: no_auto_post=true; no_auto_ads=true; no_platform_launch=true; no_image_generation=true; no_video_generation=true; no_live_connectors=true; no_live_analytics_pull=true; no_unverified_metrics=true',
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
    pillar: 'Report Draft',
    angle: title,
    hook: `${title} — ${objective}`,
    caption,
    visual_brief: keyPoints,
    cta: 'Owner review',
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #ReportDraft`,
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}
