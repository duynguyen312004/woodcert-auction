package com.woodcert.auction.feature.auction.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Response for a successful bid placement.
 * bidTraceId is used instead of DB bidId because bid persistence is async.
 */
public record BidResultRes(
        String bidTraceId,
        Long auctionSessionId,
        BigDecimal currentPrice,
        Instant endTime
) {
}
