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

## 1. Mục tiêu (Objective)
Nhận asset links, template IDs và text/brand guidelines từ n8n/Core. Gọi Canva API để update template, generate designs và callback asset URLs trả về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Approval**: Module này không đăng bài trực tiếp, nhưng việc sinh thiết kế thương mại (commercial designs) có thể yêu cầu phê duyệt thông số nếu được bật `safety.requires_approval = true`.
- **Hành động bị cấm**: Không tự ý publish template ra công chúng (public templates) hoặc sửa đổi thiết kế đã chốt mà không có yêu cầu từ Core.
- **Biến môi trường mẫu** (⚠️ **KHÔNG bắt buộc trong phase hiện tại — sandbox
  không cần key**; chỉ là placeholder cho phase tương lai, không commit giá trị thật):
  - `CANVA_API_KEY`: API Key kết nối tài khoản Canva Developer (Placeholder, future-only).
  - `CANVA_BRAND_FOLDER_ID`: Thư mục lưu trữ assets thương hiệu (Placeholder, future-only).
