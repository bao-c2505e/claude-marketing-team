# Phase A1 — Premium Dashboard Shell - 2026-06-17

## Status

DONE. Presentation-only UI change. The Owner dashboard is restyled as a premium
dark SaaS "Command Center". All existing approval-first flows, data routing, and
safety boundaries are preserved unchanged. `npm run build` PASS (0 TS errors),
`npm run test` PASS 65/65.

## Scope

Frontend display only. **No** changes to: n8n workflows, contracts, env files,
repositories, UUID-gating / routing logic, RLS, or data-mutation behavior. No new
dependencies. No secrets or real webhook URLs committed.

## Files changed

- `src/index.css` — added additive premium dashboard utility classes
  (`.kpi-card`, `.kpi-grid`, `.kpi-spark`, `.module-card`, `.dash-cols`,
  `.op-row`, `.dash-section-label`, `.status-dot`) built from the existing token
  system; added a `.dash-cols` single-column rule to the existing 768px media
  query. No existing rules removed.
- `src/App.tsx` — replaced the legacy Owner "workspace card" on the dashboard
  tab with a premium **Command Center** (Owner view only); imported
  `APPROVAL_STATUS_LABEL` / `APPROVAL_STATUS_COLOR` for the approval queue badges;
  gated the two legacy demo panels (Vietnamese "Top quick stats" + old "Safety
  Guard & Simulation Status") to **client view only** so the Owner view is not
  duplicated (client presentation behavior is unchanged).

## What changed visually (Owner view)

- **KPI cards row** — Clients, Brands, Campaigns, Briefs, Pending Approvals,
  Assets. Subtle gradients, left accent bar, decorative mini-bars (texture only,
  no data implied), click-through navigation preserved. Every number is derived
  from existing local/Supabase app state.
- **AI Factory — Module Status** — Content Factory V1, Design Factory V1, Video
  Scripts V1, Ads Pack Draft V1, Report Draft V1, each shown **PASS**, plus a
  provider indicator (n8n provider connected / local fallback) read from the
  existing webhook helper.
- **Approval Queue (hero panel)** — pending count + 5 most recent requests with
  status badges and a safe empty state; "Approved ≠ Published" stated inline, and
  approved rows show "Approved · not published".
- **System & Safety panel** — Pending approval only / Approved ≠ Published / No
  auto-post / No auto-ads / No live connectors / No live analytics pull, plus
  Environment (Sandbox · sample data) and Data mode (Local / Supabase).
- **Recent Activity** — 5 most recent automation log entries with severity dots
  and a safe empty state; labeled "Display only · no live analytics pull".

## Safety constraints preserved

- Approval-first intact; nothing implies posted / launched / spent / scheduled /
  published. "Approved ≠ Published" surfaced in the approval hero.
- No auto-post, no auto-ads, no live connectors, no live analytics pull — stated
  in the System & Safety panel.
- No invented metrics (no spend/revenue/ROAS/impressions/clicks). Mini-bars are
  fixed decorative texture, not a chart.
- Safe empty states added so an empty approval queue / activity feed does not
  look broken.

## Validation

- `npm run build` — PASS (tsc + vite, 1581 modules; pre-existing >500 kB chunk
  warning only).
- `npm run test` — PASS 65/65.
- Diff scoped to `src/App.tsx` + `src/index.css`. Secrets/URL grep clean.

## Follow-up recommendations (Phase A2)

- Extract the Command Center sections into a `DashboardShell` component to shrink
  `App.tsx` and enable code-splitting (addresses the standing >500 kB warning).
- Optional: a premium client-view dashboard pass (currently client view keeps the
  legacy presentation panels).
- Optional: light topbar/sidebar polish to match the new card language.
