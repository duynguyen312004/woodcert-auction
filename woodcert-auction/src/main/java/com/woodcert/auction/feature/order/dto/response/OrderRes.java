package com.woodcert.auction.feature.order.dto.response;

import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.identity.service.BuyerOrderProfileSnapshot;
import com.woodcert.auction.feature.order.service.fulfillment.OrderFulfillmentSnapshot;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderRes(
        Long id,
        OrderSourceType sourceType,
        Long sourceId,
        Long productId,
        String buyerId,
        String sellerId,
        OrderBuyerSummaryRes buyer,
        OrderStatus status,
        BigDecimal finalPrice,
        BigDecimal depositAmount,
        BigDecimal remainingAmount,
        BigDecimal platformCommissionRate,
        BigDecimal platformCommissionAmount,
        BigDecimal sellerPayoutAmount,
        BigDecimal forfeitedDepositPlatformFeeAmount,
        BigDecimal forfeitedDepositSellerAmount,
        BigDecimal buyerRefundAmount,
        Instant paymentDeadline,
        Instant paidAt,
        Instant completedAt,
        Instant canceledAt,
        Instant refundedAt,
        String cancelReason,
        OrderProductSummaryRes product,
        OrderShippingAddressRes shippingAddress,
        OrderFulfillmentSummaryRes fulfillment,
        Instant createdAt,
        Instant updatedAt
) {
    public static OrderRes fromEntity(
            OrderEntity order,
            OrderFulfillmentSnapshot fulfillment,
            BuyerOrderProfileSnapshot buyer) {
        return new OrderRes(
                order.getId(),
                order.getSourceType(),
                order.getSourceId(),
                order.getProductId(),
                order.getBuyerId(),
                order.getSellerId(),
                OrderBuyerSummaryRes.fromSnapshot(buyer),
                order.getStatus(),
                order.getFinalPrice(),
                order.getDepositAmount(),
                order.getRemainingAmount(),
                order.getPlatformCommissionRate(),
                order.getPlatformCommissionAmount(),
                order.getSellerPayoutAmount(),
                order.getForfeitedDepositPlatformFeeAmount(),
                order.getForfeitedDepositSellerAmount(),
                order.getBuyerRefundAmount(),
                order.getPaymentDeadline(),
                order.getPaidAt(),
                order.getCompletedAt(),
                order.getCanceledAt(),
                order.getRefundedAt(),
                order.getCancelReason(),
                OrderProductSummaryRes.fromEntity(order),
                OrderShippingAddressRes.fromEntity(order),
                OrderFulfillmentSummaryRes.fromSnapshot(fulfillment),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
