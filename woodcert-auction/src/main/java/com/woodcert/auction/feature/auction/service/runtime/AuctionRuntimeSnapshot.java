package com.woodcert.auction.feature.auction.service.runtime;

import java.math.BigDecimal;
import java.time.Instant;

public record AuctionRuntimeSnapshot(
        BigDecimal currentPrice,
        Instant endTime
) {
    public static AuctionRuntimeSnapshot empty() {
        return new AuctionRuntimeSnapshot(null, null);
    }
}
