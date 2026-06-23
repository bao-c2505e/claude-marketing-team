// Client Brand Brain — Phase L (Client Brand Brain & Asset Library Foundation)
// ---------------------------------------------------------------------------
// An Owner-facing, internal knowledge surface for ONE client/brand. It is
// DISPLAY + NAVIGATION only:
//   • the only interactive controls select which brand to inspect (`onSelect`)
//     or switch tabs (`onNavigate`) — they View / Review / Preview, they never
//     upload, publish, post, launch, spend, sync, or activate a connector,
//   • every field is derived from data already in the local pipeline (clients,
//     brands, campaigns, briefs, assets passed in as props); nothing is fetched,
//     and connector safety is a read-only projection of the offline activation
//     ledger (live count is a hard 0),
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
  ChevronRight,
} from 'lucide-react';
import type {
  Client,
  Brand,
  Campaign,
  CampaignBrief,
  AssetItem,
} from '../../types/core';
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_COLOR,
  BRIEF_STATUS_LABEL,
  BRIEF_STATUS_COLOR,
  ASSET_APPROVAL_LABEL,
  ASSET_APPROVAL_COLOR,
} from '../../lib/core/coreData';
import { buildConnectorLedgerSummary } from '../../lib/core/connectors/connectorLedger';

export interface BrandBrainOption {
  id: string;
  name: string;
  clientName: string;
  industry: string | null;
  status: string;
}

export interface BrandBrainTabProps {
  options: BrandBrainOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  client: Client | null;
  brand: Brand | null;
  /** Campaigns already scoped to this brand. */
  campaigns: Campaign[];
  /** Briefs already scoped to this brand. */
  briefs: CampaignBrief[];
  /** Assets already scoped to this brand. */
  assets: AssetItem[];
  onNavigate: (tab: string) => void;
}

// Read-only safety projection — live count is a hard 0; nothing is ever live.
const LEDGER_SUMMARY = buildConnectorLedgerSummary();

function uniq(values: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const t = (v ?? '').trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

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
  client, brand, campaigns, briefs, assets,
  onNavigate,
}: BrandBrainTabProps) {

  // ── Empty state — no brand to inspect yet. ──
  if (!brand) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Brain size={26} style={{ opacity: 0.6, marginBottom: '10px' }} />
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>No brand to inspect yet</h3>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>Create a client and brand, then return here to view its Brand Brain.</p>
        <p style={{ fontSize: '0.72rem', margin: '6px 0 0' }}>Internal knowledge · simulated / demo data · approval-first.</p>
      </div>
    );
  }

  // ── Aggregate brand-level knowledge from the brand record + its briefs. ──
  // `primaryBrief` provides single-value brand fields; list fields are unioned
  // across every brief so nothing is lost when a brand runs several campaigns.
  const primaryBrief = briefs[0] ?? null;

  const targetCustomers = uniq([brand.target_audience, ...briefs.map(b => b.target_audience)]);
  const productLines    = uniq([brand.hero_product, ...briefs.map(b => b.product_focus)]);
  const offers          = uniq(briefs.map(b => b.offer));
  const voiceLines      = uniq([brand.tone_of_voice, ...briefs.map(b => b.tone_of_voice)]);
  const pillars         = uniq(briefs.flatMap(b => b.content_pillars ?? []));
  const keyMessages     = uniq(briefs.flatMap(b => b.key_messages ?? []));
  const creativeDo      = uniq(briefs.map(b => b.must_include));
  const creativeDont    = uniq(briefs.map(b => b.must_avoid));
  const complianceNotes = uniq(briefs.map(b => b.approval_requirements));
  const ownerNotes      = uniq([client?.notes, ...briefs.map(b => b.additional_notes)]);
  const channels        = uniq([...(brand.primary_channels ?? []), ...briefs.flatMap(b => b.channels ?? [])]);
  const colorSwatches   = brand.brand_colors ? Object.entries(brand.brand_colors) : [];

  const assetByStatus = countBy(assets, a => a.approval_status);
  const approvedAssets = assetByStatus['approved'] || 0;

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const briefStatus = primaryBrief?.status ?? null;

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
              Internal brand context for one client/brand. Internal records · simulated / demo data · nothing is published from this screen.
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

      {/* ── Two-column: Identity + Target Customers ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<Building2 size={17} />} title="Client / Brand Identity" accent="var(--info)"
          badge={client ? <Chip label={client.status} color="#60a5fa" /> : undefined}
          footer={<NavButton label="View campaign" onClick={() => onNavigate('campaign-workspace')} />}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: colorSwatches.length > 0 ? '12px' : 0 }}>
            <Field label="Client" value={client?.name} />
            <Field label="Brand" value={brand.name} />
            <Field label="Industry" value={brand.industry} />
            <Field label="Contact" value={client?.contact_name} />
            <Field label="Channels" value={channels.join(', ') || null} />
          </div>
          {colorSwatches.length > 0 && (
            <div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Brand colours</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {colorSwatches.map(([name, hex]) => (
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
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>Who this brand markets to — drawn from the brand record and its briefs.</p>
          <NoteList items={targetCustomers} color="var(--text-secondary)" empty="No audience captured yet." />
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
            <NoteList items={productLines} color="var(--text-secondary)" empty="No product focus captured yet." />
          </div>
          <div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Offers (draft — owner-confirmed only)</div>
            <NoteList items={offers} color="var(--text-secondary)" empty="No offers captured yet." />
          </div>
        </SectionCard>

        <SectionCard
          icon={<MessageCircle size={17} />} title="Brand Voice / Tone" accent="var(--info)"
        >
          <NoteList items={voiceLines} color="var(--text-secondary)" empty="No tone of voice captured yet." />
        </SectionCard>
      </div>

      {/* ── Two-column: Content Pillars + Creative Do/Don't ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<Layers size={17} />} title="Content Pillars" accent="var(--brand)"
          badge={<Chip label={`${pillars.length} pillars`} color="#fb923c" />}
          footer={<NavButton label="Preview draft" onClick={() => onNavigate('content-calendar')} />}
        >
          <div style={{ marginBottom: keyMessages.length > 0 ? '14px' : 0 }}>
            <PillList items={pillars} color="#fb923c" empty="No content pillars captured yet." />
          </div>
          {keyMessages.length > 0 && (
            <div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Key messages</div>
              <PillList items={keyMessages} color="var(--text-secondary)" empty="—" />
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
            <NoteList items={creativeDo} color="var(--text-secondary)" empty="No do-list captured yet." />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ThumbsDown size={13} /> Don't / must avoid
            </div>
            <NoteList items={creativeDont} color="var(--text-secondary)" empty="No don't-list captured yet." />
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
          <NoteList items={complianceNotes} color="var(--text-secondary)" empty="No approval requirements captured yet." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {[
            'No fabricated metrics — report data is labelled provided / simulated / connector-pulled only.',
            'Every price, discount, claim, award, or statistic must be Owner-confirmed before use.',
            'AI generation reaches pending_approval at most — Owner sign-off authorizes internal use only.',
          ].map(line => (
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
          badge={<Chip label={`${campaigns.length} campaigns`} color="#60a5fa" />}
          footer={<NavButton label="View campaign" onClick={() => onNavigate('campaign-workspace')} />}
        >
          {primaryBrief?.campaign_goal && (
            <div style={{ marginBottom: '12px' }}>
              <Field label="Primary goal" value={primaryBrief.campaign_goal} />
            </div>
          )}
          {campaigns.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No campaigns for this brand yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {campaigns.map(c => (
                <div key={c.id} className="op-row" style={{ padding: '9px 11px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{c.duration_days} days</div>
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
          <NoteList items={ownerNotes} color="var(--text-secondary)" empty="No owner notes captured yet." />
        </SectionCard>
      </div>

      {/* ── Two-column: Asset Library snapshot + Safety & Connector status ── */}
      <div className="dash-cols">
        <SectionCard
          icon={<ImageIcon size={17} />} title="Asset Library Snapshot" accent="var(--success)"
          badge={<Chip label={`${approvedAssets}/${assets.length} approved`} color="#34d399" />}
          footer={<NavButton label="Review asset" onClick={() => onNavigate('asset-library')} />}
        >
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
            Internal asset records (metadata only) · demo / draft-only. <strong style={{ color: '#34d399' }}>Approved ≠ Published</strong>.
          </p>
          {assets.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No assets linked to this brand yet.</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {Object.entries(assetByStatus).map(([st, n]) => (
                  <Chip key={st} label={`${ASSET_APPROVAL_LABEL[st as keyof typeof ASSET_APPROVAL_LABEL] || st}: ${n}`} color={ASSET_APPROVAL_COLOR[st as keyof typeof ASSET_APPROVAL_COLOR] || '#94a3b8'} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {assets.slice(0, 5).map(a => (
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
              Brand updated {fmtDate(brand.updated_at)} · internal draft — not published.
            </div>
          </div>
        </div>
        {briefStatus
          ? <Chip label={BRIEF_STATUS_LABEL[briefStatus] || briefStatus} color={BRIEF_STATUS_COLOR[briefStatus] || '#94a3b8'} />
          : <Chip label="No brief yet" color="#94a3b8" />}
      </div>

    </div>
  );
}
