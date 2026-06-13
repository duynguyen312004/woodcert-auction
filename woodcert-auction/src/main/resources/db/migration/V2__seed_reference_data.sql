-- Stable reference data for roles, permissions, and the flat MVP category taxonomy.

INSERT INTO roles (id, name) VALUES
    (1, 'ROLE_BIDDER'),
    (2, 'ROLE_SELLER'),
    (3, 'ROLE_APPRAISER'),
    (4, 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE
    name = VALUES(name);

INSERT INTO permissions (id, name, description) VALUES
    (1, 'CREATE_BID', 'Đặt giá trong phiên đấu giá'),
    (2, 'REGISTER_AUCTION', 'Đăng ký tham gia phiên đấu giá và đóng băng tiền cọc'),
    (3, 'CREATE_PRODUCT', 'Tạo sản phẩm mới'),
    (4, 'SUBMIT_APPRAISAL_REQUEST', 'Gửi yêu cầu kiểm định sản phẩm'),
    (5, 'CREATE_AUCTION_SESSION', 'Tạo phiên đấu giá cho sản phẩm đã kiểm định'),
    (6, 'APPROVE_PRODUCT', 'Duyệt và kiểm định sản phẩm'),
    (7, 'CONFIRM_DELIVERY', 'Xác nhận giao hàng'),
    (8, 'RESOLVE_DISPUTE', 'Giải quyết tranh chấp'),
    (9, 'BAN_USER', 'Khóa tài khoản người dùng'),
    (10, 'ADMIN_ACCESS', 'Truy cập khu quản trị'),
    (11, 'MANAGE_CATEGORIES', 'Quản lý danh mục sản phẩm'),
    (12, 'MANAGE_APPRAISERS', 'Quản lý người kiểm định'),
    (13, 'VIEW_PLATFORM_REVENUE', 'Xem doanh thu nền tảng')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id) VALUES
    (1, 1),
    (1, 2),
    (2, 3),
    (2, 4),
    (2, 5),
    (2, 7),
    (3, 6),
    (4, 8),
    (4, 9),
    (4, 10),
    (4, 11),
    (4, 12),
    (4, 13)
ON DUPLICATE KEY UPDATE
    role_id = VALUES(role_id),
    permission_id = VALUES(permission_id);

INSERT INTO categories (id, name, slug, parent_id, description) VALUES
    (1, 'Tượng & Điêu Khắc Gỗ', 'tuong-dieu-khac-go', NULL, 'Tượng, phù tượng và tác phẩm điêu khắc gỗ độc bản hoặc thủ công tinh xảo'),
    (2, 'Tranh & Phù Điêu Gỗ', 'tranh-phu-dieu-go', NULL, 'Tranh gỗ, phù điêu, mảng chạm và tác phẩm treo tường'),
    (3, 'Đồ Thờ & Tâm Linh', 'do-tho-tam-linh', NULL, 'Bàn thờ, hoành phi, câu đối, tượng thờ và vật phẩm tâm linh bằng gỗ'),
    (4, 'Bình & Lộc Bình Gỗ', 'binh-loc-binh-go', NULL, 'Lộc bình, bình nghệ thuật và tác phẩm tiện gỗ nguyên khối'),
    (5, 'Nội Thất Nghệ Thuật', 'noi-that-nghe-thuat', NULL, 'Bàn ghế, sập, kệ và nội thất gỗ có giá trị sưu tầm hoặc chế tác cao'),
    (6, 'Gỗ Cảnh, Nu & Lũa', 'go-canh-nu-lua', NULL, 'Gỗ cảnh tự nhiên, nu gỗ, lũa gỗ và tác phẩm giữ dáng nguyên sinh'),
    (7, 'Hộp, Khay & Vật Phẩm Trang Trí', 'hop-khay-vat-pham-trang-tri', NULL, 'Hộp, khay, đế, tượng nhỏ và vật phẩm trang trí gỗ'),
    (8, 'Trang Sức & Phụ Kiện Gỗ', 'trang-suc-phu-kien-go', NULL, 'Vòng tay, chuỗi hạt, mặt dây và phụ kiện gỗ quý'),
    (9, 'Tác Phẩm Sưu Tầm', 'tac-pham-suu-tam', NULL, 'Tác phẩm hiếm, bản giới hạn hoặc có câu chuyện nguồn gốc nổi bật'),
    (10, 'Khác', 'khac', NULL, 'Sản phẩm gỗ mỹ nghệ không thuộc các nhóm chính')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    slug = VALUES(slug),
    parent_id = VALUES(parent_id),
    description = VALUES(description);
