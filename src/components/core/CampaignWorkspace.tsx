// Campaign Production Workspace — Phase K (Campaign Drill-down & Client Workspace)
// ---------------------------------------------------------------------------
// An Owner-facing drill-down for ONE active client/campaign. It is DISPLAY +
// NAVIGATION only:
//   • the only interactive controls select which campaign to inspect (`onSelect`)
//     or switch tabs (`onNavigate`) — they Review / Preview / View, they never
//     publish, post, launch, spend, or activate a connector,
//   • every figure is derived from data already in the local pipeline (passed in
//     as props); nothing is fetched, and connector safety is a read-only
//     projection of the offline activation ledger (all live caps hard `false`),
//   • approval-first stays visible ("Approved ≠ Published", Owner approval
//     required, live connectors blocked, manual confirmation outside CORE).
// A source-scan test (`CampaignWorkspace.source.test.ts`) enforces that no
// publish / post / ads-launch / activate / fetch / live-connector wording leaks,
// and that this component itself stays stateless (it holds no local UI state).
//
// Phase Q (Client-ready Campaign Pack Export) adds ONE local export feature via
// the self-contained <CampaignPackPanel> child — that panel owns its own UI
// state so this parent stays display-only. Its export is copy/download a local
// .md/.txt file of this campaign's APPROVED deliverables — Core still never
// emails, posts, schedules, launches, spends, or pulls live analytics.
//
// Phase R (Manual Publishing Checklist & Delivery Readiness) adds the read-only
// <ManualPublishingChecklistPanel> child — it derives whether this campaign's
// APPROVED deliverables are ready to be MANUALLY published (sections + readiness
// summary), again without performing any publishing action. "Approved ≠ Published"
// stays explicit and Core still never posts, schedules, launches, or spends.
//
// Phase S (Client Delivery Room / Shareable Handoff View) adds the read-only
// <ClientDeliveryRoomPanel> child — it COMPOSES the Phase Q pack + Phase R checklist
// into a clean client-facing handoff preview the Owner can COPY or manually share.
// It creates NO public/share URL, publishes nothing, and always renders "Not
// Published" with the explicit "Approved does not mean Published" message.
//
// Phase T (Client Feedback Intake & Delivery Acceptance) adds the self-contained
// <DeliveryAcceptancePanel> child — a LOCAL/MOCK preview of how client feedback and
// delivery acceptance would be captured. It sends nothing, creates no public/share
// URL, fires no notification, uses no connector, and never publishes: "client_accepted
// ≠ Published" and "owner_ready_for_manual_publish" stays gated behind the Phase R
// checklist as a manual, Owner-controlled step.
//
// Phase U (Delivery Closure & Manual Publishing Handoff Control) adds the self-contained
// <DeliveryClosurePanel> child — a LOCAL/DEMO closeout layer that makes the after-
// acceptance situation explicit. It derives a closure status, surfaces unresolved
// feedback, a manual publishing checklist, an external publishing owner, closure notes,
// and a local audit trail. "Client accepted ≠ Published" stays visible, publishing is
// completed MANUALLY outside CORE, and "manually marked as published" is an explicit
// operator annotation only — Core never publishes, posts, schedules, launches, or spends.
//
// Phase V (Manual Publishing Evidence & Result Intake Room) adds the self-contained
// <ManualPublishingEvidencePanel> child — a LOCAL/DEMO post-delivery evidence layer that
// lets the Owner MANUALLY RECORD whether delivered assets were actually published outside
// CORE. It captures a publish status (not_published / manually_published /
// scheduled_outside_core / blocked_or_cancelled), Owner-provided evidence (channel,
// publishedBy, publicUrl, screenshot note), a result data source, and optional manual
// metrics — then drafts a post-publish report that labels provided vs simulated/unverified
// data and flags missing data. "CORE does not publish", "No live analytics connected", and
// "Manual evidence only" stay visible; Core publishes nothing and pulls no analytics.
//
// Phase W (Manual Publishing Result Review & Campaign Learning Loop) adds the
// <ManualResultReviewPanel> child — a LOCAL/DEMO REVIEW layer that REVIEWS (never gathers)
// the Owner-provided manual result data and derives a deterministic review status
// (no_manual_evidence / evidence_logged_result_pending / provided_manual_result_reviewed),
// a result summary, evidence/attribution/confidence quality, risk flags (incomplete
// conversion, weak attribution, complaint, stockout, content-accuracy, timing), repeat/avoid
// recommendations, next actions, and a Brand Brain LEARNING CANDIDATE PREVIEW. "Manual review
// only", "No live analytics", "Does not change Published status", and "Learning candidate
// only — Not persisted to Brand Brain yet" stay visible; it pulls no analytics, calls no
// connector, and never writes/auto-updates Brand Brain.
//
// To keep this workspace STATELESS (Phase K guard) while letting Phase W review the SAME
// evidence the Owner records in Phase V, both panels are rendered by the small stateful
// <ManualPublishingEvidenceSection> wrapper, which owns the single shared evidence state
// (default EMPTY — nothing is "published/reviewed" until the Owner records manual evidence).
// See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output Status), §7 (Connectors).
// ---------------------------------------------------------------------------
import React from 'react';
import {
  Building2,
  Store,
  ClipboardList,
  ListChecks,
  Image as ImageIcon,
  FileBarChart,
  ShieldCheck,
  Lock,
  Activity,
  ChevronRight,
  Check,
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
  AssetItem,
  LocalAutomationLog,
} from '../../types/core';
import {
  APPROVAL_STATUS_LABEL,
  APPROVAL_STATUS_COLOR,
  CONTENT_ITEM_STATUS_LABEL,
  CONTENT_ITEM_STATUS_COLOR,
  ASSET_APPROVAL_LABEL,
  ASSET_APPROVAL_COLOR,
  BRIEF_STATUS_LABEL,
  BRIEF_STATUS_COLOR,
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_COLOR,
} from '../../lib/core/coreData';
import { buildConnectorLedgerSummary } from '../../lib/core/connectors/connectorLedger';
import CampaignPackPanel from './CampaignPackPanel';
import ManualPublishingChecklistPanel from './ManualPublishingChecklistPanel';
import ClientDeliveryRoomPanel from './ClientDeliveryRoomPanel';
import DeliveryAcceptancePanel from './DeliveryAcceptancePanel';
import DeliveryClosurePanel from './DeliveryClosurePanel';
import ManualPublishingEvidenceSection from './ManualPublishingEvidenceSection';

export interface CampaignWorkspaceOption {
  id: string;
  name: string;
  brandName: string;
  clientName: string;
  status: string;
}

export interface CampaignWorkspaceProps {
  options: CampaignWorkspaceOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  client: Client | null;
  brand: Brand | null;
  campaign: Campaign | null;
  brief: CampaignBrief | null;
  /** Content plan items (AI outputs) already scoped to this campaign. */
  contentItems: ContentPlanItem[];
  /** Approval requests already scoped to this campaign. */
  approvals: ContentApprovalRequest[];
  /** Approval events already scoped to this campaign (Phase P audit trail). */
  approvalEvents: ContentApprovalEvent[];
  /** Assets already scoped to this campaign / its brand. */
  assets: AssetItem[];
  /** Recent activity log entries already scoped to this campaign. */
  activity: LocalAutomationLog[];
  /** Viewer role — gates the Phase Q campaign-pack build. */
  userRole: RoleName | null;
  /** Label of the acting user — stamped on a built campaign pack. */
  actorLabel: string;
  onNavigate: (tab: string) => void;
}

const LEDGER_SUMMARY = buildConnectorLedgerSummary();

function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, it) => {
    const k = key(it);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.64rem', fontWeight: 700, color,
      background: `${color}1f`, border: `1px solid ${color}55`,
      borderRadius: '9999px', padding: '2px 9px', textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function SectionCard({
  icon, title, accent, badge, children, footer,
}: {
  icon: React.ReactNode; title: string; accent: string;
  badge?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${accent}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <span style={{ color: accent, display: 'flex' }}>{icon}</span> {title}
        </h3>
        {badge}
      </div>
      {children}
      {footer && <div style={{ marginTop: '14px' }}>{footer}</div>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{value && value.trim() ? value : <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
    </div>
  );
}

function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClick}>
      {label} <ChevronRight size={14} />
    </button>
  );
}

export default function CampaignWorkspace({
  options, selectedId, onSelect,
  client, brand, campaign, brief,
  contentItems, approvals, approvalEvents, assets, activity,
  userRole, actorLabel,
  onNavigate,
}: CampaignWorkspaceProps) {

  // ── Empty state — no core campaigns to inspect yet. ──
  if (!campaign) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Building2 size={26} style={{ opacity: 0.6, marginBottom: '10px' }} />
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>No campaign to inspect yet</h3>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>Create a campaign and brief, then return here to drill into its production status.</p>
        <p style={{ fontSize: '0.72rem', margin: '6px 0 0' }}>Internal workspace · simulated data · approval-first.</p>
      </div>
    );
  }

  const aiByStatus = countBy(contentItems, ci => ci.status);
  const apprByStatus = countBy(approvals, a => a.status);
  const assetByStatus = countBy(assets, a => a.approval_status);

  const pendingApprovals = apprByStatus['submitted'] || 0;
  const revisionApprovals = apprByStatus['revision_requested'] || 0;
  const approvedItems = apprByStatus['approved'] || 0;
  const approvedAssets = assetByStatus['approved'] || 0;
  const briefStatus = brief?.status || 'draft';
  const briefReady = briefStatus === 'approved_for_generation' || briefStatus === 'ready_for_generation';
  const reportReady = approvedItems > 0;

  // ── Production pipeline stages (status feel, no live data). ──
  const stages = [
    { key: 'brief', label: 'Brief', state: briefReady ? 'Ready' : BRIEF_STATUS_LABEL[briefStatus] || 'Draft', color: briefReady ? 'var(--success)' : 'var(--warning)', count: brief ? 1 : 0 },
    { key: 'ai', label: 'AI Output', state: contentItems.length > 0 ? `${contentItems.length} draft${contentItems.length === 1 ? '' : 's'}` : 'None yet', color: contentItems.length > 0 ? 'var(--info)' : 'var(--text-muted)', count: contentItems.length },
    { key: 'approval', label: 'Approval', state: pendingApprovals > 0 ? `${pendingApprovals} pending` : approvedItems > 0 ? `${approvedItems} approved` : 'None yet', color: pendingApprovals > 0 ? 'var(--warning)' : approvedItems > 0 ? 'var(--success)' : 'var(--text-muted)', count: approvals.length },
    { key: 'assets', label: 'Assets', state: assets.length > 0 ? `${approvedAssets}/${assets.length} approved` : 'None yet', color: assets.length > 0 ? 'var(--info)' : 'var(--text-muted)', count: assets.length },
    { key: 'report', label: 'Report', state: reportReady ? 'Draft ready' : 'Waiting', color: reportReady ? 'var(--success)' : 'var(--text-muted)', count: reportReady ? 1 : 0 },
  ];

  // ── Next Owner Actions — recommendations only; review/view verbs, never publish. ──
  type NextAction = { key: string; label: string; hint: string; verb: string; tab: string; accent: string };
  const actions: NextAction[] = [];
  if (!briefReady) {
    actions.push({ key: 'brief', label: 'Brief is not marked ready for generation', hint: 'Review and finalise the brief before generating drafts.', verb: 'Review brief', tab: 'brief-intake', accent: 'var(--warning)' });
  }
  if (pendingApprovals > 0) {
    actions.push({ key: 'approve', label: `${pendingApprovals} item${pendingApprovals === 1 ? '' : 's'} awaiting your approval`, hint: 'Owner sign-off authorizes internal use only — Approved ≠ Published.', verb: 'View approvals', tab: 'approvals', accent: 'var(--warning)' });
  }
  if (revisionApprovals > 0) {
    actions.push({ key: 'revision', label: `${revisionApprovals} item${revisionApprovals === 1 ? '' : 's'} marked for revision`, hint: 'Re-check the draft, then approve once fixed.', verb: 'View approvals', tab: 'approvals', accent: 'var(--brand)' });
  }
  if (contentItems.length === 0) {
    actions.push({ key: 'generate', label: 'No AI drafts generated for this campaign yet', hint: 'Generate content drafts, then submit for approval.', verb: 'Preview output', tab: 'content-gen', accent: 'var(--info)' });
  }
  if (reportReady) {
    actions.push({ key: 'report', label: 'Approved items can feed a report draft', hint: 'Report Draft V1 is draft-only — no live analytics pull.', verb: 'View report draft', tab: 'reports', accent: 'var(--success)' });
  }
  actions.push({ key: 'safety', label: 'Confirm connector safety status', hint: `All ${LEDGER_SUMMARY.total} connectors are live blocked and read-only — nothing is live.`, verb: 'View connector safety', tab: 'connector-registry', accent: 'var(--success)' });

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header + campaign selector + safety strip ── */}
      <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--brand)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>Campaign Production Workspace</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Drill into one client/campaign. Internal · simulated data · nothing is published from this screen.
            </p>
          </div>
          <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Approval-first</span>
        </div>
        <div className="safety-ribbon" style={{ marginBottom: '14px' }}>
          <span>Approved ≠ Published</span>
          <span>Owner approval required</span>
          <span>No auto-post</span>
          <span>Live connectors blocked</span>
          <span>Manual confirmation outside CORE</span>
        </div>
        <div className="dash-section-label" style={{ marginBottom: '8px' }}>Select campaign to inspect</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          {options.map(o => {
            const isActive = o.id === selectedId;
            return (
              <button
                key={o.id}
                onClick={() => onSelect(o.id)}
                style={{
                  background: isActive ? 'rgba(244, 122, 31,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? 'rgba(244, 122, 31,0.5)' : 'var(--border-color)'}`,
                  borderRadius: '10px', padding: '11px 13px', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isActive ? '#fb923c' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</span>
                  <Chip label={CAMPAIGN_STATUS_LABEL[o.status] || o.status} color={CAMPAIGN_STATUS_COLOR[o.status] || '#94a3b8'} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{o.brandName} · {o.clientName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Production Pipeline ── */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div className="dash-section-label" style={{ marginBottom: '12px' }}><Activity size={13} /> Production Pipeline · simulated status</div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px', flexWrap: 'wrap' }}>
          {stages.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 150px' }}>
              <div style={{ flex: 1, border: '1px solid var(--border-subtle)', borderRadius: '10px', borderLeft: `3px solid ${s.color}`, padding: '11px 13px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{s.label}</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: s.color, marginTop: '3px' }}>{s.state}</div>
              </div>
              {i < stages.length - 1 && <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column: Overview + Brief ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<Building2 size={17} />} title="Client / Brand Overview" accent="var(--info)"
          badge={client ? <Chip label={client.status} color="#60a5fa" /> : undefined}
          footer={<NavButton label="Review brief" onClick={() => onNavigate('brief-intake')} />}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <Field label="Client" value={client?.name} />
            <Field label="Contact" value={client?.contact_name} />
            <Field label="Brand" value={brand?.name} />
            <Field label="Industry" value={brand?.industry} />
            <Field label="Hero product" value={brand?.hero_product} />
            <Field label="Tone of voice" value={brand?.tone_of_voice} />
            <Field label="Target audience" value={brand?.target_audience} />
            <Field label="Channels" value={(brand?.primary_channels || []).join(', ') || null} />
          </div>
        </SectionCard>

        <SectionCard
          icon={<Store size={17} />} title="Campaign Brief Snapshot" accent="var(--brand)"
          badge={<Chip label={BRIEF_STATUS_LABEL[briefStatus] || 'Draft'} color={BRIEF_STATUS_COLOR[briefStatus] || '#94a3b8'} />}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <Field label="Campaign" value={campaign.name} />
            <Field label="Status" value={CAMPAIGN_STATUS_LABEL[campaign.status] || campaign.status} />
            <Field label="Duration" value={`${campaign.duration_days} days`} />
            <Field label="Brief title" value={brief?.brief_title} />
            <Field label="Goal" value={brief?.campaign_goal} />
            <Field label="Product focus" value={brief?.product_focus} />
            <Field label="Offer" value={brief?.offer} />
            <Field label="Audience" value={brief?.target_audience} />
          </div>
          {brief?.key_messages && brief.key_messages.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {brief.key_messages.slice(0, 5).map((m, i) => (
                <span key={i} style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '3px 8px' }}>{m}</span>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Two-column: AI Output Queue + Pending Approvals ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<ClipboardList size={17} />} title="AI Output Queue" accent="var(--info)"
          badge={<Chip label={`${contentItems.length} drafts`} color="#60a5fa" />}
          footer={<NavButton label="Preview output" onClick={() => onNavigate('content-calendar')} />}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>Generated drafts only · approval-first · no auto-post.</p>
          {contentItems.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No AI drafts generated for this campaign yet.</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {Object.entries(aiByStatus).map(([st, n]) => (
                  <Chip key={st} label={`${CONTENT_ITEM_STATUS_LABEL[st] || st}: ${n}`} color={CONTENT_ITEM_STATUS_COLOR[st] || '#94a3b8'} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {contentItems.slice(0, 4).map(ci => (
                  <div key={ci.id} className="op-row" style={{ padding: '9px 11px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Day {ci.day_number} · {ci.channel} · {ci.pillar}</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ci.hook}</div>
                    </div>
                    <Chip label={CONTENT_ITEM_STATUS_LABEL[ci.status] || ci.status} color={CONTENT_ITEM_STATUS_COLOR[ci.status] || '#94a3b8'} />
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard
          icon={<ListChecks size={17} />} title="Pending Approval Items" accent="var(--warning)"
          badge={<Chip label={`${pendingApprovals} pending`} color="#fbbf24" />}
          footer={<NavButton label="View approvals" onClick={() => onNavigate('approvals')} />}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
            Human sign-off queue. <strong style={{ color: '#fbbf24' }}>Approved ≠ Published</strong> — approval never posts or launches.
          </p>
          {approvals.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No approval requests for this campaign yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {approvals.slice(0, 5).map(r => (
                <div key={r.id} className="op-row" style={{ padding: '9px 11px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{r.title}</div>
                  <Chip label={APPROVAL_STATUS_LABEL[r.status]} color={APPROVAL_STATUS_COLOR[r.status]} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Two-column: Asset/Design Preview Status + Report Draft Status ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<ImageIcon size={17} />} title="Asset / Design Preview Status" accent="var(--success)"
          badge={<Chip label={`${assets.length} assets`} color="#34d399" />}
          footer={<NavButton label="Preview output" onClick={() => onNavigate('asset-library')} />}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>Design briefs / placeholders only · no real image generation.</p>
          {assets.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No assets linked to this campaign yet.</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {Object.entries(assetByStatus).map(([st, n]) => (
                  <Chip key={st} label={`${ASSET_APPROVAL_LABEL[st as keyof typeof ASSET_APPROVAL_LABEL] || st}: ${n}`} color={ASSET_APPROVAL_COLOR[st as keyof typeof ASSET_APPROVAL_COLOR] || '#94a3b8'} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {assets.slice(0, 4).map(a => (
                  <div key={a.id} className="op-row" style={{ padding: '9px 11px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{a.name}</div>
                    <Chip label={ASSET_APPROVAL_LABEL[a.approval_status]} color={ASSET_APPROVAL_COLOR[a.approval_status]} />
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard
          icon={<FileBarChart size={17} />} title="Report Draft Status" accent="var(--info)"
          badge={<Chip label={reportReady ? 'Draft ready' : 'Waiting'} color={reportReady ? '#34d399' : '#94a3b8'} />}
          footer={<NavButton label="View report draft" onClick={() => onNavigate('reports')} />}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Report Draft V1 — draft-only. No live analytics pull, no unverified metrics. Figures below are internal/simulated.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '11px 13px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>{approvedItems}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Approved items (internal)</div>
            </div>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '11px 13px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--info)' }}>{contentItems.length}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Drafts generated</div>
            </div>
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '11px 13px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{reportReady ? 'Yes' : 'No'}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Report draft available</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Two-column: Safety & Connector Status + Recent Activity ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<ShieldCheck size={17} />} title="Safety & Connector Status" accent="var(--success)"
          badge={<span className="badge badge-emerald" style={{ fontSize: '0.66rem' }}>{LEDGER_SUMMARY.liveCount} of {LEDGER_SUMMARY.total} live</span>}
          footer={<NavButton label="View connector safety" onClick={() => onNavigate('connector-registry')} />}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={12} /> Read-only — no connector is live. Every connector is live blocked, Owner sign-off required, and not granted.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {['Approved ≠ Published', 'Owner approval required', 'No auto-post', 'No auto-ads', 'Manual confirmation outside CORE'].map(label => (
              <div key={label} className="op-row" style={{ padding: '8px 11px' }}>
                <span style={{ fontSize: '0.76rem' }}>{label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--success)' }}><Check size={12} /> Enforced</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          icon={<Activity size={17} />} title="Recent Activity" accent="var(--info)"
          badge={<span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Display only · no live pull</span>}
        >
          {activity.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No activity logged for this campaign yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activity.map(log => {
                const dot = log.severity === 'error' ? 'var(--error)' : log.severity === 'warning' ? 'var(--warning)' : log.severity === 'success' ? 'var(--success)' : 'var(--info)';
                return (
                  <div key={log.id} className="op-row" style={{ padding: '9px 11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <span className="status-dot" style={{ background: dot }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.77rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.title}</div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</div>
                      </div>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: '0.64rem', color: 'var(--text-muted)' }}>{fmtTime(log.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Phase Q: Client-ready Campaign Pack export (local copy/download only) ── */}
      <CampaignPackPanel
        campaign={campaign}
        client={client}
        brand={brand}
        briefs={brief ? [brief] : []}
        contentItems={contentItems}
        approvalRequests={approvals}
        approvalEvents={approvalEvents}
        userRole={userRole}
        actorLabel={actorLabel}
      />

      {/* ── Phase R: Manual publishing checklist & delivery readiness (read-only) ── */}
      <ManualPublishingChecklistPanel
        campaign={campaign}
        client={client}
        brand={brand}
        briefs={brief ? [brief] : []}
        contentItems={contentItems}
        approvalRequests={approvals}
        approvalEvents={approvalEvents}
        userRole={userRole}
        actorLabel={actorLabel}
      />

      {/* ── Phase S: Client Delivery Room / handoff preview (read-only, manual share) ── */}
      <ClientDeliveryRoomPanel
        campaign={campaign}
        client={client}
        brand={brand}
        briefs={brief ? [brief] : []}
        contentItems={contentItems}
        approvalRequests={approvals}
        approvalEvents={approvalEvents}
        userRole={userRole}
        actorLabel={actorLabel}
      />

      {/* ── Phase T: Client Feedback Intake & Delivery Acceptance (local/mock only) ── */}
      <DeliveryAcceptancePanel
        campaign={campaign}
        client={client}
        brand={brand}
        briefs={brief ? [brief] : []}
        contentItems={contentItems}
        approvalRequests={approvals}
        approvalEvents={approvalEvents}
        userRole={userRole}
        actorLabel={actorLabel}
      />

      {/* ── Phase U: Delivery Closure & Manual Publishing Handoff Control (local/demo only) ── */}
      <DeliveryClosurePanel
        campaign={campaign}
        client={client}
        brand={brand}
        briefs={brief ? [brief] : []}
        contentItems={contentItems}
        approvalRequests={approvals}
        approvalEvents={approvalEvents}
        userRole={userRole}
        actorLabel={actorLabel}
      />

      {/* ── CORE V1 Integration Closure + Phase V/W: the CORE V1 flow panel now renders
             INSIDE the evidence section (T4-11-B) so its 9-stage projection reads the REAL
             shared evidence/review state. State stays owned by the section wrapper so this
             workspace remains stateless; default is empty, so nothing is "published/reviewed"
             until the Owner records manual evidence. (local/demo only) ── */}
      <ManualPublishingEvidenceSection
        campaign={campaign}
        client={client}
        brand={brand}
        brief={brief}
        assets={assets}
        userRole={userRole}
        actorLabel={actorLabel}
        contentItems={contentItems}
        approvalRequests={approvals}
        approvalEvents={approvalEvents}
      />

      {/* ── Next Owner Actions ── */}
      <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ListChecks size={18} style={{ color: 'var(--warning)' }} /> Next Owner Actions
          </h3>
          <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Approval-first</span>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
          Recommended review steps only. <strong style={{ color: '#fbbf24' }}>Approved ≠ Published</strong> — nothing here posts, schedules, launches, or spends.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {actions.map(a => (
            <button key={a.key} className="op-row" onClick={() => onNavigate(a.tab)} style={{ cursor: 'pointer', textAlign: 'left', width: '100%', borderLeft: `3px solid ${a.accent}`, fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <ListChecks size={15} style={{ color: a.accent, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.81rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{a.hint}</div>
                </div>
              </div>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, color: a.accent }}>
                {a.verb} <ChevronRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
