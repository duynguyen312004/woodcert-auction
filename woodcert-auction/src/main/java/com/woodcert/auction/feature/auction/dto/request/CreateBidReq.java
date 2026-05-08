package com.woodcert.auction.feature.auction.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Request body for placing a bid on an ACTIVE auction session.
 */
public record CreateBidReq(
        @NotNull Long auctionSessionId,
        @NotNull @DecimalMin("0.01") BigDecimal bidAmount
) {
}
