# Identity - Bối Cảnh Triển Khai
> Viết ngày: 2026-03-30 | Tác giả: AI Assistant + Duy Nguyen

## Bối Cảnh Nghiệp Vụ
`identity` là module nền tảng của WoodCert Auction. Module này phụ trách xác thực, vòng đời phiên JWT, RBAC, hồ sơ người dùng, hồ sơ pháp lý người bán, địa chỉ giao hàng và dữ liệu địa giới hành chính Việt Nam để các phần khác của hệ thống sử dụng.

## Các Quyết Định Kỹ Thuật
- **`User.id` dùng UUID dạng chuỗi (`VARCHAR(36)`)** để tránh lộ quy luật ID và an toàn hơn cho các luồng phân tán về sau.
- **Refresh token được lưu dưới dạng SHA-256 hash** thay vì lưu raw token. Client chỉ nhận raw token đúng một lần.
- **Refresh token rotation là bắt buộc**. Mỗi lần `/auth/refresh` thành công sẽ thu hồi refresh token cũ và cấp cặp access/refresh token mới.
- **Thứ tự đọc refresh token là Body trước, Cookie sau** để tránh vô tình dùng lại cookie cũ trong các luồng Postman hoặc trình duyệt.
- **`Address` lưu `province_code`, `district_code`, `ward_code` dưới dạng chuỗi thường**. Việc validate được xử lý ở service layer, không dùng mapping `@ManyToOne` nặng cho dữ liệu master read-only.
- **Dữ liệu địa giới hành chính Việt Nam được seed một lần khi ứng dụng khởi động nếu các bảng đang rỗng**. Ứng dụng ưu tiên gọi `https://provinces.open-api.vn/api/v1/?depth=3`; nếu không gọi được thì fallback sang file seed local trong project. Sau đó toàn bộ location API chỉ đọc từ DB.
- **Roles và permissions được lưu trong database**, không hardcode bằng enum Java, để RBAC có thể mở rộng mà không cần build lại ứng dụng.
- **Chỉ những entity có đủ audit columns mới kế thừa `BaseEntity`**. `User` có; `Address`, `SellerProfile`, `Role`, `Permission` thì không.
- **`SellerProfile` dùng chung khóa chính với `User`** thông qua `@MapsId`.
- **JWT được tạo bằng Nimbus JOSE (HS512)** để luồng tạo và validate token đồng bộ với Spring Security OAuth2 Resource Server.
- **Các controller đã đăng nhập trong module identity dùng `@CurrentUserId`** thông qua custom MVC argument resolver, nên controller không cần inject `Jwt` trực tiếp nữa.

## Phạm Vi Phase 1 Đã Hoàn Thành
- Auth APIs: `POST /api/v1/auth/login`, `/register`, `/verify-email`, `/resend-verification`, `/refresh`, `/logout`
- User profile APIs: `GET/PUT /api/v1/users/me`
- Seller profile APIs: `GET/POST /api/v1/users/me/seller-profile`
- Address APIs: `GET/POST /api/v1/addresses`
- Public location APIs: `GET /api/v1/locations/provinces`, `/districts`, `/wards`

## Luật Nghiệp Vụ
- Một user chỉ có tối đa một seller profile.
- `identity_card_number` trong seller profile phải là duy nhất.
- Muốn nâng cấp thành seller thì user phải có `phoneNumber` trước.
- Khi tạo seller profile sẽ được gán `ROLE_SELLER`, nhưng client cần đăng nhập lại để access token nhận claim role mới.
- Một user có thể có nhiều địa chỉ giao hàng.
- Nếu tạo địa chỉ mới với `isDefault = true`, toàn bộ địa chỉ khác của user đó sẽ bị đặt lại thành `false`.
- Validate địa chỉ là bắt buộc theo hierarchy: district phải thuộc province, và ward phải thuộc district.

## Các Phương Án Đã Loại Bỏ
- **Spring Authorization Server**: quá nặng cho phạm vi hiện tại của ứng dụng.
- **Thư viện JJWT**: không cần thiết vì stack hiện tại đã có Nimbus qua Spring Security.
- **Dùng hierarchy `@ManyToOne` cho province/district/ward trong `Address`**: thừa chi phí cho dữ liệu master chỉ đọc.
- **Dùng Lombok `@Data` cho entity**: bị loại để tránh `equals/hashCode` không an toàn và side effect với lazy loading.

## Giới Hạn Hiện Tại
- Luồng verify email đã có: đăng ký tạo token một lần, gửi link vào inbox, và chuyển user sang `ACTIVE` khi token được xác minh.
- Chưa có brute-force protection cho `/login`.
- `data.sql` vẫn đang được dùng cho bootstrap/master data trong môi trường dev; migration tooling vẫn chưa được đưa vào.
- Lần khởi động đầu tiên vẫn ưu tiên API tỉnh thành public, nhưng đã có fallback local đi kèm project để tránh làm app fail chỉ vì mất mạng ngoài.
- Chưa hoàn tất full controller/integration test coverage.
- Việc verify bằng Maven hiện vẫn bị chặn bởi vấn đề môi trường/sandbox (`mvnw.cmd` lỗi wrapper và Maven local repository trong sandbox không truy cập được).

## Nhật Ký Refactor
### Cập nhật 2026-03-29 | Nền Tảng
- Xây nền identity đầu tiên: entities, repositories, security config, cấp JWT, các API login/register/refresh/logout.
- Sửa lỗi ưu tiên refresh token do cookie cũ trong Postman/trình duyệt gây ra.
- Chuẩn hóa `BadCredentialsException` bị lộ thành `AppException(INVALID_CREDENTIALS)` để tránh HTTP 500 khi đăng nhập sai.

### Cập nhật 2026-03-30 | Hoàn Thành Phase 1
- Thêm API hồ sơ người dùng hiện tại.
- Thêm API tạo và lấy seller profile.
- Thêm API lấy danh sách và tạo địa chỉ.
- Thêm bộ public location master-data APIs cho form địa chỉ của frontend.
- Thêm validate ở service layer cho hierarchy location và logic đổi địa chỉ mặc định.

### Cập nhật 2026-03-30 | Refactor Auth
- Thay việc truyền `Jwt` trực tiếp vào controller bằng `@CurrentUserId`.
- Thêm `CurrentUserIdResolver` và đăng ký qua `WebConfig`.
- Xóa helper `SecurityUtils` cũ vốn chỉ dùng để lấy subject từ JWT trong controller.

### Cập nhật 2026-03-31 | Dọn Dẹp DTO và Validation
- Tách DTO của identity thành `dto/request` và `dto/response`.
- Siết chặt validation cho email, password, số điện thoại, CCCD, mã số thuế, location code và payload địa chỉ. Avatar nay đi qua luồng media riêng thay vì nhận raw URL trong profile.
- Thêm tập pattern validate dùng chung để quy tắc định dạng nhất quán trong toàn bộ module identity.
- Thêm xử lý `@Valid` cho request body optional của refresh/logout nhưng vẫn giữ behavior cookie fallback.

### Cập nhật 2026-04-06 | Cơ Chế Seed Location
- Thay cách load `location-data.sql` offline bằng cơ chế `seed-if-empty` lúc ứng dụng khởi động.
- Thêm location seed client và runner để chỉ gọi `https://provinces.open-api.vn/api/v1/?depth=3` khi bảng `provinces` đang rỗng.
- Bổ sung fallback local `src/main/resources/seed/location-seed.json` để first boot không phụ thuộc cứng vào API ngoài.
- Chuẩn hóa mã địa giới trước khi lưu: tỉnh `01`, quận/huyện `001`, phường/xã `00001`.
- Sau khi seed xong, toàn bộ location APIs chỉ đọc dữ liệu từ database nội bộ.

### Cập nhật 2026-04-06 | Chuẩn Hóa Update và Input
- `PUT /users/me` chuyển sang behavior cập nhật từng phần: field không gửi lên sẽ giữ nguyên giá trị cũ.
- Chuẩn hóa số điện thoại Việt Nam trước khi lưu và kiểm tra trùng lặp, ví dụ `+849...` sẽ được đổi về `09...`.
- Chuẩn hóa location code trước khi validate và lưu, nên input như `1`, `01`, `001` sẽ được đưa về đúng định dạng hệ thống.

### Cập nhật 2026-04-06 | Patch User Profile
- Bổ sung `PATCH /users/me` để hỗ trợ semantics rõ ràng hơn cho cập nhật profile.
- Với `PATCH /users/me`: field không gửi sẽ giữ nguyên, field gửi `null` sẽ xóa nếu là field nullable, field gửi value sẽ update.
- `PUT /users/me` vẫn giữ lại tạm thời để tương thích ngược với client cũ.

### Cập nhật 2026-04-06 | Cleanup Refresh Token
- Bổ sung scheduled job dọn bảng `refresh_tokens` theo cron cấu hình được.
- Job sẽ xóa các refresh token đã `revoked = true` hoặc đã hết hạn, giúp bảng token không phình dần theo thời gian.
- Bật mặc định qua `identity.refresh-token-cleanup.enabled=true`, cron mặc định là `0 0 */6 * * *`.
