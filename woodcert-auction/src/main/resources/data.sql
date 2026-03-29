-- ============================================================
-- Seed Data for WoodCert Auction Platform
-- Runs on every startup (INSERT IGNORE = skip if already exists)
-- ============================================================

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
