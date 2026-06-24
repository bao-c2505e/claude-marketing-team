// ---------------------------------------------------------------------------
// Client-ready Campaign Pack (Phase Q) — internal, local, copy/export only
//
// A SAFE, campaign-scoped delivery dossier so the Owner/staff can assemble ONE
// campaign into a client-presentation-grade pack: a Brand Brain context cover
// (positioning / voice / pillars / compliance — the SAME grounding shown in the
// Approval Queue, Phase N/O) + that campaign's Owner-APPROVED deliverables
// grouped by module + per-item approval provenance (who approved, when — Phase P).
//
// It is NOT automation:
//   • Core never publishes, schedules, launches, or spends.
//   • The pack is built ONLY from APPROVED approval requests already in Core.
//   • Building a pack does NOT change any approval state, never calls an external
//     service, never sends email, never posts, never pulls live analytics, and
//     never invents metrics.
//   • "Manually posted" means a human did it OUTSIDE Core — the pack only echoes
//     the manual-delivery note recorded in Phase E.
//
// Everything here is PURE + READ-ONLY: it reads existing Core data
// (clients/brands/campaigns/briefs, content items, approval requests + events)
// plus the Phase E manual-delivery map, and returns plain strings/objects. No
// localStorage write, no DB, no network. This keeps it trivially unit-testable
// and side-effect free.
//
// Reuses (no duplication): handoffPack module ordering + plain-text conversion,
// brandBrain snapshot, approvalDecision audit, manualDelivery labels,
// approvalClassify module classification.
// ---------------------------------------------------------------------------

import type {
  Client,
  Brand,
  Campaign,
  CampaignBrief,
  ContentPlanItem,
  ContentApprovalRequest,
  ContentApprovalEvent,
} from '../../types/core';
import {
  classifyRequest,
  splitCaption,
  moduleFieldLabels,
  MODULE_META,
  type ModuleKey,
} from './approvalClassify';
import {
  buildBrandBrain,
  buildBrandContextSnapshot,
  APPROVED_NOT_PUBLISHED_REMINDER,
  type BrandContextSnapshot,
} from './brandBrain';
import { deriveLatestDecision } from './approvalDecision';
import {
  HANDOFF_MODULE_ORDER,
  HANDOFF_MODULE_SECTION,
  toPlainText,
} from './handoffPack';
import {
  MANUAL_DELIVERY_LABEL,
  DEFAULT_MANUAL_DELIVERY_STATUS,
  isSafeHttpLink,
  type ManualDeliveryMap,
  type ManualDeliveryStatus,
} from './manualDelivery';

// ---------------------------------------------------------------------------
// Safety copy — verbatim strings every campaign pack MUST carry. Exported so the
// UI and the safety-regression test reference the same source of truth.
// ---------------------------------------------------------------------------

/** Pack-level safety note. */
export const CAMPAIGN_PACK_SAFETY_NOTE =
  'This is an internal client-ready campaign pack. Core did not publish, launch, schedule, or spend.';

/** Approved ≠ Published line, on every pack. */
export const CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED =
  'Approved for client handoff. Not published, scheduled, launched, or spent by Core.';

/** Per-item label when an item was manually posted outside Core. */
export const CAMPAIGN_PACK_MANUALLY_POSTED_NOTE =
  'Marked as manually posted outside Core by Owner/staff.';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignPackFormat = 'markdown' | 'plain_text';

export const CAMPAIGN_PACK_FORMAT_LABEL: Record<CampaignPackFormat, string> = {
  markdown: 'Markdown',
  plain_text: 'Plain Text',
};

/** Provenance of an approval — who approved it and when (Phase P audit trail). */
export interface CampaignPackProvenance {
  actorLabel: string;
  at: string | null;
}

/** One approved deliverable, resolved + ready to show and select. */
export interface CampaignPackItem {
  /** Approval request id (also the manual-delivery map key). */
  approvalId: string;
  contentItemId: string;
  title: string;
  module: ModuleKey;
  moduleLabel: string;
  item?: ContentPlanItem;
  deliveryStatus: ManualDeliveryStatus;
  deliveryNote?: string;
  deliveryLink?: string;
  /** Latest Owner approval decision for this item, or null when unavailable. */
  provenance: CampaignPackProvenance | null;
}

export interface CollectCampaignItemsParams {
  campaignId: string;
  contentItems: ContentPlanItem[];
  approvalRequests: ContentApprovalRequest[];
  approvalEvents: ContentApprovalEvent[];
  deliveryMap: ManualDeliveryMap;
}

export interface CampaignPackContext {
  campaign: Campaign;
  client: Client | null;
  brand: Brand | null;
  briefs: CampaignBrief[];
  snapshot: BrandContextSnapshot | null;
}

export interface BuildCampaignPackParams {
  context: CampaignPackContext;
  items: CampaignPackItem[];
  title: string;
  format: CampaignPackFormat;
  generatedBy: string;
  /** Render date label; injectable for deterministic tests. */
  now?: Date;
}

export interface CampaignPack {
  title: string;
  format: CampaignPackFormat;
  content: string;
  itemCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Resolve — assemble the campaign's brand-context cover (Brand Brain snapshot).
//
// Reuses the SAME normalizer the AI Factory + Approval Queue use, so the pack's
// cover is grounded in identical, internal/draft-only brand context — never a
// live/published source. Returns a null snapshot when no brand resolves.
// ---------------------------------------------------------------------------

export interface ResolveContextParams {
  campaign: Campaign;
  clients: Client[];
  brands: Brand[];
  briefs: CampaignBrief[];
}

export function resolveCampaignPackContext(params: ResolveContextParams): CampaignPackContext {
  const { campaign, clients, brands, briefs } = params;

  const brand = brands.find(b => b.id === campaign.brand_id) ?? null;
  const clientId = campaign.client_id ?? brand?.client_id ?? null;
  const client = clientId ? clients.find(c => c.id === clientId) ?? null : null;

  const campaignBriefs = briefs.filter(b => b.campaign_id === campaign.id);

  const snapshot = brand
    ? buildBrandContextSnapshot(
        buildBrandBrain({
          brand,
          client,
          campaigns: [campaign],
          briefs: campaignBriefs,
          assets: [],
        }),
      )
    : null;

  return { campaign, client, brand, briefs: campaignBriefs, snapshot };
}

// ---------------------------------------------------------------------------
// Collect — turn this campaign's APPROVED approval requests into resolved items.
//
// Only requests whose status is exactly `approved` AND that belong to the chosen
// campaign become deliverables. Each carries its latest approval decision from
// the audit log (Phase P) for client-facing provenance.
// ---------------------------------------------------------------------------

export function collectCampaignPackItems(params: CollectCampaignItemsParams): CampaignPackItem[] {
  const { campaignId, contentItems, approvalRequests, approvalEvents, deliveryMap } = params;

  const itemById = new Map(contentItems.map(i => [i.id, i]));

  const out: CampaignPackItem[] = [];

  for (const req of approvalRequests) {
    if (req.status !== 'approved') continue;

    const item = itemById.get(req.content_item_id);
    const campaign_id = req.campaign_id || item?.campaign_id || '';
    if (campaign_id !== campaignId) continue;

    const { module } = classifyRequest(item);
    const delivery = deliveryMap[req.id];

    // Latest decision for this request (status is approved → decision is the approval).
    const decision = deriveLatestDecision(
      approvalEvents.filter(e => e.approval_request_id === req.id),
    );
    const provenance: CampaignPackProvenance | null =
      decision && decision.action === 'approved'
        ? { actorLabel: decision.actorLabel, at: decision.at }
        : req.resolved_at
          ? { actorLabel: 'Owner', at: req.resolved_at }
          : null;

    out.push({
      approvalId: req.id,
      contentItemId: req.content_item_id,
      title: req.title || item?.hook || 'Untitled output',
      module,
      moduleLabel: MODULE_META[module].label,
      item,
      deliveryStatus: delivery?.status ?? DEFAULT_MANUAL_DELIVERY_STATUS,
      deliveryNote: delivery?.note,
      deliveryLink: delivery?.link,
      provenance,
    });
  }

  // Stable order: module order, then approval time.
  out.sort((a, b) => {
    const ma = HANDOFF_MODULE_ORDER.indexOf(a.module);
    const mb = HANDOFF_MODULE_ORDER.indexOf(b.module);
    if (ma !== mb) return ma - mb;
    return (a.provenance?.at ?? '').localeCompare(b.provenance?.at ?? '');
  });

  return out;
}

/** Count selected items per module — for the overview line. */
export function campaignModuleBreakdown(
  items: CampaignPackItem[],
): Array<{ module: ModuleKey; label: string; count: number }> {
  const counts = new Map<ModuleKey, number>();
  for (const c of items) counts.set(c.module, (counts.get(c.module) ?? 0) + 1);
  return HANDOFF_MODULE_ORDER
    .filter(m => counts.has(m))
    .map(m => ({ module: m, label: MODULE_META[m].label, count: counts.get(m) ?? 0 }));
}

// ---------------------------------------------------------------------------
// Build — render the campaign cover + selected deliverables into a client-safe
// Markdown document.
// ---------------------------------------------------------------------------

function dateLabel(now: Date): string {
  return now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function dateTimeLabel(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Render one snapshot list field as a markdown bullet line (only when present). */
function listLine(lines: string[], label: string, values: string[]): void {
  if (values.length) lines.push(`- **${label}:** ${values.join(' · ')}`);
}

export function buildCampaignPack(params: BuildCampaignPackParams): CampaignPack {
  const { context, items, title, format, generatedBy } = params;
  const now = params.now ?? new Date();
  const { campaign, client, brand, snapshot } = context;

  const scopeTitle = (title || '').trim()
    || `${brand?.name ?? 'Campaign'} — ${campaign.name}`;

  const lines: string[] = [];

  // ── Header ──
  lines.push(`# CAMPAIGN PACK — ${scopeTitle}`);
  lines.push(`Prepared by The Core Agency${generatedBy ? ` · ${generatedBy}` : ''} — ${dateLabel(now)}`);
  lines.push('');

  // ── Safety block ──
  lines.push('> **⚠️ INTERNAL CLIENT-READY PACK — SAFETY NOTICE**');
  lines.push(`> - ${CAMPAIGN_PACK_SAFETY_NOTE}`);
  lines.push(`> - ${CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED}`);
  lines.push('> - Local copy/export only — no email, no upload, no platform posting, no ad spend, no live analytics.');
  lines.push('> - Usage rights must be verified before any external publication.');
  lines.push('');

  // ── Campaign overview ──
  lines.push('## Campaign Overview');
  lines.push(`- **Client:** ${client?.name ?? 'Unassigned client'}`);
  lines.push(`- **Brand:** ${brand?.name ?? 'Unassigned brand'}`);
  lines.push(`- **Campaign:** ${campaign.name}`);
  lines.push(`- **Status:** ${campaign.status}`);
  if (typeof campaign.duration_days === 'number') {
    lines.push(`- **Duration:** ${campaign.duration_days} day${campaign.duration_days === 1 ? '' : 's'}`);
  }
  lines.push(`- **Approved deliverables in pack:** ${items.length}`);
  const breakdown = campaignModuleBreakdown(items);
  if (breakdown.length) {
    lines.push(`- **Modules included:** ${breakdown.map(b => `${b.label} (${b.count})`).join(', ')}`);
  }
  lines.push('');

  // ── Brand context cover (Brand Brain snapshot, internal/draft-only) ──
  if (snapshot) {
    lines.push('---');
    lines.push('## Brand Context');
    lines.push('_Internal brand grounding used for this campaign — draft-only context, not live publishing data._');
    lines.push('');
    if (snapshot.positioning) lines.push(`- **Positioning:** ${snapshot.positioning}`);
    listLine(lines, 'Target customers', snapshot.target_customers);
    listLine(lines, 'Brand voice / tone', snapshot.brand_voice);
    listLine(lines, 'Content pillars', snapshot.content_pillars);
    listLine(lines, 'Key messages', snapshot.key_messages);
    listLine(lines, 'Creative do', snapshot.creative_dos);
    listLine(lines, "Creative don't", snapshot.creative_donts);
    listLine(lines, 'Claim / compliance notes', snapshot.claim_compliance_notes);
    listLine(lines, 'Channels', snapshot.channels);
    lines.push('');
  }

  if (items.length === 0) {
    lines.push('---');
    lines.push('_(No approved deliverables selected for this campaign. Approve outputs in the Approval Queue, then select them here.)_');
    lines.push('');
    return finalize(scopeTitle, format, lines, 0, now);
  }

  // ── Deliverables grouped by module section ──
  for (const module of HANDOFF_MODULE_ORDER) {
    const inModule = items.filter(c => c.module === module);
    if (inModule.length === 0) continue;

    lines.push('---');
    lines.push(`## ${HANDOFF_MODULE_SECTION[module]}`);
    if (module === 'report') {
      lines.push('_Data labels (Provided / Simulated / Missing / Owner input required) are carried verbatim from each report draft. No metrics are invented._');
    }
    lines.push('');

    const labels = moduleFieldLabels(module);
    let n = 0;
    for (const c of inModule) {
      n += 1;
      lines.push(`### ${module === 'content' ? 'Item' : c.moduleLabel} ${n} — ${c.title}`);
      lines.push(`- **Module:** ${c.moduleLabel}`);
      lines.push(`- **Approval status:** Approved`);
      if (c.provenance) {
        lines.push(`- **Approved by:** ${c.provenance.actorLabel} · ${dateTimeLabel(c.provenance.at)}`);
      }
      lines.push(`- **Manual delivery:** ${MANUAL_DELIVERY_LABEL[c.deliveryStatus]}`);
      if (c.deliveryStatus === 'manually_posted') {
        lines.push(`- ${CAMPAIGN_PACK_MANUALLY_POSTED_NOTE}`);
      }
      lines.push('');

      const item = c.item;
      if (item) {
        const body = splitCaption(item.caption).body;
        if (body) {
          lines.push(`**${labels.body}:**`);
          lines.push(body);
          lines.push('');
        }
        if (item.hook?.trim())         lines.push(`- **${labels.headline}:** ${item.hook.trim()}`);
        if (item.visual_brief?.trim()) lines.push(`- **${labels.visual}:** ${item.visual_brief.trim()}`);
        if (item.cta?.trim())          lines.push(`- **${labels.cta}:** ${item.cta.trim()}`);
        if (item.hashtags?.trim())     lines.push(`- **Hashtags:** ${item.hashtags.trim()}`);
      } else {
        lines.push('_(Source content item not found in the current workspace — title only.)_');
      }
      lines.push('');
    }
  }

  // ── Delivery notes ──
  const withNotes = items.filter(c => (c.deliveryNote && c.deliveryNote.trim()) || c.deliveryStatus !== 'not_delivered');
  if (withNotes.length) {
    lines.push('---');
    lines.push('## Delivery Notes');
    for (const c of withNotes) {
      const bits = [`**${c.title}** — ${MANUAL_DELIVERY_LABEL[c.deliveryStatus]}`];
      if (c.deliveryNote?.trim()) bits.push(`note: ${c.deliveryNote.trim()}`);
      // A reference link is shown only when it is a plain http/https URL; Core never opens or fetches it.
      if (c.deliveryLink && isSafeHttpLink(c.deliveryLink)) bits.push(`reference: ${c.deliveryLink.trim()}`);
      lines.push(`- ${bits.join(' · ')}`);
    }
    lines.push('');
  }

  // ── Closing safety reminder ──
  lines.push('---');
  lines.push(`> **${CAMPAIGN_PACK_APPROVED_NOT_PUBLISHED}**`);
  lines.push(`> ${CAMPAIGN_PACK_SAFETY_NOTE}`);
  lines.push(`> ${APPROVED_NOT_PUBLISHED_REMINDER}`);
  lines.push('');

  return finalize(scopeTitle, format, lines, items.length, now);
}

function finalize(title: string, format: CampaignPackFormat, lines: string[], itemCount: number, now: Date): CampaignPack {
  const markdown = lines.join('\n');
  return {
    title,
    format,
    content: format === 'plain_text' ? toPlainText(markdown) : markdown,
    itemCount,
    createdAt: now.toISOString(),
  };
}

/** Safe filename stem for a downloaded pack (no path/separators). */
export function campaignPackFileStem(title: string, now: Date = new Date()): string {
  const slug = (title || 'campaign-pack')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'campaign-pack';
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `${slug}-${stamp}`;
}
