# Identity — Bối cảnh triển khai (Implementation Context)
> Viết ngày: 2026-03-29 | Tác giả: AI Assistant + Duy Nguyen

## Bối cảnh nghiệp vụ (Business Context)
Module Identity (Danh tính) là **nền tảng cốt lõi** của nền tảng WoodCert Auction. Nó quản lý tài khoản người dùng, xác thực (dựa trên JWT), phân quyền dựa trên vai trò (RBAC), hồ sơ người bán, địa chỉ giao hàng, và dữ liệu cấu trúc hành chính của Việt Nam (tỉnh/huyện/xã). Mọi module chức năng khác đều phụ thuộc vào Identity để tham chiếu người dùng và phân quyền.

## Quyết định kỹ thuật (Technical Decisions)

- **User.id sử dụng UUID (VARCHAR 36) thay vì BIGINT tự tăng**: Ngăn chặn tấn công dò quét ID (ID enumeration), an toàn cho hệ thống phân tán và cho phép sinh ID từ phía client nếu cần. Đánh đổi: các cột khóa ngoại trên toàn Database sẽ lớn hơn một chút.

- **RefreshToken lưu trữ mã băm SHA-256, không lưu token thô**: Nếu DB bị lộ, kẻ tấn công không thể dùng mã băm để sinh access token hoặc mạo danh người dùng. Token thô chỉ được giữ trong bộ nhớ ở một thời điểm và trả về cho client một lần duy nhất.

- **Token Rotation (Xoay vòng token) khi refresh**: Mỗi lệnh gọi `/auth/refresh` sẽ tự động hủy (revoke) refresh token cũ và cấp một bộ hoàn toàn mới (access + refresh mới). Điều này thu hẹp thiệt hại nếu refresh token bị đánh cắp — vì nó chỉ được dùng một lần.

- **Thứ tự đọc Refresh token: Ưu tiên Body, Cookie hỗ trợ (fallback)**: Controller sẽ kiểm tra token ở request body trước khi đọc từ HttpOnly cookie. Lý do: body thể hiện chủ ý rõ ràng của client (dành cho app Mobile/Postman), còn cookie là ngầm định (trình duyệt tự gắn). Điều này cũng giúp tránh lỗi refresh nhầm vòng token cũ do Postman hay trình duyệt nhớ cookie.

- **Mã địa lý được lưu là String, không dùng @ManyToOne**: Cột `province_code`, `district_code`, `ward_code` trong entity `Address` là cột `String` thuần để lấy giá trị từ bảng danh mục. Tránh quan hệ JPA rườm rà và tốn tài nguyên lazy-loading. Việc kiểm tra mã này có đúng hay không sẽ diễn ra tại các hàm Validation ở service.

- **Roles & Permissions lưu trong CSDL, không phải Java enums**: Cho phép tuỳ biến RBAC (ví dụ: gán thêm quyền cho role cũ, tạo role mới hoàn toàn) lúc ứng dụng đang chạy thông qua màn hình Admin. Dữ liệu gốc được tải qua `data.sql` khi build chương trình.

- **Entity không có cột ngày tháng truy vết (audit) sẽ KHÔNG kế thừa BaseEntity**: Chỉ có `User` có `created_at` + `updated_at` trong Schema -> extends BaseEntity. Còn Role, Permission, Address... không có, nên tránh dùng. RefreshToken chỉ có `created_at` sẽ tự định nghĩa `@CreationTimestamp`.

- **SellerProfile dùng chung khoá chính cùng User**: `@MapsId` trên khoá ngoại, tránh sinh thêm cột index/ID phụ, hiệu năng mapping giữa Người Dùng - Hồ Sơ Bán tốt nhất.

- **CustomUserDetailsService đặt ở `core/security/` thay vì Identity Service**: Vì nó thực chất là "Bản lề" gắn liền với Spring Security - phụ thuộc của Framework (nhận/ném lỗi theo khuôn). Điều này giúp giữ mã Identity Service của chúng ta sạch sẽ.

- **Dùng Nimbus JOSE (HS512) tạo JWT, không cài JJWT**: Thay vì cài thêm 1 hệ thư viện (JJWT) làm nặng build, thì thư viện định tuyến OAuth2 gốc `spring-boot-starter-oauth2-resource-server` đã kèm sẵn Nimbus. Dùng Nimbus cho việc tạo (JwtService) và giải mã (Bảng cấu hình của Spring Security) làm tăng độ ổn định của Application.

## Cân nhắc nhưng bị rớt đài (Considered and Rejected)

- **Cài thư viện con JJWT**: Do Nimbus quá thừa khả năng.

- **Dựng Spring Authorization Server**: Vì Auth thuần ở mức app này tự implement hiệu quả hơn là phải học khối cấu hình nặng trịch từ hệ Authorization gốc (thường thiết kế cho SSO hoặc kết nối bên thế 3).

- **Map Tỉnh/Phường là Entities nhúng `@ManyToOne` ở Entity Address**: Dữ liệu danh mục này hoàn toàn là Read-only (chỉ đọc). Mapping lôi thôi làm giảm sốt hiệu năng khi trả JSON.

- **Dùng `@Data` của Lombok cho entity**: Cấm trong dự án. Do sinh ra `@ToString`, `@EqualsAndHashCode`. Ở môi trường JPA nhiều FetchType.LAZY dễ sinh vòng lặp StackOverflow do load móc ngoặc vòng. Chúng ta chỉ gắn `@Getter`, `@Setter` sạch sẽ.

## Dependencies (Tham chiếu)
- **Cần**: Cần các gói trong thư mục Core như `ApiResponse`, `AppException`, `BaseEntity`, `SecurityConfig`, `JwtProperties`...
- **Bị Trực thuộc**: Mọi module còn lại đều lấy giá trị từ class `User`.

## Các Hạn Chế Còn Được Giữ (Known Limitations)

- ⚠️ **Không có xác nhận thư (Email Verifier)**: Đăng ký thì Status luôn là `UNVERIFIED`. Đang phải Update Manual thành `ACTIVE`. Sẽ chắp vá email ở Phase khác.

- ⚠️ **RefreshToken sẽ ngày một to lên**: Do chưa dọn dẹp hàng ngàn row Revoked (Đã hủy). Nhưng hiện đang phát triển và dùng hàm Query nhanh nên chấp nhận. Dự định viết Job dọn rác `@Scheduled` sau.

- ⚠️ **Dùng File `.sql` cứng mỗi lần khởi động App (data.sql)**: Tuy viết cẩn thận nhờ `INSERT IGNORE` nhưng với DB lớn là dư thừa và chưa thật chuyên nghiệp khi Deploy. Rất tốt ở giai đoạn đầu. Nhưng sẽ phải cài Flyway/Liquibase migration sau cùng.

- ⚠️ **Chưa bảo vệ tấn công brute-force ở API `/login`**: API tự do. Sau này cần giới hạn Rate limiting ở NGINX hoặc Gateway.

## Nhật ký Đại Tu (Refactor Log)

### Cập nhật 2026-03-29 | Hệ Thống
- Thiết lập Nền tảng Identity bước 1
- Dựng 10 thực thể, Setup Security. Viết API Login, Register, Refresh, Logout
- Xử lý mâu thuẫn Refresh Token (đã ghi ở trên): do nhận Cookie thừa ở Postman làm Token thu hồi bị sai thứ tự ngắm. Đổi ưu tiên Request Body cho API Refresh + Logout.
- Bắt sự cố rò rỉ ngoại lệ `BadCredentialsException`. Ép thành `AppException(INVALID_CREDENTIALS)` tại source chặn bug HTTP 500 do Spring Security tuồn ra ngoài, và thêm Filter hỗ trợ phụ của Spring.
