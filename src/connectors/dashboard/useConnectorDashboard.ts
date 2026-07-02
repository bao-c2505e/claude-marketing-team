import { useState, useCallback } from 'react';
import type {
  ConnectorDashboardItem,
  ConnectorSummary,
  HealthCheckEntry,
} from './connectorDashboard.types';
import type { LocalConnectorStatus, LocalConnectorRegistryItem, LocalConnectorType } from '../../types/core';
import type { ConnectorCommand } from '../../lib/core/connectors/connectorCommand';
import type { GovernedConnectorKey } from '../../lib/core/connectors/connectorGovernance';
import { checkN8nHealth } from '../../lib/core/connectors/adapters/n8n/n8nLiveService';
import { checkGdriveHealth } from '../../lib/core/connectors/adapters/drive/gdriveLiveService';

const MOCK_REGISTRY: LocalConnectorRegistryItem[] = [
  {
    id: 'conn-n8n',
    name: 'n8n Workflow',
    connector_type: 'n8n',
    status: 'connected',
    mode: 'production',
    description: 'Workflow automation hub',
    required_env_keys: ['N8N_BASE_URL', 'N8N_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conn-gdrive',
    name: 'Google Drive',
    connector_type: 'google_drive',
    status: 'connected',
    mode: 'production',
    description: 'Asset & document storage',
    required_env_keys: ['GDRIVE_SERVICE_ACCOUNT_JSON'],
    last_checked_at: null,
    health_note: null,
    safety_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conn-anthropic',
    name: 'Anthropic Claude',
    connector_type: 'anthropic',
    status: 'configured',
    mode: 'sandbox',
    description: 'AI content generation',
    required_env_keys: ['ANTHROPIC_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conn-openai',
    name: 'OpenAI',
    connector_type: 'openai',
    status: 'configured',
    mode: 'sandbox',
    description: 'Fallback AI generation',
    required_env_keys: ['OPENAI_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conn-meta',
    name: 'Meta Ads (Sandbox)',
    connector_type: 'meta_ads',
    status: 'configured',
    mode: 'sandbox',
    description: 'Facebook/Instagram ad drafts only — allow_publish: false',
    required_env_keys: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'],
    last_checked_at: null,
    health_note: null,
    safety_note: 'allow_publish: false | allow_spend: false',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conn-canva',
    name: 'Canva',
    connector_type: 'canva',
    status: 'not_configured',
    mode: 'mock',
    description: 'Design asset generation',
    required_env_keys: ['CANVA_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conn-gemini',
    name: 'Google Gemini',
    connector_type: 'gemini',
    status: 'not_configured',
    mode: 'mock',
    description: 'Alternative AI generation',
    required_env_keys: ['GEMINI_API_KEY'],
    last_checked_at: null,
    health_note: null,
    safety_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conn-sheets',
    name: 'Google Sheets',
    connector_type: 'google_sheets',
    status: 'not_configured',
    mode: 'mock',
    description: 'Reporting export to sheets',
    required_env_keys: ['GSHEETS_SERVICE_ACCOUNT_JSON'],
    last_checked_at: null,
    health_note: null,
    safety_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'conn-comfyui',
    name: 'ComfyUI',
    connector_type: 'comfyui',
    status: 'not_configured',
    mode: 'mock',
    description: 'Local image generation',
    required_env_keys: ['COMFYUI_BASE_URL'],
    last_checked_at: null,
    health_note: null,
    safety_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MAX_LOG = 5;

export function computeSummary(items: ConnectorDashboardItem[]): ConnectorSummary {
  return {
    total: items.length,
    connected: items.filter(i => i.connector.status === 'connected').length,
    error: items.filter(i => i.connector.status === 'error').length,
    not_configured: items.filter(i => i.connector.status === 'not_configured').length,
  };
}

export function appendLog(
  existing: HealthCheckEntry[],
  entry: HealthCheckEntry,
): HealthCheckEntry[] {
  return [entry, ...existing].slice(0, MAX_LOG);
}

// T4-10-C: which governed connector key a registry connector_type projects.
// Registry types without a governed counterpart (anthropic / openai / gemini /
// comfyui) never receive commands.
const GOVERNED_KEY_BY_CONNECTOR_TYPE: Partial<Record<LocalConnectorType, GovernedConnectorKey>> = {
  canva: 'canva',
  meta_ads: 'meta',
  n8n: 'n8n',
  google_drive: 'google_drive',
  google_sheets: 'google_sheets',
};

/**
 * T4-10-C: route approved connector-command previews into the dashboard items —
 * pure local data projection (no API call, nothing runs). Without a map, items
 * are returned untouched and `commands` stays undefined.
 */
export function routeCommandsToItems(
  items: ConnectorDashboardItem[],
  commandsByConnector?: Map<GovernedConnectorKey, ConnectorCommand[]>,
): ConnectorDashboardItem[] {
  if (!commandsByConnector) return items;
  return items.map(item => {
    const key = GOVERNED_KEY_BY_CONNECTOR_TYPE[item.connector.connector_type];
    const commands = key ? commandsByConnector.get(key) : undefined;
    return commands ? { ...item, commands } : item;
  });
}

export function useConnectorDashboard(
  commandsByConnector?: Map<GovernedConnectorKey, ConnectorCommand[]>,
) {
  const [items, setItems] = useState<ConnectorDashboardItem[]>(() =>
    MOCK_REGISTRY.map(c => ({ connector: c, isChecking: false, healthLog: [] })),
  );

  const setChecking = useCallback((id: string, flag: boolean) => {
    setItems(prev =>
      prev.map(i => (i.connector.id === id ? { ...i, isChecking: flag } : i)),
    );
  }, []);

  const applyResult = useCallback(
    (
      id: string,
      entry: HealthCheckEntry,
      newStatus: LocalConnectorStatus,
      newHealthNote: string | null,
    ) => {
      setItems(prev =>
        prev.map(i => {
          if (i.connector.id !== id) return i;
          return {
            ...i,
            isChecking: false,
            healthLog: appendLog(i.healthLog, entry),
            connector: {
              ...i.connector,
              status: newStatus,
              health_note: newHealthNote,
              last_checked_at: entry.checked_at,
            },
          };
        }),
      );
    },
    [],
  );

  const checkN8n = useCallback(async () => {
    setChecking('conn-n8n', true);
    const start = Date.now();
    try {
      const raw = await checkN8nHealth();
      const latency = Date.now() - start;
      const entry: HealthCheckEntry = {
        checked_at: new Date().toISOString(),
        status: raw.healthy ? 'ok' : 'error',
        latency_ms: latency,
        note: raw.note,
      };
      applyResult('conn-n8n', entry, raw.healthy ? 'connected' : 'error', raw.note);
    } catch (err) {
      const entry: HealthCheckEntry = {
        checked_at: new Date().toISOString(),
        status: 'error',
        latency_ms: null,
        note: err instanceof Error ? err.message : 'Unknown error',
      };
      applyResult('conn-n8n', entry, 'error', entry.note);
    }
  }, [setChecking, applyResult]);

  const checkGDrive = useCallback(async () => {
    setChecking('conn-gdrive', true);
    const start = Date.now();
    try {
      const raw = await checkGdriveHealth();
      const latency = Date.now() - start;
      const entry: HealthCheckEntry = {
        checked_at: new Date().toISOString(),
        status: raw.healthy ? 'ok' : 'error',
        latency_ms: latency,
        note: raw.note,
      };
      applyResult('conn-gdrive', entry, raw.healthy ? 'connected' : 'error', raw.note);
    } catch (err) {
      const entry: HealthCheckEntry = {
        checked_at: new Date().toISOString(),
        status: 'error',
        latency_ms: null,
        note: err instanceof Error ? err.message : 'Unknown error',
      };
      applyResult('conn-gdrive', entry, 'error', entry.note);
    }
  }, [setChecking, applyResult]);

  const simulate = useCallback(
    (id: string) => {
      setChecking(id, true);
      setTimeout(() => {
        const entry: HealthCheckEntry = {
          checked_at: new Date().toISOString(),
          status: 'simulated',
          latency_ms: null,
          note: 'Mock simulate — no real API call',
        };
        applyResult(id, entry, 'configured', 'Simulated check OK');
      }, 600);
    },
    [setChecking, applyResult],
  );

  const handleCheck = useCallback(
    (item: ConnectorDashboardItem) => {
      const { connector_type, id } = item.connector;
      if (connector_type === 'n8n') {
        checkN8n();
      } else if (connector_type === 'google_drive') {
        checkGDrive();
      } else {
        simulate(id);
      }
    },
    [checkN8n, checkGDrive, simulate],
  );

  return {
    items: routeCommandsToItems(items, commandsByConnector),
    summary: computeSummary(items),
    handleCheck,
  };
}
