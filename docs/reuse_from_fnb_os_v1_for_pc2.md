# Reference and Reuse Strategy from FnB OS V1 / Vị Cuốn Growth OS

This document outlines how PC2 workstream references and conceptually reuses patterns from FnB OS V1 (Vị Cuốn Growth OS) without introducing direct runtime dependencies, hardcoded configurations, or credential leaks.

---

## 1. Reusable Patterns (Mẫu thiết kế được phép tái sử dụng)
Chúng ta được phép kế thừa về mặt ý tưởng và kiến trúc (conceptual reuse) từ FnB OS V1 đối với các mẫu sau:

- **Approval Gate Pattern (Mẫu cổng phê duyệt)**: Quy trình kiểm tra trạng thái phê duyệt trước khi kích hoạt hành động thực tế.
- **Pending/Approved/Rejected Status Flow**: Luồng chuyển đổi trạng thái đồng bộ giữa Core và các module bên ngoài.
- **n8n Workflow Skeleton Structure**: Cấu trúc tổ chức các node trong n8n (Webhook -> Code validator -> Switch router -> Worker Node -> Callback).
- **Webhook Callback Pattern**: Sử dụng webhook để gửi phản hồi bất đồng bộ từ các background worker/dịch vụ chuyên môn về Core webhook.
- **Safety Gate Rules**: Bộ quy tắc kiểm tra cờ an toàn như `requires_approval`, `final_approval_granted`, `allow_real_world_action`, `allow_auto_publish`, `allow_ads_spend`, và `allow_customer_messaging`.
- **Logs/Governance Pattern**: Cơ chế lưu vết kiểm tra (audit log) và cấu trúc payload tracking (chứa `event_id`, `correlation_id`, `job_id`, `created_at`).
- **Brand Brain Input Structure**: Định nghĩa cấu trúc dữ liệu mô tả thuộc tính thương hiệu (Brand Context) làm input cho các module sáng tạo nội dung.
- **Content/Creative/Ads/CRM Module Ideas**: Ý tưởng thiết kế các module chuyên môn độc lập để xử lý sinh ảnh, tối ưu ads, và quản lý hội thoại.
- **Importable n8n Workflow JSON Style**: Cách viết và đóng gói workflow dưới dạng file JSON sạch, không chứa thông tin nhạy cảm của hệ thống thật, sẵn sàng để import thủ công.

---

## 2. Forbidden Items (Các thành phần tuyệt đối không tái sử dụng)
Để tránh rủi ro bảo mật và giữ cho PC2 hoàn toàn độc lập, nghiêm cấm tái sử dụng các thành phần sau từ FnB OS V1:

- **Real Secrets & Credentials**: Tuyệt đối không copy bất kỳ API keys, tokens, mật khẩu hoặc cấu hình nhạy cảm thật nào của Vị Cuốn (như Meta token, Telegram bot token, OpenAI keys, etc.).
- **Vị Cuốn Hardcoding**: Không đưa các chuỗi text, tên thương hiệu, tên tệp tin, ID tài khoản, hay logic đặc thù riêng của "Vị Cuốn" vào hệ thống của The Core Agency.
- **FnB OS V1 Paths as Runtime Dependency**: Không import thư viện trực tiếp, gọi API qua đường link cứng của server Vị Cuốn, hay cài đặt package phụ thuộc vào mã nguồn FnB OS V1.
- **Real Telegram/HeyGen/ElevenLabs Workflows with Credentials**: Không sử dụng lại các workflow n8n hoàn chỉnh của FnB OS V1 có liên quan đến các tích hợp bên ngoài này nếu chúng chứa credentials thật.
- **Bypass Approval**: Bất kỳ luồng xử lý nào tự động xuất bản hoặc chi tiêu mà bỏ qua bước phê duyệt trung gian của Core đều bị nghiêm cấm.
- **Core UI/Auth/Database modification**: Không sửa đổi mã nguồn phần giao diện, xác thực hay cấu hình database của Core để phục vụ việc tái sử dụng.

---

## 3. Mapping into The Core Agency PC2 (Cách áp dụng mẫu vào PC2)

Các mẫu trên được ánh xạ vào The Core Agency PC2 như sau:

| Mẫu từ FnB OS V1 | Ánh xạ thực tế trong PC2 | Vị trí File / Implement trong PC2 |
| :--- | :--- | :--- |
| **Approval Gate** | `IF: Safety Gate` nodes trong n8n workflows | [core_event_router.workflow.json](../n8n-workflows/core_event_router.workflow.json) |
| **Audit Logs/Governance** | `correlation_id`, `job_id`, `safety` object trong JSON Schemas | [core_to_n8n_event.schema.json](../contracts/core_to_n8n_event.schema.json) |
| **Webhook Callback** | `HTTP: Callback Core` nodes sử dụng `CORE_CALLBACK_URL` | [module_result_callback_to_core.workflow.json](../n8n-workflows/module_result_callback_to_core.workflow.json) |
| **Module Skeletons** | Cấu trúc thư mục chứa `README.md` và `contract.md` độc lập | [modules/meta-ads-connector](../modules/meta-ads-connector/) |

---

## 4. Future Implementation (Xem xét cho Phase N2 / N3)
Một số ý tưởng nâng cao từ FnB OS V1 sẽ được thảo luận và hiện thực hóa ở các giai đoạn sau:

- **Phase N2 (Contract Validation & Event Router Skeleton)**:
  - Hiện thực hóa chi tiết logic validate JSON Schema bên trong các Node Code của n8n.
  - Xây dựng mô phỏng các test-case gửi nhận dữ liệu hoàn chỉnh giữa Mock Core và n8n Router.
- **Phase N3 (Specialist Module Integration)**:
  - Tích hợp pipeline sinh ảnh ComfyUI thật vào workflow `approved_design_to_comfyui.workflow.json`.
  - Triển khai cấu trúc dữ liệu **Brand Brain** tích hợp sâu vào Canva Connector để sinh ảnh thương hiệu đúng chuẩn.

---

## 5. Safety Rules for Reuse (Quy tắc an toàn khi tái sử dụng)
1. **Kiểm tra rò rỉ dữ liệu**: Luôn chạy script quét bí mật (secret scanner) trước khi push code lên remote branch.
2. **Nguyên tắc "Clean Room"**: Nếu tham khảo code từ FnB OS V1, hãy tự viết lại (rewrite) dựa trên đặc tả của The Core Agency thay vì sao chép trực tiếp.
3. **Môi trường Sandbox**: Mọi module kết nối quảng cáo hay nhắn tin (Meta Ads, Facebook Publisher) trong giai đoạn phát triển phải cấu hình mặc định chạy ở môi trường Sandbox/Mock client.

---

## 6. N2 Mapping
Dưới đây là sơ đồ ánh xạ chi tiết cho Phase N2:
- **V1 approval gate pattern → PC2 router safety gate**: Cổng kiểm tra phê duyệt và quyền hành động ở V1 được tích hợp trực tiếp vào router dưới dạng các node kiểm soát điều kiện rẽ nhánh (`IF: Safety Gate`).
- **V1 workflow skeleton → PC2 importable workflow placeholders**: Các luồng tự động hóa được chuẩn hóa thành khung sườn JSON có sẵn các cổng validation, an toàn và định tuyến sự kiện mà không cài cắm credential cứng.
- **V1 logs/governance → PC2 callback statuses + contract validation logs**: Quy trình kiểm tra log và trạng thái được chuẩn hóa bằng bảng mã Callback Statuses thống nhất (`INVALID_CONTRACT`, `REJECTED_BY_SAFETY`, etc.).
- **V1 Brand Brain idea → PC2 brand_id/brand context payload**: Ý tưởng lưu ngữ cảnh thương hiệu được chuyển đổi thành cấu trúc truyền dữ liệu `brand_id` trong payload của schema.
- **Nguyên tắc độc lập**:
  - Không đưa cấu hình hay logic hardcode của Vị Cuốn vào Core.
  - Không sử dụng runtime dependency vào FnB OS V1.
  - Không sao chép các workflows chứa credentials thật từ dự án cũ.

