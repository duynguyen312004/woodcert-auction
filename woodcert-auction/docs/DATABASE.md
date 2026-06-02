# Database Schema

Current implementation note (2026-06-02): identity, media, catalog/appraisal, finance/wallet/VNPay, auction/bidding, orders, fulfillment, dispute, admin category/appraiser operations, and certificate lookup are implemented by backend code.

> MySQL database design for WoodCert Auction Platform.
> Update this file whenever schema changes.

---

## Entity Relationship Diagram

```
## IDENTITY & AUTHORIZATION LAYER

┌──────────────────────┌───────────────────┐        ┌──────────────────┐
│ provinces (master)   │ districts (master)│        │ wards (master)   │
├──────────────┬───────┼───────────────────┼────────┼──────────────────┤
│ code (PK)    │       │ code (PK)         │        │ code (PK)        │
│ name         │       │ province_code FK  │        │ district_code FK │
└──────────────┼───────┴────────┬──────────┴────────┴────────┬─────────┘
               │ 1:N            │ 1:N                        │ 1:N
               │                │                            │
               └────────────────┴────────────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │     addresses (1:N)      │
                    ├──────────────────────────┤
                    │ id (PK)                  │
                    │ user_id (FK)             │
                    │ province_id, district_id │
                    │ ward_id (FKs)            │
                    └────────┬─────────────────┘
                             │
                             ▲
                             │ 1:N
                             │
        ┌────────────────────┴────────────────────┬─────────────────┐
        │                                         │                 │
        ▼                                         ▼                 ▼
┌─────────────────┐                    ┌──────────────────┐    ┌──────────────────┐
│     users       │◄──────────────────►│  refresh_tokens  │    │ seller_profiles  │
├─────────────────┤      (1:N)         ├──────────────────┤    ├──────────────────┤
│ id (PK)         │                    │ id (PK)          │    │ user_id (PK/FK)  │
│ email (UQ)      │                    │ token (UQ)       │    │ store_name       │
│ password_hash   │                    │ user_id (FK)     │    │ identity_card    │
│ full_name       │                    │ expires_at       │    │ tax_code         │
│ phone (UQ)      │                    │ revoked          │    │ reputation_score │
│ avatar_media_id │                    │ created_at       │    └──────────────────┘
│ status          │                    └──────────────────┘
│ created_at      │
└────────┬────────┘
         │ N:M (via user_roles)       ┌────────────────┐
         └────────┬──────────────────►│ roles (master) │
                  │                   ├────────────────┤
        ┌─────────┴────────┐          │ id (PK)        │
        │   user_roles     │          │ name (UQ)      │
        ├──────────────────┤ N:M      └────────┬───────┘
        │ user_id (PK,FK)  ├──────────────────►│
        │ role_id (PK,FK)  │         ┌─────────┴────────────┐
        └──────────────────┘         │  role_permissions    │
                                     ├──────────────────────┤
                                     │ role_id (PK,FK)      │
                                     │ permission_id (PK,FK)│
                                     └──────────┬───────────┘
                                                │
                                                ▼
                                    ┌────────────────────────┐
                                    │  permissions (master)  │
                                    ├────────────────────────┤
                                    │ id (PK)                │
                                    │ name (UQ)              │
                                    │ description (NULLABLE) │
                                    └────────────────────────┘

## CATALOG & APPRAISAL LAYER

┌──────────────────┐
│ categories       │  (self-reference: parent_id FK)
├──────────────────┤
│ id (PK)          │
│ parent_id (FK)   │
│ name (UQ)        │
│ slug (UQ)        │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────────────┐
│      products            │ (seller: users.id FK)
├──────────────────────────┤
│ id (PK)                  │
│ seller_id (FK → users)   │  1:N
│ category_id (FK)         │
│ title, description       │
│ material, dimensions     │
│ status, created_at       │
├──────────────────────────┤
       │ 1:N                │ 1:1
       │                    │
       ▼                    ▼
┌──────────────────────┐  ┌─────────────────────┐
│  product_images      │  │ appraisal_reports   │ (appraiser: users.id FK)
├──────────────────────┤  ├─────────────────────┤
│ id (PK)              │  │ id (PK)             │
│ product_id (FK)      │  │ product_id (UQ,FK)  │ 1:1
│ media_id (FK)        │  │ appraiser_id (FK)   │
│ is_primary           │  │ certificate_code    │
│ sort_order           │  │ verified_material   │
└──────────────────────┘  │ estimated_value     │
                          └──────────┬──────────┘
                                     │ 1:N
                                     ▼
                          ┌─────────────────────┐
                          │ appraisal_images    │
                          ├─────────────────────┤
                          │ id (PK)             │
                          │ appraisal_report_id │
                          │ media_id (FK)       │
                          │ description         │
                          └─────────────────────┘

## FINANCE & WALLET LAYER

┌─────────────────────────┐
│      users (FK)         │
├─────────────────────────┤  1:1
│ (wallet owner)          │─────┐
└─────────────────────────┘     │
                                ▼
                    ┌──────────────────────┐
                    │      wallets         │
                    ├──────────────────────┤
                    │ id (PK)              │
                    │ user_id (UQ,FK)      │
                    │ available_balance    │
                    │ frozen_balance       │
                    │ version (optimistic) │
                    └──────────┬───────────┘
                               │ 1:N
                               ▼
                    ┌──────────────────────────┐
                    │  wallet_transactions     │
                    ├──────────────────────────┤
                    │ id (PK)                  │
                    │ wallet_id (FK)           │
                    │ amount, type, status     │
                    │ reference_id/type        │
                    │ created_at               │
                    └──────────────────────────┘

## AUCTION & COMMERCE LAYER

```text
products -> auction_sessions -> bids
                         |
                         +-> auction_participants
                         |
                         +-> orders (source_type = AUCTION, source_id = auction_sessions.id)
                                  |
                                  +-> order_fulfillments
                                  |
                                  +-> dispute_cases
                                          |
                                          +-> dispute_evidence
```

Auction owns sessions, bids, participants, and settlement. Order owns post-sale payment, payout snapshots, and source callbacks. Fulfillment owns shipment and auto-complete. Dispute owns buyer evidence, active case state, admin review, and full seller-wins/buyer-wins resolution.

---

## Table Definitions

### provinces

Dữ liệu địa giới hành chính Việt Nam - Master data thường được import từ script có sẵn.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| code | VARCHAR(20) | PK | Mã Tỉnh/TP (VD: "01" - Hà Nội, "HN") |
| name | VARCHAR(100) | NOT NULL | Tên Tỉnh/TP đầy đủ |

**Indexes:**

- PRIMARY KEY idx_provinces_code ON provinces(code)

**Notes:**

- Master data table - thường được import từ database script
- Code là khóa chính (VD: "01", "02", "HN" tùy format chọn)
- Dùng để validate địa chỉ khi tạo orders/order_fulfillments

### districts

Quận/Huyện - Phân cấp tiếp theo sau provinces.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| code | VARCHAR(20) | PK | Mã Quận/Huyện (VD: "101" - Quận Ba Đình) |
| province_code | VARCHAR(20) | NOT NULL, FK → provinces(code) | Tỉnh/TP chứa quận/huyện này |
| name | VARCHAR(100) | NOT NULL | Tên Quận/Huyện |

**Indexes:**

- PRIMARY KEY idx_districts_code ON districts(code)
- INDEX idx_districts_province_code ON districts(province_code)

**Notes:**

- Code là khóa chính, kết hợp với province_code để tạo hierarchical location system
- Dùng để filter wards khi user chọn địa chỉ

### wards

Phường/Xã - Mức độ địa chỉ chi tiết nhất.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| code | VARCHAR(20) | PK | Mã Phường/Xã (VD: "10101" - P. Phúc Tân) |
| district_code | VARCHAR(20) | NOT NULL, FK → districts(code) | Quận/Huyện chứa phường/xã |
| name | VARCHAR(100) | NOT NULL | Tên Phường/Xã |

**Indexes:**

- PRIMARY KEY idx_wards_code ON wards(code)
- INDEX idx_wards_district_code ON wards(district_code)

**Notes:**

- Code là khóa chính, user chọn theo thứ tự: Province → District → Ward
- Thông thường được import cùng với districts và provinces

### refresh_tokens

Quản lý phiên đăng nhập và bảo mật JWT tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | ID duy nhất |
| token | CHAR(64)| NOT NULL, UNIQUE | SHA-256 hash của Refresh Token (Chống lộ lõi token) |
| user_id | VARCHAR(36) | NOT NULL, FK → users(id) | Chủ sở hữu refresh token |
| expires_at | TIMESTAMP | NOT NULL | Thời gian hết hạn (7 ngày sau khi cấp) |
| revoked | BOOLEAN | NOT NULL, DEFAULT false | Đã bị thu hồi (do logout, ban, etc) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Lúc tạo token |

**Indexes:**

- UNIQUE INDEX idx_refresh_tokens_token ON refresh_tokens(token)
- INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id)

**Notes:**

- Lưu hash SHA-256 của token thay vì token gốc (bảo mật)
- User có thể có nhiều refresh tokens (khi dùng nhiều devices)
- Gọi refresh endpoint với token này để lấy access token mới
- Access token thường short-lived (15 min), refresh token long-lived (7 days)	

### password_reset_tokens

One-time password reset tokens. Raw tokens are sent only by email; the database stores only SHA-256 hashes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Unique token row id |
| token_hash | CHAR(64) | NOT NULL, UNIQUE | SHA-256 hash of the raw reset token |
| user_id | VARCHAR(36) | NOT NULL, FK -> users(id) | Owner account |
| expires_at | TIMESTAMP | NOT NULL | Token expiry time |
| used_at | TIMESTAMP | NULLABLE | Set when the token is consumed |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Audit create time |

**Indexes:**

- UNIQUE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash)
- INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)

**Notes:**

- Never persist or log the raw token, reset link, or verification link.
- Forgot-password returns a generic 200 response for unknown, banned, and cooldown cases to avoid email enumeration.
- A successful reset marks the token as used and revokes active refresh tokens for the account.

### users


| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PK | UUID của người dùng |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email đăng nhập |
| password_hash | VARCHAR(255) | NOT NULL | Mật khẩu đã mã hóa |
| full_name | VARCHAR(100) | NOT NULL | Họ tên hiển thị |
| phone_number | VARCHAR(20) | UNIQUE, NULLABLE | Số điện thoại |
| avatar_media_id | BIGINT | NULLABLE, FK → media_assets(id) | Media asset ảnh đại diện |
| status | VARCHAR(20) | NOT NULL | Enum: ACTIVE, BANNED, UNVERIFIED |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật |
**Indexes:**

- UNIQUE INDEX idx_users_email ON users(email)
- UNIQUE INDEX idx_users_phone_number ON users(phone_number)

### media_assets

Cloudinary metadata store. Domain tables should keep foreign keys to this table instead of storing raw media URLs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Internal media ID |
| asset_id | VARCHAR(100) | UNIQUE, NULLABLE | Immutable Cloudinary asset ID |
| public_id | VARCHAR(255) | UNIQUE, NULLABLE | Cloudinary public ID |
| resource_type | VARCHAR(20) | NOT NULL | Enum: IMAGE, VIDEO, RAW |
| usage_type | VARCHAR(40) | NOT NULL | Business usage type |
| owner_user_id | VARCHAR(36) | NOT NULL | User who requested upload |
| folder | VARCHAR(255) | NOT NULL | Cloudinary folder prefix |
| asset_version | BIGINT | NULLABLE | Cloudinary version |
| format | VARCHAR(20) | NULLABLE | File format |
| file_size | BIGINT | NULLABLE | Uploaded file size |
| width | INT | NULLABLE | Width |
| height | INT | NULLABLE | Height |
| duration_seconds | DOUBLE | NULLABLE | Video duration |
| content_type | VARCHAR(100) | NULLABLE | MIME type |
| original_filename | VARCHAR(255) | NULLABLE | Original client file name |
| secure_url | VARCHAR(500) | NULLABLE | Cached secure URL |
| status | VARCHAR(20) | NOT NULL | PENDING, ACTIVE, PENDING_DELETE, DELETE_FAILED, DELETED |
| metadata_json | TEXT | NULLABLE | Optional metadata blob |
| delete_requested_at | TIMESTAMP | NULLABLE | Deletion requested time |
| deleted_at | TIMESTAMP | NULLABLE | Deletion finished time |
| cleanup_attempts | INT | NOT NULL | Background cleanup retry count |
| last_error | VARCHAR(500) | NULLABLE | Last cleanup error |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**Indexes:**

- UNIQUE INDEX uk_media_assets_asset_id ON media_assets(asset_id)
- UNIQUE INDEX uk_media_assets_public_id ON media_assets(public_id)
- INDEX idx_media_assets_owner_usage ON media_assets(owner_user_id, usage_type)
- INDEX idx_media_assets_status_created ON media_assets(status, created_at)
- INDEX idx_media_assets_status_delete_requested ON media_assets(status, delete_requested_at)

**Notes:**

- `asset_id` is the immutable Cloudinary identifier used during confirm/verification.
- `public_id` is the stable delivery/delete identifier issued during upload intent.
- `folder` stores the intended Cloudinary folder prefix, for example `woodcert/dev/users/{userId}/avatar` or `woodcert/dev/users/{userId}/products`.
- Current implemented usages include `USER_AVATAR`, `PRODUCT_IMAGE` and `APPRAISAL_IMAGE`.

### addresses

Địa chỉ nhận hàng của từng user (multiple per user, có thể set 1 default).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | ID duy nhất |
| user_id | VARCHAR(36) | NOT NULL, FK → users(id) | Chủ sở hữu địa chỉ |
| receiver_name | VARCHAR(100) | NOT NULL | Tên người nhận |
| phone_number | VARCHAR(20) | NOT NULL | SĐT người nhận |
| street_address | VARCHAR(255) | NOT NULL | Số nhà, đường, thôn/xóm |
| province_code | VARCHAR(20) | NULLABLE, FK → provinces(code) | Tỉnh/TP |
| district_code | VARCHAR(20) | NULLABLE, FK → districts(code) | Quận/Huyện |
| ward_code | VARCHAR(20) | NULLABLE, FK → wards(code) | Phường/Xã |
| is_default | BOOLEAN | NOT NULL, DEFAULT false | Địa chỉ mặc định |

**Indexes:**

- INDEX idx_addresses_user_id ON addresses(user_id)
- INDEX idx_addresses_province_code ON addresses(province_code)
- INDEX idx_addresses_district_code ON addresses(district_code)
- INDEX idx_addresses_ward_code ON addresses(ward_code)

**Notes:**

- Một user có thể có nhiều địa chỉ (VD: nhà, công sở, quê)
- Mỗi user chỉ có tối đa 1 địa chỉ mặc định - enforce ở tầng service
- Khi order, buyer chọn địa chỉ từ danh sách của user
- Location hierarchy: province → district → ward (required order khi UI update)
### roles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | |
| name | VARCHAR(50) | NOT NULL, UNIQUE | ROLE_BIDDER, ROLE_SELLER, ROLE_APPRAISER, ROLE_ADMIN |

### permissions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | |
| name | VARCHAR(100) | NOT NULL, UNIQUE | CREATE_BID, APPROVE_PRODUCT, BAN_USER |
| description | VARCHAR(255) | NULLABLE | Mô tả quyền |

### user_roles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | VARCHAR(36) | PK, FK → users(id) | |
| role_id | INT | PK, FK → roles(id) | |

Composite PK: (user_id, role_id)

### role_permissions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | INT | PK, FK → roles(id) | |
| permission_id | INT | PK, FK → permissions(id) | |

Composite PK: (role_id, permission_id)

### seller_profiles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | VARCHAR(36) | PK, FK → users(id) | Quan hệ 1-1 với user |
| store_name | VARCHAR(100) | NOT NULL | Tên gian hàng / xưởng gỗ |
| identity_card_number | VARCHAR(20) | NOT NULL, UNIQUE | CCCD/CMND |
| tax_code | VARCHAR(50) | NULLABLE | Mã số thuế |
| reputation_score | DECIMAL(3,2) | NOT NULL, DEFAULT 5.00 | Điểm uy tín người bán; seller mới mặc định 5.00, sau appraisal tính bằng AVG(seller_accuracy) và làm tròn 1 chữ số |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo hồ sơ người bán |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật hồ sơ người bán |

### categories
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Tên danh mục |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | SEO slug |
| parent_id | INT | NULLABLE, FK → categories(id) | Danh mục cha |
| description | VARCHAR(255) | NULLABLE | Mô tả |

**Indexes:**

- INDEX idx_categories_parent_id ON categories(parent_id)

### products
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| seller_id | VARCHAR(36) | NOT NULL, FK → users(id) | Người bán |
| category_id | INT | NOT NULL, FK → categories(id) | Danh mục |
| title | VARCHAR(255) | NOT NULL | Tên sản phẩm |
| description | LONGTEXT | NULLABLE | Nội dung giới thiệu |
| material | VARCHAR(100) | NULLABLE | Chất liệu seller tự khai |
| dimensions | VARCHAR(100) | NULLABLE | Kích thước |
| weight | DECIMAL(10,2) | NULLABLE | Trọng lượng kg |
| status | VARCHAR(30) | NOT NULL | Enum: DRAFT, PENDING_APPRAISAL, REJECTED, APPRAISED |
| sale_status | VARCHAR(30) | NOT NULL | Enum: AVAILABLE, IN_AUCTION, SOLD, RETURNED |
| submitted_at | TIMESTAMP | NULLABLE | Lúc gửi kiểm định |
| rejected_reason | TEXT | NULLABLE | Lý do từ chối |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

**Indexes:**

- INDEX idx_products_seller_id ON products(seller_id)
- INDEX idx_products_category_id ON products(category_id)
- INDEX idx_products_status ON products(status)

### product_images
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| product_id | BIGINT | NOT NULL, FK → products(id) | |
| media_id | BIGINT | NOT NULL, FK → media_assets(id) | Ảnh đã confirm qua media module |
| is_primary | BOOLEAN | NOT NULL, DEFAULT false | Ảnh bìa |
| sort_order | INT | NOT NULL, DEFAULT 0 | Thứ tự hiển thị |

**Indexes:**

- INDEX idx_product_images_product_id ON product_images(product_id)

**Notes:**

- Product list/detail should derive delivery URL from joined `media_assets`, not from raw client-supplied URLs.

### appraisal_reports
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| product_id | BIGINT | NOT NULL, UNIQUE, FK → products(id) | 1 sản phẩm = 1 chứng thư |
| appraiser_id | VARCHAR(36) | NOT NULL, FK → users(id) | Chuyên gia kiểm định |
| certificate_code | VARCHAR(50) | NOT NULL, UNIQUE | Mã chứng thư công khai |
| verified_material | VARCHAR(100) | NOT NULL | Chất liệu gỗ xác thực |
| origin | VARCHAR(100) | NULLABLE | Nơi chế tác/xuất xứ |
| age_estimation | VARCHAR(50) | NULLABLE | Niên đại / tuổi ước tính |
| condition_grade | VARCHAR(20) | NULLABLE | Enum: EXCELLENT, GOOD, FAIR, POOR |
| estimated_value | DECIMAL(19,2) | NOT NULL | Định giá VNĐ |
| is_authentic | BOOLEAN | NOT NULL | Hàng thật / không đạt |
| appraiser_notes | TEXT | NULLABLE | Ghi chú kiểm định |
| seller_accuracy | DECIMAL(3,2) | NOT NULL | Điểm trung thực seller (1-5), dùng dấu chấm thập phân như 4.5 |
| digital_signature | VARCHAR(255) | NOT NULL | Hash xác thực |
| appraised_at | TIMESTAMP | NOT NULL | Thời điểm duyệt |

**Indexes:**

- UNIQUE INDEX idx_appraisal_reports_certificate_code ON appraisal_reports(certificate_code)
- INDEX idx_appraisal_reports_appraiser_id ON appraisal_reports(appraiser_id)
- INDEX idx_appraisal_reports_verified_material ON appraisal_reports(verified_material)
- INDEX idx_appraisal_reports_origin ON appraisal_reports(origin)
- INDEX idx_appraisal_reports_condition_grade ON appraisal_reports(condition_grade)
- INDEX idx_appraisal_reports_estimated_value ON appraisal_reports(estimated_value)

**Notes:**

- Dữ liệu buyer nhìn thấy về chất liệu / tình trạng phải lấy từ bảng này, không lấy từ products.material
- `seller_accuracy` là input bắt buộc khi appraiser submit appraisal và được dùng để tính lại `seller_profiles.reputation_score`

### appraisal_images
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| appraisal_report_id | BIGINT | NOT NULL, FK → appraisal_reports(id) | |
| media_id | BIGINT | NOT NULL, FK → media_assets(id) | Ảnh bằng chứng đã confirm |
| description | VARCHAR(255) | NULLABLE | Chú thích ảnh |

**Indexes:**

- INDEX idx_appraisal_images_report_id ON appraisal_images(appraisal_report_id)

**Notes:**

- Appraisal proof images share the same `media_assets` confirmation and cleanup lifecycle as avatar/product images.

### wallets
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | VARCHAR(36) | NOT NULL, UNIQUE, FK → users(id) | Mỗi user có 1 ví |
| available_balance | DECIMAL(19,2) | NOT NULL, DEFAULT 0.00 | Số dư khả dụng |
| frozen_balance | DECIMAL(19,2) | NOT NULL, DEFAULT 0.00 | Số dư đang bị đóng băng |
| version | INT | NOT NULL, DEFAULT 0 | Dùng optimistic locking |

**Indexes:**

- UNIQUE INDEX idx_wallets_user_id ON wallets(user_id)

### wallet_transactions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| wallet_id | BIGINT | NOT NULL, FK → wallets(id) | |
| amount | DECIMAL(19,2) | NOT NULL | Số tiền +/- |
| type | VARCHAR(20) | NOT NULL | Enum: DEPOSIT, WITHDRAW, FREEZE, UNFREEZE, PAYMENT |
| reference_id | BIGINT | NULLABLE | ID phiên đấu giá / đơn hàng / hệ thống |
| reference_type | VARCHAR(20) | NULLABLE | Enum: AUCTION, ORDER, SYSTEM, VNPAY_DEPOSIT |
| status | VARCHAR(20) | NOT NULL | Enum: SUCCESS, FAILED, PENDING |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |

**Indexes:**

- INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id)
- INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at)
- INDEX idx_wallet_transactions_reference ON wallet_transactions(reference_type, reference_id)

**Notes:**

- Mọi thay đổi số dư ví bắt buộc phải insert 1 dòng vào bảng này
- Không được cập nhật ví mà không có audit log
- `amount` là signed delta theo hướng tác động lên `available_balance` của ví

### wallet_operations
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| operation_key | VARCHAR(100) | NOT NULL, UNIQUE | Idempotency key cho business wallet mutation |
| wallet_id | BIGINT | NOT NULL, FK → wallets(id) | |
| amount | DECIMAL(19,2) | NOT NULL | Số tiền business đã normalize |
| type | VARCHAR(20) | NOT NULL | Enum: DEPOSIT, WITHDRAW, FREEZE, UNFREEZE, PAYMENT |
| reference_id | BIGINT | NULLABLE | ID auction/order/system reference |
| reference_type | VARCHAR(20) | NOT NULL | Enum: AUCTION, ORDER, SYSTEM, VNPAY_DEPOSIT |
| status | VARCHAR(20) | NOT NULL | Enum: SUCCESS, FAILED, PENDING |
| failure_code | VARCHAR(100) | NULLABLE | Failure code persisted when operation finalizes as FAILED |
| failure_message | VARCHAR(255) | NULLABLE | Short internal failure detail for audit/debug |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

**Indexes:**

- UNIQUE INDEX idx_wallet_operations_operation_key ON wallet_operations(operation_key)
- INDEX idx_wallet_operations_wallet_id ON wallet_operations(wallet_id)

**Notes:**

- Dùng để chống duplicate business action khi command/event bị retry hoặc xử lý lặp
- Cùng `operation_key` với payload khác phải bị reject
- `FAILED` là terminal; caller phải dùng `operation_key` mới nếu muốn retry
- `PENDING` quá `finance.wallet.operation.pending-timeout` sẽ bị fail-close thành `FAILED`

### vnpay_deposits
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| user_id | VARCHAR(36) | NOT NULL, FK → users(id) | Chủ giao dịch nạp tiền |
| txn_ref | VARCHAR(100) | NOT NULL, UNIQUE | Mã giao dịch gửi sang VNPay |
| amount | DECIMAL(19,2) | NOT NULL | Số tiền nạp |
| order_info | VARCHAR(255) | NULLABLE | Nội dung thanh toán |
| status | VARCHAR(20) | NOT NULL | Enum: PENDING, SUCCESS, FAILED |
| vnp_transaction_no | VARCHAR(100) | NULLABLE | Mã giao dịch VNPay |
| vnp_response_code | VARCHAR(10) | NULLABLE | Mã phản hồi VNPay |
| vnp_bank_code | VARCHAR(50) | NULLABLE | Ngân hàng/thẻ thanh toán |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo yêu cầu |
| paid_at | TIMESTAMP | NULLABLE | Thời điểm IPN xác nhận thành công |

**Indexes:**

- UNIQUE INDEX idx_vnpay_deposits_txn_ref ON vnpay_deposits(txn_ref)
- INDEX idx_vnpay_deposits_user_id ON vnpay_deposits(user_id)

**Notes:**

- `txn_ref` được lock pessimistic khi xử lý IPN để tránh xử lý trùng.
- IPN cập nhật trạng thái deposit và tạo wallet transaction `DEPOSIT` với `reference_type = VNPAY_DEPOSIT`.

### AUCTION & COMMERCE LAYER

```text
products -> auction_sessions -> bids
                         |
                         +-> auction_participants
                         |
                         +-> orders (source_type = AUCTION, source_id = auction_sessions.id)
                                  |
                                  +-> order_fulfillments
                                  |
                                  +-> dispute_cases
                                          |
                                          +-> dispute_evidence
```

Auction owns sessions, bids, participants, and settlement. Order owns post-sale payment, payout snapshots, and source callbacks. Fulfillment owns shipment and auto-complete. Dispute owns buyer evidence, active case state, admin review, and full seller-wins/buyer-wins resolution.

---

## Relationships Summary

Current avatar relationship note: `users.avatar_media_id -> media_assets.id` (optional one-to-one reference for the active avatar asset).

| Relationship | Type | Notes |
|-------------|------|-------|
| Province → District | OneToMany | Địa giới hành chính phân cấp |
| District → Ward | OneToMany | Địa giới hành chính phân cấp |
| Address → Province, District, Ward | ManyToOne | Foreign key references tới master data |
| User → Address | OneToMany | Một user có nhiều địa chỉ nhận hàng |
| User → RefreshToken | OneToMany | Quản lý JWT sessions, user có nhiều tokens |
| User ↔ Role | ManyToMany | Qua user_roles join table |
| Role ↔ Permission | ManyToMany | Qua role_permissions join table |
| User → SellerProfile | OneToOne | Seller mở rộng hồ sơ pháp lý |
| Category → Category | Self-reference | parent_id cho nested categories |
| Category → Product | OneToMany | Một category có nhiều products |
| User (seller) → Product | OneToMany | Seller sở hữu nhiều sản phẩm |
| Product → ProductImage | OneToMany | Hình ảnh sản phẩm |
| Product → AppraisalReport | OneToOne | Một lần đánh giá per product |
| AppraisalReport → AppraisalImage | OneToMany | Hình ảnh đánh giá |
| User (appraiser) → AppraisalReport | OneToMany | Appraiser có nhiều bản đánh giá |
| User → Wallet | OneToOne | Mỗi user một ví |
| Wallet → WalletTransaction | OneToMany | Lịch sử giao dịch |
| Product → AuctionSession | OneToMany | Một sản phẩm có thể đấu giá nhiều lần |
| AuctionSession → AuctionParticipant | OneToMany | User tham gia phiên đấu |
| AuctionSession → Bid | OneToMany | Tất cả các bids trong phiên |
| AuctionSession → Order | OneToOne | Được tạo khi phiên kết thúc (winner confirms) |
| Order (buyer/seller) → User | ManyToOne | Tham chiếu buyer_id, seller_id |
| Order → Shipment | OneToOne | Thông tin vận chuyển |
| Order → Dispute | OneToOne | Khiếu nại nếu có vấn đề |
JPA Mapping Notes
All @ManyToOne should use FetchType.LAZY
All @OneToMany should use FetchType.LAZY
Avoid exposing entity graph directly in REST response
Use DTO aggregation in service layer, especially for:
Product detail = products + appraisal_reports + product_images
Auction detail = auction_sessions + bids + appraisal_reports

Critical entities that MUST use @Version:

Wallet
AuctionSession
Order

Enums MUST use:

@Enumerated(EnumType.STRING)

Money fields MUST use:

BigDecimal
Business Notes
Product Truth Model
products chứa dữ liệu seller tự khai
appraisal_reports chứa dữ liệu đã kiểm định
Buyer chỉ nên thấy các field xác thực từ appraisal_reports cho chất liệu, tình trạng, định giá
Seller reputation được tính từ trung bình toàn bộ appraisal_reports.seller_accuracy của seller, bao gồm cả APPRAISED và REJECTED, làm tròn 1 chữ số
Catalog list/detail hiện là internal workflow APIs cho seller/appraiser; buyer-facing browse/detail nên đi qua auction read model sau này
Escrow Rules
Khi tham gia đấu giá: tiền cọc chuyển từ available_balance → frozen_balance
Người thua: deposit_status = REFUNDED
Người thắng nhưng không thanh toán: deposit_status = CONFISCATED
Tiền seller chỉ được nhả khi đơn hoàn tất hoặc dispute được giải quyết theo hướng seller thắng
Real-time Auction Rules
Redis là source of truth khi phiên ACTIVE
auction_sessions.current_price và auction_sessions.end_time trong MySQL đóng vai trò snapshot/fallback; bids là audit log
Anti-sniper: bid hợp lệ trong 30 giây cuối → cộng thêm 60 giây
Current runtime notes:
- `auction_sessions.current_price` and `auction_sessions.end_time` are DB snapshots/fallbacks while status is `ACTIVE`.
- Redis Lua decides live bid acceptance; MySQL bid rows are async audit logs.
- Public default auction statuses are `WAITING` and `ACTIVE`; explicit public status filter also permits `ENDED_SUCCESS`.
- Registration is open during `WAITING` and during valid Redis-backed `ACTIVE` runtime.

Suggested Seed Data
roles
### Roles

- ROLE_BIDDER
- ROLE_SELLER
- ROLE_APPRAISER
- ROLE_ADMIN

### Example Permissions

- CREATE_BID
- JOIN_AUCTION
- CREATE_PRODUCT
- SUBMIT_APPRAISAL_REQUEST
- APPROVE_PRODUCT
- CREATE_AUCTION_SESSION
- CONFIRM_DELIVERY
- RESOLVE_DISPUTE
- BAN_USER
### Table List

Total tables: 28

**Infrastructure & Location (13 tables):**
- users
- media_assets
- addresses
- provinces (master data)
- districts (master data)
- wards (master data)
- roles
- permissions
- role_permissions
- user_roles
- seller_profiles
- refresh_tokens
- password_reset_tokens

**Catalog & Appraisal (5 tables):**
- categories
- products
- product_images
- appraisal_reports
- appraisal_images

**Finance (4 tables):**
- wallets
- wallet_transactions
- wallet_operations
- vnpay_deposits

**Auction & Bidding (3 tables):**
- auction_sessions
- auction_participants
- bids

**Fulfillment (3 tables):**
- orders
- order_fulfillments
- dispute_cases

**Dispute Evidence (1 table):**
- dispute_evidence

**Note:** Total 28 tables including all join tables, master data, and operational tables. Updated count reflects `password_reset_tokens`, `media_assets`, the location hierarchy, token/session management tables, and dispute evidence.

### Recommended Schema Strategy

- **dev:** Hibernate ddl-auto=update
- **prod:** ddl-auto=validate
- **Production migration:** use Flyway or Liquibase

### Recommended Cleanup Jobs

- Cleanup expired refresh tokens (daily job)
- Auto-complete delivered orders after 72 hours (scheduled task)
- Skip disputed orders during fulfillment auto-complete
- Auction close scheduler (realtime event listener)
