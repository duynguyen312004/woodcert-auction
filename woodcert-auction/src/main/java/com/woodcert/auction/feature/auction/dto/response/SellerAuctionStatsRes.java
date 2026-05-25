package com.woodcert.auction.feature.auction.dto.response;

/**
 * Thống kê số lượng phiên đấu giá của seller theo từng trạng thái.
 *
 * Endpoint GET /me/stats dùng để tránh tải toàn bộ danh sách phiên chỉ để
 * đếm — payload nhỏ gọn và truy vấn GROUP BY chạy nhanh nhờ index.
 */
public record SellerAuctionStatsRes(
        long waiting,
        long active,
        long endedSuccess,
        long endedFailed,
        long canceled
) {
}
