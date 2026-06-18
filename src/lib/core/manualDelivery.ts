// ---------------------------------------------------------------------------
// Manual Delivery / Publishing Tracker (Phase E) — internal, local, display-only
//
// A SAFE internal tracker so the Owner/staff can manually record what happened to
// an approved output AFTER approval — e.g. delivered to the client, or manually
// posted outside Core. It is NOT automation:
//
//   • Core never posts, schedules, launches, or spends.
//   • "Manually posted" means a human did it OUTSIDE Core — Core only records the note.
//   • The reference link is stored as text and shown for convenience; Core never
//     fetches, calls, or pings it.
//
// Storage is a dedicated browser localStorage key, completely separate from the
// approval state machine and the repositories. This phase adds NO DB schema, NO
// RLS/auth/routing change, and NO external API call. Records are keyed by approval
// request id. The pure mutators return a NEW map (no in-place mutation) so they
// are trivially unit-tested.
// ---------------------------------------------------------------------------

export type ManualDeliveryStatus =
  | 'not_delivered'
  | 'ready_for_delivery'
  | 'delivered_to_client'
  | 'manually_posted'
  | 'archived';

export const MANUAL_DELIVERY_STATUSES: ManualDeliveryStatus[] = [
  'not_delivered',
  'ready_for_delivery',
  'delivered_to_client',
  'manually_posted',
  'archived',
];

export const DEFAULT_MANUAL_DELIVERY_STATUS: ManualDeliveryStatus = 'not_delivered';

export const MANUAL_DELIVERY_LABEL: Record<ManualDeliveryStatus, string> = {
  not_delivered:       'Not delivered',
  ready_for_delivery:  'Ready for manual delivery',
  delivered_to_client: 'Delivered to client',
  manually_posted:     'Manually posted outside Core',
  archived:            'Archived / no action',
};

export const MANUAL_DELIVERY_COLOR: Record<ManualDeliveryStatus, string> = {
  not_delivered:       '#94a3b8',
  ready_for_delivery:  '#60a5fa',
  delivered_to_client: '#34d399',
  manually_posted:     '#a78bfa',
  archived:            '#6b7280',
};

export interface ManualDeliveryRecord {
  status: ManualDeliveryStatus;
  /** Optional manual post/reference link — stored as text, never fetched by Core. */
  link?: string;
  /** Optional free-text delivery note. */
  note?: string;
  /** ISO timestamp of the last manual update. */
  updatedAt: string;
  /** Display label of who recorded it (role name); display only. */
  updatedBy?: string;
}

/** Keyed by approval request id. */
export type ManualDeliveryMap = Record<string, ManualDeliveryRecord>;

export const MANUAL_DELIVERY_STORAGE_KEY = 'core_agency_manual_delivery_v1';

const STATUS_SET = new Set<string>(MANUAL_DELIVERY_STATUSES);

function isManualDeliveryStatus(value: unknown): value is ManualDeliveryStatus {
  return typeof value === 'string' && STATUS_SET.has(value);
}

// ---------------------------------------------------------------------------
// Persistence (localStorage only — no network, no Supabase)
// ---------------------------------------------------------------------------

export function loadManualDelivery(): ManualDeliveryMap {
  try {
    const stored = localStorage.getItem(MANUAL_DELIVERY_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const out: ManualDeliveryMap = {};
    for (const [id, raw] of Object.entries(parsed ?? {})) {
      if (!raw || typeof raw !== 'object') continue;
      const rec = raw as Partial<ManualDeliveryRecord>;
      out[id] = {
        // Coerce an unknown/corrupt status back to the safe default.
        status: isManualDeliveryStatus(rec.status) ? rec.status : DEFAULT_MANUAL_DELIVERY_STATUS,
        link: typeof rec.link === 'string' && rec.link ? rec.link : undefined,
        note: typeof rec.note === 'string' && rec.note ? rec.note : undefined,
        updatedAt: typeof rec.updatedAt === 'string' ? rec.updatedAt : new Date(0).toISOString(),
        updatedBy: typeof rec.updatedBy === 'string' ? rec.updatedBy : undefined,
      };
    }
    return out;
  } catch (_) { /* ignore */ }
  return {};
}

export function saveManualDelivery(map: ManualDeliveryMap): void {
  try {
    localStorage.setItem(MANUAL_DELIVERY_STORAGE_KEY, JSON.stringify(map));
  } catch (_) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Pure getters
// ---------------------------------------------------------------------------

export function getDeliveryRecord(map: ManualDeliveryMap, id: string): ManualDeliveryRecord | undefined {
  return map[id];
}

export function getDeliveryStatus(map: ManualDeliveryMap, id: string): ManualDeliveryStatus {
  return map[id]?.status ?? DEFAULT_MANUAL_DELIVERY_STATUS;
}

// ---------------------------------------------------------------------------
// Pure mutators — each returns a NEW map; none mutates the input
// ---------------------------------------------------------------------------

function upsert(
  map: ManualDeliveryMap,
  id: string,
  patch: Partial<Pick<ManualDeliveryRecord, 'status' | 'link' | 'note'>>,
  updatedBy?: string,
  now: string = new Date().toISOString(),
): ManualDeliveryMap {
  const prev = map[id];
  const next: ManualDeliveryRecord = {
    status: patch.status ?? prev?.status ?? DEFAULT_MANUAL_DELIVERY_STATUS,
    link: patch.link !== undefined ? patch.link : prev?.link,
    note: patch.note !== undefined ? patch.note : prev?.note,
    updatedAt: now,
    updatedBy: updatedBy ?? prev?.updatedBy,
  };
  // Keep records tidy: drop empty strings.
  if (!next.link) delete next.link;
  if (!next.note) delete next.note;
  return { ...map, [id]: next };
}

export function setDeliveryStatus(
  map: ManualDeliveryMap, id: string, status: ManualDeliveryStatus, updatedBy?: string, now?: string,
): ManualDeliveryMap {
  return upsert(map, id, { status }, updatedBy, now);
}

export function setDeliveryLink(
  map: ManualDeliveryMap, id: string, link: string, updatedBy?: string, now?: string,
): ManualDeliveryMap {
  return upsert(map, id, { link: link.trim() }, updatedBy, now);
}

export function setDeliveryNote(
  map: ManualDeliveryMap, id: string, note: string, updatedBy?: string, now?: string,
): ManualDeliveryMap {
  return upsert(map, id, { note: note.trim() }, updatedBy, now);
}

/** Clear/reset the manual delivery record for an item (removes it entirely). */
export function clearDelivery(map: ManualDeliveryMap, id: string): ManualDeliveryMap {
  if (!(id in map)) return map;
  const next = { ...map };
  delete next[id];
  return next;
}

// ---------------------------------------------------------------------------
// Link safety — a reference link is only treated as clickable when it is a plain
// http/https URL. Anything else (javascript:, data:, etc.) is shown as text and
// never linked. Core never fetches/opens it programmatically.
// ---------------------------------------------------------------------------

export function isSafeHttpLink(link: string | undefined): boolean {
  if (!link) return false;
  try {
    const u = new URL(link.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
