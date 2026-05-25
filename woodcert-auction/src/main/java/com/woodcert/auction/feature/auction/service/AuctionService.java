package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionStatsRes;

import java.math.BigDecimal;

/**
 * Interface service cho các luồng đấu giá.
 *
 * Controller gọi qua interface này để duyệt phiên public, quản lý phiên của
 * seller, đăng ký buyer và lấy chi tiết phiên.
 */
public interface AuctionService {

    /**
     * Tạo phiên đấu giá mới cho seller đang đăng nhập.
     */
    AuctionDetailRes createAuctionSession(String sellerId, CreateAuctionSessionReq request);

    /**
     * Lấy danh sách đấu giá public kèm các filter nếu có.
     */
    PaginationResponse<AuctionListRes> getPublicAuctions(
            int page, int size, String status,
            String material, String categoryName,
            BigDecimal priceMin, BigDecimal priceMax);

    /**
     * Lấy chi tiết phiên cho trang public và màn preview seller.
     */
    AuctionDetailRes getPublicAuctionDetail(Long auctionId);

    /**
     * Lấy danh sách phiên thuộc về một seller.
     */
    PaginationResponse<SellerAuctionListRes> getSellerAuctions(String sellerId, int page, int size, String status);

    SellerAuctionDetailRes getSellerAuctionDetail(String sellerId, Long auctionId);

    /**
     * Trả về số lượng phiên theo từng trạng thái cho seller — kông load toàn bộ danh sách.
     */
    SellerAuctionStatsRes getSellerAuctionStats(String sellerId);

    /**
     * Hủy phiên của seller nếu đúng chủ sở hữu và trạng thái cho phép.
     */
    void cancelAuctionSession(String sellerId, Long auctionId);

    /**
     * Đăng ký buyer vào phiên trước khi tham gia đấu giá.
     */
    void registerForAuction(String userId, Long auctionId);
}
