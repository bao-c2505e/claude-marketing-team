import { useState, useMemo } from 'react';
import {
  CalendarDays, AlertTriangle, ChevronDown, ChevronRight,
  Filter, X, Pencil, Check, Info,
} from 'lucide-react';
import type { Client, Brand, Campaign, CampaignBrief, ContentPlanItem, RoleName } from '../../types/core';
import type { GenerationDataStore } from '../../lib/core/coreData';
import {
  CONTENT_ITEM_STATUS_LABEL, CONTENT_ITEM_STATUS_COLOR,
  CALENDAR_SAFE_STATUSES, updateContentItemInStore,
  APPROVAL_STATUS_COLOR, APPROVAL_STATUS_LABEL,
} from '../../lib/core/coreData';
import type { CalendarItemPatch } from '../../lib/core/coreData';
import { can } from '../../lib/auth/permissions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  contentItems: ContentPlanItem[];
  generationJobs: GenerationDataStore['generationJobs'];
  onUpdate: (updated: GenerationDataStore) => void;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
  approvalRequests?: import('../../types/core').ContentApprovalRequest[];
  onNavigateToApprovals?: (itemId?: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHANNELS = ['All', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'Other'];

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700,
      color, background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: '5px', padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Safety Banner
// ---------------------------------------------------------------------------

function CalendarSafetyBanner() {
  return (
    <div style={{
      padding: '10px 16px',
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: '8px',
      display: 'flex', alignItems: 'flex-start', gap: '10px',
    }}>
      <AlertTriangle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        <strong style={{ color: '#f59e0b' }}>Planning Calendar — Not a Publishing Tool.</strong>
        {' '}Calendar is planning only. <strong>Scheduled ≠ Published. Generated ≠ Approved. Approved ≠ Published.</strong>
        {' '}No auto-post. No real ads. No real customer messaging. Every item requires human review and approval before any real-world use.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Bar
// ---------------------------------------------------------------------------

interface Filters {
  clientId: string;
  brandId: string;
  campaignId: string;
  channel: string;
  status: string;
}

function FilterBar({
  filters, onChange, clients, brands, campaigns, allChannels, allStatuses, totalItems, filteredCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  allChannels: string[];
  allStatuses: string[];
  totalItems: number;
  filteredCount: number;
}) {
  const visibleBrands = filters.clientId
    ? brands.filter(b => b.client_id === filters.clientId)
    : brands;

  const visibleCampaigns = filters.brandId
    ? campaigns.filter(c => c.brand_id === filters.brandId)
    : filters.clientId
    ? campaigns.filter(c => c.client_id === filters.clientId)
    : campaigns;

  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const next: Filters = { ...filters, [key]: val };
    // cascade reset
    if (key === 'clientId') { next.brandId = ''; next.campaignId = ''; }
    if (key === 'brandId') { next.campaignId = ''; }
    onChange(next);
  };

  const hasActive = Object.values(filters).some(Boolean);

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    padding: '5px 8px',
    cursor: 'pointer',
  };

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
      padding: '12px 16px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
    }}>
      <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

      <select style={selectStyle} value={filters.clientId} onChange={set('clientId')}>
        <option value="">All Clients</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select style={selectStyle} value={filters.brandId} onChange={set('brandId')}>
        <option value="">All Brands</option>
        {visibleBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <select style={selectStyle} value={filters.campaignId} onChange={set('campaignId')}>
        <option value="">All Campaigns</option>
        {visibleCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select style={selectStyle} value={filters.channel} onChange={set('channel')}>
        <option value="">All Channels</option>
        {allChannels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
      </select>

      <select style={selectStyle} value={filters.status} onChange={set('status')}>
        <option value="">All Statuses</option>
        {allStatuses.map(s => <option key={s} value={s}>{CONTENT_ITEM_STATUS_LABEL[s] ?? s}</option>)}
      </select>

      {hasActive && (
        <button
          onClick={() => onChange({ clientId: '', brandId: '', campaignId: '', channel: '', status: '' })}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          <X size={12} /> Clear
        </button>
      )}

      <span style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
        {filteredCount} / {totalItems} items
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Panel (inline slide-in)
// ---------------------------------------------------------------------------

interface EditDraft {
  planned_date: string;
  scheduled_time: string;
  channel: string;
  owner_note: string;
  publish_note: string;
  status: string;
}

function EditPanel({
  item, allChannels, onSave, onCancel,
}: {
  item: ContentPlanItem;
  allChannels: string[];
  onSave: (patch: CalendarItemPatch) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<EditDraft>({
    planned_date: item.planned_date ?? '',
    scheduled_time: item.scheduled_time ?? '',
    channel: item.channel,
    owner_note: item.owner_note ?? '',
    publish_note: item.publish_note ?? '',
    status: item.status,
  });

  const set = (key: keyof EditDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft(prev => ({ ...prev, [key]: e.target.value }));

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    padding: '6px 10px',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const handleSave = () => {
    const patch: CalendarItemPatch = {};
    if (draft.planned_date !== (item.planned_date ?? '')) patch.planned_date = draft.planned_date || null;
    if (draft.scheduled_time !== (item.scheduled_time ?? '')) patch.scheduled_time = draft.scheduled_time || null;
    if (draft.channel !== item.channel) patch.channel = draft.channel;
    if (draft.owner_note !== (item.owner_note ?? '')) patch.owner_note = draft.owner_note || null;
    if (draft.publish_note !== (item.publish_note ?? '')) patch.publish_note = draft.publish_note || null;
    if (draft.status !== item.status && CALENDAR_SAFE_STATUSES.includes(draft.status as never)) {
      patch.status = draft.status as CalendarItemPatch['status'];
    }
    onSave(patch);
  };

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      background: 'rgba(244, 122, 31,0.05)',
      border: '1px solid rgba(244, 122, 31,0.25)',
      borderRadius: '8px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fb923c', marginBottom: '4px' }}>
        Edit Calendar Metadata
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <div style={labelStyle}>Planned Date</div>
          <input type="date" style={inputStyle} value={draft.planned_date} onChange={set('planned_date')} />
        </div>
        <div>
          <div style={labelStyle}>Scheduled Time (optional)</div>
          <input type="time" style={inputStyle} value={draft.scheduled_time} onChange={set('scheduled_time')} />
        </div>
        <div>
          <div style={labelStyle}>Channel</div>
          <select style={inputStyle} value={draft.channel} onChange={set('channel')}>
            {allChannels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
          </select>
        </div>
        <div>
          <div style={labelStyle}>Status</div>
          <select style={inputStyle} value={draft.status} onChange={set('status')}>
            {CALENDAR_SAFE_STATUSES.map(s => (
              <option key={s} value={s}>{CONTENT_ITEM_STATUS_LABEL[s] ?? s}</option>
            ))}
          </select>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Approved / Published not available — use the Approvals tab
          </div>
        </div>
      </div>

      <div>
        <div style={labelStyle}>Owner Note</div>
        <textarea
          style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }}
          value={draft.owner_note}
          onChange={set('owner_note')}
          placeholder="Internal note for the team…"
        />
      </div>

      <div>
        <div style={labelStyle}>Publish Note</div>
        <textarea
          style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }}
          value={draft.publish_note}
          onChange={set('publish_note')}
          placeholder="Note for when this item is manually published…"
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', background: 'rgba(244, 122, 31,0.2)', border: '1px solid rgba(244, 122, 31,0.4)', color: '#fb923c', cursor: 'pointer', fontWeight: 600 }}
        >
          <Check size={13} /> Save
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item Detail (expanded view)
// ---------------------------------------------------------------------------

function ItemDetail({ item }: { item: ContentPlanItem }) {
  const fieldStyle: React.CSSProperties = {
    fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px',
  };
  const block = (label: string, value: string | null | undefined) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div style={labelStyle}>{label}</div>
      <div style={fieldStyle}>{value || '—'}</div>
    </div>
  );

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {block('Hook', item.hook)}
        {block('CTA', item.cta)}
      </div>
      {block('Caption', item.caption)}
      {block('Visual Brief', item.visual_brief)}
      {block('Hashtags', item.hashtags)}
      {(item.owner_note || item.publish_note) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {block('Owner Note', item.owner_note)}
          {block('Publish Note', item.publish_note)}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        {block('Angle', item.angle)}
        {block('Pillar', item.pillar)}
        {block('Content Type', item.content_type)}
      </div>
      <div style={{
        padding: '10px 14px',
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '6px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Info size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
          Approval / safety note: This content requires human review and approval before any real-world publishing.
          Generated ≠ Approved. No auto-post.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item Card
// ---------------------------------------------------------------------------

function ItemCard({
  item, expanded, onToggle, onEdit, editing, allChannels,
  canEdit, onSaveEdit, onCancelEdit,
  clientName, brandName, campaignName,
  approvalStatus, onNavigateToApprovals,
}: {
  item: ContentPlanItem;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  editing: boolean;
  allChannels: string[];
  canEdit: boolean;
  onSaveEdit: (patch: CalendarItemPatch) => void;
  onCancelEdit: () => void;
  clientName: string;
  brandName: string;
  campaignName: string;
  approvalStatus?: string | null;
  onNavigateToApprovals?: () => void;
}) {
  const statusColor = CONTENT_ITEM_STATUS_COLOR[item.status] ?? '#94a3b8';
  const statusLabel = CONTENT_ITEM_STATUS_LABEL[item.status] ?? item.status;

  const channelColor: Record<string, string> = {
    Facebook: '#fb923c',
    Instagram: '#f472b6',
    TikTok: '#34d399',
    YouTube: '#f87171',
  };
  const chColor = channelColor[item.channel] ?? '#94a3b8';

  return (
    <div style={{
      border: `1px solid ${expanded ? 'rgba(244, 122, 31,0.3)' : 'var(--border-color)'}`,
      borderRadius: '8px',
      background: expanded ? 'rgba(244, 122, 31,0.04)' : 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Card Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', cursor: 'pointer',
        }}
      >
        {/* Day badge */}
        <div style={{
          flexShrink: 0,
          width: '36px', height: '36px',
          background: 'rgba(244, 122, 31,0.15)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: '#fb923c',
        }}>
          D{item.day_number}
        </div>

        {/* Date + channel */}
        <div style={{ flex: '0 0 auto', minWidth: '90px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatDate(item.planned_date)}
          </div>
          {item.scheduled_time && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.scheduled_time}</div>
          )}
        </div>

        {/* Channel chip */}
        <span style={{
          fontSize: '0.68rem', fontWeight: 700,
          color: chColor, background: `${chColor}18`,
          border: `1px solid ${chColor}40`,
          borderRadius: '5px', padding: '2px 7px', whiteSpace: 'nowrap',
        }}>
          {item.channel}
        </span>

        {/* Hook preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.hook}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
            {item.caption.slice(0, 90)}…
          </div>
        </div>

        {/* Right side: status + approval badge + edit + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <StatusChip label={statusLabel} color={statusColor} />
          {approvalStatus && (
            <button
              onClick={e => { e.stopPropagation(); onNavigateToApprovals?.(); }}
              title="View approval"
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                color: APPROVAL_STATUS_COLOR[approvalStatus as keyof typeof APPROVAL_STATUS_COLOR] ?? '#94a3b8',
                background: `${APPROVAL_STATUS_COLOR[approvalStatus as keyof typeof APPROVAL_STATUS_COLOR] ?? '#94a3b8'}14`,
                border: `1px solid ${APPROVAL_STATUS_COLOR[approvalStatus as keyof typeof APPROVAL_STATUS_COLOR] ?? '#94a3b8'}35`,
                borderRadius: '4px', padding: '1px 6px',
              }}
            >
              ✓ {APPROVAL_STATUS_LABEL[approvalStatus as keyof typeof APPROVAL_STATUS_LABEL] ?? approvalStatus}
            </button>
          )}
          {canEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              title="Edit metadata"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: editing ? '#fb923c' : 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
            >
              <Pencil size={13} />
            </button>
          )}
          {expanded ? <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Context breadcrumb */}
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {clientName} → {brandName} → {campaignName} · Pillar: {item.pillar} · Type: {item.content_type}
          </div>

          {editing ? (
            <EditPanel
              item={item}
              allChannels={allChannels}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
            />
          ) : (
            <ItemDetail item={item} />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day Group
// ---------------------------------------------------------------------------

function DayGroup({ date, items, ...cardProps }: {
  date: string;
  items: ContentPlanItem[];
  expandedId: string | null;
  editingId: string | null;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onSaveEdit: (id: string, patch: CalendarItemPatch) => void;
  onCancelEdit: () => void;
  allChannels: string[];
  canEdit: boolean;
  clientName: (id: string | null) => string;
  brandName: (id: string | null) => string;
  campaignName: (id: string) => string;
  approvalStatusByItemId: Record<string, string | undefined>;
  onNavigateToApprovals?: () => void;
}) {
  const label = date === 'unscheduled' ? 'Unscheduled' : formatDate(date);
  const dayOfWeek = date !== 'unscheduled'
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
    : '';

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 0', marginBottom: '6px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <CalendarDays size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
        {dayOfWeek && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({dayOfWeek})</span>
        )}
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            expanded={cardProps.expandedId === item.id}
            onToggle={() => cardProps.onToggle(item.id)}
            onEdit={() => cardProps.onEdit(item.id)}
            editing={cardProps.editingId === item.id}
            allChannels={cardProps.allChannels}
            canEdit={cardProps.canEdit}
            onSaveEdit={(patch) => cardProps.onSaveEdit(item.id, patch)}
            onCancelEdit={cardProps.onCancelEdit}
            clientName={cardProps.clientName(item.client_id)}
            brandName={cardProps.brandName(item.brand_id)}
            campaignName={cardProps.campaignName(item.campaign_id)}
            approvalStatus={cardProps.approvalStatusByItemId[item.id]}
            onNavigateToApprovals={cardProps.onNavigateToApprovals}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ContentCalendarTab({
  clients, brands, campaigns,
  contentItems, generationJobs,
  onUpdate, userRole, isSupabaseConfigured,
  approvalRequests = [],
  onNavigateToApprovals,
}: Props) {
  const canView  = can.viewContent(userRole);
  const canEdit  = can.editContent(userRole) || can.generateContent(userRole);

  const [filters, setFilters] = useState<Filters>({ clientId: '', brandId: '', campaignId: '', channel: '', status: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const clientName  = (id: string | null) => id ? (clients.find(c => c.id === id)?.name ?? '—') : '—';
  const brandName   = (id: string | null) => id ? (brands.find(b => b.id === id)?.name ?? '—') : '—';
  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.name ?? '—';

  // Build item → most recent approval status map
  const approvalStatusByItemId = useMemo<Record<string, string | undefined>>(() => {
    const map: Record<string, string | undefined> = {};
    for (const req of approvalRequests) {
      const existing = map[req.content_item_id];
      if (!existing || req.created_at > (approvalRequests.find(r => r.content_item_id === req.content_item_id && r.status === existing)?.created_at ?? '')) {
        map[req.content_item_id] = req.status;
      }
    }
    return map;
  }, [approvalRequests]);

  // Derive unique channels and statuses from items
  const allChannels = useMemo(() => {
    const chs = new Set(contentItems.map(i => i.channel));
    return Array.from(chs).sort();
  }, [contentItems]);

  const allStatuses = useMemo(() => {
    const ss = new Set(contentItems.map(i => i.status));
    return Array.from(ss).sort();
  }, [contentItems]);

  // Apply filters
  const filtered = useMemo(() => {
    return contentItems.filter(item => {
      if (filters.clientId   && item.client_id   !== filters.clientId)   return false;
      if (filters.brandId    && item.brand_id     !== filters.brandId)    return false;
      if (filters.campaignId && item.campaign_id  !== filters.campaignId) return false;
      if (filters.channel    && item.channel      !== filters.channel)    return false;
      if (filters.status     && item.status       !== filters.status)    return false;
      return true;
    });
  }, [contentItems, filters]);

  // Group by planned_date (ISO date string), sort
  const grouped = useMemo(() => {
    const map = new Map<string, ContentPlanItem[]>();
    const sorted = [...filtered].sort((a, b) => {
      const da = a.planned_date ?? '';
      const db = b.planned_date ?? '';
      if (da < db) return -1;
      if (da > db) return 1;
      return a.day_number - b.day_number;
    });
    for (const item of sorted) {
      const key = item.planned_date ?? 'unscheduled';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [filtered]);

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
    if (editingId !== id) setEditingId(null);
  };

  const handleEdit = (id: string) => {
    setExpandedId(id);
    setEditingId(prev => prev === id ? null : id);
  };

  const handleSaveEdit = (id: string, patch: CalendarItemPatch) => {
    if (Object.keys(patch).length === 0) { setEditingId(null); return; }
    const currentStore: GenerationDataStore = { generationJobs, contentItems };
    const updated = updateContentItemInStore(currentStore, id, patch);
    onUpdate(updated);
    setEditingId(null);
  };

  // Permission gate
  if (!canView) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <CalendarDays size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          You don't have permission to view the Content Calendar.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={20} style={{ color: '#fb923c' }} />
            Content Calendar
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Planning view. Review, filter, and adjust content items generated from approved briefs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700,
            color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '5px', padding: '2px 8px',
          }}>
            Planning Only — No Publish
          </span>
          {!isSupabaseConfigured && (
            <span style={{
              fontSize: '0.65rem', color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '5px', padding: '2px 8px',
            }}>
              localStorage mode
            </span>
          )}
        </div>
      </div>

      {/* Safety banner */}
      <CalendarSafetyBanner />

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        clients={clients}
        brands={brands}
        campaigns={campaigns}
        allChannels={allChannels}
        allStatuses={allStatuses}
        totalItems={contentItems.length}
        filteredCount={filtered.length}
      />

      {/* Content */}
      {contentItems.length === 0 ? (
        // Empty state — no content generated at all
        <div className="glass-panel" style={{ padding: '56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <CalendarDays size={40} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No content yet</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
            Generate content from an approved brief first. Go to <strong>Content Generation</strong> to create a content plan.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        // Empty state — filters yielded no results
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Filter size={28} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No items match the current filters.</div>
          <button
            onClick={() => setFilters({ clientId: '', brandId: '', campaignId: '', channel: '', status: '' })}
            style={{ fontSize: '0.78rem', color: '#fb923c', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        // Day-grouped list
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Array.from(grouped.entries()).map(([date, items]) => (
            <DayGroup
              key={date}
              date={date}
              items={items}
              expandedId={expandedId}
              editingId={editingId}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditingId(null)}
              allChannels={allChannels.length > 0 ? allChannels : CHANNELS.slice(1)}
              canEdit={canEdit}
              clientName={clientName}
              brandName={brandName}
              campaignName={campaignName}
              approvalStatusByItemId={approvalStatusByItemId}
              onNavigateToApprovals={onNavigateToApprovals}
            />
          ))}
        </div>
      )}

      {/* Summary stats */}
      {contentItems.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          display: 'flex', flexWrap: 'wrap', gap: '16px',
          fontSize: '0.75rem', color: 'var(--text-muted)',
        }}>
          <span>Total: <strong style={{ color: 'var(--text-secondary)' }}>{contentItems.length}</strong> items</span>
          <span>Showing: <strong style={{ color: 'var(--text-secondary)' }}>{filtered.length}</strong></span>
          <span>Jobs: <strong style={{ color: 'var(--text-secondary)' }}>{generationJobs.length}</strong></span>
          {Object.entries(
            contentItems.reduce<Record<string, number>>((acc, i) => { acc[i.status] = (acc[i.status] ?? 0) + 1; return acc; }, {})
          ).map(([s, n]) => (
            <span key={s}>
              {CONTENT_ITEM_STATUS_LABEL[s] ?? s}: <strong style={{ color: CONTENT_ITEM_STATUS_COLOR[s] ?? 'var(--text-secondary)' }}>{n}</strong>
            </span>
          ))}
        </div>
      )}

    </div>
  );
}
