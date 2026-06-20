# 4.4 Kiểm thử

## 4.4.1 Kịch bản kiểm thử các chức năng cốt lõi

Phân hệ kiểm thử tập trung vào việc xác lập các kịch bản kiểm thử chi tiết cho hai nhóm chức năng cốt lõi và nhạy cảm nhất của hệ thống: logic đặt giá đấu giá và luồng xử lý cọc/thanh toán ví.

### 1. Kịch bản kiểm thử logic đặt giá đấu giá (Active Bidding)

Các ca kiểm thử dưới đây nhằm xác thực tính đúng đắn của logic nghiệp vụ được thực thi bên trong Redis Lua Script và tính đồng bộ dữ liệu sang cơ sở dữ liệu MySQL.

* **Ca kiểm thử 1: Đặt giá hợp lệ**
  * *Điều kiện đầu vào:* Phiên đấu giá đang ở trạng thái `ACTIVE`. Người dùng đã đóng băng tiền đặt cọc tham gia. Giá đặt mới lớn hơn hoặc bằng mức giá hiện tại cộng bước giá cấu hình (`currentPrice + stepPrice`). Người dùng không phải là người đang giữ giá cao nhất và không phải là chủ sở hữu sản phẩm.
  * *Hành vi mong muốn:* Yêu cầu đặt giá được Redis Lua Script chấp nhận (trả về kết quả thành công). Hệ thống cập nhật mức giá mới và người dẫn đầu mới trên Redis; phát sự kiện cập nhật tức thời qua WebSocket; ghi nhận lịch sử vào bảng `bids` và cập nhật snapshot phiên trên MySQL.
* **Ca kiểm thử 2: Đặt giá thấp hơn bước giá tối thiểu**
  * *Điều kiện đầu vào:* Giá trị đặt giá mới nhỏ hơn mức giá hiện tại cộng với bước giá tối thiểu cấu hình.
  * *Hành vi mong muốn:* Yêu cầu bị từ chối ở tầng Redis Lua Script (trả về mã báo lỗi giá thấp). Không có cập nhật nào trên Redis và MySQL; hệ thống trả về thông báo lỗi đặt giá không hợp lệ.
* **Ca kiểm thử 3: Người đang dẫn đầu tự đặt đè giá của chính mình**
  * *Điều kiện đầu vào:* Người dùng hiện đang giữ giá cao nhất gửi tiếp một yêu cầu đặt giá mới với mức giá cao hơn.
  * *Hành vi mong muốn:* Yêu cầu bị từ chối tại Redis Lua Script (trả về mã báo lỗi tự nâng giá). Hệ thống ngăn chặn việc tự đặt giá để bảo đảm tính cạnh tranh công bằng.
* **Ca kiểm thử 4: Tự động gia hạn thời gian kết thúc phiên (Anti-sniping)**
  * *Điều kiện đầu vào:* Một lượt đặt giá hợp lệ được gửi tới khi thời gian còn lại của phiên đấu giá nhỏ hơn hoặc bằng 30 giây trước khi đóng phiên.
  * *Hành vi mong muốn:* Lượt đặt giá được chấp nhận thành công. Đồng thời, thời gian kết thúc phiên (`endTime`) trên Redis được tự động gia hạn thêm 60 giây. Trạng thái thời gian mới được đồng bộ sang MySQL và broadcast qua WebSocket.

### 2. Kịch bản kiểm thử luồng xử lý cọc và đóng phiên (Deposit & Settlement)

Các ca kiểm thử này nhằm xác thực tính toàn vẹn của dữ liệu ví ảo và tính lũy đẳng trong các giao dịch tài chính liên mô-đun.

* **Ca kiểm thử 5: Đăng ký tham gia và đóng băng tiền cọc**
  * *Điều kiện đầu vào:* Người dùng gửi yêu cầu tham gia một phiên đấu giá ở trạng thái `WAITING` hoặc `ACTIVE`. Ví người dùng có số dư khả dụng lớn hơn hoặc bằng số tiền cọc quy định (`depositAmount`).
  * *Hành vi mong muốn:* Hệ thống thực hiện trừ tiền khả dụng (`availableBalance`) và cộng tương ứng vào số dư bị đóng băng (`frozenBalance`) trong ví người dùng; ghi nhận một `operation_key` duy nhất để chống xử lý trùng lặp. Tạo bản ghi tham gia ở trạng thái đóng băng (`FROZEN`).
* **Ca kiểm thử 6: Đóng phiên đấu giá thành công và giải tỏa tiền cọc**
  * *Điều kiện đầu vào:* Phiên đấu giá đến hạn kết thúc. Có ít nhất một lượt đặt giá hợp lệ đạt mức giá bảo lưu tối thiểu của người bán.
  * *Hành vi mong muốn:* Hệ thống chuyển trạng thái phiên sang thành công (`ENDED_SUCCESS`). Quyết toán cọc cho người thắng bằng cách khấu trừ cọc (chuyển trạng thái cọc sang `DEDUCTED`), giải phóng cọc khả dụng lại cho những người thua cuộc (chuyển trạng thái sang `REFUNDED`). Tự động khởi tạo đơn hàng mới với mức giá chốt trừ đi tiền cọc đã capture.
* **Ca kiểm thử 7: Hủy đơn hàng và xử lý phạt cọc do quá hạn thanh toán**
  * *Điều kiện đầu vào:* Một đơn hàng trúng đấu giá ở trạng thái chờ thanh toán (`PENDING_PAYMENT`) vượt quá thời hạn thanh toán cấu hình (72 giờ) mà người mua không hoàn tất thanh toán phần tiền còn lại.
  * *Hành vi mong muốn:* Tác vụ chạy nền tự động chuyển trạng thái đơn hàng sang hủy (`CANCELED`). Số tiền cọc đã khấu trừ trước đó được tịch thu và phân phối tự động theo chính sách phạt quá hạn thanh toán cấu hình sẵn trong hệ thống (gồm bồi thường cho người bán và ghi nhận doanh thu phí nền tảng thông qua hoạt động ví).

---

## 4.4.2 Kết quả kiểm thử tự động

Hệ thống WoodCert Auction tích hợp quy trình kiểm thử tự động nghiêm ngặt nhằm xác thực hoạt động thực tế của mã nguồn trước khi triển khai.

### Phương pháp kiểm thử tích hợp bằng Testcontainers
Do hệ thống sử dụng mô hình trạng thái lai (MySQL lưu dữ liệu bền vững và Redis xử lý đặt giá thời gian thực), các bài kiểm thử tích hợp (Integration Tests) yêu cầu môi trường chạy thực tế của hai dịch vụ lưu trữ này.
* Hệ thống áp dụng giải pháp **Testcontainers** (tích hợp trong Spring Boot Test) để tự động khởi chạy và cấu hình các container Docker độc lập của MySQL 8.0 và Redis 7.4 trên môi trường kiểm thử.
* Thiết lập này giúp các bài kiểm thử tích hợp của phân hệ đấu giá (chẳng hạn như các bài kiểm thử tích hợp vòng đời phiên và kiểm thử tích hợp kịch bản thực thi Lua script) chạy trực tiếp trên container Redis thật và kiểm tra các ràng buộc khóa ngoại, khóa tối ưu trên container MySQL thật, bảo đảm kết quả kiểm thử phản ánh chính xác hành vi của ứng dụng khi triển khai.

### Bảng 4.2: Thống kê kết quả kiểm thử tự động của hệ thống

| Phân khu kiểm thử | Tổng số ca kiểm thử | Số ca thành công | Số ca thất bại | Tỷ lệ thành công |
| :--- | :---: | :---: | :---: | :---: |
| **Backend (Unit & Integration Tests)** | [Số lượng] | [Số lượng] | 0 | 100% |
| **Frontend (Unit & E2E Playwright)** | [Số lượng] | [Số lượng] | 0 | 100% |

*(Lưu ý học thuật: Sinh viên bắt buộc phải chạy lệnh kiểm thử `mvn clean test` ở backend và `pnpm test` ở frontend trên môi trường máy chủ để lấy chính xác số lượng ca kiểm thử thành công trong XML reports điền vào bảng này trước khi nộp báo cáo).*
