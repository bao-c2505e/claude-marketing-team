# Canva Connector Module

> ⚠️ **STATUS — CONTRACT / DESIGN SPEC ONLY (sandbox / future-only).**
> This document describes the *intended future* Canva module. **It is NOT
> implemented and NOT live.** In the current phase CORE only has a
> **Canva Sandbox Preview** (`src/lib/core/connectors/canvaSandboxConnector.ts`)
> which is pure/offline and mock-only:
> - **No real Canva API / SDK / OAuth / token / env is used or required.**
> - **No Canva design is created. Nothing is published. Real connector action = none.**
> - Sandbox output is a draft preview that lands in the approval queue
>   (`needs_review`); Owner approval authorises **internal use only** — never a
>   real Canva design and never a publish/launch.
>
> Anything below describing live Canva API calls, design IDs/URLs, exports, or
> required API keys is a **future, approval-gated** design target only. A real
> Canva connector may be built only by following
> `CLAUDE_MARKETING_TEAM/07_runbooks/connector_activation_safety_runbook.md`
> (per-connector Owner sign-off, dry-run/sandbox first). See `CLAUDE.md` §7.

This module is *intended, in a future phase,* to connect with the Canva API to
generate and modify design templates based on assets and guidelines.

## 0. Current sandbox preview flow (E2E approval preview layer)

The only Canva capability live today is the offline **Canva Sandbox Preview**.
From the Automation Factory tab (Owner/Manager), running *Canva Sandbox Preview*
on a selected brief produces mock design preview specs that flow through the
normal approval queue. Each preview carries a flat **handoff record** that the UI
and the audit log read to prove the sandbox boundary:

| Field | Value (sandbox) | Meaning |
|---|---|---|
| `provider` | `canva` | Which connector this stands in for. |
| `mode` | `sandbox` | Sandbox/mock — never production. |
| `external_call` | `false` | No `fetch`, no real Canva API, no external URL. |
| `requires_env` | `false` | No `CANVA_API_KEY` / OAuth / token needed. |
| `publish_capability` | `false` | Cannot publish / post / launch / schedule. |
| `approval_required` | `true` | Must clear an Owner approval gate. |

These flags are fixed `false`/`true` literals — **no approval decision can flip
them.** Approving a preview means it is `approved` for **internal use only**
(ready for manual handoff / export / mock preview) — it never becomes
`published` and never triggers a real connector action.

**Approval history** is preserved end-to-end on every preview so the Approval
detail view always shows how an item reached its state. There is deliberately no
"Published"/"Launched" step:

```
Generated draft
  → Canva sandbox preview created
  → Submitted for approval
  → Approved (internal use only — not published) / Rejected (internal)
```

Implementation: `src/lib/core/connectors/canvaSandboxConnector.ts`
(`runCanvaSandboxConnector`, `buildCanvaSandboxAuditLog`) and
`src/lib/core/connectors/canvaApprovalContract.ts`
(`buildCanvaSandboxHandoffRecord`, `buildCanvaApprovalHistory`).

### Owner QA & Release Lock (Phase I-S5)

The Canva sandbox is cleared for **demo / internal release in sandbox mode only**
and structurally **locked off** from anything live. `CANVA_SANDBOX_RELEASE_LOCK`
(in `src/lib/core/connectors/canvaReleaseLock.ts`) pins
`releaseMode: 'sandbox_locked'` with hard-`false` capability literals
(`liveConnectorEnabled`, `publishEnabled`, `requiresEnv`, `oauthEnabled`,
`externalUrlEnabled`, `webhookEnabled`) plus `approvalRequired: true` and
`approvedDoesNotPublish: true`. `buildCanvaOwnerQaReport()` produces the Owner
sign-off checklist (sandbox/mock only · approval preview exists · Owner can
review · Approved ≠ Published · no publish/post/ads/launch action · no live
env/API/OAuth · no external URL/webhook · release locked sandbox), each derived
from the single-sourced sandbox safety flags / handoff record. The
AutomationFactory UI shows the **🔒 Sandbox Release Locked** badge, the checklist,
and the lock flags. A real Canva connector stays future-only behind the
connector activation runbook + Owner sign-off.

## 1. Mục tiêu (Objective)
Nhận asset links, template IDs và text/brand guidelines từ n8n/Core. Gọi Canva API để update template, generate designs và callback asset URLs trả về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Approval**: Module này không đăng bài trực tiếp, nhưng việc sinh thiết kế thương mại (commercial designs) có thể yêu cầu phê duyệt thông số nếu được bật `safety.requires_approval = true`.
- **Hành động bị cấm**: Không tự ý publish template ra công chúng (public templates) hoặc sửa đổi thiết kế đã chốt mà không có yêu cầu từ Core.
- **Biến môi trường mẫu** (⚠️ **KHÔNG bắt buộc trong phase hiện tại — sandbox
  không cần key**; chỉ là placeholder cho phase tương lai, không commit giá trị thật):
  - `CANVA_API_KEY`: API Key kết nối tài khoản Canva Developer (Placeholder, future-only).
  - `CANVA_BRAND_FOLDER_ID`: Thư mục lưu trữ assets thương hiệu (Placeholder, future-only).
