package com.woodcert.auction.feature.finance.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Dev/test wallet top-up request.
 */
public record TopUpWalletReq(
        @NotNull
        @DecimalMin("1.00")
        BigDecimal amount
) {
}
