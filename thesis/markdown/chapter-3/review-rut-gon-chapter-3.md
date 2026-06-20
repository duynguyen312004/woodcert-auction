# Rà soát Chương 3

Ngày rà soát: 19/06/2026.

Phạm vi:

- `thesis/Chuong/3_Cong_nghe.tex`;
- ba mã nguồn PlantUML `system_architecture.puml`, `realtime_flow.puml` và `mysql_redis.puml`;
- các bản render PDF, SVG, PNG tương ứng;
- mã nguồn, cấu hình, migration, kiểm thử và quy trình triển khai liên quan.

Trạng thái thực hiện: phần nội dung chữ và tài liệu tham khảo đã được chỉnh sửa ngày 20/06/2026. Sơ đồ kiến trúc đang là bản nháp và sẽ được bàn luận, chốt riêng trước khi hoàn thiện.

## Kết luận nhanh

Chương 3 hiện có khoảng 3.000 từ, 14 tiểu mục, 3 hình và biên dịch riêng thành 9 trang A4. Độ dài chưa vượt mức tối đa 10 trang của template, nhưng mật độ nội dung cao và hai sơ đồ trình tự đã đi sâu sang phần thiết kế, triển khai và đóng góp kỹ thuật của Chương 4–5.

Nội dung nhìn chung bám sát codebase. Tuy nhiên, cần sửa một số điểm về migration, hạn xác nhận gửi hàng, quy trình VNPay, trách nhiệm của các lớp trong vòng đời đấu giá, thời điểm ghi nhận doanh thu và cấu hình phê duyệt triển khai.

Nên rút khoảng 15–25%, đưa chương về khoảng 2.300–2.500 từ và 7–8 trang. Hướng rút phù hợp nhất là:

1. Giữ nhưng thiết kế lại sơ đồ kiến trúc triển khai.
2. Bỏ hai sơ đồ trình tự `realtime_flow` và `mysql_redis` khỏi Chương 3 vì Chương 4 đã có sơ đồ đặt giá và đóng phiên.
3. Thay các đoạn so sánh công nghệ rải rác bằng một bảng so sánh ngắn.
4. Rút chi tiết triển khai, số bước xử lý và giới hạn đo kiểm sang Chương 4–6.

## Mức độ đáp ứng quy định của template

### Những điểm đang đáp ứng

- Chương giải thích vai trò của công nghệ thay vì chỉ liệt kê tên.
- Các công nghệ chính đều có trích dẫn.
- Phiên bản Java, Spring Boot, React, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS, MySQL và Redis khớp với manifest hoặc cấu hình hiện tại.
- Chương phân biệt đúng kiến trúc nguyên khối phân mô-đun với microservices.
- Chương phân biệt Redis là nguồn trạng thái thời gian chạy của phiên `ACTIVE`, còn MySQL lưu dữ liệu bền vững và trạng thái kết thúc.
- Các hình có caption, label, tham chiếu trong nội dung và sử dụng bản PDF vector.

### Những điểm chưa đáp ứng đầy đủ

Template yêu cầu nêu các công nghệ hoặc hướng tiếp cận thay thế và giải thích lựa chọn. Bản hiện tại đã thực hiện điều này với Spring Boot, IAM, WebSocket, Flyway, MySQL, Cloudinary, React, Zustand, Tailwind CSS và Docker, nhưng chưa đồng đều với Redis, Nginx, GitHub Actions và nhóm công cụ kiểm thử.

Không nên bổ sung thêm nhiều đoạn văn vì sẽ làm chương dài hơn. Nên tạo một bảng khoảng 7–8 dòng gồm:

| Nhóm | Lựa chọn của Đồ án | Phương án thay thế | Lý do lựa chọn |
|---|---|---|---|
| Phần mềm phía máy chủ | Spring Boot | NestJS, Django | Phù hợp codebase Java, giao dịch quan hệ và hệ sinh thái kiểm thử |
| Phần mềm giao diện | React | Vue, Angular | Phù hợp cấu trúc SPA và mã nguồn hiện có |
| Cơ sở dữ liệu | MySQL | PostgreSQL | Schema, migration và kiểm thử hiện được xây dựng trên MySQL |
| Trạng thái phiên hoạt động | Redis/Lua | MySQL thuần, Memcached | Cần cấu trúc dữ liệu và thực thi Lua nguyên tử |
| Truyền sự kiện | WebSocket/STOMP | SSE, polling | Phù hợp cơ chế topic và kết nối lâu dài hiện có |
| Lưu trữ đa phương tiện | Cloudinary | S3, lưu trên VPS | Hỗ trợ tải trực tiếp có chữ ký và đọc metadata |
| Triển khai | Docker Compose/GitHub Actions | triển khai thủ công, Kubernetes | Phù hợp một VPS và quy mô hiện tại |
| Kiểm thử | JUnit, Vitest, Playwright, Testcontainers | các framework tương đương | Khớp hệ sinh thái và môi trường chạy của dự án |

Bảng này vừa đáp ứng rule, vừa thay được phần lớn các đoạn “công nghệ X cũng có thể sử dụng”.

## Các điểm phải sửa về độ chính xác

### Danh sách Flyway migration đã lỗi thời

Dòng 66 ghi hệ thống có bốn migration từ V1 đến V4. Hiện tại đã có:

- `V1__baseline_schema.sql`;
- `V2__seed_reference_data.sql`;
- `V3__seed_demo_users.sql`;
- `V4__add_dispute_conversation.sql`;
- `V5__add_shipment_deadline.sql`.

Phải sửa thành năm migration và nêu V5 bổ sung hạn xác nhận gửi hàng.

### Hạn gửi hàng đang được diễn đạt sai phạm vi

Dòng 28 dùng cụm “quá hạn giao hàng”. Cấu hình và migration hiện quy định thời hạn mặc định 72 giờ để Người bán xác nhận đã gửi hoặc bàn giao hàng sau khi đơn được thanh toán; đây không phải hạn kiện hàng phải đến tay Người mua.

Nên dùng:

> quá hạn xác nhận gửi hoặc bàn giao hàng

### Luồng VNPay đang gộp Return và IPN

Dòng 20 và sơ đồ kiến trúc dùng một mũi tên “Return/IPN” từ VNPay về Nginx. Hai luồng có bản chất khác nhau:

- Return là chuyển hướng trình duyệt Người dùng về endpoint của Hệ thống.
- IPN là yêu cầu máy chủ tới máy chủ từ VNPay.

Ngoài ra, cấu hình production hiện bật `VNPAY_CONFIRM_ON_RETURN_ENABLED=true` vì Đồ án sử dụng VNPay Sandbox và chưa đăng ký IPN công khai của merchant production. Endpoint IPN vẫn tồn tại trong code nhưng không nên vẽ như cơ chế xác nhận production đang được sử dụng ngang hàng với Return.

Nên tách hai mũi tên và ghi chú rõ phạm vi Sandbox.

### Sơ đồ vòng đời gán sai trách nhiệm kích hoạt

Trong `mysql_redis.puml`, `AuctionSessionScheduler` được vẽ trực tiếp:

1. đọc phiên và người tham gia từ MySQL;
2. khởi tạo Redis;
3. chuyển phiên sang `ACTIVE`.

Trong code, scheduler chỉ tìm mã phiên đến hạn rồi gọi `AuctionSessionLifecycleWorker.activateDueSession`. Chính tiến trình xử lý vòng đời:

- khóa bản ghi phiên;
- đọc người tham gia có cọc `FROZEN`;
- khởi tạo trạng thái Redis;
- chuyển phiên sang `ACTIVE` trong giao dịch.

Nếu giữ sơ đồ ở nơi khác, phải đưa `AuctionSessionLifecycleWorker` vào giai đoạn kích hoạt.

### Sơ đồ vòng đời ghi sai việc phát sinh doanh thu

Mũi tên “Hoàn/thu tiền cọc và ghi doanh thu” trong `mysql_redis.puml` chưa đúng. Quyết toán ngay sau khi đóng phiên chỉ:

- giải phóng tiền cọc cho người không thắng;
- khấu trừ tiền cọc của người thắng;
- tạo đơn hàng nếu quyết toán hoàn tất.

Doanh thu nền tảng không được ghi trong `AuctionSettlementService`. Phí thẩm định được ghi khi gửi thẩm định; phí mất cọc và hoa hồng bán hàng được ghi ở các trạng thái tương ứng của đơn hàng.

Nên đổi thành:

> Hoàn hoặc khấu trừ tiền cọc

### Ghi lượt đặt giá bị từ chối cũng là cố gắng ghi

Dòng 56 và `realtime_flow.puml` diễn đạt lượt đặt giá hết hạn hoặc quá thấp “được ghi nhận” vào MySQL. `BidPersistenceService` bắt và ghi log lỗi thay vì làm thất bại yêu cầu, nên việc ghi này cũng không được bảo đảm tuyệt đối.

Nên dùng:

> Hệ thống cố gắng lưu lượt đặt giá bị từ chối để phục vụ kiểm tra và truy vết.

### Video đóng gói cần diễn đạt chính xác hơn

Dòng 94 nói video đóng gói “mới là phạm vi dự kiến”. Code đã khai báo `SHIPMENT_PACKING_VIDEO` và giới hạn dung lượng video, nhưng chưa có luồng giao nhận hoàn chỉnh để Người bán tải và gắn video với đơn hàng.

Nên viết:

> Hệ thống đã có khai báo kỹ thuật cho video đóng gói nhưng chưa tích hợp loại tệp này vào luồng giao nhận hiện hành.

### Phê duyệt GitHub Environment được cấu hình bên ngoài repository

Dòng 136 khẳng định môi trường `production` bắt buộc phê duyệt thủ công. Workflow chứng minh job dùng GitHub Environment `production`; quy tắc required reviewer nằm trong thiết lập GitHub và không được lưu trong repository.

Chủ dự án xác nhận ngày 19/06/2026 rằng environment `production` đã bật required reviewer. Vì vậy, nội dung có thể ghi:

> Job triển khai sử dụng GitHub Environment `production` và chỉ được thực thi sau khi người có quyền phê duyệt bản triển khai. Quy tắc này được cấu hình trong thiết lập GitHub Environment, bên ngoài mã nguồn.

### Nguồn JUnit và Spring WebSocket cần khóa đúng phiên bản

Project hiện dùng:

- Spring Framework 6.2.19, được Spring Boot 3.5.15 quản lý;
- JUnit Jupiter 5.12.2.

URL Spring WebSocket hiện tại trong BibTeX không khóa phiên bản và đang chuyển tới Spring Framework 7. URL JUnit dùng đường dẫn `current`, tại ngày rà soát đã chuyển tới JUnit 6.1.0, không còn khớp tiêu đề “JUnit 5 User Guide”.

Nên dùng:

- `https://docs.spring.io/spring-framework/reference/6.2/web/websocket.html`;
- `https://docs.junit.org/5.12.2/user-guide/`.

Các entry tài liệu trực tuyến cũng không nên tự gán năm 2025 hoặc 2026 nếu trang chính thức không công bố năm phát hành. Nên dùng trường `urldate` cho ngày truy cập và chỉ giữ `year` khi có căn cứ.

## Rà soát từng sơ đồ

### Sơ đồ kiến trúc triển khai

Đánh giá nội dung: cơ bản đúng và nên giữ.

Các thành phần Nginx host, frontend, backend, MySQL, Redis, Cloudinary, SMTP và VNPay khớp với cấu hình production. MySQL và Redis không công bố cổng; frontend và backend bind vào loopback; Redis 7.4 bật AOF.

Các điểm cần sửa:

- Tách Return và IPN của VNPay.
- Không đặt `127.0.0.1:3000` và `127.0.0.1:8080` như địa chỉ bên trong container. Đây là ánh xạ cổng ở máy chủ; giao tiếp nội bộ container sử dụng tên dịch vụ và cổng container.
- Đổi Buyer, Seller, Appraiser, Admin thành Người mua, Người bán, Thẩm định viên và Quản trị viên.
- Bỏ phiên bản chi tiết khỏi từng khối để giảm nhiễu; phiên bản đã có trong nội dung hoặc bảng công nghệ.
- Bỏ hai ghi chú dài vì nội dung đã được giải thích trong đoạn văn.

Đánh giá trình bày: chưa đạt độ đọc tốt trên A4. Sơ đồ quá rộng, nhiều đường giao cắt và phần chữ bị thu nhỏ khi đặt `width=\linewidth`.

Nên bố trí lại theo chiều dọc:

1. Người dùng và dịch vụ ngoài ở hàng trên.
2. Nginx ở giữa.
3. Frontend/backend ở hàng tiếp theo.
4. MySQL/Redis ở hàng dưới.

Cách này giảm chiều ngang và giúp các nhãn còn đọc được khi in.

### Sơ đồ luồng đặt giá và phát sự kiện

Đánh giá nội dung: phần lớn đúng với `BidServiceImpl`.

Sơ đồ thể hiện đúng:

- lượt đặt giá đi qua REST thay vì gửi qua STOMP;
- Redis/Lua quyết định chấp nhận;
- phát `NEW_BID` trước khi ghi MySQL;
- lượt chưa đăng ký hoặc đang dẫn đầu không phát sự kiện;
- broker là simple broker nhúng trong Spring.

Điểm cần sửa nếu tiếp tục sử dụng:

- Ghi rõ lưu lượt đặt giá bị từ chối cũng là cơ chế cố gắng ghi.
- Chuẩn hóa thuật ngữ `Buyer`, `bidder alias`, `snapshot`, `best-effort` và `broadcast`.
- Đưa MySQL gần phía máy chủ hơn để tránh các mũi tên dài xuyên qua actor.

Đánh giá vị trí: không nên giữ trong Chương 3. Chương 4 đã có `active_bidding_sequence.png` và phần mô tả luồng đặt giá chi tiết; Chương 5 tiếp tục phân tích ranh giới Redis/MySQL. Sơ đồ này làm Chương 3 lặp nội dung và chiếm gần một trang.

Đề xuất: bỏ khỏi Chương 3. Khi rà soát Chương 4, chọn một sơ đồ trình tự đặt giá duy nhất và sửa theo code hiện tại.

### Sơ đồ phối hợp MySQL và Redis

Đánh giá nội dung: có ý tưởng đúng nhưng cần sửa cấu trúc.

Sơ đồ phân biệt được các giai đoạn kích hoạt, đặt giá, chốt phiên và quyết toán. Tuy nhiên:

- giai đoạn kích hoạt gán nhầm trách nhiệm cho scheduler;
- mũi tên ghi doanh thu không đúng nghiệp vụ;
- chưa thể hiện tác vụ sửa chữa quyết toán và tạo đơn hàng bị thiếu;
- đường phục hồi hiện chỉ được kích hoạt khi trạng thái Redis rỗng; nếu thao tác đọc Redis ném lỗi kết nối, scheduler ghi log và thử lại ở lần quét sau, không trực tiếp chuyển ngay sang đường phục hồi MySQL;
- sơ đồ quá cao và quá nhiều participant, khiến chữ rất nhỏ trên A4.

Đánh giá vị trí: không nên giữ trong Chương 3. Chương 4 đã có sơ đồ đóng phiên; Chương 5 đã trình bày chi tiết ranh giới Redis/MySQL, đường phục hồi và quyết toán.

Đề xuất: bỏ khỏi Chương 3. Nếu cần một hình cho phần công nghệ dữ liệu, thay bằng bảng trách nhiệm ngắn:

| Thành phần | Trách nhiệm |
|---|---|
| Redis | Trạng thái phiên `ACTIVE`, danh sách người đủ điều kiện, quyết định lượt đặt giá bằng Lua |
| MySQL | Cấu hình phiên, lịch sử, bản chụp trạng thái, trạng thái kết thúc, dữ liệu tài chính và đơn hàng |
| Tác vụ nền | Kích hoạt, chốt phiên, quyết toán, sửa trạng thái còn dang dở |

## Vấn đề đồng bộ giữa mã PlantUML và file render

Ba file PDF và SVG được render lại vào khoảng 09:26–09:27 ngày 19/06/2026, trong khi ba file PNG có thời gian cũ hơn, khoảng 02:43–02:55. Nội dung PNG không còn đồng bộ hoàn toàn với mã PlantUML hiện tại.

LaTeX đang dùng PDF nên bản báo cáo hiện không lấy nhầm PNG cũ. Tuy nhiên, trước khi đóng gói source cần render lại đồng bộ PDF, SVG và PNG từ cùng một mã PlantUML, hoặc chỉ giữ các định dạng thực sự được sử dụng theo quy ước đã duyệt.

## Các phần có thể rút gọn

### Tổng quan kiến trúc

Giữ hai đoạn về kiến trúc nguyên khối phân mô-đun và lý do phù hợp với một VPS. Rút phần liệt kê chi tiết các miền nghiệp vụ vì Chương 4 đã mô tả package/module.

Giữ một sơ đồ kiến trúc đã được thiết kế lại.

Mức rút đề xuất: 15–20%.

### Java, Spring Boot và bảo mật

Đoạn Java/Spring hiện mô tả nhiều đặc tính chung như kiểu tĩnh, JVM, tự động cấu hình, vòng đời bean. Có thể rút còn:

- phiên bản và vai trò;
- các module Spring thực sự dùng;
- lý do phù hợp với giao dịch quan hệ và codebase.

Chi tiết về khóa bản ghi, khóa lạc quan và khóa thao tác nghiệp vụ chỉ nên nêu một câu, vì Chương 5 đã phân tích.

Phần Keycloak/Auth0 có thể chuyển vào bảng so sánh chung.

Mức rút đề xuất: 20–25%.

### WebSocket, STOMP và SockJS

Giữ:

- WebSocket/STOMP dùng để phát sự kiện;
- lượt đặt giá đi qua REST;
- simple broker là broker nhúng;
- lý do chọn so với SSE/polling.

Bỏ sơ đồ trình tự và rút mô tả thứ tự ghi Redis/MySQL vì đây là nội dung Chương 4–5.

Mức rút đề xuất: 35–45%.

### Flyway, MySQL, Redis và Cloudinary

- Flyway chỉ cần một đoạn, cập nhật V1–V5.
- MySQL và Redis nên được trình bày bằng một bảng trách nhiệm thay cho sơ đồ trình tự.
- Lua chỉ cần mô tả nhóm điều kiện được thực thi nguyên tử, không kể lại toàn bộ vòng đời phiên.
- Cloudinary giữ hai đoạn về tải trực tiếp có chữ ký, xác nhận metadata và phạm vi tệp đã tích hợp.

Mức rút đề xuất: 20–30%.

### Công nghệ giao diện

Ba tiểu mục hiện chính xác nhưng hơi chia nhỏ. Có thể gộp thành hai nhóm:

1. React, TypeScript, Vite và tổ chức SPA.
2. Quản lý dữ liệu/trạng thái và giao diện.

Không cần lặp nhiều lựa chọn thay thế trong từng đoạn; đưa vào bảng chung.

Mức rút đề xuất: 15–20%.

### Hạ tầng, CI/CD và kiểm thử

Chương 3 chỉ cần nêu vai trò của Nginx, Docker Compose, GitHub Actions và các công cụ kiểm thử. Các bước pipeline cụ thể, điều kiện triển khai, sao lưu, rollback và số liệu kiểm thử thuộc Chương 4–6.

Dòng 142 về p95, đồng thời và availability nên rút thành một câu:

> Các mục tiêu hiệu năng và khả dụng chỉ được xem là kết quả khi có đo kiểm tải hoặc dữ liệu giám sát tái lập.

Không đưa số `482/482` hoặc `403` vào Chương 3; đây là chương công nghệ. Số liệu kiểm thử nên được giải thích và dẫn bằng report ở Chương 4, sau đó tóm tắt ở Chương 6.

Mức rút đề xuất: 25–35%.

## Chuẩn hóa thuật ngữ và văn phong

Áp dụng cùng quy ước đã thống nhất cho Chương 5–6:

- `monolith mô-đun` → `kiến trúc nguyên khối phân mô-đun (modular monolith)`;
- `backend` → `phần mềm phía máy chủ (backend)` ở lần đầu;
- `frontend` → `phần mềm giao diện (frontend)` ở lần đầu;
- `request` → `yêu cầu`;
- `transaction` → `giao dịch`;
- `optimistic locking` → `khóa lạc quan (optimistic locking)`;
- `operation key idempotent` → `khóa thao tác nghiệp vụ lũy đẳng`;
- `bid` → `lượt đặt giá`;
- `bid audit` → `lịch sử kiểm tra lượt đặt giá`;
- `snapshot` → `bản chụp trạng thái`;
- `runtime` → `trạng thái thời gian chạy`;
- `best-effort` → `cố gắng ghi nhưng không bảo đảm thành công`;
- `scheduler` → `tác vụ nền theo lịch` hoặc `bộ lập lịch`;
- `lifecycle worker` → `tiến trình xử lý vòng đời`;
- `broadcast` → `phát sự kiện`;
- `subscribe` → `đăng ký nhận sự kiện`;
- `retry` → `thử lại`;
- `cache` → `bộ nhớ đệm` khi không phải định danh kỹ thuật;
- `media` → `tệp đa phương tiện`;
- `payload` → `nội dung thông điệp`;
- `Buyer`, `Seller`, `Appraiser`, `Admin` → `Người mua`, `Người bán`, `Thẩm định viên`, `Quản trị viên`.

Tên công nghệ, endpoint, lớp, trạng thái enum và định danh mã nguồn được giữ nguyên khi cần đối chiếu.

Các caption đang dùng “Nguồn: Tác giả tổng hợp”. Theo quy ước xưng hô mới, nên thống nhất thành:

> Nguồn: Sinh viên tổng hợp từ cấu hình và mã nguồn Hệ thống.

## Cấu trúc đề xuất sau khi rút

1. Mở đầu và tiêu chí lựa chọn công nghệ.
2. Tổng quan kiến trúc cùng một sơ đồ triển khai đã rút gọn.
3. Nền tảng phía máy chủ và bảo mật.
4. Dữ liệu, trạng thái thời gian thực và truyền sự kiện.
5. Công nghệ giao diện.
6. Tích hợp ngoài.
7. Hạ tầng, CI/CD và kiểm thử.
8. Bảng so sánh lựa chọn thay thế.
9. Tổng kết chương.

Không cần ba hình. Một hình kiến trúc và một bảng trách nhiệm MySQL/Redis là đủ cho vai trò của Chương 3.

## Ước lượng rút gọn

| Phần | Mức rút đề xuất |
|---|---:|
| Tổng quan kiến trúc | 15–20% |
| Java/Spring và bảo mật | 20–25% |
| WebSocket và luồng thời gian thực | 35–45% |
| Dữ liệu và Cloudinary | 20–30% |
| Công nghệ giao diện | 15–20% |
| Hạ tầng, CI/CD và kiểm thử | 25–35% |
| Toàn Chương 3 | Khoảng 15–25% |

Sau khi bỏ hai sơ đồ trình tự và thay các đoạn so sánh bằng một bảng, chương dự kiến còn khoảng 7–8 trang.

## Căn cứ đã đối chiếu

- `thesis/Chuong/3_Cong_nghe.tex`.
- `thesis/docs/thesis_writing_plan.md`.
- `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex`.
- `thesis/Chuong/5_Giai_phap_dong_gop.tex`.
- `thesis/diagrams/plantuml/system_architecture.puml`.
- `thesis/diagrams/plantuml/realtime_flow.puml`.
- `thesis/diagrams/plantuml/mysql_redis.puml`.
- `woodcert-auction/pom.xml`.
- `woodcert-auction-fe/package.json`.
- `woodcert-auction-fe/vite.config.ts`.
- `woodcert-auction/src/main/resources/application.yaml`.
- `woodcert-auction/src/main/resources/db/migration/`.
- `docker-compose.prod.yml`.
- `nginx-proxy.conf`.
- `.github/workflows/ci.yml`.
- `.github/workflows/release-production.yml`.
- `scripts/deploy-production.sh`.
- Các dịch vụ đấu giá, tài chính, định danh, media và VNPay liên quan.
- Tài liệu chính thức của Spring Boot 3.5, Spring Framework 6.2, JUnit 5.12.2, Redis, MySQL, Cloudinary, React, Vite, Docker và GitHub Actions.

## Kiểm tra đã thực hiện

- Đếm cấu trúc và dung lượng nội dung Chương 3.
- Biên dịch độc lập Chương 3 bằng `pdflatex`: tạo được PDF 9 trang.
- Kiểm tra trực quan cả ba sơ đồ ở kích thước render và khi đặt trên trang A4.
- Đối chiếu mã PlantUML với code thực tế.
- Đối chiếu phiên bản dependency từ Maven và `package.json`.
- Đối chiếu cấu hình production, Nginx, CI/CD, deploy script và migration.
- Kiểm tra sự tồn tại của toàn bộ khóa trích dẫn được dùng trong Chương 3.

Khi biên dịch riêng, có các cảnh báo tham chiếu/citation chưa giải quyết do chưa chạy BibTeX và lượt LaTeX tiếp theo. Ngoài ra còn có các dòng tràn lề khoảng 1,56 pt, 22,25 pt và 24,61 pt ở phần kiến trúc, Cloudinary và Zustand; cần xử lý khi chỉnh LaTeX.

## Thông tin cần xác nhận

Không có.
