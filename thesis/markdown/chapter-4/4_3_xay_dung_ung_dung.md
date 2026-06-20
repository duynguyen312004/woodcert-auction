# 4.3 Xây dựng ứng dụng

## 4.3.1 Thư viện và công cụ sử dụng

Quy trình xây dựng và phát triển hệ thống **WoodCert Auction** được thực hiện dựa trên các công nghệ, ngôn ngữ lập trình, thư viện và API dịch vụ bên thứ ba thực tế dưới đây. Các công cụ và thư viện được lựa chọn nhằm tối ưu hóa tính đồng thời, khả năng mở rộng và giao tiếp thời gian thực.

### Bảng 4.1: Danh sách thư viện và công cụ sử dụng trong hệ thống

| Phân khu | Công cụ / Thư viện | Phiên bản | Mục đích sử dụng | URL Trang chủ |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | Java Development Kit (JDK) | 17 | Ngôn ngữ lập trình chính của Backend | [oracle.com](https://www.oracle.com/java/) |
| | Spring Boot | 3.5.15 | Framework cốt lõi để xây dựng REST API | [spring.io](https://spring.io/projects/spring-boot) |
| | Spring Data JPA (Hibernate) | 3.5.15 | Quản lý và truy vấn cơ sở dữ liệu quan hệ | [spring.io](https://spring.io/projects/spring-data-jpa) |
| | Spring Data Redis | 3.5.15 | Thao tác bộ nhớ đệm và Lua script thời gian thực | [spring.io](https://spring.io/projects/spring-data-redis) |
| | Spring Security & OAuth2 | 3.5.15 | Xác thực JWT và phân quyền động dựa trên DB | [spring.io](https://spring.io/projects/spring-security) |
| | Flyway | 10.11.0 | Di trú và quản lý lịch sử schema cơ sở dữ liệu | [red-gate.com](https://www.red-gate.com/products/flyway/) |
| | Spring Boot Starter Mail | 3.5.15 | Phân hệ gửi email xác thực và khôi phục tài khoản | [spring.io](https://spring.io/) |
| | Lombok | 1.18.36 | Tự động sinh mã boilerplate (getter, setter, log) | [projectlombok.org](https://projectlombok.org/) |
| | MapStruct | 1.5.5.Final | Ánh xạ tự động dữ liệu giữa Entity và DTO | [mapstruct.org](https://mapstruct.org/) |
| **Frontend** | React | 19.2.1 | Thư viện xây dựng giao diện người dùng SPA | [react.dev](https://react.dev/) |
| | Tailwind CSS | 4.1.17 | Framework CSS thiết kế giao diện responsive | [tailwindcss.com](https://tailwindcss.com/) |
| | Vite | 7.2.6 | Công cụ đóng gói (bundle) và hot reload frontend | [vite.dev](https://vite.dev/) |
| | Radix UI | Nhiều | Bộ component chuẩn hóa hỗ trợ accessibility | [radix-ui.com](https://www.radix-ui.com/) |
| | Zustand | 5.0.9 | Quản lý trạng thái client-side gọn nhẹ | [zustand-demo.pmnd.rs](https://zustand-demo.pmnd.rs/) |
| | Axios | 1.13.2 | Thư viện gửi yêu cầu HTTP REST Client | [axios-http.com](https://axios-http.com/) |
| | TanStack React Query | 5.90.12 | Quản lý đồng bộ và cache trạng thái server-side | [tanstack.com](https://tanstack.com/query) |
| | STOMP.js | 7.3.0 | Giao tiếp WebSocket thời gian thực cho đấu giá | [github.com](https://github.com/stomp-js/stompjs) |
| | SockJS-Client | 1.6.1 | Hỗ trợ tương thích kết nối WebSocket | [github.com](https://github.com/sockjs/sockjs-client) |
| **Hạ tầng** | Docker & Docker Compose | Nhiều | Đóng gói container hóa và chạy thử nghiệm cục bộ | [docker.com](https://www.docker.com/) |
| | Nginx | 1.25+ | Proxy ngược, định tuyến WebSocket và phân phát SPA | [nginx.org](https://nginx.org/) |
| | Cloudinary SDK | Nhiều | Quản lý tải lên, xác thực hình ảnh sản phẩm | [cloudinary.com](https://cloudinary.com/) |
| | VNPay Sandbox API | - | Cổng thanh toán thử nghiệm nạp tiền ví nội bộ | [sandbox.vnpayment.vn](https://sandbox.vnpayment.vn/) |

---

## 4.3.2 Kết quả đạt được

Hệ thống **WoodCert Auction** đã xây dựng các phân hệ chính bao gồm phân hệ backend, frontend và hạ tầng cấu hình chạy thử nghiệm thực tế.

### Sản phẩm phần mềm đóng gói
Mã nguồn của hệ thống được đóng gói thành các đơn vị container Docker để đảm bảo tính nhất quán khi triển khai:
1. **backend:** Chạy ứng dụng backend Java (file JAR thực thi) trên môi trường OpenJDK 17 alpine.
2. **frontend:** Chạy ứng dụng web frontend SPA đã được compile thành các tệp tin tĩnh và phân phát thông qua máy chủ Nginx.
3. **mysql-db:** Chạy cơ sở dữ liệu quan hệ MySQL 8.0, cấu hình lưu trữ dữ liệu bền vững qua volume.
4. **redis-cache:** Chạy bộ nhớ đệm Redis 7.4-alpine hỗ trợ lưu trữ runtime các phiên đấu giá hoạt động.

### Thống kê định lượng mã nguồn
Dưới đây là bảng thống kê định lượng quy mô mã nguồn thực tế của dự án WoodCert Auction:

`[BẢNG THỐNG KÊ: Thống kê số dòng code cloc, số gói, số lớp Java/Component React, dung lượng đóng gói Docker image thực tế]`

*(Lưu ý học thuật: Bảng thống kê định lượng phải lấy từ kết quả chạy thực tế của công cụ cloc và docker images trên hệ thống, không được sử dụng số liệu ước lượng).*

---

## 4.3.3 Minh họa các chức năng chính

Dưới đây là các màn hình giao diện thực tế của hệ thống **WoodCert Auction**, mô tả các luồng nghiệp vụ và hành động mà người dùng thực hiện trực quan trên giao diện.

### 1. Giao diện Trang chủ và Danh sách phòng đấu giá
* **Mô tả:** Màn hình hiển thị danh sách các phiên đấu giá. Người dùng có thể tìm kiếm sản phẩm theo từ khóa, lọc theo loại gỗ, trạng thái phiên (đang diễn ra, sắp diễn ra) và mức giá hiện tại.
* `[HÌNH 4.3.3.1: Giao diện danh sách phòng đấu giá public]`

### 2. Giao diện Phòng đấu giá trực tuyến (Bidding Room)
* **Mô tả:** Giao diện chi tiết phiên đấu giá đang diễn ra. Người dùng nhìn thấy thông tin sản phẩm, mức giá cao nhất hiện tại, đồng hồ đếm ngược thời gian còn lại của phiên, ô nhập liệu số tiền đặt giá và danh sách lịch sử các lượt đặt giá được cập nhật tự động thời gian thực.
* `[HÌNH 4.3.3.2: Giao diện phòng đấu giá trực tuyến thời gian thực]`

### 3. Giao diện Ví ảo cá nhân và nạp tiền
* **Mô tả:** Màn hình hiển thị số dư khả dụng và số dư bị đóng băng đặt cọc của tài khoản. Người dùng thực hiện nhập số tiền cần nạp và được hệ thống chuyển hướng đến trang thanh toán thử nghiệm của cổng VNPay Sandbox.
* `[HÌNH 4.3.3.3: Giao diện quản lý ví nội bộ và liên kết nạp tiền]`

### 4. Giao diện Thẩm định sản phẩm (Appraiser Workspace)
* **Mô tả:** Màn hình làm việc của chuyên gia thẩm định. Chuyên gia xem danh sách yêu cầu thẩm định sản phẩm, thực hiện nhận yêu cầu, xem ảnh chi tiết gỗ và nhập thông tin báo cáo đánh giá chất lượng để ban hành chứng thư kiểm định kèm mã số chứng thư và mã vân tay toàn vẹn dữ liệu.
* `[HÌNH 4.3.3.4: Giao diện làm việc của chuyên gia thẩm định chất lượng gỗ]`

### 5. Giao diện Quản lý Đơn hàng và Giao nhận (Order & Fulfillment)
* **Mô tả:** Màn hình quản lý đơn hàng. Người mua thực hiện thanh toán phần còn lại của đơn hàng; người bán cập nhật mã vận đơn và đơn vị vận chuyển sau khi gửi hàng; người mua thực hiện bấm nút xác nhận đã nhận được hàng để hệ thống tự động hoàn tất đơn hàng và giải ngân số tiền thanh toán vào ví khả dụng của người bán.
* `[HÌNH 4.3.3.5: Giao diện chi tiết đơn hàng và theo dõi vận chuyển]`

### 6. Giao diện Phân xử Tranh chấp (Dispute Workspace)
* **Mô tả:** Màn hình giải quyết tranh chấp của đơn hàng. Người mua thực hiện mở khiếu nại và tải lên hình ảnh bằng chứng; các bên tham gia (người mua, người bán và admin) gửi tin nhắn giải trình trong phần lịch sử hội thoại của vụ việc (lịch sử tin nhắn được tự động cập nhật theo chu kỳ định sẵn).
* `[HÌNH 4.3.3.6: Giao diện không gian giải quyết tranh chấp]`
