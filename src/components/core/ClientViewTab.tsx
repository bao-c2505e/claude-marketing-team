import { useState, useMemo } from 'react';
import {
  Eye, Calendar, MessageSquare, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Send, Shield, UserCheck,
} from 'lucide-react';
import type {
  Client, Brand, Campaign, CampaignBrief, ContentPlanItem,
  ContentApprovalRequest, RoleName,
} from '../../types/core';
import type { GenerationDataStore, ApprovalDataStore } from '../../lib/core/coreData';
import { addApprovalComment } from '../../lib/core/coreData';
import { can, isInternalRole } from '../../lib/auth/permissions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  clients: Client[];
  brands: Brand[];
  campaigns: Campaign[];
  briefs: CampaignBrief[];
  contentItems: ContentPlanItem[];
  approvalData: ApprovalDataStore;
  genData: GenerationDataStore;
  onApprovalUpdate: (approval: ApprovalDataStore, gen: GenerationDataStore) => void;
  userRole: RoleName | null;
  actorLabel: string;
  isSupabaseConfigured: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLIENT_VISIBLE = new Set([
  'approved', 'needs_review', 'generated', 'revision_requested',
]);

function clientLabel(status: string): string {
  if (status === 'approved') return 'Approved';
  if (status === 'revision_requested') return 'Revision Requested';
  return 'Pending Review';
}

function clientColor(status: string): string {
  if (status === 'approved') return '#10b981';
  if (status === 'revision_requested') return '#f97316';
  return '#f59e0b';
}

// ---------------------------------------------------------------------------
// Safety banner
// ---------------------------------------------------------------------------

function ClientSafetyBanner() {
  return (
    <div style={{
      padding: '10px 16px',
      background: 'rgba(16,185,129,0.07)',
      border: '1px solid rgba(16,185,129,0.28)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <Shield size={14} style={{ color: '#34d399', flexShrink: 0 }} />
      <span style={{ fontSize: '0.8rem', color: '#34d399', lineHeight: 1.5 }}>
        <strong>Client Portal — Feedback &amp; Review only.</strong>{' '}
        Approved ≠ Published. No auto-post. No real ads. No customer messaging.
        Publishing remains blocked until final approval and publishing phase.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ClientViewTab({
  clients, brands, campaigns, briefs,
  contentItems, approvalData, genData,
  onApprovalUpdate, userRole, actorLabel, isSupabaseConfigured,
}: Props) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [feedbackItemId, setFeedbackItemId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');

  const isPreview = isInternalRole(userRole);
  const canView = can.viewContent(userRole);

  // ---------- derived data ----------

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) ?? null;
  const selectedBrief = briefs.find(b => b.campaign_id === selectedCampaignId) ?? null;
  const selectedBrand = selectedCampaign
    ? brands.find(b => b.id === selectedCampaign.brand_id) ?? null
    : null;

  const visibleItems = useMemo(() => {
    if (!selectedCampaignId) return [];
    return [...contentItems]
      .filter(i => i.campaign_id === selectedCampaignId && CLIENT_VISIBLE.has(i.status))
      .sort((a, b) => {
        const da = a.planned_date ?? '';
        const db = b.planned_date ?? '';
        if (da < db) return -1;
        if (da > db) return 1;
        return a.day_number - b.day_number;
      });
  }, [contentItems, selectedCampaignId]);

  // Most-recent approval request per content item (any status)
  const requestByItemId = useMemo(() => {
    const map = new Map<string, ContentApprovalRequest>();
    for (const req of approvalData.approvalRequests) {
      const ex = map.get(req.content_item_id);
      if (!ex || req.created_at > ex.created_at) map.set(req.content_item_id, req);
    }
    return map;
  }, [approvalData.approvalRequests]);

  // Public (non-internal) comments grouped by approval request id
  const publicCommentsByReqId = useMemo(() => {
    const map = new Map<string, typeof approvalData.approvalComments>();
    for (const c of approvalData.approvalComments) {
      if (!c.is_internal) {
        const arr = map.get(c.approval_request_id) ?? [];
        map.set(c.approval_request_id, [...arr, c]);
      }
    }
    return map;
  }, [approvalData.approvalComments]);

  const approvedCount = visibleItems.filter(i => i.status === 'approved').length;
  const pendingCount = visibleItems.filter(
    i => i.status === 'needs_review' || i.status === 'generated',
  ).length;
  const revisionCount = visibleItems.filter(i => i.status === 'revision_requested').length;

  // ---------- actions ----------

  const handleAddFeedback = (item: ContentPlanItem) => {
    if (!feedbackText.trim()) return;
    const req = requestByItemId.get(item.id);
    if (!req) return;
    const updated = addApprovalComment(
      approvalData, req.id, item.id, actorLabel, feedbackText.trim(), false,
    );
    onApprovalUpdate(updated, genData);
    setFeedbackText('');
    setFeedbackItemId(null);
  };

  // ---------- access guard ----------

  if (!canView) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={32} style={{ color: '#f87171', marginBottom: '12px' }} />
        <p style={{ color: '#f87171', fontWeight: 600 }}>Access denied.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
          You do not have permission to view the client portal.
        </p>
      </div>
    );
  }

  // ---------- render ----------

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={22} style={{ color: '#34d399' }} /> Client Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Client-facing content review and feedback.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isSupabaseConfigured && (
            <span style={{
              fontSize: '0.72rem', color: '#f59e0b',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '6px', padding: '3px 8px',
            }}>
              Offline Mode
            </span>
          )}
          {isPreview && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, color: '#818cf8',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: '6px', padding: '3px 10px',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <Eye size={11} /> Internal Preview of Client View
            </span>
          )}
        </div>
      </div>

      <ClientSafetyBanner />

      {/* Campaign selector */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <label style={{
          fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)',
          display: 'block', marginBottom: '8px',
        }}>
          Select Campaign / Client
        </label>
        <select
          value={selectedCampaignId}
          onChange={e => {
            setSelectedCampaignId(e.target.value);
            setExpandedItemId(null);
            setFeedbackItemId(null);
            setFeedbackText('');
          }}
          className="form-control"
          style={{ maxWidth: '460px' }}
        >
          <option value="">— Choose a campaign —</option>
          {campaigns
            .filter(c => c.status !== 'archived')
            .map(c => {
              const brand = brands.find(b => b.id === c.brand_id);
              const client = clients.find(cl => cl.id === c.client_id);
              return (
                <option key={c.id} value={c.id}>
                  {client?.name ?? '—'} / {brand?.name ?? '—'} — {c.name}
                </option>
              );
            })}
        </select>
      </div>

      {/* No campaign selected */}
      {!selectedCampaignId && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <Eye size={40} style={{ color: 'var(--text-muted)', marginBottom: '14px' }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>
            No campaign selected
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            Select a campaign above to view client-facing content.
          </p>
        </div>
      )}

      {/* Campaign view */}
      {selectedCampaign && (
        <>
          {/* Campaign overview card */}
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #34d399' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px',
            }}>
              <div>
                <p style={{
                  fontSize: '0.72rem', fontWeight: 700, color: '#34d399',
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px',
                }}>
                  {selectedBrand?.name ?? selectedCampaign.name}
                </p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>
                  {selectedBrief?.brief_title ?? selectedCampaign.name}
                </h3>
                {selectedBrief?.campaign_goal && (
                  <p style={{
                    fontSize: '0.83rem', color: 'var(--text-secondary)',
                    margin: 0, maxWidth: '480px', lineHeight: 1.5,
                  }}>
                    {selectedBrief.campaign_goal}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px',
                  background: selectedCampaign.status === 'active'
                    ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)',
                  color: selectedCampaign.status === 'active' ? '#34d399' : '#f59e0b',
                  border: `1px solid ${selectedCampaign.status === 'active'
                    ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.3)'}`,
                }}>
                  {selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1)}
                </span>
                {selectedCampaign.start_date && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {selectedCampaign.start_date} → {selectedCampaign.end_date ?? 'TBD'}
                  </span>
                )}
                {selectedBrief?.channels && selectedBrief.channels.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {selectedBrief.channels.slice(0, 4).map(ch => (
                      <span key={ch} style={{
                        fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: '8px',
                        background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}>
                        {ch}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {[
              { label: 'Approved', count: approvedCount, color: '#10b981', icon: <CheckCircle size={18} /> },
              { label: 'Pending Review', count: pendingCount, color: '#f59e0b', icon: <Clock size={18} /> },
              { label: 'Revision Requested', count: revisionCount, color: '#f97316', icon: <AlertCircle size={18} /> },
            ].map(stat => (
              <div key={stat.label} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.count}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Content list */}
          {visibleItems.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Calendar size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                No content available for this client view yet.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>
                Content will appear here once it has been generated and submitted for review.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 4px' }}>
                {visibleItems.length} content item{visibleItems.length !== 1 ? 's' : ''} for this campaign
              </div>

              {visibleItems.map(item => {
                const isExpanded = expandedItemId === item.id;
                const req = requestByItemId.get(item.id);
                const comments = req ? (publicCommentsByReqId.get(req.id) ?? []) : [];
                const canFeedback = !!req && canView;
                const isFeedbackOpen = feedbackItemId === item.id;

                return (
                  <div key={item.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>

                    {/* Card header — always visible, click to expand */}
                    <button
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      style={{
                        width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
                        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                      }}
                    >
                      {/* Day badge */}
                      <div style={{
                        minWidth: '36px', height: '36px', borderRadius: '8px',
                        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', flexShrink: 0,
                      }}>
                        D{item.day_number}
                      </div>

                      {/* Date */}
                      {item.planned_date && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {item.planned_date}
                        </span>
                      )}

                      {/* Channel */}
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
                        background: 'rgba(96,165,250,0.12)', color: '#60a5fa',
                        border: '1px solid rgba(96,165,250,0.25)', flexShrink: 0,
                      }}>
                        {item.channel}
                      </span>

                      {/* Hook preview */}
                      <span style={{
                        fontSize: '0.85rem', color: 'var(--text-primary)',
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.hook}
                      </span>

                      {/* Status badge + comment count + chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                          background: `${clientColor(item.status)}18`,
                          color: clientColor(item.status),
                          border: `1px solid ${clientColor(item.status)}40`,
                        }}>
                          {clientLabel(item.status)}
                        </span>
                        {comments.length > 0 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MessageSquare size={11} /> {comments.length}
                          </span>
                        )}
                        {isExpanded
                          ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />
                          : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border-color)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                        {/* Content fields — client-facing only (no owner_note, no angle/pillar internals) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Hook</p>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>{item.hook}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Channel / Format</p>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {item.channel} · {item.content_type}
                              {item.planned_date && <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>— {item.planned_date}</span>}
                            </p>
                          </div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Caption</p>
                            <p style={{ fontSize: '0.87rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.caption}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Visual Direction</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.visual_brief}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Call to Action</p>
                            <p style={{ fontSize: '0.87rem', color: 'var(--text-primary)' }}>{item.cta}</p>
                          </div>
                          {item.hashtags && (
                            <div style={{ gridColumn: 'span 2' }}>
                              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Hashtags</p>
                              <p style={{ fontSize: '0.82rem', color: '#60a5fa' }}>{item.hashtags}</p>
                            </div>
                          )}
                        </div>

                        {/* Approval note */}
                        {req && (
                          <div style={{
                            padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)', borderRadius: '8px',
                            fontSize: '0.78rem', color: 'var(--text-secondary)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                          }}>
                            <span style={{ fontWeight: 600, color: clientColor(item.status) }}>
                              Review Status:
                            </span>
                            {clientLabel(item.status)}
                            {req.due_date && (
                              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                                Due: {req.due_date}
                              </span>
                            )}
                          </div>
                        )}

                        {/* No approval request yet */}
                        {!req && (
                          <div style={{
                            padding: '10px 14px', background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px',
                            fontSize: '0.78rem', color: '#f59e0b',
                          }}>
                            This content has not been submitted for review yet. Contact your account manager to initiate the review process.
                          </div>
                        )}

                        {/* Public comments */}
                        {comments.length > 0 && (
                          <div>
                            <p style={{
                              fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
                              display: 'flex', alignItems: 'center', gap: '5px',
                            }}>
                              <MessageSquare size={12} /> Feedback ({comments.length})
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {comments.map(c => (
                                <div key={c.id} style={{
                                  padding: '10px 14px',
                                  background: 'rgba(96,165,250,0.05)',
                                  border: '1px solid rgba(96,165,250,0.2)',
                                  borderRadius: '8px',
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa' }}>{c.actor_label}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      {new Date(c.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.83rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                                    {c.comment}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback form (only if approval request exists) */}
                        {canFeedback && (
                          <div>
                            {!isFeedbackOpen ? (
                              <button
                                onClick={() => { setFeedbackItemId(item.id); setFeedbackText(''); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)',
                                  color: '#60a5fa', borderRadius: '7px', padding: '7px 14px',
                                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                                }}
                              >
                                <MessageSquare size={13} /> Add Feedback
                              </button>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <textarea
                                  value={feedbackText}
                                  onChange={e => setFeedbackText(e.target.value)}
                                  placeholder="Add your feedback or notes here..."
                                  rows={3}
                                  className="form-control"
                                  style={{ resize: 'vertical', fontSize: '0.85rem' }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => handleAddFeedback(item)}
                                    disabled={!feedbackText.trim()}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '5px',
                                      background: feedbackText.trim() ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.04)',
                                      border: `1px solid ${feedbackText.trim() ? 'rgba(96,165,250,0.5)' : 'var(--border-color)'}`,
                                      color: feedbackText.trim() ? '#60a5fa' : 'var(--text-muted)',
                                      borderRadius: '7px', padding: '7px 14px',
                                      cursor: feedbackText.trim() ? 'pointer' : 'not-allowed',
                                      fontSize: '0.82rem', fontWeight: 600,
                                    }}
                                  >
                                    <Send size={12} /> Submit Feedback
                                  </button>
                                  <button
                                    onClick={() => { setFeedbackItemId(null); setFeedbackText(''); }}
                                    style={{
                                      background: 'transparent', border: '1px solid var(--border-color)',
                                      color: 'var(--text-muted)', borderRadius: '7px', padding: '7px 12px',
                                      cursor: 'pointer', fontSize: '0.82rem',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
