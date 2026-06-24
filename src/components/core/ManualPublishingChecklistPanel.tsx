// Manual Publishing Checklist & Delivery Readiness — Phase R
// ---------------------------------------------------------------------------
// A SAFE, read-only readiness panel embedded in the Campaign Production Workspace
// (Phase K), sitting on top of the Phase Q Campaign Pack. It shows the Owner/team
// whether ONE campaign's Owner-APPROVED deliverables are ready to be MANUALLY
// published — WITHOUT performing any publishing action.
//
//   • Pure read of existing local data (the campaign's content items + approval
//     requests/events). No DB write, no network call, no upload, no posting.
//   • Building the checklist does NOT change any approval state — it only derives
//     a readiness view from items already in status `approved`
//     (collectCampaignPackItems filters; buildManualPublishingChecklist is pure).
//   • "Mark ready for manual handoff" is a LOCAL acknowledgement only — it records
//     nothing externally, sends nothing, and never publishes. The actual publish
//     is a separate manual human step done by a person OUTSIDE Core.
//   • "Approved ≠ Published" + "No auto-posting. Owner/team must publish manually."
//     stay visible on the panel (manualPublishingChecklist.ts safety copy).
//
// This panel owns its own UI state, which is why it lives in a separate component:
// the parent CampaignWorkspace stays stateless / display-only so its Phase K
// source-scan safety test (no useState, no mutation) keeps holding.
// See CLAUDE.md §4 (Safety), §6 (Output Status Model).
// ---------------------------------------------------------------------------
import React, { useMemo, useState, useCallback } from 'react';
import {
  ListChecks,
  ShieldCheck,
  ClipboardCopy,
  Check,
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Hand,
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
import {
  buildManualPublishingChecklist,
  renderManualPublishingChecklistText,
  MANUAL_PUBLISHING_SAFETY_NOTICE,
  MANUAL_PUBLISHING_ONLY_NOTE,
  CHECKLIST_STATUS_LABEL,
  CHECKLIST_STATUS_COLOR,
  CHECKLIST_OWNER_LABEL,
  OVERALL_STATUS_LABEL,
  OVERALL_STATUS_COLOR,
  type ChecklistStatus,
} from '../../lib/core/manualPublishingChecklist';

interface Props {
  campaign: Campaign;
  client: Client | null;
  brand: Brand | null;
  /** Briefs already scoped to this campaign (may be empty). */
  briefs: CampaignBrief[];
  /** Content plan items already scoped to this campaign. */
  contentItems: ContentPlanItem[];
  /** Approval requests already scoped to this campaign. */
  approvalRequests: ContentApprovalRequest[];
  /** Approval events already scoped to this campaign (Phase P audit trail). */
  approvalEvents: ContentApprovalEvent[];
  userRole: RoleName | null;
  actorLabel: string;
}

const STATUS_ICON: Record<ChecklistStatus, React.ReactNode> = {
  ready:                  <CheckCircle2 size={15} />,
  needs_owner_review:     <AlertTriangle size={15} />,
  blocked:                <AlertTriangle size={15} />,
  manual_action_required: <Hand size={15} />,
};

function StatusBadge({ label, color }: { label: string; color: string }) {
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

export default function ManualPublishingChecklistPanel({
  campaign, client, brand, briefs,
  contentItems, approvalRequests, approvalEvents,
  userRole, actorLabel,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Owner/manager can copy the checklist and record the local handoff note.
  const canAct = can.exportPacks(userRole);

  // Resolve the same campaign context + APPROVED deliverables the Campaign Pack
  // uses (internal / draft-only — never a live source). Delivery map is irrelevant
  // to readiness, so we pass an empty map (no localStorage read needed here).
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

  const { summary } = checklist;
  const overallColor = OVERALL_STATUS_COLOR[summary.overall_status];
  const readyForHandoff = summary.overall_status === 'ready_for_manual_publishing';

  const packTitle = `${brand?.name ?? 'Campaign'} — ${campaign.name}`;

  const handleCopy = useCallback(async () => {
    if (!canAct) return;
    const text = renderManualPublishingChecklistText(checklist, packTitle);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('manual-publishing-checklist-text') as HTMLTextAreaElement | null;
      if (el) { el.value = text; el.select(); }
    }
  }, [canAct, checklist, packTitle]);

  // LOCAL acknowledgement only — records nothing externally, sends nothing, never
  // publishes. It simply notes that a human has read the checklist and will
  // publish manually outside Core. (actorLabel is shown for the local note only.)
  const handleMarkReady = useCallback(() => {
    if (!canAct || !readyForHandoff) return;
    setAcknowledged(true);
  }, [canAct, readyForHandoff]);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #60a5fa' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <ListChecks size={18} style={{ color: '#60a5fa' }} /> Manual Publishing Checklist — Delivery Readiness
        </h3>
        <StatusBadge label={OVERALL_STATUS_LABEL[summary.overall_status]} color={overallColor} />
      </div>

      {/* ── Safety line (Approved ≠ Published + manual-only) ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: '#60a5fa', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#93c5fd' }}>
          <strong>Approved ≠ Published.</strong>{' '}
          {MANUAL_PUBLISHING_SAFETY_NOTICE}{' '}
          <strong>{MANUAL_PUBLISHING_ONLY_NOTE}</strong> This checklist shows readiness only — it does not post, schedule, launch, or spend.
        </div>
      </div>

      {/* ── Readiness summary counts ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <StatusBadge label={`${summary.ready_count} ready`} color={CHECKLIST_STATUS_COLOR.ready} />
        <StatusBadge label={`${summary.manual_action_required_count} manual action`} color={CHECKLIST_STATUS_COLOR.manual_action_required} />
        <StatusBadge label={`${summary.needs_owner_review_count} needs review`} color={CHECKLIST_STATUS_COLOR.needs_owner_review} />
        <StatusBadge label={`${summary.blocked_count} blocked`} color={CHECKLIST_STATUS_COLOR.blocked} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          {summary.total_items} checks across {checklist.sections.length} sections
        </span>
      </div>

      {/* ── Sections ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {checklist.sections.map(section => (
          <div key={section.key} style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{section.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {section.items.map(item => {
                const color = CHECKLIST_STATUS_COLOR[item.status];
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <span style={{ color, marginTop: '1px', flexShrink: 0 }}>{STATUS_ICON[item.status]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                        <StatusBadge label={CHECKLIST_STATUS_LABEL[item.status]} color={color} />
                        <StatusBadge label={CHECKLIST_OWNER_LABEL[item.owner]} color="#94a3b8" />
                        {item.source_label && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.source_label}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.description}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CircleDashed size={11} style={{ flexShrink: 0 }} /> {item.action_hint}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Actions (no real Publish button — copy + local handoff note only) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
        {canAct ? (
          <>
            <button onClick={handleCopy} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.45)',
              color: '#60a5fa', cursor: 'pointer',
            }}>
              {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copied ? 'Copied!' : 'Copy manual checklist'}
            </button>
            <button
              onClick={handleMarkReady}
              disabled={!readyForHandoff || acknowledged}
              title={readyForHandoff ? 'Local note only — Core does not publish or send anything.' : 'Resolve blockers / reviews before marking ready.'}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
                background: acknowledged ? 'rgba(52,211,153,0.15)' : readyForHandoff ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${acknowledged ? 'rgba(52,211,153,0.45)' : 'var(--border-color)'}`,
                color: acknowledged ? '#34d399' : readyForHandoff ? 'var(--text-secondary)' : 'var(--text-muted)',
                cursor: readyForHandoff && !acknowledged ? 'pointer' : 'not-allowed',
              }}
            >
              {acknowledged ? <Check size={14} /> : <Hand size={14} />}
              {acknowledged ? 'Marked ready (local note)' : 'Mark ready for manual handoff'}
            </button>
          </>
        ) : (
          <div style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            View-only access — you can review the readiness checklist but not copy or mark handoff.
          </div>
        )}
      </div>

      {acknowledged && (
        <div style={{ marginTop: '10px', padding: '9px 12px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', fontSize: '0.74rem', color: '#6ee7b7' }}>
          Local readiness note recorded{actorLabel ? ` by ${actorLabel}` : ''}. <strong>Approved ≠ Published</strong> — nothing was posted, scheduled, launched, or spent. Publish manually on each channel when you are ready.
        </div>
      )}

      {/* Hidden textarea fallback for clipboard-unavailable environments. */}
      <textarea id="manual-publishing-checklist-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />
    </div>
  );
}
