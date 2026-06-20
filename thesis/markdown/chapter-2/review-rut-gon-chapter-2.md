# Rà soát Chương 2

Ngày rà soát: 20/06/2026.

Phạm vi:

- `thesis/Chuong/2_Khao_sat.tex`;
- kế hoạch viết và kế hoạch hình/bảng của Đồ án;
- mã nguồn, cấu hình, migration và kiểm thử liên quan đến định danh, sản phẩm, thẩm định, chứng thư, đấu giá, tài chính, đơn hàng, giao nhận và tranh chấp;
- tài liệu chính thức của eBay, Catawiki và Lạc Việt Auction;
- danh sách 11 hình đang được Chương 2 sử dụng.

Đây là bản nhận xét làm căn cứ chỉnh sửa. Phần chữ Chương 2 đã được cập nhật trực tiếp ngày 20/06/2026; nội dung các hình chưa được chỉnh sửa và sẽ được rà soát riêng với người dùng.

## Trạng thái xử lý

- Chương 2 đã được rút còn khoảng 4.000 từ, 3 hình và 6 ca sử dụng chính; bản biên dịch độc lập hiện có 9 trang, dự kiến khoảng 10 trang khi đặt dưới tiêu đề chương trong báo cáo đầy đủ.
- Đã bổ sung hai bảng yêu cầu chức năng có mã `FR`.
- Đã chuyển ca sử dụng “Thẩm định và lập báo cáo” sang `thesis/Chuong/Phu_luc_B.tex`.
- Đã bỏ các ngưỡng p95, 50/100 người dùng đồng thời và 99% khả dụng do không phải yêu cầu chính thức.
- Đã ghi rõ Đồ án không thực hiện phỏng vấn hoặc khảo sát người dùng riêng.
- Đã xác định việc gửi và kiểm tra hiện vật là quy trình bắt buộc ngoài phần mềm.
- Đã chuẩn hóa thuật ngữ với Chương 3, 5 và 6.
- Chưa chuyển các sơ đồ phân rã sang Phụ lục B vì cần rà soát từng hình trước.

## Hiện trạng trước khi chỉnh sửa

Trước khi chỉnh sửa, Chương 2 có khoảng 7.600 từ, 22 tiểu mục, 11 hình, 13 bảng và 7 ca sử dụng được đặc tả chi tiết. Bản biên dịch độc lập khi đó tạo thành 25 trang A4, trong khi kế hoạch đã duyệt dự kiến khoảng 9--11 trang.

Nội dung cũ bao phủ khá đầy đủ chuỗi nghiệp vụ của WoodCert Auction và phần lớn bám sát codebase. Các vấn đề sau đã được dùng làm căn cứ cho bản sửa:

1. Chương thiếu một mục yêu cầu chức năng được mã hóa theo dạng `FR`, dù đây là nội dung đã được kế hoạch viết yêu cầu.
2. Số lượng ca sử dụng chi tiết đang là 7 thay vì 6 ca đã chốt; ca “Thẩm định và lập báo cáo” cần chuyển sang Phụ lục B.
3. Các ca sử dụng đang chứa quá nhiều chi tiết triển khai như Redis, Lua, MySQL, `trace ID`, thứ tự phát sự kiện và cơ chế ghi cố gắng; đây là nội dung của Chương 4--5, không phải mức mô tả nghiệp vụ của Chương 2.
4. Một số câu đang mô tả quá mức khả năng của mã SHA-256 và chức năng tra cứu chứng thư.
5. Hạn 72 giờ sau thanh toán đang bị gọi là “hạn giao hàng”, trong khi code quy định đây là hạn Người bán xác nhận đã gửi hoặc bàn giao hàng.
6. Phần khảo sát Catawiki đang có nguy cơ làm người đọc hiểu rằng mọi sản phẩm được kiểm tra vật lý như quy trình của WoodCert Auction.
7. Các chỉ tiêu p95, 50 người đặt giá, 100 người theo dõi và 99% khả dụng chưa có căn cứ cho thấy đây là yêu cầu đã được bên liên quan phê duyệt.
8. Chương đang có 8 sơ đồ use case phân rã, vượt xa kế hoạch 1--2 sơ đồ và là nguyên nhân lớn làm báo cáo dài.

Kết quả thực hiện đã rút khoảng 48% số từ và giảm từ 11 xuống 3 hình. Bản độc lập hiện có 9 trang; khi đặt dưới tiêu đề chương của báo cáo đầy đủ dự kiến khoảng 10 trang.

## Đánh giá bản cũ theo template và kế hoạch viết

### Những điểm đang đáp ứng

- Có khảo sát ba nền tảng đã chốt: eBay Auction, Catawiki và Lạc Việt Auction.
- Các nhận định về hệ thống bên ngoài đều có khóa trích dẫn.
- Có bảng so sánh hệ thống tương tự và bảng chuyển từ vấn đề khảo sát sang nhu cầu của WoodCert Auction.
- Có mô tả actor, phạm vi chức năng, use case tổng quát, quy trình nghiệp vụ và yêu cầu phi chức năng.
- Số lượng 7 ca sử dụng vẫn nằm trong khoảng 4--7 ca mà template cho phép.
- Mỗi ca sử dụng đã có actor, tiền điều kiện, hậu điều kiện, luồng chính và luồng thay thế.
- Nội dung phân biệt khá rõ chức năng đã triển khai với các hướng mở rộng như trung tâm thông báo lưu bền, hoàn tiền một phần và tích hợp đơn vị vận chuyển.

### Những điểm chưa đáp ứng hoặc chưa thống nhất với kế hoạch đã duyệt

#### Thiếu mục yêu cầu chức năng

Kế hoạch viết yêu cầu một section riêng liệt kê yêu cầu theo mã, actor và phân hệ. Chương hiện chỉ có bảng “Nhóm chức năng chính”, nên chưa phân biệt rõ:

- nhóm nghiệp vụ tổng quan;
- yêu cầu chức năng có thể kiểm tra;
- ca sử dụng đại diện.

Nên thay bảng nhóm chức năng dài bằng một bảng yêu cầu chức năng gọn, có các cột:

| Cột | Nội dung |
|---|---|
| Mã | `FR-ACC`, `FR-CAT`, `FR-AUC`, `FR-FIN`, `FR-ORD`, `FR-DSP`... |
| Yêu cầu | Một hành vi nghiệp vụ có thể kiểm tra |
| Actor | Vai trò khởi tạo hoặc sử dụng chức năng |
| Phân hệ | Module chịu trách nhiệm chính |

Không cần biến từng endpoint thành một yêu cầu. Khoảng 12--16 yêu cầu cấp nghiệp vụ là đủ.

#### Số ca sử dụng không đúng quyết định đã chốt

Kế hoạch đã chốt sáu ca sử dụng:

1. Gửi yêu cầu thẩm định.
2. Tạo phiên đấu giá.
3. Đăng ký tham gia đấu giá.
4. Đặt giá theo thời gian thực.
5. Thanh toán đơn hàng.
6. Mở tranh chấp.

Ca “Thẩm định và lập báo cáo” hiện là UC-02 nên chuyển sang Phụ lục B. Nội dung này vẫn quan trọng, nhưng không cần chiếm thêm một bảng dài trong Chương 2.

#### Số sơ đồ phân rã vượt kế hoạch

Kế hoạch chỉ dự kiến 1--2 sơ đồ use case phân rã. Chương hiện có 8 sơ đồ phân rã:

- tài khoản;
- chứng thư;
- sản phẩm và thẩm định;
- đấu giá;
- ví và thanh toán;
- đơn hàng và giao nhận;
- tranh chấp;
- quản trị và tự động hóa.

Việc mỗi nhóm nghiệp vụ có một hình riêng làm phần “Tổng quan chức năng” kéo dài từ khoảng trang 4 đến trang 16. Đây là mức chi tiết phù hợp với phụ lục hơn là nội dung chính.

#### Chưa thể hiện khảo sát người dùng hoặc bên liên quan

Kế hoạch phân tích template ghi ba hướng khảo sát gồm người dùng/khách hàng, hệ thống hiện có và ứng dụng tương tự. Chương hiện mới có khảo sát nền tảng tương tự và phân tích phạm vi Đồ án.

Không được tự tạo khảo sát hoặc số liệu phỏng vấn. Nếu không có khảo sát chính thức, nên viết rõ phương pháp xác định yêu cầu dựa trên phạm vi được bên liên quan duyệt, đối chiếu codebase và nghiên cứu hệ thống tương tự. Nếu có biên bản phỏng vấn hoặc phiếu khảo sát thật, có thể tóm tắt rất ngắn và đưa dữ liệu chi tiết vào phụ lục.

## Các điểm độ chính xác đã dùng để chỉnh sửa

### Mã SHA-256 chưa phải cơ chế xác minh lại tính toàn vẹn

Các dòng 11, 13, 40, 69, 155 và một số đoạn khác dùng các cụm như:

- “dấu vân tay toàn vẹn”;
- “kiểm tra toàn vẹn dữ liệu”;
- “cơ chế toàn vẹn dữ liệu riêng”.

`AppraisalServiceImpl` tạo mã SHA-256 từ một nhóm trường cốt lõi khi lưu báo cáo. Tuy nhiên, `CertificateServiceImpl` chỉ truy vấn báo cáo theo mã chứng thư và trả lại dữ liệu đã lưu; không tính lại mã băm để so sánh.

Vì vậy:

- có thể nói Hệ thống “lưu mã băm SHA-256 phục vụ truy vết và đối chiếu”;
- không được nói chức năng tra cứu đang “xác minh” hoặc “kiểm tra lại” tính toàn vẹn;
- không được mô tả đây là chữ ký số, PKI, blockchain hoặc chứng cứ chống sửa đổi độc lập;
- không nên nói mã băm bao phủ toàn bộ báo cáo, vì dữ liệu đầu vào hiện chỉ gồm mã sản phẩm, người thẩm định, vật liệu, giá trị ước tính, kết quả xác thực, mã chứng thư và thời điểm thẩm định.

Đoạn dòng 716 đã mô tả giới hạn này đúng hơn các đoạn trước và nên được dùng làm chuẩn thống nhất.

### “Chứng thư số” dễ gây hiểu nhầm

Hệ thống có mã chứng thư, báo cáo thẩm định, mã băm và trang tra cứu công khai, nhưng không có chữ ký số pháp lý.

Nên ưu tiên:

> chứng thư điện tử

hoặc:

> hồ sơ chứng nhận điện tử

Nếu tiếp tục dùng “chứng thư số”, phải nói rõ ngay lần đầu rằng đây không phải chứng thư số theo hạ tầng khóa công khai.

### Quy trình kiểm tra vật lý chưa được phần mềm quản lý

Các dòng 11, 13, 117, 225, 309 và UC-01/UC-02 mô tả:

- Người bán gửi hàng tới đơn vị thẩm định;
- Thẩm định viên tiếp nhận hàng;
- kiểm tra trực tiếp;
- chụp ảnh tại hiện trường.

Codebase chứng minh các chức năng:

- Người bán gửi sản phẩm trên Hệ thống sang trạng thái `PENDING_APPRAISAL`;
- Thẩm định viên nhận hoặc trả yêu cầu xử lý;
- Thẩm định viên nộp báo cáo và tùy chọn gắn ảnh;
- Hệ thống không quản lý vận đơn gửi hàng tới nơi thẩm định, địa điểm kiểm tra hoặc bước xác nhận đã tiếp nhận hiện vật.

Do đó, nếu đây là quy trình nghiệp vụ đã được chủ dự án xác nhận, cần diễn đạt nhất quán:

> Việc gửi, tiếp nhận và kiểm tra hiện vật là hoạt động nghiệp vụ bên ngoài phần mềm; WoodCert Auction quản lý yêu cầu, quyền xử lý, báo cáo và bằng chứng số.

Không nên trình bày các bước vật lý như chức năng được Hệ thống theo dõi.

### Báo cáo thẩm định chỉ bất biến ở tầng nghiệp vụ hiện hành

`AppraisalReport` không có API cập nhật hoặc xóa và code chủ động chặn tạo báo cáo lần hai. Điều này đủ để nói báo cáo được thiết kế không chỉnh sửa sau khi nộp trong luồng ứng dụng hiện hành.

Tuy nhiên, cơ sở dữ liệu không có một cơ chế mật mã hoặc ràng buộc khiến bản ghi tuyệt đối không thể sửa. Vì vậy, nên viết:

> báo cáo không có luồng cập nhật hoặc xóa sau khi nộp

thay vì khẳng định tuyệt đối:

> báo cáo bất biến

### Điều kiện tạo phiên cần đủ hai trạng thái

UC tạo phiên mô tả đúng rằng sản phẩm phải ở `APPRAISED`, nhưng trong các đoạn tổng quan nên giữ đủ điều kiện:

- trạng thái thẩm định `APPRAISED`;
- trạng thái bán `AVAILABLE`.

Chỉ nêu `APPRAISED` có thể làm người đọc hiểu rằng sản phẩm đang nằm trong một phiên khác vẫn tạo được phiên mới.

### Hạn 72 giờ sau thanh toán đang bị diễn đạt sai

Các dòng 267, 644, 646 và 650 gọi `shipment_deadline` là “hạn giao hàng” và nói Người bán phải giao hàng trước mốc này.

Code hiện yêu cầu Người bán gọi chức năng xác nhận gửi hoặc bàn giao hàng trước thời hạn. Sau khi xác nhận, giao nhận chuyển sang `SHIPPED` và thời hạn tự hoàn tất 168 giờ mới được tính.

Nên dùng thống nhất:

> hạn xác nhận gửi hoặc bàn giao hàng

Khi quá hạn:

- đơn `PAID` bị hủy;
- Người mua được hoàn tiền cọc và phần còn lại;
- fulfillment chuyển `CANCELED`;
- sản phẩm trở về `AVAILABLE`.

Phần hậu quả quá hạn trong Chương 2 nhìn chung đúng, chỉ sai tên và phạm vi của thời hạn.

### Phân bổ cọc khi quá hạn thanh toán nên nói rõ nhưng không cần đi sâu

Khi Người mua không thanh toán trong thời hạn, code phân chia tiền cọc giữa Người bán và nền tảng theo cấu hình. Cấu hình mặc định hiện dành 10% cho nền tảng và phần còn lại cho Người bán.

Chương 2 không nhất thiết phải ghi tỷ lệ cụ thể vì đây là cấu hình có thể thay đổi. Câu phù hợp là:

> tiền cọc được phân bổ cho Người bán và nền tảng theo chính sách tài chính được cấu hình.

### Luồng VNPay không được gộp Return và IPN

Dòng 253 viết “sau khi nhận và xác minh Return/IPN”.

Code có cả endpoint Return và endpoint IPN, nhưng đây là hai luồng khác nhau:

- Return là chuyển hướng trình duyệt Người dùng;
- IPN là yêu cầu máy chủ tới máy chủ.

Trong trạng thái vận hành hiện được chủ dự án xác nhận, VNPay Sandbox đang xác nhận giao dịch qua Return; IPN không phải callback merchant đang được sử dụng trong production. Vì vậy, Chương 2 chỉ cần mô tả:

> Người dùng nạp ví qua VNPay Sandbox; Hệ thống kiểm tra phản hồi Return và ghi nhận giao dịch theo cấu hình hiện hành.

Endpoint IPN tồn tại trong code có thể được nhắc ở Chương 4 hoặc tài liệu kỹ thuật, nhưng không nên trình bày như một luồng vận hành song song đã được sử dụng.

### Ghi lượt đặt giá bị từ chối không được bảo đảm tuyệt đối

UC đặt giá viết rằng lượt đặt giá hết hạn hoặc quá thấp “được lưu” là bản ghi bị từ chối.

`BidPersistenceService` bắt lỗi và ghi log thay vì làm yêu cầu thất bại. Vì vậy, phải dùng:

> Hệ thống cố gắng lưu các lượt đặt giá bị từ chối do hết hạn hoặc không đủ mức giá để phục vụ truy vết.

Các trường hợp chưa đăng ký hoặc người dùng đang dẫn đầu bị từ chối ngay và không tạo bản ghi lượt đặt giá.

### Phạm vi video đóng gói cần diễn đạt chính xác

Code đã có loại tệp `SHIPMENT_PACKING_VIDEO` và giới hạn dung lượng, nhưng chưa có luồng giao nhận hoàn chỉnh để Người bán tải và gắn video với đơn hàng.

Nên viết:

> video đóng gói chưa được tích hợp vào luồng giao nhận hiện hành

thay vì khẳng định toàn Hệ thống không có bất kỳ hỗ trợ kỹ thuật nào.

### Tích hợp vận chuyển và phương thức giao hàng là hai khái niệm khác nhau

Hệ thống cho phép Người bán ghi nhận giao hàng qua đơn vị bên thứ ba bằng tên đơn vị và mã theo dõi, nhưng chưa tích hợp API của nhà vận chuyển.

Vì vậy, nội dung deferred nên là:

> chưa tích hợp trực tiếp API của đơn vị vận chuyển

không phải:

> chưa hỗ trợ giao hàng qua bên thứ ba

## Rà soát nội dung khảo sát hệ thống tương tự

### eBay Auction

Các nhận định chính xác:

- hỗ trợ hình thức đăng bán kiểu đấu giá;
- người trả giá cao nhất khi phiên kết thúc có nghĩa vụ mua hàng;
- có đặt giá tự động;
- Money Back Guarantee xử lý các trường hợp như không nhận được hàng, hàng lỗi hoặc không đúng mô tả;
- Authenticity Guarantee có kiểm tra vật lý trước khi chuyển hàng cho Người mua.

Điểm cần giữ rõ: Authenticity Guarantee chỉ áp dụng cho các nhóm hàng và giao dịch đủ điều kiện, không phải cơ chế xác thực chung cho mọi sản phẩm.

### Catawiki

Tài liệu chính thức mô tả chuyên gia nội bộ đánh giá, tuyển chọn và hướng dẫn cách trình bày đối tượng trước khi đưa vào đấu giá. Trang dành cho Người mua dùng cách diễn đạt “review and appraise every object”, nhưng tài liệu chi tiết về vai trò chuyên gia tập trung vào đánh giá hồ sơ, đặc điểm sản phẩm, ảnh và thông tin đăng bán.

Do đó, nên dùng:

> đánh giá và tuyển chọn bởi chuyên gia

hoặc:

> kiểm duyệt chất lượng hồ sơ đối tượng đấu giá

Không nên suy rộng thành quy trình tiếp nhận và kiểm tra vật lý tương đương WoodCert Auction nếu nguồn không nói rõ.

Các nhận định về phí bảo vệ Người mua, thanh toán an toàn, giữ tiền tới sau khi hàng đến và hỗ trợ khi có vấn đề đều có căn cứ.

### Lạc Việt Auction

Tài liệu hướng dẫn và nội dung công khai có căn cứ cho:

- đăng ký và xác thực tài khoản;
- xem cuộc đấu giá;
- tham gia trả giá với tài sản đã đăng ký;
- bước giá;
- quy định, tiền đặt trước và điều kiện của từng cuộc đấu giá.

Nên tránh viết rằng toàn bộ mọi cuộc đấu giá đều có cùng một cấu hình phí hoặc quy trình chi tiết. Cách an toàn là:

> thông tin và quy chế được công bố theo từng cuộc đấu giá.

### Cách viết các kết luận “không có”

Các cột giới hạn hiện dùng nhiều câu tuyệt đối như “chưa có” hoặc “không có”. Không thể chứng minh toàn bộ chức năng của một nền tảng lớn chỉ từ một số trang trợ giúp.

Nên đổi thành:

> trong phạm vi tài liệu chính thức được khảo sát, chưa thấy mô tả...

Cách viết này chính xác hơn về phương pháp nghiên cứu.

### Metadata tài liệu tham khảo

Các entry web trong BibTeX đang dùng năm 2026 như năm xuất bản, trong khi phần lớn trang không công bố năm phát hành. Nên:

- dùng ngày truy cập 17/06/2026 trong trường `urldate` hoặc `note`;
- chỉ giữ `year` khi nguồn có năm rõ ràng;
- tài liệu hướng dẫn của Lạc Việt hiển thị bản quyền năm 2023;
- các PDF điều khoản Catawiki có đường dẫn phiên bản năm 2025, cần lấy năm từ chính tài liệu thay vì ngày truy cập.

## Rà soát actor và thuật ngữ vai trò

### Chuẩn hóa tên vai trò

Trong văn xuôi nên dùng:

- Khách truy cập (Guest) ở lần đầu, sau đó dùng “Khách truy cập”;
- Người tham gia đấu giá (Bidder), sau đó dùng “Người tham gia”;
- Người mua (Buyer);
- Người bán (Seller);
- Thẩm định viên (Appraiser);
- Quản trị viên (Admin).

Không nên ghép `Bidder/Buyer` trong mọi ngữ cảnh. Trước khi thắng phiên, actor là Người tham gia đấu giá; sau khi thắng và có đơn hàng, actor là Người mua.

“Chuyên gia kiểm định” cần đổi thành “Thẩm định viên” để thống nhất với Chương 3, 5 và 6.

### Scheduler không nên được trình bày như người dùng của Hệ thống

Tác vụ nền theo lịch là thành phần nội bộ. Trong bảng actor có thể tách thành nhóm “Tác vụ tự động của Hệ thống”, nhưng trong use case UML không nên đặt chính bộ lập lịch nội bộ như một actor bên ngoài biên WoodCert Auction.

Nếu cần thể hiện tác nhân thời gian, có thể dùng actor trừu tượng “Thời gian” hoặc chỉ mô tả ca sử dụng tự động trong ghi chú.

### Hệ thống bên ngoài nên tách riêng

`External systems` đang gộp:

- VNPay Sandbox;
- Cloudinary;
- SMTP.

Ba hệ thống có vai trò hoàn toàn khác nhau. Khi mô tả hoặc vẽ sơ đồ, nên tách từng hệ thống để tránh tạo một actor chung không rõ trách nhiệm.

### Actor phụ trong các bảng ca sử dụng đang sai mức trừu tượng

Các bảng hiện liệt kê WoodCert Auction, Redis, MySQL, ví nội bộ và WebSocket subscriber như actor phụ.

Trong đặc tả ca sử dụng nghiệp vụ:

- WoodCert Auction là hệ thống đang được mô tả, không phải actor của chính nó;
- Redis, MySQL và ví nội bộ là thành phần bên trong;
- người theo dõi phiên hoặc dịch vụ thanh toán bên ngoài mới có thể là actor nếu thực sự tương tác qua biên hệ thống.

Nên bỏ các thành phần nội bộ khỏi dòng actor phụ.

## Rà soát các ca sử dụng trong bản cũ

### Gửi yêu cầu thẩm định

Nội dung đúng:

- sản phẩm phải thuộc Người bán và ở `DRAFT`;
- phí thẩm định được trừ bằng khóa thao tác lũy đẳng;
- doanh thu phí được ghi nhận;
- sản phẩm chuyển `PENDING_APPRAISAL`;
- yêu cầu xuất hiện trong hàng chờ của Thẩm định viên.

Điểm cần sửa:

- `submitForAppraisal` không kiểm tra lại ảnh trong chính thao tác gửi; ảnh đã được kiểm tra khi tạo hoặc cập nhật sản phẩm;
- gửi hàng vật lý là bước ngoài phần mềm;
- ví nội bộ không phải actor phụ;
- không cần nêu “operation key” trong Chương 2, chỉ cần nói thao tác thu phí không được ghi nhận trùng.

### Thẩm định và lập báo cáo

Nội dung code nhìn chung đúng về claim, báo cáo, ảnh tùy chọn, mã chứng thư, trạng thái `APPRAISED`/`REJECTED` và cập nhật uy tín Người bán.

Tuy nhiên:

- đây là ca thứ bảy ngoài danh sách sáu ca đã chốt;
- các bước kiểm tra hiện vật và chụp ảnh tại hiện trường là quy trình ngoài phần mềm;
- nên chuyển bảng đầy đủ sang Phụ lục B;
- Chương 2 chỉ cần một đoạn mô tả vai trò của Thẩm định viên.

### Tạo phiên đấu giá

Các quy tắc hiện ghi khớp code:

- sản phẩm `APPRAISED` và `AVAILABLE`;
- không có phiên `WAITING` hoặc `ACTIVE` khác;
- thời gian bắt đầu cách hiện tại ít nhất 5 phút;
- thời lượng 1 giờ đến 30 ngày;
- bước giá tối thiểu 100.000 đồng;
- tiền cọc tối thiểu 1.000.000 đồng và không quá 50% giá khởi điểm;
- giá sàn không thấp hơn giá khởi điểm.

Các con số này có thể giữ trong luồng ngoại lệ hoặc chuyển sang bảng quy tắc nghiệp vụ. Không cần mô tả khóa bản ghi hay chi tiết lưu dữ liệu trong Chương 2.

### Đăng ký tham gia đấu giá

Nội dung đúng:

- cho đăng ký khi phiên `WAITING` hoặc `ACTIVE` còn thời gian;
- Người bán không được tham gia phiên của chính mình;
- tiền cọc được phong tỏa;
- người đã rút không được đăng ký lại;
- chỉ được rút khi phiên còn `WAITING` và cọc còn `FROZEN`.

Nên rút các chi tiết Set Redis, khóa phiên và khóa thao tác. Hậu điều kiện nghiệp vụ chỉ cần nói Người dùng được ghi nhận là người tham gia hợp lệ và tiền cọc được phong tỏa.

### Đặt giá theo thời gian thực

Đây là bảng cần rút mạnh nhất. Các nội dung sau thuộc Chương 4--5:

- Redis/Lua là biên quyết định;
- `bidTraceId`;
- gia hạn TTL;
- thứ tự phát `NEW_BID`;
- bản chụp MySQL;
- cơ chế ghi cố gắng nhưng không bảo đảm;
- giới hạn phát sự kiện.

Chương 2 chỉ cần:

- Người tham gia đã đăng ký và phiên đang hoạt động;
- Người bán không được tự đặt giá;
- mức giá phải đáp ứng bước giá;
- người đang dẫn đầu không tự nâng giá của mình;
- lượt hợp lệ cập nhật giá hiện tại;
- anti-sniping có thể gia hạn thời điểm kết thúc khi lượt đặt giá đến sát giờ đóng;
- lượt không hợp lệ bị từ chối.

Chi tiết kỹ thuật có thể tham chiếu Chương 4--5.

### Thanh toán phần còn lại

Nội dung thanh toán, địa chỉ giao hàng, trạng thái `PAID` và tạo fulfillment là đúng.

Phải sửa toàn bộ “hạn giao hàng” thành “hạn xác nhận gửi hoặc bàn giao hàng”. Dòng actor phụ cũng cần bỏ ví nội bộ và WoodCert Auction.

### Mở tranh chấp

Nội dung nhìn chung chính xác:

- chỉ Người mua được mở;
- đơn phải ở `FULFILLING`;
- fulfillment phải ở `SHIPPED`;
- bắt buộc ít nhất một ảnh bằng chứng;
- không được có hồ sơ đang hoạt động;
- Người mua, Người bán và Quản trị viên có thể gửi thông điệp khi hồ sơ còn hoạt động;
- kết quả hiện chỉ gồm `BUYER_WINS` và `SELLER_WINS`;
- chưa có hoàn tiền một phần.

Không cần mô tả chi tiết upload intent, metadata và khóa đơn trong Chương 2.

## Rà soát yêu cầu phi chức năng trong bản cũ

### Các chỉ tiêu định lượng chưa có nguồn yêu cầu

Các chỉ tiêu sau được trình bày như mục tiêu thiết kế:

- p95 REST đặt giá không quá 500 ms;
- p95 từ Redis chấp nhận đến người theo dõi nhận sự kiện không quá 1 giây;
- 50 người đặt giá và 100 người theo dõi đồng thời;
- khả dụng 99% theo tháng.

Codebase không thể chứng minh đây là yêu cầu nghiệp vụ. Chương 4 hiện cũng chưa có benchmark hoặc dữ liệu giám sát đủ dài.

Nếu các con số chưa được người hướng dẫn hoặc chủ dự án duyệt, nên bỏ khỏi Chương 2 và thay bằng yêu cầu định tính có thể bảo vệ:

- phản hồi đặt giá phải đủ nhanh để theo dõi phiên trực tiếp;
- Hệ thống phải xử lý an toàn các yêu cầu đặt giá đồng thời;
- tác vụ nền phải có khả năng thử lại và sửa trạng thái dang dở;
- các chỉ tiêu định lượng chỉ được công bố khi có đo kiểm tái lập.

Nếu muốn giữ các con số, cần ghi rõ chúng là mục tiêu do Đồ án đề xuất và phải được xác nhận.

### Không được hứa Chương 4 sẽ có benchmark khi chưa có

Dòng 711 nói việc đo sẽ được thực hiện ở Chương 4. Trạng thái báo cáo hiện tại không có benchmark tải tương ứng.

Nên sửa thành:

> Các chỉ tiêu định lượng chỉ được xem là kết quả khi có đo kiểm tái lập; trong phạm vi hiện tại, Đồ án chưa công bố kết quả benchmark tải.

### Bảng NFR đang trộn yêu cầu và kết quả triển khai

Cột “Trạng thái” ghi “có code/test”, “cần nghiệm thu triển khai” hoặc “chưa benchmark”. Đây là nội dung đánh giá kết quả phù hợp hơn với Chương 4 hoặc Chương 6.

Chương 2 nên tập trung vào:

- mã yêu cầu;
- nội dung yêu cầu;
- tiêu chí xác minh.

Kết quả đạt hay chưa đạt được đối chiếu ở chương đánh giá.

### Các yêu cầu NFR nên giữ

- kiểm soát quyền sở hữu tài nguyên và quyền theo vai trò;
- thao tác tài chính lũy đẳng;
- chuyển trạng thái đúng điều kiện;
- Redis quản lý trạng thái thời gian chạy của phiên `ACTIVE`, MySQL lưu dữ liệu bền vững và trạng thái kết thúc;
- lưu vết thao tác quản trị, giao dịch ví, lượt đặt giá và tranh chấp;
- tác vụ nền có thử lại hoặc sửa chữa;
- giao diện phản hồi rõ các lỗi nghiệp vụ;
- không đưa secret và dữ liệu nhạy cảm vào giao diện hoặc báo cáo.

## Chuẩn hóa thuật ngữ và văn phong

Áp dụng cùng quy ước với Chương 3, 5 và 6:

- `use case` → `ca sử dụng (use case)` ở lần đầu;
- `actor` → `tác nhân (actor)` ở lần đầu;
- `realtime` → `thời gian thực`;
- `bid` → `lượt đặt giá`;
- `bidder` → `người tham gia đấu giá`;
- `seller` → `Người bán`;
- `buyer` → `Người mua`;
- `appraiser` → `Thẩm định viên`;
- `admin` → `Quản trị viên`;
- `scheduler` → `tác vụ nền theo lịch`;
- `claim` → `tiếp nhận quyền xử lý` hoặc `yêu cầu đang được tiếp nhận`;
- `media` → `tệp đa phương tiện`;
- `snapshot` → `bản chụp dữ liệu`;
- `runtime` → `trạng thái thời gian chạy`;
- `best-effort` → `cố gắng ghi nhưng không bảo đảm thành công`;
- `broadcast` → `phát sự kiện`;
- `subscriber` → `người hoặc trình khách đang theo dõi`;
- `operation key idempotent` → `khóa thao tác nghiệp vụ lũy đẳng`;
- `availability` → `khả dụng`;
- `audit log` → `nhật ký kiểm toán` hoặc `nhật ký quản trị`;
- `fulfillment` → `giao nhận` trong văn xuôi;
- `dispute` → `tranh chấp`.

Tên lớp, endpoint, enum và định danh mã nguồn được giữ nguyên khi cần đối chiếu.

Các nguồn hình và bảng nên thống nhất:

> Nguồn: Sinh viên tổng hợp từ mã nguồn và phạm vi WoodCert Auction.

Với bảng khảo sát bên ngoài:

> Nguồn: Sinh viên tổng hợp từ tài liệu chính thức của eBay, Catawiki và Lạc Việt Auction.

## Cấu trúc được áp dụng sau khi rút

### Khảo sát hiện trạng

Giữ:

- bối cảnh nghiệp vụ;
- phương pháp và phạm vi khảo sát;
- ba nền tảng tương tự;
- một bảng so sánh;
- một đoạn rút ra vấn đề.

Gộp bảng “vấn đề → yêu cầu” vào phần yêu cầu chức năng nếu cần giảm thêm trang.

Mục tiêu: 1,5--2 trang.

### Tổng quan chức năng

Giữ:

- bảng actor rút gọn;
- một sơ đồ use case tổng quát;
- một sơ đồ phân rã đã gộp hoặc tối đa hai sơ đồ;
- một đoạn phạm vi chưa bao gồm.

Bỏ bảng “Nhóm chức năng chính” vì trùng với bảng actor và bảng FR.

Mục tiêu: 2--2,5 trang.

### Yêu cầu chức năng

Tạo một bảng 12--16 yêu cầu có mã `FR`.

Mục tiêu: 1--1,5 trang.

### Đặc tả ca sử dụng

Giữ sáu ca đã chốt. Mỗi ca chỉ khoảng 0,3--0,4 trang, không đưa Redis/MySQL/Lua hay thứ tự kỹ thuật vào luồng nghiệp vụ.

Chuyển “Thẩm định và lập báo cáo” sang Phụ lục B.

Mục tiêu: 2--2,5 trang.

### Quy trình nghiệp vụ

Giữ một hình tổng quát. Nếu hai hình hiện tại không thể gộp mà vẫn đọc được, có thể giữ hai hình nhưng chương sẽ khó đạt 9--11 trang.

Mục tiêu: 0,7--1 trang.

### Yêu cầu phi chức năng

Giữ một bảng ngắn gồm yêu cầu và cách xác minh. Bỏ cột trạng thái triển khai hoặc chuyển trạng thái sang Chương 4.

Mục tiêu: 1--1,5 trang.

## Ước lượng và kết quả rút gọn

| Phần | Mức rút đề xuất |
|---|---:|
| Khảo sát và bảng so sánh | 20--30% |
| Actor và nhóm chức năng | 35--45% |
| Sơ đồ use case phân rã | 70--85% |
| Đặc tả ca sử dụng | 45--55% |
| Quy trình nghiệp vụ | 20--40% |
| Yêu cầu phi chức năng | 30--40% |
| Toàn Chương 2 | Khoảng 50--60% |

Phương án đã áp dụng giữ ba hình, sáu ca sử dụng chính và chuyển đặc tả bổ sung sang Phụ lục B. Bản biên dịch độc lập hiện có 9 trang, phù hợp mục tiêu khoảng 10--12 trang khi ghép vào báo cáo đầy đủ.

## Danh sách hình cần gửi để kiểm tra

Để không mất thời gian vào các hình nhiều khả năng sẽ bị loại, nên gửi lần lượt theo thứ tự sau.

### Nhóm 1 — hình có khả năng giữ lại cao

1. `thesis/figures/chapter-2/overall-use-case.png`
   - Kiểm tra actor, biên Hệ thống, tên ca sử dụng và quan hệ.
2. `thesis/figures/chapter-2/auction-business-flow.pdf`
   - Kiểm tra chuỗi từ sản phẩm, thẩm định, tạo phiên, đăng ký, đặt giá đến kết thúc phiên.
3. `thesis/figures/chapter-2/order-fulfillment-dispute-flow.pdf`
   - Kiểm tra thanh toán, hạn xác nhận gửi hàng, nhận hàng, tự hoàn tất và tranh chấp.

### Nhóm 2 — hình cần xem để quyết định giữ, gộp hoặc chuyển phụ lục

4. `thesis/figures/chapter-2/product-use-case.png`
5. `thesis/figures/chapter-2/auction-use-case.png`
6. `thesis/figures/chapter-2/wallet-use-case.png`
7. `thesis/figures/chapter-2/order-use-case.png`
8. `thesis/figures/chapter-2/dispute-use-case.png`

Mục tiêu sau khi xem nhóm này là chọn nội dung để gộp thành tối đa 1--2 sơ đồ phân rã, không giữ cả năm hình trong chương chính.

### Nhóm 3 — nhiều khả năng bỏ khỏi chương chính

9. `thesis/figures/chapter-2/account-use-case.png`
10. `thesis/figures/chapter-2/certificate-use-case.png`
11. `thesis/figures/chapter-2/admin-use-case.png`

Ba hình này vẫn cần kiểm tra nếu muốn chuyển sang phụ lục hoặc dùng làm nguồn để tạo sơ đồ gộp.

Chỉ hai activity diagram có mã PlantUML trong repository:

- `thesis/diagrams/plantuml/activity/auction-business-flow.puml`;
- `thesis/diagrams/plantuml/activity/order-fulfillment-dispute-flow.puml`.

Chưa tìm thấy file nguồn Astah, PlantUML hoặc diagrams.net cho chín hình use case PNG. Trước khi đóng gói báo cáo cần giữ lại file nguồn chỉnh sửa được; ảnh PNG đơn lẻ không đủ đáp ứng quy tắc lưu cả source và bản render.

## Kết quả rà soát hình

### Biểu đồ ca sử dụng tổng quát

File: `thesis/figures/chapter-2/overall-use-case.png`.

Đánh giá: hình chưa nên giữ nguyên trong bản nộp. Các nhóm nghiệp vụ chính tương đối đầy đủ, nhưng biểu đồ đang trộn ca sử dụng nghiệp vụ, thành phần nội bộ và hệ thống bên ngoài; một số quan hệ `include`/`extend` chưa đúng ngữ nghĩa.

Các điểm cần sửa:

1. Biên hệ thống bên trong chưa có tên `WoodCert Auction`; khung ngoài có nhãn `uc` là khung biểu đồ của công cụ, không thay thế tên hệ thống.
2. `Scheduler/System` là thành phần nội bộ, không nên đứng ngoài và tương tác với chính WoodCert Auction như một actor.
3. `External systems` gộp VNPay Sandbox, Cloudinary và SMTP, khiến actor này liên kết với gần như mọi nhóm chức năng dù từng dịch vụ chỉ tham gia một phạm vi riêng.
4. `Bidder/Buyer` gộp hai giai đoạn nghiệp vụ. Nên tách Người tham gia đấu giá và Người mua, hoặc dùng quan hệ kế thừa nếu muốn thể hiện một tài khoản chuyển vai trò theo giao dịch.
5. Các tên “Quản lý tài khoản và hồ sơ”, “Tổ chức và tham gia đấu giá”, “Quản lý ví và thanh toán” là nhóm chức năng rất rộng. Ở sơ đồ tổng quát vẫn có thể sử dụng, nhưng không nên đồng thời dùng `include`/`extend` với các ghi chú chi tiết như thể đây là các ca sử dụng đơn lẻ.
6. Quan hệ “Đấu giá thành công” giữa đấu giá và xử lý đơn hàng không phải `extend`. Đây là điều kiện kích hoạt nghiệp vụ hoặc hậu điều kiện của việc kết thúc phiên thành công.
7. Quan hệ “Phát sinh sự cố” giữa xử lý đơn hàng và tranh chấp chỉ có thể dùng `extend` nếu mũi tên đi từ “Giải quyết tranh chấp” về ca sử dụng cơ sở. Hình hiện tại khó xác định hướng và dễ gây hiểu sai.
8. “Phong tỏa cọc” là bước bắt buộc của đăng ký tham gia, không phải quan hệ giữa toàn bộ nhóm “Tổ chức và tham gia đấu giá” với toàn bộ nhóm “Quản lý ví và thanh toán”.
9. Đường liên kết đang dùng nhiều mũi tên có hướng. Quan hệ association giữa actor và ca sử dụng thông thường chỉ cần đường thẳng không hướng.
10. Số đường giao cắt quá lớn, đặc biệt quanh đấu giá, đơn hàng, ví và tranh chấp; khi đặt trên A4, tên actor và nhãn quan hệ rất nhỏ.

Hướng chỉnh tối thiểu:

- đặt tên biên hệ thống là `WoodCert Auction`;
- giữ sáu actor người dùng: Khách truy cập, Người tham gia, Người mua, Người bán, Thẩm định viên và Quản trị viên;
- bỏ `Scheduler/System`;
- tách VNPay Sandbox, Cloudinary và SMTP, nhưng chỉ đưa vào nếu thực sự cần ở sơ đồ tổng quát;
- giữ 7--8 ca sử dụng cấp cao, không dùng `include`/`extend` trong hình tổng quát;
- chuyển quan hệ chi tiết về cọc, tranh chấp và tạo đơn hàng sang sơ đồ phân rã hoặc activity diagram;
- dùng đường association không hướng và bố trí actor theo từng phía để giảm giao cắt.

Kết luận: nên sửa hình này trước khi tiếp tục rà các sơ đồ phân rã, vì nó quyết định tên actor và phạm vi dùng thống nhất cho toàn bộ các hình còn lại.

## Căn cứ đã đối chiếu

- `thesis/Chuong/2_Khao_sat.tex`.
- `thesis/docs/thesis_writing_plan.md`.
- `thesis/docs/figure_table_plan.md`.
- `thesis/docs/system_analysis.md`.
- `thesis/docs/evidence_map.md`.
- `thesis/Danh_sach_tai_lieu_tham_khao.bib`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/catalog/`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/finance/`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/order/`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/fulfillment/`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/dispute/`.
- `woodcert-auction/src/main/resources/application.yaml`.
- `woodcert-auction/src/main/resources/db/migration/`.
- Tài liệu chính thức của eBay, Catawiki và Lạc Việt Auction.

## Kiểm tra đã thực hiện

- Trước khi sửa: 777 dòng, khoảng 7.600 từ, 11 hình, 13 bảng và 25 trang.
- Sau khi sửa: 409 dòng, khoảng 4.000 từ, 3 hình, 11 bảng và 9 trang khi biên dịch độc lập.
- Đã chạy BibTeX và biên dịch lại Chương 2; không còn lỗi tràn lề hoặc cảnh báo chia bảng do nội dung vừa sửa.
- Đã biên dịch riêng Phụ lục B thành công.
- Đã kiểm tra trực quan các trang đại diện của PDF sau chỉnh sửa.
- Đối chiếu sáu nhóm nghiệp vụ chính với code hiện tại.
- Kiểm tra chính xác thời hạn thanh toán, hạn xác nhận gửi hàng và tự hoàn tất.
- Kiểm tra cách tạo và tra cứu mã SHA-256.
- Kiểm tra luồng Return/IPN của VNPay.
- Kiểm tra nguồn tài liệu chính thức của ba nền tảng tham chiếu.
- Kiểm tra file nguồn và bản render của các hình Chương 2.

## Thông tin đã xác nhận

1. Đồ án không thực hiện phỏng vấn hoặc khảo sát người dùng riêng.
2. Các mục tiêu p95, số người dùng đồng thời và 99% khả dụng không phải yêu cầu chính thức.
3. Người bán phải gửi hiện vật để Thẩm định viên kiểm tra trực tiếp; đây là quy trình ngoài phần mềm.
4. Chương 2 giữ sáu ca sử dụng chính; đặc tả bổ sung được chuyển sang Phụ lục B.

Không còn thông tin cần xác nhận cho phần chữ.
