# Context Cleanup Log — 2026-06-22

**Project:** The Core Agency / CLAUDE_MARKETING_TEAM
**Performed by:** Claude Code (PC1, scoped builder)
**Scope:** Context / docs / env documentation ONLY. No `src/` feature code edits,
no connector activation, no commit.
**Verdict:** ✅ **PASS** (with one important correction to the original premise — see below).

---

## 1. Problem Found (as reported)

The task reported that the project context was contaminated: specifically that the
current `CLAUDE.md` was wrong because it contained "Forme Brand Assistant"
furniture/sofa context, and asked to replace it with a clean CORE-specific
`CLAUDE.md`, upgrade env documentation, and verify no Forme contamination remains.

## 2. Cause Assessment (what was actually true)

Investigation **did not confirm** the stated premise, and corrected it:

1. **There was no `CLAUDE.md` anywhere in the repo** — not tracked, not untracked,
   not gitignored (`find -iname CLAUDE.md`, `git ls-files`, `git check-ignore` all
   negative). So there was no contaminated `CLAUDE.md` to replace; the real gap was
   a **missing** CORE source-of-truth file. → Created fresh (Task B).
2. **"Forme" is NOT contamination from the separate "Forme Brand Assistant"
   project.** In this repo `Forme` exists only as **one of three fictional demo/seed
   brands** (`Vị Cuốn`, `Cơm Tấm Bản Khói`, `Forme`), deliberately chosen so the demo
   proves the OS is not F&B-only. It lives in `src/` seed data, which is **explicitly
   out of scope** for this task ("Do not edit `src/` application code").
3. The project's **identity/context docs were already clean** and already disclaim
   the out-of-scope projects:
   - `CLAUDE_MARKETING_TEAM/README.md:65` — "This workspace is CLAUDE_MARKETING_TEAM
     only. It is not Forme Brand Assistant."
   - `CLAUDE_MARKETING_TEAM/AGENTS.md:77` — "Do not use Forme brand context unless
     Owner explicitly changes this project scope."
   - `07_docs/universal_ai_coordinator_prompt.md:10` &
     `07_docs/quick_copy_ai_coordinator_prompt.md:11` — "Hoàn toàn không liên quan…
     FnB OS V1 hay Forme Brand Assistant."

   These are **correct anti-contamination guards**, not contamination, and were kept.

## 3. Files Inspected

- Repo root listing, `.gitignore`, `package.json`, `tsconfig.json`, `vite.config.ts`
- `.env.example` (existing), `.env.local` (presence only — gitignored, not opened)
- `CLAUDE_MARKETING_TEAM/README.md`, `AGENTS.md`, `07_docs/universal_ai_coordinator_prompt.md`
- `src/lib/core/coreData.ts`, `src/mockData.ts`, `src/lib/core/contentGenerator.ts`
  (read-only — to classify the "Forme/sofa/nội thất" hits; NOT edited)
- `CLAUDE_MARKETING_TEAM/07_runbooks/` and `08_logs/` (structure + naming convention)
- Webhook env var usage in `src/lib/core/*Factory.ts` (confirmed the code reads
  `VITE_N8N_*_WEBHOOK_URL` — those names were preserved in `.env.example`)

## 4. Files Changed

| File | Action | Notes |
|---|---|---|
| `CLAUDE.md` (repo root) | **Created** | CORE source-of-truth context; all 10 required sections. |
| `.env.example` | **Updated** | +96 / −33. Preserved existing working vars (incl. `VITE_N8N_*_WEBHOOK_URL`); added Core App, AI Providers, Design/Asset, Publishing/Ads, and Safety/Feature-flag groups as placeholders. No real secrets. |
| `CLAUDE_MARKETING_TEAM/07_runbooks/connector_activation_safety_runbook.md` | **Created** | 7-stage activation model, approval gates, per-connector + analytics safety, logging, rollback, forbidden list. |
| `CLAUDE_MARKETING_TEAM/08_logs/context_cleanup_20260622.md` | **Created** | This log. |

**Not changed (deliberately):** all `src/` code, n8n workflow JSON, contracts,
approval logic, RLS, the existing seed data (incl. the `Forme` demo brand), and
the existing anti-contamination guards in README/AGENTS/coordinator prompts.

## 5. Contamination Search — Before / After

Terms searched (repo-wide, `git grep`): `Forme`, `forme`, `sofa`, `nội thất`,
`product-catalog`, `brand-guideline`.

### Before
| Term | Where it appears | Classification |
|---|---|---|
| `Forme` (case-sensitive) | `src/mockData.ts` (28), `src/lib/core/coreData.ts` (8) | **Intentional seed/demo data** (out of scope) |
| `Forme` | 10 docs/logs: `08_logs/agent_activity_log.md` (5), `08_logs/phase_log.md` (4), `SESSION_SUMMARY.md` (3), `V2C_CLIENT_DEMO_PACKAGE.md` (2), `V2D_…RUNBOOK.md`, `CURRENT_PHASE.md`, `CORE_MVP_CLOSURE_REPORT.md`, `phase_h5_handoff.md`, `client_brand_campaign_README.md`, `brief_intake_README.md` (1 each) | Historical docs/logs **referencing** the demo brand |
| `Forme` | `README.md:65`, `AGENTS.md:77`, `universal_ai_coordinator_prompt.md:10`, `quick_copy_ai_coordinator_prompt.md:11` | **Anti-contamination guards (correct — kept)** |
| `sofa` | `src/lib/core/coreData.ts`, `src/mockData.ts` only | Intentional seed/demo data (Forme product) |
| `nội thất` | `src/mockData.ts`, `src/lib/core/contentGenerator.ts` (generic industry-detection), `08_logs/agent_activity_log.md`, `08_logs/phase_log.md` | Seed data + generic logic + historical logs |
| `product-catalog` | — | **None** |
| `brand-guideline` | `src/lib/core/coreData.ts` (seed asset filename/tags) only | Intentional seed/demo data |
| Any term in a `CLAUDE.md` | — | **None — no CLAUDE.md existed** |

### After
- **New `CLAUDE.md`, upgraded `.env.example`, and new runbook contain ZERO
  furniture/sofa contamination.** The only "Forme" strings in `CLAUDE.md` are the
  intentional clauses stating the project **is not** "Forme Brand Assistant" and
  explaining the demo-seed caveat (lines 19, 22, 25, 184) — i.e. guard text.
- `src/` seed data is **unchanged** (out of scope): the 36 `Forme` hits +
  `sofa`/`brand-guideline` seed references remain by design.
- Existing anti-contamination guards in README/AGENTS/coordinator prompts remain
  intact.

## 6. Build / Test / Lint

| Check | Command | Result |
|---|---|---|
| Build | `npm run build` (`tsc && vite build`) | ✅ PASS — built in 4.48s; entry `index` 359.26 kB (no >500 kB warning). |
| Tests | `npm test` (`vitest run`) | ✅ PASS — 135/135, 11 files. |
| Lint | n/a | No `lint` script in `package.json` — correctly skipped. |

## 7. Safety Assessment

- ✅ Approval-first preserved; **Approved ≠ Published** documented in `CLAUDE.md` §6.
- ✅ No auto-post / no auto-ads-launch / no spend introduced; flags default safe
  (`CONNECTORS_ENABLED=false`, `CONNECTOR_DRY_RUN=true`, `ALLOW_AUTO_POST=false`,
  `ALLOW_AUTO_ADS_LAUNCH=false`, `ALLOW_CANVA_EXPORT_AFTER_APPROVAL=false`).
- ✅ No real secrets / no real webhook URLs committed; secrets stay in n8n/Vercel/
  Supabase/`.env.local`. `.env.example` holds placeholders only.
- ✅ No connector activated; runbook is documentation only.
- ✅ No `src/` feature code, approval logic, RLS, or n8n workflow JSON changed.
- ✅ Nothing posted, published, exported, or launched.
- ✅ Not committed (awaiting Owner approval).

## 8. Remaining Risks / Open Items (for Owner decision)

1. **`Forme` demo brand in `src/` seed data — ✅ RESOLVED in Round 2 (2026-06-22).**
   The Owner authorized the `src`-scoped follow-up; the furniture demo brand was
   migrated to a fictional FnB brand (`Mộc An Coffee`). See **§10** below. `src/`
   runtime/seed data no longer contains any Forme/sofa/furniture context.
2. **Historical docs/logs** mention `Forme` as the demo brand. Left as-is (accurate
   history). They are not project-identity contamination.
3. `CLAUDE.md` was placed at the **repo root** (standard auto-load location). If the
   Owner prefers it under `CLAUDE_MARKETING_TEAM/`, it can be moved/symlinked.
4. `.env.example` keeps the **`VITE_N8N_*_WEBHOOK_URL`** names (what the code reads)
   rather than the non-prefixed names in the task spec, to avoid breaking the
   documented contract. The spec's intent (grouped, connector-ready placeholders)
   is fully met.

## 9. Next Recommended Phase

**Canva Connector Sandbox** — but only **after this cleanup is reviewed and marked
PASS by the Owner**, and only via the staged process in
`07_runbooks/connector_activation_safety_runbook.md` (Stages 1→7, sandbox creds +
external-action gates logged). Default flags stay safe until then.

---

## 10. Round 2 — Seed/Demo Data Migration (Forme → Mộc An Coffee) — 2026-06-22

**Trigger:** Owner explicitly authorized editing `src/` seed/demo data to remove
the Forme furniture demo brand and replace it with a valid FnB/CORE demo brand
(Round 1 had deliberately left `src/` untouched as out-of-scope).

**What changed:** the third demo brand (premium, multi-channel FB/IG/YouTube,
30-day launch) was reskinned from a **premium furniture** brand to a **premium
specialty-coffee** brand, preserving the exact data shape (same object keys,
array lengths, types) so build/tests stay green. The other two demo brands
(`Vị Cuốn`, `Cơm Tấm Bản Khói`) were untouched.

**Brand / id mapping:**

| Before (Forme — furniture) | After (FnB) |
|---|---|
| Brand `Forme` — `Nội thất cao cấp / Premium Furniture` | `Mộc An Coffee` — `F&B / Specialty Coffee` |
| Hero product `Sofa da Series F-1` | `Cold Brew đặc sản Series S1` |
| Campaign `Sofa F-1 Launch Campaign` | `Cold Brew S1 Launch Campaign` |
| ids `client-forme` / `brand-forme` / `campaign-forme-f1` / `brief-forme-f1` / `col-forme-brand` / `asset-forme-guideline` / `asset-forme-sofa-ref` | `client-moc-an` / `brand-moc-an` / `campaign-moc-an-s1` / `brief-moc-an-s1` / `col-moc-an-brand` / `asset-moc-an-guideline` / `asset-moc-an-coffee-ref` |
| mockData campaign id `CAMP-FORME-001` | `CAMP-MOCAN-001` |

**Files changed in Round 2 (`src/` runtime + seed):**

| File | Change |
|---|---|
| `src/lib/core/coreData.ts` | Forme client/brand/campaign/brief + 2 asset/collection seeds → Mộc An Coffee; all `*-forme*` ids → `*-moc-an*`. |
| `src/mockData.ts` | `CAMP-FORME-001` furniture campaign → `CAMP-MOCAN-001` cold-brew campaign: brief, 7-day calendar, checklist labels, copywriter/videoEditor/designer/adsManager/dataReporter outputs + report template. |
| `src/lib/core/automationLogs.ts` | `log-005` related ids + campaign label → Mộc An. |
| `src/lib/core/connectorRegistry.ts` | `evt-003` related ids + scope label → Mộc An. |
| `src/lib/core/contentGenerator.ts` | Industry-detection de-furnitured: `isPrem` now keys on `specialty/đặc sản` (was `nội thất/furniture`); hashtag branch `#NộiThất #InteriorDesign #HomeDecor` → `#CàPhê #SpecialtyCoffee #ColdBrew`; premium CTA map "showroom"/"không gian sống" → FnB "ghé quán" copy. |
| `CLAUDE.md` | §1 + §10 wording de-Forme'd (generalized to "independent of any other project / no off-domain context"); no longer names "Forme Brand Assistant". |

**Verification:** `git grep -n "Forme" -- src`, `… "sofa" -- src`,
`… "nội thất" -- src` → **0 hits** (remaining matches such as
`FormEvent`/`formError`/`brief-1` are unrelated React/identifier strings).
`npm run build` PASS (entry 359.38 kB, no >500 kB warning); `npm test`
135/135 PASS; no `lint` script in `package.json`.

**State of "Forme" now:**
- ✅ **NOT in `src/` runtime / seed / demo data** (verified by grep above).
- ⚠️ Still present **only in `CLAUDE_MARKETING_TEAM/` docs & historical logs** —
  i.e. **not in runtime**. Categories: (a) intentional anti-contamination guards
  (`AGENTS.md`, `README.md`, the two AI-coordinator prompts); (b) historical phase
  logs / session summaries; (c) demo-package/runbook docs describing the old seed.
  Left as-is by directive (no broad docs cleanup this round); they do not affect
  the running app.

**Safety:** No connector touched; no approval logic / RLS / repo / n8n-JSON change;
no secrets or webhook URLs; nothing posted/published/launched; data shape preserved
(no behavioral regression); not committed.
