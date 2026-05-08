package com.woodcert.auction.feature.auction.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.auction.dto.request.CreateAuctionSessionReq;
import com.woodcert.auction.feature.auction.dto.response.AuctionDetailRes;
import com.woodcert.auction.feature.auction.dto.response.AuctionListRes;
import com.woodcert.auction.feature.auction.dto.response.SellerAuctionListRes;
import com.woodcert.auction.feature.auction.service.AuctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Auction foundation endpoints: public browse/detail and seller create/cancel/list.
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
            @RequestParam(required = false) String status) {
        PaginationResponse<AuctionListRes> result = auctionService.getPublicAuctions(page, size, status);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch auctions successful"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('CREATE_AUCTION_SESSION')")
    public ResponseEntity<ApiResponse<PaginationResponse<SellerAuctionListRes>>> getSellerAuctions(
            @CurrentUserId String sellerId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginationResponse<SellerAuctionListRes> result = auctionService.getSellerAuctions(sellerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch seller auctions successful"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuctionDetailRes>> getPublicAuctionDetail(@PathVariable Long id) {
        AuctionDetailRes result = auctionService.getPublicAuctionDetail(id);
        return ResponseEntity.ok(ApiResponse.success(result, "Fetch auction successful"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_AUCTION_SESSION')")
    public ResponseEntity<ApiResponse<AuctionDetailRes>> createAuctionSession(
            @CurrentUserId String sellerId,
            @RequestBody @Valid CreateAuctionSessionReq request) {
        AuctionDetailRes result = auctionService.createAuctionSession(sellerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(result, "Auction session created successfully"));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('CREATE_AUCTION_SESSION')")
    public ResponseEntity<ApiResponse<Void>> cancelAuctionSession(
            @CurrentUserId String sellerId,
            @PathVariable Long id) {
        auctionService.cancelAuctionSession(sellerId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Auction session canceled successfully"));
    }

    @PostMapping("/{id}/register")
    @PreAuthorize("hasAuthority('JOIN_AUCTION')")
    public ResponseEntity<ApiResponse<Void>> registerForAuction(
            @CurrentUserId String userId,
            @PathVariable Long id) {
        auctionService.registerForAuction(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Registration successful"));
    }
}
