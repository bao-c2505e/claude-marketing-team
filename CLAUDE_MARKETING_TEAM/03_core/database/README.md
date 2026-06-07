# The Core Agency — Database

**Engine:** Supabase Postgres  
**Schema version:** V1 (Phase 2 — 2026-06-07)  
**SQL file:** `schema_v1.sql`

## How to Apply

### Option A: Supabase Dashboard (SQL Editor)
1. Create a new Supabase project.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste the contents of `schema_v1.sql` and run.

### Option B: Supabase CLI
```bash
supabase db push
# or
psql $DATABASE_URL -f schema_v1.sql
```

## Environment Variables
Copy `.env.example` at the project root to `.env.local` and fill in your Supabase credentials.
**Never commit `.env.local` or any real secrets.**

## Schema Summary
See `CLAUDE_MARKETING_TEAM/00_strategy/THE_CORE_AGENCY_DATABASE_SCHEMA_V1.md` for full documentation.

## Groups
- **A. Identity / Access** — users, user_profiles, roles, user_roles
- **B. Business Objects** — clients, brands, campaigns, campaign_briefs
- **C. Content Production** — generation_jobs, content_items, content_calendar_items, creative_briefs, ad_briefs
- **D. Approval Workflow** — approval_requests, approval_events, approval_comments
- **E. Assets / Reports** — assets, asset_collections, reports, report_metrics
- **F. Automation / Modules** — connector_registry, module_registry, module_events, webhook_callbacks, automation_logs
- **G. Safety / Governance** — audit_logs, system_settings

## Safety
- Row Level Security (RLS) is **enabled** on key tables. Policies are added in Phase 3.
- `system_settings.auto_post_enabled = false` and `auto_ads_enabled = false` are seeded.
- `require_approval = true` is seeded.
- No secrets stored in this schema file.

## Next Steps
- **Phase 3:** Add Supabase Auth integration + RLS policies per role.
- **Phase 4:** Role permission enforcement in API routes.
