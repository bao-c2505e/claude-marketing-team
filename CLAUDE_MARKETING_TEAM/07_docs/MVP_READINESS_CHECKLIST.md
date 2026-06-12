# MVP READINESS CHECKLIST — The Core Agency Core MVP

**Phase 18 — Final MVP Polish + Production Readiness (2026-06-11)**

Purpose: verify the Core MVP is ready for **serious internal testing / controlled client demo**.
This is NOT a sign-off for live automation, real publishing, or real client data.

Verdict: ✅ **READY for controlled internal/demo use** (see "Remaining risks" at the bottom for what it is NOT ready for).

---

## 1. Production safety (verified 2026-06-11)

| Check | Status | Evidence |
|---|---|---|
| No real ads enabled | ✅ PASS | No ad-platform API calls anywhere; Connector Registry is registry-only |
| No real posting enabled | ✅ PASS | No publish/post code path; "Approved ≠ Published" enforced in UI copy + workflow |
| No real messaging enabled | ✅ PASS | No messaging API; automation logs are local mock only |
| No real external connectors | ✅ PASS | `grep fetch(/axios/XMLHttpRequest/WebSocket` over `src/` → **0 matches**; only network client is the Supabase SDK |
| Supabase OFF by default | ✅ PASS | `isSupabaseConfigured` is false unless `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set to non-placeholder values; client is `null` otherwise |
| No committed secrets | ✅ PASS | Secrets grep clean (`sk-*`, `service_role`, JWT prefixes, bearer tokens, inline api keys → only the `.env.example` placeholders and a safety note string) |
| `.env*` not tracked | ✅ PASS | Only `.env.example` is in git; `.env`, `.env.local`, `*.local` are gitignored |
| Service role key never in frontend | ✅ PASS | `SUPABASE_SERVICE_ROLE_KEY` exists only as an `.env.example` placeholder without `VITE_` prefix |

## 2. Phase 16D / 17 safeguards intact (unchanged by Phase 18)

| Safeguard | Status |
|---|---|
| `assetScopeIsSupabaseSafe` / `approvalScopeIsSupabaseSafe` / `okOrAbsentUuid` UUID gates (`src/lib/core/repoRouting.ts`) | ✅ Untouched — 34 unit tests pass |
| Current **and** next `asset_collection_id` gated on edit (`handleAssetEdit`) | ✅ Untouched |
| Local `col-*` / `collection-*` / `asset-collection-*` ids never routed to Supabase | ✅ Untouched |
| Scoped repositories only (full tenant chain required on every op) | ✅ Untouched |
| `sanitizeAssetPatch` / `sanitizeGenerationPatch` / `sanitizeBriefPatch` immutable-field stripping | ✅ Untouched — 11 unit tests pass |
| RLS hierarchy validation in migrations (16C-1 / 16C-2 / 16D) | ✅ Untouched — no SQL changed in Phase 18 |
| Demo Sign In + localStorage fallback | ✅ Preserved |

Phase 18 touched **UI label strings and doc files only** — no routing, repository, sanitizer, type, or SQL changes.

## 3. Core workflow usable (manual checklist)

Companion detailed script: `08_logs/phase_17_e2e_checklist.md`.

- [x] Login / auth — Demo Sign In (local) works; Supabase sign-in path exists behind `isSupabaseConfigured`
- [x] Clients — list / create / edit, empty state ("No clients yet…"), error banner, role gating
- [x] Brands — list / create / edit, empty state, linked campaigns view
- [x] Campaigns — list / create / edit / archive, empty state
- [x] Briefs — intake form, status flow, empty state, safety note
- [x] Approval — submit / approve / reject / revision / comment, "Approved ≠ Published" notice
- [x] Generation / content — mock generation (clearly labeled "Mock Generation — AI API not connected"), calendar planning view
- [x] Asset library — metadata CRUD with UUID-gated routing, edit-mode immutable tenant fields, "Saving…" + error banner
- [x] Dashboard / export — sandbox safety summary, manual export pack (local export only)

UI sections of the Phase 17 E2E checklist still deserve one full manual browser pass by the Owner before the first external demo (no browser-automation tool available in this session).

## 4. Demo data sanity

- [x] Demo auth shows an explicit **DEMO** badge in the header
- [x] Header shows data mode: **"Local Data Only"** vs **"Supabase Data"** (new in Phase 18)
- [x] Sample/mock data labeled throughout ("Sample Data Only", "[Mock]" log messages, "Mock Generation", "Demo mode" badges)
- [x] No "FnB OS V1" wording left in the main UI (removed from both safety panels in Phase 18)
- [x] "The Core Agency" naming consistent across header, login, reports, export packs
- [x] Stale internal phase numbers ("Phase 8/10/11/12/13/14") removed from user-visible labels (kept in code comments and sample log message bodies, which are clearly mock data)

## 5. Build & test status (2026-06-11)

- `npm run build` — ✅ PASS (tsc 0 errors, vite build, 1575 modules)
- `npm run test` — ✅ PASS (45/45, 2 files)
- No lint script configured in `package.json` (`tsc` strict check runs inside build) — adding ESLint is a future nicety, not a blocker

## 6. Supabase / local fallback (how it works)

- **Default (no env vars):** app runs 100% local — Demo Sign In, all data in browser `localStorage` (`core_agency_*_v1` keys). Nothing leaves the machine.
- **Configured (`.env.local` with real `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`):** scoped Supabase repositories are used **per operation**, and only when every id involved is a real UUID; any record with local-format ids stays on localStorage. Anon key + RLS only — never the service role key.
- Migrations under `03_core/database/` are additive + idempotent and have **not** been applied to any live DB.

## 7. Remaining risks / not in scope of this MVP

1. **No real file storage** — Asset Library is metadata-only; uploads (Supabase Storage/Drive) deferred.
2. **Mock content generation** — no real AI API wired; generated plans are deterministic samples.
3. **Connectors are registry-only** — n8n/Meta/Canva/Google integrations are catalog entries, not live.
4. **Client-role feedback vs RLS** — once Supabase is live with real `client`-role users, the Client View "Add Feedback" insert would be rejected by owner/manager-only RLS; needs an explicit feedback-write policy decision before real client use.
5. **Manual browser E2E pass pending** — unit tests cover routing/sanitizers; full UI click-through (Phase 17 checklist sections B–G) should be run by the Owner before the first external demo.
6. **Single-bundle build warning** — 920 kB JS chunk (>500 kB warning); fine for internal demo, consider code-splitting before public deployment.
7. **`08_logs/CURRENT_PHASE.md` is stale (Phase 13)** — the canonical phase doc is `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md`.
