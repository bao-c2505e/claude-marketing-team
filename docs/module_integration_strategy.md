# Module Integration Strategy

This document outlines the strategy and interface guidelines for integrating specialized modules with the Core Product via n8n.

## 1. Nguyên tắc thiết kế tích hợp (Integration Principles)
Các Module chuyên môn (Specialist Modules) là các ứng dụng hoặc microservices độc lập xử lý các nghiệp vụ đặc thù (ví dụ: ComfyUI sinh ảnh, Canva tạo template, Meta Ads quản lý chiến dịch).

Để đảm bảo tính nhất quán và an toàn hệ thống, mọi tích hợp Module phải tuân theo các nguyên tắc sau:
- **Asynchronous Processing (Xử lý bất đồng bộ)**: Các tác vụ tốn thời gian (như sinh ảnh, xuất bản bài viết, phân tích dữ liệu lớn) phải chạy bất đồng bộ. Core gửi yêu cầu → n8n nhận → Module nhận và xử lý → Module callback kết quả khi hoàn thành.
- **Stateless Modules**: Modules không quản lý trạng thái nghiệp vụ lâu dài của Core. Mọi thông tin cần thiết phải được truyền qua payload hoặc query trực tiếp từ Core Database (Source of Truth).
- **Callback Webhook**: Mọi module phải báo kết quả (thành công, thất bại, asset sinh ra) qua callback webhook.
- **Safety Checking**: Không module nào được phép tự ý thực thi các hành động thực tế (Ads budget spending, publishing, messaging) mà không có chữ ký/cờ phê duyệt hợp lệ từ Core (`final_approval_granted = true`).

## 2. Giao thức truyền thông (Communication Protocols)

Hệ thống sử dụng hai luồng giao tiếp chính:

```
Luồng 1: [Core] --(Asynchronous Event)--> [n8n] --(HTTP POST)--> [Module]
Luồng 2: [Module] --(Callback Webhook)--> [n8n / Core Callback Webhook]
```

### Luồng Gửi Yêu Cầu (Request Flow)
1. **Core** phát ra một event có định dạng JSON khớp với `core_to_n8n_event.schema.json`.
2. **n8n** nhận, xác thực và chuyển tiếp dưới dạng yêu cầu API đến endpoint của Module, khớp với `n8n_to_module_request.schema.json`.
3. **Module** tiếp nhận yêu cầu, kiểm tra tính hợp lệ và trả về phản hồi tức thời: `{"status": "processing", "job_id": "..."}` để báo nhận việc thành công.

### Luồng Trả Kết Quả (Callback Flow)
1. **Module** xử lý tác vụ dưới nền (background job).
2. Khi hoàn thành, **Module** gọi lại webhook được cấu hình trong `callback_url` (hoặc gửi qua n8n callback worker) với payload khớp với `module_to_core_callback.schema.json`.
3. **Core** nhận callback, cập nhật trạng thái của Job/Campaign trong database và hiển thị lên giao diện UI cho người dùng.

## 3. Quản lý Môi trường & Bảo mật (Secrets Management)
- **Không có Secrets trong Code/Workflow**: Tuyệt đối không lưu trữ API Key, Token, mật khẩu của Canva, Meta Ads, Facebook Page, hay ComfyUI Server trong git repository.
- **Cấu hình thông qua biến môi trường (.env)**:
  - Mọi Module cần cấu hình hoặc API Key bên thứ ba phải mô tả các biến này trong file `.env.example` của Module đó.
  - Ví dụ: `CANVA_API_KEY`, `META_ACCESS_TOKEN`, `COMFYUI_SERVER_URL`.
  - Không được commit file `.env` thật lên git.
- **n8n Credentials**: Trên môi trường Production, thông tin xác thực (Credentials) sẽ được cấu hình trực tiếp và bảo mật trong giao diện quản trị n8n, không xuất hiện trong các file `.workflow.json` xuất bản trên Git.
