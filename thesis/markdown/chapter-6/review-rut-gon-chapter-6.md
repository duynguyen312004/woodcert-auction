# Rà soát Chương 6

Ngày rà soát: 19/06/2026.

Phạm vi: `thesis/Chuong/6_Ket_luan.tex`.

Trạng thái: các đề xuất chính trong bản rà soát đã được áp dụng vào Chương 6 ngày 19/06/2026.

## Kết luận nhanh

Chương 6 hiện có khoảng 1.794 từ, 24 ý liệt kê và biên dịch riêng thành 4 trang A4. Nội dung nhìn chung trung thực, nhưng phần kết luận đang lặp lại nhiều chi tiết của Chương 5, trong khi chưa tổng hợp đầy đủ kết quả của toàn bộ hệ thống, bằng chứng kiểm thử và trạng thái triển khai.

Nên rút khoảng 25–30%, đưa chương về khoảng 1.300–1.500 từ và khoảng 3 trang. Mục tiêu không phải làm kết luận ngắn bằng mọi giá, mà chuyển trọng tâm từ liệt kê kỹ thuật sang đối chiếu mục tiêu, kết quả, giới hạn và hướng phát triển.

## Các vấn đề chính

### Phần kết luận đang nghiêng quá nhiều về Chương 5

Dòng 8–14 liệt kê riêng kiến trúc, Redis/MySQL, Lua, anti-sniping, ví lũy đẳng, SHA-256 và scheduler. Các nội dung này đã được phân tích ở Chương 5 nên không cần tách thành bảy ý trong kết luận.

Nên nhóm lại thành ba kết quả:

1. Hoàn thiện chuỗi nghiệp vụ từ tài khoản, sản phẩm, thẩm định, đấu giá, thanh toán đến giao nhận và tranh chấp.
2. Hiện thực các giải pháp kỹ thuật chính gồm modular monolith, Redis/Lua kết hợp MySQL và giao dịch ví lũy đẳng.
3. Kiểm chứng hệ thống bằng kiểm thử tự động và triển khai thực tế.

Phần SHA-256 chỉ cần xuất hiện như một giới hạn của chứng thư, không cần tiếp tục trình bày như một kết quả độc lập dài.

### Thiếu bằng chứng kiểm thử và triển khai

Chương 6 hiện chỉ nói chung rằng các luồng đã được kiểm chứng. Trong khi đó, kết quả chạy ngày 19/06/2026 đã có căn cứ cụ thể:

- Backend: báo cáo Maven Surefire ghi nhận 403 ca kiểm thử thuộc 63 bộ kiểm thử, không có thất bại, lỗi thực thi hoặc ca bị bỏ qua. Bộ đếm 482/482 của Visual Studio Code bao gồm cả các mục chứa trong cây Test Explorer nên không đồng nhất với số ca thực thi.
- Frontend: 196 kiểm thử đơn vị thuộc 59 file, không có lỗi.
- Kiểm tra lint, typecheck và build frontend đều đạt.
- Playwright: 7/7 kịch bản đầu cuối đạt.
- Production đang vận hành ổn định theo xác nhận của chủ dự án ngày 19/06/2026.

Nên đưa các số liệu này vào một đoạn ngắn. Không cần tạo thêm bảng nếu mục tiêu là giảm số trang.

### Chưa đối chiếu rõ với mục tiêu ban đầu

Đoạn mở đầu mới nhắc eBay và Catawiki, trong khi Chương 2 khảo sát cả Lạc Việt Auction. Có thể tránh liệt kê lại tên từng nền tảng bằng cách viết “các nền tảng được khảo sát ở Chương 2”.

Kết luận nên trả lời trực tiếp:

- Hệ thống đã giải quyết được những mục tiêu nào?
- Mục tiêu nào mới chỉ đạt trong phạm vi đồ án?
- Phần nào chưa hướng tới vận hành thương mại đầy đủ?

### Quá nhiều danh sách

Chương hiện có 24 `\item`, làm phần kết luận giống một danh mục tính năng. Ba ý “bài học kinh nghiệm” ở dòng 28–33 lặp lại gần như nguyên vẹn các đánh đổi đã nêu trong Chương 5.

Nên bỏ danh sách bài học riêng và gộp thành một đoạn khoảng 100–150 từ. Phần “Hướng phát triển” nên giữ 4 nhóm ưu tiên thay vì 7 mục.

## Những điểm cần sửa vì độ chính xác

### Hạn xác nhận gửi hàng

Dòng 14 và 20 đang dùng “quá hạn giao hàng” và “không gửi hàng đúng hạn”. Migration V5 cùng module fulfillment quy định thời hạn mặc định 72 giờ để Người bán xác nhận đã gửi hoặc bàn giao hàng, không phải thời hạn kiện hàng phải đến tay Người mua.

Nên dùng thống nhất:

> quá hạn xác nhận gửi hoặc bàn giao hàng

### Ký quỹ của Người bán

Dòng 20 viết hệ thống “chưa có cơ chế ký quỹ”, có thể khiến người đọc hiểu rằng hệ thống hoàn toàn không có tiền cọc. Thực tế hệ thống đã có tiền cọc của người tham gia đấu giá; phần chưa có là ký quỹ hoặc chế tài tài chính dành cho Người bán khi vi phạm nghĩa vụ gửi hàng.

Nên sửa thành:

> chưa có khoản ký quỹ riêng, chế tài tài chính hoặc cơ chế giảm điểm uy tín dành cho Người bán khi quá hạn xác nhận gửi hàng

### Video đóng gói

Mã nguồn có loại media `SHIPMENT_PACKING_VIDEO` và cấu hình dung lượng video, nhưng chưa có luồng nghiệp vụ fulfillment hoàn chỉnh để Người bán tải, xác nhận và gắn video đóng gói với đơn hàng. Vì vậy, dòng 23 nên diễn đạt là “chưa được tích hợp vào luồng giao nhận”, thay vì khẳng định toàn hệ thống không có bất kỳ hỗ trợ kỹ thuật nào cho video.

### Mức độ bảo đảm của anti-sniping

Dòng 11 dùng cụm “rủi ro đầu cơ”. Anti-sniping không ngăn đầu cơ theo nghĩa kinh tế; nó giảm lợi thế của việc đặt giá trong những giây cuối. Nên dùng đúng phạm vi này và không kết luận rằng cơ chế chắc chắn làm tăng giá chốt phiên.

### Thuật ngữ khóa lạc quan

Dòng 12 dùng “khóa tối ưu”, đây không phải cách dịch phù hợp của `Optimistic Locking`. Thuật ngữ nên dùng là:

> khóa lạc quan (optimistic locking)

### Trạng thái Redis và MySQL

Dòng 24 phản ánh đúng giới hạn hiện tại nhưng dùng nhiều từ tiếng Anh trực tiếp. Nên thống nhất với Chương 5:

- `snapshot` → bản chụp trạng thái;
- `best-effort` → cơ chế cố gắng ghi nhưng không bảo đảm thành công;
- `scheduler` → tác vụ nền theo lịch;
- `bid` → lượt đặt giá.

## Đề xuất cấu trúc sau khi rút

### Kết luận

1. Một đoạn nhắc lại mục tiêu và phạm vi đề tài.
2. Một đoạn tổng hợp chuỗi nghiệp vụ đã hoàn thành.
3. Một đoạn tổng hợp ba giải pháp kỹ thuật chính, tham chiếu Chương 5 thay vì mô tả lại.
4. Một đoạn nêu kết quả kiểm thử và production.
5. Một đoạn hạn chế, hoặc danh sách tối đa 4 ý:
   - chứng thư và SHA-256;
   - giới hạn thanh toán, logistics và chế tài Người bán;
   - thông báo, tranh chấp và video đóng gói;
   - sai lệch Redis/MySQL, thiếu benchmark và quan sát vận hành.

Không cần section “bài học kinh nghiệm” riêng; có thể kết thúc phần kết luận bằng một đoạn ngắn về kinh nghiệm thiết kế ranh giới dữ liệu, tính lũy đẳng và mô hình trạng thái.

### Hướng phát triển

Nên giữ bốn nhóm ưu tiên:

1. Xây dựng trung tâm thông báo lưu bền và thông báo đẩy.
2. Hoàn thiện tranh chấp: video đóng gói, kết quả hoàn tiền một phần và cập nhật gần thời gian thực khi thực sự cần.
3. Hoàn thiện thanh toán, đối soát, logistics và chế tài dành cho Người bán.
4. Bổ sung kiểm tra mã băm/chữ ký số, giám sát vận hành và đo kiểm tải.

Các nội dung “chat WebSocket”, “API logistics”, “rút tiền ngân hàng” không cần mỗi nội dung chiếm một mục riêng; nên đặt trong nhóm chức năng tương ứng.

## Chuẩn hóa văn phong

Chương 6 cần áp dụng cùng quy ước đã thống nhất cho Chương 5:

- Thuật ngữ tiếng Việt đứng trước, tiếng Anh trong ngoặc ở lần đầu.
- Sau lần đầu chỉ dùng thuật ngữ tiếng Việt nếu không phải tên công nghệ hoặc định danh mã nguồn.
- Dùng “Thẩm định viên” nhất quán, không xen kẽ “Chuyên gia kiểm định”.
- Dùng “Người mua”, “Người bán”, “Quản trị viên” thay cho Buyer, Seller, Admin trong văn xuôi.
- Dùng “kiến trúc nguyên khối phân mô-đun (modular monolith)”.
- Dùng “trạng thái thời gian chạy”, “bản chụp trạng thái”, “nhật ký hệ thống”, “đo kiểm tải” và “khóa lạc quan”.

Theo kế hoạch viết đã duyệt, Chương 6 cần xưng “em” nhất quán khi nói về kết quả và kinh nghiệm của người thực hiện. Bản hiện tại dùng “tác giả” ở dòng 28 và phần lớn sử dụng câu vô nhân xưng; cần chọn một cách trình bày thống nhất khi chỉnh sửa.

## Ước lượng rút gọn

| Phần | Mức rút đề xuất |
|---|---:|
| Danh sách kết quả kỹ thuật | 35–45% |
| Danh sách hạn chế | 20–30% |
| Bài học kinh nghiệm | 50–70% |
| Hướng phát triển | 25–35% |
| Toàn Chương 6 | Khoảng 25–30% |

## Căn cứ đã đối chiếu

- `thesis/Chuong/6_Ket_luan.tex`.
- `thesis/Chuong/2_Khao_sat.tex`.
- `thesis/Chuong/4_Ket_qua_thuc_nghiem.tex`.
- `thesis/Chuong/5_Giai_phap_dong_gop.tex`.
- `thesis/docs/thesis_writing_plan.md`.
- `woodcert-auction/src/main/resources/db/migration/V5__add_shipment_deadline.sql`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/fulfillment/`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/dispute/`.
- `woodcert-auction/src/main/java/com/woodcert/auction/feature/media/`.
- `woodcert-auction-fe/src/features/dispute/hooks/useDisputes.ts`.
- Kết quả kiểm thử backend, frontend và Playwright đã chạy ngày 19/06/2026.
