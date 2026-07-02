import { useCallback, useState } from 'react';
import type { ReadOnlyConnectorPreviewResult } from '../../lib/core/connectors/readOnlyConnectorPreview';
import { checkAllReadOnlyConnectorPreviews } from '../../lib/core/connectors/readOnlyConnectorPreviewRegistry';

// T4-16: explicit Owner-triggered read-only connector previews (read receipts).
// The registry is only ever called from the button's onClick — there is no
// effect hook, no polling, no subscription, and nothing runs on mount. Results
// are local component state (no persistence). Every result carries hard-false
// canWrite/canPublish/canRunAds/canExecute enforced by the contract layer, and
// items are sanitized { id, name, summary } summaries — never raw payloads.

const STATUS_COLOR: Record<ReadOnlyConnectorPreviewResult['status'], string> = {
  available: 'var(--success, #34d399)',
  degraded: 'var(--warning, #fbbf24)',
  blocked: 'var(--text-muted)',
};

function PreviewResultRow({ result }: { result: ReadOnlyConnectorPreviewResult }) {
  return (
    <div
      data-testid={`readonly-preview-result-${result.connectorId}`}
      style={{
        display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.6rem 0.75rem',
        borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{result.label}</strong>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: STATUS_COLOR[result.status] }}>
          {result.status}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {result.previewType} · mode: {result.mode} · {result.items.length} item(s) ·
          {' '}checked {new Date(result.checkedAt).toLocaleString()}
        </span>
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{result.message}</span>
      {result.items.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {result.items.map(item => (
            <li key={item.id} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <strong>{item.name}</strong>
              {item.summary !== '' && <> — {item.summary}</>}
              <span style={{ color: 'var(--text-muted)' }}> (id: {item.id})</span>
            </li>
          ))}
        </ul>
      )}
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{result.safetyNote}</span>
    </div>
  );
}

export function ReadOnlyPreviewSection() {
  const [results, setResults] = useState<ReadOnlyConnectorPreviewResult[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      // Read-only look via the preview registry (blocked/excluded connectors
      // answer locally without any network). Failures come back as degraded
      // results — the registry never rethrows.
      setResults(await checkAllReadOnlyConnectorPreviews());
    } finally {
      setIsChecking(false);
    }
  }, []);

  return (
    <section
      data-testid="readonly-preview-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          data-testid="check-readonly-previews-btn"
          onClick={handleCheck}
          disabled={isChecking}
          style={{
            alignSelf: 'flex-start', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem',
            fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', cursor: isChecking ? 'wait' : 'pointer',
          }}
        >
          {isChecking ? 'Checking…' : 'Check read-only connector previews'}
        </button>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Read-only previews (read receipts) — no write, no publishing, no ads spend, no execution.
          Owner click only, never automatic.
        </span>
      </div>
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {results.map(result => (
            <PreviewResultRow key={result.connectorId} result={result} />
          ))}
        </div>
      )}
    </section>
  );
}
