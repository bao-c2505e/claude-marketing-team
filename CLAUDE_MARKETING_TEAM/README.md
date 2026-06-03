# AI Marketing Team Workspace (Mô Phỏng)

Chào mừng bạn đến với **AI Marketing Team Workspace** — một môi trường giả lập độc lập và an toàn, được thiết kế để huấn luyện, thử nghiệm và trình diễn quy trình phối hợp tự động giữa 5 vai trò AI Marketing chuyên nghiệp.

## 📌 Giới thiệu dự án
Dự án này mô phỏng một phòng marketing hoàn chỉnh trong doanh nghiệp, nơi một người điều phối (AI Coordinator) hoặc Người vận hành (Human Owner) có thể đưa ra yêu cầu chiến dịch (Campaign Brief) và hệ thống các AI Agent tự động làm việc với nhau để tạo ra bộ sản phẩm marketing hoàn chỉnh (Final Campaign Pack).

Mọi hoạt động, tài nguyên, công cụ và kết quả đầu ra trong dự án này đều là **giả lập** và **nội bộ**, phục vụ mục đích học tập và làm quen với mô hình AI Agent Team.

## 🎯 Mục tiêu
1. **Thiết lập Workspace Chuẩn:** Tạo ra cấu trúc thư mục logic để quản lý thông tin thương hiệu, brief chiến dịch, tài liệu kỹ năng, và lưu trữ kết quả đầu ra.
2. **Quy trình Phối hợp Rõ ràng:** Định nghĩa luồng làm việc tuần tự và phê duyệt từ brief đến sản phẩm cuối cùng.
3. **Huấn luyện Agent:** Xây dựng bộ quy tắc kỹ năng (Skills) chi tiết làm tiền đề để cấu hình các AI Agent ở các phase tiếp theo.
4. **Demo Thực tế:** Cung cấp ca sử dụng cụ thể (Local Business tại Vinh) để kiểm nghiệm quy trình.

## 🚀 Cách sử dụng Demo
Ở Phase A, dự án tồn tại dưới dạng **tài liệu và quy tắc vận hành (Blueprint)**. Bạn có thể sử dụng cấu trúc này như sau:
1. Đọc qua [PROJECT_BLUEPRINT.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/PROJECT_BLUEPRINT.md) và [AGENTS.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/AGENTS.md) để hiểu cách hệ thống mô phỏng hoạt động.
2. Tham khảo [sample_brand_brief.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/00_brand_inputs/sample_brand_brief.md) tại thư mục `00_brand_inputs/` để biết cách cấu hình thông tin một local business.
3. Đọc hướng dẫn chạy chiến dịch 7 ngày tại [seven_day_campaign_flow.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/04_workflows/seven_day_campaign_flow.md) và kết quả kỳ vọng tại [expected_outputs.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/06_demo_cases/local_business_demo/expected_outputs.md).
4. Các outputs giả lập của agent sẽ được xuất bản vào các thư mục tương ứng trong `02_outputs/`.

## 🖥️ Cách khởi chạy Web UI Prototype (Phase E)
Dự án cung cấp một giao diện Web UI local cực kỳ trực quan và cao cấp viết bằng React + TypeScript + Vite.

### Các bước khởi chạy:
1. Mở terminal tại thư mục gốc của dự án (`c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM`).
2. Cài đặt các thư viện dependencies bằng lệnh:
   ```bash
   npm install
   ```
3. Chạy server phát triển cục bộ:
   ```bash
   npm run dev
   ```
4. Truy cập địa chỉ hiển thị trong terminal (mặc định là `http://localhost:3000`) để trải nghiệm nhập Brief chiến dịch và xem outputs trực quan của các AI Agent.


## Project Boundary

Để bảo vệ an toàn hệ thống và tránh các chi phí phát sinh ngoài ý muốn, dự án tuân thủ nghiêm ngặt các nguyên tắc sau:
- **Project Identity:** This workspace is CLAUDE_MARKETING_TEAM only. It is not Forme Brand Assistant.
- **Independence:** It is independent from FnB OS V1.
- **Simulation Mode:** It is simulation/demo/prototype by default.
- **Strict Safety Rules:** It must not auto-post, auto-message customers, run real ads, or spend budget. Mọi nội dung chỉ lưu ở định dạng Markdown trong thư mục output.
- **No Secrets:** It must not store API keys, tokens, passwords, or secrets.
- **Future Integrations:** Real connectors such as Canva, Meta Ads, Google Drive, Google Sheets, or n8n can only be added later with explicit Owner approval and approval gates.
