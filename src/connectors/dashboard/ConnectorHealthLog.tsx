import type { HealthCheckEntry } from './connectorDashboard.types';
import { StatusDot } from './connectorBadges';

interface Props {
  log: HealthCheckEntry[];
}

export function ConnectorHealthLog({ log }: Props) {
  if (log.length === 0) {
    return <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No checks yet</p>;
  }
  return (
    <ul data-testid="health-log-list" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {log.map((entry, idx) => (
        <li key={idx} style={{ fontSize: '0.75rem', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <StatusDot status={entry.status} />
          <span style={{ color: 'var(--text-muted)' }}>
            {new Date(entry.checked_at).toLocaleTimeString()}
          </span>
          {entry.latency_ms !== null && (
            <span style={{ color: 'var(--text-secondary)' }}>{entry.latency_ms}ms</span>
          )}
          <span style={{ color: 'var(--text-primary)' }}>{entry.note}</span>
        </li>
      ))}
    </ul>
  );
}
