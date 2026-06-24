// Client Delivery Room / Shareable Handoff View — Phase S
// ---------------------------------------------------------------------------
// A SAFE, read-only "delivery room" preview embedded in the Campaign Production
// Workspace (Phase K). It COMPOSES the Phase Q Campaign Pack (resolved context +
// APPROVED deliverables) and the Phase R Manual Publishing Checklist into ONE
// clean, client-facing handoff surface the Owner can COPY or manually share.
//
//   • Pure read of existing local data (the campaign's content items + approval
//     requests/events). No DB write, no network call, no upload, no posting.
//   • Building the room does NOT change any approval state — it only derives a
//     read-only view from items already in status `approved`.
//   • Helper actions are LOCAL only: "Copy client handoff summary" / "Copy manual
//     publishing checklist" write to the clipboard; "Preview delivery room" toggles
//     a local read-only preview. NONE calls an external service, and NONE creates a
//     real share/public URL, publishes, posts, schedules, or runs ads.
//   • Approved ≠ Published: the room always renders "Not Published" and the explicit
//     "Approved does not mean Published" + "Manual publishing only" messages — an
//     approved campaign is NEVER rendered as published.
//
// This panel owns its own UI state, which is why it lives in a separate component:
// the parent CampaignWorkspace stays stateless / display-only so its Phase K
// source-scan safety test (no useState, no mutation) keeps holding.
// See CLAUDE.md §4 (Safety), §6 (Output Status Model).
// ---------------------------------------------------------------------------
import React, { useMemo, useState, useCallback } from 'react';
import {
  DoorOpen,
  ShieldCheck,
  ClipboardCopy,
  Check,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
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
} from '../../lib/core/manualPublishingChecklist';
import {
  buildClientDeliveryRoom,
  renderClientDeliveryRoomText,
  DELIVERY_ROOM_READINESS_COLOR,
  type DeliveryRoomReadiness,
} from '../../lib/core/clientDeliveryRoom';

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

const ACCENT = '#a78bfa';

const READINESS_ICON: Record<DeliveryRoomReadiness, React.ReactNode> = {
  ready_for_manual_client_handoff: <CheckCircle2 size={15} />,
  delivery_not_ready:              <AlertTriangle size={15} />,
  not_client_ready:                <AlertTriangle size={15} />,
};

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

export default function ClientDeliveryRoomPanel({
  campaign, client, brand, briefs,
  contentItems, approvalRequests, approvalEvents,
  userRole, actorLabel,
}: Props) {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedChecklist, setCopiedChecklist] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canAct = can.exportPacks(userRole);

  // Resolve the SAME campaign context + APPROVED deliverables as Phase Q/R
  // (internal / draft-only). Delivery map is irrelevant to the handoff view → {}.
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

  const room = useMemo(
    () => buildClientDeliveryRoom({ context, items, checklist, approvalRequests }),
    [context, items, checklist, approvalRequests],
  );

  const readinessColor = DELIVERY_ROOM_READINESS_COLOR[room.readiness.status];

  const copyText = useCallback(async (text: string, mark: (v: boolean) => void, id: string) => {
    if (!canAct) return;
    try {
      await navigator.clipboard.writeText(text);
      mark(true);
      setTimeout(() => mark(false), 2000);
    } catch {
      const el = document.getElementById(id) as HTMLTextAreaElement | null;
      if (el) { el.value = text; el.select(); }
    }
  }, [canAct]);

  const handleCopySummary = useCallback(
    () => copyText(renderClientDeliveryRoomText(room), setCopiedSummary, 'delivery-room-summary-text'),
    [copyText, room],
  );
  const handleCopyChecklist = useCallback(
    () => copyText(renderManualPublishingChecklistText(checklist, room.title), setCopiedChecklist, 'delivery-room-summary-text'),
    [copyText, checklist, room.title],
  );

  const previewText = useMemo(() => renderClientDeliveryRoomText(room), [room]);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${ACCENT}` }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <DoorOpen size={18} style={{ color: ACCENT }} /> Client Delivery Room — Handoff Preview
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Badge label="Read-only · manual share" color={ACCENT} />
          <Badge label="Not Published" color="#fbbf24" />
        </div>
      </div>

      {/* ── Safety banner: Approved ≠ Published + manual-only + no public link ── */}
      <div style={{ padding: '10px 14px', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '9px', display: 'flex', gap: '9px', alignItems: 'flex-start', marginBottom: '14px' }}>
        <ShieldCheck size={15} style={{ color: ACCENT, marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#c4b5fd' }}>
          <strong>Approved ≠ Published.</strong>{' '}
          {room.approved_not_published_message}{' '}
          <strong>{room.manual_publishing_only_message}</strong>{' '}
          No public link is created — copy and share this handoff manually.
        </div>
      </div>

      {/* ── Readiness state callout ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 14px', marginBottom: '14px',
        borderRadius: '9px', background: `${readinessColor}12`, border: `1px solid ${readinessColor}40`,
      }}>
        <span style={{ color: readinessColor, flexShrink: 0 }}>{READINESS_ICON[room.readiness.status]}</span>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
          <strong style={{ color: readinessColor }}>{room.readiness.label}</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>
            · publishing readiness: {room.readiness.publishing_overall_label} · still <strong>Not Published</strong>
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }} className="dash-cols">

        {/* ── Client / campaign summary ── */}
        <div style={cardStyle}>
          <div style={labelStyle}>Client / Campaign</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Client</span><span>{room.client_summary.client_name}</span>
            <span style={{ color: 'var(--text-muted)' }}>Brand</span><span>{room.client_summary.brand_name}</span>
            <span style={{ color: 'var(--text-muted)' }}>Campaign</span><span>{room.client_summary.campaign_name}</span>
            <span style={{ color: 'var(--text-muted)' }}>Status</span><span>{room.client_summary.campaign_status}</span>
            {room.client_summary.duration_label && (<><span style={{ color: 'var(--text-muted)' }}>Duration</span><span>{room.client_summary.duration_label}</span></>)}
            <span style={{ color: 'var(--text-muted)' }}>Approved</span><span>{room.client_summary.approved_deliverables} deliverable{room.client_summary.approved_deliverables === 1 ? '' : 's'}</span>
          </div>
          {room.client_summary.module_breakdown.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
              {room.client_summary.module_breakdown.map(b => (
                <Badge key={b.module} label={`${b.label}: ${b.count}`} color={ACCENT} />
              ))}
            </div>
          )}
        </div>

        {/* ── Brand context snapshot ── */}
        <div style={cardStyle}>
          <div style={labelStyle}>Brand Context · internal / draft-only</div>
          {room.brand_snapshot ? (
            <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {room.brand_snapshot.positioning && <div><span style={{ color: 'var(--text-muted)' }}>Positioning: </span>{room.brand_snapshot.positioning}</div>}
              {room.brand_snapshot.content_pillars.length > 0 && <div><span style={{ color: 'var(--text-muted)' }}>Pillars: </span>{room.brand_snapshot.content_pillars.join(' · ')}</div>}
              {room.brand_snapshot.brand_voice.length > 0 && <div><span style={{ color: 'var(--text-muted)' }}>Voice: </span>{room.brand_snapshot.brand_voice.join(' · ')}</div>}
              {room.brand_snapshot.channels.length > 0 && <div><span style={{ color: 'var(--text-muted)' }}>Channels: </span>{room.brand_snapshot.channels.join(' · ')}</div>}
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No brand context resolved for this campaign.</div>
          )}
        </div>
      </div>

      {/* ── Included handoff sections ── */}
      <div style={{ ...cardStyle, marginTop: '14px' }}>
        <div style={labelStyle}>Included Handoff Sections</div>
        {room.sections.length === 0 ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            No approved deliverables yet — approve outputs in the Approval Queue first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {room.sections.map(s => (
              <div key={s.module}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '3px' }}>
                  {s.title} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({s.count})</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  {s.item_titles.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Approval + manual next steps ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start', marginTop: '14px' }} className="dash-cols">
        <div style={cardStyle}>
          <div style={labelStyle}>Approval Status</div>
          <div style={{ fontSize: '0.8rem' }}>{room.approval.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
            <Badge label={`${room.readiness.ready_count} ready`} color="#34d399" />
            <Badge label={`${room.readiness.manual_action_count} manual`} color="#60a5fa" />
            <Badge label={`${room.readiness.needs_review_count} needs review`} color="#fbbf24" />
            <Badge label={`${room.readiness.blocked_count} blocked`} color="#f87171" />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}><ListChecks size={11} style={{ marginRight: '4px' }} />Manual Next Steps</div>
          {room.next_steps.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nothing outstanding.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {room.next_steps.slice(0, 8).map((step, i) => <li key={i}>{step}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* ── Local helper actions (no external service, no public link) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
        {canAct ? (
          <>
            <button onClick={handleCopySummary} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
              background: `${ACCENT}26`, border: `1px solid ${ACCENT}73`, color: ACCENT, cursor: 'pointer',
            }}>
              {copiedSummary ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copiedSummary ? 'Copied!' : 'Copy client handoff summary'}
            </button>
            <button onClick={handleCopyChecklist} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
              {copiedChecklist ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copiedChecklist ? 'Copied!' : 'Copy manual publishing checklist'}
            </button>
          </>
        ) : (
          <div style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            View-only access — you can preview the delivery room but not copy the handoff.
          </div>
        )}
        <button onClick={() => setShowPreview(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', fontSize: '0.8rem', fontWeight: 600,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Hide delivery room preview' : 'Preview delivery room'}
        </button>
      </div>

      {showPreview && (
        <textarea
          readOnly
          value={previewText}
          style={{
            width: '100%', minHeight: '320px', marginTop: '12px', background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px',
            fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: '#e2e8f0',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      )}

      {/* Hidden textarea fallback for clipboard-unavailable environments. */}
      <textarea id="delivery-room-summary-text" readOnly aria-hidden style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '12px 0 0' }}>
        Internal handoff preview for {actorLabel || 'the Owner/team'} — copy and share manually. Core does not auto-post, schedule, launch, or spend.
      </p>
    </div>
  );
}
