import { useState, useMemo } from 'react';
import {
  ClipboardCheck, AlertTriangle, ChevronRight, ArrowLeft,
  CheckCircle, XCircle, RotateCcw, MessageSquare, Send, X,
  Clock, Filter, Info, User, Search, Factory, Zap, FlaskConical, Layers, ShieldCheck,
  Truck, Link2, ExternalLink, Trash2, PackageCheck,
} from 'lucide-react';
import type {
  Client, Brand, Campaign, CampaignBrief, ContentPlanItem, RoleName,
  ContentApprovalRequest, ContentApprovalEvent, ContentApprovalComment,
  ContentApprovalStatus, ApprovalPriority,
} from '../../types/core';
import type { ApprovalDataStore } from '../../lib/core/coreData';
import { buildAiFactoryBrandContext, type BrandContextSnapshot } from '../../lib/core/brandBrain';
import {
  APPROVAL_STATUS_LABEL, APPROVAL_STATUS_COLOR,
  APPROVAL_PRIORITY_LABEL, APPROVAL_PRIORITY_COLOR,
  APPROVAL_ACTION_LABEL,
  CONTENT_ITEM_STATUS_LABEL, CONTENT_ITEM_STATUS_COLOR,
  canSubmitItem,
} from '../../lib/core/coreData';
import type { ResolvingApprovalAction } from '../../lib/core/coreRepository';
import { can } from '../../lib/auth/permissions';
import type { RequestClass } from '../../lib/core/approvalClassify';
import {
  MODULE_META, SOURCE_META,
  classifyRequest, modulePreviewLabel,
  splitCaption, parseItemMetadata, moduleFieldLabels,
} from '../../lib/core/approvalClassify';
import type { ManualDeliveryMap, ManualDeliveryRecord, ManualDeliveryStatus } from '../../lib/core/manualDelivery';
import {
  MANUAL_DELIVERY_LABEL, MANUAL_DELIVERY_COLOR,
  DEFAULT_MANUAL_DELIVERY_STATUS,
  loadManualDelivery, saveManualDelivery,
  setDeliveryStatus, setDeliveryLink, setDeliveryNote, clearDelivery,
  getDeliveryRecord, getDeliveryStatus, isSafeHttpLink,
} from '../../lib/core/manualDelivery';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  contentItems: ContentPlanItem[];
  approvalData: ApprovalDataStore;
  onSubmit: (item: ContentPlanItem) => Promise<void>;
  onAction: (request: ContentApprovalRequest, action: ResolvingApprovalAction, comment?: string) => Promise<void>;
  onComment: (request: ContentApprovalRequest, commentText: string, isInternal?: boolean) => Promise<void>;
  userRole: RoleName | null;
  isSupabaseConfigured: boolean;
}

// ---------------------------------------------------------------------------
// View mode
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'detail';

// ---------------------------------------------------------------------------
// Module / source / content-type classification + caption/metadata helpers live
// in src/lib/core/approvalClassify.ts (extracted in Phase D so they are reusable
// and unit-tested). They are READ-ONLY — labels and layout only, never mutation.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mini helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return iso ?? '—'; }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
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

// Small "label: value" chip used in the detail preview header + provenance row.
function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{
      fontSize: '0.66rem', color: 'var(--text-muted)',
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
      borderRadius: '5px', padding: '2px 8px', whiteSpace: 'nowrap',
    }}>
      <span style={{ color: 'var(--text-muted)', opacity: 0.75 }}>{label}: </span>
      <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{value}</strong>
    </span>
  );
}

// Manual delivery status chip (Phase E). Display only — reflects what the Owner
// manually recorded happened OUTSIDE Core; never implies Core posted anything.
function DeliveryChip({ status }: { status: ManualDeliveryStatus }) {
  const color = MANUAL_DELIVERY_COLOR[status];
  return (
    <span style={{
      fontSize: '0.66rem', fontWeight: 700,
      color, background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: '5px', padding: '2px 7px', whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      <Truck size={10} /> {MANUAL_DELIVERY_LABEL[status]}
    </span>
  );
}

function PriorityChip({ priority }: { priority: ApprovalPriority }) {
  const color = APPROVAL_PRIORITY_COLOR[priority];
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700,
      color, background: `${color}14`,
      border: `1px solid ${color}35`,
      borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap',
    }}>
      {APPROVAL_PRIORITY_LABEL[priority]}
    </span>
  );
}

// Module / content-type / source badges (display only)
function ClassBadges({ cls, showType = true }: { cls: RequestClass; showType?: boolean }) {
  const m = MODULE_META[cls.module];
  const s = SOURCE_META[cls.source];
  const SourceIcon = cls.source === 'n8n' ? Zap : cls.source === 'local' ? FlaskConical : Layers;
  return (
    <>
      <span className="appr-badge" style={{ color: m.color, background: `${m.color}18`, border: `1px solid ${m.color}40` }} title={`Module: ${m.label}`}>
        <Factory size={10} /> {m.label}
      </span>
      {showType && (
        <span className="appr-badge" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }} title="Content type">
          {m.contentType}
        </span>
      )}
      <span className="appr-badge" style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}40` }} title={`Source: ${s.label}`}>
        <SourceIcon size={10} /> {s.label}
      </span>
    </>
  );
}

// ---------------------------------------------------------------------------
// Safety Banner
// ---------------------------------------------------------------------------

function ApprovalSafetyBanner() {
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
        <strong style={{ color: '#f59e0b' }}>Approval Workflow — Planning Gate Only.</strong>
        {' '}Generated ≠ Approved. Approved ≠ Published.{' '}
        <strong>Approval here only unlocks the next workflow stage — it does NOT publish content.</strong>
        {' '}No auto-post. No auto-ads. No real customer messaging. No live analytics pull. Publishing is blocked until a later phase.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Toolbar — status tabs + search + module/scope filters + demo cleanup
// ---------------------------------------------------------------------------

interface Filters {
  clientId: string;
  brandId: string;
  campaignId: string;
  status: string;   // '' = all
  priority: string;
  module: string;   // '' = all
  source: string;   // '' = all
  delivery: string; // '' = all  (manual delivery view — Phase E)
  search: string;
}

const EMPTY_FILTERS: Filters = { clientId: '', brandId: '', campaignId: '', status: '', priority: '', module: '', source: '', delivery: '', search: '' };

const STATUS_TABS: { key: string; label: string; countKey: 'all' | ContentApprovalStatus }[] = [
  { key: '',                    label: 'All',            countKey: 'all' },
  { key: 'submitted',           label: 'Pending',        countKey: 'submitted' },
  { key: 'approved',            label: 'Approved',       countKey: 'approved' },
  { key: 'revision_requested',  label: 'Needs revision', countKey: 'revision_requested' },
  { key: 'rejected',            label: 'Rejected',       countKey: 'rejected' },
];

const MODULE_OPTIONS: { key: string; label: string }[] = [
  { key: '',        label: 'All modules' },
  { key: 'content', label: 'Content Factory' },
  { key: 'design',  label: 'Design Factory' },
  { key: 'video',   label: 'Video Scripts' },
  { key: 'ads',     label: 'Ads Pack Draft' },
  { key: 'report',  label: 'Report Draft' },
  { key: 'other',   label: 'Other / Legacy' },
];

const SOURCE_OPTIONS: { key: string; label: string }[] = [
  { key: '',       label: 'All sources' },
  { key: 'n8n',    label: 'n8n AI Provider' },
  { key: 'local',  label: 'Local demo' },
  { key: 'legacy', label: 'Legacy / mock' },
];

// Phase E — manual delivery "view" presets (combine approval + manual status).
const DELIVERY_VIEW_OPTIONS: { key: string; label: string }[] = [
  { key: '',                      label: 'All delivery' },
  { key: 'approved_not_delivered', label: 'Approved · not delivered' },
  { key: 'delivered_to_client',    label: 'Delivered to client' },
  { key: 'manually_posted',        label: 'Manually posted outside Core' },
  { key: 'pending_approval',       label: 'Pending approval' },
  { key: 'needs_revision',         label: 'Needs revision' },
];

// Does a request match the selected delivery-view preset? Pure helper so the
// filter logic stays readable and the deps array is explicit.
function matchesDeliveryView(view: string, approvalStatus: ContentApprovalStatus, deliveryStatus: ManualDeliveryStatus): boolean {
  switch (view) {
    case '': return true;
    case 'approved_not_delivered':
      return approvalStatus === 'approved' && (deliveryStatus === 'not_delivered' || deliveryStatus === 'ready_for_delivery');
    case 'delivered_to_client': return deliveryStatus === 'delivered_to_client';
    case 'manually_posted':     return deliveryStatus === 'manually_posted';
    case 'pending_approval':    return approvalStatus === 'submitted';
    case 'needs_revision':      return approvalStatus === 'revision_requested';
    default: return true;
  }
}

type StatusCounts = { all: number } & Record<ContentApprovalStatus, number>;

function ReviewToolbar({
  filters, onChange, hideLocalDemo, onToggleDemo, localDemoTotal,
  clients, brands, campaigns, statusCounts, total, shown,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  hideLocalDemo: boolean;
  onToggleDemo: () => void;
  localDemoTotal: number;
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  statusCounts: StatusCounts;
  total: number;
  shown: number;
}) {
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const next = { ...filters, [key]: val };
    if (key === 'clientId') { next.brandId = ''; next.campaignId = ''; }
    if (key === 'brandId')  { next.campaignId = ''; }
    onChange(next);
  };

  const visBrands    = filters.clientId ? brands.filter(b => b.client_id === filters.clientId) : brands;
  const visCampaigns = filters.brandId  ? campaigns.filter(c => c.brand_id === filters.brandId)
    : filters.clientId ? campaigns.filter(c => c.client_id === filters.clientId)
    : campaigns;

  const PRIORITIES: ApprovalPriority[] = ['low', 'normal', 'high'];

  const hasActive = !!(filters.clientId || filters.brandId || filters.campaignId || filters.status
    || filters.priority || filters.module || filters.source || filters.delivery || filters.search || hideLocalDemo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Status tabs */}
      <div className="appr-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key || 'all'}
            className={`appr-tab${filters.status === tab.key ? ' active' : ''}`}
            onClick={() => onChange({ ...filters, status: tab.key })}
          >
            {tab.label}
            <span className="appr-tab__count">{statusCounts[tab.countKey]}</span>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="appr-search"
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder="Search title, client, brand, campaign…"
          />
        </div>

        <select className="appr-select" value={filters.module} onChange={set('module')} title="Module / workflow">
          {MODULE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select className="appr-select" value={filters.source} onChange={set('source')} title="Source / provider">
          {SOURCE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select className="appr-select" value={filters.delivery} onChange={set('delivery')} title="Manual delivery view">
          {DELIVERY_VIEW_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <select className="appr-select" value={filters.clientId} onChange={set('clientId')}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="appr-select" value={filters.brandId} onChange={set('brandId')}>
          <option value="">All Brands</option>
          {visBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="appr-select" value={filters.campaignId} onChange={set('campaignId')}>
          <option value="">All Campaigns</option>
          {visCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="appr-select" value={filters.priority} onChange={set('priority')}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{APPROVAL_PRIORITY_LABEL[p]}</option>)}
        </select>

        <button
          className={`appr-toggle${hideLocalDemo ? ' active' : ''}`}
          onClick={onToggleDemo}
          title="Display-only. Hides local/demo and legacy/mock items so you can focus on n8n-generated AI Factory output. Nothing is deleted."
        >
          <Zap size={12} /> {hideLocalDemo ? 'n8n-only' : 'Hide local/demo'}
          {localDemoTotal > 0 && <span style={{ fontSize: '0.66rem', opacity: 0.85 }}>({localDemoTotal})</span>}
        </button>

        {hasActive && (
          <button
            onClick={() => { onChange({ ...EMPTY_FILTERS }); if (hideLocalDemo) onToggleDemo(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <X size={12} /> Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
          {shown} / {total} requests
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Submit Panel (for eligible items without an active request)
// ---------------------------------------------------------------------------

interface SubmitPanelProps {
  items: ContentPlanItem[];
  approvalData: ApprovalDataStore;
  canSubmit: boolean;
  onSubmit: (item: ContentPlanItem) => Promise<void>;
  clientName: (id: string | null) => string;
  brandName: (id: string | null) => string;
  campaignName: (id: string) => string;
}

function SubmitPanel({ items, approvalData, canSubmit, onSubmit, clientName, brandName, campaignName }: SubmitPanelProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligible = items.filter(i => canSubmitItem(approvalData, i));
  if (eligible.length === 0) return null;

  const handleSubmit = async (item: ContentPlanItem) => {
    setError(null);
    setSubmittingId(item.id);
    try {
      await onSubmit(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for approval.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Send size={14} style={{ color: '#60a5fa' }} />
        Ready to Submit ({eligible.length})
      </div>
      {error && (
        <div style={{ fontSize: '0.75rem', color: '#f87171' }}>{error}</div>
      )}
      {eligible.map(item => {
        const statusColor = CONTENT_ITEM_STATUS_COLOR[item.status] ?? '#94a3b8';
        const submitting = submittingId === item.id;
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.hook}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {clientName(item.client_id)} → {brandName(item.brand_id)} → {campaignName(item.campaign_id)} · {item.channel} · Day {item.day_number}
              </div>
            </div>
            <StatusChip label={CONTENT_ITEM_STATUS_LABEL[item.status] ?? item.status} color={statusColor} />
            {canSubmit ? (
              <button
                onClick={() => handleSubmit(item)}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(96,165,250,0.18)', border: '1px solid rgba(96,165,250,0.4)', color: '#60a5fa', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, flexShrink: 0 }}
              >
                <Send size={12} /> {submitting ? 'Submitting…' : 'Submit for Approval'}
              </button>
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No permission</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Request List Item Card
// ---------------------------------------------------------------------------

function RequestCard({
  request, item, cls, delivery, onClick, isSelected,
}: {
  request: ContentApprovalRequest;
  item: ContentPlanItem | undefined;
  cls: RequestClass;
  delivery: ManualDeliveryRecord | undefined;
  onClick: () => void;
  isSelected: boolean;
}) {
  const statusColor = APPROVAL_STATUS_COLOR[request.status];
  const statusLabel = APPROVAL_STATUS_LABEL[request.status];
  const isApproved = request.status === 'approved';

  return (
    <div onClick={onClick} className={`appr-card${isSelected ? ' selected' : ''}`}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div title={item?.hook ?? request.title} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item?.hook ?? request.title}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <ClassBadges cls={cls} />
          {item?.channel && (
            <span style={{ fontSize: '0.68rem', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', borderRadius: '4px', padding: '1px 6px' }}>
              {item.channel}
            </span>
          )}
          {isApproved && (
            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#34d399' }}>· internal use — not published or launched</span>
          )}
          {delivery && delivery.status !== DEFAULT_MANUAL_DELIVERY_STATUS && (
            <DeliveryChip status={delivery.status} />
          )}
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {formatDate(request.created_at)}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            by {request.requested_by}
          </span>
        </div>
      </div>
      <PriorityChip priority={request.priority} />
      <StatusChip label={statusLabel} color={statusColor} />
      <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual Delivery Tracker (Phase E) — detail-view section (E2/E5)
//
// Records what a HUMAN did with an approved output OUTSIDE Core (delivered to the
// client / manually posted / archived). Updates touch ONLY the local delivery
// store — never the approval state machine, never a repository, never a network
// call. Core never posts, schedules, launches, or spends.
// ---------------------------------------------------------------------------

function ManualDeliveryTracker({
  delivery, canEdit, onSetStatus, onSetLink, onSetNote, onClear,
}: {
  delivery: ManualDeliveryRecord | undefined;
  canEdit: boolean;
  onSetStatus: (s: ManualDeliveryStatus) => void;
  onSetLink: (l: string) => void;
  onSetNote: (n: string) => void;
  onClear: () => void;
}) {
  const status = delivery?.status ?? DEFAULT_MANUAL_DELIVERY_STATUS;
  const [linkDraft, setLinkDraft] = useState(delivery?.link ?? '');
  const [noteDraft, setNoteDraft] = useState(delivery?.note ?? '');

  const labelStyle: React.CSSProperties = {
    fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px',
  };
  const inputStyle: React.CSSProperties = {
    flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
    borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem', padding: '7px 10px',
  };
  const saveBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '6px',
    fontSize: '0.76rem', fontWeight: 700, background: 'rgba(96,165,250,0.16)',
    border: '1px solid rgba(96,165,250,0.4)', color: '#60a5fa', cursor: 'pointer', flexShrink: 0,
  };

  // Status buttons (excluding the default "not delivered" — Reset returns to that).
  const STATUS_BUTTONS: ManualDeliveryStatus[] = ['ready_for_delivery', 'delivered_to_client', 'manually_posted', 'archived'];

  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Truck size={15} style={{ color: '#a78bfa' }} /> Manual Delivery Tracker
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
        <ShieldCheck size={12} style={{ color: '#34d399', flexShrink: 0, marginTop: '1px' }} />
        Internal record of what a human did <strong>outside Core</strong>. Core does not auto-post or launch ads — nothing here posts, schedules, launches, or spends.
      </div>

      {/* Current status */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={labelStyle}>Status</span>
        <DeliveryChip status={status} />
        {delivery?.updatedAt && (
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            updated {formatDateTime(delivery.updatedAt)}{delivery.updatedBy ? ` · ${delivery.updatedBy}` : ''}
          </span>
        )}
      </div>

      {/* E3 — manually-posted clarification */}
      {status === 'manually_posted' && (
        <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '7px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#a78bfa' }}>Marked as manually posted outside Core by Owner/staff.</strong> Core did not post, schedule, launch, or spend — this is a manual record only.
        </div>
      )}

      {canEdit ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Status controls */}
          <div>
            <div style={labelStyle}>Set manual status</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {STATUS_BUTTONS.map(s => {
                const active = status === s;
                const c = MANUAL_DELIVERY_COLOR[s];
                return (
                  <button
                    key={s}
                    onClick={() => onSetStatus(s)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      fontSize: '0.74rem', fontWeight: 700, padding: '6px 11px', borderRadius: '6px',
                      cursor: 'pointer',
                      color: active ? '#0b0f17' : c,
                      background: active ? c : `${c}14`,
                      border: `1px solid ${c}${active ? '' : '40'}`,
                    }}
                  >
                    {s === 'manually_posted' ? <ExternalLink size={12} /> : s === 'delivered_to_client' ? <PackageCheck size={12} /> : <Truck size={12} />}
                    {MANUAL_DELIVERY_LABEL[s]}
                  </button>
                );
              })}
              {delivery && (
                <button
                  onClick={onClear}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', fontWeight: 700, padding: '6px 11px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-color)' }}
                  title="Clear/reset the manual delivery record for this item"
                >
                  <Trash2 size={12} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Manual post / reference link */}
          <div>
            <div style={labelStyle}>Manual post / reference link</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={inputStyle}
                value={linkDraft}
                onChange={e => setLinkDraft(e.target.value)}
                placeholder="https://… (reference only — Core never opens or fetches this)"
              />
              <button style={saveBtn} onClick={() => onSetLink(linkDraft)}>
                <Link2 size={13} /> Save link
              </button>
            </div>
          </div>

          {/* Delivery note */}
          <div>
            <div style={labelStyle}>Delivery note</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <textarea
                style={{ ...inputStyle, minHeight: '52px', resize: 'vertical' }}
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                placeholder="e.g. Sent pack to client over Zalo; Owner posted to Facebook page manually."
              />
              <button style={{ ...saveBtn, alignSelf: 'flex-start' }} onClick={() => onSetNote(noteDraft)}>
                <Send size={13} /> Save note
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          You don't have permission to update manual delivery status. (View only.)
        </div>
      )}

      {/* Read-only display of stored link/note (visible to all viewers) */}
      {(delivery?.link || delivery?.note) && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {delivery?.link && (
            <div>
              <div style={labelStyle}>Reference link</div>
              {isSafeHttpLink(delivery.link) ? (
                <a href={delivery.link} target="_blank" rel="noopener noreferrer nofollow" style={{ fontSize: '0.78rem', color: '#60a5fa', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ExternalLink size={12} /> {delivery.link}
                </a>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{delivery.link}</div>
              )}
            </div>
          )}
          {delivery?.note && (
            <div>
              <div style={labelStyle}>Note</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{delivery.note}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail View
// ---------------------------------------------------------------------------

interface DetailViewProps {
  request: ContentApprovalRequest;
  item: ContentPlanItem | undefined;
  cls: RequestClass;
  // Phase O — read-only Brand Brain snapshot that grounded this draft (or null
  // when the originating brand/brief can't be resolved). Review context only.
  brandContext: BrandContextSnapshot | null;
  events: ContentApprovalEvent[];
  comments: ContentApprovalComment[];
  canApprove: boolean;
  canSubmitAction: boolean;
  onAction: (request: ContentApprovalRequest, action: ResolvingApprovalAction, comment?: string) => Promise<void>;
  onComment: (request: ContentApprovalRequest, commentText: string, isInternal?: boolean) => Promise<void>;
  onBack: () => void;
  clientName: (id: string | null) => string;
  brandName: (id: string | null) => string;
  campaignName: (id: string) => string;
  // Phase E — manual delivery tracker (local, display/notes only).
  delivery: ManualDeliveryRecord | undefined;
  canEditDelivery: boolean;
  onSetDeliveryStatus: (status: ManualDeliveryStatus) => void;
  onSetDeliveryLink: (link: string) => void;
  onSetDeliveryNote: (note: string) => void;
  onClearDelivery: () => void;
}

// Phase O — read-only Brand Context Snapshot for the approval detail. Renders the
// normalized Brand Brain grounding (Phase N) the AI draft was framed with so the
// reviewer can judge it in context. Pure presentation: no inputs, no handlers, no
// network, no mutation — it can never publish, post, launch, sync, or approve.
function BrandContextSnapshotPanel({
  context,
  labelStyle,
}: {
  context: BrandContextSnapshot | null;
  labelStyle: React.CSSProperties;
}) {
  if (!context) {
    return (
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Layers size={13} /> Brand Context Snapshot — unavailable for this draft (originating brand/brief not resolved).
        </div>
      </div>
    );
  }

  const id = context.brand_identity;
  const identityLine = [id.brand_name, id.client_name, id.category].filter(Boolean).join(' · ');
  const campaignLine = context.campaign_context
    .map(c => `${c.name} (${c.status})${c.goal ? ` — ${c.goal}` : ''}`)
    .join(' · ');

  const rows: { label: string; value: string }[] = [
    { label: 'Campaign context', value: campaignLine },
    { label: 'Target customers', value: context.target_customers.join(' · ') },
    { label: 'Brand voice / tone', value: context.brand_voice.join(' · ') },
    { label: 'Content pillars', value: context.content_pillars.join(' · ') },
    { label: "Creative do", value: context.creative_dos.join(' · ') },
    { label: "Creative don't", value: context.creative_donts.join(' · ') },
    { label: 'Compliance / claim notes', value: context.claim_compliance_notes.join(' · ') },
  ].filter(r => r.value.trim().length > 0);

  const valueStyle: React.CSSProperties = {
    fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #a855f7' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} /> Brand Context Snapshot
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Grounding used for this draft · Review-only · not live publishing data.
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <MetaChip label="Source" value={context.source} />
          <MetaChip label="Status" value={context.status} />
          <span style={{ fontSize: '0.66rem', fontWeight: 600, color: '#c084fc', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '4px', padding: '2px 7px' }}>
            Internal draft context
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <div style={labelStyle}>Brand</div>
          <div style={{ ...valueStyle, fontWeight: 600, color: 'var(--text-primary)' }}>{identityLine || '—'}</div>
        </div>
        {context.positioning && (
          <div>
            <div style={labelStyle}>Positioning</div>
            <div style={valueStyle}>{context.positioning}</div>
          </div>
        )}
        {rows.map(r => (
          <div key={r.label}>
            <div style={labelStyle}>{r.label}</div>
            <div style={valueStyle}>{r.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <ShieldCheck size={13} style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          <strong style={{ color: '#34d399' }}>Approved ≠ Published.</strong> {context.approved_not_published}{' '}
          This snapshot is internal/draft-only review context — no auto-post, no auto-ads, no live connectors.
        </div>
      </div>
    </div>
  );
}

function DetailView({
  request, item, cls, brandContext, events, comments,
  canApprove, canSubmitAction,
  onAction, onComment, onBack,
  clientName, brandName, campaignName,
  delivery, canEditDelivery,
  onSetDeliveryStatus, onSetDeliveryLink, onSetDeliveryNote, onClearDelivery,
}: DetailViewProps) {
  const [commentText, setCommentText] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [showActionForm, setShowActionForm] = useState<'approve' | 'reject' | 'revision_requested' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const isActive = request.status === 'submitted';

  const statusColor = APPROVAL_STATUS_COLOR[request.status];
  const statusLabel = APPROVAL_STATUS_LABEL[request.status];
  const moduleMeta = MODULE_META[cls.module];
  const previewTitle = modulePreviewLabel(cls.module);
  const fieldLabels = moduleFieldLabels(cls.module);

  const fieldStyle: React.CSSProperties = {
    fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px',
  };

  const handleAction = async (action: 'approved' | 'rejected' | 'revision_requested') => {
    setActionError(null);
    setActionLoading(true);
    try {
      await onAction(request, action, actionComment || undefined);
      setShowActionForm(null);
      setActionComment('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update approval.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      await onAction(request, 'cancelled');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommentError(null);
    setCommentLoading(true);
    try {
      await onComment(request, commentText.trim());
      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to add comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  // Status-context safety line shown for resolved (non-active) requests so the
  // "Approved ≠ Published" guarantee is always visible, not only while pending.
  const resolvedSafety = request.status === 'approved'
    ? 'Approved for internal use. Not published or launched by Core. This unlocked the next workflow stage only — nothing was posted, scheduled, sent to ads, or spent.'
    : request.status === 'rejected'
    ? 'Rejected. No content was published or used.'
    : request.status === 'revision_requested'
    ? 'Revision requested. Draft returned for edits — nothing was published.'
    : request.status === 'cancelled'
    ? 'Request cancelled. No content was published or used.'
    : null;

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 700,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }} onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Approvals / Request Detail
        </span>
      </div>

      {/* Header card */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ClipboardCheck size={16} style={{ color: '#fb923c' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{request.title}</h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {clientName(request.client_id)} → {brandName(request.brand_id)} → {campaignName(request.campaign_id)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <PriorityChip priority={request.priority} />
            <StatusChip label={statusLabel} color={statusColor} />
          </div>
        </div>

        {/* Module / source / content-type badges + per-module safety note */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '14px' }}>
          <ClassBadges cls={cls} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Info size={11} /> {moduleMeta.safety}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Submitted by', value: request.requested_by },
            { label: 'Assigned to', value: request.assigned_to_role ?? 'Manager' },
            { label: 'Module', value: moduleMeta.label },
            { label: 'Source', value: SOURCE_META[cls.source].label },
            { label: 'Due Date', value: formatDate(request.due_date) },
            { label: 'Created', value: formatDate(request.created_at) },
            { label: 'Resolved', value: formatDate(request.resolved_at) },
            { label: 'Channel', value: item?.channel ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '7px', padding: '8px 12px' }}>
              <div style={labelStyle}>{label}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Resolved-state safety line (always visible once a decision is recorded) */}
        {resolvedSafety && (
          <div style={{ marginTop: '14px', padding: '9px 12px', background: `${statusColor}10`, border: `1px solid ${statusColor}33`, borderRadius: '7px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: statusColor }}>{statusLabel}.</strong> {resolvedSafety}
          </div>
        )}
      </div>

      {/* Module-aware output preview (D1 header + D3 per-type layout). All rich
          module content is rendered from existing item fields; the metadata block
          is split out into a Provenance & Safety panel rather than dumped inline. */}
      {item && (() => {
        const { body, metadata } = splitCaption(item.caption);
        const meta = parseItemMetadata(item.caption);
        return (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: moduleMeta.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Factory size={14} /> {previewTitle}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {item.pillar && <MetaChip label="Pillar" value={item.pillar} />}
              {item.channel && <MetaChip label="Channel" value={item.channel} />}
              <MetaChip label="Item" value={`#${item.day_number}`} />
              {item.planned_date && <MetaChip label="Planned" value={formatDate(item.planned_date)} />}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={labelStyle}>{fieldLabels.headline}</div>
              <div style={{ ...fieldStyle, fontWeight: 500, color: 'var(--text-primary)' }}>{item.hook}</div>
            </div>
            {item.angle && (
              <div>
                <div style={labelStyle}>Objective / Angle</div>
                <div style={fieldStyle}>{item.angle}</div>
              </div>
            )}
            <div>
              <div style={labelStyle}>{fieldLabels.body}</div>
              <pre style={{ ...fieldStyle, fontFamily: 'inherit', margin: 0, background: 'rgba(255,255,255,0.02)', borderRadius: '6px', padding: '10px 12px', border: '1px solid var(--border-color)' }}>{body || item.caption}</pre>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={labelStyle}>{fieldLabels.visual}</div>
                <div style={fieldStyle}>{item.visual_brief}</div>
              </div>
              <div>
                <div style={labelStyle}>{fieldLabels.cta}</div>
                <div style={fieldStyle}>{item.cta}</div>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Hashtags</div>
              <div style={{ ...fieldStyle, color: '#a78bfa' }}>{item.hashtags}</div>
            </div>
          </div>

          {/* Provenance & Safety — parsed from the draft's own metadata block.
              Display only; nothing here is editable or live. */}
          {(meta.safetyFlags.length > 0 || metadata) && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ ...labelStyle, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={11} /> Provenance &amp; Safety
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: meta.safetyFlags.length ? '8px' : 0 }}>
                {meta.workflowType && <MetaChip label="Workflow" value={meta.workflowType} />}
                {meta.source && <MetaChip label="Source" value={meta.source} />}
                {meta.generationMode && <MetaChip label="Mode" value={meta.generationMode} />}
                {meta.status && <MetaChip label="Status" value={meta.status} />}
                {meta.ownerApprovalRequired && <MetaChip label="Owner approval" value={meta.ownerApprovalRequired} />}
              </div>
              {meta.safetyFlags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {meta.safetyFlags.map((flag, i) => (
                    <span key={i} style={{ fontSize: '0.66rem', fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '4px', padding: '2px 7px' }}>
                      {flag}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Info size={11} /> {moduleMeta.safety} These flags come from the draft itself — display only.
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* PHASE_O_SNAPSHOT_START — read-only Brand Context Snapshot. Shows the
          normalized Brand Brain grounding this draft was framed with (Phase N),
          so a reviewer sees exactly what brand context the AI used. Display only:
          no edit/save/upload/publish/sync controls, no network, no mutation. */}
      <BrandContextSnapshotPanel context={brandContext} labelStyle={labelStyle} />
      {/* PHASE_O_SNAPSHOT_END */}

      {/* Manual Delivery Tracker (Phase E) — keyed by request id so the link/note
          drafts reset when switching between requests. */}
      <ManualDeliveryTracker
        key={request.id}
        delivery={delivery}
        canEdit={canEditDelivery}
        onSetStatus={onSetDeliveryStatus}
        onSetLink={onSetDeliveryLink}
        onSetNote={onSetDeliveryNote}
        onClear={onClearDelivery}
      />

      {/* Action buttons */}
      {isActive && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Review Actions
          </div>

          {showActionForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {showActionForm === 'approve'
                  ? 'Confirm approval. This will set content item status to Approved.'
                  : showActionForm === 'reject'
                  ? 'Confirm rejection. This will set content item status to Rejected.'
                  : 'Request revision. This will set content item status to Revision Requested.'}
              </div>
              <textarea
                value={actionComment}
                onChange={e => setActionComment(e.target.value)}
                placeholder="Add a comment (optional)…"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem', padding: '8px 10px', minHeight: '60px', resize: 'vertical', width: '100%' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleAction(showActionForm === 'approve' ? 'approved' : showActionForm === 'reject' ? 'rejected' : 'revision_requested')}
                  disabled={actionLoading}
                  style={{ ...btnBase, background: showActionForm === 'approve' ? 'rgba(52,211,153,0.2)' : showActionForm === 'reject' ? 'rgba(248,113,113,0.2)' : 'rgba(251,146,60,0.2)', border: `1px solid ${showActionForm === 'approve' ? 'rgba(52,211,153,0.4)' : showActionForm === 'reject' ? 'rgba(248,113,113,0.4)' : 'rgba(251,146,60,0.4)'}`, color: showActionForm === 'approve' ? '#34d399' : showActionForm === 'reject' ? '#f87171' : '#fb923c', opacity: actionLoading ? 0.6 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  {showActionForm === 'approve' ? <><CheckCircle size={14} /> {actionLoading ? 'Approving…' : 'Confirm Approve'}</> : showActionForm === 'reject' ? <><XCircle size={14} /> {actionLoading ? 'Rejecting…' : 'Confirm Reject'}</> : <><RotateCcw size={14} /> {actionLoading ? 'Submitting…' : 'Confirm Revision'}</>}
                </button>
                <button onClick={() => { setShowActionForm(null); setActionComment(''); setActionError(null); }} disabled={actionLoading} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                  Cancel
                </button>
              </div>
              {actionError && (
                <div style={{ fontSize: '0.75rem', color: '#f87171' }}>{actionError}</div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {canApprove ? (
                <>
                  <button onClick={() => setShowActionForm('approve')} style={{ ...btnBase, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button onClick={() => setShowActionForm('reject')} style={{ ...btnBase, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}>
                    <XCircle size={14} /> Reject
                  </button>
                  <button onClick={() => setShowActionForm('revision_requested')} style={{ ...btnBase, background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.35)', color: '#fb923c' }}>
                    <RotateCcw size={14} /> Request Revision
                  </button>
                </>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={13} /> You don't have permission to approve or reject content.
                </div>
              )}
              {canSubmitAction && (
                <button onClick={handleCancel} disabled={actionLoading} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', marginLeft: 'auto', opacity: actionLoading ? 0.6 : 1, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                  <X size={12} /> {actionLoading ? 'Cancelling…' : 'Cancel Request'}
                </button>
              )}
              {actionError && (
                <div style={{ fontSize: '0.75rem', color: '#f87171', width: '100%' }}>{actionError}</div>
              )}
            </div>
          )}

          <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: '#f87171' }}>Approved ≠ Published.</strong> Approval here only unlocks the next workflow stage. Publishing requires a separate final step (not enabled in this MVP). {moduleMeta.safety}
          </div>
        </div>
      )}

      {/* Comment form */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageSquare size={14} style={{ color: '#fb923c' }} /> Add Comment
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Write a comment…"
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem', padding: '8px 10px', minHeight: '52px', resize: 'vertical' }}
          />
          <button
            onClick={handleComment}
            disabled={!commentText.trim() || commentLoading}
            style={{ ...btnBase, alignSelf: 'flex-end', background: commentText.trim() ? 'rgba(244, 122, 31,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${commentText.trim() ? 'rgba(244, 122, 31,0.4)' : 'var(--border-color)'}`, color: commentText.trim() ? '#fb923c' : 'var(--text-muted)', cursor: commentText.trim() && !commentLoading ? 'pointer' : 'not-allowed', opacity: commentLoading ? 0.6 : 1 }}
          >
            <Send size={13} /> {commentLoading ? 'Sending…' : 'Send'}
          </button>
        </div>
        {commentError && (
          <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '8px' }}>{commentError}</div>
        )}
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Comments ({comments.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {comments.map(c => (
              <div key={c.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '7px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, color: '#fb923c' }}>
                    <User size={11} /> {c.actor_label}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatDateTime(c.created_at)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.comment}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History timeline */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} style={{ color: '#fb923c' }} /> Approval History
        </div>
        {events.length === 0 ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No events yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {events.map(ev => {
              const newStatusColor = ev.new_status ? APPROVAL_STATUS_COLOR[ev.new_status] : 'var(--text-muted)';
              return (
                <div key={ev.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: newStatusColor, flexShrink: 0, marginTop: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {APPROVAL_ACTION_LABEL[ev.action] ?? ev.action}
                      </span>
                      {ev.new_status && (
                        <StatusChip label={APPROVAL_STATUS_LABEL[ev.new_status]} color={newStatusColor} />
                      )}
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>by {ev.actor_label}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDateTime(ev.created_at)}</span>
                    </div>
                    {ev.comment && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', fontStyle: 'italic' }}>"{ev.comment}"</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ApprovalsTab({
  clients, brands, campaigns, briefs,
  contentItems,
  approvalData,
  onSubmit, onAction, onComment, userRole, isSupabaseConfigured,
}: Props) {
  const canView        = can.viewContent(userRole);
  const canApprove     = can.approveContent(userRole);
  const canSubmitPerm  = can.generateContent(userRole) || can.editCampaigns(userRole);

  const [viewMode, setViewMode]       = useState<ViewMode>('list');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [filters, setFilters]         = useState<Filters>({ ...EMPTY_FILTERS });
  const [hideLocalDemo, setHideLocalDemo] = useState(false);

  // Phase E — manual delivery tracker. Lives ONLY in browser localStorage; it is
  // a human-maintained internal note and is intentionally independent of the
  // approval state machine, the repositories, Supabase, and any network. Core
  // never posts/launches — these records only describe what a human did outside
  // Core. canApprove (owner/manager) may edit; everyone with view access can read.
  const [deliveryMap, setDeliveryMap] = useState<ManualDeliveryMap>(() => loadManualDelivery());
  const persistDelivery = (next: ManualDeliveryMap) => { setDeliveryMap(next); saveManualDelivery(next); };
  const actorLabel = userRole ?? undefined;

  const clientName   = (id: string | null) => id ? (clients.find(c => c.id === id)?.name ?? '—') : '—';
  const brandName    = (id: string | null) => id ? (brands.find(b => b.id === id)?.name ?? '—') : '—';
  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.name ?? '—';
  const itemFor      = (id: string) => contentItems.find(i => i.id === id);

  // Phase O — rebuild the SAME normalized Brand Brain snapshot the AI Factory used
  // (Phase N) from the draft's originating brand/client/campaign/brief, so the
  // approval detail can show the reviewer what grounded the draft. Pure + local.
  const brandContextFor = (req: ContentApprovalRequest, contentItem: ContentPlanItem | undefined): BrandContextSnapshot | null => {
    const brand = brands.find(b => b.id === req.brand_id);
    if (!brand) return null;
    const client = clients.find(c => c.id === req.client_id) ?? null;
    const campaign = campaigns.find(c => c.id === req.campaign_id) ?? null;
    const brief = contentItem?.brief_id ? (briefs.find(b => b.id === contentItem.brief_id) ?? null) : null;
    return buildAiFactoryBrandContext({ brand, client, campaign, brief });
  };

  // Classify every request once (module + source) — display only, no mutation.
  const classOf = useMemo(() => {
    const map = new Map<string, RequestClass>();
    for (const r of approvalData.approvalRequests) {
      map.set(r.id, classifyRequest(contentItems.find(i => i.id === r.content_item_id)));
    }
    return map;
  }, [approvalData.approvalRequests, contentItems]);

  // Requests matching everything EXCEPT the status tab (so tab counts stay
  // meaningful in the current scope/search/module/demo context).
  const scopeFiltered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return approvalData.approvalRequests.filter(r => {
      if (filters.clientId   && r.client_id   !== filters.clientId)   return false;
      if (filters.brandId    && r.brand_id    !== filters.brandId)    return false;
      if (filters.campaignId && r.campaign_id !== filters.campaignId) return false;
      if (filters.priority   && r.priority    !== filters.priority)   return false;
      const cls = classOf.get(r.id);
      if (filters.module && cls?.module !== filters.module) return false;
      if (filters.source && cls?.source !== filters.source) return false;
      if (hideLocalDemo && cls?.source !== 'n8n') return false;
      if (filters.delivery && !matchesDeliveryView(filters.delivery, r.status, getDeliveryStatus(deliveryMap, r.id))) return false;
      if (q) {
        const item = itemFor(r.content_item_id);
        const hay = [r.title, item?.hook, clientName(r.client_id), brandName(r.brand_id), campaignName(r.campaign_id)]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [approvalData.approvalRequests, contentItems, clients, brands, campaigns,
      filters.clientId, filters.brandId, filters.campaignId, filters.priority,
      filters.module, filters.source, filters.delivery, filters.search, hideLocalDemo, classOf, deliveryMap]);

  const statusCounts = useMemo<StatusCounts>(() => {
    const c: StatusCounts = { all: scopeFiltered.length, draft: 0, submitted: 0, approved: 0, rejected: 0, revision_requested: 0, cancelled: 0 };
    for (const r of scopeFiltered) c[r.status] += 1;
    return c;
  }, [scopeFiltered]);

  const filteredRequests = useMemo(() => {
    const base = filters.status ? scopeFiltered.filter(r => r.status === filters.status) : scopeFiltered;
    return [...base].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [scopeFiltered, filters.status]);

  const localDemoTotal = useMemo(() => {
    let n = 0;
    for (const r of approvalData.approvalRequests) {
      const cls = classOf.get(r.id);
      if (cls && cls.source !== 'n8n') n += 1;
    }
    return n;
  }, [approvalData.approvalRequests, classOf]);

  // Permission gate
  if (!canView) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <ClipboardCheck size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You don't have permission to view Approvals.</div>
      </div>
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────

  if (viewMode === 'detail' && selectedReqId) {
    const request  = approvalData.approvalRequests.find(r => r.id === selectedReqId);
    if (!request) { setViewMode('list'); setSelectedReqId(null); return null; }

    const item     = itemFor(request.content_item_id);
    const events   = approvalData.approvalEvents
      .filter(e => e.approval_request_id === selectedReqId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const comments = approvalData.approvalComments
      .filter(c => c.approval_request_id === selectedReqId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return (
      <DetailView
        request={request}
        item={item}
        cls={classOf.get(request.id) ?? classifyRequest(item)}
        brandContext={brandContextFor(request, item)}
        events={events}
        comments={comments}
        canApprove={canApprove}
        canSubmitAction={canSubmitPerm}
        onAction={onAction}
        onComment={onComment}
        onBack={() => { setViewMode('list'); setSelectedReqId(null); }}
        clientName={clientName}
        brandName={brandName}
        campaignName={campaignName}
        delivery={getDeliveryRecord(deliveryMap, request.id)}
        canEditDelivery={canApprove}
        onSetDeliveryStatus={(status) => persistDelivery(setDeliveryStatus(deliveryMap, request.id, status, actorLabel))}
        onSetDeliveryLink={(link) => persistDelivery(setDeliveryLink(deliveryMap, request.id, link, actorLabel))}
        onSetDeliveryNote={(note) => persistDelivery(setDeliveryNote(deliveryMap, request.id, note, actorLabel))}
        onClearDelivery={() => persistDelivery(clearDelivery(deliveryMap, request.id))}
      />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  const submittedCount       = approvalData.approvalRequests.filter(r => r.status === 'submitted').length;
  const eligibleToSubmit     = contentItems.filter(i => canSubmitItem(approvalData, i));
  const n8nCount             = approvalData.approvalRequests.length - localDemoTotal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={20} style={{ color: '#fb923c' }} />
            Approval Review Center
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Review AI Factory drafts and record approval decisions. Approval is a planning gate — it never publishes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {submittedCount > 0 && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '5px', padding: '2px 8px' }}>
              {submittedCount} pending review
            </span>
          )}
          {n8nCount > 0 && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '5px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={11} /> {n8nCount} n8n-generated
            </span>
          )}
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '5px', padding: '2px 8px' }}>
            No Publish — Approval Gate Only
          </span>
          {!isSupabaseConfigured && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '5px', padding: '2px 8px' }}>
              localStorage mode
            </span>
          )}
        </div>
      </div>

      <ApprovalSafetyBanner />

      {/* Submit Panel — eligible items */}
      {eligibleToSubmit.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '3px solid rgba(96,165,250,0.5)' }}>
          <SubmitPanel
            items={contentItems}
            approvalData={approvalData}
            canSubmit={canSubmitPerm}
            onSubmit={onSubmit}
            clientName={clientName}
            brandName={brandName}
            campaignName={campaignName}
          />
        </div>
      )}

      {/* Toolbar — status tabs + filters + search + demo cleanup */}
      {approvalData.approvalRequests.length > 0 && (
        <ReviewToolbar
          filters={filters}
          onChange={setFilters}
          hideLocalDemo={hideLocalDemo}
          onToggleDemo={() => setHideLocalDemo(v => !v)}
          localDemoTotal={localDemoTotal}
          clients={clients}
          brands={brands}
          campaigns={campaigns}
          statusCounts={statusCounts}
          total={approvalData.approvalRequests.length}
          shown={filteredRequests.length}
        />
      )}

      {/* Demo-cleanup notice (display-only; nothing deleted) */}
      {hideLocalDemo && localDemoTotal > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
          <Zap size={13} style={{ color: '#34d399', flexShrink: 0 }} />
          Showing n8n-generated items only — <strong style={{ color: '#34d399' }}>{localDemoTotal}</strong> local/demo &amp; legacy item{localDemoTotal !== 1 ? 's' : ''} hidden. Display-only filter; nothing was deleted.
        </div>
      )}

      {/* Request list */}
      {approvalData.approvalRequests.length === 0 ? (
        <div className="glass-panel" style={{ padding: '56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <ClipboardCheck size={36} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No approvals yet</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
            {eligibleToSubmit.length > 0
              ? 'Use the "Submit for Approval" buttons above to start the review process.'
              : 'Generate a new AI Factory pack (Content, Design, Video, Ads, or Report) and submit items here to review. Nothing is ever published from this screen.'}
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="glass-panel" style={{ padding: '44px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Filter size={28} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {filters.status === 'submitted' ? 'No pending approvals' : 'No requests match the current view'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
            {filters.status === 'submitted'
              ? 'Generate a new AI Factory pack to review.'
              : 'Try adjusting the status tab, search, module, or scope filters.'}
          </div>
          <button onClick={() => { setFilters({ ...EMPTY_FILTERS }); setHideLocalDemo(false); }} style={{ fontSize: '0.78rem', color: '#fb923c', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredRequests.map(req => (
            <RequestCard
              key={req.id}
              request={req}
              item={itemFor(req.content_item_id)}
              cls={classOf.get(req.id) ?? classifyRequest(itemFor(req.content_item_id))}
              delivery={getDeliveryRecord(deliveryMap, req.id)}
              isSelected={selectedReqId === req.id}
              onClick={() => { setSelectedReqId(req.id); setViewMode('detail'); }}
            />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {approvalData.approvalRequests.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <span>Total requests: <strong style={{ color: 'var(--text-secondary)' }}>{approvalData.approvalRequests.length}</strong></span>
          {(['submitted', 'approved', 'rejected', 'revision_requested', 'cancelled'] as ContentApprovalStatus[]).map(s => {
            const n = approvalData.approvalRequests.filter(r => r.status === s).length;
            if (n === 0) return null;
            return (
              <span key={s}>
                {APPROVAL_STATUS_LABEL[s]}: <strong style={{ color: APPROVAL_STATUS_COLOR[s] }}>{n}</strong>
              </span>
            );
          })}
          <span style={{ marginLeft: 'auto' }}>Approved ≠ Published — no auto-post, no auto-ads, no live analytics pull.</span>
        </div>
      )}

    </div>
  );
}
