package com.woodcert.auction.feature.order.service.source;

import com.woodcert.auction.feature.order.entity.OrderSourceType;

import java.math.BigDecimal;

public record OrderSourceSnapshot(
        OrderSourceType sourceType,
        Long sourceId,
        String buyerId,
        String sellerId,
        Long productId,
        BigDecimal finalPrice,
        BigDecimal depositAmount
) {
}
