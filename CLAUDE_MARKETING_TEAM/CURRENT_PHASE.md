# CURRENT PHASE — 🏁 CORE MVP CLOSED — 18/18 PHASES COMPLETE (2026-06-11) | Ver2: V2-D2 Supabase Staging Execution — Checkpoint A ✅ PASS (process/docs) / Checkpoint B 🔴 VERDICT = BLOCKED (no disposable staging env — 2026-06-15) / Checkpoint C ✅ DOCS/SPEC DONE (client-feedback policy — 2026-06-15) / Checkpoint D ✅ DONE — Owner decision recorded (A/B/C/D = YES; B metadata-only — 2026-06-15, NOT implemented) / Future implementation 🔴 NOT STARTED Owner-gated | Ver2: V2-D1.5 Manual E2E Checklist + Demo Script ✅ DONE (docs-only — 2026-06-12) | Ver2: V2-E2 Core ↔ PC2 Dry-run Integration Plan ✅ DONE (2026-06-12) — V2-E3 adapter skeleton 🔴 NOT STARTED, Owner-gated (checkpoint O1) | Ver2: V2-E1 Core ↔ PC2 Contract Mapping Spec ✅ DONE / PASS (2026-06-12) | Ver2: V2-D1 Supabase Staging Audit & Runbook ✅ DONE (2026-06-12) — V2-D2 staging execution 🔴 NOT STARTED, Owner-gated | Ver2: V2-C Client Demo Package ✅ DONE / PASS (Owner-rehearsed — 2026-06-12) | Ver2: V2-A Manual Browser E2E + Demo Script ✅ DONE / PASS (Owner-executed — 2026-06-12) | Ver2: V2-B UI Polish (Owner-directed) ✅ DONE (2026-06-11) | Ver2 roadmap ✅ DONE (2026-06-11) | Phase 18 ✅ CLOSED (Codex PASS — 2026-06-11) | Phase 17 ✅ CLOSED (Codex PASS — 2026-06-11) | Phase 16D ✅ CLOSED (Codex PASS — 2026-06-11) | Phase 16C-2 ✅ CLOSED (Codex PASS — 2026-06-11) | Phase 16C-1 ✅ CLOSED (Codex PASS — 2026-06-11) | Phase 16B-2 ✅ CLOSED (Codex PASS — 2026-06-10) | Phase 16B-1 ✅ CLOSED (Codex PASS — 2026-06-10) | Phase 16A ✅ CLOSED (Codex PASS — 2026-06-09)

## 📌 Thông tin chung
- **Core MVP:** 🏁 **CLOSED — 18/18 phases complete** (2026-06-11, closure commit `e3f1ed7`; see `CORE_MVP_CLOSURE_REPORT.md`). Phase 18 was the final Core MVP phase. **No further MVP phases exist or will be added.**
- **Workstream hiện tại:** **Post-MVP / Ver2 Planning** — roadmap ✅ DONE (2026-06-11). **Documentation/planning only** — no product code, no connectors, no secrets, no live automation. Deliverable: `CLAUDE_MARKETING_TEAM/PHASE_19_VER2_ROADMAP.md` (filename keeps its historical prefix; content is the **Ver2 roadmap**, NOT an MVP Phase 19) — Ver2 scope options + priority order + breakdown into work packages **V2-A … V2-F**, each with goal / deliverables / files / safety rules / checks / Codex review focus / Owner approval checkpoint. Build PASS (0 TS errors, 1575 modules), `npm run test` 45/45 PASS.
- **Mới hoàn tất:** **V2-A — Manual Browser E2E + Demo Script** ✅ **DONE / PASS** (2026-06-12) — **Owner đã thực thi manual browser pass, kết quả PASS, không có blocking UI issue.** Cả 4 điều kiện đóng đã đạt: (1) checklist §1 executed by Owner ✅; (2) kết quả ghi tại `08_logs/v2a_qa_report_20260612.md` ✅; (3) demo script §2 verified trong run-through của Owner ✅; (4) Owner approval ghi nhận (DONE / PASS) ✅. Trước đó: **V2-B (Owner-directed) — Premium Dark SaaS UI Polish** ✅ DONE (2026-06-11). *(Naming note: Owner gọi task UI polish là V2-B; trong roadmap, UI polish vốn là V2-E còn roadmap-V2-B là Supabase staging.)*
- **Mới hoàn tất:** **V2-C (Owner naming) — Client Demo Package** ✅ **DONE / PASS** (2026-06-12) — **Owner đã rehearse script 5 phút (§3) với UI flow thật, kết quả "ổn" / PASS, không có blocking demo issue; Owner approval ghi nhận cho controlled internal/demo use.** Cả 4 điều kiện đóng đã đạt: (1) rehearsal executed ✅; (2) kết quả ghi tại `08_logs/v2c_rehearsal_20260612.md` ✅; (3) Owner approve cho controlled use ✅; (4) approval logged ✅. *(Naming note: trong roadmap, client demo package vốn là V2-D còn roadmap-V2-C là PC2 n8n dry-run — theo naming của Owner, giống tiền lệ V2-B.)* **Standing rule không đổi:** client-facing use vẫn controlled — mọi demo tôn trọng 5 safety boundaries (no auto-posting / no real ads / no real messaging / no live connectors / approval before external use).
- **Mới nhất:** **V2-D2 — Checkpoint D — Owner Decision** ✅ **DONE** (2026-06-15): Record Owner decision và **đóng policy-decision stage** (Checkpoints C → D), documentation/log/decision-record only. **Owner decision:** **A = YES** (client approver feedback/request-revision, no state mutation) · **B = YES, metadata only** (approved-like feedback cần Core owner/internal confirmation trước mọi real approval state change — không auto-approve) · **C = YES** (viewer read-only) · **D = YES** (separate feedback table, future). **Decision status: ACCEPTED / OWNER-APPROVED FOR FUTURE IMPLEMENTATION** — phủ policy *direction*, KHÔNG authorize build bây giờ. **Invariants preserved:** client feedback KHÔNG mutate `approval_status`; approved-like = metadata only; rejected/needs_revision-like = metadata/feedback-record; viewer read-only; PC2 callbacks = metadata/log/echo (non-authoritative); KHÔNG feedback/callback-driven posting/ads/messaging/customer contact. Updated: `03_core/specs/v2_d2_checkpoint_c_decision_record.md` (+§7 Owner Decision, +§8 Status) + `v2_d2_client_feedback_policy.md` (wording §11 → approved A–D). **No implementation.** **Future implementation phase 🔴 NOT STARTED / Owner-gated** (theo sau Checkpoint B *VERIFIED* — hiện BLOCKED).
- **Trước đó:** **V2-D2 — Checkpoint C — Client-Feedback Policy** ✅ **DOCS/SPEC DONE** (2026-06-15): Author policy decision dưới dạng **documentation/specification only** (Owner-approved docs/spec scope). Checkpoint C trước đó = NOT STARTED → tạo mới (không duplicate). Hai deliverable: `03_core/specs/v2_d2_client_feedback_policy.md` (purpose/scope/5 roles/permission matrix/state-transition policy/separate-feedback-table data model/future RLS/future UI/audit/risks/open decisions) + `03_core/specs/v2_d2_checkpoint_c_decision_record.md` (PROPOSED/not implemented; rejected unsafe options; required Owner decision A/B/C/D, recommended A=yes / B=yes-metadata-only / C=yes / D=yes). **Invariant:** client feedback = input cho human review, KHÔNG bao giờ mutate `approval_status`; chỉ Owner/Internal action mới approve; PC2 callbacks non-authoritative. **No implementation** (no code/RLS/SQL/migrations/tests/secrets/connectors; no staging/production). **Checkpoint D 🔴 NOT STARTED / Owner-gated** (implementation = future phase, theo sau Checkpoint B *VERIFIED*).
- **Trước đó:** **V2-D2 — Supabase Staging Execution — Checkpoint B verdict** (2026-06-15): **Checkpoint A ✅ PASS** (process/docs — Codex-reviewed; honest preflight + blocked-execution report). **Checkpoint B 🔴 VERDICT = BLOCKED** — verification DB-level KHÔNG chạy được vì vẫn không có disposable staging env (env re-check 2026-06-15: vẫn MISSING, `.env.local` vẫn absent). Đã thêm vào report §10 verdict + §11 evidence closure table (16 verification areas) + §12 safety conclusion. **Checkpoint C 🔴 NOT STARTED / Owner-gated** — KHÔNG được proceed dựa trên verification đã hoàn tất (B chưa VERIFIED); client-role feedback policy KHÔNG implement (out of scope). Báo cáo: `08_logs/v2_d2_staging_report_20260615.md`.
- **Trước đó:** **V2-D1.5 — Manual E2E Checklist + Demo Script (docs-only prep)** ✅ DONE (2026-06-12) — hai runbook mới trong `CLAUDE_MARKETING_TEAM/07_runbooks/` chuẩn bị cho manual E2E verification. Đã cập nhật wording trạng thái PC2 từ "paused at N11" → "N12 post-merge cleanup" ở các chỗ chỉ là status label (không đổi contract).
- **Trước đó:** **V2-E2 (Owner naming) — Core ↔ PC2 Dry-run Integration Plan** ✅ DONE (2026-06-12) — planning/contract/test-design only, xem section bên dưới. **Scope ladder được Owner refine: V2-E2 = PLAN; implementation tách thành V2-E3 (adapter skeleton, disabled by default) → V2-E4 (local-only callback ingest test) → V2-E5 (PC2 dry-run E2E, mock endpoint only) → V2-E6 (closure/evidence pack) — mỗi phase Owner-gated qua checkpoints O1–O5.** V2-E3 🔴 NOT STARTED — checkpoint O1 (env var/visibility flag) bắt buộc trước khi bắt đầu.
- **Trước đó:** **V2-E1 (Owner naming) — Core ↔ PC2 Contract Mapping Spec** ✅ DONE / PASS (2026-06-12, commit `4407cf7`) — documentation/contract mapping only. *(Naming note: trong roadmap, PC2 n8n dry-run vốn là roadmap-V2-C còn "V2-E" là UI polish — theo naming của Owner: V2-E1 = mapping spec, V2-E2 = dry-run plan, V2-E3+ = implementation.)*
- **Trước đó:** **V2-D1 (Owner naming) — Supabase Staging Audit & Runbook** ✅ DONE (2026-06-12) — audit/docs only. **V2-D2 (staging execution) 🔴 NOT STARTED — cần Owner approval (checkpoint A) TRƯỚC khi tạo staging project hoặc chạy bất kỳ SQL nào.** *(Naming note: trong roadmap, Supabase staging hardening vốn là roadmap-V2-B — theo naming của Owner: V2-D1 = audit/runbook, V2-D2 = execution.)*
- **Tiếp theo:** Owner đọc V2-E2 plan (đặc biệt §8 phase ladder + §9 checkpoints) → nếu duyệt, log checkpoint O1 → V2-E3 build adapter skeleton (builder thuần + dev-only panel sau kill-switch, KHÔNG HTTP). Song song: Owner xem V2-D runbook → checkpoint A → V2-D2. Các package khác còn mở: UI polish/code-splitting (roadmap-V2-E), V2-F connector plan (Owner-gated).

---

## 🟡 V2-D2 — Supabase Staging Execution (Checkpoint A ✅ PASS / Checkpoint B 🔴 VERDICT BLOCKED — 2026-06-15)

> **Checkpoint A:** ✅ PASS (process/docs — Codex-reviewed). **Checkpoint B verdict:** 🔴 BLOCKED — DB-level verification could not run (no disposable staging env). **Checkpoint C:** 🔴 NOT STARTED / Owner-gated.

### Checkpoint B verdict (2026-06-15):
- **Overall: 🔴 BLOCKED** — không VERIFIED/PARTIAL/FAILED: zero DB-level verification criteria chạy (preflight chỉ là preparatory). Không có defect nào được quan sát vì không có gì chạy.
- **Ran:** preflight (build 0 TS errors, tests 45/45, secrets clean, env-presence MISSING) + documentation (migration plan M1–M10, cross-tenant matrix 9×7, rollback, stop conditions, approval/callback safety restatement).
- **Did not run:** toàn bộ §6 (schema/RLS/hierarchy/helpers/role-separation/UUID-gating) + §7 (cross-tenant matrix + 18 rls_policy_plan §14 tests) + §8 DB-level approval/callback RLS. **0 executed.**
- **Evidence:** preflight outputs + report audit trail; KHÔNG có screenshot/SQL log vì không có DB session.
- **Remains unverified:** tất cả §6/§7 (chính là mục đích của V2-D2) — live DB behavior chưa được confirm.
- **Report additions:** §10 Checkpoint B verdict, §11 evidence closure table (16 areas: preflight/secrets PASS; migration/schema/RLS/hierarchy/role-sep/asset-collection/Group-F all BLOCKED at DB; code/contract-level approval-safety invariants noted PASS but explicitly NOT a substitute), §12 safety conclusion.

### Can Owner proceed to Checkpoint C?
- 🔴 **No — not on a completed-verification basis.** Checkpoint C (client-role feedback RLS policy decision) theo sau một Checkpoint B *VERIFIED*; B đang BLOCKED. Owner có thể bàn policy về mặt khái niệm nhưng KHÔNG implement bây giờ (out of scope, task cấm). C vẫn NOT STARTED / Owner-gated.

### Next action:
- Owner/operator provision disposable staging (project `core-agency-staging-disposable` + 4 users + `.env.local` anon URL/key — report §9) → hand back → PC1 drive M1–M10 + execute §6–§7, thay mọi ⬜ bằng PASS/FAIL + evidence, re-issue Checkpoint B verdict.

### Safety record (Checkpoint B):
- Production Supabase **NOT used**; production data **NOT used**; secret values **NOT printed/committed**; connectors **NOT activated**; real posting/ads/messaging/customer contact **NONE**; callback-driven approval mutation **NONE** (no code changed); approval state **remains Core UI-authoritative**. Runtime/product/repository/Supabase/auth/RLS/tests: **UNCHANGED** — diff là docs only.
- Build: PASS — 0 TS errors. Tests: 45/45 PASS.

### Files changed (Checkpoint B):
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/08_logs/v2_d2_staging_report_20260615.md` | Added §10 Checkpoint B verdict + §11 evidence closure table + §12 safety conclusion; updated status header + §9 Checkpoint A → PASS |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | Checkpoint B verdict log |

### Checkpoint C — Client-Feedback Policy (✅ DOCS/SPEC DONE — 2026-06-15):
- **Kết quả:** Checkpoint C được author **docs/spec only** (Owner-approved scope). Trước đó NOT STARTED → tạo mới, không duplicate. **Status: ✅ DONE as specification — Owner đã approve policy direction tại Checkpoint D (xem dưới); NOT implemented.**
- **Policy cốt lõi:** Client feedback = **input cho human review**, KHÔNG phải approval / publish trigger / state transition. `approval_status` (`draft|submitted|approved|rejected|revision_requested|cancelled`) chỉ đổi bởi authenticated **Owner/Internal** action trong Core Approvals UI. **PC2/module callback non-authoritative** — status callback KHÔNG mutate approval decisions. Client/viewer KHÔNG mutate Core approval state.
- **Khuyến nghị (Owner decision):** A=yes (client approver chỉ feedback/request-revision), B=yes nhưng **metadata only** (approved-like signal cần Owner/Internal confirm, không auto-approve), C=yes (viewer read-only default), D=yes (separate `client_feedback` table với immutable audit + tenant-scoped insert-only RLS — future phase).
- **Rejected unsafe options:** client mutates `approval_status`; PC2 callback approves/rejects; viewer writes feedback không có explicit grant; feedback triggers publish/ads/send.
- **No implementation:** không code/RLS/SQL/migrations/tests/secrets/connectors; không kết nối production/staging. Diff = docs/specs/logs only.
- **Files (Checkpoint C):**
  | File | Change |
  |---|---|
  | `CLAUDE_MARKETING_TEAM/03_core/specs/v2_d2_client_feedback_policy.md` | NEW — full client-feedback policy/spec |
  | `CLAUDE_MARKETING_TEAM/03_core/specs/v2_d2_checkpoint_c_decision_record.md` | NEW — decision record (PROPOSED, A/B/C/D answers) |
  | `CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | Checkpoint C log |

### Checkpoint D — Owner Decision (✅ DONE — 2026-06-15):
- **Kết quả:** Owner decision được record, **policy-decision stage CLOSED**. Documentation/log/decision-record only. **Decision status: ✅ ACCEPTED / OWNER-APPROVED FOR FUTURE IMPLEMENTATION / NOT IMPLEMENTED.**
- **Owner answers:** A = YES · B = YES (metadata only, cần Core owner/internal confirmation) · C = YES (viewer read-only) · D = YES (separate feedback table, future).
- **Preserved invariants:** client feedback KHÔNG mutate `approval_status` directly; approved-like = metadata only; rejected/needs_revision-like = metadata/feedback-record only; viewer read-only; PC2 callbacks = metadata/log/echo only; KHÔNG feedback/callback-driven posting/ads/messaging/customer contact.
- **Files (Checkpoint D):**
  | File | Change |
  |---|---|
  | `CLAUDE_MARKETING_TEAM/03_core/specs/v2_d2_checkpoint_c_decision_record.md` | +§7 Checkpoint D Owner Decision, +§8 Status; status header → ACCEPTED/NOT IMPLEMENTED |
  | `CLAUDE_MARKETING_TEAM/03_core/specs/v2_d2_client_feedback_policy.md` | Wording: status header + §11 → Owner-approved A–D (E/F open) |
  | `CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | Checkpoint D log |
- **Future implementation phase:** 🔴 **NOT STARTED / Owner-gated** — building (table/RLS/UI) là future phase, theo sau một Checkpoint B *VERIFIED* (hiện BLOCKED). Owner approval phủ policy direction, KHÔNG authorize build bây giờ.

---

## 🟡 V2-D2 — Supabase Staging Execution (CHECKPOINT A STARTED — 🔴 EXECUTION BLOCKED — 2026-06-15)

> **Owner approval:** ✅ Checkpoint A APPROVED (2026-06-15). **Execution status:** 🔴 BLOCKED — prerequisites missing.

### What happened:
- **Preflight PASS:** branch `main` = origin/main, tree clean, commit `2f1b700`; `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS; secrets scan clean (only `.env.example` tracked; `service_role` chỉ trong comments/safety notes).
- **BLOCKER (preflight PF8):** không có disposable Supabase staging project, không có env vars. Presence check (giá trị KHÔNG bao giờ in ra): `VITE_SUPABASE_URL`=MISSING, `VITE_SUPABASE_ANON_KEY`=MISSING, `SUPABASE_SERVICE_ROLE_KEY`=MISSING, `DATABASE_URL`=MISSING; `.env.local` absent, `.env` absent. Agent KHÔNG thể tạo Supabase project (cần dashboard + account của Owner/operator).
- **Đúng hard-boundary:** "If required Supabase staging env vars are missing, STOP and document the exact missing variables. Do not fake verification." → **STOP trước MỌI thao tác DB.** Không SQL, không kết nối, không fabricated results.

### What was produced (docs only):
- **`08_logs/v2_d2_staging_report_20260615.md`** — staging report: preflight results, staging target = NOT PROVISIONED (env redacted), exact missing env vars + provisioning prerequisites, migration files + order M1–M10 (READY, NOT EXECUTED), rollback/recovery, stop conditions, migration/RLS verification checklist (NOT EXECUTED), cross-tenant test matrix 9 entities × 7 assertions (DEFINED, NOT EXECUTED), approval/callback safety (DB-level NOT EXECUTED; code/contract-level invariants restated, unchanged), verdict + unblock steps.

### Verification status (honest):
- Migration/RLS verification: ⬜ **NOT EXECUTED** (blocked).
- Cross-tenant matrix: ⬜ **NOT EXECUTED** (0 of N).
- Approval/callback DB-level RLS: ⬜ **NOT EXECUTED**. Code/contract-level approval-safety invariants unchanged (PC2 callbacks non-authoritative; generated/pending stay until authenticated Core UI action; `completed_mock` ≠ approval) — covered by existing 45 tests + V2-E, NOT a substitute for the blocked DB-level checks.
- **Checkpoint B: 🔴 NOT READY** — no fake pass.

### Safety record:
- Production Supabase: **NOT TOUCHED**. Production data: **NOT USED**. Secrets: **NONE committed/printed**. Live connectors / real ads/posting/messaging: **NONE**. Approval semantics: **UNCHANGED**. PC2 callback → Core approval mutation: **NONE** (no code changed). Runtime/product/repository/Supabase/auth/RLS/tests: **UNCHANGED** — diff là docs only (1 report mới + 4 docs/logs).
- Build: PASS — 0 TS errors. Tests: 45/45 PASS.

### To unblock (Owner/operator — see report §9 + runbook §4.1):
1. Tạo disposable Supabase project `core-agency-staging-disposable` (KHÔNG phải production).
2. Tạo 4 staging auth users (owner/manager/client/viewer; fictional; throwaway passwords).
3. Đặt anon URL + key vào `.env.local` (gitignored): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. KHÔNG commit; KHÔNG đặt service-role key ở frontend/Vercel/repo.
4. Hand back để PC1 drive M1–M10 + §3–§8 verification trên disposable project.

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/08_logs/v2_d2_staging_report_20260615.md` | NEW — staging verification report (Checkpoint A started / execution blocked, no fake pass) |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | V2-D2 Checkpoint A start + blocker log |

---

## 🏁 V2-D1.5 — Manual E2E Checklist + Demo Script (docs-only prep) (DONE — 2026-06-12)

> **Status:** Documentation/checklist/demo-script prep cho manual E2E verification. **KHÔNG tạo Supabase staging project, KHÔNG chạy SQL, KHÔNG kết nối DB, KHÔNG secrets, KHÔNG live connector, KHÔNG đổi runtime/product/repository/Supabase/auth/RLS/tests.** **V2-D2 (staging execution) vẫn 🔴 NOT STARTED / Owner-gated (checkpoint A).**

### Scope completed (documentation/log only — zero product/code/runtime change):
- **New folder `CLAUDE_MARKETING_TEAM/07_runbooks/`** (chưa tồn tại folder runbook chuyên biệt; `07_docs/` đã có nhưng là client/strategy docs).
- **`07_runbooks/v2_manual_e2e_checklist.md`** — §1 purpose/scope (focus: tenant scope + approval-state safety + PC2 callback-as-metadata, companion với V2-A QA + V2-D1 runbook); §2 preflight PF1–PF8 (branch/main/origin, build, test, no-secrets grep, no live connectors, "Local Data Only" badge, **PF8 hard gate: KHÔNG SQL trừ khi checkpoint A đã log**); §3 manual scenario S1–S10 (client → brand → campaign → brief → generation/items → asset/collection → approval pending/generated → callback metadata-only → UUID gating) với scope/safety assertion mỗi bước + §3.10 localStorage-vs-Supabase UUID gating reference; §4 PC2 callback preview C1–C5 (`ready_for_mock_callback_preview` = N8 echo của decision đã có trong Core; `completed_mock` = N11/N12 final mock, **KHÔNG phải approval**; `failed_mock`/N9 error = log/dead-letter, không vào approval; `needs_revision`/`rejected` = metadata cho human review; C5 umbrella: KHÔNG callback nào mutate Core approval); §5 evidence capture table (step/actor/expected/evidence/pass-fail/notes); §6 stop conditions (SQL trước checkpoint A, secret exposure, connector activation, approval mutated by callback, tenant/scope mismatch, build/test fail); §7 evidence guide — screenshot/log naming conventions + result-summary/owner-sign-off/unresolved-issue templates.
- **`07_runbooks/v2_demo_script.md`** — 10–15 phút owner demo, persona Vị Cuốn (fictional F&B), 10 beats có narrator lines (open Core → select/create client → brand → campaign → brief → mock generation → approval stays pending/generated → PC2 callback as metadata-only → failure/error route → final Human Approval Checklist), §11 "what NOT to claim" (no real posting/ads/connector execution/client data/callback-approved-anything/live model), §12 sign-off.
- **PC2 status wording:** "paused at N11" → "N12 post-merge cleanup (integration-ready handoff, `stabilized_mock_ready`)" tại 6 chỗ status-label (CURRENT_PHASE, RUNBOOK ×2, SESSION_SUMMARY, phase_log, agent_activity_log). **KHÔNG đổi PC2 callback contract** — chỉ status label; contract references tới `n11_e2e_dry_run` workflow giữ nguyên.

### Safety record:
- Supabase staging project / SQL / DB connection / secrets / live connectors / real ads/posting/messaging/automation: **KHÔNG**.
- Product code / UI / runtime / repository / Supabase / auth / UUID gating / tenant scope / sanitizers / RLS / connectors / tests: **UNCHANGED** — diff là docs only (2 file mới + 5 docs/logs cập nhật wording/log).
- Approval safety preserved trong cả 2 doc: PC2 callbacks non-authoritative; generated stays generated / pending stays pending unless authenticated Core UI action; `completed_mock` ≠ approval shortcut.
- Build: PASS — 0 TS errors. Tests: 45/45 PASS.

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/07_runbooks/v2_manual_e2e_checklist.md` | NEW — manual E2E checklist + PC2 callback preview checklist + evidence guide |
| `CLAUDE_MARKETING_TEAM/07_runbooks/v2_demo_script.md` | NEW — 10–15 min owner demo script + "what not to claim" |
| `CLAUDE_MARKETING_TEAM/V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md` | PC2 status label N11→N12 (×2), no contract change |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | V2-D1.5 log + PC2 status wording |

### Next:
- Owner/tester chạy `07_runbooks/v2_manual_e2e_checklist.md` §2–§4 trong Local mode, file evidence (§5) + result summary (§7.3). Owner rehearse `v2_demo_script.md` nếu cần. **V2-D2 chỉ bắt đầu sau khi Owner log checkpoint A** (vẫn NOT STARTED).

---

## 🏁 V2-E2 (Owner naming) — Core ↔ PC2 Dry-run Integration Plan (DONE — 2026-06-12)

> **Scope note:** V2-E1 từng mô tả "V2-E2" là dry-run *implementation*. Owner đã refine ladder: **V2-E2 = integration PLAN (doc này); implementation tách thành V2-E3 → V2-E6, mỗi phase Owner-gated.** Plan này supersede bảng boundary 2 hàng của V2-E1 §7.

> **Status:** V2-E2 deliverable (integration plan) ✅ DONE. **V2-E3 (adapter skeleton) 🔴 NOT STARTED — checkpoint O1 (Owner duyệt env var/visibility flag) bắt buộc TRƯỚC khi bắt đầu.** Không có runtime integration, outbound HTTP, secrets, hay live connector nào được thêm trong V2-E2.

> **Codex REQUIRED FIX applied (2026-06-12):** T2/T3 trong test plan từng cho phép imported PC2 callback chuyển items/approvals sang `revision_requested`/`rejected` — mâu thuẫn với chính §4 rule 1 và V2-E1 (Core UI là approval authority duy nhất). Đã sửa (docs-only): **imported PC2 callbacks là non-authoritative trong MỌI trường hợp** — chỉ được (a) validate payload consistency, (b) log callback status, (c) record module output/error metadata, (d) echo decision ĐÃ tồn tại trong Core (E6; mismatch ⇒ warning, không apply), (e) attach non-authoritative review notes. T2/T3 giờ là "non-authoritative echo" scenarios: items land `generated`, approval stays `pending`, PC2 `needs_revision`/`rejected` + notes = callback metadata flagged cho human review; mọi transition `revision_requested`/`rejected`/`approved` CHỈ từ authenticated Core UI action (manual step riêng, ngoài ingest). §4 mở rộng thành 8 rules + reading note cho bảng status V2-E1 §4 (các hàng needs_revision/rejected/approved mô tả state SAU Core-UI decision — không reachable bằng import callback). **"Imported PC2 callbacks cannot bypass or mutate Core approval decisions"** — stated explicitly trong plan.

### Scope completed (planning/contract/test-design only — zero product/code/runtime change):
- **New doc `CLAUDE_MARKETING_TEAM/V2E2_CORE_PC2_DRY_RUN_INTEGRATION_PLAN.md`** (10 sections): §0 inputs + **load-bearing constraint: Core là static frontend, KHÔNG có HTTP listener → callback trong toàn bộ V2-E ladder là preview JSON artifact từ PC2 N11, ingest qua local dev-only manual import — KHÔNG bao giờ là live webhook**; §1 dry-run architecture 9 thành phần (UI trigger → adapter disabled-by-default → n11 router → module stubs :8188/:8191–:8194 → unified callback preview → local ingest với §2.5 precondition pipeline → existing Approvals gate → AutomationLog audit trail → failure/dead-letter log-only); §2 Core adapter requirements A1–A9 (pure `buildPc2Event` builder, `dry_run`/safety flags hard-coded constants — builder throws nếu khác, idempotency ledger, correlation IDs, scope hierarchy validation, **UUID gating reuse `repoRouting.ts` qua import — không sửa**, blocked events bị reject ở type level, kill-switch `VITE_PC2_DRYRUN_TOOLS` default-off mọi nơi); §3 PC2-side expectations (5 event types, n11 workflow, registry routes, example payloads, validator command, status rules, failed_mock fail-safe, **partial_failure = Core-side classification** — PC2 cần thêm examples, tracked cùng 3 gaps V2-E1 §8); §4 callback safety (no bypass approval — callback claiming `approved` vẫn land `generated`+`pending` với warning; failed_mock never enters approval; partial = logs + partial output; approved = human-in-Core only; published = blocked/planning); §5 test plan **T1–T10** (success, needs_revision, rejected, failed_mock, partial_failure, duplicate/idempotency, local-ID/col-* safety cả 2 chiều, missing tenant scope, + T9 approval-bypass attempt, T10 unknown request_id/bad source — T9/T10 mandatory cho V2-E4, T1–T8 cho V2-E5); §8 phase ladder **V2-E3 → V2-E4 → V2-E5 → V2-E6** với hard limits + closure evidence từng phase, real connectors NGOÀI V2-E (per-connector sign-off, V2-F); §9 **checkpoints O1–O5** (env var / outbound HTTP / n8n-from-Core / Supabase staging (cũng cần V2-D checkpoint A) / real connector — O5 không phase V2-E nào được request); §10 non-goals (no webhook receiver/serverless/`WEBHOOK_SHARED_SECRET`, no Group F wiring, no PC2 workflow edits, no automation without human click).

### Safety record:
- Runtime n8n calls / outbound HTTP / secrets / env vars / live connector endpoints / real ads/posting/messaging/automation: **KHÔNG**.
- Supabase runtime / repository logic / auth flow / UUID gating / tenant scope / sanitizers / RLS / product code / UI / tests: **UNCHANGED** — diff là docs only (1 file mới + 4 docs/logs). PC2 workflow files: chỉ đọc làm reference.
- Build: PASS — 0 TS errors. Tests: 45/45 PASS.

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/V2E2_CORE_PC2_DRY_RUN_INTEGRATION_PLAN.md` | NEW — dry-run integration plan (architecture, adapter reqs, PC2 expectations, callback safety, test plan T1–T10, phase ladder, checkpoints O1–O5) |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | V2-E2 documentation |

### Next (V2-E3 — Owner-gated):
1. Owner đọc plan, đặc biệt §2 (A1–A9), §8 (ladder), §9 (checkpoints).
2. Nếu duyệt: log **checkpoint O1** (tên/cơ chế visibility flag) → V2-E3 build `buildPc2Event` builder + unit tests + dev-only panel (payload preview/download only, **zero HTTP code paths, disabled by default**).
3. V2-E3 DONE chỉ khi builder tests green + flag-off evidence + Owner approval logged.
4. O2/O3 (outbound HTTP / chạy n8n từ Core) chỉ xét ở V2-E5; O4 Supabase staging optional; O5 real connector NGOÀI V2-E.

---

## 🏁 V2-E1 (Owner naming) — Core ↔ PC2 Contract Mapping Spec (DONE — 2026-06-12)

> **Naming note:** Owner gọi package này là **V2-E** (V2-E1 = mapping spec, V2-E2 = dry-run implementation). Trong `PHASE_19_VER2_ROADMAP.md`, PC2 n8n dry-run vốn là **roadmap-V2-C** còn "V2-E" là UI polish. Section này theo naming của Owner — giống tiền lệ V2-B/V2-C/V2-D.

> **Status:** V2-E1 deliverable (mapping spec) ✅ DONE. **V2-E2 (dry-run implementation) 🔴 NOT STARTED — spec §7: KHÔNG implement runtime integration, KHÔNG gọi n8n, cho tới khi Owner approval được log.** Không có runtime/product behavior change, secrets, hay live connector nào trong V2-E1.

### Scope completed (documentation/contract mapping only — zero product/code/runtime change):
- **New doc `CLAUDE_MARKETING_TEAM/V2E_CORE_PC2_MAPPING_SPEC.md`** (9 sections): §0 canonical source docs (PC2 N12 contracts + Core repos) + contract-version vocabulary (N11 `e2e_dry_run_v0.1`/`unified_callback_v0.1` là canonical, legacy UPPERCASE chỉ cross-walk); §1 Core→PC2 event mapping — bảng E1–E9 (5 routable events → 5 module stubs qua `n11_e2e_dry_run`, E6 approval decision, **E7–E9 publish/ads-spend/messaging BLOCKED — không có route**), envelope chuẩn + extensions `core_scope` (client/brand/campaign/brief/generation/content_item/asset_collection — UUID hierarchy rules theo RLS 16C/16D), `mode.dry_run=true`, `approval_required=true`, safety flags `no_auto_post`/`no_real_ads`/`no_real_messaging`/`no_live_connectors` (hằng số `true` trong Ver2, cross-walk sang `allow_*=false` của PC2 legacy schema), `idempotency_key`, ID-format rule (`col-*`/local ids không bao giờ qua boundary); §2 PC2→Core callback — `unified_callback_v0.1` + `correlation` block (`request_id`/`run_id`/`workflow_id`/`module_id`/`idempotency_key`), module output minimums per stub, N9 error/retry/dead-letter objects verbatim, approval decision object (**chỉ Core UI tạo approval state — PC2 echo non-authoritative**), 7 callback acceptance preconditions; §4 unified status table (success/generated/pending_approval/needs_revision/rejected/approved/failed_mock/partial_failure + **published/planned_publish = BLOCKED/planning-only**) map sang `content_plan_jobs`/`content_plan_items`/`content_approval_requests` statuses + legacy UPPERCASE cross-walk; §5 PC2 outputs → wired Core entities (content_plan_jobs=generations, content_plan_items, content_assets/collections, approval_requests; Group F logs unwired → localStorage AutomationLog surface; reports localStorage-only); §6 validation requirements V1–V9 (tenant scope luôn có, UUID-only tới Supabase, local ids stay local, idempotency bắt buộc, **failed_mock không bao giờ route tới approval**, **không callback nào bypass approval**, publish/ads/messaging blocked, status phải khớp unified preview, safety flags constant); §7 integration boundary (V2-E1 mapping only → V2-E2 dry-run Owner-gated → real connector activation = dedicated phase + per-connector sign-off); §8 PC2 handoff checklist (workflow JSON, examples, expected outputs, validator `node contracts/tools/validate_contracts.js` — re-run 2026-06-12 ALL PASS kể cả N12 compliance, limitations, module registry, callback preview contract) + 3 gaps PC2 cần đóng trong V2-E2; §9 non-goals.
- **PC2 status confirmed:** `contracts/pc2_validation_manifest.json` — N1–N12 DONE/PASS, `stabilized_mock_ready`; N12 = integration-ready handoff only.

### Safety record:
- n8n calls / runtime integration / live connectors / secrets / real ads/posting/messaging/automation: **KHÔNG**.
- Supabase runtime / repository logic / auth flow / UUID gating / tenant scope / sanitizers / RLS / product code / UI / tests: **UNCHANGED** — diff là docs only (1 file mới + 4 docs/logs).
- Build: PASS — 0 TS errors. Tests: 45/45 PASS.

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/V2E_CORE_PC2_MAPPING_SPEC.md` | NEW — Core ↔ PC2 contract mapping spec (events, callbacks, statuses, entities, validation, boundary, handoff) |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | V2-E1 documentation |

### Next (V2-E2 — Owner-gated):
1. Owner đọc spec, đặc biệt §1.2 envelope, §4 status table, §6 validation rules, §7 boundary.
2. Nếu duyệt: V2-E2 implement **dry-run only** theo spec — local mock URLs, `mode.dry_run=true` enforced, env kill-switch, validator extensions (§8 gaps a–c), no secrets in repo.
3. V2-E2 DONE chỉ khi dry-run evidence được file + Owner approval logged (standing rule từ V2-A/V2-C/V2-D).
4. Real connector activation NGOÀI scope V2-E hoàn toàn (dedicated phase + per-connector Owner sign-off).

---

## 🏁 V2-D1 (Owner naming) — Supabase Staging Audit & Runbook (DONE — 2026-06-12)

> **Naming note:** Owner gọi package này là **V2-D** (V2-D1 = audit & runbook, V2-D2 = staging execution). Trong `PHASE_19_VER2_ROADMAP.md`, Supabase staging hardening vốn là **roadmap-V2-B**. Section này theo naming của Owner — giống tiền lệ V2-B/V2-C.

> **Status:** V2-D1 deliverable (audit + runbook) ✅ DONE. **Staging execution (V2-D2) 🔴 NOT STARTED** — runbook §10 checkpoint A: KHÔNG tạo staging project, KHÔNG apply SQL nào cho tới khi Owner approval được log. Không có live Supabase connection, secrets, hay runtime change nào trong V2-D1.

### Scope completed (audit/documentation/checklist only — zero product/code/runtime change):
- **Audit (runbook §1):** rà soát toàn bộ Supabase surface — `schema_v1.sql` (27 tables, **not idempotent**, RLS trên 11 tables, safety seeds auto_post/auto_ads=false + require_approval=true), `rls_policy_plan.md` (Step-0 enables cho 16 tables thiếu RLS, bootstrap policies, 4 SECURITY DEFINER helper functions, apply order §12, 18 cross-tenant tests §14 — **markdown chưa phải runnable .sql**), 4 extension migrations 16B-2/16C-1/16C-2/16D (additive, idempotent, RLS inline, Codex PASS), `supabaseClient.ts` gate, scoped repositories + UUID routing gates (45 tests), sanitizers, `.env.example` placeholders.
- **8 audit findings chính (§1.2):** (1) legacy-vs-wired table duality — repos dùng extension tables (`content_plan_*`/`content_approval_*`/`content_assets*`), legacy Phase-2 tables phải để trống; (2) **`user_roles` lockout trap** — RLS bật nhưng zero policies → mọi user rơi về `viewer` nếu chưa apply bootstrap; (3) `roles` RLS gap; (4) 16/27 base tables chưa có RLS tới khi apply plan; (5) client-role feedback bị owner/manager-gate dưới RLS (by design, chờ policy decision — checkpoint C); (6) module/callback tables (Group F) tồn tại nhưng KHÔNG có repo wiring — out of staging CRUD scope, PC2 at N12 post-merge cleanup (integration-ready handoff); (7) Calendar/Reports không Supabase-wired; (8) mixed local/UUID ids là hành vi đúng của routing gates, không phải bug.
- **New doc `CLAUDE_MARKETING_TEAM/V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md`** (11 sections): §1 readiness status + findings + verdict ("ready to plan, not yet ready to execute"); §2 staging vs local demo distinction (bảng so sánh + rule staging project tên `core-agency-staging-disposable`, production env không bao giờ đụng); §3 env vars + explicit no-secrets rule (service-role key không bao giờ frontend/Vercel/repo); §4 execution checklists cho V2-D2 — setup (4.1), **migration apply order M1–M10** (schema_v1 → Step-0 RLS → bootstrap → helper functions/policies → 4 extensions → idempotency re-run → role assignment), RLS verification (4.3, gồm 18 cross-tenant tests + expected-failure cho client feedback), tenant hierarchy verification (4.4), UUID gating verification (4.5); **§5 staging verification matrix** — 9 entity rows (clients, brands, campaigns, briefs, approval requests, generations/content items, asset collections, content assets, callback/module outputs) × tenant/scope fields × read/write roles × required parent hierarchy × RLS check × localStorage-vs-Supabase ID rules; §6 seed data plan (fictional only, 2 clients cho cross-tenant A/B, reset path); §7 rollback/recovery (env kill-switch → instant localStorage fallback, bad-migration handling, lockout recovery, key-exposure → rotate + dispose); §8 staging safety boundaries (6 non-negotiables); §9 known risks R1–R9; §10 Owner approval checkpoints A–D (A = gate cho mọi execution, D = production enablement NGOÀI scope V2-D); §11 V2-D1→V2-D2 handoff (V2-D2 DONE chỉ khi staging report được file + Owner approval logged — standing rule từ V2-A/V2-C).

### Safety record:
- Live Supabase connection: **KHÔNG** (audit đọc file trong repo, không kết nối DB nào). Secrets: **KHÔNG** thêm (env.example giữ placeholders). Production DB writes / live connectors / real ads/posting/messaging/automation: **KHÔNG**.
- Product code / UI / runtime / repository / Supabase behavior / auth / UUID gating / tenant scope / sanitizers / RLS / connectors / tests: **UNCHANGED** — diff là docs only (1 file mới + 4 docs/logs).
- Build: PASS — 0 TS errors. Tests: 45/45 PASS.

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md` | NEW — audit + staging hardening runbook (checklists, matrix, boundaries, risks, checkpoints) |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | V2-D1 documentation |

### Next (V2-D2 — Owner-gated):
1. Owner đọc runbook, đặc biệt §4 (checklists), §9 (risks), §10 (checkpoints).
2. Nếu duyệt: log **checkpoint A** → V2-D2 thực thi §4.1–§4.5 trên staging project disposable, file staging report (`08_logs/v2d2_staging_report_YYYYMMDD.md`).
3. Checkpoint B (verification verdict) + checkpoint C (client-feedback policy decision) → V2-D2 DONE.
4. Production enablement (checkpoint D) là quyết định riêng, NGOÀI scope V2-D.

---

## 🏁 V2-C (Owner naming) — Client Demo Package (DONE / PASS — 2026-06-12)

> **Naming note:** Owner gọi package này là **V2-C — Client Demo Package**. Trong `PHASE_19_VER2_ROADMAP.md`, client demo package được liệt kê là **V2-D** (roadmap-V2-C = PC2 n8n dry-run, CHƯA bắt đầu, Owner-gated). Section này theo naming của Owner — giống tiền lệ V2-B UI polish.

> **Closure record:** **Owner rehearsed the §3 5-minute script with the live UI flow** (2026-06-12) — result **"ổn" / PASS**, demo flow verified against the current UI, **no blocking demo issues reported**. All four closure conditions met: (1) rehearsal executed ✅; (2) results recorded in `08_logs/v2c_rehearsal_20260612.md` ✅; (3) **Owner approval recorded for controlled internal/demo use** ✅; (4) approval logged here + phase_log.md ✅. Build/tests remained green (0 TS errors, 45/45). *(History: delivered as PACKAGE READY / REHEARSAL & OWNER APPROVAL PENDING per Codex required fix; upgraded to DONE only after the Owner's executed rehearsal.)* **Standing rule:** client-facing use remains controlled — every demo respects the 5 safety boundaries (no auto-posting, no real ads, no real messaging, no live connectors, approval required before external use).

### Deliverables (documentation/demo-material only — zero product/code/UI/runtime change):
- **New doc `CLAUDE_MARKETING_TEAM/V2C_CLIENT_DEMO_PACKAGE.md`** — gói demo client/internal hoàn chỉnh, 14 sections:
  - **§1 Pre-demo checklist** (10 items P1–P10: Vercel load, Demo Sign In, badges, seed data, route dry-run, presentation hygiene, screenshot backup) + quy tắc "never debug live".
  - **§2 Recommended demo data/brand order:** Cơm Tấm Bản Khói (primary — brief đầy đủ, status ready_for_generation) → Forme (premium/non-F&B proof) → Vị Cuốn (process example, brief draft); rules: demo 1 brand sâu, match industry của prospect, KHÔNG nhập real brand data của prospect vào live demo.
  - **§3 5-minute demo script** (6 beats có timing + lời thoại, route: Login → Dashboard → Campaign Outputs → Approvals → Client View → Manual Export Pack).
  - **§4 10-minute demo script** (bảng 10 beats — mở rộng từ V2-A §2, thêm timing/screen/key line; tổng ~9:15).
  - **§5 Screen-by-screen presentation flow** (17 steps: screen / what to show / one-liner / "don't" cho mỗi bước).
  - **§6 Positioning talking points** (category, good-fast-affordable triangle, workflow-is-the-moat, human-in-command, safety-as-feature, VN-market fluent).
  - **§7 Sandbox/local-data explanation** (script quanh badge "Local Data Only" + trả lời "so is this fake?").
  - **§8 Safety boundaries table** — one-liner cho cả 5: no auto-posting / no real ads / no real messaging / no live connectors / approval required before external use.
  - **§9 FAQ** (10 câu hỏi client thường gặp, gồm "is the AI generation live?" trả lời trung thực: demo dùng simulation).
  - **§10 Risks/limitations disclose honestly** (9 items: mock generation, no publishing exists, metadata-only assets, illustrative analytics, browser-only demo data, client-role RLS pending, 920 kB bundle, desktop-first, MVP scope).
  - **§11 Post-demo follow-up checklist** (8 items F1–F8 trong 24h, gồm log objections + báo UI issue qua V2-A QA template).
  - **§12 Next-step offer** (standard close: 2-week 1-brand pilot + 3 fallback offers giảm dần commitment).
  - **§13 One-page sales summary:** Problem / Solution / What the system does / Why safer than blind automation / Who it's for / Current MVP status / Next roadmap.
  - **§14 Sign-off** (PC1 ✅ → Codex review accuracy → Owner rehearse + approve).

### Safety record:
- Product code / UI / runtime / repository / Supabase / auth / UUID gating / tenant scope / sanitizers / RLS / connectors / tests: **UNCHANGED** — diff là docs only (1 file mới + 4 docs/logs).
- Package dạy presenter nói đúng sự thật về sandbox + 5 safety boundaries; §10 buộc disclose limitations trung thực.
- Build: PASS — 0 TS errors. Tests: 45/45 PASS.

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/V2C_CLIENT_DEMO_PACKAGE.md` | NEW — client demo package (scripts, flow, checklists, positioning, FAQ, sales summary) |
| `CLAUDE_MARKETING_TEAM/08_logs/v2c_rehearsal_20260612.md` | NEW — Owner rehearsal record: 5-min script, "ổn" / PASS, no blockers, controlled-use approval |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | V2-C documentation |

### Closure (all 4 conditions met — 2026-06-12):
1. ✅ Owner rehearsed script §3 (5-min) với live UI flow — kết quả "ổn" / PASS.
2. ✅ Rehearsal results ghi tại `08_logs/v2c_rehearsal_20260612.md` (demo flow verified, no blocking issues).
3. ✅ Owner approved package cho **controlled internal/demo use**.
4. ✅ Approval logged (section này + phase_log.md) → **V2-C DONE / PASS.**
- Standing: mọi client-facing demo vẫn controlled, tôn trọng 5 safety boundaries; chạy lại §1 pre-demo checklist trước mỗi demo quan trọng.

---

## 🏁 V2-A — Manual Browser E2E + Demo Script (DONE / PASS — 2026-06-12)

> **Closure record:** The manual browser E2E pass was **executed by the Owner** (2026-06-12) with result **PASS — no blocking UI issues reported**. All four closure conditions met: (1) checklist §1 executed by Owner ✅; (2) results recorded in `08_logs/v2a_qa_report_20260612.md` ✅; (3) demo script §2 verified in the Owner's run-through ✅; (4) Owner approval recorded (DONE / PASS) ✅. Build/tests remained green throughout (0 TS errors, 45/45). *(History: delivered as CHECKLIST READY / E2E PENDING per Codex required fix; upgraded to DONE only after the Owner's executed pass.)*

### Deliverables (documentation only — zero product/code change):
- **New doc `CLAUDE_MARKETING_TEAM/V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md`** gồm 4 phần:
  - **§1 Manual Browser E2E checklist — 28 items (A1–A28)** phủ toàn bộ flows: app load/title/favicon/branding, login/auth (Demo Sign In), header/Owner View, Client View toggle (owner-only tabs ẩn + redirect về Dashboard), Dashboard, Clients, Brands, Campaigns, Brief Intake, Content Generation, Content Calendar (verify overflow fix `bb8cb9e`), Approvals, Reports, Export Pack, Connector Registry, Automation Logs (owner/manager only), Client Portal, Asset Library (immutable scope fields khi edit), Brand Workspace, New Campaign Brief, AI Team Board, Campaign Outputs, Approval Checklist (3 fixed safety items locked), Client Presentation Pack, Client Workspace View, Manual Export Pack, Presentation & Export, cross-cutting console/network sweep. Mỗi item: what to click / expected result / blocker definition / visual QA notes / safety notes.
  - **§2 Demo script 5–10 phút** (10 beats có timing + lời thoại): opening pitch → problem → solution → owner workspace → brand/campaign flow → AI team output → approval safety (locked checklist) → client presentation/export (Client View switch + copy pack live) → why no auto-posting/ads yet (Connector Registry: registered-but-disabled, gate-by-gate) → closing CTA (2-week pilot).
  - **§3 UI QA report template** (markdown copy-paste): blocker bugs / visual polish / wording / responsive-mobile / deferred improvements + verdict PASS / PASS WITH NOTES / FAIL.
  - **§4 Sign-off table** (tester → PC1 fixes → Codex review → Owner accept → unlocks V2-D + roadmap-V2-B).
- Checklist viết dựa trên UI thực tế trong `src/App.tsx` (24 tab ids, owner-only gating `new-campaign`/`team-board`/`manual-export`/`client-demo`/`automation-logs`, header badges, data-mode badge, LoginScreen demo credentials `owner@thecore.agency`/`demo1234`).

### Safety record:
- Product code / runtime behavior / repository logic / Supabase / auth / UUID gating / tenant scope / sanitizers / RLS / connectors / tests: **UNCHANGED** — diff là docs only (1 file mới + 4 docs/logs cập nhật).
- No live automation / real ads / real posting / real messaging / secrets — checklist và demo script đều nhấn mạnh các ranh giới này như expectation phải verify.
- Build: PASS — 0 TS errors (`tsc && vite build`). Tests: 45/45 PASS.

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md` | NEW — E2E checklist (28 items) + demo script + QA report template + sign-off |
| `CLAUDE_MARKETING_TEAM/08_logs/v2a_qa_report_20260612.md` | NEW — executed-pass QA report: Owner, verdict PASS, no blockers |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | V2-A documentation |

### Closure (all 4 conditions met — 2026-06-12):
1. ✅ Owner thực thi browser pass theo §1 — kết quả PASS, không blocker.
2. ✅ Kết quả ghi vào `08_logs/v2a_qa_report_20260612.md` (verdict PASS — demo-ready, no blockers).
3. ✅ Demo script §2 verified trong run-through của Owner.
4. ✅ Owner approval ghi nhận (Owner báo DONE / PASS) → **V2-A DONE** → mở khóa V2-D (client demo package) và roadmap-V2-B (Supabase staging — vẫn cần Owner approval riêng trước khi bắt đầu).

---

## 🏁 V2-B (Owner-directed) — Premium Dark SaaS UI Polish (DONE — 2026-06-11)

> **Naming note:** Owner labels this task **"V2-B — Premium Dark SaaS UI Polish"**. In `PHASE_19_VER2_ROADMAP.md` the UI-polish package was listed as V2-E (roadmap-V2-B = Supabase staging hardening, NOT started). This section follows the Owner's naming.

### Scope completed (presentation only — zero behavior change):
- **New theme token system** in `src/index.css` — The Core Agency premium dark SaaS palette: App Background `#070A0F`, Gradient Dark `#0B1120`, Surface `#0F172A` / Soft `#111827` / Elevated `#151F32`, Border `rgba(255,255,255,0.08)`, **Brand Orange `#F47A1F`** (hover `#E7680B`, soft `#FFF1E6`, glow `rgba(244,122,31,0.22)`), semantic Success `#22C55E` / Warning `#F59E0B` / Error `#EF4444` / Info `#38BDF8`. **Legacy CSS var names (`--accent-indigo`, `--bg-main`, `--border-color`…) kept as aliases pointing at the new tokens**, so all ~1,950 existing inline styles inherit the new theme without logic edits.
- **Color sweep** (19 src files): hardcoded indigo literals → orange (`#818cf8`→`#fb923c`, `#6366f1`→`#f47a1f`, `rgba(99,102,241,*)`→`rgba(244,122,31,*)`, `rgba(129,140,248,*)`→`rgba(251,146,60,*)`), including presentation color maps in `permissions.ts` (owner role color), `coreData.ts`, `reportGenerator.ts`, `automationLogs.ts`. Category/data-viz colors intentionally untouched (`#a78bfa` hashtags/Instagram/asset-status, info blues, emerald, amber, rose).
- **Typography:** Inter added to the Google Fonts link and set as primary font (`--font-title`/`--font-body`), Plus Jakarta Sans fallback retained.
- **Component polish (index.css):** primary button = orange gradient with hover-lift/active/disabled/focus-visible states; secondary/danger buttons refined; form `:focus` ring = orange glow; glass cards radius 18px + hover orange border glow; tabs active state orange; scrollbar hover + text selection orange; background = layered radial orange/navy glows (not flat black); new `.spinner` + `.skeleton` loading utilities; new `.badge-brand`.
- **Shell/Login polish:** header title gradient white→soft orange (`#fdba74`); auth loading screen now branded spinner + "Loading The Core Agency…"; LoginScreen — dark glass card (blur + shadow), top orange radial glow, solid orange gradient submit button, Inter font; `badge-indigo` class renamed `badge-brand` (10 uses).
- **Naming consistency verified:** visible UI says "The Core Agency"; no "FnB OS V1" / "CLAUDE_MARKETING_TEAM" strings in visible UI (localStorage keys + internal docs/filenames unchanged by design).

### Safety record:
- Product behavior / data flow / repository logic / Supabase / UUID gating / tenant scope / sanitizers / RLS / auth / tests: **UNCHANGED** — diff is CSS, color literals, class names, font link, and 5 small JSX presentation edits (header h1, loading screen, LoginScreen card/submit/background).
- Phase 16D/17/18 safeguards: **INTACT** (no edits to `repoRouting.ts`, repositories, sanitizers, migrations, or tests).
- Build: PASS — 0 TS errors (`tsc && vite build`, 1575 modules). Tests: 45/45 PASS.

### Files changed:
| File | Change |
|---|---|
| `src/index.css` | Rewritten token system + component polish (orange brand, glass, spinner/skeleton) |
| `index.html` | Inter added to Google Fonts link |
| `src/App.tsx` | Color sweep; header title gradient; branded loading screen; `badge-brand` |
| `src/components/auth/LoginScreen.tsx` | Glass card, orange glow background, solid orange submit, Inter |
| `src/components/core/*.tsx` (13 tabs) | Color sweep only (indigo→orange literals) |
| `src/lib/auth/permissions.ts`, `src/lib/core/coreData.ts`, `src/lib/core/reportGenerator.ts`, `src/lib/core/automationLogs.ts` | Presentation color maps: indigo→orange |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | V2-B UI polish documentation |

### Manual review pages (Owner visual QA):
- Login screen; Dashboard; sidebar active states (all tabs); Clients/Brands/Campaigns forms (focus ring); Content Generation cards; Approvals badges; Reports charts (category colors vs orange accent); Client View; Connector Registry; Automation Logs; Manual Export pack blocks; Client Demo script blocks.

### Remaining UI polish opportunities (future):
- Code-splitting the 920 kB bundle (<500 kB main chunk), ESLint + a11y pass (the roadmap's original UI work package), responsive/mobile pass for the 260px sidebar grid, replacing remaining per-component inline style duplication with shared classes, dark-theme empty-state illustrations, favicon to a branded SVG (currently ⚡ emoji).

---

## 🏁 Ver2 Planning (Post-MVP) — Roadmap DONE (2026-06-11)

> **Naming note:** earlier drafts referred to this work as "Phase 19". That naming is retired: the Core MVP was an 18-phase plan and is closed at 18/18. This is the **Ver2 / Post-MVP workstream**, broken into work packages V2-A…V2-F (formerly "19A–19F").

### Scope completed (docs only):
- `CLAUDE_MARKETING_TEAM/PHASE_19_VER2_ROADMAP.md` — the Ver2 planning package:
  - **Scope options table** (E2E pass, demo prep, Supabase staging hardening, PC2 n8n dry-run, UI polish, connector readiness plan) with risk levels and dependencies.
  - **Priority order:** V2-A first (zero risk, gates everything) → V2-B (staging) with V2-D (demo package) in parallel → V2-E as parallel filler → V2-C and V2-F last + Owner-gated. Risky items needing explicit Owner approval before starting: any SQL on a live DB (even staging), n8n dry-run against Core, any connector activation, any real client data.
  - **Work-package breakdown V2-A…V2-F**, each with goal, exact deliverables, files likely touched, safety rules, test/check requirements, Codex review focus, and Owner approval checkpoint:
    - **V2-A** — Manual browser E2E pass (Phase 17 checklist B–G) + demo script verification.
    - **V2-B** — Supabase staging hardening (migrations in order, RLS verification matrix per table×role×op, client-feedback policy decision doc).
    - **V2-C** — PC2 n8n/modules callback **dry-run** integration (design doc first; backend-held `WEBHOOK_SHARED_SECRET`; event-insert only; kill switch).
    - **V2-D** — Client demo package (demo-day runbook, rehearsal, Vercel deploy verification) — parallel-safe with V2-B.
    - **V2-E** — UI/brand polish (code-splitting <500 kB main chunk, ESLint + `npm run lint`, a11y pass) — zero behavior change.
    - **V2-F** — Real connector readiness plan (**plan only**: 5-gate activation framework, per-connector one-pagers, activation order n8n → Canva → read-only analytics → outbound-write last).
  - **Standing Ver2 safety rules:** no real ads/posting/messaging/live automation at any point; no secrets in repo; production Supabase stays OFF; 16D UUID gating / tenant scope / sanitizers / RLS are load-bearing and untouchable without dedicated review; FnB OS V1 untouched.

### Safety record:
- Product code: **UNCHANGED** (docs-only diff). Runtime behavior: **UNCHANGED**.
- Build: PASS — 0 TS errors (`tsc && vite build`, 1575 modules). Tests: 45/45 PASS.

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/PHASE_19_VER2_ROADMAP.md` | Ver2 roadmap (scope options, priorities, work packages V2-A…V2-F) |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | Ver2 planning documentation |

---

## 🏁 CORE MVP CLOSURE (2026-06-11)

- **Closure doc:** `CLAUDE_MARKETING_TEAM/CORE_MVP_CLOSURE_REPORT.md` — formal closure of the Core MVP build cycle (Phases 1–18). Documentation only: no product code, runtime behavior, or connector state changed.
- **Final reviewed commit before closure:** `fd86ead` (Phase 18).
- **Build:** PASS — 0 TS errors (`tsc && vite build`, 1575 modules). **Tests:** 45/45 PASS.
- **Safety at closure:** no secrets, no live connectors, no real ads/posting/messaging; Phase 16D UUID gating, Phase 17 tests, tenant scoping, sanitizers, and RLS migrations all intact; production Supabase env OFF; FnB OS V1 untouched.
- **Known limitations carried into Ver2:** manual browser E2E pass (Phase 17 checklist B–G) pending; client-role feedback RLS decision pending; Calendar/Reports/Connector Inbox/Automation Logs still localStorage-only; 920 kB single bundle; stale `08_logs/CURRENT_PHASE.md` (canonical tracker is this file).
- **Recommended next:** Post-MVP / Ver2 planning with Owner + AI Coordinator (Core MVP ends at 18/18 phases — no MVP Phase 19).

---

## 🏁 Phase 18 — Final MVP Polish + Production Readiness (CLOSED — 2026-06-11)

### Scope completed:
- **UI polish (label strings only — no logic changes):**
  - Header: stale "Real Operations MVP — Phase 14" badge → "Core MVP — Internal Demo"; new data-mode badge showing "Local Data Only" (amber) vs "Supabase Data" (emerald) with explanatory tooltip, driven by the existing `isSupabaseConfigured` flag.
  - Removed the confusing "FnB OS V1: NO" row from the sidebar Safety Guard panel and the "FnB OS V1 Touched: NO" card from the Dashboard sandbox safety grid (meaningless to demo viewers; FnB OS V1 itself untouched).
  - Replaced stale internal phase numbers in user-visible labels: ApprovalsTab subtitle ("Phase 8 —" dropped; "(Phase 9+)" → "(not enabled in this MVP)"), ContentCalendarTab subtitle ("Phase 7 —" dropped; tooltip "(Phase 8)" → "use the Approvals tab"), AssetLibraryTab ("metadata only in Phase 10" → "metadata only (no file storage yet)" / "for now"), AutomationLogsTab ("Phase 14 — Local / Mock" badge → "Local / Mock — No Live Automation"; footer "Phase 14 — Local Mode" → "Local Mode", "planned for Phase 15+" → "a later phase"), ConnectorRegistryTab ("Phase 13" badge removed; banner/governance lines de-phased), ReportsTab ("connected in Phase 11" → "connected in this MVP"), ExportPackTab ("Phase 12" badge removed), BriefIntakeTab ("Generation requires Phase 6" → "Generation runs in the Content Generation tab").
  - Code comments and clearly-labeled `[Mock]` sample log message bodies retain their phase references (internal/sample data, not UI labels).
- **Production safety re-verified:** secrets grep clean (only `.env.example` placeholders + 1 safety-note string); only `.env.example` tracked in git; zero direct network calls in `src/` (`fetch`/`axios`/`XMLHttpRequest`/`WebSocket` → 0 matches) — the Supabase SDK is the only network client and stays `null` without env vars; no real ads/posting/messaging/connectors anywhere.
- **New doc:** `CLAUDE_MARKETING_TEAM/07_docs/MVP_READINESS_CHECKLIST.md` — full readiness verdict, safety evidence table, safeguard-intact table, core-workflow checklist, Supabase/local fallback explanation, and remaining-risks list.

### Safety record:
- Phase 16D/17 safeguards: **INTACT** — `repoRouting.ts` gates, current+next `asset_collection_id` gating, scoped repositories, sanitizers, RLS migrations all untouched (diff is UI label strings + docs only)
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO** — secrets grep clean
- Demo Sign In: **PRESERVED**; localStorage fallback: **PRESERVED**
- No live Meta/Facebook/Canva/Google/n8n connectors, no auto-posting/messaging/ads
- FnB OS V1: **NOT TOUCHED**
- Build: PASS — 0 TS errors (`tsc && vite build`, 1575 modules)
- Tests: PASS — `npm run test` → 45/45 (2 files)

### Files changed:
| File | Change |
|---|---|
| `src/App.tsx` | Header badge "Core MVP — Internal Demo" + data-mode badge; removed 2 "FnB OS V1" safety-panel rows |
| `src/components/core/ApprovalsTab.tsx` | De-phased subtitle + "Approved ≠ Published" note |
| `src/components/core/ContentCalendarTab.tsx` | De-phased subtitle + status tooltip |
| `src/components/core/AssetLibraryTab.tsx` | De-phased metadata-only banners |
| `src/components/core/AutomationLogsTab.tsx` | De-phased badge, safety strip, local-mode footer |
| `src/components/core/ConnectorRegistryTab.tsx` | De-phased banner, badge, governance footer |
| `src/components/core/ReportsTab.tsx` | De-phased analytics disclaimer |
| `src/components/core/ExportPackTab.tsx` | Removed "Phase 12" badge |
| `src/components/core/BriefIntakeTab.tsx` | De-phased safety note |
| `CLAUDE_MARKETING_TEAM/07_docs/MVP_READINESS_CHECKLIST.md` | NEW — MVP readiness checklist + verdict |
| `CLAUDE_MARKETING_TEAM/CURRENT_PHASE.md` / `SESSION_SUMMARY.md` / `08_logs/phase_log.md` / `08_logs/agent_activity_log.md` | Phase 18 documentation |

### Readiness verdict:
- ✅ **Core MVP is READY for controlled internal testing / controlled client demo.**
- ❌ NOT ready for: live automation, real publishing/ads/messaging, real client data in Supabase (client-role feedback RLS decision pending), real file uploads.
- Remaining risks listed in `07_docs/MVP_READINESS_CHECKLIST.md` §7 (incl. pending manual browser E2E pass of the Phase 17 checklist sections B–G).

---

## 🏁 Phase 17 — End-to-end Workflow Test (CLOSED — 2026-06-11)

### Scope completed:
- Test runner: `vitest` (already a transitive dep, now an explicit
  devDependency) + `npm run test` / `npm run test:watch` scripts in
  `package.json`. No `vite.config.ts` test block needed — vitest 3.x runs
  pure-function tests against its default `node` environment with zero
  config.
- New `src/lib/core/repoRouting.ts`: the inline UUID-gating predicates from
  `App.tsx`'s `assetRepoFor()`/`approvalRepoFor()` (Phases 16C-2/16D + both
  Codex fix rounds) extracted **verbatim** as pure, exported functions —
  `assetScopeIsSupabaseSafe(ids: AssetRouteIds)`,
  `approvalScopeIsSupabaseSafe(ids: ApprovalRouteIds)`,
  `okOrAbsentUuid(v?: string | null)`. `App.tsx` now imports and calls these
  directly — behavior unchanged, routing logic now unit-testable in
  isolation.
- New `src/lib/core/repoRouting.test.ts` (34 tests): full valid-UUID chains
  → true; local-format `clientId`/`brandId` → false; every optional scope id
  (`campaignId`/`briefId`/`generationId`/`contentItemId`/
  `assetCollectionId`/`currentAssetCollectionId`) absent (undefined/null) →
  true, present-but-local-format → false; `assetId`/`approvalId`/
  `contentItemId` local-format → false; **Codex Fix Round 2 case** — local
  CURRENT `asset_collection_id` with NEXT collection id `null` or a valid
  UUID → still false (stays on localStorage).
- New `src/lib/core/coreRepository.test.ts` (11 tests): `sanitizeAssetPatch`
  strips all `ASSET_IMMUTABLE_PATCH_FIELDS` (snake_case + camelCase) while
  preserving editable fields including `asset_collection_id`;
  `sanitizeGenerationPatch`/`sanitizeBriefPatch` strip their respective
  immutable field sets while preserving `status`/`brief_title`; `isUuid`
  true/false cases; `generateId` produces a prefixed id that never passes
  `isUuid`.
- New `CLAUDE_MARKETING_TEAM/08_logs/phase_17_e2e_checklist.md`: manual MVP
  E2E workflow checklist (Client → Brand → Campaign → Brief → Generation →
  Approval → Asset Library, plus UUID-gating fallback verification in both
  Local/Demo and Supabase-configured modes) — companion to the unit tests
  above; UI sections deferred (no browser-automation tool available this
  session).

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO** — secrets grep clean
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Routing/sanitization behavior: **UNCHANGED** — pure refactor (extraction +
  tests only), `App.tsx` diff is import + call-site only
- Build: PASS — 0 TS errors (`tsc && vite build`, 1575 modules)
- Tests: PASS — `npm run test` → 45/45 (2 files)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `package.json` / `package-lock.json` | Added `vitest` devDependency + `test`/`test:watch` scripts |
| `src/lib/core/repoRouting.ts` | NEW — `assetScopeIsSupabaseSafe`/`approvalScopeIsSupabaseSafe`/`okOrAbsentUuid` extracted from `App.tsx` |
| `src/lib/core/repoRouting.test.ts` | NEW — 34 unit tests for the routing gates |
| `src/lib/core/coreRepository.test.ts` | NEW — 11 unit tests for patch sanitizers + `isUuid`/`generateId` |
| `src/App.tsx` | `assetRepoFor()`/`approvalRepoFor()` now call the extracted predicates instead of inlining them |
| `CLAUDE_MARKETING_TEAM/08_logs/phase_17_e2e_checklist.md` | NEW — manual MVP E2E workflow checklist |

### Known future consideration:
- Manual UI/E2E sections (B–G) of the Phase 17 checklist still need a
  browser-automation pass (e.g. Playwright) or an Owner manual run —
  deferred, no browser tool available this session.

---

## 🏁 Phase 16D — Asset Library CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

### Scope completed:
- Supabase CRUD repository wiring for **Asset Library** only (Calendar/Reports/Connector Inbox/Automation Logs untouched, deferred to later phases)
- New **additive** migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16d_asset_extension.sql` creates `content_assets`/`content_asset_collections` tables matching the Phase 10 `AssetItem`/`LocalAssetCollection` TS types. `AssetItem` extended with nullable `brief_id`/`generation_job_id` (additive — old localStorage data normalized via `loadAssetData()`). RLS enabled with hierarchy-validated policies. All `CREATE TABLE/TYPE/INDEX/TRIGGER/POLICY/FUNCTION IF NOT EXISTS` / `DROP ... IF EXISTS` before `CREATE OR REPLACE` — safe to re-run, **not applied to any live DB**.
- `AssetRepository` (list/get/create/update/archive) scoped by clientId+brandId (required) + optional campaignId/briefId/generationId/contentItemId/assetCollectionId(+assetId for get/update/archive)
- `AssetCollectionRepository` (list/create) scoped by clientId+brandId+optional campaignId
- `sanitizeAssetPatch()` strips all tenant/identity/audit fields from update patches
- Supabase implementation: `SupabaseAssetRepository` / `SupabaseAssetCollectionRepository`
- localStorage fallback: `LocalStorageAssetRepository` / `LocalStorageAssetCollectionRepository`
- `createPhase16aRepositories` factory extended — bundle now returns `assets`/`assetCollections` repos
- App.tsx wired: `assetRepoFor()` per-operation repo selection; `handleAssetCreate`/`handleAssetEdit`/`handleAssetArchive` route through it
- `AssetLibraryTab.tsx`: Client/Brand/Campaign fields disabled in edit mode (immutable after create); async create/edit/archive with error banner + "Saving…" state
- Removed now-dead `createAsset`/`updateAsset`/`createCollection` helpers from `coreData.ts`

### Tenant-scope contract (final):
- `AssetRepository.list({ clientId, brandId, campaignId?, briefId?, generationId?, contentItemId?, assetCollectionId? })` — `clientId`+`brandId` required, all other levels optional
- `AssetRepository.get/update/archive(params: AssetScopedParams)` — `AssetScopedParams` is a standalone, fully-required-but-nullable interface (`clientId`, `brandId`, `campaignId`, `briefId`, `generationId`, `contentItemId`, `assetCollectionId`, `assetId`) — callers must state the asset's FULL scope (explicit `null` for levels that don't apply)
- `AssetCollectionRepository.list/create({ clientId, brandId, campaignId? })`
- `assetRepoFor()` in App.tsx selects the repository **per operation**: requires `clientId`+`brandId` as valid UUIDs, treats null/undefined optional scope ids as "absent" (always safe via `okOrAbsent`), validates `assetId`/`currentAssetCollectionId`/`assetCollectionId` when used by that operation — falls back to `LocalStorageAssetRepository` otherwise so local-format ids (`asset-*`/`col-*`/`collection-*`/`asset-collection-*`) are never sent into a Supabase UUID column
- `SupabaseAssetRepository` (list/get/create/update) calls `assertUuid`/`assertUuidOrNull` on every id it writes/filters (defense-in-depth on top of `assetRepoFor()`'s routing gate); `get`/`update` always filter on all 5 optional-hierarchy columns via `.is()`/`.eq()`

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Calendar / Reports / Connector Inbox / Automation Logs: **UNCHANGED** (untouched, deferred to later phases)
- `asset_collection_id`/`assetCollectionId` UUID-gated everywhere it could reach Supabase, including both the asset's CURRENT collection and the patch's NEXT collection (`handleAssetEdit` gates both via `okOrAbsent`)
- RLS: `content_asset_hierarchy_is_valid()` is NULL-tolerant (each deeper level — campaign/brief/generation/content_item — requires its parent non-null and validates against real FK tables, reusing `content_plan_hierarchy_is_valid()` from 16C-1 for the brief level); extended to a 7th param `p_asset_collection_id` — when present, the referenced `content_asset_collections` row must share the asset's `client_id`+`brand_id`, and if the collection has a `campaign_id`, it must match the asset's `campaign_id`
- `content_asset_user_has_scope()`/`_user_can_write()` and brand-level `content_asset_collection_*` equivalents follow the same active/unexpired-assignment + owner/manager-write pattern as 16C-1/16C-2 — read-only/client/viewer roles cannot write/archive/delete
- Build: PASS — 0 TS errors (`tsc && vite build`, 1574 modules)
- Secrets grep: clean (only `.env.example` placeholders + doc mentions)

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16d_asset_extension.sql` | NEW — additive migration: `content_assets`/`content_asset_collections` tables, RLS hierarchy-validated policies |
| `src/types/core.ts` | `AssetItem` extended with nullable `brief_id`/`generation_job_id` |
| `src/lib/core/coreData.ts` | `loadAssetData()` normalizes old localStorage data; removed dead `createAsset`/`updateAsset`/`createCollection` |
| `src/lib/core/coreRepository.ts` | `AssetRepository`/`AssetCollectionRepository` + `AssetListParams`/`AssetScopedParams`/`AssetCreateInput`/sanitizer types |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageAssetRepository`/`LocalStorageAssetCollectionRepository` (scoped) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseAssetRepository`/`SupabaseAssetCollectionRepository` (scoped, UUID-asserted) |
| `src/lib/core/repositoryFactory.ts` | Added `assets`/`assetCollections` to `Phase16aRepositories` bundle |
| `src/App.tsx` | `assetRepoFor()` per-operation repo selection; `handleAssetCreate`/`handleAssetEdit`/`handleAssetArchive` |
| `src/components/core/AssetLibraryTab.tsx` | Client/Brand/Campaign immutable in edit mode; async create/edit/archive with error banner + "Saving…" state |

### Known future consideration:
- Real file storage/upload is not enabled yet — this phase only wires safe asset metadata CRUD.

---

## ✅ Phase 16D Codex Fix Round 1 — UUID-gate asset_collection_id + Hardened Scoped Params + RLS Collection Check (Applied — 2026-06-11)

**Issue 1 (asset_collection_id not UUID-gated):** `asset_collection_id`/`assetCollectionId` could be a local id (`col-*`/`collection-*`/`asset-collection-*`) and still be sent to Supabase on create/update/get/archive.

**Fix 1:** `assetRepoFor()` in App.tsx now checks `assetCollectionId` (via `okOrAbsent`) for create/update/get/archive; `handleAssetEdit` computes `nextCollectionId` (patch's new collection if changing, else the asset's current one) and routes to `LocalStorageAssetRepository` if either the asset's current collection or the target collection is a local id.

**Issue 2 (AssetScopedParams allowed omitted hierarchy levels):** `AssetScopedParams` extended `AssetListParams`, so get/update/archive could omit hierarchy levels instead of stating the asset's full scope.

**Fix 2:** `AssetScopedParams` is now a standalone, fully-required-but-nullable interface (`clientId`, `brandId`, `campaignId`, `briefId`, `generationId`, `contentItemId`, `assetCollectionId`, `assetId`) — get/update/archive must state the FULL scope (explicit `null` for levels that don't apply). `AssetListParams` gained optional `assetCollectionId` so `AssetScopedParams` remains structurally assignable to it (reused by `assetMatchesScope()`). `SupabaseAssetRepository` (list/get/create/update) now calls `assertUuid`/`assertUuidOrNull` on every id it writes/filters; `get`/`update` always filter on all 5 optional-hierarchy columns via `.is()`/`.eq()` instead of conditionally.

**Issue 3 (RLS — asset_collection_id not validated against tenant):** `content_asset_hierarchy_is_valid()`/`_user_has_scope()`/`_user_can_write()` did not validate that a referenced `asset_collection_id` belonged to the same client/brand/campaign.

**Fix 3:** Extended all three to a 7th param `p_asset_collection_id` — when present, the referenced `content_asset_collections` row must share the asset's `client_id`+`brand_id`, and if the collection has a `campaign_id`, it must match the asset's `campaign_id`. INSERT/UPDATE policies pass `asset_collection_id` as the 7th arg. `DROP FUNCTION IF EXISTS` added for both old (6-arg) and new (7-arg) signatures for idempotent re-runs.

**Migration safety:** additive, idempotent. No anon/broad access, no secrets/service role key, production Supabase env remains OFF. Diff scoped to exactly: `coreRepository.ts`, `supabaseRepositories.ts`, `localStorageRepositories.ts`, `App.tsx`, `schema_v1_phase16d_asset_extension.sql`.

**Build:** PASS — 0 TS errors (`tsc && vite build`, 1574 modules). Secrets grep clean.

**Commit:** `a9c6644` (fix: harden asset collection uuid routing and scope)

---

## ✅ Phase 16D Codex Fix Round 2 — Gate Current asset_collection_id on Edit (Applied — 2026-06-11)

**Issue:** `handleAssetEdit()` in App.tsx gated only `nextCollectionId` (the patch's target collection), overwriting the check on the asset's EXISTING `asset_collection_id`. If the asset's CURRENT `asset_collection_id` was a local id (`col-*`/`collection-*`/`asset-collection-*`) and the patch changed it to `null` or a valid UUID, the op was incorrectly routed to Supabase (which has no row to match by that local id) and threw.

**Fix:** `assetRepoFor()` gained a `currentAssetCollectionId?: string | null` field, gated via the same `okOrAbsent` (null/undefined/UUID) check as the other ids; `handleAssetEdit()` now passes `currentAssetCollectionId: asset.asset_collection_id` alongside `assetCollectionId: nextCollectionId` — Supabase is selected only when BOTH the current and next collection ids are null/undefined or valid UUIDs. `handleAssetCreate` is unaffected (no `currentAssetCollectionId` passed → `okOrAbsent(undefined)` is always true).

**Diff:** `src/App.tsx` only, 12 insertions / 3 deletions.

**Build:** PASS — 0 TS errors (`tsc && vite build`, 1574 modules).

**Codex result:** PASS.

**Commits:** `b598844` (feat: wire asset library crud with scoped fallback) → `a9c6644` (fix: harden asset collection uuid routing and scope) → `ec0178b` (fix: gate current asset collection id on edit)

---

## 🏁 Phase 16D — CLOSED (Codex PASS — 2026-06-11)

**Summary:**
- Asset Library CRUD wired to Supabase with localStorage fallback.
- Asset operations are scoped by clientId, brandId, campaignId, briefId, generationId/contentItemId/assetCollectionId where applicable.
- assetId and assetCollectionId are UUID-gated before Supabase routing.
- Local `col-*`/`collection-*`/`asset-collection-*` IDs route to localStorage.
- `handleAssetEdit` gates both current and next `assetCollectionId`.
- RLS validates `asset_collection_id` hierarchy.
- Read-only/client/viewer roles cannot write/archive/delete.
- Production Supabase env remains OFF.
- Demo Sign In remains.
- No secrets or service role key.
- **Known future consideration:** real file storage/upload is not enabled yet — this phase only wires safe asset metadata CRUD.

- **Codex result:** PASS — no further required fixes.
- **Commits:** `b598844` (feat: wire asset library crud with scoped fallback) → `a9c6644` (fix: harden asset collection uuid routing and scope) → `ec0178b` (fix: gate current asset collection id on edit)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** TBD.

---

## 🏁 Phase 16C-2 — Approval CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

### Scope completed:
- Supabase CRUD repository wiring for **Approval** only (Calendar/Reports/Asset Library/Connector Inbox/Automation Logs untouched, deferred to later phases)
- New **additive** migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c2_approval_extension.sql` creates `content_approval_requests`, `content_approval_events`, `content_approval_comments` tables matching the Phase 8 `ContentApprovalRequest`/`ContentApprovalEvent`/`ContentApprovalComment` TS types: 3 enums (`content_approval_status`, `approval_priority`, `approval_action_type`); `content_approval_requests` carries the full `client_id`/`brand_id`/`campaign_id`/`brief_id`/`generation_job_id`/`content_item_id` scope; `content_approval_events`/`content_approval_comments` reference `approval_request_id` + `content_item_id`; 11 indexes; `updated_at` trigger via existing `set_updated_at()`; RLS enabled with full hierarchy-validated policies. All `CREATE TABLE/TYPE/INDEX/TRIGGER/POLICY/FUNCTION IF NOT EXISTS` / `DROP ... IF EXISTS` before `CREATE OR REPLACE` — safe to re-run, **not applied to any live DB**.
- `ApprovalRepository` interface added to `coreRepository.ts`: `list`, `get`, `create`, `executeAction`, `addComment` with scoped param types `ApprovalListParams` / `ApprovalScopedParams` (adds `approvalId`) / `ApprovalCreateInput`
- Supabase implementation: `SupabaseApprovalRepository`
- localStorage fallback: `LocalStorageApprovalRepository` (operates on `ApprovalDataStore` / `loadApprovalData()` / `saveApprovalData()`, key `core_agency_approval_data_v1`)
- `createPhase16aRepositories` factory extended — bundle now returns `approvals` repo
- App.tsx wired: `handleApprovalSubmit`, `handleApprovalAction`, `handleApprovalComment` route through `approvalRepoFor()`; wired into `ApprovalsTab` and `ClientViewTab` (`onComment`)

### Tenant-scope contract (final):
- `ApprovalRepository.list({ clientId, brandId, campaignId, briefId, generationId })` — all 5 IDs required
- `ApprovalRepository.get/executeAction/addComment({ ...same, approvalId })` — all 6 IDs required
- `ApprovalRepository.create(data: ApprovalCreateInput)` — requires `contentItem` + `clientId` + `brandId` + `campaignId` + `briefId` + `generationId` + `actorLabel`; Supabase impl never sends a local `approval-*`/`item-*`/`generation-*`/`job-*` id — DB generates the UUIDs, returned rows update React state
- `approvalRepoFor()` in App.tsx selects the repository **per operation**: routes to Supabase only if `isSupabaseConfigured` AND every UUID id *used by that operation* is valid —
  - list/create: `clientId`, `brandId`, `campaignId`, `briefId`, `generationId` (+ `contentItemId` for create)
  - get/executeAction/addComment/archive: also `approvalId`
  - any operation involving `contentItemId`: `contentItemId` also validated
  - if any required id is missing or not a valid UUID → routes to `LocalStorageApprovalRepository`, so local-format ids (`approval-*`/`content-item-*`/`generation-*`/`job-*`/`item-*`) are never sent into a Supabase UUID column

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Calendar / Reports / Asset Library / Connector Inbox / Automation Logs: **UNCHANGED** (untouched, deferred to later phases)
- RLS hierarchy: `content_approval_hierarchy_is_valid()` validates the full chain `client_id -> brand_id -> campaign_id -> brief_id -> generation_id -> content_item_id` (extends 16C-1's `content_plan_hierarchy_is_valid()` + validates `content_plan_jobs`/`content_plan_items` membership). `content_approval_request_user_has_scope()`/`..._can_write()` additionally require a child event/comment row's `content_item_id` to match its parent request's `content_item_id`.
- Role permissions: `content_approval_requests` insert/update and `content_approval_events`/`content_approval_comments` insert are **owner/manager only** (`content_approval_request_user_can_write`); `client`/`viewer` roles can read (requests/events/comments) but cannot insert any of the three tables.
- Build: PASS — 0 TS errors (`tsc && vite build`)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c2_approval_extension.sql` | NEW — additive migration: `content_approval_requests`/`events`/`comments` tables, 3 enums, 11 indexes, `updated_at` trigger, RLS enable + hierarchy-validated policies |
| `src/lib/core/coreRepository.ts` | `ApprovalRepository` + `ApprovalListParams`/`ApprovalScopedParams`/`ApprovalCreateInput`/result types |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageApprovalRepository` (list/get/create/executeAction/addComment, scoped) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseApprovalRepository` (list/get/create/executeAction/addComment, scoped) |
| `src/lib/core/repositoryFactory.ts` | Added `approvals` to `Phase16aRepositories` bundle |
| `src/App.tsx` | `approvalRepoFor()` per-operation repo selection; `handleApprovalSubmit`/`handleApprovalAction`/`handleApprovalComment` |
| `src/components/core/ApprovalsTab.tsx` | wired to `onApprovalSubmit`/`onApprovalAction`/`onComment` |
| `src/components/core/ClientViewTab.tsx` | wired to `onComment` (client feedback) |

---

## ✅ Phase 16C-2 Codex Fix — UUID Routing + RLS Hierarchy + Comment/Event Permissions (Applied — 2026-06-11)

**Issue 1 (App.tsx — incomplete UUID gating):** `approvalRepoFor()` validated only the 5 tenant-scope ids (`clientId`/`brandId`/`campaignId`/`briefId`/`generationId`). `approvalId` and `contentItemId` were not checked, so a local-format `approval-*`/`content-item-*` id could still be sent into a Supabase UUID column on `get`/`executeAction`/`addComment`/`create`.

**Fix 1:** `approvalRepoFor()` now accepts optional `approvalId`/`contentItemId` and routes to Supabase only if `isSupabaseConfigured` AND all 5 tenant-scope ids AND (when provided) `approvalId`/`contentItemId` are valid UUIDs — otherwise falls back to `LocalStorageApprovalRepository`. `handleApprovalSubmit` now passes `contentItemId: item.id`; `handleApprovalAction`/`handleApprovalComment` now pass `approvalId: request.id` and `contentItemId: request.content_item_id`.

**Issue 2 (RLS hierarchy — content_item_id not validated):** `content_approval_hierarchy_is_valid()` validated `client_id`/`brand_id`/`campaign_id`/`brief_id`/`generation_job_id` against `content_plan_jobs`, but never checked that `content_item_id` belongs to that same chain. Event/comment rows could reference a `content_item_id` different from their parent request's.

**Fix 2:** `content_approval_hierarchy_is_valid()` extended to 6 args (`+ p_content_item_id`), adds an `EXISTS` check against `content_plan_items` requiring `id = p_content_item_id` AND `generation_job_id`/`client_id`/`brand_id`/`campaign_id`/`brief_id` all match the same chain. `content_approval_user_has_scope()`/`..._can_write()` extended to thread `p_content_item_id` through. `content_approval_request_user_has_scope()`/`..._can_write()` extended to take `p_content_item_id` and additionally require `req.content_item_id = p_content_item_id` — so an event/comment can never reference a different content item than its parent request. All 7 policies updated to pass `content_item_id`.

**Issue 3 (role permissions — comments/events writable by read-only roles):** `content_approval_comments_insert` allowed any in-scope role (including `client`/`viewer`) to insert, and `content_approval_events_insert` allowed any in-scope role to insert `'commented'` events.

**Fix 3:** Both `content_approval_events_insert` and `content_approval_comments_insert` now use `content_approval_request_user_can_write(approval_request_id, content_item_id)` — **owner/manager only**, matching `canRequestApproval`/`canApproveContent`/`canRejectContent` in `permissions.ts`. The `client`/`viewer` "commented"-event/comment exception was removed. Read access (`SELECT`) is unchanged — any active, unexpired, in-scope role (including `client`/`viewer`) can still read requests/events/comments.

**Migration safety:** additive, idempotent — `DROP FUNCTION IF EXISTS` added for all prior signatures (param counts changed) before `CREATE OR REPLACE`. No anon/broad access, no secrets/service role key, production Supabase env remains OFF. Calendar/Reports/Asset Library/Connector Inbox/Automation Logs untouched.

**Known future consideration:** `ClientViewTab`'s "Add Feedback" path (`onComment`, `is_internal=false`) is wired to `handleApprovalComment`. Once Supabase is enabled with a `client`-role user, this insert would be rejected by RLS (owner/manager-only). Currently moot — production Supabase env is OFF and localStorage has no RLS — but real client-facing feedback in Supabase will require an explicit feedback-write role/policy decision in a later phase.

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS.

**Commits:** `871c3d0` (feat: wire approval crud with scoped fallback) → `70f8b8a` (fix: harden approval uuid routing and rls hierarchy)

---

## 🏁 Phase 16C-2 — CLOSED (Codex PASS — 2026-06-11)

**Summary:**
- Approval CRUD wired to Supabase with localStorage fallback.
- Approval operations are fully scoped by clientId, brandId, campaignId, briefId, generationId/contentItemId where applicable.
- approvalId/contentItemId/local IDs are UUID-gated before Supabase routing.
- RLS validates the full tenant/content hierarchy (client → brand → campaign → brief → generation → content item).
- Read-only/client/viewer roles cannot write approval comments/events.
- Production Supabase env remains OFF.
- Demo Sign In remains.
- No secrets or service role key.

- **Codex result:** PASS — no further required fixes.
- **Commits:** `871c3d0` (feat: wire approval crud with scoped fallback) → `70f8b8a` (fix: harden approval uuid routing and rls hierarchy)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** TBD.
- **Known future consideration:** real client feedback in Supabase will require an explicit feedback role/policy in a later phase.

---

## 🏁 Phase 16C-1 — Content Plan Generation CRUD Wiring (CLOSED — Codex PASS — 2026-06-11)

### Scope completed:
- Supabase CRUD repository wiring for **Content Plan Generation** only (Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs untouched, deferred to later phases)
- New tables: `schema_v1.sql`'s legacy `generation_jobs`/`content_items` (Phase-15-planned, campaign-scoped, unused by the app) are left untouched. New **additive** migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c1_generation_extension.sql` creates `content_plan_jobs` and `content_plan_items` tables matching the Phase 6 `ContentPlanJob`/`ContentPlanItem` TS types: 3 new enums (`content_plan_job_status`, `content_plan_item_status`, `content_plan_generation_mode`), both tables with `client_id`/`brand_id`/`campaign_id`/`brief_id` UUID FKs, `plan_length_days CHECK (IN (7,15,30))`, `requested_by TEXT` (role name, not a user UUID), 7 indexes, `updated_at` triggers via existing `set_updated_at()`, RLS enabled with tenant-scoped policies (Codex Fix 4, see below). All `CREATE TABLE/TYPE/INDEX/TRIGGER/POLICY IF NOT EXISTS` / `EXCEPTION WHEN duplicate_object` — safe to re-run, **not applied to any live DB**.
- `GenerationRepository` interface added to `coreRepository.ts`: `list`, `get`, `create`, `update`, `archive` with scoped param types `GenerationListParams` / `GenerationScopedParams` / `GenerationCreateInput`, plus `GenerationListResult`/`GenerationDetailResult` (`{ jobs, items }` / `{ job, items }`)
- Supabase implementation: `SupabaseGenerationRepository` (list/get/create/update/archive)
- localStorage fallback: `LocalStorageGenerationRepository` (operates on `GenerationDataStore` / `loadGenerationData()` / `saveGenerationData()`, key `core_agency_gen_data_v1`)
- `createPhase16aRepositories` factory extended — bundle now returns `generations` repo
- App.tsx wired: generation jobs/items loaded per-brief on Supabase mount (alongside clients/brands/campaigns/briefs), new `handleGenerationCreate` handler
- `ContentGenerationTab.tsx`: new async `onGenerate` prop; `handleGenerate` rewritten from sync `setTimeout` + direct `generateContentPlan()` call to `await onGenerate(brief, planLength)`; `genError` state + dismissible error banner; removed now-unused direct `generateContentPlan` import

### Tenant-scope contract (final):
- `GenerationRepository.list({ clientId, brandId, campaignId, briefId })` — all 4 IDs required, returns `{ jobs, items }`
- `GenerationRepository.get({ clientId, brandId, campaignId, briefId, generationId })` — all 5 IDs required
- `GenerationRepository.create(data: GenerationCreateInput)` — requires `brief` + `clientId` + `brandId` + `campaignId` + `briefId` + `planLengthDays` + `requestedBy`; calls `generateContentPlan(brief, planLengthDays, requestedBy)` for the mock plan/items, then inserts into `content_plan_jobs`/`content_plan_items`; Supabase impl never sends a local `job-*`/`item-*`/`generation-*` `id` — DB generates the UUIDs, and the returned `{ job, items }` (with real UUIDs) is used to update React state
- `GenerationRepository.update({ clientId, brandId, campaignId, briefId, generationId }, patch: GenerationUpdatePatch)` — all 5 IDs required; `GENERATION_IMMUTABLE_PATCH_FIELDS` (snake_case + camelCase tenant/identity/ownership/audit fields — see Codex Fix 3 below), `GenerationUpdatePatch = Partial<Omit<ContentPlanJob, GenerationImmutableField>>`, and the shared `sanitizeGenerationPatch()` helper strip all of those before the patch reaches storage (mirrors Phase 16B-2 Codex Fix 2)
- `GenerationRepository.archive({ clientId, brandId, campaignId, briefId, generationId })` — all 5 IDs required (Codex Fix 2); implemented as `update(params, { status: 'archived' })` in both repos
- **No method accepts `generationId` alone** — `get`/`update`/`archive`/`list` always require the full `clientId`+`brandId`+`campaignId`+`briefId` scope in addition to (for get/update/archive) `generationId`
- Supabase generation queries always include `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId).eq('brief_id', briefId)`, plus `.eq('id', generationId)` for `get`/`update` on `content_plan_jobs`. The related `content_plan_items` query in `get()` now also includes the full 4-ID tenant filter in addition to `.eq('generation_job_id', generationId)` (Codex Fix 1)
- `LocalStorageGenerationRepository` mirrors the same 4-ID (+ `generationId` for get/update/archive) filtering against `loadGenerationData()`, including the items-by-tenant filter in `get()` (Codex Fix 1)
- TypeScript enforces: unscoped calls (`list()`, `get({generationId})`, `update({generationId}, patch)`, `archive({generationId})`) do not type-check

### Data flow:
- Supabase mode: on mount, after campaigns + briefs load, generation jobs/items loaded per-brief — `Promise.all(loadedCampaigns.flatMap((c, idx) => briefArrays[idx].map(b => repos.generations.list({ clientId: c.client_id, brandId: c.brand_id, campaignId: c.id, briefId: b.id }))))`, flattened into `loadedGenerationJobs`/`loadedContentItems`, then `setGenData` + `saveGenerationData`
- localStorage mode: `LocalStorageGenerationRepository` filters `loadGenerationData()` by `client_id`+`brand_id`+`campaign_id`+`brief_id`
- Create: `ContentGenerationTab.handleGenerate` calls `onGenerate(brief, planLength)` → `App.tsx`'s `handleGenerationCreate` derives `clientId`/`brandId`/`campaignId` from the brief's parent campaign (`coreData.campaigns.find(c => c.id === brief.campaign_id)`, same pattern as `handleBriefUpdate`), calls `repos.generations.create(...)`, returns `{ job, items }` with DB-issued UUIDs; the Tab merges these into `generationJobs`/`contentItems` via the existing `onUpdate({ generationJobs, contentItems })` callback and switches to the detail view
- Update/Archive: existing `handleGenerationUpdate`/`onUpdate` state-merge flow is unchanged; `GenerationRepository.update()`/`archive()` are available for future status-transition wiring (Calendar/Approval phases) but not yet called from the UI

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Calendar / Approval / Reports / Asset Library / Connector Inbox / Automation Logs: **UNCHANGED** (untouched, deferred to later phases)
- Local IDs (`job-*`/`item-*`/`generation-*`/`brief-*`) never sent to Supabase UUID/FK columns — DB generates UUIDs for `content_plan_jobs`/`content_plan_items`, returned rows update React state
- Update patch sanitization: `sanitizeGenerationPatch()` blocks `id`, tenant scope (`client_id`/`clientId`, `brand_id`/`brandId`, `campaign_id`/`campaignId`, `brief_id`/`briefId`), audit (`created_at`/`createdAt`, `updated_at`/`updatedAt`), and ownership/audit aliases (`requested_by`/`requestedBy`, `submitted_by`/`submittedBy`, `submitted_at`/`submittedAt`, `archived_at`/`archivedAt`, `archive_at`/`archiveAt`, `deleted_at`/`deletedAt`, `owner_id`/`ownerId`, `tenant_id`/`tenantId`, `organization_id`/`organizationId`, `user_id`/`userId`) in both snake_case and camelCase
- RLS: `content_plan_jobs`/`content_plan_items` have tenant-scoped SELECT/INSERT/UPDATE policies via `content_plan_user_has_scope()` (checks `user_roles` for `auth.uid()` against `client_id`/`brand_id`/`campaign_id`, global or scoped role) — anon/unauthenticated requests never match (Codex Fix 4)
- Build: PASS — 0 TS errors (`tsc && vite build`)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16c1_generation_extension.sql` | NEW — additive migration: `content_plan_jobs`/`content_plan_items` tables, 3 enums, 7 indexes, `updated_at` triggers, RLS enable + tenant-scoped policies (Codex Fix 4) |
| `src/lib/core/coreRepository.ts` | `GenerationRepository` (+ `archive`) + `GenerationListParams`/`GenerationScopedParams`/`GenerationCreateInput`/`GenerationListResult`/`GenerationDetailResult`; hardened `GENERATION_IMMUTABLE_PATCH_FIELDS`/`GenerationImmutableField`/`GenerationUpdatePatch`/`sanitizeGenerationPatch()` (Codex Fix 2 + 3) |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageGenerationRepository` (list/get/create/update/archive, scoped, backed by `loadGenerationData()`/`saveGenerationData()`); `get()` items filter now tenant-scoped (Codex Fix 1) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseGenerationRepository` (list/get/create/update/archive, scoped); `get()` items query now tenant-scoped (Codex Fix 1) |
| `src/lib/core/repositoryFactory.ts` | Added `generations` to `Phase16aRepositories` bundle |
| `src/App.tsx` | Per-brief generation load on Supabase mount; new `handleGenerationCreate`; wired into `ContentGenerationTab` via `onGenerate` |
| `src/components/core/ContentGenerationTab.tsx` | New async `onGenerate` prop; `handleGenerate` rewritten to call `onGenerate` + existing `onUpdate`; `genError` state + error banner; removed direct `generateContentPlan` import |

---

## ✅ Phase 16C-1 Codex Fix — Harden Generation Tenant Scope (Applied — 2026-06-11)

**Issue 1 (unscoped item read in `get()`):** `SupabaseGenerationRepository.get()` and `LocalStorageGenerationRepository.get()` fetched `content_plan_items` filtered only by `generation_job_id` (`.eq('generation_job_id', generationId)` / `i.generation_job_id === job.id`), without the `client_id`/`brand_id`/`campaign_id`/`brief_id` tenant filter already applied to the parent job query.

**Fix 1:** both `get()` implementations now filter `content_plan_items` by `generation_job_id` **and** `client_id`/`brand_id`/`campaign_id`/`brief_id` — Supabase adds `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId).eq('brief_id', briefId)` to the items query; localStorage adds the same 4 field checks to the `contentItems.filter()` predicate.

**Issue 2 (no scoped `archive()`):** `GenerationRepository` had no `archive()` method, unlike `CampaignRepository.archive(params: CampaignScopedParams)`.

**Fix 2:** added `archive(params: GenerationScopedParams): Promise<void>` to `GenerationRepository`, requiring all 5 IDs (`clientId`+`brandId`+`campaignId`+`briefId`+`generationId`). Both `SupabaseGenerationRepository.archive` and `LocalStorageGenerationRepository.archive` implement it as `this.update(params, { status: 'archived' })` — same pattern as `LocalStorageCampaignRepository.archive`, fully scoped via the existing `update()` query/filter chain. Cannot be called by `generationId` alone.

**Issue 3 (sanitizer gaps — camelCase + extra audit/ownership fields):** `GENERATION_IMMUTABLE_PATCH_FIELDS` only listed snake_case `id`/`client_id`/`brand_id`/`campaign_id`/`brief_id`/`created_at`/`updated_at`/`requested_by`. A dynamically-built patch using camelCase keys (`clientId`, `requestedBy`, etc.) or other ownership/audit aliases (`submittedBy`, `archivedAt`, `ownerId`, `tenantId`, `organizationId`, `userId`, …) would pass through `sanitizeGenerationPatch()` unstripped.

**Fix 3:** `GENERATION_IMMUTABLE_PATCH_FIELDS` expanded to include both snake_case and camelCase forms of: `id`, `client_id`/`clientId`, `brand_id`/`brandId`, `campaign_id`/`campaignId`, `brief_id`/`briefId`, `created_at`/`createdAt`, `updated_at`/`updatedAt`, `requested_by`/`requestedBy`, `submitted_by`/`submittedBy`, `submitted_at`/`submittedAt`, `archived_at`/`archivedAt`, `archive_at`/`archiveAt`, `deleted_at`/`deletedAt`, `owner_id`/`ownerId`, `tenant_id`/`tenantId`, `organization_id`/`organizationId`, `user_id`/`userId`. `sanitizeGenerationPatch()` signature widened to `Partial<ContentPlanJob> & Record<string, unknown>` so it can accept (and strip) these extra keys from a dynamically-built object at runtime while still returning `GenerationUpdatePatch`.

**Issue 4 (RLS enabled with no policies):** the migration enabled RLS on `content_plan_jobs`/`content_plan_items` but added no policies, leaving them accessible only to `service_role`.

**Fix 4:** added `content_plan_user_has_scope(p_client_id, p_brand_id, p_campaign_id)` — a `SECURITY DEFINER` SQL function (fixed `search_path = public`) that checks the existing `user_roles(user_id, resource_type, resource_id)` table for `auth.uid()` having a `'global'` role, or a `'client'`/`'brand'`/`'campaign'`-scoped role matching the row's tenant IDs. Added tenant-scoped `SELECT`/`INSERT`/`UPDATE` policies for both `content_plan_jobs` and `content_plan_items` using this function (each wrapped in `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`). `auth.uid()` is `NULL` for anon/unauthenticated requests and `user_roles.user_id` is `NOT NULL`, so anon never matches — **no anonymous public access** is granted. Both tables are brand-new (this migration), so no existing rows/backfill concerns.

**Tenant scope:** unchanged otherwise — `list`/`get`/`update`/`archive` still require `clientId`+`brandId`+`campaignId`+`briefId`(+`generationId`); local `job-*`/`item-*`/`generation-*` IDs still never sent to Supabase.

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

**Codex result:** Superseded — RLS (Fix 4) further hardened in Codex Fix Round 2 below; final Codex PASS recorded in the closure section below.

---

## ✅ Phase 16C-1 Codex Fix Round 2 — RLS Role Permissions + Brief Hierarchy (Applied — 2026-06-11)

**Issue 1 (role permissions / active-expired assignments):** `content_plan_user_has_scope()` (Fix 4 above) granted INSERT/UPDATE to every scoped role — including read-only `client`/`viewer` roles — and did not check `user_roles.is_active`/`expires_at`, so revoked or expired assignments still matched.

**Fix 1:** `content_plan_user_has_scope()` now requires `ur.is_active = TRUE AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`, and takes a `p_roles role_name[]` parameter (default = all four roles, for reads). New `content_plan_user_can_write()` narrows this to `ARRAY['owner','manager']`. `content_plan_jobs`/`content_plan_items` policies are split: SELECT uses `content_plan_user_has_scope(...)` (any active, unexpired, in-scope role may read); INSERT/UPDATE use `content_plan_user_can_write(...)` (only owner/manager — `client`/`viewer` can never insert/update, including transitions to `archived`).

**Issue 2 (missing brief_id / OR-based scope could authorize mismatched hierarchies):** the helper/policies omitted `brief_id`, and the role-scope OR-check (`global`/`client`/`brand`/`campaign`) could authorize a row whose `client_id`/`brand_id`/`campaign_id`/`brief_id` did not all belong to the same real tenant hierarchy.

**Fix 2:** new `content_plan_hierarchy_is_valid(p_client_id, p_brand_id, p_campaign_id, p_brief_id)` — `SECURITY DEFINER`/`STABLE` SQL function that validates, against the real `clients → brands → campaigns → campaign_briefs` FK chain, that all four ids form ONE consistent hierarchy. `content_plan_user_has_scope()` now AND-s this check with the role-assignment check, so a role-scope match alone can never authorize a row with a mismatched/borrowed id. `brief_id` is now a parameter on every helper and is included in every policy call (SELECT / INSERT WITH CHECK / UPDATE USING / UPDATE WITH CHECK) for both `content_plan_jobs` and `content_plan_items`.

**Migration safety:** additive only; `DROP POLICY IF EXISTS` + `DROP FUNCTION IF EXISTS` (for prior signatures) precede `CREATE OR REPLACE`, so the migration stays idempotent across iterative Codex-fix passes. No anon/broad access, no service role key/secrets, production Supabase env remains OFF. Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs untouched.

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS.

**Commits:** `c81b069` (fix: tighten generation rls role permissions) → `0876162` (fix: enforce generation rls brief hierarchy)

---

## 🏁 Phase 16C-1 — CLOSED (Codex PASS — 2026-06-11)

**Summary:**
- Generation CRUD wired to Supabase with localStorage fallback.
- Full scope required: clientId + brandId + campaignId + briefId.
- No get/update/archive by generationId alone.
- Local generation/job/item IDs are not sent into Supabase UUID columns.
- Update patch sanitizes tenant/audit/ownership fields.
- Archive is fully scoped.
- RLS policies enforce active/unexpired assignments, role-specific read/write permissions, and full client/brand/campaign/brief hierarchy.
- Production Supabase env remains OFF.
- Demo Sign In remains.
- No secrets or service role key.

- **Codex result:** PASS — no further required fixes.
- **Commits:** `77987ab` (feat: wire generation crud to supabase) → `db0819b` (fix: harden generation crud tenant scope) → `c81b069` (fix: tighten generation rls role permissions) → `0876162` (fix: enforce generation rls brief hierarchy)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** TBD.

---

## 🏁 Phase 16B-2 — Campaign Briefs CRUD Wiring (CLOSED — Codex PASS — 2026-06-10)

### Scope completed:
- Supabase CRUD repository wiring for **Campaign Briefs** only (Generation/Calendar/Approval/Reports/Asset Library untouched)
- Schema gap fixed first: `schema_v1.sql`'s `campaign_briefs` table was missing `client_id`, `brand_id`, `status`, and 13 fields that Phase 5 added to the `CampaignBrief` TS type/UI but never migrated to the DB. New **additive** migration `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16b2_brief_extension.sql` adds: `brief_status` enum, `client_id UUID REFERENCES clients(id)`, `brand_id UUID REFERENCES brands(id)`, `status brief_status DEFAULT 'draft'`, plus `brief_title`, `campaign_goal`, `product_focus`, `offer`, `tone_of_voice`, `content_pillars`, `must_include`, `must_avoid`, `competitors`, `reference_links`, `budget_note`, `timeline_note`, `approval_requirements`, and 2 indexes (`idx_campaign_briefs_client`, `idx_campaign_briefs_brand`). All `ADD COLUMN IF NOT EXISTS` / `CREATE TYPE ... EXCEPTION WHEN duplicate_object` — safe to re-run, **not applied to any live DB**.
- `BriefRepository` interface added: `list`, `get`, `create`, `update` with scoped param types `BriefListParams` / `BriefScopedParams`
- Supabase implementation: `SupabaseBriefRepository` (list/get/create/update)
- localStorage fallback: `LocalStorageBriefRepository`
- `createPhase16aRepositories` factory extended — bundle now returns `briefs` repo
- App.tsx wired: briefs loaded per-campaign on Supabase mount (alongside clients/brands/campaigns), `handleBriefCreate`, `handleBriefUpdate`; removed now-unused `handleCoreUpdate`
- `BriefIntakeTab.tsx`: async `onBriefCreate`/`onBriefUpdate` props, `formLoading`/`actionError` states; removed `generateId` and the broad `onUpdate(CoreDataStore)` prop; create-mode validation now requires client + brand selection (both required by `BriefFormData`)

### Tenant-scope contract (final):
- `BriefRepository.list({ clientId, brandId, campaignId })` — all 3 IDs required
- `BriefRepository.get({ clientId, brandId, campaignId, briefId })` — all 4 IDs required
- `BriefRepository.create(data: BriefFormData)` — requires `client_id` + `brand_id` + `campaign_id` (+ denormalised `brand_name`/`industry`); Supabase impl never sends an `id`, `submitted_by`, `submitted_at`, `duration_days`, or `additional_notes` — DB generates the UUID, returned row updates React state
- `BriefRepository.update({ clientId, brandId, campaignId, briefId }, patch: BriefUpdatePatch)` — all 4 IDs required; `patch` type and the shared `sanitizeBriefPatch()` helper both strip `id`/`client_id`/`brand_id`/`campaign_id`/`created_at`/`updated_at`/`submitted_by`/`submitted_at` before the patch reaches storage (Codex Fix 2)
- No `archive()` method — `BriefIntakeTab.tsx` has no Archive button; `status: 'archived'` remains reachable via `update()` (same as existing `handleStatusChange` transitions)
- Supabase brief queries always include `.eq('client_id', clientId).eq('brand_id', brandId).eq('campaign_id', campaignId)`, plus `.eq('id', briefId)` for `get`/`update`
- `LocalStorageBriefRepository` mirrors the same `client_id`/`brand_id`/`campaign_id` filtering
- TypeScript enforces: unscoped calls (`list()`, `get({briefId})`, `update({briefId}, patch)`) do not type-check

### Data flow:
- Supabase mode: on mount, after campaigns load, briefs loaded per-campaign — `Promise.all(loadedCampaigns.map(c => repos.briefs.list({ clientId: c.client_id, brandId: c.brand_id, campaignId: c.id })))`
- localStorage mode: `LocalStorageBriefRepository` filters `loadCoreData().briefs` by `client_id` + `brand_id` + `campaign_id`
- Create: `BriefIntakeTab` resolves `brand_name`/`industry` from the selected brand at submit time, calls `onBriefCreate(data)`, then navigates to the detail view of the returned brief (real DB-issued `id`)
- Update (edit form + status transitions): `handleBriefUpdate` derives `clientId`/`brandId`/`campaignId` from the parent campaign (`coreData.campaigns.find(c => c.id === brief.campaign_id)`), calls `repos.briefs.update(...)`, merges the returned row into `coreData.briefs`

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Generation / Calendar / Approval / Reports / Asset Library: **UNCHANGED** (read `briefs` as props only, untouched)
- Build: PASS — 0 TS errors (`tsc && vite build`)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1_phase16b2_brief_extension.sql` | NEW — additive migration: `brief_status` enum, `client_id`/`brand_id`/`status` + 13 brief-detail columns, 2 indexes |
| `src/lib/core/coreData.ts` | `BriefFormData`/`EMPTY_BRIEF_FORM` extended with `brand_name`/`industry`; new shared exported `parseLines`/`parseComma` helpers |
| `src/lib/core/coreRepository.ts` | `BriefRepository` + `BriefListParams`/`BriefScopedParams` — scoped contract (replaces old unscoped interface) |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageBriefRepository` (list/get/create/update, scoped) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseBriefRepository` (list/get/create/update, scoped) |
| `src/lib/core/repositoryFactory.ts` | Added `briefs` to `Phase16aRepositories` bundle |
| `src/App.tsx` | Per-campaign brief load on Supabase mount; `handleBriefCreate`/`handleBriefUpdate`; removed unused `handleCoreUpdate`; wired into `BriefIntakeTab` |
| `src/components/core/BriefIntakeTab.tsx` | `onBriefCreate`/`onBriefUpdate` async props; `formLoading`/`actionError`; removed `generateId`/`onUpdate`/`CoreDataStore`; create-mode validation requires client + brand |

---

## ✅ Phase 16B-2 Codex Fix 1+2 — Migration Backfill + Brief Update Sanitizer (2026-06-10)

**Issue 1 (migration):** `schema_v1_phase16b2_brief_extension.sql` added `client_id`/`brand_id` as `NOT NULL` directly. Any existing `campaign_briefs` rows would have `NULL` `client_id`/`brand_id` and (a) fail the new `NOT NULL` constraints on migration, and (b) even if nullable, would silently disappear from every new tenant-scoped `list`/`get`/`update` query.

**Fix 1:** Migration now runs in 3 steps: (1) add `client_id`/`brand_id` as **nullable**; (2) `UPDATE campaign_briefs b SET client_id = c.client_id, brand_id = c.brand_id FROM campaigns c WHERE b.campaign_id = c.id AND (b.client_id IS NULL OR b.brand_id IS NULL)` — backfills every existing row from its campaign; (3) a `DO $$ ... $$` block counts any rows still missing a tenant ref — if zero, applies `ALTER COLUMN ... SET NOT NULL` to both columns; if any remain (orphaned `campaign_id` with no matching campaign), it `RAISE NOTICE`s the affected brief IDs, leaves the columns nullable, and skips the `NOT NULL` constraint rather than guessing/corrupting a tenant assignment. All steps are idempotent (re-running after a successful backfill is a no-op).

**Issue 2 (update sanitization):** `LocalStorageBriefRepository.update` did `{ ...b, ...patch, updated_at: now }` — a patch could overwrite `id`, `client_id`, `brand_id`, `campaign_id`, `created_at`, `submitted_by`, `submitted_at`, reassigning a brief to a different tenant/campaign. `SupabaseBriefRepository.update` only stripped `id`/`created_at`/`client_id`/`brand_id`/`campaign_id` — `submitted_by`/`submitted_at`/`updated_at` were still patchable.

**Fix 2:** New `BriefUpdatePatch` type (`Partial<Omit<CampaignBrief, 'id'|'client_id'|'brand_id'|'campaign_id'|'created_at'|'updated_at'|'submitted_by'|'submitted_at'>>`) and runtime `sanitizeBriefPatch()` helper added to `coreRepository.ts`. `BriefRepository.update`'s `patch` param is now typed `BriefUpdatePatch` (compile-time), and both `LocalStorageBriefRepository.update` and `SupabaseBriefRepository.update` call `sanitizeBriefPatch(patch)` (runtime) before merging/sending — neither repo can reassign identity, tenant, or audit fields via `update()`. `App.tsx`'s `handleBriefUpdate` and `BriefIntakeTab.tsx`'s `onBriefUpdate` prop are typed `BriefUpdatePatch` accordingly.

**Tenant scope:** unchanged — `list`/`get`/`update` still require `clientId`+`brandId`+`campaignId`(+`briefId`), Supabase queries still chain `.eq('client_id', ...).eq('brand_id', ...).eq('campaign_id', ...)` (+`.eq('id', briefId)`).

**Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (CRLF warnings only).

**Codex result:** PASS — no further required fixes.

---

## 🏁 Phase 16B-2 — CLOSED (Codex PASS — 2026-06-10)

- **Codex result:** PASS — no further required fixes (Fix 1: migration backfill, Fix 2: brief update patch sanitizer — both verified).
- **Commits:** `1e3e664` (feat: add phase 16b2 brief repository wiring) → `4a5ce38` (fix: backfill and sanitize campaign brief updates)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** TBD.

---

## 🏁 Phase 16B-1 — Campaigns CRUD Wiring (CLOSED — Codex PASS — 2026-06-10)

### Scope completed:
- Supabase CRUD repository wiring for **Campaigns** only (Briefs/Generation/Calendar/Approval/Reports untouched, deferred to 16B-2+)
- `CampaignRepository` interface extended with scoped param types: `CampaignListParams`, `CampaignGetParams`, `CampaignScopedParams`
- Supabase implementation: `SupabaseCampaignRepository` (list/get/create/update/archive)
- localStorage fallback: `LocalStorageCampaignRepository`
- `createPhase16aRepositories` factory extended — bundle now returns `campaigns` repo
- App.tsx wired: campaigns loaded per-client on Supabase mount (alongside clients/brands), `handleCampaignCreate`, `handleCampaignUpdate`
- `CampaignsTab.tsx`: async `onCampaignCreate`/`onCampaignUpdate` props, `formLoading`/`actionError` states; removed `generateId` and the broad `onUpdate(CoreDataStore)` / `briefs` prop

### Tenant-scope contract (final):
- `CampaignRepository.list({ clientId, brandId? })` — `clientId` required, `brandId` optional
- `CampaignRepository.get({ clientId, campaignId, brandId? })` — scoped by client (+ brand if given)
- `CampaignRepository.update({ clientId, brandId, campaignId }, patch)` — all 3 IDs required
- `CampaignRepository.archive({ clientId, brandId, campaignId })` — all 3 IDs required
- Supabase campaign queries always include `.eq('client_id', clientId)`, plus `.eq('brand_id', brandId)` when provided/required
- TypeScript enforces: calling list/get/update/archive without the required scope is a compile error — unscoped calls (`list()`, `get({campaignId})`, `update({campaignId}, patch)`, `archive({campaignId})`) do not type-check
- `create(data: CampaignFormData)` requires `client_id` + `brand_id`; Supabase impl never sends an `id` field — DB generates the UUID, and the returned row (with real UUID) is used to update React state

### Data flow:
- Supabase mode: on mount, campaigns loaded per-client — `Promise.all(clients.map(c => repos.campaigns.list({ clientId: c.id })))`, same pattern as brands (Phase 16A)
- localStorage mode: `LocalStorageCampaignRepository` filters `loadCoreData().campaigns` by `client_id` (+ `brand_id` when given)
- Create/update return the repository row, merged into `coreData.campaigns` React state and persisted via `saveCoreData`

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Brief / Generation / Calendar / Approval / Reports wiring: **NOT DONE** (deferred to 16B-2+)
- Build: PASS — 0 TS errors (`tsc && vite build`)
- `git diff --check`: PASS (CRLF warnings only, not errors)

### Files changed:
| File | Change |
|---|---|
| `src/lib/core/coreRepository.ts` | `CampaignRepository` interface + `CampaignListParams`/`CampaignGetParams`/`CampaignScopedParams` |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageCampaignRepository` (list/get/create/update/archive, scoped) |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseCampaignRepository` (list/get/create/update/archive, scoped) |
| `src/lib/core/repositoryFactory.ts` | Added `campaigns` to `Phase16aRepositories` bundle |
| `src/App.tsx` | Per-client campaign load on Supabase mount; `handleCampaignCreate`/`handleCampaignUpdate`; wired into `CampaignsTab` |
| `src/components/core/CampaignsTab.tsx` | `onCampaignCreate`/`onCampaignUpdate` async props; `formLoading`/`actionError`; removed `generateId`/`onUpdate`/`briefs` |

---

## ✅ Phase 16B-1 Codex Fix 1 — Positive `duration_days` on Create (Applied — 2026-06-10)

### Issue fixed:
- `schema_v1.sql` defines `campaigns.duration_days INT NOT NULL DEFAULT 7 CHECK (duration_days > 0)`. Both `SupabaseCampaignRepository.create` and `LocalStorageCampaignRepository.create` hardcoded `duration_days: 0`, which would violate the CHECK constraint and fail every Supabase campaign insert.

### Fix:
- Added `calculateCampaignDurationDays(startDate, endDate)` helper to `src/lib/core/coreData.ts`: inclusive day count `max(1, round((end - start) / 1 day) + 1)` when both dates are valid; falls back to `1` if either date is missing/invalid.
- Both `SupabaseCampaignRepository.create` and `LocalStorageCampaignRepository.create` now compute `duration_days: calculateCampaignDurationDays(data.start_date, data.end_date)` instead of hardcoding `0`.

### Files changed in fix 1:
| File | Change |
|---|---|
| `src/lib/core/coreData.ts` | Added `calculateCampaignDurationDays` helper |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageCampaignRepository.create` — `duration_days` computed via helper |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseCampaignRepository.create` — `duration_days` computed via helper |

### Tenant-scope contract: UNCHANGED (list/get/update/archive scoping untouched).

### Build: PASS — 0 TS errors. git diff --check: PASS (CRLF warnings only, not errors).

---

## 🏁 Phase 16B-1 — CLOSED (Codex PASS — 2026-06-10)

- **Codex result:** PASS — no further required fixes.
- **Commits:** `e733633` (feat: add phase 16b1 campaign repository wiring) → `a2a8651` (fix: ensure positive campaign duration on create)
- **git status:** working tree clean. main = origin/main.
- **Trạng thái:** ✅ CLOSED.
- **Next phase:** Phase 16B-2 — Campaign Briefs CRUD wiring.

---

## 🏁 Phase 16A — CLOSED (Codex PASS — 2026-06-09)

### Scope completed:
- Supabase CRUD repository wiring for **Clients** and **Brands** only
- `ClientRepository` + `BrandRepository` interfaces defined and implemented
- Supabase implementations: `SupabaseClientRepository`, `SupabaseBrandRepository`
- localStorage fallback implementations: `LocalStorageClientRepository`, `LocalStorageBrandRepository`
- Repository factory: `createPhase16aRepositories` — picks impl based on `isSupabaseConfigured`
- App.tsx wired: repos on mount, client-scoped brand load, `handleClientCreate/Update`, `handleBrandCreate`

### Tenant-scope contract (final):
- `BrandRepository.list(clientId: string)` — **required**, no optional fallback
- `BrandRepository.get(id, clientId)` — scoped by both id + client_id
- `BrandRepository.update(id, clientId, patch)` — scoped by both id + client_id
- `BrandRepository.archive(id, clientId)` — scoped by both id + client_id; throws if 0 rows affected
- Supabase brand queries always include `.eq('client_id', clientId)` — no unscoped path exists
- TypeScript enforces: calling any brand op without `clientId` is a compile error

### Safety record:
- Production Supabase env: **OFF** (env vars unset)
- Secrets / service role key in frontend: **NO**
- Demo Sign In: **PRESERVED**
- localStorage fallback: **PRESERVED**
- Campaign / Brief / Generation / Calendar / Approval / Reports wiring: **NOT DONE** (deferred to 16B+)
- Codex result: **PASS**

### Commits:
| Commit | Description |
|---|---|
| `54c8281` | feat: add phase 16a supabase clients brands wiring |
| `bccd1d1` | fix: route phase 16a client brand mutations through repositories |
| `53e8450` | fix: scope phase 16a brand repository operations by client |
| `df7e6aa` | fix: require client scope for brand repository list |

---

---

## 📋 Checklist Phase 16A

### A. Repository Layer (New Files)
- [x] Created `src/lib/core/localStorageRepositories.ts`
  - `LocalStorageClientRepository` implements `ClientRepository` interface
  - `LocalStorageBrandRepository` implements `BrandRepository` interface
  - Wraps existing coreData.ts helpers (no behavior change for demo)
- [x] Created `src/lib/core/supabaseRepositories.ts`
  - `SupabaseClientRepository` implements `ClientRepository` interface
  - `SupabaseBrandRepository` implements `BrandRepository` interface
  - Anon key only — no service role key, no tenant bypass
  - Proper null-safe error handling (throws on Supabase errors)
- [x] Created `src/lib/core/repositoryFactory.ts`
  - `createPhase16aRepositories(supabase, isConfigured)` factory
  - Returns Supabase repos when configured, localStorage repos otherwise
  - `Phase16aRepositories` type exported

### B. App.tsx Wiring
- [x] Import `supabase` from supabaseClient alongside existing `isSupabaseConfigured`
- [x] Import `createPhase16aRepositories` from repositoryFactory
- [x] `useMemo` to create repos once at startup
- [x] `useEffect` on mount: if Supabase configured, fetch clients+brands, update state + localStorage
- [x] `supabaseLoadError` state — non-blocking, dismissible banner on Supabase load failure
- [x] `handleCoreUpdate` — captures `prev` state, keeps localStorage write, fires async Supabase diff sync

### C. Clients CRUD Wiring
- [x] `list()` — reads from Supabase when configured, localStorage otherwise
- [x] `get(id)` — Supabase single row fetch with PGRST116 not-found handling
- [x] `create(data)` — Supabase insert on new entity detection (diff in handleCoreUpdate)
- [x] `update(id, patch)` — Supabase update on changed entity detection (diff in handleCoreUpdate)
- [x] `archive(id)` — via update with `status: 'archived'`

### D. Brands CRUD Wiring
- [x] `list(clientId?)` — reads from Supabase with optional client_id filter
- [x] `get(id)` — Supabase single row fetch
- [x] `create(data)` — Supabase insert on new entity detection
- [x] `update(id, patch)` — Supabase update on changed entity detection
- [x] `archive(id)` — via update with `status: 'archived'`

### E. Fallback Requirements
- [x] localStorage/mock continues working without Supabase env
- [x] If Supabase unavailable, error shown in non-blocking banner (not a crash)
- [x] Demo Sign In: completely preserved
- [x] All other tabs unaffected (Campaign/Brief/Generation/Approval/etc.)

### F. Safety
- [x] No secrets, no service role key in any file
- [x] `isSupabaseConfigured` guard on all Supabase paths
- [x] Production Supabase env NOT enabled (env vars still unset)
- [x] No RLS policies applied to real DB (still plan-only from Phase 15)
- [x] No auto-post, no real ads, no real messaging
- [x] Build PASS — 0 TypeScript errors
- [x] git diff --check PASS

---

## 🗂️ Phase 16A Deliverables

| File | Type | Action |
|---|---|---|
| `src/lib/core/localStorageRepositories.ts` | Code | NEW — localStorage ClientRepository + BrandRepository |
| `src/lib/core/supabaseRepositories.ts` | Code | NEW — Supabase ClientRepository + BrandRepository |
| `src/lib/core/repositoryFactory.ts` | Code | NEW — factory picks correct impl based on config |
| `src/App.tsx` | Code | MODIFIED — repos wired, async Supabase load, diff writes |

---

## 🔌 Data Flow (Phase 16A)

```
Without Supabase env (production / demo):
  App.tsx → LocalStorageClientRepository → coreData.ts → localStorage
  (No change from Phase 15 behavior)

With Supabase env (future):
  App.tsx mount → SupabaseClientRepository.list() → Supabase DB → setCoreData + saveCoreData
  handleCoreUpdate → diff prev vs next → SupabaseClientRepository insert/update (async)
  + saveCoreData to localStorage (sync, primary write)
```

---

## 🛡️ Safety Guard (Phase 16A)
- Secrets committed: NO
- Service role key in frontend: NO
- Real API called: NO (Supabase env not set)
- Demo Sign In fallback: PRESERVED
- localStorage fallback: PRESERVED
- Campaign/Brief/Generation/Approval wiring: NOT DONE (deferred to 16B+)
- Build: PASS (0 TS errors, tsc + vite)
- git diff --check: PASS

---

## ✅ Phase 16A Codex Fix 1 (Applied — 2026-06-09)

### Issues fixed:
1. **UUID bypass (CRITICAL):** Removed `syncClientsBrandsToSupabase` which inserted local `client-*`/`brand-*` string IDs into UUID Postgres columns.
2. **Error swallowing (REQUIRED):** Removed `.catch(() => {})` — errors now propagate to UI via `formError` (create) and `actionError` (archive/activate).
3. **Repo bypass:** All client/brand mutations now route through `repos.clients` / `repos.brands` exclusively. The database row with real UUID is used to update React state.

### Files changed in fix 1:
| File | Change |
|---|---|
| `src/components/core/ClientsTab.tsx` | Async `onClientCreate`/`onClientUpdate` props; `formLoading`/`actionError` states; removed `generateId`, `onUpdate`, `briefs` |
| `src/components/core/BrandsTab.tsx` | Async `onBrandCreate` prop; `formLoading` state; removed `generateId`, `onUpdate`, `briefs` |
| `src/App.tsx` | Removed `syncClientsBrandsToSupabase`; added `handleClientCreate`, `handleClientUpdate`, `handleBrandCreate`; restored `handleCoreUpdate` to pure localStorage write |

---

## ✅ Phase 16A Codex Fix 2 — Tenant-Scoped Brand Operations (Applied — 2026-06-09)

### Issues fixed:
1. **Unscoped brand list (REQUIRED):** `App.tsx` called `repos.brands.list()` with no `clientId`, loading all brands across all clients in a single query. Fixed: clients loaded first, then brands fetched per-client via `Promise.all(clients.map(c => repos.brands.list(c.id)))`.
2. **Brand get without client_id:** `SupabaseBrandRepository.get(id)` only filtered by `id`. Fixed: now requires `clientId`, adds `.eq('client_id', clientId)`.
3. **Brand update without client_id:** `SupabaseBrandRepository.update(id, patch)` only scoped by `id`. Fixed: now requires `clientId`, adds `.eq('client_id', clientId)`, surfaces PGRST116 as a typed error.
4. **Brand archive without client_id:** `SupabaseBrandRepository.archive(id)` only scoped by `id`. Fixed: now requires `clientId`, adds `.eq('client_id', clientId)`, returns error if no row affected.
5. **Interface not enforcing clientId:** `BrandRepository` interface had `get`, `update`, `archive` without required `clientId`. Fixed: TypeScript now requires `clientId` for all three — callers cannot call them unscoped.
6. **LocalStorage repo not validating clientId:** `LocalStorageBrandRepository.get/update/archive` matched by id only. Fixed: all three now filter/verify by both `id` and `client_id`.

### Files changed in fix 2:
| File | Change |
|---|---|
| `src/lib/core/coreRepository.ts` | `BrandRepository.get/update/archive` — added required `clientId: string` param |
| `src/lib/core/supabaseRepositories.ts` | `SupabaseBrandRepository.get/update/archive` — added `.eq('client_id', clientId)` to all queries; archive now returns error if 0 rows affected |
| `src/lib/core/localStorageRepositories.ts` | `LocalStorageBrandRepository.get/update/archive` — filter/verify by both `id` and `client_id`; throws if not found for that client |
| `src/App.tsx` | Initial Supabase load: replaced `repos.brands.list()` with sequential client-then-per-client-brands load |

### Build: PASS — 0 TS errors. git diff --check: PASS (CRLF warnings only, not errors).

---

## ✅ Phase 16A Codex Fix 3 — Mandatory clientId on BrandRepository.list (Applied — 2026-06-09)

### Issue fixed:
- `BrandRepository.list(clientId?: string)` had `clientId` optional, allowing an unscoped all-brand read to compile without error.

### Changes:
1. **`coreRepository.ts`:** `list(clientId?: string)` → `list(clientId: string)` — TypeScript now rejects any call site that omits `clientId`.
2. **`supabaseRepositories.ts`:** `SupabaseBrandRepository.list` signature made required; conditional `.eq('client_id', clientId)` replaced with unconditional `.eq('client_id', clientId)` — no code path can read all brands.
3. **`localStorageRepositories.ts`:** `LocalStorageBrandRepository.list` signature made required; ternary `clientId ? filter : all` replaced with unconditional `filter(b => b.client_id === clientId)`.

### Call site verification:
- Only call site: `App.tsx:275` — `repos.brands.list(c.id)` — already passes `c.id`, no change required.

### Build: PASS — 0 TS errors. git diff --check: PASS.

---

## ✅ Previous Phases (CLOSED)

| Phase | Feature | Commit |
|---|---|---|
| Phase 1 | Strategy + Branding | 317c6c8 |
| Phase 2 | Database Schema V1 | d0cb365 |
| Phase 3 | Auth + Role Permission | d8b972a |
| Phase 4 | Client/Brand/Campaign Management | 28f62f8 |
| Phase 5 | Brief Intake | 4585c45 |
| Phase 6 | Content Generation | 858a18a |
| Phase 7 | Content Calendar | c93eb3d |
| Phase 8 | Approval Workflow | 061b879 |
| Phase 9 | Client View Foundation | 860d06e |
| Phase 10 | Asset Library Foundation | 2ff8007 |
| Phase 11 | Report Module Foundation | 6e15e25 |
| Phase 12 | Export Pack Foundation | 860d06e |
| Phase 13 | Connector Registry + Module Event Inbox | f21dbf7 |
| Phase 14 | Automation Logs Foundation | 2d3c009 |
| Phase 15 | Supabase Auth + Database Wiring Plan | 68e8982 |
| Phase 16A | Supabase CRUD Wiring — Clients + Brands (Codex PASS) | df7e6aa |
| Phase 16B-1 | Supabase CRUD Wiring — Campaigns (Codex PASS) | a2a8651 |
| Phase 16B-2 | Supabase CRUD Wiring — Campaign Briefs (Codex PASS) | 4a5ce38 |
| Phase 16C-1 | Supabase CRUD Wiring — Content Plan Generation (Codex PASS) | 0876162 |
| Phase 16C-2 | Supabase CRUD Wiring — Approval (Codex PASS) | 70f8b8a |
