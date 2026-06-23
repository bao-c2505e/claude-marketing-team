// Owner Operations Panel — Phase J (Owner Dashboard / Campaign Production Polish)
// ---------------------------------------------------------------------------
// A focused, presentational panel that fills the operational gaps in the owner
// Command Center: "Today's Production Status", "Next Owner Actions", and an
// inline "Connector Safety Status" summary (previously only on the connector
// registry tab). It is DISPLAY + NAVIGATION only:
//   • the only interactive controls are nav buttons that switch tabs via the
//     `onNavigate` prop — they Review / View, they never publish, post, launch,
//     spend, or activate a connector,
//   • all connector safety figures come from the pure, offline ledger model
//     (`connectorLedger.ts`) where every live capability is a hard `false`,
//   • all production numbers are passed in from existing app state — nothing is
//     fetched, invented, or implied to be live; tiles are labelled internal /
//     simulated, and approval-first ("Approved ≠ Published") stays visible.
// A source-scan test (`OwnerOperationsPanel.source.test.ts`) enforces that no
// publish / post / ads-launch / live-connector wording or capability leaks in.
// See CLAUDE.md §4 (Safety), §6 (Output Status Model), §7 (Connector Roadmap).
// ---------------------------------------------------------------------------
import {
  ClipboardCheck,
  ListChecks,
  ShieldCheck,
  Lock,
  ChevronRight,
  Activity,
  Check,
} from 'lucide-react';
import {
  CONNECTOR_LEDGER_COPY,
  buildConnectorActivationLedger,
  buildConnectorLedgerSummary,
} from '../../lib/core/connectors/connectorLedger';

// Production figures are derived in App.tsx from existing app state only. None of
// these are live metrics — they count items already inside the local pipeline.
export interface OwnerProductionMetrics {
  drafts: number;
  /** Submitted = awaiting Owner sign-off (ceiling for AI alone). */
  submitted: number;
  /** Approved for INTERNAL use only — never published or launched. */
  approved: number;
  revisionRequested: number;
  rejected: number;
  activeCampaigns: number;
  clients: number;
  brands: number;
  /** Logged automation/approval events whose timestamp is today (display only). */
  eventsToday: number;
}

export interface OwnerOperationsPanelProps {
  metrics: OwnerProductionMetrics;
  /** Switches the active dashboard tab. The only side effect this panel has. */
  onNavigate: (tab: string) => void;
}

const LEDGER = buildConnectorActivationLedger();
const LEDGER_SUMMARY = buildConnectorLedgerSummary();

function ProductionTile({
  label, value, accent, note,
}: { label: string; value: number; accent: string; note: string }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '5px',
        padding: '13px 15px', borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.02)',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-title, inherit)', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>{value}</span>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>{note}</span>
    </div>
  );
}

export default function OwnerOperationsPanel({ metrics, onNavigate }: OwnerOperationsPanelProps) {
  const {
    drafts, submitted, approved, revisionRequested,
    activeCampaigns, eventsToday,
  } = metrics;

  // "Next Owner Actions" are recommendations only. Every verb is a review / view
  // action — there is intentionally no publish, post, ads-launch, or activate
  // action available from this panel.
  type NextAction = { key: string; label: string; hint: string; verb: string; tab: string; accent: string };
  const actions: NextAction[] = [];

  if (submitted > 0) {
    actions.push({
      key: 'review-pending',
      label: `Review ${submitted} item${submitted === 1 ? '' : 's'} awaiting approval`,
      hint: 'Owner sign-off required — approval authorizes internal use only.',
      verb: 'View queue',
      tab: 'approvals',
      accent: 'var(--warning)',
    });
  }
  if (revisionRequested > 0) {
    actions.push({
      key: 'recheck-revision',
      label: `Re-check ${revisionRequested} item${revisionRequested === 1 ? '' : 's'} marked for revision`,
      hint: 'Send back into the factory or approve once the draft is fixed.',
      verb: 'Review',
      tab: 'approvals',
      accent: 'var(--brand)',
    });
  }
  if (drafts > 0) {
    actions.push({
      key: 'review-drafts',
      label: `${drafts} draft${drafts === 1 ? '' : 's'} not yet submitted for approval`,
      hint: 'Review drafts before they are submitted for Owner sign-off.',
      verb: 'Review',
      tab: 'content-gen',
      accent: 'var(--info)',
    });
  }
  if (submitted === 0 && revisionRequested === 0 && drafts === 0) {
    actions.push({
      key: 'queue-clear',
      label: 'No items awaiting your approval',
      hint: 'The production queue is clear. New drafts appear here for sign-off.',
      verb: 'View queue',
      tab: 'approvals',
      accent: 'var(--success)',
    });
  }
  // Always offer the connector safety check — it reassures that nothing is live.
  actions.push({
    key: 'connector-safety',
    label: 'Confirm connector safety status',
    hint: `All ${LEDGER_SUMMARY.total} connectors are live blocked and read-only — nothing is live.`,
    verb: 'View safety status',
    tab: 'connector-registry',
    accent: 'var(--success)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Today's Production Status ── */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div className="dash-section-label"><Activity size={13} /> Today&apos;s Production Status</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Internal pipeline · simulated data · no live metrics</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <ProductionTile label="Awaiting approval" value={submitted} accent="var(--warning)" note="Pending Owner sign-off" />
          <ProductionTile label="Approved (internal)" value={approved} accent="var(--success)" note="Approved ≠ Published" />
          <ProductionTile label="Needs revision" value={revisionRequested} accent="var(--brand)" note="Sent back for edits" />
          <ProductionTile label="Drafts in progress" value={drafts} accent="var(--info)" note="Not yet submitted" />
          <ProductionTile label="Active campaigns" value={activeCampaigns} accent="var(--info)" note="Production workspaces" />
          <ProductionTile label="Events today" value={eventsToday} accent="var(--text-muted)" note="Display only · no live pull" />
        </div>
      </div>

      {/* ── Next Owner Actions ── */}
      <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--warning)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ListChecks size={18} style={{ color: 'var(--warning)' }} /> Next Owner Actions
          </h3>
          <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Approval-first</span>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
          Recommended review steps only. <strong style={{ color: '#fbbf24' }}>Approved ≠ Published</strong> — nothing here posts, schedules, launches, or spends.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {actions.map(a => (
            <button
              key={a.key}
              className="op-row"
              onClick={() => onNavigate(a.tab)}
              style={{ cursor: 'pointer', textAlign: 'left', width: '100%', borderLeft: `3px solid ${a.accent}`, fontFamily: 'inherit' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <ClipboardCheck size={15} style={{ color: a.accent, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{a.hint}</div>
                </div>
              </div>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, color: a.accent }}>
                {a.verb} <ChevronRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Connector Safety Status (read-only summary of the activation ledger) ── */}
      <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--success)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <ShieldCheck size={18} style={{ color: 'var(--success)' }} /> Connector Safety Status
          </h3>
          <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
            {LEDGER_SUMMARY.liveCount} of {LEDGER_SUMMARY.total} live
          </span>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={12} /> Read-only — {CONNECTOR_LEDGER_COPY.noLiveConnector}. Every connector is live blocked, Owner sign-off required, and not granted.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '8px' }}>
          {LEDGER.map(row => (
            <div
              key={row.connectorKey}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
                padding: '9px 12px', borderRadius: '9px',
                border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)',
              }}
            >
              <span style={{ fontSize: '0.76rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.connectorName}</span>
              <span style={{ flexShrink: 0, fontSize: '0.62rem', fontWeight: 600, color: '#f87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '5px', padding: '2px 7px' }}>
                {row.safetyStateLabel}
              </span>
            </div>
          ))}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => onNavigate('connector-registry')}
          style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
        >
          <Check size={14} /> View safety status <ChevronRight size={14} />
        </button>
      </div>

    </div>
  );
}
