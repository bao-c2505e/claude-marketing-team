# SESSION SUMMARY — Tóm Tắt Phiên Làm Việc

Tài liệu này tóm tắt bối cảnh, ranh giới an toàn hiện tại của dự án và các bước tiếp theo cần triển khai.

## 📝 Bối cảnh dự án (Project Context)
Chúng ta đang xây dựng **AI Marketing Team Workspace** giả lập. Đây là một môi trường khép kín cho phép huấn luyện và trình diễn hoạt động marketing của một nhóm AI Agents. Phase A tập trung hoàn toàn vào việc thiết lập móng (Foundation) cho workspace, không tạo code phức tạp, server hay giao diện người dùng (App UI).

## 🔒 Ranh giới an toàn cốt lõi (Safety Boundaries)
- **Độc lập tuyệt đối:** Dự án nằm tại thư mục `CLAUDE_MARKETING_TEAM/` và hoàn toàn tách biệt khỏi FnB OS V1.
- **Không tự động đăng tải bài viết:** Bài viết được viết ra chỉ được lưu lại cục bộ dưới định dạng Markdown, không tự động post lên mạng xã hội thật.
- **Không chạy quảng cáo thật:** Mọi phân bổ ngân sách và thống kê hiệu quả là số liệu giả định chạy bằng code mô phỏng, không liên kết ví hoặc thẻ thật.
- **Không nhắn tin khách hàng thật:** Không tự động gửi SMS hoặc nhắn tin qua ứng dụng chat cho khách hàng thật.
- **Không lưu credentials:** Không lưu giữ API keys, passwords hay các thông tin bảo mật khác.

## ➡️ Hành động tiếp theo (Next Actions)
1. **Khởi tạo dữ liệu thương hiệu & brief mẫu:**
   - Tạo brief mẫu cho quán trà sữa tại Vinh tại `00_brand_inputs/sample_brand_brief.md`.
   - Tạo template brief cho chiến dịch tại `01_campaign_briefs/campaign_brief_template.md`.
2. **Khởi tạo các biểu mẫu đầu ra:**
   - Viết các mẫu output template cho caption, kịch bản video, design brief, ads plan và report tại `03_templates/`.
3. **Thiết lập luồng hoạt động & kỹ năng:**
   - Xây dựng tài liệu quy trình làm việc nhóm tại `04_workflows/`.
   - Xây dựng tài liệu kỹ năng chi tiết cho 5 AI Agent tại `05_skills/`.
4. **Chuẩn bị Demo & Quy tắc vận hành:**
   - Tạo demo case cụ thể tại `06_demo_cases/`.
   - Tạo tài liệu luật an toàn và tài liệu tích hợp tương lai tại `07_docs/`.
   - Khởi tạo file log hoạt động tại `08_logs/`.
