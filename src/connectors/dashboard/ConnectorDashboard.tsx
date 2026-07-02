import { useMemo, useState } from 'react';
import { useConnectorDashboard } from './useConnectorDashboard';
import { ConnectorSummaryBar } from './ConnectorSummaryBar';
import { ConnectorCard } from './ConnectorCard';
import { ConnectorDetailPanel } from './ConnectorDetailPanel';
import {
  getValidatedConnectorCommandSnapshot,
  getConnectorCommandSnapshotStatus,
  clearConnectorCommandSnapshot,
} from '../../lib/core/connectors/connectorCommandStore';
import { groupCommandsByConnector } from '../../lib/core/connectors/connectorCommandSnapshot';

const FRESHNESS_LABEL = {
  fresh: 'fresh',
  stale: 'stale preview',
  invalid_timestamp: 'unreadable timestamp',
} as const;

function ClearPreviewButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      data-testid="clear-command-preview-btn"
      onClick={onClear}
      style={{
        alignSelf: 'flex-start', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem',
        fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)', cursor: 'pointer',
      }}
    >
      Clear read-only preview
    </button>
  );
}

export function ConnectorDashboard() {
  // T4-13/T4-14: read the shared, approval-gated command previews ONCE on mount
  // from the in-memory store (no polling, no subscription, no persistence) —
  // now through the VALIDATED read path only: a snapshot that fails the
  // integrity re-check on read is withheld, and the freshness status flags a
  // stale preview. Empty store → undefined → the dashboard behaves as before.
  const [snapshot, setSnapshot] = useState(() => getValidatedConnectorCommandSnapshot());
  const [snapshotStatus, setSnapshotStatus] = useState(() => getConnectorCommandSnapshotStatus());
  const commandsByConnector = useMemo(
    () => (snapshot ? groupCommandsByConnector(snapshot.commands) : undefined),
    [snapshot],
  );
  const { items, summary, handleCheck } = useConnectorDashboard(commandsByConnector);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find(i => i.connector.id === selectedId) ?? null;

  // Owner-facing "clear preview": forgets the shared read-only previews only.
  // It touches nothing else — approvals, publishing evidence, Brand Brain, and
  // campaign data all live elsewhere and are unaffected.
  const handleClearPreview = () => {
    clearConnectorCommandSnapshot();
    setSnapshot(null);
    setSnapshotStatus(getConnectorCommandSnapshotStatus());
    setSelectedId(null);
  };

  return (
    <div data-testid="connector-dashboard" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        Connector Dashboard
      </h2>
      {snapshot && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <p data-testid="command-snapshot-provenance" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Read-only previews shared by {snapshot.builtBy} at {new Date(snapshot.builtAt).toLocaleString()}
            {' '}({snapshotStatus.ageLabel ?? 'unknown age'}, {snapshotStatus.freshness ? FRESHNESS_LABEL[snapshotStatus.freshness] : 'unknown'}) —
            approval-gated command previews for review only. Nothing here publishes or runs anything.
          </p>
          {snapshotStatus.reason && (
            <p data-testid="command-snapshot-stale-warning" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--warning, #fbbf24)' }}>
              {snapshotStatus.reason}
            </p>
          )}
          <ClearPreviewButton onClear={handleClearPreview} />
        </div>
      )}
      {!snapshot && snapshotStatus.hasSnapshot && (
        // Defense in depth: a shared snapshot that failed re-validation on read
        // is withheld — say so instead of rendering it, and offer the same clear.
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <p data-testid="command-snapshot-withheld" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--warning, #fbbf24)' }}>
            {snapshotStatus.reason ?? 'Shared preview failed re-validation and is withheld.'}{' '}
            Clear the preview and rebuild from the current approval state.
          </p>
          <ClearPreviewButton onClear={handleClearPreview} />
        </div>
      )}
      <ConnectorSummaryBar summary={summary} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {items.map(item => (
          <ConnectorCard
            key={item.connector.id}
            item={item}
            onCheck={handleCheck}
            onOpenDetail={it => setSelectedId(it.connector.id)}
          />
        ))}
      </div>
      <ConnectorDetailPanel
        item={selected?.connector ?? null}
        healthLog={selected?.healthLog ?? []}
        isChecking={selected?.isChecking ?? false}
        commands={selected?.commands ?? []}
        onClose={() => setSelectedId(null)}
        onCheck={id => {
          const it = items.find(i => i.connector.id === id);
          if (it) handleCheck(it);
        }}
      />
    </div>
  );
}
