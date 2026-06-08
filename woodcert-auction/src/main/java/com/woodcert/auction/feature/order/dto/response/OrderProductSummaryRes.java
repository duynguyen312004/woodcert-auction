package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.order.entity.OrderEntity;

public record OrderProductSummaryRes(
        Long id,
        String title,
        String imageUrl
) {
    public static OrderProductSummaryRes fromEntity(OrderEntity order) {
        return new OrderProductSummaryRes(
                order.getProductId(),
                order.getProductTitle(),
                order.getProductImageUrl()
        );
    }
}
