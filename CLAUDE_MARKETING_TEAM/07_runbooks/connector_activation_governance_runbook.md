# Connector Activation Governance Runbook & Owner Sign-off Record

> Project: **The Core Agency / CLAUDE_MARKETING_TEAM**
> Status: **Documentation only.** No connector is activated by this runbook.
> Authority: **Owner is the only approval authority.** Every connector is
> **live-blocked by default**; nothing moves toward live without a logged Owner
> sign-off **and** completion of the staged
> [`connector_activation_safety_runbook.md`](connector_activation_safety_runbook.md).

This runbook makes the Phase I-S6 governance taxonomy (in
`src/lib/core/connectors/connectorGovernance.ts`) and the Phase I-S7 sign-off
contract (in `src/lib/core/connectors/connectorSignoff.ts`) human-usable. It
complements `CLAUDE.md` (§4 Safety, §6 Output Status Model, §7 Connector Roadmap).

---

## 1. Connector activation statuses

Every connector carries exactly one activation status. **None of these is
"live."** Live activation is a separate, future, staged action.

| Status | Meaning |
|---|---|
| `sandbox` | A safe **offline** preview exists (e.g. Canva Sandbox Preview). No real API, no env, nothing published. |
| `mock` | Registry/mock only. No real call is made; data is simulated locally. |
| `disabled` | Explicitly turned off. |
| `future_only` | On the roadmap but **not implemented** as a live connector. No runtime behaviour. |
| `live_blocked` | A live path may exist on the roadmap but is **hard-blocked** in code (all capability flags are `false` literals). |
| `requires_owner_signoff` | Gated behind an explicit, logged Owner sign-off (this runbook's record) **before** the staged activation may even begin. |

Live blocker flags (shared `CONNECTOR_LIVE_BLOCKERS`, all hard `false`):
`liveConnectorEnabled`, `publishEnabled`, `adsLaunchEnabled`, `webhookEnabled`,
`oauthEnabled`, `requiresEnv` — plus `ownerSignoffRequired: true` and
`approvedDoesNotPublish: true`.

---

## 2. Why Approved ≠ Published

- **Approval authorises internal use only.** An Owner approving a draft/preview
  item in Core means it is cleared for internal handoff/export prep — it does
  **not** put anything on a real channel and does **not** create a real design,
  post, or ad.
- **Publishing / launching is a separate, explicitly-confirmed human step** that
  only an `approved` item may enter, and only with the relevant publish/launch
  feature flag ON (default OFF). AI generation, an n8n callback, or a connector
  response can **never** perform it.
- **An approval preview is not publishing.** The Canva Sandbox Preview and the
  approval queue render a *draft spec* for Owner review. No external-world state
  is created at any point in the preview/approval path.

---

## 3. Why live activation is blocked by default

- The governance contract encodes every outward capability as a `false` **type
  literal**, so the codebase cannot represent a live/publish/ads/OAuth/webhook
  state — flipping one is a TypeScript error, not a config toggle.
- A recorded Owner sign-off is **necessary but not sufficient**: the sign-off
  record's `liveActivationGranted` / `publishCapabilityGranted` are also hard
  `false`. Going live additionally requires completing the staged safety runbook
  (sandbox creds → dry-run → draft-only → approval-gated action), which is
  future-only.

---

## 4. Required process before enabling any real connector

1. **Open an Owner sign-off record** (template in §6) for the specific connector.
2. **Complete the review checklist** (business reason, scope, env-keys review,
   OAuth/webhook/API risk, data-access review, publishing/ads/spend risk,
   rollback plan, test plan, safety checklist, Approved ≠ Published ack).
3. **Owner decision is logged** (`owner_signed_off` or `rejected`) under
   `08_logs/`. A callback/module can never set this.
4. **Run the staged activation** in
   [`connector_activation_safety_runbook.md`](connector_activation_safety_runbook.md)
   — sandbox creds → dry-run → draft-only → approval-gated export/publish/launch.
   Each stage has its own Owner gate.
5. **Publish/launch remains per-item + per-action**, with a separate human
   confirmation and (for ads) a spend gate. Default flags stay OFF.

No step here is automated, and none is enabled by this phase.

---

## 5. Connector activation matrix (current)

All connectors are **live-blocked**; Owner sign-off is **required**; **Approved ≠
Published** holds for every connector. Live / Publish / Ads launch / OAuth /
Webhook are all `false`.

| Connector | Status | Live | Publish | Ads launch | OAuth | Webhook | Env required now | Owner sign-off | Approved ≠ Published |
|---|---|---|---|---|---|---|---|---|---|
| Canva | `sandbox` | ✗ | ✗ | ✗ | ✗ | ✗ | none | required | ✓ |
| Meta Ads | `future_only` | ✗ | ✗ | ✗ | ✗ | ✗ | none | required | ✓ |
| TikTok Business | `future_only` | ✗ | ✗ | ✗ | ✗ | ✗ | none | required | ✓ |
| Zalo OA | `future_only` | ✗ | ✗ | ✗ | ✗ | ✗ | none | required | ✓ |
| Google Ads | `future_only` | ✗ | ✗ | ✗ | ✗ | ✗ | none | required | ✓ |
| Google Drive | `future_only` | ✗ | ✗ | ✗ | ✗ | ✗ | none | required | ✓ |
| Google Sheets | `future_only` | ✗ | ✗ | ✗ | ✗ | ✗ | none | required | ✓ |
| n8n Backbone | `mock` | ✗ | ✗ | ✗ | ✗ | ✗ | none | required | ✓ |

> "Env required now = none" means nothing is needed to run today. Future
> activation may need provider env keys (placeholders only, documented in
> `.env.example` + the staged runbook) — never committed, never real.

---

## 6. Owner sign-off record template

> Copy this block into `08_logs/` (one file per connector activation request).
> Filling it in does **not** enable anything — it records the Owner decision and
> the review that must precede the staged activation.

```
# Connector Activation Owner Sign-off — <Connector name>

- Connector name:               <e.g. Canva>
- Connector key:                <canva | meta | tiktok | zalo | google_ads | google_drive | google_sheets | n8n>
- Current activation status:    <sandbox | mock | future_only | live_blocked | disabled>
- Requested activation mode:    <requested next status — NOT auto-applied>
- Business reason:              <why this is needed>
- Owner approver:               <name>
- Date:                         <YYYY-MM-DD>
- Scope of activation:          <exactly what the connector may / may not do>
- Required env keys (if any):   <placeholders only; none required today>
- OAuth / webhook / API risk:   <review notes>
- Data access review:           <what data is read / written; where it goes>
- Publishing / ads / spend risk:<review notes; spend = 0 unless separately approved>
- Rollback plan:                <kill switch + revoke + verify steps>
- Test plan:                    <dry-run / sandbox validation steps>
- Safety checklist (CLAUDE.md §4):
    [ ] Approval-first preserved
    [ ] No auto-post / no auto-ads / no auto-spend
    [ ] No secrets committed
    [ ] Dry-run / sandbox first
    [ ] All connector actions logged
- Sign-off status:              <not_requested | pending_owner_signoff | owner_signed_off | rejected>
- Final Owner signature:        <signature / approval reference>

EXPLICIT: Approved ≠ Published. This sign-off does NOT grant publish/launch
capability. Going live additionally requires completing the staged
connector_activation_safety_runbook.md, with per-item and per-action Owner
confirmation. liveActivationGranted = false; publishCapabilityGranted = false.
```

---

## 7. What this runbook does NOT do

- It does **not** enable any connector, OAuth, webhook, env requirement, publish,
  ads launch, or auto-post.
- It does **not** add real APIs, SDKs, credentials, or external URLs.
- A recorded sign-off does **not** itself make a connector live — that is a
  separate, future, staged action behind additional Owner gates.
