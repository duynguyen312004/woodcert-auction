## Tổng quan chức năng

Từ các vấn đề đã rút ra ở phần khảo sát hiện trạng, WoodCert Auction được xác định như một hệ thống hỗ trợ giao dịch sản phẩm gỗ mỹ nghệ theo chuỗi nghiệp vụ khép kín: tạo sản phẩm, kiểm định, cấp chứng thư, tổ chức đấu giá, xử lý thanh toán, giao nhận và tranh chấp sau giao dịch. Ở mức tổng quan, hệ thống được tổ chức quanh các vai trò người dùng và các nhóm nghiệp vụ chính, qua đó làm rõ phạm vi chức năng trước khi đi vào yêu cầu chức năng và đặc tả use case chi tiết.

### Actor và vai trò người dùng

Các actor của WoodCert Auction bao gồm nhóm người dùng trực tiếp, các tiến trình hệ thống tự động và một số hệ thống bên ngoài phục vụ media, thanh toán thử nghiệm và email định danh. Khách truy cập có thể xem thông tin công khai và tra cứu chứng thư. Người tham gia đấu giá, đồng thời là người mua trong các giao dịch thành công, sử dụng các chức năng liên quan đến hồ sơ, ví, đăng ký phiên, đặt giá, thanh toán, nhận hàng và tranh chấp. Người bán không phải là một loại tài khoản tách biệt hoàn toàn; đây là người dùng có thêm năng lực bán hàng thông qua seller profile, từ đó có thể tạo sản phẩm, gửi kiểm định, mở phiên đấu giá và xử lý giao hàng.

Chuyên gia kiểm định nhận hàng vật lý được gửi tới, kiểm tra trực tiếp, chụp ảnh tại hiện trường và lập báo cáo. Ảnh chứng minh có thể được tải lên hệ thống nhưng không bắt buộc. Quản trị viên chịu trách nhiệm quản lý người dùng, năng lực tài khoản, kiểm định viên, danh mục, doanh thu, audit log và tranh chấp.

Bảng actor và chức năng chính

| Actor | Vai trò trong hệ thống | Nhóm chức năng chính |
|---|---|---|
| Khách truy cập (Guest) | Người dùng chưa đăng nhập, tiếp cận các thông tin công khai của hệ thống. | Xem danh sách và chi tiết phiên đấu giá công khai; tra cứu chứng thư sản phẩm; xem thông tin giới thiệu và hướng dẫn sử dụng. |
| Người tham gia đấu giá / Người mua (Bidder/Buyer) | Tài khoản người dùng tham gia đấu giá và trở thành người mua khi thắng phiên. | Quản lý hồ sơ, ví và địa chỉ; đăng ký tham gia đấu giá; đặt giá theo thời gian thực; thanh toán đơn hàng; xác nhận nhận hàng; mở tranh chấp khi phát sinh vấn đề. |
| Người bán (Seller) | Người dùng có seller profile và năng lực bán hàng, không phải loại tài khoản độc lập với người mua. | Tạo và quản lý sản phẩm; quản lý ảnh sản phẩm; gửi yêu cầu kiểm định; tạo phiên đấu giá; theo dõi đơn bán; cập nhật thông tin giao hàng. |
| Chuyên gia kiểm định (Appraiser) | Người dùng được cấp quyền để xử lý nghiệp vụ kiểm định sản phẩm. | Nhận claim; kiểm tra trực tiếp hàng hóa; lập báo cáo; tùy chọn tải ảnh chứng minh; chốt kết quả đạt hoặc không đạt. |
| Quản trị viên (Admin) | Người vận hành hệ thống và xử lý các nghiệp vụ quản trị. | Quản lý người dùng, năng lực tài khoản, appraiser, danh mục, doanh thu, audit log và tranh chấp. |
| Scheduler/System | Các tiến trình tự động hỗ trợ vận hành nghiệp vụ theo thời gian và trạng thái. | Tự động mở hoặc kết thúc phiên đấu giá; xử lý quá hạn thanh toán; tự hoàn tất giao nhận theo điều kiện cấu hình. |
| Hệ thống bên ngoài (External systems) | Các dịch vụ tích hợp phục vụ một số chức năng hạ tầng và nghiệp vụ. | VNPay Sandbox cho nạp ví; Cloudinary cho lưu trữ media; SMTP cho email định danh và đặt lại mật khẩu. |

### Nhóm chức năng chính

Các chức năng của WoodCert Auction được chia theo các nhóm nghiệp vụ lớn thay vì theo chi tiết triển khai kỹ thuật. Cách phân nhóm này giúp liên kết rõ giữa actor, mục đích sử dụng và phạm vi xử lý của hệ thống. Những nhóm chức năng dưới đây cũng là cơ sở để xác định yêu cầu chức năng chi tiết và các use case quan trọng ở các phần sau.

Bảng nhóm chức năng chính của hệ thống

| Nhóm chức năng | Actor liên quan | Mục đích nghiệp vụ |
|---|---|---|
| Quản lý tài khoản và phân quyền | Guest, Bidder/Buyer, Seller, Appraiser, Admin | Hỗ trợ đăng ký, xác thực, đăng nhập, quản lý hồ sơ, địa chỉ, vai trò và năng lực tài khoản. Nhóm này bảo đảm mỗi actor chỉ thao tác trong phạm vi quyền phù hợp, đồng thời cho phép quản trị viên khóa tài khoản hoặc khóa từng năng lực nghiệp vụ khi cần. |
| Quản lý sản phẩm gỗ | Seller, Appraiser, Admin | Cho phép người bán tạo bản nháp sản phẩm, cập nhật thông tin mô tả, danh mục và hình ảnh trước khi gửi kiểm định. Sản phẩm chỉ được đưa sang các nghiệp vụ tiếp theo khi đáp ứng trạng thái và điều kiện phù hợp. |
| Thẩm định và hồ sơ chứng nhận | Seller, Appraiser, Guest, Bidder/Buyer | Quản lý yêu cầu, claim, báo cáo, mã hồ sơ và SHA-256. Mọi báo cáo có mã để truy vết; chỉ sản phẩm đạt mới đủ điều kiện đấu giá. |
| Quản lý media/hình ảnh | Seller, Appraiser, Bidder/Buyer, Admin | Lưu trữ và quản lý ảnh theo đúng ngữ cảnh sử dụng, gồm ảnh sản phẩm, ảnh kiểm định, ảnh đại diện và bằng chứng tranh chấp. Việc tách ngữ cảnh media giúp hệ thống dùng hình ảnh như một phần của hồ sơ nghiệp vụ thay vì chỉ là dữ liệu minh họa. |
| Quản lý phiên đấu giá | Seller, Guest, Bidder/Buyer, Scheduler/System | Hỗ trợ tạo phiên từ sản phẩm đủ điều kiện, công bố thông tin phiên, quản lý trạng thái chờ mở, đang diễn ra và kết thúc. Nhóm này bảo đảm mỗi phiên có thông tin giá, thời gian, bước giá và điều kiện tham gia rõ ràng. |
| Đăng ký tham gia và đặt giá realtime | Bidder/Buyer, Seller, Scheduler/System | Cho phép người mua đăng ký tham gia, phong tỏa tiền đặt cọc trong ví nội bộ và đặt giá khi phiên đang hoạt động. Giá đấu được cập nhật theo thời gian thực để bảo đảm trải nghiệm cạnh tranh và khả năng theo dõi phiên. |
| Ví nội bộ và thanh toán | Bidder/Buyer, Seller, Admin, External systems | Quản lý số dư khả dụng, số dư đóng băng, nạp ví qua VNPay Sandbox, phí, tiền cọc, thanh toán đơn hàng và ghi nhận doanh thu nền tảng. Ví nội bộ được dùng để kiểm soát dòng tiền trong hệ thống, không được trình bày như một sổ cái escrow độc lập. |
| Đơn hàng sau đấu giá | Bidder/Buyer, Seller, Scheduler/System | Sau khi phiên đấu giá kết thúc thành công, hệ thống tạo đơn hàng cho người thắng và theo dõi nghĩa vụ thanh toán phần còn lại. Nhóm chức năng này kết nối kết quả đấu giá với quá trình thực hiện giao dịch thực tế. |
| Giao nhận/hoàn tất giao dịch | Seller, Bidder/Buyer, Scheduler/System | Hỗ trợ người bán cập nhật giao hàng, người mua xác nhận nhận hàng và hệ thống tự hoàn tất giao dịch theo điều kiện cấu hình khi không có tranh chấp. Khi giao dịch hoàn tất, hệ thống xử lý giải ngân cho người bán theo logic tài chính tương ứng. |
| Tranh chấp | Bidder/Buyer, Seller, Admin | Cho phép mở hồ sơ tranh chấp khi phát sinh lỗi sau giao nhận, tải bằng chứng hình ảnh, trao đổi trong hồ sơ tranh chấp và chờ quyết định xử lý của quản trị viên. Phạm vi hiện tại tập trung vào quyết định xử lý toàn phần, chưa bao gồm hoàn tiền một phần. |
| Quản trị hệ thống | Admin | Cung cấp các chức năng quản lý người dùng, appraiser, danh mục, doanh thu, audit log và tranh chấp. Đây là nhóm chức năng hỗ trợ vận hành và kiểm soát rủi ro trong toàn bộ quy trình. |

### Biểu đồ use case tổng quát

Biểu đồ use case tổng quát thể hiện biên WoodCert Auction và các nhóm chức năng chính theo từng actor. Phần kiểm định vật lý nằm ngoài biên phần mềm; bên trong hệ thống, Appraiser nhận claim, lập báo cáo và tùy chọn gắn ảnh chứng minh.

[HÌNH DỰ KIẾN: Biểu đồ use case tổng quát của WoodCert Auction]

### Quy trình nghiệp vụ tổng quát

Quy trình bắt đầu khi Seller tạo sản phẩm, thanh toán phí kiểm định và gửi hàng vật lý. Appraiser kiểm tra trực tiếp, lập báo cáo; hệ thống tạo mã hồ sơ và SHA-256. Chỉ sản phẩm đạt được chuyển sang `APPRAISED` để tạo phiên đấu giá.

Sau khi sản phẩm đủ điều kiện, Seller tạo phiên đấu giá với các thông tin về thời gian, giá khởi điểm, bước giá và tiền đặt cọc. Bidder đăng ký tham gia phiên; hệ thống kiểm tra ví và phong tỏa tiền đặt cọc trước khi cho phép đặt giá. Khi phiên chuyển sang trạng thái đang diễn ra, Bidder đặt giá theo thời gian thực và hệ thống cập nhật giá hiện tại cho các bên theo dõi. Đến thời điểm kết thúc, hệ thống tự động xác định kết quả phiên, xử lý tiền cọc theo kết quả thắng hoặc thua và tạo đơn hàng cho người thắng nếu phiên thành công.

Ở giai đoạn sau đấu giá, người thắng thanh toán phần còn lại của đơn hàng, Seller cập nhật thông tin giao hàng và Buyer xác nhận nhận hàng. Khi giao dịch hoàn tất theo điều kiện hợp lệ, hệ thống thực hiện các bước tài chính cần thiết để giải ngân cho người bán. Nếu hàng hóa có lỗi, sai mô tả hoặc phát sinh sự cố trong giao nhận, Buyer có thể mở tranh chấp kèm bằng chứng để Admin xem xét và xử lý.

[HÌNH DỰ KIẾN: Quy trình nghiệp vụ tổng quát từ sản phẩm đến tranh chấp]

### Phạm vi chức năng chưa bao gồm

Để giữ phạm vi đồ án rõ ràng, một số chức năng được xác định là chức năng mở rộng trong tương lai thay vì chức năng cốt lõi hiện tại. Hệ thống chưa bao gồm trung tâm thông báo lưu bền cho người thắng hoặc người thua phiên đấu giá; các phản hồi tức thời trên giao diện và thông báo phục vụ định danh không được xem là notification center. Cơ chế hoàn tiền một phần trong tranh chấp, tích hợp đơn vị vận chuyển bên thứ ba và video đóng gói giao hàng cũng chưa thuộc luồng nghiệp vụ chính hiện tại. Các nội dung này có thể được xem xét ở giai đoạn mở rộng sau khi các luồng cốt lõi về kiểm định, đấu giá, thanh toán, giao nhận và tranh chấp đã ổn định.
