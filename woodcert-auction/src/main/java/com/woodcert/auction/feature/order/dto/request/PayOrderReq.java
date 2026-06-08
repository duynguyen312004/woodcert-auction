package com.woodcert.auction.feature.order.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PayOrderReq(
        @NotNull(message = "Shipping address is required")
        @Positive(message = "Shipping address is invalid")
        Long addressId
) {
}
