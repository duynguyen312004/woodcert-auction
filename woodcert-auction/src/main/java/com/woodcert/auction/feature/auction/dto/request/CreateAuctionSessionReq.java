package com.woodcert.auction.feature.auction.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Request DTO for seller-created auction sessions.
 */
public record CreateAuctionSessionReq(
        @NotNull Long productId,
        @NotNull @DecimalMin("0.00") BigDecimal startingPrice,
        @NotNull @DecimalMin("0.00") BigDecimal reservePrice,
        @NotNull @DecimalMin("100000") BigDecimal stepPrice,
        @NotNull @DecimalMin("1000000") BigDecimal depositAmount,
        @NotNull @Future Instant startTime,
        @NotNull @Future Instant endTime
) {
}
