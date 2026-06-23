// Connector Activation Ledger — READ-ONLY presentational component.
// ---------------------------------------------------------------------------
// Phase I-S8. Renders the pure ledger model from
// `src/lib/core/connectors/connectorLedger.ts`. This component is intentionally
// DISPLAY-ONLY: it has no state, no event handlers, no buttons, and no mutation
// of any kind. It can never activate a connector, publish, launch ads, or change
// a sign-off — it only shows the blocked/sandbox safety state. A source-scan test
// (`ConnectorActivationLedger.source.test.ts`) enforces the no-controls rule.
// ---------------------------------------------------------------------------
import { ShieldCheck, Lock } from 'lucide-react';
import {
  CONNECTOR_LEDGER_COPY,
  buildConnectorActivationLedger,
  buildConnectorLedgerSummary,
  type ConnectorLedgerRow,
} from '../../lib/core/connectors/connectorLedger';

const LEDGER = buildConnectorActivationLedger();
const SUMMARY = buildConnectorLedgerSummary();

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.66rem', fontWeight: 600, color,
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: '5px', padding: '2px 7px', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function FalseCell({ label }: { label: string }) {
  return (
    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
      {label}: <span style={{ color: '#f87171', fontWeight: 600 }}>false</span>
    </span>
  );
}

function LedgerCard({ row }: { row: ConnectorLedgerRow }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
      borderRadius: '10px', padding: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{row.connectorName}</div>
        <Pill label={row.safetyStateLabel} color={row.currentStatus === 'sandbox' ? '#22d3ee' : row.currentStatus === 'mock' ? '#f59e0b' : '#a78bfa'} />
      </div>

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <Pill label={CONNECTOR_LEDGER_COPY.liveBlocked} color="#f87171" />
        <Pill label={CONNECTOR_LEDGER_COPY.ownerSignoffRequired} color="#fbbf24" />
        <Pill label={CONNECTOR_LEDGER_COPY.signoffNotGranted} color="#94a3b8" />
        <Pill label={CONNECTOR_LEDGER_COPY.approvedNotPublished} color="#34d399" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        <FalseCell label="Live connector" />
        <FalseCell label="Publish" />
        <FalseCell label="Ads launch" />
        <FalseCell label="Webhook" />
        <FalseCell label="OAuth" />
        <FalseCell label="Env required" />
        <FalseCell label="Owner sign-off granted" />
        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Sign-off status: <span style={{ color: 'var(--text-secondary)' }}>{row.signoffStatus}</span>
        </span>
      </div>

      {row.futureEnvDocumented && (
        <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>
          Future activation env is documented in the activation runbook only — none required today.
        </p>
      )}
    </div>
  );
}

export default function ConnectorActivationLedger() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <ShieldCheck size={16} style={{ color: '#34d399', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: '#86efac' }}>
          <strong>{CONNECTOR_LEDGER_COPY.title} — {CONNECTOR_LEDGER_COPY.subtitle}.</strong>{' '}
          {SUMMARY.liveCount} of {SUMMARY.total} connectors live. {CONNECTOR_LEDGER_COPY.noLiveConnector}.
          Every connector is {CONNECTOR_LEDGER_COPY.liveBlocked.toLowerCase()}, {CONNECTOR_LEDGER_COPY.ownerSignoffRequired.toLowerCase()},
          and sign-off is not granted. {CONNECTOR_LEDGER_COPY.approvedNotPublished}.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <Lock size={13} style={{ color: 'var(--text-muted)' }} />
        Read-only — no activation, publish, or launch controls. Display only.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
        {LEDGER.map(row => <LedgerCard key={row.connectorKey} row={row} />)}
      </div>
    </div>
  );
}
