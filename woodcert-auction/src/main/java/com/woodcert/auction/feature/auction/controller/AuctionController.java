package com.woodcert.auction.feature.auction.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
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
import com.woodcert.auction.feature.auction.service.AuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Controller chính của module đấu giá.
 *
 * Người dùng public dùng để xem danh sách và chi tiết phiên. Seller đã đăng nhập
 * dùng để tạo, xem và hủy phiên của mình. Buyer dùng endpoint đăng ký trước khi
 * tham gia đấu giá.
 */
@RestController
@RequestMapping("/api/v1/auctions")
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginationResponse<AuctionListRes>>> getPublicAuctions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String material,
            @RequestParam(required = false) String categoryName,
            @RequestParam(required = false) BigDecimal priceMin,
            @RequestParam(required = false) BigDecimal priceMax) {
        // Danh sách public nhận các filter từ trang duyệt đấu giá.
        PaginationResponse<AuctionListRes> result = auctionService.getPublicAuctions(
                page, size, status, material, categoryName, priceMin, priceMax);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch auctions successful"));
    }

    @GetMapping("/materials")
    public ResponseEntity<ApiResponse<List<String>>> getPublicAuctionMaterials() {
        List<String> result = auctionService.getPublicAuctionMaterials();
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch public auction materials successful"));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginationResponse<SellerAuctionListRes>>> getSellerAuctions(
            @CurrentUserId String sellerId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        // Danh sách seller luôn lấy theo tài khoản đang đăng nhập.
        PaginationResponse<SellerAuctionListRes> result = auctionService.getSellerAuctions(sellerId, page, size, status);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch seller auctions successful"));
    }

    @GetMapping("/me/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SellerAuctionDetailRes>> getSellerAuctionDetail(
            @CurrentUserId String sellerId,
            @PathVariable Long id) {
        SellerAuctionDetailRes result = auctionService.getSellerAuctionDetail(sellerId, id);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch seller auction detail successful"));
    }

    /**
     * Thống kê số phiên của seller theo từng trạng thái — payload nhỏ gọn, không load toàn bộ danh sách.
     * Đặt trước /me/{id} nhưng Spring MVC luôn ưu tiên literal path nên không cần lo thứ tự.
     */
    @GetMapping("/me/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SellerAuctionStatsRes>> getSellerAuctionStats(
            @CurrentUserId String sellerId) {
        SellerAuctionStatsRes result = auctionService.getSellerAuctionStats(sellerId);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch seller auction stats successful"));
    }

    @GetMapping("/my-participations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PaginationResponse<BuyerAuctionListRes>>> getMyAuctions(
            @CurrentUserId String userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String outcome) {
        return ResponseEntity.ok(ApiResponse.success(
                auctionService.getMyAuctions(userId, page, size, outcome),
                "Fetch buyer auctions successful"));
    }

    @GetMapping("/my-participations/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BuyerAuctionStatsRes>> getMyAuctionStats(@CurrentUserId String userId) {
        return ResponseEntity.ok(ApiResponse.success(
                auctionService.getMyAuctionStats(userId),
                "Fetch buyer auction stats successful"));
    }

    @GetMapping("/my-participations/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BuyerAuctionDetailRes>> getMyAuctionDetail(
            @CurrentUserId String userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                auctionService.getMyAuctionDetail(userId, id),
                "Fetch buyer auction detail successful"));
    }

    @GetMapping("/{id}/my-participation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MyParticipationRes>> getMyParticipation(
            @CurrentUserId String userId,
            @PathVariable Long id) {
        MyParticipationRes result = auctionService.getMyParticipation(userId, id);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch participation context successful"));
    }

    @GetMapping("/{id}/bids")
    public ResponseEntity<ApiResponse<List<BidHistoryItemRes>>> getBidHistory(
            @CurrentUserId(required = false) String userId,
            @PathVariable Long id,
            @RequestParam(defaultValue = "20") int size) {
        List<BidHistoryItemRes> result = auctionService.getBidHistory(id, size, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch bid history successful"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuctionDetailRes>> getPublicAuctionDetail(@PathVariable Long id) {
        // Chi tiết này dùng chung cho trang buyer và màn preview của seller.
        AuctionDetailRes result = auctionService.getPublicAuctionDetail(id);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch auction successful"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_AUCTION_SESSION')")
    public ResponseEntity<ApiResponse<AuctionDetailRes>> createAuctionSession(
            @CurrentUserId String sellerId,
            @RequestBody @Valid CreateAuctionSessionReq request) {
        // Tạo phiên sau khi request đã validate và người dùng có quyền seller.
        AuctionDetailRes result = auctionService.createAuctionSession(sellerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(result, "Auction session created successfully"));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('CREATE_AUCTION_SESSION')")
    public ResponseEntity<ApiResponse<Void>> cancelAuctionSession(
            @CurrentUserId String sellerId,
            @PathVariable Long id) {
        // Service sẽ kiểm tra quyền sở hữu và trạng thái trước khi hủy.
        auctionService.cancelAuctionSession(sellerId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Auction session canceled successfully"));
    }

    @PostMapping("/{id}/register")
    @PreAuthorize("hasAuthority('REGISTER_AUCTION')")
    public ResponseEntity<ApiResponse<Void>> registerForAuction(
            @CurrentUserId String userId,
            @PathVariable Long id) {
        // Đăng ký buyer vào phiên trước khi cho phép tham gia đặt giá.
        auctionService.registerForAuction(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Registration successful"));
    }

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasAuthority('REGISTER_AUCTION')")
    public ResponseEntity<ApiResponse<Void>> withdrawFromAuction(
            @CurrentUserId String userId,
            @PathVariable Long id) {
        auctionService.withdrawFromAuction(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Auction participation withdrawn successfully"));
    }
}
