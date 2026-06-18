// ---------------------------------------------------------------------------
// Client Feedback / Revision Loop (Phase G) — internal, local, manual only
//
// A SAFE internal store so the Owner/staff can record CLIENT FEEDBACK on an
// approved output (or a manually-prepared handoff pack), classify it, and write
// internal revision notes for follow-up. It is NOT automation:
//
//   • Core never sends email, never messages, never posts, never schedules,
//     never launches ads, never spends, never calls n8n, never triggers OpenAI,
//     never fetches live analytics, never regenerates content.
//   • Recording feedback NEVER mutates approval state. Approval decisions are made
//     ONLY by an authenticated Core UI action in the Approval Queue. Feedback is
//     input to a human's review — never an automatic state change.
//   • A linked item / handoff reference is stored as plain text using EXISTING
//     ids/metadata; Core does not act on it.
//
// Storage is a dedicated browser localStorage key, completely separate from the
// approval state machine and the repositories. This phase adds NO DB schema, NO
// RLS/auth/routing change, and NO external API call. The pure mutators return a
// NEW map (no in-place mutation) so they are trivially unit-tested.
// ---------------------------------------------------------------------------

import { generateId } from './coreData';
import { MODULE_META, type ModuleKey } from './approvalClassify';

// ---------------------------------------------------------------------------
// Enums + labels
// ---------------------------------------------------------------------------

export type FeedbackSource = 'manual_note' | 'call' | 'chat' | 'meeting' | 'other';
export type FeedbackType = 'copy_edit' | 'design_edit' | 'video_edit' | 'ads_edit' | 'report_edit' | 'general';
export type FeedbackPriority = 'low' | 'normal' | 'high';
export type FeedbackStatus = 'open' | 'in_review' | 'resolved' | 'archived';

export const FEEDBACK_SOURCES: FeedbackSource[] = ['manual_note', 'call', 'chat', 'meeting', 'other'];
export const FEEDBACK_TYPES: FeedbackType[] = ['copy_edit', 'design_edit', 'video_edit', 'ads_edit', 'report_edit', 'general'];
export const FEEDBACK_PRIORITIES: FeedbackPriority[] = ['low', 'normal', 'high'];
export const FEEDBACK_STATUSES: FeedbackStatus[] = ['open', 'in_review', 'resolved', 'archived'];

export const FEEDBACK_SOURCE_LABEL: Record<FeedbackSource, string> = {
  manual_note: 'Manual note',
  call:        'Call',
  chat:        'Chat',
  meeting:     'Meeting',
  other:       'Other',
};

export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = {
  copy_edit:   'Copy edit',
  design_edit: 'Design edit',
  video_edit:  'Video edit',
  ads_edit:    'Ads edit',
  report_edit: 'Report edit',
  general:     'General',
};

export const FEEDBACK_PRIORITY_LABEL: Record<FeedbackPriority, string> = {
  low: 'Low', normal: 'Normal', high: 'High',
};

export const FEEDBACK_PRIORITY_COLOR: Record<FeedbackPriority, string> = {
  low: '#94a3b8', normal: '#60a5fa', high: '#f87171',
};

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  open:      'Open',
  in_review: 'In review',
  resolved:  'Resolved',
  archived:  'Archived',
};

export const FEEDBACK_STATUS_COLOR: Record<FeedbackStatus, string> = {
  open:      '#fb923c',
  in_review: '#60a5fa',
  resolved:  '#34d399',
  archived:  '#6b7280',
};

/** Map a feedback type to a module, for display alignment (no mutation). */
export const FEEDBACK_TYPE_TO_MODULE: Record<FeedbackType, ModuleKey> = {
  copy_edit:   'content',
  design_edit: 'design',
  video_edit:  'video',
  ads_edit:    'ads',
  report_edit: 'report',
  general:     'other',
};

export const DEFAULT_FEEDBACK_SOURCE: FeedbackSource = 'manual_note';
export const DEFAULT_FEEDBACK_TYPE: FeedbackType = 'general';
export const DEFAULT_FEEDBACK_PRIORITY: FeedbackPriority = 'normal';
export const DEFAULT_FEEDBACK_STATUS: FeedbackStatus = 'open';

// ---------------------------------------------------------------------------
// Verbatim safety copy — exported so UI, revision-note builder, and the
// safety-regression test all reference the same source of truth.
// ---------------------------------------------------------------------------

/** G3 — printed on every internal revision note. */
export const REVISION_INTERNAL_SAFETY_NOTE =
  'This revision note is internal. Core did not send, publish, schedule, launch, or spend.';

/** G5 — explicit UI copy. */
export const FEEDBACK_APPROVED_MEANS =
  'Approved means approved for internal handoff only.';
export const FEEDBACK_HANDOFF_MEANS =
  'Handoff pack means prepared/exported manually, not sent automatically.';
export const FEEDBACK_CORE_DOES_NOT =
  'Core does not email, message, publish, schedule, launch ads, or spend.';

// ---------------------------------------------------------------------------
// Record + map
// ---------------------------------------------------------------------------

export interface ClientFeedbackRecord {
  id: string;
  /** Client feedback note (free text). */
  note: string;
  source: FeedbackSource;
  type: FeedbackType;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  /** Optional link to an approved output (approval request id) — existing id only. */
  linkedItemId?: string;
  /** Snapshot title of the linked item, for stable display. */
  linkedItemTitle?: string;
  /** Module of the linked item / classification (display only). */
  module?: ModuleKey;
  /** Optional free-text handoff pack reference (packs aren't persisted; text only). */
  handoffRef?: string;
  /** Internal revision instructions (G3). */
  revisionInstructions?: string;
  /** Internal owner note (G3). */
  ownerNote?: string;
  createdAt: string;
  updatedAt: string;
  /** Display label of who recorded it (role/email); display only. */
  updatedBy?: string;
}

/** Keyed by feedback id. */
export type ClientFeedbackMap = Record<string, ClientFeedbackRecord>;

export const CLIENT_FEEDBACK_STORAGE_KEY = 'core_agency_client_feedback_v1';

const SOURCE_SET = new Set<string>(FEEDBACK_SOURCES);
const TYPE_SET = new Set<string>(FEEDBACK_TYPES);
const PRIORITY_SET = new Set<string>(FEEDBACK_PRIORITIES);
const STATUS_SET = new Set<string>(FEEDBACK_STATUSES);

function coerceSource(v: unknown): FeedbackSource { return typeof v === 'string' && SOURCE_SET.has(v) ? v as FeedbackSource : DEFAULT_FEEDBACK_SOURCE; }
function coerceType(v: unknown): FeedbackType { return typeof v === 'string' && TYPE_SET.has(v) ? v as FeedbackType : DEFAULT_FEEDBACK_TYPE; }
function coercePriority(v: unknown): FeedbackPriority { return typeof v === 'string' && PRIORITY_SET.has(v) ? v as FeedbackPriority : DEFAULT_FEEDBACK_PRIORITY; }
function coerceStatus(v: unknown): FeedbackStatus { return typeof v === 'string' && STATUS_SET.has(v) ? v as FeedbackStatus : DEFAULT_FEEDBACK_STATUS; }
function str(v: unknown): string | undefined { return typeof v === 'string' && v.trim() ? v : undefined; }
function moduleOrUndef(v: unknown): ModuleKey | undefined {
  return typeof v === 'string' && v in MODULE_META ? v as ModuleKey : undefined;
}

// ---------------------------------------------------------------------------
// Persistence (localStorage only — no network, no Supabase)
// ---------------------------------------------------------------------------

export function loadClientFeedback(): ClientFeedbackMap {
  try {
    const stored = localStorage.getItem(CLIENT_FEEDBACK_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const out: ClientFeedbackMap = {};
    for (const [id, raw] of Object.entries(parsed ?? {})) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Partial<ClientFeedbackRecord>;
      out[id] = {
        id,
        note: typeof r.note === 'string' ? r.note : '',
        source: coerceSource(r.source),
        type: coerceType(r.type),
        priority: coercePriority(r.priority),
        status: coerceStatus(r.status),
        linkedItemId: str(r.linkedItemId),
        linkedItemTitle: str(r.linkedItemTitle),
        module: moduleOrUndef(r.module),
        handoffRef: str(r.handoffRef),
        revisionInstructions: str(r.revisionInstructions),
        ownerNote: str(r.ownerNote),
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(0).toISOString(),
        updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date(0).toISOString(),
        updatedBy: str(r.updatedBy),
      };
    }
    return out;
  } catch (_) { /* ignore */ }
  return {};
}

export function saveClientFeedback(map: ClientFeedbackMap): void {
  try {
    localStorage.setItem(CLIENT_FEEDBACK_STORAGE_KEY, JSON.stringify(map));
  } catch (_) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Pure mutators — each returns a NEW map; none mutates the input. NONE of these
// touches approval state; they only read/write the feedback store.
// ---------------------------------------------------------------------------

export interface FeedbackInput {
  note: string;
  source?: FeedbackSource;
  type?: FeedbackType;
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  linkedItemId?: string;
  linkedItemTitle?: string;
  module?: ModuleKey;
  handoffRef?: string;
  revisionInstructions?: string;
  ownerNote?: string;
}

export interface MutateOpts {
  id?: string;
  now?: string;
  updatedBy?: string;
}

function clean(rec: ClientFeedbackRecord): ClientFeedbackRecord {
  const next = { ...rec };
  // Drop empty optionals to keep records tidy.
  (['linkedItemId', 'linkedItemTitle', 'handoffRef', 'revisionInstructions', 'ownerNote', 'updatedBy'] as const)
    .forEach(k => { if (!next[k]) delete next[k]; });
  if (!next.module) delete next.module;
  return next;
}

export function addFeedback(map: ClientFeedbackMap, input: FeedbackInput, opts: MutateOpts = {}): ClientFeedbackMap {
  const now = opts.now ?? new Date().toISOString();
  const id = opts.id ?? generateId('fb');
  const rec: ClientFeedbackRecord = clean({
    id,
    note: input.note.trim(),
    source: input.source ?? DEFAULT_FEEDBACK_SOURCE,
    type: input.type ?? DEFAULT_FEEDBACK_TYPE,
    priority: input.priority ?? DEFAULT_FEEDBACK_PRIORITY,
    status: input.status ?? DEFAULT_FEEDBACK_STATUS,
    linkedItemId: input.linkedItemId?.trim() || undefined,
    linkedItemTitle: input.linkedItemTitle?.trim() || undefined,
    module: input.module,
    handoffRef: input.handoffRef?.trim() || undefined,
    revisionInstructions: input.revisionInstructions?.trim() || undefined,
    ownerNote: input.ownerNote?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    updatedBy: opts.updatedBy,
  });
  return { ...map, [id]: rec };
}

export function updateFeedback(map: ClientFeedbackMap, id: string, patch: Partial<FeedbackInput>, opts: MutateOpts = {}): ClientFeedbackMap {
  const prev = map[id];
  if (!prev) return map;
  const now = opts.now ?? new Date().toISOString();
  const next: ClientFeedbackRecord = clean({
    ...prev,
    note: patch.note !== undefined ? patch.note.trim() : prev.note,
    source: patch.source ?? prev.source,
    type: patch.type ?? prev.type,
    priority: patch.priority ?? prev.priority,
    status: patch.status ?? prev.status,
    linkedItemId: patch.linkedItemId !== undefined ? (patch.linkedItemId.trim() || undefined) : prev.linkedItemId,
    linkedItemTitle: patch.linkedItemTitle !== undefined ? (patch.linkedItemTitle.trim() || undefined) : prev.linkedItemTitle,
    module: patch.module !== undefined ? patch.module : prev.module,
    handoffRef: patch.handoffRef !== undefined ? (patch.handoffRef.trim() || undefined) : prev.handoffRef,
    revisionInstructions: patch.revisionInstructions !== undefined ? (patch.revisionInstructions.trim() || undefined) : prev.revisionInstructions,
    ownerNote: patch.ownerNote !== undefined ? (patch.ownerNote.trim() || undefined) : prev.ownerNote,
    updatedAt: now,
    updatedBy: opts.updatedBy ?? prev.updatedBy,
  });
  return { ...map, [id]: next };
}

export function setFeedbackStatus(map: ClientFeedbackMap, id: string, status: FeedbackStatus, opts: MutateOpts = {}): ClientFeedbackMap {
  return updateFeedback(map, id, { status }, opts);
}

export function deleteFeedback(map: ClientFeedbackMap, id: string): ClientFeedbackMap {
  if (!(id in map)) return map;
  const next = { ...map };
  delete next[id];
  return next;
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/** Newest-first list. */
export function listFeedback(map: ClientFeedbackMap): ClientFeedbackRecord[] {
  return Object.values(map).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type FeedbackView = 'all' | FeedbackStatus | 'high_priority';

export const FEEDBACK_VIEW_LABEL: Record<FeedbackView, string> = {
  all:           'All feedback',
  open:          'Open',
  in_review:     'In review',
  resolved:      'Resolved',
  archived:      'Archived',
  high_priority: 'High priority',
};

export const FEEDBACK_VIEWS: FeedbackView[] = ['all', 'open', 'in_review', 'resolved', 'archived', 'high_priority'];

/**
 * Pure UI filter. `view` covers the status / priority dimension; `moduleFilter`
 * (optional) narrows by the feedback's module/type. Both are display-only and
 * never invent or mutate data.
 */
export function feedbackMatches(rec: ClientFeedbackRecord, view: FeedbackView, moduleFilter?: ModuleKey | null): boolean {
  if (moduleFilter) {
    const recModule = rec.module ?? FEEDBACK_TYPE_TO_MODULE[rec.type];
    if (recModule !== moduleFilter) return false;
  }
  if (view === 'all') return true;
  if (view === 'high_priority') return rec.priority === 'high';
  return rec.status === view;
}

export function filterFeedback(list: ClientFeedbackRecord[], view: FeedbackView, moduleFilter?: ModuleKey | null): ClientFeedbackRecord[] {
  return list.filter(r => feedbackMatches(r, view, moduleFilter));
}

// ---------------------------------------------------------------------------
// Revision note builder (G3) — pure. Produces an INTERNAL revision note for
// copy/preview. It NEVER calls AI/n8n and NEVER regenerates content; it only
// formats what the Owner has recorded.
// ---------------------------------------------------------------------------

export type RevisionNoteFormat = 'markdown' | 'plain_text';

export function buildRevisionNote(rec: ClientFeedbackRecord, format: RevisionNoteFormat = 'markdown'): string {
  const module = rec.module ?? FEEDBACK_TYPE_TO_MODULE[rec.type];
  const moduleLabel = MODULE_META[module]?.label ?? 'Other';
  const itemTitle = rec.linkedItemTitle || 'Untitled output';

  const lines: string[] = [];
  lines.push(`# REVISION NOTE — ${itemTitle}`);
  lines.push('');
  lines.push('## Original Item');
  lines.push(`- **Title:** ${itemTitle}`);
  lines.push(`- **Module / type:** ${moduleLabel} · ${FEEDBACK_TYPE_LABEL[rec.type]}`);
  if (rec.handoffRef) lines.push(`- **Handoff reference:** ${rec.handoffRef}`);
  lines.push('');

  lines.push('## Client Feedback');
  lines.push(`- **Source:** ${FEEDBACK_SOURCE_LABEL[rec.source]}`);
  lines.push(`- **Priority:** ${FEEDBACK_PRIORITY_LABEL[rec.priority]}`);
  lines.push(`- **Status:** ${FEEDBACK_STATUS_LABEL[rec.status]}`);
  lines.push('');
  lines.push(rec.note?.trim() || '_(No feedback note recorded.)_');
  lines.push('');

  lines.push('## Internal Revision Instructions');
  lines.push(rec.revisionInstructions?.trim() || '_(No revision instructions yet.)_');
  lines.push('');

  if (rec.ownerNote?.trim()) {
    lines.push('## Owner Note');
    lines.push(rec.ownerNote.trim());
    lines.push('');
  }

  lines.push('---');
  lines.push(`> **${REVISION_INTERNAL_SAFETY_NOTE}**`);
  lines.push('');

  const markdown = lines.join('\n');
  return format === 'plain_text' ? toPlainText(markdown) : markdown;
}

export function toPlainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^>\s?/gm, '  ')
    .replace(/^-\s+/gm, '• ')
    .replace(/`([^`]+)`/g, '$1');
}
