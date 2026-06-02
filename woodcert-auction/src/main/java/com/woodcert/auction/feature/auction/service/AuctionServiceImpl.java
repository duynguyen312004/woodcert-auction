package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.BidHistoryItemRes;
import com.woodcert.auction.feature.auction.dto.response.BuyerAuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.BuyerAuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.BuyerAuctionStatsRes;
import com.woodcert.auction.feature.auction.dto.response.MyParticipationRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionStatsRes;
import com.woodcert.auction.feature.auction.service.command.AuctionCommandService;
import com.woodcert.auction.feature.auction.service.query.AuctionQueryService;
import com.woodcert.auction.feature.auction.service.query.BuyerAuctionQueryService;
import com.woodcert.auction.feature.auction.service.query.PublicAuctionSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service trung gian cho các use case đấu giá.
 *
 * Controller chỉ gọi service này. Các thao tác ghi được chuyển sang
 * AuctionCommandService, còn đọc danh sách/chi tiết chuyển sang AuctionQueryService.
 */
@Service
@RequiredArgsConstructor
public class AuctionServiceImpl implements AuctionService {

    // Xử lý các thao tác làm đổi dữ liệu như tạo, hủy, đăng ký.
    private final AuctionCommandService commandService;

    // Xử lý dữ liệu đọc và filter cho màn public/seller.
    private final AuctionQueryService queryService;
    private final BuyerAuctionQueryService buyerAuctionQueryService;

    @Override
    public AuctionDetailRes createAuctionSession(String sellerId, CreateAuctionSessionReq request) {
        return commandService.createAuctionSession(sellerId, request);
    }

    @Override
    public PaginationResponse<AuctionListRes> getPublicAuctions(
            int page, int size, String status,
            String material, String categoryName,
            BigDecimal priceMin, BigDecimal priceMax) {
        // Gom filter từ controller vào criteria trước khi đưa xuống tầng đọc dữ liệu.
        return queryService.getPublicAuctions(new PublicAuctionSearchCriteria(
                page, size, status, material, categoryName, priceMin, priceMax));
    }

    @Override
    public List<String> getPublicAuctionMaterials() {
        return queryService.getPublicAuctionMaterials();
    }

    @Override
    public AuctionDetailRes getPublicAuctionDetail(Long auctionId) {
        return queryService.getPublicAuctionDetail(auctionId);
    }

    @Override
    public MyParticipationRes getMyParticipation(String userId, Long auctionId) {
        return queryService.getMyParticipation(userId, auctionId);
    }

    @Override
    public List<BidHistoryItemRes> getBidHistory(Long auctionId, int size, String currentUserId) {
        return queryService.getBidHistory(auctionId, size, currentUserId);
    }

    @Override
    public PaginationResponse<SellerAuctionListRes> getSellerAuctions(String sellerId, int page, int size, String status) {
        return queryService.getSellerAuctions(sellerId, page, size, status);
    }

    @Override
    public SellerAuctionDetailRes getSellerAuctionDetail(String sellerId, Long auctionId) {
        return queryService.getSellerAuctionDetail(sellerId, auctionId);
    }

    @Override
    public SellerAuctionStatsRes getSellerAuctionStats(String sellerId) {
        return queryService.getSellerAuctionStats(sellerId);
    }

    @Override
    public PaginationResponse<BuyerAuctionListRes> getMyAuctions(String userId, int page, int size, String outcome) {
        return buyerAuctionQueryService.getMyAuctions(userId, page, size, outcome);
    }

    @Override
    public BuyerAuctionDetailRes getMyAuctionDetail(String userId, Long auctionId) {
        return buyerAuctionQueryService.getMyAuctionDetail(userId, auctionId);
    }

    @Override
    public BuyerAuctionStatsRes getMyAuctionStats(String userId) {
        return buyerAuctionQueryService.getMyAuctionStats(userId);
    }

    @Override
    public void cancelAuctionSession(String sellerId, Long auctionId) {
        commandService.cancelAuctionSession(sellerId, auctionId);
    }

    @Override
    public void registerForAuction(String userId, Long auctionId) {
        commandService.registerForAuction(userId, auctionId);
    }
}
