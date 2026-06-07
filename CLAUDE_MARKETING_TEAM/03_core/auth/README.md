# The Core Agency — Auth & Role Permission Foundation

**Phase:** 3 (2026-06-07)  
**Auth provider:** Supabase Auth  
**Strategy:** Email/password → Supabase session → role lookup from `user_roles` table

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/supabaseClient.ts` | Supabase client (null-safe — returns `null` if env not configured) |
| `src/lib/auth/AuthContext.tsx` | React context provider + `useAuth()` hook |
| `src/lib/auth/permissions.ts` | Role permission matrix + `can.*` helpers |
| `src/components/auth/LoginScreen.tsx` | Login UI with demo-mode fallback |
| `src/vite-env.d.ts` | Vite env type declarations |

---

## Auth Modes

| Mode | When | Behavior |
|------|------|----------|
| `supabase` | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set | Real Supabase session |
| `demo` | Env vars missing / placeholder | Demo user `owner@thecore.agency` / `demo1234` |
| `unconfigured` | Same as demo trigger | Banner shown, demo credentials pre-filled |

---

## Role Hierarchy

```
owner   → full access (all permissions including publish, manage connectors, audit)
manager → create/edit/approve campaigns, content, reports
client  → read-only access to approved content for assigned brands
viewer  → read-only, no approval rights
```

## Adding a New Permission

Edit `src/lib/auth/permissions.ts`:
1. Add a key to `PERMISSION_ROLES` with the allowed roles array
2. Add a helper to the `can` object
3. Use `can.yourPermission(user?.role)` in components

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Never commit `.env.local`** — it's in `.gitignore`.

---

## RLS Policies (Phase 3 next step)

Row Level Security is enabled on key tables (see `schema_v1.sql`).
Policies need to be added per-role in Supabase Dashboard or via migration:

```sql
-- Example: clients table — owner/manager can CRUD, client/viewer can SELECT
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('owner', 'manager', 'client', 'viewer')
    )
  );

CREATE POLICY "clients_modify" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND r.name IN ('owner', 'manager')
    )
  );
```

Full RLS policies are deferred to Phase 4.

---

## Safety
- Service role key is **never** used in the frontend (`supabaseClient.ts` uses anon key only)
- No secrets hardcoded anywhere
- `auto_post_enabled` and `auto_ads_enabled` are seeded `false` in `system_settings`
- `require_approval` is seeded `true`
