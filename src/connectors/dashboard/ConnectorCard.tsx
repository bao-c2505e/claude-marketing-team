import type { ConnectorDashboardItem } from './connectorDashboard.types';
import { isLiveCheckSupported } from './connectorDashboard.types';
import { ConnectorHealthLog } from './ConnectorHealthLog';
import { StatusBadge, ModeBadge } from './connectorBadges';

interface Props {
  item: ConnectorDashboardItem;
  onCheck: (item: ConnectorDashboardItem) => void;
  onOpenDetail: (item: ConnectorDashboardItem) => void;
}

export function ConnectorCard({ item, onCheck, onOpenDetail }: Props) {
  const { connector, isChecking, healthLog } = item;
  const isLive = isLiveCheckSupported(connector.connector_type);

  return (
    <div
      data-testid={`connector-card-${connector.id}`}
      className="glass-panel"
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(item)}
      style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, color: 'var(--text-primary)' }}>
            {connector.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {connector.connector_type}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <StatusBadge status={connector.status} />
          <ModeBadge mode={connector.mode} />
        </div>
      </div>

      {connector.description && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
          {connector.description}
        </p>
      )}

      {connector.safety_note && (
        <p className="safety-ribbon" style={{ fontSize: '0.75rem', margin: 0 }}>
          {connector.safety_note}
        </p>
      )}

      {connector.last_checked_at && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
          Last check: {new Date(connector.last_checked_at).toLocaleTimeString()}
        </p>
      )}

      <ConnectorHealthLog log={healthLog} />

      <button
        data-testid={`check-btn-${connector.id}`}
        onClick={(e) => { e.stopPropagation(); onCheck(item); }}
        disabled={isChecking}
        className={isLive ? 'btn btn-primary' : 'btn btn-secondary'}
        style={{ marginTop: 4, fontSize: '0.75rem' }}
      >
        {isChecking ? 'Checking…' : isLive ? '⚡ Check Health' : '🔲 Simulate'}
      </button>
    </div>
  );
}
