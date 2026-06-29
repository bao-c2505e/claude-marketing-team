import type { LocalConnectorStatus, LocalConnectorMode } from '../../types/core';
import type { HealthCheckEntry } from './connectorDashboard.types';

const STATUS_CLASS: Record<LocalConnectorStatus, string> = {
  connected: 'badge-emerald',
  configured: 'badge-blue',
  not_configured: 'badge-gray',
  error: 'badge-rose',
  disabled: 'badge-amber',
};

const MODE_CLASS: Record<LocalConnectorMode, string> = {
  production: 'badge-purple',
  sandbox: 'badge-amber',
  mock: 'badge-gray',
};

const DOT_COLOR: Record<HealthCheckEntry['status'], string> = {
  ok: '#22c55e',
  error: '#ef4444',
  simulated: '#9ca3af',
};

interface StatusBadgeProps {
  status: LocalConnectorStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span data-testid={`status-badge-${status}`} className={`badge ${STATUS_CLASS[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

interface ModeBadgeProps {
  mode: LocalConnectorMode;
}

export function ModeBadge({ mode }: ModeBadgeProps) {
  return (
    <span className={`badge ${MODE_CLASS[mode]}`}>
      {mode}
    </span>
  );
}

interface StatusDotProps {
  status: HealthCheckEntry['status'];
}

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: DOT_COLOR[status],
        flexShrink: 0,
        marginTop: 3,
      }}
    />
  );
}
