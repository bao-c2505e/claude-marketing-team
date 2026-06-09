# The Core Agency — Database

**Engine:** Supabase Postgres  
**Schema version:** V1 (Phase 2 — 2026-06-07)  
**SQL file:** `schema_v1.sql`  
**Wiring plan:** `../supabase_wiring_README.md`

---

## Quick Start (SQL Apply Guide)

### Step 1 — Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users (e.g., Southeast Asia)
3. Set a strong database password and save it securely (not in repo)
4. Wait ~2 minutes for provisioning

### Step 2 — Apply Schema
1. Supabase dashboard → **SQL Editor** → **New Query**
2. Open `schema_v1.sql` from this repo
3. Paste the entire contents and click **Run**
4. Expected: no errors. Tables, enums, indexes, and triggers created.

> **Common issue:** If `uuid-ossp` extension is not available, Supabase will auto-enable it. If you see an error, run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` first.

### Step 3 — Configure Authentication
1. Supabase dashboard → **Authentication** → **Providers** → **Email**: Enable
2. For MVP: Authentication → **Settings** → disable "Confirm email" (re-enable for production)
3. Create first user: Authentication → **Users** → **Invite user** (use your email)

### Step 4 — Assign Owner Role
After schema is applied, run this in SQL Editor (replace `YOUR_USER_UUID`):

```sql
-- Find your user UUID in: Authentication → Users → copy the UUID column
-- Then run:

INSERT INTO user_roles (user_id, role_id, is_active, granted_at)
SELECT
  'YOUR_USER_UUID_FROM_AUTH_USERS',
  r.id,
  true,
  now()
FROM roles r WHERE r.name = 'owner';
```

> The `roles` table is seeded automatically by `schema_v1.sql` with owner/manager/client/viewer.

### Step 5 — Set Environment Variables

**For local development:**
```bash
# Copy .env.example to .env.local (DO NOT commit .env.local)
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> Get these values from: Supabase Dashboard → **Settings** → **API** → Project URL + anon public key.

**For Vercel (production):**
1. Vercel dashboard → Project → **Settings** → **Environment Variables**
2. Add `VITE_SUPABASE_URL` → your Supabase project URL
3. Add `VITE_SUPABASE_ANON_KEY` → your anon/public key from Settings → API
4. **⛔ Do NOT add** `SUPABASE_SERVICE_ROLE_KEY` — service role key bypasses RLS and must never be in Vercel public env

### Step 6 — Redeploy
```bash
git push origin main   # Vercel auto-deploys on push
```
Or trigger manually in Vercel dashboard.

### Step 7 — Verify
1. Open production URL (e.g., `https://claude-marketing-team-demo.vercel.app/`)
2. Login screen should show **"Sign in"** (not "Demo Sign In")
3. Sign in with your email + password
4. Header should show your role badge (Owner)

---

## Option B: Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Apply schema
supabase db push
# or apply manually:
psql $DATABASE_URL -f schema_v1.sql
```

---

## Schema Summary

### Groups

| Group | Tables | Purpose |
|---|---|---|
| **A. Identity / Access** | users, user_profiles, roles, user_roles | Auth, role assignments |
| **B. Business Objects** | clients, brands, campaigns, campaign_briefs | Core agency data |
| **C. Content Production** | generation_jobs, content_items, content_calendar_items, creative_briefs, ad_briefs | AI content lifecycle |
| **D. Approval Workflow** | approval_requests, approval_events, approval_comments | Human approval gate |
| **E. Assets / Reports** | assets, asset_collections, reports, report_metrics | Media + analytics |
| **F. Automation / Modules** | connector_registry, module_registry, module_events, webhook_callbacks, automation_logs | n8n + module integration |
| **G. Safety / Governance** | audit_logs, system_settings | Safety overrides, audit trail |

### Key Safety Seeds

```sql
-- Seeded in schema_v1.sql — auto_post and auto_ads are off by default
INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('auto_post_enabled',  'false', 'Disable auto-posting', false),
  ('auto_ads_enabled',   'false', 'Disable auto-ads',     false),
  ('require_approval',   'true',  'Require human approval before any publish', false);
```

These can only be changed by an `owner` role user via the Settings page (Phase 18+).

---

## RLS (Row Level Security)

RLS is **enabled** on all tables in `schema_v1.sql`. Policies are applied in **Phase 16**.

Full policy plan: see `../supabase_wiring_README.md` → Section 1.4.

---

## Safety Rules

- **Never commit `.env.local`** — it's in `.gitignore`
- **Never put `SUPABASE_SERVICE_ROLE_KEY` in Vercel** — it bypasses RLS
- **Only anon key goes to frontend** (`VITE_SUPABASE_ANON_KEY`)
- `auto_post_enabled = false` and `auto_ads_enabled = false` seeded on first apply
- `require_approval = true` seeded — no content goes live without human approval

---

## Related Docs

- Full schema documentation: `CLAUDE_MARKETING_TEAM/00_strategy/THE_CORE_AGENCY_DATABASE_SCHEMA_V1.md`
- Auth + RLS wiring plan: `../supabase_wiring_README.md`
- TypeScript types: `src/types/core.ts`
- Repository interfaces: `src/lib/core/coreRepository.ts`
- Supabase client: `src/lib/supabaseClient.ts`
