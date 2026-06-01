package com.woodcert.auction.feature.auction.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record BidHistoryItemRes(
        String bidTraceId,
        BigDecimal bidAmount,
        String bidderMaskedAlias,
        Instant bidTime,
        boolean mine
) {
}
