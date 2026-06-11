# V2-A — Manual Browser E2E Checklist + Demo Script

**Workstream:** Post-MVP / Ver2 — work package **V2-A** (Manual Browser E2E Pass + Demo Script Verification)
**Date:** 2026-06-12
**Status:** 🟡 **CHECKLIST READY / E2E PENDING** — checklist + demo script are delivered (this doc), but the manual browser pass has NOT been executed yet. **V2-A may be marked DONE only after all four closure conditions are met:** (1) Owner or browser automation executes the §1 checklist, (2) results are recorded in a §3 QA report, (3) the §2 demo script is verified in a real run-through, (4) Owner approval is recorded.
**Product baseline:** Core MVP closed at 18/18 phases (`fd86ead`), UI polish through commit `bb8cb9e`. Build PASS, tests 45/45.

> **Scope guard:** This package is documentation only. No product features, no logic changes, no repository/Supabase/auth/UUID-gating/tenant-scope/sanitizer/RLS/connector/test changes, no live automation, no real ads/posting/messaging, no secrets.

---

## 0. How to run the pass

| Item | Value |
|---|---|
| Local | `npm run dev` → open the printed `http://localhost:5173` URL |
| Production | https://claude-marketing-team-demo.vercel.app/ |
| Expected data mode | **"Local Data Only"** amber badge (production Supabase env is OFF by design) |
| Demo credentials | `owner@thecore.agency` / `demo1234` (pre-filled when Supabase is not configured) |
| Browser | Latest Chrome (primary); optionally repeat key flows in Edge/Firefox |
| Reset between runs | DevTools → Application → Local Storage → clear keys starting `core_agency_*` / `claude_marketing_team_*` (optional — only if you want a fresh-seed run) |

**Severity definitions used below:**
- **BLOCKER** — demo cannot proceed or data is lost/corrupted (white screen, crash, action silently destroys data, console errors flooding on load).
- **Polish** — visual/wording issue that doesn't stop the flow. Record in the QA report template (§3), keep demoing.

**Standing safety expectation for EVERY item:** no real network calls besides Google Fonts (and Supabase only if env configured); nothing is posted, sent, or spent anywhere. If any screen ever claims content was *published* to a real channel — that is a BLOCKER and a safety regression.

---

## 1. Manual Browser E2E Checklist

### A1. App load / title / favicon / branding
- **Do:** Open the app URL in a fresh tab. Look at the browser tab and the page before interacting.
- **Expected:** Tab title "The Core Agency"; hexagon-C favicon (not the old ⚡ emoji); dark navy/black background with subtle orange glow top-left + faint grid/grain texture; no flash of unstyled content.
- **Blocker:** White/blank screen, JS error overlay, missing root content, favicon 404 breaking load.
- **Visual QA:** Background decoration visible but subtle (must not overpower content); Inter font loaded (no serif fallback flash longer than ~1s).
- **Safety:** DevTools Network tab: only local assets + Google Fonts. No third-party API calls.

### A2. Login / auth screen
- **Do:** With no active session (or after Sign out), observe the login screen. Click **Demo Sign In** form's **Sign In** button (credentials pre-filled: `owner@thecore.agency` / `demo1234`).
- **Expected:** Dark glass card with 64px Core icon above the title; "Demo Sign In" heading and "Demo credentials are pre-filled." hint; Email/Password fields; solid orange Sign In button showing "Signing in…" while submitting; lands on Dashboard as Owner.
- **Blocker:** Sign-in does nothing / throws; wrong credentials error with the pre-filled demo pair; app loads main UI without any auth gate when it shouldn't.
- **Visual QA:** Orange focus ring on inputs; button hover/disabled states; card centered on all window sizes; demo hint legible.
- **Safety:** This is demo/local auth when Supabase is unconfigured — confirm the header later shows "Local Data Only". No credentials are sent to any external service in that mode.

### A3. Header / Owner view (default)
- **Do:** After sign-in, inspect the header.
- **Expected:** Logo chip (42px, rounded, orange glow) + "THE CORE AGENCY" gradient title + "AI Marketing Team Workspace" subtitle; badges "Core MVP — Internal Demo" (orange) and "Local Data Only" (amber, tooltip on hover); user chip with email, role badge "Owner", DEMO tag, sign-out icon; **🔧 Owner View** highlighted orange in the view toggle.
- **Blocker:** Header missing/overlapping; sign-out broken; user shown without role.
- **Visual QA:** Badges aligned on one row; email truncates with ellipsis (not overflow); title gradient white→soft orange renders.
- **Safety:** Data-mode badge MUST say "Local Data Only" unless someone intentionally configured Supabase env — if it says "Supabase Data" unexpectedly, stop and check `.env.local`.

### A4. Client view toggle
- **Do:** Click **👁 Client View** in the header toggle. Inspect the sidebar. Then click an owner-only tab first (e.g. AI Team Board) and toggle to Client View while on it. Toggle back to Owner View.
- **Expected:** In Client View: sidebar hides **New Campaign Brief, AI Team Board, Client Workspace View, Manual Export Pack, Automation Logs**; if you were on one of those tabs, you are redirected to Dashboard. Toggle highlight switches to green "Client View". Owner View restores all tabs.
- **Blocker:** Owner-only tabs still reachable in Client View; toggle gets stuck; redirect crashes.
- **Visual QA:** Toggle pill states clearly distinguish active mode (orange vs green); sidebar section headers (CORE / CLIENT / WORKSPACE) stay aligned after items hide.
- **Safety:** This is the "what the client sees" mode for demos — verify nothing internal (logs, export internals) leaks into it.

### A5. Dashboard
- **Do:** Click **Dashboard** in the sidebar.
- **Expected:** Overview renders: active campaign summary, sandbox/safety grid, quick "how to use" step cards (Choose Brand → Review Plan → Review Outputs → Approve → Export); step cards navigate to their tabs when clicked.
- **Blocker:** Empty/crashed dashboard; step-card navigation throws.
- **Visual QA:** Cards on the glass style (18px radius, hover orange border glow); no stale phase numbers in any visible label; no "FnB OS V1" strings anywhere.
- **Safety:** Safety panel states manual publishing only / no real ads / no customer messaging — these rows must be present and checked.

### A6. Clients
- **Do:** Open **Clients**. Create a client (fill the form, save). Edit it. Check it appears in lists/dropdowns elsewhere.
- **Expected:** Client list renders seeded + new entries; create/edit persists across a page reload (localStorage); validation prevents empty required fields.
- **Blocker:** Create/edit throws; data vanishes on reload; form submits empty records.
- **Visual QA:** Form focus rings orange; table/list rows readable; long client names don't break the row layout.
- **Safety:** New records get local `client-*` style ids in Local mode — that's correct (UUID gating keeps them out of Supabase).

### A7. Brands
- **Do:** Open **Brands**. Create a brand under your test client; edit it.
- **Expected:** Brand list scoped/labelled by client; create/edit persists on reload; brand appears in downstream selectors (Campaigns, Brief Intake).
- **Blocker:** Brand saved under wrong client; create/edit throws; reload loses data.
- **Visual QA:** Client association clearly visible per brand; empty state (if no brands) is styled, not a blank area.
- **Safety:** Same local-id expectation as A6.

### A8. Campaigns
- **Do:** Open **Campaigns**. Create a campaign for your test client+brand with start/end dates; edit it.
- **Expected:** Campaign renders with computed duration (days); scoped to the chosen client+brand; persists on reload.
- **Blocker:** Duration wrong/NaN; campaign saved under wrong client/brand; create throws.
- **Visual QA:** Status/date chips legible; long campaign names wrap or truncate cleanly.
- **Safety:** None beyond standing expectations.

### A9. Brief Intake
- **Do:** Open **Brief Intake**. Create a brief for the test campaign (objective, audience, channels, tone…). Save, then edit one field.
- **Expected:** Brief saves under client+brand+campaign scope; edit works; status visible; the safety note says generation runs in the Content Generation tab.
- **Blocker:** Brief loses its campaign linkage; edit overwrites scope/tenant fields; save throws.
- **Visual QA:** Long multi-field form keeps labels aligned; required-field errors readable.
- **Safety:** Editing must never let you change which client/brand/campaign a brief belongs to (sanitizer-backed — UI should not offer it).

### A10. Content Generation
- **Do:** Open **Content Generation**. Select the test brief and run a generation job.
- **Expected:** Job runs (mock generation), produces a content plan with items (captions/posts per day/channel); job + items listed with statuses; persists on reload.
- **Blocker:** Generation hangs forever; items missing scope; throws on run.
- **Visual QA:** Generated cards readable; status chips (draft/generated) consistent colors; loading state shows spinner not frozen UI.
- **Safety:** Generated content is clearly NOT approved and NOT published — wording must keep the Generated ≠ Approved ≠ Published distinction.

### A11. Content Calendar
- **Do:** Open **Content Calendar**. Expand an item's detail. Resize the window narrower.
- **Expected:** Calendar/list of planned items by date renders; expanding an item shows caption/hashtags/visual brief; **rows stay inside the content area** (the `bb8cb9e` overflow fix) — no horizontal page scrollbar caused by long captions.
- **Blocker:** Calendar rows overflow the app shell again; expanding detail crashes.
- **Visual QA:** Long unbroken text wraps (word-break); breadcrumb ellipsizes; status tooltip directs to the Approvals tab (no stale phase wording).
- **Safety:** Calendar is planning-only — no schedule/publish buttons should exist.

### A12. Approvals
- **Do:** Open **Approvals**. Submit a generated item for approval; then as approver, Approve one and Request Changes on another; add a comment.
- **Expected:** Sidebar badge counts submitted requests; approval request lifecycle works (submitted → approved / changes-requested); events + comments appear in the trail; persists on reload.
- **Blocker:** Action buttons throw; status doesn't change; comment lost.
- **Visual QA:** Status badges distinct (submitted/approved/rejected); long comments wrap inside the card (word-break fix); subtitle carries the "Approved ≠ Published" note.
- **Safety:** Approving must NOT trigger any publishing — verify no network activity and wording says approval is an internal gate only.

### A13. Reports
- **Do:** Open **Reports**. Generate/view a report for the test scope.
- **Expected:** Report blocks/charts render from local data; disclaimer says analytics are not connected in this MVP.
- **Blocker:** Charts crash; report shows another client's data.
- **Visual QA:** Category/data-viz colors (purples/blues/emerald) intentionally differ from the orange brand accent — both should coexist cleanly; numbers legible on dark.
- **Safety:** All metrics are local/mock — no real analytics connector calls.

### A14. Export Pack
- **Do:** Open **Export Pack**. Build an export pack for the test campaign and preview/copy it.
- **Expected:** Pack assembles content into a copyable preview; copy-to-clipboard works.
- **Blocker:** Pack empty despite content existing; copy throws.
- **Visual QA:** Preview column stays within layout (defensive `minWidth: 0` fix); preformatted text scrolls inside its box, not the page.
- **Safety:** Export is manual copy only — no "send" or "publish" action may exist.

### A15. Connector Registry
- **Do:** Open **Connector Registry**. Review the listed connectors and the module event inbox.
- **Expected:** Registry shows planned connectors (n8n, Canva, Meta, etc.) as **registered/disabled — none live**; event inbox shows mock/local events only.
- **Blocker:** Any connector shown as ACTIVE/connected; any toggle that claims to enable a live connector and persists as enabled.
- **Visual QA:** Disabled state visually unmistakable; governance footer present, no stale phase numbers.
- **Safety:** **Highest-attention item.** Nothing here may initiate real traffic. If clicking anything fires an external request — stop the pass, record as BLOCKER + safety regression.

### A16. Automation Logs (Owner view only)
- **Do:** As Owner in Owner View, open **Automation Logs**. Then switch to Client View and confirm the tab disappears.
- **Expected:** Local/mock log entries render with severity chips; error-count badge on the sidebar item matches recorded errors; badge "Local / Mock — No Live Automation"; hidden entirely in Client View.
- **Blocker:** Logs visible to client view; log list crashes.
- **Visual QA:** Severity colors (error red / warn amber / info) consistent; `[Mock]` labels visible on sample bodies.
- **Safety:** Logs are records only — there must be no "run automation" action.

### A17. Client Portal
- **Do:** Open **Client Portal** (Client section). Review shared items as a client would; add feedback via the comment box.
- **Expected:** Client-facing summary of campaign/content/approvals; "Add Feedback" stores a comment (local mode) and shows it in the approval trail.
- **Blocker:** Portal exposes internal-only data (logs, exports, raw briefs); feedback throws.
- **Visual QA:** Green/emerald client accent on the tab; readable for a non-technical audience.
- **Safety:** Known limitation on record: once Supabase RLS is live, client-role feedback writes are owner/manager-gated pending a policy decision (16C-2 fix round). In local mode it works — fine for demo; do not present it as production client access.

### A18. Asset Library
- **Do:** Open **Asset Library**. Create an asset (metadata) under the test client+brand; edit it; archive it.
- **Expected:** Create/edit/archive work with a "Saving…" state; in edit mode the Client/Brand/Campaign fields are **disabled** (immutable after create); errors show in a banner, not a crash.
- **Blocker:** Edit lets you move an asset to another client/brand; archive deletes the wrong asset; save throws.
- **Visual QA:** "Metadata only (no file storage yet)" banner present; collection grouping renders.
- **Safety:** No real file upload exists — only metadata. Any upload control accepting a real file would be out of scope.

### A19. Brand Workspace
- **Do:** Open **Brand Workspace** (Workspace section). Switch the active brand/campaign card; click "open" on one.
- **Expected:** Gallery of demo brand workspaces with per-agent output counts (Copywriter/Video Editor/Designer/Ads Manager); selecting one sets it active and jumps to Dashboard.
- **Blocker:** Switching active brand corrupts/blanks the dashboard; cards crash.
- **Visual QA:** Cards uniform height; counts legible; boundary strip ("Never: no auto-post, no real ads") present.
- **Safety:** Boundary messaging is part of the demo — verify it renders.

### A20. New Campaign Brief (Owner view only)
- **Do:** In Owner View, open **New Campaign Brief**. Fill the brand brief form and trigger the AI team ("Kích hoạt AI").
- **Expected:** Form validates; activation starts the simulated AI team run (progress over ~minutes); cancel ("Hủy bỏ") returns to Dashboard; hidden in Client View.
- **Blocker:** Activation throws; progress never completes; a half-created campaign corrupts the campaign list.
- **Visual QA:** Long form readable; progress state obviously "working".
- **Safety:** "AI team" is simulated locally — no external AI/API calls in this MVP demo workspace.

### A21. AI Team Board (Owner view only)
- **Do:** In Owner View, open **AI Team Board**.
- **Expected:** Board of AI agent roles (Copywriter, Video Editor, Designer, Ads Manager, Data Reporter…) with status/queue per active campaign; hidden in Client View.
- **Blocker:** Board crashes with the test campaign active.
- **Visual QA:** Agent cards consistent; role colors match the rest of the app.
- **Safety:** Display-only board — no live agent execution.

### A22. Campaign Outputs
- **Do:** Open **Campaign Outputs**. Walk the output tabs: Captions, Video Scripts, Design Prompts, Ads Plan.
- **Expected:** Each tab lists the active campaign's generated outputs; switching output tabs is instant; copy actions work.
- **Blocker:** Output tabs empty for a campaign that has outputs; tab switch throws.
- **Visual QA:** Output cards wrap long text; per-channel/per-day labels clear; orange active-tab state.
- **Safety:** Ads Plan is a *plan document only* — verify no spend/launch controls.

### A23. Approval Checklist
- **Do:** Open **Approval Checklist**. Toggle some checklist items; verify the fixed (locked) items can't be unchecked.
- **Expected:** 10-point checklist per campaign; free items toggle and persist; fixed safety items ("Manual publishing only — no auto-scheduler", "No real ads launched", "No customer messaging sent") are locked checked.
- **Blocker:** Fixed safety items can be unchecked; toggles don't persist.
- **Visual QA:** Checked/unchecked states distinct; locked items visibly different (e.g. dimmed lock).
- **Safety:** The three fixed items ARE the safety contract — locked state is mandatory.

### A24. Client Presentation Pack
- **Do:** Open **Client Presentation Pack**. Walk the pack sections; use any copy buttons.
- **Expected:** Client-ready presentation blocks (problem, solution, value, before/after) render for the active campaign; copy works.
- **Blocker:** Sections render empty/broken for a campaign with data.
- **Visual QA:** Presentation typography polished — this is a client-facing artifact; check spacing and Vietnamese text rendering.
- **Safety:** None beyond standing expectations.

### A25. Client Workspace View (Owner view only)
- **Do:** In Owner View, open **Client Workspace View**.
- **Expected:** The "pitch mode" walkthrough: customer problem → AI team solution → what the client receives → manual approval requirement → why it's safe; hidden in Client View.
- **Blocker:** Walkthrough sections crash or show placeholder text.
- **Visual QA:** The five labelled blocks (Vấn đề khách hàng / Giải pháp AI Team / Khách nhận được / Cần duyệt thủ công / Tại sao an toàn) all render with icons.
- **Safety:** Messaging must match reality: manual approval, no auto-posting.

### A26. Manual Export Pack (Owner view only)
- **Do:** In Owner View, open **Manual Export Pack**. Copy each pack: full campaign pack, client summary, editor handoff, designer handoff.
- **Expected:** Each copy button fills the clipboard with a complete, formatted text pack; hidden in Client View.
- **Blocker:** Copy produces empty/truncated text; throws.
- **Visual QA:** Pack previews scroll inside their blocks; copy success feedback visible.
- **Safety:** This is the ONLY export path — manual copy. Confirm no email/send/webhook button exists.

### A27. Presentation & Export
- **Do:** Open **Presentation & Export**. Review the combined presentation/export surface and run its export/copy actions.
- **Expected:** Presentation-mode summary + export actions work for the active campaign.
- **Blocker:** Actions throw; content mismatched with the active campaign.
- **Visual QA:** Consistent with A24/A26 styling; no overlapping panels at 1366×768.
- **Safety:** Manual export only, as above.

### A28. Cross-cutting final sweep
- **Do:** With DevTools console open, click through every sidebar tab once in Owner View, then once in Client View. Reload the page on a deep tab.
- **Expected:** Zero uncaught console errors across the full sweep; reload restores session and lands without crash; all data created during this pass still present.
- **Blocker:** Any uncaught exception; data loss on reload.
- **Visual QA:** Sidebar active state always matches the open tab; no tab renders a horizontal page scrollbar at 1366×768 or 1920×1080.
- **Safety:** Network tab over the whole sweep: still only local assets + fonts.

---

## 2. Demo Script — "The Core Agency" (5–10 minutes)

**Audience:** prospective client or internal stakeholder. **Mode:** production URL, Owner View, demo sign-in. **Prep:** run checklist §1 first; have one polished campaign active (Brand Workspace → pick the best-looking demo brand).

### 2.1 Opening pitch (30s)
> "This is **The Core Agency** — an AI marketing team in a box. One owner, one workspace, a full creative team's output: captions, video scripts, design briefs, and ad plans — generated in minutes, but **never published without a human signature**."

Show: login screen → Demo Sign In → branded loading → Dashboard. Point at the logo, the "Core MVP — Internal Demo" badge.

### 2.2 The problem (45s)
> "A small brand that wants daily content needs a copywriter, an editor, a designer, and an ads planner — that's a payroll most SMEs can't carry. Agencies are expensive and slow. DIY AI tools produce fragments with no workflow, no approval, and no client-facing professionalism."

Stay on Dashboard; gesture at the step cards (brief → outputs → approval → export) as "the missing workflow".

### 2.3 The solution (45s)
> "The Core Agency wraps an AI creative team in a real agency workflow: client → brand → campaign → brief → generated content → **approval gate** → client-ready pack. Generated, approved, and published are three different states here — by design."

### 2.4 Owner workspace (1 min)
Walk the sidebar top-down, fast: Clients, Brands, Campaigns ("real account structure, multi-client, multi-brand"), Brief Intake, Content Generation, Calendar, Approvals, Reports. One sentence each. Open **Content Calendar** to show a planned week.

### 2.5 Brand / campaign flow (1–1.5 min)
Open **Brand Workspace** → pick the demo brand → Dashboard shows its campaign. Then **New Campaign Brief**: "I fill in the brand's voice, product, audience — and activate the AI team." (Optionally trigger it if time allows; otherwise show an already-generated campaign.)

### 2.6 AI team output (1.5 min)
Open **AI Team Board** ("five specialist agents") then **Campaign Outputs**: flip through Captions → Video Scripts → Design Prompts → Ads Plan.
> "This is a full creative package a human team would take a week to draft — structured, on-brand, per-channel."

### 2.7 Approval safety (1 min)
Open **Approvals** (or **Approval Checklist**): submit/approve one item live.
> "Nothing leaves this system on its own. Every piece passes a human approval gate, and the three safety rules at the bottom are locked: manual publishing only, no real ads launched, no customer messaging. That's not a setting — it can't be unchecked."

### 2.8 Client presentation & export (1 min)
Switch the header toggle to **Client View**:
> "This is exactly what your team or your client sees — internal tooling disappears."
Open **Client Presentation Pack**, then back in Owner View open **Manual Export Pack** and copy the Client Summary live.
> "One click and the approved pack is ready to hand to your editor, your designer, or your client."

### 2.9 Why no auto-posting / ads yet (45s)
> "Deliberately. Auto-posting and ad spend are one-way doors — a wrong post or a runaway budget costs real money and reputation. The connector layer is already designed (show **Connector Registry** — registered, disabled), but every connector goes live only after a written sign-off, starting with the safest. Today the system proves the workflow; automation arrives gate by gate."

### 2.10 Closing CTA (30s)
> "What you saw is the Core MVP — live, stable, and safe to pilot. Next step: a two-week pilot with one of your brands — your real brief, our workspace, your approval on everything. If the output quality convinces you, we scale to your full brand portfolio and switch on connectors at your pace. Shall we book the pilot kickoff?"

**Timing total:** ~8 min nominal; cut 2.4 short and skip live generation in 2.5 to hit 5 min.

---

## 3. UI QA Report Template

Copy this block into a new file `08_logs/v2a_qa_report_YYYYMMDD.md` per pass.

```markdown
# V2-A UI QA Report — <date> — <tester> — <env: local|vercel> — <browser/resolution>

## 1. Blocker bugs (demo cannot proceed / data loss)
| # | Checklist item | Steps to reproduce | Expected | Actual | Console error? |
|---|---|---|---|---|---|
| B1 | | | | | |

## 2. Visual polish issues (non-blocking)
| # | Screen | Issue | Suggested fix | Severity (high/med/low) |
|---|---|---|---|---|
| V1 | | | | |

## 3. Wording / copy issues (typos, stale labels, mixed-language, tone)
| # | Screen | Current text | Suggested text |
|---|---|---|---|
| W1 | | | |

## 4. Responsive / mobile issues (note: desktop-first MVP — record, don't block)
| # | Screen | Width | Issue |
|---|---|---|---|
| R1 | | | |

## 5. Deferred improvements (ideas out of V2-A scope — route to V2-E/backlog)
| # | Idea | Why deferred |
|---|---|---|
| D1 | | |

## Verdict
- [ ] PASS — demo-ready, no blockers
- [ ] PASS WITH NOTES — no blockers, polish items logged
- [ ] FAIL — blockers found: <list ids>
```

---

## 4. Sign-off

| Role | Action |
|---|---|
| Tester (Owner or delegate) | Execute §1 in a real browser, file the §3 report |
| Claude Code (PC1) | Fix any blockers found (each fix = its own scoped diff + build + tests) |
| Codex | Review fixes if any |
| Owner | Accept the QA verdict → unlocks V2-D (client demo package) and V2-B (Supabase staging) per the Ver2 roadmap |
