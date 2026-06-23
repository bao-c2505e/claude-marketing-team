// Client Brand Brain — Phase L UI, Phase M single-source-of-truth wiring
// ---------------------------------------------------------------------------
// An Owner-facing, internal knowledge surface for ONE client/brand. It is
// DISPLAY + NAVIGATION only:
//   • the only interactive controls select which brand to inspect (`onSelect`)
//     or switch tabs (`onNavigate`) — they View / Review / Preview, they never
//     upload, publish, post, launch, spend, sync, or activate a connector,
//   • it reads ONE normalized `BrandBrain` contract assembled by the shared
//     source-of-truth builder (`lib/core/brandBrain.ts`) from data already in
//     CORE's local state — nothing is fetched, and connector safety is a
//     read-only projection of the offline activation ledger (live count hard 0),
//   • a Brand Context Source & Review card shows completeness, missing fields,
//     internal review status, source (internal / draft-only) and last updated /
//     last reviewed,
//   • approval-first stays visible ("Approved ≠ Published", Owner approval
//     required, live connectors blocked, manual confirmation outside CORE),
//   • all sample/demo content is labelled internal / simulated / demo / draft-only.
// A source-scan test (`BrandBrainTab.source.test.ts`) enforces that no upload /
// publish / post / ads-launch / activate / sync / fetch / live-connector wording
// leaks. See CLAUDE.md §3 (Workflow), §4 (Safety), §6 (Output Status), §7.
// ---------------------------------------------------------------------------
import React from 'react';
import {
  Brain,
  Building2,
  Users,
  Utensils,
  MessageCircle,
  Layers,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  Megaphone,
  StickyNote,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  Clock,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_COLOR,
  ASSET_APPROVAL_LABEL,
  ASSET_APPROVAL_COLOR,
} from '../../lib/core/coreData';
import {
  BRAND_BRAIN_STATUS_LABEL,
  BRAND_BRAIN_STATUS_COLOR,
  BRAND_BRAIN_SOURCE_LABEL,
} from '../../lib/core/brandBrain';
import type {
  BrandBrain,
  BrandBrainOption,
  BrandBrainCompleteness,
} from '../../lib/core/brandBrain';
import { buildConnectorLedgerSummary } from '../../lib/core/connectors/connectorLedger';

export interface BrandBrainTabProps {
  options: BrandBrainOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Normalized single-source brand context (from `buildBrandBrain`). */
  brandBrain: BrandBrain | null;
  /** Context completeness assessment (from `assessBrandBrainCompleteness`). */
  completeness: BrandBrainCompleteness | null;
  onNavigate: (tab: string) => void;
}

// Read-only safety projection — live count is a hard 0; nothing is ever live.
const LEDGER_SUMMARY = buildConnectorLedgerSummary();

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
      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{value && value.trim() ? value : <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
    </div>
  );
}

function PillList({ items, color = 'var(--text-secondary)', empty }: { items: string[]; color?: string; empty: string }) {
  if (items.length === 0) {
    return <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{empty}</div>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map((m, i) => (
        <span key={i} style={{ fontSize: '0.72rem', color, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '7px', padding: '4px 9px', lineHeight: 1.4 }}>{m}</span>
      ))}
    </div>
  );
}

function NoteList({ items, color, empty }: { items: string[]; color: string; empty: string }) {
  if (items.length === 0) {
    return <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{empty}</div>;
  }
  return (
    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {items.map((m, i) => (
        <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <span style={{ color }}>{m}</span>
        </li>
      ))}
    </ul>
  );
}

function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClick}>
      {label} <ChevronRight size={14} />
    </button>
  );
}

export default function BrandBrainTab({
  options, selectedId, onSelect,
  brandBrain, completeness,
  onNavigate,
}: BrandBrainTabProps) {

  // ── Empty state — no brand to inspect yet. ──
  if (!brandBrain) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Brain size={26} style={{ opacity: 0.6, marginBottom: '10px' }} />
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>No brand to inspect yet</h3>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>Create a client and brand, then return here to view its Brand Brain.</p>
        <p style={{ fontSize: '0.72rem', margin: '6px 0 0' }}>Internal knowledge · simulated / demo data · approval-first.</p>
      </div>
    );
  }

  const bb = brandBrain;
  const approvedAssets = bb.assetStatusCounts['approved'] || 0;
  const sourceLabel = `${BRAND_BRAIN_SOURCE_LABEL[bb.source]} · Draft-only`;

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const pct = completeness?.percent ?? 0;
  const completePresent = completeness?.present ?? 0;
  const completeTotal = completeness?.total ?? 0;
  const missingFields = completeness?.missing ?? [];
  const barColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--error)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header + brand selector + safety strip ── */}
      <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--brand)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={20} style={{ color: 'var(--brand)' }} /> Client Brand Brain
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Single internal source of truth for one client/brand. Internal records · simulated / demo data · nothing is published from this screen.
            </p>
          </div>
          <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Approval-first</span>
        </div>
        <div className="safety-ribbon" style={{ marginBottom: '14px' }}>
          <span>Internal records only</span>
          <span>Approved ≠ Published</span>
          <span>Owner approval required</span>
          <span>No auto-post</span>
          <span>Live connectors blocked</span>
          <span>Manual confirmation outside CORE</span>
        </div>
        <div className="dash-section-label" style={{ marginBottom: '8px' }}>Select brand to inspect</div>
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
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{o.clientName}{o.industry ? ` · ${o.industry}` : ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Brand Context Source & Review (intake / completeness) ── */}
      <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--info)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ClipboardList size={17} style={{ color: 'var(--info)' }} /> Brand Context Source &amp; Review
          </h3>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Chip label={sourceLabel} color="#60a5fa" />
            <Chip label={BRAND_BRAIN_STATUS_LABEL[bb.status]} color={BRAND_BRAIN_STATUS_COLOR[bb.status]} />
          </div>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Internal / simulated / demo / draft-only brand context, read from one shared source of truth. Owner review status shown — nothing here publishes.
        </p>

        {/* Completeness bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Brand context completeness</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: barColor }}>{completePresent}/{completeTotal} · {pct}%</span>
          </div>
          <div style={{ height: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.2s' }} />
          </div>
        </div>

        {/* Missing fields */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Missing context fields</div>
          {missingFields.length === 0
            ? <div style={{ fontSize: '0.78rem', color: 'var(--success)' }}>All scored brand-context fields are filled in.</div>
            : <PillList items={missingFields} color="#fbbf24" empty="—" />}
        </div>

        {/* Source / review meta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <Field label="Source" value={sourceLabel} />
          <Field label="Owner review status" value={BRAND_BRAIN_STATUS_LABEL[bb.status]} />
          <Field label="Last updated" value={fmtDate(bb.updatedAt)} />
          <Field label="Last reviewed" value={fmtDate(bb.lastReviewedAt)} />
        </div>

        {/* Allowed-label actions — navigation only (no edit/save/sync/publish) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
          <NavButton label="Review missing fields" onClick={() => onNavigate('brief-intake')} />
          <NavButton label="Mark for owner review" onClick={() => onNavigate('approvals')} />
          <NavButton label="Use as draft context" onClick={() => onNavigate('content-gen')} />
          <NavButton label="View safety status" onClick={() => onNavigate('connector-registry')} />
        </div>
      </div>

      {/* ── Two-column: Identity + Target Customers ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<Building2 size={17} />} title="Client / Brand Identity" accent="var(--info)"
          badge={<Chip label="Internal" color="#60a5fa" />}
          footer={<NavButton label="View campaign" onClick={() => onNavigate('campaign-workspace')} />}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: bb.brandColors.length > 0 ? '12px' : 0 }}>
            <Field label="Client" value={bb.clientName} />
            <Field label="Brand" value={bb.brandName} />
            <Field label="Category / industry" value={bb.category} />
            <Field label="Positioning" value={bb.positioning} />
            <Field label="Contact" value={bb.contactName} />
            <Field label="Channels" value={bb.channels.join(', ') || null} />
          </div>
          {bb.brandColors.length > 0 && (
            <div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Brand colours</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {bb.brandColors.map(([name, hex]) => (
                  <span key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '7px', padding: '3px 8px' }}>
                    <span style={{ width: '13px', height: '13px', borderRadius: '4px', background: hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                    {name}: {hex}
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<Users size={17} />} title="Target Customers" accent="var(--brand)"
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>Who this brand markets to — drawn from the shared brand context.</p>
          <NoteList items={bb.targetCustomers} color="var(--text-secondary)" empty="No audience captured yet." />
        </SectionCard>
      </div>

      {/* ── Two-column: Products/Offers + Brand Voice ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<Utensils size={17} />} title="Products / Services / Menu / Offers" accent="var(--success)"
          footer={<NavButton label="Review brief" onClick={() => onNavigate('brief-intake')} />}
        >
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Products / menu focus</div>
            <NoteList items={bb.products} color="var(--text-secondary)" empty="No product focus captured yet." />
          </div>
          <div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Offers (draft — owner-confirmed only)</div>
            <NoteList items={bb.offers} color="var(--text-secondary)" empty="No offers captured yet." />
          </div>
        </SectionCard>

        <SectionCard
          icon={<MessageCircle size={17} />} title="Brand Voice / Tone" accent="var(--info)"
        >
          <NoteList items={bb.brandVoice} color="var(--text-secondary)" empty="No tone of voice captured yet." />
        </SectionCard>
      </div>

      {/* ── Two-column: Content Pillars + Creative Do/Don't ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<Layers size={17} />} title="Content Pillars" accent="var(--brand)"
          badge={<Chip label={`${bb.contentPillars.length} pillars`} color="#fb923c" />}
          footer={<NavButton label="Preview draft" onClick={() => onNavigate('content-calendar')} />}
        >
          <div style={{ marginBottom: bb.keyMessages.length > 0 ? '14px' : 0 }}>
            <PillList items={bb.contentPillars} color="#fb923c" empty="No content pillars captured yet." />
          </div>
          {bb.keyMessages.length > 0 && (
            <div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Key messages</div>
              <PillList items={bb.keyMessages} color="var(--text-secondary)" empty="—" />
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<ThumbsUp size={17} />} title="Creative Do / Don't" accent="var(--warning)"
        >
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ThumbsUp size={13} /> Do / must include
            </div>
            <NoteList items={bb.creativeDos} color="var(--text-secondary)" empty="No do-list captured yet." />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ThumbsDown size={13} /> Don't / must avoid
            </div>
            <NoteList items={bb.creativeDonts} color="var(--text-secondary)" empty="No don't-list captured yet." />
          </div>
        </SectionCard>
      </div>

      {/* ── Claim / Compliance Notes ── */}
      <SectionCard
        icon={<ShieldAlert size={17} />} title="Claim / Compliance Notes" accent="var(--warning)"
        badge={<span className="badge badge-amber" style={{ fontSize: '0.66rem' }}>Owner-verified claims only</span>}
        footer={<NavButton label="View approval state" onClick={() => onNavigate('approvals')} />}
      >
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Approval requirements (per brief)</div>
          <NoteList items={bb.claimComplianceNotes} color="var(--text-secondary)" empty="No approval requirements captured yet." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {bb.approvalSafetyNotes.map(line => (
            <div key={line} className="op-row" style={{ padding: '8px 11px' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{line}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Two-column: Campaign Context + Owner Notes ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<Megaphone size={17} />} title="Campaign Context" accent="var(--info)"
          badge={<Chip label={`${bb.campaignContext.length} campaigns`} color="#60a5fa" />}
          footer={<NavButton label="View campaign" onClick={() => onNavigate('campaign-workspace')} />}
        >
          {bb.campaignContext.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No campaigns for this brand yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {bb.campaignContext.map(c => (
                <div key={c.id} className="op-row" style={{ padding: '9px 11px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.durationDays} days{c.goal ? ` · ${c.goal}` : ''}</div>
                  </div>
                  <Chip label={CAMPAIGN_STATUS_LABEL[c.status] || c.status} color={CAMPAIGN_STATUS_COLOR[c.status] || '#94a3b8'} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={<StickyNote size={17} />} title="Owner Notes" accent="var(--brand)"
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>Internal context for the team — not client-facing copy.</p>
          <NoteList items={bb.ownerNotes} color="var(--text-secondary)" empty="No owner notes captured yet." />
        </SectionCard>
      </div>

      {/* ── Two-column: Asset Library snapshot + Safety & Connector status ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<ImageIcon size={17} />} title="Asset Library Snapshot" accent="var(--success)"
          badge={<Chip label={`${approvedAssets}/${bb.assetReferences.length} approved`} color="#34d399" />}
          footer={<NavButton label="Review asset" onClick={() => onNavigate('asset-library')} />}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
            Internal asset records (metadata only) · demo / draft-only. <strong style={{ color: '#34d399' }}>Approved ≠ Published</strong>.
          </p>
          {bb.assetReferences.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No assets linked to this brand yet.</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {Object.entries(bb.assetStatusCounts).map(([st, n]) => (
                  <Chip key={st} label={`${ASSET_APPROVAL_LABEL[st as keyof typeof ASSET_APPROVAL_LABEL] || st}: ${n}`} color={ASSET_APPROVAL_COLOR[st as keyof typeof ASSET_APPROVAL_COLOR] || '#94a3b8'} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bb.assetReferences.slice(0, 5).map(a => (
                  <div key={a.id} className="op-row" style={{ padding: '9px 11px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{a.name}</div>
                    <Chip label={ASSET_APPROVAL_LABEL[a.approvalStatus]} color={ASSET_APPROVAL_COLOR[a.approvalStatus]} />
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard
          icon={<ShieldCheck size={17} />} title="Safety & Connector Status" accent="var(--success)"
          badge={<span className="badge badge-emerald" style={{ fontSize: '0.66rem' }}>{LEDGER_SUMMARY.liveCount} of {LEDGER_SUMMARY.total} live</span>}
          footer={<NavButton label="View safety status" onClick={() => onNavigate('connector-registry')} />}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={12} /> Read-only — no connector is live. Every connector is live blocked and Owner sign-off is not granted.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {['Approved ≠ Published', 'Owner approval required', 'No auto-post', 'No auto-ads', 'Manual confirmation outside CORE'].map(label => (
              <div key={label} className="op-row" style={{ padding: '8px 11px' }}>
                <span style={{ fontSize: '0.76rem' }}>{label}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--success)' }}>Enforced</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Last Updated / Internal Draft State ── */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={16} style={{ color: 'var(--text-muted)' }} />
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Last Updated / Internal Draft State</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Brand updated {fmtDate(bb.updatedAt)} · last reviewed {fmtDate(bb.lastReviewedAt)} · {sourceLabel} — not published.
            </div>
          </div>
        </div>
        <Chip label={BRAND_BRAIN_STATUS_LABEL[bb.status]} color={BRAND_BRAIN_STATUS_COLOR[bb.status]} />
      </div>

    </div>
  );
}
