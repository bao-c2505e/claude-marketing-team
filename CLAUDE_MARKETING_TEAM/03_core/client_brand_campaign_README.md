# The Core Agency — Client / Brand / Campaign Management

**Phase:** 4 (2026-06-07)  
**Status:** Local demo data (Supabase CRUD deferred to Phase 5+)

---

## Overview

Phase 4 adds a real management foundation for the three core business entities:

```
Client  →  Brand  →  Campaign
(1)    →  (many) →  (many)
```

- A **Client** is the agency's direct customer (e.g. a restaurant owner).
- A **Brand** belongs to one client and represents the product or company being marketed.
- A **Campaign** belongs to one brand and represents a time-bounded marketing effort.

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/core/coreData.ts` | Seed data, localStorage store, generate ID helpers, display constants |
| `src/components/core/ClientsTab.tsx` | Clients list + create + detail (with brands summary) |
| `src/components/core/BrandsTab.tsx` | Brands list + filter by client + create + detail (with campaigns) |
| `src/components/core/CampaignsTab.tsx` | Campaigns list + filter + create + status update + detail |

---

## Data Strategy — Phase 4

| Supabase configured? | Behavior |
|---|---|
| No (default) | Loads seed data from `coreData.ts` into localStorage. Badge: "Local demo data · Supabase not configured" |
| Yes | Same UI — Supabase queries wired in Phase 5+ via `coreRepository.ts` |

**Storage key:** `core_agency_core_data_v1`

### Seed Data (3 clients, 3 brands, 3 campaigns)

| Client | Brand | Industry | Hero Product |
|--------|-------|----------|--------------|
| Vị Cuốn | Vị Cuốn | F&B / Street Food Premium | Bánh tráng cuốn heo quay |
| Cơm Tấm Bản Khói | Cơm Tấm Bản Khói | F&B / Cơm Tấm | Cơm tấm sườn bì chả |
| Forme | Forme | Nội thất cao cấp | Sofa da Series F-1 |

---

## Permission Integration

| Action | Allowed Roles |
|--------|--------------|
| View clients | owner, manager, viewer |
| Create / archive client | owner, manager |
| View brands | owner, manager, client, viewer |
| Create brand | owner, manager |
| View campaigns | owner, manager, client, viewer |
| Create campaign | owner, manager |
| Update campaign status | owner, manager |

All checks use `can.*` helpers from `src/lib/auth/permissions.ts`.  
Viewer/client roles see the data but no create/edit buttons are rendered.

---

## Cross-tab Navigation

`handleCoreNavigate(tab, { clientId?, brandId? })` in App.tsx handles:
- "View All Brands" button in ClientDetail → switches to Brands tab, pre-filtered by clientId
- "View Campaigns" button in BrandDetail → switches to Campaigns tab, pre-filtered by brandId

---

## Safety

- No auto-post, no auto-ads, no auto-message
- No secrets in source
- All data is local / demo — no real client data
- Service role key never touched

---

## Phase 5 Integration Plan

When Supabase is configured:
1. Create `src/lib/core/coreRepository.ts` — wraps Supabase queries for clients/brands/campaigns
2. Replace `loadCoreData()` / `saveCoreData()` calls in App.tsx with repository calls
3. Apply RLS policies from `schema_v1.sql`
4. Brief intake form (`campaign_briefs` table) wired to campaigns
