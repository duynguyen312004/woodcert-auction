# 4.1 Thiết kế kiến trúc

## 4.1.1 Lựa chọn kiến trúc phần mềm

Hệ thống **WoodCert Auction** được xây dựng trên mô hình kiến trúc **Modular Monolith (Kiến trúc đơn khối phân mô-đun)**. Đây là một quyết định kiến trúc có chủ đích, nhằm cân bằng giữa tính cô lập về mặt mã nguồn của các phân hệ nghiệp vụ khác nhau và sự đơn giản trong quá trình triển khai và vận hành hệ thống thực tế.

Trong thiết kế này, toàn bộ mã nguồn hệ thống được đóng gói và thực thi bên trong một tiến trình chạy trên một máy ảo Java (JVM) duy nhất, chia sẻ chung một cơ sở dữ liệu MySQL và một instance bộ nhớ đệm Redis. Tuy nhiên, ở mức độ tổ chức mã nguồn, dự án phân tách rõ rệt thành hai phân vùng chính:

1. **Shared Infrastructure (Hạ tầng dùng chung - `core`):** Chứa các cấu hình cơ sở và thành phần dùng chung hỗ trợ cho toàn hệ thống như: phân hệ xử lý ngoại lệ toàn cục (`GlobalExceptionHandler`), cấu hình bảo mật và JWT (`SecurityConfig`), cấu hình WebSocket (`WebSocketConfig`), các tiện ích mã hóa và định dạng dữ liệu dùng chung.
2. **Business Domains (Các miền nghiệp vụ - `feature`):** Gồm 8 mô-đun nghiệp vụ độc lập được phân chia theo ranh giới ngữ cảnh (bounded context):
   * `identity`: Quản lý tài khoản, thông tin người dùng, seller và phân quyền.
   * `media`: Quản lý tải lên và lưu trữ hình ảnh thông qua tích hợp Cloudinary.
   * `catalog`: Quản lý danh mục sản phẩm và quy trình thẩm định gỗ mỹ nghệ.
   * `finance`: Quản lý ví ảo, lịch sử giao dịch và nạp tiền qua cổng VNPay Sandbox.
   * `auction`: Quản lý cấu hình phiên, đăng ký đặt cọc và luồng đặt giá thời gian thực.
   * `order`: Quản lý đơn hàng phát sinh sau đấu giá và thanh toán phần còn lại.
   * `fulfillment`: Quản lý quy trình giao nhận hàng và tự động hoàn tất.
   * `dispute`: Quản lý khiếu nại, tranh chấp giữa người mua và người bán.

### Phân lớp nội bộ mô-đun
Mỗi mô-đun nghiệp vụ bên trong gói `feature` được tổ chức nội bộ theo kiến trúc phân lớp truyền thống nhằm đảm bảo sự mạch lạc và dễ bảo trì:
* **Tầng Controller:** Tiếp nhận các yêu cầu HTTP REST, thực hiện các kiểm tra tính hợp lệ sơ bộ của tham số đầu vào (qua Spring Validation), và trả về phản hồi chuẩn hóa thông qua lớp wrapper `ApiResponse<T>`.
* **Tầng Service:** Chứa logic nghiệp vụ cốt lõi của mô-đun. Với các mô-đun phức tạp như `auction`, tầng service được phân rã thành các lớp dịch vụ chuyên biệt (như dịch vụ facade, dịch vụ thực thi command, dịch vụ truy vấn query, dịch vụ kiểm tra chính sách policy và dịch vụ quyết toán cọc settlement) để tránh hiện tượng lớp dịch vụ phình to (God Class).
* **Tầng Repository:** Thực hiện truy vấn dữ liệu từ cơ sở dữ liệu MySQL thông qua Spring Data JPA và Hibernate.
* **Tầng Entity:** Định nghĩa các mô hình dữ liệu bền vững tương ứng với các bảng trong cơ sở dữ liệu.
* **Tầng DTO (Data Transfer Object):** Đóng vai trò là hợp đồng dữ liệu trao đổi giữa máy khách và máy chủ, ngăn chặn việc rò rỉ trực tiếp các thực thể cơ sở dữ liệu ra ngoài API.

### Phân tích sự đánh đổi (Architectural Trade-offs)
* **Lợi ích:**
  * *Hiệu năng giao tiếp:* Mọi tương tác liên mô-đun đều được thực hiện qua các lời gọi hàm trực tiếp trong cùng một tiến trình (in-process calls), không phát sinh giao tiếp mạng giữa các mô-đun nội bộ và giảm thiểu chi phí tuần tự hóa dữ liệu (serialization) vốn có trong kiến trúc microservices.
  * *Nhất quán dữ liệu:* Dễ dàng quản lý tính toàn vẹn dữ liệu thông qua cơ chế quản lý giao dịch của Spring (`@Transactional`), hỗ trợ rollback tự động khi có lỗi xảy ra trong các luồng nghiệp vụ liên quan đến nhiều mô-đun (như luồng đóng phiên đấu giá và tạo đơn hàng).
  * *Vận hành đơn giản:* Giảm thiểu chi phí quản lý hạ tầng, giám sát và cấu hình CI/CD khi chỉ cần quản lý một ứng dụng backend chính được đóng gói chạy trên VPS.
* **Đánh đổi:**
  * *Thiếu tính cô lập tài nguyên:* Sự cố nghẽn luồng hoặc rò rỉ bộ nhớ ở một mô-đun có thể gây ảnh hưởng đến toàn bộ ứng dụng. Hệ thống giảm thiểu rủi ro này bằng cách bọc cô lập các logic có thời gian xử lý kéo dài trong một số tác vụ nền chạy định kỳ (như tác vụ tự động quét và dọn dẹp các tệp tin đa phương tiện mồ côi trên Cloudinary qua cơ chế `@Scheduled`), áp dụng xử lý an toàn lỗi (như bọc try-catch độc lập cho quy trình gửi email xác thực tài khoản để tránh làm rollback giao dịch đăng ký chính), hoặc tách biệt giao dịch con (`REQUIRES_NEW`) trong scheduler đóng phiên.

### Điểm nhấn kiến trúc hệ thống (Signature Architecture)
Bên cạnh cách tổ chức mã nguồn theo Modular Monolith, điểm nhấn kiến trúc của hệ thống nằm ở mô hình quản lý trạng thái lai (Hybrid Runtime Storage) cho phiên đấu giá thời gian thực. Khi phiên ở trạng thái `ACTIVE`, Redis được sử dụng để lưu trạng thái runtime như giá hiện tại, người đang dẫn đầu, thời điểm kết thúc và danh sách người tham gia. Các thao tác đặt giá được kiểm tra và cập nhật thông qua Lua Script nhằm đảm bảo tính nguyên tử trong phạm vi một Redis instance. MySQL vẫn đóng vai trò là cơ sở dữ liệu bền vững để lưu cấu hình phiên, người tham gia, lịch sử đặt giá, đơn hàng và các trạng thái kết thúc. Cách phân tách này giúp hệ thống giảm tranh chấp ghi trực tiếp lên cơ sở dữ liệu quan hệ trong giai đoạn đặt giá cao điểm, đồng thời vẫn giữ được dữ liệu bền vững cần thiết cho đối soát và xử lý sau phiên.

---

## 4.1.2 Thiết kế tổng quan (UML Package Diagram)

Sơ đồ gói thể hiện cách tổ chức cấu trúc phân cấp các mô-đun của hệ thống WoodCert Auction và các quy tắc phụ thuộc chặt chẽ giữa chúng.

`[HÌNH DỰ KIẾN: Sơ đồ gói UML Package Diagram hệ thống WoodCert Auction]`

### Quy tắc thiết kế ranh giới và phụ thuộc gói:
1. **Phụ thuộc một chiều (Dependency Direction):** Các gói nghiệp vụ trong `feature` được phép phụ thuộc vào gói `core` để sử dụng các lớp cấu hình và tiện ích dùng chung. Tuy nhiên, gói `core` không được thiết kế phụ thuộc ngược lại các gói trong `feature`.
2. **Giao tiếp liên mô-đun hạn chế:** Các mô-đun nghiệp vụ hạn chế việc phụ thuộc trực tiếp vào Repository của mô-đun khác. Khi cần lấy dữ liệu hoặc kích hoạt hành động liên mô-đun, các mô-đun thực hiện gọi thông qua interface Service công khai (Public Service) hoặc lớp chuyển đổi Adapter được định nghĩa sẵn. Ví dụ: gói `auction` giao tiếp với gói `order` thông qua lớp `AuctionOrderSourceAdapter` để thực hiện chuyển giao phiên đấu giá thắng cuộc sang đơn hàng, đảm bảo tính đóng gói của mô-đun đơn hàng.

---

## 4.1.3 Thiết kế chi tiết gói

Để minh họa chi tiết cách thiết kế phân lớp bên trong một mô-đun, gói `auction` (quản lý đấu giá) được chọn làm mô hình tiêu biểu nhất. Đây là một trong các mô-đun có logic nghiệp vụ phức tạp nhất, chịu trách nhiệm quản lý vòng đời phiên đấu giá và phối hợp trạng thái giữa Redis và MySQL.

`[HÌNH DỰ KIẾN: Biểu đồ lớp UML Class Diagram chi tiết gói auction]`

### Giải thích thiết kế các lớp cốt lõi trong gói `auction`:
* **`AuctionController`:** Phơi bày các API REST cho phép người dùng xem danh sách phòng đấu giá, đăng ký tham gia, rút cọc, và gửi lượt đặt giá.
* **`AuctionService` (Facade Interface) & `AuctionServiceImpl`:** Đóng vai trò là cổng giao tiếp duy nhất cho Controller gọi vào. Lớp service triển khai điều phối các service chuyên biệt bên dưới:
  * `AuctionCommandService`: Thực hiện các thay đổi trạng thái phiên như tạo phiên, hủy phiên.
  * `AuctionQueryService` & `BuyerAuctionQueryService`: Thực hiện truy vấn danh sách, chi tiết phòng đấu giá, tích hợp trạng thái thực tế từ Redis.
  * `AuctionPolicy`: Kiểm tra các quy tắc nghiệp vụ khi khởi tạo phiên đấu giá (như xuất phát điểm của giá, bước giá, tiền cọc, khoảng thời gian tối thiểu).
  * `AuctionRedisService`: Giao tiếp trực tiếp với Redis để thực thi Lua Script đặt giá nguyên tử và quản lý bộ nhớ đệm phòng đấu giá.
  * `AuctionSettlementService`: Phối hợp xử lý giải phóng tiền cọc cho người thua và khấu trừ tiền cọc cho người thắng sau khi kết thúc phiên.
* **`AuctionSessionRepository` & `AuctionParticipantRepository`:** Các interface Spring Data JPA tương tác với cơ sở dữ liệu MySQL. `AuctionSessionRepository` sử dụng `@Lock(LockModeType.PESSIMISTIC_WRITE)` trong các truy vấn quan trọng để bảo vệ dữ liệu khỏi race condition ở mức độ cơ sở dữ liệu.
* **`AuctionSession` & `AuctionParticipant`:** Các thực thể JPA bền vững lưu trữ thông tin cấu hình phiên đấu giá và thông tin đóng băng tiền cọc của người tham gia.
