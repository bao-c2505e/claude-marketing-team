# CORE MVP CLOSURE REPORT — The Core Agency

**Date:** 2026-06-11
**Final reviewed commit:** `fd86ead` (feat: phase 18 final mvp polish and production readiness)
**Repo:** https://github.com/bao-c2505e/claude-marketing-team
**Status:** ✅ **Core MVP CLOSED — safe for controlled internal testing / controlled client demo**

This report formally closes the Core MVP build cycle (Phases 1–18). It is documentation only — no product code, runtime behavior, or connector state changed at closure.

---

## 1. What the Core MVP includes

**Architecture (locked):** Core (this repo) = management + approval + source-of-truth DB plan; n8n = future automation backbone (not a database); modules = future specialized processing; UI reads from Core data only.

| Area | Status | Notes |
|---|---|---|
| Auth / login | ✅ Working | Demo Sign In (local) by default; Supabase Auth path exists behind `isSupabaseConfigured` |
| Roles & permissions | ✅ Working | owner / manager / client / viewer matrix (`src/lib/auth/permissions.ts`); read-only roles cannot write |
| Clients / Brands / Campaigns | ✅ Working | Full CRUD, scoped repositories, empty states, error banners |
| Campaign Briefs | ✅ Working | Intake form, status flow, patch sanitizer (`sanitizeBriefPatch`) |
| Content generation | ✅ Working (mock) | Deterministic mock plan generator — clearly labeled "Mock Generation — AI API not connected" |
| Content calendar | ✅ Working | Planning view over generated items (local-only persistence) |
| Approval workflow | ✅ Working | Submit / approve / reject / revision / comment; "Generated ≠ Approved ≠ Published" enforced |
| Asset library | ✅ Working | Metadata CRUD with UUID-gated Supabase routing + localStorage fallback; no file storage |
| Reports | ✅ Working | Workspace progress metrics only — no real platform analytics |
| Export pack | ✅ Working | Manual local export (campaign pack, client summary, handoffs) |
| Connector registry | ✅ Working (registry-only) | Catalog + mock event inbox; zero live connections |
| Automation logs | ✅ Working (local mock) | `[Mock]`-labeled local event log, hidden from client/viewer |
| Owner View / Client View | ✅ Working | Client View hides internal/technical panels |
| Data layer | ✅ Working | Dual-mode: localStorage (default) / Supabase scoped repositories (per-operation, UUID-gated) |
| DB migrations | ✅ Written, NOT applied | Additive + idempotent SQL with full RLS under `03_core/database/` — no live DB touched |
| Unit tests | ✅ 45/45 | Routing gates (34) + patch sanitizers/utils (11) via vitest |

## 2. Intentionally NOT enabled (by design)

- **No real ads** — no ad-platform API integration of any kind.
- **No real posting / publishing** — approval is the last stage; nothing publishes anywhere.
- **No real messaging** — no customer-facing messaging path.
- **No live connectors** — Meta/Facebook, Canva, Google, n8n, ComfyUI exist only as registry entries; `grep fetch|axios|XMLHttpRequest|WebSocket` over `src/` → 0 matches.
- **No real AI generation** — content generator is a deterministic local mock.
- **No file storage/upload** — Asset Library is metadata-only.
- **No production Supabase** — env vars unset by default; SQL migrations not applied to any live database.
- **No secrets** — only `.env.example` placeholders; `.env*` gitignored; service-role key never in frontend.

## 3. Safety status (verified at closure)

| Control | Status |
|---|---|
| Secrets grep (`sk-*`, `service_role`, JWT/bearer prefixes, inline keys) | ✅ Clean — placeholders + 1 safety-note string only |
| `.env*` tracking | ✅ Only `.env.example` in git |
| UUID gating (Phase 16C-2/16D/17) — `assetScopeIsSupabaseSafe` / `approvalScopeIsSupabaseSafe` / `okOrAbsentUuid` | ✅ Intact, unit-tested |
| Current + next `asset_collection_id` gated on edit | ✅ Intact |
| Local-format ids (`col-*`, `collection-*`, `asset-collection-*`, `approval-*`, …) never sent to Supabase UUID columns | ✅ Intact |
| Scoped repositories (full tenant chain required per operation) | ✅ Intact |
| Patch sanitizers (immutable tenant/system fields, snake_case + camelCase) | ✅ Intact, unit-tested |
| RLS hierarchy validation in migrations (16B-2 → 16D) | ✅ Intact — owner/manager-only writes, active/unexpired role assignments |
| Demo Sign In + localStorage fallback | ✅ Preserved |
| FnB OS V1 | ✅ Never touched |

## 4. Build & test status

- `npm run build` — ✅ PASS, 0 TypeScript errors (`tsc && vite build`, 1575 modules)
- `npm run test` — ✅ PASS, 45/45 (2 files: `repoRouting.test.ts`, `coreRepository.test.ts`)
- No ESLint configured (tsc strict runs inside build) — future nicety, not a blocker

## 5. Known limitations

1. **Manual browser E2E pass pending** — Phase 17 checklist sections B–G (`08_logs/phase_17_e2e_checklist.md`) need one Owner click-through before the first external demo; code-level routing/sanitization is unit-tested.
2. **Client-role feedback vs RLS** — once Supabase is live with real `client`-role users, Client View "Add Feedback" inserts will be rejected by owner/manager-only RLS; needs an explicit feedback-write policy decision first.
3. **Calendar / Reports / Connector Inbox / Automation Logs** persist to localStorage only — Supabase wiring deferred.
4. **Single 920 kB JS bundle** (>500 kB warning) — fine for internal demo; code-split before public deployment.
5. **Mock data is Vietnamese-market F&B samples** (Vị Cuốn, Cơm Tấm, Forme) — replace/extend per demo audience.
6. **`08_logs/CURRENT_PHASE.md` is stale (Phase 13)** — canonical tracker is `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md`.

## 6. Recommended next roadmap

Ordered by suggested priority; every item stays behind the existing approval gates.

1. **Phase 19 / Ver2 planning (Owner + AI Coordinator)** — decide the Ver2 scope: which of the deferred areas (Calendar/Reports/Logs Supabase wiring, real generation, file storage) come first, and whether Ver2 targets internal agency ops or client-facing SaaS.
2. **Client demo preparation** — run the Phase 17 manual E2E checklist (sections B–G); rehearse with `07_docs/client_demo_script.md`; verify Vercel deploy matches `fd86ead`; tailor sample data to the demo audience.
3. **Supabase production hardening** — apply migrations to a **staging** project first; create real user/role rows; verify every RLS policy with each role (incl. the client-feedback limitation above); only then consider production env vars. Anon key + RLS only — service-role key stays server-side forever.
4. **PC2 n8n/modules integration (separate workstream)** — n8n as automation backbone per the locked architecture: webhook callback surface into Core, module event inbox wiring, `WEBHOOK_SHARED_SECRET` handling on a backend (never frontend). Registry-only until Owner approves activation.
5. **UI/brand polish** — code-splitting for the bundle, ESLint, accessibility pass, brand asset refinement; optionally real client logos/data after NDA-safe review.
6. **Real connector plan with approval gates** — per `07_docs/future_real_connectors.md`: one connector at a time (n8n first), each behind (a) Owner written approval, (b) backend-proxy secrets, (c) dry-run mode, (d) per-connector kill switch, (e) audit logging. Auto-post/ads/messaging remain OFF until each gate is explicitly signed off.

---

**Closure statement:** Phases 1–18 are complete, reviewed (Codex PASS through Phase 18), built, tested, and pushed. The Core MVP is approved for controlled internal testing and controlled client demos. Any step beyond that scope — live data, live connectors, real client accounts — requires a new phase with Owner approval.
