## Đặc tả chức năng và yêu cầu phi chức năng

Chương 2 lựa chọn bảy use case cốt lõi:

1. Seller gửi yêu cầu kiểm định và thanh toán phí bắt buộc.
2. Appraiser nhận claim, kiểm tra trực tiếp hàng hóa và lập báo cáo; ảnh chứng minh tải lên là tùy chọn.
3. Seller tạo phiên từ sản phẩm `APPRAISED`, tuân thủ quy tắc giá, cọc và thời gian.
4. Bidder đăng ký ở phiên `WAITING` hoặc `ACTIVE` và bị phong tỏa tiền cọc.
5. Bidder đặt giá; Redis/Lua là biên chấp nhận, WebSocket broadcast trước bước lưu MySQL best-effort.
6. Người thắng thanh toán phần còn lại và cung cấp địa chỉ giao hàng.
7. Buyer mở tranh chấp sau khi fulfillment `SHIPPED`, bắt buộc có ảnh bằng chứng.

Mọi báo cáo kiểm định có mã hồ sơ và SHA-256 để truy vết. Hash được tạo khi lưu báo cáo, chưa được tính lại khi tra cứu và không phải chữ ký số. Chỉ sản phẩm đạt mới đủ điều kiện đấu giá.

### Mục tiêu phi chức năng

- p95 REST bid không quá 500 ms.
- p95 từ lúc Redis chấp nhận bid đến khi subscriber nhận `NEW_BID` không quá 1 giây.
- Một phiên hỗ trợ mục tiêu 50 bidder và 100 subscriber đồng thời.
- Availability mục tiêu 99% theo tháng, không tính bảo trì có kế hoạch.

Các con số trên là mục tiêu thiết kế chưa được benchmark. Chương 4 phải lưu script, commit, cấu hình môi trường, dữ liệu đầu vào, p95, error rate và kết quả của ít nhất ba lần chạy. Availability chỉ được kết luận khi có dữ liệu giám sát đủ thời gian.
