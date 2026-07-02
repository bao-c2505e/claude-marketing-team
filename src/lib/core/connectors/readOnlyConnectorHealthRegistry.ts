// readOnlyConnectorHealthRegistry.ts — T4-15
// Registry of read-only connector health adapters.
//
// - Nothing runs on import: checks happen only when an explicit check function
//   is called (the dashboard calls it from an Owner click, never from an effect).
// - Wraps ONLY the safe read-only wrappers that already exist in the repo
//   (n8nLiveService.checkN8nHealth, gdriveLiveService.checkGdriveHealth — both
//   health-only reads through Supabase Edge Functions).
// - Connectors without a safe read surface (Canva) are reported blocked /
//   manual_only instead of gaining a new live client.
// - No secrets, no env values, no URLs live in this file.

import {
  type ReadOnlyConnectorHealthBase,
  type ReadOnlyConnectorHealthResult,
  type ReadOnlyConnectorId,
  type ReadOnlyConnectorMode,
  createAvailableReadOnlyConnectorHealthResult,
  createBlockedConnectorHealthResult,
  createDegradedReadOnlyConnectorHealthResult,
  normalizeConnectorHealthError,
} from './readOnlyConnectorHealth';
import { checkN8nHealth } from './adapters/n8n/n8nLiveService';
import { checkGdriveHealth } from './adapters/drive/gdriveLiveService';

export interface ReadOnlyConnectorHealthDescriptor {
  connectorId: ReadOnlyConnectorId;
  label: string;
  mode: ReadOnlyConnectorMode;
  readOnly: true;
  writesExternalSystems: false;
  publishesExternalSystems: false;
  requiresOwnerClick: true;
}

const DESCRIPTORS: readonly ReadOnlyConnectorHealthDescriptor[] = Object.freeze([
  Object.freeze({
    connectorId: 'n8n',
    label: 'n8n Workflow (read-only)',
    mode: 'edge_read_proxy',
    readOnly: true,
    writesExternalSystems: false,
    publishesExternalSystems: false,
    requiresOwnerClick: true,
  } as const),
  Object.freeze({
    connectorId: 'google_drive',
    label: 'Google Drive (read-only)',
    mode: 'edge_read_proxy',
    readOnly: true,
    writesExternalSystems: false,
    publishesExternalSystems: false,
    requiresOwnerClick: true,
  } as const),
  Object.freeze({
    connectorId: 'canva',
    label: 'Canva (sandbox preview only)',
    mode: 'manual_only',
    readOnly: true,
    writesExternalSystems: false,
    publishesExternalSystems: false,
    requiresOwnerClick: true,
  } as const),
]);

/** Defensive copies — callers can never mutate the registry. */
export function getReadOnlyConnectorHealthDescriptors(): ReadOnlyConnectorHealthDescriptor[] {
  return DESCRIPTORS.map(d => ({ ...d }));
}

/** Shape shared by the existing safe health wrappers. */
export type SafeHealthCheckFn = () => Promise<{ healthy: boolean; note: string }>;

/**
 * Injectable dependencies — tests provide fakes so no network is ever touched;
 * the dashboard uses the defaults (the existing read-only wrappers).
 */
export interface ReadOnlyConnectorHealthCheckDeps {
  checkN8nHealth?: SafeHealthCheckFn;
  checkGdriveHealth?: SafeHealthCheckFn;
  nowIso?: () => string;
}

function baseFor(
  descriptor: ReadOnlyConnectorHealthDescriptor,
  checkedAt: string,
  source: string,
): ReadOnlyConnectorHealthBase {
  return {
    connectorId: descriptor.connectorId,
    label: descriptor.label,
    mode: descriptor.mode,
    checkedAt,
    source,
  };
}

async function runWrappedCheck(
  descriptor: ReadOnlyConnectorHealthDescriptor,
  check: SafeHealthCheckFn,
  source: string,
  checkedAt: string,
): Promise<ReadOnlyConnectorHealthResult> {
  const base = baseFor(descriptor, checkedAt, source);
  try {
    const raw = await check();
    return raw.healthy
      ? createAvailableReadOnlyConnectorHealthResult(base, raw.note)
      : createDegradedReadOnlyConnectorHealthResult(base, raw.note);
  } catch (err) {
    return normalizeConnectorHealthError(base, err);
  }
}

/**
 * Check ONE connector's read-only health. Only called from explicit Owner
 * actions — this module never schedules or auto-runs anything.
 */
export async function checkReadOnlyConnectorHealth(
  connectorId: ReadOnlyConnectorId,
  deps?: ReadOnlyConnectorHealthCheckDeps,
): Promise<ReadOnlyConnectorHealthResult> {
  const descriptor = DESCRIPTORS.find(d => d.connectorId === connectorId);
  const checkedAt = (deps?.nowIso ?? (() => new Date().toISOString()))();
  if (!descriptor) {
    throw new Error(`Unknown read-only connector id: ${String(connectorId)}`);
  }
  switch (descriptor.connectorId) {
    case 'n8n':
      return runWrappedCheck(
        descriptor,
        deps?.checkN8nHealth ?? checkN8nHealth,
        'n8nLiveService.checkN8nHealth (n8n-read Edge Function, health action only)',
        checkedAt,
      );
    case 'google_drive':
      return runWrappedCheck(
        descriptor,
        deps?.checkGdriveHealth ?? checkGdriveHealth,
        'gdriveLiveService.checkGdriveHealth (gdrive-read Edge Function, health action only)',
        checkedAt,
      );
    case 'canva':
      // No live read surface exists in this repo — the Canva connector is a
      // pure local sandbox preview builder. Nothing is contacted.
      return createBlockedConnectorHealthResult(
        baseFor(descriptor, checkedAt, 'canvaSandboxConnector (local sandbox, no network)'),
        'Canva has no live read surface in this repo — sandbox previews are built locally and reviewed manually (manual_only).',
        'no_read_surface',
      );
  }
}

/** Check every registered connector. Explicit call only — never on import. */
export async function checkAllReadOnlyConnectorHealth(
  deps?: ReadOnlyConnectorHealthCheckDeps,
): Promise<ReadOnlyConnectorHealthResult[]> {
  return Promise.all(
    DESCRIPTORS.map(d => checkReadOnlyConnectorHealth(d.connectorId, deps)),
  );
}
