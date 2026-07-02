# T4-15 — Read-Only Connector Read/Health Layer

- **Sprint:** T4-15 — Real Connector Read/Health Layer Only
- **Baseline commit:** `a80619b` (T4-14 — snapshot freshness hardening)
- **Scope:** READ-ONLY health checks. Nothing in this layer can execute, write, publish, post, run ads, upload, or mutate any external system.

---

## 1. Why this layer exists

T4-13/T4-14 built the read-only ConnectorCommand handoff (in-memory store, validated snapshots, freshness). Before any deeper connector work, the dashboard needs a *normalized, provably read-only* way to answer one question on explicit Owner request: **"can this connector's read surface be reached right now?"** — without creating any new live API client and without giving anything write capability.

## 2. Adapter contract — `readOnlyConnectorHealth.ts`

Pure TypeScript. No network, no storage, no React, no secret handling, no clock (`checkedAt` is always supplied by the caller — same convention as `connectorCommandSnapshotFreshness.ts`).

```
ReadOnlyConnectorId            = 'n8n' | 'google_drive' | 'canva'
ReadOnlyConnectorHealthStatus  = 'unknown' | 'available' | 'degraded' | 'blocked' | 'unavailable'
ReadOnlyConnectorMode          = 'mock' | 'sandbox' | 'edge_read_proxy' | 'manual_only'

ReadOnlyConnectorHealthResult {
  connectorId, label, status, mode, checkedAt,
  canRead: boolean,
  canWrite: false, canPublish: false, canRunAds: false,   // literal false types
  source, message, safetyNote, errorCode?
}
```

Helpers:

| Helper | Behavior |
|---|---|
| `createAvailableReadOnlyConnectorHealthResult` | read surface responded → `available`, `canRead: true` |
| `createDegradedReadOnlyConnectorHealthResult` | surface responded unhealthy → `degraded` |
| `createBlockedConnectorHealthResult` | no safe read surface exists → `blocked` (nothing contacted) |
| `normalizeConnectorHealthError` | a thrown check becomes a `degraded` result — never rethrown |
| `assertReadOnlyConnectorHealthResult` | runtime guard: throws on any cast-forced truthy write flag or invalid shape; every result passes it before leaving the layer |

## 3. Registry — `readOnlyConnectorHealthRegistry.ts`

- `getReadOnlyConnectorHealthDescriptors()` — frozen descriptors, defensive copies; every descriptor is `readOnly: true`, `writesExternalSystems: false`, `publishesExternalSystems: false`, `requiresOwnerClick: true`.
- `checkReadOnlyConnectorHealth(connectorId, deps?)` / `checkAllReadOnlyConnectorHealth(deps?)` — explicit calls only; **nothing runs on module import** (source-guarded). `deps` allows full injection (`checkN8nHealth`, `checkGdriveHealth`, `nowIso`) so tests never touch the network.
- Wraps ONLY the safe read wrappers that already existed in the repo — **no new live API client was created in this sprint**:
  - `n8nLiveService.checkN8nHealth` (T4-6) → Supabase Edge Function `n8n-read`, `health` action only.
  - `gdriveLiveService.checkGdriveHealth` (T4-7) → Supabase Edge Function `gdrive-read`, health-only Phase 1.
- No secrets, env values, or URLs in this file; credentials live outside the repo (Supabase vault / `.env.local`).

## 4. Connector matrix

| Connector | Mode | Status when checked | canRead | Notes |
|---|---|---|---|---|
| n8n | `edge_read_proxy` | `available` / `degraded` | true when reachable | health of the read proxy only |
| google_drive | `edge_read_proxy` | `available` / `degraded` | true when reachable | Edge Fn Phase 1 — no Google API data call yet |
| canva | `manual_only` | always `blocked` (`no_read_surface`) | false | pure local sandbox preview builder; nothing is contacted |
| meta | — | **not registered** | — | no safe read/sandbox read surface exists in repo; deliberately excluded rather than faked |

## 5. Dashboard surface

`src/connectors/dashboard/ReadOnlyHealthSection.tsx` (rendered by `ConnectorDashboard.tsx`):

- Button **"Check read-only connector health"** — explicit Owner click required; **no `useEffect`, no auto-run on mount, no polling, no subscription** (source-guarded by `ConnectorDashboard.test.ts`).
- Shows per connector: label, status, mode, checkedAt, `read: yes/no`, the hard-false line **"write: no · publishing: no · ad spend: no"**, the check message, and the standing safety note.
- Blocked/manual_only connectors render their explanatory message instead of failing.
- Results are local component state only — no persistence of any kind.
- The section never reads ConnectorCommand snapshot items; T4-13/T4-14 preview/freshness/clear behavior is untouched and previews remain non-executable handoff artifacts.

## 6. Safety invariants

- Approval-first is mandatory · Approved ≠ Published · Client Accepted ≠ Published · Published = Owner manual evidence only.
- This layer can only **look**: hard-false `canWrite/canPublish/canRunAds` at type level AND runtime assertion; descriptors are hard-false for writes/publishing.
- No auto-post, no auto-ads, no live analytics, no fake metrics, no secrets in repo, no real webhook URLs, no connector write APIs, no execution of ConnectorCommand objects, no persistence.
- Phase K: `CampaignWorkspace` stays stateless; `App.tsx` untouched.

## 7. Why T4-15 is NOT a publishing connector

Every path in this layer terminates in a *description of reachability*. There is no code path that sends content, triggers a workflow, uploads a file, creates a post/draft, or spends budget — the wrapped Edge Function wrappers are health-only reads, the contract types make write capability unrepresentable without a cast, and the runtime assertion rejects casts. A future write/draft capability (if ever built) must be a **separate layer** gated by an explicit Owner approval design: per-action Owner click, approval-linked evidence, hard capability flags validated on both write and read — mirroring how ConnectorCommand previews are approval-gated today. Nothing in T4-15 may be reused as an execution channel.

## 8. Known limitations / follow-up

- Health = reachability of the read proxy, not data-level read previews (no workflow lists / file lists yet).
- The per-card "⚡ Check Health" (T4-8) and this normalized aggregate coexist; unifying them onto the normalized contract is a candidate for a later sprint.
- No re-validation of command snapshots against current approval state (unchanged from T4-14; needs a read-only approval-state access design).
- **T4-16 proposal:** connector-specific read previews or read receipts (n8n workflow list, gdrive file list once vault creds exist) — still read-only, still Owner-click-gated, normalized through this contract.
