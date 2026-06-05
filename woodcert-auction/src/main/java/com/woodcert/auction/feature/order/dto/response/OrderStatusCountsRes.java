package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.order.entity.OrderStatus;

import java.util.Map;

public record OrderStatusCountsRes(
        long total,
        Map<OrderStatus, Long> byStatus
) {
}
