# Identity - Bối Cảnh Triển Khai
> Viết ngày: 2026-03-30 | Cập nhật: 2026-05-14 | Tác giả: AI Assistant + Duy Nguyen

## Bối Cảnh Nghiệp Vụ
`identity` là module nền tảng của WoodCert Auction. Module này phụ trách xác thực, JWT session lifecycle, RBAC, hồ sơ người dùng, seller profile, địa chỉ giao hàng, location master-data và avatar hiện tại của user.

## Các Quyết Định Kỹ Thuật
- `User.id` dùng UUID dạng chuỗi (`VARCHAR(36)`) để an toàn hơn cho public APIs và các flow phân tán về sau.
- Refresh token được lưu dưới dạng SHA-256 hash thay vì lưu raw token.
- Refresh token rotation là bắt buộc; refresh thành công sẽ cấp cặp access/refresh token mới.
- Controller nên lấy user hiện tại qua `@CurrentUserId` thay vì inject `Jwt` trực tiếp.
- `PUT /users/me` giữ semantic cập nhật từng phần để tương thích ngược; `PATCH /users/me` là semantic rõ nghĩa hơn cho partial update.
- Số điện thoại được normalize trước khi lưu và trước khi check trùng.
- Avatar API thuộc `identity`, nhưng upload/confirm/delete dùng shared media services của `feature/media`.
- `Address` lưu `province_code`, `district_code`, `ward_code` dạng string; validate hierarchy nằm ở service layer.
- Location master-data được seed-if-empty khi khởi động; runtime chỉ đọc từ DB nội bộ.

## Phạm Vi Đã Hoàn Thành
- Auth APIs: `POST /api/v1/auth/login`, `/register`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`, `/refresh`, `/logout`
- User profile APIs: `GET/PUT/PATCH /api/v1/users/me`
- Avatar APIs:
  - `POST /api/v1/users/me/avatar/upload-intent`
  - `PUT /api/v1/users/me/avatar`
  - `DELETE /api/v1/users/me/avatar`
- Seller profile APIs: `GET/POST /api/v1/users/me/seller-profile`
- Address APIs: `GET/POST /api/v1/addresses`
- Public location APIs: `GET /api/v1/locations/provinces`, `/districts`, `/wards`

## Luật Nghiệp Vụ
- Một user chỉ có tối đa một seller profile.
- Muốn nâng cấp thành seller thì user phải có `phoneNumber` hợp lệ.
- Sau khi tạo seller profile, user cần đăng nhập lại để access token nhận claim role mới.
- Một user có thể có nhiều địa chỉ giao hàng.
- Nếu tạo địa chỉ mới với `isDefault = true`, các địa chỉ còn lại của user sẽ bị hạ xuống `false`.
- Avatar cũ không bị xóa đồng bộ ngay; nó bị detach trước rồi được mark `PENDING_DELETE` để cleanup bất đồng bộ.

## Giới Hạn Hiện Tại
- Chưa có brute-force protection cho `/auth/login`.
- Chưa có full integration test coverage cho toàn bộ identity flows.
- `mvnw.cmd` hiện lỗi trong môi trường local hiện tại; chạy Maven thường phải dùng `mvn`.

## Nhật Ký Refactor
### 2026-05-14 | Password Reset and Safe Mail Logging
- `AuthServiceImpl` giữ vai trò facade cho auth/session; logic reset mật khẩu được tách sang `PasswordResetService`.
- `IdentityTokenService` sở hữu tạo raw token và hash SHA-256 cho refresh token, email verification token, password reset token.
- `IdentityEmailService` sở hữu compose/gửi email verification/reset. Khi thiếu SMTP, log không được chứa raw token, reset link, hoặc verification link.
- `password_reset_tokens` chi luu `token_hash`, `expires_at`, `used_at`, `created_at`; schema hien tai khong co `updated_at`.
- Forgot-password trả response 200 chung cho email không tồn tại, user bị banned, và cooldown no-op để tránh dò email.
- Reset thành công cập nhật BCrypt password, đánh dấu token đã dùng, và revoke refresh tokens còn active.
- Auction read model lấy seller display/reputation qua `SellerSummaryQueryService`, không inject repository identity trực tiếp từ auction.

### 2026-04-18 | Avatar Ownership Belongs To Identity
- Chuyển `UserAvatarController` ra khỏi `feature/media` về `feature/identity`.
- Thêm `UserAvatarService` và `UserAvatarServiceImpl` để identity tự sở hữu avatar business flow.
- Giữ `feature/media` ở vai trò shared upload/confirm/delete layer, không cho media module chạm trực tiếp business rules của identity.

### 2026-04-06 | Profile Update Hardening
- Bổ sung `PATCH /users/me` cho partial update rõ nghĩa.
- Normalize số điện thoại Việt Nam trước khi lưu.
- Siết validation để reject payload rỗng hoặc sai kiểu dữ liệu.

### 2026-03-30 | Phase 1 Completion
- Hoàn thành auth APIs, current-user profile, seller profile, address APIs, location APIs.
- Thêm `@CurrentUserId` để controller không phải đọc JWT thủ công.
