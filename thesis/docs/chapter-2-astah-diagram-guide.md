# Hướng dẫn vẽ sơ đồ Chương 2 bằng Astah

Tài liệu này mô tả nội dung cần có của các hình trong mục 2.2 "Tổng quan chức năng". Mục tiêu là giúp vẽ lại bằng Astah đúng nghiệp vụ WoodCert Auction, tránh vẽ thừa, vẽ sai actor hoặc mô tả chức năng chưa nằm trong phạm vi hiện tại.

## Nguyên tắc chung khi vẽ

Tất cả sơ đồ nên dùng font dễ đọc và đồng nhất với báo cáo, ưu tiên Times New Roman hoặc Arial nếu Astah không xuất Times New Roman ổn định. Nên xuất ra PDF vector, nền trắng, chữ đen, đường viền rõ, không dùng gradient, bóng đổ hoặc màu quá đậm. Caption không đặt trong hình, vì caption đã được quản lý trong LaTeX. Tên hệ thống trong system boundary ghi thống nhất là `WoodCert Auction`.

Không đưa các chức năng chưa thuộc phạm vi hiện tại vào sơ đồ như notification center, partial refund, tích hợp đơn vị vận chuyển bên thứ ba, video đóng gói giao hàng, escrow ledger độc lập. Vì nội dung Chương 2 là tổng quan chức năng, không nên đưa chi tiết API, endpoint, tên bảng database hoặc tên class/service vào hình, trừ khi chỉ dùng để tham chiếu nội bộ khi vẽ.

Actor nên đặt bên ngoài system boundary. Các external systems như VNPay Sandbox, Cloudinary và SMTP chỉ thể hiện khi có tương tác rõ với use case; không nên vẽ chung như người dùng nghiệp vụ.

Trong LaTeX, mỗi hình phải được nhắc tới trong đoạn văn trước hình bằng dạng `Hình~\ref{...}`. Không đặt hình trôi tự do ở cuối mục nếu đoạn văn chưa giải thích hình đó dùng để làm gì. Khi thay placeholder bằng hình Astah, chỉ thay phần khung `\fbox{...}` bằng `\includegraphics[...]`, giữ nguyên `\caption{...}` và `\label{...}` để không làm sai danh mục hình và tham chiếu.

## Hình 2.1 - Biểu đồ use case tổng quát

### Mục đích

Hình này cần cho thấy biên hệ thống WoodCert Auction và các nhóm chức năng lớn theo actor. Đây là sơ đồ tổng quan, không cần liệt kê mọi use case chi tiết, nhưng phải bao phủ đủ các vùng nghiệp vụ chính: công khai/tra cứu, tài khoản, sản phẩm và kiểm định, đấu giá, ví/thanh toán/đơn hàng, giao nhận, tranh chấp và quản trị.

### Actor cần có

Để sơ đồ tổng quát tối giản và thoáng nhất khi vẽ tay, chúng ta sử dụng các Actor đơn lẻ và gộp các hệ thống ngoài thành một Actor duy nhất:

- `Guest`: người dùng chưa đăng nhập.
- `Bidder/Buyer`: người tham gia đấu giá và mua hàng.
- `Seller`: người dùng có seller profile thực hiện bán hàng.
- `Appraiser`: chuyên gia kiểm định sản phẩm.
- `Admin`: quản trị viên hệ thống.
- `Scheduler/System`: các tiến trình chạy tự động của hệ thống (mở/đóng phiên, hủy đơn quá hạn, tự động hoàn tất giao nhận).
- `External Systems`: gom chung các dịch vụ bên ngoài phục vụ hạ tầng (VNPay Sandbox cho thanh toán, Cloudinary cho lưu trữ media, SMTP server cho gửi email).

### Use case nên có trong system boundary (Tối giản & Cốt lõi)

Không vẽ các hộp Package chữ nhật phức tạp xung quanh, chỉ vẽ trực tiếp **8 use case nghiệp vụ lớn** bên trong biên hệ thống `WoodCert Auction`. Cách vẽ này giúp sơ đồ thoáng mắt, dễ bố cục:

- `Quản lý tài khoản & hồ sơ` (Đăng ký, đăng nhập, thông tin cá nhân và hồ sơ người bán).
- `Quản lý sản phẩm & kiểm định` (Tạo sản phẩm, gửi yêu cầu và chuyên gia thẩm định chất lượng).
- `Tra cứu chứng thư` (Xem thông tin chất lượng sản phẩm công khai).
- `Tổ chức & tham gia đấu giá` (Tạo phiên đấu giá, đăng ký tham gia, phong tỏa cọc và đặt giá).
- `Quản lý ví & thanh toán` (Nạp tiền ví và thực hiện các giao dịch thanh toán).
- `Xử lý đơn hàng & giao nhận` (Tạo đơn hàng sau phiên thắng, giao hàng và xác nhận nhận hàng).
- `Giải quyết tranh chấp` (Mở tranh chấp, gửi tin nhắn/bằng chứng và admin ra phán quyết).
- `Quản trị hệ thống & tự động hóa` (Quản lý danh mục, cấm tài khoản và các tiến trình chạy ngầm).

### Liên kết actor - use case lớn

- `Guest` liên kết với: `Quản lý tài khoản & hồ sơ`, `Tra cứu chứng thư`, `Tổ chức & tham gia đấu giá`.
- `Bidder/Buyer` liên kết với: `Quản lý tài khoản & hồ sơ`, `Tổ chức & tham gia đấu giá`, `Quản lý ví & thanh toán`, `Xử lý đơn hàng & giao nhận`, `Giải quyết tranh chấp`.
- `Seller` liên kết với: `Quản lý tài khoản & hồ sơ`, `Quản lý sản phẩm & kiểm định`, `Tổ chức & tham gia đấu giá`, `Xử lý đơn hàng & giao nhận`, `Giải quyết tranh chấp`.
- `Appraiser` liên kết với: `Quản lý sản phẩm & kiểm định`.
- `Admin` liên kết với: `Quản trị hệ thống & tự động hóa`, `Giải quyết tranh chấp`.
- `Scheduler/System` liên kết với: `Quản trị hệ thống & tự động hóa`, `Xử lý đơn hàng & giao nhận`.
- `External Systems` liên kết với: `Quản lý tài khoản & hồ sơ` (SMTP), `Quản lý ví & thanh toán` (VNPay), `Quản lý sản phẩm & kiểm định` (Cloudinary), `Giải quyết tranh chấp` (Cloudinary).

### Quan hệ include/extend giữa các use case lớn

Chỉ vẽ đúng 4 mối quan hệ logic quan trọng nhất để thể hiện tính khép kín của quy trình và tránh chồng chéo nét vẽ:

- `Quản lý sản phẩm & kiểm định` include `Tra cứu chứng thư` (UC_Catalog ..> UC_Certificate).
- `Tổ chức & tham gia đấu giá` include `Quản lý ví & thanh toán` (với ghi chú: phong tỏa cọc khi đăng ký tham gia).
- `Tổ chức & tham gia đấu giá` extend `Xử lý đơn hàng & giao nhận` (với điều kiện: phiên đấu giá kết thúc thành công).
- `Xử lý đơn hàng & giao nhận` extend `Giải quyết tranh chấp` (với điều kiện: phát sinh sự cố giao nhận / hàng lỗi).

Chỉ dùng `include` khi use case con bắt buộc xảy ra trong use case cha. Nên vẽ:

- `Đăng ký tham gia đấu giá` include `Phong tỏa tiền đặt cọc`.
- `Nạp ví qua VNPay Sandbox` include `Xử lý callback VNPay` nếu muốn thể hiện chi tiết thanh toán.
- `Tự động kết thúc phiên` include `Xác định kết quả phiên`.
- `Xác định kết quả phiên` include `Xử lý tiền cọc sau đấu giá`.
- `Mở tranh chấp` include `Tải bằng chứng tranh chấp` nếu hệ thống yêu cầu bằng chứng khi mở tranh chấp.

Chỉ dùng `extend` cho luồng có điều kiện. Nên vẽ:

- `Mở tranh chấp` extend `Xác nhận nhận hàng` hoặc extend giai đoạn `Giao nhận` với điều kiện `[hàng lỗi / sai mô tả / sự cố giao nhận]`.
- `Xử lý quá hạn thanh toán` extend `Thanh toán phần còn lại` với điều kiện `[quá hạn thanh toán]`.

Không nên làm đầy hình bằng quá nhiều include/extend. Nếu nhiều đường chéo nhau, bỏ bớt quan hệ include/extend và giữ liên kết actor - use case chính.

## Hình 2.2 - Các biểu đồ use case phân rã

### Mục đích

Theo quy định trong hướng dẫn báo cáo, mỗi use case mức cao xuất hiện trong biểu đồ use case tổng quát phải có một mục phân rã riêng từ mục 2.2.2 trở đi. Tên mục phân rã trong LaTeX cần khớp với tên use case mức cao trong Hình 2.1. Vì vậy, không nên vẽ một hình phân rã tổng hợp duy nhất cho tất cả phân hệ; thay vào đó nên vẽ từng biểu đồ phân rã riêng, đặt ngay dưới đoạn giải thích tương ứng.

Ánh xạ nên dùng trong báo cáo hiện tại như sau:

| Use case mức cao trong Hình 2.1 | Mục phân rã trong LaTeX | File hình đề xuất |
| --- | --- | --- |
| `Quản lý tài khoản & hồ sơ` | `Biểu đồ use case phân rã Quản lý tài khoản & hồ sơ` | `account-use-case.pdf` |
| `Quản lý sản phẩm & kiểm định` | `Biểu đồ use case phân rã Quản lý sản phẩm & kiểm định` | `product-use-case.pdf` |
| `Tra cứu chứng thư` | `Biểu đồ use case phân rã Tra cứu chứng thư` | `certificate-use-case.pdf` |
| `Tổ chức & tham gia đấu giá` | `Biểu đồ use case phân rã Tổ chức & tham gia đấu giá` | `auction-use-case.pdf` |
| `Quản lý ví & thanh toán` | `Biểu đồ use case phân rã Quản lý ví & thanh toán` | `wallet-use-case.pdf` |
| `Xử lý đơn hàng & giao nhận` | `Biểu đồ use case phân rã Xử lý đơn hàng & giao nhận` | `order-use-case.pdf` |
| `Giải quyết tranh chấp` | `Biểu đồ use case phân rã Giải quyết tranh chấp` | `dispute-use-case.pdf` |
| `Quản trị hệ thống & tự động hóa` | `Biểu đồ use case phân rã Quản trị hệ thống & tự động hóa` | `admin-use-case.pdf` |

Nếu muốn tách `Fulfillment` thành một hình độc lập, cần sửa lại Hình 2.1 để có use case mức cao riêng tên `Giao nhận & hoàn tất giao dịch` hoặc `Fulfillment`. Nếu Hình 2.1 vẫn đang gộp thành `Xử lý đơn hàng & giao nhận`, thì trong báo cáo nên giữ một mục phân rã đúng tên đó và thể hiện phần giao nhận như một cụm use case bên trong hình.

### Cách thức chung khi vẽ từng biểu đồ phân rã

Mỗi biểu đồ phân rã nên có system boundary `WoodCert Auction`, actor đặt bên ngoài, các use case con đặt trong boundary. Không đưa class, service, controller, endpoint, bảng dữ liệu, Redis key hoặc WebSocket topic vào biểu đồ use case. Nếu cần thể hiện dịch vụ ngoài, chỉ vẽ actor ngoài như `VNPay Sandbox`, `Cloudinary` hoặc `SMTP server` khi actor đó có tương tác trực tiếp với use case trong hình.

Mỗi biểu đồ chỉ nên có khoảng 5 đến 10 use case con. Nếu một hình có quá nhiều đường nối, ưu tiên giữ liên kết actor với use case chính và bỏ bớt quan hệ include/extend phụ. Dùng `include` cho bước bắt buộc luôn xảy ra, dùng `extend` cho luồng có điều kiện. Điều kiện nên ghi bằng guard ngắn như `[sản phẩm hợp lệ]`, `[quá hạn thanh toán]`, `[không có tranh chấp]`.

### Phân rã use case Quản lý tài khoản & hồ sơ

Actor nên có trong hình là `Guest`, `Bidder/Buyer`, `Seller`, `Admin` và `SMTP server`. Các use case con cần thể hiện gồm `Đăng ký tài khoản`, `Xác thực email`, `Đăng nhập`, `Đặt lại mật khẩu`, `Quản lý hồ sơ cá nhân`, `Quản lý địa chỉ nhận hàng` và `Đăng ký hồ sơ người bán`. `Guest` liên kết với đăng ký, đăng nhập và đặt lại mật khẩu; `Bidder/Buyer` liên kết với quản lý hồ sơ, địa chỉ và đăng ký hồ sơ người bán; `Admin` liên kết với quản lý trạng thái hoặc năng lực tài khoản nếu hình còn đủ chỗ. `Đăng ký tài khoản` nên include `Xác thực email`; `Đặt lại mật khẩu` nên include bước gửi email qua `SMTP server`.

### Phân rã use case Quản lý sản phẩm & kiểm định

Actor nên có trong hình là `Seller`, `Appraiser`, `Scheduler/System` và `Cloudinary`. Các use case con gồm `Tạo sản phẩm nháp`, `Cập nhật thông tin sản phẩm`, `Quản lý ảnh sản phẩm`, `Gửi yêu cầu kiểm định`, `Tiếp nhận yêu cầu kiểm định`, `Đánh giá sản phẩm`, `Tải ảnh thẩm định`, `Lập báo cáo thẩm định`, `Chốt kết quả kiểm định` và `Cấp chứng thư sản phẩm`. `Seller` liên kết với nhóm tạo/cập nhật sản phẩm và gửi yêu cầu kiểm định; `Appraiser` liên kết với tiếp nhận, đánh giá, tải ảnh thẩm định, lập báo cáo và chốt kết quả. Không nối `Appraiser` trực tiếp với `Cấp chứng thư sản phẩm`; use case này nên do `Scheduler/System` hoặc hệ thống thực hiện sau khi kết quả thẩm định hợp lệ. Có thể vẽ `Cấp chứng thư sản phẩm` extend `Chốt kết quả kiểm định` với guard `[sản phẩm hợp lệ]`.

### Phân rã use case Tra cứu chứng thư

Actor nên có trong hình là `Guest` và `Bidder/Buyer`. Các use case con gồm `Nhập mã tra cứu chứng thư`, `Xem thông tin chứng thư`, `Xem báo cáo thẩm định`, `Xem thông tin sản phẩm được chứng nhận` và `Kiểm tra tính toàn vẹn chứng thư`. Nếu báo cáo muốn nhấn mạnh tính toàn vẹn dữ liệu, vẽ `Xem thông tin chứng thư` include `Kiểm tra tính toàn vẹn chứng thư`; không cần vẽ thuật toán hash như một thành phần kỹ thuật riêng nếu hình bị rối.

### Phân rã use case Tổ chức & tham gia đấu giá

Actor nên có trong hình là `Guest`, `Bidder/Buyer`, `Seller` và `Scheduler/System`. Các use case con gồm `Xem danh sách phiên đấu giá`, `Xem chi tiết phiên đấu giá`, `Tạo phiên đấu giá`, `Đăng ký tham gia phiên`, `Kiểm tra điều kiện tham gia`, `Phong tỏa tiền đặt cọc`, `Đặt giá realtime`, `Kiểm tra bước giá và trạng thái phiên`, `Ghi nhận lịch sử đặt giá`, `Cập nhật giá hiện tại realtime`, `Tự động mở phiên`, `Tự động kết thúc phiên`, `Xác định người thắng` và `Xử lý kết quả phiên`. `Đăng ký tham gia phiên` include `Kiểm tra điều kiện tham gia` và `Phong tỏa tiền đặt cọc`; `Đặt giá realtime` include kiểm tra bước giá, ghi lịch sử và cập nhật giá; `Tự động kết thúc phiên` include `Xác định người thắng`.

### Phân rã use case Quản lý ví & thanh toán

Actor nên có trong hình là `Bidder/Buyer`, `Admin`, `Scheduler/System` và `VNPay Sandbox`. Các use case con gồm `Xem số dư ví`, `Nạp ví`, `Xử lý callback VNPay`, `Ghi nhận giao dịch ví`, `Phong tỏa tiền đặt cọc`, `Hoàn tiền cọc cho người thua`, `Giữ tiền cọc của người thắng`, `Thanh toán phần còn lại`, `Xử lý quá hạn thanh toán` và `Xem doanh thu nền tảng`. Không mô tả ví nội bộ như một escrow ledger độc lập. `Nạp ví` include `Xử lý callback VNPay` và `Ghi nhận giao dịch ví`; `Thanh toán phần còn lại` include `Ghi nhận giao dịch ví`; `Xử lý quá hạn thanh toán` là luồng có điều kiện sau khi người thắng không thanh toán đúng hạn.

### Phân rã use case Xử lý đơn hàng & giao nhận

Actor nên có trong hình là `Bidder/Buyer`, `Seller` và `Scheduler/System`. Các use case con gồm `Tạo đơn hàng sau đấu giá`, `Theo dõi đơn hàng`, `Cập nhật thông tin giao hàng`, `Theo dõi trạng thái giao hàng`, `Xác nhận nhận hàng`, `Tự hoàn tất giao nhận`, `Hoàn tất giao dịch` và `Giải ngân cho Seller`. `Seller` liên kết với cập nhật thông tin giao hàng; `Bidder/Buyer` liên kết với theo dõi đơn hàng, theo dõi giao hàng và xác nhận nhận hàng; `Scheduler/System` liên kết với tạo đơn hàng sau đấu giá và tự hoàn tất giao nhận. `Xác nhận nhận hàng` include `Hoàn tất giao dịch` với guard `[không có tranh chấp]`; `Tự hoàn tất giao nhận` include `Hoàn tất giao dịch` với guard `[quá thời hạn xác nhận và không có tranh chấp]`; `Hoàn tất giao dịch` include `Giải ngân cho Seller`.

### Phân rã use case Giải quyết tranh chấp

Actor nên có trong hình là `Bidder/Buyer`, `Seller`, `Admin` và `Cloudinary`. Các use case con gồm `Mở tranh chấp`, `Tải bằng chứng tranh chấp`, `Xem hồ sơ tranh chấp`, `Gửi tin nhắn tranh chấp`, `Phản hồi tranh chấp`, `Xem danh sách tranh chấp`, `Xem chi tiết tranh chấp`, `Ra quyết định xử lý tranh chấp`, `Hoàn trả toàn bộ cho Buyer`, `Giải ngân toàn bộ cho Seller` và `Đóng tranh chấp`. `Mở tranh chấp` include `Tải bằng chứng tranh chấp`; `Ra quyết định xử lý tranh chấp` include `Xem chi tiết tranh chấp`. Hai kết quả xử lý hiện tại là hoàn trả toàn bộ hoặc giải ngân toàn bộ; không vẽ `Hoàn tiền một phần`.

### Phân rã use case Quản trị hệ thống & tự động hóa

Actor nên có trong hình là `Admin` và `Scheduler/System`. Các use case con gồm `Quản lý người dùng`, `Quản lý năng lực tài khoản`, `Quản lý chuyên gia kiểm định`, `Quản lý danh mục`, `Xem audit log`, `Xem doanh thu nền tảng`, `Theo dõi tranh chấp` và `Thực hiện tác vụ tự động định kỳ`. Nếu biểu đồ đã có nhiều đường nối, chỉ giữ các use case quản trị chính và đặt một note ngắn cho nhóm tác vụ tự động. Không đưa chi tiết dọn dẹp media, cron expression hoặc tên job kỹ thuật vào hình nếu không cần thiết.

## Hình 2.3 - Sơ đồ quy trình nghiệp vụ tổng quát

### Mục đích

Hình này nên là activity diagram hoặc business process diagram thể hiện luồng xuyên suốt từ sản phẩm đến tranh chấp. Nên dùng swimlane để người đọc thấy trách nhiệm của từng actor. Các lane đề xuất: `Seller`, `Appraiser`, `WoodCert Auction`, `Scheduler/System`, `Bidder/Buyer`, `Admin`, `External systems`. Nếu muốn gọn hơn, có thể gộp `WoodCert Auction` và `Scheduler/System`, nhưng vẫn nên giữ các hành động tự động bằng màu/ký hiệu riêng.

### Trình tự chính cần vẽ

Bắt đầu tại `Seller tạo sản phẩm nháp`. Sau đó `Seller bổ sung thông tin và ảnh sản phẩm`; nếu có thể hiện external system, thêm hành động `Cloudinary lưu ảnh sản phẩm`. Tiếp theo `Seller gửi yêu cầu kiểm định`.

Lane Appraiser bắt đầu với `Appraiser tiếp nhận yêu cầu kiểm định`, sau đó `Đánh giá sản phẩm`, `Lập báo cáo thẩm định` và đến nút quyết định `Sản phẩm hợp lệ?`. Nếu không hợp lệ, luồng quay về `Seller cập nhật thông tin sản phẩm` hoặc kết thúc tại `Sản phẩm không đủ điều kiện đấu giá`. Nếu hợp lệ, hệ thống thực hiện `Cấp chứng thư sản phẩm`.

Sau khi có chứng thư, `Seller tạo phiên đấu giá`. Hệ thống ghi nhận phiên ở trạng thái chờ mở. `Scheduler/System tự động mở phiên khi đến thời gian bắt đầu`. Trong thời gian phiên đang hoạt động, `Bidder/Buyer xem phiên`, `Đăng ký tham gia`, hệ thống `Kiểm tra ví` và đến nút quyết định `Đủ số dư đặt cọc?`. Nếu không đủ, người mua thực hiện `Nạp ví qua VNPay Sandbox`, hệ thống nhận `VNPay callback` và cập nhật ví. Nếu đủ, hệ thống `Phong tỏa tiền đặt cọc`.

Sau khi đăng ký thành công, `Bidder/Buyer đặt giá realtime`. Hệ thống `Kiểm tra bước giá và trạng thái phiên`, `Ghi nhận lịch sử đặt giá` và `Phát cập nhật realtime`. Đặt một vòng lặp cho đến khi hết thời gian phiên. Khi hết thời gian, `Scheduler/System tự động kết thúc phiên`, hệ thống `Xác định kết quả phiên`.

Sau nút quyết định `Có người thắng?`, nếu không có người thắng thì hệ thống `Đóng phiên không thành công` và `Hoàn tiền cọc nếu có`, sau đó kết thúc. Nếu có người thắng, hệ thống `Hoàn tiền cọc cho người thua`, `Giữ tiền cọc của người thắng` và `Tạo đơn hàng sau đấu giá`.

Giai đoạn đơn hàng bắt đầu với `Bidder/Buyer thanh toán phần còn lại`. Đặt nút quyết định `Thanh toán đúng hạn?`. Nếu không, `Order payment scheduler xử lý quá hạn thanh toán` và hệ thống `Xử lý tiền cọc theo chính sách hệ thống`, sau đó kết thúc giao dịch không thành công. Nếu có, `Seller cập nhật thông tin giao hàng`, sau đó `Bidder/Buyer xác nhận nhận hàng`.

Sau giao nhận, đặt nút quyết định `Phát sinh tranh chấp?`. Nếu không, hệ thống `Hoàn tất giao dịch` và `Giải ngân cho Seller`, sau đó kết thúc. Nếu người mua không xác nhận nhưng hết thời hạn và không có tranh chấp, `Fulfillment scheduler tự hoàn tất giao nhận`, sau đó `Giải ngân cho Seller`.

Nếu có tranh chấp, `Bidder/Buyer mở tranh chấp`, `Tải bằng chứng tranh chấp` và nếu cần thể hiện external system thì `Cloudinary lưu bằng chứng`. `Seller phản hồi tranh chấp`, `Admin xem xét hồ sơ tranh chấp`, sau đó đến nút quyết định `Kết quả xử lý tranh chấp`. Hai kết quả hiện tại là `Hoàn trả toàn bộ cho Buyer` hoặc `Giải ngân toàn bộ cho Seller`. Cuối cùng `Đóng tranh chấp` và kết thúc.

### Điều kiện và ghi chú nên đặt trên sơ đồ

Nên đặt guard rõ ràng trên các nhánh quyết định: `[hợp lệ]`, `[không hợp lệ]`, `[đủ số dư]`, `[không đủ số dư]`, `[có người thắng]`, `[không có người thắng]`, `[thanh toán đúng hạn]`, `[quá hạn]`, `[có tranh chấp]`, `[không có tranh chấp]`, `[hoàn trả buyer]`, `[giải ngân seller]`.

Không vẽ chi tiết nội bộ Redis, MySQL, Lua script, optimistic locking hoặc WebSocket topic trong activity diagram Chương 2. Những chi tiết đó nếu cần sẽ phù hợp hơn với chương thiết kế/kỹ thuật.

## Kiểm tra trước khi xuất hình

Trước khi xuất PDF, cần tự kiểm tra các điểm sau: tất cả hình có system boundary rõ ràng nếu là use case; actor đúng tên như trong báo cáo; không có partial refund, notification center, third-party shipping hoặc packing video; không có code/API/table database làm hình bị rối; các đường include/extend không cắt nhau quá nhiều; font tiếng Việt hiện đúng dấu; khi thu nhỏ về kích thước A4 vẫn đọc được chữ.

Sau khi xuất từ Astah, nên đặt file vào `thesis/figures/chapter-2/` với đúng tên đã ghi trong bảng ánh xạ. Khi chèn vào LaTeX, thay placeholder trong figure tương ứng bằng lệnh dạng `\includegraphics[width=0.9\linewidth]{chapter-2/account-use-case.pdf}`; đường dẫn có thể đổi theo tên file thực tế, nhưng nên giữ nguyên caption và label hiện có trong `2_Khao_sat.tex`.
