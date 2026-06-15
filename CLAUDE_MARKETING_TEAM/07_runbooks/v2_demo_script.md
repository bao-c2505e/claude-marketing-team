# V2 Owner Demo Script — The Core Agency (Core + PC2 mock backbone)

**Work package:** V2-D1.5 (manual E2E verification prep) — documentation/demo-script only.
**Date:** 2026-06-12
**Length:** 10–15 minutes.
**Mode:** Local Data Only (Supabase OFF). Fictional/simulated data only. PC2 callback shown as **non-authoritative metadata preview**.

> **Scope guard:** This script drives the Core UI in demo mode and shows PC2 callback JSON as read-only metadata. It does **not** post, run ads, message customers, connect a connector, run SQL, or touch a database. Pair with `07_runbooks/v2_manual_e2e_checklist.md` (run the preflight there first) and `V2C_CLIENT_DEMO_PACKAGE.md` (broader client-facing scripts).

> **Companion:** This is the *internal/owner technical walkthrough* that adds the PC2-callback-as-metadata and failure-route beats. For a client-facing pitch, use `V2C_CLIENT_DEMO_PACKAGE.md` §3/§4 instead.

---

## 0. Demo persona / data

- **Client (fictional):** "Vị Cuốn" — a Vinh-based premium street-food brand (seeded demo data). Summer "Heo Quay" 7-day campaign.
- **All data is fictional/simulated.** No real customer, no real budget commitment, no real channel.
- **Prep:** run `v2_manual_e2e_checklist.md` §2 preflight (build/test/badge). Have the Vị Cuốn demo brand available (Brand Workspace) or create it live per §2 below.

---

## 1. Open Core (0:00–1:00)

**Do:** Open the app; sign in with the demo account (pre-filled); land on Dashboard.

**Narrator:**
> "This is The Core Agency — an AI marketing team wrapped in a real agency workflow. Notice the badge: **Local Data Only**. Everything in this demo lives in this browser. There's no connection to Facebook, no ad account, no database in the cloud — by design. What I'm about to show is the workflow and the safety model, end to end."

---

## 2. Select or create client (1:00–2:30)

**Do:** Clients tab → select **Vị Cuốn** (or create it live: name, contact — fictional).

**Narrator:**
> "Everything starts with a client. The Core Agency is multi-tenant: each client's data is isolated. I'll use Vị Cuốn, a street-food brand. Watch how every layer below stays scoped to this client."

---

## 3. Select or create brand (2:30–3:30)

**Do:** Brands tab → create/select the **Vị Cuốn** brand under that client.

**Narrator:**
> "A client can own several brands. This brand belongs only to Vị Cuốn — it won't appear under any other client. That scoping is enforced all the way down."

---

## 4. Create campaign (3:30–4:45)

**Do:** Campaigns tab → create **"Heo Quay Mùa Hè"**, 7-day, with start/end dates.

**Narrator:**
> "Now a campaign — a 7-day summer push. It carries its own budget placeholder, dates, and status, and it's bound to this client and brand. Still nothing leaves the system."

---

## 5. Create brief (4:45–6:00)

**Do:** Brief Intake tab → create a brief for the campaign (goal, hero product "bánh tráng cuốn heo quay", audience, channels Facebook/TikTok, tone, must-avoid rules).

**Narrator:**
> "The brief is the contract the AI team works under: the voice, the offer, the audience, and the rules it must *not* break. This is what keeps generated content on-brand — and it's where a human sets the guardrails before anything is generated."

---

## 6. Generate / mock content output (6:00–8:00)

**Do:** Content Generation tab → select the brief → run generation. Show the resulting content items (captions/posts per day/channel).

**Narrator:**
> "I trigger the AI team. In this demo the generation runs on a built-in simulation — fast and fully offline. Out comes a week of structured content, per channel, following the brief. Critically: every item lands in the **generated** state. Generated is not approved, and approved is not published — three different things."

**What NOT to claim (say nothing implying):** that this called a live model, posted anything, or is final.

---

## 7. Show approval state remains pending/generated (8:00–9:30)

**Do:** Approvals tab → submit one item → leave it un-acted. Reload the page. Show the request is **pending** and the item is still **generated**.

**Narrator:**
> "Here's the safety core. I submit an item for approval — and I stop. Nothing advances on its own. Reload the page: still pending, still generated. The system will never move an item forward without a human clicking approve, right here in Core. Core is the *only* approval authority."

---

## 8. Show PC2 callback / module preview as metadata only (9:30–11:30)

**Do:** Open the PC2 callback preview artifact / module-output surface (e.g. a saved `unified_callback` preview JSON, or the Automation Logs metadata view). Point at the status fields.

**Narrator:**
> "Behind the scenes we've built an automation backbone — n8n plus module stubs — that can *prepare* work. But look carefully at what it returns: it's **metadata**. When a module finishes, the mock pipeline reports a final status like **`completed_mock`**. When the approval gate sees a decision, it reports **`ready_for_mock_callback_preview`**. These are *echoes and notes* — read-only. None of them change an approval here in Core. A callback can validate, log, record output, and echo a decision a human already made — and that's all it can do."

**Key line (must say):**
> "**`completed_mock` is not approval.** It just means the mock pipeline finished. The only thing that approves content is a person clicking approve in Core."

**What NOT to claim:** that the callback approved anything, that a real connector ran, or that any real module executed.

---

## 9. Show failure / error route (11:30–13:00)

**Do:** Open a failure artifact — `failed_mock` final status (module failed) or an N9 error/retry/dead-letter object. Show it lands in the failure/log surface.

**Narrator:**
> "And when something goes wrong, it fails *safely*. A module failure comes back as **`failed_mock`** and an error record — it's logged and dead-lettered, and it **never touches the approval flow**. A `needs_revision` or `rejected`-style status from the backbone is treated the same way: a note for a human to review, not a state change. The unhappy path can't sneak content past the gate either."

---

## 10. Show final Human Approval Checklist (13:00–15:00)

**Do:** Approval Checklist tab → show the 10-point checklist; point at the three **locked** safety items (manual publishing only / no real ads / no customer messaging). Approve an item live to show the only legitimate path.

**Narrator:**
> "This is the gate, in full. A human reviews, and these three rules at the bottom are **locked** — they can't be unchecked: manual publishing only, no real ads launched, no customer messaging. Approval happens here, by a person, or it doesn't happen. That's the whole promise: AI speed, human accountability, and a system that physically can't go rogue because it has no live connection to do so."

**Close:**
> "Generated, approved, published — three states, one human gate between them and the outside world. That's The Core Agency."

---

## 11. What NOT to claim (hard rules for the narrator)

Do not say or imply any of the following — they are false for this build:
- ❌ **Do not claim real posting** — nothing is published to any channel.
- ❌ **Do not claim real ads** — no ad account is connected; no spend is possible.
- ❌ **Do not claim real connector execution** — connectors are registered and **disabled**; the PC2 backbone is a **mock** (stubs).
- ❌ **Do not claim real client data** — all data is fictional/simulated.
- ❌ **Do not claim the callback approved anything** — callbacks are non-authoritative metadata; `completed_mock`/`ready_for_mock_callback_preview` are statuses, not approvals.
- ❌ **Do not claim a live model generated the content** — demo generation is a built-in simulation.

If asked whether any of these are possible "later," answer honestly: they are roadmap items, each behind explicit Owner sign-off and a separate gated phase — not part of this demo.

---

## 12. Sign-off

| Role | Action | Status |
|---|---|---|
| PC1 (Claude Code) | Authored this demo script (docs-only) | ✅ DONE |
| Owner | Rehearse once against the live demo; confirm the §11 "what not to claim" rules | ⬜ When scheduled |

Use the result-summary and sign-off templates in `v2_manual_e2e_checklist.md` §7 to record a rehearsal. **V2-D2 (Supabase staging) remains 🔴 NOT STARTED / Owner-gated.**
