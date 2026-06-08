# n8n Automation Backbone Plan

This document details the architectural plan, routing patterns, and safety mechanisms for n8n as the automation backbone of The Core Agency.

## 1. Vai trò của n8n
n8n chịu trách nhiệm điều phối toàn bộ luồng công việc tự động giữa Core và các Specialist Modules. n8n đóng vai trò là "người vận chuyển" và "bộ định tuyến", không lưu giữ trạng thái nghiệp vụ (business state) lâu dài. Core Database vẫn là Source of Truth duy nhất.

- **PC2 Scope**: n8n workflows nằm hoàn toàn trong phạm vi PC2.
- **Không nghiệp vụ nặng (No Heavy Processing)**: n8n chỉ chuyển tiếp dữ liệu, parse thông tin cơ bản và gọi API/Webhook. Mọi xử lý chuyên môn nặng (sinh ảnh, tối ưu quảng cáo, phân tích số liệu) đều được chuyển cho các Modules.
- **Không tự ý phê duyệt**: n8n không tự đưa ra quyết định phê duyệt các hành động nhạy cảm.

## 2. Kiến trúc và Luồng Định Tuyến (Routing Patterns)
n8n sẽ quản lý 3 luồng công việc chính thông qua các template/placeholder workflows:

### A. Core Event Router (Bộ định tuyến sự kiện từ Core)
- **Mục tiêu**: Nhận tất cả webhook sự kiện từ Core, phân loại dựa trên `event_type`, áp dụng các workflow-level safety gates và chuyển đến các module tương ứng.
- **Luồng xử lý**:
  1. Nhận Event Payload (đáp ứng `core_to_n8n_event.schema.json`).
  2. Xác thực cấu trúc payload cơ bản và trích xuất thông số an toàn.
  3. Sử dụng Node Switch/Router để điều hướng dựa trên `event_type`:
     - `DESIGN_REQUEST` → Định tuyến tới ComfyUI Module.
     - `CAMPAIGN_PUBLISH` → Định tuyến tới cổng an toàn `IF: Safety Gate - Publishing Approved`.
     - `ADS_SPEND_TRIGGER` → Định tuyến tới cổng an toàn `IF: Safety Gate - Ads Spend Approved`.
  4. Tại mỗi cổng an toàn (IF Node), kiểm tra toàn bộ điều kiện:
     - Với Publishing: `approval_status == "APPROVED" && final_approval_granted == true && allow_auto_publish == true && allow_real_world_action == true`.
     - Với Ads Spend: `approval_status == "APPROVED" && final_approval_granted == true && allow_ads_spend == true && allow_real_world_action == true`.
  5. Nếu thỏa mãn tất cả điều kiện, chuyển tiếp yêu cầu tới module API tương ứng (Facebook Publisher hoặc Meta Ads Connector).
  6. Nếu bất kỳ điều kiện nào thất bại (False), định tuyến đến Node `HTTP: Callback Core - Rejected By Safety` để gửi callback từ chối với status `REJECTED_BY_SAFETY` và lý do an toàn về Core.

### B. Approved Design to ComfyUI (Điều phối sinh Asset)
- **Mục tiêu**: Điều phối tác vụ sinh thiết kế tự động khi có yêu cầu sinh ảnh/video.
- **Luồng xử lý**:
  1. Nhận thiết kế mẫu/prompt/brief từ Router.
  2. Kiểm tra cờ an toàn (`safety.requires_approval` và `safety.final_approval_granted`).
  3. Nếu cần approval mà chưa được duyệt (`requires_approval = true` và `final_approval_granted = false`), dừng hoặc báo lỗi về Core.
  4. Nếu đã được duyệt hoặc không cần duyệt, đóng gói thông số gửi sang ComfyUI API (Asynchronous).
  5. Đợi ComfyUI xử lý (hoặc nhận callback từ ComfyUI).

### C. Module Result Callback to Core (Trả kết quả về Core)
- **Mục tiêu**: Hợp nhất các kết quả từ các Modules chuyên môn và cập nhật lại trạng thái cho Core.
- **Luồng xử lý**:
  1. Nhận webhook callback từ Module (đáp ứng `module_to_core_callback.schema.json`).
  2. Map kết quả (asset URL, execution status, logs) vào cấu trúc API callback của Core.
  3. Thực hiện gọi HTTP POST đến webhook callback endpoint của Core.

## 3. Chính sách Human-in-the-loop & Safety Policies
n8n bắt buộc phải thực thi các ràng buộc an toàn sau đối với mọi workflow:

| Tên Tham Số Safety | Kiểu dữ liệu | Ý nghĩa & Quy tắc trong n8n |
| :--- | :--- | :--- |
| `requires_approval` | Boolean | Nếu `true`, workflow bắt buộc phải kiểm tra trạng thái phê duyệt trước khi chuyển sang bước tiếp theo. |
| `final_approval_granted` | Boolean | Phải là `true` để các tác vụ tác động thực tế (Ads spend, publishing, messaging) được thực thi. |
| `allow_real_world_action` | Boolean | Cờ tổng để chặn mọi tương tác thực tế với API bên ngoài trong môi trường thử nghiệm/sandbox. |
| `allow_auto_publish` | Boolean | Cho phép tự động publish bài đăng (chỉ kích hoạt khi được set `true` rõ ràng từ Core). |
| `allow_ads_spend` | Boolean | Cho phép chạy chiến dịch quảng cáo có mất phí. |
| `allow_customer_messaging` | Boolean | Cho phép gửi tin nhắn tới khách hàng thật. |

- **Quy tắc chặn cứng (Hard Constraints) trong n8n**:
  - Tại router-level, trước khi chuyển tiếp yêu cầu đến các module tác động thực tế (như Facebook Publisher, Meta Ads Connector), n8n phải có một cổng an toàn Conditional (IF) kiểm tra giá trị của các cờ `final_approval_granted`, `allow_*` tương ứng, và trạng thái `approval_status == "APPROVED"`.
  - Nếu điều kiện không thỏa mãn, workflow định hướng qua nhánh False để kích hoạt Node `HTTP: Callback Core - Rejected By Safety`, gửi payload chứa status `REJECTED_BY_SAFETY` và lý do an toàn về Core webhook. Tuyệt đối không thực hiện API call thật tới các Module.
