# Connector Activation Safety Runbook

> Project: **The Core Agency / CLAUDE_MARKETING_TEAM**
> Status: **Documentation only.** No connector is activated by this runbook.
> Authority: Owner is the only approval authority. Connectors stay OFF
> (`CONNECTORS_ENABLED=false`, `CONNECTOR_DRY_RUN=true`) until a per-connector
> Owner sign-off is logged.

---

## 1. Purpose

Define the **staged, approval-gated** process for taking any external connector
(n8n AI providers, Canva, Meta, TikTok, Zalo, Google Ads, analytics) from
"documented idea" to "production-monitored" — **without ever** auto-posting,
auto-launching ads, spending budget, contacting real customers, or leaking
secrets. Every stage has an explicit exit gate; you cannot skip stages.

This runbook complements `CLAUDE.md` (§4 Safety Principles, §6 Output Status
Model, §7 Connector Roadmap) and the per-module activation runbooks in this
folder.

---

## 2. Connector Activation Stages

Advance one stage at a time. Each stage requires the previous stage's exit
condition to be met **and** (from Stage 3 onward) a logged Owner approval.

### Stage 1 — Documentation only
- Write/maintain the connector's intent, scope, data flow, and limits in docs.
- No code, no env var, no credential, no network call.
- **Exit:** design reviewed; risks listed.

### Stage 2 — Placeholder env only
- Add the connector's variables to `.env.example` as **empty/placeholder**
  values (already done for the roadmap connectors).
- No real values anywhere. `CONNECTORS_ENABLED=false`, `CONNECTOR_DRY_RUN=true`.
- **Exit:** placeholders documented; secrets-scan clean.

### Stage 3 — Sandbox credentials
- Use **sandbox / test-mode** credentials only, stored in n8n Credentials,
  Vercel env, Supabase env, or local `.env.local` — **never committed**.
- No production accounts, no real ad accounts, no real pages.
- **Exit:** ⛔ **Owner approval logged** to use sandbox creds for this connector.

### Stage 4 — Dry-run connector call
- Execute the connector in **dry-run / validate** mode (no state change on the
  external service). Verify request shape, auth, and response parsing.
- `CONNECTOR_DRY_RUN=true` enforced.
- **Exit:** dry-run succeeds; full request/response logged; no external mutation.

### Stage 5 — Draft-only connector action
- Allow the connector to create **drafts** on the external service that have **no
  public effect** (e.g. an unpublished Canva design, an ads draft NOT submitted,
  a saved-but-not-sent message template).
- Output is recorded in Core as `draft` / `needs_review` / `pending_approval`.
- **Exit:** draft created and visible; nothing public/live; action logged.

### Stage 6 — Approval-gated export / publish / launch
- Only an item at status `approved` (Owner action in Core) may proceed.
- A **separate, explicit, human-confirmed** step performs the export/publish/
  launch. The relevant feature flag must be ON
  (e.g. `ALLOW_CANVA_EXPORT_AFTER_APPROVAL=true`, and for ads a per-launch
  confirmation). AI/n8n/callbacks may **never** trigger this step alone.
- On success, Core moves the item to `published` / `launched` (terminal).
- **Exit:** ⛔ **Owner approval logged** per item/per action; result logged.

### Stage 7 — Production monitoring
- Monitor logs, error/retry/dead-letter, spend (if any), and rate limits.
- Keep the kill switch (`CONNECTORS_ENABLED=false`) reachable at all times.
- **Exit:** steady-state monitoring documented; rollback rehearsed.

---

## 3. Mandatory Approval Gates

These gates are non-negotiable and cannot be automated away:

1. **Sandbox-credential gate** (before Stage 3): Owner approves using any real
   credential, even sandbox.
2. **External-action gate** (before Stage 6): Owner approves the *first* time a
   connector may affect the external world for a given connector.
3. **Per-item / per-launch gate** (at Stage 6): the specific item must be
   `approved` in Core, and the publish/launch is a separate human confirmation.
4. **Spend gate** (ads): any nonzero budget requires explicit Owner approval of
   the amount before launch.

A callback from n8n or a module is **non-authoritative** and can never satisfy
any of these gates.

---

## 4. Canva-specific Safety

> **Current phase = Stage 1–2 only (sandbox/mock).** CORE today has just the
> offline **Canva Sandbox Preview** (`src/lib/core/connectors/canvaSandboxConnector.ts`):
> no real Canva API/SDK/OAuth/token/env, no Canva design created, nothing
> published, real connector action = none. Everything below (Stage 5+ live draft
> creation/export) is **future-only** and requires the staged, Owner-signed-off
> activation in this runbook.

- **Allowed (future, Stage 5):** create a **draft/design** from a brand template
  via Canva Connect, and read template metadata.
- **Export:** only **after** the related Core item is `approved` **and**
  `ALLOW_CANVA_EXPORT_AFTER_APPROVAL=true` (Stage 6). Default flag is `false`.
- **Forbidden:** auto-publishing a design to any channel; treating a Canva
  export as approval; exporting anything still in `draft`/`needs_review`/
  `pending_approval`.

---

## 5. Meta / TikTok / Zalo / Google Ads Safety

- **Allowed:** create an ads **draft** or a **recommendation** (audiences,
  budget plan, creative copy as draft) — Stage 5, nothing submitted/live.
- **Forbidden without Owner approval:** launching/submitting a campaign, ad set,
  or ad; enabling/spending budget; attaching a real payment method; messaging
  real customers.
- **Forbidden always (in current scope):** auto-launch, auto-spend, or auto-DM
  driven by AI generation, an n8n callback, or a connector by itself.
- A launch is a Stage 6 action: item `approved` → explicit human launch
  confirmation → spend gate → log.

---

## 6. Analytics Safety

- **Allowed to automate:** **read-only** pulls (e.g. report metrics from a
  provider) once the connector passes Stages 1–4 and the read-only scope is
  Owner-approved.
- **Mandatory labeling:** any number that originates from a connector must be
  labeled **`connector-pulled data`** (distinct from `provided data` and
  `simulated data`). Never relabel connector data as verified ground truth, and
  never invent metrics.
- **Forbidden:** write/mutate actions under the guise of "analytics"; presenting
  unlabeled or unverified numbers; mixing simulated and pulled data without
  clear labels.

---

## 7. Logging Requirements

Every connector interaction (dry-run included) must log, at minimum:

- timestamp, connector name, stage, and `dry_run` flag;
- the Core item id / approval id it relates to (if any);
- request summary (no secrets) and response status;
- who/what triggered it (Owner action vs. system) and the approval reference;
- for ads: budget = 0 unless an approved nonzero amount, then log the amount.

Logs live under `CLAUDE_MARKETING_TEAM/08_logs/`. **Never log secrets, tokens,
full credentials, or raw access tokens.**

---

## 8. Rollback Plan

1. **Kill switch:** set `CONNECTORS_ENABLED=false` (and/or `CONNECTOR_DRY_RUN=true`)
   in the relevant env (n8n / Vercel / Supabase / `.env.local`) and redeploy /
   reload — this disables outbound connector actions immediately.
2. **Revoke:** rotate or revoke the connector's sandbox/production credentials in
   the provider dashboard and in n8n Credentials.
3. **Quarantine:** flip the connector's feature flag(s) back to the safe default
   (`ALLOW_AUTO_POST=false`, `ALLOW_AUTO_ADS_LAUNCH=false`,
   `ALLOW_CANVA_EXPORT_AFTER_APPROVAL=false`).
4. **Verify:** confirm no further outbound calls in logs; record the incident in
   `08_logs/`.
5. **Post-mortem:** document cause, blast radius, and the gate that should have
   caught it before re-attempting activation.

---

## 9. What Is Forbidden

- Activating any connector without completing its stages and logging the
  required Owner approvals.
- Committing real secrets, tokens, credentials, or real webhook URLs.
- Auto-post, auto-ads-launch, auto-spend, or auto-message to real customers.
- Letting an n8n callback or connector response set `approved`, `published`, or
  `launched`.
- Exporting/publishing/launching anything not at status `approved`.
- Presenting connector-pulled metrics without the `connector-pulled data` label,
  or presenting any fake/unverified metrics.
- Skipping dry-run/sandbox before a real action.
- Flipping any safety feature flag to an unsafe value without logged Owner
  approval.
