package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderSummaryRes(
        Long id,
        OrderSourceType sourceType,
        Long sourceId,
        OrderStatus status,
        BigDecimal finalPrice,
        BigDecimal depositAmount,
        BigDecimal remainingAmount,
        BigDecimal platformCommissionRate,
        BigDecimal platformCommissionAmount,
        BigDecimal sellerPayoutAmount,
        BigDecimal forfeitedDepositPlatformFeeAmount,
        BigDecimal forfeitedDepositSellerAmount,
        Instant paymentDeadline,
        Instant paidAt,
        Instant completedAt,
        Instant canceledAt,
        String cancelReason,
        OrderFulfillmentSummaryRes fulfillment
) {
    public static OrderSummaryRes fromEntity(OrderEntity order, OrderFulfillmentSnapshot fulfillment) {
        if (order == null) {
            return null;
        }
        return new OrderSummaryRes(
                order.getId(),
                order.getSourceType(),
                order.getSourceId(),
                order.getStatus(),
                order.getFinalPrice(),
                order.getDepositAmount(),
                order.getRemainingAmount(),
                order.getPlatformCommissionRate(),
                order.getPlatformCommissionAmount(),
                order.getSellerPayoutAmount(),
                order.getForfeitedDepositPlatformFeeAmount(),
                order.getForfeitedDepositSellerAmount(),
                order.getPaymentDeadline(),
                order.getPaidAt(),
                order.getCompletedAt(),
                order.getCanceledAt(),
                order.getCancelReason(),
                OrderFulfillmentSummaryRes.fromSnapshot(fulfillment)
        );
    }
}
