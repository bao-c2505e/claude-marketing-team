# T4-12 — Cross-tab Connector Command State Architecture Proposal

- **Sprint:** T4-12 — Cross-tab Connector Command State Architecture Proposal (design + recon + contract)
- **Baseline commit:** `df64542` (T4-11-B — receipts wire-in via section co-location)
- **Status at baseline:** 845 passed / 0 failed / 0 skipped, 57 test files, tsc 0 error, build OK
- **Deliverables of this sprint:** this document + pure contract (`connectorCommandSnapshot.ts`) + contract tests. **No runtime wire-in.**

---

## 1. Current problem

T4-10-C built a read surface on the Connector Dashboard ("Approved assets targeting this connector" in `ConnectorDetailPanel`, `useConnectorDashboard(commandsByConnector?)`, `routeCommandsToItems`) — but nothing feeds it. Connector command previews are born inside `CoreV1FlowPanel` (Campaign Workspace tab) and die there. The original T4-11-A plan ("CampaignWorkspace passes a map to ConnectorDashboard") was found architecturally impossible in recon:

1. `ConnectorDashboard` is **not** rendered by `CampaignWorkspace` — it is a separate top-level tab (`App.tsx:1863`, lazy, no props).
2. `CampaignWorkspace` is **stateless by invariant** (Phase K guard: `CampaignWorkspace.source.test.ts:77` forbids `useState|useReducer`).
3. App tabs render **conditionally** (`{activeTab === '...' && <Tab/>}`) — switching tabs **unmounts** the entire subtree, so any React state inside the workspace (including built command previews and evidence) is destroyed before the dashboard tab even mounts.

So commands need a home that survives tab unmount, without making the workspace stateful and without giving anything execution capability.

## 2. Recon findings (verified at `df64542`)

| Question | Finding |
|---|---|
| Where is CoreV1 status built? | `buildCoreV1IntegrationStatus` (pure, `src/lib/core/coreV1Integration.ts`), called inside `CoreV1FlowPanel` from local campaign data + receipt props. |
| Where are ConnectorCommands generated? | Only inside `CoreV1FlowPanel` (`buildConnectorCommands` in a `useMemo`, on explicit Owner "Build command previews" click, for ONE Owner-chosen target connector; ids regenerate per build; lifecycle overrides are local panel state). Ephemeral. |
| Where does CoreV1FlowPanel render after T4-11-B? | Inside `ManualPublishingEvidenceSection` (first child), which `CampaignWorkspace` renders; workspace stays stateless. |
| Who owns campaign/client/brief/content/approval/evidence data? | `App.tsx` (stateful root) owns core data via localStorage-backed `coreData.ts` hooks and passes scoped slices into the workspace tab. Manual publishing evidence lives in `ManualPublishingEvidenceSection` local state. |
| What does the Connector Dashboard know? | Registry/health only (`MOCK_REGISTRY`, health checks). It knows nothing about campaigns or commands. |
| Can it receive commands today? | Yes — the T4-10-C surface is ready: `useConnectorDashboard(commandsByConnector?: Map<GovernedConnectorKey, ConnectorCommand[]>)` + `routeCommandsToItems` + `ConnectorDetailPanel` `commands` prop. `ConnectorDashboard()` just never passes the param. |
| Existing shared state/provider/store patterns? | (a) `AuthContext` — the only React context; (b) `coreData.ts` — localStorage-backed data layer; (c) `coreRepository.ts` — future repository **interface plan** (Phase 15, no implementation). No cross-tab UI state pattern exists yet; **no conflict** with the options below. |
| Tab lifecycle | Conditional render per `activeTab` → tabs unmount on switch. Workspace and dashboard are never mounted at the same time. |

## 3. Architecture options

| | A. React Context | B. In-memory repository singleton | C. session/localStorage | D. Hybrid repo + storage snapshot | E. Event-driven dispatch |
|---|---|---|---|---|---|
| Fits current tree | Needs a new provider in `App.tsx` above tabs (App-level surgery) | Perfect — plain TS module, no tree change | No tree change | No tree change | Needs listener plumbing in both tabs |
| Testability (no-DOM convention) | **Poor** — providers/hooks need a renderer; repo has no jsdom/testing-library by design | **Excellent** — pure unit tests | OK, but needs storage mocks | OK (repo part pure) | Poor — async ordering, listener lifecycles |
| Phase K risk | Low (provider above workspace), but tempts future state creep | **None** — workspace untouched | None | None | None |
| Survives tab switch | Yes (provider persists) | **Yes** (module lifetime) | Yes | Yes | Only if paired with a store anyway |
| Survives refresh | No | **No — by design** (see §4) | Yes — but creates **stale-command risk**: storage can outlive the approvals that justified the commands; replaying an old `approved_for_manual_run` preview after approvals changed violates approval-first integrity. Needs expiry + re-validation to be safe | Optional, gated by re-validation | No |
| Hidden-state risk | Low | Medium — mitigated by tiny explicit API, `reset()`, validation on write, contract tests | Medium (silent stale data) | Medium | **High** — invisible side effects, hardest to audit |
| Future receipts/audit | Awkward (UI-coupled) | **Good** — snapshot carries `builtBy`/`builtAt`; store can append read/ack receipts later | Possible but conflates audit with cache | **Best long-term** (repo = truth, storage = explicit snapshot with re-validation) | Poor |
| Complexity | Medium | **Low** | Medium (serialization/invalidation contract) | High now | High |
| Future live read/health/write safety | Neutral | Neutral — store holds plain data, no capability | Risky (persisted "intent" objects) | Neutral | Risky |

## 4. Recommended architecture — **Option B: in-memory repository singleton, speaking the snapshot contract (with D as the future evolution path)**

A tiny module-level store, `connectorCommandStore` (T4-13), that holds **at most one validated `ConnectorCommandSnapshot`** (plain data). It matches the repo's strengths (pure-TS, source-scan + pure-unit test convention), touches neither `App.tsx` providers nor the Phase K invariant, and its deliberate non-persistence is a safety feature.

Explicit answers:

- **Where does `commandsByConnector` live?** Derived on read: the dashboard reads the stored snapshot and calls `groupCommandsByConnector(snapshot.commands)` (pure, added this sprint). The store itself holds only the snapshot.
- **Who writes?** Only `CoreV1FlowPanel`, on an **explicit Owner action** (a "Share previews with Connector Dashboard (read-only)" action in T4-13 — sharing a preview, not sending a command; label must keep the read-only framing). The write path is: build (approval-gated) → `createConnectorCommandSnapshot` → `validateConnectorCommandSnapshot` → store accepts only `ok === true`.
- **Who reads?** `ConnectorDashboard` (via `useConnectorDashboard`), read-on-mount — tabs never coexist, so no subscription is required in T4-13 (a `subscribe()` can be added later without breaking the API).
- **Minimal API (T4-13):** `publishSnapshot(snapshot): ConnectorCommandSnapshotValidation` (rejects invalid), `readSnapshot(): ConnectorCommandSnapshot | null`, `clearSnapshot(): void`, `resetForTests(): void`. Nothing else.
- **Persist across refresh?** **No.** Commands are previews *derived* from Owner approvals; after a refresh they must be rebuilt from the current approval state, never replayed from a cache that may have outlived its approvals. Losing them on refresh is correct, not a defect.
- **How do we avoid auto-execution?** The store holds plain data with no callbacks and no side effects; every command keeps hard-false `publishesContent/launchesAds/spends/autoRuns/usesLiveConnector` and the validator rejects any tampering; readers render read-only projections (the T4-10-C surface already carries "This does not publish or emit anything.").
- **How do we preserve approval-first?** `validateConnectorCommandSnapshot` rejects any command without `createdFromApprovedAsset === true`, any campaign mismatch, any tampered gate flag, and any unknown status (there is no `published` status). Validation runs on write; readers may re-run it.
- **Phase K?** Untouched. Writer is the already-stateful `CoreV1FlowPanel`; reader is the dashboard hook. `CampaignWorkspace` gains no state, no imports, no changes.
- **Future receipts?** The snapshot already carries `builtBy`/`builtAt` provenance. T4-14+ can extend the store with an append-only receipt log (e.g., `readAt`, owner acknowledgements) without changing the snapshot shape (`schemaVersion` guards migrations).

## 5. T4-13 implementation plan

**Files to create**
- `src/lib/core/connectors/connectorCommandStore.ts` — module singleton implementing the minimal API above; validates on write; no persistence, no network, no React.
- `src/lib/core/connectors/connectorCommandStore.test.ts` — pure unit: publish valid → readable; publish invalid → rejected + store unchanged; clear/reset; defensive copies; source-scan guard (no storage/network/React).

**Files to edit**
- `src/components/core/CoreV1FlowPanel.tsx` — add the explicit Owner share action (read-only framing, e.g. "Share previews with Connector Dashboard (read-only)"; never "send/emit/publish"); calls `createConnectorCommandSnapshot` + `publishSnapshot` inside the existing handler layer. No new network, no auto-share on build.
- `src/components/core/CoreV1FlowPanel.source.test.ts` — assert share-action label present, forbidden wording still absent, `publishSnapshot` only called from an onClick handler path.
- `src/connectors/dashboard/ConnectorDashboard.tsx` — read snapshot on mount, `groupCommandsByConnector`, pass into `useConnectorDashboard(...)`; optionally show snapshot provenance line ("previews shared by {builtBy} at {builtAt} — read-only").
- `src/connectors/dashboard/ConnectorDashboard.test.ts` — source-scan: dashboard reads via store API only, no direct build, no network; provenance copy present.

**Expected types** — already defined this sprint in `connectorCommandSnapshot.ts` (`ConnectorCommandSnapshot`, `ConnectorCommandSnapshotValidation`, `createConnectorCommandSnapshot`, `validateConnectorCommandSnapshot`, `groupCommandsByConnector`).

**Safety checks (gate):** tsc 0 error; full vitest 0 failed; build OK; greps — no `fetch(|axios|XMLHttpRequest|https?://` in touched files; hard-false flag literals ≥ 10 and hard-true ≥ 6 in `connectorCommand.ts`; `CampaignWorkspace.tsx` still has 0 `useState|useReducer` and 0 `<CoreV1FlowPanel`; no `gửi lệnh|send command|emit` labels beyond negation copy.

**Stop conditions:** any need to touch `App.tsx`; any subscription/effect that auto-publishes without an Owner click; validator weakened; Phase K guard touched; any persistence added.

**Validation commands:** `npx tsc --noEmit` · `npx vitest run` · `npm run build` + the greps above.

## 6. Safety invariants (unchanged, restated)

Approval-first is mandatory · Approved ≠ Published · Client Accepted ≠ Published · Published = Owner manual evidence only · no auto-post / auto-ads / live analytics / fake metrics / secrets / real webhook URLs · connector commands never execute, and no `published` status exists for them · Phase K: `CampaignWorkspace` stays stateless · `CoreV1FlowPanel` stays inside `ManualPublishingEvidenceSection`.

## 7. T4-13 implementation note (landed)

T4-13 implemented the recommendation exactly as specified in §5:

- `src/lib/core/connectors/connectorCommandStore.ts` — in-memory repository singleton; validates on write (rejects invalid snapshots, store unchanged), defensive copies on write AND read, `clearConnectorCommandSnapshot` + `resetConnectorCommandStoreForTests`. **No persistence** of any kind — refresh clears shared previews by design.
- Writer: `CoreV1FlowPanel` "Share read-only previews with Connector Dashboard" — **explicit Owner click only** (no effect hook exists in the panel, enforced by source guard), confirmation copy "Read-only connector previews shared for dashboard review."
- Reader: `ConnectorDashboard` reads the snapshot **once on mount** (no polling/subscription), groups via `groupCommandsByConnector`, feeds the existing `useConnectorDashboard(commandsByConnector)` surface, forwards `commands` into `ConnectorDetailPanel`, and shows provenance ("Read-only previews shared by {builtBy} at {builtAt} … Nothing here publishes or runs anything.").
- Empty store keeps the previous dashboard behavior exactly. Nothing executes; snapshot validation is unweakened; Phase K untouched.

**T4-14+ future:** expiry / re-validation-against-current-approvals design before any storage persistence; optional store subscription if surfaces ever mount simultaneously; append-only receipt/acknowledgement log; real read/health connector layer design; `activationStatus='live'` governance semantics (separate recon).

## 8. Out of scope until T4-14/T4-15 (status as written at T4-13; see §9 for what T4-14 landed)

- Any persistence of snapshots (Option D's storage half): requires an expiry + re-validation-against-current-approvals design first.
- Store subscriptions / live updates between simultaneously mounted surfaces (tabs currently never coexist).
- Receipt/acknowledgement log on the store.
- `activationStatus='live'` governance semantics (separate recon — high semantic risk).
- Any live connector read/health/write beyond what already exists.

## 9. T4-14 implementation note (landed) — snapshot freshness & integrity hardening

T4-14 hardens the T4-13 handoff **before** any real connector work. Still no persistence, no network, no execution, no App.tsx change, Phase K untouched.

**Freshness helper** — `src/lib/core/connectors/connectorCommandSnapshotFreshness.ts` (pure TS, clock ALWAYS injected as `nowMs`, no `Date.now()` inside — enforced by source guard):
- `CONNECTOR_COMMAND_SNAPSHOT_MAX_AGE_MS` = 24h default threshold (overridable per call).
- `parseSnapshotBuiltAt` / `getConnectorSnapshotAgeMs` (future `builtAt` clamps to age 0 — clock skew never crashes or falsely stales), `getConnectorSnapshotFreshness` → `'fresh' | 'stale' | 'invalid_timestamp'` (boundary: exactly `maxAgeMs` is already stale), `isConnectorSnapshotStale` (conservative: `invalid_timestamp` also counts — an unknowable age is never trusted), `formatConnectorSnapshotAgeLabel` ("just now" / "N minutes|hours|days ago" / "unknown age").

**Validation-on-read** — `connectorCommandStore.ts` additions (write validation unchanged):
- `getValidatedConnectorCommandSnapshot()` / `getValidatedConnectorCommandsByConnector()` — re-run the T4-12 integrity guard before surfacing; a failing snapshot is **withheld (null / empty Map), never repaired**. Defensive copies kept.
- `getConnectorCommandSnapshotStatus(nowMs?)` → `{ hasSnapshot, isValid, freshness, ageLabel, reason }`. Write validation makes a contract-invalid stored snapshot unreachable via the public API, so read validation is defense in depth; the genuinely reachable read-time case is a bad `builtAt` (provenance is not part of the contract guard) → `freshness: 'invalid_timestamp'`.

**Stale preview behavior** — a stale (or unreadable-timestamp) snapshot stays visible as a read-only preview; the status flags it and the dashboard shows: *"This preview may be stale. Rebuild from the current approval state before connector work."* Staleness never hides, runs, or edits anything.

**Dashboard** (`src/connectors/dashboard/ConnectorDashboard.tsx` — note: the dashboard lives here, not under `src/components/core/`):
- Reads ONLY the validated store path + status, once on mount (still no polling/subscription/effects — source-guarded).
- Provenance line now includes age label + freshness next to `builtBy`/`builtAt`.
- New Owner action **"Clear read-only preview"** — calls `clearConnectorCommandSnapshot()` and resets the dashboard's local snapshot state to the empty default. It touches nothing else (approvals, publishing evidence, Brand Brain, campaign data are unaffected — the store holds only preview data).
- A snapshot that fails re-validation on read is withheld with an explanatory line instead of being rendered.

**Campaign-keyed store — intentionally deferred.** The store still holds ONE latest snapshot. A `Map<campaignId, snapshot>` with merged dashboard rendering would make the single provenance/freshness line ambiguous (whose `builtBy`/`builtAt`/age?) — exactly the T4-14 stop condition. Revisit only with a per-campaign dashboard surface design (T4-15+). Known accepted limitation: sharing previews for a second campaign replaces the first.

**Re-validation against CURRENT approval state — deferred to T4-15/T4-16.** The dashboard tab has no access to live approval/campaign data without App.tsx prop threading or a global provider (both stop conditions). T4-14 therefore validates contract + provenance + freshness on read; comparing a snapshot against the approvals as they exist *now* needs a read-only approval-state access design first. This is also why **persistence still waits**: a persisted snapshot would outlive its approvals, so expiry (now available via freshness) must be paired with that approval re-validation design before Option D's storage half is safe.

**T4-15 recommended next step:** real connector **read/health layer only** (no write/publish paths), building on the hardened handoff.
