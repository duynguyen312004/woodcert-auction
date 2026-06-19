package com.woodcert.auction.feature.fulfillment.entity;

import com.woodcert.auction.core.entity.BaseEntity;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "order_fulfillments", indexes = {
        @Index(name = "uq_order_fulfillments_order", columnList = "order_id", unique = true),
        @Index(name = "idx_order_fulfillments_seller", columnList = "seller_id"),
        @Index(name = "idx_order_fulfillments_buyer", columnList = "buyer_id"),
        @Index(name = "idx_order_fulfillments_status", columnList = "status"),
        @Index(name = "idx_order_fulfillments_shipment_deadline", columnList = "status,shipment_deadline"),
        @Index(name = "idx_order_fulfillments_auto_deadline", columnList = "auto_complete_deadline")
})
public class OrderFulfillment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @Column(name = "buyer_id", nullable = false, length = 36)
    private String buyerId;

    @Column(name = "seller_id", nullable = false, length = 36)
    private String sellerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private FulfillmentStatus status;

    @Column(name = "shipment_deadline")
    private Instant shipmentDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_method", length = 30)
    private DeliveryMethod deliveryMethod;

    @Column(name = "carrier_name", length = 120)
    private String carrierName;

    @Column(name = "tracking_code", length = 120)
    private String trackingCode;

    @Column(name = "shipped_at")
    private Instant shippedAt;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "auto_complete_deadline")
    private Instant autoCompleteDeadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private OrderEntity order;
}
