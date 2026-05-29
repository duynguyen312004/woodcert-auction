package com.woodcert.auction.feature.finance.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateDepositReq(
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "10000", message = "Amount must be at least 10,000 VND")
    BigDecimal amount
) {}
