import type {
  LocalConnectorType,
  LocalConnectorStatus,
  LocalConnectorRegistryItem,
} from '../../types/core';
import type { ConnectorCommand } from '../../lib/core/connectors/connectorCommand';

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
  /**
   * T4-10-C: approved connector-command previews targeting this connector —
   * a read-only projection (approval-gated handoff artifacts; nothing here
   * publishes or runs). Undefined when no commands were routed in.
   */
  commands?: ConnectorCommand[];
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
