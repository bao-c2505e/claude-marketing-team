# CẨM NANG HƯỚNG DẪN DÀNH CHO CHỦ THƯƠNG HIỆU (OWNER MANUAL)

Cẩm nang này hướng dẫn các chủ cửa hàng, người quản lý hoặc nhân sự marketing (không cần kiến thức kỹ thuật lập trình) cách thức sử dụng **AI Marketing Team Workspace** để lên chiến dịch truyền thông.

---

## 🧭 Bản Đồ Workspace Cho Người Mới
Khi mở workspace, bạn chỉ cần quan tâm tới các thư mục chính sau:
- 📂 `01_campaign_briefs/`: Nơi bạn gửi yêu cầu chiến dịch mới.
- 📂 `02_outputs/final_campaign_pack/`: Nơi bạn nhận lại toàn bộ bài viết, ảnh và kịch bản video đã hoàn thành.
- 📂 `02_outputs/data_reporter/`: Nơi bạn xem báo cáo hiệu quả bán hàng & quảng cáo giả định.
- 📂 `07_docs/`: Nơi xem luật lệ và hướng dẫn an toàn.

---

## 🚀 Hướng Dẫn Vận Hành Chiến Dịch Qua 4 Bước Đơn Giản

### 📝 Bước 1: Điền Và Nộp Brief Chiến Dịch
1. Vào thư mục `01_campaign_briefs/` và mở file biểu mẫu [owner_brief_form.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/01_campaign_briefs/owner_brief_form.md).
2. Sao chép nội dung biểu mẫu này sang một tệp mới tên là `campaign_brief_[Tên_Chiến_Dịch].md` nằm cùng thư mục.
3. Điền các thông tin thực tế về sản phẩm, giá bán, khu vực kinh doanh, ưu đãi khuyến mãi của bạn vào các ô hướng dẫn `[Ví dụ: ...]`.
4. Lưu file lại.

### ⚙️ Bước 2: Đội Ngũ AI Agent Tự Động Thiết Lập
Sau khi bạn lưu brief:
1. Hệ thống AI Coordinator sẽ tự động phân chia công việc cho các phòng ban AI (Nội dung, Hình ảnh, Kịch bản video, Quảng cáo).
2. Bạn có thể theo dõi tiến trình làm việc mô phỏng của các agent tại file nhật ký hoạt động [agent_activity_log.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/08_logs/agent_activity_log.md).

### 👁️ Bước 3: Xem Và Duyệt Sản Phẩm (Final Campaign Pack)
1. Sau khoảng vài phút, bạn vào thư mục `02_outputs/final_campaign_pack/` và mở tệp tổng hợp `final_campaign_pack_[Tên_Chiến_Dịch].md`.
2. Đọc kỹ 7 bài viết Facebook, các kịch bản video và các chỉ dẫn prompt vẽ ảnh.
3. Cuộn xuống cuối trang đến phần **Checklist phê duyệt**:
   - Nếu bạn **đồng ý hoàn toàn**: Đổi dấu chọn thành `[x] APPROVED`. Hệ thống sẽ tự động kích hoạt chế độ giả lập quảng cáo để sinh số liệu báo cáo.
   - Nếu bạn **cần sửa đổi**: Đổi dấu chọn thành `[x] REJECTED` và viết rõ các điểm bạn chưa ưng ý (Ví dụ: *"Sửa lại bài post ngày 2 tăng giá ưu đãi từ 10% lên 15%"*). Hệ thống Agent sẽ tự sửa và cập nhật bản V2 cho bạn duyệt lại.

### 📊 Bước 4: Đọc Báo Cáo Hiệu Quả Mô Phỏng
1. Khi chiến dịch được duyệt `APPROVED`, động cơ giả lập sẽ chạy mô phỏng 7 ngày.
2. Bạn vào thư mục `02_outputs/data_reporter/` mở tệp `demo_data_reporter_outputs.md` hoặc báo cáo chiến dịch tương ứng để xem các chỉ số hiển thị, clicks, chi phí CPA và doanh thu mang lại.
3. Xem các đề xuất tối ưu ở cuối báo cáo để lên kế hoạch tốt hơn cho tuần sau.

---

## 🤖 Hướng Dẫn Gọi Lệnh Antigravity Commands

Hệ thống hỗ trợ các lệnh văn bản (Prompt-based Commands) được định nghĩa sẵn tại thư mục `.antigravity/commands/`. Bạn chỉ cần gõ lệnh trực tiếp trong ô chat với AI Agent để kích hoạt:

1. **Lệnh khởi động: `Hãy thực hiện lệnh start_campaign`**
   - *Tệp lệnh tương ứng:* [.antigravity/commands/start_campaign.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/start_campaign.md)
   - *Tác dụng:* Đọc brief mới trong thư mục chiến dịch, tự động điền các giả định hợp lý nếu thiếu thông tin không quan trọng, sau đó gọi 5 phòng ban AI sản xuất sản phẩm nháp.
2. **Lệnh rà soát chất lượng: `Hãy thực hiện lệnh review_outputs`**
   - *Tệp lệnh tương ứng:* [.antigravity/commands/review_outputs.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/review_outputs.md)
   - *Tác dụng:* Quét toàn bộ đầu ra nháp của Agents để đánh giá độ khớp brief, tone giọng thương hiệu, rà soát các cam kết quảng cáo quá đà hoặc vi phạm ranh giới an toàn.
3. **Lệnh đóng gói: `Hãy thực hiện lệnh finalize_pack`**
   - *Tệp lệnh tương ứng:* [.antigravity/commands/finalize_pack.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/.antigravity/commands/finalize_pack.md)
   - *Tác dụng:* Gom các sản phẩm đã được kiểm định chất lượng ở bước rà soát và đóng gói gọn gàng thành một file chiến dịch duy nhất gửi cho bạn.

## 🌐 Hướng Dẫn Chạy AI Marketing Team Trên Chatbot Ngoài (ChatGPT/Claude/Gemini)

Nếu bạn muốn chạy mô phỏng AI Marketing Team 5 vai trò ngay trên các công cụ chatbot AI bên ngoài (như ChatGPT, Claude 3.5, Gemini 1.5):

1. **Mở tài liệu prompt vạn năng:** Truy cập tệp chỉ dẫn [universal_ai_coordinator_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/universal_ai_coordinator_prompt.md).
2. **Sao chép nội dung:** Copy toàn bộ nội dung trong tệp đó.
3. **Điền Brief của bạn:** Dán nội dung đó vào khung nhập liệu của chatbot bạn đang dùng, cuộn xuống cuối cùng và điền các thông tin thực tế về chiến dịch của bạn (tên brand, sản phẩm, giá bán, khuyến mãi, tone giọng...).
4. **Xem kết quả:** Nhấn gửi (Send). Chatbot sẽ tự động đóng vai AI Coordinator, gọi 5 Agent và sản xuất trọn bộ bài đăng, kịch bản video, ads plan, báo cáo mô phỏng, và đóng gói Final Pack ngay trong một câu trả lời duy nhất.
5. **Chạy thử mẫu:** Để chạy thử ngay lập tức, bạn có thể sao chép toàn bộ nội dung tệp [example_owner_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/example_owner_prompt.md) (đã điền sẵn brief Trà Sữa Tôm Tép) để dán trực tiếp vào các chatbot và trải nghiệm kết quả nhanh chóng.


## How to use the Universal AI Coordinator Prompt

Để kích hoạt hệ thống điều phối AI tự động bằng Prompt vạn năng hoặc Prompt rút gọn:
1. Mở file [universal_ai_coordinator_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/universal_ai_coordinator_prompt.md) hoặc file copy nhanh [quick_copy_ai_coordinator_prompt.md](file:///c:/Users/BaO/.gemini/antigravity/MARKETING_TEAM/CLAUDE_MARKETING_TEAM/07_docs/quick_copy_ai_coordinator_prompt.md).
2. Sao chép và dán toàn bộ nội dung vào khung chat của ChatGPT, Claude hoặc Gemini.
3. Điền hoặc dán thông tin Campaign Brief của bạn vào phần cuối của Prompt.
4. AI Coordinator sẽ tự động đọc, giả định các thông tin nhỏ còn thiếu và phân công công việc cho 5 vai trò AI (Copywriter, Video Editor, Designer, Ads Manager, Data Reporter).
5. Sau khi AI xuất kết quả `Campaign Pack`, Owner hãy kiểm tra kỹ mục **Human Approval Checklist** để xác thực tính chính xác và an toàn.
6. Chỉ sử dụng và triển khai các ấn phẩm truyền thông sau khi Owner đã tự tay kiểm duyệt thủ công.
7. **Lưu ý quan trọng:** Không coi các thông tin/dữ liệu quảng cáo mô phỏng của AI là hành động đã đăng tải hoặc chạy chiến dịch thực tế. Mọi thao tác triển khai thật bên ngoài cần được thực hiện hoàn toàn thủ công bởi con người.

---

## 💡 Cách Sử Dụng Tài Nguyên Này Cho Đời Thực (Copy-Paste Thực Tế)
Vì đây là Workspace mô phỏng an toàn nên hệ thống sẽ không tự động đăng bài hay chạy quảng cáo tốn tiền thật của bạn. Khi bạn thấy các sản phẩm AI tạo ra đã đủ tốt:
- **Đăng bài viết:** Sao chép (Copy) trực tiếp các phần caption trong file Pack đã duyệt để đăng lên trang Facebook/Instagram thật của bạn.
- **Tạo ảnh thiết kế:** Copy đoạn prompt tiếng Anh chuẩn trong file thiết kế, dán vào các công cụ vẽ ảnh AI miễn phí (như Fal.ai, Bing Image Creator, Midjourney...) để nhận ảnh sắc nét, sau đó chèn logo quán là bạn có ngay banner quảng cáo chuyên nghiệp.
- **Quay video:** Chuyển kịch bản video chi tiết cho nhân viên của bạn quay trực tiếp bằng điện thoại theo các góc máy gợi ý và lồng tiếng theo lời thoại có sẵn.


