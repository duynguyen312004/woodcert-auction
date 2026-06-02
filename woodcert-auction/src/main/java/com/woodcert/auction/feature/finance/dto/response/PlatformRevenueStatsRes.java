package com.woodcert.auction.feature.finance.dto.response;

import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;

import java.math.BigDecimal;
import java.util.Map;

public record PlatformRevenueStatsRes(
        BigDecimal totalAmount,
        Map<PlatformRevenueType, RevenueTypeStats> byType
) {
    public record RevenueTypeStats(
            BigDecimal amount,
            long count
    ) {
    }
}
