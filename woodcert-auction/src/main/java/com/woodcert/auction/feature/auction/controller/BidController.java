package com.woodcert.auction.feature.auction.controller;

import com.woodcert.auction.core.auth.CurrentUserId;
import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.feature.auction.dto.request.CreateBidReq;
import com.woodcert.auction.feature.auction.dto.response.BidResultRes;
import com.woodcert.auction.feature.auction.service.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Real-time bid entry point.
 * Requires CREATE_BID permission (ROLE_BIDDER).
 * Delegates to Redis Lua for atomic validation.
 */
@RestController
@RequestMapping("/api/v1/bids")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_BID')")
    public ResponseEntity<ApiResponse<BidResultRes>> placeBid(
            @CurrentUserId String bidderId,
            @RequestBody @Valid CreateBidReq request) {
        BidResultRes result = bidService.placeBid(bidderId, request);
        return ResponseEntity.ok(ApiResponse.success(result, "Bid placed successfully"));
    }
}
