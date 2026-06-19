# CHƯƠNG 3. NỀN TẢNG LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

Chương này trình bày các nền tảng đang được sử dụng trong WoodCert Auction và vai trò của chúng đối với yêu cầu ở Chương 2. Phiên bản công nghệ được lấy từ manifest và cấu hình hiện hành; các chỉ tiêu hiệu năng chỉ là mục tiêu thiết kế cho đến khi có benchmark tái lập.

## Tổng quan kiến trúc

WoodCert Auction là modular monolith ở backend và SPA ở frontend. Backend chạy trong một tiến trình Spring Boot, được chia theo các miền identity, catalog/appraisal, auction, finance, order, fulfillment, dispute và media. Một số ranh giới dùng interface/port nhưng vẫn có phụ thuộc trực tiếp giữa các feature, do đó không mô tả hệ thống là microservices.

Nginx host tiếp nhận HTTPS và chuyển tiếp tới frontend/backend bind trên loopback. MySQL lưu dữ liệu quan hệ bền vững, Redis lưu runtime của phiên `ACTIVE`, Cloudinary lưu media, VNPay Sandbox phục vụ nạp ví và SMTP gửi email.

## Backend và bảo mật

Backend dùng Java 17 và Spring Boot 3.5.15; Spring Data JPA, Validation, Mail và Actuator phục vụ dữ liệu, validation, email và health check. `@Transactional` xác định biên giao dịch nhưng hệ thống còn cần row lock, optimistic lock, operation key idempotent và constraint để kiểm soát đồng thời.

Access token HS512 sống 15 phút. Refresh token sống 7 ngày, nằm trong cookie HttpOnly/Secure/SameSite=Lax, được lưu hash và rotation trong MySQL. Quyền hiệu lực và trạng thái tài khoản được đối chiếu database. CSRF filter mặc định bị tắt; double-submit cookie được kiểm tra thủ công cho refresh/logout. Brute-force protection chặn đăng nhập tạm thời theo email trong Redis.

Bid được gửi qua REST. STOMP/WebSocket chỉ broadcast read-only qua Spring simple broker nhúng. Redis/Lua là biên chấp nhận bid; sau khi chấp nhận, backend broadcast trước rồi lưu bid/snapshot MySQL theo best-effort trong cùng request.

## Dữ liệu và tích hợp

Flyway hiện có bốn migration `V1__baseline_schema.sql`, `V2__seed_reference_data.sql`, `V3__seed_demo_users.sql`, `V4__add_dispute_conversation.sql`.

MySQL 8.0 lưu dữ liệu bền vững và trạng thái kết thúc. Redis 7.4 lưu Hash/Set của phiên `ACTIVE`; Lua kiểm tra thời gian, participant, người đang giữ giá, bước giá và anti-sniper trong một thao tác nguyên tử. Lifecycle worker có thể phục hồi snapshot từ MySQL nếu Redis thiếu dữ liệu, ghi `ENDED_SUCCESS`/`ENDED_FAILED`, sau đó settlement xử lý cọc, tạo order và dọn Redis.

Cloudinary nhận upload trực tiếp từ browser bằng intent có chữ ký. Ảnh sản phẩm là bắt buộc; ảnh chứng minh kiểm định là tùy chọn; bằng chứng khi mở tranh chấp là bắt buộc. Video đóng gói chưa thuộc phạm vi triển khai.

## Frontend

Frontend dùng React 19.2.1, TypeScript 5.9.3 và Vite 7.2.6. TanStack Query 5.90.12 quản lý server state; query retry một lần, mutation không tự retry. Zustand 5.0.9 quản lý access token và auth state. Tailwind CSS 4.1.17 xây dựng style; Radix UI được dùng cho một số primitive như Dialog, Dropdown Menu, Label và Slot.

## Hạ tầng, CI/CD và kiểm thử

Nginx chuyển `/api/` và `/ws-auction` tới backend, các đường dẫn khác tới frontend. Docker Compose chạy frontend, backend, MySQL và Redis trong các container riêng; MySQL/Redis không publish cổng.

CI chạy Maven test, frontend lint/typecheck/Vitest/build, Playwright E2E, deployment validation, Compose validation và Docker build. Release chỉ deploy khi `CD_ENABLED=true`; GitHub Environment `production` bắt buộc phê duyệt thủ công trước khi workflow SCP/SSH chạy deployment script.

Backend dùng JUnit 5 và Testcontainers; frontend dùng Vitest, Testing Library và Playwright. Mục tiêu p95, concurrency và availability ở Chương 2 chưa được coi là kết quả đạt được cho đến khi có benchmark hoặc dữ liệu giám sát tương ứng.

## Tổng kết

Spring Boot/MySQL quản lý logic và dữ liệu bền vững; Redis/Lua xử lý runtime phiên `ACTIVE`; WebSocket/STOMP phân phối cập nhật; React tổ chức SPA; Docker, Nginx và GitHub Actions hỗ trợ triển khai. Các nền tảng này là căn cứ cho phần phân tích thiết kế và đánh giá ở Chương 4.
