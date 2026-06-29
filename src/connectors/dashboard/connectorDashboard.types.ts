import type {
  LocalConnectorType,
  LocalConnectorStatus,
  LocalConnectorRegistryItem,
} from '../../types/core';

export type { LocalConnectorStatus };

export interface HealthCheckEntry {
  checked_at: string;
  status: 'ok' | 'error' | 'simulated';
  latency_ms: number | null;
  note: string;
}

export interface ConnectorDashboardItem {
  connector: LocalConnectorRegistryItem;
  isChecking: boolean;
  healthLog: HealthCheckEntry[];
}

export interface ConnectorSummary {
  total: number;
  connected: number;
  error: number;
  not_configured: number;
}

export type LiveCheckConnectorType = 'n8n' | 'google_drive';

export function isLiveCheckSupported(t: LocalConnectorType): t is LiveCheckConnectorType {
  return t === 'n8n' || t === 'google_drive';
}
