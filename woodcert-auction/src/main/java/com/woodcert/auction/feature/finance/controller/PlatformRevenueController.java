package com.woodcert.auction.feature.finance.controller;

import com.woodcert.auction.core.dto.ApiResponse;
import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueStatsRes;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueTransactionRes;
import com.woodcert.auction.feature.finance.service.PlatformRevenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/revenue")
@RequiredArgsConstructor
public class PlatformRevenueController {

    private final PlatformRevenueService platformRevenueService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_PLATFORM_REVENUE')")
    public ResponseEntity<ApiResponse<PaginationResponse<PlatformRevenueTransactionRes>>> getTransactions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                platformRevenueService.getTransactions(page, size),
                "Fetch platform revenue transactions successful"));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('VIEW_PLATFORM_REVENUE')")
    public ResponseEntity<ApiResponse<PlatformRevenueStatsRes>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(
                platformRevenueService.getStats(),
                "Fetch platform revenue stats successful"));
    }
}
