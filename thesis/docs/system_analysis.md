# Phân tích hệ thống WoodCert Auction

## 1. Phạm vi và phương pháp khảo sát

- Thời điểm khảo sát: ngày 15/06/2026.
- Backend được khảo sát trong `woodcert-auction/`.
- Frontend được khảo sát trong `woodcert-auction-fe/`.
- Hạ tầng và quy trình phát hành được khảo sát từ `docker-compose.prod.yml`,
  `nginx-proxy.conf`, `.github/workflows/ci.yml`,
  `.github/workflows/release-production.yml`, `scripts/deploy-production.sh`,
  `DEPLOY.md` và `CI_CD.md`.
- Schema được xác định theo Flyway trong
  `woodcert-auction/src/main/resources/db/migration/`; entity và repository chỉ
  được dùng để đối chiếu cách ánh xạ và truy cập dữ liệu.
- Không đọc `.env.prod`, không thực hiện thao tác lên production và không thay đổi
  source code hoặc cấu hình hệ thống.

Tài liệu này là hồ sơ phân tích codebase, chưa phải nội dung chương của báo cáo đồ
án. Các tài liệu trạng thái và ADR được dùng làm nguồn phụ; khi có mâu thuẫn, kết
luận ưu tiên code, migration, cấu hình và kết quả test hiện tại theo quy tắc trong
`AGENTS.md`.

## 2. Mục tiêu và phạm vi hệ thống

WoodCert Auction là nền tảng đấu giá trực tuyến cho sản phẩm gỗ mỹ nghệ. Hệ thống
bao phủ chuỗi nghiệp vụ từ tạo sản phẩm, kiểm định và cấp mã chứng thư, mở phiên
đấu giá, ký quỹ và đặt giá theo thời gian thực, tạo đơn hàng cho người thắng,
thanh toán phần còn lại, giao nhận, quyết toán cho người bán và giải quyết tranh
chấp. Căn cứ: các package nghiệp vụ trong
`woodcert-auction/src/main/java/com/woodcert/auction/feature/`, route frontend tại
`woodcert-auction-fe/src/app/router/routes.tsx` và trạng thái hiện hành tại
`woodcert-auction/docs/PROJECT-STATUS.md`.

Phạm vi marketplace công khai được đặt tại module đấu giá, không phải API sản phẩm
chung. `GET /api/v1/products` và `GET /api/v1/products/{id}` phục vụ luồng nội bộ
của người bán và kiểm định viên; người mua duyệt sản phẩm qua
`GET /api/v1/auctions` và `GET /api/v1/auctions/{id}`. Căn cứ:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/catalog/controller/ProductController.java`,
`woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/controller/AuctionController.java`
và `woodcert-auction/src/main/java/com/woodcert/auction/feature/catalog/CONTEXT.md`.

Hệ thống hiện không có một sổ cái escrow độc lập. Tiền được quản lý bằng số dư khả
dụng và số dư đóng băng trong ví, các bản ghi giao dịch ví, operation key chống
lặp, cùng snapshot tài chính trên đơn hàng. Căn cứ:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/finance/entity/Wallet.java`,
`WalletTransaction.java`, `WalletOperation.java` và
`woodcert-auction/src/main/java/com/woodcert/auction/feature/order/entity/OrderEntity.java`.

## 3. Kiến trúc tổng thể

### 3.1 Kiểu kiến trúc

Backend là một **modular monolith** Spring Boot, tổ chức theo package chức năng.
Các module chạy trong cùng một tiến trình và cùng một schema MySQL, nhưng có phân
chia trách nhiệm và một số port/adapter nội bộ giữa auction, order, fulfillment
và dispute. Đây không phải kiến trúc microservices. Căn cứ:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/`,
`woodcert-auction/src/main/java/com/woodcert/auction/feature/order/service/source/`
và `woodcert-auction/docs/decisions/ADR-004_modular_monolith_architecture.md`.

Frontend là một React single-page application tách riêng, tổ chức feature-first.
Route của từng feature được ghép tại application router; các cổng public, seller,
appraiser và admin có guard/layout riêng. Căn cứ:
`woodcert-auction-fe/src/app/router/routes.tsx`,
`woodcert-auction-fe/src/features/` và
`woodcert-auction-fe/docs/ARCHITECTURE.md`.

### 3.2 Thành phần triển khai

| Lớp | Thành phần hiện tại | Căn cứ |
|---|---|---|
| Giao diện | React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Axios, React Hook Form/Zod, Tailwind CSS, Radix UI | `woodcert-auction-fe/package.json` |
| API | Spring Boot 3.5.15, Java 17, Spring Web, Validation, Security, OAuth2 Resource Server | `woodcert-auction/pom.xml` |
| Realtime | Spring WebSocket/STOMP, SockJS/STOMP client, topic theo phiên đấu giá | `woodcert-auction/src/main/java/com/woodcert/auction/core/config/WebSocketConfig.java`, `woodcert-auction-fe/src/shared/realtime/useAuctionTopic.ts` |
| Dữ liệu bền vững | MySQL 8, Spring Data JPA, Hibernate `ddl-auto=validate`, Flyway | `woodcert-auction/src/main/resources/application.yaml`, `docker-compose.prod.yml` |
| Trạng thái runtime | Redis 7.4 với AOF cho đấu giá ACTIVE và chống brute-force đăng nhập | `docker-compose.prod.yml`, `AuctionRedisService.java`, `LoginAttemptService.java` |
| Media | Cloudinary qua signed upload intent, confirm metadata và cleanup định kỳ | `woodcert-auction/src/main/java/com/woodcert/auction/feature/media/` |
| Thanh toán nạp ví | VNPay Sandbox, checksum HMAC-SHA512, Return/IPN callback | `woodcert-auction/src/main/java/com/woodcert/auction/feature/finance/service/VnPayServiceImpl.java` |
| Email | SMTP cho xác thực email và đặt lại mật khẩu | `woodcert-auction/src/main/java/com/woodcert/auction/feature/identity/service/IdentityEmailService.java` |
| Reverse proxy | Nginx host cho HTTPS/API/WebSocket và Nginx container phục vụ SPA | `nginx-proxy.conf`, `woodcert-auction-fe/nginx.conf` |
| Container | MySQL, Redis, backend và frontend trong Docker Compose | `docker-compose.prod.yml` |

### 3.3 Luồng giao tiếp chính

Trình duyệt gọi REST qua `/api/v1`, duy trì access token trong bộ nhớ frontend và
refresh token bằng cookie HttpOnly. Giá đấu trực tiếp được nhận qua
`/ws-auction` và `/topic/auctions/{auctionId}`, sau đó frontend đối soát lại bằng
REST/TanStack Query. Căn cứ:
`woodcert-auction-fe/src/shared/api/client.ts`,
`woodcert-auction-fe/src/shared/realtime/useAuctionTopic.ts`,
`woodcert-auction/src/main/java/com/woodcert/auction/core/config/SecurityConfig.java`
và `AuctionBroadcastService.java`.

## 4. Actor và mô hình quyền

### 4.1 Actor người dùng

| Actor | Vai trò và khả năng chính | Căn cứ |
|---|---|---|
| Khách chưa đăng nhập | Xem trang công khai, danh sách/chi tiết đấu giá, danh mục và tra cứu chứng thư | `SecurityConfig.java`, `woodcert-auction-fe/src/features/auction/routes.tsx`, `woodcert-auction-fe/src/features/certificate/routes.tsx` |
| Bidder/Buyer | Tài khoản mặc định sau đăng ký; quản lý hồ sơ/địa chỉ/ví, tham gia đấu giá, đặt giá, thanh toán, nhận hàng và mở tranh chấp | `V2__seed_reference_data.sql`, `AuthServiceImpl.java`, `AuctionController.java`, `OrderController.java` |
| Seller | Bidder đã tạo seller profile và có thêm `ROLE_SELLER`; tạo sản phẩm, gửi kiểm định, mở phiên, giao hàng và xem doanh thu | `SellerProfileServiceImpl.java`, `ProductController.java`, `AuctionController.java`, `FulfillmentController.java` |
| Appraiser | Nhận, trả và xử lý yêu cầu kiểm định; tài khoản được admin cấp | `AdminAppraiserController.java`, `AppraisalController.java`, `AppraisalServiceImpl.java` |
| Admin | Quản lý người dùng, capability, kiểm định viên, danh mục, doanh thu, audit log và tranh chấp | `AdminUserController.java`, `AdminCategoryController.java`, `PlatformRevenueController.java`, `DisputeController.java` |

Một người dùng thông thường có thể đồng thời có `ROLE_BIDDER` và `ROLE_SELLER`;
seller không phải một loại tài khoản tách biệt. Căn cứ:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/identity/service/SellerProfileServiceImpl.java`
và quan hệ role trong
`woodcert-auction/src/main/java/com/woodcert/auction/feature/identity/entity/User.java`.

### 4.2 Role, permission và capability

Flyway seed bốn role: `ROLE_BIDDER`, `ROLE_SELLER`, `ROLE_APPRAISER`,
`ROLE_ADMIN`; đồng thời seed 13 permission nghiệp vụ. Căn cứ:
`woodcert-auction/src/main/resources/db/migration/V2__seed_reference_data.sql`.

Backend không chỉ tin permission đã ghi trong JWT. Mỗi request hợp lệ lấy quyền
hiệu lực từ database và loại bỏ permission tương ứng nếu capability BUYER,
SELLER hoặc APPRAISER đang bị khóa. Trạng thái tài khoản ACTIVE cũng được kiểm
tra lại khi xác thực JWT. Căn cứ:
`woodcert-auction/src/main/java/com/woodcert/auction/core/security/EffectivePermissionServiceImpl.java`,
`DbAwareJwtAuthoritiesConverter.java` và `ActiveUserJwtValidator.java`.

Frontend giải mã claim để điều khiển giao diện và route guard, nhưng đây chỉ là
lớp trải nghiệm; quyết định bảo mật cuối cùng nằm ở backend. Căn cứ:
`woodcert-auction-fe/src/app/router/AdminPortalGuard.tsx`,
`AppraiserPortalGuard.tsx`, `SellerPortalGuard.tsx` và
`woodcert-auction-fe/src/shared/auth/`.

### 4.3 Actor hệ thống và hệ thống bên ngoài

| Actor | Vai trò trong hệ thống | Căn cứ |
|---|---|---|
| Auction scheduler | Kích hoạt, kết thúc và sửa settlement/order bị thiếu | `woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/service/AuctionSessionScheduler.java` |
| Order payment scheduler | Hủy order quá hạn thanh toán và chia tiền cọc | `woodcert-auction/src/main/java/com/woodcert/auction/feature/order/service/OrderPaymentScheduler.java` |
| Fulfillment scheduler | Tự hoàn tất shipment quá hạn nếu không có dispute | `woodcert-auction/src/main/java/com/woodcert/auction/feature/fulfillment/service/FulfillmentScheduler.java` |
| Media cleanup job | Thu hồi upload dở dang, asset mồ côi và asset chờ xóa | `woodcert-auction/src/main/java/com/woodcert/auction/feature/media/job/MediaCleanupJob.java` |
| VNPay Sandbox | Nhận yêu cầu nạp ví và gửi Return/IPN callback có chữ ký | `woodcert-auction/src/main/java/com/woodcert/auction/feature/finance/service/VnPayServiceImpl.java` |
| Cloudinary | Lưu media, cung cấp metadata và API xóa asset | `woodcert-auction/src/main/java/com/woodcert/auction/feature/media/service/CloudinaryApiService.java` |
| SMTP server | Gửi email xác thực và đặt lại mật khẩu | `woodcert-auction/src/main/java/com/woodcert/auction/feature/identity/service/IdentityEmailService.java` |
| API địa giới | Cung cấp dữ liệu tỉnh/huyện/xã cho bước seed/đồng bộ | `woodcert-auction/src/main/java/com/woodcert/auction/feature/identity/service/seed/LocationSeedService.java` |
| GitHub Actions và deploy operator | Test, build image, phát hành, triển khai và rollback | `.github/workflows/ci.yml`, `.github/workflows/release-production.yml`, `scripts/deploy-production.sh` |

## 5. Danh sách module chức năng

| Module | Trách nhiệm chính | Frontend liên quan |
|---|---|---|
| `core` | DTO chung, exception, security, JWT, WebSocket, thời gian hệ thống | shared API/auth/realtime |
| `identity` | Auth, session, RBAC, user, seller profile, địa chỉ, địa giới, quản trị tài khoản | auth, account, admin |
| `media` | Upload intent, xác nhận, metadata, URL và cleanup Cloudinary | account, seller, appraisal, dispute |
| `catalog` | Danh mục, sản phẩm, ảnh, kiểm định, chứng thư | seller, appraisal, certificate |
| `finance` | Ví, giao dịch, idempotency, VNPay, doanh thu nền tảng | wallet, admin revenue |
| `auction` | Phiên, đăng ký, bid, Redis runtime, realtime, settlement | auction, bidding, buyer, seller |
| `order` | Đơn sau đấu giá, thanh toán, quá hạn, payout/refund và snapshot | order, buyer, seller |
| `fulfillment` | Giao hàng, nhận hàng và tự hoàn tất | order, buyer, seller |
| `dispute` | Hồ sơ tranh chấp, bằng chứng, hội thoại và quyết định admin | dispute, order, admin |
| Hạ tầng | Build, container, proxy, CI/CD, backup, deploy và rollback | Không phải module giao diện |

Căn cứ cho danh sách module backend:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/`. Căn cứ cho feature
frontend: `woodcert-auction-fe/src/features/`.

## 6. Phân tích từng module

### 6.1 Core và bảo mật nền tảng

- **Mục đích:** cung cấp response/error chung, JWT HS512, xác thực user ACTIVE,
  permission động, CORS, method security, WebSocket/STOMP và API thời gian server.
- **Đối tượng sử dụng:** mọi module backend và toàn bộ frontend.
- **Luồng chính:** request REST mang bearer token; resource server xác minh chữ ký,
  trạng thái user và tải permission hiệu lực từ database trước khi chạy
  `@PreAuthorize`.
- **API:** `GET /api/v1/system/time`; endpoint WebSocket `/ws-auction`.
- **Dữ liệu:** đọc `users`, `user_roles`, `roles`, `role_permissions`,
  `permissions`, `user_capability_statuses`.
- **Event:** STOMP topic `/topic/auctions/{id}`.
- **Kiểm thử:** có test resolver, exception, JWT validator, permission service và
  integration security trong `woodcert-auction/src/test/java/com/woodcert/auction/core/`
  và `woodcert-auction/src/test/java/com/woodcert/auction/integration/AuctionSecurityIntegrationTest.java`.
- **Mức độ chắc chắn:** Cao; code rõ và test hiện tại chạy đạt.
- **Xác minh an toàn:** chạy `.\mvnw.cmd -B -ntp test` trong
  `woodcert-auction/`; gọi `GET /api/v1/system/time` trên môi trường local.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/core/config/SecurityConfig.java`,
`woodcert-auction/src/main/java/com/woodcert/auction/core/config/WebSocketConfig.java`,
`woodcert-auction/src/main/java/com/woodcert/auction/core/security/` và
`woodcert-auction/src/main/java/com/woodcert/auction/core/controller/SystemTimeController.java`.

### 6.2 Identity

- **Mục đích:** quản lý vòng đời tài khoản, xác thực email, đăng nhập, refresh và
  logout, đặt lại mật khẩu, hồ sơ, avatar, seller profile, địa chỉ, địa giới hành
  chính, khóa tài khoản/capability và audit log.
- **Đối tượng sử dụng:** khách, bidder, seller, appraiser và admin.
- **Luồng chính:** đăng ký tạo user `UNVERIFIED` với `ROLE_BIDDER`; email token
  được hash trước khi lưu; xác thực chuyển user sang `ACTIVE`; đăng nhập tạo access
  JWT và refresh token đã hash; refresh thực hiện rotation; reset mật khẩu thu hồi
  refresh token cũ.
- **API chính:** `/api/v1/auth/**`, `/api/v1/users/me`,
  `/api/v1/users/me/avatar`, `/api/v1/users/me/seller-profile`,
  `/api/v1/addresses`, `/api/v1/locations/**`, `/api/v1/admin/users`,
  `/api/v1/admin/appraisers`, `/api/v1/admin/audit-logs`.
- **Service chính:** `AuthServiceImpl`, `LoginAttemptService`,
  `SellerProfileServiceImpl`, `AdminUserServiceImpl`,
  `AdminAppraiserServiceImpl`, `AddressServiceImpl` và
  `IdentityEmailService`.
- **Bảng:** `users`, `roles`, `permissions`, `user_roles`,
  `role_permissions`, `refresh_tokens`, `email_verification_tokens`,
  `password_reset_tokens`, `seller_profiles`, `addresses`, `provinces`,
  `districts`, `wards`, `user_capability_statuses`, `admin_audit_logs`.
- **Redis:** `auth:failed_attempts:{normalizedEmail}` và
  `auth:locked:{normalizedEmail}`. Khi Redis lỗi, kiểm tra brute-force fail-open
  và ghi log, không khóa toàn bộ đăng nhập.
- **Tích hợp ngoài:** SMTP, API địa giới Việt Nam và Cloudinary cho avatar.
- **Kiểm thử:** có test service/controller/security trong
  `woodcert-auction/src/test/java/com/woodcert/auction/feature/identity/`; full
  backend suite hiện đạt.
- **Mức độ chắc chắn:** Cao.
- **Xác minh an toàn:** dùng database local/test để chạy luồng register,
  verify-email, login, refresh, profile và address; không dùng email hay tài khoản
  production.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/identity/`,
`V1__baseline_schema.sql`, `V2__seed_reference_data.sql` và
`woodcert-auction-fe/src/features/auth/`, `account/`, `admin/`.

### 6.3 Media

- **Mục đích:** làm nguồn metadata chung cho avatar, ảnh sản phẩm, ảnh kiểm định
  và bằng chứng tranh chấp.
- **Đối tượng sử dụng:** identity, catalog/appraisal và dispute; frontend upload
  trực tiếp lên Cloudinary bằng intent backend cấp.
- **Luồng chính:** backend tạo `media_assets` ở trạng thái `PENDING`, ký intent;
  frontend upload lên Cloudinary; backend tra metadata provider bằng `assetId`,
  kiểm tra `publicId`, resource type và kích thước rồi chuyển sang `ACTIVE`.
- **API:** không có controller media tổng quát; endpoint intent/confirm được đặt
  trong avatar, product image, appraisal image và dispute evidence controller.
- **Service:** `MediaAssetService`, `CloudinaryApiService`,
  `CloudinarySignatureService`, `MediaCleanupJob`.
- **Bảng:** `media_assets`; được tham chiếu bởi user avatar, product image,
  appraisal image và dispute evidence.
- **Job:** mặc định mỗi 6 giờ đánh dấu upload PENDING quá hạn, asset ACTIVE mồ côi
  và xóa bất đồng bộ trên Cloudinary.
- **Tích hợp ngoài:** Cloudinary.
- **Giới hạn:** `SHIPMENT_PACKING_VIDEO` có enum và giới hạn upload nhưng chưa có
  luồng nghiệp vụ/controller sử dụng.
- **Kiểm thử:** có test trong
  `woodcert-auction/src/test/java/com/woodcert/auction/feature/media/`; các feature
  frontend có test upload intent/confirm riêng.
- **Mức độ chắc chắn:** Cao với ảnh hiện tại (tích hợp Cloudinary hoạt động thực tế trên production theo xác nhận của người dùng); Thấp đối với video đóng gói vì chỉ là khả năng dự trữ.
- **Xác minh an toàn:** chạy unit test; với Cloudinary thử nghiệm trên credential test hoặc production theo cấu hình.
  credential, không dùng asset production.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/media/`,
`woodcert-auction-fe/src/shared/lib/cloudinaryUpload.ts` và
`woodcert-auction/src/main/resources/application.yaml`.

### 6.4 Catalog, sản phẩm, kiểm định và chứng thư

- **Mục đích:** quản lý danh mục, bản nháp sản phẩm, ảnh sản phẩm, yêu cầu kiểm
  định, claim kiểm định, báo cáo bất biến và tra cứu chứng thư.
- **Đối tượng sử dụng:** seller, appraiser, admin và khách tra cứu chứng thư.
- **Luồng chính:** seller tạo `DRAFT`, cập nhật ảnh và gửi kiểm định; sản phẩm
  chuyển `PENDING_APPRAISAL`; appraiser claim sang `UNDER_APPRAISAL`; submit báo
  cáo tạo `appraisal_reports`, mã `CERT-{year}-{id}`, integrity hash SHA-256 và
  chuyển sản phẩm sang `APPRAISED` hoặc `REJECTED`.
- **API chính:** `/api/v1/categories`, `/api/v1/products`,
  `/api/v1/products/{id}/submit-appraisal`,
  `/api/v1/products/{id}/appraisal-claim`,
  `/api/v1/products/{id}/appraise`,
  `/api/v1/appraisals/images/**`, `/api/v1/certificates/{code}`,
  `/api/v1/admin/categories`.
- **Service chính:** `ProductServiceImpl`, `AppraisalServiceImpl`,
  `CertificateServiceImpl`, `CategoryServiceImpl`.
- **Bảng:** `categories`, `products`, `product_images`,
  `appraisal_reports`, `appraisal_images`, cùng `media_assets`.
- **Tích hợp ngoài:** Cloudinary cho ảnh.
- **Kiểm thử:** test tại
  `woodcert-auction/src/test/java/com/woodcert/auction/feature/catalog/` và
  frontend tại `woodcert-auction-fe/src/features/seller/`,
  `appraisal/`, `certificate/`.
- **Mức độ chắc chắn:** Cao.
- **Xác minh an toàn:** chạy test; trên local tạo sản phẩm, submit, claim và
  appraise bằng tài khoản seed/test.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/catalog/`,
`V1__baseline_schema.sql` và các API frontend tương ứng trong
`woodcert-auction-fe/src/features/seller/api/` và `appraisal/api/`.

### 6.5 Finance

- **Mục đích:** quản lý số dư ví, số dư đóng băng, lịch sử giao dịch, operation
  chống lặp, nạp tiền VNPay và doanh thu nền tảng.
- **Đối tượng sử dụng:** bidder/buyer, seller và admin.
- **Luồng chính:** VNPay callback hợp lệ ghi nhận deposit rồi cộng ví; đăng ký đấu
  giá chuyển available sang frozen; settlement hoàn/refund hoặc capture tiền cọc;
  order trừ phần còn lại; hoàn tất đơn ghi payout và commission; tranh chấp có thể
  hoàn tiền.
- **API:** `/api/v1/wallets/me`,
  `/api/v1/wallets/me/transactions`, `/api/v1/wallets/me/deposit`,
  `/api/v1/wallets/me/deposits`, `/api/v1/wallets/vnpay/return`,
  `/api/v1/wallets/vnpay/ipn`, `/api/v1/admin/revenue`.
- **Service:** `WalletServiceImpl`, `WalletOperationLifecycleService`,
  `VnPayServiceImpl`, `PlatformRevenueServiceImpl`.
- **Bảng:** `wallets`, `wallet_transactions`, `wallet_operations`,
  `vnpay_deposits`, `platform_revenue_transactions`.
- **Tích hợp ngoài:** VNPay Sandbox.
- **Đảm bảo kỹ thuật:** operation key chống thực thi lặp; wallet dùng optimistic
  locking; transaction nghiệp vụ dùng reference type/id.
- **Kiểm thử:** test tại
  `woodcert-auction/src/test/java/com/woodcert/auction/feature/finance/`; các luồng
  wallet cũng được sử dụng trong auction/order integration test.
- **Mức độ chắc chắn:** Cao đối với logic và Sandbox contract; Trung bình đối với
  vận hành ngoài thực tế vì browser acceptance với credential thật vẫn được ghi
  là đang thực hiện.
- **Xác minh an toàn:** chạy test; chỉ dùng VNPay Sandbox và tài khoản test.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/finance/`,
`woodcert-auction-fe/src/features/wallet/` và
`woodcert-auction/docs/PROJECT-STATUS.md`.

### 6.6 Auction

- **Mục đích:** quản lý phiên đấu giá, đăng ký và rút tham gia, đặt giá atomic,
  anti-sniper, realtime, kết thúc phiên, xác định kết quả và settlement tiền cọc.
- **Đối tượng sử dụng:** khách, bidder/buyer, seller và scheduler.
- **Luồng chính:** seller tạo phiên `WAITING`; scheduler nạp Redis rồi chuyển
  `ACTIVE`; bidder đã đóng băng cọc đặt giá qua Lua; scheduler kết thúc thành
  `ENDED_SUCCESS` nếu có highest bid hợp lệ đạt reserve, ngược lại
  `ENDED_FAILED`.
- **API:** `/api/v1/auctions` và các nhánh `/me`,
  `/my-participations`, `/{id}/my-participation`, `/{id}/bids`,
  `/{id}/register`, `/{id}/withdraw`, `/{id}/cancel`; đặt giá qua
  `POST /api/v1/bids`.
- **Service:** `AuctionCommandService`, `AuctionQueryService`,
  `BuyerAuctionQueryService`, `BidServiceImpl`, `AuctionRedisService`,
  `AuctionSessionLifecycleWorker`, `AuctionSettlementService`,
  `AuctionSessionScheduler`, `AuctionBroadcastService`.
- **Bảng:** `auction_sessions`, `auction_participants`, `bids`; liên quan
  `products`, wallet và order.
- **Redis:** `auction:session:{id}:state` và
  `auction:session:{id}:bidders`.
- **Event:** `SESSION_ACTIVATED`, `NEW_BID`, `SESSION_ENDED` trên
  `/topic/auctions/{id}`.
- **Quy tắc chính:** start trước ít nhất 5 phút; thời lượng từ 1 giờ đến 30 ngày;
  step tối thiểu 100.000; cọc tối thiểu 1.000.000 và không quá 50% starting
  price; seller không được bid sản phẩm của mình.
- **Kiểm thử:** unit test và 23 test integration chuyên Redis/Lua/runtime/security
  trong `woodcert-auction/src/test/java/com/woodcert/auction/feature/auction/`
  và `woodcert-auction/src/test/java/com/woodcert/auction/integration/`.
- **Mức độ chắc chắn:** Cao.
- **Xác minh an toàn:** chạy backend suite với Docker; dùng database/Redis local
  để tạo phiên ngắn trong test, không thử trên production.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/`,
`AUCTION_RUNTIME_INVARIANTS.md`, `AuctionPolicy.java` và
`woodcert-auction-fe/src/features/auction/`, `bidding/`, `buyer/`.

### 6.7 Order

- **Mục đích:** lưu hợp đồng thương mại sau đấu giá và điều phối thanh toán, quá
  hạn, payout, commission, refund và callback về nguồn auction.
- **Đối tượng sử dụng:** buyer, seller, auction settlement, fulfillment, dispute
  và scheduler.
- **Luồng chính:** auction thành công tạo order `PENDING_PAYMENT`; deposit đã
  capture được trừ khỏi final price; buyer chọn địa chỉ và trả remaining amount;
  order chuyển `PAID`; quá hạn 72 giờ thì bị `CANCELED`, tiền cọc được chia cho
  seller và nền tảng.
- **API:** `/api/v1/orders/{id}/pay`, `/api/v1/orders/{id}`,
  `/api/v1/orders/my-purchases`, `/my-sales`, status counts và sales summary.
- **Service:** `OrderServiceImpl`, `OrderPaymentScheduler`,
  `OrderFeeCalculator`, `OrderRefundCalculator`, các source adapter và
  fulfillment port.
- **Bảng:** `orders`; lưu snapshot sản phẩm, địa chỉ giao hàng, giá, cọc,
  commission, payout, forfeiture và refund.
- **Tài chính:** commission hiện là 5% đến 50 triệu, 4% trên 50 đến 200 triệu và
  3% trên 200 triệu.
- **Kiểm thử:** test tại
  `woodcert-auction/src/test/java/com/woodcert/auction/feature/order/`; luồng tạo
  order được bao phủ trong auction integration test.
- **Mức độ chắc chắn:** Cao.
- **Xác minh an toàn:** chạy test; trên local kiểm tra order được tạo sau
  settlement và thử payment bằng số dư test.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/order/service/OrderServiceImpl.java`,
`OrderFeeCalculator.java`, `OrderController.java` và `OrderEntity.java`.

### 6.8 Fulfillment

- **Mục đích:** tách trạng thái vận chuyển khỏi order, cho seller xác nhận giao,
  buyer xác nhận nhận và scheduler tự hoàn tất.
- **Đối tượng sử dụng:** seller, buyer, order, dispute và scheduler.
- **Luồng chính:** order `PAID` tạo fulfillment `PENDING_SHIPMENT`; seller ship
  làm order `FULFILLING` và fulfillment `SHIPPED`; buyer nhận hàng hoặc scheduler
  quá hạn sẽ hoàn tất order, payout seller và ghi commission.
- **API:** `PATCH /api/v1/orders/{orderId}/fulfillment/ship` và
  `/receive`.
- **Service:** `FulfillmentServiceImpl`, `FulfillmentScheduler`,
  `FulfillmentOrderPortAdapter`, `FulfillmentDisputePortAdapter`.
- **Bảng:** `order_fulfillments`.
- **Cấu hình hiện tại:** tự hoàn tất sau 168 giờ, scheduler chạy mỗi 5 phút và bỏ
  qua order `DISPUTED`.
- **Giới hạn:** chưa có upload video đóng gói.
- **Kiểm thử:** test tại
  `woodcert-auction/src/test/java/com/woodcert/auction/feature/fulfillment/`.
- **Mức độ chắc chắn:** Cao (Đã thống nhất sử dụng con số 168 giờ theo cấu hình code thực tế, tài liệu cũ ghi 72 giờ đã lỗi thời).
- **Xác minh an toàn:** chạy test scheduler/service; trên local có thể điều chỉnh
  biến thời gian trong profile test.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/fulfillment/`,
`woodcert-auction/src/main/resources/application.yaml` và
`woodcert-auction-fe/src/features/fulfillment/api/fulfillmentApi.ts`.

### 6.9 Dispute

- **Mục đích:** cho buyer mở khiếu nại sau khi seller đã giao hàng, lưu bằng
  chứng/hội thoại và cho admin ra quyết định.
- **Đối tượng sử dụng:** buyer, seller là participant đọc/phản hồi, admin và
  order/fulfillment.
- **Luồng chính:** buyer có order `FULFILLING` và fulfillment `SHIPPED` tải ít
  nhất một ảnh bằng chứng rồi mở case `OPEN`; các bên nhắn tin; admin chuyển
  `UNDER_REVIEW` và quyết định `SELLER_WINS` hoặc `BUYER_WINS`.
- **API:** `/api/v1/disputes/evidence/**`,
  `/api/v1/orders/{orderId}/disputes/**` và
  `/api/v1/admin/disputes/**`.
- **Service:** `DisputeServiceImpl`, dispute repositories, media service,
  order service và fulfillment port.
- **Bảng:** `dispute_cases`, `dispute_evidence`, `dispute_messages`.
- **Kết quả:** seller thắng thì hoàn tất order và payout; buyer thắng thì hoàn
  cả deposit và remaining amount, hủy order, đánh dấu fulfillment canceled và
  đưa product sang `RETURNED`.
- **Giới hạn:** chỉ hỗ trợ kết quả toàn phần, chưa có partial refund.
- **Kiểm thử:** test tại
  `woodcert-auction/src/test/java/com/woodcert/auction/feature/dispute/` và
  frontend tại `woodcert-auction-fe/src/features/dispute/`.
- **Mức độ chắc chắn:** Cao.
- **Xác minh an toàn:** chạy test; dùng order local ở trạng thái SHIPPED để thử cả
  hai outcome.

Căn cứ chính:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/dispute/service/DisputeServiceImpl.java`,
`woodcert-auction/src/main/java/com/woodcert/auction/feature/order/service/OrderServiceImpl.java`,
`V4__add_dispute_conversation.sql`.

### 6.10 Thông báo và truyền thông

Không có module notification lưu bền, bảng notification hoặc API inbox. Hệ thống
hiện có ba cơ chế truyền thông: email xác thực/reset, broadcast đấu giá STOMP và
toast cục bộ trong frontend. Thông báo winner/loser lưu bền được ghi là deferred.
Căn cứ:
`IdentityEmailService.java`, `AuctionBroadcastService.java`,
`woodcert-auction-fe/src/shared/ui/notification.tsx` và
`woodcert-auction/docs/PROJECT-STATUS.md`.

Mức độ chắc chắn: Cao. Cách xác minh an toàn: tìm kiếm entity/controller
notification và chạy luồng realtime/email trên môi trường local/test.

## 7. Các luồng nghiệp vụ chính

### 7.1 Đăng ký và đăng nhập

1. Khách đăng ký; backend chuẩn hóa email, kiểm tra trùng và tạo user
   `UNVERIFIED` với `ROLE_BIDDER`.
2. Token xác thực email được hash trong database; SMTP gửi liên kết.
3. Xác thực email chuyển user sang `ACTIVE`.
4. Login kiểm tra Redis brute-force, password và trạng thái user.
5. Backend trả access JWT và đặt refresh token trong cookie HttpOnly.

Căn cứ:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/identity/service/AuthServiceImpl.java`,
`LoginAttemptService.java`, `AuthController.java` và
`woodcert-auction-fe/src/features/auth/api/auth.ts`.

### 7.2 Xác thực và phân quyền

Access JWT được xác minh HS512 và kiểm tra user còn ACTIVE. Permission hiệu lực
được truy vấn từ role/permission hiện tại trong MySQL; capability bị ban sẽ loại
bỏ nhóm quyền tương ứng ngay cả khi token cũ còn claim. Refresh/logout dùng
double-submit CSRF qua `GET /auth/csrf` và `X-XSRF-TOKEN`. Căn cứ:
`SecurityConfig.java`, `ActiveUserJwtValidator.java`,
`EffectivePermissionServiceImpl.java`,
`woodcert-auction-fe/src/shared/api/client.ts`.

### 7.3 Quản lý người dùng

User tự sửa profile/avatar/address; bidder có thể tạo seller profile để nhận
`ROLE_SELLER`. Admin có thể tạo appraiser, khóa toàn tài khoản hoặc khóa capability
BUYER/SELLER/APPRAISER và lưu audit log. Căn cứ:
`UserController.java`, `SellerProfileController.java`,
`AdminAppraiserController.java`, `AdminUserController.java`,
`AdminAuditLog.java`.

### 7.4 Sản phẩm gỗ và chứng nhận

Seller tạo bản nháp và ảnh, gửi yêu cầu kiểm định; appraiser claim, kiểm tra bằng
chứng và nộp báo cáo. Sản phẩm hợp lệ nhận certificate code và integrity hash,
sau đó mới đủ điều kiện mở đấu giá. Căn cứ:
`ProductServiceImpl.java`, `AppraisalServiceImpl.java`,
`CertificateController.java`, `ProductStatus.java`.

### 7.5 Tạo và quản lý phiên đấu giá

Seller chỉ tạo phiên cho sản phẩm do mình sở hữu, đã `APPRAISED` và đang
`AVAILABLE`; mỗi sản phẩm chỉ có một phiên mở `WAITING`/`ACTIVE` tại một thời
điểm. Seller chỉ được hủy khi phiên còn `WAITING`. Căn cứ:
`AuctionCommandService.java`, `AuctionPolicy.java`,
`AuctionSessionRepository.java`.

### 7.6 Tham gia và đặt giá

Đăng ký khóa participant row phù hợp, đóng băng deposit trong ví và tạo
`AuctionParticipant(FROZEN)`. Nếu phiên đã ACTIVE, bidder được thêm atomically
vào Redis. Bid chỉ được chấp nhận khi còn thời gian, bidder đã đăng ký, không phải
seller/highest bidder và giá đạt current price cộng step. Căn cứ:
`AuctionCommandService.java`, `WalletServiceImpl.java`,
`BidLuaScript.java`, `BidServiceImpl.java`.

### 7.7 Cập nhật giá theo thời gian thực

Lua cập nhật hash Redis atomically. Bid trong 30 giây cuối kéo dài thêm 60 giây.
Backend broadcast `NEW_BID`; frontend cập nhật màn hình và refetch REST khi kết
nối/reconnect. Căn cứ:
`BidLuaScript.java`, `AuctionBroadcastService.java`,
`woodcert-auction-fe/src/features/bidding/hooks/useBiddingRoom.ts`.

### 7.8 Kết thúc phiên và xác định người thắng

Scheduler khóa session ACTIVE đến hạn, lấy snapshot Redis; nếu Redis thiếu thì
fallback DB snapshot/bid audit. Phiên thành công khi có highest bid hợp lệ đạt
reserve; winner deposit được capture, loser được refund, product chuyển
`PENDING_ORDER`, rồi order được tạo tự động. Căn cứ:
`AuctionSessionLifecycleWorker.java`, `AuctionSettlementService.java`,
`AuctionParticipantSettlementService.java`,
`AuctionOrderSourceAdapter.java`.

### 7.9 Thanh toán và giao dịch

Winner trả phần còn lại trước deadline 72 giờ. Sau khi thanh toán, seller giao
hàng; buyer nhận hoặc scheduler tự hoàn tất sau 168 giờ. Hoàn tất đơn ghi payout
seller và commission nền tảng. Quá hạn thanh toán tịch thu deposit theo tỷ lệ 90%
seller, 10% nền tảng theo cấu hình hiện tại. Căn cứ:
`OrderServiceImpl.java`, `OrderProperties.java`, `FulfillmentServiceImpl.java`,
`FinanceProperties.java`, `application.yaml`.

### 7.10 Thông báo

Email chỉ phục vụ identity; sự kiện phiên/bid phục vụ realtime; toast phục vụ phản
hồi tức thời trên trình duyệt. Chưa có stored notification cho winner/loser hoặc
notification center. Căn cứ: `IdentityEmailService.java`,
`AuctionBroadcastService.java`, `notification.tsx`,
`woodcert-auction/docs/PROJECT-STATUS.md`.

### 7.11 Khiếu nại và xử lý vi phạm

Buyer mở tranh chấp khi hàng đang SHIPPED và phải có ảnh bằng chứng. Buyer, seller
và admin có thể trao đổi trong case; admin quyết định toàn phần. Vi phạm tài khoản
được xử lý bằng ban toàn user hoặc ban capability, có lý do và audit log. Căn cứ:
`DisputeServiceImpl.java`, `AdminUserServiceImpl.java`,
`AdminAuditLogService.java`.

## 8. Schema Flyway và đối chiếu entity

### 8.1 Migration hiện tại

- `V1__baseline_schema.sql`: baseline chính, tạo 33 bảng ban đầu.
- `V2__seed_reference_data.sql`: role, permission, mapping và 10 category.
- `V3__seed_demo_users.sql`: tài khoản admin/appraiser demo bằng password hash
  placeholder.
- `V4__add_dispute_conversation.sql`: thêm `dispute_messages` và liên kết evidence
  với message.

Tổng schema hiện tại là **34 bảng**. Căn cứ:
`woodcert-auction/src/main/resources/db/migration/V1__baseline_schema.sql` đến
`V4__add_dispute_conversation.sql`.

### 8.2 Nhóm bảng theo module

| Module | Bảng |
|---|---|
| Identity | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`, `seller_profiles`, `addresses`, `provinces`, `districts`, `wards`, `user_capability_statuses`, `admin_audit_logs` |
| Media | `media_assets` |
| Catalog | `categories`, `products`, `product_images`, `appraisal_reports`, `appraisal_images` |
| Finance | `wallets`, `wallet_transactions`, `wallet_operations`, `vnpay_deposits`, `platform_revenue_transactions` |
| Auction | `auction_sessions`, `auction_participants`, `bids` |
| Order | `orders` |
| Fulfillment | `order_fulfillments` |
| Dispute | `dispute_cases`, `dispute_evidence`, `dispute_messages` |

Căn cứ: các lệnh `CREATE TABLE` trong `V1__baseline_schema.sql` và
`V4__add_dispute_conversation.sql`.

### 8.3 Đối chiếu entity

Mọi bảng nghiệp vụ có entity tương ứng. Hai bảng nối `user_roles` và
`role_permissions` được ánh xạ bằng quan hệ many-to-many trong `User`, `Role` và
`Permission`, nên không cần entity độc lập. Việc Flyway áp dụng được và Hibernate
validate toàn bộ mapping đã được kiểm chứng bằng
`FlywayMigrationIntegrationTest` và
`ProductionRuntimeConfigurationIntegrationTest`. Căn cứ:
`woodcert-auction/src/main/java/com/woodcert/auction/feature/**/entity/`,
`woodcert-auction/src/test/java/com/woodcert/auction/integration/`.

`database.sql` và `woodcert-auction/docs/DATABASE.md` chỉ nên dùng làm tài liệu
tham khảo, không phải nguồn tạo schema. Nguồn chính vẫn là Flyway vì
`spring.jpa.hibernate.ddl-auto=validate` và Flyway được bật trong
`woodcert-auction/src/main/resources/application.yaml`.

## 9. Phối hợp Redis và MySQL trong đấu giá

### 9.1 Ranh giới trách nhiệm

- MySQL lưu phiên WAITING, trạng thái terminal, participant, audit bid, ví, order
  và toàn bộ dữ liệu bền vững.
- Redis là nguồn trạng thái realtime khi phiên `ACTIVE`: current price, step,
  reserve, end time, highest bidder, trace id và danh sách bidder đã đóng băng cọc.

Căn cứ:
`AuctionRedisService.java`,
`woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/AUCTION_RUNTIME_INVARIANTS.md`,
`V1__baseline_schema.sql`.

### 9.2 Chu trình trạng thái

1. Scheduler tìm session WAITING đến giờ.
2. Đọc participant FROZEN từ MySQL và ghi state/bidder set vào Redis.
3. Chỉ sau khi Redis thành công mới commit session ACTIVE trong MySQL.
4. Lua xử lý bid atomically trong Redis; audit bid và snapshot MySQL là
   best-effort sau khi bid đã được chấp nhận.
5. Khi đóng phiên, worker đọc Redis; nếu state mất thì dùng snapshot DB và bid
   hợp lệ gần nhất.
6. Settlement cập nhật terminal state, wallet/participant/order trong MySQL rồi
   xóa Redis keys.

Căn cứ:
`AuctionSessionLifecycleWorker.java`, `BidServiceImpl.java`,
`BidLuaScript.java`, `AuctionSettlementService.java`.

### 9.3 Khả năng phục hồi

Scheduler repair chạy mặc định mỗi 30 giây để xử lý terminal session còn
participant FROZEN và session thành công thiếu order. Tuy nhiên tài liệu module
vẫn cảnh báo một số partial failure hiếm cần quan sát vận hành. Căn cứ:
`AuctionSessionScheduler.java`, `AuctionSettlementService.java`,
`woodcert-auction/src/main/java/com/woodcert/auction/feature/auction/CONTEXT.md`.

## 10. Frontend và mức độ kết nối API

Frontend đã kết nối các luồng auth, account/address, wallet/VNPay, public auction,
bidding realtime, buyer participation, seller product/auction/order/revenue,
appraisal, certificate, fulfillment, dispute và admin. Căn cứ:
`woodcert-auction-fe/src/app/router/routes.tsx` và các file API trong
`woodcert-auction-fe/src/features/*/api/`.

Các route chính:

- Public: `/`, `/about`, `/guide`, `/auctions`,
  `/auctions/:auctionId`, `/certificates`, `/blog`.
- Auth/account: `/auth/**`, `/account`, `/account/addresses`, `/wallet`.
- Buyer: `/bidding/:auctionId`, `/my-auctions`, `/orders`.
- Seller: `/seller/**`.
- Appraiser: `/appraiser/products`, `/appraiser/reviewed`.
- Admin: `/admin`, `/admin/revenue`, `/admin/disputes`,
  `/admin/categories`, `/admin/users`, `/admin/audit-logs`.

Căn cứ: các file `routes.tsx` trong `woodcert-auction-fe/src/features/`.

`woodcert-auction-fe/src/features/catalog/routes.tsx` không khai báo page riêng;
catalog được sử dụng qua seller/appraiser/certificate và auction composition.
Blog là nội dung mock/static, không có CMS hay API backend. Căn cứ:
`woodcert-auction-fe/src/features/catalog/routes.tsx`,
`woodcert-auction-fe/src/features/blog/` và
`woodcert-auction-fe/README.md`.

## 11. Docker, Nginx, CI/CD và triển khai

### 11.1 Docker và Nginx

Production Compose chạy MySQL 8, Redis 7.4 AOF, backend và frontend; database và
Redis không publish cổng ra host, trong khi backend/frontend chỉ bind loopback.
Căn cứ: `docker-compose.prod.yml`.

Host Nginx proxy `/api/` và `/ws-auction` vào backend, route `/` vào frontend và
giữ WebSocket upgrade/read timeout. Nginx trong frontend dùng SPA fallback,
cache immutable cho asset và `no-store` cho `index.html`. Căn cứ:
`nginx-proxy.conf`, `woodcert-auction-fe/nginx.conf`.

Backend image dùng Maven/Temurin Java 17 multi-stage và user không đặc quyền.
Frontend image dùng Node 22/pnpm để build rồi phục vụ bằng Nginx. Căn cứ:
`woodcert-auction/Dockerfile`, `woodcert-auction-fe/Dockerfile`.

### 11.2 CI

CI trên push/PR main chạy:

- toàn bộ backend test, bắt buộc production wiring test không skip;
- frontend lint, typecheck, unit test và build;
- Playwright;
- shellcheck/deploy script và Compose validation;
- build cả hai Docker image;
- gate yêu cầu mọi job thành công.

Căn cứ: `.github/workflows/ci.yml`.

### 11.3 Release và deploy

Release workflow build image immutable theo commit SHA, đẩy GHCR kèm provenance
và SBOM, sau đó dùng GitHub Environment để SSH deploy. Script production kiểm tra
worktree/env permission/disk/image revision, chặn deploy khi có auction ACTIVE,
backup MySQL, cập nhật container, kiểm tra health/Flyway và rollback application
container khi thất bại. Căn cứ:
`.github/workflows/release-production.yml` và
`scripts/deploy-production.sh`.

Codebase có cơ chế release/deploy production qua GitHub Actions, Docker Compose,
Nginx và script triển khai. Người dùng đã xác nhận hệ thống đã được deploy thực
tế trên môi trường production; trong workspace chưa có log/health check cụ thể
để kết luận thêm về mức độ ổn định vận hành.

## 12. Trạng thái chức năng

### 12.1 Đã triển khai, được kết nối và có test

- Auth/session/RBAC/profile/address/location/admin user.
- Media ảnh cho avatar, sản phẩm, kiểm định và dispute (có code/config Cloudinary
  và theo xác nhận của người dùng đã nghiệm thu upload thực tế trên production).
- Catalog, appraisal và certificate.
- Wallet, VNPay Sandbox, deposit, revenue.
- Auction foundation, Redis/Lua runtime, STOMP, anti-sniper và settlement.
- Buyer/seller order, payment deadline và financial settlement.
- Fulfillment, auto-complete và payout.
- Dispute evidence, conversation, admin resolution.
- Frontend cho toàn bộ actor và các API nêu trên.
- Có cơ chế triển khai production và đã được người dùng xác nhận deploy thực tế.

Căn cứ: source trong `woodcert-auction/src/main/java/`,
`woodcert-auction-fe/src/` và kết quả kiểm thử tại mục 14.

### 12.2 Có code nhưng chưa có bằng chứng acceptance ngoài thực tế

- SMTP: chỉ ghi theo mức đã xác nhận, không suy đoán production.
- VNPay: dùng Sandbox; nếu cần chứng minh end-to-end thì cần credential/log thử nghiệm tương ứng.
- Responsive acceptance trên toàn bộ màn hình.

Căn cứ:
`woodcert-auction/docs/PROJECT-STATUS.md`,
`woodcert-auction-fe/docs/PROJECT-STATUS.md`.

### 12.3 Đang dở dang hoặc deferred

- Stored winner/loser notification.
- Video đóng gói giao hàng.
- Partial refund trong dispute.
- Advanced realtime/concurrency Playwright suite.
- Một số acceptance thủ công và responsive polish.

Căn cứ:
`woodcert-auction/docs/PROJECT-STATUS.md`,
`woodcert-auction-fe/docs/PROJECT-STATUS.md`,
`woodcert-auction/src/main/java/com/woodcert/auction/feature/media/CONTEXT.md`,
`woodcert-auction/src/main/java/com/woodcert/auction/feature/dispute/CONTEXT.md`.

### 12.4 Chỉ tồn tại trong tài liệu hoặc đã lỗi thời

- ADR-003 còn mô tả order, shipment và dispute là chưa triển khai.
- ADR-004 còn mô tả fulfillment là planned và chưa liệt kê order/dispute.
- Tài liệu database/architecture cũ còn dùng cửa sổ auto-complete 72 giờ.
- FE implementation roadmap còn liệt kê buyer participation history và route
  splitting là pending dù code hiện tại đã có.

Căn cứ:
`woodcert-auction/docs/decisions/ADR-003_escrow_wallet_auto_complete.md`,
`ADR-004_modular_monolith_architecture.md`,
`woodcert-auction/docs/DATABASE.md`,
`woodcert-auction/docs/ARCHITECTURE.md`,
`woodcert-auction-fe/docs/FE_IMPLEMENTATION.md`.

### 12.5 Có dấu hiệu không còn được sử dụng hoặc không phải nghiệp vụ backend

- Seller appraisal route/menu cũ đã bị loại bỏ; appraiser workflow nằm ở portal
  appraiser.
- Blog là dữ liệu static/mock phía frontend.
- `SHIPMENT_PACKING_VIDEO` mới là enum dự trữ.
- `catalogRoutes` hiện rỗng vì không có trang catalog public độc lập.

Căn cứ:
`woodcert-auction-fe/README.md`,
`woodcert-auction-fe/src/features/blog/`,
`woodcert-auction/src/main/java/com/woodcert/auction/feature/media/entity/MediaUsageType.java`,
`woodcert-auction-fe/src/features/catalog/routes.tsx`.

## 13. Mâu thuẫn và độ lệch tài liệu

| Vấn đề | Code/migration hiện tại | Tài liệu khác | Kết luận |
|---|---|---|---|
| Số bảng | 34 bảng sau V4 | `woodcert-auction/docs/DATABASE.md` ghi 33 | Dùng 34 |
| Dispute conversation | Có `dispute_messages` và API message | Tài liệu database cũ chưa cập nhật đầy đủ | Migration V4 là nguồn thật |
| Auto-complete | 168 giờ, scheduler mỗi 5 phút | Architecture/Database/ADR ghi 72 giờ | Hành vi code là 168 giờ |
| Order/fulfillment/dispute | Đã có code, API, entity và test | ADR-003 nói chưa triển khai | ADR-003 đã lỗi thời |
| Module backend | Có identity, media, catalog, finance, auction, order, fulfillment, dispute | ADR-004 chỉ liệt kê 5 module và nói fulfillment planned | ADR-004 cần cập nhật |
| Tạo order | Settlement tự động gọi order source khi phiên thành công | `woodcert-auction/docs/DATABASE.md` ghi “winner confirms” | Code tạo tự động |
| ENDED_FAILED public | `AuctionPolicy` cho phép filter/detail public | `AUCTION_RUNTIME_INVARIANTS.md` nói không public list/detail | Code và tài liệu runtime đang mâu thuẫn |
| Số lượng test frontend | Có log/report cho frontend unit và Playwright đã chạy | Status ngày 13/06/2026 ghi số lượng cũ | Không chốt số lượng nếu chưa dùng report cuối cùng |
| Số lượng test backend | Có report Surefire trong workspace và không ghi nhận lỗi kiểm thử | Tài liệu cũ ghi số lượng khác | Không chốt số lượng nếu chưa dùng report cuối cùng |
| FE roadmap | Buyer history và route splitting đã có | `FE_IMPLEMENTATION.md` còn để pending/deferred | Roadmap cũ |

Căn cứ chi tiết nằm tại các file nêu trong từng hàng và kết quả test mục 14.

## 14. Tình trạng kiểm thử đã xác minh

Các command đã chạy ngày 15/06/2026:

```powershell
# Backend
.\mvnw.cmd -B -ntp test

# Frontend
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Kết quả:

- Backend: có report Surefire trong workspace, không ghi nhận failure/error/skipped trong report hiện có.
- Các integration test MySQL/Flyway, Redis/Lua, runtime auction, security và
  production wiring đều chạy đạt bằng Testcontainers.
- Frontend unit: Vitest đã chạy đạt theo log/report hiện có.
- Playwright: e2e đã chạy đạt theo report hiện có.
- TypeScript typecheck, ESLint và production build đều đạt.

Căn cứ:
`woodcert-auction/target/surefire-reports/`,
`woodcert-auction/src/test/java/`,
`woodcert-auction-fe/src/shared/api/client.test.ts`,
`woodcert-auction-fe/src/features/auction/auction.test.tsx`,
`woodcert-auction-fe/e2e/` và scripts trong
`woodcert-auction-fe/package.json`.

Trong phiên khảo sát này không tự chạy acceptance với SMTP/VNPay credential thật
và không gọi production. Riêng Cloudinary chỉ sử dụng kết luận nghiệm thu thực
tế khi ghi rõ đó là xác nhận của người dùng.

## 15. Kết quả xác nhận các điểm nghiệp vụ và vận hành

1. **Hệ thống Production**: Codebase có cơ chế build/deploy production thông qua
Docker Compose, Nginx Reverse Proxy và GitHub Actions release; người dùng đã xác
nhận hệ thống đã được triển khai thực tế trên môi trường production. Chưa có
log/health check cụ thể trong workspace để kết luận thêm về mức độ ổn định vận
hành.
2. **Thời gian giao hàng tự hoàn tất**: Thống nhất sử dụng thời gian bảo vệ giao hàng là **168 giờ (7 ngày)** trong báo cáo đồ án, phù hợp với cấu hình thực tế của ứng dụng.
3. **Thanh toán**: Cổng thanh toán VNPay được tích hợp ở mức môi trường **Sandbox** phục vụ thử nghiệm liên kết ngân hàng.
4. **Blog static/mock**: Được định nghĩa là tính năng phụ bổ trợ giao diện ở Frontend, không có API backend hoặc cơ sở dữ liệu và không đưa vào đặc tả nghiệp vụ chính.
5. **ENDED_FAILED public**: Cho phép hiển thị công khai các phiên đấu giá kết thúc không thành công để phục vụ việc đối chiếu giá thị trường và đảm bảo tính minh bạch.


## 16. Cách xác minh an toàn theo nhóm

- **Toàn backend:** chạy `.\mvnw.cmd -B -ntp test` với Docker Desktop.
- **Toàn frontend:** chạy `pnpm typecheck`, `pnpm lint`, `pnpm test`,
  `pnpm build`, `pnpm test:e2e`.
- **Schema:** chạy `FlywayMigrationIntegrationTest` trên Testcontainers; không
  chạy migration trực tiếp vào production.
- **Auction Redis/MySQL:** chạy `AuctionRedisServiceIntegrationTest`,
  `BidLuaRuntimeIntegrationTest`, `AuctionRuntimeFlowIntegrationTest`.
- **API đọc:** dùng các GET public trên môi trường local.
- **Luồng có ghi dữ liệu:** chỉ thử trên database local/test với tài khoản seed.
- **Tích hợp ngoài:** khi Codex tự kiểm tra thì dùng SMTP test, Cloudinary
  folder test và VNPay Sandbox.
- **Triển khai:** chỉ validate syntax/Compose trong CI hoặc local; không chạy
  `scripts/deploy-production.sh` nếu không có yêu cầu production rõ ràng.

Căn cứ:
`.github/workflows/ci.yml`, các integration test trong
`woodcert-auction/src/test/java/com/woodcert/auction/integration/` và
`woodcert-auction-fe/package.json`.
