# V2-C — Client Demo Package — The Core Agency

**Workstream:** Post-MVP / Ver2 — work package **V2-C (Owner naming) — Client Demo Package**
**Date:** 2026-06-12
**Status:** ✅ **DONE / PASS (closed 2026-06-12)** — the **Owner rehearsed the §3 5-minute script against the live UI flow** on 2026-06-12; result **"ổn" / PASS — no blocking demo issues reported**. Closure conditions met: (1) Owner rehearsal executed (5-min script + UI flow) ✅, (2) results recorded (`08_logs/v2c_rehearsal_20260612.md` + §14 below) ✅, (3) Owner approval recorded for **controlled internal/demo use** ✅, (4) approval logged (CURRENT_PHASE.md + phase_log.md) ✅. **Client-facing use remains controlled** and must always respect the §8 safety boundaries: no auto-posting, no real ads, no real messaging, no live connectors, approval required before external use.
**Baseline:** Core MVP closed 18/18; V2-A manual browser E2E executed by Owner — DONE / PASS (`9aa0064`); build 0 TS errors; tests 45/45.

> **Naming note:** In `PHASE_19_VER2_ROADMAP.md` the client demo package was listed as **V2-D** (roadmap-V2-C = PC2 n8n dry-run, NOT started, Owner-gated). The Owner labels this package **V2-C** — this doc follows the Owner's naming, consistent with the earlier V2-B naming precedent.

> **Scope guard:** Documentation/demo material only. No product features, code, UI, or runtime changes. No repository/Supabase/auth/UUID-gating/tenant-scope/sanitizer/RLS/connector/test changes. No live automation, real ads, real posting, real messaging, or secrets — and this package teaches the presenter to say exactly that.

**Companion doc:** `V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md` — §1 is the QA checklist to re-run before important demos; its §2 script is the basis for the 10-minute script below.

---

## 1. Pre-demo checklist (run 30–60 min before)

| # | Check | Pass condition |
|---|---|---|
| P1 | Open https://claude-marketing-team-demo.vercel.app/ in a fresh browser profile | Loads < 3s, no console errors |
| P2 | Demo Sign In works (`owner@thecore.agency` / `demo1234`, pre-filled) | Lands on Dashboard as Owner |
| P3 | Header badges | "Core MVP — Internal Demo" + amber **"Local Data Only"** visible |
| P4 | Seed data present | Clients/Brands/Campaigns show Vị Cuốn, Cơm Tấm Bản Khói, Forme |
| P5 | Brand Workspace cards show output counts | Captions/scripts/briefs/ad sets > 0 on the demo brand you'll use |
| P6 | Click through your planned route once (see §5) | No blockers; Approvals badge shows pending items if you staged any |
| P7 | Close DevTools, hide bookmarks bar, set browser zoom 100%, full-screen | Clean presentation surface |
| P8 | Notifications off (OS + browser), other tabs closed | No popups mid-demo |
| P9 | Backup: screenshots of every screen in §5 saved locally | Usable if venue network fails |
| P10 | Decide Owner View vs Client View moments in advance | You know when you'll toggle |

**If any P-item fails:** fall back to local (`npm run dev`) or to the screenshot deck (P9). Never debug live in front of a client.

---

## 2. Recommended demo data / brand order

The workspace ships three seeded demo brands; use them in this order:

1. **Cơm Tấm Bản Khói** (F&B, 15-day "Ra Mắt Menu Mới Q3/2026", brief status *ready for generation*) — **primary demo brand.** Relatable product, complete brief (goals, audience, pillars, budget split, must-avoid rules), and the right status to run Content Generation live.
2. **Forme** (premium furniture, 30-day "Sofa F-1 Launch", brief *approved for generation*) — **second example** to show the system is not F&B-only: different tone (refined/premium), different channels (adds Instagram + YouTube), bigger budget. Use when the prospect is non-food or upscale.
3. **Vị Cuốn** (street food, 7-day summer campaign, brief still *draft*) — **process example**: shows what a brief looks like *before* it's ready, useful when explaining the intake → ready → generate pipeline.

**Rules of thumb:**
- Demo ONE brand deeply rather than three shallowly; mention the others in one sentence ("same workspace runs a furniture brand and two restaurants — multi-client by design").
- If the prospect's industry matches a seed brand, lead with that brand.
- For the Workspace-section tabs (Campaign Outputs, Manual Export Pack), use the Brand Workspace demo campaign with the highest output counts (P5).
- Never type a prospect's real brand data into the live demo — offer that as the pilot next step instead (§12).

---

## 3. 5-minute demo script (tight — for busy decision-makers)

**Route:** Login → Dashboard → Campaign Outputs → Approvals → Client View → Manual Export Pack.

1. **(0:00–0:30) Open + pitch.** Sign in live.
   > "This is The Core Agency — an AI marketing team in a box. Full creative output — captions, video scripts, design briefs, ad plans — with a human approval gate before anything goes anywhere."
2. **(0:30–1:30) Dashboard.** Point at the workflow step cards.
   > "One workspace: client → brand → campaign → brief → AI generation → approval → export. Three demo brands are running here — two restaurants, one furniture maker."
3. **(1:30–3:00) Campaign Outputs.** Open the demo campaign; flip Captions → Video Scripts → Design Prompts → Ads Plan.
   > "This is a week of content a human team drafts in days — generated in minutes, structured per channel, on the brand's tone rules."
4. **(3:00–4:00) Approvals.** Approve one item live; show the locked safety checklist items.
   > "Nothing publishes itself. Generated, approved, and published are three different states — and these three safety rules are locked: manual publishing only, no real ads, no customer messaging."
5. **(4:00–4:30) Client View toggle + Manual Export Pack.** Switch to Client View ("this is what you'd see"), back to Owner, copy the Client Summary pack.
   > "One click, and the approved pack is ready for your editor, designer, or inbox."
6. **(4:30–5:00) Close.**
   > "Today this runs in safe demo mode — your pilot would run your real brief through this exact flow, with your approval on every piece. Two weeks, one brand. Want to pick the brand?"

---

## 4. 10-minute demo script (full — internal stakeholders / warm prospects)

**Route:** the full V2-A §2 script, updated with the demo-data order above. Beats and timing:

| # | Beat | Time | Screen | Key line |
|---|---|---|---|---|
| 1 | Opening pitch | 0:30 | Login → Dashboard | "AI marketing team in a box — never publishes without a human signature." |
| 2 | Problem | 0:45 | Dashboard (step cards) | "Daily content needs 4–5 specialists most SMEs can't hire; DIY AI gives fragments with no workflow." |
| 3 | Solution | 0:45 | Dashboard | "Real agency workflow around an AI team: Generated ≠ Approved ≠ Published, by design." |
| 4 | Owner workspace tour | 1:00 | Sidebar walk: Clients → Brands → Campaigns → Brief Intake → Content Calendar | "Real account structure — multi-client, multi-brand. Here's a planned week." |
| 5 | Brand/campaign flow | 1:30 | Brand Workspace → Cơm Tấm Bản Khói brief | "The brief captures voice, audience, offers, even must-avoid rules — the AI team works inside those guardrails." |
| 6 | AI team output | 1:30 | AI Team Board → Campaign Outputs (all 4 output tabs) | "Five specialist agents; a full creative package, per channel, on tone." |
| 7 | Approval safety | 1:00 | Approvals → Approval Checklist | "Approve one live. The three locked rules can't be unchecked — that's the safety contract." |
| 8 | Client presentation/export | 1:00 | Client View toggle → Client Presentation Pack → (Owner) Manual Export Pack | "Client sees a clean portal; you export the approved pack in one click." |
| 9 | Why no auto-posting/ads yet | 0:45 | Connector Registry | "Connectors exist — registered and deliberately disabled. They go live gate by gate, each with written sign-off." |
| 10 | Closing CTA | 0:30 | Dashboard | "Two-week pilot, one brand, your approval on everything. Book the kickoff?" |

**Total ~9:15** with transitions. Cut beat 4 to one sentence to land at 8 minutes; add live Content Generation on the Cơm Tấm brief (+1–2 min) only if the audience is technical and time allows.

---

## 5. Screen-by-screen presentation flow

The exact click path for the 10-minute script (presenter's cheat sheet):

| Step | Screen | What to show | What to say (one-liner) | Don't |
|---|---|---|---|---|
| 1 | Login | Logo, Demo Sign In pre-filled | "Secure workspace; demo account today." | Don't explain auth internals |
| 2 | Dashboard | Step cards, safety grid, badges | "The whole agency loop on one screen." | Don't read every card |
| 3 | Clients | Seeded client list | "Each client is isolated — multi-tenant from day one." | Don't create records live |
| 4 | Brands | Brands under clients | "A client can hold many brands." | — |
| 5 | Campaigns | Campaign list + durations | "Campaigns carry budget, dates, status." | — |
| 6 | Brief Intake | Cơm Tấm brief detail | "The brief is the contract the AI works under." | Don't scroll every field |
| 7 | Content Calendar | Planned week | "Planning view — what goes out, when, where." | Don't resize the window |
| 8 | Brand Workspace | Demo brand cards + output counts | "Pick a brand, its whole workspace follows." | — |
| 9 | AI Team Board | Agent roles | "Copywriter, editor, designer, ads, reporting — as agents." | Don't claim live AI calls |
| 10 | Campaign Outputs | 4 output tabs | "The deliverable: full creative pack." | Don't read captions aloud — let them skim |
| 11 | Approvals | Approve 1 item, comment | "Human gate. Watch the status change." | Don't reject items you need later |
| 12 | Approval Checklist | Locked safety items | "These three can't be unchecked." | — |
| 13 | Header toggle | Client View | "This is the client's view — internal tools gone." | Don't stay in Client View > 1 min |
| 14 | Client Presentation Pack | Problem/solution/value blocks | "Client-ready framing, auto-assembled." | — |
| 15 | Manual Export Pack (Owner View) | Copy Client Summary live | "Manual export is the ONLY way out of the system — by design." | — |
| 16 | Connector Registry | Registered-but-disabled connectors | "The future, visible but switched off until sign-off." | Don't toggle anything |
| 17 | Dashboard | Return home for CTA | Close per §12. | Don't end on a deep screen |

---

## 6. Positioning talking points — The Core Agency

- **Category:** "An AI marketing team in a box, wrapped in a real agency workflow." Not a content-spinner, not a scheduler — an *operations system*.
- **The triangle we break:** good / fast / affordable — agencies give you good-but-slow-and-expensive; DIY AI gives fast-and-cheap fragments. The Core Agency gives structured agency output at AI speed, with accountability.
- **Workflow is the moat:** anyone can generate a caption. Brief discipline (tone, must-avoid, pillars), multi-brand tenancy, an enforced approval state machine, and clean handoff packs are what make output *usable*.
- **Human-in-command, not human-in-the-loop-as-afterthought:** the approval gate is architectural (a state machine), not a checkbox setting.
- **Safety as a feature:** "We can't accidentally spend your ad budget or post in your name — the system physically has no live connection to do it yet."
- **Vietnamese-market fluent:** seeded demos are real VN brand archetypes (cơm tấm, street food, premium furniture) with local tone-of-voice rules.
- **One-person agency leverage:** one owner can credibly serve multiple brands with specialist-level deliverables.

---

## 7. How to explain sandbox / local data

Say it early (when the amber badge is visible), in plain words:

> "See this badge — **Local Data Only**. Today's demo runs entirely in this browser: nothing I type leaves this machine, and the system has no connection to Facebook, TikTok, or any ad account. That's deliberate. The full database layer (Supabase with row-level security) is already built and tested — we keep it switched off for demos so I can show you everything with zero risk to anyone's real accounts or data."

If asked "so is this fake?":
> "The workflow, the permission system, and the safety gates are fully real — what's sandboxed is the *storage and the outside world*. Your pilot runs the same product with the database switched on for your tenant only."

Never claim live posting/analytics exist. Never apologize for the sandbox — it's the safety story (§8), told positively.

---

## 8. How to explain the safety boundaries

The five boundaries, each with the one-liner a client hears:

| Boundary | What to say |
|---|---|
| **No auto-posting** | "The system cannot post to your pages. Publishing is a human action, outside the system, using the export pack." |
| **No real ads** | "It plans ad sets and budgets — it cannot spend a dong. Ad accounts are never connected in this version." |
| **No real messaging** | "It will never message your customers. There is no messaging integration, period." |
| **No live connectors** | "Every integration you saw in the registry is registered and *disabled*. Each one goes live only with written sign-off, one at a time, safest first." |
| **Approval before external use** | "Nothing generated is usable until a human approves it — and three of the checklist rules are locked so they can't be skipped." |

Frame: these are not missing features — they are **the reason a cautious business can adopt AI marketing at all**. "Blind automation is a one-way door; we open doors one gate at a time."

---

## 9. FAQ — likely client questions

**Q: Can it post to our Facebook/TikTok automatically?**
A: Not today, deliberately. You export the approved pack and publish manually. Auto-publishing arrives later, per-channel, only with your written sign-off — approval-gated even then.

**Q: Is this ChatGPT with a skin?**
A: No. The value is the operations layer: brief discipline, multi-brand tenancy, an approval state machine, audit trail, and client-ready exports. Generation is one stage of seven.

**Q: Where is our data stored? Is it safe?**
A: In demo mode, nowhere — it stays in this browser. In a pilot, in a dedicated Postgres (Supabase) tenant with row-level security: your client's data is isolated at the database level, and client-role users are read-only by design.

**Q: Will the content actually match our brand voice?**
A: The brief carries your tone-of-voice, key messages, and explicit must-avoid rules — and you reject anything off-brand at the approval gate. The system learns your standards through the brief, not by guessing.

**Q: What does it cost? / What's the business model?**
A: Pilot first — two weeks, one brand, fixed scope — then we price ongoing service on brands and volume. (Owner adjusts to current offer; do not invent numbers mid-demo.)

**Q: Can our team use it ourselves, or do you run it for us?**
A: Both models work. Today, The Core Agency operates it for you with your approvals; self-serve client access (read-only portal) exists now, deeper client roles are on the roadmap.

**Q: What about images and video — does it make those?**
A: It produces design prompts and video scripts — production-ready handoffs for a designer/editor (or AI tools you already use). Native asset generation and file storage are roadmap items.

**Q: Is the AI generation live right now?**
A: In this demo workspace, generation runs on a built-in simulation so the demo is fast and offline. The pilot connects a real model under the same workflow. The workflow you saw — brief, gates, exports — is the real product.

**Q: What happens if the AI writes something wrong or risky?**
A: It dies at the approval gate. Nothing reaches a customer without a human approving it, and the locked checklist makes skipping that structurally impossible.

**Q: Why should we trust a new system?**
A: Don't — pilot it. Two weeks, one brand, zero connection to your accounts, you approve everything. The exit cost is zero; everything approved is exported in open formats you keep.

---

## 10. Risks & limitations to disclose honestly

Disclose these proactively if relevant; never let a prospect discover them later:

1. **Demo generation is simulated** — the demo workspace uses built-in mock generation, not a live LLM call. Real-model integration is a pilot/roadmap step.
2. **No real publishing/ads/messaging exists at all yet** — not "switched off for the demo": not built into this version. Activation is a future, gated workstream.
3. **No file storage** — Asset Library manages metadata only; real image/video files live outside the system for now.
4. **Analytics are illustrative** — Reports render from local data; no real channel analytics are connected.
5. **Demo data lives in the browser** — clearing browser storage resets it. The production database layer (Supabase + RLS) is built and reviewed but kept OFF in the public demo.
6. **Client-role feedback under live RLS is pending a policy decision** — in a Supabase-enabled deployment, client users are read-only including comments until that's resolved (known, documented).
7. **Single-page bundle is heavy (~920 kB)** — first load on slow connections can lag; code-splitting is a planned polish item (roadmap V2-E).
8. **Desktop-first** — the UI is not yet optimized for phones/tablets; demo from a laptop + external display.
9. **It's an MVP** — closed, tested (45/45), and stable, but scope-limited by design; the roadmap is real and sequenced, not vaporware promises.

---

## 11. Post-demo follow-up checklist (within 24h)

| # | Action |
|---|---|
| F1 | Send thank-you note + the one-page sales summary (§13) as PDF/text |
| F2 | Attach a sample export pack (Client Summary from the demo brand — sample data only, never the prospect's name on demo content) |
| F3 | Answer any question you deferred during the demo — in writing, honestly, including limitations (§10) |
| F4 | Send the concrete pilot proposal: scope (1 brand, 2 weeks), what they provide (brief inputs, approver availability), what they get (≥1 full campaign pack), price/terms per current Owner offer |
| F5 | Log the session: who attended, objections raised, which FAQ items came up, which screens landed best — add recurring objections to §9 |
| F6 | Schedule the follow-up call before the email thread goes cold (propose 2 slots) |
| F7 | If they declined: ask one question — "what would have to be true for this to be useful to you?" — and log the answer for the roadmap |
| F8 | Internal: report any UI issue noticed mid-demo via the V2-A QA report template (`08_logs/v2a_qa_report_YYYYMMDD.md`) |

---

## 12. Next-step offer after the demo

**The standard close (say it, then stop talking):**

> "Here's what I suggest: a **two-week pilot with one of your brands**. You give us the brief — your voice, your offers, your rules. We run it through exactly the workflow you just saw. You approve or reject every single piece. At the end you own a complete, approved campaign pack — captions, scripts, design briefs, ad plan — whatever happens next. No connection to your accounts, no risk, and you'll know precisely what working with The Core Agency feels like. Which brand should we start with?"

**Fallback offers (descending commitment):**
1. Pilot (above) — the default ask.
2. **Brief workshop** (1 session): build their real brief together in the intake form; they keep it either way.
3. **Sample pack**: they send basic brand info by email; we deliver one mini content pack for internal review.
4. **Stay-in-touch**: add to the update list for the next milestone (e.g., live-model generation or first connector gate).

Always leave with a named next step and a date — even if the step is "decide by Friday."

---

## 13. One-page sales summary — The Core Agency

*(Send as follow-up F1; readable in 60 seconds.)*

**Problem.** Consistent multi-channel marketing needs a copywriter, video editor, designer, ads planner, and project manager. Most SMEs can't hire that team; agencies are expensive and slow; raw AI tools produce unstructured fragments with no brand control, no workflow, and no accountability.

**Solution.** The Core Agency is an AI marketing team wrapped in a real agency operating system: structured brand briefs in, complete campaign packs out — with a mandatory human approval gate between generation and the outside world.

**What the system does.**
- Manages clients → brands → campaigns → briefs in one multi-tenant workspace
- Generates the full creative pack per campaign: captions, video scripts, design prompts, ad plans
- Plans content on a calendar; routes every item through an approval workflow with audit trail
- Presents a clean read-only client portal and assembles client-ready presentation packs
- Exports approved work as handoff packs (client summary, editor handoff, designer handoff) — manually, on your command

**Why it's safer than blind automation.** Generated ≠ Approved ≠ Published is enforced as a state machine, not a setting. The system has **no live connection** to social accounts, ad accounts, or messaging — it cannot post, spend, or message anyone. Integrations are pre-registered but disabled, activated later one by one, each behind explicit written sign-off. Locked checklist rules (manual publishing only / no real ads / no customer messaging) cannot be unchecked.

**Who it's for.** SME brand owners who want agency-grade output without agency overhead; solo marketers/boutique agencies serving multiple brands; teams that want AI leverage but cannot afford an AI mistake in public.

**Current status.** Core MVP complete (18/18 phases) and closed; 45/45 automated tests passing; manual browser QA executed and passed; live demo at claude-marketing-team-demo.vercel.app running in safe sandbox mode (local data, no external connections).

**Next roadmap.** Live database tenancy per client (built — staged activation) → live-model content generation in pilots → demo-to-pilot program → polish (performance, accessibility) → connector activation gate-by-gate (workflow automation first, ad/messaging integrations last, each with owner sign-off). **Next step: a two-week, one-brand pilot — your brief, our workflow, your approval on everything.**

---

## 14. Sign-off — V2-C closure conditions (CLOSED — 2026-06-12)

| # | Condition | Status |
|---|---|---|
| 1 | Owner rehearses the §3 (5-min) and/or §4 (10-min) script against the live demo | ✅ DONE — Owner rehearsed the §3 5-minute script with the live UI flow (2026-06-12) |
| 2 | Rehearsal notes/results recorded | ✅ DONE — result "ổn" / PASS, demo flow verified against current UI, no blocking demo issues; record: `08_logs/v2c_rehearsal_20260612.md` |
| 3 | Owner approves the package for controlled client/internal use | ✅ DONE — Owner approval recorded for **controlled internal/demo use** (2026-06-12) |
| 4 | Approval logged in CURRENT_PHASE.md + phase_log.md | ✅ DONE — logged 2026-06-12 |

| Role | Action | Status |
|---|---|---|
| PC1 (Claude Code) | Package authored (this doc) | ✅ DONE |
| Codex | Review for accuracy vs product reality (esp. §7–§10 claims) | ✅ Status-discipline review applied (required fix); claims review may continue as standing item |
| Owner | Conditions 1–4 above | ✅ DONE (2026-06-12) |

**Standing rule (unchanged by closure):** client-facing use stays controlled — every demo respects the §8 safety boundaries (no auto-posting, no real ads, no real messaging, no live connectors, approval required before external use), and the §1 pre-demo checklist is re-run before each important demo.
