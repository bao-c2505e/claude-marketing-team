// Canva Connector — SANDBOX MODE ONLY (foundation)
// ---------------------------------------------------------------------------
// A safe, offline abstraction that prepares the Core for a future Canva Connect
// integration WITHOUT touching the real Canva API. It NEVER:
//   • calls the real Canva API or any external URL (no fetch at all),
//   • requires or reads a CANVA_API_KEY / OAuth token,
//   • creates a real Canva design,
//   • generates any image or video,
//   • publishes, posts, launches, schedules, or spends anything.
//
// It only produces MOCK design previews/specs (sandbox_preview_only) that flow
// into the SAME approval queue used by the AI Factory modules (Content / Design
// / Video / Ads / Report). Output items are review-gated (`needs_review`) and an
// approved sandbox item still authorises INTERNAL use only — never a real Canva
// design and never a publish/launch. See CLAUDE.md §4 (Safety Principles),
// §6 (Output Status Model), §7 (Connector Roadmap — approval-gated, future).
//
// Reuse: the existing ContentPlanJob / ContentPlanItem / approval model carries
// the sandbox preview unchanged (content_type = 'canva_sandbox_preview'), so
// there is NO DB schema change — the structured Canva fields are rendered into
// the item caption as a readable spec block, the same pattern Design Factory
// already uses for its design briefs.
// ---------------------------------------------------------------------------
import type { ContentPlanItem, ContentPlanJob } from '../../../types/core';
import type { ContentFactoryRunInput } from '../contentFactory';
import type { LocalAutomationLog } from '../../../types/core';
import { generateId } from '../coreData';

// connector_id identifies the (registry) connector this sandbox stands in for;
// content_type identifies the kind of approval item it produces.
const CONNECTOR_ID = 'conn-canva';
const CONNECTOR_TYPE = 'canva';
const CONTENT_TYPE = 'canva_sandbox_preview';
const WORKFLOW_TYPE = 'canva_sandbox_connector';

// Canonical user-facing safety copy. Surfaced in the UI and embedded in every
// preview/caption so the sandbox boundary is always explicit and testable.
export const CANVA_SANDBOX_COPY = {
  title: 'Canva Sandbox Preview',
  noDesign: 'No Canva design was created',
  noPublish: 'Nothing was published',
  approvalRequired: 'Approval required before any real connector action',
} as const;

// Immutable sandbox safety flags carried on every preview. `as const` so the
// literal `true` types are preserved (these can never be flipped to false here).
export interface CanvaSandboxSafetyFlags {
  no_live_canva_api: true;
  no_publish: true;
  approval_required: true;
  no_real_design_created: true;
  no_image_generation: true;
  no_secrets: true;
}

export const CANVA_SANDBOX_SAFETY_FLAGS: CanvaSandboxSafetyFlags = {
  no_live_canva_api: true,
  no_publish: true,
  approval_required: true,
  no_real_design_created: true,
  no_image_generation: true,
  no_secrets: true,
};

export type CanvaSandboxFormat =
  | 'facebook_post'
  | 'story'
  | 'menu_a5'
  | 'tiktok_cover'
  | 'zalo_post';

interface CanvaFormatSpec {
  format: CanvaSandboxFormat;
  design_type: string;
  dimensions: string;
  title: string;
  objective: string;
}

// Fixed V1 set of sandbox preview specs (one per supported format). Spec/text
// only — these describe what a designer/Canva template WOULD cover; no real
// asset is ever produced.
const CANVA_FORMAT_SPECS: CanvaFormatSpec[] = [
  { format: 'facebook_post', design_type: 'Social media post (Facebook)', dimensions: '1080×1350 (4:5)',  title: 'Facebook Post — Canva Sandbox Preview',  objective: 'Bài feed dừng-lướt cho món chủ lực' },
  { format: 'story',         design_type: 'Story / Reels cover',          dimensions: '1080×1920 (9:16)', title: 'Story / Reels Cover — Canva Sandbox Preview', objective: 'Cover tương phản cao để khách bấm xem' },
  { format: 'menu_a5',       design_type: 'Menu / promo print (A5)',      dimensions: '148×210mm @ 300dpi', title: 'Menu A5 — Canva Sandbox Preview',        objective: 'Trình bày menu / ưu đãi rõ ràng (bản in)' },
  { format: 'tiktok_cover',  design_type: 'TikTok video cover',           dimensions: '1080×1920 (9:16)', title: 'TikTok Cover — Canva Sandbox Preview',   objective: 'Cover video gây tò mò, dễ đọc ở thumbnail' },
  { format: 'zalo_post',     design_type: 'Zalo post',                    dimensions: '1080×1080 (1:1)',  title: 'Zalo Post — Canva Sandbox Preview',      objective: 'Bài Zalo OA cho khách quen / địa phương' },
];

export interface CanvaSandboxPreview {
  key: CanvaSandboxFormat;
  design_title: string;
  design_type: string;
  brand_name: string;
  campaign_name: string;
  format: CanvaSandboxFormat;
  dimensions: string;
  // Clearly-fake references. NEVER a real Canva design id or URL.
  sandbox_design_ref: string;
  mock_canva_design_id: string;
  preview_status: 'sandbox_preview_only';
  design_notes: string;
  safety_flags: CanvaSandboxSafetyFlags;
}

export interface CanvaSandboxResult {
  mode: 'sandbox';
  connector_id: string;
  connector_type: string;
  previews: CanvaSandboxPreview[];
  job: ContentPlanJob;
  items: ContentPlanItem[];
}

// ---------------------------------------------------------------------------
// Preview construction (pure / offline)
// ---------------------------------------------------------------------------

function buildPreview(input: ContentFactoryRunInput, spec: CanvaFormatSpec): CanvaSandboxPreview {
  const brand = input.brand.name;
  const campaign = input.campaign.name;
  const product = input.brief.product_focus || input.brand.hero_product || `món chủ lực của ${brand}`;
  const tone = input.brand.tone_of_voice || 'ấm áp, đáng tin, ngon mắt';

  return {
    key: spec.format,
    design_title: spec.title,
    design_type: spec.design_type,
    brand_name: brand,
    campaign_name: campaign,
    format: spec.format,
    dimensions: spec.dimensions,
    // Sandbox-only references — explicitly marked MOCK so no code path can ever
    // mistake them for a real Canva design id or shareable link.
    sandbox_design_ref: `sandbox-canva-${spec.format}-${generateId('ref')}`,
    mock_canva_design_id: `MOCK-CANVA-${spec.format.toUpperCase()}-${generateId('id')}`,
    preview_status: 'sandbox_preview_only',
    design_notes: `${spec.objective}. Tông: ${tone}. Lấy ${product} làm nhân vật chính; chỉ dùng ảnh/clip món thật của quán — KHÔNG tạo ảnh AI. Đây là bản mô tả template (spec) trong sandbox, chưa có design Canva thật.`,
    safety_flags: { ...CANVA_SANDBOX_SAFETY_FLAGS },
  };
}

function buildCaption(preview: CanvaSandboxPreview): string {
  return [
    `${CANVA_SANDBOX_COPY.title}: ${preview.design_title}`,
    `Loại thiết kế (design_type): ${preview.design_type}`,
    `Brand: ${preview.brand_name}`,
    `Campaign: ${preview.campaign_name}`,
    `Format: ${preview.format} · ${preview.dimensions}`,
    `Mô tả: ${preview.design_notes}`,
    `sandbox_design_ref: ${preview.sandbox_design_ref}`,
    `mock_canva_design_id: ${preview.mock_canva_design_id}`,
    `preview_status: ${preview.preview_status}`,
    '',
    `An toàn: ${CANVA_SANDBOX_COPY.noDesign}. ${CANVA_SANDBOX_COPY.noPublish}. ${CANVA_SANDBOX_COPY.approvalRequired}.`,
    '',
    '---',
    'Canva Sandbox Connector metadata:',
    `connector_id: ${CONNECTOR_ID}`,
    `connector_type: ${CONNECTOR_TYPE}`,
    `workflow_type: ${WORKFLOW_TYPE}`,
    `content_type: ${CONTENT_TYPE}`,
    'mode: sandbox',
    'status: pending_approval',
    'owner_approval_required: true',
    'safety: no_live_canva_api=true; no_publish=true; approval_required=true; no_real_design_created=true; no_image_generation=true; no_secrets=true',
  ].join('\n');
}

function mapPreviewToItem(
  input: ContentFactoryRunInput,
  preview: CanvaSandboxPreview,
  jobId: string,
  sequence: number,
  now: string,
): ContentPlanItem {
  return {
    id: generateId('item'),
    generation_job_id: jobId,
    brief_id: input.brief.id,
    campaign_id: input.campaign.id,
    brand_id: input.brand.id,
    client_id: input.client.id,
    day_number: sequence,
    planned_date: null,
    channel: preview.format,
    content_type: CONTENT_TYPE,
    pillar: 'Canva Sandbox',
    angle: preview.design_title,
    hook: `${CANVA_SANDBOX_COPY.title} — ${preview.design_type}`,
    caption: buildCaption(preview),
    visual_brief: preview.design_notes,
    cta: 'Owner duyệt nội bộ — KHÔNG xuất bản, KHÔNG tạo design Canva thật.',
    hashtags: `#${input.brand.name.replace(/\s+/g, '')} #CanvaSandbox`,
    // Approval-first: review-gated, never auto-approved. The ceiling for any
    // sandbox/AI action is the approval queue — never published/launched.
    status: 'needs_review',
    created_at: now,
    updated_at: now,
  };
}

/**
 * Run the Canva Connector in SANDBOX mode. Pure & offline: builds mock preview
 * specs and maps them into approval-queue items. Never calls the real Canva API,
 * never requires a token, never creates a real design, never publishes.
 */
export function runCanvaSandboxConnector(input: ContentFactoryRunInput): CanvaSandboxResult {
  const now = new Date().toISOString();
  const jobId = generateId('job');
  const previews = CANVA_FORMAT_SPECS.map(spec => buildPreview(input, spec));
  const items = previews.map((preview, idx) => mapPreviewToItem(input, preview, jobId, idx + 1, now));

  const job: ContentPlanJob = {
    id: jobId,
    brief_id: input.brief.id,
    campaign_id: input.campaign.id,
    brand_id: input.brand.id,
    client_id: input.client.id,
    plan_length_days: input.options.planLengthDays,
    // Sandbox previews are local/mock — they never run through n8n / external_module.
    generation_mode: 'mock',
    status: 'completed',
    requested_by: input.requestedBy,
    item_count: items.length,
    created_at: now,
    updated_at: now,
    completed_at: now,
    error_message: null,
  };

  return {
    mode: 'sandbox',
    connector_id: CONNECTOR_ID,
    connector_type: CONNECTOR_TYPE,
    previews,
    job,
    items,
  };
}

/**
 * Build an audit-trail automation log entry for a sandbox run. The caller
 * persists it via automationLogs.createAutomationLog so every sandbox action is
 * recorded (CLAUDE.md §4.7 — all connector actions logged).
 */
export function buildCanvaSandboxAuditLog(
  input: ContentFactoryRunInput,
  result: CanvaSandboxResult,
): Omit<LocalAutomationLog, 'id' | 'created_at' | 'reviewed_at' | 'resolved_at'> {
  return {
    log_type: 'connector',
    source: 'connector',
    severity: 'info',
    status: 'recorded',
    title: `Canva Sandbox Preview — ${input.brand.name} (${result.items.length} previews)`,
    message:
      `Canva Connector ran in SANDBOX mode for campaign "${input.campaign.name}". ` +
      `${result.items.length} sandbox preview approval items created (needs_review). ` +
      `${CANVA_SANDBOX_COPY.noDesign}. ${CANVA_SANDBOX_COPY.noPublish}. ` +
      `No real Canva API call, no token used. ${CANVA_SANDBOX_COPY.approvalRequired}.`,
    payload_preview: JSON.stringify({
      connector_id: result.connector_id,
      connector_type: result.connector_type,
      mode: result.mode,
      previews: result.items.length,
      no_live_canva_api: true,
      no_publish: true,
      no_real_design_created: true,
      approval_required: true,
    }),
    related_connector_id: CONNECTOR_ID,
    related_module_id: null,
    related_event_id: null,
    related_client_id: input.client.id,
    related_brand_id: input.brand.id,
    related_campaign_id: input.campaign.id,
    related_content_item_id: null,
  };
}
