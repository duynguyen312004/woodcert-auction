package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderListRes(
        Long id,
        OrderSourceType sourceType,
        Long sourceId,
        Long productId,
        OrderStatus status,
        BigDecimal finalPrice,
        BigDecimal remainingAmount,
        Instant paymentDeadline,
        OrderFulfillmentSummaryRes fulfillment,
        Instant createdAt
) {
    public static OrderListRes fromEntity(OrderEntity order, OrderFulfillmentSnapshot fulfillment) {
        return new OrderListRes(
                order.getId(),
                order.getSourceType(),
                order.getSourceId(),
                order.getProductId(),
                order.getStatus(),
                order.getFinalPrice(),
                order.getRemainingAmount(),
                order.getPaymentDeadline(),
                OrderFulfillmentSummaryRes.fromSnapshot(fulfillment),
                order.getCreatedAt()
        );
    }
}
