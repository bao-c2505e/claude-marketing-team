# Module API Standard

This document defines the standardized API endpoints, payload structures, and lifecycle policies for all specialized modules (Specialist Modules) in The Core Agency system.

## 1. Nguyên tắc giao tiếp (Communication Principles)
- **Bất đồng bộ làm chủ đạo (Async-First)**: Mọi tác vụ tốn thời gian (sinh ảnh, xuất bản bài viết, quản lý ads) phải chạy bất đồng bộ.
- **Traceability (Khả năng truy vết)**: Mọi yêu cầu từ n8n/Core gửi tới Module phải đính kèm `event_id`, `correlation_id` và `job_id` để tiện đối chiếu logs.
- **Trạng thái xử lý rõ ràng**: Module phải phản hồi trạng thái đồng thời (sync response) khi nhận yêu cầu, và gửi trạng thái kết quả (async callback) khi hoàn tất công việc.
- **Không ghi đè Database**: Các module chuyên môn không được phép kết nối hay ghi dữ liệu trực tiếp vào Core Database để giữ tính độc lập (Loose Coupling).
- **Kiểm tra an toàn kép (Double Safety Check)**: Ngoài các gate kiểm tra tại n8n router, mỗi Module tự chịu trách nhiệm kiểm tra cờ an toàn (`safety.final_approval_granted`) trước khi gọi các API thực tế bên thứ ba.

---

## 2. Các Endpoint chuẩn bắt buộc (Standard Endpoints)

Mỗi module phải triển khai tối thiểu 3 endpoint sau:

### A. GET /health
- **Mục tiêu**: Kiểm tra trạng thái hoạt động của Module (Liveness/Readiness probe).
- **Sync Response (200 OK)**:
  ```json
  {
    "status": "OK",
    "module_name": "name-of-module",
    "version": "1.0.0",
    "timestamp": "2026-06-08T14:48:00Z"
  }
  ```

### B. POST /run
- **Mục tiêu**: Kích hoạt xử lý tác vụ nghiệp vụ chuyên môn.
- **Request Body**: Khớp với schema `n8n_to_module_request.schema.json`.
- **Response Codes**:
  - **202 Accepted**: Khi payload hợp lệ và bắt đầu đưa vào hàng đợi xử lý.
    ```json
    {
      "status": "QUEUED",
      "module_run_id": "run_comfyui_abcd1234",
      "message": "Task received and queued."
    }
    ```
  - **400 Bad Request**: Khi payload lỗi cấu trúc (thiếu field bắt buộc).
    ```json
    {
      "status": "INVALID_CONTRACT",
      "error": "Missing required field: brand_id"
    }
    ```
  - **403 Forbidden**: Khi yêu cầu vi phạm quy tắc an toàn (chưa được phê duyệt hoặc thiếu cờ cho phép).
    ```json
    {
      "status": "REJECTED_BY_SAFETY",
      "error": "Safety block: requires_approval is true but final_approval_granted is false."
    }
    ```

### C. POST /simulate-callback
- **Mục tiêu**: Cổng thử nghiệm giả lập callback kết quả. Hỗ trợ nhà phát triển gọi trực tiếp để mô phỏng lại payload gửi về Core/n8n.
- **Request Body**:
  ```json
  {
    "module_run_id": "run_comfyui_abcd1234",
    "correlation_id": "corr_demo_001",
    "job_id": "job_demo_001",
    "simulate_status": "SUCCESS" 
  }
  ```
- **Sync Response (200 OK)**: Trả về payload callback mẫu tương thích với `module_to_core_callback.schema.json`.
  ```json
  {
    "event_id": "771e19d7-8da7-4e68-96bb-07df9d94a81e",
    "correlation_id": "corr_demo_001",
    "job_id": "job_demo_001",
    "module_name": "name-of-module",
    "status": "COMPLETED",
    "payload": {
      "mock_asset_url": "http://localhost:8188/assets/mock_asset.png"
    },
    "safety": {
      "requires_approval": true,
      "final_approval_granted": true,
      "allow_real_world_action": true,
      "allow_auto_publish": false,
      "allow_ads_spend": false,
      "allow_customer_messaging": false
    }
  }
  ```

---

## 3. Luồng hoạt động Asynchronous Callback
1. n8n gọi `POST /run` sang Module.
2. Module trả ngay `202 Accepted` với `status: "QUEUED"` và `module_run_id`.
3. Module xử lý ngầm (sinh ảnh, đăng bài).
4. Khi chạy xong, Module thực hiện gọi HTTP POST đến `callback_url` được cung cấp trong request ban đầu, truyền payload chứa kết quả xử lý (status `COMPLETED` hoặc `FAILED`) và thông tin tracking ban đầu.
5. n8n nhận callback, xác thực cấu trúc và gửi trả kết quả về Core Webhook để cập nhật trạng thái Source of Truth.
