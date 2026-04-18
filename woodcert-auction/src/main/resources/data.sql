-- ============================================================
-- Seed Data for WoodCert Auction Platform
-- Runs on every startup (INSERT IGNORE = skip if already exists)
-- ============================================================

SET NAMES utf8mb4;

-- ========================
-- ROLES
-- ========================
INSERT IGNORE INTO roles (id, name) VALUES (1, 'ROLE_BIDDER');
INSERT IGNORE INTO roles (id, name) VALUES (2, 'ROLE_SELLER');
INSERT IGNORE INTO roles (id, name) VALUES (3, 'ROLE_APPRAISER');
INSERT IGNORE INTO roles (id, name) VALUES (4, 'ROLE_ADMIN');

-- ========================
-- PERMISSIONS
-- ========================
-- Bidder permissions
INSERT IGNORE INTO permissions (id, name, description) VALUES (1, 'CREATE_BID', 'Đặt giá trong phiên đấu giá');
INSERT IGNORE INTO permissions (id, name, description) VALUES (2, 'JOIN_AUCTION', 'Đăng ký tham gia phiên đấu giá');

-- Seller permissions
INSERT IGNORE INTO permissions (id, name, description) VALUES (3, 'CREATE_PRODUCT', 'Tạo sản phẩm mới');
INSERT IGNORE INTO permissions (id, name, description) VALUES (4, 'SUBMIT_APPRAISAL_REQUEST', 'Gửi yêu cầu kiểm định sản phẩm');
INSERT IGNORE INTO permissions (id, name, description) VALUES (5, 'CREATE_AUCTION_SESSION', 'Tạo phiên đấu giá cho sản phẩm đã kiểm định');

-- Appraiser permissions
INSERT IGNORE INTO permissions (id, name, description) VALUES (6, 'APPROVE_PRODUCT', 'Duyệt và kiểm định sản phẩm');

-- Fulfillment permissions
INSERT IGNORE INTO permissions (id, name, description) VALUES (7, 'CONFIRM_DELIVERY', 'Xác nhận giao hàng');

-- Admin permissions
INSERT IGNORE INTO permissions (id, name, description) VALUES (8, 'RESOLVE_DISPUTE', 'Giải quyết tranh chấp');
INSERT IGNORE INTO permissions (id, name, description) VALUES (9, 'BAN_USER', 'Khóa tài khoản người dùng');

-- ========================
-- ROLE_PERMISSIONS MAPPING
-- ========================
-- ROLE_BIDDER: CREATE_BID, JOIN_AUCTION
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, 1);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, 2);

-- ROLE_SELLER: CREATE_PRODUCT, SUBMIT_APPRAISAL_REQUEST, CREATE_AUCTION_SESSION, CONFIRM_DELIVERY
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (2, 3);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (2, 4);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (2, 5);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (2, 7);

-- ROLE_APPRAISER: APPROVE_PRODUCT
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (3, 6);

-- ROLE_ADMIN: ALL permissions (full access)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 1);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 2);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 3);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 4);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 5);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 6);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 7);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 8);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, 9);

-- ========================
-- CATEGORIES (Wood Art Products)
-- ========================
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (1, 'Tượng Gỗ Phong Thủy', 'tuong-go-phong-thuy', NULL, 'Các loại tượng gỗ Đạt Ma, Di Lặc, Phật Bà, Thần Tài...');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (2, 'Lục Bình Gỗ', 'luc-binh-go', NULL, 'Lục bình gỗ nguyên khối các loại');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (3, 'Bàn Ghế Gỗ', 'ban-ghe-go', NULL, 'Bàn ghế gỗ nguyên khối, bộ bàn ghế phòng khách');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (4, 'Tranh Gỗ', 'tranh-go', NULL, 'Tranh gỗ chạm khắc, tranh gỗ phong thủy');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (5, 'Tượng Gỗ Nghệ Thuật', 'tuong-go-nghe-thuat', NULL, 'Tượng gỗ nghệ thuật điêu khắc tay');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (6, 'Sập Gỗ', 'sap-go', NULL, 'Sập gỗ nguyên khối, sập thờ, sập chân quỳ');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (7, 'Đồ Thờ Cúng', 'do-tho-cung', NULL, 'Bàn thờ, hoành phi, câu đối, đỉnh hương gỗ');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (8, 'Gỗ Cảnh - Nu - Lũa', 'go-canh-nu-lua', NULL, 'Gỗ cảnh tự nhiên, nu gỗ, lũa gỗ nghệ thuật');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (9, 'Đồ Gỗ Trang Trí', 'do-go-trang-tri', NULL, 'Các sản phẩm gỗ trang trí nội thất');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (10, 'Vòng Tay - Chuỗi Hạt Gỗ', 'vong-tay-chuoi-hat-go', NULL, 'Vòng tay, chuỗi hạt từ các loại gỗ quý');
INSERT IGNORE INTO categories (id, name, slug, parent_id, description) VALUES (11, 'Khác', 'khac', NULL, 'Các sản phẩm gỗ mỹ nghệ khác');
