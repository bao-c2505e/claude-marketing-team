import { useCallback, useState } from 'react';
import type { ReadOnlyConnectorHealthResult } from '../../lib/core/connectors/readOnlyConnectorHealth';
import { checkAllReadOnlyConnectorHealth } from '../../lib/core/connectors/readOnlyConnectorHealthRegistry';

// T4-15: explicit Owner-triggered read-only connector health checks.
// The registry is only ever called from the button's onClick — there is no
// effect hook, no polling, no subscription, and nothing runs on mount. Results
// are local component state (no persistence) and every result carries
// hard-false write/publishing/ad capabilities enforced by the contract layer.

const STATUS_COLOR: Record<ReadOnlyConnectorHealthResult['status'], string> = {
  available: 'var(--success, #34d399)',
  degraded: 'var(--warning, #fbbf24)',
  blocked: 'var(--text-muted)',
  unavailable: 'var(--danger, #f87171)',
  unknown: 'var(--text-muted)',
};

function HealthResultRow({ result }: { result: ReadOnlyConnectorHealthResult }) {
  return (
    <div
      data-testid={`readonly-health-result-${result.connectorId}`}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.6rem 0.75rem',
        borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{result.label}</strong>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: STATUS_COLOR[result.status] }}>
          {result.status}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          mode: {result.mode} · checked {new Date(result.checkedAt).toLocaleString()}
        </span>
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        read: {result.canRead ? 'yes' : 'no'} · write: no · publishing: no · ad spend: no
      </span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{result.message}</span>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{result.safetyNote}</span>
    </div>
  );
}

export function ReadOnlyHealthSection() {
  const [results, setResults] = useState<ReadOnlyConnectorHealthResult[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      // Read-only look via the registry (blocked/manual_only connectors answer
      // locally without any network). Failures come back as degraded results —
      // the registry never rethrows.
      setResults(await checkAllReadOnlyConnectorHealth());
    } finally {
      setIsChecking(false);
    }
  }, []);

  return (
    <section
      data-testid="readonly-health-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          data-testid="check-readonly-health-btn"
          onClick={handleCheck}
          disabled={isChecking}
          style={{
            alignSelf: 'flex-start', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem',
            fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', cursor: isChecking ? 'wait' : 'pointer',
          }}
        >
          {isChecking ? 'Checking…' : 'Check read-only connector health'}
        </button>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Read-only health checks — nothing here writes, publishes, or spends. Owner click only, never automatic.
        </span>
      </div>
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {results.map(result => (
            <HealthResultRow key={result.connectorId} result={result} />
          ))}
        </div>
      )}
    </section>
  );
}
