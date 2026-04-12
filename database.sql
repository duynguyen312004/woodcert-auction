NHOM 1: QUAN LY DINH DANH VA PHAN QUYEN (IAM)

Tai lieu du lieu duoc format lai de de doc, de doi chieu va de chuyen thanh DDL sau nay.

1) Bang users (Tai khoan nguoi dung trung tam)
Mo ta:
- Luu tru thong tin dang nhap va dinh danh co ban cua moi user tren he thong.
- Doi tuong: Bidder, Seller, Appraiser, Admin.

Cac cot:
- id                VARCHAR(36)   PK. Khuyen dung UUID.
- email             VARCHAR(255)  UNIQUE, NOT NULL. Dung lam tai khoan dang nhap.
- password_hash     VARCHAR(255)  NOT NULL. Mat khau da ma hoa (Bcrypt/Argon2).
- full_name         VARCHAR(100)  NOT NULL. Ho va ten hien thi.
- phone_number      VARCHAR(20)   UNIQUE. So dien thoai lien he.
- avatar_url        VARCHAR(500)  Duong dan anh dai dien.
- status            ENUM          ACTIVE, BANNED, UNVERIFIED (mac dinh).
- created_at        TIMESTAMP     Thoi gian tao tai khoan.
- updated_at        TIMESTAMP     Thoi gian cap nhat gan nhat.

1.1) Bang email_verification_tokens (Token xac minh email)
Mo ta:
- Luu token xac minh dang raw duoc hash SHA-256 truoc khi luu DB.
- Moi token chi dung mot lan va co han su dung.

Cac cot:
- id                BIGINT        PK, auto increment.
- user_id           VARCHAR(36)   FK -> users.id.
- token_hash        CHAR(64)      UNIQUE, NOT NULL. SHA-256 cua raw token gui cho user.
- expires_at        TIMESTAMP     Thoi gian het han cua token.
- verified_at       TIMESTAMP     Thoi gian token duoc xac minh thanh cong.
- created_at        TIMESTAMP     Thoi gian tao token.

2) Bang addresses (So dia chi giao/nhan hang)
Mo ta:
- Thay the cho buyer_profile.
- Cho phep mot user co nhieu dia chi nhan hang khac nhau.

Cac cot:
- id                BIGINT        PK, auto increment.
- user_id           VARCHAR(36)   FK -> users.id.
- receiver_name     VARCHAR(100)  NOT NULL. Ten nguoi nhan (co the khac chu tai khoan).
- phone_number      VARCHAR(20)   NOT NULL. So dien thoai nguoi nhan.
- street_address    VARCHAR(255)  NOT NULL. So nha, ten duong, thon/xom.
- province_id       INT           ID Tinh/Thanh pho (de tich hop API van chuyen).
- district_id       INT           ID Quan/Huyen.
- ward_id           INT           ID Phuong/Xa.
- is_default        BOOLEAN       Danh dau dia chi mac dinh (default: false).

3) Bang roles (Tu dien vai tro)
Mo ta:
- Dinh nghia cac nhom vai tro lon trong he thong.

Cac cot:
- id                INT           PK, auto increment.
- name              VARCHAR(50)   UNIQUE, NOT NULL.
                                    Vi du: ROLE_BIDDER, ROLE_SELLER,
                                           ROLE_APPRAISER, ROLE_ADMIN.

4) Bang permissions (Tu dien quyen han nghiep vu)
Mo ta:
- Luu tru cac quyen cu the, doc lap voi endpoint API.
- Huong thiet ke theo mo hinh enterprise.

Cac cot:
- id                INT            PK, auto increment.
- name              VARCHAR(100)   UNIQUE, NOT NULL.
                                     Vi du: CREATE_BID, APPROVE_PRODUCT, BAN_USER.
- description       VARCHAR(255)   Mo ta chi tiet muc dich su dung quyen.

5) Bang role_permissions (Phan quyen cho vai tro)
Mo ta:
- Bang trung gian N-N giua roles va permissions.

Cac cot:
- role_id           INT           PK, FK -> roles.id.
- permission_id     INT           PK, FK -> permissions.id.

Rang buoc:
- Composite key: (role_id, permission_id).

6) Bang user_roles (Gan vai tro cho nguoi dung)
Mo ta:
- Bang trung gian N-N giua users va roles.

Cac cot:
- user_id           VARCHAR(36)   PK, FK -> users.id.
- role_id           INT           PK, FK -> roles.id.

Rang buoc:
- Composite key: (user_id, role_id).

7) Bang seller_profiles (Ho so nguoi ban)
Mo ta:
- Luu tru thong tin mo rong mang tinh phap ly cho user dang ky ban hang.

Cac cot:
- user_id              VARCHAR(36)   PK, FK -> users.id (quan he 1-1).
- store_name           VARCHAR(100)  NOT NULL. Ten gian hang / xuong go hien thi tren san.
- identity_card_number VARCHAR(20)   UNIQUE, NOT NULL. So CCCD/CMND dinh danh phap ly.
- tax_code             VARCHAR(50)   Ma so thue (ca nhan hoac doanh nghiep).
- reputation_score     DECIMAL(3,2)  Diem uy tin (VD: 4.85), default: 5.00,
                                      tinh toan dua tren danh gia giao dich.



==============================================================================
NHOM 2: SAN PHAM & LUONG KIEM DINH (PRODUCT & APPRAISAL)
==============================================================================

1) Bang categories (Danh muc phan loai)
Mo ta:
- Su dung thiet ke da cap (Hierarchical) qua cot parent_id.
- Khong luu ten cac loai go vao day de tranh rac danh muc.
- Loai go se duoc bo loc (Filter) xu ly dua tren du lieu kiem dinh.

Cac cot:
- id                INT           PK, auto increment.
- name              VARCHAR(100)  UNIQUE, NOT NULL. Ten danh muc (VD: Tuong Go Phong Thuy).
- slug              VARCHAR(100)  UNIQUE, NOT NULL. Dung cho URL SEO.
- parent_id         INT           FK -> categories.id. NULL neu la cap cao nhat.
- description       VARCHAR(255)  Mo ta danh muc.

2) Bang products (Thong tin San pham tho do Seller khai bao)
Mo ta:
- Thong tin "quang cao" cua Seller, chua duoc xac thuc.
- Cot status dieu huong luong di cua san pham (State Machine).

Cac cot:
- id                BIGINT        PK, auto increment.
- seller_id         VARCHAR(36)   FK -> users.id.
- category_id       INT           FK -> categories.id.
- title             VARCHAR(255)  NOT NULL. Ten san pham.
- description       LONGTEXT      Bai gioi thieu chi tiet (HTML/Markdown).
- material          VARCHAR(100)  Chat lieu do nguoi ban tu khai bao.
- dimensions        VARCHAR(100)  Kich thuoc (Dai x Rong x Cao).
- weight            DECIMAL(10,2) Trong luong (kg) de tinh phi van chuyen.
- status            ENUM          DRAFT, PENDING_APPRAISAL, REJECTED, APPRAISED.
- submitted_at      TIMESTAMP     Thoi diem Seller bam "Gui kiem dinh".
- rejected_reason   TEXT          Ly do tu choi (chi co khi status = REJECTED).
- created_at        TIMESTAMP     Thoi gian tao.
- updated_at        TIMESTAMP     Thoi gian cap nhat.

3) Bang product_images (Bo suu tap anh quang cao)
Mo ta:
- Bo sung sort_order de Frontend hien thi anh theo y do sap xep cua Seller.

Cac cot:
- id                BIGINT        PK, auto increment.
- product_id        BIGINT        FK -> products.id.
- image_url         VARCHAR(500)  NOT NULL. Link anh luu tren Cloud.
- is_primary        BOOLEAN       Anh bia Thumbnail (default: false).
- sort_order        INT           Thu tu sap xep anh (default: 0).

4) Bang appraisal_reports (Chung thu Tham dinh - Loi He Thong)
Mo ta:
- Giai quyet bai toan cot loi: Chong lua dao va Xac thuc thong tin.
- Chuan hoa ENUM de tranh rac du lieu.

Cac cot:
- id                        BIGINT        PK, auto increment.
- product_id                BIGINT        UNIQUE, FK -> products.id (1-1).
- appraiser_id              VARCHAR(36)   FK -> users.id (Chuyen gia thuc hien).
- certificate_code          VARCHAR(50)   UNIQUE, NOT NULL. Ma tra cuu cong khai.
- verified_material         VARCHAR(100)  NOT NULL. Chat go that (VD: Go Sua).
- origin                    VARCHAR(100)  Noi che tac/xuat xu.
- age_estimation            VARCHAR(50)   Tuoi tho uoc tinh cua vat pham.
- condition_grade           ENUM          EXCELLENT, GOOD, FAIR, POOR.
- estimated_value           DECIMAL(19,2) NOT NULL. Dinh gia tien mat (VND).
- is_authentic              BOOLEAN       True = Hang that / False = Hang gia, kem chat luong.
- appraiser_notes           TEXT          Ghi chu cac loi, vet nut, lich su phuc che...
- seller_accuracy           INT           Diem trung thuc cua Seller (1-5 sao).
- digital_signature         VARCHAR(255)  NOT NULL. Chu ky so chong sua doi Database.
- appraised_at              TIMESTAMP     Thoi diem ky duyet.

5) Bang appraisal_images (Bang chung Phap ly)
Mo ta:
- Anh thuc te do chuyen gia chup khi soi loi san pham.
- Bat buoc phai co de Admin giai quyet tranh chap (Dispute) neu co khieu nai.

Cac cot:
- id                    BIGINT        PK, auto increment.
- appraisal_report_id   BIGINT        FK -> appraisal_reports.id.
- image_url             VARCHAR(500)  NOT NULL. Link anh bang chung thuc te.
- description           VARCHAR(255)  Chu thich anh (VD: "Vet nut o de tuong").


==============================================================================
NHOM 3: HE THONG VI KY QUY & LUONG DAU GIA (ESCROW WALLET & AUCTION)
==============================================================================

1) Bang wallets (Vi tien ky quy)
Mo ta:
- Quan ly so du kha dung va so du dong bang de phuc vu coc dau gia.

Cac cot:
- id                BIGINT        PK, auto increment.
- user_id           VARCHAR(36)   UNIQUE, FK -> users.id.
- available_balance DECIMAL(19,2) Tien kha dung. Default: 0.
- frozen_balance    DECIMAL(19,2) Tien coc dang bi dong bang. Default: 0.
- version           INT           BAT BUOC. Optimistic locking cho giao dich dong thoi.

2) Bang wallet_transactions (Lich su dong tien - audit)
Mo ta:
- Luu vet moi bien dong tien cua vi de doi soat va truy vet.

Cac cot:
- id                BIGINT        PK, auto increment.
- wallet_id         BIGINT        FK -> wallets.id.
- amount            DECIMAL(19,2) So tien (+ hoac -).
- type              ENUM          DEPOSIT, WITHDRAW, FREEZE, UNFREEZE, PAYMENT.
- reference_id      BIGINT        ID phien dau gia hoac ID don hang.
- reference_type    ENUM          AUCTION, ORDER, SYSTEM.
- status            ENUM          SUCCESS, FAILED, PENDING.
- created_at        TIMESTAMP     Thoi diem bien dong.

3) Bang auction_sessions (Phien dau gia)
Ghi chu cot loi:
- Khi status = ACTIVE, cot current_price tren DB chi de tham khao (sync dinh ky).
- Toc do xu ly gia thuc te chay tren RAM (Redis).

Cac cot:
- id                BIGINT        PK, auto increment.
- product_id        BIGINT        FK -> products.id.
- starting_price    DECIMAL(19,2) Gia khoi diem.
- reserve_price     DECIMAL(19,2) Gia san (ban toi thieu).
- step_price        DECIMAL(19,2) Buoc gia.
- deposit_amount    DECIMAL(19,2) Tien coc yeu cau.
- start_time        TIMESTAMP     Gio bat dau.
- end_time          TIMESTAMP     Gio ket thuc (duoc update boi he Anti-Sniper).
- current_price     DECIMAL(19,2) Gia cao nhat cuoi cung (chot khi ENDED).
- highest_bidder_id VARCHAR(36)   FK. Nguoi thang cuoc.
- winner_bid_id     BIGINT        FK. Cuoc bid thang cuoc (de doi soat va tranh gian lan).
- status            ENUM          WAITING, ACTIVE, ENDED_SUCCESS, ENDED_FAILED, CANCELED.
- version           INT           Optimistic locking cho DB.

4) Bang auction_participants (Quan ly coc cua nguoi tham gia)
Mo ta:
- Theo doi trang thai tien coc cua tung nguoi trong tung phien dau gia.

Cac cot:
- id                 BIGINT        PK, auto increment.
- auction_session_id BIGINT        FK -> auction_sessions.id.
- user_id            VARCHAR(36)   FK -> users.id.
- deposit_amount     DECIMAL(19,2) So tien da khoa.
- deposit_status     ENUM          FROZEN, REFUNDED, DEDUCTED, CONFISCATED.

Rang buoc quan trong:
- UNIQUE(user_id, auction_session_id) de chong dup coc.

5) Bang bids (Lich su dau gia)
Mo ta:
- Luu toan bo lan ra gia va ket qua xac thuc cua he thong.

Cac cot:
- id                 BIGINT        PK, auto increment.
- auction_session_id BIGINT        FK -> auction_sessions.id.
- user_id            VARCHAR(36)   FK -> users.id.
- bid_amount         DECIMAL(19,2) So tien bid.
- status             ENUM          VALID, INVALID_PRICE, REJECTED_TIME.
- bid_time           TIMESTAMP     Thoi diem he thong ghi nhan.
INDEX (auction_session_id, bid_amount DESC) de nhanh chong xac dinh gia cao nhat va tranh gian lan.
Rang buoc quan trong:
- Can tao INDEX cho cot bid_time.


==============================================================================
NHOM 4: DON HANG, GIAO NHAN & GIAI QUYET TRANH CHAP (ORDER, SHIPPING & DISPUTE)
==============================================================================

1) Bang orders (Don hang escrow)
Cap nhat:
- Them cot delivered_at de toi uu cron job.
- Them trang thai REFUNDED.

Cac cot:
- id                  BIGINT        PK, auto increment.
- auction_session_id  BIGINT        UNIQUE, FK. Lien ket 1-1 voi phien dau gia thang.
- buyer_id            VARCHAR(36)   FK. Nguoi mua (nguoi thang).
- seller_id           VARCHAR(36)   FK. Nguoi ban (chu san pham).
- shipping_address_id BIGINT        FK -> addresses.id.
- final_price         DECIMAL(19,2) Gia chot (chua tru coc).
- platform_fee        DECIMAL(19,2) Phi san thu cua nguoi ban (VD: 5%).
- shipping_fee        DECIMAL(19,2) Phi ship (neu co API tinh phi).
- total_amount        DECIMAL(19,2) So tien buyer tra = final_price + shipping_fee - deposit_amount.
- status              ENUM          PENDING_PAYMENT, PREPARING, SHIPPING, DELIVERED,
                                    COMPLETED, DISPUTED, CANCELED, REFUNDED.
- payment_deadline    TIMESTAMP     Han chot thanh toan not tien.
- delivered_at        TIMESTAMP     INDEX. Moc thoi gian de chay job dem nguoc 72 gio.
                                    Du lieu sync tu bang shipments.
- created_at          TIMESTAMP     Thoi gian tao don hang.

2) Bang shipments (Van don)
Cap nhat:
- Them cot shipped_at de do luong toc do dong goi.

Cac cot:
- id                BIGINT        PK, auto increment.
- order_id          BIGINT        UNIQUE, FK -> orders.id.
- carrier_name      VARCHAR(100)  Don vi van chuyen.
- tracking_code     VARCHAR(100)  Ma tra cuu.
- packing_video_url VARCHAR(500)  Bang chung dong goi (chong tranh chap).
- status            ENUM          PENDING, PICKED_UP, IN_TRANSIT, DELIVERED, RETURNED.
- shipped_at        TIMESTAMP     Thoi diem shipper lay hang thanh cong.

3) Bang disputes (Xu ly tranh chap)
Mo ta:
- Quan ly ho so khieu nai va ket qua xu ly cua admin.

Cac cot:
- id             BIGINT        PK, auto increment.
- order_id       BIGINT        UNIQUE, FK -> orders.id.
- complainant_id VARCHAR(36)   FK. Nguoi nop don (thuong la buyer).
- reason         ENUM          DAMAGED_IN_TRANSIT, NOT_AS_DESCRIBED, FAKE_MATERIAL.
- description    TEXT          Loi to cao.
- proof_images   JSON          Mang link anh bang chung (toi da 5 anh).
- admin_id       VARCHAR(36)   FK. Admin thu ly.
- status         ENUM          OPEN, UNDER_REVIEW, RESOLVED_REFUND_BUYER,
                               RESOLVED_RELEASE_FUNDS.
- admin_judgment TEXT          Phan quyet lam co so refund hoac release fund.
