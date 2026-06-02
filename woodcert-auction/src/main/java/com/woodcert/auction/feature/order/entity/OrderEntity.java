package com.woodcert.auction.feature.order.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import com.woodcert.auction.feature.catalog.entity.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "orders", indexes = {
        @Index(name = "uq_orders_source", columnList = "source_type,source_id", unique = true),
        @Index(name = "idx_orders_buyer", columnList = "buyer_id"),
        @Index(name = "idx_orders_seller", columnList = "seller_id"),
        @Index(name = "idx_orders_status", columnList = "status"),
        @Index(name = "idx_orders_payment_deadline", columnList = "payment_deadline")
})
public class OrderEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 30)
    private OrderSourceType sourceType;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(name = "buyer_id", nullable = false, length = 36)
    private String buyerId;

    @Column(name = "seller_id", nullable = false, length = 36)
    private String sellerId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "final_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal finalPrice;

    @Column(name = "deposit_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "remaining_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal remainingAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private OrderStatus status;

    @Column(name = "payment_deadline")
    private Instant paymentDeadline;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "canceled_at")
    private Instant canceledAt;

    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    @Column(name = "platform_commission_rate", precision = 5, scale = 4)
    private BigDecimal platformCommissionRate;

    @Column(name = "platform_commission_amount", precision = 19, scale = 2)
    private BigDecimal platformCommissionAmount;

    @Column(name = "seller_payout_amount", precision = 19, scale = 2)
    private BigDecimal sellerPayoutAmount;

    @Column(name = "forfeited_deposit_platform_fee_amount", precision = 19, scale = 2)
    private BigDecimal forfeitedDepositPlatformFeeAmount;

    @Column(name = "forfeited_deposit_seller_amount", precision = 19, scale = 2)
    private BigDecimal forfeitedDepositSellerAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
}
