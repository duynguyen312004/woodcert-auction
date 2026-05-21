package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.service.command.AuctionCommandService;
import com.woodcert.auction.feature.auction.service.query.AuctionQueryService;
import com.woodcert.auction.feature.auction.service.query.PublicAuctionSearchCriteria;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

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
    public AuctionDetailRes getPublicAuctionDetail(Long auctionId) {
        return queryService.getPublicAuctionDetail(auctionId);
    }

    @Override
    public PaginationResponse<SellerAuctionListRes> getSellerAuctions(String sellerId, int page, int size, String status) {
        return queryService.getSellerAuctions(sellerId, page, size, status);
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
