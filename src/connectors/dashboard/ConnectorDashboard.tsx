import { useConnectorDashboard } from './useConnectorDashboard';
import { ConnectorSummaryBar } from './ConnectorSummaryBar';
import { ConnectorCard } from './ConnectorCard';

export function ConnectorDashboard() {
  const { items, summary, handleCheck } = useConnectorDashboard();

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
          />
        ))}
      </div>
    </div>
  );
}
