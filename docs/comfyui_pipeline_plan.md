# ComfyUI Pipeline Plan

This document describes the pipeline plan and integration specs for the ComfyUI specialist image/video generation module.

## 1. Vai trò của ComfyUI Module
ComfyUI là một chuyên mục dịch vụ (Specialist Module) trong lớp Module Layer của PC2.
- **Không phải Core UI**: ComfyUI chạy độc lập dưới dạng một background API worker, không chứa giao diện hiển thị cho khách hàng hoặc nhân viên của The Core Agency. Toàn bộ UI tương tác của người dùng nằm ở Core Product (PC1).
- **Phục vụ Core Product**: ComfyUI nhận yêu cầu từ n8n (hoặc trực tiếp từ Core API khi cần realtime), thực hiện render ảnh/video theo workflow định nghĩa sẵn, và trả asset về Core.
- **Source of Truth**: Mọi metadata của ảnh/video được sinh ra phải được lưu vào Core Database thông qua callback webhook.

## 2. Luồng xử lý & Điều kiện phê duyệt (Approval Rules)
ComfyUI chỉ được kích hoạt tạo tài nguyên thật khi trạng thái phê duyệt hợp lệ.

1. **Nhận brief**: Nhận thông tin yêu cầu tạo ảnh từ n8n (bao gồm prompt, model_id, size, workflow_name, correlation_id, job_id, brand_id).
2. **Kiểm tra Approval**:
   - ComfyUI API hoặc n8n workflow trung gian phải kiểm tra cờ an toàn trong payload: `approval_status == "APPROVED"` hoặc `safety.final_approval_granted == true`.
   - Nếu cờ approval chưa được thiết lập hoặc bằng `false`, hệ thống sẽ từ chối xử lý và báo lỗi về Core.
3. **Sinh Asset (Generation)**:
   - Gửi payload sang ComfyUI API local hoặc cloud để hàng đợi xử lý.
   - Theo dõi tiến độ sinh ảnh.
4. **Callback**:
   - Khi render hoàn tất, upload asset lên storage (được định nghĩa bởi Core, ví dụ: Supabase Storage, S3) hoặc sử dụng file placeholder/reference trong môi trường dev.
   - Gửi webhook callback chứa: URL ảnh, các thông số generation params (seed, sampler, steps), trạng thái (SUCCESS/FAILED), job_id và correlation_id về Core Webhook.

## 3. Ràng buộc an toàn (Safety & Constraints)
- **Không tự ý xuất bản (No Auto Publish)**: Asset sau khi được sinh ra bởi ComfyUI chỉ tồn tại dưới dạng bản nháp hoặc được gắn vào Job/Campaign tương ứng trong Core database. Tuyệt đối không tự động post lên các mạng xã hội hoặc gửi khách hàng từ ComfyUI module.
- **Không tiêu ngân sách (No Ads Spend)**: Module này không có liên kết hay quyền hạn chi tiêu ngân sách quảng cáo.
- **Không tương tác trực tiếp với khách hàng**: Mọi hình ảnh/video đều phải qua bước phê duyệt thủ công của người dùng trên Core UI trước khi được chuyển sang các module xuất bản khác.
