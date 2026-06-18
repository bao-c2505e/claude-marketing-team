// ---------------------------------------------------------------------------
// Approval item classification + preview helpers (display only)
//
// Every AI Factory V1 module (Content / Design / Video / Ads / Report) appends a
// metadata block to the content item's caption — `workflow_type`, `content_type`,
// `status`, `owner_approval_required`, `source`, `generation_mode`, `generated_by`
// and a `safety:` flag line — and sets a clean structured `content_type`. We read
// those signals to label and lay out each approval item for review.
//
// IMPORTANT: everything here is READ-ONLY. These helpers never mutate a record,
// never change approval semantics, and never invent data — they only describe
// what a draft already carries so the Approval Queue can render it well.
//
// Extracted from ApprovalsTab.tsx (Phase A2) in Phase D so the Command Center and
// future surfaces can reuse the same classification and so it can be unit-tested.
// ---------------------------------------------------------------------------

import type { ContentPlanItem } from '../../types/core';

export type ModuleKey = 'content' | 'design' | 'video' | 'ads' | 'report' | 'other';
export type SourceKey = 'n8n' | 'local' | 'legacy';

export interface RequestClass {
  module: ModuleKey;
  source: SourceKey;
}

export interface ModuleMeta {
  /** Short module name, e.g. "Content Factory". */
  label: string;
  /** Module-aware detail preview header, e.g. "Content Preview" (D1). */
  previewLabel: string;
  /** Canonical structured content_type for this module. */
  contentType: string;
  /** Badge / accent color. */
  color: string;
  /** One-line per-module safety note. */
  safety: string;
}

export const MODULE_META: Record<ModuleKey, ModuleMeta> = {
  content: { label: 'Content Factory', previewLabel: 'Content Preview',       contentType: 'content_pack', color: '#60a5fa', safety: 'Draft only — no auto-post.' },
  design:  { label: 'Design Factory',  previewLabel: 'Design Brief Preview',  contentType: 'design_brief', color: '#a78bfa', safety: 'Brief / spec only — no image generation.' },
  video:   { label: 'Video Scripts',   previewLabel: 'Video Script Preview',  contentType: 'video_script', color: '#f472b6', safety: 'Script / spec only — no video generation.' },
  ads:     { label: 'Ads Pack Draft',  previewLabel: 'Ads Draft Preview',     contentType: 'ads_draft',    color: '#fb923c', safety: 'Draft / spec only — no auto-ads, no spend.' },
  report:  { label: 'Report Draft',    previewLabel: 'Report Draft Preview',  contentType: 'report_draft', color: '#34d399', safety: 'Draft only — no live analytics pull, no unverified metrics.' },
  other:   { label: 'Other / Legacy',  previewLabel: 'Output Preview',        contentType: 'other',        color: '#94a3b8', safety: 'Draft only — review before any use.' },
};

export const SOURCE_META: Record<SourceKey, { label: string; color: string }> = {
  n8n:    { label: 'n8n AI Provider', color: '#34d399' },
  local:  { label: 'Local demo',      color: '#f59e0b' },
  legacy: { label: 'Legacy / mock',   color: '#94a3b8' },
};

const WORKFLOW_TO_MODULE: Record<string, ModuleKey> = {
  content_pack:   'content',
  design_factory: 'design',
  video_scripts:  'video',
  ads_pack:       'ads',
  report_draft:   'report',
};

const CONTENT_TYPE_TO_MODULE: Record<string, ModuleKey> = {
  content_pack: 'content',
  caption:      'content',
  design_brief: 'design',
  video_script: 'video',
  ads_draft:    'ads',
  report_draft: 'report',
};

/** Read a single `key: value` line out of a caption metadata block. */
export function readMetaLine(caption: string, key: string): string | undefined {
  const m = caption.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : undefined;
}

/**
 * Classify an approval item into a module + source for badges, filters, and
 * layout. Prefers the explicit `workflow_type` tag, then the structured
 * `content_type` field, else treats the item as legacy/other. Source is `n8n`
 * when the metadata says so, `local` when it carries any V1 factory metadata but
 * ran in fallback, and `legacy` for old demo seed data with no metadata.
 */
export function classifyRequest(item: ContentPlanItem | undefined): RequestClass {
  const caption = item?.caption ?? '';
  const workflowType = readMetaLine(caption, 'workflow_type');
  const generationMode = readMetaLine(caption, 'generation_mode');
  const metaSource = readMetaLine(caption, 'source');

  let module: ModuleKey = 'other';
  if (workflowType && WORKFLOW_TO_MODULE[workflowType]) {
    module = WORKFLOW_TO_MODULE[workflowType];
  } else if (item?.content_type && CONTENT_TYPE_TO_MODULE[item.content_type]) {
    module = CONTENT_TYPE_TO_MODULE[item.content_type];
  }

  let source: SourceKey;
  if (generationMode === 'external_module' || metaSource === 'n8n') {
    source = 'n8n';
  } else if (workflowType || generationMode === 'mock' || metaSource === 'local_mock') {
    source = 'local';
  } else {
    source = 'legacy';
  }

  return { module, source };
}

/** Module-aware preview header (D1). Safe fallback: "Output Preview". */
export function modulePreviewLabel(module: ModuleKey): string {
  return MODULE_META[module]?.previewLabel ?? MODULE_META.other.previewLabel;
}

// ---------------------------------------------------------------------------
// Caption body / metadata separation (D3)
//
// Each factory builds the caption as:
//   <human-readable Vietnamese content body>
//
//   ---
//   <Module> V1 metadata:
//   key: value
//   ...
//
// splitCaption() returns the clean content body (what a reviewer reads) and the
// raw metadata block (provenance + safety), so the detail view can render them
// separately instead of dumping the metadata into the caption preview.
// ---------------------------------------------------------------------------

export interface SplitCaption {
  body: string;
  metadata: string;
}

export function splitCaption(caption: string): SplitCaption {
  if (!caption) return { body: '', metadata: '' };
  const lines = caption.split('\n');
  // The metadata block is introduced by a header line ending in "metadata:".
  const markerIdx = lines.findIndex(l => /metadata:\s*$/.test(l.trim()));
  if (markerIdx === -1) return { body: caption.trim(), metadata: '' };

  // Drop the trailing "---" separator and blank lines from the body.
  let end = markerIdx;
  while (end > 0 && (lines[end - 1].trim() === '' || /^-{3,}$/.test(lines[end - 1].trim()))) end--;

  return {
    body: lines.slice(0, end).join('\n').trim(),
    metadata: lines.slice(markerIdx).join('\n').trim(),
  };
}

export interface ItemMetadata {
  workflowType?: string;
  contentType?: string;
  status?: string;
  ownerApprovalRequired?: string;
  source?: string;
  generationMode?: string;
  generatedBy?: string;
  /** Raw `safety:` flag line, e.g. "no_auto_post=true; no_auto_ads=true". */
  safety?: string;
  /** Parsed safety flags, e.g. ["no_auto_post=true", "no_auto_ads=true"]. */
  safetyFlags: string[];
}

/** Parse the provenance + safety metadata a factory appends to the caption. */
export function parseItemMetadata(caption: string): ItemMetadata {
  const safety = readMetaLine(caption, 'safety');
  return {
    workflowType: readMetaLine(caption, 'workflow_type'),
    contentType: readMetaLine(caption, 'content_type'),
    status: readMetaLine(caption, 'status'),
    ownerApprovalRequired: readMetaLine(caption, 'owner_approval_required'),
    source: readMetaLine(caption, 'source'),
    generationMode: readMetaLine(caption, 'generation_mode'),
    generatedBy: readMetaLine(caption, 'generated_by'),
    safety,
    safetyFlags: safety ? safety.split(';').map(s => s.trim()).filter(Boolean) : [],
  };
}

// ---------------------------------------------------------------------------
// Per-module field labels (D3)
//
// All modules store their rich content in the shared ContentPlanItem fields
// (hook / caption / visual_brief / cta / hashtags). The fields are the same; only
// their meaning shifts per module, so we relabel them for inspection clarity. We
// never add or invent fields — only rename existing ones.
// ---------------------------------------------------------------------------

export interface ModuleFieldLabels {
  headline: string;
  body: string;
  visual: string;
  cta: string;
}

export function moduleFieldLabels(module: ModuleKey): ModuleFieldLabels {
  switch (module) {
    case 'design':  return { headline: 'Concept',           body: 'Design Brief', visual: 'Visual Direction',       cta: 'Handoff / Output Note' };
    case 'video':   return { headline: 'Hook (0–3s)',       body: 'Video Script', visual: 'Shot / Visual Notes',    cta: 'CTA' };
    case 'ads':     return { headline: 'Angle / Hook',       body: 'Ads Draft',    visual: 'Creative Direction',     cta: 'CTA' };
    case 'report':  return { headline: 'Title / Objective',  body: 'Report Draft', visual: 'Focus / Key Observation', cta: 'Owner Action' };
    case 'content': return { headline: 'Hook',               body: 'Caption',      visual: 'Visual Brief',           cta: 'CTA' };
    default:        return { headline: 'Headline',           body: 'Output',       visual: 'Visual Brief',           cta: 'CTA' };
  }
}
