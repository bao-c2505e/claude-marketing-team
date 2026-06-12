# ComfyUI Pipeline Module

This module operates as a background specialist service for generating image and video assets using ComfyUI.

## 1. Mục tiêu (Objective)
Nhận thiết kế thiết kế mẫu, prompt và thông số từ Core/n8n. Chạy workflow sinh ảnh/video tương ứng của ComfyUI, lưu trữ asset kết quả và gọi webhook callback báo cáo về Core.

## 2. Ràng buộc an toàn & Phê duyệt (Safety & Approval Constraints)
- **Human-in-the-loop**: Chỉ chạy sinh tài nguyên khi có cờ approval hợp lệ (`safety.final_approval_granted == true` hoặc `approval_status == 'APPROVED'`).
- **Không tự ý xuất bản (No Auto-Publish)**: Không bao gồm bất kỳ tính năng tự động đăng tải nào lên mạng xã hội hay gửi cho khách hàng.
- **Không chi tiêu ngân sách (No Ads Spend)**: Không liên kết tới ngân sách quảng cáo.
- **Không tương tác trực tiếp với khách hàng**: Mọi asset sinh ra đều cần bước duyệt thủ công trước khi xuất bản hoặc chạy chiến dịch quảng cáo.

## 3. Cấu trúc tệp tin của Module
- **[README.md](./README.md)**: Tài liệu giới thiệu chung.
- **[contract.md](./contract.md)**: Đặc tả safety và flow.
- **[api_spec.md](./api_spec.md)**: Đặc tả API HTTP endpoints.
- **[README_LOCAL_RUN.md](./README_LOCAL_RUN.md)**: Hướng dẫn chạy local stub server.
- **[test_local_stub.md](./test_local_stub.md)**: Script test bằng PowerShell.

