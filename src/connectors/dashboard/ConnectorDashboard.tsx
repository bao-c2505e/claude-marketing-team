import { useState } from 'react';
import { useConnectorDashboard } from './useConnectorDashboard';
import { ConnectorSummaryBar } from './ConnectorSummaryBar';
import { ConnectorCard } from './ConnectorCard';
import { ConnectorDetailPanel } from './ConnectorDetailPanel';

export function ConnectorDashboard() {
  const { items, summary, handleCheck } = useConnectorDashboard();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find(i => i.connector.id === selectedId) ?? null;

  return (
    <div data-testid="connector-dashboard" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        Connector Dashboard
      </h2>
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
        onClose={() => setSelectedId(null)}
        onCheck={id => {
          const it = items.find(i => i.connector.id === id);
          if (it) handleCheck(it);
        }}
      />
    </div>
  );
}
