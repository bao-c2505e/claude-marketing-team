// ---------------------------------------------------------------------------
// Client Handoff Pack (Phase F) — internal, local, copy/export only
//
// A SAFE internal builder so the Owner/staff can gather APPROVED outputs into a
// client-facing delivery pack for copy / export / review. It is NOT automation:
//
//   • Core never publishes, schedules, launches, or spends.
//   • The pack is built ONLY from APPROVED approval requests already in Core.
//   • Building a pack does NOT change any approval state, never calls an external
//     service, never sends email, never posts to a platform, never pulls live
//     analytics, and never invents metrics.
//   • "Manually posted" means a human did it OUTSIDE Core — the pack only echoes
//     the manual-delivery note recorded in Phase E.
//
// Everything here is PURE + READ-ONLY: it reads existing Core data
// (clients/brands/campaigns, content items, approval requests) plus the Phase E
// manual-delivery map, and returns plain strings/objects. No localStorage write,
// no DB, no network. This keeps it trivially unit-testable and side-effect free.
// ---------------------------------------------------------------------------

import type {
  Client,
  Brand,
  Campaign,
  ContentPlanItem,
  ContentApprovalRequest,
  ContentApprovalStatus,
} from '../../types/core';
import {
  classifyRequest,
  splitCaption,
  moduleFieldLabels,
  MODULE_META,
  type ModuleKey,
} from './approvalClassify';
import {
  MANUAL_DELIVERY_LABEL,
  DEFAULT_MANUAL_DELIVERY_STATUS,
  isSafeHttpLink,
  type ManualDeliveryMap,
  type ManualDeliveryStatus,
} from './manualDelivery';

// ---------------------------------------------------------------------------
// Safety copy — the verbatim strings every handoff pack MUST carry. Kept as
// exported constants so the UI and the safety-regression test reference the same
// source of truth.
// ---------------------------------------------------------------------------

/** F2 — pack-level safety note. */
export const HANDOFF_SAFETY_NOTE =
  'This is an internal handoff pack. Core did not publish, launch, schedule, or spend.';

/** F5 — Approved ≠ Published line, on every pack. */
export const HANDOFF_APPROVED_NOT_PUBLISHED =
  'Approved for handoff. Not published, scheduled, launched, or spent by Core.';

/** F5 — per-item label when an item was manually posted outside Core. */
export const HANDOFF_MANUALLY_POSTED_NOTE =
  'Marked as manually posted outside Core by Owner/staff.';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HandoffFormat = 'markdown' | 'plain_text';

export const HANDOFF_FORMAT_LABEL: Record<HandoffFormat, string> = {
  markdown: 'Markdown',
  plain_text: 'Plain Text',
};

/** Deterministic module ordering for sections and sorting. */
export const HANDOFF_MODULE_ORDER: ModuleKey[] = ['content', 'design', 'video', 'ads', 'report', 'other'];

/** Section title for each module inside the pack (client-facing). */
export const HANDOFF_MODULE_SECTION: Record<ModuleKey, string> = {
  content: 'Approved Content Items',
  design: 'Design Briefs',
  video: 'Video Scripts',
  ads: 'Ads Drafts',
  report: 'Report Drafts',
  other: 'Other Outputs',
};

/** One approved output, joined + resolved, ready to show and select. */
export interface HandoffCandidate {
  /** Approval request id (also the manual-delivery map key). */
  approvalId: string;
  contentItemId: string;
  title: string;
  module: ModuleKey;
  moduleLabel: string;
  clientId: string | null;
  brandId: string | null;
  campaignId: string;
  clientName: string;
  brandName: string;
  campaignName: string;
  approvalStatus: ContentApprovalStatus;
  deliveryStatus: ManualDeliveryStatus;
  deliveryNote?: string;
  deliveryLink?: string;
  /** Joined content item (when found) — source of the human-readable body. */
  item?: ContentPlanItem;
  resolvedAt: string | null;
}

export interface HandoffGroup {
  key: string;
  clientName: string;
  brandName: string;
  campaignName: string;
  items: HandoffCandidate[];
}

export interface HandoffScope {
  clientId?: string | null;
  brandId?: string | null;
  campaignId?: string | null;
  /** Restrict to a single module/type, or null/undefined for all. */
  module?: ModuleKey | null;
}

export interface CollectParams {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  contentItems: ContentPlanItem[];
  approvalRequests: ContentApprovalRequest[];
  deliveryMap: ManualDeliveryMap;
  scope?: HandoffScope;
}

export interface BuildHandoffParams {
  candidates: HandoffCandidate[];
  title: string;
  format: HandoffFormat;
  generatedBy: string;
  /** Render date label; injectable for deterministic tests. */
  now?: Date;
}

export interface HandoffPack {
  title: string;
  format: HandoffFormat;
  content: string;
  itemCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Collect — turn APPROVED approval requests into resolved handoff candidates.
//
// Only requests whose status is exactly `approved` become candidates. This keeps
// the handoff pack honest: nothing pending / rejected / revision-requested can be
// handed off, and "Approved ≠ Published" stays clear because every candidate is
// an approved DRAFT, never a published post.
// ---------------------------------------------------------------------------

export function collectHandoffCandidates(params: CollectParams): HandoffCandidate[] {
  const { clients, brands, campaigns, contentItems, approvalRequests, deliveryMap, scope } = params;

  const itemById = new Map(contentItems.map(i => [i.id, i]));
  const clientById = new Map(clients.map(c => [c.id, c]));
  const brandById = new Map(brands.map(b => [b.id, b]));
  const campaignById = new Map(campaigns.map(c => [c.id, c]));

  const out: HandoffCandidate[] = [];

  for (const req of approvalRequests) {
    if (req.status !== 'approved') continue;

    const item = itemById.get(req.content_item_id);
    const { module } = classifyRequest(item);

    // Resolve identity, preferring the request's own scope ids, then the joined item.
    const clientId = req.client_id ?? item?.client_id ?? null;
    const brandId = req.brand_id ?? item?.brand_id ?? null;
    const campaignId = req.campaign_id ?? item?.campaign_id ?? '';

    const delivery = deliveryMap[req.id];

    const candidate: HandoffCandidate = {
      approvalId: req.id,
      contentItemId: req.content_item_id,
      title: req.title || item?.hook || 'Untitled output',
      module,
      moduleLabel: MODULE_META[module].label,
      clientId,
      brandId,
      campaignId,
      clientName: (clientId && clientById.get(clientId)?.name) || 'Unassigned client',
      brandName: (brandId && brandById.get(brandId)?.name) || 'Unassigned brand',
      campaignName: (campaignId && campaignById.get(campaignId)?.name) || 'Unassigned campaign',
      approvalStatus: req.status,
      deliveryStatus: delivery?.status ?? DEFAULT_MANUAL_DELIVERY_STATUS,
      deliveryNote: delivery?.note,
      deliveryLink: delivery?.link,
      item,
      resolvedAt: req.resolved_at,
    };

    // Scope filter (all optional).
    if (scope?.clientId && candidate.clientId !== scope.clientId) continue;
    if (scope?.brandId && candidate.brandId !== scope.brandId) continue;
    if (scope?.campaignId && candidate.campaignId !== scope.campaignId) continue;
    if (scope?.module && candidate.module !== scope.module) continue;

    out.push(candidate);
  }

  // Stable order: campaign, then module order, then resolved/created.
  out.sort((a, b) => {
    if (a.campaignName !== b.campaignName) return a.campaignName.localeCompare(b.campaignName);
    const ma = HANDOFF_MODULE_ORDER.indexOf(a.module);
    const mb = HANDOFF_MODULE_ORDER.indexOf(b.module);
    if (ma !== mb) return ma - mb;
    return (a.resolvedAt ?? '').localeCompare(b.resolvedAt ?? '');
  });

  return out;
}

// ---------------------------------------------------------------------------
// Group — client → brand → campaign (module is sorted within each group and
// shown per-item). Satisfies F1's "grouped by Client / Brand / Campaign /
// Module" with module surfaced as a per-row label.
// ---------------------------------------------------------------------------

export function groupHandoffCandidates(candidates: HandoffCandidate[]): HandoffGroup[] {
  const groups = new Map<string, HandoffGroup>();
  for (const c of candidates) {
    const key = `${c.clientId ?? '-'}::${c.brandId ?? '-'}::${c.campaignId || '-'}`;
    let g = groups.get(key);
    if (!g) {
      g = { key, clientName: c.clientName, brandName: c.brandName, campaignName: c.campaignName, items: [] };
      groups.set(key, g);
    }
    g.items.push(c);
  }
  return [...groups.values()].sort((a, b) =>
    a.clientName.localeCompare(b.clientName) ||
    a.brandName.localeCompare(b.brandName) ||
    a.campaignName.localeCompare(b.campaignName),
  );
}

/** Count selected candidates per module — for the overview line. */
export function moduleBreakdown(candidates: HandoffCandidate[]): Array<{ module: ModuleKey; label: string; count: number }> {
  const counts = new Map<ModuleKey, number>();
  for (const c of candidates) counts.set(c.module, (counts.get(c.module) ?? 0) + 1);
  return HANDOFF_MODULE_ORDER
    .filter(m => counts.has(m))
    .map(m => ({ module: m, label: MODULE_META[m].label, count: counts.get(m) ?? 0 }));
}

// ---------------------------------------------------------------------------
// Build — render the selected candidates into a client-safe Markdown document.
// ---------------------------------------------------------------------------

function dateLabel(now: Date): string {
  return now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function uniqueScopeLabel(values: string[]): string {
  const set = [...new Set(values)];
  if (set.length === 0) return '—';
  if (set.length === 1) return set[0];
  return `Multiple (${set.length})`;
}

export function buildHandoffPack(params: BuildHandoffParams): HandoffPack {
  const { candidates, title, format, generatedBy } = params;
  const now = params.now ?? new Date();

  const scopeTitle = (title || '').trim() || 'Client Handoff Pack';

  const clientLabel = uniqueScopeLabel(candidates.map(c => c.clientName));
  const brandLabel = uniqueScopeLabel(candidates.map(c => c.brandName));
  const campaignLabel = uniqueScopeLabel(candidates.map(c => c.campaignName));

  const lines: string[] = [];

  // ── Header ──
  lines.push(`# CLIENT HANDOFF PACK — ${scopeTitle}`);
  lines.push(`Prepared by The Core Agency${generatedBy ? ` · ${generatedBy}` : ''} — ${dateLabel(now)}`);
  lines.push('');

  // ── Safety block (F2 + F5) ──
  lines.push('> **⚠️ INTERNAL HANDOFF PACK — SAFETY NOTICE**');
  lines.push(`> - ${HANDOFF_SAFETY_NOTE}`);
  lines.push(`> - ${HANDOFF_APPROVED_NOT_PUBLISHED}`);
  lines.push('> - Local copy/export only — no email, no upload, no platform posting, no ad spend, no live analytics.');
  lines.push('> - Usage rights must be verified before any external publication.');
  lines.push('');

  // ── Overview (F4) ──
  lines.push('## Campaign Overview');
  lines.push(`- **Client:** ${clientLabel}`);
  lines.push(`- **Brand:** ${brandLabel}`);
  lines.push(`- **Campaign:** ${campaignLabel}`);
  lines.push(`- **Approved items in pack:** ${candidates.length}`);
  const breakdown = moduleBreakdown(candidates);
  if (breakdown.length) {
    lines.push(`- **Modules included:** ${breakdown.map(b => `${b.label} (${b.count})`).join(', ')}`);
  }
  lines.push('');

  if (candidates.length === 0) {
    lines.push('_(No approved items selected. Approve outputs in the Approval Queue, then select them here.)_');
    lines.push('');
    return finalize(scopeTitle, format, lines, 0, now);
  }

  // ── Items grouped by module section (F4) ──
  for (const module of HANDOFF_MODULE_ORDER) {
    const inModule = candidates.filter(c => c.module === module);
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
      lines.push(`- **Manual delivery:** ${MANUAL_DELIVERY_LABEL[c.deliveryStatus]}`);
      if (c.deliveryStatus === 'manually_posted') {
        lines.push(`- ${HANDOFF_MANUALLY_POSTED_NOTE}`);
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

  // ── Delivery notes (F4) ──
  const withNotes = candidates.filter(c => (c.deliveryNote && c.deliveryNote.trim()) || c.deliveryStatus !== 'not_delivered');
  lines.push('---');
  lines.push('## Delivery Notes');
  if (withNotes.length === 0) {
    lines.push('_No manual delivery recorded yet. Core does not auto-post or launch — delivery is a manual action recorded by the Owner/staff._');
  } else {
    for (const c of withNotes) {
      const bits = [`**${c.title}** — ${MANUAL_DELIVERY_LABEL[c.deliveryStatus]}`];
      if (c.deliveryNote?.trim()) bits.push(`note: ${c.deliveryNote.trim()}`);
      // A reference link is shown only when it is a plain http/https URL; Core never opens or fetches it.
      if (c.deliveryLink && isSafeHttpLink(c.deliveryLink)) bits.push(`reference: ${c.deliveryLink.trim()}`);
      lines.push(`- ${bits.join(' · ')}`);
    }
  }
  lines.push('');

  // ── Closing safety reminder (F5) ──
  lines.push('---');
  lines.push(`> **${HANDOFF_APPROVED_NOT_PUBLISHED}**`);
  lines.push(`> ${HANDOFF_SAFETY_NOTE}`);
  lines.push('');

  return finalize(scopeTitle, format, lines, candidates.length, now);
}

function finalize(title: string, format: HandoffFormat, lines: string[], itemCount: number, now: Date): HandoffPack {
  const markdown = lines.join('\n');
  return {
    title,
    format,
    content: format === 'plain_text' ? toPlainText(markdown) : markdown,
    itemCount,
    createdAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Format conversion — Markdown → plain text (strip markdown syntax). Mirrors the
// Export Pack converter so the two surfaces behave consistently.
// ---------------------------------------------------------------------------

export function toPlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^>\s?/gm, '  ')
    .replace(/^-\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

/** Safe filename stem for a downloaded pack (no path/separators). */
export function handoffFileStem(title: string, now: Date = new Date()): string {
  const slug = (title || 'client-handoff-pack')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) || 'client-handoff-pack';
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `${slug}-${stamp}`;
}
