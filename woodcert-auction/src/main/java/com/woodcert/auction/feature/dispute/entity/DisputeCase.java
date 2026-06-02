package com.woodcert.auction.feature.dispute.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import com.woodcert.auction.feature.fulfillment.entity.OrderFulfillment;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "dispute_cases", indexes = {
        @Index(name = "idx_dispute_cases_order", columnList = "order_id"),
        @Index(name = "idx_dispute_cases_fulfillment", columnList = "fulfillment_id"),
        @Index(name = "idx_dispute_cases_status", columnList = "status"),
        @Index(name = "idx_dispute_cases_opened_by", columnList = "opened_by_user_id")
})
public class DisputeCase extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "fulfillment_id")
    private Long fulfillmentId;

    @Column(name = "opened_by_user_id", nullable = false, length = 36)
    private String openedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private DisputeStatus status;

    @Column(name = "reason", nullable = false, length = 120)
    private String reason;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private OrderEntity order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fulfillment_id", insertable = false, updatable = false)
    private OrderFulfillment fulfillment;
}
