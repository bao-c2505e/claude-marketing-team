# SYSTEM LOG — Nhật Ký Tiến Độ Dự Án CLAUDE_MARKETING_TEAM

Nhật ký theo dõi các mốc hoàn thành kỹ thuật qua các Phase.

---

## 📅 Nhật Ký Sự Kiện (Event Logs)

### 🗓️ Ngày 18/06/2026 — Phase C — Manual n8n Prompt Update Pack / Owner Activation Pass ✅ DONE / PASS (docs-only)
- **Sự kiện:** Tạo Owner activation pack để Owner **thủ công** cập nhật 5 production n8n OpenAI prompt bằng chất lượng FnB đã tune ở Phase B — copy → paste → Save → activate → smoke test, hoàn toàn là **n8n-only edit**.
- **File mới:** `07_runbooks/phase_c_manual_n8n_prompt_update_owner_activation_pass.md` (Sections A–G: checklist trước khi sửa n8n; bảng cập nhật 5 OpenAI node; 5 khối "COPY THIS PROMPT" verbatim; smoke test plan; expected counts; rollback; PASS/FAIL) + log `08_logs/phase_c_manual_n8n_prompt_update_pack_20260618.md`.
- **Prompt provenance:** KHÔNG bịa prompt mới — mỗi prompt trích **nguyên văn** từ runbook Phase B tương ứng (Content Factory §1; Design/Video/Ads/Report §2 Path B step 4). Workflow/node names verify theo `n8n-workflows/*_v1.workflow.json`.
- **Per-module status (ghi trung thực trong pack):** Content Factory V1 = production-active (OpenAI node thật) → paste trực tiếp; Design/Video/Ads/Report = Owner-gated, production đang chạy Local fallback + placeholder trong n8n → prompt dùng khi Owner kích hoạt Path B (hoặc paste vào OpenAI node nếu đã thêm). Counts: Content = 7-day pack (7 items); 4 module còn lại = đúng 5 items.
- **An toàn:** approval-first; Approved ≠ Published; no auto-post/auto-ads/schedule/spend/publish; no live connectors; no image/video generation; no live analytics pull; no fake metrics; OpenAI key chỉ ở n8n Credentials; **không commit secret/webhook URL**; **không đổi workflow JSON** (không re-import, không Core redeploy, không Vercel env change); smoke test qua Core UI, không lộ webhook.
- **Validation:** `npm run build` PASS (index ~357.71 kB / gzip ~89.67, no >500 kB warning); `npm run test` PASS 75/75 (7 files); `node contracts/tools/validate_contracts.js` ALL PASS; secrets/webhook scan clean; workflow JSON unchanged.
- **Git:** commit `3656059` (Phase B rollup) đã được push lên `origin/main` từ trước (local == origin, 0 ahead/0 behind). Phase C commit thêm lên trên + push `origin main`, no history rewrite.

---

### 🗓️ Ngày 16/06/2026 — V2-E3 PC2 Adapter Skeleton — START GATED 🔴 (prerequisite gate FAILS; NOT started)
- **Sự kiện:** Owner direction = start V2-E3 PC2 Adapter Skeleton **chỉ nếu prerequisite gate pass**. Inspect-first gate check. **Kết quả: GATE FAILS → KHÔNG start V2-E3.** No adapter code, no tests, no spec created.
- **Gate inputs (inspected):** (1) **B2 verdict = 🔴 BLOCKED** (staging report §13.10 + §14; env re-confirm presence-only = tất cả MISSING). (2) **Overall V2-D2 = 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION** (KHÔNG VERIFIED/PASS). (3) **V2-UI-T2 / manual product E2E = không tồn tại** (chưa start, Route B kỳ trước). (4) **4-file consistency = nhất quán** — tất cả ghi `V2-E3 PC2 Adapter Skeleton 🔴 NOT STARTED / Owner-gated (checkpoint O1)`.
- **Gate evaluation:** Điều kiện "proceed" #1 = "B2 VERIFIED/PASS **HOẶC** tracking **explicitly** cho phép V2-E3 chạy song song bất chấp một documented **non-blocking partial**." → B2 KHÔNG VERIFIED (BLOCKED) ❌; tracking KHÔNG có statement nào explicitly cho phép parallel V2-E3 ❌ (verdict là BLOCKED, không phải "non-blocking partial"; **checkpoint O1 — Owner duyệt visibility-flag — cũng chưa logged**). Cộng thêm hard rule rõ ràng: "**If B2 is BLOCKED/FAILED → Do NOT start V2-E3. Stop.**" → fired.
- **Quyết định:** KHÔNG start V2-E3 (respect safety gate). Architecturally V2-E3 (pure local builder, zero HTTP, kill-switch) ĐỘC LẬP với Supabase staging, nên blocker B2 có thể coi là non-blocking CHO adapter — **nhưng** việc đó cần Owner ghi rõ vào tracking, không phải agent tự suy diễn vượt qua "if BLOCKED stop".
- **Hai đường unblock cho Owner:** (A) provision disposable staging → re-run §14.1 → B2 = VERIFIED → V2-E3 mở khóa; **hoặc** (B) Owner ghi rõ trong tracking rằng V2-E3 (Supabase-independent) được phép chạy **song song** (coi staging blocker là non-blocking cho adapter) **VÀ** log checkpoint O1 (tên/cơ chế visibility flag) → V2-E3 start.
- **Preserved:** V2-E3 PC2 Adapter Skeleton 🔴 NOT STARTED / Owner-gated; real connector activation 🔴 NOT STARTED / Owner-gated; feedback implementation + Checkpoint F 🔴 NOT STARTED / Owner-gated. KHÔNG approval mutation; PC2 callbacks metadata/log/echo only; Core UI authoritative.
- **Safety:** no live connector/PC2 endpoint; no secrets; no production URL/Supabase/data; no SQL; no approval-semantics change. Diff = docs/logs only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.

---

### 🗓️ Ngày 16/06/2026 — V2-D2 — B2 verdict routing → Route B (BLOCKED, no UI/product impl)
- **Sự kiện:** Owner direction = xác định verdict B2 thực tế từ staging report + route tới checkpoint kế tiếp an toàn nhanh nhất. **Lưu ý: "Codex PASS" cho B2 = report/tracking được review là TRUTHFUL, KHÔNG phải staging VERIFIED.**
- **Verdict B2 thực tế (đọc report §13.10 + §14):** 🔴 **BLOCKED** (classify đúng một: VERIFIED/PARTIAL/BLOCKED/FAILED → **BLOCKED**). Evidence (§13.3–§13.10) nói rõ substantive staging verification (migrations/schema/RLS/tenant hierarchy) **KHÔNG chạy**. Re-confirm 2026-06-16: env presence-only re-check (không in giá trị) = `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/`SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF`/`DATABASE_URL` tất cả MISSING; `.env*` ABSENT. Không đổi gì so với §13.
- **Route chọn: B (B2 BLOCKED).** **KHÔNG** proceed sang UI/product implementation; **Route A (V2-UI-T2 Manual Product E2E) KHÔNG được start** vì nó dựa trên B2 = VERIFIED (chưa đạt). KHÔNG chạy SQL, KHÔNG connect, KHÔNG production, KHÔNG fake.
- **Deliverable:** staging report §14 "Verdict routing" + §14.1 **exact re-run command/check** (presence-only env recheck → disposable-project confirm (redacted) → preflight → PC1 drive M1–M10 + §6/§7 → re-issue B verdict). Owner setup steps đã có ở §13.11.
- **Trạng thái:** Checkpoint B/B2 = 🔴 BLOCKED; **overall V2-D2 = 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION (KHÔNG DONE/PASS).** C/D/E ✅ docs-spec DONE độc lập (không replace staging verification). **V2-UI-T1 ✅ DONE/PASS, separate from V2-E3. V2-E3 PC2 Adapter Skeleton + feedback implementation + Checkpoint F migration draft vẫn 🔴 NOT STARTED / Owner-gated** (không cái nào được start trong checkpoint này).
- **Safety:** no production Supabase/data; no secrets printed/committed (presence-only); no connectors; no posting/ads/messaging/customer contact; no feedback table/RLS/UI; no PC2 adapter skeleton; approval semantics unchanged; PC2 callbacks metadata/log/echo only; Core UI authoritative. Diff = docs/logs only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.

---

### 🗓️ Ngày 16/06/2026 — V2-D2 — Checkpoint B2 Unblock Attempt 🔴 STILL BLOCKED (no disposable staging env)
- **Sự kiện:** Owner direction = start **Checkpoint B2** (unblock disposable Supabase staging verification cho schema/RLS/tenant hierarchy). Inspect-first; KHÔNG fake verification; nếu env thiếu → STOP + document blocker.
- **Env presence check (redacted — KHÔNG in giá trị):** `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/`SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF`/`DATABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` = **tất cả MISSING**; `.env`/`.env.local`/`.env.staging`/`.env.development` = **ABSENT**; `supabase/` linked project = ABSENT; supabase CLI = NOT INSTALLED.
- **Verification có chạy không?** 🔴 **KHÔNG.** Không có disposable staging project/env/keys → **halt trước mọi DB action**: KHÔNG chạy SQL, KHÔNG connect, KHÔNG production. Migrations/schema/RLS-cross-tenant = **NOT EXECUTED**.
- **Approval/callback safety:** design-verified (Core = static frontend, no HTTP listener → no runtime callback path): generated/pending chỉ đổi qua Core UI action; PC2 callbacks metadata/log/echo only; no callback-driven approval mutation; `completed_mock` ≠ approval; `failed_mock` → failure route; needs_revision/rejected-like = human-review metadata; approval state Core UI-authoritative. **NOT a substitute** cho DB-level RLS (vẫn BLOCKED).
- **Deliverable:** `08_logs/v2_d2_staging_report_20260615.md` §13 "Checkpoint B2 — Unblock Attempt" (env presence redacted, did-not-run rationale, migration/schema/RLS NOT EXECUTED, approval-safety design-verified, evidence table, blocker B2-1, **verdict = BLOCKED**, exact owner unblock steps). Status header updated.
- **Verdict B2:** 🔴 **BLOCKED** — no fake pass. **Checkpoint B vẫn 🔴 BLOCKED**; **overall V2-D2 vẫn 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION**. C/D/E vẫn ✅ docs-spec DONE độc lập (KHÔNG replace staging verification). V2-E3 PC2 Adapter Skeleton + feedback implementation + Checkpoint F migration draft vẫn 🔴 NOT STARTED / Owner-gated.
- **Next action (Owner/operator):** tạo disposable project `core-agency-staging-disposable` (non-production) + 4 fictional users + `.env.local` (git-ignored) chứa staging anon URL/key (KHÔNG service-role ở frontend) → notify PC1 → PC1 drive M1–M10 + §6/§7 → re-issue Checkpoint B verdict.
- **Safety:** no production Supabase/data; no secrets printed/committed (presence-only); no connectors; no posting/ads/messaging/customer contact; no feedback table/RLS/UI; no PC2 adapter skeleton; approval semantics unchanged. Diff = docs/logs only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Tracking truthfulness fix ✅ DONE (overall = PARTIAL / BLOCKED ON STAGING VERIFICATION)
- **Sự kiện (Codex required fix):** Codex flag — "V2-D2 Checkpoint B remains BLOCKED, so Checkpoints A–E are not all DONE/PASS (criterion 11)." Fix tracking truthfulness — docs/logs/tracking-only.
- **Correct status model (khớp staging report `v2_d2_staging_report_20260615.md`, verdict = BLOCKED, "No fake pass issued"):**
  - **Overall V2-D2 = 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION** — KHÔNG claim fully DONE/PASS cho tới khi Checkpoint B unblocked + verified.
  - **Checkpoint A** ✅ PASS (process/docs — Codex-reviewed honest blocked report).
  - **Checkpoint B 🔴 BLOCKED** = **the staging-verification blocker** (full staging verification KHÔNG chạy — no disposable staging env; DB-level §6/§7 NOT EXECUTED). KHÔNG fake.
  - **Checkpoint C** ✅ DOCS/SPEC DONE (client feedback policy). **Checkpoint D** ✅ DONE (owner decision docs). **Checkpoint E** ✅ DOCS/SPEC DONE (implementation plan docs).
  - **C/D/E là docs/spec/policy/planning hoàn thành ĐỘC LẬP — KHÔNG complete hay replace staging verification**; DONE status của chúng KHÔNG làm V2-D2 done.
- **Changes:** thêm overall PARTIAL/BLOCKED status + clarification ở `CURRENT_PHASE.md` (header + V2-D2 section) & `SESSION_SUMMARY.md` (section header); sửa 2 stale conditional "→ V2-D2 DONE" (CURRENT_PHASE §next + SESSION_SUMMARY next); reframe 2 dòng summary "A–E standing verdicts" (phase_log + agent_activity) để nêu rõ overall PARTIAL/BLOCKED.
- **Preserved:** V2-UI-T1 ✅ DONE/PASS (separate from V2-E3); **V2-E3 PC2 Adapter Skeleton 🔴 NOT STARTED / Owner-gated**; feedback implementation + Checkpoint F migration draft 🔴 NOT STARTED / Owner-gated. Approval/callback safety: PC2 callbacks metadata/log/echo only; no callback-driven approval mutation; Core UI authoritative for approval state.
- **Safety:** KHÔNG fake staging verification; KHÔNG chạy SQL; KHÔNG kết nối production/staging; KHÔNG runtime/repo/Supabase/RLS/auth/test changes; KHÔNG secrets/connectors. Diff = docs/logs/tracking only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.

---

### 🗓️ Ngày 15/06/2026 — V2-UI-T1 — Manual E2E + UI Bug Triage ✅ DONE / PASS (small safe fixes)
- **Disambiguation (Codex required fix):** đây là **V2-UI-T1**, một checkpoint UI/manual smoke-test triage **RIÊNG** — KHÔNG phải V2-E3. **V2-E3 = PC2 Adapter Skeleton vẫn 🔴 NOT STARTED / Owner-gated** (checkpoint O1). V2-UI-T1 DONE/PASS **KHÔNG** bắt đầu/hoàn thành bất kỳ V2-E3 PC2 adapter-skeleton work nào. (Trước đó entry này bị đặt nhầm tên "V2-E3"; đã rename + đổi file `v2_e3_ui_bug_triage.md` → `v2_ui_t1_ui_bug_triage.md`.)
- **Sự kiện:** Owner pause feedback implementation; start **V2-UI-T1 Manual E2E + UI Bug Triage**. 2 issue Owner báo: (1) mobile UI rối/cluttered; (2) Create Brand "clicking Create has no visible response". Investigation + small safe fixes only — **KHÔNG redesign, KHÔNG feedback table/RLS/UI, KHÔNG Supabase/migration/auth changes**.
- **Issue 2 (Create Brand) — root cause:** KHÔNG phải broken handler. Local-mode create flow đúng (`BrandsTab.handleCreate` → `handleBrandCreate` → `LocalStorageBrandRepository.create` → prepend state → card render). Defect thực = **UX gap: success path im lặng** (form đóng, card mới có thể nằm dưới fold trên mobile) → cảm giác "no response". **Fix:** thêm visible auto-dismiss success banner `✓ Brand "…" created.` trong `BrandsTab.tsx` (validation/loading/error vốn đã đúng). Latent UUID-gating gap (brands/clients thiếu per-op Supabase-vs-local fallback) đã **document làm follow-up**, KHÔNG fix (out of small-safe scope; moot khi env local).
- **Issue 1 (mobile) — root cause:** `index.css` KHÔNG có `@media` query nào + layout grid inline `260px 1fr` không collapse. **Fix (small, desktop unchanged):** thêm `className="app-main-grid"`/`app-sidebar` (App.tsx) + responsive block trong `index.css` (≤768px: grid → 1 cột, giảm container padding, header wrap, `.form-grid-2` 2-col→1-col; ≤480px: padding nhỏ hơn, heading word-break). KHÔNG đổi brand identity/màu/font.
- **Files (code):** `src/components/core/BrandsTab.tsx`, `src/App.tsx`, `src/index.css`. **Triage note:** `08_logs/v2_ui_t1_ui_bug_triage.md`.
- **Manual E2E smoke (fictional data):** create/read client → brand (scoped) → campaign (scoped) → brief (scoped) đều theo cùng pattern đúng; generated/pending approval an toàn; KHÔNG callback-driven approval mutation; localStorage UUID gating unchanged. Verified qua build (type-correct), dev server (HTTP 200, modules transform), code reading.
- **Safety:** KHÔNG Supabase/RLS/auth/migration; KHÔNG SQL; KHÔNG secrets; **KHÔNG connector activation; KHÔNG real posting/ads/messaging/customer contact**; KHÔNG feedback implementation; approval semantics unchanged; **PC2 callbacks remain metadata/log/echo only; KHÔNG callback-driven approval mutation; approval state remains Core UI-authoritative.** Diff = 3 UI/CSS files + docs/logs.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.
- **Trạng thái:** **V2-UI-T1 ✅ DONE / PASS** (Create Brand success-feedback fix + mobile responsive polish). **V2-E3 PC2 Adapter Skeleton vẫn 🔴 NOT STARTED / Owner-gated** (checkpoint O1). Feedback implementation + Checkpoint F migration draft vẫn 🔴 NOT STARTED / Owner-gated. **Overall V2-D2 = 🟡 PARTIAL / BLOCKED ON STAGING VERIFICATION** (KHÔNG phải all DONE/PASS): A ✅ PASS / **B 🔴 BLOCKED = staging-verification blocker, DB-level verification chưa chạy được** / C·D·E ✅ docs-spec DONE độc lập nhưng **KHÔNG complete/replace staging verification**. V2-D2 chỉ DONE khi B unblocked + verified.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint E Feedback Implementation Plan 🟡 PLAN ONLY (NOT implemented)
- **Sự kiện:** Owner duyệt bắt đầu **Checkpoint E** = feedback implementation **planning** (docs/spec/implementation-plan only). Author 2 spec mới; **KHÔNG implement** code/migrations/RLS/runtime/UI/tests.
- **Deliverables (mới):**
  - `03_core/specs/v2_d2_feedback_implementation_plan.md` — Purpose / Scope / Non-goals / current accepted policy summary / proposed data model (separate `client_feedback` table: required fields + tenant/scope + parent refs + actor identity + feedback_type/feedback_status + immutable audit + created_at/updated_at) / suggested RLS design (scoped reads only; **client approver INSERT only trong assigned tenant**; **viewer read-only — không có trong INSERT/UPDATE/DELETE predicate**; inactive/expired denied; read/write role separation; parent hierarchy validation; no broad OR-scope bypass; no callback impersonation) / suggested repository-API (interfaces, safe create/list, **no client update/delete**, UUID-gating `feedbackScopeIsSupabaseSafe`) / suggested UI (feedback panel, "Client feedback" label, approval controls tách riêng owner/internal-only, viewer read-only) / audit-logging / migration outline (future-only, NOT executable, staging-first) / test plan / rollout / risks R1–R8 / open questions / recommended next checkpoint.
  - `03_core/specs/v2_d2_feedback_future_checkpoints.md` — Checkpoint F (migration draft) / G (staging RLS verify) / H (repository-API) / I (UI) / J (manual E2E + evidence), mỗi cái: scope / allowed changes / hard boundaries / validation / Codex review expectations; tất cả 🔴 NOT STARTED / Owner-gated; global invariants restated.
- **Invariants preserved (KHÔNG nới lỏng):** client/viewer feedback KHÔNG mutate Core `approval_status`; **client viewer remains strictly read-only**; client approver có thể submit feedback/request revision, approved-like = metadata only cần Core owner/internal confirmation; PC2/module callbacks = metadata/log/echo only (non-authoritative); KHÔNG feedback/callback-driven posting/ads/messaging/customer contact.
- **Safety:** KHÔNG đổi runtime/product/repository/Supabase migrations/RLS/auth/tests/connectors/secrets. KHÔNG add executable SQL migration. KHÔNG chạy SQL. KHÔNG kết nối production/staging. Diff = docs/specs/logs only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).
- **Trạng thái:** **Checkpoint E 🟡 implementation plan only** / Feedback implementation 🔴 **NOT STARTED** / **Checkpoint F 🔴 NOT STARTED / Owner-gated** (build checkpoints G+ còn cần Checkpoint B *VERIFIED* — hiện BLOCKED). No implementation yet.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint D Codex REQUIRED FIX (round 2) ✅ DONE (stale viewer wording)
- **Sự kiện:** Codex flag — decision record vẫn còn câu **stale**: "Client portal (Phase 9): client/viewer already limited to read + non-internal feedback comment" — gộp client/viewer chung và ngụ ý viewer được add non-internal feedback comment, mâu thuẫn với Decision C (viewer strictly read-only). **Fix: tách rõ theo role.**
- **Stale statement fixed (`v2_d2_checkpoint_c_decision_record.md` §1 Context):** rewrote → Phase 9 là legacy/current implementation; dưới **accepted V2-D2 policy** thì non-internal feedback comment là capability của **client approver** (Phase-9-style/future feedback feature có thể cho client approver submit non-internal feedback comments); **client viewer remains strictly read-only**, KHÔNG add feedback/comment. Bất kỳ viewer-comment tương lai = separate future Owner-gated policy change, KHÔNG thuộc accepted V2-D2.
- **No grouping:** client approver và client viewer KHÔNG còn bị gộp chung cho bất kỳ write/comment/feedback permission nào trong V2-D2 policy docs.
- **Unchanged (preserved):** client approver policy giữ nguyên; client feedback KHÔNG mutate `approval_status` directly; approved-like = metadata pending Core owner/internal confirmation; rejected/needs_revision-like = metadata/feedback-record pending Core review; PC2/module callbacks = metadata/log/echo only; no callback-driven approval mutation; no feedback-driven posting/ads/messaging/customer contact. Historical Phase 9/16 READMEs + V2D runbook mô tả runtime thật để NGUYÊN (không misrepresent product behavior).
- **Safety:** docs/specs/logs-only — KHÔNG đổi runtime/product/repository/Supabase migrations/RLS/auth/tests/connectors/secrets; KHÔNG chạy SQL; KHÔNG kết nối production/staging.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).
- **Trạng thái:** Checkpoint D ✅ DONE — viewer consistently read-only mọi nơi. Future implementation phase 🔴 NOT STARTED / Owner-gated. No implementation yet.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint D Codex REQUIRED FIX ✅ DONE (Decision C consistency)
- **Sự kiện:** Codex review flag — **Decision C inconsistent**: accepted wording nói viewer read-only, nhưng policy/decision docs vẫn cho phép viewer feedback "nếu Owner explicitly grant". **Fix: làm Decision C nhất quán mọi nơi — client viewer STRICTLY read-only, KHÔNG có ngoại lệ Owner-grant trong V2-D2.** Docs/specs/logs-only.
- **Changes:** Bỏ mọi "viewer feedback if explicitly granted/Owner-grant" exception. Permission matrix nay state rõ viewer: **read scoped outputs only**; KHÔNG create feedback/comment; KHÔNG request revision; KHÔNG submit approved-like; KHÔNG submit rejected-like; KHÔNG mutate Core approval state. Bỏ ký hiệu legend `☑️ (Owner-granted)` → viewer "Create feedback/comment" = ⛔ (read-only). Thêm clarification: bất kỳ thay đổi tương lai cho phép viewer comment = **separate future Owner-gated policy update + future implementation checkpoint**, KHÔNG thuộc accepted V2-D2 decision.
- **Unchanged (preserved):** client **approver** policy giữ nguyên (submit feedback/request revision; approved-like = metadata only, cần Core owner/internal confirmation). Safety statements giữ nguyên: client feedback KHÔNG mutate `approval_status` directly; PC2/module callbacks = metadata/log/echo only; no callback-driven approval mutation; no feedback-driven posting/ads/messaging/customer contact.
- **Files:** `03_core/specs/v2_d2_client_feedback_policy.md` (legend, matrix viewer cell, role def, §4 notes, R4, §11 C) + `03_core/specs/v2_d2_checkpoint_c_decision_record.md` (§2, X3, §4 C, recommended C, §7 table C + clarification, §7.3) + `CURRENT_PHASE.md`/`SESSION_SUMMARY.md`/`08_logs/phase_log.md`/`08_logs/agent_activity_log.md` wording.
- **Safety:** KHÔNG đổi runtime/product/repository/Supabase migrations/RLS/auth/tests/connectors/secrets. KHÔNG chạy SQL. KHÔNG kết nối production/staging. Diff = docs/specs/logs only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).
- **Trạng thái:** Checkpoint D ✅ DONE (Owner decision recorded, Decision C nay nhất quán). Future implementation phase 🔴 NOT STARTED / Owner-gated. No implementation yet.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint D Owner Decision ✅ DONE (policy stage CLOSED)
- **Sự kiện:** Record **Owner decision** cho Checkpoint D và **đóng policy-decision stage** (Checkpoints C → D). Documentation/log/decision-record only. **KHÔNG implement** code/RLS/runtime/migrations/tests.
- **Owner decision (recorded):** **A = YES** (client approver submit feedback/request revision, no state mutation) · **B = YES, metadata only** (approved-like feedback yêu cầu Core owner/internal confirmation trước mọi real approval state change — không auto-approve) · **C = YES** (client viewer read-only) · **D = YES** (future implementation dùng separate feedback table).
- **Decision status:** ✅ ACCEPTED / OWNER-APPROVED FOR FUTURE IMPLEMENTATION. Owner approval phủ policy *direction* — **KHÔNG authorize build bây giờ**.
- **Invariants preserved (không nới lỏng):** client feedback KHÔNG mutate Core `approval_status` directly; approved-like feedback = metadata only; rejected/needs_revision-like feedback = metadata/feedback-record only; viewer read-only; PC2 callbacks = metadata/log/echo only (non-authoritative); KHÔNG feedback/callback-driven posting/ads/messaging/customer contact.
- **Deliverables (updated docs):** `03_core/specs/v2_d2_checkpoint_c_decision_record.md` (+§6 carried-forward consequences, +§7 Checkpoint D Owner Decision, +§8 Status; status header → ACCEPTED/NOT IMPLEMENTED); `03_core/specs/v2_d2_client_feedback_policy.md` (status header + §11 → Owner-approved A–D, sub-decisions E/F still open). Wording-only; KHÔNG chuyển thành implementation/migration instructions.
- **Safety:** KHÔNG đổi runtime/product/repository/Supabase migrations/RLS/auth/tests/connectors/secrets. KHÔNG chạy SQL. KHÔNG kết nối production/staging. Diff = docs/specs/logs only.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).
- **Trạng thái:** **Checkpoint D ✅ DONE — Owner decision recorded, policy-decision stage CLOSED.** **Future implementation phase 🔴 NOT STARTED / Owner-gated** (theo sau một Checkpoint B *VERIFIED* — hiện BLOCKED). No implementation yet.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint C Client-Feedback Policy 🟡 DOCS/SPEC PROPOSED
- **Sự kiện:** Author Checkpoint C — **client-role feedback policy decision** dưới dạng **documentation/specification only** (Owner-approved docs/spec scope). Checkpoint C trước đó = NOT STARTED (không có `03_core/specs/`, không có policy/decision docs). **KHÔNG implement** code/RLS/runtime/migrations/tests.
- **Deliverables (mới):**
  - `03_core/specs/v2_d2_client_feedback_policy.md` — Purpose / Scope / 5 role definitions (owner-admin, internal-editor, client approver, client viewer, PC2/module callback) / permission matrix (read/feedback/revision/approved-like/rejected-like/mutate approval_status/publish/edit hierarchy/edit output/archive-delete) / state-transition policy (cái gì CAN/CANNOT đổi `approval_status`; `feedback_status` → review mapping; xử lý an toàn needs_revision/rejected/approved) / data-model recommendation (separate `client_feedback` table, required + tenant/scope + immutable audit + actor identity + parent refs + created_at/updated_at) / future RLS requirements / future UI requirements / audit-log / risks+mitigations (R1–R9) / open owner decisions.
  - `03_core/specs/v2_d2_checkpoint_c_decision_record.md` — Decision status PROPOSED/not implemented; recommended option; rejected unsafe options (client mutates approval_status; PC2 callback approves/rejects; viewer writes feedback [viewer strictly read-only]; feedback triggers publish/ads/send; overload approval column); required Owner decision A/B/C/D + recommended answer (A=yes, B=yes metadata only, C=yes viewer **strictly read-only — no Owner-grant exception**, D=yes separate table).
- **Invariant cốt lõi:** Client feedback là **input** cho human review — KHÔNG bao giờ là approval / publish trigger / state transition. Chỉ authenticated Owner/Internal action trong Core Approvals UI mới đổi `approval_status`. PC2 callbacks non-authoritative (V2-E2 §4 + t2/t3 fix `3c8f853`).
- **Safety:** KHÔNG đổi runtime/product/repository/Supabase migrations/RLS/auth/tests/connectors/secrets. KHÔNG chạy SQL. KHÔNG kết nối production/staging. Diff = docs/specs/logs only. Client/viewer KHÔNG được mutate Core approval; PC2 callback status KHÔNG mutate approval decisions.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).
- **Trạng thái:** **Checkpoint C 🟡 docs/spec PROPOSED (complete as specification; NOT implemented)** / **Checkpoint D 🔴 NOT STARTED / Owner-gated** (implementation = future phase, theo sau một Checkpoint B *VERIFIED* — hiện BLOCKED). No implementation yet.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Checkpoint B Verification Verdict 🔴 BLOCKED
- **Sự kiện:** Render Checkpoint B verdict cho V2-D2. **Checkpoint A ✅ PASS** (process/docs — Codex-reviewed honest blocked report). **Checkpoint B verdict: 🔴 BLOCKED** — DB-level verification vẫn không chạy được. Re-check env 2026-06-15: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` vẫn MISSING, `.env.local` vẫn absent — không có gì thay đổi từ Checkpoint A. **KHÔNG fake pass.**
- **Verdict rationale:** BLOCKED chứ không VERIFIED/PARTIAL/FAILED — zero DB-level criteria chạy (preflight chỉ preparatory); không defect nào quan sát được vì không có gì chạy.
- **Ran:** preflight (build 0 TS errors, tests 45/45, secrets clean, env-presence MISSING) + documentation. **Did not run:** §6 (schema/RLS/hierarchy/helpers/role-sep/UUID-gating) + §7 (cross-tenant matrix + 18 rls_policy_plan §14 tests) + §8 DB-level — 0 executed.
- **Report additions (`08_logs/v2_d2_staging_report_20260615.md`):** §10 Checkpoint B verdict (overall result, what ran/didn't, evidence, assumptions, unverified, next action, can-proceed-to-C = NO), §11 evidence closure table 16 verification areas (preflight/secrets PASS; migration order/schema existence/tenant hierarchy/RLS/active-unexpired assignment/read-write role sep/UUID-gating/brief-client-brand-campaign hierarchy/asset_collection_id validation/Group-F unwired/approval-callback safety/failed_mock route/needs_revision metadata — DB-level BLOCKED, code/contract-level invariants PASS but explicitly NOT a substitute), §12 safety conclusion.
- **Checkpoint C:** 🔴 NOT STARTED / Owner-gated — KHÔNG proceed trên cơ sở verification hoàn tất (B chưa VERIFIED); client-role feedback policy KHÔNG implement (out of scope).
- **Safety:** production Supabase NOT used; no production data; no secrets printed/committed; no connector activation; no posting/ads/messaging/customer contact; no callback-driven approval mutation; approval state remains Core UI-authoritative.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).
- **Trạng thái:** Checkpoint A ✅ PASS / Checkpoint B 🔴 BLOCKED / Checkpoint C 🔴 NOT STARTED. Unblock = Owner/operator provision disposable staging → PC1 drive M1–M10 + §6–§7.

---

### 🗓️ Ngày 15/06/2026 — V2-D2 — Supabase Staging Execution — CHECKPOINT A STARTED / 🔴 EXECUTION BLOCKED
- **Sự kiện:** Owner duyệt **Checkpoint A** cho V2-D2 (Supabase staging execution). Bắt đầu preflight. **Phát hiện BLOCKER ở PF8: không có disposable Supabase staging project + env vars.** Đã STOP đúng hard-boundary — **KHÔNG chạy SQL, KHÔNG kết nối DB, KHÔNG fake verification.**
- **Preflight:** branch `main` = origin/main, tree clean, commit `2f1b700`; `npm run build` PASS (0 TS errors); `npm run test` 45/45 PASS; secrets scan sạch (chỉ `.env.example`/`modules/comfyui-pipeline/.env.example` tracked; `service_role` chỉ trong SQL/code comments + safety note).
- **BLOCKER (env presence check — giá trị KHÔNG bao giờ in ra):** `VITE_SUPABASE_URL`=MISSING, `VITE_SUPABASE_ANON_KEY`=MISSING, `SUPABASE_SERVICE_ROLE_KEY`=MISSING, `DATABASE_URL`=MISSING; `.env.local` absent, `.env` absent. `.gitignore` đã loại `.env`/`.env.local`. Agent KHÔNG thể tạo Supabase project (cần dashboard + account của Owner/operator).
- **Deliverable:** `CLAUDE_MARKETING_TEAM/08_logs/v2_d2_staging_report_20260615.md` — preflight results, staging target NOT PROVISIONED (env redacted), exact missing env vars + provisioning prerequisites, migration files + order M1–M10 (READY/NOT EXECUTED), rollback/recovery, stop conditions, migration/RLS verification checklist (NOT EXECUTED), cross-tenant matrix 9 entities × 7 assertions (DEFINED/NOT EXECUTED), approval/callback safety (DB-level NOT EXECUTED; code/contract invariants restated unchanged), verdict + unblock steps.
- **Approval/callback safety:** KHÔNG đổi. PC2 callbacks non-authoritative; generated/pending stay until authenticated Core UI action; `completed_mock` ≠ approval; `failed_mock` → failure route; needs_revision/rejected = metadata. KHÔNG code nào thay đổi → KHÔNG callback nào mutate Core approval.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff).
- **Trạng thái:** 🟡 Checkpoint A STARTED, 🔴 **EXECUTION BLOCKED** (missing disposable staging env). **Checkpoint B NOT READY** — no fake pass. Production Supabase NOT touched.

---

### 🗓️ Ngày 12/06/2026 — V2-D1.5 — Manual E2E Checklist + Demo Script (docs-only prep) ✅ DONE
- **Sự kiện:** Tạo prep docs cho manual E2E verification. **Documentation/checklist/demo-script only — KHÔNG tạo Supabase staging project, KHÔNG chạy SQL, KHÔNG kết nối DB, KHÔNG secrets/credentials, KHÔNG live connector, KHÔNG đổi runtime/product/repository/Supabase/auth/RLS/tests. V2-D2 (staging execution) vẫn 🔴 NOT STARTED / Owner-gated (checkpoint A).**
- **Deliverables:** new folder `CLAUDE_MARKETING_TEAM/07_runbooks/`:
  - `v2_manual_e2e_checklist.md` — purpose/scope; preflight PF1–PF8 (branch/build/test/no-secrets grep/no-connectors/Local-Data-Only badge/**PF8 hard gate: no SQL trừ khi checkpoint A logged**); manual scenario S1–S10 (client→brand→campaign→brief→generation/items→asset/collection→approval pending/generated→callback metadata-only→UUID gating) với scope/safety assertion; PC2 callback preview C1–C5; evidence capture table; stop conditions (SQL trước checkpoint A, secret exposure, connector activation, approval mutated by callback, tenant/scope mismatch, build/test fail); evidence guide (screenshot/log naming + result-summary/owner-sign-off/unresolved-issue templates).
  - `v2_demo_script.md` — 10–15 min owner demo, persona Vị Cuốn (fictional F&B), 10 beats narrator lines, "what NOT to claim" (no real posting/ads/connector/client data/callback-approved-anything/live model).
- **Status vocabulary verified vs contracts:** `ready_for_mock_callback_preview` (N8 approval-gate mock, `source: n8n_n8_approval_gate_mock`), `completed_mock` (N11 E2E `final_status` success), `failed_mock` (N11 module failure) — đều là real contract artifacts, không bịa.
- **PC2 status wording:** "paused at N11" → "N12 post-merge cleanup (integration-ready handoff, `stabilized_mock_ready`)" ở 6 chỗ status-label (CURRENT_PHASE, RUNBOOK ×2, SESSION_SUMMARY, phase_log finding-list, agent_activity_log). KHÔNG đổi PC2 callback contract — references tới `n11_e2e_dry_run` workflow giữ nguyên.
- **Approval safety preserved:** PC2 callbacks non-authoritative (validate/log/record metadata/echo existing Core decision/review notes only); generated stays generated, pending stays pending unless authenticated Core UI action; `completed_mock` ≠ approval shortcut.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ DONE (docs-only). Next: Owner/tester thực thi checklist §2–§4 + file evidence; V2-D2 chỉ bắt đầu sau checkpoint A.

---

### 🗓️ Ngày 12/06/2026 — V2-E2 Fix Round (Codex REQUIRED FIX) — T2/T3 callback non-authoritative ✅ DONE
- **Sự kiện:** Codex phát hiện mâu thuẫn contract trong `V2E2_CORE_PC2_DRY_RUN_INTEGRATION_PLAN.md`: T2/T3 (test plan §5) cho phép imported PC2 callback chuyển items/approvals sang `revision_requested`/`rejected` — trái với V2-E1 (approval decisions chỉ từ authenticated Core UI; PC2 decisions non-authoritative; PC2 callbacks không được đổi Core approval state) và trái với chính §4 rule 1 + T9 của plan.
- **Fix (docs-only):** (1) §4 viết lại thành 8 rules — rule 1 mở rộng: callback claiming BẤT KỲ approval state nào (`approved`/`rejected`/`needs_revision`) đều không transition gì, claim = callback metadata flagged cho human review; **"Imported PC2 callbacks cannot bypass or mutate Core approval decisions" stated explicitly**; rule 2 liệt kê 5 hành động DUY NHẤT callback được làm (validate payload consistency / log callback status / record output-error metadata / **echo decision đã tồn tại trong Core** — E6, mismatch ⇒ warning không apply / attach non-authoritative review notes); rule 3: mọi transition `revision_requested`/`rejected`/`approved` CHỈ từ authenticated Core UI action — không có code path từ ingest tới approval transition; rule 4: PC2 `needs_revision`/`rejected`-like status = review input, không phải transition — reviewer thấy recommendation + notes rồi tự quyết trong UI, không làm gì thì request giữ `pending`. (2) T2/T3 viết lại thành "non-authoritative echo" scenarios: ingest ACCEPTS as metadata only — items land `generated`, approval created/stays `pending`, **NO transition**; transition thật là manual step riêng của Owner/manager trong Approvals UI (verify riêng, ngoài ingest). (3) Thêm reading note dưới §4: các hàng needs_revision/rejected/approved trong bảng status V2-E1 §4 mô tả Core state SAU Core-UI decision (E6 flow) — KHÔNG reachable bằng import callback.
- **Diff:** docs only — plan + CURRENT_PHASE.md + SESSION_SUMMARY.md + 2 logs. **KHÔNG đổi product code/runtime/tests/repository/Supabase/auth/UUID/tenant/sanitizer/RLS/connector logic.**
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ Fix applied. V2-E3 vẫn 🔴 NOT STARTED, chờ checkpoint O1.

---

### 🗓️ Ngày 12/06/2026 — V2-E2 — Core ↔ PC2 Dry-run Integration Plan ✅ DONE (V2-E3 adapter skeleton 🔴 NOT STARTED, Owner-gated qua checkpoint O1)
*(Scope note: V2-E1 từng gọi "V2-E2" là dry-run implementation — Owner đã refine: V2-E2 = integration PLAN; implementation tách thành V2-E3→V2-E6, mỗi phase Owner-gated. Supersede bảng boundary V2-E1 §7.)*
- **Sự kiện:** Hoàn tất **dry-run integration plan giữa Core và PC2** dựa trên V2-E1 mapping spec (PASS tại `4407cf7`) + PC2 N12 handoff (PASS, no required fixes). **Planning/contract/test-design only — KHÔNG runtime n8n calls, KHÔNG outbound HTTP, KHÔNG secrets/env vars, KHÔNG live connector endpoints, KHÔNG real ads/posting/messaging/automation, KHÔNG đổi Supabase runtime/repository/auth/UUID gating/tenant scope/sanitizers/RLS; PC2 workflow files chỉ đọc làm reference.**
- **Constraint chốt (§0):** Core là static Vite frontend, KHÔNG có HTTP listener (Phase 18 verified zero direct network calls ngoài Supabase SDK; Group F tables unwired) → trong toàn bộ V2-E ladder, callback = **preview JSON artifact** từ PC2 N11, Core ingest qua **local dev-only manual import** (§1.6) — không bao giờ là live webhook. Webhook receiver thật (serverless + `WEBHOOK_SHARED_SECRET`) là future phase NGOÀI V2-E.
- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2E2_CORE_PC2_DRY_RUN_INTEGRATION_PLAN.md` — §1 architecture 9 thành phần (UI trigger không bao giờ auto-fire → adapter disabled-by-default → `n11_e2e_dry_run` router → 5 module stubs localhost → unified callback preview → local ingest chạy đủ 7 preconditions V2-E1 §2.5 → existing Approvals gate → AutomationLog audit trail với full correlation chain → failure/dead-letter log-only, retry chỉ ở PC2 side); §2 adapter requirements A1–A9 cho V2-E3 (pure `buildPc2Event`, `dry_run`+4 safety flags hard-coded constant `true` — builder throws nếu khác; idempotency_key = request_id + processed-keys ledger; UUID gating **reuse `repoRouting.ts` qua import, không sửa**; blocked events E7–E9 reject ở type level; kill-switch `VITE_PC2_DRYRUN_TOOLS` default-off mọi nơi kể cả Vercel); §3 PC2-side expectations (5 `*.requested` events, n11 + components, registry :8188/:8191–:8194, examples, validator `node contracts/tools/validate_contracts.js` ALL-PASS trước mỗi V2-E5 session, **partial_failure = Core-side classification** — PC2 cần bổ sung examples, tracked cùng 3 gaps V2-E1 §8); §4 callback safety (callback claiming `approved` vẫn land `generated`+`pending` kèm warning; failed_mock never enters approval; partial = logs + partial output; approved = human-approved-in-Core only; published = blocked/planning trừ future real-connector phase); §5 test plan **T1–T10** (success/needs_revision/rejected/failed_mock/partial_failure/duplicate-idempotency/local-ID-col-*/missing-tenant-scope + T9 approval-bypass attempt + T10 unknown request_id/bad source; T9–T10 mandatory cho V2-E4 closure, T1–T8 cho V2-E5); §8 implementation ladder **V2-E3 (adapter skeleton, zero HTTP code paths) → V2-E4 (local-only ingest test, pasted JSON) → V2-E5 (E2E mock endpoint only, localhost-only, cần O2+O3 trước outbound call đầu tiên) → V2-E6 (evidence pack `08_logs/v2e_dryrun_evidence_YYYYMMDD.md`)**; real connectors = future per-connector Owner-approved phases; §9 **checkpoints O1–O5** (trước env var / trước outbound HTTP / trước chạy n8n từ Core / trước Supabase staging — cũng cần V2-D checkpoint A / trước real connector — không phase V2-E nào được request O5); §10 non-goals.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ **V2-E2 DONE** (deliverable = integration plan doc). **V2-E3 🔴 NOT STARTED** — checkpoint O1 bắt buộc TRƯỚC khi thêm visibility flag/bắt đầu skeleton.

---

### 🗓️ Ngày 12/06/2026 — V2-E1 — Core ↔ PC2 Contract Mapping Spec ✅ DONE (V2-E2 dry-run implementation 🔴 NOT STARTED, Owner-gated)
*(Naming note: trong `PHASE_19_VER2_ROADMAP.md`, PC2 n8n dry-run vốn là roadmap-V2-C còn "V2-E" là UI polish — entry này theo naming của Owner: V2-E1 = mapping spec, V2-E2 = dry-run implementation.)*
- **Sự kiện:** Hoàn tất **mapping specification giữa Core và PC2 n8n/modules mock backbone** trước mọi runtime integration. **Documentation/contract mapping only — KHÔNG runtime integration, KHÔNG gọi n8n, KHÔNG secrets, KHÔNG live connectors, KHÔNG real ads/posting/messaging/automation, KHÔNG đổi Supabase runtime/repository/auth/UUID gating/tenant scope/sanitizers/RLS.**
- **Inputs:** PC2 N12 handoff (`contracts/pc2_validation_manifest.json` N1–N12 DONE/PASS `stabilized_mock_ready`; validator `node contracts/tools/validate_contracts.js` re-run 2026-06-12 — ALL CHECKS PASSED kể cả N12 compliance), `e2e_dry_run_v0.1` + `unified_callback_v0.1` + `error_retry_logging_v0.1` contracts, module registry 5 stubs, Core wired entities (Phases 16B–16D) + `repoRouting.ts` UUID gates.
- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2E_CORE_PC2_MAPPING_SPEC.md` — §1 events E1–E9 (5 routable → 5 stubs qua `n11_e2e_dry_run`; **E7–E9 publish/ads-spend/messaging BLOCKED, không có route**) + envelope extensions `core_scope` (client/brand/campaign/brief/generation/content_item/asset_collection, UUID hierarchy theo RLS), `mode.dry_run=true`, `approval_required=true`, safety flags `no_auto_post`/`no_real_ads`/`no_real_messaging`/`no_live_connectors` (hằng số `true`), `idempotency_key`, rule `col-*`/local ids không qua boundary; §2 callback `unified_callback_v0.1` + correlation (`request_id`/`run_id`/`workflow_id`/`module_id`/`idempotency_key`) + N9 error/retry/dead-letter + approval decision (**Core UI là nguồn approval duy nhất — PC2 echo non-authoritative**) + 7 acceptance preconditions; §4 unified status table (success/generated/pending_approval/needs_revision/rejected/approved/failed_mock/partial_failure + published/planned_publish blocked/planning-only) map sang job/item/approval statuses; §5 outputs → wired entities (Group F logs unwired → local AutomationLog surface; reports localStorage-only); §6 validation V1–V9 (**failed_mock never→approval; no callback bypasses approval**); §7 integration boundary (V2-E2 dry-run Owner-gated; real connectors = dedicated phase + per-connector sign-off); §8 PC2 handoff checklist + 3 gaps (validator extensions, callback auth TBD, brand_id strictness); §9 non-goals.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ **V2-E1 DONE** (deliverable = mapping spec docs). **V2-E2 🔴 NOT STARTED** — Owner approval bắt buộc TRƯỚC khi implement dry-run; real connector activation NGOÀI scope V2-E.

---

### 🗓️ Ngày 12/06/2026 — V2-D1 — Supabase Staging Audit & Runbook ✅ DONE (V2-D2 execution 🔴 NOT STARTED, Owner-gated)
*(Naming note: trong `PHASE_19_VER2_ROADMAP.md`, Supabase staging hardening vốn là roadmap-V2-B — entry này theo naming của Owner: V2-D1 = audit/runbook, V2-D2 = staging execution.)*
- **Sự kiện:** Hoàn tất **audit + staging hardening runbook** cho Supabase. **Audit/documentation/checklist only — KHÔNG live Supabase connection, KHÔNG secrets, KHÔNG production DB writes, KHÔNG live connectors/real ads/posting/messaging/automation, KHÔNG đổi runtime/repository/auth/UUID gating/tenant scope/sanitizers/RLS/tests.**
- **Audit:** rà soát 6 SQL/plan artifacts (`schema_v1.sql` 27 tables not-idempotent RLS-11-tables; `rls_policy_plan.md` Step-0 + bootstrap + 4 helper functions + 18 cross-tenant tests, dạng markdown; 4 extension migrations additive/idempotent/Codex-PASS), `supabaseClient.ts` gate, scoped repos + routing gates (45 tests), sanitizers, `.env.example`. **8 findings:** legacy-vs-wired table duality; user_roles lockout trap (RLS không policies → mọi user = viewer); roles RLS gap; 16/27 tables chưa RLS; client-feedback owner/manager-gated (by design, checkpoint C); Group F module/callback tables unwired (PC2 at N12 post-merge cleanup) — out of staging CRUD scope; Calendar/Reports không wired; mixed local/UUID ids = đúng thiết kế.
- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2D_SUPABASE_STAGING_HARDENING_RUNBOOK.md` — §1 readiness + findings + verdict; §2 staging vs local demo; §3 env vars + no-secrets rule; §4 V2-D2 checklists (M1–M10 migration order, RLS/tenant/UUID verification); §5 matrix 9 entities (clients→callback outputs) × scope fields × roles × hierarchy × RLS × ID rules; §6 seed plan (fictional only); §7 rollback/recovery; §8 6 safety boundaries; §9 risks R1–R9; §10 Owner checkpoints A–D; §11 handoff (V2-D2 DONE chỉ khi staging report filed + Owner approval logged).
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ **V2-D1 DONE** (deliverable = audit + runbook docs). **V2-D2 🔴 NOT STARTED** — checkpoint A (Owner approval) bắt buộc TRƯỚC khi tạo staging project hoặc apply SQL.

---

### 🗓️ Ngày 12/06/2026 — V2-C — Owner Rehearsal EXECUTED ✅ DONE / PASS
- **Sự kiện:** **Owner đã rehearse script 5 phút (§3) của `V2C_CLIENT_DEMO_PACKAGE.md` với UI flow thật.** Kết quả: **"ổn" / PASS** — 5-minute demo script verified, demo flow verified với UI hiện tại, **không có blocking demo issue nào được báo cáo**.
- **Closure conditions (cả 4 đã đạt):** (1) Owner rehearsal executed ✅; (2) kết quả ghi tại `08_logs/v2c_rehearsal_20260612.md` ✅; (3) **Owner approval ghi nhận cho controlled internal/demo use** ✅; (4) approval logged (CURRENT_PHASE.md + entry này) ✅.
- **Standing rule (không đổi bởi closure):** client-facing use vẫn **controlled** — mọi demo tôn trọng 5 safety boundaries: no auto-posting, no real ads, no real messaging, no live connectors, approval required before external use. Chạy lại §1 pre-demo checklist trước mỗi demo quan trọng.
- **Diff:** documentation only (status updates + rehearsal record) — **KHÔNG đổi product code/UI/runtime behavior/tests/repository/Supabase/auth/UUID gating/tenant scope/sanitizers/RLS/connectors.**
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (vẫn green như trước).
- **Trạng thái:** ✅ **V2-C DONE / PASS.** Còn mở: roadmap-V2-B Supabase staging (Owner-gated), V2-E polish, roadmap-V2-C n8n dry-run + V2-F (Owner-gated).

---

### 🗓️ Ngày 12/06/2026 — V2-C (Owner naming) — Client Demo Package 🟡 PACKAGE READY / REHEARSAL & OWNER APPROVAL PENDING *(superseded — closed DONE/PASS cùng ngày sau Owner rehearsal, xem entry trên)*
*(Naming note: trong `PHASE_19_VER2_ROADMAP.md`, client demo package vốn là V2-D còn roadmap-V2-C là PC2 n8n dry-run — entry này theo naming của Owner, giống tiền lệ V2-B.)*
- **Sự kiện:** Hoàn tất **phần materials** của Client Demo Package cho The Core Agency Core MVP. **V2-C CHƯA DONE/DELIVERED** — package đã sẵn sàng nhưng client-facing use chưa được approve. **Documentation/demo-material only — KHÔNG đổi product code/UI/runtime/repository/Supabase/auth/UUID gating/tenant scope/sanitizers/RLS/connectors/tests; không live automation/real ads/posting/messaging/secrets.**
- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2C_CLIENT_DEMO_PACKAGE.md` — 14 sections: §1 pre-demo checklist (P1–P10 + "never debug live"); §2 demo data/brand order (Cơm Tấm Bản Khói primary → Forme → Vị Cuốn; demo 1 brand sâu; không nhập real data của prospect); §3 script 5 phút (6 beats); §4 script 10 phút (10 beats, ~9:15, mở rộng từ V2-A §2); §5 screen-by-screen flow (17 steps, mỗi step có one-liner + "don't"); §6 positioning talking points; §7 giải thích sandbox/local data quanh badge "Local Data Only"; §8 bảng 5 safety boundaries (no auto-posting / no real ads / no real messaging / no live connectors / approval before external use); §9 FAQ 10 câu (trung thực về demo generation = simulation); §10 risks/limitations disclose honestly (9 items); §11 post-demo follow-up F1–F8; §12 next-step offer (2-week 1-brand pilot + 3 fallbacks); §13 one-page sales summary; §14 sign-off (Codex review accuracy → Owner rehearse + approve).
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.
- **Trạng thái:** 🟡 **PACKAGE READY / REHEARSAL & OWNER APPROVAL PENDING** (Codex required fix: không đánh DONE/DELIVERED khi chưa rehearse + approve). V2-C chỉ DONE/DELIVERED khi đủ cả 4: (1) Owner rehearse script §3/§4 trên live demo, (2) rehearsal notes/results ghi lại, (3) Owner approve cho controlled client/internal use, (4) approval được log. Trước đó KHÔNG dùng package trước mặt client.

---

### 🗓️ Ngày 12/06/2026 — V2-A — Manual Browser E2E EXECUTED by Owner ✅ DONE / PASS
- **Sự kiện:** Owner đã **thực thi manual browser E2E pass** theo checklist §1 (A1–A28) trong `V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md`. **Kết quả: PASS — không có blocking UI issue nào được báo cáo.** Demo script §2 được verify trong run-through của Owner.
- **Closure conditions (cả 4 đã đạt):** (1) checklist executed by Owner ✅; (2) kết quả ghi tại `08_logs/v2a_qa_report_20260612.md` (verdict PASS — demo-ready, no blockers) ✅; (3) demo script verified ✅; (4) Owner approval ghi nhận (Owner báo DONE / PASS) ✅.
- **Diff:** documentation only (status updates + QA report) — **KHÔNG đổi product code/UI/runtime behavior/tests/repository/Supabase/auth/UUID gating/tenant scope/sanitizers/RLS/connectors.**
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (vẫn green như trước).
- **Trạng thái:** ✅ **V2-A DONE / PASS.** Mở khóa V2-D (client demo package) và roadmap-V2-B (Supabase staging — vẫn cần Owner approval riêng trước khi bắt đầu).

---

### 🗓️ Ngày 12/06/2026 — V2-A — Manual Browser E2E + Demo Script 🟡 CHECKLIST READY / E2E PENDING *(superseded — closed DONE/PASS cùng ngày, xem entry trên)*
- **Sự kiện:** Hoàn tất **phần deliverable docs** của work package **V2-A** (Ver2 roadmap — recommended first). **V2-A CHƯA DONE** — checklist + demo script đã sẵn sàng nhưng manual browser E2E pass chưa được thực thi. **Documentation only — KHÔNG đổi product code/behavior/repository/Supabase/auth/UUID gating/tenant scope/sanitizers/RLS/connectors/tests; không live automation/real ads/posting/messaging/secrets.**
- **Deliverable:** `CLAUDE_MARKETING_TEAM/V2A_MANUAL_BROWSER_E2E_AND_DEMO_SCRIPT.md` — 4 phần:
  - **§1 Manual Browser E2E checklist (28 items A1–A28):** phủ app load/title/favicon/branding, login (Demo Sign In), Owner View, Client View toggle, Dashboard, Clients, Brands, Campaigns, Brief Intake, Content Generation, Content Calendar (verify overflow fix `bb8cb9e`), Approvals, Reports, Export Pack, Connector Registry, Automation Logs, Client Portal, Asset Library, Brand Workspace, New Campaign Brief, AI Team Board, Campaign Outputs, Approval Checklist, Client Presentation Pack, Client Workspace View, Manual Export Pack, Presentation & Export, cross-cutting console/network sweep. Mỗi item có: what to click / expected result / blocker definition / visual QA notes / safety notes.
  - **§2 Demo script 5–10 phút:** opening pitch → problem → solution → owner workspace → brand/campaign flow → AI team output → approval safety → client presentation/export → why no auto-posting/ads yet → closing CTA (pilot 2 tuần).
  - **§3 UI QA report template:** blocker bugs / visual polish / wording / responsive-mobile / deferred improvements + verdict.
  - **§4 Sign-off:** tester → PC1 fixes → Codex review → Owner accept → unlocks V2-D + roadmap-V2-B.
- Checklist viết theo UI thực tế (`src/App.tsx`: 24 tab ids; owner-only gating `new-campaign`/`team-board`/`manual-export`/`client-demo`/`automation-logs`; header badges + data-mode badge; LoginScreen demo credentials).
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS.
- **Trạng thái:** 🟡 **CHECKLIST READY / E2E PENDING** (Codex required fix: không đánh DONE khi pass chưa chạy). V2-A chỉ DONE khi đủ cả 4: (1) Owner/browser automation thực thi checklist §1, (2) kết quả ghi vào §3 QA report, (3) demo script §2 verify chạy thật, (4) Owner approval ghi nhận.

---

### 🗓️ Ngày 12/06/2026 — V2-B follow-up — Fix Content Calendar Horizontal Overflow ✅ DONE
- **Sự kiện:** Layout/presentation-only fix — Content Calendar rows tràn ngang ra ngoài content container. **KHÔNG đổi logic/data flow/repository/Supabase/auth/UUID gating/tenant scope/sanitizers/RLS/tests/connectors.**
- **Root cause:** `<main>` là grid item `1fr` trong layout `260px 1fr` (App.tsx) với default `min-width: auto` — nội dung nowrap/unbroken text đẩy track vượt viewport.
- **Fix:** (1) `<main>` thêm `minWidth: 0, maxWidth: '100%'` — fix gốc, áp dụng cho MỌI tab; (2) ContentCalendarTab: `ItemDetail` fieldStyle thêm `wordBreak: 'break-word'` (caption/hashtags/visual brief dài không phá layout), breadcrumb expanded thêm ellipsis; (3) ApprovalsTab fieldStyle thêm `wordBreak: 'break-word'` (cùng pattern thiếu); (4) ExportPackTab preview column thêm `minWidth: 0` (defensive).
- **Đã rà soát:** Content Generation / Reports / Export Pack / Asset Library — các pattern còn lại đều an toàn (nowrap luôn kèm ellipsis+overflow hidden, pre có overflowX auto + break-word, grid auto-fill/minmax).
- **Build:** PASS — 0 TS errors (1575 modules). `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ DONE.

---

### 🗓️ Ngày 12/06/2026 — V2-B follow-up — Core Logo Branding + Favicon + Sidebar Alignment ✅ DONE
- **Sự kiện:** Presentation-only branding polish — đưa logo The Core Agency mới vào UI + favicon, fix sidebar nav alignment. **KHÔNG đổi logic/behavior/repository/Supabase/auth/UUID gating/tenant scope/sanitizers/RLS/tests/connectors.**
- **Brand assets (mới):** `public/brand/core-logo-horizontal.png` (logo ngang đã trim margins), `public/brand/core-icon.png` (hexagon C mark crop vuông), `public/favicon.png` (128px) — generate từ logo asset Owner cung cấp bằng script crop/resize cục bộ.
- **UI:** header thay pulsing dot bằng logo chip 42px (`.brand-mark` — bo góc 10px + orange glow shadow); LoginScreen thêm icon 64px phía trên title; `index.html` favicon ⚡ emoji → `/favicon.png`; title giữ "The Core Agency"; visible naming giữ "THE CORE AGENCY" + subtitle "AI Marketing Team Workspace". Verified không còn legacy names trong visible UI (chỉ còn localStorage keys nội bộ — đổi sẽ wipe data, ngoài scope).
- **Sidebar fix:** rule chung `aside.glass-panel .btn` — `text-align: left` (fix wrapped labels bị center do button default), `line-height: 1.3`, `font-size: 0.9rem`, `padding: 10px 14px`; `svg { flex-shrink: 0 }` giữ icon cố định. Active/hover/orange accent giữ nguyên; sidebar không rộng thêm.
- **Build:** PASS — 0 TS errors (1575 modules); assets copy vào `dist/`. `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ DONE.

---

### 🗓️ Ngày 12/06/2026 — V2-B follow-up — Decorative Background/Light Treatment ✅ DONE
- **Sự kiện:** Follow-up presentation-only của V2-B UI Polish — thêm background decoration hiện đại để dark UI bớt phẳng. **CSS-only, static — KHÔNG animation/particles/canvas; KHÔNG đổi logic/behavior/repository/Supabase/auth/UUID gating/tenant scope/sanitizers/RLS/tests.**
- **Treatment (shared, trong `src/index.css`):** hai fixed pseudo-layers `body::before`/`body::after` (z-index −1, pointer-events none) phía sau toàn bộ content — (1) gradient navy `#0B1120`→`#070A0F` + brand orange glow (trên-trái, echo dưới-phải) + navy/blue glow rất nhạt + vignette viền; (2) grid 56px + grain SVG tĩnh (opacity 4%), mask radial fade về nửa dưới màn hình. `.glass-panel` thêm inset top highlight 1px để panel "nổi" khỏi nền.
- **Unify:** LoginScreen + auth loading screen chuyển background sang `transparent` để dùng shared shell decoration (bỏ radial glow riêng của LoginScreen — tránh duplicate per-page).
- **Build:** PASS — 0 TS errors (1575 modules). `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ DONE.

---

### 🗓️ Ngày 11/06/2026 — V2-B (Owner-directed) — Premium Dark SaaS UI Polish ✅ DONE
*(Naming note: Owner gọi task này là "V2-B — Premium Dark SaaS UI Polish". Trong `PHASE_19_VER2_ROADMAP.md`, UI polish vốn được liệt kê là V2-E còn V2-B là Supabase staging — entry này theo naming của Owner.)*
- **Sự kiện:** Hoàn tất UI polish theo phong cách premium dark AI SaaS cho The Core Agency. **UI/CSS/theme/label only — KHÔNG đổi product behavior, data flow, repository logic, Supabase, UUID gating, tenant scope, sanitizers, RLS, auth, tests.**
- **Theme mới:** token system trong `src/index.css` — nền #070A0F, surface #0F172A/#111827/#151F32, border rgba(255,255,255,0.08), **Brand Orange #F47A1F** (hover #E7680B, glow rgba(244,122,31,0.22)) thay thế indigo; semantic success/warning/error/info. Legacy var names (`--accent-indigo`…) giữ làm alias trỏ sang token mới nên toàn bộ ~1.950 inline styles tự ăn theme.
- **Color sweep:** toàn bộ literal indigo trong src (`#818cf8`→`#fb923c`, `#6366f1`→`#f47a1f`, `rgba(99,102,241,*)`→`rgba(244,122,31,*)`, `rgba(129,140,248,*)`→`rgba(251,146,60,*)`) — 19 files. Category/data-viz colors (`#a78bfa` hashtags/Instagram, blues, emerald, amber) giữ nguyên semantics.
- **Polish:** Inter font (Google Fonts + font stack); buttons (primary orange gradient + hover/active/disabled/focus-visible), form focus ring orange glow, glass cards radius 18px, tabs/scrollbar/selection orange, spinner + skeleton utilities; header title gradient trắng→cam; auth loading screen có spinner; LoginScreen glass card + orange glow + solid orange submit; badge `badge-indigo`→`badge-brand`.
- **Build:** PASS — 0 TS errors (`tsc && vite build`, 1575 modules). `npm run test`: 45/45 PASS.
- **Trạng thái:** ✅ DONE.

---

### 🗓️ Ngày 11/06/2026 — Naming cleanup: "Phase 19" → Post-MVP / Ver2 Planning workstream
- **Sự kiện:** Làm rõ naming sau khi đóng Core MVP. **Core MVP = 18/18 phases, CLOSED — Phase 18 là phase MVP cuối cùng; không thêm MVP phase nào nữa.** Công việc "Phase 19" trước đó được reframe thành **Post-MVP / Ver2 Planning workstream**; work packages "19A–19F" đổi tên thành **V2-A…V2-F**.
- **Docs cập nhật:** `PHASE_19_VER2_ROADMAP.md` (thêm naming clarification + đổi 19A–19F → V2-A…V2-F; giữ filename để không vỡ link), `CURRENT_PHASE.md` (header: "CORE MVP CLOSED — 18/18 PHASES COMPLETE | Next workstream: Post-MVP / Ver2 Planning"), `SESSION_SUMMARY.md`, hai log files.
- **Build:** PASS — 0 TS errors. `npm run test`: 45/45 PASS (docs-only diff, không đổi product code).

---

### 🗓️ Ngày 11/06/2026 — Ver2 Planning (Post-MVP) — Roadmap DONE
*(Naming note: entry này ban đầu ghi là "Phase 19" — đã retire; Core MVP dừng ở 18 phases. Đây là Ver2/Post-MVP workstream.)*
- **Sự kiện:** Hoàn tất roadmap Ver2 sau khi đóng Core MVP. **Documentation/planning only** — không đổi product code, không connector, không secrets, không live automation.
- **Deliverable:** `CLAUDE_MARKETING_TEAM/PHASE_19_VER2_ROADMAP.md`:
  - Bảng scope options (risk level + dependencies): E2E pass, demo prep, Supabase staging, PC2 n8n dry-run, UI polish, connector readiness plan.
  - Priority order: V2-A trước tiên → V2-B (+ V2-D song song) → V2-E filler → V2-C/V2-F cuối + Owner-gated. Items rủi ro cần Owner approval trước khi bắt đầu: SQL lên live DB (kể cả staging), n8n dry-run, connector activation, real client data.
  - Work-package breakdown V2-A…V2-F — mỗi package có goal / deliverables / files / safety rules / checks / Codex review focus / Owner checkpoint.
  - Standing Ver2 safety rules: không real ads/posting/messaging/automation; không secrets; production Supabase OFF; UUID gating/tenant scope/sanitizers/RLS là load-bearing; FnB OS V1 untouched.
- **Build:** PASS — 0 TS errors (`tsc && vite build`, 1575 modules). `npm run test`: 45/45 PASS (docs-only diff).
- **Recommended first Ver2 work package:** **V2-A — Manual Browser E2E Pass + Demo Script Verification** (zero risk, không cần approval để bắt đầu, đóng verification gap cuối của MVP, gate cho V2-B/V2-D).
- **Trạng thái:** ✅ DONE. Chờ Owner go-ahead cho V2-A.

---

### 🗓️ Ngày 11/06/2026 — 🏁 CORE MVP CLOSED (Phases 1–18)
- **Sự kiện:** Đóng chính thức chu kỳ build Core MVP (Phase 1–18). Documentation only — không đổi product code, runtime behavior, hay connector state.
- **Closure report:** `CLAUDE_MARKETING_TEAM/CORE_MVP_CLOSURE_REPORT.md` — tổng hợp: MVP bao gồm gì; những gì cố ý CHƯA bật (real ads/posting/messaging/connectors/AI/file storage/production Supabase/secrets); safety status; build/test status; known limitations; recommended next roadmap.
- **Final reviewed product commit:** `fd86ead` (Phase 18 — Codex PASS).
- **Build:** PASS — 0 TS errors (`tsc && vite build`, 1575 modules). `npm run test`: 45/45 PASS.
- **Approved scope:** controlled internal testing / controlled client demo. Mọi thứ vượt scope này (live data, live connectors, real client accounts) yêu cầu phase mới + Owner approval.
- **Recommended next:** (1) Post-MVP / Ver2 planning → (2) client demo prep → (3) Supabase staging hardening → (4) PC2 n8n/modules workstream → (5) UI/brand polish → (6) gated real-connector plan.
- **Trạng thái:** 🏁 CORE MVP CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 18 CLOSED: Final MVP Polish + Production Readiness
- **Sự kiện:** Phase 18 hoàn tất — polish UI label mức rủi ro thấp + xác minh production readiness. Không đổi logic/routing/repository/sanitizer/SQL.
- **Scope hoàn thành:**
  - Gỡ "FnB OS V1: NO" khỏi sidebar Safety Guard và "FnB OS V1 Touched: NO" khỏi Dashboard sandbox grid (gây nhầm lẫn cho demo viewer; FnB OS V1 không bị đụng tới).
  - Header badge "Real Operations MVP — Phase 14" → "Core MVP — Internal Demo"; thêm data-mode badge mới "Local Data Only" / "Supabase Data" (dựa trên `isSupabaseConfigured` có sẵn, kèm tooltip giải thích).
  - Gỡ số phase nội bộ cũ khỏi label hiển thị: ApprovalsTab, ContentCalendarTab, AssetLibraryTab, AutomationLogsTab, ConnectorRegistryTab, ReportsTab, ExportPackTab, BriefIntakeTab. Code comment và sample log `[Mock]` giữ nguyên.
  - Xác minh lại an toàn: secrets grep clean; chỉ `.env.example` được track; 0 direct network call trong `src/` (Supabase SDK là network client duy nhất, `null` khi không có env); không real ads/posting/messaging/connectors.
  - Doc mới: `07_docs/MVP_READINESS_CHECKLIST.md` — verdict + bảng bằng chứng an toàn + bảng safeguard intact + remaining risks.
- **Build:** PASS — 0 TS errors (`tsc && vite build`, 1575 modules). `npm run test`: 45/45 PASS.
- **Verdict:** ✅ Core MVP READY cho internal testing / controlled client demo. ❌ CHƯA ready cho live automation, real publishing/ads/messaging, real client data trên Supabase, file upload.
- **Trạng thái:** ✅ CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 17 CLOSED: End-to-end Workflow Test
- **Sự kiện:** Phase 17 hoàn tất — thêm vitest unit tests cho repository routing gates + patch sanitizers, và manual MVP E2E workflow checklist.
- **Scope hoàn thành:**
  - `vitest` thêm vào devDependencies, `npm run test` / `npm run test:watch` (zero config — chạy trên `node` environment mặc định của vitest 3.x).
  - Trích xuất nguyên văn UUID-gating predicates từ `assetRepoFor()`/`approvalRepoFor()` trong `App.tsx` sang `src/lib/core/repoRouting.ts` (`assetScopeIsSupabaseSafe`, `approvalScopeIsSupabaseSafe`, `okOrAbsentUuid`) — `App.tsx` chỉ còn import + gọi, behavior không đổi.
  - `src/lib/core/repoRouting.test.ts` (34 tests): full UUID chain → true, mọi local-format id ở từng cấp scope → false, optional ids absent (undefined/null) → true, và case Codex Fix Round 2 (current `asset_collection_id` local + next collection null/UUID → vẫn false, ở lại localStorage).
  - `src/lib/core/coreRepository.test.ts` (11 tests): `sanitizeAssetPatch`/`sanitizeGenerationPatch`/`sanitizeBriefPatch` strip toàn bộ immutable fields (snake_case + camelCase) nhưng giữ field editable (gồm `asset_collection_id`); `isUuid`/`generateId`.
  - Manual E2E checklist mới: `CLAUDE_MARKETING_TEAM/08_logs/phase_17_e2e_checklist.md` — full workflow Client→Brand→Campaign→Brief→Generation→Approval→Asset Library + UUID-gating fallback ở cả 2 mode (Local/Demo và Supabase-configured). Phần UI/browser deferred — không có browser tool trong session này.
- **Build:** PASS — 0 TS errors (`tsc && vite build`, 1575 modules). `npm run test`: 45/45 PASS. Secrets grep clean.
- **Trạng thái:** ✅ CLOSED. Pure refactor + test addition, không đổi behavior.

---

### 🗓️ Ngày 11/06/2026 — Phase 16D CLOSED: Codex PASS
- **Sự kiện:** Phase 16D chính thức đóng sau Codex PASS (2 vòng Codex required-fix).
- **Scope hoàn thành:** Supabase CRUD repository wiring cho Asset Library only (Calendar/Reports/Connector Inbox/Automation Logs không đổi).
- **Tổng kết:**
  - Asset Library CRUD wired to Supabase with localStorage fallback.
  - Asset operations scoped by clientId, brandId, campaignId, briefId, generationId/contentItemId/assetCollectionId where applicable.
  - assetId and assetCollectionId UUID-gated before Supabase routing — local col-*/collection-*/asset-collection-* IDs route to localStorage.
  - handleAssetEdit gates both current and next assetCollectionId.
  - RLS validates content_asset_hierarchy_is_valid() including asset_collection_id (7th param).
  - Read-only/client/viewer roles cannot write/archive/delete.
  - Production Supabase env remains OFF.
  - Demo Sign In remains.
  - No secrets or service role key.
- **Build:** PASS — 0 TS errors (`tsc && vite build`, 1574 modules). Secrets grep clean.
- **Codex result:** PASS.
- **Commits:** `b598844` (feat: wire asset library crud with scoped fallback) → `a9c6644` (fix: harden asset collection uuid routing and scope) → `ec0178b` (fix: gate current asset collection id on edit)
- **Known future consideration:** real file storage/upload chưa enable — phase này chỉ wire asset metadata CRUD an toàn.
- **Trạng thái:** ✅ CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-2 CLOSED: Codex PASS
- **Sự kiện:** Phase 16C-2 chính thức đóng sau Codex PASS (1 vòng Codex required-fix).
- **Scope hoàn thành:** Supabase CRUD repository wiring cho Approval only (Calendar/Reports/Asset Library/Connector Inbox/Automation Logs không đổi).
- **Tổng kết:**
  - Approval CRUD wired to Supabase with localStorage fallback.
  - Approval operations fully scoped by clientId + brandId + campaignId + briefId + generationId/contentItemId where applicable.
  - approvalId/contentItemId/local IDs are UUID-gated before Supabase routing — local IDs never sent into Supabase UUID columns.
  - RLS validates full tenant/content hierarchy: client_id → brand_id → campaign_id → brief_id → generation_id → content_item_id.
  - Read-only/client/viewer roles cannot insert approval comments/events (owner/manager only).
  - Production Supabase env remains OFF.
  - Demo Sign In remains.
  - No secrets or service role key.
- **Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (chỉ CRLF warnings).
- **Codex result:** PASS.
- **Commits:** `871c3d0` (feat: wire approval crud with scoped fallback) → `70f8b8a` (fix: harden approval uuid routing and rls hierarchy)
- **Known future consideration:** real client feedback (ClientViewTab "Add Feedback") trong Supabase sẽ cần feedback role/policy riêng ở phase sau.
- **Trạng thái:** ✅ CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-1 CLOSED: Codex PASS
- **Sự kiện:** Phase 16C-1 chính thức đóng sau Codex PASS (sau 2 vòng Codex required-fix).
- **Scope hoàn thành:** Supabase CRUD repository wiring cho Content Plan Generation only (Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs không đổi).
- **Tổng kết:**
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
- **Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (chỉ CRLF warnings).
- **Codex result:** PASS.
- **Commits:** `77987ab` (feat: wire generation crud to supabase) → `db0819b` (fix: harden generation crud tenant scope) → `c81b069` (fix: tighten generation rls role permissions) → `0876162` (fix: enforce generation rls brief hierarchy)
- **Trạng thái:** ✅ CLOSED.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-1 Codex Fix Round 2: RLS Role Permissions + Brief Hierarchy
- **Sự kiện:** Áp dụng 2 fix bắt buộc theo yêu cầu Codex review vòng 2 cho Phase 16C-1, build PASS, Codex PASS.
- **Fix 1 (role permissions + active/unexpired):** `content_plan_user_has_scope()` trước cho phép mọi role scoped (kể cả `client`/`viewer` chỉ-đọc) INSERT/UPDATE, và không kiểm tra `is_active`/`expires_at`. Sửa: yêu cầu `ur.is_active = TRUE AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`, thêm tham số `p_roles role_name[]`. Hàm mới `content_plan_user_can_write()` giới hạn còn `['owner','manager']`. Policy tách: SELECT = mọi role active/unexpired/in-scope; INSERT/UPDATE (kể cả chuyển trạng thái `archived`) = chỉ owner/manager.
- **Fix 2 (brief_id + hierarchy validation):** helper/policy trước thiếu `brief_id`, OR-based scope check có thể authorize row có `client_id`/`brand_id`/`campaign_id`/`brief_id` không khớp cùng 1 hierarchy. Sửa: thêm `content_plan_hierarchy_is_valid(client_id, brand_id, campaign_id, brief_id)` — SECURITY DEFINER/STABLE, validate cả 4 id theo đúng chuỗi FK thật `clients → brands → campaigns → campaign_briefs`. AND vào `content_plan_user_has_scope()`. `brief_id` nay có mặt trong mọi helper signature/call và mọi policy (SELECT/INSERT/UPDATE USING/WITH CHECK) cho cả `content_plan_jobs` và `content_plan_items`.
- **An toàn:** additive, idempotent (`DROP POLICY/FUNCTION IF EXISTS` trước `CREATE OR REPLACE`), không anon/broad access, không secrets/service role key, Supabase env OFF, Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs không đổi.
- **Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (chỉ CRLF warnings).
- **Codex result:** PASS.
- **Commits:** `c81b069` (fix: tighten generation rls role permissions) → `0876162` (fix: enforce generation rls brief hierarchy)
- **Trạng thái:** ✅ CLOSED — Phase 16C-1 hoàn tất.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-1 Codex Fix: Harden Generation Tenant Scope
- **Sự kiện:** Áp dụng 4 fix bắt buộc theo yêu cầu Codex review cho Phase 16C-1, build PASS, đang chờ Codex re-review.
- **Fix 1 (item read thiếu tenant scope):** `get()` ở cả 2 repo trước đây lấy `content_plan_items` chỉ filter bằng `generation_job_id`. Sửa: thêm filter `client_id`/`brand_id`/`campaign_id`/`brief_id` vào query items (Supabase: thêm 4 `.eq()`; localStorage: thêm 4 điều kiện vào `filter()`).
- **Fix 2 (thiếu `archive()` scoped):** `GenerationRepository` chưa có `archive()`, không giống `CampaignRepository.archive(params: CampaignScopedParams)`. Sửa: thêm `archive(params: GenerationScopedParams): Promise<void>` — bắt buộc cả 5 ID (`clientId`+`brandId`+`campaignId`+`briefId`+`generationId`). Cả `SupabaseGenerationRepository` và `LocalStorageGenerationRepository` implement bằng `update(params, { status: 'archived' })` (mirror `LocalStorageCampaignRepository.archive`). Không thể gọi bằng `generationId` một mình.
- **Fix 3 (sanitizer thiếu camelCase + audit fields):** `GENERATION_IMMUTABLE_PATCH_FIELDS` trước chỉ có snake_case `id`/`client_id`/`brand_id`/`campaign_id`/`brief_id`/`created_at`/`updated_at`/`requested_by`. Sửa: mở rộng thêm cả camelCase và các field ownership/audit khác — `clientId`, `brandId`, `campaignId`, `briefId`, `createdAt`, `updatedAt`, `requestedBy`, `submitted_by`/`submittedBy`, `submitted_at`/`submittedAt`, `archived_at`/`archivedAt`, `archive_at`/`archiveAt`, `deleted_at`/`deletedAt`, `owner_id`/`ownerId`, `tenant_id`/`tenantId`, `organization_id`/`organizationId`, `user_id`/`userId`. `sanitizeGenerationPatch()` nhận `Partial<ContentPlanJob> & Record<string, unknown>` để strip các field này tại runtime.
- **Fix 4 (RLS enable nhưng chưa có policy):** Migration trước chỉ `ENABLE ROW LEVEL SECURITY`, chưa có policy nào (chỉ service_role truy cập được). Sửa: thêm function `content_plan_user_has_scope(p_client_id, p_brand_id, p_campaign_id)` (`SECURITY DEFINER`, `search_path = public` cố định) kiểm tra bảng `user_roles(user_id, resource_type, resource_id)` có sẵn — `auth.uid()` có role `'global'`, hoặc role `'client'`/`'brand'`/`'campaign'` khớp tenant ID của row. Thêm policy `SELECT`/`INSERT`/`UPDATE` tenant-scoped cho cả `content_plan_jobs` và `content_plan_items` (mỗi policy bọc trong `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`). `auth.uid()` là `NULL` với anon, `user_roles.user_id` là `NOT NULL` → anon không bao giờ match, không có public access. Cả 2 bảng mới hoàn toàn (migration này) → không cần backfill.
- **Tenant scope:** không đổi ngoài các fix trên — `list`/`get`/`update`/`archive` vẫn yêu cầu `clientId`+`brandId`+`campaignId`+`briefId`(+`generationId`); local ID vẫn không bao giờ gửi lên Supabase.
- **An toàn:** Supabase env OFF · không secrets · không service role key · Demo Sign In preserved · localStorage fallback preserved · Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs không đổi.
- **Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (chỉ CRLF warnings).
- **Trạng thái:** Codex Fix applied — chờ Codex re-review.

---

### 🗓️ Ngày 11/06/2026 — Phase 16C-1: Content Plan Generation CRUD Wiring (Implemented — chờ Codex review)
- **Sự kiện:** Phase 16C-1 đã triển khai xong, build PASS, đang chờ Codex review.
- **Bảng mới (additive):** `schema_v1.sql` có sẵn `generation_jobs`/`content_items` (Phase-15-planned, scope theo campaign_id only, app không dùng) — giữ nguyên không đụng tới. Migration mới `03_core/database/schema_v1_phase16c1_generation_extension.sql` tạo `content_plan_jobs` + `content_plan_items` khớp với type `ContentPlanJob`/`ContentPlanItem` (Phase 6): 3 enum (`content_plan_job_status`, `content_plan_item_status`, `content_plan_generation_mode`), cả 2 bảng có `client_id`/`brand_id`/`campaign_id`/`brief_id` UUID FK, `plan_length_days CHECK (IN (7,15,30))`, `requested_by TEXT`, 7 index, trigger `updated_at` qua `set_updated_at()` có sẵn, RLS enable (chưa có policy). Idempotent, chưa apply lên DB live nào.
- **Tenant-scope contract:** `GenerationRepository.list({ clientId, brandId, campaignId, briefId })` — cả 4 ID bắt buộc, trả về `{ jobs, items }`. `get`/`update({ ...same, generationId }, ...)` — cả 5 ID bắt buộc. **Không có method nào nhận `generationId` một mình** — không get/update/archive/list bằng generationId alone. Supabase queries luôn `.eq('client_id', ...).eq('brand_id', ...).eq('campaign_id', ...).eq('brief_id', ...)` (+ `.eq('id', generationId)` cho get/update trên `content_plan_jobs`, `.eq('generation_job_id', ...)` cho `content_plan_items`). `LocalStorageGenerationRepository` filter tương tự. TypeScript enforce tại compile time — unscoped calls không type-check.
- **`create(data)`:** gọi `generateContentPlan()` để sinh mock plan/items, sau đó insert vào `content_plan_jobs`/`content_plan_items` — không bao giờ gửi local `job-*`/`item-*`/`generation-*` ID, DB tự generate UUID, row trả về dùng để update React state.
- **Sanitizer:** `GENERATION_IMMUTABLE_PATCH_FIELDS = ['id','client_id','brand_id','campaign_id','brief_id','created_at','updated_at','requested_by']` + `GenerationUpdatePatch`/`sanitizeGenerationPatch()` chặn các field này trong mọi `update()` (mirror Phase 16B-2 Codex Fix 2).
- **App.tsx / ContentGenerationTab.tsx:** generation jobs/items load per-brief sau khi campaigns + briefs load xong; thêm `handleGenerationCreate` (derive scope từ campaign cha của brief). `ContentGenerationTab` dùng async `onGenerate` prop, `handleGenerate` rewritten từ sync `setTimeout` sang `await onGenerate(...)`, thêm `genError` state + error banner; xoá import `generateContentPlan` trực tiếp (không còn dùng).
- **An toàn:** Supabase env OFF · không secrets · không service role key · Demo Sign In preserved · localStorage fallback preserved · Calendar/Approval/Reports/Asset Library/Connector Inbox/Automation Logs không đổi.
- **Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (chỉ CRLF warnings).
- **Trạng thái:** Implemented — chờ Codex review.

---

### 🗓️ Ngày 10/06/2026 — Phase 16B-2 CLOSED: Codex PASS
- **Sự kiện:** Phase 16B-2 chính thức đóng sau Codex PASS.
- **Scope hoàn thành:** Supabase CRUD repository wiring cho Campaign Briefs only (Generation/Calendar/Approval/Reports/Asset Library không đổi).
- **Tenant-scope contract cuối:** `BriefRepository.list({ clientId, brandId, campaignId })` — cả 3 ID bắt buộc. `get`/`update({ clientId, brandId, campaignId, briefId }, ...)` — cả 4 ID bắt buộc. Supabase queries luôn `.eq('client_id', ...).eq('brand_id', ...).eq('campaign_id', ...)` (+ `.eq('id', briefId)` cho get/update). `LocalStorageBriefRepository` filter tương tự. TypeScript enforce tại compile time.
- **`create(data)`:** không bao giờ gửi local `brief-*` ID — DB tự generate UUID. Không có `archive()` — `status: 'archived'` đạt được qua `update()`.
- **Migration:** `schema_v1_phase16b2_brief_extension.sql` — thêm `brief_status` enum, `client_id`/`brand_id`/`status` + 13 cột brief-detail, backfill `client_id`/`brand_id` từ `campaigns` trước khi enforce `NOT NULL`. Idempotent, chưa apply lên DB live nào.
- **Sanitizer:** `BriefUpdatePatch` type + `sanitizeBriefPatch()` chặn `id`/`client_id`/`brand_id`/`campaign_id`/`created_at`/`updated_at`/`submitted_by`/`submitted_at` trong mọi `update()` (cả Supabase và localStorage).
- **An toàn:** Supabase env OFF · không secrets · không service role key · Demo Sign In preserved · localStorage fallback preserved · Generation/Calendar/Approval/Reports/Asset Library không đổi.
- **Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (chỉ CRLF warnings).
- **Codex result:** PASS.
- **Commits:** `1e3e664` (feat: add phase 16b2 brief repository wiring) → `4a5ce38` (fix: backfill and sanitize campaign brief updates)
- **Trạng thái:** ✅ CLOSED.

---

### 🗓️ Ngày 10/06/2026 — Phase 16B-2 Codex Fix 1+2: Migration backfill + brief update sanitizer
- **Sự kiện:** Áp dụng 2 fix theo yêu cầu Codex review cho Phase 16B-2, build PASS, đang chờ Codex re-review.
- **Fix 1 (migration backfill):** `schema_v1_phase16b2_brief_extension.sql` trước đây thêm `client_id`/`brand_id` là `NOT NULL` ngay lập tức — các brief hiện có sẽ có giá trị NULL, vi phạm constraint và biến mất khỏi mọi query scoped mới. Sửa: (1) thêm `client_id`/`brand_id` dạng nullable; (2) backfill từ `campaigns` bằng `UPDATE campaign_briefs b SET client_id = c.client_id, brand_id = c.brand_id FROM campaigns c WHERE b.campaign_id = c.id AND (b.client_id IS NULL OR b.brand_id IS NULL)`; (3) khối `DO $$` chỉ `ALTER COLUMN ... SET NOT NULL` nếu sau backfill không còn row nào thiếu tenant ref — nếu còn (campaign_id mồ côi), `RAISE NOTICE` liệt kê các brief id bị ảnh hưởng, giữ cột nullable, không enforce NOT NULL (tránh đoán/làm sai tenant). Idempotent.
- **Fix 2 (sanitize update patch):** `LocalStorageBriefRepository.update` trước đây spread `patch` trực tiếp vào row (`{ ...b, ...patch, updated_at: now }`), cho phép patch ghi đè `client_id`/`brand_id`/`campaign_id`/`id`/`created_at`/`submitted_by`/`submitted_at`. `SupabaseBriefRepository.update` chỉ strip `id`/`created_at`/`client_id`/`brand_id`/`campaign_id`, chưa chặn `submitted_by`/`submitted_at`/`updated_at`. Sửa: thêm type `BriefUpdatePatch` (`Partial<Omit<CampaignBrief, 'id'|'client_id'|'brand_id'|'campaign_id'|'created_at'|'updated_at'|'submitted_by'|'submitted_at'>>`) và hàm runtime `sanitizeBriefPatch()` trong `coreRepository.ts`. Cả `LocalStorageBriefRepository.update` và `SupabaseBriefRepository.update` đều gọi `sanitizeBriefPatch(patch)` trước khi merge/gửi đi — không repo nào còn cho phép đổi tenant/identity/audit field qua `update()`.
- **Tenant scope:** không đổi — `list`/`get`/`update` vẫn yêu cầu `clientId`+`brandId`+`campaignId`(+`briefId`); Supabase queries vẫn `.eq('client_id', ...).eq('brand_id', ...).eq('campaign_id', ...)` (+ `.eq('id', briefId)` cho get/update).
- **An toàn:** Supabase env OFF · không secrets · không service role key · Demo Sign In preserved · localStorage fallback preserved (sanitizer áp dụng cả 2 repo).
- **Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (chỉ CRLF warnings).
- **Trạng thái:** Codex Fix 1+2 applied — chờ Codex re-review.

---

### 🗓️ Ngày 10/06/2026 — Phase 16B-2: Campaign Briefs CRUD Wiring (Implemented — chờ Codex review)
- **Sự kiện:** Phase 16B-2 đã triển khai xong, build PASS, đang chờ Codex review.
- **Schema gap:** `schema_v1.sql` thiếu `client_id`/`brand_id`/`status` + 13 cột brief-detail mà Phase 5 đã thêm vào `CampaignBrief` TS type/UI nhưng chưa migrate xuống DB. Migration bổ sung (additive, idempotent): `03_core/database/schema_v1_phase16b2_brief_extension.sql` (enum `brief_status` + các cột + 2 index) — chưa apply lên DB live nào.
- **Tenant-scope contract:** `BriefRepository.list({ clientId, brandId, campaignId })` — cả 3 ID bắt buộc. `get`/`update({ clientId, brandId, campaignId, briefId }, ...)` — cả 4 ID bắt buộc. Supabase queries luôn `.eq('client_id', ...).eq('brand_id', ...).eq('campaign_id', ...)` (+ `.eq('id', briefId)` cho get/update). `LocalStorageBriefRepository` filter tương tự. TypeScript enforce tại compile time — unscoped calls không type-check.
- **`create(data)`:** không bao giờ gửi local `brief-*` ID — DB tự generate UUID, row trả về dùng để update React state. Không có `archive()` — `status: 'archived'` đạt được qua `update()` (UI không có nút Archive).
- **App.tsx / BriefIntakeTab.tsx:** briefs load per-campaign sau khi campaigns load xong; thêm `handleBriefCreate`/`handleBriefUpdate`, xoá `handleCoreUpdate` (không còn dùng); `BriefIntakeTab` dùng async `onBriefCreate`/`onBriefUpdate` với `formLoading`/`actionError`.
- **An toàn:** Supabase env OFF · không secrets · không service role key · Demo Sign In preserved · localStorage fallback preserved · Generation/Calendar/Approval/Reports/Asset Library không đổi.
- **Build:** PASS — 0 TS errors (`tsc && vite build`). `git diff --check`: PASS (chỉ CRLF warnings).
- **Trạng thái:** Implemented — chờ Codex review.

---

### 🗓️ Ngày 10/06/2026 — Phase 16B-1 CLOSED: Codex PASS
- **Sự kiện:** Phase 16B-1 chính thức đóng sau Codex PASS.
- **Scope hoàn thành:** Supabase CRUD repository wiring cho Campaigns only (Briefs/Generation/Calendar/Approval/Reports deferred to 16B-2+).
- **Tenant-scope contract cuối:** `CampaignRepository.list({ clientId, brandId? })` — `clientId` bắt buộc. `get({ clientId, campaignId, brandId? })` — scoped by client (+ brand nếu có). `update`/`archive({ clientId, brandId, campaignId })` — cả 3 ID bắt buộc. Supabase queries luôn `.eq('client_id', clientId)`, plus `.eq('brand_id', brandId)` khi áp dụng. TypeScript enforce tại compile time — unscoped calls không type-check.
- **`create(data)`:** `SupabaseCampaignRepository.create` không bao giờ gửi local `campaign-*` ID — DB tự generate UUID, row trả về dùng để update React state.
- **Codex Fix 1 (duration_days):** `duration_days: 0` vi phạm CHECK (`duration_days > 0`) trong `schema_v1.sql`. Fix: helper `calculateCampaignDurationDays(startDate, endDate)` — inclusive day count, fallback `1` nếu thiếu/invalid date. Áp dụng đồng nhất cho cả `SupabaseCampaignRepository.create` và `LocalStorageCampaignRepository.create`. Commit: `a2a8651`.
- **An toàn:** Supabase env OFF · không secrets · không service role key · Demo Sign In preserved · localStorage fallback preserved.
- **Không wired:** Brief / Generation / Calendar / Approval / Reports — deferred to Phase 16B-2+.
- **Codex result:** PASS.
- **Commits:** `e733633` (feat: campaign repository wiring) → `a2a8651` (fix: positive duration_days)
- **Trạng thái:** ✅ CLOSED.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A CLOSED: Codex PASS
- **Sự kiện:** Phase 16A chính thức đóng sau Codex PASS.
- **Scope hoàn thành:** Supabase CRUD repository wiring cho Clients và Brands. Repository pattern: interface → factory → Supabase/localStorage impls. Wired vào App.tsx.
- **Tenant-scope contract cuối:** `BrandRepository.list(clientId: string)` — bắt buộc. Tất cả brand ops (`get`, `update`, `archive`) require `clientId`. Supabase luôn apply `.eq('client_id', clientId)`. TypeScript enforce tại compile time.
- **An toàn:** Supabase env OFF · không secrets · không service role key · Demo Sign In preserved · localStorage fallback preserved.
- **Không wired:** Campaign / Brief / Generation / Calendar / Approval / Reports — deferred to Phase 16B+.
- **Codex result:** PASS.
- **Commits:** `54c8281` → `bccd1d1` → `53e8450` → `df7e6aa`
- **Trạng thái:** ✅ CLOSED.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A Codex Fix 3: Mandatory clientId on BrandRepository.list
- **Sự kiện:** `BrandRepository.list(clientId?: string)` vẫn cho phép gọi không có `clientId` — TypeScript không bắt lỗi.
- **Fix:** Đổi `clientId?: string` → `clientId: string` trong interface và cả 2 implementations.
- **Supabase:** Bỏ điều kiện `if (clientId)` — luôn apply `.eq('client_id', clientId)`. Không có code path nào đọc all brands nữa.
- **LocalStorage:** Bỏ ternary `clientId ? filter : brands` — luôn filter theo `clientId`.
- **Call site:** App.tsx:275 đã gọi `repos.brands.list(c.id)` — không cần sửa.
- **Build:** tsc + vite PASS — 0 TS errors. git diff --check PASS.
- **Trạng thái:** ✅ DONE — `BrandRepository.list` giờ bắt buộc `clientId`. TypeScript enforce tại compile time.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A Codex Fix 2: Scope brand operations by client_id
- **Sự kiện:** Codex phát hiện brand operations chưa được scoped theo `client_id` — đã fix toàn bộ.
- **Fix 1 (Unscoped list):** `App.tsx` gọi `repos.brands.list()` không có `clientId`. Fix: load clients trước, rồi `Promise.all(clients.map(c => repos.brands.list(c.id)))`.
- **Fix 2 (Unscoped get):** `SupabaseBrandRepository.get(id)` chỉ filter theo `id`. Fix: thêm `clientId` bắt buộc + `.eq('client_id', clientId)`.
- **Fix 3 (Unscoped update):** `SupabaseBrandRepository.update(id, patch)` chỉ filter theo `id`. Fix: thêm `clientId` + `.eq('client_id', clientId)` + lỗi PGRST116 typed.
- **Fix 4 (Unscoped archive):** `SupabaseBrandRepository.archive(id)` chỉ filter theo `id`. Fix: thêm `clientId` + `.eq('client_id', clientId)` + throw nếu không có row nào bị affected.
- **Fix 5 (Interface):** `BrandRepository` interface không enforce `clientId`. Fix: `get/update/archive` giờ require `clientId: string` — TypeScript bắt lỗi tại compile time.
- **Fix 6 (LocalStorage):** `LocalStorageBrandRepository.get/update/archive` chỉ filter theo `id`. Fix: filter/verify theo cả `id` và `client_id`, throw nếu không tìm thấy.
- **Files sửa:** `coreRepository.ts`, `supabaseRepositories.ts`, `localStorageRepositories.ts`, `App.tsx`
- **Build:** tsc + vite PASS — 0 TS errors. git diff --check PASS.
- **Trạng thái:** ✅ DONE — Brand operations fully scoped by client_id. Cross-client access prevented at repo layer.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A Codex Fix 1: Route mutations through repos, surface errors
- **Sự kiện:** Codex phát hiện 3 vấn đề nghiêm trọng trong Phase 16A — đã fix toàn bộ.
- **Fix 1 (UUID bypass):** Xóa `syncClientsBrandsToSupabase` — function này insert local ID `client-*/brand-*` vào UUID column trong Supabase DB. Không dùng nữa.
- **Fix 2 (Silent errors):** Xóa `.catch(() => {})` — lỗi Supabase write không còn bị nuốt. Lỗi create → hiện trong `formError` của tab. Lỗi archive/activate → hiện trong `actionError` của tab.
- **Fix 3 (Repo bypass):** ClientsTab và BrandsTab không còn tự tạo ID local (`generateId`). Mutations đi qua `repos.clients`/`repos.brands` trong App.tsx. Row trả về từ DB (UUID thật) cập nhật React state.
- **Files sửa:** `ClientsTab.tsx` (async props, formLoading, actionError), `BrandsTab.tsx` (async props, formLoading), `App.tsx` (3 typed handlers, remove sync bypass)
- **Build:** tsc + vite PASS — 0 TS errors. git diff --check exit 0.
- **Trạng thái:** ✅ DONE — UUID bug fixed, errors surfaced, repo contract enforced.

---

### 🗓️ Ngày 09/06/2026 — Phase 16A: Supabase CRUD Wiring — Clients + Brands
- **Sự kiện:** Implement repository pattern cho Clients và Brands. Wiring vào App.tsx với async Supabase load và diff-based write.
- **Files mới:**
  - `src/lib/core/localStorageRepositories.ts` — `LocalStorageClientRepository`, `LocalStorageBrandRepository`
  - `src/lib/core/supabaseRepositories.ts` — `SupabaseClientRepository`, `SupabaseBrandRepository`
  - `src/lib/core/repositoryFactory.ts` — factory `createPhase16aRepositories`
- **Files sửa:** `src/App.tsx` — `useMemo` repos, `useEffect` Supabase initial load, `supabaseLoadError` banner, `handleCoreUpdate` diff sync
- **Vẫn localStorage:** Campaigns, Briefs, Generation, Approval, Assets, Export Packs, Connector Registry, Automation Logs
- **An toàn:** Không secrets, không service role key, production Supabase env vẫn OFF, Demo Sign In preserved
- **Build:** tsc + vite PASS — 0 TS errors. git diff --check PASS.
- **Trạng thái:** ✅ DONE — Clients + Brands repository wiring complete. Phase 16B: Campaigns + Briefs.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix 3: Finalize Tenant-Scoped RLS Plan
- **Sự kiện:** Codex review lần 3 — 5 remaining issues addressed in plan. Policies/tests pending real Supabase execution. Codex PASS required before Phase 16.
- **Fix 1 (Content 3-tier):** `content_items_read` nay có 3 tiers: global staff (all), scoped manager (all statuses in tenant), client/viewer (approved only). Scoped manager giờ review được draft.
- **Fix 2 (Approval comments 3-tier):** Split `approval_comments_staff_all` → 3 policies: global staff all, scoped staff read all-in-tenant, client/viewer non-internal-in-tenant. Warning ghi rõ Tier 2 phải dùng `has_scoped_role` không phải `can_access_campaign`.
- **Fix 3 (Test matrix):** Thêm U5 (viewer-a), U6 (viewer-b). 18 tests → 32 tests. Tất cả `✅ PASS` → `☐ EXPECTED`. Thêm disclaimer note.
- **Fix 4 (Helper reference):** supabase_wiring_README.md Phase 16 checklist — xóa stale `current_user_has_role()` → 4 helper tên đầy đủ.
- **Fix 5 (Language):** SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md không dùng "all fixed" — ghi rõ plan updated, policies chưa apply thật.
- **Build:** tsc + vite PASS — 0 errors. Không thay đổi code runtime.
- **Trạng thái:** ✅ DONE — plan finalized. Vẫn là plan-only. Phase 16 apply + test.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix 2: Tighten RLS Tenant Isolation
- **Sự kiện:** Codex review lần 2 phát hiện 5 vấn đề tiếp theo — issues addressed in plan. Policies/tests pending real Supabase execution.
- **Vấn đề 1:** `roles` bị bỏ sót — 27 bảng trong schema nhưng audit chỉ có 26. Fix: thêm roles vào danh sách enable RLS (16 bảng thiếu), cập nhật Step 0, cập nhật bootstrap note.
- **Vấn đề 2:** `current_user_has_role()` không phân biệt global vs scoped. Fix: thay bằng 4 helpers tenant-aware với SECURITY DEFINER + SET search_path.
- **Vấn đề 3+4:** `approval_events_staff_read` + `approval_comments_client_public` expose cross-tenant data. Fix: policies giờ scope qua join chain approval_request→campaign→client.
- **Vấn đề 5:** Docs ghi "all fixed" không đúng. Fix: section 9 safety invariants dùng ✅/⏳/⚠️ status.
- **Thêm mới:** Section 14 trong rls_policy_plan.md — 18 cross-tenant tests (T01–T18) với 4 test users.
- **Build:** tsc + vite PASS — 0 errors. Không thay đổi code runtime.
- **Trạng thái:** ✅ DONE — plan tighter. Vẫn là plan-only. Phase 16 sẽ apply + test.

---

### 🗓️ Ngày 09/06/2026 — Phase 15 Codex Fix: Harden RLS + CRUD Plan
- **Sự kiện:** Codex review Phase 15 phát hiện 6 vấn đề — issues addressed in plan. Policies/tests pending real Supabase execution.
- **Vấn đề 1:** README khẳng định "RLS enabled on all tables" — sai. schema_v1.sql chỉ bật RLS trên 11/27 bảng. Fix: database/README.md cập nhật danh sách chính xác.
- **Vấn đề 2:** `user_roles` có RLS nhưng 0 policies → `fetchUserRole()` trả về 'viewer' cho mọi user. Fix: thêm bootstrap policies vào rls_policy_plan.md + warning trong docs.
- **Vấn đề 3:** Policy mẫu chỉ check role, không check tenant ownership → nguy cơ lộ dữ liệu đa tenant. Fix: supabase_wiring_README.md section 1.4 — thêm pattern tenant-scoped với `resource_id` check.
- **Vấn đề 4:** `coreRepository.ts` thiếu `ReportRepository` + `ReportMetricRepository`. Fix: thêm 2 interfaces + cập nhật CoreRepositories bundle (16→18 repos).
- **Vấn đề 5:** Phase 16 checklist thiếu reports, report_metrics, export_packs, connectors, modules, module_events, automation_logs. Fix: expand checklist đủ 10 domains + thêm Step 0 RLS trước CRUD.
- **Vấn đề 6:** Flow diagram dùng `AuthProvider.useEffect()` — không rõ file path. Fix: thêm `src/lib/auth/AuthContext.tsx` reference.
- **File mới:** `CLAUDE_MARKETING_TEAM/03_core/database/rls_policy_plan.md` — 13 sections: current RLS status, Step 0 enable RLS 15 bảng thiếu, helper function, bootstrap policies, Group A–G policies, apply order, safety checklist.
- **Build:** tsc + vite PASS — 0 errors. Không thay đổi code runtime.
- **Trạng thái:** ✅ DONE.

---

### 🗓️ Ngày 09/06/2026 — Phase 15: Supabase Auth + Database Wiring Plan
- **Sự kiện:** Hoàn thành Phase 15 — Supabase Auth + Database Wiring Plan.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. **Audit toàn bộ trạng thái sẵn sàng Supabase:**
     - Auth: `AuthContext.tsx` + `supabaseClient.ts` + `LoginScreen.tsx` đã đầy đủ (supabase/demo/unconfigured modes, role fetch from DB, demo fallback). Không cần sửa.
     - Schema: `schema_v1.sql` đầy đủ 7 groups, match TypeScript types. Sẵn sàng apply.
     - `.env.example`: đúng (VITE_ prefix, SERVICE_ROLE_KEY warning). Không cần sửa.
     - UI indicator: Login screen banner + demo credentials prefill khi unconfigured. Không cần sửa.
  2. **Tạo `CLAUDE_MARKETING_TEAM/03_core/supabase_wiring_README.md`** (NEW): Full audit (auth status, schema status, localStorage→Supabase mapping 7 stores, RLS requirements patterns, missing/deferred items), env vars guide, auth flow diagram, repository interface plan, SQL apply guide 7 bước, Phase 16 CRUD checklist, safety invariants.
  3. **Tạo `src/lib/core/coreRepository.ts`** (NEW): TypeScript interfaces cho 16 repositories (Client, Brand, Campaign, Brief, GenerationJob, ContentItem, ApprovalRequest, ApprovalEvent, ApprovalComment, Asset, AssetCollection, ExportPack, Connector, Module, ModuleEvent, AutomationLog) + `CoreRepositories` bundle. Phase 16 wiring strategy trong comments.
  4. **Cập nhật `CLAUDE_MARKETING_TEAM/03_core/database/README.md`**: Full 7-step SQL apply guide, service role key warning, related docs links.
  5. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **Audit kết quả:** Auth + supabaseClient + LoginScreen + .env.example đều đã ready. Không cần sửa code auth. Chỉ cần: apply schema_v1.sql + set env vars + assign owner role.
- **Không thực hiện:** Full CRUD wiring (defer Phase 16). RLS policies (defer Phase 16). Supabase project creation (chờ owner cấp env vars).
- **Safety:** No secrets. No real API. Demo Sign In + localStorage fallbacks preserved. Build PASS (0 errors).
- **Build:** tsc + vite PASS — 0 errors. Bundle unchanged (~879KB, coreRepository.ts is interfaces only, tree-shaken).
- **Trạng thái Phase 15:** ✅ DONE.
- **Next:** Phase 16 — Supabase CRUD Wiring Core Objects.

---

### 🗓️ Ngày 09/06/2026 — Phase 14: Automation Logs Foundation
- **Sự kiện:** Hoàn thành Automation Logs Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1). Session trước bị limit — tiếp tục từ files dở.
- **Hành động đã hoàn tất:**
  1. Thêm Phase 14 types vào `src/types/core.ts`: `AutomationLogType` (10 values), `AutomationLogSource` (7), `AutomationLogSeverity` (4), `AutomationLogStatus` (5), `LocalAutomationLog` interface (đã có từ session trước — giữ nguyên).
  2. Hoàn thiện `src/lib/core/automationLogs.ts`: display maps (TYPE/SOURCE/SEVERITY/STATUS label+color), 9 seed mock logs, `AutomationLogStore`, localStorage helpers (max 200 logs, key: `core_agency_automation_logs_v1`), `createAutomationLog()`, `updateLogStatus()`, `AutomationLogStats`, `computeLogStats()`. Fixed unused `NOW` variable.
  3. Hoàn thiện `src/components/core/AutomationLogsTab.tsx`: permission gate (`canViewAutomationLogs`), header + Phase 14 badge + Create Mock Log form (5 templates), safety disclaimer bar, stats row (5 cards: Total/Warnings/Errors/Unresolved/Success), filter bar (search + 4 dropdowns), log list (expand/collapse), expanded detail (message + payload JSON + related refs + timestamps + actions: Mark Reviewed/Resolved/Ignore), footer notice. Fixed unused `LocalAutomationLog` import + unused `actorLabel` param.
  4. Cập nhật `src/App.tsx`: import `Activity` icon + `AutomationLogsTab` + log lib; `logData` state + `handleLogUpdate`; sidebar "Automation Logs" button (owner/manager only, with unresolved error badge); tab routing `automation-logs`; phase badge → Phase 14.
  5. Tạo `CLAUDE_MARKETING_TEAM/03_core/automation_logs_README.md`.
  6. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
- **TypeScript fixes:** 3 TS6133/TS6196 errors fixed (unused NOW, unused LocalAutomationLog import, unused actorLabel destructuring).
- **Safety:** No real API calls. No real webhooks. No real workflow execution. No auto-post/ads/messaging. Safety disclaimer always visible. Logs hidden from client/viewer.
- **Permissions:** `canViewAutomationLogs` = owner/manager (set in Phase 13); `canManageConnectors` (owner) OR owner/manager = manage log status + create mock logs. Client/viewer: tab hidden + component-level gate.
- **Build:** tsc + vite PASS — 0 errors. ~879KB bundle.
- **Trạng thái Phase 14:** ✅ DONE.
- **Next:** Phase 15 — Real Supabase Auth + Database Wiring Plan.

---

### 🗓️ Ngày 08/06/2026 — Phase 13: Connector Registry + Module Event Inbox Foundation
- **Sự kiện:** Hoàn thành Connector Registry + Module Event Inbox Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Thêm Phase 13 types vào `src/types/core.ts`: `LocalConnectorType` (12), `LocalConnectorStatus`, `LocalConnectorMode`, `LocalConnectorRegistryItem`, `LocalModuleName` (11), `LocalModuleStatus`, `LocalModuleRegistryItem`, `LocalModuleEventType` (12), `ModuleEventDirection`, `LocalModuleEventStatus`, `LocalModuleEvent`.
  2. Tạo `src/lib/core/connectorRegistry.ts`: seed data (11 connectors, 10 modules, 5 events), display maps (CONNECTOR_TYPE/STATUS/MODE_LABEL/COLOR, MODULE_NAME/STATUS_LABEL/COLOR, MODULE_EVENT_TYPE/STATUS_LABEL/COLOR), `ConnectorRegistryStore`, localStorage helpers, CRUD: `updateConnectorStatus()`, `simulateHealthCheck()`, `updateModuleStatus()`, `updateEventStatus()`, `addMockEvent()`. Storage key: `core_agency_connector_registry_v1`.
  3. Tạo `src/components/core/ConnectorRegistryTab.tsx`: 3 sub-tabs (Connectors / Modules / Event Inbox). Safety banner. Connectors: 11 cards với status/mode badges, required env keys, safety note, actions (Simulate Health Check / Mark Configured / Disable / Re-enable). Modules: 10 cards với contract info, owner, actions (Mark Mock Ready / Disable). Event Inbox: filter bar (module/connector/direction/status/event_type), expandable event rows với payload preview, status actions (Mark Processed/Needs Review/Ignore), Create Mock Event form. Governance footer.
  4. Cập nhật `src/App.tsx`: import `Network` icon + `ConnectorRegistryTab`; sidebar "Connector Registry" button (sau Export Pack trong Core section); tab routing `connector-registry`; phase badge → Phase 13.
  5. Tạo `CLAUDE_MARKETING_TEAM/03_core/connector_registry_README.md`.
  6. Cập nhật CURRENT_PHASE.md và phase_log.md.
- **Safety:** No real API calls. No real webhooks sent. All connectors start as `not_configured / mock`. Mock events local only. Safety banner + governance footer always visible.
- **Permissions:** `canViewConnectors` = owner/manager; `canManageConnectors` = owner; `canViewAutomationLogs` = owner/manager.
- **Trạng thái Phase 13:** ✅ DONE.
- **Next:** Phase 14 — Supabase CRUD Wiring.

---

### 🗓️ Ngày 08/06/2026 — Phase 12: Export Pack Foundation
- **Sự kiện:** Hoàn thành Export Pack Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Thêm types vào `src/types/core.ts`: `ExportPackType` (6 loại), `ExportPackFormat`, `ExportPackStatus`, `LocalExportPack`.
  2. Mở rộng `src/lib/core/coreData.ts`: `ExportPackDataStore`, `loadExportPackData()`, `saveExportPackData()` (max 50 packs). Storage key: `core_agency_export_pack_data_v1`.
  3. Tạo `src/lib/core/exportPackGenerator.ts`: `generateExportPack()` deterministic, 6 content builders, format converter (markdown/plain_text/json_preview), `CLIENT_SAFE_EXPORT_TYPES`.
  4. Tạo `src/components/core/ExportPackTab.tsx`: safety banner, configure panel (scope/type/format/generate), preview panel (textarea + copy + regenerate), history panel (50 recent packs), governance reminders, permission gate.
  5. Cập nhật `src/App.tsx`: import `Package`, `ExportPackTab`; sidebar "Export Pack" button; tab routing `export-pack`; phase badge → Phase 12.
  6. Tạo `CLAUDE_MARKETING_TEAM/03_core/export_pack_README.md`.
- **Safety:** No real API, no upload, no email, no auto-post. Safety banner always visible. Approved ≠ Published.
- **Permissions:** `canViewExportPacks` = owner/manager/client; `canExportPacks` (generate) = owner/manager. Client/viewer restricted to 3 client-safe types.
- **Trạng thái Phase 12:** ✅ DONE.
- **Next:** Phase 13 — Connector Registry + Module Event Inbox Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 11: Report Module Foundation
- **Sự kiện:** Hoàn thành Report Module Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Thêm types vào `src/types/core.ts`: `LocalReportType` (6 loại), `LocalReportStatus`, `ReportMetrics`, `LocalReport`.
  2. Tạo `src/lib/core/reportGenerator.ts`: `generateLocalReport()` deterministic (không gọi AI thật), display maps cho content/approval/asset status, `CLIENT_ACCESSIBLE_REPORT_TYPES`, `buildClientSummaryText()`, `buildSummaryText()`.
  3. Tạo `src/components/core/ReportsTab.tsx`: filter bar (client/brand/campaign cascading + report type), Generate button (owner/manager only), metric cards (6 cards: total content, approved, pending, revision, assets, progress%), progress bar visual, detailed breakdown (4 sections: by status, by channel, approval by status, asset by status), client summary text (copyable), internal summary (copyable, internal only), governance note.
  4. Cập nhật `src/App.tsx`: import `BarChart2`, `ReportsTab`; sidebar "Reports" button (indigo, under Approvals in Core section); tab routing `reports`.
- **Safety:** No real API calls. No auto-post/ads/message. Report clearly labeled "Core workspace data only. No real platform analytics." Approved ≠ Published.
- **Permissions:** `canViewReports` = all roles; `canGenerateReports` = owner/manager. Client/viewer chỉ thấy client_summary và campaign_progress types.
- **Trạng thái Phase 11:** ✅ DONE. Commit: 6e15e25.
- **Next:** Phase 12 — Export Pack Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 10: Asset Library Foundation
- **Sự kiện:** Hoàn thành Asset Library Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Thêm types vào `src/types/core.ts`: `AssetType`, `AssetSourceType`, `AssetApprovalStatus`, `AssetItem`, `LocalAssetCollection`.
  2. Mở rộng `src/lib/core/coreData.ts`: `AssetDataStore`, `SEED_COLLECTIONS` (3), `SEED_ASSETS` (6 cho Vị Cuốn/Cơm Tấm/Forme), `loadAssetData`, `saveAssetData`, `createAsset`, `updateAsset`, display maps.
  3. Tạo `src/components/core/AssetLibraryTab.tsx`: filter bar (client/brand/campaign/type/status cascading), asset card list (expand detail), create/edit metadata form, archive action, asset collections panel, safety banner, permission guard.
  4. Cập nhật `src/App.tsx`: import `FolderOpen`, `AssetLibraryTab`, `loadAssetData/saveAssetData`, state `assetData`, handler `handleAssetUpdate`, sidebar "Asset Library" button, tab routing `asset-library`.
- **Safety:** Metadata only, no real file upload. Usage rights note field required. Storage upload deferred. Approved asset ≠ published content. No auto-post/ads/messaging.
- **Permissions:** `canViewAssets` = all roles; `canManageAssets` = owner/manager. Client/viewer only see approved assets.
- **Trạng thái Phase 10:** ✅ DONE. Commit: 2ff8007.
- **Next:** Phase 11 — Report Module Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 9: Client View Foundation
- **Sự kiện:** Hoàn thành Client View Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Tạo `src/components/core/ClientViewTab.tsx` — Client Portal với campaign selector, campaign overview card, content summary stats (Approved/Pending/Revision), content item cards (hook, caption, visual_brief, cta, hashtags — không lộ internal data), feedback form (lưu vào approvalComments), safety banner, empty states, "Internal Preview" badge cho owner/manager.
  2. Cập nhật `src/App.tsx` — import `UserCheck`, `ClientViewTab`; thêm "Client" sidebar section với "Client Portal" button; thêm tab routing `client-view`.
  3. Tạo `CLAUDE_MARKETING_TEAM/03_core/client_view_README.md`.
  4. Cập nhật logs và SESSION_SUMMARY.
- **Client-visible statuses:** `approved` → "Approved", `needs_review`/`generated` → "Pending Review", `revision_requested` → "Revision Requested". Hidden: rejected, archived, failed, draft.
- **Client actions:** Add feedback comment (stored via `addApprovalComment(..., isInternal=false)`). No publish, no approve, no internal edits.
- **Permission gate:** canViewContent = all roles. canAddFeedback = all roles (requires active approval request). canApprove = Approvals tab only (owner/manager).
- **Safety:** Approved ≠ Published. No publish action in Phase 9. Safety banner always visible. No auto-post/ads/messaging.
- **Trạng thái Phase 9:** ✅ DONE.
- **Next:** Phase 10 — Asset Library Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 8: Approval Workflow Foundation
- **Sự kiện:** Hoàn thành Approval Workflow Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cập nhật `src/types/core.ts` — thêm Phase 8 types: `ContentApprovalStatus`, `ApprovalPriority`, `ApprovalActionType`, `ContentApprovalRequest`, `ContentApprovalEvent`, `ContentApprovalComment`.
  2. Cập nhật `src/lib/core/coreData.ts` — thêm `ApprovalDataStore`, `loadApprovalData()`, `saveApprovalData()`, display helpers (APPROVAL_STATUS_LABEL/COLOR, PRIORITY_LABEL/COLOR, ACTION_LABEL), `SUBMITTABLE_ITEM_STATUSES`, `getActiveRequestForItem()`, `canSubmitItem()`, `submitForApproval()`, `executeApprovalAction()`, `addApprovalComment()`. Storage key: `core_agency_approval_data_v1`.
  3. Tạo `src/components/core/ApprovalsTab.tsx` — list view (submit panel, filter bar, request cards) + detail view (content preview, approval metadata, action buttons [Approve/Reject/Request Revision/Cancel], comment form, history timeline). Safety banner.
  4. Cập nhật `src/components/core/ContentGenerationTab.tsx` — thêm `onNavigateToApprovals` + `submittableItemIds` props; "→ Submit for Approval" button trên expanded items đủ điều kiện.
  5. Cập nhật `src/components/core/ContentCalendarTab.tsx` — thêm `approvalRequests` + `onNavigateToApprovals` props; hiển thị approval status badge trên item cards; `approvalStatusByItemId` map computed via useMemo.
  6. Cập nhật `src/App.tsx` — import `ClipboardCheck`, `ApprovalsTab`; `approvalData` state; `handleApprovalUpdate()` (atomic update cả hai stores); `handleNavigateToApprovals()`; `actorLabel`; `submittableItemIds`; sidebar "Approvals" button với pending count badge; tab routing `approvals`.
  7. Tạo `CLAUDE_MARKETING_TEAM/03_core/approval_workflow_README.md`.
  8. Cập nhật logs và SESSION_SUMMARY.
- **Status transition:** submitted → approved/rejected/revision_requested/cancelled. approve → content item `approved`. reject → `rejected`. revision → `revision_requested`. cancel → reverts to `needs_review`.
- **Permission gate:** canApproveContent = owner + manager. canSubmit = generateContent OR editCampaigns. canView = all roles.
- **Safety:** Approved ≠ Published. No publish action in Phase 8. Safety banner always visible.
- **Trạng thái Phase 8:** ✅ DONE.
- **Next:** Phase 9 — Client View Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 7: Content Calendar Foundation
- **Sự kiện:** Hoàn thành Content Calendar Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cập nhật `src/types/core.ts` — thêm 4 optional calendar fields vào `ContentPlanItem`: `scheduled_time`, `publish_note`, `owner_note`, `last_moved_at`. Backward-compatible với data cũ (all optional).
  2. Cập nhật `src/lib/core/coreData.ts` — thêm `CalendarSafeStatus`, `CALENDAR_SAFE_STATUSES`, `CalendarItemPatch`, `updateContentItemInStore()`. Safe statuses Phase 7: generated, needs_review, revision_requested, rejected, archived. approved/scheduled/published bị block.
  3. Tạo `src/components/core/ContentCalendarTab.tsx` — full calendar feature: safety banner, cascading filter bar (client→brand→campaign→channel→status), day-grouped item list sorted by planned_date, item cards với expand inline, detail view (caption/visual brief/hashtags/CTA/angle/pillar/approval note), edit panel (planned_date/scheduled_time/channel/owner_note/publish_note/status), permission gate, empty states, summary stats.
  4. Cập nhật `src/App.tsx` — import `CalendarDays` icon + `ContentCalendarTab`; sidebar button "Content Calendar" (sau Content Generation, trước Workspace section); tab routing `content-calendar`.
  5. Tạo `CLAUDE_MARKETING_TEAM/03_core/content_calendar_README.md`.
  6. Cập nhật logs: CURRENT_PHASE.md, phase_log.md, agent_activity_log.md, SESSION_SUMMARY.md.
- **Calendar features:** filter by client/brand/campaign/channel/status; group by planned_date; expand/collapse per item; inline edit safe fields; safety banner always visible.
- **Permission gate:** canViewContent = all roles; canEditContent || canGenerateContent = owner + manager only.
- **Safety:** Calendar is planning only. Scheduled ≠ Published. Generated ≠ Approved. Approved ≠ Published. No auto-post. No publish action in Phase 7.
- **Trạng thái Phase 7:** ✅ DONE.
- **Next:** Phase 8 — Approval Workflow Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 6: Content Generation Foundation
- **Sự kiện:** Hoàn thành Content Generation Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cập nhật `src/types/core.ts` — thêm Phase 6 types: `ContentPlanJobStatus`, `GenerationMode`, `PlanLengthDays`, `ContentItemStatus6`, `ContentPlanJob`, `ContentPlanItem`.
  2. Cập nhật `src/lib/core/coreData.ts` — thêm `GenerationDataStore`, `loadGenerationData()`, `saveGenerationData()`, `JOB_STATUS_LABEL/COLOR`, `CONTENT_ITEM_STATUS_LABEL/COLOR`. Storage key riêng: `core_agency_gen_data_v1`.
  3. Tạo `src/lib/core/contentGenerator.ts` — deterministic mock generator. 7 ContentAngles, Vietnamese templates, industry-aware CTA, per-channel visual brief. Default item status: `needs_review`.
  4. Tạo `src/components/core/ContentGenerationTab.tsx` — list view (approved briefs, generate form, job history) + detail view (job summary, expandable content items: hook/caption/visual brief/CTA/hashtags). Safety banner required.
  5. Cập nhật `src/components/core/BriefIntakeTab.tsx` — thêm `onNavigateToGenerate` prop, enable Generate button khi brief = `approved_for_generation`.
  6. Cập nhật `src/App.tsx` — import `Wand2`, `ContentGenerationTab`, generation data imports; thêm `genData` state + `handleGenerationUpdate` + `genNavBriefId`; sidebar "Content Generation" button; tab rendering; phase badge → Phase 6.
  7. Tạo `CLAUDE_MARKETING_TEAM/03_core/content_generation_README.md`.
  8. Build pass (tsc + vite, 0 errors, ~663KB bundle). Commit + push.
- **Generation flow:** Brief (approved_for_generation) → generate() → ContentPlanJob + ContentPlanItem[]. Job mode: mock. Item status: needs_review (never auto-approved/published).
- **Permission gate:** generateContent = owner + manager only. viewContent = all roles.
- **Safety:** Generated ≠ Approved ≠ Published. No AI API. No auto-post. No ads.
- **Trạng thái Phase 6:** ✅ DONE.
- **Next:** Phase 7 — Content Calendar Foundation.

---

### 🗓️ Ngày 08/06/2026 — Phase 5: Brief Intake Foundation
- **Sự kiện:** Hoàn thành Brief Intake Foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cập nhật `src/types/core.ts` — thêm `BriefStatus` union type, mở rộng `CampaignBrief` với 15 fields mới (brief_title, campaign_goal, product_focus, offer, tone_of_voice, content_pillars, must_include, must_avoid, competitors, reference_links, budget_note, timeline_note, approval_requirements, brand_id, client_id).
  2. Cập nhật `src/lib/core/coreData.ts` — thêm `BriefFormData`, `SEED_BRIEFS` (3 briefs), mở rộng `CoreDataStore` với `briefs`, migration trong `loadCoreData()`, helpers BRIEF_STATUS_LABEL/COLOR/EMPTY_BRIEF_FORM.
  3. Tạo `src/components/core/BriefIntakeTab.tsx` — list view (filter, cards, quick-actions), detail view (all fields, status transitions, disabled Generate placeholder), create/edit form (5 sections, auto-populate, validation), safety notice.
  4. Cập nhật `ClientsTab.tsx`, `BrandsTab.tsx`, `CampaignsTab.tsx` — thêm `briefs` prop và pass-through trong `onUpdate`.
  5. Cập nhật `src/App.tsx` — import BriefIntakeTab + ClipboardList, Brief Intake sidebar button + tab rendering, phase badge → Phase 5.
  6. Tạo `CLAUDE_MARKETING_TEAM/03_core/brief_intake_README.md`.
  7. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  8. Build pass (tsc + vite, 0 errors, ~634KB bundle). Push to GitHub.
- **Status machine:** draft → ready_for_generation → approved_for_generation | needs_revision → archived.
- **Safety:** Generate button disabled (Phase 6 placeholder). Brief = input only. Generated ≠ Approved ≠ Published.
- **Trạng thái Phase 5:** ✅ DONE.
- **Next:** Phase 6 — Content Generation (enable Generate button for approved_for_generation briefs).

---

### 🗓️ Ngày 07/06/2026 — Phase 4: Client/Brand/Campaign Management Foundation
- **Sự kiện:** Hoàn thành Core Management layer cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Tạo `src/lib/core/coreData.ts` — seed data (3 clients, 3 brands, 3 campaigns), localStorage store, form types, display helpers.
  2. Tạo `src/components/core/ClientsTab.tsx` — list, create form, detail view, archive/activate, cross-tab nav.
  3. Tạo `src/components/core/BrandsTab.tsx` — card grid, filter by client, create form, detail view, cross-tab nav.
  4. Tạo `src/components/core/CampaignsTab.tsx` — table, filter by client+brand, create form, status update, detail view.
  5. Cập nhật `src/App.tsx` — imports, coreData state, handleCoreUpdate, handleCoreNavigate, sidebar "Core" section (Clients/Brands/Campaigns), tab rendering, phase badge → Phase 4.
  6. Tạo `CLAUDE_MARKETING_TEAM/03_core/client_brand_campaign_README.md`.
  7. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  8. Build pass (tsc + vite, 0 errors, 606KB bundle). Push to GitHub.
- **Permission integration:** canManageClients / canManageBrands / canCreateCampaigns / canEditCampaigns applied.
- **Data mode:** Local demo (localStorage `core_agency_core_data_v1`). Supabase wired in Phase 5+.
- **Trạng thái Phase 4:** ✅ DONE.
- **Next:** Phase 5 — Brief Intake Foundation + Supabase CRUD wiring.

---

### 🗓️ Ngày 07/06/2026 — Phase 3: Auth/Login + Role Permission Foundation
- **Sự kiện:** Hoàn thành Auth foundation cho The Core Agency.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Cài `@supabase/supabase-js` (9 packages).
  2. Tạo `src/vite-env.d.ts` — Vite env type declarations.
  3. Tạo `src/lib/supabaseClient.ts` — null-safe Supabase client.
  4. Tạo `src/lib/auth/AuthContext.tsx` — React context, 3 modes, signIn/signOut, fetchUserRole.
  5. Tạo `src/lib/auth/permissions.ts` — 30+ permission keys, `can.*` helpers, role colors/labels.
  6. Tạo `src/components/auth/LoginScreen.tsx` — login UI, demo fallback.
  7. Cập nhật `src/main.tsx` — wrap `<AuthProvider>`.
  8. Cập nhật `src/App.tsx` — auth gate, user status header.
  9. Tạo `src/vite-env.d.ts` — fix ImportMeta.env types.
  10. Tạo `CLAUDE_MARKETING_TEAM/03_core/auth/README.md`.
  11. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  12. Build pass (tsc + vite). Push to GitHub.
- **Trạng thái Phase 3:** ✅ DONE.
- **Next:** Phase 4 — Client/Brand/Campaign Management + RLS policies.

---

### 🗓️ Ngày 07/06/2026 — Phase 2: Database Schema V1
- **Sự kiện:** Hoàn thành Database Schema V1 cho The Core Agency Real Operations MVP.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Tạo `00_strategy/THE_CORE_AGENCY_DATABASE_SCHEMA_V1.md` — tài liệu schema đầy đủ, phase dependency map.
  2. Tạo `CLAUDE_MARKETING_TEAM/03_core/database/schema_v1.sql` — SQL Supabase Postgres: 30+ bảng, 7 nhóm, enums, indexes, triggers, RLS.
  3. Tạo `CLAUDE_MARKETING_TEAM/03_core/database/README.md` — hướng dẫn apply schema.
  4. Tạo `src/types/core.ts` — TypeScript types khớp hoàn toàn với schema.
  5. Tạo `.env.example` — placeholder an toàn cho Supabase, webhook, n8n, Anthropic.
  6. Kiểm tra `.gitignore` — `.env.local`, `.env` đã được gitignore ✅.
  7. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  8. Build pass (tsc + vite). Push to GitHub.
- **Trạng thái Phase 2:** ✅ DONE.
- **Next:** Phase 3 — Auth/Login + Role Permission Foundation (Supabase Auth, RLS policies).

---

### 🗓️ Ngày 07/06/2026 — Real Operations MVP Start
- **Sự kiện:** Bắt đầu The Core Agency Real Operations MVP — Phase 1.
- **Người thực hiện:** Claude Code Builder (PC1).
- **Hành động đã hoàn tất:**
  1. Đọc toàn bộ docs hiện có: CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  2. Khoá scope sản phẩm: 18 phases / 7 days plan.
  3. Tạo `00_strategy/THE_CORE_AGENCY_7_DAY_REAL_MVP_PLAN.md` — plan 18 phase đầy đủ.
  4. Tạo `00_strategy/THE_CORE_AGENCY_MODULES_AND_N8N_WORKSTREAM.md` — architecture + module contracts.
  5. Cập nhật UI branding: `CLAUDE MARKETING TEAM` → `THE CORE AGENCY` trong App.tsx header.
  6. Cập nhật tagline: `Multi-brand AI Marketing Team Workspace` → `AI Marketing Team Workspace`.
  7. Cập nhật phase badge: `Phase H.7 — Owner & Client Views` → `Real Operations MVP — Phase 1`.
  8. Cập nhật pitch text: `Đội ngũ Claude AI Marketing Team` → `Đội ngũ The Core Agency`.
  9. Cập nhật `index.html` title: `AI Marketing Team Workspace` → `The Core Agency`.
  10. Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md.
  11. Build pass (tsc + vite build). Push to GitHub.
- **Trạng thái Phase 1:** ✅ DONE.
- **Next:** Phase 2 — Database Schema V1 (Supabase).

---

### 🗓️ Ngày 03/06/2026 19:10:51 (Local Time)
- **Sự kiện:** Khởi tạo dự án độc lập `CLAUDE_MARKETING_TEAM`.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Thiết lập toàn bộ cấu trúc thư mục từ `00_brand_inputs` đến `08_logs`.
  2. Tạo tài liệu hướng dẫn nền tảng: `README.md`, `PROJECT_BLUEPRINT.md`, `AGENTS.md`, `CURRENT_PHASE.md`, `SESSION_SUMMARY.md`.
  3. Tạo dữ liệu thương hiệu mẫu `sample_brand_brief.md` và template chiến dịch `campaign_brief_template.md`.
  4. Thiết kế hệ thống templates V1 đầu ra tại `03_templates/` cho cả 5 vai trò AI.
  5. Định nghĩa các quy trình phối hợp nhóm, luồng chiến dịch mẫu 7 ngày và quy trình duyệt thủ công tại `04_workflows/`.
  6. Xây dựng chi tiết kỹ năng cho từng Agent tại `05_skills/`.
  7. Thiết lập demo case mẫu tại `06_demo_cases/local_business_demo/`.
  8. Soạn thảo luật hệ thống, luật an toàn bảo mật và hướng dẫn kết nối API thật trong tương lai tại `07_docs/`.
  9. Khởi tạo nhật ký hệ thống này tại `08_logs/phase_log.md`.
- **Trạng thái Phase A:** Hoàn thành 100% việc thiết lập móng Workspace.

### 🗓️ Ngày 03/06/2026 19:24:13 (Local Time)
- **Sự kiện:** Triển khai Phase B — First Demo Campaign Pack.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase B — First Demo Campaign Pack.
  2. Sản xuất thành công đầu ra chi tiết của Copywriter gồm 7 caption, 7 hook, 3 slogan, 5 CTA.
  3. Soạn thảo kịch bản video chi tiết của Video Editor gồm 7 script TikTok/Reels phân cảnh.
  4. Thiết lập 7 Design brief và Prompts tiếng Anh tạo ảnh cho Designer.
  5. Thiết lập kế hoạch phân phối quảng cáo giả định (5 angles, 3 objectives, 3 ad sets, 5 creative testings) của Ads Manager.
  6. Tổng hợp báo cáo hiệu quả chiến dịch 7 ngày mô phỏng (Simulated Data) của Data Reporter.
  7. Đóng gói toàn bộ sản phẩm sáng tạo và cấu hình vào file pack tổng hợp `demo_7_day_campaign_pack.md`.
- **Trạng thái Phase B:** Hoàn thành 100% gói demo chiến dịch 7 ngày.

### 🗓️ Ngày 03/06/2026 19:26:25 (Local Time)
- **Sự kiện:** Triển khai Phase C — Brief To Output Operating System.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase C — Brief To Output Operating System.
  2. Tạo biểu mẫu thu thập dữ liệu đầu vào chuẩn hóa [owner_brief_form.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/01_campaign_briefs/owner_brief_form.md).
  3. Lên quy trình vận hành tiêu chuẩn gồm 7 bước cụ thể tại [brief_to_output_sop.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/04_workflows/brief_to_output_sop.md).
  4. Thiết lập template tổng hợp gói chiến dịch cuối cùng [final_campaign_pack_template.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/03_templates/final_campaign_pack_template.md).
  5. Viết cẩm nang hướng dẫn sử dụng phi kỹ thuật dành cho Owner tại [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md).
  6. Xây dựng bảng ranh giới phân biệt các cấp độ vận hành [demo_vs_real_boundary.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/demo_vs_real_boundary.md).
- **Trạng thái Phase C:** Hoàn thành 100% việc xây dựng hệ điều hành quy trình (SOP & Manuals).

### 🗓️ Ngày 03/06/2026 19:28:33 (Local Time)
- **Sự kiện:** Triển khai Phase D — Antigravity Commands.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase D — Antigravity Commands.
  2. Tạo thư mục `.antigravity/commands/` tại thư mục gốc.
  3. Xây dựng tệp lệnh khởi tạo [.antigravity/commands/start_campaign.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/start_campaign.md).
  4. Xây dựng tệp lệnh kiểm tra [.antigravity/commands/review_outputs.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/review_outputs.md).
  5. Xây dựng tệp lệnh đóng gói [.antigravity/commands/finalize_pack.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/finalize_pack.md).
  6. Cập nhật tài liệu hướng dẫn [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md) để hướng dẫn gọi các lệnh mới này.
- **Trạng thái Phase D:** Hoàn thành 100% việc xây dựng thư mục tập lệnh Antigravity Commands.

### 🗓️ Ngày 03/06/2026 19:30:30 (Local Time)
- **Sự kiện:** Triển khai Phase E — Local Web UI Prototype.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase E — Local Web UI Prototype.
  2. Tạo các tệp cấu hình Vite/React/TS tại thư mục gốc: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`.
  3. Xây dựng hệ thống biến HSL CSS & styling cao cấp (Dark theme, glassmorphism, glowing accents) tại `src/index.css`.
  4. Chuẩn bị tệp dữ liệu mock phong phú cho trà sữa Vinh tại `src/mockData.ts`.
  5. Phát triển component chính `src/App.tsx` tích hợp 5 màn hình tương tác (Dashboard, Campaign Brief Form, AI Team Board, Campaign Outputs, Approval Checklist) có hỗ trợ mô phỏng tiến độ làm việc của Agent.
  6. Tạo tệp entry point React `src/main.tsx`.
  7. Cập nhật tài liệu hướng dẫn khởi chạy cục bộ vào `CLAUDE_MARKETING_TEAM/README.md`.
- **Trạng thái Phase E:** Hoàn thành 100% việc xây dựng giao diện web UI prototype local.

### 🗓️ Ngày 03/06/2026 19:45:00 (Local Time)
- **Sự kiện:** Khắc phục lỗi biên dịch Vite (Compile Error) trong Phase E.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Sửa lỗi cú pháp CSS variable không có dấu nháy ở inline style dòng 245 của [src/App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx) (`color: var(--accent-indigo)` thành `color: 'var(--accent-indigo)'`).
  2. Kiểm duyệt lại toàn bộ file `src/App.tsx` đảm bảo tất cả các biến CSS dùng trong inline style đều có dấu nháy hợp lệ.
  3. Đăng ký lệnh chạy `npm.cmd run dev` để chạy thử nghiệm.
- **Trạng thái:** Toàn bộ dự án đã sẵn sàng, khắc phục hoàn toàn lỗi biên dịch Vite.

### 🗓️ Ngày 03/06/2026 20:15:00 (Local Time)
- **Sự kiện:** Triển khai và Hoàn thành Phase F — Universal AI Coordinator Prompt.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase F — Universal AI Coordinator Prompt và cập nhật checklist.
  2. Tạo lập tệp Prompt vạn năng [universal_ai_coordinator_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/universal_ai_coordinator_prompt.md) tích hợp định nghĩa 5 Agent AI Marketing, các ranh giới bảo mật nghiêm ngặt và quy tắc gắn nhãn Simulated Data.
  3. Tạo lập tệp Prompt ví dụ thực tế [example_owner_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/example_owner_prompt.md) sử dụng Brief của quán Trà Sữa Tôm Tép tại Vinh để chạy thử trực tiếp trên các chatbot ngoài.
  4. Cập nhật cẩm nang hướng dẫn sử dụng [owner_manual.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/owner_manual.md) để hỗ trợ Owner copy-paste chạy mô phỏng thuận tiện.
- **Trạng thái Phase F:** Hoàn thành 100%, toàn bộ lộ trình mô phỏng AI Marketing Team đã được đóng gói hoàn tất.

### 🗓️ Ngày 03/06/2026 20:15:00 (Local Time)
- **Sự kiện:** Triển khai và Hoàn thành Phase G — Client Demo Pack.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Chuyển trạng thái `CURRENT_PHASE.md` sang Phase G — Client Demo Pack.
  2. Tạo tệp [client_pitch_deck_outline.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/client_pitch_deck_outline.md) phác thảo slide giới thiệu khách hàng.
  3. Tạo tệp [client_demo_script.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/client_demo_script.md) kịch bản nói chuyện demo 10 phút.
  4. Tạo tệp [service_packages.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/service_packages.md) đề xuất 3 gói dịch vụ Basic/Growth/Automation linh hoạt.
  5. Tạo tệp [faq_for_clients.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/faq_for_clients.md) giải đáp các thắc mắc an toàn cho khách hàng.
- **Trạng thái Phase G:** Hoàn thành 100% việc chuẩn bị bộ tài liệu demo và bán hàng thương mại cho SMEs.

### 🗓️ Ngày 04/06/2026 23:30:00 (Local Time)
- **Sự kiện:** Triển khai và Hoàn thành Phase H.2 — Client Demo Mode.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Commit:** `75ac881` — feat: add phase h2 client demo mode
- **Hành động đã hoàn tất:**
  1. Thêm tab **Client Demo Mode** vào Sidebar Navigation của Web UI (`src/App.tsx`).
  2. Triển khai **Client View** gồm: Campaign Overview (Thương hiệu, Sản phẩm, Ý tưởng, Kênh), Key Deliverables, What Client Can Approve.
  3. Triển khai **Approval Status Demo** với đủ 3 trạng thái: Draft → Waiting for Owner Review → Approved for Manual Use.
  4. Triển khai **AI Team Workspace** với đủ 5 role cards: Copywriter, Video Editor, Designer, Ads Manager, Data Reporter — mỗi role có Nhiệm vụ chính, Demo Output và nhãn Human Sign-off Required.
  5. Sửa lỗi build TypeScript (unused import `Eye`) gây cascade 20+ lỗi compile — fix: xóa `Eye` khỏi lucide-react import.
  6. Codex review PASS. Production (Vercel) Owner checked PASS.
- **Trạng thái Phase H.2:** DONE + BUILT + REVIEWED + PUSHED + PRODUCTION CHECKED.
- **Safety Guard:**
  - Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO
  - Secrets Added: NO | FnB OS V1 touched: NO | Demo/Mock Data Only: YES

### 🗓️ Ngày 04/06/2026 21:40:00 (Local Time)
- **Sự kiện:** Triển khai và Hoàn thành Phase H-lite — Manual Export Pack.
- **Người thực hiện:** Builder Agent (Antigravity).
- **Hành động đã hoàn tất:**
  1. Nâng cấp giao diện Web UI ([src/App.tsx](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/src/App.tsx)) bằng cách tạo thêm tab **Manual Export Pack**.
  2. Triển khai 6 khối xuất dữ liệu markdown/text dạng văn bản tĩnh có ô textarea readonly và tích hợp nút Copy nhanh cho:
     * Full Campaign Pack
     * Client Summary
     * Editor Handoff
     * Designer Handoff
     * Ads Draft Pack
     * Approval Checklist
  3. Gắn kèm disclaimer pháp lý bắt buộc: Chỉ sử dụng cho mục đích demo mock-up, yêu cầu duyệt thủ công bằng con người trước khi đăng bài hay chạy quảng cáo thực tế.
  4. Biên dịch và kiểm duyệt chất lượng cục bộ thành công (build & dev PASS).
  5. Đẩy code lên GitHub main branch (commit `1eb9fdc`).
- **Trạng thái Phase H-lite:** Hoàn thành 100% việc cung cấp gói dữ liệu thủ công phục vụ triển khai offline an toàn.

### 🗓️ Ngày 04/06/2026 (Local Time)
- **Sự kiện:** Triển khai Phase H.3 — Demo Polish & Sales Readiness.
- **Người thực hiện:** Builder Agent (Claude Code).
- **Commits:**
  - `0a36ea4` — feat: add phase h3 demo polish and sales readiness (session 1)
  - `7b90faf` — feat: add phase h3 full sales readiness features (session 2)
- **Hành động đã hoàn tất:**
  1. Cập nhật header badge Web UI → "Phase H.3 — Demo Polish & Sales Readiness".
  2. Dashboard: Thêm **Presenter Demo Guide** 5-step clickable card (Dashboard → Brief → Outputs → Client Demo → Export Pack). Bấm vào từng step là chuyển tab tương ứng.
  3. Client Demo Mode: Thêm **Sales Readiness** section — 5 card row: Vấn đề KH / Giải pháp AI Team / Khách nhận được gì / Cần duyệt thủ công gì / Tại sao an toàn.
  4. Client Demo Mode: Thêm **Value Proposition** section — 4 cards với mock ROI và key benefits (⚡ 3 phút, 🤝 Human-in-the-loop, 🎯 5 chuyên gia, 📊 mock ROI tiết kiệm 15h/tuần).
  5. Client Demo Mode: Thêm **Before/After Comparison** — Manual vs AI-Assisted table (10–16 giờ → ~2 giờ mock estimate).
  6. Client Demo Mode: Thêm **CTA Block** 3 nút clickable: Duyệt Campaign Pack → Approval tab | Xuất File Gửi Khách → Manual Export tab | Chuẩn Bị Brief Tiếp Theo → New Campaign tab.
  7. Client Demo Pack: Thêm **Service Packages Teaser** — 3 gói static mock: Starter / Growth / Scale.
  8. Build local PASS (`npm run build`) — 0 TypeScript/Vite errors.
- **Trạng thái Phase H.3:** DONE + BUILT + CODEX REVIEWED + PUSHED — Codex review PASS (UI/code/safety); docs/log stale status fixed.
- **Safety Guard:**
  - Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO
  - Secrets Added: NO | FnB OS V1 touched: NO | Demo/Mock Data Only: YES
  - Backend added: NO | Database added: NO | Real API: NO

### 🗓️ Ngày 04/06/2026 (Local Time) — Phase H.3 CLOSED
- **Sự kiện:** Đóng Phase H.3 — Demo Polish & Sales Readiness.
- **Người thực hiện:** Owner + Codex reviewer.
- **Kết quả Codex re-review:** PASS — UI/code/safety PASS, no required fixes.
- **git status:** working tree clean. main = origin/main.
- **Trạng thái Phase H.3:** ✅ CLOSED
- **Next phase:** Phase H.4 — Export/Presentation Readiness.





### 🗓️ Ngày 04/06/2026 (Local Time) — Phase H.4 START
- **Sự kiện:** Triển khai Phase H.4 — Export/Presentation Readiness.
- **Người thực hiện:** Builder Agent (Claude Code).
- **Hành động đã hoàn tất:**
  1. Cập nhật header badge Web UI → "Phase H.4 — Export/Presentation Readiness".
  2. Thêm nav sidebar button **"Presentation & Export"** (icon BookOpen).
  3. Thêm state mới: `approvalSheetItems` (7 rows), `exportChecklist` (7 items).
  4. Xây dựng tab `presentation-export` gồm 5 sections:
     - **Presentation View**: 6-step client explanation (Problem → AI Solution → Outputs → Approval → Manual Publishing → Safety)
     - **Export Pack Preview**: 7 deliverable cards với badge, description, "View in workspace →" button
     - **Client Approval Sheet Preview**: 5-cột table với clickable status badges (cycle 4 states)
     - **Sales Demo Script**: 5-step timeline (0:00–5:30) + "Copy Script" button
     - **Export Readiness Checklist**: 7-item, 3 safety-locked, live x/7 counter badge
  5. Build local PASS (`npm run build`) — 0 TypeScript/Vite errors.
- **Trạng thái Phase H.4:** IMPLEMENTED — build PASS, pushed to GitHub (`d823c17`), Codex review PASS.
- **Safety Guard:**
  - Auto-post: NO | Real Ads: NO | Real Messaging: NO | Real Connectors: NO
  - Secrets Added: NO | FnB OS V1 touched: NO | Backend: NO | Database: NO | Real API: NO
  - Demo/Mock Data Only: YES

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.4 Codex Review Result
- **Sự kiện:** Codex review Phase H.4 hoàn tất.
- **Kết quả:** UI/code/build/safety PASS. Phát hiện duy nhất: trạng thái docs/log còn stale.
- **Fix:** Cập nhật CURRENT_PHASE.md, SESSION_SUMMARY.md, phase_log.md, agent_activity_log.md, phase_h4_handoff.md để phản ánh đúng trạng thái đã push và Codex review PASS.
- **Commits pushed:** `d2e7bd8`, `d823c17`
- **Trạng thái Phase H.4:** ✅ IMPLEMENTED + CODEX REVIEWED — docs/log stale status fixed.
### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.4 CLOSED
- **Sự kiện:** Đóng Phase H.4 — Export/Presentation Readiness.
- **Người thực hiện:** Owner + Codex reviewer.
- **Kết quả Codex re-review:** PASS — UI/code/build/safety PASS, no required fixes.
- **git status:** working tree clean. main = origin/main.
- **Trạng thái Phase H.4:** ✅ CLOSED
- **Next phase:** Phase H.5 — Multi-brand Workspace Readiness.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.5 START
- **Sự kiện:** Triển khai Phase H.5 — Multi-brand Workspace Readiness.
- **Người thực hiện:** Builder Agent (Claude Code).
- **Framing correction:** Reframe từ "Multi-brand Demo Readiness" → "Multi-brand Workspace Readiness" theo chỉ đạo Owner. Workspace là sản phẩm thực tế, không phải demo toy.
- **Hành động đã hoàn tất:**
  1. `mockData.ts`: Thêm 2 seed brands — Cơm Tấm Bản Khói (F&B/HCM) và Forme (nội thất cao cấp/HCM+HN). Vị Cuốn giữ nguyên.
  2. `src/App.tsx`: localStorage v3, header badge H.5, sidebar "Brand Workspace" tab, Dashboard Brand Switcher, Brand Gallery tab, dynamic Client Demo Mode.
  3. Language: "Sample Data", "Sandbox Safe Mode", "Workspace" — không dùng "demo" là main framing.
- **Safety Guard H.5 confirmed:** Auto-post: NO | Real Ads: NO | Secrets: NO | FnB OS V1: NO | Sample Data Only: YES
- **Trạng thái Phase H.5:** IN PROGRESS — build pending.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.5 Codex Review + Fix
- **Sự kiện:** Codex review Phase H.5.
- **Kết quả:** 1 required fix — campaign workspace wording alignment.
- **Fix applied:** Commit `147487d` — fix: align phase h5 campaign workspace wording.
- **Build:** `npm run build` PASS — 0 errors. Working tree clean.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.5 CLOSED
- **Sự kiện:** Đóng Phase H.5 — Multi-brand Workspace Readiness.
- **Người thực hiện:** Owner + Codex reviewer + Builder Agent (Claude Code).
- **Kết quả Codex review:** PASS — fix applied, build PASS, git clean.
- **Commits:** `e313f8f` (feat: add phase h5 multi brand workspace readiness), `147487d` (fix: align phase h5 campaign workspace wording).
- **Note:** H.5 upgraded the app into a multi-brand AI Marketing Team Workspace with Vị Cuốn, Cơm Tấm Bản Khói, and Forme using sample/seed data and Sandbox Safe Mode. Product framing corrected from demo wording to workspace wording.
- **Trạng thái Phase H.5:** ✅ DONE + CODEX PASS + FIX APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK
- **Next phase:** Phase H.6 — Client-ready Workspace Polish.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.6 DONE
- **Sự kiện:** Hoàn thành Phase H.6 — Client-ready Workspace Polish.
- **Người thực hiện:** Builder Agent (Claude Code). Continued from previous session hit usage limit.
- **Hành động đã hoàn tất:**
  1. Header badge → "Phase H.6 — Client-ready Workspace Polish".
  2. Nav sidebar renames: "Client Demo Pack" → "Client Presentation Pack", "Client Demo Mode" → "Client Workspace View".
  3. Demo Pack tab h2 → "Client Presentation Pack"; Client Demo Mode h2 → "Client Workspace View" badge → "Client-Ready".
  4. Manual Export Pack title: removed "Phase H.1 —" prefix; badge → "Production Ready".
  5. Approval hint: replaced hardcoded Vị Cuốn/product text with `activeCampaign.brief.heroProduct` and `activeCampaign.brief.brandName`.
  6. Added "How to Use This Workspace" owner/client guide card (6 steps, emerald) on Dashboard.
  7. Renamed existing guide to "Presenter Walkthrough Guide", updated step 4 to "Client Workspace View".
  8. Pitch text in demo-pack tab now uses dynamic brand name and hero product.
  9. Brand gallery "Current (H.5)" → "Current (H.6)"; service packages "Client Demo Mode" → "Client Workspace View".
- **Safety Guard H.6 confirmed:** Auto-post: NO | Real Ads: NO | Secrets: NO | FnB OS V1: NO | Sample Data Only: YES
- **Build:** `npm run build` PASS — 0 errors.
- **Trạng thái Phase H.6:** ✅ DONE + BUILT + PUSHED (initial)

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.6 Codex Review Round 1 + Fix
- **Sự kiện:** Codex review Phase H.6.
- **Kết quả:** NEEDS FIX — visible demo/mock wording in 5 required locations.
- **Fixes applied:** Commit `4d2f3bd` — fix: align phase h6 workspace wording.
  - `Demo/Mock Data Only` → `Sample Data Only`
  - `Mock Pricing — Demo Only` → `Sample Pricing — Sandbox Mode`
  - `Demo/mock only` → `Sample data only`
  - `Approval Status Demo` → `Approval Status Preview`
  - `Every output is demo/mock data only` → `...sample data only until live connectors are approved`
  - `Sales Demo Script` → `Presenter Walkthrough Script`
  - `client-facing demo script` → `client workspace walkthrough`
  - Copy text: `SALES DEMO SCRIPT`, `fill demo data`, `That's the full demo` → workspace equivalents
- **Build:** `npm run build` PASS — 0 errors.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.6 Codex Review Round 2 + Fix
- **Sự kiện:** Codex re-review Phase H.6 — 15 additional visible demo/mock strings found.
- **Fixes applied:** Commit `c7b4f7d` — fix: remove remaining h6 demo wording.
  - `Mock Data` dashboard badge → `Sample Data`
  - `Mock Ad Units` → `Sample Ad Units`
  - `demo mock-up` disclaimer → `sandbox minh họa`
  - `Offline Mock-up` → `Offline Sandbox`
  - `Mock workspace only` → `Sandbox Safe Mode`
  - `White-label demo` → `White-label workspace`
  - `dữ liệu demo giả lập` → `dữ liệu mẫu`
  - `(mock est.)` → `(sample est.)`
  - `Mock Estimate — Demo Only` → `Sample Estimate — Sandbox Only`
  - `phục vụ demo` → `phục vụ minh họa`
  - `mock ads` / `mock ad copy units` → `sample ads` / `sample ad copy units`
  - `Mock data` export badge → `Sample data`
- **Build:** `npm run build` PASS — 0 errors.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.6 CLOSED
- **Sự kiện:** Đóng Phase H.6 — Client-ready Workspace Polish.
- **Người thực hiện:** Owner + Codex reviewer + Builder Agent (Claude Code).
- **Kết quả Codex re-review:** PASS — all fixes applied, build PASS, git clean.
- **Commits:** `95dfeee` (feat: polish phase h6), `4d2f3bd` (fix: round 1), `c7b4f7d` (fix: round 2).
- **Note:** H.6 polished the app into a more client-ready AI Marketing Team Workspace. Visible product wording was corrected from demo/mock framing to Workspace, Sample Data, Sandbox Safe Mode, Client Presentation Pack, and Client Workspace View. Owner/client guide flow and approval-safe framing are now clearer.
- **Trạng thái Phase H.6:** ✅ DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK

### 🗓️ Ngày 05/06/2026 — Phase H.7: Owner View + Client View
- **Sự kiện:** Triển khai Phase H.7 — Owner View + Client View.
- **Người thực hiện:** Builder Agent (Claude Code).
- **Hành động đã hoàn tất:**
  1. `Eye` icon thêm vào lucide-react imports.
  2. `viewMode` state (`'owner' | 'client'`, default `'owner'`) + `handleViewModeSwitch()` handler.
  3. Header: phase badge H.6 → H.7, segmented toggle (🔧 Owner View | 👁 Client View).
  4. Sidebar: 4 tabs ẩn trong Client View (New Campaign Brief, AI Team Board, Manual Export Pack, Client Workspace View).
  5. Sidebar: Safety Guard → Trust & Safety trong Client View (ẩn FnB OS V1, Secrets, Connectors labels).
  6. Dashboard: View context card (indigo cho Owner, emerald cho Client) với quick-switch button.
  7. Auto-redirect về Dashboard khi switch sang Client View từ owner-only tab.
- **Safety Guard H.7 confirmed:** Auto-post: NO | Real Ads: NO | Secrets: NO | FnB OS V1: NO | Sample Data Only: YES
- **Build:** `npm run build` PASS — 0 errors. 342.52 kB JS bundle.
- **Trạng thái Phase H.7:** ✅ DONE + BUILT + PUSHED (initial)

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.7 Codex Review + Fix
- **Sự kiện:** Codex review Phase H.7.
- **Kết quả:** NEEDS FIX — Client View still exposing internal technical clutter in 2 locations.
- **Fix applied:** Commit `2037f61` — fix: clean h7 client view technical wording.
  - Brand Workspace connector boundary: conditional render — Owner View keeps technical arch notes; Client View shows "🛡️ Workspace Scope" with client-facing trust language (sample data, approval required, live connectors in future approved phase).
  - Presentation & Export step 06 Safety Boundaries body: conditional — Owner View keeps "100% offline sandbox / no backend / no database" internal text; Client View uses "Sample Data only / Approval Required / No Live Publishing" language.
  - Stale "Current (H.6)" label → "Current (H.7)" fixed.
- **Build:** `npm run build` PASS — 0 errors. 343.60 kB JS.

### 🗓️ Ngày 05/06/2026 (Local Time) — Phase H.7 CLOSED
- **Sự kiện:** Đóng Phase H.7 — Owner View + Client View.
- **Người thực hiện:** Owner + Codex reviewer + Builder Agent (Claude Code).
- **Kết quả Codex re-review:** PASS — fix applied, build PASS, git clean.
- **Commits:** `9dc235a` (feat: add phase h7 owner and client views), `2037f61` (fix: clean h7 client view technical wording).
- **Note:** H.7 added Owner View and Client View inside the same AI Marketing Team Workspace. Owner View keeps internal review/control information, while Client View is cleaner for client presentation and hides internal technical clutter. Client View now uses trust/scope wording such as Sample Data, Approval Required, No Live Publishing, and No Real Ads unless approved.
- **Trạng thái Phase H.7:** ✅ DONE + CODEX PASS + FIXES APPLIED + BUILT + PUSHED + READY FOR OWNER PRODUCTION CHECK


### 🗓️ Ngày 16/06/2026 (Local Time) — Content Factory V1 n8n AI Provider Label Cleanup
- **Sự kiện:** Dọn nhãn UI generation cho đúng với production n8n flow (Core → n8n → OpenAI → Normalize → Core).
- **Vấn đề:** Generation History (shared) hardcode mọi job là `Mock` kể cả n8n `external_module` job; Automation Factory header nói "do not call external APIs" (sai sau khi wiring n8n).
- **Thay đổi (display text + mode clarity):**
  - `coreData.ts`: thêm `GENERATION_MODE_LABEL` / `_COLOR` / `_SOURCE` (external_module → "n8n AI Provider", mock → "Local fallback mode").
  - `ContentGenerationTab.tsx`: bảng + detail + safety banner → mode-aware, bỏ "AI API not connected".
  - `AutomationFactoryTab.tsx`: header badge/description, card sublabel, nút chính → "Generate with n8n AI Provider"; chip "n8n AI Provider" khi webhook env có, "Local fallback mode" khi không.
  - `App.tsx`: dashboard tile note → "n8n AI provider · approval-first".
  - `connectorRegistry.ts` + seed logs: bỏ wording "mock / no real AI API called".
- **An toàn:** Không auto-post/auto-ads, không thêm connector, OpenAI key chỉ trong n8n Credentials, approval-first giữ nguyên (n8n items → `needs_review`), không đổi approval logic / Supabase / dependencies / secrets.
- **Kiểm thử:** `contentFactory.test.ts` thêm test n8n `external_module` mode + label provenance + approval-first; local fallback label.
- **Build/Test:** `npm run build` PASS (0 errors). `npm test` PASS 49/49 (+2).
- **Trạng thái:** ✅ DONE. Real connector activation: NOT STARTED / Owner-gated. Feedback implementation: NOT STARTED / Owner-gated. Approval semantics: unchanged.

### 🗓️ Ngày 17/06/2026 (Local Time) — Design Brief Generation V1
- **Sự kiện:** Thêm flow tạo Design Brief (text/spec) approval-first qua n8n AI Provider external_module path.
- **Output:** 1 generation job + 5 design brief items (Facebook post, Story/Reels cover, Menu/promo visual, Key visual direction, Designer handoff). content_type='design_brief', status=needs_review, auto-submit lên Approval Board.
- **Reuse (không đổi schema):** `designFactory.ts` mirror `contentFactory.ts`; reuse ContentPlanJob/ContentPlanItem/approval model; `handleDesignFactoryGenerate` reuse wiring của content pack; reuse GENERATION_MODE_LABEL.
- **Env:** `VITE_N8N_DESIGN_FACTORY_WEBHOOK_URL` (path riêng). Có → external_module ("n8n AI Provider"); thiếu → local fallback ("Local fallback mode"). Nút: "Generate Design Briefs with n8n AI Provider" / "...with Local fallback".
- **n8n:** thêm `n8n-workflows/design_factory_v1.workflow.json` (additive, placeholder AI node, validate `generate_images=false` + `no_image_generation=true`).
- **An toàn:** Text/spec only, KHÔNG image generation, KHÔNG Canva/ComfyUI/Fal.ai, KHÔNG Meta/TikTok/Zalo, KHÔNG auto-post/auto-ads. Approval-first giữ nguyên. OpenAI key chỉ trong n8n Credentials. Không đổi Supabase/approval logic/dependencies. Content Factory V1 không đổi.
- **Tests:** `designFactory.test.ts` (+4): payload approval-first/no-image, local fallback label, n8n external_module label + provenance, approval-first, fail-safe khi không có items.
- **Build/Test:** `npm run build` PASS. `npm test` PASS 53/53 (+4).
- **Trạng thái:** ✅ DONE. Real connector activation: NOT STARTED / Owner-gated. Approval semantics: unchanged.

### 🗓️ Ngày 17/06/2026 (Local Time) — Design Factory V1 quality + metadata consistency
- **Sự kiện:** Cải thiện chất lượng output + đồng nhất metadata cho Design Factory V1.
- **Quality:** Bỏ placeholder generic "Owner to confirm objective/format/copy/CTA". Core `mapDesignItem` neo về canonical spec (match theo key, else theo thứ tự) và dùng "Assumption: ..." khi thiếu dữ liệu — không còn "Owner to confirm".
- **Metadata:** `workflow_type: design_factory`, `content_type: design_brief` (trước đây dùng design_brief cho cả hai và bị rò `content_pack`). Core FORCE workflow_type/content_type theo hằng số nên AI response sai cũng không mislabel được.
- **n8n workflow:** Validate node chấp nhận cả `design_factory` lẫn `design_brief` (deploy order an toàn 2 chiều); items + envelope set `workflow_type: design_factory` + `content_type: design_brief`; bỏ "owner to confirm" trong offer default.
- **Runbook:** thêm OpenAI system prompt (5 items cụ thể, quy tắc "Assumption:", cấm image generation) + cập nhật contract design_factory/content_type + ghi chú re-import + redeploy.
- **An toàn:** approval-first giữ nguyên (needs_review), text/spec only, no image generation, no auto-post/ads, no connector. Không đổi schema/RLS/approval logic/dependencies. Không commit secret/URL thật.
- **Tests:** `designFactory.test.ts` cập nhật (workflow_type design_factory, content_type metadata, no "Owner to confirm", spec fallback cho item thiếu field).
- **Build/Test:** `npm run build` PASS. `npm test` PASS 53/53.
- **Trạng thái:** ✅ DONE (cần re-import n8n workflow + redeploy Core để áp dụng metadata mới; Validate chấp nhận cả 2 contract nên không vỡ).

### 🗓️ Ngày 18/06/2026 (Local Time) — Phase D: Approval Queue / Output Review UX Polish
- **Sự kiện:** Polish trải nghiệm review/approval khi cả 5 module AI Factory V1 (Content/Design/Video/Ads/Report) đã tạo pending approval item thật. **Display-only** — KHÔNG đổi approval state machine, repository, routing, Supabase RLS, auth, webhook URL, env, credentials, n8n workflow.
- **D1 — Preview header theo module:** detail preview header dùng `modulePreviewLabel(module)` → Content Preview / Design Brief Preview / Video Script Preview / Ads Draft Preview / Report Draft Preview, fallback "Output Preview". Module detect từ `workflow_type` metadata rồi `content_type` (hoạt động cho mọi item, không hardcode 1 item test).
- **D2 — Filters:** đã có sẵn từ Phase A2 (status tabs, search, module, client/brand/campaign, priority, toggle hide local/demo). Phase D thêm **Source filter** (All / n8n AI Provider / Local demo / Legacy) — UI-only, không đổi schema, degrade an toàn khi thiếu dữ liệu.
- **D3 — Detail layout per type:** `splitCaption()` tách body (đọc được) khỏi metadata block; panel **Provenance & Safety** parse từ chính metadata của draft (workflow/source/mode/status/owner-approval + safety flags). `moduleFieldLabels(module)` đổi nhãn field dùng chung theo module (KHÔNG bịa field mới). Hiện thêm pillar/angle/channel/day chip.
- **D4 — Approved ≠ Published rõ hơn:** approved detail ghi "Approved for internal use. Not published or launched."; card approved ghi "· internal use — not published or launched". KHÔNG thêm nút publish/launch/schedule/spend.
- **D5 — Docs:** `08_logs/phase_d_approval_queue_review_ux_polish_20260618.md` (gồm Phase C smoke-test PASS rollup + Phase D summary + safety + files changed + validation).
- **Refactor:** tách classifier Phase A2 ra `src/lib/core/approvalClassify.ts` (reusable + test được), thêm helper D1/D3. `approvalClassify.test.ts` (+15 test).
- **Files:** `src/lib/core/approvalClassify.ts` (new), `src/lib/core/approvalClassify.test.ts` (new), `src/components/core/ApprovalsTab.tsx`. Không thêm CSS class mới, không thêm dependency.
- **An toàn:** approval-first giữ nguyên; Approved ≠ Published rõ hơn; no auto-post/auto-ads/publish/schedule/launch/spend; no live connector; no image/video gen; no live analytics pull; no fake metric; OpenAI key chỉ ở n8n; no secret/webhook URL committed; n8n workflow JSON không đổi.
- **Build/Test:** `npm run build` PASS (1583 modules, entry 357.71 kB, no >500 kB warning, 0 TS error). `npm run test` PASS **90/90** (+15). `node contracts/tools/validate_contracts.js` ALL PASS. `git diff --check` clean. Secrets/webhook scan clean.
- **Trạng thái:** ✅ DONE / PASS. Approval semantics: unchanged. Real connector activation: NOT STARTED / Owner-gated.

### 🗓️ Ngày 18/06/2026 (Local Time) — Phase E: Manual Delivery / Publishing Tracker UI
- **Sự kiện:** Thêm tracker NỘI BỘ, THỦ CÔNG để Owner/staff ghi nhận điều gì xảy ra với output SAU khi approve (đã gửi client / đăng tay ngoài Core / lưu trữ…). **KHÔNG phải automation — Core KHÔNG post/schedule/launch/spend/gọi platform nào.**
- **Thiết kế (theo constraint):** lưu ở localStorage riêng `core_agency_manual_delivery_v1` (key theo approval request id), **độc lập hoàn toàn** với approval state machine / repository / Supabase / RLS / network. KHÔNG đổi DB schema, KHÔNG đổi auth/routing/RLS, KHÔNG đổi n8n workflow JSON, KHÔNG đổi App.tsx.
- **E1 — Status labels:** Not delivered / Ready for manual delivery / Delivered to client / Manually posted outside Core / Archived. `DeliveryChip` hiện trên card (chỉ khi khác default) + detail tracker.
- **E2 — Safe controls (detail, owner/manager `canApprove`):** set status buttons + add manual post/reference link + add delivery note + clear/reset. Chỉ ghi vào local store; KHÔNG external call/publish/schedule/launch/spend. Viewer read-only.
- **E3 — Messaging:** approved = "Approved for internal use. Not published or launched by Core."; khi manually posted = "Marked as manually posted outside Core by Owner/staff." (Core không bao giờ bị ngụ ý là đã đăng).
- **E4 — Delivery view filter:** dropdown UI-only (All / Approved · not delivered / Delivered to client / Manually posted outside Core / Pending approval / Needs revision) qua `matchesDeliveryView()`, AND với các filter sẵn có.
- **E5 — Detail "Manual Delivery Tracker":** status, reference link (clickable CHỈ khi http/https an toàn qua `isSafeHttpLink`, còn lại hiện text; Core không bao giờ mở/fetch), note, last-updated, safety note "Core does not auto-post or launch ads."
- **E6 — Docs:** `08_logs/phase_e_manual_delivery_publishing_tracker_20260618.md`.
- **Files:** `src/lib/core/manualDelivery.ts` (new), `src/lib/core/manualDelivery.test.ts` (new, +10 test), `src/components/core/ApprovalsTab.tsx`. Không thêm CSS class/dependency/App.tsx change.
- **An toàn:** approval-first giữ nguyên; Approved ≠ Published rõ ("by Core"); manually posted = ngoài Core; no auto-post/auto-ads/publish/schedule/launch/spend; no live connector; link chỉ là text; no image/video gen; no live analytics; no fake metric; no secret/webhook/env committed; n8n workflow JSON không đổi; repo/RLS/auth không đổi.
- **Build/Test:** `npm run build` PASS (1583 modules, entry 357.71 kB, no >500 kB warning, 0 TS error). `npm run test` PASS **100/100** (+10). `node contracts/tools/validate_contracts.js` ALL PASS. `git diff --check HEAD^ HEAD` clean. Secrets/webhook scan clean.
- **Trạng thái:** ✅ DONE / PASS. Approval semantics: unchanged. Cross-device delivery sync (DB table + RLS): NOT STARTED / Owner-gated (out of scope phase này).

### 🗓️ Ngày 18/06/2026 (Local Time) — Phase F: Client Handoff / Export Pack UI
- **Sự kiện:** Thêm UI **Client Handoff Pack** NỘI BỘ, an toàn để Owner gom các output ĐÃ APPROVE thành một delivery pack hướng tới client để copy/export/review. **Chỉ là export/copy thủ công nội bộ — KHÔNG gửi email tự động, KHÔNG post platform, KHÔNG launch ads, KHÔNG gọi connector ngoài, KHÔNG sinh ảnh/video, KHÔNG kéo analytics live.**
- **Thiết kế:** builder thuần `src/lib/core/handoffPack.ts` — PURE + READ-ONLY (đọc clients/brands/campaigns + contentItems + approvalRequests + map manual delivery Phase E), trả string/object; KHÔNG ghi localStorage, KHÔNG DB, KHÔNG network. Chỉ approval request status đúng `approved` mới thành candidate.
- **F1 — Tab + grouping:** tab "Client Handoff"; output approved gom theo Client → Brand → Campaign, Module/type (Content/Design/Video/Ads/Report) hiện badge từng dòng + dùng để sort/filter. Dùng `approvalClassify` sẵn có, chỉ data approval/output hiện có.
- **F2 — Pack builder:** Owner chọn item approved (checkbox từng item / từng group / select-all / clear) → preview. Pack gồm: pack title, overview client/brand/campaign, item, module label, approval status, **manual delivery status (Phase E, đọc read-only)**, safety note "This is an internal handoff pack. Core did not publish, launch, schedule, or spend."
- **F3 — Copy/export:** "Copy to clipboard" (fallback select textarea) + "Download .md/.txt" (Blob + object URL local only — KHÔNG PDF, KHÔNG Drive/Gmail/Canva/Meta/TikTok/Zalo/API ngoài).
- **F4 — Client-safe format:** Campaign Overview → section theo module (Approved Content Items / Design Briefs / Video Scripts / Ads Drafts / Report Drafts / Other) → Delivery Notes. Mỗi item hiện body sạch (`splitCaption()` bỏ metadata block). Report giữ nguyên data label (Provided/Simulated/Missing/Owner input required) từ draft — KHÔNG bịa số liệu, KHÔNG ngụ ý đã đăng/launch.
- **F5 — Approved ≠ Published:** mọi pack ghi "Approved for handoff. Not published, scheduled, launched, or spent by Core."; item đăng tay ghi "Marked as manually posted outside Core by Owner/staff."
- **F6 — Docs:** `08_logs/phase_f_client_handoff_export_pack_20260618.md`.
- **Files:** `src/lib/core/handoffPack.ts` (new), `src/lib/core/handoffPack.test.ts` (new, +18 test), `src/components/core/ClientHandoffTab.tsx` (new), `src/App.tsx` (lazy import + nav button + render block + icon). KHÔNG đổi repo/Supabase/RLS/auth/approval state machine/n8n workflow JSON/contracts/env/secrets.
- **An toàn:** approval-first giữ nguyên (chỉ approved mới handoff); Approved ≠ Published rõ ("by Core"); manually posted = ngoài Core; no auto-post/auto-ads/publish/schedule/launch/spend; no live connector (0 HTTP); no image/video gen; no live analytics; no fake metric; read-only (chỉ `loadManualDelivery()`); no secret/webhook/env committed; n8n workflow JSON không đổi.
- **Build/Test:** `npm run build` PASS (1586 modules, entry 358.43 kB, no >500 kB warning, 0 TS error; ClientHandoffTab chunk 21.16 kB). `npm run test` PASS **118/118** (+18). `node contracts/tools/validate_contracts.js` ALL PASS. `git diff --check` clean. Secrets/webhook scan clean.
- **Trạng thái:** ✅ DONE / PASS. Approval semantics: unchanged. Pack history persistence + cross-device delivery sync: NOT STARTED / Owner-gated (out of scope).

### 🗓️ Ngày 18/06/2026 (Local Time) — Phase G: Client Feedback / Revision Loop UI
- **Sự kiện:** Thêm UI feedback + revision loop NỘI BỘ, an toàn. Sau khi handoff pack được chuẩn bị/giao tay, Owner ghi nhận feedback của client, phân loại, và tạo internal revision note để follow-up. **Manual/internal only — KHÔNG gửi email, KHÔNG nhắn tin, KHÔNG gọi n8n, KHÔNG trigger OpenAI, KHÔNG regenerate AI, KHÔNG post platform, KHÔNG launch ads, KHÔNG connector ngoài, KHÔNG kéo analytics live.**
- **Thiết kế:** store thuần `src/lib/core/clientFeedback.ts` — localStorage riêng `core_agency_client_feedback_v1` (key theo feedback id), ĐỘC LẬP HOÀN TOÀN với approval state machine / repository / Supabase / network (giống Phase E). Pure mutators (`addFeedback`/`updateFeedback`/`setFeedbackStatus`/`deleteFeedback` trả map mới, không mutate input). **Ghi feedback KHÔNG BAO GIỜ đổi approval status** — quyết định approve chỉ ở Approval Queue qua Core UI có auth.
- **G1 — Feedback section:** mỗi record có client note + source (manual note/call/chat/meeting/other) + type (copy/design/video/ads/report/general edit) + priority (low/normal/high) + status (open/in review/resolved/archived).
- **G2 — Link to items:** feedback link tới approved output item (qua approval request id sẵn có, list từ `collectHandoffCandidates`) và/hoặc handoff pack reference (text). Module/type suy ra từ item link hoặc feedback type. Chỉ dùng id/metadata sẵn có, KHÔNG mutate approval status.
- **G3 — Revision note builder:** `buildRevisionNote()` preview an toàn = original item title/module + tóm tắt client feedback + internal revision instructions + owner note + safety note "This revision note is internal. Core did not send, publish, schedule, launch, or spend." KHÔNG gọi AI/n8n, KHÔNG regenerate. Copy clipboard + download .md/.txt local (Blob only).
- **G4 — Filters:** view tab UI-only (All / Open / In review / Resolved / Archived / High priority) + dropdown module/type, qua `feedbackMatches`/`filterFeedback` thuần. Không bịa data.
- **G5 — Copy rõ ràng:** "Approved means approved for internal handoff only." / "Handoff pack means prepared/exported manually, not sent automatically." / "Core does not email, message, publish, schedule, launch ads, or spend." (banner + safety panel + revision note).
- **G6 — Docs:** `08_logs/phase_g_client_feedback_revision_loop_20260618.md`.
- **Files:** `src/lib/core/clientFeedback.ts` (new), `src/lib/core/clientFeedback.test.ts` (new, +17 test), `src/components/core/FeedbackRevisionTab.tsx` (new), `src/App.tsx` (MessageSquare icon + lazy import + nav button owner/manager-gated + render block + `client-feedback` vào `ownerOnlyTabs`). KHÔNG đổi repo/Supabase/RLS/auth/approval state machine/n8n workflow JSON/contracts/env/secret.
- **An toàn:** approval-first giữ nguyên (feedback không đổi approval status); Approved ≠ Published + Handoff ≠ Sent rõ; no email/messaging/n8n/OpenAI/AI-regen; no auto-post/auto-ads/publish/schedule/launch/spend; no live connector (0 HTTP); no image/video gen; no live analytics; no fake metric; localStorage chỉ store feedback riêng; no secret/webhook/env committed; n8n workflow JSON không đổi. Tab internal-only (owner/manager).
- **Build/Test:** `npm run build` PASS (no >500 kB warning, 0 TS error; FeedbackRevisionTab chunk 20.94 kB). `npm run test` PASS **135/135** (11 files; +17). `node contracts/tools/validate_contracts.js` ALL PASS. `git diff --check` clean. Secrets/network/AI/n8n scan clean.
- **Trạng thái:** ✅ DONE / PASS. Approval semantics: unchanged. Cross-device feedback sync + AI-assisted revision = NOT STARTED / Owner-gated (out of scope).

---

> **Catch-up note (2026-06-24):** From **Phase H onward** each phase ships its own
> per-phase log file in `08_logs/phase_*.md` (the one-log-file-per-phase
> convention), so this rolling log was not updated for H–M. **Phases H, I-S2…I-S8,
> J, K, L, M** are recorded in their individual `08_logs/phase_*.md` logs and
> summarized in the project-status memory — see those files; this rolling log was
> not back-filled for them. The entries below bring `phase_log.md` current for the
> latest **N / O / P** phases (all DONE / PASS, pushed to `origin/main`).

### 🗓️ Ngày 24/06/2026 (Local Time) — Phase N: AI Factory Brand Context Injection
- **Commit:** `bdc4adf` (pushed `origin/main`).
- **Sự kiện:** Wire the shared **Brand Brain** snapshot (Phase M `buildBrandBrain`) into all 5 AI Factory request payloads (Content / Design / Video / Ads / Report) so every draft is grounded in ONE normalized brand context.
- **Thiết kế:** new `buildAiFactoryBrandContext` / `buildBrandContextSnapshot` / `BrandContextSnapshot` in `src/lib/core/brandBrain.ts` (pure, list-capped, `source:'internal'`, draft-only, `APPROVED_NOT_PUBLISHED_REMINDER` pinned, no circular import); additive `brand_brain_context` on each `create*Payload`; new read-only `BrandGroundingPanel` in `AutomationFactoryTab.tsx`.
- **An toàn:** internal/draft-only snapshot; Approved ≠ Published explicit; no fetch/axios/OAuth/webhook/external URL; no OpenAI key/env in Core; no upload/publish/post/ads/launch/activate/sync; outputs stay draft/pending approval; connector ledger read-only; Canva sandbox/mock only; no Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination.
- **Build/Test:** `npm run build` PASS (no >500 kB warning, 0 TS errors). `npm run test` PASS **26 files / 262** (+13). Log: `08_logs/phase_n_ai_factory_brand_context_injection_20260624.md`.
- **Trạng thái:** ✅ DONE / PASS. Approval semantics: unchanged.

### 🗓️ Ngày 24/06/2026 (Local Time) — Phase O: Approval Queue Brand Context Snapshot Preview
- **Commit:** `2692a73` (pushed `origin/main`).
- **Sự kiện:** Surface each approval item's originating Brand Brain context snapshot (Phase N) in the Approval Queue detail so reviewers see what grounded each AI draft.
- **Thiết kế:** `brandContextFor()` in `ApprovalsTab.tsx` rebuilds the same `buildAiFactoryBrandContext` snapshot from the draft's brand/client/campaign/brief; new read-only `BrandContextSnapshotPanel` (brand identity, positioning, campaign context, target customers, voice, pillars, creative do/don't, compliance, source/status + Approved ≠ Published footer); `briefs` prop added to `ApprovalsTab` (App.tsx passes `coreData.briefs`).
- **An toàn:** read-only / review-only; approval state machine + handlers untouched; outputs stay draft/pending approval; no live connectors/fetch/axios/secrets/webhook/URL; Canva sandbox/mock only; no contamination.
- **Build/Test:** `npm run build` PASS. `npm run test` PASS **27 files / 269** (+7). Log: `08_logs/phase_o_approval_queue_brand_context_snapshot_preview_20260624.md`.
- **Trạng thái:** ✅ DONE / PASS. Approval semantics: unchanged.

### 🗓️ Ngày 24/06/2026 (Local Time) — Phase P: Approval Revision Loop & Decision Audit Trail
- **Commit:** `b26618b` (pushed `origin/main`).
- **Sự kiện:** Surface the existing approval **revision loop** + **decision audit trail** in the Approval Queue detail — built on the existing state machine + event log (no model change).
- **Thiết kế:** new pure `src/lib/core/approvalDecision.ts` (`deriveLatestDecision` / `isAwaitingRevision` / `summarizeDecisions` + pinned `REVISION_LOOP_COPY`); `ApprovalsTab.tsx` adds **"Changes Requested — Awaiting Revised Output"** placeholder (original AI draft preserved, Brand Context Snapshot preserved, Core does not auto-regenerate, nothing published) + **"Latest Decision & Feedback"** panel. No new approval states (existing `submitted/approved/rejected/revision_requested/cancelled` kept compatible); Request Changes never deletes the AI output (`executeApprovalAction` preserves the content item + records an audit event).
- **An toàn:** no auto-post / no auto-ads / no live connector / no webhook URL / no fetch/axios / no secrets/env; **Approved ≠ Published** explicit; outputs stay draft / pending approval / revision_requested; no published/posted/launched state; no contamination.
- **Build/Test:** `npm run build` PASS (no >500 kB warning, 0 TS errors). `npm run test` PASS **28 files / 284** (+15). Log: `08_logs/phase_p_approval_revision_loop_decision_audit_trail_20260624.md`.
- **Trạng thái:** ✅ DONE / PASS. Approval semantics: unchanged.

### 🗓️ Ngày 24/06/2026 (Local Time) — Phase Q: Client-ready Campaign Pack Export / Handoff
- **Sự kiện:** Pack **campaign-centric** mới — gom các deliverable đã **APPROVED** của MỘT campaign thành dossier client-ready, **copy / download** local (.md/.txt). Surface trong Campaign Production Workspace (Phase K).
- **Thiết kế:** new pure/read-only `src/lib/core/campaignPack.ts` (`resolveCampaignPackContext` dựng Brand-Context cover từ cùng `buildBrandContextSnapshot` của AI Factory/Approval Queue — internal/draft-only; `collectCampaignPackItems` chỉ nhận request status **chính xác `approved`** đúng campaign + kèm provenance Phase P + manual-delivery Phase E read-only; `campaignModuleBreakdown`/`buildCampaignPack`(Markdown/plain-text)/`campaignPackFileStem`; verbatim safety constants Approved ≠ Published / "Core did not publish, launch, schedule, or spend"). New `src/components/core/CampaignPackPanel.tsx` = panel tự giữ state (select → build → copy clipboard / download `Blob` local) — tách riêng để `CampaignWorkspace` giữ stateless (giữ nguyên source-scan contract Phase K, không `useState`). `CampaignWorkspace.tsx` render panel + 3 prop pass-through (`approvalEvents`/`userRole`/`actorLabel`); `App.tsx` scope `wsApprovalEvents` theo campaign + truyền props. Build pack **không** đổi approval state.
- **An toàn:** approval-first (chỉ pack item `approved`); **Approved ≠ Published** verbatim trên mọi pack; no auto-post / no auto-ads / no spend (chỉ copy + download local, không posting/schedule/launch path); no fake metrics (report giữ nhãn Provided/Simulated/Missing/Owner input required); no live connector / no webhook / no fetch/axios / no secrets / no env change; `https://` duy nhất là fixture link hư cấu trong test (tái dùng y Phase F để verify `isSafeHttpLink`); no Forme/sofa/furniture/nội thất/Fal.ai/ImgBB contamination.
- **Build/Test:** `npm run build` PASS (no >500 kB warning, 0 TS errors; entry `index` 376.11 kB). `npm run test` PASS **30 files / 316** (+2 files / +32). Log: `08_logs/phase_q_client_ready_campaign_pack_export_20260624.md`.
- **Trạng thái:** ✅ DONE / PASS. Approval semantics: unchanged.
