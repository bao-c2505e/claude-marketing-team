import { useMemo, useState } from 'react';
import { useConnectorDashboard } from './useConnectorDashboard';
import { ConnectorSummaryBar } from './ConnectorSummaryBar';
import { ConnectorCard } from './ConnectorCard';
import { ConnectorDetailPanel } from './ConnectorDetailPanel';
import { getConnectorCommandSnapshot } from '../../lib/core/connectors/connectorCommandStore';
import { groupCommandsByConnector } from '../../lib/core/connectors/connectorCommandSnapshot';

export function ConnectorDashboard() {
  // T4-13: read the shared, approval-gated command previews ONCE on mount from
  // the in-memory store (no polling, no subscription, no persistence). Empty
  // store → undefined → the dashboard behaves exactly as before.
  const [snapshot] = useState(() => getConnectorCommandSnapshot());
  const commandsByConnector = useMemo(
    () => (snapshot ? groupCommandsByConnector(snapshot.commands) : undefined),
    [snapshot],
  );
  const { items, summary, handleCheck } = useConnectorDashboard(commandsByConnector);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find(i => i.connector.id === selectedId) ?? null;

  return (
    <div data-testid="connector-dashboard" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        Connector Dashboard
      </h2>
      {snapshot && (
        <p data-testid="command-snapshot-provenance" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Read-only previews shared by {snapshot.builtBy} at {new Date(snapshot.builtAt).toLocaleString()} —
          approval-gated command previews for review only. Nothing here publishes or runs anything.
        </p>
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
