// readOnlyConnectorPreviewRegistry.ts — T4-16
// Registry of connector-specific READ-ONLY preview adapters (read receipts).
//
// - Nothing runs on import: previews happen only when an explicit check
//   function is called (the dashboard calls it from an Owner click, never
//   from an effect).
// - n8n wraps the pre-existing safe read wrapper fetchN8nData('workflows')
//   (T4-6, n8n-read Edge Function, GET-only allowlisted endpoint). Raw
//   responses are reduced to a whitelisted { id, name, summary } shape —
//   workflow definitions, node graphs, credentials, and links never pass
//   through (the contract sanitizer also redacts any link text).
// - google_drive: the gdrive-read Edge Function is Phase 1 (health-only) —
//   there is NO safe file-list surface yet, so the preview is blocked
//   locally with a clear message. No live call is invented, no data is faked.
// - canva: manual_only sandbox, blocked — no safe read surface exists yet.
// - meta: excluded — no safe read surface exists in repo.
// - No secrets, no env values, no URLs live in this file.

import {
  type ReadOnlyConnectorPreviewBase,
  type ReadOnlyConnectorPreviewItem,
  type ReadOnlyConnectorPreviewMode,
  type ReadOnlyConnectorPreviewResult,
  type ReadOnlyConnectorPreviewType,
  type ReadOnlyPreviewConnectorId,
  createAvailableReadOnlyConnectorPreviewResult,
  createBlockedConnectorPreviewResult,
  createDegradedReadOnlyConnectorPreviewResult,
  normalizeConnectorPreviewError,
  sanitizeReadOnlyPreviewItems,
} from './readOnlyConnectorPreview';
import { fetchN8nData, type N8nLiveResult } from './adapters/n8n/n8nLiveService';

export interface ReadOnlyConnectorPreviewDescriptor {
  connectorId: ReadOnlyPreviewConnectorId;
  label: string;
  mode: ReadOnlyConnectorPreviewMode;
  previewType: ReadOnlyConnectorPreviewType;
  readOnly: true;
  writesExternalSystems: false;
  publishesExternalSystems: false;
  requiresOwnerClick: true;
}

const DESCRIPTORS: readonly ReadOnlyConnectorPreviewDescriptor[] = Object.freeze([
  Object.freeze({
    connectorId: 'n8n',
    label: 'n8n Workflow (read-only)',
    mode: 'edge_read_proxy',
    previewType: 'n8n_workflows',
    readOnly: true,
    writesExternalSystems: false,
    publishesExternalSystems: false,
    requiresOwnerClick: true,
  } as const),
  Object.freeze({
    connectorId: 'google_drive',
    label: 'Google Drive (read-only)',
    mode: 'edge_read_proxy',
    previewType: 'gdrive_files',
    readOnly: true,
    writesExternalSystems: false,
    publishesExternalSystems: false,
    requiresOwnerClick: true,
  } as const),
  Object.freeze({
    connectorId: 'canva',
    label: 'Canva (sandbox preview only)',
    mode: 'manual_only',
    previewType: 'no_safe_read_surface',
    readOnly: true,
    writesExternalSystems: false,
    publishesExternalSystems: false,
    requiresOwnerClick: true,
  } as const),
  Object.freeze({
    connectorId: 'meta',
    label: 'Meta (not registered)',
    mode: 'excluded',
    previewType: 'no_safe_read_surface',
    readOnly: true,
    writesExternalSystems: false,
    publishesExternalSystems: false,
    requiresOwnerClick: true,
  } as const),
]);

/** Defensive copies — callers can never mutate the registry. */
export function getReadOnlyConnectorPreviewDescriptors(): ReadOnlyConnectorPreviewDescriptor[] {
  return DESCRIPTORS.map(d => ({ ...d }));
}

/** Shape of the existing safe n8n read wrapper (list action). */
export type SafeN8nWorkflowListFn = () => Promise<N8nLiveResult>;

/**
 * Injectable dependencies — tests provide fakes so no network is ever
 * touched; the dashboard uses the defaults (the existing read-only wrapper).
 */
export interface ReadOnlyConnectorPreviewCheckDeps {
  fetchN8nWorkflows?: SafeN8nWorkflowListFn;
  nowIso?: () => string;
}

function baseFor(
  descriptor: ReadOnlyConnectorPreviewDescriptor,
  checkedAt: string,
  source: string,
): ReadOnlyConnectorPreviewBase {
  return {
    connectorId: descriptor.connectorId,
    label: descriptor.label,
    previewType: descriptor.previewType,
    mode: descriptor.mode,
    checkedAt,
    source,
  };
}

/**
 * Reduce one raw n8n workflow object to a whitelisted candidate. ONLY
 * id / name / active / updatedAt are read — nodes, connections, settings,
 * pinned data, tags, and credentials references are never copied.
 */
function n8nWorkflowToCandidate(raw: unknown): { id: unknown; name: unknown; summary: string } {
  const workflow = (raw ?? {}) as Record<string, unknown>;
  const active = workflow.active === true ? 'active: yes' : 'active: no';
  const updated =
    typeof workflow.updatedAt === 'string' ? ` · updated ${workflow.updatedAt}` : '';
  return { id: workflow.id, name: workflow.name, summary: `${active}${updated}` };
}

/** Pull the workflow array out of the wrapper's data payload, defensively. */
function extractN8nWorkflowList(data: unknown): unknown[] {
  const payload = (data ?? {}) as Record<string, unknown>;
  return Array.isArray(payload.data) ? payload.data : [];
}

async function runN8nWorkflowPreview(
  descriptor: ReadOnlyConnectorPreviewDescriptor,
  listWorkflows: SafeN8nWorkflowListFn,
  checkedAt: string,
): Promise<ReadOnlyConnectorPreviewResult> {
  const base = baseFor(
    descriptor,
    checkedAt,
    "n8nLiveService.fetchN8nData('workflows') (n8n-read Edge Function, GET-only allowlist)",
  );
  try {
    const raw = await listWorkflows();
    if (!raw.ok) {
      return createDegradedReadOnlyConnectorPreviewResult(
        base,
        raw.error ?? 'n8n read proxy reported an unhealthy response.',
        'read_proxy_unhealthy',
      );
    }
    const items: ReadOnlyConnectorPreviewItem[] = sanitizeReadOnlyPreviewItems(
      extractN8nWorkflowList(raw.data).map(n8nWorkflowToCandidate),
    );
    return createAvailableReadOnlyConnectorPreviewResult(
      base,
      items,
      `${items.length} workflow(s) visible via the read-only proxy — a read receipt, nothing was started or changed.`,
    );
  } catch (err) {
    return normalizeConnectorPreviewError(base, err);
  }
}

/**
 * Check ONE connector's read-only preview. Only called from explicit Owner
 * actions — this module never schedules or auto-runs anything.
 */
export async function checkReadOnlyConnectorPreview(
  connectorId: ReadOnlyPreviewConnectorId,
  deps?: ReadOnlyConnectorPreviewCheckDeps,
): Promise<ReadOnlyConnectorPreviewResult> {
  const descriptor = DESCRIPTORS.find(d => d.connectorId === connectorId);
  const checkedAt = (deps?.nowIso ?? (() => new Date().toISOString()))();
  if (!descriptor) {
    throw new Error(`Unknown read-only preview connector id: ${String(connectorId)}`);
  }
  switch (descriptor.connectorId) {
    case 'n8n':
      return runN8nWorkflowPreview(
        descriptor,
        deps?.fetchN8nWorkflows ?? (() => fetchN8nData('workflows')),
        checkedAt,
      );
    case 'google_drive':
      // Phase 1 gdrive-read is health-only — a file-list preview would be
      // rejected by the Edge Function itself. Blocked locally, never faked.
      return createBlockedConnectorPreviewResult(
        baseFor(descriptor, checkedAt, 'gdrive-read Edge Function (Phase 1, health-only)'),
        'Google Drive file-list preview is not available yet — the gdrive-read Edge Function is Phase 1 (health-only). No live data is shown and none is faked.',
        'no_list_surface_yet',
      );
    case 'canva':
      return createBlockedConnectorPreviewResult(
        baseFor(descriptor, checkedAt, 'canvaSandboxConnector (local sandbox, no network)'),
        'Canva has no safe read surface yet — sandbox previews are built locally and reviewed manually (manual_only).',
        'no_read_surface',
      );
    case 'meta':
      return createBlockedConnectorPreviewResult(
        baseFor(descriptor, checkedAt, 'not registered (no adapter exists)'),
        'Meta has no safe read surface in this repo and is deliberately excluded from connector previews.',
        'excluded_no_read_surface',
      );
  }
}

/** Check every registered connector. Explicit call only — never on import. */
export async function checkAllReadOnlyConnectorPreviews(
  deps?: ReadOnlyConnectorPreviewCheckDeps,
): Promise<ReadOnlyConnectorPreviewResult[]> {
  return Promise.all(
    DESCRIPTORS.map(d => checkReadOnlyConnectorPreview(d.connectorId, deps)),
  );
}
