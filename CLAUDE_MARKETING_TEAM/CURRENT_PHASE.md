# CURRENT PHASE — Phase 3: Auth/Login + Role Permission Foundation ✅ DONE

Tài liệu này dùng để theo dõi tiến độ thực hiện và trạng thái của Phase hiện tại.

## 📌 Thông tin chung
- **Phase hiện tại:** Phase 3 — Auth/Login + Role Permission Foundation
- **Mục tiêu:** Tạo nền tảng đăng nhập thật và role permission foundation cho The Core Agency MVP.
- **Trạng thái:** ✅ DONE — Auth context, permissions, login UI, auth gate, docs updated, build pass, pushed.

---

## 📋 Checklist Phase 3

### Package
- [x] `@supabase/supabase-js` installed (9 packages added)

### Auth Foundation
- [x] `src/vite-env.d.ts` — Vite env type declarations (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.)
- [x] `src/lib/supabaseClient.ts` — null-safe Supabase client
  - [x] Reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` from Vite env
  - [x] `isSupabaseConfigured: boolean` exported
  - [x] Returns `null` if not configured (no crash)
  - [x] Never uses service role key in frontend

### Auth Context
- [x] `src/lib/auth/AuthContext.tsx` — React context + `useAuth()` hook
  - [x] `AuthState`: user, session, loading, isAuthenticated, mode, error
  - [x] Three modes: `supabase` | `demo` | `unconfigured`
  - [x] `signIn(email, password)` — real Supabase or demo fallback
  - [x] `signOut()` — real Supabase or demo clear
  - [x] Session bootstrap on mount (`getSession` + `onAuthStateChange`)
  - [x] `fetchUserRole(userId)` — two-step query (user_roles → roles), falls back to 'viewer'

### Role Permission Foundation
- [x] `src/lib/auth/permissions.ts`
  - [x] `PERMISSION_ROLES` matrix: 30+ permissions × 4 roles
  - [x] `hasPermission(role, permission)` core function
  - [x] `can.*` convenience helpers (all permissions)
  - [x] `ROLE_LABELS` + `ROLE_COLORS` display constants
  - [x] `isInternalRole()` + `isClientRole()` helpers
  - [x] Permissions: manageClients, manageBrands, createCampaigns, generateContent, approveContent, **publishContent (owner-only)**, manageConnectors, viewAutomationLogs, etc.

### Login UI
- [x] `src/components/auth/LoginScreen.tsx`
  - [x] Email + password form
  - [x] "Supabase not configured" amber warning banner
  - [x] Demo credentials pre-filled when unconfigured
  - [x] Loading/error states
  - [x] The Core Agency branding (dark theme, consistent with workspace)
  - [x] Demo footer hint

### App Shell
- [x] `src/main.tsx` — wrapped with `<AuthProvider>`
- [x] `src/App.tsx` — auth gate added
  - [x] Loading state → spinner
  - [x] Not authenticated → `<LoginScreen />`
  - [x] Authenticated → workspace
  - [x] Header user status area: email, role badge (color-coded), DEMO tag, sign-out button
  - [x] Phase badge updated: "Real Operations MVP — Phase 3"

### Docs
- [x] `CLAUDE_MARKETING_TEAM/03_core/auth/README.md` — auth modes, role hierarchy, RLS notes, env vars

### Safety
- [x] No secrets in source
- [x] Service role key never in frontend
- [x] Demo mode clearly labeled
- [x] `publishContent` permission: owner-only
- [x] No auto-post / auto-ads / auto-message gates not bypassed
- [x] Build pass: tsc + vite (0 errors, 563KB bundle with Supabase)

---

## 🔑 Auth Quick Reference
| | |
|-|-|
| **Demo login** | owner@thecore.agency / demo1234 |
| **Real login** | requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local |
| **Role lookup** | `user_roles` → `roles` tables (falls back to 'viewer') |

---

## 🛡️ Safety Guard (Phase 3)
- Auto-post: NO
- Real Ads: NO
- Real Messaging: NO
- Real Connectors: NO
- Secrets Added: NO
- Service Role Key in Frontend: NO
- Build Pass: YES

---

## 📝 Closeout Note
Phase 3 adds a real auth foundation on top of the existing static workspace. Supabase Auth is the target. When env vars are not configured, the app runs in demo mode with a mock owner user — no crash, no blank screen. Permission matrix covers all 18-phase scenarios. Phase 4 will add RLS policies to the DB and wire the first real data CRUD (client/brand management).

---

## ✅ Phase 2 (tiền nhiệm) — CLOSED
- Commit: `d0cb365` — feat: add database schema v1 for the core agency
- Features: Supabase Postgres schema, 30+ tables, 7 groups, TypeScript types, .env.example.

## ✅ Phase 1 (tiền nhiệm) — CLOSED
- Commit: `317c6c8` — docs: add the core agency real mvp strategy and branding
