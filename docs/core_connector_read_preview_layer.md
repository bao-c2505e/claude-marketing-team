# T4-16 — Connector-specific Read Previews / Read Receipts

- **Sprint:** T4-16 — Connector-specific Read Previews / Read Receipts
- **Baseline commit:** `fa8bb33` (T4-15 — read-only connector health layer)
- **Scope:** READ-ONLY previews. Nothing in this layer can execute, run/trigger workflows, write, publish, post, upload, create/edit files, or spend on ads.

---

## 1. What a "read preview / read receipt" is

A read receipt answers, on explicit Owner request: **"what does the connector's safe read surface show right now?"** — e.g. "3 active n8n workflows are visible". It is evidence of reachability plus a *sanitized glimpse*, not a data mirror and not a management surface. Nothing is started, changed, or stored.

## 2. Contract — `readOnlyConnectorPreview.ts`

Pure TypeScript. No network, no storage, no React, no secret handling, no clock (`checkedAt` always injected by the caller).

```
ReadOnlyPreviewConnectorId     = 'n8n' | 'google_drive' | 'canva' | 'meta'
ReadOnlyConnectorPreviewStatus = 'available' | 'degraded' | 'blocked'
ReadOnlyConnectorPreviewMode   = 'edge_read_proxy' | 'manual_only' | 'excluded'
ReadOnlyConnectorPreviewType   = 'n8n_workflows' | 'gdrive_files' | 'no_safe_read_surface'

ReadOnlyConnectorPreviewResult {
  connectorId, label, previewType, status, mode, checkedAt,
  items: readonly { id, name, summary }[],   // sanitized, frozen, max 20
  source, message, safetyNote, errorCode?,
  canWrite: false, canPublish: false, canRunAds: false, canExecute: false  // literal false
}
```

**Sanitization is structural.** Items can only be `{ id, name, summary }` scrubbed text: links are redacted (`[link removed]`), values are trimmed and capped at 120 chars, items without safe id+name are dropped, and the list is hard-capped at `READ_ONLY_PREVIEW_MAX_ITEMS = 20`. Raw connector payloads (workflow definitions/node graphs, file contents, credentials, tokens, private links) cannot be represented in the shape at all.

`assertReadOnlyConnectorPreviewResult` re-checks everything at runtime — including rejecting `canWrite/canPublish/canRunAds/canExecute` forced truthy through casts — and every creator/normalizer routes through it. `normalizeConnectorPreviewError` converts a thrown check into a `degraded` result; the layer never rethrows into the UI.

## 3. Registry — `readOnlyConnectorPreviewRegistry.ts`

- `getReadOnlyConnectorPreviewDescriptors()` — frozen, defensively copied descriptors; all `readOnly: true`, `writesExternalSystems: false`, `publishesExternalSystems: false`, `requiresOwnerClick: true`.
- `checkReadOnlyConnectorPreview(id, deps?)` / `checkAllReadOnlyConnectorPreviews(deps?)` — explicit calls only, nothing on import; deps (`fetchN8nWorkflows`, `nowIso`) are injectable so tests never touch the network.
- No secrets, env values, URLs, OAuth material, or client tokens in the file.

## 4. Connector matrix

| Connector | Mode | previewType | Behavior |
|---|---|---|---|
| n8n | `edge_read_proxy` | `n8n_workflows` | wraps the **pre-existing** `fetchN8nData('workflows')` (T4-6). The `n8n-read` Edge Function only allows GET on an allowlist (`health`, `workflows`, `executions`) — no trigger/run/POST-to-workflow path exists. Each workflow is reduced to whitelisted `id / name / active / updatedAt` before contract sanitization; node graphs, connections, static data, credentials references are never copied. `ok:false` → degraded; thrown → degraded. |
| google_drive | `edge_read_proxy` | `gdrive_files` | **blocked locally** (`no_list_surface_yet`): the `gdrive-read` Edge Function is Phase 1 health-only (any non-health action returns 403). No live list call is invented, no fake data is shown. Becomes wrappable when a safe list action + vault service account land. |
| canva | `manual_only` | `no_safe_read_surface` | blocked — no safe read surface exists yet; sandbox previews are built locally and reviewed manually. No OAuth, no token, no export/create. |
| meta | `excluded` | `no_safe_read_surface` | blocked — no safe read surface exists in this repo; deliberately excluded. No ads read/write work. |

## 5. Dashboard surface

`src/connectors/dashboard/ReadOnlyPreviewSection.tsx`, rendered by `ConnectorDashboard.tsx` directly under the T4-15 health section:

- Button **"Check read-only connector previews"** — explicit Owner click required; **no `useEffect`, no auto-run on mount, no polling, no subscription, no persistence** (source-guarded by `ConnectorDashboard.test.ts`).
- Per connector: label, previewType, status, mode, item count, checkedAt, message, standing safety note, and — for available previews — sanitized item summaries only.
- Blocked/excluded connectors render their explanatory message instead of failing.
- Standing caption: *"Read-only previews (read receipts) — no write, no publishing, no ads spend, no execution. Owner click only, never automatic."*
- The section never reads or touches ConnectorCommand snapshot data; the T4-13/T4-14 preview/freshness/clear surface and the T4-15 health section are unchanged (both guarded by tests).

## 6. Safety invariants

- Approval-first is mandatory · Approved ≠ Published · Client Accepted ≠ Published · Published = Owner manual evidence only.
- This layer can only **look**: four hard-false capability flags at type level AND runtime assertion; structural sanitization makes leaking payloads unrepresentable.
- No auto-post, no auto-ads, no live analytics, no fake metrics, no secrets in repo, no real webhook URLs, no OAuth tokens/client IDs, no connector write APIs, no ConnectorCommand execution, no persistence, no polling.
- Phase K: `CampaignWorkspace` stays stateless; `App.tsx` untouched; `activationStatus='live'` semantics unchanged.

## 7. Why T4-16 is not an execution or publishing layer

Every code path terminates in a frozen description. The only network-capable path is the pre-existing GET-only `n8n-read` allowlist read, and its response is reduced to three scrubbed text fields before it can reach the UI. There is no path that sends a payload to a workflow, triggers a run, creates/edits a file, or spends budget — and the wording, types, runtime assertions, and source-guard tests each independently forbid one. Any future write/draft capability must be a separate layer gated by an explicit Owner-approval design (per-action Owner click + approval-linked evidence), mirroring how ConnectorCommand previews are approval-gated today.

## 8. Known limitations / follow-up

- Google Drive preview stays blocked until `gdrive-read` Phase 2 (safe list action + `GDRIVE_SERVICE_ACCOUNT_JSON` in Supabase vault) exists — then the registry wraps it exactly like n8n.
- n8n preview shows at most 20 active workflows (Edge Function allowlist limit) as receipts — not a workflow management UI.
- Per-card T4-8 health checks, the T4-15 normalized health section, and this preview section coexist; unifying them is a candidate for a later sprint.
- **T4-17 proposal:** gdrive-read Phase 2 design (read-only list action, vault creds, normalized through this contract), or contract unification of the dashboard's three read surfaces.
