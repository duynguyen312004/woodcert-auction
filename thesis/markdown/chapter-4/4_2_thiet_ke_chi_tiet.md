# 4.2 Thiết kế chi tiết

## 4.2.1 Thiết kế giao diện

Hệ thống **WoodCert Auction** xây dựng giao diện ứng dụng SPA (Single Page Application) sử dụng thư viện **React 19.2** và khung thiết kế **Tailwind CSS 4.1**. Giao diện hướng tới sự nhất quán, trực quan, hỗ trợ tương tác thời gian thực trong phòng đấu giá.

### Layout và Responsive
* **Độ phân giải đích:** Giao diện được thiết kế tối ưu hóa cho màn hình Desktop với độ phân giải tối thiểu 1280x720 pixel (đặc biệt là bảng quản trị admin, giao diện thẩm định gỗ của chuyên gia, và phòng đấu giá thời gian thực).
* **Khả năng co giãn (Responsive Layout):** Sử dụng grid system và các tiện ích responsive của Tailwind CSS để tự động tương thích trên các thiết bị di động (mobile, tablet). Các thanh điều hướng (Navigation Bar) được chuyển đổi sang thanh menu rút gọn (Drawer/Sheet) trên màn hình nhỏ.

### Thống nhất các thành phần giao diện (UI Components)
Hệ thống chuẩn hóa các thành phần điều khiển giao diện thông qua bộ thư viện Radix UI để bảo đảm khả năng truy cập (accessibility) và hiệu ứng hiển thị:
* **Nút bấm (Button):** Phân chia thành các biến thể nghiệp vụ rõ ràng: nút hành động chính (Primary), hành động phụ (Secondary), nút cảnh báo/hủy bỏ (Destructive), nút dạng viền (Outline). Trạng thái tải (Loading state) được tích hợp trực tiếp để ngăn người dùng gửi yêu cầu trùng lặp.
* **Ô nhập liệu (Input Form):** Thiết kế đồng bộ về trạng thái focus, các trường thông tin bắt buộc được đánh dấu rõ ràng để hỗ trợ người dùng nhập liệu chính xác.
* **Hộp thoại (Modal/Dialog):** Sử dụng `Radix UI react-dialog` cho các hộp xác nhận nhạy cảm (như xác nhận đặt cọc đấu giá, gửi thẩm định). Hộp thoại sử dụng lớp phủ nền (overlay) để đảm bảo sự tập trung của người dùng vào nội dung cần xác nhận.
* **Menu thả xuống (Dropdown):** Dùng `Radix UI react-dropdown-menu` cho các menu tác vụ của người dùng và các bộ lọc danh sách sản phẩm.

### Xử lý Validation Form và Toast/Error State
* **Logic Validation:** Các form nhập liệu (đăng ký, tạo sản phẩm, đặt giá) được kiểm tra tính hợp lệ dữ liệu ngay tại client-side thông qua schema validation trước khi gửi yêu cầu lên backend.
* **Hiển thị thông điệp lỗi:** Các thông báo lỗi được hiển thị trực quan ngay bên dưới các trường thông tin vi phạm quy tắc validation để phản hồi tức thì cho người dùng.
* **Thông báo tức thời (Toast):** Toast notification tự động ẩn sau thời gian chờ mặc định và hỗ trợ hiển thị các trạng thái phản hồi nghiệp vụ (thành công, thất bại, cảnh báo, thông tin).

---

## 4.2.2 Thiết kế lớp

Mục này trình bày đặc tả thiết kế của 3 lớp thực thể cốt lõi gắn liền với các miền nghiệp vụ đặc thù và 2 biểu đồ trình tự (Sequence Diagrams) mô tả luồng giao tiếp trọng yếu của WoodCert Auction.

### 1. Đặc tả các lớp cốt lõi

#### Lớp `AuctionSession` (Phiên đấu giá)
* **Ý nghĩa:** Đại diện cho một phiên đấu giá gỗ mỹ nghệ, lưu cấu hình và snapshot kết quả.
* **Các thuộc tính chính:**
  * `id`: Khóa chính tự tăng của phiên đấu giá.
  * `productId`: Mã liên kết đến sản phẩm gỗ được đấu giá.
  * `startingPrice`: Giá khởi điểm khi bắt đầu phiên.
  * `reservePrice`: Mức giá bảo lưu tối thiểu của người bán (ẩn với người mua).
  * `stepPrice`: Bước giá tối thiểu bắt buộc cho lượt đặt giá tiếp theo.
  * `depositAmount`: Số tiền cọc bắt buộc người mua phải đóng băng để tham gia.
  * `startTime`: Thời điểm bắt đầu phiên đấu giá.
  * `endTime`: Thời điểm kết thúc phiên đấu giá.
  * `currentPrice`: Mức giá dẫn đầu hiện tại (được cập nhật từ Redis sau khi đặt giá thành công).
  * `highestBidderId`: Mã định danh người giữ giá cao nhất hiện tại.
  * `status`: Trạng thái phiên đấu giá (`WAITING`, `ACTIVE`, `ENDED_SUCCESS`, `ENDED_FAILED`, `CANCELED`).
  * `version`: Thuộc tính phiên bản sử dụng cơ chế khóa tối ưu (Optimistic Locking) chống ghi đè đồng thời.

#### Lớp `Wallet` (Ví ảo người dùng)
* **Ý nghĩa:** Quản lý số dư tiền khả dụng và tiền đặt cọc bị đóng băng của từng người dùng trên hệ thống.
* **Các thuộc tính chính:**
  * `id`: Khóa chính tự tăng của ví.
  * `userId`: Mã định danh liên kết độc lập với người dùng.
  * `availableBalance`: Số dư khả dụng dùng để thanh toán và đăng ký cọc.
  * `frozenBalance`: Số dư bị đóng băng tạm thời để bảo đảm nghĩa vụ đấu giá.
  * `version`: Thuộc tính phiên bản sử dụng cơ chế khóa tối ưu (Optimistic Locking) chống ghi đè đồng thời khi biến động số dư.

#### Lớp `AppraisalReport` (Báo cáo thẩm định)
* **Ý nghĩa:** Lưu trữ thông tin kết quả kiểm định chất lượng và nguồn gốc gỗ do chuyên gia ban hành.
* **Các thuộc tính chính:**
  * `id`: Khóa chính tự tăng của báo cáo.
  * `productId`: Mã liên kết đến sản phẩm gỗ tương ứng.
  * `appraiserId`: Mã định danh chuyên gia thực hiện thẩm định.
  * `certificateCode`: Mã số chứng thư tự động sinh dạng `CERT-{year}-{id}`.
  * `integrityHash`: Chuỗi băm SHA-256 Hex của payload báo cáo dùng làm vân tay toàn vẹn dữ liệu.
  * `verifiedMaterial`: Loại gỗ thực tế được kiểm định.
  * `estimatedValue`: Giá trị ước lượng của sản phẩm gỗ.
  * `isAuthentic`: Trạng thái phê duyệt tính đúng nguồn gốc của sản phẩm.
  * `appraisedAt`: Mốc thời gian máy chủ lúc phê duyệt báo cáo.

---

### 2. Thiết kế luồng truyền thông điệp (Sequence Diagrams)

#### Biểu đồ 1: Luồng đặt giá trực tiếp (Active Bidding Flow)
Biểu đồ trình tự này mô tả luồng xử lý từ lúc người dùng gửi yêu cầu đặt giá đến khi hệ thống cập nhật bộ nhớ đệm và phát sóng kết quả.

1. **Gửi yêu cầu:** Trình duyệt Client gửi yêu cầu đặt giá bằng giao thức HTTP POST tới endpoint `/api/v1/bids` của `AuctionController`.
2. **Kiểm tra sơ bộ:** `AuctionController` xác thực quyền hạn người dùng (yêu cầu vai trò Bidder) và gọi `AuctionService`.
3. **Thực thi nguyên tử (Redis Lua):** `AuctionService` gọi `AuctionRedisService` thực thi một Redis Lua Script đơn luồng:
   * Lua Script kiểm tra thời gian hiện tại trên Redis (so với `endTime`).
   * Kiểm tra xem ID người dùng có nằm trong Set người đã đặt cọc (`bidders`) hay không.
   * So sánh giá trị đặt mới phải lớn hơn hoặc bằng `currentPrice + stepPrice`.
   * Kiểm tra người dùng không tự đè giá của chính mình.
4. **Gia hạn thời gian (Anti-sniper):** Nếu thời gian còn lại của phiên $\le 30$ giây, Lua Script tự động cộng thêm $60$ giây vào thời gian kết thúc của phiên trên Redis.
5. **Broadcast sự kiện:** Lua Script trả về kết quả thành công. `AuctionService` kích hoạt `AuctionBroadcastService` phát sự kiện `NEW_BID` qua giao thức WebSocket STOMP tới topic `/topic/auctions/{id}` để tất cả các máy khách đang quan sát cập nhật ngay giao diện.
6. **Đồng bộ best-effort:** Song song sau đó, `AuctionService` gọi bất đồng bộ sang `BidPersistenceService` để chèn lịch sử bản ghi vào bảng `bids` và cập nhật snapshot của phiên tại bảng `auction_sessions` trong MySQL. Nếu việc ghi MySQL gặp lỗi, kết quả thành công trả về cho client vẫn được giữ nguyên.

`[HÌNH DỰ KIẾN: Sơ đồ trình tự Luồng đặt giá trực tiếp]`

#### Biểu đồ 2: Luồng đóng phiên và xử lý cọc tự động (Auction Closure & Settlement Flow)
Biểu đồ trình tự này mô tả hoạt động của Scheduler chạy nền khi đóng phiên đấu giá kết thúc.

1. **Quét định kỳ:** Tác vụ nền `AuctionSessionScheduler` quét định kỳ mỗi 5 giây cơ sở dữ liệu MySQL để tìm các phiên `ACTIVE` có thời gian kết thúc nhỏ hơn hoặc bằng thời điểm hiện tại.
2. **Đóng phiên:** Với mỗi phiên đến hạn, Scheduler gọi `AuctionSettlementService` bọc trong một Transaction độc lập (`REQUIRES_NEW`).
3. **Lấy trạng thái cuối:** `AuctionSettlementService` đọc trạng thái cuối cùng (giá cao nhất, người thắng) từ Redis. Nếu Redis bị lỗi kết nối, hệ thống sẽ sử dụng MySQL snapshot làm fallback.
4. **Quyết toán cọc:** 
   * Nếu phiên đấu giá thành công (giá cao nhất $\ge$ giá bảo lưu): Hệ thống khấu trừ tiền cọc của người thắng (chuyển trạng thái cọc sang `DEDUCTED`), hoàn trả lại tiền cọc khả dụng cho tất cả những người thua cuộc (chuyển sang `REFUNDED`).
   * Nếu phiên thất bại (không có ai đặt giá hoặc giá cao nhất < giá bảo lưu): Hệ thống tự động giải phóng cọc cho toàn bộ người tham gia.
   * Để chống xử lý trùng lặp ví, mọi thay đổi số dư đều được bảo vệ bằng một `operation_key` duy nhất ghi vào bảng `wallet_operations` trước khi thực thi.
5. **Tạo đơn hàng:** Sau khi quyết toán cọc thành công, hệ thống thông qua `AuctionOrderSourceAdapter` kích hoạt `OrderService` tạo một đơn hàng mới ở trạng thái `PENDING_PAYMENT` với mức giá chốt phiên và khấu trừ đi số tiền cọc đã capture.
6. **Hủy trạng thái Redis:** `AuctionSettlementService` xóa bỏ cache trạng thái phiên đấu giá trên Redis và phát sự kiện `SESSION_ENDED` qua WebSocket.

`[HÌNH DỰ KIẾN: Sơ đồ trình tự Luồng đóng phiên và xử lý cọc tự động]`

---

## 4.2.3 Thiết kế cơ sở dữ liệu

Hệ thống sử dụng cơ sở dữ liệu quan hệ **MySQL 8.0** làm nguồn lưu trữ bền vững duy nhất của toàn hệ thống. Quá trình di trú cơ sở dữ liệu (Database Migration) được quản lý chặt chẽ thông qua thư viện **Flyway** từ phiên bản `V1` đến `V5`.

### Sơ đồ thực thể liên kết (ERD) logic tổng quan
Sơ đồ ERD logic dưới đây thể hiện cấu trúc các bảng cốt lõi và các mối liên kết nghiệp vụ chính của hệ thống WoodCert Auction.

`[HÌNH DỰ KIẾN: Sơ đồ ERD logic tổng quan hệ thống WoodCert Auction]`

### Đặc tả các liên kết chính của cơ sở dữ liệu:
* **Mô-đun Identity & Wallet:** Mỗi bản ghi `users` liên kết 1-1 với một bản ghi `wallets`. Bảng `wallets` liên kết 1-N với bảng `wallet_transactions` (lưu vết lịch sử biến động số dư khả dụng/đóng băng) và bảng `wallet_operations` (đảm bảo tính lý đẳng giao dịch).
* **Mô-đun Catalog & Appraisal:** Một sản phẩm gỗ (`products`) thuộc sở hữu của một người bán (`seller_profiles`) có tối đa một báo cáo thẩm định (`appraisal_reports`). Báo cáo thẩm định liên kết 1-N với bảng ảnh bằng chứng thẩm định `appraisal_images`.
* **Mô-đun Đấu giá (Auction):** Một sản phẩm gỗ (`products`) ở trạng thái thẩm định `APPRAISED` có thể được đưa vào đấu giá tại bảng `auction_sessions`. Bảng này liên kết 1-N với bảng `auction_participants` (quản lý đặt cọc tham gia) và bảng `bids` (nhật ký lịch sử đặt giá bền vững).
* **Mô-đun Đơn hàng & Tranh chấp:** Khi phiên đấu giá kết thúc thành công, một đơn hàng (`orders`) được sinh ra liên kết logic 1-1 với `auction_sessions`. Đơn hàng liên kết 1-1 với phân hệ giao hàng `order_fulfillments`, và có thể kích hoạt tối đa một hồ sơ tranh chấp `dispute_cases` (liên kết 1-N với `dispute_messages` và `dispute_evidence`).

*Lưu ý kiến trúc:* Các khóa runtime như cache trạng thái đấu giá (`auction:session:{id}:state`) hay khóa tài khoản tạm thời (`auth:locked`) chỉ được lưu trữ trên RAM của Redis để tối ưu hóa hiệu năng đọc/ghi trực tiếp, hoàn toàn nằm ngoài thiết kế ERD bền vững MySQL của hệ thống.
