// Client Feedback Intake & Delivery Acceptance — Phase T
// ---------------------------------------------------------------------------
// A SAFE, LOCAL/MOCK client review workflow embedded directly under the Phase S
// Client Delivery Room (handoff preview) inside the Campaign Production Workspace.
// It lets the Owner/internal team PREVIEW how client feedback and delivery
// acceptance WOULD be captured — without sending anything externally.
//
//   • Local mock only: NO email, NO public/share URL, NO notification, NO connector,
//     NO network call. Feedback + acceptance state live in this component's local
//     React state, seeded by the deterministic `sampleDeliveryFeedback` mock.
//   • Recording feedback / changing acceptance state NEVER mutates approval state and
//     NEVER publishes. Approval decisions stay in the Approval Queue.
//   • Approved/accepted ≠ Published: the room always renders "Not Published". There is
//     no `published`/`launched` state. `client_accepted` is NOT published, and
//     `owner_ready_for_manual_publish` is GATED behind the Phase R manual publishing
//     checklist being ready — and even then it only QUEUES a manual, Owner-controlled
//     publish step that lives outside this panel.
//
// Self-contained on purpose so the parent CampaignWorkspace stays stateless and its
// Phase K source-scan safety test (no useState, no mutation) keeps holding.
// See CLAUDE.md §4 (Safety), §6 (Output Status Model).
// ---------------------------------------------------------------------------
import React, { useMemo, useState, useCallback } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Plus,
  Check,
  ClipboardCopy,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  Lock,
} from 'lucide-react';
import type {
  RoleName,
  Client,
  Brand,
  Campaign,
  CampaignBrief,
  ContentPlanItem,
  ContentApprovalRequest,
  ContentApprovalEvent,
} from '../../types/core';
import { can } from '../../lib/auth/permissions';
import {
  resolveCampaignPackContext,
  collectCampaignPackItems,
} from '../../lib/core/campaignPack';
import { buildManualPublishingChecklist } from '../../lib/core/manualPublishingChecklist';
import {
  addDeliveryFeedback,
  setDeliveryFeedbackStatus,
  removeDeliveryFeedback,
  transitionAcceptance,
  buildDeliveryAcceptanceRoom,
  renderDeliveryAcceptanceText,
  sampleDeliveryFeedback,
  DELIVERY_ACCEPTANCE_STATES,
  DELIVERY_ACCEPTANCE_STATE_LABEL,
  DELIVERY_ACCEPTANCE_STATE_COLOR,
  DELIVERY_FEEDBACK_TYPES,
  DELIVERY_FEEDBACK_TYPE_LABEL,
  DELIVERY_FEEDBACK_TYPE_COLOR,
  DELIVERY_FEEDBACK_STATUS_LABEL,
  DELIVERY_FEEDBACK_STATUS_COLOR,
  DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST,
  type DeliveryAcceptanceState,
  type DeliveryFeedbackEntry,
  type DeliveryFeedbackType,
  type DeliveryFeedbackStatus,
} from '../../lib/core/deliveryAcceptance';

interface Props {
  campaign: Campaign;
  client: Client | null;
  brand: Brand | null;
  briefs: CampaignBrief[];
  contentItems: ContentPlanItem[];
  approvalRequests: ContentApprovalRequest[];
  approvalEvents: ContentApprovalEvent[];
  userRole: RoleName | null;
  actorLabel: string;
}

const ACCENT = '#22d3ee';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.66rem', fontWeight: 700, color,
      background: `${color}18`, borderRadius: '5px', padding: '2px 8px',
      border: `1px solid ${color}40`, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--border-color)', borderRadius: '10px',
  padding: '14px', background: 'rgba(255,255,255,0.02)',
};
const labelStyle: React.CSSProperties = {
  fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)',
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px',
};
const ctrlStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
  borderRadius: '7px', padding: '7px 10px', color: 'var(--text-primary)',
  fontSize: '0.8rem', fontFamily: 'inherit',
};

export default function DeliveryAcceptancePanel({
  campaign, client, brand, briefs,
  contentItems, approvalRequests, approvalEvents,
  userRole, actorLabel,
}: Props) {
  // ── Local mock state only — no persistence, no network. ──
  const [feedback, setFeedback] = useState<DeliveryFeedbackEntry[]>(() => sampleDeliveryFeedback());
  const [acceptanceState, setAcceptanceState] = useState<DeliveryAcceptanceState>('shared_for_review_mock');
  const [draftMessage, setDraftMessage] = useState('');
  const [draftType, setDraftType] = useState<DeliveryFeedbackType>('general_comment');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canAct = can.exportPacks(userRole);

  // Resolve the SAME campaign context + APPROVED deliverables as Phase Q/R/S, then
  // derive the Phase R publishing readiness that GATES the owner-ready transition.
  const context = useMemo(() => resolveCampaignPackContext({
    campaign,
    clients: client ? [client] : [],
    brands: brand ? [brand] : [],
    briefs,
  }), [campaign, client, brand, briefs]);

  const items = useMemo(() => collectCampaignPackItems({
    campaignId: campaign.id,
    contentItems,
    approvalRequests,
    approvalEvents,
    deliveryMap: {},
  }), [campaign.id, contentItems, approvalRequests, approvalEvents]);

  const checklist = useMemo(
    () => buildManualPublishingChecklist({ context, items, approvalRequests }),
    [context, items, approvalRequests],
  );
  const publishingOverall = checklist.summary.overall_status;

  const room = useMemo(
    () => buildDeliveryAcceptanceRoom({ state: acceptanceState, feedback, publishingOverall }),
    [acceptanceState, feedback, publishingOverall],
  );

  // ── Local mock mutators (no external effect) ──
  const handleAddFeedback = useCallback(() => {
    if (!canAct) return;
    const message = draftMessage.trim();
    if (!message) return;
    setFeedback(prev => addDeliveryFeedback(prev, { message, type: draftType }));
    setDraftMessage('');
  }, [canAct, draftMessage, draftType]);

  const handleSetFeedbackStatus = useCallback((id: string, status: DeliveryFeedbackStatus) => {
    if (!canAct) return;
    setFeedback(prev => setDeliveryFeedbackStatus(prev, id, status));
  }, [canAct]);

  const handleRemoveFeedback = useCallback((id: string) => {
    if (!canAct) return;
    setFeedback(prev => removeDeliveryFeedback(prev, id));
  }, [canAct]);

  const handleTransition = useCallback((to: DeliveryAcceptanceState) => {
    if (!canAct) return;
    const result = transitionAcceptance(acceptanceState, to, { publishingOverall });
    if (result.ok) setAcceptanceState(result.state);
  }, [canAct, acceptanceState, publishingOverall]);

  const handleCopy = useCallback(async () => {
    if (!canAct) return;
    const text = renderDeliveryAcceptanceText(room, `${room.state_label}`);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('delivery-acceptance-text') as HTMLTextAreaElement | null;
      if (el) { el.value = text; el.select(); }
    }
  }, [canAct, room]);

  const previewText = useMemo(() => renderDeliveryAcceptanceText(room, room.state_label), [room]);
  const stateColor = DELIVERY_ACCEPTANCE_STATE_COLOR[acceptanceState];
  const stateIndex = DELIVERY_ACCEPTANCE_STATES.indexOf(acceptanceState);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${ACCENT}` }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <MessageSquare size={18} style={{ color: ACCENT }} /> Client Feedback & Delivery Acceptance — Local Mock
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {room.local_only_badges.map(b => <Badge key={b} label={b} color={ACCENT} />)}
          <Badge label="Not Published" color="#fbbf24" />
        </div>
      </div>

      {/* ── Safety banner: mock-only + Client accepted ≠ Published ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: ACCENT, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#a5f3fc' }}>
          <strong>{room.client_accepted_not_published_message}</strong>{' '}
          {room.mock_note}
        </div>
      </div>

      {/* ── Delivery acceptance state ladder ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={labelStyle}><ListChecks size={11} style={{ marginRight: '4px' }} />Delivery Acceptance</div>

        {/* current state callout */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', marginBottom: '12px',
          borderRadius: '9px', background: `${stateColor}12`, border: `1px solid ${stateColor}40`,
        }}>
          <CheckCircle2 size={15} style={{ color: stateColor, flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            <strong style={{ color: stateColor }}>{room.state_label}</strong>{' '}
            <span style={{ color: 'var(--text-muted)' }}>· {room.state_description}</span>
          </div>
        </div>

        {/* ordered ladder of states */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {DELIVERY_ACCEPTANCE_STATES.map((s, i) => {
            const active = i === stateIndex;
            const done = i < stateIndex;
            const color = DELIVERY_ACCEPTANCE_STATE_COLOR[s];
            return (
              <span key={s} style={{
                fontSize: '0.66rem', fontWeight: active ? 800 : 600,
                color: active ? color : done ? 'var(--text-secondary)' : 'var(--text-muted)',
                background: active ? `${color}1f` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? `${color}55` : 'var(--border-color)'}`,
                borderRadius: '5px', padding: '3px 8px',
              }}>
                {i + 1}. {DELIVERY_ACCEPTANCE_STATE_LABEL[s]}
              </span>
            );
          })}
        </div>

        {/* gate notice for owner-ready */}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
          {DELIVERY_ACCEPTANCE_OWNER_READY_REQUIRES_CHECKLIST}{' '}
          Phase R checklist: <strong style={{ color: room.publishing_checklist_ready ? '#34d399' : '#fbbf24' }}>
            {room.publishing_checklist_ready ? 'ready' : 'not ready yet'}
          </strong>.
        </div>

        {/* transition buttons */}
        {canAct ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {room.next_states.map(to => {
              const isOwnerReady = to === 'owner_ready_for_manual_publish';
              const blocked = isOwnerReady && !room.can_mark_owner_ready_for_manual_publish;
              const color = DELIVERY_ACCEPTANCE_STATE_COLOR[to];
              return (
                <button
                  key={to}
                  onClick={() => handleTransition(to)}
                  disabled={blocked}
                  title={blocked ? (room.owner_ready_blocked_reason ?? '') : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '7px',
                    fontSize: '0.76rem', fontWeight: 600, fontFamily: 'inherit',
                    background: blocked ? 'rgba(255,255,255,0.03)' : `${color}1f`,
                    border: `1px solid ${blocked ? 'var(--border-color)' : `${color}55`}`,
                    color: blocked ? 'var(--text-muted)' : color,
                    cursor: blocked ? 'not-allowed' : 'pointer', opacity: blocked ? 0.7 : 1,
                  }}>
                  {blocked ? <Lock size={12} /> : <Check size={12} />}
                  Move to: {DELIVERY_ACCEPTANCE_STATE_LABEL[to]}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            View-only access — you can preview the mock acceptance flow but not change it.
          </div>
        )}

        {room.next_actions.length > 0 && (
          <ul style={{ margin: '12px 0 0', paddingLeft: '18px', fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {room.next_actions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}
      </div>

      {/* ── Client feedback panel (mock) ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ ...labelStyle, marginBottom: 0 }}><MessageSquare size={11} style={{ marginRight: '4px' }} />Client Feedback · mock intake</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <Badge label={`${room.feedback_summary.open_count} open`} color="#fb923c" />
            <Badge label={`${room.feedback_summary.acknowledged_count} ack`} color="#60a5fa" />
            <Badge label={`${room.feedback_summary.resolved_count} resolved`} color="#34d399" />
          </div>
        </div>

        {/* add-feedback form (local mock) */}
        {canAct && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', margin: '12px 0' }}>
            <select value={draftType} onChange={e => setDraftType(e.target.value as DeliveryFeedbackType)} style={{ ...ctrlStyle, cursor: 'pointer' }}>
              {DELIVERY_FEEDBACK_TYPES.map(t => <option key={t} value={t}>{DELIVERY_FEEDBACK_TYPE_LABEL[t]}</option>)}
            </select>
            <input
              value={draftMessage}
              onChange={e => setDraftMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddFeedback(); }}
              placeholder="Record a mock client comment (sample)…"
              style={{ ...ctrlStyle, flex: '1 1 240px', minWidth: '180px' }}
            />
            <button onClick={handleAddFeedback} disabled={!draftMessage.trim()} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '7px',
              fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit',
              background: draftMessage.trim() ? `${ACCENT}26` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${draftMessage.trim() ? `${ACCENT}73` : 'var(--border-color)'}`,
              color: draftMessage.trim() ? ACCENT : 'var(--text-muted)',
              cursor: draftMessage.trim() ? 'pointer' : 'not-allowed',
            }}>
              <Plus size={13} /> Add mock feedback
            </button>
          </div>
        )}

        {/* feedback list */}
        {room.feedback.length === 0 ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '10px' }}>No mock feedback recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: canAct ? 0 : '12px' }}>
            {room.feedback.map(f => {
              const typeColor = DELIVERY_FEEDBACK_TYPE_COLOR[f.type];
              const statusColor = DELIVERY_FEEDBACK_STATUS_COLOR[f.status];
              return (
                <div key={f.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', background: 'rgba(0,0,0,0.18)' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '5px' }}>
                    <Badge label={DELIVERY_FEEDBACK_TYPE_LABEL[f.type]} color={typeColor} />
                    <Badge label={DELIVERY_FEEDBACK_STATUS_LABEL[f.status]} color={statusColor} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.author_label}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.message}</div>
                  {canAct && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {f.status !== 'acknowledged' && (
                        <button onClick={() => handleSetFeedbackStatus(f.id, 'acknowledged')} style={miniBtn('#60a5fa')}>
                          <Check size={11} /> Acknowledge
                        </button>
                      )}
                      {f.status !== 'resolved' && (
                        <button onClick={() => handleSetFeedbackStatus(f.id, 'resolved')} style={miniBtn('#34d399')}>
                          <CheckCircle2 size={11} /> Resolve
                        </button>
                      )}
                      {f.status !== 'open' && (
                        <button onClick={() => handleSetFeedbackStatus(f.id, 'open')} style={miniBtn('#fb923c')}>
                          <RotateCcw size={11} /> Reopen
                        </button>
                      )}
                      <button onClick={() => handleRemoveFeedback(f.id)} style={miniBtn('#f87171')}>
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {room.feedback_summary.has_open_revision_request && (
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center', marginTop: '12px', fontSize: '0.74rem', color: '#fbbf24' }}>
            <AlertTriangle size={13} /> An open revision request is recorded — route the campaign back for internal edits, then re-share (mock).
          </div>
        )}
      </div>

      {/* ── Local helper actions (no external service, no public link) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
        {canAct && (
          <button onClick={handleCopy} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
            background: `${ACCENT}26`, border: `1px solid ${ACCENT}73`, color: ACCENT, cursor: 'pointer',
          }}>
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copied ? 'Copied!' : 'Copy acceptance summary'}
          </button>
        )}
        <button onClick={() => setShowPreview(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Hide acceptance preview' : 'Preview acceptance summary'}
        </button>
      </div>

      {showPreview && (
        <textarea
          readOnly
          value={previewText}
          style={{
            width: '100%', minHeight: '260px', marginTop: '12px', background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px',
            fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: '#e2e8f0',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      )}

      {/* Hidden textarea fallback for clipboard-unavailable environments. */}
      <textarea id="delivery-acceptance-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
        Local mock review for {actorLabel || 'the Owner/team'} — not a real client portal. Nothing is emailed, made public, notified, or synced. Core does not auto-post, schedule, launch, or spend.
      </p>
    </div>
  );
}

function miniBtn(color: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '6px',
    fontSize: '0.7rem', fontWeight: 600, fontFamily: 'inherit',
    background: `${color}1a`, border: `1px solid ${color}40`, color, cursor: 'pointer',
  };
}
