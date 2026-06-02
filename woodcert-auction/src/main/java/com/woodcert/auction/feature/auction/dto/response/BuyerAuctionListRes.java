package com.woodcert.auction.feature.auction.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record BuyerAuctionListRes(
        Long auctionId,
        String productTitle,
        String productImageUrl,
        String status,
        BigDecimal currentPrice,
        BigDecimal depositAmount,
        String depositStatus,
        String outcomeCode,
        String orderStatus,
        Instant startTime,
        Instant endTime,
        Instant registeredAt
) {
}
