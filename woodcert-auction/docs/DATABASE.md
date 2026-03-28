# Database Schema

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
│ avatar_url      │                    │ created_at       │    └──────────────────┘
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
│ image_url            │  │ appraiser_id (FK)   │
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
                          │ image_url           │
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

## AUCTION & BIDDING LAYER

┌─────────────────────────────────────────────────┐
│ products (appraised only) ← appraisal_reports   │
├─────────────────────────────────────────────────┤ 1:N
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────┐
        │    auction_sessions              │
        ├──────────────────────────────────┤
        │ id (PK)                          │
        │ product_id (FK)                  │ (1:1 relationships)
        │ highest_bidder_id (FK → users)   │
        │ winner_bid_id (FK → bids)        │
        │ current_price, status            │
        │ version (optimistic)             │
        └────────┬───────────┬─────────────┘
                 │           │
                 │ 1:N       │ 1:N
                 │           │
        ┌────────┴──┐    ┌────┴────────────────────────┐
        │           │    │                             │
        ▼           ▼    ▼                             ▼
 ┌──────────┐   ┌────────────────────────┐   ┌──────────────────┐
 │  bids    │   │ auction_participants   │   │     orders       │
 ├──────────┤   ├────────────────────────┤   ├──────────────────┤
 │ id (PK)  │   │ id (PK)                │   │ id (PK)          │
 │ session  │   │ auction_session_id (FK)│   │ auction_session  │
 │ user_id  │   │ user_id (FK)           │   │ buyer_id (FK)    │
 │ amount   │   │ deposit_amount         │   │ seller_id (FK)   │
 │ status   │   │ deposit_status         │   │ shipping_addr_id │
 │ bid_time │   └────────────────────────┘   │ final_price      │
 └──────────┘                                 │ platform_fee     │
                                              │ shipping_fee     │
                                              │ status, version  │
                                              └────────┬─────────┘
                                                       │ 1:1
                                                       ▼
                                              ┌────────────────┐
                                              │   shipments    │
                                              ├────────────────┤
                                              │ id (PK)        │
                                              │ order_id (UQ)  │
                                              │ carrier_name   │
                                              │ tracking_code  │
                                              │ status         │
                                              └────────┬───────┘
                                                       │ 1:1
                                                       ▼
                                              ┌────────────────┐
                                              │    disputes    │
                                              ├────────────────┤
                                              │ id (PK)        │
                                              │ order_id (UQ)  │
                                              │ complainant_id │
                                              │ reason, status │
                                              │ admin_id       │
                                              └────────────────┘
```

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
- Dùng để validate địa chỉ khi tạo orders/shipments

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

### users


| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PK | UUID của người dùng |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email đăng nhập |
| password_hash | VARCHAR(255) | NOT NULL | Mật khẩu đã mã hóa |
| full_name | VARCHAR(100) | NOT NULL | Họ tên hiển thị |
| phone_number | VARCHAR(20) | UNIQUE, NULLABLE | Số điện thoại |
| avatar_url | VARCHAR(500) | NULLABLE | Ảnh đại diện |
| status | VARCHAR(20) | NOT NULL | Enum: ACTIVE, BANNED, UNVERIFIED |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thời điểm tạo |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Thời điểm cập nhật |
**Indexes:**

- UNIQUE INDEX idx_users_email ON users(email)
- UNIQUE INDEX idx_users_phone_number ON users(phone_number)

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
| reputation_score | DECIMAL(3,2) | NOT NULL, DEFAULT 5.00 | Điểm uy tín người bán |

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
| image_url | VARCHAR(500) | NOT NULL | Link ảnh cloud |
| is_primary | BOOLEAN | NOT NULL, DEFAULT false | Ảnh bìa |
| sort_order | INT | NOT NULL, DEFAULT 0 | Thứ tự hiển thị |

**Indexes:**

- INDEX idx_product_images_product_id ON product_images(product_id)

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
| seller_accuracy | DECIMAL(3,2) | NULLABLE | Điểm trung thực seller (1-5) |
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

### appraisal_images
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| appraisal_report_id | BIGINT | NOT NULL, FK → appraisal_reports(id) | |
| image_url | VARCHAR(500) | NOT NULL | Ảnh bằng chứng |
| description | VARCHAR(255) | NULLABLE | Chú thích ảnh |

**Indexes:**

- INDEX idx_appraisal_images_report_id ON appraisal_images(appraisal_report_id)

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
| reference_type | VARCHAR(20) | NULLABLE | Enum: AUCTION, ORDER, SYSTEM |
| status | VARCHAR(20) | NOT NULL | Enum: SUCCESS, FAILED, PENDING |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |

**Indexes:**

- INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id)
- INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at)
- INDEX idx_wallet_transactions_reference ON wallet_transactions(reference_type, reference_id)

**Notes:**

- Mọi thay đổi số dư ví bắt buộc phải insert 1 dòng vào bảng này
- Không được cập nhật ví mà không có audit log

### auction_sessions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| product_id | BIGINT | NOT NULL, FK → products(id) | Chỉ nhận sản phẩm APPRAISED |
| starting_price | DECIMAL(19,2) | NOT NULL | Giá khởi điểm |
| reserve_price | DECIMAL(19,2) | NOT NULL | Giá sàn |
| step_price | DECIMAL(19,2) | NOT NULL | Bước giá |
| deposit_amount | DECIMAL(19,2) | NOT NULL | Tiền cọc yêu cầu |
| start_time | TIMESTAMP | NOT NULL | Giờ bắt đầu |
| end_time | TIMESTAMP | NOT NULL | Giờ kết thúc |
| current_price | DECIMAL(19,2) | NULLABLE | Giá cuối cùng sync về DB |
| highest_bidder_id | VARCHAR(36) | NULLABLE, FK → users(id) | Người đang dẫn đầu / thắng |
| winner_bid_id | BIGINT | NULLABLE, FK → bids(id) | Bid thắng cuộc |
| status | VARCHAR(20) | NOT NULL | Enum: WAITING, ACTIVE, ENDED_SUCCESS, ENDED_FAILED, CANCELED |
| version | INT | NOT NULL, DEFAULT 0 | Optimistic locking DB |

**Indexes:**

- INDEX idx_auction_sessions_product_id ON auction_sessions(product_id)
- INDEX idx_auction_sessions_status ON auction_sessions(status)
- INDEX idx_auction_sessions_end_time ON auction_sessions(end_time)
- INDEX idx_auction_sessions_status_end_time ON auction_sessions(status, end_time)

**Notes:**

- Khi status = ACTIVE, Redis là source of truth cho current_price và end_time
- DB chỉ dùng để sync, audit và chốt phiên
- current_price trong MySQL chỉ là snapshot/sync value, không dùng để validate bid realtime
### auction_participants
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| auction_session_id | BIGINT | NOT NULL, FK → auction_sessions(id) | |
| user_id | VARCHAR(36) | NOT NULL, FK → users(id) | Người tham gia |
| deposit_amount | DECIMAL(19,2) | NOT NULL | Số tiền cọc đã khóa |
| deposit_status | VARCHAR(20) | NOT NULL | Enum: FROZEN, REFUNDED, DEDUCTED, CONFISCATED |

**Indexes:**

- UNIQUE INDEX uq_auction_participants_user_session ON auction_participants(user_id, auction_session_id)
- INDEX idx_auction_participants_session_id ON auction_participants(auction_session_id)

### bids
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| auction_session_id | BIGINT | NOT NULL, FK → auction_sessions(id) | |
| user_id | VARCHAR(36) | NOT NULL, FK → users(id) | |
| bid_amount | DECIMAL(19,2) | NOT NULL | Giá bid |
| status | VARCHAR(20) | NOT NULL | Enum: VALID, INVALID_PRICE, REJECTED_TIME |
| bid_time | TIMESTAMP | NOT NULL | Thời điểm ghi nhận |

**Indexes:**

- INDEX idx_bids_auction_session_bid_time ON bids(auction_session_id, bid_time)
- INDEX idx_bids_auction_session_bid_amount ON bids(auction_session_id, bid_amount DESC)
- INDEX idx_bids_bid_time ON bids(bid_time)

**Notes:**

- Bảng append-only, không update / delete log bid
- Bid hợp lệ thời gian thực được xỚ lý trên Redis, bảng này là audit log

### orders
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| auction_session_id | BIGINT | NOT NULL, UNIQUE, FK → auction_sessions(id) | 1 phiên thắng tạo 1 đơn |
| buyer_id | VARCHAR(36) | NOT NULL, FK → users(id) | Người thắng |
| seller_id | VARCHAR(36) | NOT NULL, FK → users(id) | Chủ sản phẩm |
| shipping_address_id | BIGINT | NOT NULL, FK → addresses(id) | Địa chỉ giao hàng |
| final_price | DECIMAL(19,2) | NOT NULL | Giá chốt chưa trừ cọc |
| platform_fee | DECIMAL(19,2) | NOT NULL, DEFAULT 0.00 | Phí sàn |
| shipping_fee | DECIMAL(19,2) | NOT NULL, DEFAULT 0.00 | Phí ship |
| total_amount | DECIMAL(19,2) | NOT NULL | Số tiền buyer phải thanh toán nốt |
| status | VARCHAR(30) | NOT NULL | Enum: PENDING_PAYMENT, PREPARING, SHIPPING, DELIVERED, COMPLETED, DISPUTED, CANCELED, REFUNDED |
| payment_deadline | TIMESTAMP | NOT NULL | Hạn thanh toán |
| delivered_at | TIMESTAMP | NULLABLE | Mốc đếm 72h auto-complete |
| version | INT | NOT NULL, DEFAULT 0 | Optimistic locking |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

**Indexes:**

- UNIQUE INDEX idx_orders_auction_session_id ON orders(auction_session_id)
- INDEX idx_orders_buyer_id ON orders(buyer_id)
- INDEX idx_orders_seller_id ON orders(seller_id)
- INDEX idx_orders_status ON orders(status)
- INDEX idx_orders_delivered_at ON orders(delivered_at)

**Notes:**

- Tiền buyer thanh toán không đi thẳng vào seller, mà giữ ở escrow của sàn
- Khi đơn COMPLETED, hệ thống mới release funds cho seller

### shipments
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| order_id | BIGINT | NOT NULL, UNIQUE, FK → orders(id) | 1 đơn = 1 vận đơn |
| carrier_name | VARCHAR(100) | NULLABLE | Đơn vị vận chuyển |
| tracking_code | VARCHAR(100) | NULLABLE | Mã vận đơn |
| packing_video_url | VARCHAR(500) | NULLABLE | Video đóng gói |
| status | VARCHAR(20) | NOT NULL | Enum: PENDING, PICKED_UP, IN_TRANSIT, DELIVERED, RETURNED |
| shipped_at | TIMESTAMP | NULLABLE | Thời điểm shipper nhận hàng |

**Indexes:**

- UNIQUE INDEX idx_shipments_order_id ON shipments(order_id)
- INDEX idx_shipments_tracking_code ON shipments(tracking_code)

### disputes
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | |
| order_id | BIGINT | NOT NULL, UNIQUE, FK → orders(id) | 1 đơn tối đa 1 dispute |
| complainant_id | VARCHAR(36) | NOT NULL, FK → users(id) | Người khiếu nại |
| reason | VARCHAR(30) | NOT NULL | Enum: DAMAGED_IN_TRANSIT, NOT_AS_DESCRIBED, FAKE_MATERIAL |
| description | TEXT | NOT NULL | Nội dung khiếu nại |
| proof_images | JSON | NULLABLE | Danh sách ảnh bằng chứng |
| admin_id | VARCHAR(36) | NULLABLE, FK → users(id) | Admin xỚ lý |
| status | VARCHAR(40) | NOT NULL | Enum: OPEN, UNDER_REVIEW, RESOLVED_REFUND_BUYER, RESOLVED_RELEASE_FUNDS |
| admin_judgment | TEXT | NULLABLE | Phán quyết cuối cùng |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

**Indexes:**

- UNIQUE INDEX idx_disputes_order_id ON disputes(order_id)
- INDEX idx_disputes_status ON disputes(status)
- INDEX idx_disputes_admin_id ON disputes(admin_id)

---

## Relationships Summary

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
Escrow Rules
Khi tham gia đấu giá: tiền cọc chuyển từ available_balance → frozen_balance
Người thua: deposit_status = REFUNDED
Người thắng nhưng không thanh toán: deposit_status = CONFISCATED
Tiền seller chỉ được nhả khi đơn hoàn tất hoặc dispute được giải quyết theo hướng seller thắng
Real-time Auction Rules
Redis là source of truth khi phiên ACTIVE
bids và auction_sessions.current_price trong MySQL đóng vai trò audit / final snapshot
Anti-sniper: bid hợp lệ trong 30 giây cuối → cộng thêm 60 giây
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

Total tables: 24

**Infrastructure & Location (11 tables):**
- users
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

**Catalog & Appraisal (5 tables):**
- categories
- products
- product_images
- appraisal_reports
- appraisal_images

**Finance (2 tables):**
- wallets
- wallet_transactions

**Auction & Bidding (3 tables):**
- auction_sessions
- auction_participants
- bids

**Fulfillment (3 tables):**
- orders
- shipments
- disputes

**Note:** Total 24 tables including all join tables, master data, and operational tables. Updated count reflects addition of location hierarchy (provinces, districts, wards) and refresh tokens for JWT management.

### Recommended Schema Strategy

- **dev:** Hibernate ddl-auto=update
- **prod:** ddl-auto=validate
- **Production migration:** use Flyway or Liquibase

### Recommended Cleanup Jobs

- Cleanup expired refresh tokens (daily job)
- Auto-complete delivered orders after 72 hours (scheduled task)
- Auction close scheduler (realtime event listener)