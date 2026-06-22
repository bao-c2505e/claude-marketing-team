# CLAUDE.md — The Core Agency / CLAUDE_MARKETING_TEAM

> Source-of-truth project context for AI builders working in this repository.
> If anything elsewhere conflicts with this file, **this file wins** for project
> identity, safety rules, and the output/connector model.
>
> Technical repo name: `claude-marketing-team` (kept to avoid breaking the
> Vercel deploy). Public/UI brand: **The Core Agency**. Live domain:
> https://coreagency.digital

---

## 1. Project Identity

- **Project:** The Core Agency / CLAUDE_MARKETING_TEAM.
- **Product:** An internal **AI Marketing Automation OS** for a marketing agency.
- **Focus:** **FnB / SME** marketing agency operations (campaign production,
  approvals, and connector-ready automation).
- **This project is independent** of any other project in this workspace. Do not
  import another project's scope, branding, or off-domain product context (e.g.
  non-FnB/SME verticals such as furniture/retail goods) into CORE. All demo/seed
  brands are fictional FnB/SME brands (e.g. `Vị Cuốn`, `Cơm Tấm Bản Khói`,
  `Mộc An Coffee`).

---

## 2. Current Mission

Build an internal operating system for **campaign production, approvals, and
connector-ready automation** — so an Owner can run an FnB/SME marketing agency
workflow end to end while every external-world action stays **approval-gated**.

Direction of travel: move toward **full automation with real connectors**, but
**always behind Owner approval gates** and **always dry-run/sandbox first**.

---

## 3. Core Workflow

The mandatory production flow. AI generation may move an item only up to
`pending_approval`; it may **never** create an external-world result on its own.

```
Owner brief
   → CORE request                  (Core builds a normalized request)
   → n8n workflow                  (automation runtime routes to an AI provider)
   → AI output                     (provider generates raw output)
   → normalized output             (Core normalizes into draft items)
   → approval queue                (draft / needs_review / pending_approval)
   → Owner approval                (human decision — the only approval authority)
   → ready for manual publish / export / launch
   → published / launched          (ONLY if explicitly confirmed AFTER approval,
                                     as a separate human-confirmed action)
```

- **Core is the source of truth.** n8n is automation backbone only (not a DB);
  modules do not store data; the UI reads from Core.
- Callbacks from n8n / modules are **non-authoritative** — they may log,
  validate, or echo a decision that already exists in Core, but they can never
  set or change an approval decision.

---

## 4. Safety Principles (non-negotiable)

1. **Approval-first.** Nothing leaves the draft/review pipeline without an
   explicit Owner approval action in the Core UI.
2. **Approved ≠ Published.** Approval authorizes *internal* use only. Publishing
   or launching is a separate, explicitly-confirmed human step.
3. **No auto-post** to any real channel without Owner approval.
4. **No auto-ads-launch** and **no ad spend** without Owner approval.
5. **No fake / unverified metrics.** Report data must be labeled as
   *provided data*, *simulated data*, or *connector-pulled data*.
6. **No secrets in the repo.** Ever. (See §7 and `.env.example`.)
7. **All connector actions logged.** Every connector call is auditable.
8. **Dry-run / sandbox first** for every connector before any real action.

---

## 5. AI Factory Modules (V1)

Each module produces **drafts/specs only** and lands in the approval queue. None
posts, launches, spends, generates real images/video, or pulls live analytics.

| Module | Produces | Hard limits |
|---|---|---|
| **Content Factory V1** | Social/content drafts (captions, plans) | No auto-post |
| **Design Factory V1** | Design briefs / specs | No real image generation |
| **Video Scripts V1** | Short-form video scripts | No real video generation |
| **Ads Pack Draft V1** | Ads concepts / draft strategy | No ad creation, launch, or spend |
| **Report Draft V1** | Report drafts | No live analytics pull, no unverified metrics |

Production AI quality for a module comes from a real provider node whose prompt
lives **in n8n** (server-side), not in the repo. The repo controls the local
fallback generator and the activation runbooks in
`CLAUDE_MARKETING_TEAM/07_runbooks/`.

---

## 6. Output Status Model

Canonical lifecycle states for a generated item. AI generation alone may reach
**at most** `pending_approval`.

| Status | Meaning | Who can set it |
|---|---|---|
| `draft` | Newly generated/edited; not yet submitted for review. | AI generation / editor |
| `needs_review` | Flagged for an internal reviewer before approval. | AI generation / reviewer |
| `pending_approval` | Submitted; awaiting Owner decision. **Ceiling for AI alone.** | Generation / submitter |
| `approved` | Owner approved for **internal** use. **Not published or launched.** | Owner (human) |
| `ready_for_manual_publish` | Approved and queued for a manual, human publish step. | Owner (human) |
| `ready_for_export` | Approved and queued for manual export/handoff. | Owner (human) |
| `ready_for_ads_launch` | Approved and queued for a manual, human ads-launch step. | Owner (human) |
| `published` | **Terminal external-world state.** Content exists on a real channel. | Human-confirmed action only |
| `launched` | **Terminal external-world state.** A real ad/campaign is live. | Human-confirmed action only |

> **`published` and `launched` are terminal external-world states and must NEVER
> be set automatically by AI generation, by an n8n callback, or by any connector
> alone.** They require an explicit, separate, human-confirmed action that
> happens *after* approval.

---

## 7. Connector Roadmap (future, approval-gated)

Connectors are **allowed in the future only behind approval gates** and only
after passing the staged activation process in
`CLAUDE_MARKETING_TEAM/07_runbooks/connector_activation_safety_runbook.md`.

- **n8n** — automation runtime / AI-provider router (the integration layer).
- **OpenAI / ChatGPT API** — text generation provider.
- **Anthropic / Claude API** — text generation provider.
- **Google Gemini API** — text generation provider.
- **Canva Connect API** — design draft/template creation; export only after
  approval if its feature flag allows.
- **Supabase** — database / auth / RLS (data backbone).
- **Meta Marketing API** — ads drafts/recommendations; **no launch** without
  Owner approval.
- **TikTok Business API** — ads drafts/recommendations; **no launch** without
  Owner approval.
- **Zalo / Google Ads** — later; same approval-gated, draft-first rules.

Credentials for any of these live **only** in n8n Credentials, Vercel env,
Supabase env, or a local `.env` that is never committed — **never in the repo**.

---

## 8. Builder Rules

- **Small, scoped tasks.** Minimal file edits. No broad repo rewrites.
- Touch only what the task names; do not refactor adjacent code uninvited.
- Run **build/test/lint when available** (`npm run build`, `npm test`;
  there is currently no `lint` script — do not invent one).
- **Update logs** under `CLAUDE_MARKETING_TEAM/08_logs/` for meaningful changes.
- Always provide a **PASS/FAIL** verdict with evidence (commands + results).
- **Do not commit without Owner instruction.** Never push or open a PR unless
  explicitly told to.
- Never add real API keys, real secrets, or real webhook URLs.
- Never claim something was posted, published, exported, or launched unless the
  Owner confirms it actually happened.

---

## 9. Role Split

| Role | Responsibility |
|---|---|
| **Owner** | Final approval and business decisions. The only approval authority. |
| **ChatGPT** | PM / Architect / Reviewer. |
| **Claude Code (PC1)** | Scoped builder (this agent). |
| **Codex** | Reviewer or temporary builder. |
| **n8n** | Automation runtime and integration/AI-provider routing layer. |

---

## 10. Validation Requirements (every task)

Before reporting done, a builder must:

1. **Search contamination terms after edit** — confirm no out-of-scope or
   off-domain (non-FnB/SME) project context leaked into project identity/context
   docs or demo/seed data.
2. **Run build/test if available** — `npm run build`, `npm test`.
3. **Report exact files changed** and the **commands run**.
4. **Report a safety assessment** against §4 (approval-first, no auto-post,
   no auto-ads, no fake metrics, no secrets, dry-run-first).
5. **Do not commit** until the Owner approves.

---

### Tech / layout quick reference

- Frontend: React + TypeScript + Vite (static build, hosted on Vercel).
- Database target: Supabase Postgres (RLS-enforced). Local/demo mode falls back
  to browser `localStorage` when Supabase env is absent.
- Env: `.env.example` (safe placeholders) at repo root; `.env.local` is
  gitignored and must hold any real local values.
- Docs/runbooks/logs: `CLAUDE_MARKETING_TEAM/` (`07_runbooks/`, `08_logs/`,
  `00_strategy/`, `03_core/`, etc.).
- Related context files (kept consistent with this one): `CLAUDE_MARKETING_TEAM/AGENTS.md`,
  `CLAUDE_MARKETING_TEAM/README.md`, `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md`.
