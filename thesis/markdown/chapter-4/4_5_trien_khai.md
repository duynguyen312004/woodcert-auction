# 4.5 Triển khai

## 4.5.1 Kiến trúc triển khai container hóa (Docker Compose)

Hệ thống **WoodCert Auction** được container hóa hoàn chỉnh và triển khai trên máy chủ ảo VPS sử dụng công cụ **Docker Compose**. Mô hình triển khai này bảo đảm tính cô lập tài nguyên, khả năng tái lập môi trường và tính nhất quán giữa quá trình phát triển và vận hành thực tế.

### Các dịch vụ thành phần trong Docker Compose
Kiến trúc triển khai gồm 4 dịch vụ (services) chính được thiết lập trong tệp cấu hình `docker-compose.prod.yml`:
1. **`backend`:** Chạy ứng dụng Spring Boot đã được biên dịch thành tệp tin JAR, thực thi trên môi trường máy ảo OpenJDK 17 alpine. Dịch vụ này chỉ khởi chạy sau khi cơ sở dữ liệu và bộ nhớ đệm đã ở trạng thái sẵn sàng hoạt động (healthy) được xác định qua health check.
2. **`frontend`:** Chạy ứng dụng web React SPA. Giao diện sau khi compile thành các tệp tin tĩnh được phân phát thông qua máy chủ Nginx cấu hình sẵn.
3. **`mysql-db`:** Chạy hệ quản trị cơ sở dữ liệu MySQL 8.0, thực hiện lưu trữ bền vững toàn bộ dữ liệu nghiệp vụ của hệ thống. Dữ liệu được ghi nhận xuống ổ đĩa của máy chủ VPS thông qua cơ chế Docker Volume (`mysql_data`).
4. **`redis-cache`:** Chạy bộ nhớ đệm Redis 7.4-alpine. Cấu hình hỗ trợ lưu trữ các thông tin phục vụ trạng thái runtime của phiên đấu giá hoạt động và các bộ đếm bảo mật. Dữ liệu được lưu trữ bền vững xuống đĩa thông qua cơ chế Docker Volume (`redis_data`) kết hợp với chế độ ghi nhật ký append-only (AOF).

### Mạng nội bộ và bảo mật cổng
Các dịch vụ trong hệ thống giao tiếp với nhau thông qua mạng nội bộ ảo (default network) do Docker Compose tự động khởi tạo. Các dịch vụ cơ sở dữ liệu (`mysql-db`) và bộ nhớ đệm (`redis-cache`) chỉ mở cổng kết nối nội bộ cho ứng dụng `backend` truy cập, hoàn toàn không mở cổng ra môi trường Internet bên ngoài, giúp hạn chế các nguy cơ tấn công trực tiếp vào tầng lưu trữ dữ liệu.

---

## 4.5.2 Cơ chế định tuyến và quản lý cấu hình bảo mật

Cơ chế định tuyến yêu cầu từ người dùng và bảo mật các thông số cấu hình hệ thống đóng vai trò quan trọng trong việc vận hành WoodCert Auction một cách ổn định trên môi trường VPS.

### 1. Định tuyến Proxy ngược (Nginx Reverse Proxy)
Hệ thống sử dụng một máy chủ **Nginx** làm Reverse Proxy và cổng tiếp nhận yêu cầu (Gateway) từ Internet. Nginx tiếp nhận các yêu cầu HTTP tại cổng 80 và thực hiện định tuyến lưu lượng dựa trên các quy tắc cấu hình thực tế:
* **Yêu cầu API (đường dẫn `/api/`):** Nginx chuyển tiếp (proxy pass) trực tiếp đến dịch vụ `backend` (cổng 8080 của máy host).
* **Kết nối thời gian thực (đường dẫn `/ws-auction`):** Nginx thực hiện nâng cấp kết nối sang giao thức WebSocket để chuyển tiếp kết nối đến Broker STOMP của ứng dụng `backend`.
* **Đường dẫn kiểm tra trạng thái (`/actuator/health/readiness`):** Định tuyến trực tiếp về endpoint kiểm tra trạng thái của backend phục vụ giám sát vận hành.
* **Yêu cầu giao diện (các đường dẫn còn lại):** Định tuyến về máy chủ phân phát giao diện ứng dụng SPA (cổng 3000 của máy host, chuyển tiếp vào container frontend) để hiển thị giao diện cho trình duyệt của người dùng.

### 2. Quản lý cấu hình và biến môi trường
Để bảo đảm tính an toàn thông tin, hệ thống không lưu trữ các thông số nhạy cảm trực tiếp trong mã nguồn triển khai. Toàn bộ các thông số cấu hình được tách biệt hoàn toàn và quản lý thông qua tệp tin biến môi trường `.env.prod` lưu trên máy chủ VPS:
* **Tham số kết nối cơ sở dữ liệu:** Địa chỉ URL kết nối JDBC, tên người dùng, mật khẩu của MySQL và Redis.
* **Tham số xác thực:** Khóa bí mật JWT (`JWT_SECRET_KEY`) dùng thuật toán HS512 và mã băm mật khẩu khởi tạo tài khoản quản trị.
* **Tích hợp bên thứ ba:** Khóa API Cloudinary (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), thông số tài khoản thử nghiệm của cổng thanh toán VNPay Sandbox, và cấu hình SMTP của máy chủ gửi email.

Khi Docker Compose khởi chạy, ứng dụng Spring Boot và Frontend Nginx sẽ tự động nạp các thông số này từ biến môi trường của container vào cấu hình runtime, bảo đảm tính linh hoạt và an toàn bảo mật cho toàn bộ hệ thống.
