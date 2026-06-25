// Delivery Closure & Manual Publishing Handoff Control — Phase U
// ---------------------------------------------------------------------------
// A SAFE, LOCAL/DEMO closeout layer that sits below the Phase T Delivery
// Acceptance Room inside the Campaign Production Workspace. After a client has
// accepted a delivery, it makes the after-acceptance situation explicit so the
// Owner/team can close a campaign delivery safely:
//
//   • Local/demo only: NO email, NO public/share URL, NO notification, NO connector,
//     NO network call. Closure status, checklist confirmations, manual publish mark,
//     closure notes, and the audit trail all live in this component's local React
//     state, seeded by the deterministic `sampleClosureAudit` mock.
//   • Client accepted ≠ Published, and "Ready for manual publishing" is STILL not
//     published. "Manually marked as published" only RECORDS that a person published
//     manually OUTSIDE CORE — Core never publishes, posts, schedules, launches, or
//     spends. The mark is NEVER auto-set; it requires an explicit operator action.
//   • Nothing here mutates approval state. Approval decisions stay in the Approval
//     Queue; this panel only records local closure/handoff state.
//
// Self-contained on purpose so the parent CampaignWorkspace stays stateless and its
// Phase K source-scan safety test keeps holding. A source-scan test
// (`DeliveryClosurePanel.source.test.ts`) enforces the safety posture.
// See CLAUDE.md §4 (Safety), §6 (Output Status Model).
// ---------------------------------------------------------------------------
import React, { useMemo, useState, useCallback } from 'react';
import {
  PackageCheck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Check,
  Square,
  CheckSquare,
  ClipboardCopy,
  Eye,
  EyeOff,
  Lock,
  History,
  Flag,
  XCircle,
  RotateCcw,
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
  buildDeliveryAcceptanceRoom,
  sampleDeliveryFeedback,
  DELIVERY_ACCEPTANCE_STATES,
  DELIVERY_ACCEPTANCE_STATE_LABEL,
  type DeliveryAcceptanceState,
} from '../../lib/core/deliveryAcceptance';
import {
  buildDeliveryClosure,
  renderDeliveryClosureText,
  appendClosureAudit,
  listClosureAudit,
  sampleClosureAudit,
  CLOSURE_AUDIT_EVENT_LABEL,
  DELIVERY_CLOSURE_STATUS_COLOR,
  type ManualPublishMark,
  type ClosureChecklistConfirms,
  type ClosureChecklistKey,
  type ClosureAuditEntry,
} from '../../lib/core/deliveryClosure';

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

const ACCENT = '#a78bfa';

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

export default function DeliveryClosurePanel({
  campaign, client, brand, briefs,
  contentItems, approvalRequests, approvalEvents,
  userRole, actorLabel,
}: Props) {
  // ── Local/demo state only — no persistence, no network. ──
  const [acceptanceState, setAcceptanceState] = useState<DeliveryAcceptanceState>('client_accepted');
  const [confirms, setConfirms] = useState<ClosureChecklistConfirms>({});
  const [feedbackCarriedForward, setFeedbackCarriedForward] = useState(false);
  const [manualPublishMark, setManualPublishMark] = useState<ManualPublishMark>('none');
  const [externalPublishingOwner, setExternalPublishingOwner] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [audit, setAudit] = useState<ClosureAuditEntry[]>(() => sampleClosureAudit());
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canAct = can.exportPacks(userRole);

  // Resolve the SAME campaign context + APPROVED deliverables as Phase Q/R/S/T,
  // then derive the Phase R publishing readiness that feeds closure status.
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

  // Reuse the Phase T room ONLY to derive a feedback summary (seeded mock).
  const feedback = useMemo(() => sampleDeliveryFeedback(), []);
  const feedbackSummary = useMemo(
    () => buildDeliveryAcceptanceRoom({ state: acceptanceState, feedback, publishingOverall }).feedback_summary,
    [acceptanceState, feedback, publishingOverall],
  );

  const closure = useMemo(() => buildDeliveryClosure({
    acceptanceState,
    feedbackSummary,
    publishingOverall,
    checklistConfirms: confirms,
    feedbackCarriedForward,
    manualPublishMark,
    externalPublishingOwner,
    closureNotes,
  }), [acceptanceState, feedbackSummary, publishingOverall, confirms, feedbackCarriedForward, manualPublishMark, externalPublishingOwner, closureNotes]);

  const statusColor = DELIVERY_CLOSURE_STATUS_COLOR[closure.status];

  // ── Local mutators (no external effect) ──
  const recordAudit = useCallback((type: ClosureAuditEntry['type'], detail?: string) => {
    setAudit(prev => appendClosureAudit(prev, type, { detail }));
  }, []);

  const toggleConfirm = useCallback((key: ClosureChecklistKey) => {
    if (!canAct) return;
    setConfirms(prev => ({ ...prev, [key]: !prev[key] }));
  }, [canAct]);

  const handleRecordAcceptance = useCallback(() => {
    if (!canAct || !closure.client_accepted) return;
    recordAudit('client_acceptance_recorded', 'Client acceptance reviewed (local/mock).');
  }, [canAct, closure.client_accepted, recordAudit]);

  const handleRecordChecklistReviewed = useCallback(() => {
    if (!canAct || !closure.ready_to_close) return;
    recordAudit('closure_checklist_reviewed', 'Closure checklist reviewed by Owner (local/mock).');
  }, [canAct, closure.ready_to_close, recordAudit]);

  const handleRecordReady = useCallback(() => {
    if (!canAct || closure.status !== 'ready_for_manual_publishing') return;
    recordAudit('ready_for_manual_publishing_marked', 'Ready for manual publishing (local/mock).');
  }, [canAct, closure.status, recordAudit]);

  const handleMarkPublished = useCallback(() => {
    if (!canAct || !closure.ready_to_close) return;
    setManualPublishMark('marked_published');
    recordAudit('manually_marked_published', `Owner: ${externalPublishingOwner || actorLabel || 'team'} published manually outside CORE (local/mock).`);
  }, [canAct, closure.ready_to_close, externalPublishingOwner, actorLabel, recordAudit]);

  const handleCloseUnpublished = useCallback(() => {
    // Same safe-close gate as marking published — a mark never bypasses the gates.
    if (!canAct || !closure.ready_to_close) return;
    setManualPublishMark('closed_unpublished');
    recordAudit('closed_without_publishing', 'Delivery closed without publishing (local/mock).');
  }, [canAct, closure.ready_to_close, recordAudit]);

  const handleResetMark = useCallback(() => {
    if (!canAct) return;
    setManualPublishMark('none');
  }, [canAct]);

  const handleCopy = useCallback(async () => {
    if (!canAct) return;
    const text = renderDeliveryClosureText(closure, audit, campaign.name);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('delivery-closure-text') as HTMLTextAreaElement | null;
      if (el) { el.value = text; el.select(); }
    }
  }, [canAct, closure, audit, campaign.name]);

  const previewText = useMemo(() => renderDeliveryClosureText(closure, audit, campaign.name), [closure, audit, campaign.name]);
  const orderedAudit = useMemo(() => listClosureAudit(audit), [audit]);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${ACCENT}` }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <PackageCheck size={18} style={{ color: ACCENT }} /> Delivery Closure — Local/Demo
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {closure.local_only_badges.map(b => <Badge key={b} label={b} color={ACCENT} />)}
          <Badge label="Not Published" color="#fbbf24" />
        </div>
      </div>

      {/* ── Safety banner: Client accepted ≠ Published + publish outside CORE ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.28)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: ACCENT, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#ddd6fe' }}>
          <strong>{closure.client_accepted_not_published_message}</strong>{' '}
          <strong>{closure.publish_outside_core_message}</strong>{' '}
          {closure.safety_note}
        </div>
      </div>

      {/* ── Closure status callout ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={labelStyle}><Flag size={11} style={{ marginRight: '4px' }} />Closure Status</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px',
          borderRadius: '9px', background: `${statusColor}12`, border: `1px solid ${statusColor}40`,
        }}>
          <CheckCircle2 size={15} style={{ color: statusColor, flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            <strong style={{ color: statusColor }}>{closure.status_label}</strong>{' '}
            <span style={{ color: 'var(--text-muted)' }}>· {closure.status_description}</span>
          </div>
        </div>
      </div>

      {/* ── Acceptance summary ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div style={{ ...labelStyle, marginBottom: 0 }}><ListChecks size={11} style={{ marginRight: '4px' }} />Acceptance Summary</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <Badge label={closure.client_accepted ? 'Client accepted' : 'Not accepted'} color={closure.client_accepted ? '#34d399' : '#94a3b8'} />
            <Badge label={`${closure.unresolved_feedback_count} unresolved`} color={closure.unresolved_feedback_count > 0 ? '#fb923c' : '#34d399'} />
            <Badge label={`${closure.resolved_feedback_count} resolved`} color="#34d399" />
            <Badge label={`Phase R: ${closure.publishing_checklist_ready ? 'ready' : 'not ready'}`} color={closure.publishing_checklist_ready ? '#34d399' : '#fbbf24'} />
          </div>
        </div>

        {/* acceptance state selector (local/mock preview) */}
        {canAct ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Acceptance state (mock):</span>
            <select value={acceptanceState} onChange={e => setAcceptanceState(e.target.value as DeliveryAcceptanceState)} style={{ ...ctrlStyle, cursor: 'pointer' }}>
              {DELIVERY_ACCEPTANCE_STATES.map(s => <option key={s} value={s}>{DELIVERY_ACCEPTANCE_STATE_LABEL[s]}</option>)}
            </select>
            <button onClick={handleRecordAcceptance} disabled={!closure.client_accepted} style={miniBtn('#34d399', !closure.client_accepted)}>
              <Check size={11} /> Record client acceptance
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            View-only access — you can preview the closure state but not change it.
          </div>
        )}

        {/* unresolved feedback warning */}
        {closure.unresolved_feedback_warning && (
          <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', marginTop: '12px', padding: '8px 11px', borderRadius: '8px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', fontSize: '0.74rem', color: '#fbbf24' }}>
            <AlertTriangle size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
            <div>
              {closure.unresolved_feedback_warning}
              {canAct && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={feedbackCarriedForward} onChange={e => setFeedbackCarriedForward(e.target.checked)} />
                  Carry unresolved feedback forward as a follow-up
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Manual publishing checklist (closure gates) ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <div style={{ ...labelStyle, marginBottom: 0 }}><ListChecks size={11} style={{ marginRight: '4px' }} />Manual Publishing Checklist</div>
          <Badge label={closure.checklist_complete ? 'All gates satisfied' : 'Incomplete'} color={closure.checklist_complete ? '#34d399' : '#fbbf24'} />
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
          A human reviews each gate before closing. {closure.publish_outside_core_message}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {closure.checklist.map(it => {
            const color = it.satisfied ? '#34d399' : '#94a3b8';
            return (
              <div key={it.key} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '9px 11px', background: 'rgba(0,0,0,0.18)' }}>
                <button
                  onClick={() => toggleConfirm(it.key)}
                  disabled={!canAct}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left',
                    background: 'transparent', border: 'none', color: 'var(--text-primary)',
                    fontFamily: 'inherit', fontSize: '0.81rem', fontWeight: 600,
                    cursor: canAct ? 'pointer' : 'default', padding: 0,
                  }}>
                  {it.satisfied
                    ? <CheckSquare size={15} style={{ color, flexShrink: 0 }} />
                    : <Square size={15} style={{ color: it.confirmed ? '#fbbf24' : 'var(--text-muted)', flexShrink: 0 }} />}
                  <span>{it.label}</span>
                </button>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0 23px' }}>{it.description}</div>
                {it.advisory && (
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', margin: '4px 0 0 23px', fontSize: '0.7rem', color: '#fbbf24' }}>
                    <AlertTriangle size={11} /> {it.advisory}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* external publishing owner */}
        {canAct && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>External publishing owner:</span>
            <input
              value={externalPublishingOwner}
              onChange={e => setExternalPublishingOwner(e.target.value)}
              placeholder="Name the person who will publish manually (sample)…"
              style={{ ...ctrlStyle, flex: '1 1 240px', minWidth: '180px' }}
            />
          </div>
        )}
      </div>

      {/* ── Manual publishing handoff controls ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={labelStyle}><Flag size={11} style={{ marginRight: '4px' }} />Manual Publishing Handoff</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          External publishing status: <strong style={{ color: statusColor }}>{closure.manual_publish_mark_label}</strong>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          {closure.no_automation_note}
        </p>

        {/* A requested mark that the safe-close gate did not allow is shown as NOT applied. */}
        {closure.manual_publish_mark_requested !== 'none' && !closure.manual_publish_mark_applied && (
          <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', marginBottom: '12px', padding: '8px 11px', borderRadius: '8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', fontSize: '0.74rem', color: '#f87171' }}>
            <AlertTriangle size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
            A manual mark was requested but is <strong>&nbsp;not applied</strong>&nbsp;— complete the closure checklist (client acceptance, feedback resolved/carried forward, Phase R readiness, and the external publishing owner) first.
          </div>
        )}

        {canAct ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleRecordChecklistReviewed} disabled={!closure.ready_to_close} style={actionBtn('#60a5fa', !closure.ready_to_close)} title={closure.ready_to_close ? undefined : 'Satisfy the closure checklist gates first.'}>
              <ListChecks size={13} /> Record checklist reviewed
            </button>
            <button onClick={handleRecordReady} disabled={closure.status !== 'ready_for_manual_publishing'} style={actionBtn('#34d399', closure.status !== 'ready_for_manual_publishing')}>
              <CheckCircle2 size={13} /> Record ready for manual publishing
            </button>
            <button onClick={handleMarkPublished} disabled={!closure.ready_to_close} style={actionBtn(ACCENT, !closure.ready_to_close)} title={closure.ready_to_close ? undefined : 'Complete the closure checklist before marking the manual publish status.'}>
              {closure.ready_to_close ? <Check size={13} /> : <Lock size={13} />} Mark published manually (outside CORE)
            </button>
            <button onClick={handleCloseUnpublished} disabled={!closure.ready_to_close} style={actionBtn('#f87171', !closure.ready_to_close)} title={closure.ready_to_close ? undefined : 'Complete the closure checklist before closing the delivery.'}>
              {closure.ready_to_close ? <XCircle size={13} /> : <Lock size={13} />} Close without publishing
            </button>
            {manualPublishMark !== 'none' && (
              <button onClick={handleResetMark} style={miniBtn('#94a3b8', false)}>
                <RotateCcw size={11} /> Reset mark
              </button>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            View-only access — the manual publishing handoff is read-only for your role.
          </div>
        )}
      </div>

      {/* ── Closure notes ── */}
      <div style={{ ...cardStyle, marginBottom: '14px' }}>
        <div style={labelStyle}><ClipboardCopy size={11} style={{ marginRight: '4px' }} />Closure Notes</div>
        {canAct ? (
          <textarea
            value={closureNotes}
            onChange={e => setClosureNotes(e.target.value)}
            placeholder="Internal closure notes — what was delivered, what is carried forward, who publishes manually (sample)…"
            style={{ ...ctrlStyle, width: '100%', minHeight: '70px', resize: 'vertical', boxSizing: 'border-box' }}
          />
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{closure.closure_notes || 'No closure notes recorded.'}</div>
        )}
      </div>

      {/* ── Audit trail (local/mock/demo) ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div style={{ ...labelStyle, marginBottom: 0 }}><History size={11} style={{ marginRight: '4px' }} />Closure Audit Trail</div>
          <Badge label="local/mock/demo state" color={ACCENT} />
        </div>
        {orderedAudit.length === 0 ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No closure events recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {orderedAudit.map(e => (
              <div key={e.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                <Check size={12} style={{ color: ACCENT, marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{CLOSURE_AUDIT_EVENT_LABEL[e.type]}</strong>
                  {e.detail && <span style={{ color: 'var(--text-muted)' }}> — {e.detail}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '10px 0 0' }}>
          Every event above is local/mock/demo state only — no real action occurred.
        </p>
      </div>

      {/* ── Local helper actions (no external service, no public link) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
        {canAct && (
          <button onClick={handleCopy} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
            background: `${ACCENT}26`, border: `1px solid ${ACCENT}73`, color: ACCENT, cursor: 'pointer',
          }}>
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copied ? 'Copied!' : 'Copy closure summary'}
          </button>
        )}
        <button onClick={() => setShowPreview(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Hide closure preview' : 'Preview closure summary'}
        </button>
      </div>

      {showPreview && (
        <textarea
          readOnly
          value={previewText}
          style={{
            width: '100%', minHeight: '280px', marginTop: '12px', background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px',
            fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: '#e2e8f0',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      )}

      {/* Hidden textarea fallback for clipboard-unavailable environments. */}
      <textarea id="delivery-closure-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
        Local/demo closeout for {actorLabel || 'the Owner/team'} — not a real client portal. Nothing is emailed, made public, notified, or synced. Core never publishes, posts, schedules, launches, or spends; publishing is completed manually outside CORE.
      </p>
    </div>
  );
}

function miniBtn(color: string, disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px',
    fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit',
    background: disabled ? 'rgba(255,255,255,0.03)' : `${color}1a`,
    border: `1px solid ${disabled ? 'var(--border-color)' : `${color}40`}`,
    color: disabled ? 'var(--text-muted)' : color,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1,
  };
}

function actionBtn(color: string, disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '7px',
    fontSize: '0.76rem', fontWeight: 600, fontFamily: 'inherit',
    background: disabled ? 'rgba(255,255,255,0.03)' : `${color}1f`,
    border: `1px solid ${disabled ? 'var(--border-color)' : `${color}55`}`,
    color: disabled ? 'var(--text-muted)' : color,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1,
  };
}
