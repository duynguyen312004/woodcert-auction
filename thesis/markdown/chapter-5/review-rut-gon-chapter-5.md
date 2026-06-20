# Rà soát rút gọn Chương 5

Ngày rà soát: 19/06/2026.

Phạm vi: `thesis/Chuong/5_Giai_phap_dong_gop.tex`. Đây là bản nhận xét, chưa chỉnh sửa nội dung LaTeX.

## Kết luận nhanh

Chương 5 hiện có khoảng 3.228 từ, 9 subsection, 8 subsubsection và 28 ý liệt kê. Nội dung cốt lõi là phù hợp với hệ thống, nhưng đang kể lại nhiều chi tiết triển khai đã xuất hiện trong Chương 3 và Chương 4. Có thể rút khoảng 30–40%, đưa chương về khoảng 1.900–2.200 từ mà không làm mất ba đóng góp chính.

Mức ưu tiên rút gọn:

1. Rút mạnh phần mô tả từng bước của Lua script và luồng Redis–MySQL.
2. Gộp các danh sách “kết quả đạt được” vào đoạn đánh giá ngay sau giải pháp.
3. Rút phần mã vân tay SHA-256 còn khoảng nửa đến một trang và giảm mức độ khẳng định về tính toàn vẹn.
4. Chỉ giữ kết chương ở mức 2–3 câu.

Nếu cần cắt quyết liệt, nên giữ hai đóng góp chính là xử lý đấu giá thời gian thực và tính lũy đẳng của giao dịch tài chính. Phần SHA-256 chỉ nên trình bày như một dấu vân tay tham chiếu, không nên dành dung lượng ngang với hai giải pháp trên.

## Ranh giới nội dung giữa các chương

- Chương 3 trả lời: hệ thống dùng công nghệ gì và vai trò của từng công nghệ.
- Chương 4 trả lời: hệ thống được thiết kế, cài đặt và kiểm thử như thế nào.
- Chương 5 chỉ nên trả lời: vấn đề khó nào đã được giải quyết, quyết định thiết kế chính là gì, đánh đổi và giới hạn ra sao.
- Chương 6 tổng hợp đóng góp, hạn chế và hướng phát triển; không cần Chương 5 lặp lại kết luận ở dạng danh sách dài.

Hiện phần Redis, Lua, anti-sniping, WebSocket và MySQL best-effort đã được trình bày tại `3_Cong_nghe.tex` dòng 46–88 và `4_Ket_qua_thuc_nghiem.tex` dòng 46, 67–88, 173–195, 364–416. Chương 5 vì vậy không cần mô tả lại đầy đủ quy trình kỹ thuật.

## Đề xuất rút gọn theo từng phần

| Vị trí trong file hiện tại | Nhận xét | Đề xuất |
|---|---|---|
| Dòng 4 | Phần mở đầu liệt kê lại cả ba giải pháp và dùng từ “hiệu năng” khi chưa có benchmark tải. | Rút còn 2 câu; dùng “khả năng xử lý thời gian thực” thay cho khẳng định cải thiện hiệu năng. |
| Dòng 10–16 | Bốn nhóm vấn đề được diễn giải dài, có nhiều giả định chung về hệ quản trị cơ sở dữ liệu và tải cao. | Gộp thành một đoạn khoảng 120–150 từ, tập trung vào tranh chấp cập nhật giá, bid cuối phiên và yêu cầu cập nhật tức thời. |
| Dòng 18–26 | Vai trò Redis, MySQL, REST và WebSocket đã có trong Chương 3–4. | Chỉ giữ một đoạn nêu quyết định thiết kế và lý do; bỏ phần mô tả lại từng kênh giao tiếp. |
| Dòng 28–37 | Sáu bước của Lua script là phần dài nhất và lặp trực tiếp với Chương 3–4. | Gộp thành một đoạn: script kiểm tra thời gian, tư cách, bước giá, người dẫn đầu và cập nhật anti-sniping trong một lần thực thi nguyên tử. Không cần đánh số từng lệnh. |
| Dòng 39–44 | Tên method, tên event log và thứ tự gọi chi tiết làm chương giống tài liệu cài đặt. | Giữ điểm quan trọng: broadcast trước, MySQL lưu best-effort trong cùng request, lỗi lưu không đảo ngược bid Redis. Bỏ tên method và tên log cụ thể. |
| Dòng 46–50 | “Kết quả đạt được” lặp lại gần nguyên văn phần giải pháp. | Gộp thành một đoạn đánh giá ngắn, đồng thời nói rõ chưa có benchmark định lượng. |
| Dòng 57–63 | Phần đặt vấn đề tài chính dùng nhiều tình huống giả định có cùng ý nghĩa. | Gộp thành một đoạn: thao tác tài chính có thể bị gọi lại do retry hoặc scheduler, nên cần chống ghi trùng và bảo vệ số dư khi cập nhật đồng thời. |
| Dòng 65–79 | Danh sách operation key, optimistic locking và transaction synchronization khá chi tiết. | Giữ operation key duy nhất và optimistic locking là hai cơ chế chính; transaction synchronization chỉ cần một câu về việc đánh dấu trạng thái thao tác sau khi giao dịch hoàn tất. |
| Dòng 81–86 | Mô tả chi tiết hai scheduler trùng với phần triển khai và vòng đời đơn hàng. | Chỉ giữ vai trò phục hồi: tác vụ nền có thể chạy lại an toàn nhờ operation key và khóa trạng thái. |
| Dòng 88–92 | Ba kết quả tiếp tục lặp lại giải pháp; câu về V5 dùng “quá hạn giao hàng” chưa đúng nghĩa nghiệp vụ. | Gộp thành một đoạn. Sửa thành “quá hạn xác nhận đã gửi hoặc bàn giao hàng trong 72 giờ”, không phải quá hạn hàng đến tay Buyer. |
| Dòng 99–103 | Nguy cơ sửa dữ liệu và yêu cầu đồng bộ thời gian được diễn giải như một cơ chế bảo mật hoàn chỉnh. | Rút còn một đoạn nêu nhu cầu lưu dấu vân tay của dữ liệu tại thời điểm duyệt. Bỏ “đồng bộ thời gian” nếu không phân tích cơ chế thời gian cụ thể. |
| Dòng 105–113 | Luồng trạng thái thẩm định và chi tiết UUID tạm thời thuộc Chương 4. | Chỉ giữ thời điểm tạo hash: sau khi báo cáo được phê duyệt và có định danh ổn định. |
| Dòng 115–125 | Payload và ba bước tạo SHA-256 quá chi tiết so với giá trị đóng góp thực tế. | Nêu ngắn thành phần cốt lõi của payload và việc chuẩn hóa rồi băm SHA-256; không cần danh sách từng thao tác. |
| Dòng 128–132 | Kết quả và hạn chế lặp lại nội dung đã có tại Chương 6. | Giữ một đoạn nhấn mạnh đây chỉ là dấu vân tay tham chiếu, chưa có luồng tự động tính lại, chữ ký số hoặc PKI. |
| Dòng 137 | Kết chương tóm tắt lại toàn bộ ba section trong một đoạn dài. | Rút còn 2–3 câu hoặc bỏ nếu template không bắt buộc kết chương. |

## Các câu cần sửa vì độ chính xác

### Khẳng định về hiệu năng và cơ sở dữ liệu

Các câu ở dòng 12–14 cho rằng dùng khóa trên cơ sở dữ liệu quan hệ sẽ gây nghẽn, deadlock hoặc mất dữ liệu, đồng thời anti-sniping làm tăng giá trị cuối cùng của tài sản. Đây là các khẳng định quá mạnh vì đồ án chưa có benchmark tải hoặc số liệu kinh doanh chứng minh.

Nên diễn đạt ở mức thiết kế:

> Việc đưa trạng thái bid đang hoạt động sang Redis giúp giảm số lần cập nhật cạnh tranh trực tiếp trên MySQL. Đồ án chưa thực hiện benchmark để định lượng mức cải thiện hiệu năng.

Anti-sniping chỉ nên được mô tả là cơ chế tạo thêm thời gian phản ứng cho người tham gia cuối phiên; không kết luận rằng cơ chế này chắc chắn làm tăng giá bán.

### Thứ tự xử lý bid

Redis bảo đảm các lệnh trong một Lua script không bị request khác xen kẽ. Điều này không đồng nghĩa hệ thống bảo đảm đúng thứ tự người dùng nhấn nút hoặc thứ tự request được gửi từ trình duyệt trên toàn mạng. Câu ở dòng 16 nên bỏ hoặc đổi thành “Redis tuần tự hóa thứ tự thực thi các script khi chúng đến máy chủ”.

Phần mô tả best-effort nên giữ vì phản ánh đúng đánh đổi hiện tại: Redis là biên chấp nhận bid; broadcast và ghi MySQL được thực hiện sau đó, còn lỗi lưu MySQL không đảo ngược trạng thái đã được Redis chấp nhận. Không nên gọi bước lưu MySQL là bất đồng bộ nếu không có bằng chứng `@Async`; lời gọi hiện tại vẫn nằm trong luồng xử lý request.

### Hạn gửi hàng

Migration V5 và module fulfillment quy định Seller có 72 giờ để xác nhận đã gửi hoặc bàn giao hàng. Đây không phải thời hạn để kiện hàng được giao đến Buyer. Khi quá hạn, hệ thống hủy giao nhận, hoàn lại toàn bộ giá cuối cùng cho Buyer và đưa sản phẩm về trạng thái có thể xử lý lại theo luồng hiện hành.

Thuật ngữ nên dùng thống nhất:

- Đúng: “hạn xác nhận gửi/bàn giao hàng”.
- Không nên dùng: “hạn giao hàng” hoặc “quá hạn giao hàng” nếu câu có thể bị hiểu là thời điểm Buyer phải nhận được hàng.

### Mã vân tay SHA-256

Tên section “Cơ chế bảo toàn tính toàn vẹn” đang mạnh hơn khả năng thực tế. Hash được tạo và lưu cùng báo cáo, nhưng phiên bản hiện tại chưa tự động tính lại khi truy vấn, chưa dùng chữ ký số, khóa bí mật hoặc kho lưu trữ độc lập. Nếu dữ liệu và hash cùng bị sửa bởi một chủ thể có đủ quyền thì cơ chế hiện tại không tự phát hiện được.

Nên đổi tên thành:

> Dấu vân tay tham chiếu cho báo cáo thẩm định

Hoặc:

> Lưu dấu vân tay SHA-256 tại thời điểm phê duyệt

## Cấu trúc Chương 5 sau khi rút

### Giải pháp xử lý đấu giá thời gian thực

1. Một đoạn nêu vấn đề cạnh tranh cập nhật bid và yêu cầu phản hồi thời gian thực.
2. Hai đoạn mô tả quyết định dùng Redis/Lua cho trạng thái `ACTIVE`, MySQL cho dữ liệu bền vững.
3. Một đoạn về anti-sniping và broadcast.
4. Một đoạn đánh đổi: MySQL best-effort có thể sai lệch tạm thời; chưa có benchmark tải.

### Giải pháp bảo đảm tính lũy đẳng cho giao dịch tài chính

1. Một đoạn nêu rủi ro retry, scheduler chạy lại và cập nhật số dư đồng thời.
2. Hai đoạn về operation key duy nhất, transaction và optimistic locking.
3. Một đoạn nêu tác dụng trong settlement, quá hạn thanh toán và hạn xác nhận gửi hàng.

### Dấu vân tay tham chiếu cho báo cáo thẩm định

1. Một đoạn nêu mục tiêu lưu dấu dữ liệu tại thời điểm phê duyệt.
2. Một đoạn mô tả payload chuẩn hóa và SHA-256.
3. Một đoạn giới hạn: chưa tự kiểm tra lại, chưa có chữ ký số hoặc PKI.

### Kết chương

Chỉ cần 2–3 câu nối sang Chương 6, không liệt kê lại toàn bộ chi tiết kỹ thuật.

## Nội dung bắt buộc nên giữ

- Redis là nguồn trạng thái runtime của phiên `ACTIVE`; MySQL lưu dữ liệu bền vững và trạng thái kết thúc.
- Lua script kiểm tra và cập nhật bid nguyên tử trong phạm vi Redis.
- Cơ chế anti-sniping gia hạn thời gian theo cấu hình hiện hành.
- Rủi ro sai lệch tạm thời do bước ghi MySQL theo best-effort.
- Operation key duy nhất và optimistic locking trong cập nhật ví.
- Scheduler có thể chạy lại an toàn trong phạm vi được bảo vệ bởi trạng thái và operation key.
- Hạn 72 giờ là hạn Seller xác nhận gửi/bàn giao hàng; tự động hoàn tiền khi quá hạn.
- SHA-256 hiện chỉ là dấu vân tay tham chiếu, không phải chữ ký số hoặc cơ chế chống sửa đổi hoàn chỉnh.

## Nội dung có thể bỏ hoặc chuyển về Chương 4

- Tên đầy đủ của từng service, method và event log.
- Danh sách sáu bước chi tiết của Lua script.
- Toàn bộ diễn giải tuần tự của scheduler.
- Chi tiết UUID tạm thời khi tạo báo cáo thẩm định.
- Các danh sách “kết quả đạt được” chỉ lặp lại phần giải pháp.
- Các nhận định chưa có số liệu như tăng hiệu năng rõ rệt, tránh hoàn toàn mất dữ liệu hoặc làm tăng giá trị tài sản.

## Ước lượng sau khi chỉnh

| Phần | Mức rút đề xuất |
|---|---:|
| Mở đầu | 40–50% |
| Redis/MySQL và Lua | 35–45% |
| Tài chính lũy đẳng | 25–35% |
| SHA-256 | 40–50% |
| Kết chương | 60–70% |
| Toàn Chương 5 | Khoảng 30–40% |

Việc giảm các danh sách kỹ thuật cũng sẽ xử lý phần lớn các dòng tràn lề hiện có do tên method, event và định danh dài.

## Căn cứ đã đối chiếu

- `thesis/Chuong/5_Giai_phap_dong_gop.tex`.
- `thesis/Chuong/3_Cong_nghe.tex`.
- `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex`.
- `thesis/Chuong/6_Ket_luan.tex`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/service/BidLuaScript.java`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/service/BidServiceImpl.java`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/service/BidPersistenceService.java`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/finance/service/WalletServiceImpl.java`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/finance/service/WalletOperationLifecycleService.java`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/catalog/service/AppraisalServiceImpl.java`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/fulfillment/service/FulfillmentScheduler.java`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/fulfillment/service/FulfillmentServiceImpl.java`.
- `woodcert-auction/src/main/resources/db/migration/V1__baseline_schema.sql`.
- `woodcert-auction/src/main/resources/db/migration/V5__add_shipment_deadline.sql`.
- `woodcert-auction/src/main/resources/application.yaml`.

