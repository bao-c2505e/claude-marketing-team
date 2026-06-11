import { useState, useMemo } from 'react';
import {
  ClipboardCheck, AlertTriangle, ChevronRight, ArrowLeft,
  CheckCircle, XCircle, RotateCcw, MessageSquare, Send, X,
  Clock, Filter, Info, User,
} from 'lucide-react';
import type {
  Client, Brand, Campaign, ContentPlanItem, RoleName,
  ContentApprovalRequest, ContentApprovalEvent, ContentApprovalComment,
  ContentApprovalStatus, ApprovalPriority,
} from '../../types/core';
import type { ApprovalDataStore } from '../../lib/core/coreData';
import {
  APPROVAL_STATUS_LABEL, APPROVAL_STATUS_COLOR,
  APPROVAL_PRIORITY_LABEL, APPROVAL_PRIORITY_COLOR,
  APPROVAL_ACTION_LABEL,
  CONTENT_ITEM_STATUS_LABEL, CONTENT_ITEM_STATUS_COLOR,
  canSubmitItem,
} from '../../lib/core/coreData';
import type { ResolvingApprovalAction } from '../../lib/core/coreRepository';
import { can } from '../../lib/auth/permissions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
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
        {' '}No auto-post. No real ads. No real customer messaging. Publishing is blocked until a later phase.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

interface Filters {
  clientId: string;
  brandId: string;
  campaignId: string;
  status: string;
  priority: string;
}

function FilterBar({
  filters, onChange, clients, brands, campaigns, total, shown,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  total: number;
  shown: number;
}) {
  const sel: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    padding: '5px 8px',
    cursor: 'pointer',
  };

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

  const hasActive = Object.values(filters).some(Boolean);

  const STATUSES: ContentApprovalStatus[] = ['submitted', 'approved', 'rejected', 'revision_requested', 'cancelled'];
  const PRIORITIES: ApprovalPriority[] = ['low', 'normal', 'high'];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
      <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <select style={sel} value={filters.clientId}   onChange={set('clientId')}>
        <option value="">All Clients</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select style={sel} value={filters.brandId}    onChange={set('brandId')}>
        <option value="">All Brands</option>
        {visBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <select style={sel} value={filters.campaignId} onChange={set('campaignId')}>
        <option value="">All Campaigns</option>
        {visCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select style={sel} value={filters.status}     onChange={set('status')}>
        <option value="">All Statuses</option>
        {STATUSES.map(s => <option key={s} value={s}>{APPROVAL_STATUS_LABEL[s]}</option>)}
      </select>
      <select style={sel} value={filters.priority}   onChange={set('priority')}>
        <option value="">All Priorities</option>
        {PRIORITIES.map(p => <option key={p} value={p}>{APPROVAL_PRIORITY_LABEL[p]}</option>)}
      </select>
      {hasActive && (
        <button
          onClick={() => onChange({ clientId: '', brandId: '', campaignId: '', status: '', priority: '' })}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          <X size={12} /> Clear
        </button>
      )}
      <span style={{ marginLeft: 'auto', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
        {shown} / {total} requests
      </span>
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
  request, item, onClick, isSelected,
}: {
  request: ContentApprovalRequest;
  item: ContentPlanItem | undefined;
  onClick: () => void;
  isSelected: boolean;
}) {
  const statusColor = APPROVAL_STATUS_COLOR[request.status];
  const statusLabel = APPROVAL_STATUS_LABEL[request.status];

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px',
        background: isSelected ? 'rgba(244, 122, 31,0.08)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? 'rgba(244, 122, 31,0.4)' : 'var(--border-color)'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item?.hook ?? request.title}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          {item?.channel && (
            <span style={{ fontSize: '0.68rem', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', borderRadius: '4px', padding: '1px 6px' }}>
              {item.channel}
            </span>
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
// Detail View
// ---------------------------------------------------------------------------

interface DetailViewProps {
  request: ContentApprovalRequest;
  item: ContentPlanItem | undefined;
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
}

function DetailView({
  request, item, events, comments,
  canApprove, canSubmitAction,
  onAction, onComment, onBack,
  clientName, brandName, campaignName,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ClipboardCheck size={16} style={{ color: '#fb923c' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Approval Request</h2>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Submitted by', value: request.requested_by },
            { label: 'Assigned to', value: request.assigned_to_role ?? 'Manager' },
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
      </div>

      {/* Content preview */}
      {item && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fb923c', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Content Preview — Day {item.day_number} · {item.channel} · {formatDate(item.planned_date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={labelStyle}>Hook</div>
              <div style={{ ...fieldStyle, fontWeight: 500, color: 'var(--text-primary)' }}>{item.hook}</div>
            </div>
            <div>
              <div style={labelStyle}>Caption</div>
              <pre style={{ ...fieldStyle, fontFamily: 'inherit', margin: 0, background: 'rgba(255,255,255,0.02)', borderRadius: '6px', padding: '10px 12px', border: '1px solid var(--border-color)' }}>{item.caption}</pre>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={labelStyle}>Visual Brief</div>
                <div style={fieldStyle}>{item.visual_brief}</div>
              </div>
              <div>
                <div style={labelStyle}>CTA</div>
                <div style={fieldStyle}>{item.cta}</div>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Hashtags</div>
              <div style={{ ...fieldStyle, color: '#a78bfa' }}>{item.hashtags}</div>
            </div>
          </div>
        </div>
      )}

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
            <strong style={{ color: '#f87171' }}>Approved ≠ Published.</strong> Approval here only unlocks the next workflow stage. Publishing requires a separate final step (not enabled in this MVP).
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
  clients, brands, campaigns,
  contentItems,
  approvalData,
  onSubmit, onAction, onComment, userRole, isSupabaseConfigured,
}: Props) {
  const canView        = can.viewContent(userRole);
  const canApprove     = can.approveContent(userRole);
  const canSubmitPerm  = can.generateContent(userRole) || can.editCampaigns(userRole);

  const [viewMode, setViewMode]       = useState<ViewMode>('list');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [filters, setFilters]         = useState<Filters>({ clientId: '', brandId: '', campaignId: '', status: '', priority: '' });

  const clientName   = (id: string | null) => id ? (clients.find(c => c.id === id)?.name ?? '—') : '—';
  const brandName    = (id: string | null) => id ? (brands.find(b => b.id === id)?.name ?? '—') : '—';
  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.name ?? '—';
  const itemFor      = (id: string) => contentItems.find(i => i.id === id);

  // Filtered approval requests
  const filteredRequests = useMemo(() => {
    return approvalData.approvalRequests.filter(r => {
      if (filters.clientId   && r.client_id   !== filters.clientId)   return false;
      if (filters.brandId    && r.brand_id     !== filters.brandId)    return false;
      if (filters.campaignId && r.campaign_id  !== filters.campaignId) return false;
      if (filters.status     && r.status       !== filters.status)    return false;
      if (filters.priority   && r.priority     !== filters.priority)  return false;
      return true;
    }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [approvalData.approvalRequests, filters]);

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
      />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  const submittedCount       = approvalData.approvalRequests.filter(r => r.status === 'submitted').length;
  const eligibleToSubmit     = contentItems.filter(i => canSubmitItem(approvalData, i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={20} style={{ color: '#fb923c' }} />
            Approvals
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Submit content for review and record approval decisions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {submittedCount > 0 && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '5px', padding: '2px 8px' }}>
              {submittedCount} pending review
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

      {/* Filter */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        clients={clients}
        brands={brands}
        campaigns={campaigns}
        total={approvalData.approvalRequests.length}
        shown={filteredRequests.length}
      />

      {/* Request list */}
      {approvalData.approvalRequests.length === 0 ? (
        <div className="glass-panel" style={{ padding: '56px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <ClipboardCheck size={36} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No approval requests yet</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
            {eligibleToSubmit.length > 0
              ? 'Use the "Submit for Approval" buttons above to start the review process.'
              : 'Generate content from an approved brief first, then submit items for approval.'}
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Filter size={28} style={{ color: 'var(--text-muted)' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No requests match the current filters.</div>
          <button onClick={() => setFilters({ clientId: '', brandId: '', campaignId: '', status: '', priority: '' })} style={{ fontSize: '0.78rem', color: '#fb923c', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
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
        </div>
      )}

    </div>
  );
}
