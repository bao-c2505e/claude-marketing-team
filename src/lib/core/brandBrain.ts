// Brand Brain — shared internal data contract & source of truth (Phase M)
// ---------------------------------------------------------------------------
// A single, PURE, LOCAL normalizer that assembles one brand's full marketing
// context (the "Brand Brain") from data already in CORE's local state —
// `Client`, `Brand`, `Campaign`, `CampaignBrief`, and `AssetItem`. It exists so
// every surface (Brand Brain UI, Campaign Workspace, AI Factory framing,
// Approval Queue, Asset Library, Report Drafts) can read ONE normalized shape
// instead of each re-deriving brand context from raw records.
//
// SAFETY (CLAUDE.md §3/§4/§6/§7):
//   • pure + read-only — no fetch / axios / network / OAuth / webhook / URL,
//   • no persistence, no Supabase, no external storage, no live sync,
//   • derives drafts/context only; the AI ceiling stays `pending_approval`,
//   • `published` / `launched` are never set here,
//   • every assembled brain is flagged `source: 'internal'` + draft-only and
//     carries standing approval-first safety notes (Approved ≠ Published).
// ---------------------------------------------------------------------------
import type {
  Client,
  Brand,
  Campaign,
  CampaignBrief,
  AssetItem,
  AssetType,
  AssetApprovalStatus,
} from '../../types/core';

// ── Contract types ─────────────────────────────────────────────────────────

/** Internal review lifecycle for a brand's context (never an external state). */
export type BrandBrainStatus = 'draft' | 'needs_review' | 'approved_internal' | 'archived';

/** Provenance of the assembled context — always internal/local for now. */
export type BrandBrainSource = 'internal' | 'mock' | 'demo' | 'draft-only';

export interface BrandBrainAssetRef {
  id: string;
  name: string;
  assetType: AssetType;
  approvalStatus: AssetApprovalStatus;
}

export interface BrandBrainCampaignContext {
  id: string;
  name: string;
  status: string;
  durationDays: number;
  goal: string | null;
}

/** The normalized, single-source Brand Brain contract. */
export interface BrandBrain {
  brandId: string;
  clientId: string | null;
  brandName: string;
  clientName: string | null;
  contactName: string | null;
  category: string | null;
  positioning: string | null;
  targetCustomers: string[];
  products: string[];
  offers: string[];
  brandVoice: string[];
  contentPillars: string[];
  keyMessages: string[];
  creativeDos: string[];
  creativeDonts: string[];
  claimComplianceNotes: string[];
  campaignContext: BrandBrainCampaignContext[];
  ownerNotes: string[];
  channels: string[];
  brandColors: [string, string][];
  assetReferences: BrandBrainAssetRef[];
  assetStatusCounts: Record<string, number>;
  approvalSafetyNotes: string[];
  source: BrandBrainSource;
  status: BrandBrainStatus;
  updatedAt: string | null;
  lastReviewedAt: string | null;
}

// ── Standing safety notes (approval-first, pinned by tests) ─────────────────

export const BRAND_BRAIN_SAFETY_NOTES: string[] = [
  'Brand context is internal only — drafts and references, not published content.',
  'Approved ≠ Published — Owner approval authorizes internal use only.',
  'Nothing is posted automatically; live connectors are blocked.',
  'No fabricated metrics — every price, claim, or statistic must be Owner-confirmed.',
];

// ── Display helpers ─────────────────────────────────────────────────────────

export const BRAND_BRAIN_STATUS_LABEL: Record<BrandBrainStatus, string> = {
  draft:             'Draft',
  needs_review:      'Needs Review',
  approved_internal: 'Approved (internal)',
  archived:          'Archived',
};

export const BRAND_BRAIN_STATUS_COLOR: Record<BrandBrainStatus, string> = {
  draft:             '#94a3b8',
  needs_review:      '#f59e0b',
  approved_internal: '#34d399',
  archived:          '#71717a',
};

export const BRAND_BRAIN_SOURCE_LABEL: Record<BrandBrainSource, string> = {
  internal:     'Internal',
  mock:         'Mock',
  demo:         'Demo',
  'draft-only': 'Draft-only',
};

// ── Completeness model ──────────────────────────────────────────────────────

export interface BrandBrainFieldDef {
  key: string;
  label: string;
}

/** The context fields scored for completeness, in display order. */
export const BRAND_BRAIN_CONTEXT_FIELDS: BrandBrainFieldDef[] = [
  { key: 'positioning',          label: 'Positioning' },
  { key: 'targetCustomers',      label: 'Target Customers' },
  { key: 'products',             label: 'Products / Services / Menu / Offers' },
  { key: 'brandVoice',           label: 'Brand Voice / Tone' },
  { key: 'contentPillars',       label: 'Content Pillars' },
  { key: 'creativeDos',          label: 'Creative Do' },
  { key: 'creativeDonts',        label: "Creative Don't" },
  { key: 'claimComplianceNotes', label: 'Claim / Compliance Notes' },
  { key: 'campaignContext',      label: 'Campaign Context' },
  { key: 'ownerNotes',           label: 'Owner Notes' },
];

export interface BrandBrainCompleteness {
  total: number;
  present: number;
  percent: number;
  missing: string[];
  presentKeys: string[];
}

/** True when a scored field carries usable context. */
function fieldIsPresent(brain: BrandBrain, key: string): boolean {
  switch (key) {
    case 'positioning':          return !!(brain.positioning && brain.positioning.trim());
    case 'targetCustomers':      return brain.targetCustomers.length > 0;
    case 'products':             return brain.products.length > 0 || brain.offers.length > 0;
    case 'brandVoice':           return brain.brandVoice.length > 0;
    case 'contentPillars':       return brain.contentPillars.length > 0;
    case 'creativeDos':          return brain.creativeDos.length > 0;
    case 'creativeDonts':        return brain.creativeDonts.length > 0;
    case 'claimComplianceNotes': return brain.claimComplianceNotes.length > 0;
    case 'campaignContext':      return brain.campaignContext.length > 0;
    case 'ownerNotes':           return brain.ownerNotes.length > 0;
    default:                     return false;
  }
}

/** Score a Brand Brain's context completeness and list missing fields. */
export function assessBrandBrainCompleteness(brain: BrandBrain): BrandBrainCompleteness {
  const presentKeys: string[] = [];
  const missing: string[] = [];
  for (const f of BRAND_BRAIN_CONTEXT_FIELDS) {
    if (fieldIsPresent(brain, f.key)) presentKeys.push(f.key);
    else missing.push(f.label);
  }
  const total = BRAND_BRAIN_CONTEXT_FIELDS.length;
  const present = presentKeys.length;
  return {
    total,
    present,
    percent: total === 0 ? 0 : Math.round((present / total) * 100),
    missing,
    presentKeys,
  };
}

// ── Builder ─────────────────────────────────────────────────────────────────

/** Deduplicating, whitespace-trimming union of optional strings. */
function uniq(values: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const t = (v ?? '').trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, it) => {
    const k = key(it);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

/** Derive the internal review status from the brand's primary brief. */
function deriveStatus(primaryBrief: CampaignBrief | null): BrandBrainStatus {
  const s = primaryBrief?.status ?? null;
  switch (s) {
    case 'approved_for_generation': return 'approved_internal';
    case 'ready_for_generation':    return 'needs_review';
    case 'needs_revision':          return 'needs_review';
    case 'archived':                return 'archived';
    default:                        return 'draft';
  }
}

export interface BuildBrandBrainInput {
  brand: Brand;
  client: Client | null;
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  assets: AssetItem[];
}

/**
 * Assemble ONE brand's normalized Brand Brain from local records. List fields
 * are unioned across every brief so a multi-campaign brand loses nothing. Pure,
 * read-only — no network, no persistence, no mutation of the inputs.
 */
export function buildBrandBrain({ brand, client, campaigns, briefs, assets }: BuildBrandBrainInput): BrandBrain {
  const primaryBrief = briefs[0] ?? null;

  const positioning = uniq([brand.industry, brand.hero_product]).join(' · ') || null;

  const campaignContext: BrandBrainCampaignContext[] = campaigns.map(c => ({
    id: c.id,
    name: c.name,
    status: c.status,
    durationDays: c.duration_days,
    goal: briefs.find(b => b.campaign_id === c.id)?.campaign_goal ?? null,
  }));

  const assetReferences: BrandBrainAssetRef[] = assets.map(a => ({
    id: a.id,
    name: a.name,
    assetType: a.asset_type,
    approvalStatus: a.approval_status,
  }));

  return {
    brandId: brand.id,
    clientId: brand.client_id ?? null,
    brandName: brand.name,
    clientName: client?.name ?? null,
    contactName: client?.contact_name ?? null,
    category: brand.industry,
    positioning,
    targetCustomers: uniq([brand.target_audience, ...briefs.map(b => b.target_audience)]),
    products: uniq([brand.hero_product, ...briefs.map(b => b.product_focus)]),
    offers: uniq(briefs.map(b => b.offer)),
    brandVoice: uniq([brand.tone_of_voice, ...briefs.map(b => b.tone_of_voice)]),
    contentPillars: uniq(briefs.flatMap(b => b.content_pillars ?? [])),
    keyMessages: uniq(briefs.flatMap(b => b.key_messages ?? [])),
    creativeDos: uniq(briefs.map(b => b.must_include)),
    creativeDonts: uniq(briefs.map(b => b.must_avoid)),
    claimComplianceNotes: uniq(briefs.map(b => b.approval_requirements)),
    campaignContext,
    ownerNotes: uniq([client?.notes, ...briefs.map(b => b.additional_notes)]),
    channels: uniq([...(brand.primary_channels ?? []), ...briefs.flatMap(b => b.channels ?? [])]),
    brandColors: brand.brand_colors ? Object.entries(brand.brand_colors) : [],
    assetReferences,
    assetStatusCounts: countBy(assets, a => a.approval_status),
    approvalSafetyNotes: [...BRAND_BRAIN_SAFETY_NOTES],
    // Seed/local context is internal & draft-only — never claimed as live/published.
    source: 'internal',
    status: deriveStatus(primaryBrief),
    updatedAt: brand.updated_at ?? null,
    lastReviewedAt: primaryBrief?.submitted_at ?? null,
  };
}

export interface BrandBrainOptionInput {
  brand: Brand;
  client: Client | null;
  firstCampaignStatus: string | null;
}

export interface BrandBrainOption {
  id: string;
  name: string;
  clientName: string;
  industry: string | null;
  status: string;
}

/** Build a lightweight picker option for one brand (used by the selector UI). */
export function buildBrandBrainOption({ brand, client, firstCampaignStatus }: BrandBrainOptionInput): BrandBrainOption {
  return {
    id: brand.id,
    name: brand.name,
    clientName: client?.name ?? '—',
    industry: brand.industry,
    status: firstCampaignStatus ?? brand.status,
  };
}

// ── AI Factory brand context snapshot (Phase N) ─────────────────────────────
// A compact, SAFE projection of a BrandBrain for AI Factory request framing and
// preview surfaces. It is purely additive: every factory payload (Content /
// Design / Video / Ads / Report) may carry one so each draft is grounded in the
// SAME normalized brand context instead of re-deriving it per module. It is
// draft-only and approval-gated by construction — it can never represent a
// `published`/`launched` state and never carries a URL, token, or live call.

/** Standing reminder pinned into every snapshot (and asserted by tests). */
export const APPROVED_NOT_PUBLISHED_REMINDER =
  'Approved ≠ Published — Owner approval authorizes internal use only; publishing or launching is a separate, human-confirmed step.';

/** Max items kept per list so the snapshot stays compact in request framing. */
const SNAPSHOT_LIST_CAP = 8;

export interface BrandContextSnapshotCampaign {
  id: string;
  name: string;
  status: string;
  goal: string | null;
}

/** Compact, draft-only brand context shared across every AI Factory module. */
export interface BrandContextSnapshot {
  brand_identity: {
    brand_name: string;
    client_name: string | null;
    contact_name: string | null;
    category: string | null;
  };
  positioning: string | null;
  target_customers: string[];
  products_offers: string[];
  brand_voice: string[];
  content_pillars: string[];
  key_messages: string[];
  creative_dos: string[];
  creative_donts: string[];
  claim_compliance_notes: string[];
  campaign_context: BrandContextSnapshotCampaign[];
  owner_notes: string[];
  channels: string[];
  safety_notes: string[];
  // Provenance + lifecycle — internal/draft-only by construction.
  source: BrandBrainSource;      // 'internal' | 'mock' | 'demo' | 'draft-only'
  status: BrandBrainStatus;      // internal review status (never an external state)
  draft_only: true;
  internal_only: true;
  owner_approval_required: true;
  approved_not_published: string;
}

function capList(values: string[]): string[] {
  return values.slice(0, SNAPSHOT_LIST_CAP);
}

/** Project a full Brand Brain into the compact, draft-only AI Factory snapshot. */
export function buildBrandContextSnapshot(brain: BrandBrain): BrandContextSnapshot {
  return {
    brand_identity: {
      brand_name: brain.brandName,
      client_name: brain.clientName,
      contact_name: brain.contactName,
      category: brain.category,
    },
    positioning: brain.positioning,
    target_customers: capList(brain.targetCustomers),
    products_offers: capList([...brain.products, ...brain.offers]),
    brand_voice: capList(brain.brandVoice),
    content_pillars: capList(brain.contentPillars),
    key_messages: capList(brain.keyMessages),
    creative_dos: capList(brain.creativeDos),
    creative_donts: capList(brain.creativeDonts),
    claim_compliance_notes: capList(brain.claimComplianceNotes),
    campaign_context: brain.campaignContext.slice(0, SNAPSHOT_LIST_CAP).map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      goal: c.goal,
    })),
    owner_notes: capList(brain.ownerNotes),
    channels: capList(brain.channels),
    safety_notes: [...brain.approvalSafetyNotes],
    // Brand context is internal/local — never claimed as live/published.
    source: brain.source,
    status: brain.status,
    draft_only: true,
    internal_only: true,
    owner_approval_required: true,
    approved_not_published: APPROVED_NOT_PUBLISHED_REMINDER,
  };
}

export interface AiFactoryBrandContextInput {
  brand: Brand;
  client: Client | null;
  campaign: Campaign | null;
  brief: CampaignBrief | null;
  assets?: AssetItem[];
}

/**
 * Convenience builder for the single-record shape AI Factory modules hold (one
 * brand / campaign / brief). It wraps the records into the array-based
 * `buildBrandBrain` and snapshots the result, so every factory shares ONE source
 * of brand context. Takes raw records (not a factory type) to keep this module
 * free of any factory import — no circular dependency, still pure & read-only.
 */
export function buildAiFactoryBrandContext(input: AiFactoryBrandContextInput): BrandContextSnapshot {
  const brain = buildBrandBrain({
    brand: input.brand,
    client: input.client,
    campaigns: input.campaign ? [input.campaign] : [],
    briefs: input.brief ? [input.brief] : [],
    assets: input.assets ?? [],
  });
  return buildBrandContextSnapshot(brain);
}
